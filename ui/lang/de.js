// Deutsch — Übersetzung der Oberfläche des Hasu Panel.
//
// FORMAT (in allen Sprachen identisch einzuhalten):
//  • `ui`: ein Eintrag pro Schlüssel. Die Schlüssel sind in allen Sprachen IDENTISCH — hier niemals
//    welche hinzufügen, entfernen oder umbenennen: maßgeblich ist das Französische (fr.js).
//  • die Platzhalter {x} müssen UNVERÄNDERT bleiben: sie bekommen zur Laufzeit ihre Werte.
//  • die HTML-Tags (<b>, <span class="mut11">, <br>) müssen ebenfalls erhalten bleiben.
//  • `about`: der Inhalt des Fensters „Über“. {v} bekommt dort die Versionsnummer.
// Ein Test (test/i18n.test.js) prüft bei jedem `npm test`, ob Schlüssel und Platzhalter übereinstimmen.
(function () {
  const L = { nom: 'Deutsch', ui: {
    'app.sub': 'pm2-Bot-Verwaltung · Spielmodus',
    'btn.about': 'ℹ️ Über',
    'btn.langTitle': 'Sprache der Oberfläche',
    'banner.loading': 'Lädt…',
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Importieren (Datei)',
    'bots.importTitle': 'Hauptdatei des Bots wählen (index.js, bot.py…)',
    'bots.importDir': '📁 Importieren (Ordner)',
    'bots.importDirTitle': 'Den ORDNER des Bots wählen — die Hauptdatei wird automatisch erkannt',
    'bots.stopAll': '⏹ Alle stoppen',
    'bots.stopAllTitle': 'ALLE laufenden Bots stoppen (zum Bestätigen ein zweites Mal klicken)',
    'bots.stopAllArm': '⏹ Bestätigen?',
    'bots.stopAllBusy': '⏳ Stoppe…',
    'bots.stopAllDone': '✅ {n} gestoppt',
    'bots.stopAllFail': '⚠️ Fehlgeschlagen',
    'bots.hint': '„Auto-Start“: Der Bot geht wieder online, sobald du dich bei Windows anmeldest. „Im Spiel stoppen“: Dieser Bot wird gestoppt, wenn der Spielmodus greift (bei „nur angehakte Bots“).',
    'bots.none': 'Noch keine Bots von pm2 verwaltet. Importiere oben einen mit „➕ Importieren“.',
    'bots.searching': '⏳ Suche nach Bots…',
    'bots.imported': '🧩 Importierte Bots',
    'bots.autoboot': 'Auto-Start',
    'bots.gamestop': 'Im Spiel stoppen',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Wieder online bringen',
    'bots.fixBanner': '<b>{n}</b> Bot(s) sollten laufen',
    'bots.fixDone': '✅ {n} neu gestartet',
    'bots.fixPartial': '⚠️ {n} neu gestartet, {k} weiterhin offline',
    'gm.title': '🎮 Spielmodus',
    'gm.enable': 'Bots stoppen, wenn ein Spiel erkannt wird',
    'gm.all': 'Alle Bots',
    'gm.some': 'Nur Bots mit Haken bei „Im Spiel stoppen“',
    'gm.grace': 'Bots {input} s nach Spielende neu starten',
    'gm.soloskip': '<b>Einzelspieler</b>-Spiele ignorieren <span class="mut12">(nur stoppen, wenn das Spiel wirklich online ist)</span>',
    'gm.banner': '🎮 <b>Online-Spiel:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> erkannt — <b>Einzelspieler</b>-Partie: Bots bleiben online',
    'gm.bannerCut': ' — <b>{n} Bot(s) gestoppt</b> (Neustart automatisch nach dem Spiel)',
    'gm.bannerNone': ' — kein Bot zu stoppen',
    'gm.bannerOff': ' — Spielmodus ist aus',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;Bots online — kein Spiel erkannt',
    'lownet.title': '🌐 Geringe Internetnutzung',
    'lownet.enable': 'Netzwerk-Priorität für das Online-Spiel',
    'lownet.hint': 'Während einer Online-Partie: Die großen Downloads der Bots (Anti-Scam-Listen, verschlüsselte Backups) werden pausiert und ihre Priorität wird gesenkt — noch strenger, wenn deine Verbindung langsam ist. Nach der Partie ist alles wieder normal. Unabhängig vom Spielmodus: praktisch für Bots, die du durchlaufen lässt.',
    'lownet.active': ' · 🌐 geringe Internetnutzung aktiv',
    'lownet.broken': ' · ⚠️ Geringe Internetnutzung: Prioritäten gesetzt, aber das Signal hat die Bots nicht erreicht',
    'games.title': '🕹️ Erkannte Spiele (Prozesse)',
    'games.ph': 'MeinSpiel.exe',
    'games.add': 'Hinzufügen',
    'games.pick': '📋 Laufende Programme',
    'games.pickTitle': 'Aus den offenen Fenstern wählen (starte zuerst das Spiel)',
    'games.exe': '📁 Eine .exe wählen',
    'games.exeTitle': 'Die Festplatte nach der .exe des Spiels durchsuchen',
    'games.scan': '🔍 Scannen',
    'games.scanTitle': 'Installierte Spiele (Steam, Epic) suchen, die in der Liste fehlen',
    'games.hint': '„Laufende Programme“ zeigt, was gerade auf DEINEM PC läuft (ein Spiel oder Software, die die Standardliste nicht kennt): Starte das Spiel und wähle es aus — das ist am genauesten. „Scannen“ durchsucht deine Steam-/Epic-Bibliotheken (1×/Tag, nie durchgehend).',
    'set.title': '⚙️ Einstellungen',
    'set.autolaunch': 'Panel beim Start von Windows öffnen',
    'set.poll': 'Spiele / Bots alle {input} Sekunden prüfen',
    'set.scanauto': '<b>1×/Tag</b> nach neu installierten Spielen suchen',
    'set.scanHint': 'Die Prüfung oben liest nur die Prozessliste (sehr sparsam). Der Festplatten-Scan nach Spielen läuft dagegen <b>nie durchgehend</b>: höchstens 1×/Tag, oder über den Knopf „🔍 Scannen“.',
    'set.saveInfoTitle': 'pm2 stellt diese Liste beim Start des PCs wieder her — sie wird nach jedem Start/Stopp hier erneut gespeichert.',
    'set.saved': 'Letzte pm2-Speicherung: {d}',
    'set.savedNever': 'Noch keine pm2-Speicherung aus diesem Panel.',
    'alerts.title': '🔔 Alarme (Bot fällt aus)',
    'alerts.enable': 'Sag mir Bescheid, wenn ein Bot <b>ausfällt</b> oder <b>in einer Schleife neu startet</b>',
    'alerts.toast': 'Windows-Benachrichtigung (nur nützlich, wenn ich am PC bin)',
    'alerts.sound': 'Leiser Ton zur Benachrichtigung',
    'alerts.volTitle': 'Lautstärke des Tons',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (erreicht dich sogar im Spiel)',
    'alerts.test': 'Testen',
    'alerts.hint': 'Am nützlichsten ist der <b>Discord-Webhook</b>: Er erreicht dich mitten in der Partie oder wenn du nicht am PC bist. In Discord: <b>Kanaleinstellungen → Integrationen → Webhooks → Neuer Webhook → URL kopieren</b>. Der Alarm nennt <b>die Ursache im Klartext</b> (Internet weg, ungültiger Token, fehlendes Modul…).',
    'alerts.suppressed': ' — ⚠️ {n} Alarm(e) in dieser Stunde zurückgestellt (Anti-Spam-Grenze).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': '„🤖 Verwaltet X Bots online“ in meinem Discord-Profil anzeigen',
    'rpc.idPh': 'Leer lassen — standardmäßig wird die Anwendung Hasu Panel benutzt',
    'rpc.hint': 'Nichts einzurichten: Es läuft, sobald du es einschaltest (<b>Discord muss nur offen sein</b> auf diesem PC). Das Feld oben brauchst du nur, wenn du <b>deine eigene</b> Discord-Anwendung anzeigen willst — dann füge ihre <b>Application ID</b> ein (discord.com/developers/applications → General Information).',
    'rpc.off': ' — aus.',
    'rpc.on': ' — ✅ an.',
    'rpc.needId': ' — ⚠️ Füge deine Application ID ein, um es einzuschalten.',
    'upd.title': '🔄 Updates',
    'upd.version': 'Version:',
    'upd.check': 'Nach Updates suchen',
    'upd.apply': 'Neu starten & anwenden',
    'upd.auto': 'Updates <b>von allein</b> installieren <span class="mut11">(nie während einer Partie oder einer Aktion an den Bots)</span>',
    'upd.searching': '⏳ Suche nach Updates…',
    'upd.dev': 'ℹ️ Das Auto-Update funktioniert nur in der installierten Version (Setup.exe), nicht in der Entwicklung.',
    'upd.uptodate': '✅ Du hast bereits die neueste Version ({v}).',
    'upd.availableMsg': '⬇️ Neue Version <b>{v}</b> gefunden — wird geladen, gleich ist sie bereit.',
    'upd.readyMsg': '✅ <b>Update bereit</b> — klick auf „Neu starten & anwenden“.',
    'upd.errorMsg': '⚠️ Prüfen gerade nicht möglich{d}. Versuch es später noch einmal.',
    'upd.unexpected': '⚠️ Unerwartete Antwort.',
    'upd.cardDownloading': 'Update wird geladen…',
    'upd.cardReady': 'Update bereit zur Installation',
    'upd.cardAvailable': 'Neue Version verfügbar',
    'upd.cardPreparing': 'wird vorbereitet…',
    'upd.cardBroken': 'Update unterbrochen',
    'upd.install': 'Installieren und neu starten',
    'upd.later': 'Später',
    'upd.laterTitle': 'Diese Karte ausblenden',
    'upd.retry': 'Erneut versuchen',
    'upd.restarting': 'Neustart…',
    'upd.whyManual': 'Automatische Installation ist aus — wende sie an, wann du willst.',
    'upd.whyWaiting': 'Es installiert sich von allein, sobald es geht — wartet auf: {list}.',
    'upd.whyWindow': 'Es installiert sich von allein, sobald du dieses Fenster schließt.',
    'heal.title': '🔧 Automatischer Neustart',
    'heal.enable': 'Einen <b>ausgefallenen</b> Bot von allein neu starten <span class="mut11">(nach 5 Min., dann 15 Min., dann 1 Std.)</span>',
    'heal.hint': 'Wenn pm2 seine eigenen Neustarts aufgebraucht hat, bleibt der Bot tot, bis es dir auffällt. Das Panel versucht es für dich, <b>hört aber nach 3 Versuchen auf</b>: Ein Bot, der dreimal nicht zurückkommt, hat ein echtes Problem, und der Alarm muss sichtbar bleiben. Einen Bot, den <b>du</b> gestoppt hast, rührt es nie an — genauso wenig einen, den der Spielmodus gestoppt hat.',
    'inc.title': '📓 Letzte Vorfälle',
    'inc.none': 'Kein Vorfall aufgezeichnet. Ein gutes Zeichen.',
    'cfg.failTitle': 'Deine Einstellungen werden nicht mehr gespeichert',
    'cfg.failBody': 'Sie liegen in einer Sicherungskopie und bleiben aktiv, aber in die Hauptdatei lässt sich nicht mehr schreiben.',
    'cfg.failWhy': 'Datei: {path} — schau beim Virenscanner, bei einer Ordner-Synchronisierung oder bei einer vollen Festplatte nach.',
    'logs.title': 'Logs von {name}',
    'logs.out': 'Ausgabe',
    'logs.err': 'Fehler',
    'logs.filterPh': 'Filtern…',
    'logs.copy': 'Kopieren',
    'logs.openFolder': '📂 Log-Ordner',
    'logs.close': 'Schließen',
    'logs.empty': 'Noch keine Logs.',
    'logs.unreadable': 'Die Log-Datei ist da, konnte aber nicht gelesen werden (gesperrt oder Zugriff verweigert).',
    'logs.noMatch': 'Keine Zeile enthält „{q}“.',
    'logs.failed': 'Logs konnten nicht gelesen werden.',
    'tc.pm2Missing': '<b>⚠️ pm2 ist nicht installiert.</b><br>pm2 ist das Werkzeug, das deine Bots am Laufen hält. Klick, um es automatisch zu installieren (ohne Administratorrechte).',
    'tc.pm2Install': 'pm2 installieren',
    'tc.pm2Busy': ' ⏳ pm2 wird installiert… (bis zu 1 Min.)',
    'tc.pm2Ok': ' ✅ pm2 installiert!',
    'tc.pm2NoNode': ' ❌ Node.js wird zuerst gebraucht.',
    'tc.pm2Fail': ' ❌ Fehlgeschlagen — versuch es erneut oder installiere pm2 von Hand.',
    'tc.pm2Down': 'pm2 antwortet nicht mehr — der Zustand der Bots ist nicht lesbar.',
    'tray.open': 'Panel öffnen',
    'tray.game': 'Spielmodus: {v}',
    'tray.on': 'an ✔',
    'tray.off': 'aus',
    'tray.update': '🔄 Update bereit — anwenden & neu starten',
    'tray.quit': 'Beenden',
    'tray.tipBots': 'Hasu Panel — {on}/{total} Bots online',
    'tray.online': ' (online)',
    'tray.solo': ' (Einzelspieler)',
    'tray.cut': ' · {n} Bot(s) gestoppt',
    'tray.low': ' · 🌐 Netz-Sparmodus',
    'blk.game': 'ein Spiel läuft',
    'blk.unknown': 'unklar, ob ein Spiel läuft',
    'blk.busy': 'Umschalten des Spielmodus läuft',
    'blk.action': 'eine Aktion an einem Bot läuft',
    'blk.stopAll': 'globaler Stopp läuft',
    'blk.parked': 'vom Spielmodus gestoppte Bots',
    'blk.lownet': 'geringe Internetnutzung aktiv',
    'blk.window': 'Fenster offen',
    'blk.grace': 'Karenzzeit',
    'upd.readyManual': '✅ <b>Update bereit</b> — klick auf „Neu starten & anwenden“ (automatische Installation ist aus).',
    'upd.readyWaiting': '✅ <b>Update bereit</b> — es installiert sich von allein, sobald es geht.<br><span style="opacity:.75">Wartet auf: {list}.</span> Du kannst es auch jetzt anwenden.',
    'upd.readySoon': '✅ <b>Update bereit</b> — automatische Installation steht kurz bevor…',
    'set.lastScan': '(letzter Scan: {d})',
    'set.noScan': '(noch kein Scan)',
    'set.devOnly': '(nur in der .exe-Version aktiv)',
    'bots.netTitle': 'Netzwerk des Bots, gemessen über seine Ein-/Ausgaben (bei einem Discord-Bot fast nur Netzwerk plus ein wenig SQLite-Festplatte) — ↓ empfangen · ↑ gesendet',
    'bots.parked': '⏸ vom Spielmodus gestoppt',
    'bots.autobootTitle': 'Geht wieder online, sobald du dich bei Windows anmeldest',
    'bots.gamestopTitle': 'Wird gestoppt, wenn ein Spiel erkannt wird (Modus „angehakte Bots“)',
    'bots.logsTitle': 'Letzte Logs ansehen (Abstürze, Fehler…)',
    'bots.folderTitle': 'Ordner des Bots im Explorer öffnen',
    'bots.removeTitle': 'Diesen Bot stoppen und aus pm2 entfernen (seine Dateien bleiben unberührt)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — was ist das?</h2>
  <p>Eine Schaltzentrale für <b>alle deine Bots</b>: Sie laufen dank <b>pm2</b> im Hintergrund, und du verwaltest sie hier, ohne eine Konsole anzufassen.</p>
  <h3>🤖 Die Bot-Liste</h3>
  <p>Eine Zeile pro Bot. <b style="color:#3ba55d">Grüner</b> Punkt = online, grauer = gestoppt, <b style="color:#ed4245">roter</b> = Fehler. Knöpfe: ▶ starten · ⏹ stoppen · ⟳ neu starten · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> zeigt die <b>letzten Zeilen des Bots</b> (Fehler, Abstürze…) — praktisch, um zu verstehen, warum er ausgefallen ist, <b>ohne ein Terminal zu öffnen</b>.</p>
  <p><b>Auto-Start</b>: angehakt → der Bot geht von allein wieder online, wenn du den PC einschaltest. Nicht angehakt → er bleibt beim Start aus.</p>
  <p><b>⏹ Alle stoppen</b> (über der Liste) stoppt <b>alle laufenden Bots</b> auf einmal. Sicherheit: Du musst <b>zweimal</b> klicken, um zu bestätigen.</p>
  <p>Bei jedem Stopp räumt das Panel auf: Die <b>kleinen Programme, die ein Bot gestartet hat</b> (das ffmpeg des Musik-Bots, eine laufende Installation…), die früher überlebt und den PC zugemüllt haben, werden <b>ebenfalls sauber beendet</b>.</p>
  <p>Ist ein Bot aus, der eigentlich laufen sollte, erscheint oben in der Liste ein <b>Banner</b> mit dem Knopf <b>„Wieder online bringen“</b>, der sie alle auf einmal startet. Gezählt wird nur, was <b>wirklich zurückgekommen ist</b>: Weigert sich ein Bot zu starten (Ordner verschoben, Datei fehlt), sagt es dir das Panel, statt einen Erfolg zu melden.</p>
  <h3>🔔 Bescheid bekommen, wenn ein Bot ausfällt</h3>
  <p>Genau dafür ist das Panel da: nie wieder <b>drei Tage später</b> merken, dass ein Bot tot ist. Fällt ein Bot aus oder startet er in einer Schleife neu, bekommst du eine <b>dezente Windows-Benachrichtigung</b> mit einem <b>leisen Ton</b> (Lautstärke einstellbar), und der Alarm nennt <b>die Ursache im Klartext</b> — Internet weg, ungültiger Token, fehlendes Modul, Speicher voll…</p>
  <p>Am nützlichsten bleibt der <b>Discord-Webhook</b>: Er erreicht dich mitten in der Partie oder wenn du nicht am PC bist. In Discord: <b>Kanaleinstellungen → Integrationen → Webhooks → Neuer Webhook → URL kopieren</b>, dann in ⚙️ Einstellungen einfügen.</p>
  <p>Das Panel unterscheidet eine <b>Panne</b> von einem <b>bewussten Stopp</b>: Stoppst du einen Bot selbst — im Panel <i>oder</i> im Terminal —, alarmiert es dich nicht und holt ihn beim nächsten Start nicht zurück. Auch beim Aufwachen des PCs und direkt nach dem Start hält es still, bis das Netz wieder da ist, damit dich keine Salve falscher Alarme trifft.</p>
  <p>Scheitert das Senden — typischerweise, weil die Panne <i>genau</i> die Internetunterbrechung ist —, wird der Alarm <b>erneut versucht</b>, statt verloren zu gehen. Und wenn pm2 selbst nicht mehr antwortet, sagt dir das Panel Bescheid: Sonst wäre gar kein Alarm mehr möglich und die Stille würde nach „alles gut“ aussehen.</p>
  <h3>➕ Einen Bot importieren</h3>
  <p>Du hast einen Bot, den du sonst von Hand startest (etwa aus <b>Visual Studio</b> mit <code>node index.js</code>)? Klick auf „Importieren“ (<b>Datei</b> oder <b>ganzer Ordner</b> — dann wird die Hauptdatei von allein erkannt), gib ihm einen Namen, das war es:</p>
  <p>• er läuft <b>im Hintergrund</b>, auch bei geschlossenem Visual Studio;<br>• er <b>startet von allein neu</b>, wenn er abstürzt;<br>• er <b>übersteht Neustarts des PCs</b>;<br>• er wird hier <b>wie die anderen</b> verwaltet (Auto-Start, Spielmodus…).</p>
  <p>Der Knopf 🗑 stoppt den Bot und entfernt ihn aus pm2 — <b>seine Dateien werden nie angefasst</b>.</p>
  <h3>🎮 Der Spielmodus</h3>
  <p>Wird ein Spiel aus der Liste erkannt (Fortnite, Valorant…), <b>stoppt das Panel die von dir gewählten Bots</b>, um den PC freizumachen, während du spielst, und <b>startet sie automatisch neu</b>, etwa eine Minute nach Spielende. Du entscheidest: <b>alle</b> Bots stoppen oder nur die mit Haken bei „Im Spiel stoppen“.</p>
  <p><b>Einzelspieler?</b> Das Panel prüft, ob das Spiel <b>wirklich mit dem Internet verbunden</b> ist: Eine Solo- oder Offline-Partie stoppt nichts (Option „Einzelspieler-Spiele ignorieren“). Beispiel: GTA V im Story-Modus → Bots bleiben online; GTA Online → Spielmodus greift.</p>
  <h3>🕹️ Ein Spiel zur Erkennung hinzufügen</h3>
  <p>Drei Wege: <b>📋 Laufende Programme</b> (starte das Spiel und wähle es aus der Liste — am genauesten, klappt auch für jede andere Software), <b>📁 Eine .exe wählen</b> (Festplatte durchsuchen) oder <b>🔍 Scannen</b> (durchsucht deine Steam-/Epic-Bibliotheken und schlägt installierte Spiele vor, die in der Liste fehlen).</p>
  <p>Der Festplatten-Scan läuft <b>nie durchgehend</b>: automatisch höchstens <b>1×/Tag</b> (in ⚙️ Einstellungen abschaltbar) oder wenn du auf „Scannen“ klickst. Die dauerhafte Überwachung liest nur die Prozessliste — praktisch gratis.</p>
  <h3>🌐 Geringe Internetnutzung</h3>
  <p>Eingeschaltet gibt dieser Modus dem <b>Online-Spiel die Netzwerk-Priorität</b>: Während der Partie schieben die Bots ihre <b>großen Downloads</b> auf (Anti-Scam-Listen, verschlüsselte Backups) und gehen auf <b>niedrige Priorität</b> — umso strenger, je langsamer deine Verbindung ist (automatisch gemessen). Nach der Partie ist alles wieder normal. Unabhängig vom Spielmodus: perfekt, um einen Bot online zu lassen, <i>ohne</i> dass er Lag verursacht.</p>
  <h3>🔄 Automatische Updates</h3>
  <p>Das Panel <b>aktualisiert sich von allein</b>: Es prüft beim Start und danach alle 6 Std., und alles passiert <b>im Fenster</b>. Sobald eine Version gefunden ist, erscheint oben eine Karte: <b>Fortschrittsbalken</b> mit Prozent, Tempo und Größe, dann die <b>Neuerungen der Version</b> und ein Knopf <b>„Installieren und neu starten“</b>. „Später“ blendet die Karte aus — die Installation läuft weiter.</p>
  <p>Im Prinzip musst du <b>nichts anklicken</b>: Das Update installiert sich von allein, sobald es gefahrlos ist. Es tut das <b>nie</b> während einer Partie, nie während einer Aktion an den Bots und nie, solange du auf das Fenster schaust — die Karte sagt dir genau, <b>worauf sie wartet</b>. Schließ das Fenster, und es wird angewendet. (In ⚙️ Einstellungen abschaltbar, mit dem Knopf „Nach Updates suchen“ für eine erzwungene Prüfung.)</p>
  <h3>🔋 Sparsam mit Ressourcen</h3>
  <p>Das Panel läuft rund um die Uhr, ohne aufzufallen: Ist es <b>in den Infobereich minimiert</b>, <b>bremst es seine Überwachung</b> und rechnet keine Anzeige mehr aus, die niemand ansieht. Sobald du das Fenster wieder öffnest, ist alles sofort da. (Ist der Spielmodus oder die geringe Internetnutzung aktiv, bleibt es wach, um nichts zu verpassen.)</p>
  <h3>🎮 Deine Discord-Präsenz</h3>
  <p>Die Option „Rich Presence“ zeigt in deinem Discord-Profil <b>„🤖 Verwaltet X Bots online“</b> (und das laufende Spiel). <b>Nichts einzurichten</b> — Discord muss nur offen sein. Reine Deko, in ⚙️ Einstellungen abschaltbar.</p>
  <h3>🧰 Auf einem frischen PC (bei einem Freund)</h3>
  <p>Die Bots brauchen <b>Node.js</b> und <b>pm2</b>. Fehlt eines von beiden, <b>erkennt das Panel es</b> und bietet den passenden Knopf an („Node.js herunterladen“ oder „pm2 installieren“), statt eine leere Liste zu zeigen.</p>
  <h3>📁 Gut zu wissen</h3>
  <p>• Das Kreuz des Fensters <b>minimiert in den Infobereich</b> (neben der Uhr). Zum Beenden: Rechtsklick auf das Symbol → Beenden.<br>• Einstellungen liegen in <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, das Protokoll in <code>panel.log</code>.<br>• Eine <b>Sicherungskopie</b> der Einstellungen wird daneben mitgeführt (<code>.bak</code>) und automatisch übernommen, wenn die Hauptdatei unlesbar wird oder nicht mehr geschrieben wird. Klappt das Speichern nicht mehr, sagt dir ein <b>rotes Banner</b> Bescheid — statt dich glauben zu lassen, deine Einstellungen wären sicher.<br>• Das Panel startet von allein mit Windows (in ⚙️ Einstellungen abschaltbar).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['de'] = L; }
})();
