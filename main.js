// Hasu Panel — panel de gestion des bots pm2 : auto-démarrage par bot + « mode jeu »
// (quand un jeu multijoueur est détecté, coupe tous les bots ou ceux cochés, puis les relance).
// Electron, aucune dépendance externe. Sécurité : noms pm2/exe validés par regex (anti-injection),
// contextIsolation activé, aucun contenu distant chargé.
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const rpc = require('./discordrpc'); // Rich Presence Discord (IPC natif, sans dépendance)

const IS_STARTUP = process.argv.includes('--startup'); // lancé par l'ouverture de session Windows
const START_HIDDEN = process.argv.includes('--hidden');

const PM2 = path.join(process.env.APPDATA || '', 'npm', 'pm2.cmd');
const NAME_RE = /^[A-Za-z0-9_.-]{1,64}$/; // noms pm2 autorisés (jamais d'espace ni de quote → sûr avec shell)
const EXE_RE = /^[A-Za-z0-9 _.()+'-]{1,80}\.exe$/i; // noms de process de jeu autorisés

// Dossier « data » du bot saliox (drapeaux de coordination panel ↔ bot). Par défaut : <profil>\Desktop\saliox bot\data
// (résolu via os.homedir → aucun nom d'utilisateur codé en dur). Personnalisable via la variable d'env HASU_SALIOX_DATA.
const SALIOX_DATA = process.env.HASU_SALIOX_DATA || path.join(require('os').homedir(), 'Desktop', 'saliox bot', 'data');
// Drapeau lu par le watchdog de saliox : bots coupés VOLONTAIREMENT (mode jeu) → pas d'alerte MP.
const WATCHDOG_FLAG = path.join(SALIOX_DATA, 'panel_maintenance.json');
// Drapeau « faible usage internet » lu par saliox (systems/lownet.js) : gros transferts différés pendant le jeu.
const LOWNET_FLAG = path.join(SALIOX_DATA, 'lownet.json');

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
  pollSec: 10,
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
  discordAppId: ''          // Application ID Discord (Rich Presence) — à coller dans les réglages, ou via l'env HASU_DISCORD_APP_ID
};

let win = null, tray = null, quitting = false;
let cfg = null;
let lastGameSeen = null, lastGameAt = 0;
let sessionOnline = false; // le jeu détecté a une vraie connexion Internet (session multijoueur)
let statusCache = { bots: [], game: null, online: false, updatedAt: 0 };
let busy = false; // évite deux bascules mode jeu simultanées
let prevIo = new Map(); // pid -> { read, write, at } : relevé E/S précédent, pour calculer les DÉBITS (octets/s) par delta

const log = (...a) => {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'panel.log'), `${new Date().toISOString()} ${a.join(' ')}\n`); } catch {}
};

// ---------- Config ----------
const cfgPath = () => path.join(app.getPath('userData'), 'panel-config.json');
const loadCfg = () => {
  try {
    const raw = JSON.parse(fs.readFileSync(cfgPath(), 'utf8'));
    return {
      ...DEFAULTS, ...raw,
      bots: raw.bots && typeof raw.bots === 'object' ? raw.bots : {},
      gameMode: { ...DEFAULTS.gameMode, ...(raw.gameMode || {}) },
      games: Array.isArray(raw.games) ? raw.games.filter((g) => EXE_RE.test(g)) : DEFAULT_GAMES,
      stoppedByGame: Array.isArray(raw.stoppedByGame) ? raw.stoppedByGame.filter((n) => NAME_RE.test(n)) : [],
      imported: Array.isArray(raw.imported) ? raw.imported.filter((n) => NAME_RE.test(n)) : [],
      ignoredExes: Array.isArray(raw.ignoredExes) ? raw.ignoredExes.filter((g) => EXE_RE.test(g)) : [],
      discovered: Array.isArray(raw.discovered) ? raw.discovered.filter((g) => g && EXE_RE.test(g.exe || '')) : [],
      discordAppId: (typeof raw.discordAppId === 'string' && raw.discordAppId.trim()) ? raw.discordAppId.trim().slice(0, 40) : DEFAULTS.discordAppId
    };
  } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
};
const saveCfg = () => { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg, null, 2)); } catch (e) { log('saveCfg', e.message); } };

// ---------- pm2 ----------
// shell:true nécessaire pour lancer un .cmd → chaque argument est validé AVANT (aucune injection possible).
// Le chemin de pm2.cmd est ENTOURÉ DE GUILLEMETS : sous shell, Node ne cite pas le fichier, donc un
// nom d'utilisateur avec espace (%APPDATA% contient un espace) tronquerait la commande. cmd.exe parse
// correctement « "C:\...\npm\pm2.cmd" jlist » (et le cas sans espace reste valide).
const pm2Raw = (args) => new Promise((resolve) => {
  execFile(`"${PM2}"`, args, { shell: true, windowsHide: true, timeout: 60000, maxBuffer: 16 * 1024 * 1024 }, (err, out, errOut) => {
    resolve({ ok: !err, out: `${out || ''}\n${errOut || ''}`.trim() });
  });
});
// Variante courante : uniquement des mots-clés/noms sûrs (start/stop/restart/jlist/save/… + noms pm2).
const pm2 = (args) => {
  if (!args.every((a) => /^[A-Za-z0-9_.-]+$/.test(a))) return Promise.resolve({ ok: false, out: 'arg refusé' });
  return pm2Raw(args);
};

const pm2List = async () => {
  const { out } = await pm2(['jlist']);
  try {
    const i = out.indexOf('['); // pm2 peut afficher des lignes de log avant le JSON
    if (i < 0) return [];
    return JSON.parse(out.slice(i)).map((p) => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      uptime: p.pm2_env?.pm_uptime || 0,
      restarts: p.pm2_env?.restart_time ?? 0,
      memory: p.monit?.memory || 0,
      cpu: p.monit?.cpu || 0,
      pid: Number(p.pid) || 0
    })).filter((b) => NAME_RE.test(b.name));
  } catch { return []; }
};

// ---------- Détection de jeu (liste de process + PID) ----------
const listProcs = () => new Promise((resolve) => {
  execFile('tasklist.exe', ['/fo', 'csv', '/nh'], { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
    if (err || !out) return resolve(null);
    const names = new Set(); const pids = new Map();
    for (const line of String(out).split('\n')) {
      const m = line.match(/^"([^"]+)","(\d+)"/);
      if (!m) continue;
      const n = m[1].toLowerCase();
      names.add(n);
      if (!pids.has(n)) pids.set(n, []);
      pids.get(n).push(Number(m[2]));
    }
    resolve({ names, pids });
  });
});

// Jeu EN LIGNE ou solo ? → au moins une connexion TCP établie du process vers une IP publique.
// Heuristique honnête : couvre les jeux TCP et les jeux « toujours en ligne » (services/lobby) ;
// un jeu 100 % hors-ligne n'a aucune connexion sortante → mode jeu non déclenché.
const hasOnlineActivity = (pids) => new Promise((resolve) => {
  if (!Array.isArray(pids) || !pids.length) return resolve(false);
  execFile('netstat.exe', ['-ano', '-p', 'tcp'], { windowsHide: true, timeout: 20000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
    if (err || !out) return resolve(false);
    const set = new Set(pids.map(String));
    for (const line of String(out).split('\n')) {
      const m = line.match(/^\s*TCP\s+\S+\s+(\d{1,3}(?:\.\d{1,3}){3}):\d+\s+ESTABLISHED\s+(\d+)\s*$/i);
      if (!m || !set.has(m[2])) continue;
      const ip = m[1];
      if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(ip)) continue; // adresses locales/privées
      const b2 = Number(ip.split('.')[1]);
      if (ip.startsWith('172.') && b2 >= 16 && b2 <= 31) continue;
      return resolve(true);
    }
    resolve(false);
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
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
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
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { windowsHide: true, timeout: 20000 }, () => resolve(true));
});

const linkSpeedMbps = () => new Promise((resolve) => {
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "(Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' } | Select-Object -First 1 -ExpandProperty LinkSpeed)"],
    { windowsHide: true, timeout: 20000 }, (err, out) => {
      const m = String(out || '').match(/([\d.]+)\s*(G|M|K)?bps/i);
      if (!m) return resolve(0);
      const v = parseFloat(m[1]); const u = (m[2] || '').toUpperCase();
      resolve(u === 'G' ? v * 1000 : u === 'K' ? v / 1000 : v);
    });
});

const applyLowNet = async (game) => {
  const speed = await linkSpeedMbps();
  const level = speed && speed < 100 ? 2 : 1; // petit débit → différer + priorité Idle ; sinon BelowNormal
  try { fs.writeFileSync(LOWNET_FLAG, JSON.stringify({ active: true, level, game, since: Date.now() })); } catch (e) { log('lownet flag', e.message); }
  const bots = await pm2List();
  await setBotPriority(bots.filter((b) => b.status === 'online').map((b) => b.pid), level === 2 ? 'Idle' : 'BelowNormal');
  cfg.lowNetApplied = true; saveCfg();
  log(`faible usage internet ON (lien ~${Math.round(speed)} Mbps → niveau ${level}) — jeu : ${game}`);
  updateTray();
};

const clearLowNet = async () => {
  try { fs.unlinkSync(LOWNET_FLAG); } catch {}
  const bots = await pm2List();
  await setBotPriority(bots.map((b) => b.pid), 'Normal');
  cfg.lowNetApplied = false; saveCfg();
  log('faible usage internet OFF — priorités restaurées');
  updateTray();
};

// ---------- Import de bots (catégorie « importés ») ----------
// Confie un projet perso (lancé d'habitude à la main / via Visual Studio) à pm2 : il devient
// gérable comme les autres (auto boot, mode jeu, start/stop) et survit aux redémarrages (pm2 save).
const BAD_SHELL_RE = /[&|<>^"%!\r\n`;]/; // métacaractères cmd interdits dans un chemin (shell:true)

const importBot = async (name, script) => {
  if (!NAME_RE.test(name)) return { ok: false, error: 'Nom invalide (lettres, chiffres, tirets, sans espace)' };
  script = path.resolve(String(script || ''));
  if (BAD_SHELL_RE.test(script)) return { ok: false, error: 'Chemin non pris en charge (caractères spéciaux)' };
  if (!/\.(js|mjs|cjs|py)$/i.test(script) || !fs.existsSync(script)) return { ok: false, error: 'Fichier introuvable (attendu : .js, .mjs, .cjs ou .py)' };
  const existing = await pm2List();
  if (existing.some((b) => b.name.toLowerCase() === name.toLowerCase())) return { ok: false, error: `« ${name} » existe déjà dans pm2 — choisis un autre nom` };
  const dir = path.dirname(script);
  // Un script à la racine d'un disque (D:\bot.js) donne dir = « D:\ » : cité tel quel → « "D:\" »,
  // et cmd.exe interprète le \" final comme un guillemet échappé (fusion de jetons). On ajoute un « . »
  // à un backslash final (D:\ → D:\.) pour que --cwd désigne bien la racine sans casser le parsing.
  const cwd = dir.endsWith('\\') ? `${dir}.` : dir;
  const r = await pm2Raw(['start', `"${script}"`, '--name', name, '--cwd', `"${cwd}"`]);
  if (!r.ok) { log('import ÉCHEC:', name, script, '—', r.out.slice(0, 400)); return { ok: false, error: 'pm2 a refusé le démarrage — vérifie le fichier (détails dans panel.log)' }; }
  await pm2(['save']); // survivra au redémarrage du PC (pm2 resurrect)
  if (!cfg.imported.includes(name)) cfg.imported.push(name);
  cfg.bots[name] = { auto: true, gameStop: false, ...(cfg.bots[name] || {}) };
  saveCfg();
  log('import OK:', name, '←', script);
  statusCache.bots = await pm2List();
  return { ok: true };
};

const removeBot = async (name) => {
  if (!NAME_RE.test(name) || !cfg.imported.includes(name)) return { ok: false, error: 'Seuls les bots importés peuvent être retirés ici' };
  await pm2(['delete', name]);
  await pm2(['save']);
  cfg.imported = cfg.imported.filter((n) => n !== name);
  delete cfg.bots[name];
  cfg.stoppedByGame = cfg.stoppedByGame.filter((n) => n !== name);
  saveCfg();
  log('retrait:', name);
  statusCache.bots = await pm2List();
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
  try {
    cfg.discovered = (await scanInstalledGames()).slice(0, 40);
    cfg.lastScanAt = Date.now();
    saveCfg();
    log(`scan jeux : ${cfg.discovered.length} suggestion(s)`);
    return { ok: true, games: cfg.discovered };
  } catch (e) { log('scan', e.message); return { ok: false, error: e.message }; }
  finally { scanning = false; }
};

// ---------- Drapeau watchdog (saliox) ----------
const writeFlag = (bots, game) => {
  try { fs.writeFileSync(WATCHDOG_FLAG, JSON.stringify({ bots, game, since: Date.now() })); } catch (e) { log('writeFlag', e.message); }
};
const clearFlag = () => { try { fs.unlinkSync(WATCHDOG_FLAG); } catch {} };

// ---------- Mode jeu ----------
const enterGameMode = async (game) => {
  const list = await pm2List();
  const targets = list
    .filter((b) => b.status === 'online' && (cfg.gameMode.stopAll || cfg.bots[b.name]?.gameStop))
    .map((b) => b.name);
  if (!targets.length) { cfg.stoppedByGame = ['-']; saveCfg(); return; } // marqueur « déjà traité » sans cible
  // Drapeau AVANT l'arrêt pour que le watchdog de saliox n'alerte pas ; saliox coupé EN DERNIER (il héberge le watchdog).
  writeFlag(targets, game);
  targets.sort((a, b) => (a === 'saliox') - (b === 'saliox'));
  for (const n of targets) await pm2(['stop', n]);
  cfg.stoppedByGame = targets;
  saveCfg();
  log('mode jeu ON —', game, '— coupés :', targets.join(', '));
  updateTray();
};

const exitGameMode = async () => {
  const names = cfg.stoppedByGame.filter((n) => n !== '-' && NAME_RE.test(n)); // '-' = marqueur « rien à couper »
  names.sort((a, b) => (b === 'saliox') - (a === 'saliox')); // saliox relancé en premier
  for (const n of names) await pm2(['start', n]);
  clearFlag();
  cfg.stoppedByGame = [];
  saveCfg();
  log('mode jeu OFF — relancés :', names.join(', ') || '(aucun)');
  updateTray();
};

// ---------- Boucle de surveillance ----------
const tick = async () => {
  const procs = await listProcs();
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

    if (!busy) {
      busy = true;
      try {
        if (cfg.gameMode.enabled && gameRunning && sessionOnline && cfg.stoppedByGame.length === 0) {
          await enterGameMode(hit);
        } else if (cfg.stoppedByGame.length > 0 && !gameRunning && graceOver) {
          await exitGameMode(); // couvre aussi la reprise après crash/redémarrage du panel
        }
        // Faible usage internet : indépendant du mode jeu (utile pour les bots qu'on laisse tourner).
        if (cfg.lowNet && gameRunning && sessionOnline && !cfg.lowNetApplied) {
          await applyLowNet(hit);
        } else if (cfg.lowNetApplied && (!cfg.lowNet || (!gameRunning && graceOver))) {
          await clearLowNet(); // couvre aussi la reprise après crash/redémarrage du panel
        }
      } catch (e) { log('tick', e.message); }
      busy = false;
    }
  }
  statusCache.bots = await pm2List();
  await measureNet().catch(() => {}); // débit réseau (E/S) par bot, affiché à côté du CPU
  statusCache.updatedAt = Date.now();
  updateTray();
  updateRpc(); // met à jour la Rich Presence Discord (« gère X bots en ligne »)

  // Découverte auto : au plus 1×/jour, jamais pendant une partie (le scan disque attendra).
  if (cfg.scanAuto !== false && !statusCache.game && Date.now() - (cfg.lastScanAt || 0) > SCAN_MS) {
    runScan().catch(() => {});
  }
};

// ---------- Application au démarrage de Windows ----------
const bootEnforce = async () => {
  let list = await pm2List();
  if (!list.length) { // le .cmd « pm2 resurrect » de la Startup n'est peut-être pas encore passé
    // Boot lent : au lieu d'abandonner après un seul délai de 5 s, on réessaie resurrect + relecture
    // plusieurs fois avec des délais croissants (~40 s cumulés) jusqu'à voir des process.
    const delays = [3000, 5000, 8000, 12000, 12000];
    for (let i = 0; i < delays.length && !list.length; i++) {
      await pm2(['resurrect']);
      await new Promise((r) => setTimeout(r, delays[i]));
      list = await pm2List();
    }
    if (!list.length) log('bootEnforce: aucun process pm2 après plusieurs resurrect — auto-démarrage abandonné pour cette session');
  }
  for (const b of list) {
    const c = cfg.bots[b.name];
    if (!c) continue;
    if (c.auto === false && b.status === 'online') { await pm2(['stop', b.name]); log('boot: stop', b.name, '(auto off)'); }
    else if (c.auto !== false && b.status !== 'online') { await pm2(['start', b.name]); log('boot: start', b.name); }
  }
};

// ---------- Lancement auto du panel ----------
const applyAutoLaunch = () => {
  if (!app.isPackaged) return; // en dev, ne pas enregistrer electron.exe
  app.setLoginItemSettings({
    openAtLogin: !!cfg.autoLaunch,
    path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
    args: ['--hidden', '--startup']
  });
};

// ---------- Rich Presence Discord ----------
// Affiche sur ton profil Discord « 🤖 Gère X bots en ligne » (+ état mode jeu). Nécessite un Client ID
// d'Application Discord (portail développeur) — collé dans les réglages, ou via l'env HASU_DISCORD_APP_ID.
let rpcStart = Date.now(), lastRpc = '';
const rpcAppId = () => (process.env.HASU_DISCORD_APP_ID || cfg.discordAppId || '').trim();
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
const trayIcon = () => {
  const p = path.join(__dirname, 'icon.png');
  try { const img = nativeImage.createFromPath(p); if (!img.isEmpty()) return img.resize({ width: 16, height: 16 }); } catch {}
  return nativeImage.createEmpty();
};

const updateTray = () => {
  if (!tray) return;
  const stopped = cfg.stoppedByGame.filter((n) => n !== '-');
  const tip = statusCache.game
    ? `Hasu Panel — 🎮 ${statusCache.game}${statusCache.online ? ' (en ligne)' : ' (solo)'}${stopped.length ? ` · ${stopped.length} bot(s) coupé(s)` : ''}${cfg.lowNetApplied ? ' · 🌐 éco réseau' : ''}`
    : `Hasu Panel — ${statusCache.bots.filter((b) => b.status === 'online').length}/${statusCache.bots.length} bots en ligne`;
  tray.setToolTip(tip);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ouvrir le panel', click: () => showWindow() },
    {
      label: `Mode jeu : ${cfg.gameMode.enabled ? 'activé ✔' : 'désactivé'}`,
      click: async () => { cfg.gameMode.enabled = !cfg.gameMode.enabled; saveCfg(); if (!cfg.gameMode.enabled && cfg.stoppedByGame.length) await exitGameMode(); updateTray(); }
    },
    { type: 'separator' },
    { label: 'Quitter', click: () => { quitting = true; app.quit(); } } // le nettoyage passe par before-quit (restaure les bots + drapeaux)
  ]));
};

// ---------- Fenêtre ----------
const showWindow = () => {
  if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); return; } // restaure depuis le tray/minimisé
  win = new BrowserWindow({
    width: 1020, height: 760, minWidth: 860, minHeight: 560,
    backgroundColor: '#0f1117',
    title: 'Hasu Panel',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
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
  updatedAt: statusCache.updatedAt,
  stoppedByGame: cfg.stoppedByGame.filter((n) => n !== '-'),
  cfg: { bots: cfg.bots, gameMode: cfg.gameMode, games: cfg.games, pollSec: cfg.pollSec, autoLaunch: cfg.autoLaunch, lowNet: cfg.lowNet, packaged: app.isPackaged, imported: cfg.imported, version: app.getVersion(), scanAuto: cfg.scanAuto !== false, lastScanAt: cfg.lastScanAt || 0, discovered: cfg.discovered || [], discordRpc: cfg.discordRpc !== false, discordAppId: cfg.discordAppId || '' }
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
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
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
  if (!NAME_RE.test(String(name || '')) || !['start', 'stop', 'restart'].includes(action)) return { ok: false };
  if (actionsInFlight.has(name)) return { ok: false, out: 'action en cours' };
  actionsInFlight.add(name);
  try {
    const r = await pm2([action, name]);
    statusCache.bots = await pm2List();
    return { ok: r.ok };
  } finally {
    actionsInFlight.delete(name);
  }
});

ipcMain.handle('panel:setBot', (_e, { name, key, value } = {}) => {
  if (!NAME_RE.test(String(name || '')) || !['auto', 'gameStop'].includes(key)) return { ok: false };
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
  if (!cfg.gameMode.enabled && cfg.stoppedByGame.length) await exitGameMode(); // désactivation = tout relancer
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
  if (key === 'autoLaunch') { cfg.autoLaunch = !!value; saveCfg(); applyAutoLaunch(); return { ok: true }; }
  if (key === 'pollSec') { cfg.pollSec = Math.max(5, Math.min(120, Math.floor(Number(value) || 10))); saveCfg(); restartPoll(); return { ok: true }; }
  if (key === 'lowNet') { cfg.lowNet = !!value; saveCfg(); return { ok: true }; } // le tick applique/retire tout seul
  if (key === 'scanAuto') { cfg.scanAuto = !!value; saveCfg(); return { ok: true }; }
  if (key === 'discordRpc') { cfg.discordRpc = !!value; saveCfg(); startRpc(); return { ok: true }; }
  if (key === 'discordAppId') { cfg.discordAppId = String(value || '').trim().slice(0, 40); saveCfg(); startRpc(); return { ok: true }; }
  return { ok: false };
});

// ---------- Boucle ----------
let pollTimer = null;
const restartPoll = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => { tick().catch((e) => log('tick fatal', e.message)); }, cfg.pollSec * 1000);
};

// ---------- Démarrage ----------
if (process.argv.includes('--selftest')) {
  // Auto-test sans interface : vérifie pm2, la détection de process et la config, puis quitte.
  app.whenReady().then(async () => {
    cfg = loadCfg();
    const bots = await pm2List();
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
  app.on('second-instance', () => showWindow());
  app.whenReady().then(async () => {
    cfg = loadCfg();
    // Les bots pm2 connus obtiennent une entrée de config par défaut à la première vue.
    tray = new Tray(trayIcon());
    tray.on('double-click', () => showWindow());
    updateTray();
    applyAutoLaunch();
    startRpc(); // Rich Presence Discord (si activée + App ID configuré)
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
  let cleanedUp = false;
  app.on('before-quit', (e) => {
    quitting = true;
    if (cleanedUp) return; // nettoyage déjà fait → on laisse Electron quitter
    e.preventDefault();
    (async () => {
      try { if (cfg && cfg.stoppedByGame && cfg.stoppedByGame.length) await exitGameMode(); } catch (err) { log('quit exitGameMode', err.message); }
      try { if (cfg && cfg.lowNetApplied) await clearLowNet(); } catch (err) { log('quit clearLowNet', err.message); }
      cleanedUp = true;
      app.quit();
    })();
  });
  app.on('window-all-closed', () => { /* on reste dans le tray */ });
}
