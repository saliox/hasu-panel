// Italiano — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: 'Italiano', ui: {
    'app.sub': 'gestione bot pm2 · modalità gioco',
    'btn.about': 'ℹ️ Info',
    'btn.lang': '🇫🇷 Français',
    'btn.langTitle': 'Repasser le panel en français',
    'banner.loading': 'Caricamento…',
    'bots.title': '🤖 Bot (pm2)',
    'bots.import': '➕ Importa (file)',
    'bots.importTitle': 'Scegli il file principale del bot (index.js, bot.py…)',
    'bots.importDir': '📁 Importa (cartella)',
    'bots.importDirTitle': 'Scegli la CARTELLA del bot — il file principale viene rilevato da solo',
    'bots.stopAll': '⏹ Ferma tutto',
    'bots.stopAllTitle': 'Ferma TUTTI i bot online (clicca una seconda volta per confermare)',
    'bots.stopAllArm': '⏹ Confermi?',
    'bots.stopAllBusy': '⏳ Arresto…',
    'bots.stopAllDone': '✅ Fermati: {n}',
    'bots.stopAllFail': '⚠️ Non riuscito',
    'bots.hint': '«Avvio auto»: il bot torna online quando accedi a Windows. «Stop in gioco»: questo bot viene fermato quando scatta la modalità gioco (se hai scelto «solo i bot spuntati»).',
    'bots.none': 'Nessun bot gestito da pm2 per ora. Aggiungine uno con «➕ Importa» qui sopra.',
    'bots.searching': '⏳ Ricerca dei bot in corso…',
    'bots.imported': '🧩 Bot importati',
    'bots.autoboot': 'Avvio auto',
    'bots.gamestop': 'Stop in gioco',
    'bots.logs': '📄 Log',
    'bots.folder': '📂',
    'bots.remove': '🗑',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Rimetti online',
    'bots.fixBanner': 'Bot da rimettere online: <b>{n}</b>',
    'bots.fixDone': '✅ Riavviati: {n}',
    'bots.fixPartial': '⚠️ Riavviati: {n}, ancora offline: {k}',
    'gm.title': '🎮 Modalità gioco',
    'gm.enable': 'Ferma i bot quando viene rilevato un gioco',
    'gm.all': 'Tutti i bot',
    'gm.some': 'Solo i bot spuntati «Stop in gioco»',
    'gm.grace': 'Riavvia i bot {input} s dopo la chiusura del gioco',
    'gm.soloskip': 'Ignora i giochi <b>single player</b> <span class="mut12">(ferma solo se il gioco è davvero online)</span>',
    'gm.banner': '🎮 <b>Gioco online:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> rilevato — partita <b>single player</b>: i bot restano online',
    'gm.bannerCut': ' — <b>bot fermati: {n}</b> (riavvio automatico a fine partita)',
    'gm.bannerNone': ' — nessun bot da fermare',
    'gm.bannerOff': ' — modalità gioco disattivata',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bot online — nessun gioco rilevato',
    'lownet.title': '🌐 Basso consumo internet',
    'lownet.enable': 'Priorità di rete al gioco online',
    'lownet.hint': 'Durante una partita online: i download pesanti dei bot (liste anti-scam, backup cifrati) vengono messi in pausa e la loro priorità abbassata — automaticamente più severo se la tua connessione è lenta. Tutto torna normale a fine partita. Indipendente dalla modalità gioco: utile per i bot che lasci accesi.',
    'lownet.active': ' · 🌐 basso consumo internet attivo',
    'lownet.broken': ' · ⚠️ basso consumo internet: priorità applicate, ma il segnale non è arrivato ai bot',
    'games.title': '🕹️ Giochi rilevati (processi)',
    'games.ph': 'MioGioco.exe',
    'games.add': 'Aggiungi',
    'games.pick': '📋 Programmi aperti',
    'games.pickTitle': 'Scegli tra le finestre aperte (avvia prima il gioco)',
    'games.exe': '📁 Scegli un .exe',
    'games.exeTitle': 'Sfoglia il disco per scegliere l\'.exe del gioco',
    'games.scan': '🔍 Scansiona',
    'games.scanTitle': 'Cerca i giochi installati (Steam, Epic) assenti dalla lista',
    'games.hint': '«Programmi aperti» elenca ciò che gira sul TUO PC (un gioco, o un software che la lista predefinita non conosce): avvia il gioco e poi sceglilo — è il modo più preciso. «Scansiona» fruga le librerie Steam/Epic (1×/giorno in automatico, mai di continuo).',
    'set.title': '⚙️ Impostazioni',
    'set.autolaunch': 'Avvia il panel all\'avvio di Windows',
    'set.poll': 'Controlla giochi / bot ogni {input} secondi',
    'set.scanauto': 'Cerca i nuovi giochi installati <b>1×/giorno</b>',
    'set.scanHint': 'Il controllo qui sopra legge solo la lista dei processi (leggerissimo). La scansione del disco, invece, non gira <b>mai di continuo</b>: 1×/giorno al massimo, o col pulsante «🔍 Scansiona».',
    'set.saveInfoTitle': 'pm2 ripristina questa lista all\'avvio del PC — viene risalvata dopo ogni avvio/arresto fatto qui.',
    'set.saved': 'Ultimo salvataggio pm2: {d}',
    'set.savedNever': 'Nessun salvataggio pm2 da questo panel.',
    'alerts.title': '🔔 Avvisi (bot che cade)',
    'alerts.enable': 'Avvisami quando un bot <b>cade</b> o <b>riparte in loop</b>',
    'alerts.toast': 'Notifica Windows (utile solo se sono davanti al PC)',
    'alerts.sound': 'Suono discreto con la notifica',
    'alerts.volTitle': 'Volume del suono',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (ti avvisa anche in partita)',
    'alerts.test': 'Prova',
    'alerts.hint': 'Il <b>webhook Discord</b> è il più utile: ti raggiunge anche in piena partita o lontano dal PC. Su Discord: <b>Impostazioni del canale → Integrazioni → Webhook → Nuovo webhook → Copia URL</b>. L\'avviso indica <b>la causa in chiaro</b> (internet giù, token non valido, modulo mancante…).',
    'alerts.suppressed': ' — ⚠️ avvisi rinviati in quest\'ora: {n} (limite anti-spam).',
    'rpc.title': '🎮 Rich Presence Discord',
    'rpc.enable': 'Mostra «🤖 Gestisce X bot online» sul mio profilo Discord',
    'rpc.idPh': 'Lascia vuoto — di default si usa l\'applicazione Hasu Panel',
    'rpc.hint': 'Niente da configurare: funziona appena lo attivi (basta che <b>Discord sia aperto</b> su questo PC). Il campo qui sopra serve solo se vuoi mostrare la <b>tua</b> applicazione Discord — in quel caso incolla il suo <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — disattivata.',
    'rpc.on': ' — ✅ attivata.',
    'rpc.needId': ' — ⚠️ incolla il tuo Application ID per attivarla.',
    'upd.title': '🔄 Aggiornamenti',
    'upd.version': 'Versione:',
    'upd.check': 'Cerca aggiornamenti',
    'upd.apply': 'Riavvia e applica',
    'upd.auto': 'Installa <b>da solo</b> gli aggiornamenti <span class="mut11">(mai durante una partita né durante un\'azione sui bot)</span>',
    'upd.searching': '⏳ Ricerca aggiornamenti…',
    'upd.dev': 'ℹ️ L\'auto-update funziona solo nella versione installata (Setup.exe), non in sviluppo.',
    'upd.uptodate': '✅ Hai già l\'ultima versione ({v}).',
    'upd.availableMsg': '⬇️ Trovata la nuova versione <b>{v}</b> — download in corso, sarà pronta tra un istante.',
    'upd.readyMsg': '✅ <b>Aggiornamento pronto</b> — clicca «Riavvia e applica».',
    'upd.errorMsg': '⚠️ Impossibile controllare adesso{d}. Riprova più tardi.',
    'upd.unexpected': '⚠️ Risposta inattesa.',
    'upd.cardDownloading': 'Download dell\'aggiornamento…',
    'upd.cardReady': 'Aggiornamento pronto da installare',
    'upd.cardAvailable': 'Nuova versione disponibile',
    'upd.cardPreparing': 'preparazione…',
    'upd.cardBroken': 'Aggiornamento interrotto',
    'upd.install': 'Installa e riavvia',
    'upd.later': 'Più tardi',
    'upd.laterTitle': 'Nascondi questa scheda',
    'upd.retry': 'Riprova',
    'upd.restarting': 'Riavvio…',
    'upd.whyManual': 'Installazione automatica disattivata — applicala quando vuoi.',
    'upd.whyWaiting': 'Si installerà da sola appena possibile — in attesa di: {list}.',
    'upd.whyWindow': 'Si installerà da sola appena chiuderai questa finestra.',
    'heal.title': '🔧 Riavvio automatico',
    'heal.enable': 'Riavvia da solo un bot <b>caduto</b> <span class="mut11">(dopo 5 min, poi 15 min, poi 1 h)</span>',
    'heal.hint': 'Quando pm2 ha esaurito i suoi riavvii, il bot resta morto finché non te ne accorgi. Il panel riprova al posto tuo, poi <b>si ferma dopo 3 tentativi</b>: un bot che si rifiuta di ripartire tre volte ha un problema vero, e l\'avviso deve restare visibile. Non tocca mai un bot che hai fermato <b>tu</b>, né un bot fermato dalla modalità gioco.',
    'inc.title': '📓 Ultimi incidenti',
    'inc.none': 'Nessun incidente registrato. Buon segno.',
    'cfg.failTitle': 'Le tue impostazioni non si salvano più',
    'cfg.failBody': 'Sono conservate in una copia di riserva e restano attive, ma il file principale rifiuta la scrittura.',
    'cfg.failWhy': 'File: {path} — controlla l\'antivirus, la sincronizzazione di una cartella, o un disco pieno.',
    'logs.title': 'Log di {name}',
    'logs.out': 'Output',
    'logs.err': 'Errori',
    'logs.filterPh': 'Filtra…',
    'logs.copy': 'Copia',
    'logs.openFolder': '📂 Cartella dei log',
    'logs.close': 'Chiudi',
    'logs.empty': 'Nessun log per ora.',
    'logs.unreadable': 'Il file di log esiste, ma non è stato possibile leggerlo (bloccato, o accesso negato).',
    'logs.noMatch': 'Nessuna riga contiene «{q}».',
    'logs.failed': 'Lettura dei log non riuscita.',
    'tc.pm2Missing': '<b>⚠️ pm2 non è installato.</b><br>pm2 è lo strumento che tiene i tuoi bot online. Clicca per installarlo in automatico (senza diritti di amministratore).',
    'tc.pm2Install': 'Installa pm2',
    'tc.pm2Busy': ' ⏳ installazione di pm2… (fino a 1 min)',
    'tc.pm2Ok': ' ✅ pm2 installato!',
    'tc.pm2NoNode': ' ❌ Serve prima Node.js.',
    'tc.pm2Fail': ' ❌ Non riuscita — riprova, o installa pm2 a mano.',
    'tc.pm2Down': 'pm2 non risponde più — impossibile leggere lo stato dei bot.',
    'tray.open': 'Apri il panel',
    'tray.game': 'Modalità gioco: {v}',
    'tray.on': 'attiva ✔',
    'tray.off': 'disattivata',
    'tray.update': '🔄 Aggiornamento pronto — applica e riavvia',
    'tray.quit': 'Esci',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bot online',
    'tray.online': ' (online)',
    'tray.solo': ' (single player)',
    'tray.cut': ' · bot fermati: {n}',
    'tray.low': ' · 🌐 eco rete',
    'blk.game': 'gioco in corso',
    'blk.unknown': 'non è chiaro se sia in corso una partita',
    'blk.busy': 'passaggio di modalità gioco',
    'blk.action': 'azione su un bot in corso',
    'blk.stopAll': 'arresto globale in corso',
    'blk.parked': 'bot fermati dalla modalità gioco',
    'blk.lownet': 'basso consumo internet attivo',
    'blk.window': 'finestra aperta',
    'blk.grace': 'periodo di grazia',
    'upd.readyManual': '✅ <b>Aggiornamento pronto</b> — clicca «Riavvia e applica» (installazione automatica disattivata).',
    'upd.readyWaiting': '✅ <b>Aggiornamento pronto</b> — si installerà da solo appena possibile.<br><span style="opacity:.75">In attesa di: {list}.</span> Puoi anche applicarlo subito.',
    'upd.readySoon': '✅ <b>Aggiornamento pronto</b> — installazione automatica imminente…',
    'set.lastScan': '(ultima scansione: {d})',
    'set.noScan': '(nessuna scansione per ora)',
    'set.devOnly': '(attivo solo nella versione .exe)',
    'bots.netTitle': 'Rete del bot, misurata dai suoi ingressi/uscite (per un bot Discord, quasi solo rete più un po\' di disco SQLite) — ↓ ricevuti · ↑ inviati',
    'bots.parked': '⏸ fermato dalla modalità gioco',
    'bots.autobootTitle': 'Rimesso online quando accedi a Windows',
    'bots.gamestopTitle': 'Fermato quando viene rilevato un gioco (modalità «bot spuntati»)',
    'bots.logsTitle': 'Vedi i log recenti (crash, errori…)',
    'bots.folderTitle': 'Apri la cartella del bot in Esplora file',
    'bots.removeTitle': 'Ferma e togli questo bot da pm2 (i suoi file non vengono toccati)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — che cos'è?</h2>
  <p>Un pannello di controllo per <b>tutti i tuoi bot</b>: girano in sottofondo grazie a <b>pm2</b>, e li gestisci qui senza toccare la console.</p>
  <h3>🤖 La lista dei bot</h3>
  <p>Una riga per bot. Pallino <b style="color:#3ba55d">verde</b> = online, grigio = fermo, <b style="color:#ed4245">rosso</b> = in errore. Pulsanti: ▶ avvia · ⏹ ferma · ⟳ riavvia · <b>📄 Log</b>.</p>
  <p><b>📄 Log</b> mostra le <b>ultime righe del bot</b> (errori, crash…) — comodo per capire perché è caduto, <b>senza aprire un terminale</b>.</p>
  <p><b>Avvio auto</b>: spuntato → il bot torna online da solo quando accendi il PC. Non spuntato → resta spento all'avvio.</p>
  <p><b>⏹ Ferma tutto</b> (sopra la lista) ferma <b>tutti i bot online</b> in un colpo solo. Sicurezza: devi cliccare <b>due volte</b> per confermare.</p>
  <p>A ogni arresto il panel fa pulizia: i <b>piccoli programmi lanciati da un bot</b> (ffmpeg della musica, un'installazione in corso…) che prima sopravvivevano e ingombravano il PC vengono <b>chiusi per bene</b> anche loro.</p>
  <p>Se un bot che dovrebbe girare è spento, in cima alla lista compare un <b>banner</b> con il pulsante <b>«Rimetti online»</b>, che li riavvia tutti insieme. Conta solo quelli <b>davvero ripartiti</b>: se un bot si rifiuta di partire (cartella spostata, file mancante), te lo dice invece di annunciare un successo.</p>
  <h3>🔔 Essere avvisato quando un bot cade</h3>
  <p>È il motivo per cui esiste il panel: non scoprire più <b>tre giorni dopo</b> che un bot è morto. Quando un bot cade o riparte in loop, ricevi una <b>notifica Windows discreta</b> con un <b>suono delicato</b> (volume regolabile), e l'avviso indica <b>la causa in chiaro</b> — internet giù, token non valido, modulo mancante, memoria satura…</p>
  <p>Il più utile resta il <b>webhook Discord</b>: ti raggiunge anche in piena partita, o quando non sei davanti al PC. Su Discord: <b>Impostazioni del canale → Integrazioni → Webhook → Nuovo webhook → Copia URL</b>, poi incollalo in ⚙️ Impostazioni.</p>
  <p>Il panel distingue un <b>guasto</b> da un <b>arresto voluto</b>: se fermi un bot tu stesso — dal panel <i>o</i> da un terminale — non ti avvisa, non lo riavvia e non lo rimette online al riavvio successivo. Sta zitto anche al risveglio del PC e subito dopo l'avvio, il tempo che la rete torni, per non scatenare una raffica di avvisi farlocchi.</p>
  <p>Se l'invio fallisce — tipicamente perché il guasto <i>è</i> proprio internet giù — l'avviso viene <b>riprovato</b> invece di andare perso. E se pm2 stesso smette di rispondere, il panel te lo dice: senza, nessun avviso sarebbe possibile e il silenzio sembrerebbe un «tutto bene».</p>
  <h3>➕ Importare un bot</h3>
  <p>Hai un bot che di solito avvii a mano (per esempio da <b>Visual Studio</b> con <code>node index.js</code>)? Clicca «Importa» (<b>file</b> o <b>cartella intera</b> — in quel caso il file principale viene rilevato da solo), dagli un nome, ed è tutto:</p>
  <p>• gira <b>in sottofondo</b>, anche con Visual Studio chiuso;<br>• <b>riparte da solo</b> se va in crash;<br>• <b>sopravvive ai riavvii del PC</b>;<br>• si gestisce qui <b>come gli altri</b> (avvio auto, modalità gioco…).</p>
  <p>Il pulsante 🗑 ferma il bot e lo toglie da pm2 — <b>i suoi file non vengono mai toccati</b>.</p>
  <h3>🎮 La modalità gioco</h3>
  <p>Quando viene rilevato un gioco della lista (Fortnite, Valorant…), il panel <b>ferma i bot che hai scelto</b> per liberare il PC mentre giochi, poi li <b>riavvia in automatico</b> circa un minuto dopo la chiusura del gioco. Scegli tu: fermare <b>tutti</b> i bot, o solo quelli spuntati «Stop in gioco».</p>
  <p><b>Partita single player?</b> Il panel verifica se il gioco è <b>davvero connesso a internet</b>: una partita offline non ferma niente (opzione «Ignora i giochi single player»). Per esempio: GTA V in modalità storia → bot lasciati online; GTA Online → modalità gioco attivata.</p>
  <h3>🕹️ Aggiungere un gioco al rilevamento</h3>
  <p>Tre modi: <b>📋 Programmi aperti</b> (avvia il gioco e sceglilo nella lista — il più preciso, funziona anche per un software qualsiasi), <b>📁 Scegli un .exe</b> (sfoglia il disco), oppure <b>🔍 Scansiona</b> (fruga le librerie Steam/Epic e propone i giochi installati assenti dalla lista).</p>
  <p>La scansione del disco non gira <b>mai di continuo</b>: in automatico <b>1×/giorno</b> al massimo (disattivabile in ⚙️ Impostazioni), o quando clicchi «Scansiona». La sorveglianza permanente, invece, legge solo la lista dei processi — praticamente gratis.</p>
  <h3>🌐 Basso consumo internet</h3>
  <p>Attivo, dà la <b>priorità di rete al gioco online</b>: durante la partita i bot rimandano i loro <b>download pesanti</b> (liste anti-scam, backup cifrati) e passano a <b>priorità bassa</b> — tanto più severo quanto più lenta è la tua connessione (misurata in automatico). A fine partita tutto torna normale. Indipendente dalla modalità gioco: perfetto per tenere un bot online <i>senza</i> che faccia laggare.</p>
  <h3>🔄 Aggiornamenti automatici</h3>
  <p>Il panel <b>si aggiorna da solo</b>: controlla all'avvio e poi ogni 6 h, e succede tutto <b>dentro la finestra</b>. Appena trova una versione compare una scheda in alto: <b>barra di avanzamento</b> con percentuale, velocità e peso, poi le <b>novità della versione</b> e un pulsante <b>«Installa e riavvia»</b>. «Più tardi» nasconde la scheda — l'installazione, però, va avanti.</p>
  <p>In linea di massima non devi <b>cliccare niente</b>: l'aggiornamento si installa da solo appena è sicuro. Non lo fa <b>mai</b> durante una partita, né durante una manovra sui bot, né finché stai guardando la finestra — la scheda ti dice appunto <b>cosa sta aspettando</b>. Chiudi la finestra e si applica. (Disattivabile in ⚙️ Impostazioni, con il pulsante «Cerca aggiornamenti» per forzare un controllo.)</p>
  <h3>🔋 Leggero sulle risorse</h3>
  <p>Il panel gira 24 ore su 24 senza farsi notare: quando è <b>ridotto nell'area di notifica</b>, <b>rallenta la sorveglianza</b> e smette di calcolare la grafica che nessuno guarda. Appena riapri la finestra torna tutto istantaneo. (Se la modalità gioco o il basso consumo internet è attivo, resta reattivo per non perdersi niente.)</p>
  <h3>🎮 La tua presenza Discord</h3>
  <p>Opzione «Rich Presence»: il tuo profilo Discord mostra <b>«🤖 Gestisce X bot online»</b> (e il gioco in corso). <b>Niente da configurare</b> — basta che Discord sia aperto. Puramente decorativo, disattivabile in ⚙️ Impostazioni.</p>
  <h3>🧰 Su un PC nuovo (da un amico)</h3>
  <p>I bot hanno bisogno di <b>Node.js</b> e <b>pm2</b>. Se manca uno dei due, il panel lo <b>rileva</b> e propone il pulsante giusto («Scarica Node.js» o «Installa pm2») invece di mostrare una lista vuota.</p>
  <h3>📁 Buono a sapersi</h3>
  <p>• La X della finestra <b>lo riduce nell'area di notifica</b> (accanto all'orologio). Per uscire: tasto destro sull'icona → Esci.<br>• Impostazioni salvate in <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, il log in <code>panel.log</code>.<br>• Una <b>copia di riserva</b> delle impostazioni è tenuta aggiornata lì accanto (<code>.bak</code>) e viene ripresa in automatico se il file principale diventa illeggibile o smette di essere scritto. Se il salvataggio non passa più, un <b>banner rosso</b> te lo dice — invece di lasciarti credere che le tue impostazioni siano al sicuro.<br>• Il panel si avvia da solo con Windows (disattivabile in ⚙️ Impostazioni).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['it'] = L; }
})();
