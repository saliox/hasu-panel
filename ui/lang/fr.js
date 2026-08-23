// Français — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: 'Français', ui: {
    'app.sub': 'gestion des bots pm2 · mode jeu',
    'btn.about': 'ℹ️ À propos',
    'btn.langTitle': 'Langue de l\'interface',
    'banner.loading': 'Chargement…',
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
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Remettre en ordre',
    'bots.fixBanner': '<b>{n}</b> bot(s) devraient être en ligne',
    'bots.fixDone': '✅ {n} relance(s)',
    'bots.fixPartial': '⚠️ {n} relancé(s), {k} toujours hors ligne',
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
    'lownet.title': '🌐 Faible usage internet',
    'lownet.enable': 'Priorité réseau au jeu en ligne',
    'lownet.hint': 'Pendant une partie en ligne : les gros téléchargements des bots (listes anti-scam, sauvegardes chiffrées) sont mis en pause et leur priorité est abaissée — automatiquement plus strict si ta connexion est lente. Tout revient à la normale à la fin de la partie. Indépendant du mode jeu : utile pour les bots que tu laisses tourner.',
    'lownet.active': ' · 🌐 faible usage internet actif',
    'lownet.broken': ' · ⚠️ éco réseau : priorités appliquées, mais le signal envoyé aux bots n’est pas passé',
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
    'set.title': '⚙️ Réglages',
    'set.autolaunch': 'Lancer le panel au démarrage de Windows',
    'set.poll': 'Vérifier les jeux / bots toutes les {input} secondes',
    'set.scanauto': 'Chercher de nouveaux jeux installés <b>1×/jour</b>',
    'set.scanHint': 'La vérification ci-dessus ne lit que la liste des process (très léger). Le scan disque des jeux, lui, ne tourne <b>jamais en continu</b> : 1×/jour maximum, ou via le bouton « 🔍 Scanner ».',
    'set.saveInfoTitle': 'pm2 restaure cette liste au démarrage du PC — elle est réenregistrée après chaque démarrage/arrêt fait ici.',
    'set.saved': 'Dernière sauvegarde pm2 : {d}',
    'set.savedNever': 'Aucune sauvegarde pm2 depuis ce panel.',
    'alerts.title': '🔔 Alertes (bot qui tombe)',
    'alerts.enable': 'Me prévenir quand un bot <b>tombe</b> ou <b>redémarre en boucle</b>',
    'alerts.toast': 'Notification Windows (utile seulement si je suis devant le PC)',
    'alerts.sound': 'Petit son avec la notification',
    'alerts.volTitle': 'Volume du son',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (te prévient même en jeu)',
    'alerts.test': 'Tester',
    'alerts.hint': 'Le <b>webhook Discord</b> est le plus utile : il te touche même en pleine partie ou absent du PC. Dans Discord : <b>Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l\'URL</b>. L\'alerte indique <b>la cause en clair</b> (Internet coupé, token invalide, module manquant…).',
    'alerts.suppressed': ' — ⚠️ {n} alerte(s) différée(s) cette heure (plafond anti-spam).',
    'rpc.title': '🎮 Rich Presence Discord',
    'rpc.enable': 'Afficher « 🤖 Gère X bots en ligne » sur mon profil Discord',
    'rpc.idPh': 'Laisse vide — application Hasu Panel utilisée par défaut',
    'rpc.hint': 'Rien à configurer : ça fonctionne dès l\'activation (il faut juste que <b>Discord soit ouvert</b> sur ce PC). Le champ ci-dessus n\'est utile que si tu veux afficher <b>ta propre</b> application Discord — dans ce cas, colle son <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — désactivée.',
    'rpc.on': ' — ✅ activée.',
    'rpc.needId': ' — ⚠️ colle ton Application ID pour l\'activer.',
    'upd.title': '🔄 Mises à jour',
    'upd.version': 'Version :',
    'upd.check': 'Vérifier les mises à jour',
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
    'heal.title': '🔧 Relance automatique',
    'heal.enable': 'Redémarrer tout seul un bot <b>tombé</b> <span class="mut11">(après 5 min, puis 15 min, puis 1 h)</span>',
    'heal.hint': 'Quand pm2 a épuisé ses propres relances, le bot reste mort jusqu\'à ce que tu t\'en aperçoives. Le panel réessaie à ta place, puis <b>arrête au bout de 3 essais</b> : un bot qui refuse de repartir trois fois a un vrai problème, et l\'alerte doit rester visible. Ne touche jamais un bot que <b>tu</b> as arrêté, ni un bot coupé par le mode jeu.',
    'inc.title': '📓 Derniers incidents',
    'inc.none': 'Aucun incident enregistré. C\'est bon signe.',
    'dual.title': 'Deux installations du panel sur ce PC',
    'dual.body': 'Une autre installation existe : {path}. Les deux se lancent au démarrage et se mettent à jour chacune de leur côté. Désinstalle celle dont tu ne veux pas (Paramètres → Applications).',
    'cfg.failTitle': 'Tes réglages ne s\'enregistrent plus',
    'cfg.failBody': 'Ils sont conservés dans une copie de secours et restent actifs, mais le fichier principal refuse l\'écriture.',
    'cfg.failWhy': 'Fichier : {path} — regarde du côté de l\'antivirus, d\'une synchronisation de dossier, ou d\'un disque plein.',
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
    'tc.pm2Missing': '<b>⚠️ pm2 n\'est pas installé.</b><br>pm2 est l\'outil qui garde tes bots en ligne. Clique pour l\'installer automatiquement (sans droits administrateur).',
    'tc.pm2Install': 'Installer pm2',
    'tc.pm2Busy': ' ⏳ installation de pm2… (jusqu\'à 1 min)',
    'tc.pm2Ok': ' ✅ pm2 installé !',
    'tc.pm2NoNode': ' ❌ Node.js requis d\'abord.',
    'tc.pm2Fail': ' ❌ Échec — réessaie ou installe pm2 à la main.',
    'tc.pm2Down': 'pm2 ne répond plus — impossible de lire l\'état des bots.',
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
    'blk.game': 'jeu en cours',
    'blk.unknown': 'partie en cours inconnue',
    'blk.busy': 'transition mode jeu',
    'blk.action': 'action bot en cours',
    'blk.stopAll': 'arrêt global en cours',
    'blk.parked': 'bots coupés par le mode jeu',
    'blk.lownet': 'éco réseau active',
    'blk.window': 'fenêtre ouverte',
    'blk.grace': 'délai de grâce',
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
  about: `
  <h2>🛡️ Hasu Panel \{v} — c'est quoi ?</h2>
  <p>Un panneau de contrôle pour <b>tous tes bots</b> : ils tournent en arrière-plan grâce à <b>pm2</b>, et tu les gères ici sans toucher à la console.</p>
  <h3>🤖 La liste des bots</h3>
  <p>Chaque ligne = un bot. Pastille <b style="color:#3ba55d">verte</b> = en ligne, grise = arrêté, <b style="color:#ed4245">rouge</b> = en erreur. Boutons : ▶ démarrer · ⏹ arrêter · ⟳ redémarrer · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> : affiche les <b>dernières lignes du bot</b> (erreurs, plantage…) — pratique pour comprendre pourquoi il est tombé, <b>sans ouvrir de terminal</b>.</p>
  <p><b>Auto boot</b> : coché → le bot est remis en ligne tout seul quand tu allumes le PC. Décoché → il reste éteint au démarrage.</p>
  <p><b>⏹ Tout arrêter</b> (en haut de la liste) coupe <b>tous les bots en ligne</b> d'un coup. Sécurité : il faut cliquer <b>deux fois</b> pour confirmer.</p>
  <p>À chaque arrêt, le panel fait le ménage : les <b>petits programmes lancés par un bot</b> (ffmpeg de la musique, installations en cours…) qui survivaient et encombraient le PC sont <b>fermés proprement</b> eux aussi.</p>
  <p>Si un bot censé tourner est éteint, un <b>bandeau</b> apparaît en tête de liste avec le bouton <b>« Remettre en ordre »</b>, qui les relance tous d'un coup. Il ne compte que ce qui est <b>réellement reparti</b> : si un bot refuse de démarrer (dossier déplacé, fichier manquant), il te le dit au lieu d'annoncer un succès.</p>
  <h3>🔔 Être prévenu quand un bot tombe</h3>
  <p>C'est la raison d'être du panel : ne plus découvrir <b>trois jours plus tard</b> qu'un bot est mort. Quand un bot tombe ou redémarre en boucle, tu reçois une <b>notification Windows discrète</b> accompagnée d'un <b>son doux</b> (volume réglable), et l'alerte indique <b>la cause en français</b> — Internet coupé, token invalide, module manquant, mémoire saturée…</p>
  <p>Le plus utile reste le <b>webhook Discord</b> : il te touche même en pleine partie, ou quand tu n'es pas devant le PC. Dans Discord : <b>Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l'URL</b>, puis colle-la dans ⚙️ Réglages.</p>
  <p>Le panel fait la différence entre une <b>panne</b> et un <b>arrêt volontaire</b> : si tu coupes un bot toi-même — depuis le panel <i>ou</i> depuis un terminal — il ne t'alerte pas et ne le rallume pas au démarrage suivant. Il se tait aussi au réveil du PC et au démarrage, le temps que le réseau revienne, pour ne pas déclencher une rafale d'alertes bidon.</p>
  <p>Si l'envoi échoue — typiquement parce que la panne, c'est justement la coupure Internet — l'alerte est <b>réessayée</b> au lieu d'être perdue. Et si pm2 lui-même ne répond plus, le panel te prévient : sans ça, plus aucune alerte ne serait possible et le silence passerait pour « tout va bien ».</p>
  <h3>➕ Importer un bot</h3>
  <p>Tu as un bot que tu lances d'habitude à la main (par exemple depuis <b>Visual Studio</b> avec <code>node index.js</code>) ? Clique « Importer un bot » (<b>fichier</b> ou <b>dossier entier</b> — dans ce cas le fichier principal est détecté tout seul), donne-lui un nom, et c'est tout :</p>
  <p>• il tourne <b>en arrière-plan</b>, même Visual Studio fermé ;<br>• il <b>redémarre tout seul</b> s'il plante ;<br>• il <b>survit aux redémarrages du PC</b> ;<br>• il se gère ici <b>comme les autres</b> (auto boot, mode jeu…).</p>
  <p>Le bouton 🗑 arrête le bot et le retire de pm2 — <b>ses fichiers ne sont jamais touchés</b>.</p>
  <h3>🎮 Le mode jeu</h3>
  <p>Quand un jeu de la liste est détecté (Fortnite, Valorant…), le panel <b>coupe les bots choisis</b> pour libérer le PC pendant que tu joues, puis les <b>relance automatiquement</b> environ 1 minute après la fermeture du jeu. Tu choisis : couper <b>tous</b> les bots, ou seulement ceux cochés « Coupé en jeu ».</p>
  <p><b>Jeu solo ?</b> Le panel vérifie si le jeu est <b>vraiment connecté à Internet</b> : une partie solo/hors-ligne ne coupe rien (option « Ignorer les jeux solo »). Exemple : GTA V en mode histoire → bots conservés ; GTA Online → mode jeu déclenché.</p>
  <h3>🕹️ Ajouter un jeu à la détection</h3>
  <p>Trois façons : <b>📋 Programmes ouverts</b> (lance le jeu et choisis-le dans la liste — le plus précis, marche aussi pour un logiciel), <b>📁 Choisir un .exe</b> (parcourir le disque), ou <b>🔍 Scanner</b> (fouille les bibliothèques Steam/Epic et propose les jeux installés absents de la liste).</p>
  <p>Le scan disque ne tourne <b>jamais en continu</b> : automatiquement <b>1×/jour</b> maximum (désactivable dans ⚙️ Réglages), ou quand tu cliques « Scanner ». La surveillance permanente, elle, ne fait que lire la liste des process — quasi gratuit.</p>
  <h3>🌐 Faible usage internet</h3>
  <p>Activé, ce mode donne la <b>priorité réseau au jeu en ligne</b> : pendant la partie, les bots repoussent leurs <b>gros téléchargements</b> (listes anti-scam, sauvegardes chiffrées) et passent en <b>priorité basse</b> — d'autant plus strict que ta connexion est lente (mesurée automatiquement). À la fin de la partie, tout revient à la normale. Indépendant du mode jeu : parfait pour garder saliox en ligne <i>sans</i> qu'il fasse laguer.</p>
  <h3>🔄 Mises à jour automatiques</h3>
  <p>Le panel <b>se met à jour tout seul</b> : il vérifie au lancement puis toutes les 6 h, et tout se passe <b>dans la fenêtre</b>. Une carte apparaît en haut dès qu'une version est trouvée : <b>barre de progression</b> avec pourcentage, vitesse et poids, puis les <b>nouveautés de la version</b> et un bouton <b>« Installer et redémarrer »</b>. « Plus tard » masque la carte — l'installation, elle, suit son cours.</p>
  <p>Tu n'as en principe <b>rien à cliquer</b> : la mise à jour s'installe seule dès que c'est sans risque. Elle ne le fait <b>jamais</b> pendant une partie, ni pendant une manœuvre sur les bots, ni tant que tu regardes la fenêtre — la carte t'indique justement <b>ce qu'elle attend</b>. Ferme la fenêtre et elle s'applique. (Désactivable dans ⚙️ Réglages, avec le bouton « Vérifier les mises à jour » pour forcer un contrôle.)</p>
  <h3>🔋 Économe en ressources</h3>
  <p>Le panel tourne 24h/24 sans se faire remarquer : quand il est <b>réduit dans la zone de notification</b>, il <b>ralentit sa surveillance</b> et arrête de calculer l'affichage inutile. Dès que tu rouvres la fenêtre, tout redevient instantané. (Si le mode jeu ou le faible usage internet est actif, il reste réactif pour ne rien rater.)</p>
  <h3>🎮 Ta présence Discord</h3>
  <p>Option « Rich Presence » : ton profil Discord affiche <b>« 🤖 Gère X bots en ligne »</b> (et le jeu en cours). <b>Rien à configurer</b> — il suffit que Discord soit ouvert. Purement décoratif, désactivable dans ⚙️ Réglages.</p>
  <h3>🧰 Sur un PC neuf (chez un ami)</h3>
  <p>Les bots ont besoin de <b>Node.js</b> et <b>pm2</b>. Si l'un des deux manque, le panel le <b>détecte</b> et propose le bouton qui va bien (« Télécharger Node.js » ou « Installer pm2 ») au lieu d'afficher une liste vide.</p>
  <h3>📁 Bon à savoir</h3>
  <p>• La croix de la fenêtre <b>réduit dans la zone de notification</b> (à côté de l'horloge). Pour quitter : clic droit sur l'icône → Quitter.<br>• Réglages enregistrés dans <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, journal dans <code>panel.log</code>.<br>• Une <b>copie de secours</b> des réglages est tenue à jour à côté (<code>.bak</code>) et reprise automatiquement si le fichier principal devient illisible ou cesse d'être écrit. Si l'enregistrement ne passe plus, un <b>bandeau rouge</b> te le dit — plutôt que de te laisser croire que tes réglages sont sauvegardés.<br>• Le panel se lance tout seul avec Windows (désactivable dans ⚙️ Réglages).</p>
  ` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['fr'] = L; }
})();
