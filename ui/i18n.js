// Traductions de l'interface (français / anglais).
//
// Ce fichier est chargé DEUX FOIS, par deux mondes différents : par la fenêtre (balise <script>, donc
// il ne doit rien exiger d'autre) et par le processus principal via `require`, pour que le menu de la
// zone de notification et les alertes parlent la même langue que l'écran. D'où la queue UMD en bas.
//
// Règles de tenue :
//  • une clé = une phrase COMPLÈTE. Découper « Relancer les bots {n} s après… » en trois morceaux
//    recollés dans le code produit des tournures fausses dès qu'une langue change l'ordre des mots.
//  • les valeurs peuvent contenir du HTML (gras) : elles viennent de CE fichier, jamais de l'extérieur.
//    Tout ce qui vient de pm2, d'un log ou d'une release passe par `esc()` côté appelant.
//  • `{x}` est un emplacement remplacé par t(clé, { x: … }).

(function () {

const DICT = {
  fr: {
    'app.sub': 'gestion des bots pm2 · mode jeu',
    'btn.about': 'ℹ️ À propos',
    'btn.lang': '🇬🇧 English',
    'btn.langTitle': 'Switch the panel to English',
    'banner.loading': 'Chargement…',

    // ---- Bots
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Importer (fichier)',
    'bots.importTitle': 'Choisir le fichier principal du bot (index.js, bot.py…)',
    'bots.importDir': '📁 Importer (dossier)',
    'bots.importDirTitle': 'Choisir le DOSSIER du bot — le fichier principal est détecté automatiquement',
    'bots.stopAll': '⏹ Tout arrêter',
    'bots.stopAllTitle': 'Arrêter TOUS les bots en ligne (clique une 2e fois pour confirmer)',
    'bots.stopAllArm': '⏹ Confirmer ?',
    'bots.stopAllBusy': '⏳ Arrêt…',
    'bots.stopAllDone': '✅ {n} arrêté(s)',
    'bots.stopAllFail': '⚠️ Échec',
    'bots.hint': '« Auto boot » : le bot est (re)mis en ligne à l\'ouverture de session Windows. « Coupé en jeu » : ce bot est arrêté quand le mode jeu se déclenche (si « seulement les bots cochés »).',
    'bots.none': 'Aucun bot géré par pm2 pour l\'instant. Importe un bot avec « ➕ Importer » ci-dessus.',
    'bots.searching': '⏳ Recherche des bots en cours…',
    'bots.imported': '🧩 Bots importés',
    'bots.autoboot': 'Auto boot',
    'bots.gamestop': 'Coupé en jeu',
    'bots.logs': '📄 Logs',
    'bots.folder': '📂',
    'bots.remove': '🗑',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Remettre en ordre',
    'bots.fixBanner': '<b>{n}</b> bot(s) devraient être en ligne',
    'bots.fixDone': '✅ {n} relance(s)',
    'bots.fixPartial': '⚠️ {n} relancé(s), {k} toujours hors ligne',

    // ---- Mode jeu
    'gm.title': '🎮 Mode jeu',
    'gm.enable': 'Couper des bots quand un jeu est détecté',
    'gm.all': 'Tous les bots',
    'gm.some': 'Seulement les bots cochés « Coupé en jeu »',
    'gm.grace': 'Relancer les bots {input} s après la fermeture du jeu',
    'gm.soloskip': 'Ignorer les jeux <b>solo</b> <span class="mut12">(ne couper que si le jeu est vraiment en ligne)</span>',
    'gm.banner': '🎮 <b>Jeu en ligne :</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> détecté — partie <b>solo</b> : les bots restent en ligne',
    'gm.bannerCut': ' — <b>{n} bot(s) coupé(s)</b> (relance auto à la fin de la partie)',
    'gm.bannerNone': ' — aucun bot à couper',
    'gm.bannerOff': ' — mode jeu désactivé',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bots en ligne — aucun jeu détecté',

    // ---- Éco réseau
    'lownet.title': '🌐 Faible usage internet',
    'lownet.enable': 'Priorité réseau au jeu en ligne',
    'lownet.hint': 'Pendant une partie en ligne : les gros téléchargements des bots (listes anti-scam, sauvegardes chiffrées) sont mis en pause et leur priorité est abaissée — automatiquement plus strict si ta connexion est lente. Tout revient à la normale à la fin de la partie. Indépendant du mode jeu : utile pour les bots que tu laisses tourner.',
    'lownet.active': ' · 🌐 faible usage internet actif',
    'lownet.broken': ' · ⚠️ éco réseau : priorités appliquées, mais le signal envoyé aux bots n’est pas passé',

    // ---- Jeux
    'games.title': '🕹️ Jeux détectés (process)',
    'games.ph': 'MonJeu.exe',
    'games.add': 'Ajouter',
    'games.pick': '📋 Programmes ouverts',
    'games.pickTitle': 'Choisir parmi les fenêtres ouvertes (lance le jeu d\'abord)',
    'games.exe': '📁 Choisir un .exe',
    'games.exeTitle': 'Parcourir le disque pour choisir le .exe du jeu',
    'games.scan': '🔍 Scanner',
    'games.scanTitle': 'Cherche les jeux installés (Steam, Epic) absents de la liste',
    'games.hint': '« Programmes ouverts » liste ce qui tourne sur TON PC (jeu ou logiciel inconnu de la liste par défaut) : lance le jeu puis choisis-le — c\'est le plus précis. « Scanner » fouille les bibliothèques Steam/Epic (1×/jour automatique, jamais en continu).',

    // ---- Réglages
    'set.title': '⚙️ Réglages',
    'set.autolaunch': 'Lancer le panel au démarrage de Windows',
    'set.poll': 'Vérifier les jeux / bots toutes les {input} secondes',
    'set.scanauto': 'Chercher de nouveaux jeux installés <b>1×/jour</b>',
    'set.scanHint': 'La vérification ci-dessus ne lit que la liste des process (très léger). Le scan disque des jeux, lui, ne tourne <b>jamais en continu</b> : 1×/jour maximum, ou via le bouton « 🔍 Scanner ».',
    'set.saveInfoTitle': 'pm2 restaure cette liste au démarrage du PC — elle est réenregistrée après chaque démarrage/arrêt fait ici.',
    'set.saved': 'Dernière sauvegarde pm2 : {d}',
    'set.savedNever': 'Aucune sauvegarde pm2 depuis ce panel.',

    // ---- Alertes
    'alerts.title': '🔔 Alertes (bot qui tombe)',
    'alerts.enable': 'Me prévenir quand un bot <b>tombe</b> ou <b>redémarre en boucle</b>',
    'alerts.toast': 'Notification Windows (utile seulement si je suis devant le PC)',
    'alerts.sound': 'Petit son avec la notification',
    'alerts.volTitle': 'Volume du son',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (te prévient même en jeu)',
    'alerts.test': 'Tester',
    'alerts.hint': 'Le <b>webhook Discord</b> est le plus utile : il te touche même en pleine partie ou absent du PC. Dans Discord : <b>Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l\'URL</b>. L\'alerte indique <b>la cause en clair</b> (Internet coupé, token invalide, module manquant…).',
    'alerts.suppressed': ' — ⚠️ {n} alerte(s) différée(s) cette heure (plafond anti-spam).',

    // ---- Rich Presence
    'rpc.title': '🎮 Rich Presence Discord',
    'rpc.enable': 'Afficher « 🤖 Gère X bots en ligne » sur mon profil Discord',
    'rpc.idPh': 'Laisse vide — application Hasu Panel utilisée par défaut',
    'rpc.hint': 'Rien à configurer : ça fonctionne dès l\'activation (il faut juste que <b>Discord soit ouvert</b> sur ce PC). Le champ ci-dessus n\'est utile que si tu veux afficher <b>ta propre</b> application Discord — dans ce cas, colle son <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — désactivée.',
    'rpc.on': ' — ✅ activée.',
    'rpc.needId': ' — ⚠️ colle ton Application ID pour l\'activer.',

    // ---- Mises à jour
    'upd.title': '🔄 Mises à jour',
    'upd.version': 'Version :',
    'upd.check': 'Vérifier les mises à jour',
    'upd.apply': 'Redémarrer & appliquer',
    'upd.auto': 'Installer les mises à jour <b>toutes seules</b> <span class="mut11">(jamais pendant une partie ni une manip sur les bots)</span>',
    'upd.searching': '⏳ Recherche de mise à jour…',
    'upd.dev': 'ℹ️ L\'auto-update ne fonctionne que dans la version installée (Setup.exe), pas en développement.',
    'upd.uptodate': '✅ Tu as déjà la dernière version ({v}).',
    'upd.availableMsg': '⬇️ Nouvelle version <b>{v}</b> trouvée — téléchargement en cours, elle sera prête dans un instant.',
    'upd.readyMsg': '✅ <b>Mise à jour prête</b> — clique « Redémarrer & appliquer ».',
    'upd.errorMsg': '⚠️ Impossible de vérifier maintenant{d}. Réessaie plus tard.',
    'upd.unexpected': '⚠️ Réponse inattendue.',
    'upd.cardDownloading': 'Téléchargement de la mise à jour…',
    'upd.cardReady': 'Mise à jour prête à être installée',
    'upd.cardAvailable': 'Nouvelle version disponible',
    'upd.cardPreparing': 'préparation…',
    'upd.cardBroken': 'Mise à jour interrompue',
    'upd.install': 'Installer et redémarrer',
    'upd.later': 'Plus tard',
    'upd.laterTitle': 'Masquer cette carte',
    'upd.retry': 'Réessayer',
    'upd.restarting': 'Redémarrage…',
    'upd.whyManual': 'Installation automatique désactivée — applique-la quand tu veux.',
    'upd.whyWaiting': 'Elle s\'installera toute seule dès que possible — en attente : {list}.',
    'upd.whyWindow': 'Elle s\'installera toute seule dès que tu fermeras cette fenêtre.',

    // ---- Relance automatique
    'heal.title': '🔧 Relance automatique',
    'heal.enable': 'Redémarrer tout seul un bot <b>tombé</b> <span class="mut11">(après 5 min, puis 15 min, puis 1 h)</span>',
    'heal.hint': 'Quand pm2 a épuisé ses propres relances, le bot reste mort jusqu\'à ce que tu t\'en aperçoives. Le panel réessaie à ta place, puis <b>arrête au bout de 3 essais</b> : un bot qui refuse de repartir trois fois a un vrai problème, et l\'alerte doit rester visible. Ne touche jamais un bot que <b>tu</b> as arrêté, ni un bot coupé par le mode jeu.',

    // ---- Incidents
    'inc.title': '📓 Derniers incidents',
    'inc.none': 'Aucun incident enregistré. C\'est bon signe.',

    // ---- Config illisible / non enregistrée
    'cfg.failTitle': 'Tes réglages ne s\'enregistrent plus',
    'cfg.failBody': 'Ils sont conservés dans une copie de secours et restent actifs, mais le fichier principal refuse l\'écriture.',
    'cfg.failWhy': 'Fichier : {path} — regarde du côté de l\'antivirus, d\'une synchronisation de dossier, ou d\'un disque plein.',

    // ---- Logs
    'logs.title': 'Logs de {name}',
    'logs.out': 'Sortie',
    'logs.err': 'Erreurs',
    'logs.filterPh': 'Filtrer…',
    'logs.copy': 'Copier',
    'logs.openFolder': '📂 Dossier des logs',
    'logs.close': 'Fermer',
    'logs.empty': 'Aucun log pour l\'instant.',
    'logs.unreadable': 'Le fichier de log existe, mais il n\'a pas pu être lu (verrouillé, ou accès refusé).',
    'logs.noMatch': 'Aucune ligne ne contient « {q} ».',
    'logs.failed': 'Échec de lecture des logs.',

    // ---- pm2 absent
    'tc.pm2Missing': '<b>⚠️ pm2 n\'est pas installé.</b><br>pm2 est l\'outil qui garde tes bots en ligne. Clique pour l\'installer automatiquement (sans droits administrateur).',
    'tc.pm2Install': 'Installer pm2',
    'tc.pm2Busy': ' ⏳ installation de pm2… (jusqu\'à 1 min)',
    'tc.pm2Ok': ' ✅ pm2 installé !',
    'tc.pm2NoNode': ' ❌ Node.js requis d\'abord.',
    'tc.pm2Fail': ' ❌ Échec — réessaie ou installe pm2 à la main.',
    'tc.pm2Down': 'pm2 ne répond plus — impossible de lire l\'état des bots.',

    // ---- Zone de notification (menu + infobulle) : rendus par le processus principal
    'tray.open': 'Ouvrir le panel',
    'tray.game': 'Mode jeu : {v}',
    'tray.on': 'activé ✔',
    'tray.off': 'désactivé',
    'tray.update': '🔄 Mise à jour prête — appliquer & redémarrer',
    'tray.quit': 'Quitter',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bots en ligne',
    'tray.online': ' (en ligne)',
    'tray.solo': ' (solo)',
    'tray.cut': ' · {n} bot(s) coupé(s)',
    'tray.low': ' · 🌐 éco réseau',

    // ---- motifs de blocage d'une MAJ (clés produites par le processus principal)
    'blk.game': 'jeu en cours',
    'blk.unknown': 'partie en cours inconnue',
    'blk.busy': 'transition mode jeu',
    'blk.action': 'action bot en cours',
    'blk.stopAll': 'arrêt global en cours',
    'blk.parked': 'bots coupés par le mode jeu',
    'blk.lownet': 'éco réseau active',
    'blk.window': 'fenêtre ouverte',
    'blk.grace': 'délai de grâce',
    'upd.readyManual': '✅ <b>Mise à jour prête</b> — clique « Redémarrer & appliquer » (installation automatique désactivée).',
    'upd.readyWaiting': '✅ <b>Mise à jour prête</b> — elle s\'installera toute seule dès que possible.<br><span style="opacity:.75">En attente : {list}.</span> Tu peux aussi l\'appliquer maintenant.',
    'upd.readySoon': '✅ <b>Mise à jour prête</b> — installation automatique imminente…',
    'set.lastScan': '(dernier scan : {d})',
    'set.noScan': '(aucun scan pour l\'instant)',
    'set.devOnly': '(actif seulement dans la version .exe)',
    'bots.netTitle': 'Réseau du bot, mesuré via ses entrées/sorties (pour un bot Discord, quasi exclusivement du réseau + un peu de disque SQLite) — ↓ reçu · ↑ envoyé',
    'bots.parked': '⏸ coupé par le mode jeu',
    'bots.autobootTitle': '(Re)mis en ligne à l\'ouverture de session Windows',
    'bots.gamestopTitle': 'Arrêté quand un jeu est détecté (mode « bots cochés »)',
    'bots.logsTitle': 'Voir les logs récents (crash, erreurs…)',
    'bots.folderTitle': 'Ouvrir le dossier du bot dans l\'Explorateur',
    'bots.removeTitle': 'Arrêter et retirer ce bot de pm2 (ses fichiers ne sont pas touchés)',

  },

  en: {
    'app.sub': 'pm2 bot manager · game mode',
    'btn.about': 'ℹ️ About',
    'btn.lang': '🇫🇷 Français',
    'btn.langTitle': 'Repasser le panel en français',
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
    'bots.logs': '📄 Logs',
    'bots.folder': '📂',
    'bots.remove': '🗑',
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
    'upd.apply': 'Restart & apply',
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
    'upd.readyManual': '✅ <b>Update ready</b> — click "Restart & apply" (automatic install is off).',
    'upd.readyWaiting': '✅ <b>Update ready</b> — it will install on its own as soon as possible.<br><span style="opacity:.75">Waiting on: {list}.</span> You can also apply it now.',
    'upd.readySoon': '✅ <b>Update ready</b> — automatic install imminent…',
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
};

let LANG = 'fr';
const setLang = (l) => { LANG = (l === 'en') ? 'en' : 'fr'; return LANG; };
const getLang = () => LANG;

/**
 * Traduit une clé. `vars` remplit les emplacements {x}.
 * Une clé absente renvoie la clé elle-même : visible à l'écran, donc repérable — bien préférable à
 * une chaîne vide, qui laisserait un bouton muet sans que personne ne comprenne pourquoi.
 */
const t = (cle, vars) => {
  const table = DICT[LANG] || DICT.fr;
  let s = table[cle];
  if (s === undefined) s = (DICT.fr[cle] !== undefined ? DICT.fr[cle] : cle);
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
};

// Applique les traductions aux éléments STATIQUES du HTML, marqués par un attribut :
//   data-i18n       → textContent      (texte simple)
//   data-i18n-html  → innerHTML        (texte contenant du gras — valeurs issues de ce fichier)
//   data-i18n-title → attribut title    · data-i18n-ph → attribut placeholder
// Le texte français reste ÉCRIT dans le HTML : si ce script venait à ne pas se charger, la fenêtre
// resterait lisible au lieu d'afficher une grille de clés.
const applyStatic = (racine) => {
  const r = racine || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  r.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  r.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  r.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  // Phrase contenant un CHAMP de saisie : on ne peut pas réécrire innerHTML sans détruire l'élément
  // (il porte la valeur saisie et ses écouteurs). On remplace donc uniquement les deux textes qui
  // l'encadrent, découpés sur {input} — la phrase reste une seule entrée de dictionnaire, donc
  // traduisible dans n'importe quel ordre de mots.
  r.querySelectorAll('[data-i18n-input]').forEach((el) => {
    const champ = el.querySelector('input');
    if (!champ) return;
    const [avant, apres] = t(el.getAttribute('data-i18n-input')).split('{input}');
    el.textContent = '';
    el.appendChild(document.createTextNode(avant || ''));
    el.appendChild(champ);
    el.appendChild(document.createTextNode(apres || ''));
  });
};

// Queue UMD : `window.i18n` pour la fenêtre, `module.exports` pour le processus principal.
if (typeof module !== 'undefined' && module.exports) module.exports = { DICT, t, setLang, getLang };
if (typeof window !== 'undefined') window.i18n = { DICT, t, setLang, getLang, applyStatic };

})();
