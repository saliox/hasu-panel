// English — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: 'English', ui: {
    'app.sub': 'pm2 bot manager · game mode',
    'btn.about': 'ℹ️ About',
    'btn.langTitle': 'Interface language',
    'banner.loading': 'Loading…',
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Import (file)',
    'bots.importTitle': 'Pick the bot\'s main file (index.js, bot.py…)',
    'bots.importDir': '📁 Import (folder)',
    'bots.importDirTitle': 'Pick the bot\'s FOLDER — the main file is detected automatically',
    'bots.stopAll': '⏹ Stop all',
    'bots.stopAllTitle': 'Stop EVERY running bot (click a second time to confirm)',
    'bots.stopAllArm': '⏹ Confirm?',
    'bots.stopAllBusy': '⏳ Stopping…',
    'bots.stopAllDone': '✅ {n} stopped',
    'bots.stopAllFail': '⚠️ Failed',
    'bots.hint': '"Auto boot": the bot is brought back online when you log into Windows. "Stop in game": this bot is stopped when game mode kicks in (if "only ticked bots" is selected).',
    'bots.none': 'No bots managed by pm2 yet. Add one with "➕ Import" above.',
    'bots.searching': '⏳ Looking for bots…',
    'bots.imported': '🧩 Imported bots',
    'bots.autoboot': 'Auto boot',
    'bots.gamestop': 'Stop in game',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Bring back online',
    'bots.fixBanner': '<b>{n}</b> bot(s) should be running',
    'bots.fixDone': '✅ {n} restarted',
    'bots.fixPartial': '⚠️ {n} restarted, {k} still offline',
    'gm.title': '🎮 Game mode',
    'gm.enable': 'Stop bots when a game is detected',
    'gm.all': 'All bots',
    'gm.some': 'Only bots ticked "Stop in game"',
    'gm.grace': 'Restart bots {input} s after the game closes',
    'gm.soloskip': 'Ignore <b>single-player</b> games <span class="mut12">(only stop if the game is really online)</span>',
    'gm.banner': '🎮 <b>Online game:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> detected — <b>single-player</b> session: bots stay online',
    'gm.bannerCut': ' — <b>{n} bot(s) stopped</b> (restarted automatically when you finish)',
    'gm.bannerNone': ' — no bot to stop',
    'gm.bannerOff': ' — game mode is off',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bots online — no game detected',
    'lownet.title': '🌐 Low internet usage',
    'lownet.enable': 'Give network priority to the online game',
    'lownet.hint': 'During an online match: the bots\' large downloads (anti-scam lists, encrypted backups) are paused and their priority is lowered — stricter still if your connection is slow. Everything returns to normal when the match ends. Independent from game mode: handy for bots you leave running.',
    'lownet.active': ' · 🌐 low internet usage active',
    'lownet.broken': ' · ⚠️ low internet usage: priorities applied, but the signal never reached the bots',
    'games.title': '🕹️ Detected games (processes)',
    'games.ph': 'MyGame.exe',
    'games.add': 'Add',
    'games.pick': '📋 Running programs',
    'games.pickTitle': 'Pick from open windows (start the game first)',
    'games.exe': '📁 Pick an .exe',
    'games.exeTitle': 'Browse the disk for the game\'s .exe',
    'games.scan': '🔍 Scan',
    'games.scanTitle': 'Look for installed games (Steam, Epic) missing from the list',
    'games.hint': '"Running programs" lists what is actually running on YOUR PC (a game, or any software the default list does not know): start the game, then pick it — that is the most accurate way. "Scan" searches your Steam/Epic libraries (once a day, never continuously).',
    'set.title': '⚙️ Settings',
    'set.autolaunch': 'Start the panel when Windows starts',
    'set.poll': 'Check games / bots every {input} seconds',
    'set.scanauto': 'Look for newly installed games <b>once a day</b>',
    'set.scanHint': 'The check above only reads the process list (very cheap). The disk scan for games <b>never runs continuously</b>: once a day at most, or via the "🔍 Scan" button.',
    'set.saveInfoTitle': 'pm2 restores this list when the PC starts — it is saved again after every start/stop done here.',
    'set.saved': 'Last pm2 save: {d}',
    'set.savedNever': 'No pm2 save from this panel yet.',
    'alerts.title': '🔔 Alerts (bot going down)',
    'alerts.enable': 'Tell me when a bot <b>goes down</b> or <b>restarts in a loop</b>',
    'alerts.toast': 'Windows notification (only useful if I am at the PC)',
    'alerts.sound': 'Soft sound with the notification',
    'alerts.volTitle': 'Sound volume',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (reaches you even mid-game)',
    'alerts.test': 'Test',
    'alerts.hint': 'The <b>Discord webhook</b> is the most useful one: it reaches you mid-match or away from the PC. In Discord: <b>Channel settings → Integrations → Webhooks → New webhook → Copy URL</b>. The alert states <b>the cause in plain words</b> (internet down, invalid token, missing module…).',
    'alerts.suppressed': ' — ⚠️ {n} alert(s) delayed this hour (anti-spam cap).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': 'Show "🤖 Managing X bots online" on my Discord profile',
    'rpc.idPh': 'Leave empty — the Hasu Panel application is used by default',
    'rpc.hint': 'Nothing to set up: it works as soon as you switch it on (<b>Discord just has to be running</b> on this PC). The field above only matters if you want to show <b>your own</b> Discord application — in that case paste its <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — off.',
    'rpc.on': ' — ✅ on.',
    'rpc.needId': ' — ⚠️ paste your Application ID to switch it on.',
    'upd.title': '🔄 Updates',
    'upd.version': 'Version:',
    'upd.check': 'Check for updates',
    'upd.auto': 'Install updates <b>on their own</b> <span class="mut11">(never mid-game, nor during an action on the bots)</span>',
    'upd.searching': '⏳ Checking for updates…',
    'upd.dev': 'ℹ️ Auto-update only works in the installed version (Setup.exe), not in development.',
    'upd.uptodate': '✅ You already have the latest version ({v}).',
    'upd.availableMsg': '⬇️ New version <b>{v}</b> found — downloading, it will be ready shortly.',
    'upd.readyMsg': '✅ <b>Update ready</b> — click "Restart & apply".',
    'upd.errorMsg': '⚠️ Cannot check right now{d}. Try again later.',
    'upd.unexpected': '⚠️ Unexpected answer.',
    'upd.cardDownloading': 'Downloading the update…',
    'upd.cardReady': 'Update ready to install',
    'upd.cardAvailable': 'New version available',
    'upd.cardPreparing': 'preparing…',
    'upd.cardBroken': 'Update interrupted',
    'upd.install': 'Install and restart',
    'upd.later': 'Later',
    'upd.laterTitle': 'Hide this card',
    'upd.retry': 'Try again',
    'upd.restarting': 'Restarting…',
    'upd.whyManual': 'Automatic install is off — apply it whenever you like.',
    'upd.whyWaiting': 'It will install on its own as soon as possible — waiting on: {list}.',
    'upd.whyWindow': 'It will install on its own as soon as you close this window.',
    'heal.title': '🔧 Automatic restart',
    'heal.enable': 'Restart a <b>downed</b> bot on its own <span class="mut11">(after 5 min, then 15 min, then 1 h)</span>',
    'heal.hint': 'Once pm2 has used up its own restarts, the bot stays dead until you happen to notice. The panel retries for you, then <b>stops after 3 attempts</b>: a bot that refuses to come back three times has a real problem, and the alert must stay visible. It never touches a bot <b>you</b> stopped, nor one stopped by game mode.',
    'inc.title': '📓 Recent incidents',
    'inc.none': 'No incident recorded. That is a good sign.',
    'cfg.failTitle': 'Your settings are no longer being saved',
    'cfg.failBody': 'They are kept in a backup copy and remain active, but the main file refuses to be written.',
    'cfg.failWhy': 'File: {path} — look at your antivirus, a folder sync, or a full disk.',
    'logs.title': '{name} logs',
    'logs.out': 'Output',
    'logs.err': 'Errors',
    'logs.filterPh': 'Filter…',
    'logs.copy': 'Copy',
    'logs.openFolder': '📂 Log folder',
    'logs.close': 'Close',
    'logs.empty': 'No logs yet.',
    'logs.unreadable': 'The log file exists, but could not be read (locked, or access denied).',
    'logs.noMatch': 'No line contains "{q}".',
    'logs.failed': 'Could not read the logs.',
    'tc.pm2Missing': '<b>⚠️ pm2 is not installed.</b><br>pm2 is the tool that keeps your bots running. Click to install it automatically (no administrator rights needed).',
    'tc.pm2Install': 'Install pm2',
    'tc.pm2Busy': ' ⏳ installing pm2… (up to 1 min)',
    'tc.pm2Ok': ' ✅ pm2 installed!',
    'tc.pm2NoNode': ' ❌ Node.js is required first.',
    'tc.pm2Fail': ' ❌ Failed — try again, or install pm2 by hand.',
    'tc.pm2Down': 'pm2 is not responding — the bots\' state cannot be read.',
    'tray.open': 'Open the panel',
    'tray.game': 'Game mode: {v}',
    'tray.on': 'on ✔',
    'tray.off': 'off',
    'tray.update': '🔄 Update ready — apply & restart',
    'tray.quit': 'Quit',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bots online',
    'tray.online': ' (online)',
    'tray.solo': ' (single-player)',
    'tray.cut': ' · {n} bot(s) stopped',
    'tray.low': ' · 🌐 low net',
    'blk.game': 'a game is running',
    'blk.unknown': 'unsure whether a game is running',
    'blk.busy': 'game-mode switch in progress',
    'blk.action': 'an action on a bot is running',
    'blk.stopAll': 'global stop in progress',
    'blk.parked': 'bots stopped by game mode',
    'blk.lownet': 'low internet usage active',
    'blk.window': 'window open',
    'blk.grace': 'grace period',
    'set.lastScan': '(last scan: {d})',
    'set.noScan': '(no scan yet)',
    'set.devOnly': '(only active in the .exe version)',
    'bots.netTitle': 'The bot\'s network traffic, measured through its I/O (for a Discord bot, almost entirely network plus a little SQLite disk) — ↓ received · ↑ sent',
    'bots.parked': '⏸ stopped by game mode',
    'bots.autobootTitle': 'Brought back online when you log into Windows',
    'bots.gamestopTitle': 'Stopped when a game is detected ("ticked bots" mode)',
    'bots.logsTitle': 'See recent logs (crashes, errors…)',
    'bots.folderTitle': 'Open the bot\'s folder in Explorer',
    'bots.removeTitle': 'Stop this bot and remove it from pm2 (its files are left untouched)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — what is it?</h2>
  <p>A control panel for <b>all your bots</b>: they run in the background thanks to <b>pm2</b>, and you manage them here without touching a console.</p>
  <h3>🤖 The bot list</h3>
  <p>One line per bot. A <b style="color:#3ba55d">green</b> dot means running, grey means stopped, <b style="color:#ed4245">red</b> means errored. Buttons: ▶ start · ⏹ stop · ⟳ restart · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> shows the bot's <b>last lines</b> (errors, crashes…) — handy to understand why it went down, <b>without opening a terminal</b>.</p>
  <p><b>Auto boot</b>: ticked → the bot is brought back online on its own when you turn the PC on. Unticked → it stays off at startup.</p>
  <p><b>⏹ Stop all</b> (above the list) stops <b>every running bot</b> at once. Safety: you have to click <b>twice</b> to confirm.</p>
  <p>On every stop the panel cleans up: the <b>small programs a bot started</b> (the music bot's ffmpeg, an ongoing install…) that used to survive and clutter the PC are <b>closed properly</b> too.</p>
  <p>If a bot that should be running is off, a <b>banner</b> appears at the top of the list with a <b>"Bring back online"</b> button that restarts them all at once. It only counts what <b>actually came back</b>: if a bot refuses to start (folder moved, file missing), it tells you instead of claiming success.</p>
  <h3>🔔 Being told when a bot goes down</h3>
  <p>This is what the panel is for: never again find out <b>three days later</b> that a bot is dead. When a bot goes down or restarts in a loop, you get a <b>discreet Windows notification</b> with a <b>soft sound</b> (adjustable volume), and the alert states <b>the cause in plain words</b> — internet down, invalid token, missing module, out of memory…</p>
  <p>The most useful one is the <b>Discord webhook</b>: it reaches you mid-match, or when you are away from the PC. In Discord: <b>Channel settings → Integrations → Webhooks → New webhook → Copy URL</b>, then paste it into ⚙️ Settings.</p>
  <p>The panel tells a <b>failure</b> apart from a <b>deliberate stop</b>: if you stop a bot yourself — from the panel <i>or</i> from a terminal — it does not alert you, does not restart it, and will not bring it back at the next startup. It also stays quiet when the PC wakes up and just after launch, while the network comes back, so you never get a burst of bogus alerts.</p>
  <p>If sending fails — typically because the outage <i>is</i> the internet being down — the alert is <b>retried</b> instead of being lost. And if pm2 itself stops answering, the panel tells you: without that, no alert would be possible at all and the silence would look like "all good".</p>
  <h3>➕ Importing a bot</h3>
  <p>Got a bot you usually start by hand (say from <b>Visual Studio</b> with <code>node index.js</code>)? Click "Import" (<b>file</b> or <b>whole folder</b> — in that case the main file is detected for you), give it a name, and that is it:</p>
  <p>• it runs <b>in the background</b>, even with Visual Studio closed;<br>• it <b>restarts on its own</b> if it crashes;<br>• it <b>survives PC reboots</b>;<br>• it is managed here <b>like the others</b> (auto boot, game mode…).</p>
  <p>The 🗑 button stops the bot and removes it from pm2 — <b>its files are never touched</b>.</p>
  <h3>🎮 Game mode</h3>
  <p>When a game from the list is detected (Fortnite, Valorant…), the panel <b>stops the bots you chose</b> to free the PC while you play, then <b>restarts them automatically</b> about a minute after the game closes. You decide: stop <b>all</b> bots, or only the ones ticked "Stop in game".</p>
  <p><b>Single-player?</b> The panel checks whether the game is <b>really connected to the internet</b>: an offline session stops nothing (option "Ignore single-player games"). For example: GTA V story mode → bots stay up; GTA Online → game mode kicks in.</p>
  <h3>🕹️ Adding a game to the detection</h3>
  <p>Three ways: <b>📋 Running programs</b> (start the game and pick it from the list — the most accurate, and it works for any software), <b>📁 Pick an .exe</b> (browse the disk), or <b>🔍 Scan</b> (searches your Steam/Epic libraries and suggests installed games missing from the list).</p>
  <p>The disk scan <b>never runs continuously</b>: automatically <b>once a day</b> at most (can be switched off in ⚙️ Settings), or when you click "Scan". The permanent watch only reads the process list — practically free.</p>
  <h3>🌐 Low internet usage</h3>
  <p>Switched on, this gives <b>network priority to the online game</b>: during the match, bots postpone their <b>large downloads</b> (anti-scam lists, encrypted backups) and drop to <b>low priority</b> — stricter still if your connection is slow (measured automatically). Everything returns to normal when the match ends. Independent from game mode: perfect to keep a bot online <i>without</i> it causing lag.</p>
  <h3>🔄 Automatic updates</h3>
  <p>The panel <b>updates itself</b>: it checks at launch and then every 6 h, and everything happens <b>inside the window</b>. A card appears at the top as soon as a version is found: <b>progress bar</b> with percentage, speed and size, then the <b>release notes</b> and an <b>"Install and restart"</b> button. "Later" hides the card — the install itself carries on.</p>
  <p>In principle you have <b>nothing to click</b>: the update installs on its own as soon as it is safe. It <b>never</b> does so mid-game, nor during an action on the bots, nor while you are looking at the window — the card tells you exactly <b>what it is waiting for</b>. Close the window and it applies. (Can be switched off in ⚙️ Settings, with the "Check for updates" button to force a check.)</p>
  <h3>🔋 Light on resources</h3>
  <p>The panel runs around the clock without getting in the way: when it is <b>tucked in the notification area</b>, it <b>slows its watch down</b> and stops computing display nobody is looking at. Reopen the window and everything is instant again. (If game mode or low internet usage is active, it stays responsive so it misses nothing.)</p>
  <h3>🎮 Your Discord presence</h3>
  <p>The "Rich Presence" option makes your Discord profile show <b>"🤖 Managing X bots online"</b> (and the current game). <b>Nothing to set up</b> — Discord just has to be running. Purely cosmetic, and can be switched off in ⚙️ Settings.</p>
  <h3>🧰 On a fresh PC (a friend's)</h3>
  <p>Bots need <b>Node.js</b> and <b>pm2</b>. If either is missing, the panel <b>detects it</b> and offers the right button ("Download Node.js" or "Install pm2") instead of showing an empty list.</p>
  <h3>📁 Good to know</h3>
  <p>• The window's close button <b>tucks it into the notification area</b> (next to the clock). To quit: right-click the icon → Quit.<br>• Settings are stored in <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, the log in <code>panel.log</code>.<br>• A <b>backup copy</b> of the settings is kept next to it (<code>.bak</code>) and picked up automatically if the main file becomes unreadable or stops being written. If saving no longer works, a <b>red banner</b> tells you — rather than letting you believe your settings are safe.<br>• The panel starts with Windows (can be switched off in ⚙️ Settings).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['en'] = L; }
})();
