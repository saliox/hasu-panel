// Logique PURE du panel (aucun Electron, aucun accès disque, aucun process) : extraite de main.js
// pour être testable unitairement (`npm test`). main.js ne garde que les enveloppes d'entrées/sorties.
//
// Règle : rien ici ne doit lire d'état global. Tout entre par les paramètres, tout sort par le retour.

// ---------- Comparaison de versions ----------
// Vrai si a > b (X.Y.Z). Retire un éventuel « v » puis la pré-release/metadata (-rc.1, +build) :
// sinon parseInt("5-rc") vaut 5 et « 1.7.5-rc.1 » passait pour égal à « 1.7.5 ».
const semverGt = (a, b) => {
  const core = (s) => String(s || '').trim().replace(/^v/i, '').split(/[-+]/)[0];
  const pa = core(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = core(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
};

// ---------- Entier borné ----------
// Un scalaire corrompu (config éditée à la main, valeur non numérique) doit retomber sur le défaut :
// un NaN qui atteignait la boucle de sondage la transformait en boucle folle.
const clampInt = (v, lo, hi, def) => {
  // Number(null) / Number('') / Number([]) valent 0 — donc une valeur ABSENTE ou corrompue était
  // « bornée » au minimum au lieu de retomber sur le défaut : un pollSec:null devenait 5 s et doublait
  // silencieusement la cadence de sondage. Seuls un nombre ou une chaîne numérique sont acceptés.
  if (v === null || v === undefined || typeof v === 'boolean' || typeof v === 'object') return def;
  if (typeof v === 'string' && v.trim() === '') return def;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
};

// ---------- Citation d'argument pour le repli cmd.exe ----------
// Node ne cite RIEN sous shell:true. Un chemin finissant par « \ » casserait le parsing de cmd
// (le \" final est lu comme un guillemet échappé) → on ajoute un point : D:\ devient "D:\.".
const quoteForShell = (a) => {
  const s = String(a);
  if (!/[ \t]/.test(s)) return s;
  return `"${s.endsWith('\\') ? s + '.' : s}"`;
};

// ---------- Arbre de process ----------
// Descendants d'un PID dans un arbre déjà capturé. Borné (anti-explosion) et protégé contre les
// cycles que peut créer le recyclage de PID par Windows.
const descendantsOf = (children, rootPid) => {
  const root = Number(rootPid);
  if (!Number.isInteger(root) || root <= 0) return [];
  const MAX = 500;
  const res = [], seen = new Set([root]), stack = [root];
  while (stack.length && res.length < MAX) {
    for (const c of (children.get(stack.pop()) || [])) {
      if (res.length >= MAX) break; // borne vérifiée DANS la boucle : un parent à 900 enfants les
      // ajoutait tous d'un coup (le test en tête de `while` arrivait trop tard) — et `killPids`
      // aurait alors envoyé un taskkill sur 900 PID.
      if (seen.has(c) || c <= 0) continue;
      seen.add(c); res.push(c); stack.push(c);
    }
  }
  return res;
};

// Parse la sortie « pid:ppid:ticks » d'un Get-CimInstance Win32_Process.
const parseProcessTree = (stdout) => {
  const children = new Map(); // ppid -> [pid, …]
  const born = new Map();     // pid -> date de création (signature anti-recyclage de PID)
  for (const line of String(stdout || '').split('\n')) {
    const m = line.trim().match(/^(\d+):(\d+):(\d*)$/);
    if (!m) continue;
    const pid = Number(m[1]), ppid = Number(m[2]);
    if (!children.has(ppid)) children.set(ppid, []);
    children.get(ppid).push(pid);
    born.set(pid, m[3]);
  }
  return { children, born };
};

// ---------- Parsing tasklist / netstat ----------
const parseTasklistCsv = (stdout) => {
  const names = new Set(); const pids = new Map();
  for (const line of String(stdout || '').split('\n')) {
    const m = line.match(/^"([^"]+)","(\d+)"/);
    if (!m) continue;
    const n = m[1].toLowerCase();
    names.add(n);
    if (!pids.has(n)) pids.set(n, []);
    pids.get(n).push(Number(m[2]));
  }
  return { names, pids };
};

// Une IP « publique » = ni privée/locale/loopback (IPv4 ET IPv6).
const { isPublicIp } = require('./validators');

// Y a-t-il, parmi nos PID, une connexion TCP établie vers Internet ? (= vraie session multijoueur)
const hasEstablishedPublic = (stdout, pids) => {
  const set = new Set((pids || []).map(String));
  for (const line of String(stdout || '').split('\n')) {
    const t = line.trim().split(/\s+/); // Proto | Local | Distant | État | PID
    if (t.length < 5 || t[0].toUpperCase() !== 'TCP' || t[3].toUpperCase() !== 'ESTABLISHED') continue;
    if (!set.has(t[4])) continue;
    if (isPublicIp(t[2].replace(/:[0-9]+$/, ''))) return true; // retire le :port (IPv4 comme [IPv6])
  }
  return false;
};

// ---------- Diagnostic en français d'un log d'erreurs ----------
// L'ORDRE des règles compte : un log peut contenir plusieurs signatures, la première gagne. On place
// donc les causes les plus spécifiques/actionnables en premier.
const classifyErrorFr = (logText) => {
  if (!logText) return '';
  const last = String(logText).split('\n').filter((l) => l.trim()).slice(-40).join('\n')
    // Neutralise les positions « fichier:ligne:colonne » AVANT toute recherche de code numérique.
    // Sans ça, `\b401\b` matchait le numéro de ligne d'une pile d'appels : une simple SyntaxError à
    // la ligne 401 était diagnostiquée « Token invalide ou intents Discord manquants » dans l'alerte,
    // et la règle passant avant celle de SyntaxError, le vrai motif n'était jamais atteint.
    .replace(/:\d+(?::\d+)?(?=\)|\s|$)/gm, '');
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(last)) return 'Internet/DNS injoignable (discord.com introuvable)';
  if (/TOKEN_INVALID|Unauthorized|\b401\b|Privileged intent/i.test(last)) return 'Token invalide ou intents Discord manquants';
  if (/Cannot find module|MODULE_NOT_FOUND/i.test(last)) return 'Module manquant (npm install à refaire)';
  if (/SyntaxError/i.test(last)) return 'Erreur de syntaxe dans le code';
  if (/EADDRINUSE/i.test(last)) return 'Port déjà utilisé';
  if (/heap out of memory|ENOMEM/i.test(last)) return 'Mémoire saturée';
  if (/ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH/i.test(last)) return 'Connexion réseau refusée ou coupée';
  return redactSensitive(last.split('\n').pop() || '').slice(0, 120);
};

// Quand aucune règle ne reconnaît l'erreur, on renvoie la dernière ligne BRUTE du log — et ce texte
// part vers Discord dans l'alerte. Une ligne de pile ou une erreur réseau y met couramment le chemin
// personnel complet (« C:\Users\<prénom>\… ») et parfois une adresse IP. Le panel ne doit JAMAIS
// faire sortir d'IP de la machine ; on garde donc la ligne (c'est le cas où elle sert le plus) mais
// on remplace ces deux motifs.
const redactSensitive = (s) => String(s || '')
  .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
  .replace(/\b(?:[0-9a-f]{0,4}:){3,7}[0-9a-f]{0,4}\b/gi, '[ipv6]')
  .replace(/[A-Za-z]:\\Users\\[^\\/\s"']+/gi, 'C:\\Users\\[…]')
  .replace(/\/(?:home|Users)\/[^/\s"']+/g, '/home/[…]');

// ---------- Alertes : arrêt volontaire vs panne ----------
// Un arrêt PROPRE (`pm2 stop`) laisse le statut 'stopped' SANS faire grimper le compteur de
// redémarrages ; un plantage passe par des relances pm2 (compteur +1) ou finit en 'errored'.
// C'est ce qui distingue « l'utilisateur a coupé son bot » (même depuis un terminal) d'une vraie panne.
// Statuts pm2 de PASSAGE : ni « en ligne », ni un verdict. Voir decideAlert.
const TRANSIENT_STATUS = new Set(['stopping', 'launching', 'one-launch-status']);
const TRANSIENT_MAX_TICKS = 3; // au-delà, l'état n'est plus « de passage », il est bloqué → on alerte

const isDeliberateStop = (prev, cur) =>
  !!prev && !!cur && prev.status === 'online' && cur.status === 'stopped' && cur.restarts <= prev.restarts;

/**
 * Décide quoi faire d'une transition d'état de bot. Fonction PURE : aucune notification, aucune
 * écriture — l'appelant applique le résultat.
 * @param prev  état précédent { status, restarts }
 * @param cur   état courant   { status, restarts }
 * @param ctx   { stoppedByGame[], manualStop, hadAlert, name }
 * @returns { alert: 'down'|'looping'|'recovered'|null, setManualStop, clearManualStop }
 */
const decideAlert = (prev, cur, ctx = {}) => {
  const out = { alert: null, setManualStop: false, clearManualStop: false, hold: false };
  if (!prev || !cur) return out;
  const parked = (ctx.stoppedByGame || []).includes(ctx.name);
  const fell = prev.status === 'online' && cur.status !== 'online';
  const looping = cur.restarts > prev.restarts + 2;

  // pm2 publie aussi des statuts de PASSAGE : 'stopping' pendant kill_timeout (~1,6 s), 'launching'
  // au démarrage. Les compter comme une chute déclenchait « ⚠️ X est tombé » sur un simple
  // `pm2 stop` tapé au terminal environ une fois sur six (le sondage tombe dans la fenêtre) — et
  // pire, au tick suivant prev valait 'stopping' au lieu de 'online', donc l'arrêt volontaire
  // n'était plus reconnu du tout et le bot n'était plus jamais rallumé au démarrage.
  // `hold` demande à l'appelant de NE PAS avancer l'instantané : on attend que l'état se pose.
  if (TRANSIENT_STATUS.has(cur.status) && !looping && (ctx.transientTicks || 0) < TRANSIENT_MAX_TICKS) {
    out.hold = true; // …borné : un bot coincé en 'launching' finit par être signalé comme tombé
    return out;
  }

  // Revenu en ligne : il n'est plus « arrêté volontairement », quel que soit l'endroit d'où on l'a relancé.
  if (prev.status !== 'online' && cur.status === 'online') {
    if (ctx.manualStop) out.clearManualStop = true;
    if (ctx.hadAlert) out.alert = 'recovered'; // on ne « clôt » que si une chute avait été signalée
    return out;
  }
  if (!fell && !looping) return out;
  if (parked || ctx.manualStop) return out;          // coupé par le mode jeu, ou déjà connu comme volontaire
  if (fell && !looping && isDeliberateStop(prev, cur)) { out.setManualStop = true; return out; } // silencieux
  out.alert = looping ? 'looping' : 'down';
  return out;
};

// ---------- Fenêtre ----------
// Taille d'ouverture calculée d'après la zone de travail réelle (barre des tâches exclue).
const computeDefaultBounds = (workArea, min = { w: 1000, h: 680 }) => {
  const wa = workArea || { x: 0, y: 0, width: 1280, height: 860 };
  // Planchers relevés (1100x760 → 1250x820) et parts d'écran augmentées (0,82/0,86 → 0,86/0,90) :
  // sur un 1920 l'ancienne formule donnait 1574x888, encore petit à l'usage. Défaut = GRANDE fenêtre.
  const w = Math.min(Math.max(1250, Math.min(1800, Math.round(wa.width * 0.86))), wa.width);
  const h = Math.min(Math.max(820, Math.min(1150, Math.round(wa.height * 0.90))), wa.height);
  return {
    width: Math.max(w, Math.min(min.w, wa.width)), height: Math.max(h, Math.min(min.h, wa.height)),
    x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2),
  };
};

// Des bornes mémorisées ne sont réutilisables que si la fenêtre reste ATTRAPABLE sur un écran
// actuellement branché (sinon elle s'ouvrirait hors champ après avoir débranché un moniteur).
const boundsAreVisible = (b, displays) => {
  if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return false;
  return (displays || []).some((d) => {
    const a = d.workArea || d;
    return b.x + b.width > a.x + 80 && b.x < a.x + a.width - 80
      && b.y + 40 > a.y && b.y < a.y + a.height - 40;
  });
};

// ---------- Config : laquelle des deux copies charger ? ----------
/**
 * Choisit entre le fichier principal et le .bak. PURE : l'appelant a déjà lu les deux.
 *
 * La règle est « la PLUS RÉCENTE gagne », pas « la principale sauf si elle est illisible ». Constaté en
 * production : panel-config.json est resté figé au 5 juillet pendant six semaines — parfaitement LISIBLE,
 * juste plus écrit — pendant que le .bak suivait. Chaque démarrage rechargeait donc des réglages vieux de
 * six semaines (webhook d'alerte et préférences perdus) sans aucun signe. La lisibilité ne dit rien de
 * la fraîcheur. saveCfg écrit le .bak AVANT le principal, donc à égalité de date le principal gagne.
 *
 * @param main {ok, raw, mtime} — fichier principal
 * @param bak  {ok, raw, mtime} — copie de secours
 * @returns {source:'main'|'bak'|'defaults', raw?, warn?}
 */
const pickCfgSource = (main, bak) => {
  const okM = !!(main && main.ok), okB = !!(bak && bak.ok);
  if (!okM && !okB) return { source: 'defaults' };
  if (!okB) return { source: 'main', raw: main.raw };
  if (!okM) return { source: 'bak', raw: bak.raw, warn: 'fichier principal illisible' };
  const tM = Number(main.mtime) || 0, tB = Number(bak.mtime) || 0;
  if (tB > tM) return { source: 'bak', raw: bak.raw, warn: 'fichier principal périmé' };
  return { source: 'main', raw: main.raw };
};

// ---------- Cadence de sondage ----------
// Fenêtre visible → réactif. Dans la zone de notification → ralenti, SAUF si une bascule automatique
// dépend du sondage (mode jeu / éco réseau), auquel cas on reste à 15 s max.
const pollDelayFor = (visible, cfg) => {
  const pollSec = cfg.pollSec, idlePollSec = cfg.idlePollSec || 30;
  if (visible) return pollSec * 1000;
  const idle = Math.max(pollSec, idlePollSec);
  return ((cfg.gameMode && cfg.gameMode.enabled) || cfg.lowNet ? Math.min(idle, 15) : idle) * 1000;
};

// ---------- Notes de version ----------
// PIÈGE : electron-updater (provider GitHub) renvoie `releaseNotes` en **HTML** (il le lit du flux
// releases.atom, où GitHub a déjà converti le markdown) — et parfois un tableau {version, note}.
// On en fait des lignes de TEXTE : le renderer les insère via textContent, donc aucun HTML ne survit
// (et aucun risque d'injection depuis le contenu d'une release).
const cleanNotes = (raw, maxLines = 8) => {
  if (!raw) return [];
  const html = Array.isArray(raw)
    ? raw.map((n) => (n && n.note) || '').join('\n')
    : String(raw);
  const text = html
    .replace(/<\s*(li)[^>]*>/gi, '\n• ')                      // puces
    .replace(/<\s*\/(p|div|h[1-6]|ul|ol|li|tr)\s*>/gi, '\n')  // fins de bloc
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')                                   // toutes les autres balises
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');                                   // & en DERNIER (sinon double décodage)
  return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, maxLines);
};

// ---------- Petit son de notification (généré, pas de fichier externe) ----------
// On fabrique nous-mêmes un WAV court et DOUX plutôt que d'utiliser un son système : ça garantit
// qu'il existe (aucun fichier à embarquer), et surtout ça nous donne la maîtrise du VOLUME — les sons
// Windows se jouent à fond via SoundPlayer, qui n'a aucun réglage de volume.
// Deux notes brèves qui descendent, avec une enveloppe douce (attaque + décroissance) pour éviter le
// « clic » sec des débuts/fins de signal abrupts.
const makeChimeWav = ({ amplitude = 0.10, sampleRate = 44100, notes = [[880, 0.10], [660, 0.20]] } = {}) => {
  const amp = Math.max(0, Math.min(1, amplitude));
  const samples = [];
  for (const [freq, dur] of notes) {
    const n = Math.round(sampleRate * dur);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const p = i / n;
      // attaque rapide (5 % du temps) puis décroissance exponentielle : rend le son « rond »
      const env = Math.min(1, p / 0.05) * Math.exp(-4 * p);
      samples.push(Math.sin(2 * Math.PI * freq * t) * env * amp);
    }
  }
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVE', 8);
  head.write('fmt ', 12);
  head.writeUInt32LE(16, 16);          // taille du bloc fmt
  head.writeUInt16LE(1, 20);           // PCM
  head.writeUInt16LE(1, 22);           // mono
  head.writeUInt32LE(sampleRate, 24);
  head.writeUInt32LE(sampleRate * 2, 28); // octets/seconde (mono 16 bits)
  head.writeUInt16LE(2, 32);           // alignement de bloc
  head.writeUInt16LE(16, 34);          // bits par échantillon
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
};

module.exports = {
  makeChimeWav, cleanNotes,
  semverGt, clampInt, quoteForShell,
  descendantsOf, parseProcessTree, parseTasklistCsv, hasEstablishedPublic,
  classifyErrorFr, isDeliberateStop, decideAlert,
  computeDefaultBounds, boundsAreVisible, pollDelayFor, pickCfgSource,
  TRANSIENT_STATUS, TRANSIENT_MAX_TICKS, redactSensitive,
};
