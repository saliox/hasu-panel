// Polski — tłumaczenie interfejsu Hasu Panel.
//
// FORMAT (identyczny we wszystkich językach):
//  • `ui` : jeden wpis na klucz. Klucze są TAKIE SAME we wszystkich językach — nigdy ich tutaj nie
//    dodawaj, nie usuwaj ani nie zmieniaj nazw: językiem odniesienia jest francuski (fr.js).
//  • miejsca {x} muszą zostać ZACHOWANE bez zmian: w trakcie działania wstawiane są w nie wartości.
//  • znaczniki HTML (<b>, <span class="mut11">, <br>) również trzeba zachować.
//  • `about` : treść okna „O programie”. {v} otrzymuje tam numer wersji.
// Test (test/i18n.test.js) sprawdza zgodność kluczy i miejsc przy każdym `npm test`.
(function () {
  const L = { nom: 'Polski', ui: {
    'app.sub': 'zarządzanie botami pm2 · tryb gry',
    'btn.about': 'ℹ️ O programie',
    'btn.lang': '🇬🇧 English',
    'btn.langTitle': 'Switch the panel to English',
    'banner.loading': 'Wczytywanie…',
    'bots.title': '🤖 Boty (pm2)',
    'bots.import': '➕ Importuj (plik)',
    'bots.importTitle': 'Wskaż główny plik bota (index.js, bot.py…)',
    'bots.importDir': '📁 Importuj (folder)',
    'bots.importDirTitle': 'Wskaż FOLDER bota — główny plik zostanie wykryty automatycznie',
    'bots.stopAll': '⏹ Zatrzymaj wszystkie',
    'bots.stopAllTitle': 'Zatrzymaj WSZYSTKIE działające boty (kliknij drugi raz, aby potwierdzić)',
    'bots.stopAllArm': '⏹ Potwierdzasz?',
    'bots.stopAllBusy': '⏳ Zatrzymywanie…',
    'bots.stopAllDone': '✅ Zatrzymano {n}',
    'bots.stopAllFail': '⚠️ Nie udało się',
    'bots.hint': '„Autostart”: bot wraca online przy logowaniu do Windows. „Stop w grze”: ten bot jest zatrzymywany, gdy włącza się tryb gry (jeśli wybrano „tylko zaznaczone boty”).',
    'bots.none': 'Żaden bot nie jest jeszcze zarządzany przez pm2. Dodaj bota przyciskiem „➕ Importuj” powyżej.',
    'bots.searching': '⏳ Szukam botów…',
    'bots.imported': '🧩 Zaimportowane boty',
    'bots.autoboot': 'Autostart',
    'bots.gamestop': 'Stop w grze',
    'bots.logs': '📄 Logi',
    'bots.folder': '📂',
    'bots.remove': '🗑',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Przywróć online',
    'bots.fixBanner': '<b>{n}</b> bot(y) powinny działać',
    'bots.fixDone': '✅ Zrestartowano {n}',
    'bots.fixPartial': '⚠️ Zrestartowano {n}, {k} nadal offline',
    'gm.title': '🎮 Tryb gry',
    'gm.enable': 'Zatrzymuj boty, gdy zostanie wykryta gra',
    'gm.all': 'Wszystkie boty',
    'gm.some': 'Tylko boty zaznaczone „Stop w grze”',
    'gm.grace': 'Uruchom boty {input} s po zamknięciu gry',
    'gm.soloskip': 'Ignoruj gry <b>single player</b> <span class="mut12">(zatrzymuj tylko, gdy gra jest naprawdę online)</span>',
    'gm.banner': '🎮 <b>Gra online:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 Wykryto <b>{game}</b> — rozgrywka <b>single player</b>: boty zostają online',
    'gm.bannerCut': ' — <b>zatrzymano {n} bot(y)</b> (automatyczny restart po zakończeniu gry)',
    'gm.bannerNone': ' — brak botów do zatrzymania',
    'gm.bannerOff': ' — tryb gry wyłączony',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;botów online — nie wykryto gry',
    'lownet.title': '🌐 Oszczędzanie internetu',
    'lownet.enable': 'Priorytet sieci dla gry online',
    'lownet.hint': 'Podczas rozgrywki online: duże pobierania botów (listy anty-scam, szyfrowane kopie zapasowe) są wstrzymywane, a ich priorytet obniżony — tym ostrzej, im wolniejsze jest twoje łącze. Po zakończeniu gry wszystko wraca do normy. Niezależne od trybu gry: przydatne dla botów, które zostawiasz włączone.',
    'lownet.active': ' · 🌐 oszczędzanie internetu aktywne',
    'lownet.broken': ' · ⚠️ oszczędzanie internetu: priorytety ustawione, ale sygnał nie dotarł do botów',
    'games.title': '🕹️ Wykrywane gry (procesy)',
    'games.ph': 'MojaGra.exe',
    'games.add': 'Dodaj',
    'games.pick': '📋 Otwarte programy',
    'games.pickTitle': 'Wybierz z otwartych okien (najpierw uruchom grę)',
    'games.exe': '📁 Wskaż plik .exe',
    'games.exeTitle': 'Przeszukaj dysk i wskaż plik .exe gry',
    'games.scan': '🔍 Skanuj',
    'games.scanTitle': 'Szuka zainstalowanych gier (Steam, Epic), których nie ma na liście',
    'games.hint': '„Otwarte programy” pokazuje to, co naprawdę działa na TWOIM PC (gra albo program nieznany domyślnej liście): uruchom grę i wybierz ją — to najdokładniejszy sposób. „Skanuj” przeszukuje biblioteki Steam/Epic (raz dziennie automatycznie, nigdy bez przerwy).',
    'set.title': '⚙️ Ustawienia',
    'set.autolaunch': 'Uruchamiaj panel przy starcie Windows',
    'set.poll': 'Sprawdzaj gry / boty co {input} sekund',
    'set.scanauto': 'Szukaj nowo zainstalowanych gier <b>raz dziennie</b>',
    'set.scanHint': 'Sprawdzanie powyżej tylko odczytuje listę procesów (bardzo tanie). Skanowanie dysku w poszukiwaniu gier <b>nigdy nie działa bez przerwy</b>: najwyżej raz dziennie albo przyciskiem „🔍 Skanuj”.',
    'set.saveInfoTitle': 'pm2 odtwarza tę listę przy starcie PC — jest zapisywana ponownie po każdym uruchomieniu/zatrzymaniu zrobionym tutaj.',
    'set.saved': 'Ostatni zapis pm2: {d}',
    'set.savedNever': 'Brak zapisu pm2 z tego panelu.',
    'alerts.title': '🔔 Alerty (bot pada)',
    'alerts.enable': 'Powiadom mnie, gdy bot <b>padnie</b> lub <b>restartuje się w kółko</b>',
    'alerts.toast': 'Powiadomienie Windows (przydatne tylko, gdy siedzę przy PC)',
    'alerts.sound': 'Cichy dźwięk razem z powiadomieniem',
    'alerts.volTitle': 'Głośność dźwięku',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (dotrze do ciebie nawet w grze)',
    'alerts.test': 'Testuj',
    'alerts.hint': '<b>Webhook Discord</b> jest najbardziej przydatny: dociera do ciebie w środku rozgrywki i z dala od PC. W Discordzie: <b>Ustawienia kanału → Integracje → Webhooki → Nowy webhook → Kopiuj URL</b>. Alert podaje <b>przyczynę po ludzku</b> (brak internetu, nieprawidłowy token, brakujący moduł…).',
    'alerts.suppressed': ' — ⚠️ {n} alert(y) odłożone w tej godzinie (limit antyspamowy).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': 'Pokazuj „🤖 Zarządza X botami online” na moim profilu Discord',
    'rpc.idPh': 'Zostaw puste — domyślnie używana jest aplikacja Hasu Panel',
    'rpc.hint': 'Nic nie trzeba ustawiać: działa od razu po włączeniu (wystarczy, że <b>Discord jest otwarty</b> na tym PC). Pole powyżej przyda się tylko wtedy, gdy chcesz pokazywać <b>własną</b> aplikację Discord — wklej wtedy jej <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — wyłączona.',
    'rpc.on': ' — ✅ włączona.',
    'rpc.needId': ' — ⚠️ wklej swoje Application ID, żeby ją włączyć.',
    'upd.title': '🔄 Aktualizacje',
    'upd.version': 'Wersja:',
    'upd.check': 'Sprawdź aktualizacje',
    'upd.apply': 'Restart i zastosuj',
    'upd.auto': 'Instaluj aktualizacje <b>automatycznie</b> <span class="mut11">(nigdy w trakcie gry ani działania na botach)</span>',
    'upd.searching': '⏳ Szukam aktualizacji…',
    'upd.dev': 'ℹ️ Auto-aktualizacja działa tylko w wersji zainstalowanej (Setup.exe), nie w trybie deweloperskim.',
    'upd.uptodate': '✅ Masz już najnowszą wersję ({v}).',
    'upd.availableMsg': '⬇️ Znaleziono nową wersję <b>{v}</b> — trwa pobieranie, za chwilę będzie gotowa.',
    'upd.readyMsg': '✅ <b>Aktualizacja gotowa</b> — kliknij „Restart i zastosuj”.',
    'upd.errorMsg': '⚠️ Nie mogę teraz sprawdzić{d}. Spróbuj później.',
    'upd.unexpected': '⚠️ Nieoczekiwana odpowiedź.',
    'upd.cardDownloading': 'Pobieranie aktualizacji…',
    'upd.cardReady': 'Aktualizacja gotowa do instalacji',
    'upd.cardAvailable': 'Dostępna nowa wersja',
    'upd.cardPreparing': 'przygotowywanie…',
    'upd.cardBroken': 'Aktualizacja przerwana',
    'upd.install': 'Zainstaluj i uruchom ponownie',
    'upd.later': 'Później',
    'upd.laterTitle': 'Ukryj tę kartę',
    'upd.retry': 'Spróbuj ponownie',
    'upd.restarting': 'Restartowanie…',
    'upd.whyManual': 'Automatyczna instalacja wyłączona — zastosuj ją, kiedy chcesz.',
    'upd.whyWaiting': 'Zainstaluje się sama, gdy tylko będzie to bezpieczne — czeka na: {list}.',
    'upd.whyWindow': 'Zainstaluje się sama, gdy tylko zamkniesz to okno.',
    'heal.title': '🔧 Automatyczny restart',
    'heal.enable': 'Automatycznie restartuj bota, który <b>padł</b> <span class="mut11">(po 5 min, potem 15 min, potem 1 h)</span>',
    'heal.hint': 'Gdy pm2 wyczerpie własne restarty, bot pozostaje martwy, dopóki tego nie zauważysz. Panel próbuje za ciebie, a potem <b>przestaje po 3 próbach</b>: bot, który trzy razy odmawia startu, ma prawdziwy problem, a alert musi zostać widoczny. Nigdy nie rusza bota, którego zatrzymałeś <b>ty</b>, ani bota zatrzymanego przez tryb gry.',
    'inc.title': '📓 Ostatnie incydenty',
    'inc.none': 'Nie odnotowano żadnego incydentu. To dobry znak.',
    'cfg.failTitle': 'Twoje ustawienia przestały się zapisywać',
    'cfg.failBody': 'Są trzymane w kopii zapasowej i nadal działają, ale głównego pliku nie da się zapisać.',
    'cfg.failWhy': 'Plik: {path} — sprawdź antywirusa, synchronizację folderu albo pełny dysk.',
    'logs.title': 'Logi: {name}',
    'logs.out': 'Wyjście',
    'logs.err': 'Błędy',
    'logs.filterPh': 'Filtruj…',
    'logs.copy': 'Kopiuj',
    'logs.openFolder': '📂 Folder logów',
    'logs.close': 'Zamknij',
    'logs.empty': 'Na razie brak logów.',
    'logs.unreadable': 'Plik logu istnieje, ale nie dało się go odczytać (zablokowany albo brak dostępu).',
    'logs.noMatch': 'Żaden wiersz nie zawiera „{q}”.',
    'logs.failed': 'Nie udało się odczytać logów.',
    'tc.pm2Missing': '<b>⚠️ pm2 nie jest zainstalowany.</b><br>pm2 to narzędzie, które utrzymuje twoje boty online. Kliknij, aby zainstalować je automatycznie (bez uprawnień administratora).',
    'tc.pm2Install': 'Zainstaluj pm2',
    'tc.pm2Busy': ' ⏳ instaluję pm2… (do 1 min)',
    'tc.pm2Ok': ' ✅ pm2 zainstalowany!',
    'tc.pm2NoNode': ' ❌ Najpierw wymagany jest Node.js.',
    'tc.pm2Fail': ' ❌ Nie udało się — spróbuj ponownie albo zainstaluj pm2 ręcznie.',
    'tc.pm2Down': 'pm2 nie odpowiada — nie da się odczytać stanu botów.',
    'tray.open': 'Otwórz panel',
    'tray.game': 'Tryb gry: {v}',
    'tray.on': 'włączony ✔',
    'tray.off': 'wyłączony',
    'tray.update': '🔄 Aktualizacja gotowa — zastosuj i uruchom ponownie',
    'tray.quit': 'Zakończ',
    'tray.tipBots': 'Hasu Panel — {on}/{total} botów online',
    'tray.online': ' (online)',
    'tray.solo': ' (single player)',
    'tray.cut': ' · zatrzymano {n} bot(y)',
    'tray.low': ' · 🌐 oszczędzanie sieci',
    'blk.game': 'gra jest uruchomiona',
    'blk.unknown': 'nie wiadomo, czy trwa gra',
    'blk.busy': 'trwa przełączanie trybu gry',
    'blk.action': 'trwa działanie na bocie',
    'blk.stopAll': 'trwa zatrzymywanie wszystkich',
    'blk.parked': 'boty zatrzymane przez tryb gry',
    'blk.lownet': 'oszczędzanie internetu aktywne',
    'blk.window': 'okno otwarte',
    'blk.grace': 'okres karencji',
    'upd.readyManual': '✅ <b>Aktualizacja gotowa</b> — kliknij „Restart i zastosuj” (automatyczna instalacja wyłączona).',
    'upd.readyWaiting': '✅ <b>Aktualizacja gotowa</b> — zainstaluje się sama, gdy tylko będzie to możliwe.<br><span style="opacity:.75">Czeka na: {list}.</span> Możesz też zastosować ją teraz.',
    'upd.readySoon': '✅ <b>Aktualizacja gotowa</b> — automatyczna instalacja lada chwila…',
    'set.lastScan': '(ostatni skan: {d})',
    'set.noScan': '(jeszcze bez skanu)',
    'set.devOnly': '(działa tylko w wersji .exe)',
    'bots.netTitle': 'Ruch sieciowy bota, mierzony przez jego wejście/wyjście (dla bota Discord to niemal wyłącznie sieć plus trochę dysku SQLite) — ↓ odebrane · ↑ wysłane',
    'bots.parked': '⏸ zatrzymany przez tryb gry',
    'bots.autobootTitle': 'Wraca online przy logowaniu do Windows',
    'bots.gamestopTitle': 'Zatrzymywany, gdy zostanie wykryta gra (tryb „zaznaczone boty”)',
    'bots.logsTitle': 'Zobacz ostatnie logi (crashe, błędy…)',
    'bots.folderTitle': 'Otwórz folder bota w Eksploratorze',
    'bots.removeTitle': 'Zatrzymaj tego bota i usuń go z pm2 (jego pliki zostają nietknięte)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — co to jest?</h2>
  <p>Panel sterowania dla <b>wszystkich twoich botów</b>: działają w tle dzięki <b>pm2</b>, a ty zarządzasz nimi tutaj, bez dotykania konsoli.</p>
  <h3>🤖 Lista botów</h3>
  <p>Jeden wiersz = jeden bot. <b style="color:#3ba55d">Zielona</b> kropka = działa, szara = zatrzymany, <b style="color:#ed4245">czerwona</b> = błąd. Przyciski: ▶ start · ⏹ stop · ⟳ restart · <b>📄 Logi</b>.</p>
  <p><b>📄 Logi</b> pokazuje <b>ostatnie linie bota</b> (błędy, crashe…) — przydatne, by zrozumieć, dlaczego padł, <b>bez otwierania terminala</b>.</p>
  <p><b>Autostart</b>: zaznaczony → bot sam wraca online, gdy włączasz PC. Odznaczony → przy starcie zostaje wyłączony.</p>
  <p><b>⏹ Zatrzymaj wszystkie</b> (nad listą) ubija <b>wszystkie działające boty</b> naraz. Zabezpieczenie: trzeba kliknąć <b>dwa razy</b>, żeby potwierdzić.</p>
  <p>Przy każdym zatrzymaniu panel sprząta: <b>małe programy uruchomione przez bota</b> (ffmpeg bota muzycznego, trwająca instalacja…), które kiedyś przeżywały i zaśmiecały PC, też są <b>porządnie zamykane</b>.</p>
  <p>Jeśli bot, który powinien działać, jest wyłączony, na górze listy pojawia się <b>pasek</b> z przyciskiem <b>„Przywróć online”</b>, który uruchamia je wszystkie naraz. Liczy tylko to, co <b>naprawdę wróciło</b>: jeśli bot odmawia startu (przeniesiony folder, brakujący plik), powie ci o tym, zamiast ogłaszać sukces.</p>
  <h3>🔔 Powiadomienie, gdy bot padnie</h3>
  <p>Po to właśnie jest ten panel: żeby nigdy więcej nie odkryć <b>trzy dni później</b>, że bot nie żyje. Gdy bot padnie albo restartuje się w kółko, dostajesz <b>dyskretne powiadomienie Windows</b> z <b>cichym dźwiękiem</b> (regulowana głośność), a alert podaje <b>przyczynę po ludzku</b> — brak internetu, nieprawidłowy token, brakujący moduł, zapchana pamięć…</p>
  <p>Najbardziej przydatny jest <b>webhook Discord</b>: dociera do ciebie w środku rozgrywki albo gdy nie ma cię przy PC. W Discordzie: <b>Ustawienia kanału → Integracje → Webhooki → Nowy webhook → Kopiuj URL</b>, potem wklej go w ⚙️ Ustawieniach.</p>
  <p>Panel odróżnia <b>awarię</b> od <b>świadomego zatrzymania</b>: jeśli sam wyłączysz bota — z panelu <i>albo</i> z terminala — nie dostaniesz alertu, bot nie zostanie zrestartowany ani przywrócony przy następnym starcie. Milczy też po wybudzeniu PC i zaraz po uruchomieniu, zanim wróci sieć, żebyś nie dostał serii fałszywych alertów.</p>
  <p>Jeśli wysyłka się nie uda — zwykle dlatego, że awarią <i>jest</i> właśnie brak internetu — alert jest <b>ponawiany</b>, a nie gubiony. A jeśli sam pm2 przestanie odpowiadać, panel cię ostrzeże: bez tego żaden alert nie byłby możliwy, a cisza wyglądałaby jak „wszystko gra”.</p>
  <h3>➕ Import bota</h3>
  <p>Masz bota, którego zwykle odpalasz ręcznie (na przykład z <b>Visual Studio</b> przez <code>node index.js</code>)? Kliknij „Importuj” (<b>plik</b> albo <b>cały folder</b> — wtedy główny plik zostanie wykryty za ciebie), nadaj mu nazwę i tyle:</p>
  <p>• działa <b>w tle</b>, nawet przy zamkniętym Visual Studio;<br>• <b>sam się restartuje</b>, gdy padnie;<br>• <b>przeżywa restarty PC</b>;<br>• zarządzasz nim tutaj <b>jak resztą</b> (Autostart, tryb gry…).</p>
  <p>Przycisk 🗑 zatrzymuje bota i usuwa go z pm2 — <b>jego pliki nigdy nie są ruszane</b>.</p>
  <h3>🎮 Tryb gry</h3>
  <p>Gdy wykryta zostanie gra z listy (Fortnite, Valorant…), panel <b>zatrzymuje wybrane boty</b>, żeby uwolnić PC na czas grania, a potem <b>uruchamia je automatycznie</b> mniej więcej minutę po zamknięciu gry. Ty decydujesz: zatrzymać <b>wszystkie</b> boty czy tylko te zaznaczone „Stop w grze”.</p>
  <p><b>Single player?</b> Panel sprawdza, czy gra jest <b>naprawdę połączona z internetem</b>: rozgrywka offline nie zatrzymuje niczego (opcja „Ignoruj gry single player”). Na przykład: GTA V w trybie fabularnym → boty zostają; GTA Online → tryb gry się włącza.</p>
  <h3>🕹️ Dodanie gry do wykrywania</h3>
  <p>Trzy sposoby: <b>📋 Otwarte programy</b> (uruchom grę i wybierz ją z listy — najdokładniej, działa też dla dowolnego programu), <b>📁 Wskaż plik .exe</b> (przeszukaj dysk) albo <b>🔍 Skanuj</b> (przeszukuje biblioteki Steam/Epic i proponuje zainstalowane gry, których nie ma na liście).</p>
  <p>Skanowanie dysku <b>nigdy nie działa bez przerwy</b>: automatycznie najwyżej <b>raz dziennie</b> (można wyłączyć w ⚙️ Ustawieniach) albo gdy klikniesz „Skanuj”. Stały nadzór tylko odczytuje listę procesów — praktycznie za darmo.</p>
  <h3>🌐 Oszczędzanie internetu</h3>
  <p>Włączone, daje <b>priorytet sieci dla gry online</b>: podczas rozgrywki boty odkładają swoje <b>duże pobierania</b> (listy anty-scam, szyfrowane kopie zapasowe) i schodzą na <b>niski priorytet</b> — tym ostrzej, im wolniejsze jest twoje łącze (mierzone automatycznie). Po zakończeniu gry wszystko wraca do normy. Niezależne od trybu gry: idealne, żeby trzymać bota online <i>bez</i> lagów.</p>
  <h3>🔄 Automatyczne aktualizacje</h3>
  <p>Panel <b>aktualizuje się sam</b>: sprawdza przy starcie, a potem co 6 h, i wszystko dzieje się <b>w oknie</b>. Gdy tylko znajdzie wersję, na górze pojawia się karta: <b>pasek postępu</b> z procentami, prędkością i rozmiarem, potem <b>lista nowości</b> i przycisk <b>„Zainstaluj i uruchom ponownie”</b>. „Później” ukrywa kartę — sama instalacja idzie dalej.</p>
  <p>Zasadniczo <b>nie musisz nic klikać</b>: aktualizacja instaluje się sama, gdy tylko jest to bezpieczne. <b>Nigdy</b> nie robi tego w trakcie gry, w trakcie działania na botach ani gdy patrzysz na okno — karta mówi ci dokładnie, <b>na co czeka</b>. Zamknij okno, a się zastosuje. (Można wyłączyć w ⚙️ Ustawieniach, a przyciskiem „Sprawdź aktualizacje” wymusić sprawdzenie.)</p>
  <h3>🔋 Oszczędny dla zasobów</h3>
  <p>Panel działa całą dobę, nie wchodząc w drogę: gdy jest <b>schowany w obszarze powiadomień</b>, <b>zwalnia swój nadzór</b> i przestaje liczyć to, na co nikt nie patrzy. Otwórz okno z powrotem, a wszystko znów jest natychmiastowe. (Jeśli działa tryb gry albo oszczędzanie internetu, panel zostaje czujny, żeby niczego nie przegapić.)</p>
  <h3>🎮 Twoja obecność na Discordzie</h3>
  <p>Opcja „Rich Presence” sprawia, że twój profil Discord pokazuje <b>„🤖 Zarządza X botami online”</b> (oraz bieżącą grę). <b>Nic nie trzeba ustawiać</b> — wystarczy, że Discord jest otwarty. Czysto ozdobne, można wyłączyć w ⚙️ Ustawieniach.</p>
  <h3>🧰 Na świeżym PC (u kolegi)</h3>
  <p>Boty potrzebują <b>Node.js</b> i <b>pm2</b>. Jeśli któregoś brakuje, panel to <b>wykrywa</b> i podsuwa właściwy przycisk („Pobierz Node.js” albo „Zainstaluj pm2”) zamiast pokazywać pustą listę.</p>
  <h3>📁 Warto wiedzieć</h3>
  <p>• Krzyżyk okna <b>chowa je do obszaru powiadomień</b> (obok zegara). Aby zakończyć: prawy przycisk na ikonie → Zakończ.<br>• Ustawienia są zapisywane w <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, dziennik w <code>panel.log</code>.<br>• Obok trzymana jest na bieżąco <b>kopia zapasowa</b> ustawień (<code>.bak</code>), automatycznie przejmowana, gdy główny plik stanie się nieczytelny albo przestanie być zapisywany. Jeśli zapis przestanie działać, powie ci o tym <b>czerwony pasek</b> — zamiast pozwalać ci wierzyć, że ustawienia są bezpieczne.<br>• Panel uruchamia się razem z Windows (można wyłączyć w ⚙️ Ustawieniach).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['pl'] = L; }
})();
