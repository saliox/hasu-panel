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

// ---------- Relance automatique d'un bot tombé ----------
// Le panel CONSTATAIT les pannes sans jamais les réparer. Quand pm2 a épuisé ses propres relances et
// marqué le process 'errored', plus personne ne reprenait le relais : constaté sur cette machine,
// quatre bots morts cinq jours durant, découverts par hasard. On retente donc nous-mêmes.
//
// Espacement CROISSANT et plafond à trois essais : un bot qui refuse de repartir trois fois a un vrai
// problème (dossier déplacé, dépendance manquante, token révoqué). S'acharner ne le réparerait pas et
// noierait l'alerte — qui est justement ce qui doit rester visible dans ce cas.
const AUTO_HEAL_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
const AUTO_HEAL_MAX = AUTO_HEAL_DELAYS_MS.length; // source unique du plafond (main.js le lit aussi)

/**
 * Faut-il tenter une relance maintenant ? PURE : l'appelant a déjà écarté les arrêts volontaires,
 * les bots parqués par le mode jeu et ceux dont l'auto-démarrage est décoché.
 * @param now       horodatage courant
 * @param downSince quand le bot est passé hors ligne (0/absent = inconnu → on ne tente rien)
 * @param tries     relances déjà tentées dans cet épisode
 */
const shouldAutoHeal = (now, downSince, tries, lastTryAt) => {
  const debut = Number(downSince);
  if (!Number.isFinite(debut) || debut <= 0) return false;
  const t = Number(tries) || 0;
  if (t >= AUTO_HEAL_DELAYS_MS.length) return false; // plafond atteint : on laisse l'alerte parler
  // Le délai court depuis le DERNIER essai — depuis la chute seulement pour le premier. Compté
  // depuis la chute, un bot tombé depuis longtemps (panel redémarré et état repris du disque, ou
  // longue coupure) voyait 5, 15 et 60 min déjà tous écoulés : ses trois tentatives partaient en
  // trente secondes, l'espacement croissant ne servait plus à rien et l'abandon tombait aussitôt.
  const depuis = t === 0 ? debut : (Number(lastTryAt) || debut);
  return now - depuis >= AUTO_HEAL_DELAYS_MS[t];
};

// Une relance est-elle DUE pour au moins un bot suivi ? Sert au tick à décider s'il doit lire la
// liste des process (voir needProcScan) : sans ce terme, la relance automatique ne s'exécutait
// jamais quand le panel vit dans la zone de notification — son seul mode d'usage réel.
// On teste « due », pas « présent dans la table » : un bot mort pour de bon y reste indéfiniment,
// et forcer un `tasklist` à chaque tick pour lui réintroduirait le coût qu'on cherche à éviter.
const healPending = (now, entries) => {
  for (const [, v] of (entries || [])) {
    if (v && shouldAutoHeal(now, v.downSince, v.tries, v.lastTryAt)) return true;
  }
  return false;
};

// ---------- Nettoyage de l'historique et de l'état de surveillance ----------
// Extrait de loadCfg (qui approchait 120 lignes) pour être TESTABLE : ces deux structures sont
// indexées par nom de bot et alimentent des relances `pm2 start`. Une clé « __proto__ » ou un
// horodatage corrompu venant d'un fichier édité à la main ne doit jamais atteindre ce code.
// Elles sont RECONSTRUITES depuis un objet vide, jamais recopiées telles quelles.
const { isSafeName: _sain } = require('./validators');

const sanitizeIncidents = (raw, max = 40) =>
  (Array.isArray(raw) ? raw : [])
    .filter((i) => i && _sain(i.name) && Number.isFinite(i.at))
    .map((i) => ({
      at: i.at,
      name: i.name,
      kind: String(i.kind || '').slice(0, 16),
      cause: String(i.cause || '').slice(0, 160),
    }))
    .slice(-max);

const sanitizeRuntime = (raw) => {
  const r = (raw && typeof raw === 'object') ? raw : {};
  const lastAlertAt = {}, heal = {};
  const a = (r.lastAlertAt && typeof r.lastAlertAt === 'object') ? r.lastAlertAt : {};
  for (const k of Object.keys(a)) if (_sain(k) && Number.isFinite(a[k])) lastAlertAt[k] = a[k];
  const h = (r.heal && typeof r.heal === 'object') ? r.heal : {};
  for (const k of Object.keys(h)) {
    const v = h[k];
    if (_sain(k) && v && typeof v === 'object' && Number.isFinite(v.downSince)) {
      heal[k] = {
        downSince: v.downSince,
        tries: clampInt(v.tries, 0, 9, 0),
        lastTryAt: Number.isFinite(v.lastTryAt) ? v.lastTryAt : 0,
      };
    }
  }
  return { lastAlertAt, heal };
};

// ---------- Alertes : arrêt volontaire vs panne ----------
// Un arrêt PROPRE (`pm2 stop`) laisse le statut 'stopped' SANS faire grimper le compteur de
// redémarrages ; un plantage passe par des relances pm2 (compteur +1) ou finit en 'errored'.
// C'est ce qui distingue « l'utilisateur a coupé son bot » (même depuis un terminal) d'une vraie panne.
// Statuts pm2 de PASSAGE : ni « en ligne », ni un verdict. Voir decideAlert.
const TRANSIENT_STATUS = new Set(['stopping', 'launching', 'one-launch-status']);
const TRANSIENT_MAX_TICKS = 3; // au-delà, l'état n'est plus « de passage », il est bloqué → on alerte

// N'exige PAS que le bot ait été « en ligne » avant. Un `pm2 stop` tapé au terminal sur un bot DÉJÀ
// tombé (errored) le fait passer errored → stopped sans transition depuis 'online' : l'arrêt n'était
// donc pas reconnu comme volontaire, et la relance automatique rallumait cinq minutes plus tard un
// bot que l'utilisateur venait délibérément d'éteindre. pm2 ne fait jamais errored → stopped de
// lui-même : cette transition ne peut venir que d'une commande.
const isDeliberateStop = (prev, cur) =>
  !!prev && !!cur && cur.status === 'stopped' && prev.status !== 'stopped'
  && cur.restarts <= prev.restarts;

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
// Numéro d'ordre monotone, écrit DANS le contenu de la config à chaque enregistrement.
//
// POURQUOI PAS LES DATES : trancher « laquelle des deux copies est la plus récente » sur les dates de
// modification, c'est faire confiance à une métadonnée que personne ne contrôle — un outil de
// sauvegarde, un antivirus, une restauration, une copie de dossier, ou simplement un script de
// diagnostic la font mentir. Un compteur voyage AVEC le contenu : il dit exactement ce qu'on veut
// savoir, quel que soit ce que le système de fichiers raconte.
//
// SECOND EFFET, le plus important : le contenu change à CHAQUE enregistrement. La vérification
// d'écriture de `saveCfg` (relire le fichier et comparer) était jusqu'ici vraie par accident dès que
// les réglages n'avaient pas bougé — elle ne pouvait donc pas distinguer « écrit » de « écriture
// perdue, mais l'ancien contenu était déjà identique ». Avec un compteur qui avance, elle détecte
// enfin une écriture réellement perdue. C'est ce trou qui avait laissé la config se figer six
// semaines sans le moindre signe.
const CFG_SEQ = '_seq';
const seqDe = (raw) => {
  const n = Number(raw && raw[CFG_SEQ]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/**
 * Choisit la copie de config qui fait foi, et renvoie le compteur le plus haut vu (`seq`) pour que
 * l'enregistrement suivant reparte AU-DESSUS des deux — y compris après un repli sur la sauvegarde.
 */
const pickCfgSource = (main, bak) => {
  const okM = !!(main && main.ok), okB = !!(bak && bak.ok);
  if (!okM && !okB) return { source: 'defaults', seq: 0 };
  if (!okB) return { source: 'main', raw: main.raw, seq: seqDe(main.raw) };
  if (!okM) return { source: 'bak', raw: bak.raw, seq: seqDe(bak.raw), warn: 'fichier principal illisible' };
  const sM = seqDe(main.raw), sB = seqDe(bak.raw);
  const seq = Math.max(sM, sB);
  // Contenus IDENTIQUES : il n'y a rien à départager, donc rien à signaler. Sans cette sortie, une
  // date qui a bougé toute seule (outil de sauvegarde, antivirus, copie de dossier) déclenchait un
  // avertissement alarmant et un « repli » sur une copie… rigoureusement identique. C'est ce qui
  // s'est produit sur la machine : deux fichiers au même octet près, et un message de panne.
  try {
    if (JSON.stringify(main.raw) === JSON.stringify(bak.raw)) return { source: 'main', raw: main.raw, seq };
  } catch { /* structure exotique : on continue avec les règles ci-dessous */ }
  // Dès qu'UNE des deux copies porte un compteur, il tranche : une copie sans compteur a forcément
  // été écrite par une version antérieure, donc avant.
  if (seq > 0) {
    if (sB > sM) return { source: 'bak', raw: bak.raw, seq, warn: 'sauvegarde plus récente que le fichier principal' };
    // Compteurs égaux : c'est le même enregistrement. Le principal fait foi (il est écrit en dernier).
    return { source: 'main', raw: main.raw, seq };
  }
  // Aucune des deux n'a de compteur : anciennes copies, on retombe sur les dates le temps d'un
  // enregistrement — le prochain posera un compteur dans les deux.
  const tM = Number(main.mtime) || 0, tB = Number(bak.mtime) || 0;
  if (tB > tM) return { source: 'bak', raw: bak.raw, seq: 0, warn: 'fichier principal périmé' };
  return { source: 'main', raw: main.raw, seq: 0 };
};


// ---------- Lancement au démarrage de Windows ----------
// En laissant Electron nommer notre valeur dans la clé Run, ce nom a dérivé : il suit `app.getName()`
// aujourd'hui (`electron.app.HasuPanel`) et suivait l'AppUserModelId dans une version plus ancienne
// (`com.saliox.hasupanel`). Chaque dérive a créé une NOUVELLE valeur sans supprimer l'ancienne.
// Constaté sur cette machine : DEUX entrées lançant le même exécutable, plus une tâche planifiée
// orpheline créée par une version depuis longtemps retirée du code. Conséquence directe :
// l'interrupteur « Lancer au démarrage » n'en pilotait qu'UNE — le désactiver ne désactivait rien.
//
// On ne devine donc plus « laquelle est la nôtre » : on impose un nom constant et on l'écrit nous-mêmes.
// Deviner était d'ailleurs pire que le mal — désigner la vivante comme orpheline l'aurait effacée.
//
// Analyse la sortie de `reg query …\\Run` : « <nom>    REG_SZ    <données> ».
const parseRegQuery = (stdout) => {
  const out = [];
  for (const ligne of String(stdout || '').split('\n')) {
    const m = ligne.match(/^\s{4}(\S.*?)\s{4,}REG_[A-Z_]+\s{4,}(.*?)\s*$/);
    if (m) out.push({ nom: m[1], data: m[2] });
  }
  return out;
};

// Le nom, fixe, de NOTRE valeur : écrit et relu par nous, jamais déduit d'une API dont la convention
// de nommage peut changer d'une version d'Electron à l'autre. C'est ce qui referme la classe de bugs.
const LOGIN_ITEM = 'HasuPanel';

// Les noms que notre valeur Run a portés avant qu'il soit figé. Windows garde un drapeau « désactivé »
// indexé sur le NOM ; quand la valeur disparaît, ce drapeau survit et laisse une ligne fantôme dans
// Gestionnaire des tâches > Démarrage. Liste fermée et explicite : on n'efface QUE ce qui a été à nous.
const NOMS_HERITES = ['electron.app.HasuPanel', 'com.saliox.hasupanel'];

// Windows range les « désactivé » de Gestionnaire des tâches > Démarrage à côté, en binaire, indexés
// sur le NOM de la valeur. Premier octet impair = désactivé (03, 07…), pair = actif (02, 06…).
const parseStartupApproved = (stdout) => {
  const m = new Map();
  for (const v of parseRegQuery(stdout)) {
    const premier = parseInt(String(v.data || '').trim().slice(0, 2), 16);
    m.set(v.nom, Number.isNaN(premier) ? true : (premier & 1) === 0);
  }
  return m;
};

/**
 * Décide, à partir du registre SEUL, ce qu'il faut écrire, ce qu'il faut effacer, et l'état à afficher.
 * PURE : l'appelant fournit les deux sorties de `reg query` et exécute le plan.
 *
 * Nos entrées se reconnaissent au CHEMIN de l'exécutable, pas au nom : c'est le nom qui a dérivé.
 * Quatre règles, dans cet ordre :
 *  1. désactivé à la main dans Gestionnaire des tâches → on ne recrée RIEN, et l'écran le reflète ;
 *  2. notre entrée est là → c'est activé, quoi qu'en dise une config revenue d'une sauvegarde ;
 *  3. que des anciennes → migration : le réglage fait foi, et on écrit AVANT de purger (jamais de trou) ;
 *  4. plus rien alors qu'on en avait posé une → retrait volontaire ailleurs, on le suit.
 */
const planLanceurs = ({ runOut = '', approvedOut = '', exe = '', autoLaunch = true, autoLaunchInit = true } = {}) => {
  const cible = String(exe || '').toLowerCase();
  const notres = cible ? parseRegQuery(runOut).filter((v) => v.data.toLowerCase().includes(cible)) : [];
  const supprimer = notres.filter((v) => v.nom !== LOGIN_ITEM).map((v) => v.nom);
  const present = notres.some((v) => v.nom === LOGIN_ITEM);
  const approuve = parseStartupApproved(approvedOut);
  const desactiveWindows = notres.length > 0 && notres.every((v) => approuve.get(v.nom) === false);

  let etat;
  if (desactiveWindows) etat = false;
  else if (present) etat = true;
  else if (supprimer.length) etat = !!autoLaunch;
  else if (autoLaunchInit) etat = false;
  else etat = !!autoLaunch;

  // Drapeaux à effacer : ceux qui portent un de NOS noms alors que la valeur Run correspondante
  // n'existe plus. Un drapeau sans valeur ne fait rien, mais il reste affiché — et le jour où le nom
  // réapparaîtrait, il naîtrait désactivé. On ne touche à AUCUN nom qui ne soit pas le nôtre.
  const nomsRun = new Set(parseRegQuery(runOut).map((v) => v.nom));
  const drapeauxMorts = [...NOMS_HERITES, LOGIN_ITEM]
    .filter((nom) => approuve.has(nom) && !nomsRun.has(nom) && !supprimer.includes(nom));

  return { ecrire: etat && !present, supprimer, drapeauxMorts, autoLaunch: etat, nom: LOGIN_ITEM };
};

// ---------- Deux installations sur la même machine ----------
// L'installeur met à jour EN PLACE tant que l'identifiant d'application ne change pas. Mais une
// installation laissée par un identifiant différent, ou une copie décompressée à la main, continue
// d'exister : elle se lance au démarrage et se met à jour de son côté, avec sa propre config.
// Renvoie les installations trouvées AUTRES que celle qui tourne (comparaison insensible à la casse
// et au sens des séparateurs, Windows acceptant les deux).
const autresInstallations = (chemins, exeActuel) => {
  const norm = (p) => String(p || '').replace(/\//g, '\\').toLowerCase();
  const moi = norm(exeActuel);
  const vues = new Set();
  const out = [];
  for (const p of (chemins || [])) {
    if (!p) continue;
    const n = norm(p);
    if (n === moi || vues.has(n)) continue;
    vues.add(n);
    out.push(p);
  }
  return out;
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
  computeDefaultBounds, boundsAreVisible, pollDelayFor, pickCfgSource, CFG_SEQ, seqDe,
  TRANSIENT_STATUS, TRANSIENT_MAX_TICKS, redactSensitive, shouldAutoHeal, AUTO_HEAL_DELAYS_MS, AUTO_HEAL_MAX,
  sanitizeIncidents, sanitizeRuntime, healPending,
  parseRegQuery, parseStartupApproved, planLanceurs, LOGIN_ITEM, NOMS_HERITES, autresInstallations,
};
