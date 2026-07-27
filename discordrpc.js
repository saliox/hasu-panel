// Rich Presence Discord SANS dépendance externe : on parle directement au pipe IPC local de Discord
// (\\?\pipe\discord-ipc-0..9) via le module `net`. Robuste : ne jette JAMAIS, se reconnecte tout seul,
// et ne fait rien si Discord n'est pas lancé ou si aucun App ID valide n'est configuré.
const net = require('net');
const crypto = require('crypto');

let sock = null, ready = false, connecting = false, clientId = null, wanted = null, reconnectT = null;

// Trame IPC Discord : [op: Int32LE][taille: Int32LE][JSON utf8].
const encode = (op, obj) => {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  const head = Buffer.alloc(8);
  head.writeInt32LE(op, 0);
  head.writeInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
};

const cleanup = () => {
  ready = false; connecting = false;
  if (sock) { try { sock.destroy(); } catch {} sock = null; }
};

const scheduleReconnect = () => {
  if (reconnectT || !clientId) return;
  reconnectT = setTimeout(() => { reconnectT = null; connect(0); }, 15000); // Discord peut être fermé → on retente
};

const connect = (i) => {
  if (!clientId || connecting || ready) return;
  if (i > 9) { scheduleReconnect(); return; } // aucun pipe 0..9 → Discord absent, on réessaiera
  connecting = true;
  const s = net.connect(`\\\\?\\pipe\\discord-ipc-${i}`);
  const nextPipe = () => { try { s.destroy(); } catch {} connecting = false; connect(i + 1); };
  s.once('error', nextPipe);
  s.once('connect', () => {
    s.removeListener('error', nextPipe);
    sock = s; connecting = false;
    // Les handlers ne touchent l'état global que si CETTE socket est encore la
    // socket courante : le close tardif d'une socket supplantée détruisait la
    // nouvelle connexion en cours.
    s.on('error', () => { if (sock === s) { cleanup(); scheduleReconnect(); } });
    s.on('close', () => { if (sock === s) { cleanup(); scheduleReconnect(); } });
    // Trames décodées réellement : traiter n'importe quelle donnée comme un
    // handshake réussi faisait boucler à l'infini sur un App ID invalide
    // (Discord répond alors par une trame CLOSE op=2, pas par READY).
    let acc = Buffer.alloc(0);
    s.on('data', (d) => {
      if (sock !== s) return;
      acc = Buffer.concat([acc, d]);
      while (acc.length >= 8) {
        const op = acc.readInt32LE(0), len = acc.readInt32LE(4);
        if (len < 0 || len > 1_000_000) { try { s.destroy(); } catch {} return; } // trame corrompue
        if (acc.length < 8 + len) break;
        const body = acc.subarray(8, 8 + len).toString('utf8');
        acc = acc.subarray(8 + len);
        if (op === 1 && !ready) { // FRAME : handshake accepté seulement sur DISPATCH READY
          try {
            const j = JSON.parse(body);
            if (j.cmd === 'DISPATCH' && j.evt === 'READY') { ready = true; if (wanted) push(wanted); }
          } catch {}
        } else if (op === 2) { // CLOSE (ex. « Invalid Client ID ») → couper ; la reconnexion 15 s réessaiera
          try { s.destroy(); } catch {}
          return;
        }
      }
    });
    try { s.write(encode(0, { v: 1, client_id: clientId })); } catch { nextPipe(); }
  });
};

const push = (activity) => {
  if (!sock || !ready) return;
  try { sock.write(encode(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity }, nonce: crypto.randomUUID() })); } catch {}
};

// ---- API publique ----
// start(appId) : (re)branche la Rich Presence sur cette Application Discord (client_id snowflake).
const start = (id) => {
  const clean = String(id || '').trim();
  const valid = /^\d{17,20}$/.test(clean) ? clean : null;
  if (valid === clientId && (ready || connecting || reconnectT)) return; // déjà branché sur ce même App ID
  cleanup(); if (reconnectT) { clearTimeout(reconnectT); reconnectT = null; }
  clientId = valid;
  if (clientId) connect(0);
};
// set(activity) : met à jour l'activité affichée (envoyée dès que la connexion est prête).
const set = (activity) => { wanted = activity; if (ready) push(activity); };
// stop() : coupe complètement la Rich Presence.
const stop = () => { clientId = null; wanted = null; if (reconnectT) { clearTimeout(reconnectT); reconnectT = null; } cleanup(); };
// status() : état effectif, pour que l'UI affiche la vérité (configuré ≠ connecté).
const status = () => ({ configured: !!clientId, ready });

module.exports = { start, set, stop, status };
