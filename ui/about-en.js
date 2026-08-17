// Corps anglais de la fenêtre « À propos ». Volontairement dans SON fichier : c'est 8 Ko de prose,
// il noierait le dictionnaire des libellés. La version française, elle, reste écrite dans app.js —
// c'est la langue d'origine, celle qu'on relit et qu'on modifie en premier.
//
// Traduction, pas décalque : « Auto boot », « Stop in game » et les autres reprennent exactement les
// libellés anglais de l'interface, sinon l'aide décrirait des boutons qui n'existent pas.
window.ABOUT_EN = `
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
  <p>• The window's close button <b>tucks it into the notification area</b> (next to the clock). To quit: right-click the icon → Quit.<br>• Settings are stored in <code>%APPDATA%\\hasu-panel\\panel-config.json</code>, the log in <code>panel.log</code>.<br>• A <b>backup copy</b> of the settings is kept next to it (<code>.bak</code>) and picked up automatically if the main file becomes unreadable or stops being written. If saving no longer works, a <b>red banner</b> tells you — rather than letting you believe your settings are safe.<br>• The panel starts with Windows (can be switched off in ⚙️ Settings).</p>`;
