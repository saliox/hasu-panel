# Hasu Panel

Application de bureau (Electron) pour gérer les bots **pm2** de la machine : mise en ligne automatique au démarrage de Windows, actions start/stop/restart, et **mode jeu** (les bots sont coupés quand un jeu multijoueur est détecté, puis relancés à la fin de la partie).

> Léger, **zéro dépendance externe**, 100 % local (aucun serveur, aucun contenu distant). Pensé pour tourner discrètement dans la barre système.

## ✨ Fonctionnalités en un coup d'œil

- 🟢 **Gestion pm2** : start / stop / restart de chaque bot, état en direct (statut, RAM, CPU, **débit réseau**, redémarrages).
- 🚀 **Auto-boot par bot** : à l'ouverture de session Windows, démarre les bots cochés et arrête les décochés.
- 🎮 **Mode jeu** : coupe automatiquement les bots quand un **jeu multijoueur en ligne** est détecté, et les relance à la fin de la partie (distinction **solo/en ligne** via les connexions réseau du jeu — un jeu solo ne coupe rien).
- 🌐 **Faible usage internet** : pendant une partie en ligne, abaisse la priorité CPU des bots et diffère leurs gros transferts réseau (priorité au jeu).
- 🔍 **Découverte de jeux** : scanne les bibliothèques **Steam** et **Epic** (1×/jour max, jamais pendant une partie) et propose les jeux à ajouter.
- ➕ **Import de bots** : confie n'importe quel script (`.js`, `.mjs`, `.cjs`, `.py`) à pm2 en un clic (auto-boot, mode jeu, survit au reboot).
- 🔽 **Barre système** : réduire **ou** fermer envoie l'app dans le tray ; elle tourne en fond et revient d'un double-clic.
- 🎮 **Rich Presence Discord** : affiche « 🤖 Gère X bots en ligne » (+ état mode jeu) sur ton profil Discord — via l'IPC natif de Discord, sans dépendance. Nécessite un *Application ID* Discord à coller dans les réglages.
- 🔒 **Sécurisé** : validation stricte anti-injection, `contextIsolation`, aucun contenu distant.

## Lancement

- **Exe** : `dist\win-unpacked\HasuPanel.exe` (construit avec `npm run dist`).
- **Dev** : `npm start` (l'option « lancer au démarrage » n'est active que dans la version exe).
- **Auto-test sans interface** : `npx electron . --selftest`.
- **Réduire** ou **fermer** la fenêtre la place dans la **zone de notification** (tray) — l'app tourne en fond, un double-clic sur l'icône la ramène. Quitter vraiment : clic droit sur l'icône tray → Quitter.
- Arguments : `--hidden` (démarre dans le tray) · `--startup` (applique les réglages « auto boot » des bots, utilisé par le lancement à l'ouverture de session).

## Ce que fait le panel

1. **Auto boot par bot** : à l'ouverture de session (lancement avec `--startup`), le panel attend ~8 s (le temps que `saliox-pm2-resurrect.cmd` fasse son `pm2 resurrect`), puis **arrête** les bots décochés et **démarre** les bots cochés. Le `.cmd` de la Startup est conservé : c'est la ceinture de sécurité si le panel ne démarre pas.
2. **Mode jeu** : toutes les `pollSec` secondes (défaut 10), le panel lit la liste des process (`tasklist`, très léger). Si un exe de la liste des jeux tourne et que le mode jeu est activé → il coupe **tous** les bots ou **seulement ceux cochés « Coupé en jeu »**. Quand le jeu est fermé depuis plus de `graceSec` secondes (défaut 60) → il relance ce qu'il avait coupé. La liste des bots coupés est **persistée** (survit à un crash/redémarrage du panel).
   - **Solo vs en ligne** (`soloSkip`, défaut on) : le mode jeu ne se déclenche que si le jeu a une **connexion TCP établie vers une IP publique** (`netstat -ano` sur ses PID). Un jeu solo/hors-ligne ne coupe rien ; passer de GTA histoire à GTA Online déclenche bien (revérifié à chaque tick).
3. **Watchdog saliox** : le watchdog n'alerte plus que sur les **crash-loops** (les arrêts/démarrages sont visibles dans le panel, plus de MP « hors-ligne »). Le panel écrit toujours `panel_maintenance.json` avant de couper (compat/futur), et saliox est coupé en dernier / relancé en premier.
3bis. **Faible usage internet** (`lowNet`, indépendant du mode jeu) : pendant une partie **en ligne**, le panel écrit `saliox bot\data\lownet.json` (lu par `systems/lownet.js` → phishlist et backups off-serveur **différés**) et abaisse la **priorité CPU** des bots en ligne (`BelowNormal`, ou `Idle` si le lien mesuré fait < 100 Mbps — `Get-NetAdapter LinkSpeed`). Tout est restauré à la fin de la partie, à la désactivation, au quit du panel, ou au prochain démarrage (drapeau persisté + expiration 6 h côté saliox).
3ter. **Découverte de jeux** : le bouton **🔍 Scanner** (et un scan auto **1×/jour max**, désactivable, jamais pendant une partie) parcourt les bibliothèques **Steam** (`libraryfolders.vdf` + `appmanifest_*.acf` → plus gros .exe du dossier) et **Epic** (manifestes JSON) et **propose** les jeux absents de la liste (ajouter / ignorer). Le scan disque ne tourne **jamais en continu**. « 📋 Programmes ouverts » liste les fenêtres actives (PowerShell `MainWindowTitle`) pour ajouter précisément un jeu/logiciel qui tourne ; « 📁 Choisir un .exe » parcourt le disque.
4. **Import de bots** (« ➕ Importer un bot ») : choisis le fichier principal (`index.js`, `main.js`, `bot.py`…) d'un projet lancé d'habitude à la main (ex. Visual Studio) → il est confié à pm2 (`pm2 start … --name … --cwd …` + `pm2 save`) et apparaît dans la catégorie **🧩 Bots importés**, gérable comme les autres (auto boot, mode jeu, start/stop). Le bouton 🗑 fait `pm2 delete` + `pm2 save` — les fichiers du bot ne sont jamais touchés. Extensions acceptées : .js, .mjs, .cjs, .py ; chemins avec métacaractères cmd (`& | < > ^ " % !`) refusés (anti-injection, shell:true).
5. **À propos** (bouton ℹ️ en haut) : explication simple de chaque fonction du panel, directement dans l'app.

## Fichiers

- Config : `%APPDATA%\hasu-panel\panel-config.json` (bots, jeux, mode jeu, réglages).
- Log : `%APPDATA%\hasu-panel\panel.log`.
- Démarrage auto du panel : clé registre `HKCU\...\Run\HasuPanel` (gérée par le toggle « Lancer le panel au démarrage de Windows »).

## Sécurité

- Noms pm2 validés par regex stricte (pas d'espace/quote) avant tout appel shell → pas d'injection.
- Noms d'exe de jeu validés (`*.exe`, caractères sûrs) côté main process (la validation UI ne suffit jamais).
- `contextIsolation` activé, `nodeIntegration` désactivé, aucun contenu distant chargé, CSP stricte.

## Intégration avec le bot (optionnelle)

Le panel peut se coordonner avec un bot voisin en écrivant deux drapeaux dans son dossier `data` : `panel_maintenance.json` (bots coupés volontairement → pas d'alerte hors-ligne) et `lownet.json` (mode faible usage internet). Le chemin par défaut est `<profil>\Desktop\saliox bot\data` ; personnalisable via la variable d'environnement **`HASU_SALIOX_DATA`**. Cette intégration est facultative : sans bot voisin, le panel fonctionne normalement.

## Licence

[MIT](LICENSE) — libre d'utilisation, de modification et de redistribution.
