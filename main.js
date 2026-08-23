// Hasu Panel — panel de gestion des bots pm2 : auto-démarrage par bot + « mode jeu »
// (quand un jeu multijoueur est détecté, coupe tous les bots ou ceux cochés, puis les relance).
// Electron, aucune dépendance externe. Sécurité : noms pm2/exe validés par regex (anti-injection),
// contextIsolation activé, aucun contenu distant chargé.
// Imports Electron regroupés ici : `Notification`, `screen` et `powerMonitor` étaient re-`require`és
// en ligne à chaque usage (jusqu'à un require par alerte envoyée) — même module, mais dispersé.
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog, shell, Notification, screen, powerMonitor } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const rpc = require('./discordrpc'); // Rich Presence Discord (IPC natif, sans dépendance)

const IS_STARTUP = process.argv.includes('--startup'); // lancé par l'ouverture de session Windows
// `--updated` = relance APRÈS une mise à jour appliquée toute seule : on repart discrètement dans la
// zone de notification, sinon une fenêtre surgirait sur ton bureau à chaque MAJ (au milieu d'autre chose).
const START_HIDDEN = process.argv.includes('--hidden') || process.argv.includes('--updated');

// L'interface est une simple liste de texte : le process GPU d'Electron (~100 Mo tenus 24h/24) n'apporte
// rien ici et prend de la mémoire pendant tes parties. Rendu logiciel = imperceptible pour ce contenu.
try { app.disableHardwareAcceleration(); } catch {}

// ---------- Auto-update (electron-updater, releases GitHub saliox/hasu-panel) ----------
// Sans écran : télécharge en fond et applique la MAJ au prochain redémarrage du panel (donc au
// prochain démarrage du PC, puisqu'il se lance au logon). Pensé pour « installer chez un ami et
// oublier ». Ne s'active QUE dans la version installée (NSIS) ; ignoré en dev / build « dir ».
let updateReady = false, updaterRef = null, lastUpdateStatus = null;
// Défini par setupAutoUpdate, mais déclaré ICI : panel:applyUpdate en a besoin pour signaler un
// redémarrage raté, et il vit en dehors de cette fonction.
let pushUpd = () => {};
let updateReadyAt = 0, updateReadyVersion = '', updateApplying = false;

// ---------- Application AUTOMATIQUE de la mise à jour (fenêtre sûre) ----------
// PROBLÈME RÉEL : le panel ne se ferme jamais (il vit dans la zone de notification 24h/24), donc
// `autoInstallOnAppQuit` ne se déclenchait jamais — constaté : un panel resté en v1.6.1 pendant un mois
// alors que les MAJ étaient bien téléchargées. On applique donc nous-mêmes, mais SEULEMENT quand ça ne
// dérange rien : pas en pleine partie, pas pendant une manip sur les bots, pas quand tu regardes l'écran.
const UPDATE_GRACE_MS = 5 * 60 * 1000; // laisse passer 5 min après le téléchargement (anti-boucle)
const updateBlockers = () => {
  const b = [];
  if (statusCache.game) b.push('blk.game');                       // ne jamais couper pendant une partie
  if (gameUnknown && Date.now() - gameUnknownSince < GAME_UNKNOWN_MAX_MS) b.push('blk.unknown'); // dans le doute on ne redémarre pas sous le nez du joueur — mais pas indéfiniment
  if (busy) b.push('blk.busy');                            // une bascule de bots est en cours
  if (actionsInFlight.size) b.push('blk.action');
  if (stopAllInFlight) b.push('blk.stopAll');
  if (cfg.stoppedByGame.some((n) => n !== '-')) b.push('blk.parked'); // '-' = aucune cible // on ne redémarre pas là-dessus
  if (cfg.lowNetApplied) b.push('blk.lownet');
  if (isWindowVisible()) b.push('blk.window'); // tu es en train de t'en servir
  if (Date.now() - updateReadyAt < UPDATE_GRACE_MS) b.push('blk.grace');
  return b;
};
const maybeAutoApplyUpdate = () => {
  if (!updateReady || updateApplying || !updaterRef || !app.isPackaged) return;
  if (cfg.autoApplyUpdates === false) return;
  const blockers = updateBlockers();
  if (blockers.length) { if (Date.now() % 600000 < 20000) log('MAJ en attente —', blockers.map((k) => t(k)).join(', ')); return; }
  updateApplying = true;
  cfg.updatedFrom = app.getVersion(); saveCfg();       // pour annoncer « mis à jour vers X » au retour
  log('MAJ appliquée automatiquement :', app.getVersion(), '→', updateReadyVersion, '(redémarrage silencieux)');
  quitting = true;                                      // ne pas repartir dans le tray sur ce quit
  // isSilent=true (installeur oneClick, aucune fenêtre) + isForceRunAfter=true (le panel revient tout seul).
  setTimeout(() => {
    try { updaterRef.quitAndInstall(true, true); } catch (e) { log('quitAndInstall', e.message); updateApplying = false; quitting = false; return; }
    // Chien de garde : `quitAndInstall` ne lève PAS quand l'installation échoue (electron-updater
    // renvoie false et passe par son propre canal d'erreur). Sans ce filet, un échec laissait
    // `updateApplying` et `quitting` collés à true — plus aucune MAJ jusqu'au prochain démarrage, et
    // la fenêtre DÉTRUITE au lieu d'être réduite dans la zone de notification au prochain clic sur ✕.
    // Si l'installation avait réussi, ce minuteur n'existerait plus : le process serait déjà mort.
    setTimeout(() => {
      if (!updateApplying) return;
      updateApplying = false; quitting = false;
      log('MAJ : le redémarrage n\'a pas eu lieu au bout de 20 s → on repasse en fonctionnement normal');
    }, 20000);
  }, 400);
};
// (`semverGt` vit dans logic.js, testé unitairement — pré-release, préfixe « v », champs manquants.)
const setupAutoUpdate = () => {
  if (!app.isPackaged) return;
  try { ({ autoUpdater: updaterRef } = require('electron-updater')); } catch (e) { log('updater indispo', e.message); return; }
  const autoUpdater = updaterRef;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;      // la MAJ s'installe à la fermeture (donc au reboot)
  // Pousse chaque changement d'état MAJ au renderer EN DIRECT (progression du téléchargement
  // sans attendre le prochain sondage) + garde lastUpdateStatus pour le polling/panel:status.
  pushUpd = (s) => { lastUpdateStatus = s; try { if (win && !win.isDestroyed()) win.webContents.send('update-status', s); } catch {} };
  // `emit` est SYNCHRONE : une exception dans un de ces écouteurs remonte dans doCheckForUpdates, qui
  // rejette AVANT la ligne lançant le téléchargement. C'est exactement ce qui a coupé toute la chaîne
  // de mise à jour en 1.10.0 (un identifiant non importé) : le panel ne pouvait plus jamais se
  // corriger lui-même. On isole donc chaque écouteur — mais en JOURNALISANT et en AFFICHANT l'erreur,
  // jamais en l'avalant : un échec muet ici serait le pire des deux mondes.
  const on = (evt, fn) => autoUpdater.on(evt, (...a) => {
    try { fn(...a); }
    catch (e) {
      log('écouteur updater', evt, '—', e.message);
      try { pushUpd({ state: 'error', message: `Erreur interne du panel (${evt}) : ${e.message}` }); } catch {}
    }
  });
  on('update-available', (i) => { pushUpd({ state: 'available', version: i?.version, notes: cleanNotes(i?.releaseNotes) }); log('MAJ disponible :', i?.version); });
  on('update-not-available', () => { pushUpd({ state: 'uptodate' }); });
  on('download-progress', (p) => { pushUpd({ state: 'downloading', percent: Math.round(p?.percent || 0), bps: p?.bytesPerSecond || 0, transferred: p?.transferred || 0, total: p?.total || 0, version: lastUpdateStatus?.version }); });
  on('update-downloaded', (i) => {
    updateReady = true; updateReadyAt = Date.now(); updateReadyVersion = i?.version || '';
    pushUpd({ state: 'downloaded', version: i?.version, notes: cleanNotes(i?.releaseNotes) });
    log('MAJ téléchargée :', i?.version, '→ sera appliquée dès que ce sera sans risque');
    // Prévenir discrètement : jusqu'ici une nouvelle version arrivait en SILENCE (visible seulement
    // en ouvrant les réglages). Une seule notification par version, et jamais pendant une partie.
    notifyUpdateReady(i?.version);
    updateTray();
  });
  on('error', (e) => { pushUpd({ state: 'error', message: e?.message || String(e) }); log('updater erreur :', e?.message || e); });
  const check = () => autoUpdater.checkForUpdates().catch((e) => log('checkForUpdates', e?.message || e));
  setTimeout(check, 12000);                     // 1er contrôle 12 s après le démarrage
  setInterval(check, 6 * 60 * 60 * 1000).unref(); // puis toutes les 6 h (instances qui tournent longtemps)
};

const PM2 = path.join(process.env.APPDATA || '', 'npm', 'pm2.cmd');
// Validateurs de sécurité (anti-injection, anti-pollution de prototype, IP publique) : extraits dans
// un module SANS Electron pour être testables unitairement (`npm test`). Toute modification de ces
// règles doit faire passer test/validators.test.js — elles gardent une frontière de sécurité.
// NAME_RE / RESERVED_NAMES / isPublicIp étaient importés sans jamais servir ici : ils sont utilisés
// À L'INTÉRIEUR de validators.js (par isSafeName) et de logic.js (par hasEstablishedPublic).
const { EXE_RE, isSafeName, isSafeNewName, BAD_SHELL_RE } = require('./validators');
// Traductions PARTAGÉES avec la fenêtre (ui/i18n.js est chargé des deux côtés) : le menu de la zone
// de notification doit parler la même langue que l'écran, sans dupliquer un second dictionnaire.
const { t, setLang, ORDRE: LANGUES } = require('./ui/i18n');
// Logique PURE (décisions, parsing, calculs) : extraite pour la même raison — c'est ce module qui est
// couvert par test/*.test.js, donc c'est bien le code qui tourne en vrai qui est testé.
const {
  semverGt, clampInt, quoteForShell, descendantsOf, parseProcessTree, parseTasklistCsv,
  hasEstablishedPublic, classifyErrorFr, decideAlert,
  computeDefaultBounds, boundsAreVisible, pollDelayFor, makeChimeWav, pickCfgSource, CFG_SEQ, cleanNotes,
  shouldAutoHeal, AUTO_HEAL_MAX, sanitizeIncidents, sanitizeRuntime, healPending,
  planLanceurs, LOGIN_ITEM, autresInstallations, redactSensitive, parseRegQuery, verdictEcriture,
} = require('./logic');

// Chemin ABSOLU d'un exécutable système (System32). execFile sans shell résout aussi le répertoire courant
// avant le PATH → un binaire planté (powershell.exe/taskkill.exe…) dans le CWD pourrait être exécuté.
// On qualifie donc explicitement les outils système. SystemRoot est fixé par Windows (non modifiable par un user standard).
const SYS = (e) => path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', e);
// ⚠️ powershell.exe n'est PAS dans System32 mais dans System32\WindowsPowerShell\v1.0\ — le résoudre
// comme les autres donnait un ENOENT SILENCIEUX (les appels échouaient dans des try/catch : tree-kill des
// orphelins, priorités éco réseau, débit par bot, liste des programmes ouverts… tous morts sans un bruit).
// On vérifie l'existence, avec repli sur le nom simple (résolution par le PATH) si l'emplacement change.
const PS_EXE = (() => {
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  try { if (fs.existsSync(p)) return p; } catch {}
  return 'powershell.exe';
})();

// Dossier « data » du bot saliox (drapeaux de coordination panel ↔ bot). Par défaut : <profil>\Desktop\saliox bot\data
// (résolu via os.homedir → aucun nom d'utilisateur codé en dur). Personnalisable via la variable d'env HASU_SALIOX_DATA.
const SALIOX_DATA = process.env.HASU_SALIOX_DATA || path.join(require('os').homedir(), 'Desktop', 'saliox bot', 'data');
// (L'ancien drapeau `panel_maintenance.json` a été SUPPRIMÉ : le watchdog de saliox qui le lisait est
// devenu un no-op lors de sa refonte — vérifié, plus aucun consommateur — donc on écrivait un fichier
// que personne ne lisait, à chaque entrée/sortie de mode jeu.)
// Drapeau « faible usage internet » lu par saliox (systems/lownet.js) : gros transferts différés pendant le jeu.
const LOWNET_FLAG = path.join(SALIOX_DATA, 'lownet.json');
// Crée data\ s'il manque, SINON les écritures de drapeaux ENOENT en silence (mode jeu / faible usage internet
// deviennent des no-op alors que l'UI les montre actifs). On ne crée QUE si le dossier « saliox bot » parent
// existe → on évite de fabriquer un dossier fantôme au mauvais endroit (Desktop redirigé OneDrive).
try { if (fs.existsSync(path.dirname(SALIOX_DATA))) fs.mkdirSync(SALIOX_DATA, { recursive: true }); } catch {}

const DEFAULT_GAMES = [
  'FortniteClient-Win64-Shipping.exe',
  'VALORANT-Win64-Shipping.exe',
  'cs2.exe',
  'RocketLeague.exe',
  'r5apex.exe',
  'r5apex_dx12.exe',
  'League of Legends.exe',
  'Overwatch.exe',
  'ModernWarfare.exe',
  'cod.exe',
  'GTA5.exe',
  'GTA5_Enhanced.exe',
  'RustClient.exe',
  'Marvel-Win64-Shipping.exe',
  'DeadByDaylight-Win64-Shipping.exe',
  'TslGame.exe'
];

const DEFAULTS = {
  bots: {},                 // { name: { auto: true, gameStop: false } }
  gameMode: { enabled: false, stopAll: false, graceSec: 60, soloSkip: true }, // soloSkip : ne rien couper si le jeu n'est pas EN LIGNE
  games: DEFAULT_GAMES,
  pollSec: 10,              // cadence de sondage quand la fenêtre est au 1er plan (réactif)
  idlePollSec: 30,          // cadence ralentie quand le panel est dans le tray (personne ne regarde → moins de CPU/batterie)
  autoLaunch: true,
  lowNet: false,            // mode « faible usage internet » : priorité réseau au jeu en ligne
  lowNetApplied: false,     // persisté → on sait restaurer les priorités après un crash du panel
  stoppedByGame: [],        // persisté → si le panel redémarre pendant une partie, on sait quoi relancer
  imported: [],             // bots importés par l'utilisateur (catégorie à part, retirables du panel)
  scanAuto: true,           // découverte de nouveaux jeux installés : 1×/JOUR max (jamais en continu)
  lastScanAt: 0,
  ignoredExes: [],          // suggestions écartées par l'utilisateur (ne plus proposer)
  discovered: [],           // suggestions du dernier scan, persistées
  discordRpc: true,         // Rich Presence Discord (affiche « gère X bots en ligne » sur ton profil)
  discordAppId: '',         // Application ID Discord (Rich Presence) — à coller dans les réglages, ou via l'env HASU_DISCORD_APP_ID
  alerts: true,             // prévenir quand un bot tombe / redémarre en boucle
  alertToast: true,         // notification Windows (utile seulement si tu es devant le PC)
  alertSound: true,         // petit son doux avec la notification (généré, volume maîtrisé)
  alertVolume: 10,          // volume du son en % (1-100). 10 % = discret, volontairement bas par défaut
  alertVolumeAt: 0,         // volume du WAV déjà généré → sert à le régénérer quand tu changes le volume
  alertWebhook: '',         // URL de webhook Discord (te touche même en jeu ou absent) — https://discord.com/api/webhooks/…
  lastSaveAt: 0,            // dernier « pm2 save » réussi (ce qui reviendra au prochain démarrage)
  autoApplyUpdates: true,   // installer la MAJ tout seul dès que c'est sans risque (jamais en pleine partie)
  autoHeal: true,           // retenter de relancer un bot tombé (5 min, 15 min, 1 h, puis on laisse l'alerte parler)
  lang: 'fr',               // langue de l'interface ('fr' | 'en') — bouton dans l'en-tête de la fenêtre
  incidents: [],            // 40 derniers événements {at, name, kind, cause} → onglet « incidents »
  // État de surveillance PERSISTÉ : il ne vivait qu'en mémoire, donc un redémarrage du panel — que la
  // mise à jour automatique provoque elle-même — perdait les alertes en attente de réessai et les
  // compteurs de relance. Une panne pouvait ainsi repartir de zéro à chaque MAJ.
  runtime: { lastAlertAt: {}, heal: {} },
  updatedFrom: '',          // version quittée lors d'une MAJ auto → sert à annoncer « mis à jour » au retour
  winBounds: null,          // taille/position mémorisées de la fenêtre (null = calculées d'après l'écran)
  winMaximized: false       // la fenêtre était-elle en plein écran à la dernière fermeture ?
};

let win = null, tray = null, quitting = false;
// La fenêtre est-elle réellement affichée ? (test répété à l'identique à 4 endroits auparavant)
const isWindowVisible = () => !!(win && !win.isDestroyed() && win.isVisible());
let cfg = null;
let lastGameSeen = null, lastGameAt = 0;
let sessionOnline = false; // le jeu détecté a une vraie connexion Internet (session multijoueur)
// Vrai quand on n'a PAS pu savoir si un jeu tourne (scan sauté, ou tasklist en échec). À distinguer
// de « aucun jeu » : les décisions coûteuses ou dérangeantes (scan disque, application d'une MAJ)
// ne doivent pas se déclencher sur une ignorance prise pour une absence.
let gameUnknown = true, gameUnknownSince = Date.now();
// Faux tant que le premier tick n'a pas rendu son verdict : l'écran doit dire « recherche en cours »
// et non « aucun bot géré », qui est un mensonge inquiétant quand les bots tournent très bien.
let firstTickDone = false;
let netTick = 0; // le relevé de débit ne se fait qu'un tick sur trois (247 ms de PowerShell pour de l'affichage)
let lowNetFlagOk = true; // le drapeau lu par les bots a-t-il pu être écrit ? (sinon l'écran mentirait)
// …mais BORNÉ. Si tasklist échoue durablement, bloquer les mises à jour pour toujours serait pire que
// le mal qu'on évite (c'est exactement le mode de panne « panel figé sur une vieille version »).
// Au-delà de ce délai, on cesse de s'en servir comme motif de blocage.
const GAME_UNKNOWN_MAX_MS = 30 * 60 * 1000;
let statusCache = { bots: [], game: null, online: false, updatedAt: 0 };
let busy = false; // évite deux bascules mode jeu simultanées
// Verrou partagé par TOUS les appelants de enterGameMode/exitGameMode (tick, bascule manuelle
// dans le tray, IPC panel:setGameMode) — avant, seul tick() posait `busy`, donc un clic manuel
// pendant un tick en cours pouvait s'entrelacer avec lui (état pm2 final incohérent avec le
// choix réel de l'utilisateur). `fn` est sauté silencieusement si une transition est déjà en cours.
let pendingGameFn = null;
const withGameLock = async (fn) => {
  // Coalesce : si une transition est déjà en cours, on MÉMORISE la dernière demande au lieu de la jeter.
  // Sinon « désactiver le mode jeu » cliqué pendant un enterGameMode en cours était perdu → bots coupés
  // jusqu'à la fermeture du jeu. La demande en attente est rejouée dès que le verrou se libère.
  if (busy) { pendingGameFn = fn; return undefined; } // undefined = mise en attente, PAS un succès
  busy = true;
  // On RENVOIE ce que fn a renvoyé : à la fermeture, l'appelant doit savoir si les bots sont bien
  // repartis avant d'autoriser un `pm2 save` (un dump pris trop tôt grave leur extinction).
  try { return await fn(); } finally {
    busy = false;
    const next = pendingGameFn; pendingGameFn = null;
    if (next) withGameLock(next);
  }
};
let prevIo = new Map(); // pid -> { read, write, at } : relevé E/S précédent, pour calculer les DÉBITS (octets/s) par delta

// Dernières lignes gardées EN MÉMOIRE, quoi qu'il arrive au fichier. Le journal est le seul témoin de
// presque toutes les pannes de ce panel ; s'il cesse de s'écrire, on perd jusqu'à la trace de ça.
const logEnAttente = [];        // lignes qu'on n'a pas pu écrire : réémises dès que le fichier revient
const LOG_ATTENTE_MAX = 300;
let logWriteFailed = false;

const log = (...a) => {
  const ligne = `${new Date().toISOString()} ${a.join(' ')}`;
  try {
    const f = path.join(app.getPath('userData'), 'panel.log');
    // Rotation : au-delà de ~2 Mo on repart d'un fichier neuf (garde panel.log.1) — sinon une erreur
    // récurrente (pm2 cassé, updater en échec toutes les 6 h) ferait grossir le log sans fin.
    try { if (fs.statSync(f).size > 2 * 1024 * 1024) fs.renameSync(f, f + '.1'); } catch {}
    // Un verrou passager (antivirus, synchronisation) ne doit pas TROUER le journal : ce qui n'a pas pu
    // s'écrire part avec la première ligne qui repasse. Sans ça, les minutes les plus intéressantes —
    // celles d'une panne en cours — étaient précisément celles qui disparaissaient.
    const rattrapage = logEnAttente.length ? logEnAttente.join('\n') + '\n' : '';
    fs.appendFileSync(f, rattrapage + ligne + '\n');
    logEnAttente.length = 0; // APRÈS le succès seulement : vider avant, c'était perdre la file entière
    // à la première écriture qui échoue — mon premier jet en perdait plus qu'il n'en sauvait.
    if (logWriteFailed) { logWriteFailed = false; try { fs.appendFileSync(f, `${new Date().toISOString()} journal de nouveau accessible\n`); } catch {} }
  } catch (e) {
    logEnAttente.push(ligne);
    if (logEnAttente.length > LOG_ATTENTE_MAX) logEnAttente.shift();
    // Le journal qui meurt en silence, c'est l'angle mort ultime : plus aucune panne n'est traçable — et
    // rien ne le signale, puisque le moyen de signaler est justement ce qui est cassé. On le dit UNE
    // fois par l'autre canal (webhook + toast), qui ne dépend pas du disque.
    if (logWriteFailed) return;
    logWriteFailed = true;
    const raison = e && e.message ? e.message : 'raison inconnue';
    setTimeout(() => {
      try {
        queueAlert('⚠️ Journal du panel bloqué',
          `Le panel n'arrive plus à écrire son journal (\`${masquer(raison)}\`). Il continue de fonctionner normalement, et les lignes manquées seront réécrites dès que le fichier redeviendra accessible — mais si ça dure, plus aucune panne ne laissera de trace. Regarde ce dossier (antivirus, synchronisation, disque plein).`,
          0xFAA61A);
      } catch { /* même le canal d'alerte est indisponible : il ne reste que la file en mémoire */ }
    }, 0);
  }
};

// ---------- Config ----------
const cfgPath = () => path.join(app.getPath('userData'), 'panel-config.json');
// Pause SYNCHRONE : on est sur le chemin de démarrage, avant que quoi que ce soit tourne, et il faut
// que la config soit lue avant de continuer. Quelques dizaines de millisecondes le temps qu'un verrou
// passager (antivirus, synchronisation) se relâche.
const dodo = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
// Erreurs qui peuvent DISPARAÎTRE toutes seules : elles seules méritent qu'on réessaie. Un JSON
// invalide, lui, le restera — et il n'a même pas de `.code`, donc l'ancienne garde (`=== 'ENOENT'`)
// ne l'attrapait pas : on gelait le thread principal 2 × 150 ms pour rien à chaque démarrage sur une
// config abîmée. Mesuré : 316 ms de gel pour un fichier tronqué.
const ERREURS_PASSAGERES = new Set(['EBUSY', 'EPERM', 'EACCES', 'EMFILE', 'ENFILE', 'EAGAIN', 'UNKNOWN']);
// Entier borné : un scalaire corrompu/édité à la main (ex. pollSec="10x" → NaN) transformerait la
// boucle de sondage en boucle folle (spawn continu de tasklist/pm2). On coerce + clamp comme les setters.
const loadCfg = () => {
  // Lit les DEUX copies (principale + .bak) avec leur date, puis laisse pickCfgSource trancher.
  // Avant : « la principale, sauf si elle est illisible » — or elle peut être parfaitement lisible et
  // PÉRIMÉE. Constaté en production : panel-config.json figé au 5 juillet pendant six semaines pendant
  // que le .bak suivait, donc chaque démarrage rechargeait de vieux réglages (webhook et alertes perdus)
  // sans le moindre signe. Voir la vérification d'écriture dans saveCfg.
  // Trois essais : au démarrage de session, Defender et les outils de synchronisation verrouillent
  // %APPDATA% pendant quelques dizaines de millisecondes. Un `catch {}` muet transformait ce verrou
  // passager en « fichier illisible » → valeurs d'usine.
  const probe = (file) => {
    for (let i = 0; i < 3; i++) {
      try { return { ok: true, raw: JSON.parse(fs.readFileSync(file, 'utf8')), mtime: fs.statSync(file).mtimeMs }; }
      catch (e) {
        // Premier lancement (ENOENT) ou contenu invalide : réessayer ne changera rien.
        if (!ERREURS_PASSAGERES.has(e.code)) {
          if (e.code !== 'ENOENT') log('config: contenu illisible', file, e.code || e.message, '(inutile de réessayer)');
          return { ok: false };
        }
        log('config: lecture impossible', file, e.code || e.message, `(essai ${i + 1}/3)`);
        if (i < 2) dodo(150);
      }
    }
    return { ok: false };
  };
  const pick = pickCfgSource(probe(cfgPath()), probe(cfgPath() + '.bak'));
  // On repart TOUJOURS au-dessus du plus haut compteur vu, y compris celui de la copie qu'on n'a pas
  // retenue : sinon deux enregistrements pourraient porter le même numéro et le choix suivant serait
  // arbitraire.
  cfgSeq = Math.max(cfgSeq, pick.seq || 0);
  if (pick.warn) log('config:', pick.warn, '→ repli sur .bak');
  // Repli utilisé = les deux copies ont divergé (typiquement une fermeture brutale entre l'écriture
  // de la sauvegarde et celle du fichier principal — mise à jour, arrêt forcé, coupure). On les
  // remet d'accord tout de suite, sinon l'avertissement revient à CHAQUE démarrage jusqu'au prochain
  // enregistrement, et le fichier principal reste périmé sur le disque.
  cfgRepairNeeded = pick.source === 'bak';
  if (pick.source === 'defaults') {
    // Repartir des valeurs d'usine est normal au tout premier lancement. Mais si des fichiers
    // EXISTENT et sont illisibles, le premier saveCfg venu écraserait les DEUX copies (le .bak est
    // écrit en premier) : réglages perdus pour de bon, en silence. On les met de côté avant, et on
    // le fait savoir.
    const presents = [cfgPath(), cfgPath() + '.bak'].filter((f) => { try { return fs.existsSync(f); } catch { return false; } });
    if (presents.length) {
      // COPYFILE_EXCL : au DEUXIÈME incident, cette copie écrasait la mise de côté du premier — donc
      // la seule archive des vrais réglages, remplacée par les valeurs d'usine gravées entre-temps.
      // On garde la plus ancienne, c'est elle qui contient encore quelque chose.
      for (const f of presents) {
        try { fs.copyFileSync(f, f + '.corrompu', fs.constants.COPYFILE_EXCL); }
        catch (e) { log(e.code === 'EEXIST' ? `config: ${f}.corrompu existe déjà (mise de côté du premier incident) → conservée`
                                            : `config: copie de secours impossible ${f} ${e.message}`); }
      }
      log('config: ILLISIBLE alors que les fichiers existent → copie dans *.corrompu, démarrage sur les valeurs d\'usine :', presents.join(', '));
      setTimeout(() => queueAlert('⚠️ Configuration illisible',
        'Le panel n\'a pas pu relire ses réglages et repart des valeurs d\'usine. Les anciens fichiers sont conservés à côté, suffixés `.corrompu`.', 0xED4245), 0);
    }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  const raw = pick.raw;
  try {
    // bots : RECONSTRUIT depuis {} — on ne garde que les clés sûres avec une valeur-objet (anti type-confusion :
    // un tableau ou une chaîne passait le typeof==='object' d'avant et corrompait les lookups par bot).
    const gm = raw.gameMode && typeof raw.gameMode === 'object' ? raw.gameMode : {};
    const bots = {};
    if (raw.bots && typeof raw.bots === 'object' && !Array.isArray(raw.bots)) {
      for (const k of Object.keys(raw.bots)) {
        const v = raw.bots[k];
        if (isSafeName(k) && v && typeof v === 'object' && !Array.isArray(v)) bots[k] = { auto: v.auto !== false, gameStop: !!v.gameStop, manualStop: v.manualStop === true };
      }
    }
    return {
      ...DEFAULTS, ...raw,
      bots,
      gameMode: {
        enabled: gm.enabled === true, stopAll: gm.stopAll === true, soloSkip: gm.soloSkip !== false,
        graceSec: clampInt(gm.graceSec, 10, 3600, DEFAULTS.gameMode.graceSec),
      },
      // Scalaires bornés (mêmes bornes que setSetting/setGameMode) — un NaN ne peut plus casser la boucle.
      pollSec: clampInt(raw.pollSec, 5, 120, DEFAULTS.pollSec),
      idlePollSec: clampInt(raw.idlePollSec, 15, 300, DEFAULTS.idlePollSec),
      lastScanAt: clampInt(raw.lastScanAt, 0, Number.MAX_SAFE_INTEGER, 0),
      autoLaunch: raw.autoLaunch !== false, lowNet: raw.lowNet === true, lowNetApplied: raw.lowNetApplied === true,
      scanAuto: raw.scanAuto !== false, discordRpc: raw.discordRpc !== false,
      alerts: raw.alerts !== false, alertToast: raw.alertToast !== false,
      alertSound: raw.alertSound !== false, alertVolume: clampInt(raw.alertVolume, 1, 100, 10),
      autoApplyUpdates: raw.autoApplyUpdates !== false,
      autoHeal: raw.autoHeal !== false,
      lang: LANGUES.includes(raw.lang) ? raw.lang : 'fr', // toute langue inconnue retombe sur le français
      // Historique et état de surveillance : nettoyage dans logic.js, donc TESTÉ (pollution de
      // prototype, horodatages corrompus, structures inattendues). Ces données alimentent des
      // relances `pm2 start` : rien de douteux ne doit franchir cette ligne.
      incidents: sanitizeIncidents(raw.incidents, INCIDENTS_MAX),
      runtime: sanitizeRuntime(raw.runtime),
      // Bornes de fenêtre : uniquement des nombres finis, sinon on repart sur la taille calculée
      // (une valeur corrompue ouvrirait une fenêtre invisible ou de 0 pixel).
      // MIGRATION `winSizeV2` : les versions ≤ 1.9.2 ouvraient une petite fenêtre, et cette taille a été
      // MÉMORISÉE — elle repassait donc devant la nouvelle taille calculée à chaque lancement. On oublie
      // les bornes mémorisées UNE SEULE FOIS ; tout redimensionnement fait ensuite est respecté.
      winSizeV2: true,
      // MIGRATION `winSizeV3` : la fenêtre s'ouvrait déjà « grande » (~1650×930 sur un écran 1080p)
      // mais pas MAXIMISÉE — ce qui se lit encore comme une petite fenêtre posée au milieu de l'écran.
      // On la maximise UNE fois ; si tu la restaures ensuite, rememberBounds enregistre ce choix et il
      // est respecté à tous les lancements suivants. Les bornes mémorisées, elles, sont conservées :
      // ce sont celles qui reviennent quand tu quittes le plein écran.
      winSizeV3: true,
      winBounds: (raw.winSizeV2 === true && raw.winBounds && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(raw.winBounds[k])))
        ? { x: raw.winBounds.x, y: raw.winBounds.y, width: raw.winBounds.width, height: raw.winBounds.height } : null,
      winMaximized: raw.winSizeV3 === true ? raw.winMaximized === true : true,
      updatedFrom: typeof raw.updatedFrom === 'string' ? raw.updatedFrom.slice(0, 20) : '',
      // Chemin de la 2e installation déjà signalée : évite de réalerter à chaque démarrage.
      dualWarnedFor: typeof raw.dualWarnedFor === 'string' ? raw.dualWarnedFor.slice(0, 500) : '',
      alertWebhook: typeof raw.alertWebhook === 'string' ? raw.alertWebhook.trim().slice(0, 300) : '',
      lastSaveAt: clampInt(raw.lastSaveAt, 0, Number.MAX_SAFE_INTEGER, 0),
      // Numéro d'ordre : borné comme tout le reste — édité à la main en « abc », il casserait la
      // comparaison des deux copies au lieu de la départager.
      [CFG_SEQ]: clampInt(raw[CFG_SEQ], 0, Number.MAX_SAFE_INTEGER, 0),
      games: Array.isArray(raw.games) ? raw.games.filter((g) => EXE_RE.test(g)) : [...DEFAULT_GAMES], // copie : sinon addGame muterait la constante
      stoppedByGame: Array.isArray(raw.stoppedByGame) ? raw.stoppedByGame.filter((n) => isSafeName(n)) : [],
      imported: Array.isArray(raw.imported) ? raw.imported.filter((n) => isSafeName(n)) : [],
      ignoredExes: Array.isArray(raw.ignoredExes) ? raw.ignoredExes.filter((g) => EXE_RE.test(g)) : [],
      discovered: Array.isArray(raw.discovered) ? raw.discovered.filter((g) => g && EXE_RE.test(g.exe || '')) : [],
      discordAppId: (typeof raw.discordAppId === 'string' && raw.discordAppId.trim()) ? raw.discordAppId.trim().slice(0, 40) : DEFAULTS.discordAppId
    };
  } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
};
// Écriture ATOMIQUE : temp + rename (jamais de fichier tronqué si crash/coupure en plein write), + un .bak
// restauré par loadCfg si le principal devient illisible. Sinon un write interrompu réinitialisait TOUT aux DEFAULTS.
//
// ET SURTOUT : on RELIT ce qu'on vient d'écrire. Sans cette vérification, une écriture qui n'atterrit pas
// passe totalement inaperçue — c'est arrivé six semaines durant (panel-config.json figé au 5 juillet alors
// que le fichier était parfaitement accessible en écriture). Un `catch` vide ne suffit pas : ici, l'appel
// ne levait AUCUNE erreur. Le .bak est écrit AVANT le fichier principal pour que, si le rename échoue, la
// copie saine soit la plus récente des deux — c'est ce qui permet à loadCfg de retomber dessus.
//
// La vérification ne valait toutefois QUE si le contenu changeait : relire et comparer était vrai
// par accident dès que les réglages n'avaient pas bougé. D'où le compteur `_seq`, incrémenté ici à
// chaque enregistrement — il rend la comparaison réellement discriminante, et il sert aussi à
// départager les deux copies au chargement sans dépendre des dates de fichier.
// Tout ce qui SORT de la machine (webhook, toast) passe par ici. redactSensitive couvre les formes
// habituelles de chemin ; le nom de session litteral couvre le reste — un chemin UNC, un profil
// place ailleurs que sous Users, ou un nom qui apparait seul dans un message.
const NOM_SESSION = String(process.env.USERNAME || '').trim();
// Sous 3 caracteres, masquer partout hacherait le texte (un nom « ab » se retrouve dans mille mots).
const RE_SESSION = NOM_SESSION.length >= 3
  ? new RegExp(NOM_SESSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;
const masquer = (texte) => { const s = redactSensitive(texte); return RE_SESSION ? s.replace(RE_SESSION, '[…]') : s; };

let cfgWriteFailed = false; // remonté dans panel:status → bandeau dans l'interface (échec bruyant)
let cfgBakFailed = false;   // la COPIE DE SECOURS ne s'écrit plus : le filet est mort, il faut le dire
let cfgSeq = 0;             // dernier numéro d'ordre écrit ; repart au-dessus de ce qu'on a lu au démarrage
let cfgRepairNeeded = false; // le chargement a dû se rabattre sur la sauvegarde → remettre les deux d'accord
// Écrit UNE copie et dit ce qui s'est réellement passé :
//   'ok'        → écrite et relue conforme
//   'perdu'     → écrite sans erreur, mais le disque ne contient pas ça (le mode de panne de juillet)
//   'illisible' → écrite, impossible de vérifier (verrou passager) — on ne crie pas au loup
//   'echec'     → l'écriture elle-même a échoué
//
// Les DEUX copies passent par temp + rename. Le .bak était écrit EN PLACE (troncature puis
// remplissage) : une coupure au mauvais moment fabriquait exactement le fichier tronqué contre lequel
// il existe — la seule des deux copies à ne pas survivre à l'événement qui justifie son existence.
const ecrireCopie = (chemin, data) => {
  const tmp = chemin + '.tmp';
  try {
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, chemin); // atomique sur NTFS
  } catch (e) { log('saveCfg: écriture impossible', path.basename(chemin), e.message); return 'echec'; }
  // Relecture dans SON PROPRE essai : dans le même `try` que l'écriture, un verrou passager de
  // l'antivirus sur la LECTURE faisait conclure « écriture perdue » alors que le rename avait réussi
  // — bandeau rouge et alerte Discord pour une écriture qui avait marché. loadCfg, lui, réessayait
  // déjà trois fois cette même panne ; ici on ne réessayait pas du tout.
  for (let i = 0; i < 3; i++) {
    try { return fs.readFileSync(chemin, 'utf8') === data ? 'ok' : 'perdu'; }
    catch { if (i < 2) dodo(50); }
  }
  return 'illisible';
};

const saveCfg = () => {
  cfg[CFG_SEQ] = ++cfgSeq;
  const data = JSON.stringify(cfg, null, 2);
  const file = cfgPath();
  // La copie de secours d'ABORD : si le principal échoue, c'est elle la plus récente, donc celle sur
  // laquelle loadCfg se rabattra.
  const etatBak = ecrireCopie(file + '.bak', data);
  const etatMain = ecrireCopie(file, data);
  // Le .bak n'était JAMAIS relu : sa mort était totalement silencieuse, et l'alerte d'échec du
  // principal promettait quand même « tes réglages sont conservés dans la copie de secours ».
  const verdict = verdictEcriture(etatMain, etatBak);
  const bakEtaitOk = !cfgBakFailed;
  cfgBakFailed = verdict.bakMort;
  // Un filet qui disparaît en silence, c'est le pire des deux mondes : tout a l'air normal jusqu'au
  // jour où on en a besoin. On le dit UNE fois, à la bascule — pas à chaque enregistrement.
  if (cfgBakFailed && bakEtaitOk) {
    log('saveCfg: la COPIE DE SECOURS ne s\'écrit plus (' + etatBak + ') — le principal, lui, ' + (verdict.ok ? 'va bien' : 'non plus'));
    if (verdict.ok) setTimeout(() => queueAlert('⚠️ Copie de secours des réglages en panne',
      `Tes réglages s'enregistrent toujours, mais la copie de secours n'est plus écrite : en cas de coupure, ils seraient perdus. Regarde \`${masquer(cfgPath())}\` (antivirus, synchronisation, disque plein).`,
      0xFAA61A), 0);
  }
  // 'illisible' = écrit mais invérifiable : on ne déclenche pas l'alarme sur une simple lecture ratée.
  const ok = verdict.ok;
  if (etatMain === 'illisible') log('saveCfg: écrit, mais relecture impossible pour vérifier');
  if (!ok && !cfgWriteFailed) {
    log('saveCfg: ÉCHEC SILENCIEUX — le fichier ne reflète pas ce qui a été écrit ; les réglages ne survivent que dans le .bak :', file);
    // Différé d'un tick : saveCfg peut être appelé pendant l'amorçage, avant que queueAlert soit défini.
    // Le chemin est MASQUÉ ici : cette alerte part vers le webhook Discord et contient le nom de
    // session Windows. Le journal local, lui, garde la version entière — c'est là qu'on en a besoin.
    setTimeout(() => queueAlert('⚠️ Réglages non enregistrés',
      `Le panel n'arrive pas à écrire \`${masquer(file)}\`. ` + (cfgBakFailed
        ? '**La copie de secours non plus** : les prochains réglages seront perdus. Regarde ce dossier tout de suite (antivirus, synchronisation, disque plein).'
        : 'Tes réglages sont conservés dans la copie de secours, mais vérifie ce dossier (antivirus, synchronisation, disque plein).'), 0xfaa61a), 0);
  }
  cfgWriteFailed = !ok;
  return ok;
};

// ---------- Détection de la chaîne d'outils (Node + pm2) ----------
// Chez un ami, pm2 (voire Node) peut ne pas être installé → le panel affichait juste « Aucun process »,
// ce qui laisse croire à un bug. On détecte l'absence et on propose de l'installer.
let toolchain = { node: true, pm2: true };
const probeToolchain = () => new Promise((resolve) => {
  // pm2 accessible via le PATH ?
  execFile('pm2', ['-v'], { shell: true, windowsHide: true, timeout: 15000 }, (err, out) => {
    if (!err && /\d+\.\d+/.test(String(out || ''))) return resolve({ node: true, pm2: true });
    const pm2AtNpm = (() => { try { return fs.existsSync(PM2); } catch { return false; } })();
    execFile('node', ['-v'], { shell: true, windowsHide: true, timeout: 15000 }, (e2, o2) => {
      resolve({ node: !e2 && /v\d+/.test(String(o2 || '')), pm2: pm2AtNpm });
    });
  });
});

// ---------- pm2 ----------
// On appelle pm2 SANS cmd.exe quand c'est possible : `node.exe <pm2/bin/pm2> …`. Passer par le .cmd
// impose shell:true, et si l'appel se bloque Windows tue le cmd mais PAS le pm2 derrière → un process
// fantôme par sondage (et le panel sonde toutes les 10-30 s, 24h/24). En direct : pas de shell, pas de
// quoting, l'arbre est tuable proprement.
// ⚠️ JAMAIS process.execPath (Electron) même avec ELECTRON_RUN_AS_NODE : le démon pm2 hériterait de
// HasuPanel.exe, et une mise à jour du panel tuerait TOUS les bots. On veut un vrai node.exe.
const PM2_JS = path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'pm2', 'bin', 'pm2');
const findNodeExe = () => {
  const cands = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'nodejs', 'node.exe'),
    ...String(process.env.PATH || '').split(';').filter(Boolean).map((d) => path.join(d.trim(), 'node.exe')),
  ];
  for (const p of cands) { try { if (p && fs.existsSync(p)) return p; } catch {} }
  return null;
};
let NODE_EXE = null, pm2Direct = false;
const resolvePm2Runner = () => {
  try { NODE_EXE = findNodeExe(); pm2Direct = !!(NODE_EXE && fs.existsSync(PM2_JS)); } catch { pm2Direct = false; }
  log('pm2 runner :', pm2Direct ? `direct (${NODE_EXE})` : 'repli cmd.exe');
};
// (Repli cmd.exe : `quoteForShell` vit dans logic.js, testé unitairement.)
const pm2Raw = (args) => new Promise((resolve) => {
  const done = (err, out, errOut) => resolve({ ok: !err, out: `${out || ''}\n${errOut || ''}`.trim() });
  const opts = { windowsHide: true, timeout: 60000, maxBuffer: 16 * 1024 * 1024 };
  if (pm2Direct) return execFile(NODE_EXE, [PM2_JS, ...args.map(String)], opts, done);
  execFile(`"${PM2}"`, args.map(quoteForShell), { ...opts, shell: true }, done);
});
// Variante courante : uniquement des mots-clés/noms sûrs (start/stop/restart/jlist/save/… + noms pm2).
const pm2 = (args) => {
  if (!args.every((a) => /^[A-Za-z0-9_.-]+$/.test(a))) return Promise.resolve({ ok: false, out: 'arg refusé' });
  return pm2Raw(args);
};

// Relit l'état des bots dans le cache. Le « si pm2 est muet, on garde le dernier état connu » était
// copié-collé à l'identique en 5 endroits — une seule version ici, pour qu'il ne puisse pas diverger.
const refreshBots = async () => {
  const l = await pm2List();
  if (l) {
    // Les débits réseau sont posés sur les objets par measureNet, que SEUL le tick appelle. Remplacer
    // le tableau par celui de pm2List les effaçait : « ↓ 0 o/s · ↑ 0 o/s » s'affichait après chaque
    // action sur un bot, jusqu'au tick suivant. On les reporte, à PID identique et non nul (après un
    // stop, pm2 renvoie pid:0 et tous les bots arrêtés partageraient la même clé).
    const avant = new Map(statusCache.bots.filter((b) => b.pid > 0).map((b) => [b.name, b]));
    for (const b of l) {
      const p = avant.get(b.name);
      if (p && p.pid === b.pid) { b.netDown = p.netDown; b.netUp = p.netUp; }
    }
    statusCache.bots = l;
  }
  return l;
};

// Santé de pm2 : un tableau VIDE peut vouloir dire « aucun bot » OU « pm2 ne répond pas ». Avant, les
// deux cas se ressemblaient et l'écran affichait « Aucun bot géré » alors que TOUS les bots étaient
// peut-être morts. On distingue désormais, et le tick garde le dernier état connu quand pm2 est muet.
let pm2Health = { ok: true, since: 0, reason: '', lastOkAt: 0 };
const pm2List = async () => {
  const { ok, out } = await pm2(['jlist']);
  try {
    const i = out.indexOf('['); // pm2 peut afficher des lignes de log avant le JSON
    if (i < 0) throw new Error(ok ? 'sortie illisible' : 'pm2 injoignable');
    const arr = JSON.parse(out.slice(i));
    // Retour de pm2 : mis en FILE (et non envoyé ici) — une fonction de lecture ne doit pas bloquer sur
    // le réseau. On respecte aussi le réglage `alerts`, qui était contourné sur ce chemin.
    if (!pm2Health.ok && pm2DownAlerted) {
      pm2DownAlerted = false;
      if (cfg.alerts !== false) queueAlert('✅ pm2 répond de nouveau', 'La surveillance des bots a repris normalement.', 0x57F287);
    }
    pm2Health = { ok: true, since: 0, reason: '', lastOkAt: Date.now() };
    return arr.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      uptime: p.pm2_env?.pm_uptime || 0,
      restarts: p.pm2_env?.restart_time ?? 0,
      memory: p.monit?.memory || 0,
      cpu: p.monit?.cpu || 0,
      pid: Number(p.pid) || 0,
      // Métadonnées fournies par pm2 et réellement utilisées : chemins de logs (visionneuse) et
      // dossier du bot (bouton 📂). `script`/`interpreter` étaient sérialisés puis envoyés au renderer
      // toutes les 3 s sans que rien ne les lise → retirés.
      outLog: p.pm2_env?.pm_out_log_path || '',
      errLog: p.pm2_env?.pm_err_log_path || '',
      cwd: p.pm2_env?.pm_cwd || ''
    })).filter((b) => isSafeName(b.name));
  } catch (e) {
    if (pm2Health.ok) pm2Health = { ok: false, since: Date.now(), reason: e.message, lastOkAt: pm2Health.lastOkAt };
    return null; // null = pm2 muet (≠ [] qui veut dire « vraiment aucun bot »)
  }
};

// ---------- Tree-kill Windows : reap des enfants orphelins après pm2 stop ----------
// pm2 stop ne tue QUE le node principal ; sous Windows les enfants non-detached (ffmpeg/yt-dlp de
// hasu-music, npm install / node de +update|+diag…) survivent → process orphelins. On garde l'arrêt
// GRACIEUX du parent (flush SQLite + déconnexion Discord propre) puis on force-kill les descendants
// encore vivants. Sécurité : uniquement des PID NUMÉRIQUES, execFile en array-args (zéro injection).

// Un SEUL instantané de tout l'arbre de process (pid -> [enfants]) via un seul appel PowerShell.
// À capturer AVANT le stop : une fois le parent mort, Windows ne réparente pas → l'arbre est perdu.
// Réutilisable pour arrêter plusieurs bots sans redemander la table à chaque fois.
const processTree = () => new Promise((resolve) => {
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command',
    'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId):$($_.ParentProcessId):$($_.CreationDate.Ticks)" }'],
    { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
      resolve(parseProcessTree(err ? '' : out)); // parsing dans logic.js (testé)
    });
});
// (`descendantsOf` vit dans logic.js, testé unitairement : bornes, cycles, PID invalides.)

// Force-kill de PID déjà capturés. Un PID déjà mort → taskkill no-op (pas d'erreur bloquante).
const killPids = (pids) => new Promise((resolve) => {
  const list = [...new Set((pids || []).filter((p) => Number.isInteger(p) && p > 0))];
  if (!list.length) return resolve();
  const args = list.flatMap((p) => ['/PID', String(p)]).concat('/F'); // pas de /T : on a déjà tout l'arbre
  execFile(SYS('taskkill.exe'), args, { windowsHide: true, timeout: 15000 }, () => resolve());
});

// Anti-recyclage de PID : avant de force-kill après la grâce, on re-vérifie que chaque PID capturé est
// TOUJOURS le même process (date de création inchangée depuis l'instantané). Windows réattribue les PID —
// un enfant qui meurt pendant la grâce peut voir son PID réutilisé par un process INNOCENT (jeu, éditeur…) ;
// sans ce contrôle, taskkill /F tuerait ce dernier. En cas d'échec de la vérif (powershell indispo/timeout),
// on retombe sur le comportement d'origine (reap de tout le lot) → on ne laisse jamais d'orphelins.
const verifyStillSame = (pids, born) => new Promise((resolve) => {
  const list = [...new Set((pids || []).filter((p) => Number.isInteger(p) && p > 0))];
  if (!list.length || !born || !born.size) return resolve(list); // rien à vérifier → inchangé
  const filter = list.map((p) => `ProcessId=${p}`).join(' OR ');
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command',
    `Get-CimInstance Win32_Process -Filter "${filter}" | ForEach-Object { "$($_.ProcessId):$($_.CreationDate.Ticks)" }`],
    { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
      if (err) return resolve(list); // requête en ÉCHEC → comportement d'origine (ne pas laisser d'orphelins)
      // Requête réussie mais VIDE = tous ces PID ont disparu (un PID recyclé, lui, serait ressorti) → rien à tuer.
      const nowBorn = new Map();
      for (const line of String(out || '').split('\n')) {
        const m = line.trim().match(/^(\d+):(\d*)$/);
        if (m) nowBorn.set(Number(m[1]), m[2]);
      }
      // On ne tue QUE les PID encore présents ET de même date de création qu'au moment du snapshot.
      resolve(list.filter((pid) => nowBorn.has(pid) && nowBorn.get(pid) === born.get(pid)));
    });
});

const GRACE_MS = 4000; // > kill_timeout pm2 (~1.6s) : laisse le parent quitter proprement avant le reap

// Arrêt GRACIEUX d'UN bot + reap de ses enfants orphelins. `name` déjà validé isSafeName par l'appelant.
const stopTree = async (name) => {
  if (process.platform !== 'win32') return pm2(['stop', name]); // POSIX propage déjà l'arbre
  let pid = 0;
  try { pid = (await pm2List() || []).find((b) => b.name === name && b.status === 'online')?.pid || 0; } catch {}
  const empty = { children: new Map(), born: new Map() };
  const tree = pid ? await processTree().catch(() => empty) : empty;
  const descendants = pid ? descendantsOf(tree.children, pid) : []; // [] si déjà arrêté
  const r = await pm2(['stop', name]); // toujours l'arrêt gracieux du parent
  if (descendants.length) {
    await new Promise((res) => setTimeout(res, GRACE_MS)); // laisse un gracefulShutdown fermer ses enfants
    const safe = await verifyStillSame(descendants, tree.born); // épargne un PID recyclé pendant la grâce
    await killPids(safe).catch(() => {}); // ne tue QUE les survivants du snapshot, identité re-vérifiée
    log('tree-kill', name, `pid=${pid}`, `descendants=${descendants.length}`, `reap=${safe.length}`);
  }
  return r;
};

// Arrête PLUSIEURS bots efficacement (mode jeu, « Tout arrêter ») : UN seul instantané d'arbre pour
// tous, arrêts gracieux, puis UNE seule grâce avant de reaper tous les orphelins d'un coup — au lieu
// d'un dump PowerShell + une grâce de 4 s PAR bot. `entries` = [{ name, pid }] déjà connus de l'appelant.
const stopBotsTree = async (entries) => {
  const list = (entries || []).filter((e) => e && isSafeName(e.name));
  if (!list.length) return;
  if (process.platform !== 'win32') { for (const e of list) await pm2(['stop', e.name]); return; }
  const roots = list.map((e) => Number(e.pid)).filter((p) => Number.isInteger(p) && p > 0);
  const empty = { children: new Map(), born: new Map() };
  const tree = roots.length ? await processTree().catch(() => empty) : empty;
  const toKill = new Set();
  for (const r of roots) for (const d of descendantsOf(tree.children, r)) toKill.add(d);
  for (const e of list) await pm2(['stop', e.name]); // arrêts gracieux
  if (toKill.size) {
    await new Promise((res) => setTimeout(res, GRACE_MS));
    const safe = await verifyStillSame([...toKill], tree.born); // épargne les PID recyclés pendant la grâce
    await killPids(safe).catch(() => {});
    log('tree-kill lot', list.map((e) => e.name).join(','), `reap=${safe.length}/${toKill.size}`);
  }
};

// Variante pour la suppression d'un bot importé : même reap, puis pm2 delete.
const deleteTree = async (name) => { await stopTree(name); return pm2(['delete', name]); };

// ---------- pm2 save automatique ----------
// « pm2 save » fige la liste qui sera restaurée au prochain démarrage du PC. Sans ça, le dump vieillit
// (constaté : périmé de 5 jours) et un reboot ressuscite un état faux — d'où la plaie « après reboot,
// le bot est offline ». On sauvegarde donc après chaque start/stop volontaire, avec un délai (on évite
// d'écrire à chaque clic) et un GARDE-FOU : jamais pendant un mode jeu / lowNet, sinon on graverait
// « bots coupés » comme état de démarrage voulu.
let saveTimer = null;
let saveRetries = 0;
// Vrai tant qu'un `pm2 save` demandé n'a pas RÉUSSI. Le chemin qui compte vraiment est l'arrêt du
// PC : sans ce drapeau, une sauvegarde reportée par le mode jeu disparaissait à la fermeture.
let pm2SavePending = false;
const schedulePm2Save = (delayMs = 15000) => {
  pm2SavePending = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    // « Différé » doit vouloir dire RÉESSAYÉ, pas abandonné : avant, un simple `return` jetait la
    // sauvegarde, donc tout démarrage/arrêt fait pendant une partie n'atteignait JAMAIS pm2 save et le
    // reboot suivant restaurait une liste périmée. Le marqueur '-' (mode jeu sans aucune cible) est
    // filtré comme partout ailleurs, sinon il bloquait la sauvegarde toute la partie pour rien.
    const parked = cfg.stoppedByGame.filter((n) => n !== '-');
    if (parked.length || cfg.lowNetApplied) {
      // Plus de plafond de 20 tentatives : au bout de 42 min de partie, la sauvegarde était ABANDONNÉE
      // et tout démarrage/arrêt fait pendant la session ne survivait pas au reboot — précisément le
      // bug que ce report existe pour éviter. Le report ne coûte qu'un minuteur, pas un spawn ; on
      // réessaie donc tant qu'il le faut, en ne journalisant qu'une fois sur dix.
      saveRetries++;
      if (saveRetries % 10 === 1) log('pm2 save reporté (mode jeu / éco réseau) — tentative', saveRetries);
      schedulePm2Save(120000);
      return;
    }
    saveRetries = 0;
    const r = await pm2(['save']);
    if (r.ok) { pm2SavePending = false; cfg.lastSaveAt = Date.now(); saveCfg(); log('pm2 save auto OK'); } else log('pm2 save auto échec');
  }, delayMs);
  saveTimer.unref?.();
};

// ---------- Alertes : un bot tombe → tu es prévenu MÊME hors du panel ----------
// Constat qui a motivé la feature : 4 bots sont restés morts 5 jours (coupure DNS) sans que personne
// ne le signale. Le webhook Discord porte l'essentiel (il te touche même en jeu / absent) ; le toast
// Windows ne sert que si tu es devant le PC. Garde-fous : silence au démarrage et après un réveil du
// PC (sinon une rafale de faux positifs), anti-doublon par bot, et plafond horaire.
const ALERT_QUIET_BOOT_MS = 90 * 1000;
const ALERT_QUIET_RESUME_MS = 2 * 60 * 1000;
const ALERT_DEDUP_MS = 30 * 60 * 1000;
const ALERT_MAX_PER_HOUR = 6;
const startedAt = Date.now();
let quietUntil = 0, alertTimes = [], lastAlertAt = new Map(), prevStatus = new Map(), alertsPrimed = false;
let alertsSuppressed = []; // horodatages des alertes différées par le plafond horaire (fenêtre 1 h) — remonté à l'écran

// (Le diagnostic en français vit dans logic.js `classifyErrorFr` — l'ORDRE de ses règles est figé par
// un test, car un même log peut contenir plusieurs signatures et la première l'emporte.)

const postWebhook = (url, payload) => new Promise((resolve) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !/(^|\.)discord\.com$/i.test(u.hostname)) return resolve(false); // webhook Discord uniquement
    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const req = require('https').request({ method: 'POST', hostname: u.hostname, path: u.pathname + u.search,
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }, timeout: 10000 },
      (res) => { res.resume(); resolve(res.statusCode >= 200 && res.statusCode < 300); });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end(body);
  } catch { resolve(false); }
});

// ---------- Petit son discret ----------
// Le WAV est GÉNÉRÉ (logic.js) puis écrit une fois dans le dossier de données : aucun fichier à
// embarquer, et surtout on maîtrise le volume — SoundPlayer joue un son système à plein niveau, sans
// aucun réglage possible. Amplitude ~8 % du maximum : audible sans faire sursauter.
let chimePath = null;
const ensureChime = () => {
  if (chimePath) return chimePath;
  try {
    const p = path.join(app.getPath('userData'), 'notify.wav');
    const vol = clampInt(cfg.alertVolume, 1, 100, 10) / 100;
    if (!fs.existsSync(p) || cfg.alertVolumeAt !== vol) {
      fs.writeFileSync(p, makeChimeWav({ amplitude: vol }));
      cfg.alertVolumeAt = vol; saveCfg();
    }
    chimePath = p;
  } catch (e) { log('chime', e.message); }
  return chimePath;
};
const playSoftSound = () => {
  if (cfg.alertSound === false) return;
  const f = ensureChime();
  if (!f) return;
  // PlaySync dans un process jetable : ne bloque pas le panel, et le son va au bout même si le
  // process parent est occupé. Le chemin vient de nous (dossier de données) — on échappe malgré tout
  // les apostrophes, par principe.
  const safe = f.replace(/'/g, "''");
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
    `(New-Object Media.SoundPlayer '${safe}').PlaySync()`], { windowsHide: true, timeout: 8000 }, () => {});
};

// Notification « nouvelle version prête ». Discrète et NON répétitive : une seule fois par version,
// jamais pendant une partie (on ne dérange pas en jeu — la MAJ s'installera toute seule après).
let updateNotifiedFor = '';
const notifyUpdateReady = (version) => {
  try {
    const v = String(version || '');
    if (!v || v === updateNotifiedFor) return;
    if (cfg.alerts === false || cfg.alertToast === false) return;
    if (statusCache.game) return; // en pleine partie : silence total
    updateNotifiedFor = v;
    if (Notification.isSupported()) {
      new Notification({
        title: 'Hasu Panel — mise à jour prête',
        body: `Version ${v} téléchargée. Elle s'installera toute seule quand tu ne joueras pas.`,
        silent: true,
      }).show();
    }
    playSoftSound();
  } catch (e) { log('notifyUpdateReady', e.message); }
};

// Renvoie true si l'alerte est réellement partie (le webhook a répondu 2xx, ou il n'y en a pas).
// `dejaNotifie` = on est dans un RÉESSAI : le toast, le son et le quota horaire ont déjà été consommés
// au premier essai. Sans ça, trois réessais empilaient trois toasts identiques et vidaient à eux seuls
// le plafond de 6 alertes/heure.
const sendAlert = async (title, body, colorHex, dejaNotifie = false) => {
  const now = Date.now();
  if (!dejaNotifie) {
    alertTimes = alertTimes.filter((t) => now - t < 3600 * 1000);
    if (alertTimes.length >= ALERT_MAX_PER_HOUR) {
      // Jamais de rejet MUET : le plafond est global (tous bots confondus), donc un seul bot qui
      // oscille pouvait rendre invisible la panne d'un autre. L'alerte part maintenant en réessai
      // (voir drainAlerts) et le compteur ci-dessous est affiché dans les réglages, pour que
      // « alertes activées » cesse d'être un demi-mensonge.
      alertsSuppressed.push(now);
      log('alerte DIFFÉRÉE (plafond horaire atteint) :', title);
      return false;
    }
    alertTimes.push(now);
    if (cfg.alertToast !== false) {
      // silent:true → Windows ne joue PAS son propre son (souvent fort) ; on joue le nôtre à la place.
      try { if (Notification.isSupported()) new Notification({ title, body, silent: true }).show(); } catch {}
      playSoftSound();
    }
  }
  const url = (cfg.alertWebhook || '').trim();
  let ok = true;
  if (url) ok = await postWebhook(url, { embeds: [{ title, description: body, color: colorHex, timestamp: new Date(now).toISOString(), footer: { text: 'Hasu Panel' } }] });
  log('alerte :', ok ? '' : '(ÉCHEC envoi)', title, '—', body.replace(/\n/g, ' ').slice(0, 160));
  return ok;
};

// File d'attente des alertes : envoyer depuis la boucle de surveillance la BLOQUAIT (chaque webhook
// peut prendre 10 s, jusqu'à 6 par heure → un tick pouvait geler ~60 s, donc plus de détection de jeu
// ni de mise à jour pendant une panne… le moment précis où la surveillance compte le plus).
// On empile et on dépile en arrière-plan, séquentiellement (pas de rafale parallèle vers Discord).
const alertQueue = [];
let alertDraining = false;
// Une alerte n'est « faite » que si elle est réellement PARTIE. Avant, le bot était marqué comme
// signalé AVANT l'envoi : quand le webhook échouait — typiquement parce que la panne EST la coupure
// réseau qui a tué les bots — l'alerte était perdue, et comme la transition ne se reproduit plus
// (les bots restent en 'errored'), plus personne n'était jamais prévenu. Le scénario fondateur de
// la fonctionnalité, précisément. On réessaie donc, HORS du verrou pour ne pas geler la surveillance.
const ALERT_RETRY_MS = [30 * 1000, 2 * 60 * 1000, 5 * 60 * 1000];
const drainAlerts = async () => {
  if (alertDraining) return;
  alertDraining = true;
  try {
    while (alertQueue.length) {
      const a = alertQueue.shift();
      let ok = false;
      try { ok = await sendAlert(a.title, a.body, a.color, a.notifie); } catch (e) { log('sendAlert', e.message); }
      a.notifie = true;
      if (ok) continue;
      const attente = ALERT_RETRY_MS[a.essais];
      if (attente === undefined) {
        // Abandon. On OUBLIE que ce bot a été signalé pour qu'un tick ultérieur puisse réessayer,
        // au lieu de le laisser silencieux pour toujours.
        if (a.cle) lastAlertAt.delete(a.cle);
        log('alerte abandonnée après', a.essais, 'réessai(s) :', a.title);
        continue;
      }
      a.essais++;
      // Replanifié hors de la boucle : `await sleep()` ici tiendrait le verrou et gèlerait les
      // alertes « pm2 ne répond plus » et les retours en ligne pendant plusieurs minutes.
      setTimeout(() => { alertQueue.push(a); drainAlerts(); }, attente).unref?.();
    }
  } finally { alertDraining = false; }
};
const queueAlert = (title, body, color, cle = '') => {
  if (alertQueue.length >= 20) return; // borne dure : on ne laisse pas la file enfler sans fin
  alertQueue.push({ title, body, color, cle, essais: 0, notifie: false });
  drainAlerts(); // volontairement pas attendu : la boucle de surveillance continue
};

// Photo de l'état des bots, base de toute détection de transition.
const snapshotOf = (bots) => new Map(bots.map((b) => [b.name, { status: b.status, restarts: b.restarts }]));

// Applique les transitions d'état. La DÉCISION (alerter ? marquer un arrêt volontaire ?) vit dans
// logic.js `decideAlert`, fonction pure et testée ; ici on ne fait qu'exécuter le verdict.
//
// Le suivi des arrêts volontaires est une question d'AUTO-DÉMARRAGE, pas de notification : il tourne
// donc MÊME quand les alertes sont coupées. Avant, ce cycle de vie était enfermé dans checkAlerts
// derrière trois sorties anticipées — couper les alertes (réglage purement cosmétique) laissait
// `manualStop` collé à true pour toujours : le bot n'était plus jamais rallumé au démarrage, ni
// signalé par le bandeau, sans aucun moyen de le débloquer depuis l'interface.
// Suivi des chutes, pour la relance automatique : nom → { downSince, tries }.
// Hydraté depuis la config au démarrage (voir hydrateRuntime) et réécrit dedans à chaque changement :
// sans persistance, un redémarrage du panel — que la mise à jour automatique provoque elle-même —
// remettait tous les compteurs à zéro et relançait indéfiniment un bot qui ne repart pas.
const healState = new Map();

// Journal des incidents, borné. Le panel voyait chaque chute et l'oubliait aussitôt : impossible de
// répondre à « pourquoi saliox a redémarré 8 fois ? » sans ouvrir les logs bruts.
const INCIDENTS_MAX = 40;
const addIncident = (name, kind, cause) => {
  if (!Array.isArray(cfg.incidents)) cfg.incidents = [];
  cfg.incidents.push({ at: Date.now(), name, kind, cause: String(cause || '').slice(0, 160) });
  if (cfg.incidents.length > INCIDENTS_MAX) cfg.incidents = cfg.incidents.slice(-INCIDENTS_MAX);
};

// Recopie l'état vivant dans la config, pour qu'il survive à un redémarrage.
const persistRuntime = () => {
  const lastAlert = {};
  for (const [k, v] of lastAlertAt) if (isSafeName(k) && Number.isFinite(v)) lastAlert[k] = v;
  const heal = {};
  for (const [k, v] of healState) if (isSafeName(k) && v && Number.isFinite(v.downSince)) heal[k] = { downSince: v.downSince, tries: v.tries || 0 };
  cfg.runtime = { lastAlertAt: lastAlert, heal };
};

// …et l'inverse au démarrage. Les entrées trop vieilles sont balayées : une chute d'il y a trois
// jours ne doit pas déclencher une relance « en retard » ni étouffer une alerte via l'anti-doublon.
const hydrateRuntime = () => {
  const r = (cfg.runtime && typeof cfg.runtime === 'object') ? cfg.runtime : { lastAlertAt: {}, heal: {} };
  const now = Date.now(), PEREMPTION = 24 * 3600 * 1000;
  // Un horodatage dans le FUTUR (horloge reculée, fichier bricolé) rend `now - t` négatif : il passe
  // la péremption, puis bloque l'anti-doublon et la relance POUR TOUJOURS, sans rien dire. On le
  // ramène à maintenant plutôt que de le jeter — l'état reste utile, il redevient simplement sain.
  const borne = (t) => (Number.isFinite(t) && t <= now ? t : now);
  for (const [k, v] of Object.entries(r.lastAlertAt || {})) if (now - v < PEREMPTION) lastAlertAt.set(k, borne(v));
  for (const [k, v] of Object.entries(r.heal || {})) {
    if (now - v.downSince < PEREMPTION) {
      healState.set(k, { downSince: borne(v.downSince), tries: v.tries || 0, lastTryAt: borne(v.lastTryAt || 0) });
    }
  }
  if (lastAlertAt.size || healState.size) log('surveillance reprise :', lastAlertAt.size, 'alerte(s) suivie(s),', healState.size, 'bot(s) en attente de relance');
};

// Renvoie l'ensemble des bots dont l'instantané ne doit PAS avancer (statut de passage).
const transientTicks = new Map(); // nom → nombre de ticks consécutifs passés dans un statut de passage
const lastIncidentAt = new Map(); // nom → dernier incident journalisé (anti-noyade sur un bot qui boucle)
const applyTransitions = (bots, prev) => {
  const now = Date.now();
  const notifyAllowed = cfg.alerts !== false
    && now >= quietUntil && now - startedAt >= ALERT_QUIET_BOOT_MS;
  let changed = false;
  const held = new Set();

  for (const b of bots) {
    const p = prev.get(b.name);
    if (!p) continue;
    const conf = cfg.bots[b.name];
    const d = decideAlert(p, b, {
      name: b.name,
      stoppedByGame: cfg.stoppedByGame,
      manualStop: !!(conf && conf.manualStop),
      hadAlert: lastAlertAt.has(b.name),
      transientTicks: transientTicks.get(b.name) || 0,
    });
    if (d.hold) {
      held.add(b.name);
      transientTicks.set(b.name, (transientTicks.get(b.name) || 0) + 1);
      continue; // on ne décide rien tant que l'état n'est pas posé
    }
    transientTicks.delete(b.name);

    // 1bis) Suivi de la chute, pour la relance automatique. Indépendant des notifications : c'est de
    // la remise en service, pas de l'information. Un bot revenu en ligne clôt son épisode.
    //
    // Le suivi ne peut PAS dépendre d'une transition observée (`d.alert`) : un bot déjà à terre quand
    // le panel démarre n'en produit aucune — c'est pourtant le scénario fondateur, le panel qu'on
    // rallume et qui trouve des bots morts. On suit donc tout bot durablement hors ligne que la
    // configuration veut en ligne. `manualStop` reste le seul juge de « c'est moi qui l'ai coupé ».
    if (b.status === 'online') {
      if (healState.delete(b.name)) changed = true;
    } else if (!healState.has(b.name)
        && conf && conf.auto !== false && !conf.manualStop
        && !cfg.stoppedByGame.includes(b.name)) {
      // `uptime` est la dernière date de démarrage connue de pm2 : bien meilleure que « maintenant »
      // pour un bot tombé pendant que le panel était éteint (sinon le compte à rebours repart à zéro
      // à chaque lancement, et un bot mort depuis des heures attend encore 5 min).
      healState.set(b.name, { downSince: Number(b.uptime) > 0 ? Number(b.uptime) : now, tries: 0, lastTryAt: 0 });
      changed = true;
    }

    // 1) État persisté (toujours, même alertes coupées)
    if (d.clearManualStop && conf) { conf.manualStop = false; changed = true; }
    if (d.setManualStop) {
      const c = cfg.bots[b.name] || (cfg.bots[b.name] = { auto: true, gameStop: false, manualStop: false });
      if (!c.manualStop) { c.manualStop = true; changed = true; log('arrêt volontaire détecté :', b.name); }
    }

    // 2) Notifications
    if (!d.alert) continue;
    if (d.alert === 'recovered') {
      // La purge de l'anti-doublon doit avoir lieu MÊME notifications coupées : sinon un retour en
      // ligne non notifié laissait l'horodatage en place, et l'anti-doublon de 30 min étouffait la
      // panne SUIVANTE — la seule qui comptait.
      lastAlertAt.delete(b.name);
      addIncident(b.name, 'retour', ''); changed = true;
      if (notifyAllowed) queueAlert(`✅ ${b.name} est de retour`, 'Le bot est de nouveau en ligne.', 0x57F287, b.name);
      continue;
    }
    // L'incident est journalisé AVANT la garde des notifications : l'historique doit rester complet
    // même alertes coupées, sinon il ne répond plus à « que s'est-il passé cette nuit ? ».
    // Un bot en boucle de plantage rejoue « looping » à CHAQUE tick : sans ce garde-fou, c'était un
    // incident + une lecture disque de 8 Ko + une réécriture COMPLÈTE de la config toutes les 10 s,
    // et les 40 entrées d'historique étaient noyées par un seul bot en dix minutes. On n'enregistre
    // qu'un incident par bot et par fenêtre d'anti-doublon.
    let cause = null; // null = pas encore lue (la lecture du log coûte 8 Ko sur le thread principal)
    const dernier = lastIncidentAt.get(b.name) || 0;
    if (now - dernier >= ALERT_DEDUP_MS) {
      lastIncidentAt.set(b.name, now);
      cause = classifyErrorFr(tailFile(b.errLog || '', 8 * 1024));
      addIncident(b.name, d.alert === 'looping' ? 'boucle' : 'chute', cause); changed = true;
    }
    if (!notifyAllowed) continue;
    if (now - (lastAlertAt.get(b.name) || 0) < ALERT_DEDUP_MS) continue; // anti-doublon 30 min
    lastAlertAt.set(b.name, now);
    // La cause a pu ne pas être lue ci-dessus (incident dédoublonné) : on la lit alors ici, car
    // l'alerte, elle, part — les deux dédoublonnages ont la même durée mais pas le même compteur.
    if (cause === null) cause = classifyErrorFr(tailFile(b.errLog || '', 8 * 1024));
    queueAlert(
      d.alert === 'looping' ? `🔁 ${b.name} redémarre en boucle` : `⚠️ ${b.name} est tombé`,
      (cause ? `**Cause probable :** ${cause}\n` : '') + `État : ${b.status} · redémarrages : ${b.restarts}`,
      d.alert === 'looping' ? 0xE67E22 : 0xED4245,
      b.name); // la clé permet d'oublier le « déjà signalé » si l'envoi finit par échouer
  }
  if (changed) { persistRuntime(); saveCfg(); } // UN seul enregistrement pour tout le lot
  return held;
};

// Relance automatique des bots tombés. Appelée par le tick, APRÈS applyTransitions (qui a posé les
// `downSince`). La décision « est-ce le moment ? » vit dans logic.js, testée ; ici on n'exécute que
// le verdict, et on écarte tout ce qui rendrait une relance inopportune.
const runAutoHeal = async () => {
  if (cfg.autoHeal === false || !pm2Health.ok || !healState.size) return;
  // `gameUnknown` est BORNÉ comme dans updateBlockers : une panne durable de tasklist (antivirus)
  // ne doit pas condamner la relance à vie. Sans cette borne, le doute valait interdiction éternelle.
  const doute = gameUnknown && Date.now() - gameUnknownSince < GAME_UNKNOWN_MAX_MS;
  const empeche = statusCache.game ? 'jeu en cours'
    : doute ? 'partie en cours inconnue'
      : (busy || actionsInFlight.size || stopAllInFlight) ? 'manœuvre en cours' : '';
  if (empeche) {
    // Non-silence : si une relance est due et qu'on ne la fait pas, ça doit se lire quelque part.
    // C'est l'absence exacte de cette ligne qui a laissé le bug ci-dessus invisible.
    if (healPending(Date.now(), healState) && Date.now() % 600000 < 20000) log('relance en attente —', empeche);
    return;
  }
  const now = Date.now();
  let changed = false;
  // UNE SEULE relance par tick. Le scénario fondateur — coupure Internet, tous les bots tombent
  // ensemble — les rend tous éligibles à la même minute : la boucle enchaînait alors 2 spawns par bot
  // (~900 ms chacun) en tenant `tickRunning`, gelant détection de jeu, mode jeu et mises à jour
  // plusieurs secondes. Les autres passent au tick suivant, 10 s plus tard : sans importance quand
  // les délais de relance se comptent en minutes.
  for (const b of statusCache.bots) {
    const st = healState.get(b.name);
    if (!st || b.status === 'online') continue;
    const conf = cfg.bots[b.name];
    if (!conf || conf.auto === false || conf.manualStop) continue;   // tu ne veux pas ce bot en ligne
    if (cfg.stoppedByGame.includes(b.name)) continue;                // c'est le mode jeu qui l'a coupé
    if (!shouldAutoHeal(now, st.downSince, st.tries, st.lastTryAt)) continue;
    st.tries++; st.lastTryAt = now; changed = true;                  // comptés AVANT l'await : sinon deux
    healState.set(b.name, st);                                       // ticks lents relanceraient en double
    const r = await pm2(['start', b.name]);
    // Re-vérifié APRÈS l'attente : tu peux avoir cliqué « arrêter » entre-temps, et la garde d'entrée
    // de cette fonction date d'avant le spawn. On n'insiste pas contre une action en cours — mais on
    // ne SUPPRIME PAS l'épisode : le sortir de la surveillance à cause d'une action sur un AUTRE bot
    // le condamnerait à ne plus jamais être relancé. On repasse simplement au tick suivant.
    if (actionsInFlight.size || stopAllInFlight || cfg.bots[b.name]?.manualStop) {
      log('relance automatique interrompue (action en cours) :', b.name, '— reprise au prochain tick');
      break;
    }
    // Un process qui démarre n'est pas « en ligne » à la seconde où pm2 rend la main : il lui faut
    // le temps de se connecter. Juger tout de suite faisait passer une relance RÉUSSIE pour un échec,
    // ce qui brûlait les trois essais et envoyait « ne repart pas » sur un bot qui tournait très bien.
    await new Promise((res) => setTimeout(res, 4000));
    const apres = await refreshBots();
    const etat = (apres || []).find((x) => x.name === b.name);
    const enLigne = !!etat && etat.status === 'online';
    log('relance automatique :', b.name, `essai ${st.tries}/${AUTO_HEAL_MAX} →`, enLigne ? 'OK' : 'échec',
      enLigne ? '' : String(r.out || '').slice(0, 200));
    addIncident(b.name, enLigne ? 'relance' : 'relance-ko', enLigne ? `essai ${st.tries}` : classifyErrorFr(String(r.out || '')));
    if (enLigne) {
      healState.delete(b.name);
      queueAlert(`🔧 ${b.name} relancé automatiquement`,
        `Il était tombé, le panel l'a redémarré (essai ${st.tries}). Aucune action de ta part.`, 0x57F287, b.name);
    } else if (st.tries >= AUTO_HEAL_MAX) {
      queueAlert(`⛔ ${b.name} ne repart pas`,
        `${AUTO_HEAL_MAX} relances automatiques ont échoué. Il faut regarder : dossier déplacé, dépendance manquante ou token révoqué.`, 0xED4245, b.name);
    }
    break; // une seule par tick — voir le commentaire en tête de boucle
  }
  if (changed) { persistRuntime(); saveCfg(); }
};

// pm2 injoignable = TOUS les bots sont potentiellement à terre, et aucune alerte « bot tombé » ne peut
// partir (on ne lit plus rien). C'était l'angle mort de la surveillance → on alerte sur pm2 lui-même,
// une seule fois par panne, et on annonce le retour.
let pm2DownAlerted = false;
const alertPm2Down = () => {
  if (cfg.alerts === false || pm2DownAlerted) return;
  const now = Date.now();
  if (now < quietUntil || now - startedAt < ALERT_QUIET_BOOT_MS) return;
  if (!pm2Health.since || now - pm2Health.since < 2 * 60 * 1000) return; // muet depuis > 2 min (évite un simple hoquet)
  pm2DownAlerted = true;
  queueAlert('🛑 pm2 ne répond plus', `Impossible de lire l'état des bots depuis ~2 min${pm2Health.reason ? ` (${pm2Health.reason})` : ''}. Tes bots ne sont peut-être plus surveillés.`, 0xED4245);
};

// ---------- « X bots devraient être en ligne » ----------
// bootEnforce ne tourne qu'une fois, au démarrage. Un bot qui meurt à 3 h du matin reste mort. On
// calcule ici l'écart entre l'intention (Auto boot coché, pas arrêté à la main, pas coupé par le jeu)
// et la réalité — l'UI en fait un bandeau avec un bouton, PAS une réparation automatique (un bot que
// pm2 a abandonné après ses tentatives ne doit pas être relancé en boucle).
// Mémorisé sur l'horodatage du cache : le résultat ne peut changer qu'après un nouveau tick, or la
// fonction était rappelée à CHAQUE panel:status (toutes les 3 s) et à chaque updateTray — soit 3 à 10
// recalculs identiques par tick, sur le chemin chaud de l'IPC.
let needFixCache = { at: -1, names: [] };
const needFix = () => {
  if (!cfg || !cfg.bots || !pm2Health.ok) return [];
  // La clé du mémo est faite des VRAIES entrées du calcul. Avant, elle ne contenait que
  // `statusCache.updatedAt`, que seul le tick fait avancer : décocher « Auto boot », relancer un bot
  // via « Remettre en ordre » ou sortir du mode jeu laissait le bandeau et la pastille rouge de la
  // zone de notification sur une liste PÉRIMÉE jusqu'au tick suivant — et « Remettre en ordre »
  // agissait alors sur cette liste périmée, annulant le choix que l'utilisateur venait de faire.
  const cle = statusCache.bots.map((b) => `${b.name}:${b.status}`).join('|')
    + '#' + Object.keys(cfg.bots).map((n) => `${n}:${cfg.bots[n].auto !== false ? 1 : 0}${cfg.bots[n].manualStop ? 1 : 0}`).join('|')
    + '#' + cfg.stoppedByGame.join('|');
  if (needFixCache.at === cle) return needFixCache.names;
  const names = statusCache.bots
    .filter((b) => b.status !== 'online'
      && cfg.bots[b.name] && cfg.bots[b.name].auto !== false && !cfg.bots[b.name].manualStop
      && !cfg.stoppedByGame.includes(b.name))
    .map((b) => b.name);
  needFixCache = { at: cle, names };
  return names;
};

// ---------- Détection de jeu (liste de process + PID) ----------
// `null` = on n'a PAS pu lire la liste des process. Cet échec était totalement muet : sous forte
// charge disque (timeout) ou blocage par un antivirus, la machine à états du mode jeu gelait avec les
// bots coupés, et rien nulle part ne le disait. On le journalise, on le compte, et on prévient une
// seule fois par épisode — sans forcer la sortie du mode jeu, qui rallumerait les bots en pleine
// partie normale.
let procScanFails = 0, procScanAlerted = false;
const listProcs = () => new Promise((resolve) => {
  execFile(SYS('tasklist.exe'), ['/fo', 'csv', '/nh'], { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
    if (err || !out) {
      procScanFails++;
      log('tasklist en échec (', procScanFails, ') :', err ? (err.code || err.message) : 'sortie vide');
      // ~5 ticks de suite : ce n'est plus un hoquet. Les mêmes garde-fous que les autres alertes
      // système (alertes coupées, démarrage silencieux) sont appliqués ici, queueAlert ne les
      // vérifie pas lui-même.
      if (procScanFails >= 5 && !procScanAlerted && cfg.alerts !== false
          && Date.now() >= quietUntil && Date.now() - startedAt >= ALERT_QUIET_BOOT_MS) {
        procScanAlerted = true;
        queueAlert('⚠️ Détection de jeu à l\'arrêt',
          'Windows refuse de lister les process (`tasklist`). Le mode jeu et l\'éco réseau sont figés dans leur état actuel — antivirus ou stratégie de sécurité, probablement.',
          0xFAA61A);
      }
      return resolve(null);
    }
    if (procScanFails) { log('tasklist de nouveau opérationnel après', procScanFails, 'échec(s)'); procScanFails = 0; procScanAlerted = false; }
    resolve(parseTasklistCsv(out)); // parsing dans logic.js (testé : casse, PID multiples, lignes invalides)
  });
});

// Jeu EN LIGNE ou solo ? → au moins une connexion TCP établie du process vers une IP publique.
// Heuristique honnête : couvre les jeux TCP et les jeux « toujours en ligne » (services/lobby) ;
// un jeu 100 % hors-ligne n'a aucune connexion sortante → mode jeu non déclenché.
// (`isPublicIp` vit désormais dans validators.js, testé unitairement.)

const hasOnlineActivity = (pids) => new Promise((resolve) => {
  if (!Array.isArray(pids) || !pids.length) return resolve(false);
  execFile(SYS('netstat.exe'), ['-ano', '-p', 'tcp'], { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
    if (err || !out) return resolve(false);
    resolve(hasEstablishedPublic(out, pids)); // analyse dans logic.js (testée : LAN, IPv6, autres PID)
  });
});

// ---------- Débit réseau par bot ----------
// Octets d'E/S CUMULÉS par process (Win32_Process.ReadTransferCount + WriteTransferCount). Pour un bot Discord,
// l'E/S est quasi exclusivement du RÉSEAU (gateway websocket + API REST) + un peu de disque (SQLite) : c'est
// un proxy honnête du réseau, sans admin (le vrai réseau pur par process exigerait de l'ETW + élévation).
// Le tick transforme ce cumul en DÉBIT (octets/s) via le delta entre deux relevés.
const ioRawByPid = (pids) => new Promise((resolve) => {
  const m = new Map();
  pids = (pids || []).filter((p) => Number.isInteger(p) && p > 0);
  if (!pids.length) return resolve(m);
  const filter = pids.map((p) => `ProcessId=${p}`).join(' OR ');
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command',
    `Get-CimInstance Win32_Process -Filter "${filter}" | ForEach-Object { "$($_.ProcessId):$([int64]$_.ReadTransferCount):$([int64]$_.WriteTransferCount)" }`],
    { windowsHide: true, timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
      if (err || !out) return resolve(m);
      for (const line of String(out).split('\n')) {
        const p = line.trim().split(':'); // "PID:read:write" (octets cumulés lus / écrits)
        if (p.length < 3) continue;
        const pid = Number(p[0]), read = Number(p[1]), write = Number(p[2]);
        if (pid > 0 && Number.isFinite(read) && Number.isFinite(write)) m.set(pid, { read, write });
      }
      resolve(m);
    });
});

// Enrichit statusCache.bots avec b.net (octets/s) = delta d'E/S cumulée depuis le relevé précédent / temps écoulé.
const measureNet = async () => {
  const now = Date.now();
  const cum = await ioRawByPid(statusCache.bots.map((b) => b.pid)).catch(() => new Map());
  for (const b of statusCache.bots) {
    const cur = cum.get(b.pid);
    const prev = prevIo.get(b.pid);
    // Débit seulement si relevé précédent cohérent (cur >= prev = pas de reset de compteur / redémarrage).
    const rate = (curV, prevV) => (Number.isFinite(curV) && prev && Number.isFinite(prevV) && curV >= prevV && now > prev.at)
      ? Math.round((curV - prevV) * 1000 / (now - prev.at)) : 0;
    b.netDown = cur ? rate(cur.read, prev ? prev.read : undefined) : 0;  // octets/s reçus (lecture)
    b.netUp = cur ? rate(cur.write, prev ? prev.write : undefined) : 0;  // octets/s envoyés (écriture)
    if (cur != null) prevIo.set(b.pid, { read: cur.read, write: cur.write, at: now });
  }
  const alive = new Set(statusCache.bots.map((b) => b.pid)); // hygiène : oublie les PID disparus
  for (const pid of prevIo.keys()) if (!alive.has(pid)) prevIo.delete(pid);
};

// ---------- Faible usage internet (priorité réseau au jeu) ----------
// Sans droits admin, on agit sur ce qu'on contrôle VRAIMENT : 1) drapeau lu par saliox → gros
// transferts différés (phishlist ~Mo, backups chiffrés) ; 2) priorité CPU des bots abaissée
// (moins de contention pendant la partie). Niveau choisi selon le débit du lien réseau.
const setBotPriority = (pids, cls) => new Promise((resolve) => {
  pids = (pids || []).filter((p) => Number.isInteger(p) && p > 0);
  if (!pids.length || !['Normal', 'BelowNormal', 'Idle'].includes(cls)) return resolve(false);
  const cmd = `foreach($p in ${pids.join(',')}){ try { (Get-Process -Id $p -ErrorAction Stop).PriorityClass = '${cls}' } catch {} }`;
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command', cmd], { windowsHide: true, timeout: 20000 }, () => resolve(true));
});

const linkSpeedMbps = () => new Promise((resolve) => {
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command',
    "(Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' } | Select-Object -First 1 -ExpandProperty LinkSpeed)"],
    { windowsHide: true, timeout: 20000 }, (err, out) => {
      const m = String(out || '').match(/([\d.]+)\s*(G|M|K)?bps/i);
      if (!m) return resolve(0);
      const v = parseFloat(m[1]); const u = (m[2] || '').toUpperCase();
      resolve(u === 'G' ? v * 1000 : u === 'K' ? v / 1000 : v);
    });
});

// `known` : liste pm2 déjà lue par le tick appelant (évite un `pm2 jlist` redondant).
const applyLowNet = async (game, known) => {
  const speed = await linkSpeedMbps();
  const level = speed && speed < 100 ? 2 : 1; // petit débit → différer + priorité Idle ; sinon BelowNormal
  // L'écriture de ce drapeau peut échouer durablement (dossier de données absent chez un ami, dossier
  // redirigé) pendant que l'écran et le tray annoncent « éco réseau active ». Les bots le lisent pour
  // différer leurs gros téléchargements : sans lui, la moitié de la fonctionnalité ne s'applique pas.
  let flagOk = true;
  try { fs.writeFileSync(LOWNET_FLAG, JSON.stringify({ active: true, level, game, since: Date.now() })); }
  catch (e) { flagOk = false; log('éco réseau : drapeau NON écrit —', e.message, '(les bots ne différeront pas leurs téléchargements)'); }
  lowNetFlagOk = flagOk;
  const bots = known || await pm2List() || [];
  await setBotPriority(bots.filter((b) => b.status === 'online').map((b) => b.pid), level === 2 ? 'Idle' : 'BelowNormal');
  cfg.lowNetApplied = true; saveCfg();
  log(`faible usage internet ON (lien ~${Math.round(speed)} Mbps → niveau ${level}) — jeu : ${game}`);
  updateTray();
};

// `known` : liste pm2 DÉJÀ lue par le tick. undefined = rien de disponible, on lit ici ; null = le
// tick a déjà constaté que pm2 est muet, donc inutile de relancer un `pm2 jlist` (437 ms mesurés)
// pour se le faire redire — et il le relançait à CHAQUE tick pendant toute la durée de la panne.
const clearLowNet = async (known) => {
  try { fs.unlinkSync(LOWNET_FLAG); } catch {}
  // Si pm2 est muet, on ne peut PAS restaurer les priorités CPU. Baisser le drapeau quand même
  // laisserait les bots coincés en priorité « Idle » pour toujours : la condition de nettoyage du tick
  // exige `lowNetApplied === true`, donc plus personne ne repasserait jamais. On garde le drapeau levé
  // et on réessaiera au tick suivant.
  const bots = known === undefined ? await pm2List() : known;
  if (!bots) { log('éco réseau : pm2 muet → priorités NON restaurées, nouvelle tentative au prochain tick'); return; }
  await setBotPriority(bots.map((b) => b.pid), 'Normal');
  cfg.lowNetApplied = false; saveCfg();
  log('faible usage internet OFF — priorités restaurées');
  updateTray();
};

// ---------- Import de bots (catégorie « importés ») ----------
// Confie un projet perso (lancé d'habitude à la main / via Visual Studio) à pm2 : il devient
// gérable comme les autres (auto boot, mode jeu, start/stop) et survit aux redémarrages (pm2 save).
// (`BAD_SHELL_RE` vit désormais dans validators.js, testé unitairement.)
// Provenance : seuls les chemins RÉELLEMENT choisis via un dialogue natif (importPick/importPickDir) sont
// exécutables. Un renderer compromis ne peut donc pas faire lancer un chemin ARBITRAIRE par pm2 — au pire il
// relancerait un script que l'utilisateur a lui-même sélectionné au dialogue pendant cette session.
const approvedScripts = new Set();

const importBot = async (name, script) => {
  // isSafeNewName (et pas isSafeName) : à la CRÉATION, un nom comme « -rf » serait lu par pm2 comme
  // une option et non comme un nom. isSafeName reste volontairement plus permissif ailleurs, car il
  // filtre aussi ce que pm2 renvoie déjà (durcir ferait disparaître des bots existants de la liste).
  if (!isSafeNewName(name)) return { ok: false, error: 'Nom invalide : lettres, chiffres, tirets, sans espace, et il doit commencer par une lettre ou un chiffre' };
  script = path.resolve(String(script || ''));
  if (!approvedScripts.has(script)) return { ok: false, error: 'Sélectionne le fichier via le bouton d\'import (chemin non approuvé)' };
  if (BAD_SHELL_RE.test(script)) return { ok: false, error: 'Chemin non pris en charge (caractères spéciaux)' };
  if (!/\.(js|mjs|cjs|py)$/i.test(script) || !fs.existsSync(script)) return { ok: false, error: 'Fichier introuvable (attendu : .js, .mjs, .cjs ou .py)' };
  const existing = await pm2List() || [];
  if (existing.some((b) => b.name.toLowerCase() === name.toLowerCase())) return { ok: false, error: `« ${name} » existe déjà dans pm2 — choisis un autre nom` };
  const dir = path.dirname(script);
  // Arguments BRUTS : en direct (node.exe) execFile les passe tels quels, et pour le repli cmd.exe
  // c'est quoteForShell qui cite et corrige le backslash final. Ne PAS citer ici : sans shell, les
  // guillemets deviendraient des caractères du chemin et l'import échouerait.
  const r = await pm2Raw(['start', script, '--name', name, '--cwd', dir]);
  if (!r.ok) { log('import ÉCHEC:', name, script, '—', r.out.slice(0, 400)); return { ok: false, error: 'pm2 a refusé le démarrage — vérifie le fichier (détails dans panel.log)' }; }
  await pm2(['save']); // survivra au redémarrage du PC (pm2 resurrect)
  if (!cfg.imported.includes(name)) cfg.imported.push(name);
  cfg.bots[name] = { auto: true, gameStop: false, ...(cfg.bots[name] || {}) };
  saveCfg();
  log('import OK:', name, '←', script);
  await refreshBots();
  return { ok: true };
};

const removeBot = async (name) => {
  if (!isSafeName(name) || !cfg.imported.includes(name)) return { ok: false, error: 'Seuls les bots importés peuvent être retirés ici' };
  await deleteTree(name); // arrête l'arbre (enfants orphelins compris) puis delete
  await pm2(['save']);
  cfg.imported = cfg.imported.filter((n) => n !== name);
  delete cfg.bots[name];
  cfg.stoppedByGame = cfg.stoppedByGame.filter((n) => n !== name);
  saveCfg();
  log('retrait:', name);
  await refreshBots();
  return { ok: true };
};

// ---------- Découverte de jeux installés (scan disque : 1×/JOUR max ou bouton « Scanner ») ----------
// Ne tourne JAMAIS en continu : la détection en jeu (tick) ne lit que la liste des process (léger) ;
// ce scan-ci parcourt les bibliothèques Steam/Epic pour PROPOSER des jeux absents de la liste.
let scanning = false;
const SCAN_MS = 24 * 3600 * 1000;

// Cherche l'exécutable principal d'un dossier de jeu : le plus gros .exe (≤2 niveaux),
// en ignorant crash handlers, désinstalleurs, anticheats et redistribuables.
const findMainExe = async (dir) => {
  const SKIPX = /unins|crash|setup|redist|vcredist|dxsetup|report|helper|easyanticheat|battleye|prereq|install/i;
  let best = null;
  const walk = async (d, depth) => {
    let ents; try { ents = await fsp.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents.slice(0, 400)) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (depth < 2 && !/redist/i.test(e.name)) await walk(p, depth + 1); }
      else if (/\.exe$/i.test(e.name) && !SKIPX.test(e.name)) {
        let st; try { st = await fsp.stat(p); } catch { continue; }
        if (!best || st.size > best.size) best = { exe: e.name, size: st.size };
      }
    }
  };
  await walk(dir, 0);
  return best ? best.exe : null;
};

const scanInstalledGames = async () => {
  const found = new Map(); // exe minuscule → { exe, name, source }
  const put = (exe, name, source) => { if (exe && EXE_RE.test(exe) && !found.has(exe.toLowerCase())) found.set(exe.toLowerCase(), { exe, name: String(name || '').slice(0, 60), source }); };

  // Epic Games : manifestes JSON précis (exe de lancement fourni).
  try {
    const mdir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';
    for (const f of (await fsp.readdir(mdir)).filter((x) => x.endsWith('.item')).slice(0, 200)) {
      try {
        const o = JSON.parse(await fsp.readFile(path.join(mdir, f), 'utf8'));
        if (o.LaunchExecutable && o.InstallLocation && fs.existsSync(path.join(o.InstallLocation, o.LaunchExecutable)))
          put(path.basename(o.LaunchExecutable), o.DisplayName, 'Epic Games');
      } catch {}
    }
  } catch {}

  // Steam : bibliothèques (libraryfolders.vdf) → appmanifest_*.acf → exe principal du dossier du jeu.
  try {
    const roots = ['C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam'].filter((r) => fs.existsSync(path.join(r, 'steamapps')));
    const libs = new Set(roots.map((r) => path.join(r, 'steamapps')));
    for (const r of roots) {
      try {
        const vdf = await fsp.readFile(path.join(r, 'steamapps', 'libraryfolders.vdf'), 'utf8');
        for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) {
          const p = path.join(m[1].replace(/\\\\/g, '\\'), 'steamapps');
          if (fs.existsSync(p)) libs.add(p);
        }
      } catch {}
    }
    for (const lib of [...libs].slice(0, 8)) {
      let acfs; try { acfs = (await fsp.readdir(lib)).filter((x) => x.startsWith('appmanifest_') && x.endsWith('.acf')).slice(0, 300); } catch { continue; }
      for (const f of acfs) {
        try {
          const t = await fsp.readFile(path.join(lib, f), 'utf8');
          const name = (t.match(/"name"\s+"([^"]+)"/) || [])[1] || '';
          const idir = (t.match(/"installdir"\s+"([^"]+)"/) || [])[1];
          if (!idir || /steamworks|redistributable|proton|runtime/i.test(name)) continue;
          const exe = await findMainExe(path.join(lib, 'common', idir));
          if (exe) put(exe, name, 'Steam');
        } catch {}
      }
    }
  } catch {}

  // On ne re-propose ni les jeux déjà listés, ni les suggestions écartées, ni nos propres bots.
  const known = new Set([...cfg.games, ...cfg.ignoredExes].map((x) => x.toLowerCase()));
  return [...found.values()].filter((g) => !known.has(g.exe.toLowerCase()));
};

const runScan = async () => {
  if (scanning) return { ok: false, error: 'Scan déjà en cours' };
  scanning = true;
  // Horodaté AVANT le scan : c'est ce qui garantit vraiment le « 1×/jour ». La date n'était posée
  // qu'en cas de SUCCÈS — un scan qui échoue laissait la condition des 24 h vraie, donc un parcours
  // disque complet (Steam + Epic, des milliers d'accès) repartait à CHAQUE tick, indéfiniment.
  cfg.lastScanAt = Date.now();
  saveCfg();
  try {
    cfg.discovered = (await scanInstalledGames()).slice(0, 40);
    saveCfg();
    log(`scan jeux : ${cfg.discovered.length} suggestion(s)`);
    return { ok: true, games: cfg.discovered };
  } catch (e) { log('scan', e.message); return { ok: false, error: e.message }; }
  finally { scanning = false; }
};

// ---------- Mode jeu ----------
const enterGameMode = async (game, known) => {
  // `known` = liste déjà lue par le tick juste avant : on évite un 2e `pm2 jlist` (spawn complet) pile
  // au lancement d'un jeu, c'est-à-dire au pire moment pour la fluidité.
  const list = known || await pm2List();
  if (!list) return; // pm2 muet : on ne coupe rien sur une lecture ratée (on réessaiera au tick suivant)
  const targets = list
    .filter((b) => b.status === 'online' && (cfg.gameMode.stopAll || cfg.bots[b.name]?.gameStop))
    .map((b) => b.name);
  if (!targets.length) { cfg.stoppedByGame = ['-']; saveCfg(); return; } // marqueur « déjà traité » sans cible
  targets.sort((a, b) => (a === 'saliox') - (b === 'saliox')); // saliox coupé EN DERNIER
  // Mémorisé AVANT de couper : l'arrêt prend plusieurs secondes (grâce + un pm2 stop par bot) et si le
  // panel meurt dans cet intervalle, rien sur le disque ne dit que ces bots ont été parqués — ils ne
  // seraient jamais relancés. On écrit d'abord, on coupe ensuite.
  cfg.stoppedByGame = targets;
  saveCfg();
  const pidByName = new Map(list.map((b) => [b.name, b.pid]));
  await stopBotsTree(targets.map((n) => ({ name: n, pid: pidByName.get(n) || 0 }))); // 1 snapshot + 1 grâce pour tous
  log('mode jeu ON —', game, '— coupés :', targets.join(', '));
  updateTray();
};

const exitGameMode = async () => {
  const names = cfg.stoppedByGame.filter((n) => n !== '-' && isSafeName(n)); // '-' = marqueur « rien à couper »
  names.sort((a, b) => (b === 'saliox') - (a === 'saliox')); // saliox relancé en premier
  for (const n of names) await pm2(['start', n]);
  // La liste est vidée dans TOUS les cas, même en cas d'échec. Y garder des noms serait pire que le
  // mal : ça bloquerait en permanence l'application des MAJ et le `pm2 save` (qui abandonne au bout
  // de 20 reports, donc le dump de reboot pourrit), ça exclurait ces bots du bandeau « à remettre en
  // ordre », et exitGameMode se rappellerait à chaque tick — un spawn pm2 par tick, indéfiniment.
  cfg.stoppedByGame = [];
  saveCfg();
  // On republie l'état AVANT que le tick n'en tire des conclusions : sans ça, la suite du tick
  // travaillait sur la lecture pm2 faite au DÉBUT, quand ces bots étaient encore arrêtés — d'où une
  // fausse alerte « N bots devraient être en ligne » et une pastille rouge dans la zone de
  // notification après CHAQUE partie.
  await refreshBots();
  const enLigne = new Set(statusCache.bots.filter((b) => b.status === 'online').map((b) => b.name));
  const perdus = names.filter((n) => !enLigne.has(n));
  log('mode jeu OFF — relancés :', names.join(', ') || '(aucun)',
    perdus.length ? `— ÉCHEC de relance : ${perdus.join(', ')}` : '');
  if (perdus.length) {
    // Un bot que le mode jeu a coupé et n'a pas su rallumer, c'est exactement le silence que ce
    // panel existe pour supprimer (cas réel : le démon pm2 redémarre pendant la partie et perd la
    // définition du process).
    queueAlert('⚠️ Bots non relancés après la partie',
      `Le mode jeu n'a pas réussi à redémarrer : **${perdus.join(', ')}**. Utilise « Remettre en ordre » ou vérifie leur dossier.`,
      0xED4245);
  }
  updateTray();
  return perdus.length === 0; // l'appelant en a besoin : un `pm2 save` après un échec grave « bots éteints »
};

// ---------- Boucle de surveillance ----------
let tickRunning = false;
const tick = async () => {
  // Fermeture en cours : ne RIEN entreprendre. Sans ça, un tick pouvait lancer une coupure de mode
  // jeu (`pm2 stop`) pendant que le nettoyage lançait la relance (`pm2 start`) — état final
  // indéterminé, et `cfg.stoppedByGame` (le seul enregistrement disque, écrit AVANT la coupure
  // justement pour survivre à une mort du panel) effacé au passage.
  if (quitting) return;
  if (tickRunning) return; // un tick est déjà en cours (ex. restartPoll(true) au show pendant un tick lent) → évite un double fan-out de spawns
  tickRunning = true;
  try {
  // La détection de jeu (tasklist, ~400 ms + un process lancé) ne sert QU'À deux choses : déclencher le
  // mode jeu et l'éco réseau. Si les deux sont coupés ET que personne ne regarde l'écran (panel dans la
  // zone de notification), on saute complètement ce scan : c'est le plus gros coût du tick au repos.
  // Dès qu'on rouvre la fenêtre, restartPoll(true) relance un tick immédiat qui rescanne.
  //
  // …MAIS deux autres décisions lisent `statusCache.game` pour NE PAS déranger pendant une partie :
  // l'application automatique des mises à jour (updateBlockers) et le scan disque quotidien. Avec la
  // configuration d'usine (mode jeu désactivé), on sautait le scan de process, `statusCache.game`
  // était forcé à null, et ces deux-là se croyaient donc « hors partie » : un parcours complet des
  // bibliothèques Steam/Epic — des milliers d'accès disque — pouvait démarrer en plein match, et la
  // MAJ s'appliquer au même moment. On lit donc aussi quand l'une de ces décisions est imminente.
  const scanDu = cfg.scanAuto !== false && Date.now() - (cfg.lastScanAt || 0) > SCAN_MS;
  const needProcScan = cfg.gameMode.enabled || cfg.lowNet || cfg.lowNetApplied || cfg.stoppedByGame.length > 0
    || isWindowVisible()
    || (updateReady && cfg.autoApplyUpdates !== false)
    || scanDu
    // …et quand une RELANCE est due. Sans ce terme, le scan était sauté en configuration d'usine
    // (mode jeu désactivé, panel dans la zone de notification), `gameUnknown` restait collé à vrai,
    // et runAutoHeal sortait sur sa garde à chaque tick : la relance automatique ne s'exécutait
    // JAMAIS dans son seul mode d'usage réel, tout en s'affichant « activée ». Elle ne marchait que
    // fenêtre ouverte, c'est-à-dire précisément quand elle ne sert à rien.
    || (cfg.autoHeal !== false && healPending(Date.now(), healState));
  // Les deux lectures les plus chères du tick — tasklist (~437 ms) et pm2 jlist (~457 ms) — étaient
  // SÉQUENTIELLES : ~900 ms avant que la liste des bots existe, à chaque tick et surtout au démarrage,
  // où c'est exactement le temps pendant lequel la fenêtre paraît vide. Elles sont indépendantes,
  // donc menées de front : ~460 ms au lieu de ~900, sans rien changer au comportement.
  const [procs, freshBots] = await Promise.all([
    needProcScan ? listProcs() : Promise.resolve(null),
    pm2List(),
  ]);
  // « On n'a pas regardé » et « on a regardé, pas de jeu » ne sont pas la même chose : sans ce
  // drapeau, un échec de tasklist passait pour une absence de jeu. Il est dérivé de `procs`, pas de
  // `needProcScan`, précisément pour couvrir ce cas.
  if (!procs !== gameUnknown) { gameUnknown = !procs; gameUnknownSince = Date.now(); }
  if (!needProcScan) {
    // Rien ne rafraîchit ces états quand on saute le scan : on les remet à zéro au lieu de les laisser
    // périmés. `sessionOnline` en particulier restait collé à `true` — au prochain jeu lancé, même SOLO,
    // la sonde « partie en ligne » était sautée (condition `gameRunning && !sessionOnline`) et le mode
    // jeu coupait les bots malgré l'option « ignorer les jeux solo ».
    statusCache.game = null; sessionOnline = false; statusCache.online = false;
  }
  // UNE seule lecture pm2 par tick (lancée ci-dessus, en parallèle du scan de process) : elle sert et
  // à la bascule du mode jeu et à l'affichage. Avant, un lancement de jeu déclenchait deux
  // `pm2 jlist` coup sur coup (tick + enterGameMode).
  if (freshBots) {
    // Les débits mesurés vivent sur ces objets, et measureNet ne les repose plus qu'un tick sur
    // trois : remplacer le tableau les effaçait donc deux ticks sur trois, et l'écran affichait
    // « ↓ 0 o/s » en clignotant. On les reporte, à PID identique et non nul (après un stop, pm2
    // renvoie pid:0 et tous les bots arrêtés partageraient la même clé).
    const avant = new Map(statusCache.bots.filter((b) => b.pid > 0).map((b) => [b.name, b]));
    for (const b of freshBots) {
      const p = avant.get(b.name);
      if (p && p.pid === b.pid) { b.netDown = p.netDown; b.netUp = p.netUp; }
    }
    statusCache.bots = freshBots; // pm2 muet → on garde le dernier état connu
  }
  if (procs) {
    const hit = cfg.games.find((g) => procs.names.has(g.toLowerCase()));
    const now = Date.now();
    if (hit) { lastGameSeen = hit; lastGameAt = now; }
    const gameRunning = !!hit;
    statusCache.game = gameRunning ? lastGameSeen : null;
    const graceOver = (now - lastGameAt) > cfg.gameMode.graceSec * 1000;

    // Session EN LIGNE ? (jeu solo → on ne coupe rien). Revérifié à chaque tick tant que le jeu
    // tourne sans être « en ligne » : lancer GTA en histoire puis passer en Online déclenche bien.
    if (gameRunning && !sessionOnline) {
      sessionOnline = cfg.gameMode.soloSkip === false ? true : await hasOnlineActivity(procs.pids.get(hit.toLowerCase()) || []);
    } else if (!gameRunning && graceOver) sessionOnline = false;
    statusCache.online = gameRunning && sessionOnline;

    await withGameLock(async () => {
      try {
        if (cfg.gameMode.enabled && gameRunning && sessionOnline && cfg.stoppedByGame.length === 0) {
          await enterGameMode(hit, freshBots); // réutilise la lecture pm2 de CE tick (fraîche, pas le cache)
        } else if (cfg.stoppedByGame.length > 0 && !gameRunning && graceOver) {
          await exitGameMode(); // couvre aussi la reprise après crash/redémarrage du panel
        } else if (cfg.stoppedByGame.length > 0 && !cfg.gameMode.enabled) {
          await exitGameMode(); // mode jeu désactivé pendant une partie → relance les bots sans attendre la fin du jeu (self-heal)
        }
        // Faible usage internet : indépendant du mode jeu (utile pour les bots qu'on laisse tourner).
        if (cfg.lowNet && gameRunning && sessionOnline && !cfg.lowNetApplied) {
          await applyLowNet(hit, freshBots); // réutilise la lecture pm2 de ce tick
        } else if (cfg.lowNetApplied && (!cfg.lowNet || (!gameRunning && graceOver))) {
          await clearLowNet(freshBots); // réutilise la lecture pm2 de ce tick ; couvre aussi la reprise après crash du panel
        }
      } catch (e) { log('tick', e.message); }
    });
  }
  // (la lecture pm2 de ce tick a déjà été faite plus haut — une seule par tick)
  // Débit réseau = affichage UI UNIQUEMENT (aucune logique n'en dépend) → on ne le mesure QUE si la
  // fenêtre est visible. En tray ça épargne un spawn PowerShell/CIM par tick = moins de CPU/batterie.
  // …et même fenêtre ouverte, seulement UN TICK SUR TROIS : ce relevé coûte 247 ms de PowerShell
  // (mesuré) pour deux chiffres purement décoratifs. Rafraîchis toutes les ~30 s au lieu de 10 s ils
  // restent parfaitement lisibles, et on économise deux spawns sur trois.
  if (isWindowVisible() && (netTick++ % 3) === 0) await measureNet().catch(() => {});
  if (pm2Health.ok) {
    // L'ordre compte : le suivi des arrêts volontaires tourne TOUJOURS (c'est de l'auto-démarrage),
    // les notifications seulement si elles sont activées. `prevStatus` est mis à jour ici, en UN seul
    // endroit — avant il l'était sur cinq chemins différents à l'intérieur de checkAlerts.
    const prev = prevStatus;
    const suivant = snapshotOf(statusCache.bots);
    if (!alertsPrimed) { prevStatus = suivant; alertsPrimed = true; } // 1er tick : amorçage silencieux
    else {
      let held = new Set();
      try { held = applyTransitions(statusCache.bots, prev) || new Set(); }
      catch (e) { log('applyTransitions', e.message); }
      // Pour un bot dans un statut de PASSAGE, on garde l'ancien instantané : sinon 'online' est
      // remplacé par 'stopping' et la transition réelle (l'arrêt volontaire) devient indétectable.
      for (const n of held) { const p = prev.get(n); if (p) suivant.set(n, p); }
      prevStatus = suivant;
    }
  } else alertPm2Down(); // pm2 lui-même muet = TOUS les bots en danger, il faut le dire
  // Réparer avant d'informer n'aurait pas de sens (l'alerte doit partir même si la relance marche),
  // mais réparer AVANT de publier l'état, si : le tray et l'écran montrent alors le résultat réel.
  await runAutoHeal().catch((e) => log('runAutoHeal', e.message));
  maybeAutoApplyUpdate(); // s'installe tout seul dès que c'est sans risque (plus besoin de fermer le panel à la main)
  statusCache.updatedAt = Date.now();
  firstTickDone = true;
  // La fenêtre s'ouvre AVANT la fin du premier tick et ne se rafraîchissait qu'à son sondage de 3 s :
  // au démarrage, la liste des bots pouvait donc rester vide plusieurs secondes après qu'elle était
  // connue. On prévient l'écran dès que l'état change, il n'attend plus son tour.
  try { if (win && !win.isDestroyed() && isWindowVisible()) win.webContents.send('status-changed'); } catch {}
  updateTray();
  updateRpc(); // met à jour la Rich Presence Discord (« gère X bots en ligne »)

  // Découverte auto : au plus 1×/jour, jamais pendant une partie (le scan disque attendra).
  // `!gameUnknown` : un parcours disque complet (des milliers d'accès) ne part que si on SAIT
  // qu'aucun jeu ne tourne — pas simplement parce qu'on n'a pas regardé.
  if (cfg.scanAuto !== false && !statusCache.game && !gameUnknown && Date.now() - (cfg.lastScanAt || 0) > SCAN_MS) {
    runScan().catch(() => {});
  }
  } finally { tickRunning = false; }
};

// ---------- Application au démarrage de Windows ----------
const bootEnforce = async () => {
  let list = await pm2List() || [];
  if (!list.length) { // le .cmd « pm2 resurrect » de la Startup n'est peut-être pas encore passé
    // Boot lent : au lieu d'abandonner après un seul délai de 5 s, on réessaie resurrect + relecture
    // plusieurs fois avec des délais croissants (~40 s cumulés) jusqu'à voir des process.
    const delays = [3000, 5000, 8000, 12000, 12000];
    for (let i = 0; i < delays.length && !list.length; i++) {
      await pm2(['resurrect']);
      await new Promise((r) => setTimeout(r, delays[i]));
      list = await pm2List() || [];
    }
    if (!list.length) log('bootEnforce: aucun process pm2 après plusieurs resurrect — auto-démarrage abandonné pour cette session');
  }
  for (const b of list) {
    const c = cfg.bots[b.name];
    if (!c) continue;
    if (c.auto === false && b.status === 'online') { await stopTree(b.name); log('boot: stop', b.name, '(auto off)'); }
    else if (c.auto !== false && b.status !== 'online') {
      // Ne PAS ressusciter un bot que le mode jeu vient de couper (jeu déjà lancé au logon → tick a rempli
      // stoppedByGame avant ce bootEnforce à +8s) : sinon on relance ce que le mode jeu a intentionnellement stoppé.
      if (cfg.stoppedByGame.includes(b.name)) { log('boot: skip', b.name, '(coupé par le mode jeu)'); continue; }
      // Ni un bot que TU as arrêté toi-même depuis le panel : « Auto boot » veut dire « rallumé au
      // démarrage du PC », pas « impossible à laisser éteint ». Avant, chaque relance du panel (y compris
      // après une mise à jour auto) rallumait tout seul les bots volontairement arrêtés.
      if (c.manualStop) { log('boot: skip', b.name, '(arrêté manuellement)'); continue; }
      await pm2(['start', b.name]); log('boot: start', b.name);
    }
  }
};

// ---------- Lancement auto du panel ----------
// Windows 11 RETARDE les apps de la clé Run (~11 min après le logon) → sur une install neuve le panel
// « ne se lance pas » au démarrage. On neutralise ce délai via la clé HKCU StartupDelayInMSec=0 (SANS
// admin, réversible). Best-effort : si l'écriture échoue, la clé Run lance le panel quand même (retardé).
// NB : on N'utilise PAS de tâche planifiée — Register-ScheduledTask exige l'admin sur des postes durcis
// (testé : « Accès refusé » même pour créer une tâche utilisateur) → inadapté à un lancement en fond.
const REG_SERIALIZE = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize';
const disableStartupDelay = () => {
  if (process.platform !== 'win32' || !app.isPackaged) return;
  execFile(SYS('reg.exe'), ['add', REG_SERIALIZE, '/v', 'StartupDelayInMSec', '/t', 'REG_DWORD', '/d', '0', '/f'],
    { windowsHide: true, timeout: 10000 }, (err) => { if (err) log('startupDelay', err.message); });
};
// Retire notre tweak quand l'auto-démarrage est désactivé : StartupDelayInMSec est GLOBAL (tous les apps
// de démarrage) → on ne le laisse pas traîner après un « désactiver ». reg delete restaure le défaut Windows.
const restoreStartupDelay = () => {
  if (process.platform !== 'win32' || !app.isPackaged) return;
  execFile(SYS('reg.exe'), ['delete', REG_SERIALIZE, '/v', 'StartupDelayInMSec', '/f'],
    { windowsHide: true, timeout: 10000 }, () => {});
};

// Un seul chemin, celui de `reconcilerLanceurs` : écrire, purger et remettre l'écran d'accord se
// décident ensemble, sur la même lecture du registre. Les faire séparément était précisément le bug —
// l'interrupteur touchait une entrée pendant que deux autres continuaient de lancer le panel.
// `fromToggle` : l'utilisateur vient de cliquer, son choix l'emporte sur ce que dit le système.
const applyAutoLaunch = (fromToggle = false) => {
  if (!app.isPackaged) return; // en dev, ne pas enregistrer electron.exe
  reconcilerLanceurs(fromToggle ? !!cfg.autoLaunch : null);
};

// ---------- Rich Presence Discord ----------
// Affiche sur ton profil Discord « 🤖 Gère X bots en ligne » (+ état mode jeu).
// Application Discord du panel, utilisée PAR DÉFAUT : la Rich Presence marche donc immédiatement,
// sans rien coller dans les réglages — y compris chez un ami qui installe le panel.
// Un « Application ID » Discord est un identifiant PUBLIC (il transite dans chaque payload de présence
// et est visible par tous) : rien de sensible ici, contrairement au secret client ou à un token de bot.
// Reste surchargeable : réglage du panel, ou variable d'env HASU_DISCORD_APP_ID (pour ta propre appli).
const DEFAULT_DISCORD_APP_ID = '889167252790857788';
let rpcStart = Date.now(), lastRpc = '';
const rpcAppId = () => (process.env.HASU_DISCORD_APP_ID || cfg.discordAppId || DEFAULT_DISCORD_APP_ID).trim();
const startRpc = () => {
  const id = rpcAppId();
  if (cfg.discordRpc !== false && id) { rpc.start(id); updateRpc(true); } else rpc.stop();
};
const updateRpc = (force) => {
  if (cfg.discordRpc === false || !rpcAppId()) return;
  const online = statusCache.bots.filter((b) => b.status === 'online').length;
  const total = statusCache.bots.length;
  const stopped = cfg.stoppedByGame.filter((n) => n !== '-').length;
  const details = `🤖 Gère ${online} bot${online === 1 ? '' : 's'} en ligne`;
  const state = statusCache.game
    ? `🎮 ${statusCache.game}${stopped ? ` · ${stopped} en pause` : ''}`
    : (total ? `${total} bot${total === 1 ? '' : 's'} supervisé${total === 1 ? '' : 's'}` : 'En veille');
  const sig = `${details}|${state}`;
  if (!force && sig === lastRpc) return; // rien de neuf → on ne re-pousse pas (anti-spam Discord)
  lastRpc = sig;
  rpc.set({
    details, state,
    timestamps: { start: rpcStart },
    // Logo affiché dans la Rich Presence (image hébergée = icon.png du dépôt public). Discord résout l'URL.
    assets: { large_image: 'https://raw.githubusercontent.com/saliox/hasu-panel/main/icon.png', large_text: 'Hasu Panel' },
    instance: false,
  });
};

// ---------- Tray ----------
let trayBad = false, lastMenuSig = '', lastTip = '';
const trayIcon = (bad) => {
  const p = path.join(__dirname, bad ? 'icon-alert.png' : 'icon.png');
  try {
    let img = nativeImage.createFromPath(p);
    if (img.isEmpty() && bad) img = nativeImage.createFromPath(path.join(__dirname, 'icon.png')); // pas d'icône d'alerte → icône normale
    if (!img.isEmpty()) return img.resize({ width: 16, height: 16 });
  } catch {}
  return nativeImage.createEmpty();
};

const updateTray = () => {
  if (!tray) return;
  const stopped = cfg.stoppedByGame.filter((n) => n !== '-');
  // Pastille rouge sur l'icône quand quelque chose ne va pas (bot à relancer ou pm2 muet) : visible
  // d'un coup d'œil dans la barre des tâches, sans ouvrir le panel.
  try {
    const bad = !pm2Health.ok || needFix().length > 0;
    if (bad !== trayBad) { trayBad = bad; tray.setImage(trayIcon(bad)); }
  } catch {}
  const tip = statusCache.game
    ? `Hasu Panel — 🎮 ${statusCache.game}${statusCache.online ? t('tray.online') : t('tray.solo')}`
      + `${stopped.length ? t('tray.cut', { n: stopped.length }) : ''}${cfg.lowNetApplied ? t('tray.low') : ''}`
    : t('tray.tipBots', { on: statusCache.bots.filter((b) => b.status === 'online').length, total: statusCache.bots.length });
  if (tip !== lastTip) { lastTip = tip; tray.setToolTip(tip); } // même garde que le menu : pas d'appel natif inutile
  // Le menu du tray ne change QUE si son contenu change (mode jeu, MAJ prête). Avant, on reconstruisait
  // un Menu natif à CHAQUE tick (toutes les 10-30 s, 24h/24) pour un résultat identique — travail inutile
  // côté Windows, et ça pouvait refermer le menu sous le curseur pile au moment où tu cliquais.
  const menuSig = `${cfg.gameMode.enabled}|${updateReady}|${cfg.lang}`; // la langue en fait partie : sinon le menu resterait en français
  if (menuSig === lastMenuSig) return;
  lastMenuSig = menuSig;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: t('tray.open'), click: () => showWindow() },
    {
      label: t('tray.game', { v: cfg.gameMode.enabled ? t('tray.on') : t('tray.off') }),
      click: async () => { cfg.gameMode.enabled = !cfg.gameMode.enabled; saveCfg(); if (!cfg.gameMode.enabled && cfg.stoppedByGame.length) await withGameLock(exitGameMode); updateTray(); }
    },
    ...(updateReady ? [{ label: t('tray.update'), click: () => { try { require('electron-updater').autoUpdater.quitAndInstall(); } catch {} } }] : []),
    { type: 'separator' },
    { label: t('tray.quit'), click: () => {
      // Trace horodatee : sans elle, un « Quitter qui ne marche pas » ne laissait AUCUNE preuve que le
      // clic etait meme arrive jusqu'ici — impossible de savoir si le bug etait dans le menu ou apres.
      log('Quitter demande depuis la zone de notification');
      quitting = true;
      // Garde-fou ultime : si le nettoyage de `before-quit` se bloquait avant meme darmer son propre
      // delai, rien ne terminerait le processus et licone de la zone de notification resterait la,
      // sans fenetre — exactement le « Quitter qui ne marche pas ».
      // 25 s : le nettoyage dispose de 6 s d'apaisement + 12 s de travail. À 15 s, ce repli le coupait
      // en pleine relance de bots — il doit rester le dernier recours, pas un concurrent.
      setTimeout(() => { log('Quitter : sortie forcee (le nettoyage na pas rendu la main)'); app.exit(0); }, 25000);
      app.quit();
    } } // le nettoyage passe par before-quit (restaure les bots + drapeaux)
  ]));
};


// ---------- Un seul lanceur, une seule installation ----------
// PROBLÈME CONSTATÉ sur la machine : trois lanceurs au démarrage pour une seule application — deux
// valeurs dans la clé Run et une tâche planifiée « HasuPanel » créée par une version depuis longtemps
// retirée du code. Les deux valeurs viennent de ce qu'on laissait Electron NOMMER la nôtre : ce nom
// suit `app.getName()` aujourd'hui et suivait l'AppUserModelId hier, donc il a dérivé deux fois, sans
// jamais nettoyer derrière lui. L'interrupteur ne pilotait que la dernière : le désactiver ne
// désactivait rien de visible. C'est le « ça ne marche pas vraiment » signalé.
//
// On ne demande donc plus à Electron de gérer ça. Un nom constant (`LOGIN_ITEM`), écrit et relu par
// nous : le nom ne peut plus dériver, et « laquelle est la nôtre » n'est plus une devinette.
const REG_RUN = String.raw`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`;
const REG_APPROVED = String.raw`HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run`;
// Renvoie null quand la lecture a ÉCHOUÉ, '' quand la clé est vide OU légitimement absente : confondre
// faisait conclure « plus aucune entrée de démarrage » sur un simple échec passager, ce qui coupait
// le démarrage automatique de l'utilisateur et enregistrait ce choix qu'il n'avait pas fait.
// `absentPossible` : cette clé peut légitimement ne pas exister — c'est le cas de StartupApproved, créée
// au premier « désactiver » de Gestionnaire des tâches. La clé Run, elle, existe toujours : une erreur y
// est une VRAIE erreur. On ne lit surtout PAS le message d'erreur pour trancher : reg.exe l'écrit dans la
// page de codes OEM et il est traduit — la règle changerait avec la langue de Windows.
const regLire = (cle, absentPossible = false) => new Promise((res) => {
  execFile(SYS('reg.exe'), ['query', cle], { windowsHide: true, timeout: 10000 }, (err, out) => {
    if (!err) return res(out);
    res(absentPossible ? '' : null); // null = « je n'ai pas pu lire » → l'appelant ne décide rien
  });
});
const regEcrire = (nom, data) => new Promise((res) => {
  execFile(SYS('reg.exe'), ['add', REG_RUN, '/v', nom, '/t', 'REG_SZ', '/d', data, '/f'],
    { windowsHide: true, timeout: 10000 }, (err) => res(!err));
});
const regSupprimer = (cle, nom) => new Promise((res) => {
  execFile(SYS('reg.exe'), ['delete', cle, '/v', nom, '/f'], { windowsHide: true, timeout: 10000 }, (err) => res(!err));
});
// Gestionnaire des tâches > Démarrage garde son « désactivé » ICI, à côté de la valeur Run et indexé
// sur son nom. C'est LA raison pour laquelle l'interrupteur ne marchait pas : le panel posait bien la
// valeur, Windows la laissait désactivée, et l'écran affichait « activé ». Poser une valeur ne suffit
// donc pas — quand l'utilisateur demande explicitement le démarrage auto, il faut aussi lever ce
// drapeau. On n'y touche QUE pour notre propre entrée, et uniquement sur un clic.
const ACTIVE = '020000000000000000000000'; // 4 octets d'état + 8 d'horodatage, format attendu par Windows
const regAutoriserDemarrage = (nom) => new Promise((res) => {
  execFile(SYS('reg.exe'), ['add', REG_APPROVED, '/v', nom, '/t', 'REG_BINARY', '/d', ACTIVE, '/f'],
    { windowsHide: true, timeout: 10000 }, (err) => res(!err));
});

// Un seul point d'entrée pour tout ce qui touche au démarrage automatique : lecture du registre,
// écriture, purge et remise en accord de l'écran. Sérialisé, car deux passes concurrentes (démarrage
// + bascule de l'interrupteur) écrivaient et effaçaient la même valeur en même temps.
let reconcileEnCours = null;
const reconcilerLanceurs = (forcer = null) => {
  if (process.platform !== 'win32' || !app.isPackaged) return Promise.resolve();
  if (reconcileEnCours) return reconcileEnCours.then(() => reconcilerLanceurs(forcer));
  reconcileEnCours = (async () => {
    const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
    if (forcer !== null) { cfg.autoLaunch = !!forcer; cfg.autoLaunchInit = true; saveCfg(); }
    const [runOut, approvedOut] = await Promise.all([regLire(REG_RUN), regLire(REG_APPROVED, true)]);
    if (runOut === null || approvedOut === null) {
      log('démarrage auto : registre illisible pour le moment → on ne décide rien (aucune entrée touchée)');
      return; // ne jamais purger ni couper le démarrage sur une lecture ratée
    }
    // Sur une bascule explicite, le réglage l'emporte : pas de « l'OS fait foi », c'est l'utilisateur
    // qui vient de cliquer. Sinon on lit ce que le registre raconte vraiment.
    const plan = forcer !== null
      // Pas de `drapeauxMorts` ici, VOLONTAIREMENT : sur un « activer » on vient d'écrire le drapeau
      // « autorisé » pour notre entrée, et le ménage l'effacerait dans la foulée. Ces drapeaux orphelins
      // sont nettoyés au démarrage suivant, où aucune écriture ne les précède.
      ? { nom: LOGIN_ITEM, ecrire: !!forcer, autoLaunch: !!forcer,
          supprimer: planLanceurs({ runOut, approvedOut, exe }).supprimer.concat(forcer ? [] : [LOGIN_ITEM]) }
      // `=== true` et non la valeur brute : une config d'avant cette version n'a pas ce champ, et un
      // `undefined` déclencherait la valeur par défaut du paramètre — le plan croirait alors que
      // l'utilisateur a retiré son entrée de démarrage, sur une installation NEUVE qui n'en a jamais eu.
      : planLanceurs({ runOut, approvedOut, exe, autoLaunch: cfg.autoLaunch, autoLaunchInit: cfg.autoLaunchInit === true });

    // La tâche planifiée orpheline : plus aucun code ne la crée ni ne la pilote, elle lançait juste
    // le panel une fois de plus. Traité EN PREMIER car c'est indépendant du reste : le repli de
    // sécurité plus bas (« on ne purge pas à l'aveugle ») sautait aussi ce ménage-là.
    execFile(SYS('schtasks.exe'), ['/Query', '/TN', 'HasuPanel'], { windowsHide: true, timeout: 10000 }, (err) => {
      if (err) return; // absente : rien à faire
      execFile(SYS('schtasks.exe'), ['/Delete', '/TN', 'HasuPanel', '/F'], { windowsHide: true, timeout: 10000 }, (e2) => {
        log(e2 ? 'tâche planifiée orpheline : suppression impossible — ' + e2.message
              : 'tâche planifiée orpheline supprimée (elle lançait le panel en double au démarrage)');
      });
    });

    // TOUJOURS écrire avant de purger : l'inverse laisse une fenêtre où plus aucun lanceur n'existe.
    if (plan.ecrire) {
      const ok = await regEcrire(plan.nom, `"${exe}" --hidden --startup`);
      log(ok ? `démarrage auto : entrée « ${plan.nom} » posée` : `démarrage auto : écriture de « ${plan.nom} » IMPOSSIBLE`);
      if (!ok) return; // on ne purge pas à l'aveugle : mieux vaut un doublon qu'aucun lanceur
    }
    // Clic explicite sur « activer » : on lève aussi le « désactivé » de Gestionnaire des tâches, sans
    // quoi l'interrupteur reste décoratif — c'est exactement le bug signalé.
    if (forcer === true) {
      const ok = await regAutoriserDemarrage(plan.nom);
      if (!ok) log('démarrage auto : le drapeau « autorisé » de Windows n\'a pas pu être posé');
    }
    for (const nom of plan.supprimer) {
      const ok = await regSupprimer(REG_RUN, nom);
      // Deux situations très différentes derrière la même suppression : retirer NOTRE entrée parce que
      // l'utilisateur vient de couper l'interrupteur, ou retirer une orpheline héritée d'un ancien nom.
      // Le message disait « en double » dans les deux cas — trompeur au point de faire croire à un bug.
      const sien = nom === plan.nom;
      log(ok ? (sien ? `démarrage auto : entrée « ${nom} » retirée (interrupteur sur « désactivé »)`
                     : `entrée de démarrage en double supprimée : « ${nom} »`)
             : `entrée de démarrage « ${nom} » : suppression impossible`);
      // Le « désactivé » de l'ancienne entrée n'a plus d'objet : sans ça, Gestionnaire des tâches
      // garde une ligne fantôme, et le drapeau resservirait si le nom réapparaissait un jour.
      if (ok) await regSupprimer(REG_APPROVED, nom);
    }
    // Drapeaux « désactivé » restés seuls, sans valeur Run : ils n'ont plus d'objet et laissent une
    // ligne fantôme dans Gestionnaire des tâches. Ceux-là datent des versions qui supprimaient la
    // valeur sans son drapeau.
    for (const nom of (plan.drapeauxMorts || [])) {
      if (await regSupprimer(REG_APPROVED, nom)) log(`drapeau de démarrage orphelin nettoyé : « ${nom} »`);
    }
    if (plan.autoLaunch !== cfg.autoLaunch) {
      log(`démarrage auto : l'état réel du système est « ${plan.autoLaunch ? 'activé' : 'désactivé'} » → l'écran s'aligne`);
      cfg.autoLaunch = plan.autoLaunch;
    }
    if (!cfg.autoLaunchInit) cfg.autoLaunchInit = true;
    saveCfg();
    if (cfg.autoLaunch) disableStartupDelay(); else restoreStartupDelay();
  })().catch((e) => log('démarrage auto : réconciliation échouée —', e.message))
    .finally(() => { reconcileEnCours = null; });
  return reconcileEnCours;
};

// Une seconde installation du panel sur le même PC se lance au démarrage, se met à jour de son côté
// et tient sa propre config : deux panels qui pilotent les mêmes bots. Le verrou d'instance unique
// empêche qu'ils TOURNENT ensemble, mais pas qu'ils existent — et c'est alors la loterie de savoir
// lequel démarre. On ne peut pas désinstaller à la place de l'utilisateur : on le lui dit, avec le
// chemin exact, une seule fois par démarrage.
let secondeInstall = '';
const detecterSecondeInstallation = async () => {
  if (process.platform !== 'win32' || !app.isPackaged) return;
  // La clé Run est la MEILLEURE source : une copie décompressée à la main quelque part sur le disque
  // et inscrite au démarrage y figure littéralement, alors qu'aucune liste de chemins ne l'aurait
  // devinée. On la lit ici plutôt que de jeter cette preuve.
  const depuisRegistre = [];
  try {
    const runOut = await regLire(REG_RUN);
    for (const v of parseRegQuery(runOut || '')) {
      const m = String(v.data || '').match(/([A-Za-z]:[\\/][^"]*?HasuPanel\.exe)/i);
      if (m) depuisRegistre.push(m[1]);
    }
  } catch { /* registre illisible : on se rabat sur les chemins connus */ }
  const candidats = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'hasu-panel', 'HasuPanel.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'HasuPanel', 'HasuPanel.exe'),
    path.join(process.env.ProgramFiles || '', 'HasuPanel', 'HasuPanel.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'HasuPanel', 'HasuPanel.exe'),
    ...depuisRegistre,
  ].filter((p) => { try { return fs.existsSync(p); } catch { return false; } });
  const autres = autresInstallations(candidats, process.execPath);
  if (!autres.length) return;
  secondeInstall = autres[0];
  log('DEUXIÈME INSTALLATION détectée :', autres.join(', '), '— celle qui tourne :', process.execPath);
  // L'alerte sort de la machine (webhook Discord) : on masque le nom de session Windows, comme partout
  // ailleurs dans le panel. Le chemin complet reste dans le journal local et dans le bandeau.
  // Seul émetteur qui ignorait l'interrupteur des alertes, et sans aucune mémoire : toast + webhook
  // à CHAQUE démarrage, sans moyen de l'arrêter. On ne réalerte que si le chemin CHANGE.
  if (cfg.alerts === false) return;
  const signature = autres.join('|');
  if (cfg.dualWarnedFor === signature) return;
  cfg.dualWarnedFor = signature; saveCfg();
  const affiche = autres.map((p) => masquer(p)).join('`\n`');
  setTimeout(() => queueAlert('⚠️ Deux installations du panel',
    `Une autre installation existe sur ce PC :\n\`${affiche}\`\nLes deux se lancent au démarrage et se mettent à jour chacune de leur côté. Désinstalle celle dont tu ne veux pas (Paramètres → Applications).`,
    0xFAA61A), 0);
};
// ---------- Fenêtre ----------
const WIN_MIN_W = 1000, WIN_MIN_H = 680; // source unique : bornes minimales de la fenêtre

// Taille d'ouverture : 1020x760 en dur, c'était minuscule sur un grand écran (et immense sur un petit
// portable). On dimensionne donc d'après l'écran RÉEL : ~82 % de la zone de travail (barre des tâches
// exclue), borné pour rester lisible. Si tu redimensionnes/déplaces la fenêtre, on retient ton choix.
const defaultBounds = () => {
  try {
    // Calcul dans logic.js (testé : petits écrans, 4K, écran secondaire, débordement).
    return computeDefaultBounds(screen.getPrimaryDisplay().workArea, { w: WIN_MIN_W, h: WIN_MIN_H });
  } catch { return { width: 1280, height: 860 }; }
};
// Des bornes mémorisées ne sont réutilisées que si elles restent VISIBLES sur un écran actuellement
// branché (sinon la fenêtre s'ouvrirait hors champ après avoir débranché un second moniteur).
const savedBounds = () => {
  const b = cfg.winBounds;
  // Seuils alignés sur minWidth/minHeight de la fenêtre (900x600) : ils divergeaient (860x560),
  // donc des bornes mémorisées trop petites étaient acceptées puis silencieusement corrigées par Electron.
  if (!b || !Number.isFinite(b.width) || !Number.isFinite(b.height) || b.width < WIN_MIN_W || b.height < WIN_MIN_H) return null;
  // Test de visibilité dans logic.js (testé : moniteur débranché, fenêtre à cheval, écran absent).
  try { return boundsAreVisible(b, screen.getAllDisplays()) ? b : null; } catch { return null; }
};
const showWindow = () => {
  if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); restartPoll(true); return; } // restaure depuis le tray + rafraîchit tout de suite
  const b = savedBounds() || defaultBounds();
  win = new BrowserWindow({
    // Bornes minimales PLAFONNÉES par la taille réellement calculée : sur un écran dont la zone de
    // travail fait moins de 680 px de haut, imposer minHeight=680 forçait la fenêtre à déborder
    // sous la barre des tâches (les boutons du bas devenaient inatteignables).
    ...b, minWidth: Math.min(WIN_MIN_W, b.width), minHeight: Math.min(WIN_MIN_H, b.height),
    backgroundColor: '#0f1117',
    title: 'Hasu Panel',
    icon: path.join(__dirname, 'icon.png'),
    show: false, // on affiche seulement quand la page est prête → pas de fenêtre blanche qui clignote
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  if (cfg.winMaximized) win.maximize();
  win.once('ready-to-show', () => { try { win.show(); win.focus(); } catch {} });
  // Mémorise ta taille/position (écriture différée : on n'écrit pas le fichier à chaque pixel du glisser).
  let boundsTimer = null;
  const rememberBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      try {
        if (!win || win.isDestroyed()) return;
        cfg.winMaximized = win.isMaximized();
        if (!cfg.winMaximized && !win.isMinimized()) cfg.winBounds = win.getBounds(); // en plein écran, on garde la taille « restaurée »
        saveCfg();
      } catch {}
    }, 700);
    boundsTimer.unref?.();
  };
  win.on('resize', rememberBounds);
  win.on('move', rememberBounds);
  win.on('maximize', rememberBounds);
  win.on('unmaximize', rememberBounds);
  win.removeMenu();
  // Refuse toute permission de périphérique (caméra/micro/géoloc/notif…) : le panel n'en a aucun besoin.
  try { win.webContents.session.setPermissionRequestHandler((_wc, _perm, cb) => cb(false)); } catch {}
  // Interdit toute navigation hors du fichier local : une nav de la fenêtre principale vers un site distant
  // hériterait du pont window.panel (le CSP meta ne voyage pas). On garde le contenu 100 % local.
  const stayLocal = (e, url) => { if (!/^file:\/\//i.test(url)) { e.preventDefault(); if (/^https?:\/\//i.test(url)) shell.openExternal(url); } };
  win.webContents.on('will-navigate', stayLocal);
  win.webContents.on('will-redirect', stayLocal);
  // window.open('https://...') (ex. lien « Télécharger Node.js ») ouvrait sinon une SECONDE
  // BrowserWindow Electron chargeant le contenu distant EN INTERNE — contraire au commentaire
  // d'en-tête du fichier ("aucun contenu distant chargé") et à l'anti-pattern documenté par
  // Electron. On route systématiquement vers le navigateur système et on refuse la fenêtre in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  // Rejoue le dernier état MAJ à la fenêtre qui s'ouvre : au démarrage caché, la progression du téléchargement
  // partait dans le vide (pas de fenêtre) → en ouvrant le panel en plein téléchargement, aucune barre/erreur.
  win.webContents.once('did-finish-load', () => { try { if (lastUpdateStatus) win.webContents.send('update-status', lastUpdateStatus); } catch {} });
  win.on('close', (e) => { if (!quitting) { e.preventDefault(); win.hide(); } }); // fermer = réduire dans le tray
  win.on('minimize', (e) => { e.preventDefault(); win.hide(); }); // minimiser = réduire dans le tray (comme Hasu ftn)
  win.on('closed', () => { win = null; });
};

// ---------- IPC ----------
ipcMain.handle('panel:status', () => ({
  bots: statusCache.bots,
  game: statusCache.game,
  online: statusCache.online,
  lowNetActive: !!cfg.lowNetApplied,
  lowNetFlagOk,                   // false = « éco réseau active » à l'écran mais les bots ne l'ont pas reçu
  updatedAt: statusCache.updatedAt,
  updateReady,
  updateStatus: lastUpdateStatus,
  toolchain,
  pm2Health,                      // { ok, since, reason } → l'UI dit « pm2 ne répond plus » au lieu de « aucun bot »
  updateBlockers: updateReady ? updateBlockers() : [], // pourquoi la MAJ prête n'est pas encore appliquée
  autoApplyUpdates: cfg.autoApplyUpdates !== false,
  lastSaveAt: cfg.lastSaveAt || 0, // dernier `pm2 save` (ce qui reviendra au reboot)
  // Nombre d'alertes différées par le plafond horaire, sur la dernière heure : sans ça, l'écran
  // affichait « alertes activées » alors que certaines n'étaient jamais parties.
  alertsSuppressed: (alertsSuppressed = alertsSuppressed.filter((t) => Date.now() - t < 3600 * 1000)).length,
  ready: firstTickDone,           // false = première mesure en cours (≠ « aucun bot »)
  autoHeal: cfg.autoHeal !== false,
  lang: LANGUES.includes(cfg.lang) ? cfg.lang : 'fr',
  incidents: (cfg.incidents || []).slice(-20).reverse(), // le plus récent en premier
  secondeInstall,                 // chemin d'une AUTRE installation du panel sur ce PC (bandeau)
  cfgWriteFailed,                 // les réglages ne s'écrivent plus sur le disque → bandeau (jamais silencieux)
  cfgPath: cfgWriteFailed ? cfgPath() : '', // le chemin n'est utile que pour dire OÙ regarder
  needFix: needFix(),             // bots « Auto boot » éteints sans que tu l'aies demandé
  stoppedByGame: cfg.stoppedByGame.filter((n) => n !== '-'),
  cfg: { bots: cfg.bots, gameMode: cfg.gameMode, games: cfg.games, pollSec: cfg.pollSec, idlePollSec: cfg.idlePollSec, autoLaunch: cfg.autoLaunch, lowNet: cfg.lowNet, packaged: app.isPackaged, imported: cfg.imported, version: app.getVersion(), scanAuto: cfg.scanAuto !== false, lastScanAt: cfg.lastScanAt || 0, discovered: cfg.discovered || [], discordRpc: cfg.discordRpc !== false, discordAppId: cfg.discordAppId || '',
    // Réglages d'alertes : SANS eux, l'UI lisait `undefined` → l'interrupteur se recochait tout seul
    // (undefined !== false) et le champ webhook se vidait au premier rafraîchissement.
    alerts: cfg.alerts !== false, alertToast: cfg.alertToast !== false, alertWebhook: cfg.alertWebhook || '',
    alertSound: cfg.alertSound !== false, alertVolume: cfg.alertVolume || 10 }
}));

// Scan disque à la demande (bouton « Scanner ») + gestion des suggestions.
ipcMain.handle('panel:scanGames', () => runScan());
ipcMain.handle('panel:ignoreGame', (_e, exe) => {
  exe = String(exe || '').trim();
  if (!EXE_RE.test(exe)) return { ok: false };
  if (!cfg.ignoredExes.some((g) => g.toLowerCase() === exe.toLowerCase())) cfg.ignoredExes.push(exe);
  cfg.discovered = (cfg.discovered || []).filter((g) => g.exe.toLowerCase() !== exe.toLowerCase());
  saveCfg();
  return { ok: true };
});

// Liste des programmes ouverts (avec une fenêtre) → pour ajouter un jeu/logiciel inconnu en 1 clic.
ipcMain.handle('panel:runningApps', () => new Promise((resolve) => {
  const SKIP = new Set(['hasupanel', 'explorer', 'applicationframehost', 'systemsettings', 'textinputhost', 'electron', 'searchhost', 'startmenuexperiencehost', 'shellexperiencehost']);
  execFile(PS_EXE, ['-NoProfile', '-NonInteractive', '-Command',
    "Get-Process | Where-Object { $_.MainWindowTitle } | ForEach-Object { $_.ProcessName + '|' + $_.MainWindowTitle }"],
    { windowsHide: true, timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
      if (err || !out) return resolve([]);
      const seen = new Map();
      for (const line of String(out).split('\n')) {
        const i = line.indexOf('|');
        if (i < 1) continue;
        const name = line.slice(0, i).trim();
        const title = line.slice(i + 1).trim();
        if (!name || SKIP.has(name.toLowerCase())) continue;
        const exe = `${name}.exe`;
        if (!EXE_RE.test(exe) || seen.has(exe.toLowerCase())) continue;
        seen.set(exe.toLowerCase(), { exe, title: title.slice(0, 70) });
      }
      resolve([...seen.values()].sort((a, b) => a.exe.localeCompare(b.exe)));
    });
}));

// Choisir un .exe sur le disque (jeu pas encore lancé) — seul le NOM du fichier est gardé.
ipcMain.handle('panel:pickExe', async () => {
  const r = await dialog.showOpenDialog(win || undefined, {
    title: 'Choisis le .exe du jeu / programme à détecter',
    filters: [{ name: 'Programmes', extensions: ['exe'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  return { ok: true, exe: path.basename(r.filePaths[0]) };
});

ipcMain.handle('panel:importPick', async () => {
  const r = await dialog.showOpenDialog(win || undefined, {
    title: 'Choisis le fichier principal du bot (ex : index.js)',
    filters: [{ name: 'Scripts (js, mjs, cjs, py)', extensions: ['js', 'mjs', 'cjs', 'py'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  const script = r.filePaths[0];
  approvedScripts.add(path.resolve(script)); // provenance : ce chemin vient d'un dialogue natif → exécutable
  // Nom proposé = dossier du script, nettoyé pour pm2.
  const suggested = path.basename(path.dirname(script)).replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'mon-bot';
  return { ok: true, script, suggested };
});

// Détecte le fichier principal d'un dossier de bot : d'abord package.json « main », sinon les points d'entrée courants.
const findEntryScript = async (dir) => {
  try {
    const pkg = JSON.parse(await fsp.readFile(path.join(dir, 'package.json'), 'utf8'));
    if (pkg && typeof pkg.main === 'string') { const m = path.join(dir, pkg.main); if (/\.(js|mjs|cjs)$/i.test(m) && fs.existsSync(m)) return m; }
  } catch {}
  for (const c of ['index.js', 'main.js', 'bot.js', 'app.js', 'start.js', 'server.js', 'index.mjs', 'main.mjs', 'main.py', 'bot.py', 'app.py', '__main__.py']) {
    const p = path.join(dir, c); if (fs.existsSync(p)) return p;
  }
  return null;
};

// Import par DOSSIER : on choisit un répertoire, on détecte automatiquement son fichier principal.
ipcMain.handle('panel:importPickDir', async () => {
  const r = await dialog.showOpenDialog(win || undefined, {
    title: 'Choisis le DOSSIER du bot (le fichier principal est détecté automatiquement)',
    properties: ['openDirectory']
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  const dir = r.filePaths[0];
  const script = await findEntryScript(dir);
  if (!script) return { ok: false, error: 'Aucun fichier principal trouvé dans ce dossier (attendu : package.json « main », ou index.js / main.js / bot.js / app.js / *.py).' };
  approvedScripts.add(path.resolve(script)); // provenance : détecté depuis un dossier choisi au dialogue → exécutable
  const suggested = path.basename(dir).replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'mon-bot';
  return { ok: true, script, suggested };
});
ipcMain.handle('panel:importBot', (_e, { name, script } = {}) => importBot(String(name || '').trim(), script));
ipcMain.handle('panel:removeBot', (_e, { name } = {}) => removeBot(String(name || '')));

// Verrou par bot : le render() du renderer reconstruit le DOM et réactive les boutons, donc un
// double-clic pourrait lancer deux start/stop concurrents sur le même bot (état final indéterminé).
// On refuse ici toute nouvelle action tant qu'une action est déjà en cours pour ce bot.
const actionsInFlight = new Set();
ipcMain.handle('panel:action', async (_e, { name, action } = {}) => {
  if (!isSafeName(String(name || '')) || !['start', 'stop', 'restart'].includes(action)) return { ok: false };
  if (actionsInFlight.has(name)) return { ok: false, out: 'action en cours' };
  actionsInFlight.add(name);
  try {
    // stop/restart : on reape l'arbre (pm2 restart ne tue pas les enfants avant de relancer → orphelins cumulés).
    let r;
    // Mémorise une décision MANUELLE : un bot que TU arrêtes ne doit pas se relancer tout seul au
    // prochain démarrage du panel (bootEnforce). Un start/restart manuel lève le drapeau.
    const b = cfg.bots[name] || (cfg.bots[name] = { auto: true, gameStop: false });
    if (action === 'stop') b.manualStop = true; else b.manualStop = false;
    saveCfg();
    if (action === 'stop') r = await stopTree(name);
    else if (action === 'restart') { await stopTree(name); r = await pm2(['start', name]); }
    else r = await pm2([action, name]);
    schedulePm2Save(); // ce que tu vois = ce qui reviendra au prochain démarrage du PC
    await refreshBots();
    return { ok: r.ok };
  } finally {
    actionsInFlight.delete(name);
  }
});

// Stop all : arrête TOUS les bots en ligne d'un coup (bouton à double-clic de confirmation côté UI).
// Réutilise stopTree → chaque bot est arrêté gracieusement PUIS ses enfants orphelins sont reapés.
let stopAllInFlight = false;
ipcMain.handle('panel:stopAll', async () => {
  if (stopAllInFlight) return { ok: false, error: 'déjà en cours' };
  stopAllInFlight = true;
  try {
    const online = (await pm2List() || []).filter((b) => b.status === 'online' && isSafeName(b.name));
    // Arrêt VOLONTAIRE → ces bots ne doivent pas se rallumer seuls au prochain démarrage du panel.
    for (const b of online) { const c = cfg.bots[b.name] || (cfg.bots[b.name] = { auto: true, gameStop: false }); c.manualStop = true; }
    if (online.length) saveCfg();
    await stopBotsTree(online.map((b) => ({ name: b.name, pid: b.pid }))); // 1 snapshot + 1 grâce pour tous
    await refreshBots();
    log('stopAll:', online.length, 'bot(s)');
    return { ok: true, stopped: online.length };
  } finally { stopAllInFlight = false; }
});

// Logs d'un bot : on LIT LES FICHIERS directement (pm2 nous donne déjà leurs chemins dans le jlist)
// au lieu de relancer le CLI pm2 — instantané, aucun process lancé, et ça marche encore quand le démon
// pm2 est malade (justement le moment où on a besoin des logs). `which` sépare sortie et erreurs.
// SÉCURITÉ : l'IPC reçoit un NOM (validé), jamais un chemin ; le chemin vient de pm2, pas du renderer.
const tailFile = (file, maxBytes = 64 * 1024) => {
  try {
    const st = fs.statSync(file);
    const start = Math.max(0, st.size - maxBytes);
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(Math.min(maxBytes, st.size));
      fs.readSync(fd, buf, 0, buf.length, start);
      let s = buf.toString('utf8');
      if (start > 0) { const nl = s.indexOf('\n'); if (nl >= 0) s = s.slice(nl + 1); } // évite une 1re ligne coupée
      return s;
    } finally { fs.closeSync(fd); }
  } catch (e) { return ''; }
};
ipcMain.handle('panel:logs', async (_e, { name, which } = {}) => {
  if (!isSafeName(String(name || ''))) return { ok: false, out: '' };
  const bot = statusCache.bots.find((b) => b.name === name);
  const file = which === 'err' ? bot?.errLog : bot?.outLog;
  if (!file) return { ok: false, out: '', error: 'Chemin de log inconnu (pm2 ne l\'a pas fourni).' };
  // tailFile renvoie '' sur TOUTE erreur (fichier tourné par pm2-logrotate, accès refusé, verrou
  // exclusif) : l'écran affichait « aucun log » alors que le fichier existe mais n'a pas pu être lu.
  // On teste par une OUVERTURE réelle et non par accessSync : ce dernier ne consulte que les
  // permissions et réussit sur un fichier verrouillé — il ne détectait donc pas le cas qu'il nommait.
  let lisible = true;
  try { fs.closeSync(fs.openSync(file, 'r')); } catch { lisible = false; }
  const out = tailFile(file);
  return { ok: true, out, file, empty: !out.trim(), unreadable: !out.trim() && !lisible };
});

// Ouvre le dossier du bot dans l'Explorateur. Le chemin vient de pm2 (pm_cwd), jamais du renderer.
ipcMain.handle('panel:openFolder', (_e, { name, what } = {}) => {
  if (!isSafeName(String(name || ''))) return { ok: false };
  const bot = statusCache.bots.find((b) => b.name === name);
  // path.dirname('') renvoie '.' — une valeur TRUTHY : la garde ci-dessous ne se déclenchait pas et
  // l'Explorateur s'ouvrait sur le dossier courant du panel au lieu de signaler l'absence de chemin.
  const src = what === 'logs' ? (bot && bot.outLog) : (bot && bot.cwd);
  const target = src ? (what === 'logs' ? path.dirname(src) : src) : '';
  if (!target || target === '.') return { ok: false, error: 'Dossier inconnu (pm2 ne l\'a pas fourni).' };
  try { shell.openPath(target); return { ok: true }; } catch { return { ok: false }; }
});

// « Remettre en ordre » : relance les bots qui DEVRAIENT être en ligne (bandeau). Volontaire, borné.
let fixAllInFlight = false;
ipcMain.handle('panel:fixAll', async () => {
  // Garde d'exécution comme panel:action et panel:stopAll : le rendu reconstruit le bandeau toutes
  // les 3 s avec un bouton RÉACTIVÉ, donc un 2e clic lançait une seconde vague de `pm2 start` en
  // parallèle sur les mêmes bots.
  if (fixAllInFlight) return { ok: false, error: 'déjà en cours' };
  fixAllInFlight = true;
  try {
    const names = needFix();
    for (const n of names) { const c = cfg.bots[n]; if (c) c.manualStop = false; await pm2(['start', n]); }
    if (names.length) { saveCfg(); schedulePm2Save(5000); }
    await refreshBots();
    // On compte ce qui est RÉELLEMENT en ligne après coup, pas le nombre de bots tentés. Avant,
    // trois bots dont le dossier avait été déplacé donnaient « ✅ 3 relance(s) » alors qu'aucun
    // n'était reparti — et le bandeau réaffichait aussitôt les mêmes trois noms.
    const enLigne = new Set(statusCache.bots.filter((b) => b.status === 'online').map((b) => b.name));
    const repartis = names.filter((n) => enLigne.has(n));
    const echoues = names.filter((n) => !enLigne.has(n));
    log('remise en ordre :', names.join(', ') || '(rien)',
      echoues.length ? `— TOUJOURS hors ligne : ${echoues.join(', ')}` : '');
    return { ok: true, started: repartis.length, failed: echoues };
  } finally { fixAllInFlight = false; }
});

ipcMain.handle('panel:setBot', (_e, { name, key, value } = {}) => {
  if (!isSafeName(String(name || '')) || !['auto', 'gameStop'].includes(key)) return { ok: false };
  cfg.bots[name] = { auto: true, gameStop: false, ...(cfg.bots[name] || {}), [key]: !!value };
  saveCfg();
  return { ok: true };
});

ipcMain.handle('panel:setGameMode', async (_e, patch = {}) => {
  if (typeof patch.enabled === 'boolean') cfg.gameMode.enabled = patch.enabled;
  if (typeof patch.stopAll === 'boolean') cfg.gameMode.stopAll = patch.stopAll;
  if (typeof patch.soloSkip === 'boolean') cfg.gameMode.soloSkip = patch.soloSkip;
  if (Number.isFinite(patch.graceSec)) cfg.gameMode.graceSec = Math.max(10, Math.min(3600, Math.floor(patch.graceSec)));
  saveCfg();
  if (!cfg.gameMode.enabled && cfg.stoppedByGame.length) await withGameLock(exitGameMode); // désactivation = tout relancer
  updateTray();
  return { ok: true };
});

ipcMain.handle('panel:addGame', (_e, exe) => {
  exe = String(exe || '').trim();
  if (!EXE_RE.test(exe)) return { ok: false, error: 'Nom invalide (attendu : NomDuJeu.exe)' };
  if (!cfg.games.some((g) => g.toLowerCase() === exe.toLowerCase())) cfg.games.push(exe);
  cfg.discovered = (cfg.discovered || []).filter((g) => g.exe.toLowerCase() !== exe.toLowerCase()); // suggestion consommée
  saveCfg();
  return { ok: true };
});

ipcMain.handle('panel:removeGame', (_e, exe) => {
  cfg.games = cfg.games.filter((g) => g.toLowerCase() !== String(exe || '').toLowerCase());
  saveCfg();
  return { ok: true };
});

ipcMain.handle('panel:setSetting', (_e, { key, value } = {}) => {
  if (key === 'autoLaunch') { cfg.autoLaunch = !!value; saveCfg(); applyAutoLaunch(true); return { ok: true }; }
  if (key === 'pollSec') { cfg.pollSec = Math.max(5, Math.min(120, Math.floor(Number(value) || 10))); saveCfg(); restartPoll(); return { ok: true }; }
  if (key === 'idlePollSec') { cfg.idlePollSec = Math.max(15, Math.min(300, Math.floor(Number(value) || 30))); saveCfg(); restartPoll(); return { ok: true }; }
  if (key === 'lowNet') { cfg.lowNet = !!value; saveCfg(); return { ok: true }; } // le tick applique/retire tout seul
  if (key === 'scanAuto') { cfg.scanAuto = !!value; saveCfg(); return { ok: true }; }
  if (key === 'discordRpc') { cfg.discordRpc = !!value; saveCfg(); startRpc(); return { ok: true }; }
  if (key === 'discordAppId') { cfg.discordAppId = String(value || '').trim().slice(0, 40); saveCfg(); startRpc(); return { ok: true }; }
  if (key === 'autoApplyUpdates') { cfg.autoApplyUpdates = !!value; saveCfg(); return { ok: true }; }
  if (key === 'autoHeal') { cfg.autoHeal = !!value; saveCfg(); return { ok: true }; }
  // La langue vaut aussi pour le menu de la zone de notification : on le reconstruit tout de suite.
  if (key === 'lang') { cfg.lang = LANGUES.includes(value) ? value : 'fr'; setLang(cfg.lang); saveCfg(); updateTray(true); return { ok: true }; }
  if (key === 'alerts') { cfg.alerts = !!value; saveCfg(); return { ok: true }; }
  if (key === 'alertToast') { cfg.alertToast = !!value; saveCfg(); return { ok: true }; }
  if (key === 'alertSound') { cfg.alertSound = !!value; saveCfg(); if (cfg.alertSound) playSoftSound(); return { ok: true }; } // aperçu immédiat
  if (key === 'alertVolume') {
    cfg.alertVolume = clampInt(value, 1, 100, 10);
    chimePath = null; // force la régénération du WAV au nouveau volume
    saveCfg(); playSoftSound(); // on entend tout de suite le résultat
    return { ok: true, volume: cfg.alertVolume };
  }
  if (key === 'alertWebhook') {
    const v = String(value || '').trim().slice(0, 300);
    // Vide = désactivé ; sinon on n'accepte QUE des webhooks Discord (rien d'autre ne doit recevoir tes données).
    if (v && !/^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\//i.test(v)) return { ok: false, error: 'URL de webhook Discord attendue (https://discord.com/api/webhooks/…)' };
    cfg.alertWebhook = v; saveCfg(); return { ok: true };
  }
  return { ok: false };
});

// Bouton « Tester » des alertes : envoie une alerte de démonstration (toast + webhook) pour vérifier
// la configuration sans attendre qu'un bot tombe vraiment.
ipcMain.handle('panel:testAlert', async () => {
  // On ne touche PLUS à cfg.alerts : sendAlert ne le lit pas (seuls checkAlerts/alertPm2Down le font),
  // et le basculer autour d'un `await` de 10 s laissait un tick concurrent ENREGISTRER `alerts:true`
  // sur le disque — les alertes revenaient donc activées au redémarrage, contre le choix de l'utilisateur.
  const hasWebhook = !!(cfg.alertWebhook || '').trim();
  alertTimes = []; // un test ne doit pas être refusé par le plafond horaire
  // On REMONTE le vrai résultat : avant, l'échec du webhook (URL révoquée, 404, hors ligne) était
  // ignoré et l'interface affichait « ✅ envoyé » sur une configuration morte.
  const ok = await sendAlert('✅ Test des alertes — Hasu Panel', 'Si tu lis ceci, les alertes fonctionnent : tu seras prévenu quand un bot tombera.', 0x57F287);
  return { ok, webhook: hasWebhook, toast: cfg.alertToast !== false,
    error: ok ? '' : (hasWebhook ? 'Discord a refusé le webhook (URL révoquée, salon supprimé, ou pas de connexion).' : 'Envoi impossible.') };
});

// Vérification MANUELLE des mises à jour (bouton « Vérifier les mises à jour »).
// Renvoie un état lisible : dev (non installé), uptodate, available (télécharge), downloaded (prête), error.
ipcMain.handle('panel:checkUpdate', async () => {
  if (!app.isPackaged) return { state: 'dev', current: app.getVersion() };
  if (updateReady) return { state: 'downloaded', current: app.getVersion(), version: lastUpdateStatus?.version };
  if (!updaterRef) { try { ({ autoUpdater: updaterRef } = require('electron-updater')); } catch (e) { return { state: 'error', message: e.message }; } }
  try {
    const r = await updaterRef.checkForUpdates();
    const latest = r?.updateInfo?.version;
    // Comparaison sémantique : « dispo » seulement si la version publiée est STRICTEMENT plus récente
    // (une version identique ou plus ancienne ne doit jamais s'afficher comme une mise à jour).
    return { state: semverGt(latest, app.getVersion()) ? 'available' : 'uptodate', current: app.getVersion(), version: latest };
  } catch (e) { return { state: 'error', current: app.getVersion(), message: e?.message || String(e) }; }
});

// Applique la mise à jour téléchargée et redémarre (bouton « Redémarrer & appliquer »).
ipcMain.handle('panel:applyUpdate', () => {
  if (!updateReady || !updaterRef) return { ok: false };
  // PAS de `quitting = true` ici : il est redondant (quitAndInstall → app.quit() → 'before-quit' le
  // pose déjà, et avant la fermeture des fenêtres), et surtout il est POSÉ D'AVANCE. Si l'installeur
  // est absent ou mis en quarantaine par l'antivirus, l'application ne redémarre pas et se retrouve
  // avec `quitting` collé à true : fermer la fenêtre ne la réduit plus dans la zone de notification,
  // elle QUITTE — et les bots coupés par le mode jeu ne sont plus surveillés.
  setTimeout(() => {
    try { updaterRef.quitAndInstall(); }
    catch (e) {
      log('quitAndInstall a échoué :', e.message);
      pushUpd({ state: 'error', message: `Le redémarrage a échoué : ${e.message}` });
    }
  }, 200);
  return { ok: true };
});

// Installe pm2 globalement (bouton « Installer pm2 » quand il manque). Sans admin : npm installe dans le
// préfixe utilisateur (%APPDATA%\npm). Nécessite Node/npm ; sinon on renvoie 'no-node' (guider vers nodejs.org).
ipcMain.handle('panel:installPm2', async () => {
  if (!toolchain.node) return { ok: false, reason: 'no-node' };
  const r = await new Promise((resolve) => {
    execFile('npm', ['install', '-g', 'pm2'], { shell: true, windowsHide: true, timeout: 240000, maxBuffer: 16 * 1024 * 1024 }, (err, out, errOut) => {
      resolve({ ok: !err, out: `${out || ''}\n${errOut || ''}`.trim().slice(-600) });
    });
  });
  log('install pm2 :', r.ok ? 'OK' : 'échec', r.out.slice(0, 200));
  if (r.ok) {
    toolchain = await probeToolchain();
    // Re-résout AUSSI le lanceur : sans ça, pm2Direct restait false pour toute la session après une
    // installation depuis l'app, et chaque appel repassait par cmd.exe — le chemin qui laisse un
    // process fantôme à chaque sondage, 24h/24.
    resolvePm2Runner();
    await tick().catch(() => {}); // rafraîchit la liste
  }
  return { ok: r.ok && toolchain.pm2, out: r.out };
});

// ---------- Boucle (cadence adaptative) ----------
// Fenêtre au 1er plan → cadence normale (réactif). Panel dans le tray (personne ne regarde) → cadence
// ralentie = moins de spawns tasklist/pm2 = moins de CPU/batterie sur portable. Exception : si une
// bascule AUTOMATIQUE dépend du sondage (mode jeu ou faible usage internet), on garde un rythme réactif
// (~15 s) même caché, sinon un jeu qui se lance mettrait jusqu'à 30 s à couper les bots.
let pollTimer = null;
let pollEpoch = 0;
// Cadence dans logic.js (testée : visible, tray, mode jeu/éco réseau actifs, sondage lent).
const pollDelayMs = () => pollDelayFor(isWindowVisible(), cfg);
function restartPoll(immediate = false) {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  const epoch = ++pollEpoch; // invalide toute chaîne de timers précédente (évite deux boucles en parallèle)
  const loop = () => {
    tick().catch((e) => log('tick fatal', e.message)).finally(() => {
      if (epoch !== pollEpoch) return; // un restartPoll plus récent a pris le relais → cette chaîne s'arrête
      pollTimer = setTimeout(loop, pollDelayMs());
    });
  };
  pollTimer = setTimeout(loop, immediate ? 0 : pollDelayMs());
}

// ---------- Démarrage ----------
if (process.argv.includes('--selftest')) {
  // Auto-test sans interface : vérifie pm2, la détection de process et la config, puis quitte.
  app.whenReady().then(async () => {
    cfg = loadCfg();
    const bots = await pm2List() || [];
    console.log('SELFTEST bots :', bots.map((b) => `${b.name}=${b.status}`).join(', ') || 'AUCUN');
    const procs = await listProcs();
    console.log('SELFTEST process visibles :', procs ? procs.names.size : 'ÉCHEC tasklist');
    const hit = procs && cfg.games.find((g) => procs.names.has(g.toLowerCase()));
    console.log('SELFTEST jeu détecté :', hit || 'aucun');
    // Sonde « en ligne » sur un process connu pour avoir des connexions (le bot saliox lui-même).
    const sal = bots.find((b) => b.status === 'online' && b.pid);
    if (sal) console.log(`SELFTEST détection en-ligne (via ${sal.name}) :`, await hasOnlineActivity([sal.pid]));
    console.log('SELFTEST débit lien :', Math.round(await linkSpeedMbps()), 'Mbps');
    console.log('SELFTEST config :', cfgPath());
    process.exit(bots.length && procs ? 0 : 1);
  });
} else if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  // On n'ouvre la fenêtre QUE si la 2e instance n'est pas un lancement --hidden (démarrage Windows) :
  // sinon les deux déclencheurs de démarrage (clé Run + tâche planifiée) feraient surgir la fenêtre au boot.
  app.on('second-instance', (_e, argv) => { if (!Array.isArray(argv) || !argv.includes('--hidden')) showWindow(); });
  app.whenReady().then(async () => {
    cfg = loadCfg();
    // Les deux copies avaient divergé : on réaligne le fichier principal TOUT DE SUITE. Sans ça
    // l'avertissement revenait à chaque démarrage et le fichier périmé restait sur le disque jusqu'au
    // prochain enregistrement. Bonus : ça vérifie dès l'amorçage que le disque accepte nos écritures,
    // donc le bandeau « réglages non enregistrés » se lève immédiatement si ce n'est pas le cas.
    if (cfgRepairNeeded) { cfgRepairNeeded = false; log('config: réalignement du fichier principal sur la sauvegarde —', saveCfg() ? 'fait' : 'ÉCHEC'); }
    hydrateRuntime(); // reprend les alertes suivies et les relances en cours d'avant le redémarrage
    setLang(cfg.lang); // le menu du tray et les alertes suivent la langue choisie dans la fenêtre
    detecterSecondeInstallation().catch((e) => log('détection 2e installation', e.message)); // (le ménage des lanceurs se fait dans `applyAutoLaunch`)
    resolvePm2Runner(); // node.exe + pm2/bin/pm2 → appels pm2 sans cmd.exe (zéro process fantôme)
    // Sans AppUserModelId, Windows 10/11 n'affiche AUCUNE notification d'une app Electron.
    // DOIT être identique au `build.appId` du package.json ('hasu.panel') : c'est cet identifiant que
    // Windows associe au raccourci installé. S'ils diffèrent, AUCUN toast ne s'affiche — en silence,
    // et le bouton « Tester » répond quand même « envoyé » (l'API Electron, elle, ne se plaint pas).
    // ⚠️ Ne PAS « corriger » l'inverse en changeant build.appId : ça déplacerait %APPDATA%\hasu-panel
    // et ferait perdre leurs réglages à toutes les installations existantes.
    try { app.setAppUserModelId(app.isPackaged ? 'hasu.panel' : 'com.saliox.hasupanel'); } catch {}
    // Au réveil du PC, tout paraît « tombé » quelques instants (réseau pas encore revenu) → on se tait
    // le temps que la machine se remette, sinon rafale d'alertes bidon à chaque sortie de veille.
    try { powerMonitor.on('resume', () => { quietUntil = Date.now() + ALERT_QUIET_RESUME_MS; log('réveil PC → alertes en silence 2 min'); }); } catch {}
    // Les bots pm2 connus obtiennent une entrée de config par défaut à la première vue.
    tray = new Tray(trayIcon(false));
    tray.on('double-click', () => showWindow());
    updateTray();
    applyAutoLaunch();
    startRpc(); // Rich Presence Discord (si activée + App ID configuré)
    setupAutoUpdate(); // auto-update en fond (version installee uniquement)
    // Retour après une MAJ appliquée toute seule : on te le dit (discrètement) au lieu d'un changement muet.
    if (cfg.updatedFrom && cfg.updatedFrom !== app.getVersion()) {
      const from = cfg.updatedFrom; cfg.updatedFrom = ''; saveCfg();
      log('retour après MAJ auto :', from, '→', app.getVersion());
      setTimeout(() => {
        try { if (Notification.isSupported()) new Notification({ title: 'Hasu Panel mis à jour', body: `Version ${from} → ${app.getVersion()}. Rien à faire, tout a repris tout seul.` }).show(); } catch {}
      }, 4000);
    }
    probeToolchain().then((t) => { toolchain = t; }).catch(() => {}); // détecte Node/pm2 (guide si absent)
    if (!START_HIDDEN) showWindow();

    if (IS_STARTUP) {
      setTimeout(() => bootEnforce().catch((e) => log('bootEnforce', e.message)), 8000); // laisse le .cmd resurrect passer
    }
    // Reprise après crash : des bots coupés par le mode jeu mais plus de jeu → le tick les relancera.
    await tick().catch(() => {});
    // Enregistre les bots découverts dans la config (défaut : auto ON, mode jeu OFF).
    let added = false;
    for (const b of statusCache.bots) if (!cfg.bots[b.name]) { cfg.bots[b.name] = { auto: true, gameStop: false }; added = true; }
    if (added) saveCfg();
    restartPoll();
  });
  // Nettoyage à la fermeture : on relance les bots coupés par le mode jeu et on efface les drapeaux
  // (watchdog + faible usage internet). Sinon les bots resteraient éteints et les alertes crash
  // suspendues indéfiniment. before-quit peut être asynchrone → on diffère la sortie le temps du nettoyage.
  let cleanedUp = false, quitEnCours = false;
  app.on('before-quit', (e) => {
    quitting = true;
    if (cleanedUp) return; // nettoyage déjà fait → on laisse Electron quitter
    // Deuxième demande pendant le nettoyage : on la retient, on ne relance pas un second nettoyage en
    // parallèle. Sans cette garde, deux `pm2 save` concurrents pouvaient graver un dump à moitié arrêté.
    if (quitEnCours) { e.preventDefault(); return; }
    quitEnCours = true;
    e.preventDefault();
    // Coupe la boucle de sondage AVANT le nettoyage (bump d'époque + clear du timer) : sinon un tick
    // pourrait piloter les mêmes bots (pm2 start/stop) en même temps que exitGameMode = état final indéterminé.
    pollEpoch++; if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    // Le nettoyage est plafonné : chaque `pm2 start` a un timeout de 60 s, donc 4 bots parqués + un
    // démon pm2 bloqué = une app sans fenêtre qui refusait de se fermer pendant des MINUTES. Pire,
    // quand la fermeture vient d'une mise à jour, l'installeur commençait à remplacer les fichiers
    // pendant que l'app tournait encore. Au-delà du délai, on quitte quoi qu'il arrive.
    const QUIT_DEADLINE_MS = 12000;
    // `app.exit()` et non `app.quit()` : relancer un cycle de fermeture depuis l'INTERIEUR de
    // `before-quit` repasse par la negociation de fermeture des fenetres, et il suffit qu'un handler
    // annule — ou qu'une fenetre soit deja detruite — pour que le processus reste vivant, icone de la
    // zone de notification comprise : c'est le « Quitter » sans effet. `exit` termine sans rien renegocier.
    const finish = () => { if (!cleanedUp) { cleanedUp = true; log('fermeture terminee'); app.exit(0); } };
    // Volontairement PAS `unref()` : c'est le garde-fou qui GARANTIT la sortie, il doit tenir la
    // boucle d'evenements en vie jusqu'a son terme.
    let deadline = null;
    (async () => {
      // Laisse une transition de mode jeu déjà en cours se terminer (max ~6 s) avant de nettoyer.
      for (let i = 0; i < 30 && busy; i++) await new Promise((r) => setTimeout(r, 200));
      // Le compte à rebours démarre SEULEMENT MAINTENANT : armé avant l'attente, il en mangeait la
      // moitié et le nettoyage se faisait couper au milieu d'une relance de bots.
      deadline = setTimeout(() => { log('fermeture : nettoyage trop long → sortie forcée'); finish(); }, QUIT_DEADLINE_MS);
      // `false` = des bots coupés par le mode jeu ne sont pas repartis. Dans ce cas on NE sauvegarde
      // pas l'état pm2 : le dump servirait de référence au prochain démarrage du PC et graverait leur
      // extinction. Mieux vaut un dump un peu vieux qu'un dump qui éteint les bots.
      // Par le VERROU, comme les trois autres appelants : en direct, cette relance pouvait lancer des
      // `pm2 start` pendant qu'une coupure finissait ses `pm2 stop`. Seul `true` autorise la suite —
      // `undefined` signifie que la demande a été mise en attente, donc qu'on ne sait rien.
      let relanceOk = true;
      try {
        if (cfg && cfg.stoppedByGame && cfg.stoppedByGame.some((n) => n !== '-')) {
          relanceOk = await withGameLock(exitGameMode) === true;
          if (!relanceOk) log('fermeture : relance des bots non confirmée → pas de pm2 save');
        }
      } catch (err) { relanceOk = false; log('quit exitGameMode', err.message); }
      try { if (cfg && cfg.lowNetApplied) await clearLowNet(); } catch (err) { log('quit clearLowNet', err.message); }
      // Dernière chance pour une sauvegarde pm2 restée en attente (reportée par le mode jeu) : c'est
      // ce dump que pm2 restaure au prochain démarrage du PC. Sans ça, tout démarrage/arrêt fait
      // pendant une longue partie disparaissait à l'extinction. On est ici APRÈS exitGameMode, donc
      // la liste est de nouveau représentative.
      try {
        if (pm2SavePending && relanceOk) {
          const r = await pm2(['save']);
          log('pm2 save de fermeture :', r.ok ? 'OK' : 'échec');
          if (r.ok) { pm2SavePending = false; cfg.lastSaveAt = Date.now(); saveCfg(); }
        }
      } catch (err) { log('quit pm2 save', err.message); }
      // Laisser partir ce qui attend dans la file : `app.exit(0)` tue le process net, et l'alerte
      // « Bots non relancés après la partie » — justement celle qui compte le plus à ce moment — n'avait
      // jamais le temps d'atteindre Discord. Borné à 3 s : on ne retarde pas la fermeture pour autant.
      const finAttente = Date.now() + 3000;
      while ((alertQueue.length || alertDraining) && Date.now() < finAttente) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (alertQueue.length) log('fermeture :', alertQueue.length, 'alerte(s) non parties (délai dépassé)');
      if (deadline) clearTimeout(deadline);
      finish();
    })();
  });
  app.on('window-all-closed', () => { /* on reste dans le tray */ });
}
