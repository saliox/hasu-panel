// Nederlands — vertaling van de interface van het Hasu Panel.
//
// FORMAAT (in alle talen identiek te respecteren) :
//  • `ui` : één regel per sleutel. De sleutels zijn IDENTIEK in alle talen — hier nooit sleutels
//    toevoegen, weghalen of hernoemen : het Frans (fr.js) is de referentie.
//  • de plaatshouders {x} moeten ONGEWIJZIGD blijven : ze krijgen hun waarde tijdens het draaien.
//  • de HTML-tags (<b>, <span class="mut11">, <br>) moeten eveneens behouden blijven.
//  • `about` : de inhoud van het venster « Over ». {v} krijgt daar het versienummer.
// Een test (test/i18n.test.js) controleert bij elke `npm test` of sleutels en plaatshouders kloppen.
(function () {
  const L = { nom: 'Nederlands', ui: {
    'app.sub': 'pm2-bots beheren · gamemodus',
    'btn.about': 'ℹ️ Over',
    'btn.lang': '🇫🇷 Français',
    'btn.langTitle': 'Zet het panel terug op Frans',
    'banner.loading': 'Laden…',
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Importeren (bestand)',
    'bots.importTitle': 'Kies het hoofdbestand van de bot (index.js, bot.py…)',
    'bots.importDir': '📁 Importeren (map)',
    'bots.importDirTitle': 'Kies de MAP van de bot — het hoofdbestand wordt vanzelf gevonden',
    'bots.stopAll': '⏹ Alles stoppen',
    'bots.stopAllTitle': 'ALLE draaiende bots stoppen (klik een tweede keer om te bevestigen)',
    'bots.stopAllArm': '⏹ Bevestigen?',
    'bots.stopAllBusy': '⏳ Stoppen…',
    'bots.stopAllDone': '✅ {n} gestopt',
    'bots.stopAllFail': '⚠️ Mislukt',
    'bots.hint': '"Auto boot": de bot wordt weer online gezet zodra je op Windows inlogt. "Stop bij gamen": deze bot wordt gestopt zodra de gamemodus aanslaat (als "alleen aangevinkte bots" gekozen is).',
    'bots.none': 'Nog geen bots onder beheer van pm2. Voeg er een toe met "➕ Importeren" hierboven.',
    'bots.searching': '⏳ Bezig met zoeken naar bots…',
    'bots.imported': '🧩 Geïmporteerde bots',
    'bots.autoboot': 'Auto boot',
    'bots.gamestop': 'Stop bij gamen',
    'bots.logs': '📄 Logs',
    'bots.folder': '📂',
    'bots.remove': '🗑',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Weer online zetten',
    'bots.fixBanner': '<b>{n}</b> bot(s) zouden moeten draaien',
    'bots.fixDone': '✅ {n} herstart',
    'bots.fixPartial': '⚠️ {n} herstart, {k} nog offline',
    'gm.title': '🎮 Gamemodus',
    'gm.enable': 'Bots stoppen zodra een game wordt herkend',
    'gm.all': 'Alle bots',
    'gm.some': 'Alleen bots met "Stop bij gamen" aangevinkt',
    'gm.grace': 'Bots {input} s na het sluiten van de game herstarten',
    'gm.soloskip': '<b>Singleplayer</b>-games negeren <span class="mut12">(alleen stoppen als de game echt online is)</span>',
    'gm.banner': '🎮 <b>Online game:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> herkend — <b>singleplayer</b>-sessie: de bots blijven online',
    'gm.bannerCut': ' — <b>{n} bot(s) gestopt</b> (automatisch herstart zodra je klaar bent)',
    'gm.bannerNone': ' — geen bot om te stoppen',
    'gm.bannerOff': ' — gamemodus staat uit',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bots online — geen game herkend',
    'lownet.title': '🌐 Laag internetgebruik',
    'lownet.enable': 'Netwerkvoorrang voor de online game',
    'lownet.hint': 'Tijdens een online partij: de grote downloads van de bots (anti-scamlijsten, versleutelde back-ups) worden gepauzeerd en hun prioriteit gaat omlaag — nog strenger als je verbinding traag is. Zodra de partij voorbij is, wordt alles weer normaal. Los van de gamemodus: handig voor bots die je laat doordraaien.',
    'lownet.active': ' · 🌐 laag internetgebruik actief',
    'lownet.broken': ' · ⚠️ laag internetgebruik: prioriteiten toegepast, maar het signaal heeft de bots nooit bereikt',
    'games.title': '🕹️ Herkende games (processen)',
    'games.ph': 'MijnGame.exe',
    'games.add': 'Toevoegen',
    'games.pick': '📋 Open programma\'s',
    'games.pickTitle': 'Kies uit de open vensters (start de game eerst)',
    'games.exe': '📁 Kies een .exe',
    'games.exeTitle': 'Blader over de schijf naar de .exe van de game',
    'games.scan': '🔍 Scannen',
    'games.scanTitle': 'Zoek geïnstalleerde games (Steam, Epic) die nog niet in de lijst staan',
    'games.hint': '"Open programma\'s" toont wat er echt op JOUW pc draait (een game, of software die de standaardlijst niet kent): start de game en kies hem — dat is het nauwkeurigst. "Scannen" doorzoekt je Steam/Epic-bibliotheken (1×/dag, nooit doorlopend).',
    'set.title': '⚙️ Instellingen',
    'set.autolaunch': 'Het panel starten zodra Windows start',
    'set.poll': 'Games / bots elke {input} seconden nakijken',
    'set.scanauto': 'Zoeken naar nieuw geïnstalleerde games <b>1×/dag</b>',
    'set.scanHint': 'Het nakijken hierboven leest alleen de proceslijst (heel licht). De schijfscan naar games draait <b>nooit doorlopend</b>: hoogstens 1×/dag, of via de knop "🔍 Scannen".',
    'set.saveInfoTitle': 'pm2 herstelt deze lijst zodra de pc start — ze wordt opnieuw opgeslagen na elke start/stop die je hier doet.',
    'set.saved': 'Laatste pm2-opslag: {d}',
    'set.savedNever': 'Nog geen pm2-opslag vanuit dit panel.',
    'alerts.title': '🔔 Meldingen (bot valt uit)',
    'alerts.enable': 'Waarschuw me als een bot <b>uitvalt</b> of <b>in een lus herstart</b>',
    'alerts.toast': 'Windows-melding (alleen nuttig als ik achter de pc zit)',
    'alerts.sound': 'Zacht geluidje bij de melding',
    'alerts.volTitle': 'Volume van het geluid',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (bereikt je zelfs tijdens het gamen)',
    'alerts.test': 'Testen',
    'alerts.hint': 'De <b>Discord-webhook</b> is het handigst: die bereikt je midden in een partij of als je niet achter de pc zit. In Discord: <b>Kanaalinstellingen → Integraties → Webhooks → Nieuwe webhook → URL kopiëren</b>. De melding noemt <b>de oorzaak in gewone taal</b> (internet eruit, ongeldig token, ontbrekende module…).',
    'alerts.suppressed': ' — ⚠️ {n} melding(en) uitgesteld dit uur (antispamlimiet).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': '"🤖 Beheert X bots online" op mijn Discord-profiel tonen',
    'rpc.idPh': 'Laat leeg — standaard wordt de Hasu Panel-applicatie gebruikt',
    'rpc.hint': 'Niets in te stellen: het werkt zodra je het aanzet (<b>Discord moet alleen open staan</b> op deze pc). Het veld hierboven is enkel nodig als je <b>je eigen</b> Discord-applicatie wilt tonen — plak in dat geval het <b>Application ID</b> ervan (discord.com/developers/applications → General Information).',
    'rpc.off': ' — uit.',
    'rpc.on': ' — ✅ aan.',
    'rpc.needId': ' — ⚠️ plak je Application ID om het aan te zetten.',
    'upd.title': '🔄 Updates',
    'upd.version': 'Versie:',
    'upd.check': 'Controleren op updates',
    'upd.apply': 'Herstarten & toepassen',
    'upd.auto': 'Updates <b>vanzelf</b> installeren <span class="mut11">(nooit tijdens een partij, nooit tijdens een actie op de bots)</span>',
    'upd.searching': '⏳ Bezig met zoeken naar updates…',
    'upd.dev': 'ℹ️ Auto-update werkt alleen in de geïnstalleerde versie (Setup.exe), niet tijdens ontwikkeling.',
    'upd.uptodate': '✅ Je hebt al de nieuwste versie ({v}).',
    'upd.availableMsg': '⬇️ Nieuwe versie <b>{v}</b> gevonden — bezig met downloaden, ze is zo klaar.',
    'upd.readyMsg': '✅ <b>Update klaar</b> — klik op "Herstarten & toepassen".',
    'upd.errorMsg': '⚠️ Kan nu niet controleren{d}. Probeer het later opnieuw.',
    'upd.unexpected': '⚠️ Onverwacht antwoord.',
    'upd.cardDownloading': 'Bezig met downloaden van de update…',
    'upd.cardReady': 'Update klaar om te installeren',
    'upd.cardAvailable': 'Nieuwe versie beschikbaar',
    'upd.cardPreparing': 'voorbereiden…',
    'upd.cardBroken': 'Update onderbroken',
    'upd.install': 'Installeren en herstarten',
    'upd.later': 'Later',
    'upd.laterTitle': 'Deze kaart verbergen',
    'upd.retry': 'Opnieuw proberen',
    'upd.restarting': 'Herstarten…',
    'upd.whyManual': 'Vanzelf installeren staat uit — pas de update toe wanneer je wilt.',
    'upd.whyWaiting': 'Ze installeert zichzelf zodra het kan — wacht nog op: {list}.',
    'upd.whyWindow': 'Ze installeert zichzelf zodra je dit venster sluit.',
    'heal.title': '🔧 Automatisch herstarten',
    'heal.enable': 'Een <b>uitgevallen</b> bot vanzelf herstarten <span class="mut11">(na 5 min, dan 15 min, dan 1 u)</span>',
    'heal.hint': 'Zodra pm2 zijn eigen herstarts heeft opgebruikt, blijft de bot dood tot jij het toevallig merkt. Het panel probeert het in jouw plaats, en <b>stopt na 3 pogingen</b>: een bot die er drie keer niet in slaagt terug te komen heeft een echt probleem, en de melding moet zichtbaar blijven. Het raakt nooit een bot aan die <b>jij</b> hebt gestopt, en ook geen bot die door de gamemodus is gestopt.',
    'inc.title': '📓 Recente incidenten',
    'inc.none': 'Geen incident geregistreerd. Dat is een goed teken.',
    'cfg.failTitle': 'Je instellingen worden niet meer opgeslagen',
    'cfg.failBody': 'Ze staan in een reservekopie en blijven actief, maar er kan niet meer naar het hoofdbestand worden geschreven.',
    'cfg.failWhy': 'Bestand: {path} — kijk naar je antivirus, een mapsynchronisatie of een volle schijf.',
    'logs.title': 'Logs van {name}',
    'logs.out': 'Uitvoer',
    'logs.err': 'Fouten',
    'logs.filterPh': 'Filteren…',
    'logs.copy': 'Kopiëren',
    'logs.openFolder': '📂 Logmap',
    'logs.close': 'Sluiten',
    'logs.empty': 'Nog geen logs.',
    'logs.unreadable': 'Het logbestand bestaat, maar kon niet worden gelezen (vergrendeld, of toegang geweigerd).',
    'logs.noMatch': 'Geen enkele regel bevat "{q}".',
    'logs.failed': 'Kon de logs niet lezen.',
    'tc.pm2Missing': '<b>⚠️ pm2 is niet geïnstalleerd.</b><br>pm2 is de tool die je bots draaiende houdt. Klik om hem automatisch te laten installeren (zonder beheerdersrechten).',
    'tc.pm2Install': 'pm2 installeren',
    'tc.pm2Busy': ' ⏳ pm2 installeren… (tot 1 min)',
    'tc.pm2Ok': ' ✅ pm2 geïnstalleerd!',
    'tc.pm2NoNode': ' ❌ Node.js is eerst nodig.',
    'tc.pm2Fail': ' ❌ Mislukt — probeer opnieuw, of installeer pm2 met de hand.',
    'tc.pm2Down': 'pm2 antwoordt niet meer — de toestand van de bots kan niet worden gelezen.',
    'tray.open': 'Het panel openen',
    'tray.game': 'Gamemodus: {v}',
    'tray.on': 'aan ✔',
    'tray.off': 'uit',
    'tray.update': '🔄 Update klaar — toepassen & herstarten',
    'tray.quit': 'Afsluiten',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bots online',
    'tray.online': ' (online)',
    'tray.solo': ' (singleplayer)',
    'tray.cut': ' · {n} bot(s) gestopt',
    'tray.low': ' · 🌐 zuinig internet',
    'blk.game': 'er draait een game',
    'blk.unknown': 'onduidelijk of er een game draait',
    'blk.busy': 'omschakeling gamemodus bezig',
    'blk.action': 'er loopt een actie op een bot',
    'blk.stopAll': 'algemene stop bezig',
    'blk.parked': 'bots gestopt door de gamemodus',
    'blk.lownet': 'laag internetgebruik actief',
    'blk.window': 'venster open',
    'blk.grace': 'respijtperiode',
    'upd.readyManual': '✅ <b>Update klaar</b> — klik op "Herstarten & toepassen" (vanzelf installeren staat uit).',
    'upd.readyWaiting': '✅ <b>Update klaar</b> — ze installeert zichzelf zodra het kan.<br><span style="opacity:.75">Wacht nog op: {list}.</span> Je kunt ze ook nu toepassen.',
    'upd.readySoon': '✅ <b>Update klaar</b> — installeert zichzelf zo meteen…',
    'set.lastScan': '(laatste scan: {d})',
    'set.noScan': '(nog geen scan)',
    'set.devOnly': '(alleen actief in de .exe-versie)',
    'bots.netTitle': 'Netwerkverkeer van de bot, gemeten via zijn in- en uitvoer (bij een Discord-bot bijna volledig netwerk plus een beetje SQLite-schijf) — ↓ ontvangen · ↑ verzonden',
    'bots.parked': '⏸ gestopt door de gamemodus',
    'bots.autobootTitle': 'Weer online gezet zodra je op Windows inlogt',
    'bots.gamestopTitle': 'Gestopt zodra een game wordt herkend (modus "aangevinkte bots")',
    'bots.logsTitle': 'Recente logs bekijken (crashes, fouten…)',
    'bots.folderTitle': 'De map van de bot openen in Verkenner',
    'bots.removeTitle': 'Deze bot stoppen en uit pm2 halen (de bestanden blijven onaangeroerd)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — wat is dat?</h2>
  <p>Een bedieningspaneel voor <b>al je bots</b>: ze draaien op de achtergrond dankzij <b>pm2</b>, en je beheert ze hier zonder een console aan te raken.</p>
  <h3>🤖 De lijst met bots</h3>
  <p>Eén regel per bot. Een <b style="color:#3ba55d">groen</b> bolletje betekent online, grijs betekent gestopt, <b style="color:#ed4245">rood</b> betekent fout. Knoppen: ▶ starten · ⏹ stoppen · ⟳ herstarten · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> toont de <b>laatste regels van de bot</b> (fouten, crashes…) — handig om te snappen waarom hij is uitgevallen, <b>zonder een terminal te openen</b>.</p>
  <p><b>Auto boot</b>: aangevinkt → de bot wordt vanzelf weer online gezet zodra je de pc aanzet. Uitgevinkt → hij blijft uit bij het opstarten.</p>
  <p><b>⏹ Alles stoppen</b> (boven de lijst) stopt <b>alle draaiende bots</b> in één keer. Beveiliging: je moet <b>twee keer</b> klikken om te bevestigen.</p>
  <p>Bij elke stop ruimt het panel op: de <b>kleine programma's die een bot heeft gestart</b> (de ffmpeg van de muziekbot, een lopende installatie…) die vroeger bleven hangen en de pc vervuilden, worden nu <b>netjes mee afgesloten</b>.</p>
  <p>Staat een bot uit die zou moeten draaien, dan verschijnt er een <b>balk</b> boven aan de lijst met de knop <b>"Weer online zetten"</b>, die ze allemaal in één keer herstart. Hij telt alleen wat <b>echt is teruggekomen</b>: als een bot weigert te starten (map verplaatst, bestand weg), zegt hij dat in plaats van succes te melden.</p>
  <h3>🔔 Gewaarschuwd worden als een bot uitvalt</h3>
  <p>Daar is het panel voor bedoeld: nooit meer <b>drie dagen later</b> ontdekken dat een bot dood is. Als een bot uitvalt of in een lus herstart, krijg je een <b>discrete Windows-melding</b> met een <b>zacht geluidje</b> (volume instelbaar), en de melding noemt <b>de oorzaak in gewone taal</b> — internet eruit, ongeldig token, ontbrekende module, geheugen vol…</p>
  <p>Het handigst blijft de <b>Discord-webhook</b>: die bereikt je midden in een partij, of als je niet achter de pc zit. In Discord: <b>Kanaalinstellingen → Integraties → Webhooks → Nieuwe webhook → URL kopiëren</b>, en plak die daarna in ⚙️ Instellingen.</p>
  <p>Het panel ziet het verschil tussen een <b>storing</b> en een <b>bewuste stop</b>: stop je een bot zelf — vanuit het panel <i>of</i> vanuit een terminal — dan waarschuwt het je niet, herstart het hem niet, en zet het hem bij de volgende start niet terug aan. Het houdt zich ook stil als de pc ontwaakt en vlak na het opstarten, tot het netwerk weer terug is, zodat je geen regen van nepmeldingen krijgt.</p>
  <p>Lukt het versturen niet — meestal juist omdat de storing dat weggevallen internet <i>is</i> — dan wordt de melding <b>opnieuw geprobeerd</b> in plaats van verloren te gaan. En als pm2 zelf niet meer antwoordt, zegt het panel het je: zonder dat zou geen enkele melding nog mogelijk zijn en zou de stilte op "alles in orde" lijken.</p>
  <h3>➕ Een bot importeren</h3>
  <p>Heb je een bot die je gewoonlijk met de hand start (bijvoorbeeld vanuit <b>Visual Studio</b> met <code>node index.js</code>)? Klik op "Importeren" (<b>bestand</b> of <b>hele map</b> — in dat geval wordt het hoofdbestand vanzelf gevonden), geef hem een naam, en klaar is het:</p>
  <p>• hij draait <b>op de achtergrond</b>, ook met Visual Studio dicht;<br>• hij <b>herstart vanzelf</b> als hij crasht;<br>• hij <b>overleeft het herstarten van de pc</b>;<br>• je beheert hem hier <b>net als de andere</b> (auto boot, gamemodus…).</p>
  <p>De knop 🗑 stopt de bot en haalt hem uit pm2 — <b>zijn bestanden blijven altijd onaangeroerd</b>.</p>
  <h3>🎮 De gamemodus</h3>
  <p>Zodra een game uit de lijst wordt herkend (Fortnite, Valorant…), <b>stopt het panel de bots die je hebt gekozen</b> om de pc vrij te maken terwijl je speelt, en <b>herstart het ze automatisch</b> ongeveer een minuut nadat de game is gesloten. Jij kiest: <b>alle</b> bots stoppen, of alleen die met "Stop bij gamen" aangevinkt.</p>
  <p><b>Singleplayer?</b> Het panel kijkt na of de game <b>echt met internet verbonden is</b>: een offlinepartij stopt niets (optie "Singleplayer-games negeren"). Bijvoorbeeld: GTA V in verhaalmodus → bots blijven online; GTA Online → gamemodus slaat aan.</p>
  <h3>🕹️ Een game aan de herkenning toevoegen</h3>
  <p>Drie manieren: <b>📋 Open programma's</b> (start de game en kies hem uit de lijst — het nauwkeurigst, en het werkt ook voor gewone software), <b>📁 Kies een .exe</b> (over de schijf bladeren), of <b>🔍 Scannen</b> (doorzoekt je Steam/Epic-bibliotheken en stelt de geïnstalleerde games voor die nog niet in de lijst staan).</p>
  <p>De schijfscan draait <b>nooit doorlopend</b>: vanzelf hoogstens <b>1×/dag</b> (uit te zetten in ⚙️ Instellingen), of wanneer je op "Scannen" klikt. De permanente bewaking leest alleen de proceslijst — zo goed als gratis.</p>
  <h3>🌐 Laag internetgebruik</h3>
  <p>Aangezet geeft dit <b>netwerkvoorrang aan de online game</b>: tijdens de partij stellen de bots hun <b>grote downloads</b> uit (anti-scamlijsten, versleutelde back-ups) en zakken ze naar <b>lage prioriteit</b> — strenger naarmate je verbinding trager is (vanzelf gemeten). Zodra de partij voorbij is, wordt alles weer normaal. Los van de gamemodus: ideaal om een bot online te houden <i>zonder</i> dat hij lag veroorzaakt.</p>
  <h3>🔄 Automatische updates</h3>
  <p>Het panel <b>werkt zichzelf bij</b>: het controleert bij het starten en daarna elke 6 u, en alles gebeurt <b>in het venster zelf</b>. Zodra er een versie is gevonden verschijnt er boven aan een kaart: <b>voortgangsbalk</b> met percentage, snelheid en grootte, daarna de <b>nieuwigheden van de versie</b> en een knop <b>"Installeren en herstarten"</b>. "Later" verbergt de kaart — de installatie loopt gewoon door.</p>
  <p>In principe hoef je <b>nergens op te klikken</b>: de update installeert zichzelf zodra dat zonder risico kan. Ze doet dat <b>nooit</b> tijdens een partij, niet tijdens een actie op de bots, en niet zolang jij naar het venster kijkt — de kaart vertelt je precies <b>waarop ze wacht</b>. Sluit het venster en ze wordt toegepast. (Uit te zetten in ⚙️ Instellingen, met de knop "Controleren op updates" om een controle af te dwingen.)</p>
  <h3>🔋 Zuinig met systeembronnen</h3>
  <p>Het panel draait dag en nacht zonder in de weg te lopen: als het <b>weggeborgen zit in het systeemvak</b>, <b>vertraagt het zijn bewaking</b> en stopt het met rekenen aan beeld waar niemand naar kijkt. Open je het venster weer, dan is alles meteen weer vlot. (Staat de gamemodus of laag internetgebruik aan, dan blijft het alert zodat het niets mist.)</p>
  <h3>🎮 Je Discord-aanwezigheid</h3>
  <p>Met de optie "Rich Presence" toont je Discord-profiel <b>"🤖 Beheert X bots online"</b> (en de game die je speelt). <b>Niets in te stellen</b> — Discord moet alleen open staan. Puur voor de sier, en uit te zetten in ⚙️ Instellingen.</p>
  <h3>🧰 Op een verse pc (bij een vriend)</h3>
  <p>Bots hebben <b>Node.js</b> en <b>pm2</b> nodig. Ontbreekt een van de twee, dan <b>merkt het panel dat</b> en biedt het de juiste knop aan ("Node.js downloaden" of "pm2 installeren") in plaats van een lege lijst te tonen.</p>
  <h3>📁 Goed om te weten</h3>
  <p>• Het kruisje van het venster <b>bergt het op in het systeemvak</b> (naast de klok). Afsluiten doe je zo: rechtsklik op het pictogram → Afsluiten.<br>• Instellingen staan in <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, het logboek in <code>panel.log</code>.<br>• Er wordt ernaast een <b>reservekopie</b> van de instellingen bijgehouden (<code>.bak</code>), en die wordt vanzelf gebruikt als het hoofdbestand onleesbaar wordt of er niet meer naar geschreven kan worden. Lukt het opslaan niet meer, dan zegt een <b>rode balk</b> het je — in plaats van je te laten geloven dat je instellingen veilig staan.<br>• Het panel start mee met Windows (uit te zetten in ⚙️ Instellingen).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['nl'] = L; }
})();
