<div align="center">

# 🛡️ Hasu Panel

**A lightweight desktop control panel for your [pm2](https://pm2.keymetrics.io/) bots.**
It watches them, tells you when one goes down, restarts it for you, frees your PC while you game — and keeps itself up to date.

![platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)
![built with](https://img.shields.io/badge/built%20with-Electron-47848F?logo=electron)
![auto update](https://img.shields.io/badge/auto--update-yes-3ba55d)
![languages](https://img.shields.io/badge/languages-14-5865F2)

</div>

---

## ✨ What it does

### Watching your bots

- **🤖 One place for all your bots** — live status of every pm2 process (uptime, RAM, CPU, network, restarts) with one-click **start / stop / restart**, plus a log viewer so you never need a terminal to find out why one crashed.
- **🔔 Told when a bot goes down** — a discreet Windows notification with a soft sound, and a **Discord webhook** that reaches you mid-match or away from the PC. The alert states **the cause in plain words**: internet down, invalid token, missing module, out of memory.
- **🔧 Restarted for you** — once pm2 has used up its own retries, a dead bot normally stays dead until you notice. The panel retries after 5 min, 15 min and 1 h, then **stops after three attempts** and keeps the alert visible: a bot that refuses to come back three times has a real problem.
- **🧠 Knows a crash from your own decision** — stop a bot yourself, from the panel *or* from a terminal, and it is neither alerted nor restarted. It also stays quiet while the PC wakes up, so you never get a burst of bogus alerts.
- **📓 Incident history** — the last 40 events (down, loop, back up, restarted, restart failed) with their cause, so "why did it restart eight times?" has an answer.
- **▶️ Auto-boot per bot** — pick which bots come online when Windows starts. Reliable even on Windows 11 (uses both the Run key *and* a logon scheduled task, because Windows can delay Run-key apps by minutes).

### Getting out of your way

- **🎮 Game mode** — when an **online** multiplayer game is detected, the panel pauses the bots you choose and brings them back a minute after you close the game. Solo/offline sessions are ignored (checked via real network activity, not just the process name).
- **🌐 Low-internet mode** — during an online match, bots defer their heavy downloads and drop to low CPU priority so your game gets the bandwidth. Everything returns to normal afterwards.
- **🔍 Game auto-detect** — scans your Steam & Epic libraries (once a day, never continuously) and lets you add any running program in one click.
- **🔋 Light on resources** — tucked in the tray it slows its watch down and stops computing display nobody is looking at; reopen the window and it is instant again.

### Living with it

- **🌍 14 languages** — Français, English, Español, Português (BR), Deutsch, Italiano, Nederlands, Polski, Русский, Türkçe, العربية, 简体中文, 日本語, 한국어. Pick one from the dropdown at the top; the whole window, the tray menu and the built-in help follow. Arabic switches the layout to right-to-left.
- **➕ Import any bot** — point it at a script (`index.js`, `bot.py`…) or a folder; it is handed to pm2 and managed like the rest. Your files are never modified.
- **🔄 Updates inside the window** — a card shows the new version, a live progress bar, the release notes and an **Install and restart** button. In practice you click nothing: it installs itself as soon as it is safe, and **never** mid-game, mid-action on a bot, or while you are looking at the window. The card tells you exactly what it is waiting for.
- **🎧 Discord Rich Presence** *(optional)* — shows "🤖 Managing X bots online" on your profile.

## 🚀 Install

Download the latest **`HasuPanel-Setup.exe`** from the [Releases](https://github.com/saliox/hasu-panel/releases/latest) page and run it.
No admin rights required — it installs per-user and starts automatically at login (toggleable).

Closing the window minimizes to the tray. To quit: right-click the tray icon → **Quit**.

## 🔒 Privacy

Hasu Panel holds **no credentials** — it only talks to your local pm2. The only network calls are the update check (GitHub), your own Discord webhook if you set one, and Discord Rich Presence if you enable it.

Alerts are **redacted before they leave the machine**: when an error is not one the panel recognises, it forwards the last log line — with IP addresses and your Windows user name stripped out first.

Settings and logs live in `%APPDATA%\hasu-panel`. A backup copy of the settings is kept beside them and picked up automatically if the main file becomes unreadable or stops being written; if saving stops working, the window says so in red rather than letting you believe your settings are safe.

## 🛠️ Build from source

```bash
npm install
npm test           # ESLint + 130 unit tests
npm start          # run in dev
npm run installer  # build the Windows installer (dist/)
```

Pure logic lives in `logic.js` and `validators.js` and is fully covered by tests; `main.js` keeps only the I/O wrappers. Translations are one file per language in `ui/lang/`, and `npm test` checks every language against French for key parity, placeholders and HTML tags — a half-translated language fails the build instead of shipping quietly.

---

<div align="center">
<sub>Made with Electron · pm2 · a lot of tea 🍵</sub>
</div>
