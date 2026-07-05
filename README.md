<div align="center">

# 🛡️ Hasu Panel

**A lightweight desktop control panel for your [pm2](https://pm2.keymetrics.io/) bots.**
Auto-boot your bots at login, free your PC while gaming, and keep the app up to date on its own.

![platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)
![built with](https://img.shields.io/badge/built%20with-Electron-47848F?logo=electron)
![auto update](https://img.shields.io/badge/auto--update-yes-3ba55d)

</div>

---

## ✨ What it does

- **🤖 One place for all your bots** — live status of every pm2 process (uptime, RAM, CPU, network, restarts) with one-click **start / stop / restart**.
- **▶️ Auto-boot per bot** — pick which bots come online automatically when Windows starts. Reliable even on Windows 11 (uses both the Run key *and* a logon scheduled task, because Windows can delay Run-key apps by minutes).
- **🎮 Game mode** — when an **online** multiplayer game is detected, the panel pauses the bots you choose and brings them back a minute after you close the game. Solo/offline sessions are ignored (checked via real network activity, not just the process name).
- **🌐 Low-internet mode** — during an online match, bots defer their heavy downloads and drop to low CPU priority so your game gets the bandwidth. Everything returns to normal afterwards.
- **➕ Import any bot** — point it at a script (`index.js`, `bot.py`…) or a folder; it's handed to pm2 and managed like the rest. Your files are never modified.
- **🔍 Game auto-detect** — scans your Steam & Epic libraries (once a day, never continuously) and lets you add any running program in one click.
- **🎧 Discord Rich Presence** *(optional)* — shows "🤖 Managing X bots online" on your profile.
- **🔄 Auto-update** — new versions download in the background and install on the next restart. Nothing to do.

## 🚀 Install

Download the latest **`HasuPanel-Setup.exe`** from the [Releases](https://github.com/saliox/hasu-panel/releases/latest) page and run it.
No admin rights required — it installs per-user and starts automatically at login (toggleable).

Closing the window minimizes to the tray. To quit: right-click the tray icon → **Quit**.

## 🔄 How updates work

Hasu Panel checks its GitHub releases on startup and every few hours. When a new version is available it's downloaded silently and applied the next time the app restarts (i.e. your next reboot) — or immediately via the tray's **"Update ready"** item. Install it once, and it stays current forever.

## 🔒 Privacy

Hasu Panel holds **no credentials** — it only talks to your local pm2. It never sends your data anywhere: the only network calls are the update check (GitHub) and, if you enable it, Discord Rich Presence. Settings and logs live in `%APPDATA%\hasu-panel` and are never bundled or uploaded.

## 🛠️ Build from source

```bash
npm install
npm start          # run in dev
npm run installer  # build the Windows installer (dist/)
```

---

<div align="center">
<sub>Made with Electron · pm2 · a lot of tea 🍵</sub>
</div>
