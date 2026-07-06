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
    s.on('error', () => { cleanup(); scheduleReconnect(); });
    s.on('close', () => { cleanup(); scheduleReconnect(); });
    // 1re trame reçue = handshake OK, mais SEULEMENT si c'est bien une trame op=1 (FRAME) — avant,
    // n'importe quel octet reçu (y compris une trame d'erreur de Discord pour un client_id invalide)
    // faisait passer `ready` à true et déclenchait l'envoi de SET_ACTIVITY sur une session non prête.
    s.on('data', (chunk) => {
      if (ready) return;
      if (!Buffer.isBuffer(chunk) || chunk.length < 8) return; // trame incomplète (TCP peut fragmenter) : on attend la suite
      if (chunk.readInt32LE(0) !== 1) return; // pas une trame FRAME (handshake OK) → ignorée
      ready = true;
      if (wanted) push(wanted);
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

module.exports = { start, set, stop };
