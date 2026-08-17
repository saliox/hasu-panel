// Türkçe — Hasu Panel arayüzünün çevirisi.
//
// BİÇİM (bütün dillerde birebir aynı olmalı):
//  • `ui` : her anahtar için bir giriş. Anahtarlar bütün dillerde AYNIDIR — burada asla yeni anahtar
//    eklenmez, silinmez, yeniden adlandırılmaz: referans Fransızcadır (fr.js).
//  • {x} yer tutucuları OLDUĞU GİBİ korunmalıdır: çalışma anında değer alırlar.
//  • HTML etiketleri de (<b>, <span class="mut11">, <br>) aynen korunmalıdır.
//  • `about` : « Hakkında » penceresinin gövdesi. Oradaki {v} sürüm numarasını alır.
// Bir test (test/i18n.test.js) her `npm test` çalıştırmasında anahtar ve yer tutucu eşliğini denetler.
(function () {
  const L = { nom: 'Türkçe', ui: {
    'app.sub': 'pm2 bot yöneticisi · oyun modu',
    'btn.about': 'ℹ️ Hakkında',
    'btn.langTitle': 'Arayüz dili',
    'banner.loading': 'Yükleniyor…',
    'bots.title': '🤖 Botlar (pm2)',
    'bots.import': '➕ İçe aktar (dosya)',
    'bots.importTitle': 'Botun ana dosyasını seç (index.js, bot.py…)',
    'bots.importDir': '📁 İçe aktar (klasör)',
    'bots.importDirTitle': 'Botun KLASÖRÜNÜ seç — ana dosya otomatik bulunur',
    'bots.stopAll': '⏹ Tümünü durdur',
    'bots.stopAllTitle': 'Çevrimiçi olan TÜM botları durdur (onaylamak için ikinci kez tıkla)',
    'bots.stopAllArm': '⏹ Emin misin?',
    'bots.stopAllBusy': '⏳ Durduruluyor…',
    'bots.stopAllDone': '✅ {n} bot durduruldu',
    'bots.stopAllFail': '⚠️ Başarısız',
    'bots.hint': '"Otomatik başlat": Windows oturumunu açtığında bot yeniden çevrimiçi olur. "Oyunda durdur": oyun modu devreye girdiğinde bu bot durdurulur ("yalnızca işaretli botlar" seçiliyse).',
    'bots.none': 'Henüz pm2 ile yönetilen bot yok. Yukarıdaki "➕ İçe aktar" ile bir tane ekle.',
    'bots.searching': '⏳ Botlar aranıyor…',
    'bots.imported': '🧩 İçe aktarılan botlar',
    'bots.autoboot': 'Otomatik başlat',
    'bots.gamestop': 'Oyunda durdur',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Yeniden çevrimiçi yap',
    'bots.fixBanner': '<b>{n}</b> bot çevrimiçi olmalı',
    'bots.fixDone': '✅ {n} bot yeniden başlatıldı',
    'bots.fixPartial': '⚠️ {n} yeniden başlatıldı, {k} hâlâ çevrimdışı',
    'gm.title': '🎮 Oyun modu',
    'gm.enable': 'Bir oyun algılandığında botları durdur',
    'gm.all': 'Bütün botlar',
    'gm.some': 'Yalnızca "Oyunda durdur" işaretli botlar',
    'gm.grace': 'Oyun kapandıktan {input} sn sonra botları yeniden başlat',
    'gm.soloskip': '<b>Tek kişilik</b> oyunları yok say <span class="mut12">(yalnızca oyun gerçekten çevrimiçiyse durdur)</span>',
    'gm.banner': '🎮 <b>Çevrimiçi oyun:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> algılandı — <b>tek kişilik</b> oturum: botlar çevrimiçi kalıyor',
    'gm.bannerCut': ' — <b>{n} bot durduruldu</b> (oyun bitince otomatik başlarlar)',
    'gm.bannerNone': ' — durdurulacak bot yok',
    'gm.bannerOff': ' — oyun modu kapalı',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bot çevrimiçi — oyun algılanmadı',
    'lownet.title': '🌐 Düşük internet kullanımı',
    'lownet.enable': 'Ağ önceliğini çevrimiçi oyuna ver',
    'lownet.hint': 'Çevrimiçi maç sırasında: botların büyük indirmeleri (dolandırıcılık listeleri, şifreli yedekler) duraklatılır ve öncelikleri düşürülür — bağlantın yavaşsa daha da katı olur. Maç bitince her şey normale döner. Oyun modundan bağımsızdır: açık bıraktığın botlar için işine yarar.',
    'lownet.active': ' · 🌐 düşük internet kullanımı etkin',
    'lownet.broken': ' · ⚠️ düşük internet kullanımı: öncelikler uygulandı ama sinyal botlara ulaşmadı',
    'games.title': '🕹️ Algılanan oyunlar (işlemler)',
    'games.ph': 'Oyunum.exe',
    'games.add': 'Ekle',
    'games.pick': '📋 Açık programlar',
    'games.pickTitle': 'Açık pencerelerden seç (önce oyunu başlat)',
    'games.exe': '📁 Bir .exe seç',
    'games.exeTitle': 'Oyunun .exe dosyasını diskte ara',
    'games.scan': '🔍 Tara',
    'games.scanTitle': 'Listede olmayan kurulu oyunları ara (Steam, Epic)',
    'games.hint': '"Açık programlar" SENİN bilgisayarında gerçekten çalışanları listeler (bir oyun ya da varsayılan listenin tanımadığı bir yazılım): oyunu başlat, sonra onu seç — en isabetli yol budur. "Tara" ise Steam/Epic kütüphanelerini arar (günde 1 kez, asla sürekli değil).',
    'set.title': '⚙️ Ayarlar',
    'set.autolaunch': 'Windows açılırken paneli başlat',
    'set.poll': 'Oyunları / botları her {input} saniyede bir denetle',
    'set.scanauto': 'Yeni kurulan oyunları <b>günde 1 kez</b> ara',
    'set.scanHint': 'Yukarıdaki denetim yalnızca işlem listesini okur (çok hafif). Oyunlar için disk taraması ise <b>asla sürekli çalışmaz</b>: en fazla günde 1 kez ya da "🔍 Tara" düğmesiyle.',
    'set.saveInfoTitle': 'pm2 bu listeyi bilgisayar açılınca geri yükler — burada yapılan her başlatma/durdurmadan sonra yeniden kaydedilir.',
    'set.saved': 'Son pm2 kaydı: {d}',
    'set.savedNever': 'Bu panelden henüz pm2 kaydı yapılmadı.',
    'alerts.title': '🔔 Uyarılar (düşen bot)',
    'alerts.enable': 'Bir bot <b>düştüğünde</b> veya <b>döngüde yeniden başladığında</b> bana haber ver',
    'alerts.toast': 'Windows bildirimi (yalnızca bilgisayar başındaysam işe yarar)',
    'alerts.sound': 'Bildirimle birlikte hafif bir ses',
    'alerts.volTitle': 'Ses seviyesi',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (oyundayken bile sana ulaşır)',
    'alerts.test': 'Test et',
    'alerts.hint': 'En işe yarayanı <b>Discord webhook</b>: maçın ortasında ya da bilgisayar başında değilken bile sana ulaşır. Discord\'da: <b>Kanal ayarları → Entegrasyonlar → Webhook\'lar → Yeni webhook → URL\'yi kopyala</b>. Uyarı <b>nedeni açık dille</b> yazar (internet kesik, geçersiz token, eksik modül…).',
    'alerts.suppressed': ' — ⚠️ bu saat içinde {n} uyarı ertelendi (spam önleme sınırı).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': 'Discord profilimde "🤖 Çevrimiçi X bot yönetiyor" yazsın',
    'rpc.idPh': 'Boş bırak — varsayılan olarak Hasu Panel uygulaması kullanılır',
    'rpc.hint': 'Ayarlanacak bir şey yok: açtığın anda çalışır (yeter ki bu bilgisayarda <b>Discord açık olsun</b>). Yukarıdaki alan yalnızca <b>kendi</b> Discord uygulamanı göstermek istersen gerekir — o zaman uygulamanın <b>Application ID</b> değerini yapıştır (discord.com/developers/applications → General Information).',
    'rpc.off': ' — kapalı.',
    'rpc.on': ' — ✅ açık.',
    'rpc.needId': ' — ⚠️ açmak için Application ID değerini yapıştır.',
    'upd.title': '🔄 Güncellemeler',
    'upd.version': 'Sürüm:',
    'upd.check': 'Güncellemeleri denetle',
    'upd.auto': 'Güncellemeler <b>kendi kendine</b> kurulsun <span class="mut11">(asla oyun sırasında ya da botlarla uğraşırken değil)</span>',
    'upd.searching': '⏳ Güncelleme aranıyor…',
    'upd.dev': 'ℹ️ Otomatik güncelleme yalnızca kurulu sürümde (Setup.exe) çalışır, geliştirme ortamında değil.',
    'upd.uptodate': '✅ Zaten en son sürümdesin ({v}).',
    'upd.availableMsg': '⬇️ Yeni sürüm <b>{v}</b> bulundu — indiriliyor, birazdan hazır olacak.',
    'upd.readyMsg': '✅ <b>Güncelleme hazır</b> — "Yeniden başlat & uygula" düğmesine tıkla.',
    'upd.errorMsg': '⚠️ Şu anda denetlenemiyor{d}. Daha sonra tekrar dene.',
    'upd.unexpected': '⚠️ Beklenmedik yanıt.',
    'upd.cardDownloading': 'Güncelleme indiriliyor…',
    'upd.cardReady': 'Güncelleme kurulmaya hazır',
    'upd.cardAvailable': 'Yeni sürüm mevcut',
    'upd.cardPreparing': 'hazırlanıyor…',
    'upd.cardBroken': 'Güncelleme yarıda kesildi',
    'upd.install': 'Kur ve yeniden başlat',
    'upd.later': 'Daha sonra',
    'upd.laterTitle': 'Bu kartı gizle',
    'upd.retry': 'Tekrar dene',
    'upd.restarting': 'Yeniden başlatılıyor…',
    'upd.whyManual': 'Otomatik kurulum kapalı — istediğin zaman uygula.',
    'upd.whyWaiting': 'Mümkün olur olmaz kendi kendine kurulacak — beklenen: {list}.',
    'upd.whyWindow': 'Bu pencereyi kapattığın anda kendi kendine kurulacak.',
    'heal.title': '🔧 Otomatik yeniden başlatma',
    'heal.enable': '<b>Düşen</b> bot kendi kendine yeniden başlatılsın <span class="mut11">(5 dk, 15 dk ve 1 sa sonra)</span>',
    'heal.hint': 'pm2 kendi yeniden başlatma haklarını tükettiğinde, sen fark edene kadar bot ölü kalır. Panel senin yerine dener, ama <b>3 denemeden sonra durur</b>: üç kez geri gelmeyi reddeden botun gerçek bir sorunu vardır ve uyarı görünür kalmalıdır. <b>Senin</b> durdurduğun bir bota da, oyun modunun durdurduğu bir bota da asla dokunmaz.',
    'inc.title': '📓 Son olaylar',
    'inc.none': 'Kayıtlı olay yok. Bu iyiye işaret.',
    'cfg.failTitle': 'Ayarların artık kaydedilmiyor',
    'cfg.failBody': 'Bir yedek kopyada tutuluyorlar ve etkin kalıyorlar, ama ana dosya yazılmayı reddediyor.',
    'cfg.failWhy': 'Dosya: {path} — antivirüse, bir klasör eşitlemesine ya da dolu diske bak.',
    'logs.title': '{name} logları',
    'logs.out': 'Çıktı',
    'logs.err': 'Hatalar',
    'logs.filterPh': 'Filtrele…',
    'logs.copy': 'Kopyala',
    'logs.openFolder': '📂 Log klasörü',
    'logs.close': 'Kapat',
    'logs.empty': 'Henüz log yok.',
    'logs.unreadable': 'Log dosyası var ama okunamadı (kilitli ya da erişim reddedildi).',
    'logs.noMatch': 'Hiçbir satırda "{q}" geçmiyor.',
    'logs.failed': 'Loglar okunamadı.',
    'tc.pm2Missing': '<b>⚠️ pm2 kurulu değil.</b><br>pm2, botlarını çalışır tutan araçtır. Otomatik kurmak için tıkla (yönetici hakkı gerekmez).',
    'tc.pm2Install': 'pm2 kur',
    'tc.pm2Busy': ' ⏳ pm2 kuruluyor… (1 dakikaya kadar)',
    'tc.pm2Ok': ' ✅ pm2 kuruldu!',
    'tc.pm2NoNode': ' ❌ Önce Node.js gerekli.',
    'tc.pm2Fail': ' ❌ Başarısız — tekrar dene ya da pm2\'yi elle kur.',
    'tc.pm2Down': 'pm2 yanıt vermiyor — botların durumu okunamıyor.',
    'tray.open': 'Paneli aç',
    'tray.game': 'Oyun modu: {v}',
    'tray.on': 'açık ✔',
    'tray.off': 'kapalı',
    'tray.update': '🔄 Güncelleme hazır — uygula & yeniden başlat',
    'tray.quit': 'Çık',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bot çevrimiçi',
    'tray.online': ' (çevrimiçi)',
    'tray.solo': ' (tek kişilik)',
    'tray.cut': ' · {n} bot durduruldu',
    'tray.low': ' · 🌐 ağ tasarrufu',
    'blk.game': 'bir oyun çalışıyor',
    'blk.unknown': 'oyun çalışıyor mu belirsiz',
    'blk.busy': 'oyun modu geçişi sürüyor',
    'blk.action': 'bir bot işlemi sürüyor',
    'blk.stopAll': 'toplu durdurma sürüyor',
    'blk.parked': 'oyun modunun durdurduğu botlar',
    'blk.lownet': 'düşük internet kullanımı etkin',
    'blk.window': 'pencere açık',
    'blk.grace': 'bekleme süresi',
    'set.lastScan': '(son tarama: {d})',
    'set.noScan': '(henüz tarama yok)',
    'set.devOnly': '(yalnızca .exe sürümünde etkin)',
    'bots.netTitle': 'Botun ağ trafiği, giriş/çıkışlarından ölçülür (bir Discord botunda neredeyse tamamı ağ, biraz da SQLite diski) — ↓ alınan · ↑ gönderilen',
    'bots.parked': '⏸ oyun modu durdurdu',
    'bots.autobootTitle': 'Windows oturumunu açtığında yeniden çevrimiçi olur',
    'bots.gamestopTitle': 'Bir oyun algılandığında durdurulur ("işaretli botlar" modu)',
    'bots.logsTitle': 'Son logları gör (çökme, hatalar…)',
    'bots.folderTitle': 'Botun klasörünü Dosya Gezgini\'nde aç',
    'bots.removeTitle': 'Bu botu durdur ve pm2\'den kaldır (dosyalarına dokunulmaz)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — bu da ne?</h2>
  <p><b>Bütün botların</b> için bir kontrol paneli: <b>pm2</b> sayesinde arka planda çalışırlar, sen de konsola hiç dokunmadan buradan yönetirsin.</p>
  <h3>🤖 Bot listesi</h3>
  <p>Her satır bir bot. <b style="color:#3ba55d">Yeşil</b> nokta çalışıyor, gri durduruldu, <b style="color:#ed4245">kırmızı</b> hata verdi demektir. Düğmeler: ▶ başlat · ⏹ durdur · ⟳ yeniden başlat · <b>📄 Loglar</b>.</p>
  <p><b>📄 Loglar</b> botun <b>son satırlarını</b> gösterir (hatalar, çökmeler…) — neden düştüğünü <b>terminal açmadan</b> anlamak için birebir.</p>
  <p><b>Otomatik başlat</b>: işaretliyse → bilgisayarı açtığında bot kendiliğinden yeniden çevrimiçi olur. İşaretli değilse → açılışta kapalı kalır.</p>
  <p><b>⏹ Tümünü durdur</b> (listenin üstünde) <b>çevrimiçi olan bütün botları</b> tek seferde durdurur. Güvenlik için onaylamak üzere <b>iki kez</b> tıklaman gerekir.</p>
  <p>Panel her durdurmada ortalığı toplar: bir botun <b>başlattığı küçük programlar</b> (müzik botunun ffmpeg'i, süren bir kurulum…) eskiden hayatta kalıp bilgisayarı tıkardı, artık onlar da <b>düzgünce kapatılıyor</b>.</p>
  <p>Çalışıyor olması gereken bir bot kapalıysa, listenin başında bir <b>şerit</b> belirir ve <b>"Yeniden çevrimiçi yap"</b> düğmesi hepsini tek seferde başlatır. Yalnızca <b>gerçekten geri gelenleri</b> sayar: bir bot başlamayı reddediyorsa (klasör taşınmış, dosya eksik), başarı ilan etmek yerine bunu sana söyler.</p>
  <h3>🔔 Bir bot düştüğünde haberin olsun</h3>
  <p>Panelin varlık sebebi bu: bir botun öldüğünü artık <b>üç gün sonra</b> keşfetmeyeceksin. Bir bot düştüğünde ya da döngüde yeniden başladığında, <b>hafif bir sesle</b> (sesi ayarlanabilir) <b>göze batmayan bir Windows bildirimi</b> alırsın ve uyarı <b>nedeni açık dille</b> yazar — internet kesik, geçersiz token, eksik modül, bellek dolmuş…</p>
  <p>En işe yarayanı yine <b>Discord webhook</b>: maçın ortasında ya da bilgisayar başında değilken bile sana ulaşır. Discord'da: <b>Kanal ayarları → Entegrasyonlar → Webhook'lar → Yeni webhook → URL'yi kopyala</b>, sonra ⚙️ Ayarlar'a yapıştır.</p>
  <p>Panel bir <b>arıza</b> ile <b>bilerek durdurmayı</b> birbirinden ayırır: bir botu kendin durdurduysan — panelden <i>ya da</i> bir terminalden — seni uyarmaz, botu yeniden başlatmaz ve sonraki açılışta geri getirmez. Bilgisayar uykudan uyanırken ve açılıştan hemen sonra da, ağ geri gelene kadar susar; böylece bir yığın boş uyarı yemezsin.</p>
  <p>Gönderim başarısız olursa — çoğu zaman arıza zaten internetin kesilmesidir — uyarı kaybolmak yerine <b>yeniden denenir</b>. pm2'nin kendisi yanıt vermez olursa da panel sana haber verir: yoksa hiçbir uyarı mümkün olmaz ve bu sessizlik "her şey yolunda" gibi görünürdü.</p>
  <h3>➕ Bir botu içe aktarmak</h3>
  <p>Genelde elle başlattığın bir botun mu var (mesela <b>Visual Studio</b>'dan <code>node index.js</code> ile)? "İçe aktar"a tıkla (<b>dosya</b> ya da <b>klasörün tamamı</b> — bu durumda ana dosya senin yerine bulunur), bir ad ver, hepsi bu:</p>
  <p>• Visual Studio kapalıyken bile <b>arka planda</b> çalışır;<br>• çökerse <b>kendi kendine yeniden başlar</b>;<br>• <b>bilgisayar yeniden başlasa da ayakta kalır</b>;<br>• burada <b>diğerleri gibi</b> yönetilir (otomatik başlat, oyun modu…).</p>
  <p>🗑 düğmesi botu durdurur ve pm2'den kaldırır — <b>dosyalarına asla dokunulmaz</b>.</p>
  <h3>🎮 Oyun modu</h3>
  <p>Listedeki bir oyun algılandığında (Fortnite, Valorant…) panel, sen oynarken bilgisayarı rahatlatmak için <b>seçtiğin botları durdurur</b>, oyun kapandıktan yaklaşık bir dakika sonra da onları <b>otomatik olarak yeniden başlatır</b>. Kararı sen verirsin: <b>bütün</b> botları durdur ya da yalnızca "Oyunda durdur" işaretli olanları.</p>
  <p><b>Tek kişilik mi?</b> Panel oyunun <b>gerçekten internete bağlı</b> olup olmadığına bakar: çevrimdışı bir oturum hiçbir şeyi durdurmaz ("Tek kişilik oyunları yok say" seçeneği). Örneğin: GTA V hikâye modu → botlar açık kalır; GTA Online → oyun modu devreye girer.</p>
  <h3>🕹️ Algılamaya oyun eklemek</h3>
  <p>Üç yol: <b>📋 Açık programlar</b> (oyunu başlat ve listeden seç — en isabetlisi, üstelik her yazılım için çalışır), <b>📁 Bir .exe seç</b> (diski gez) ya da <b>🔍 Tara</b> (Steam/Epic kütüphanelerini arar ve listede olmayan kurulu oyunları önerir).</p>
  <p>Disk taraması <b>asla sürekli çalışmaz</b>: otomatik olarak en fazla <b>günde 1 kez</b> (⚙️ Ayarlar'dan kapatılabilir) ya da "Tara"ya tıkladığında. Sürekli gözcülük ise yalnızca işlem listesini okur — neredeyse bedava.</p>
  <h3>🌐 Düşük internet kullanımı</h3>
  <p>Açıkken bu mod <b>ağ önceliğini çevrimiçi oyuna</b> verir: maç boyunca botlar <b>büyük indirmelerini</b> (dolandırıcılık listeleri, şifreli yedekler) erteler ve <b>düşük önceliğe</b> geçer — bağlantın yavaşsa (otomatik ölçülür) daha da katı olur. Maç bitince her şey normale döner. Oyun modundan bağımsızdır: bir botu <i>lag yaptırmadan</i> çevrimiçi tutmak için biçilmiş kaftan.</p>
  <h3>🔄 Otomatik güncellemeler</h3>
  <p>Panel <b>kendi kendini günceller</b>: açılışta, sonra da her 6 saatte bir bakar ve her şey <b>pencerenin içinde</b> olup biter. Bir sürüm bulunur bulunmaz üstte bir kart belirir: yüzde, hız ve boyutla birlikte <b>ilerleme çubuğu</b>, ardından <b>sürüm notları</b> ve bir <b>"Kur ve yeniden başlat"</b> düğmesi. "Daha sonra" kartı gizler — kurulum yoluna devam eder.</p>
  <p>Aslında <b>hiçbir şeye tıklaman gerekmez</b>: güncelleme, riskli olmadığı anda kendi kendine kurulur. Bunu <b>asla</b> oyun sırasında, botlarla uğraşırken ya da sen pencereye bakarken yapmaz — kart zaten <b>neyi beklediğini</b> sana söyler. Pencereyi kapat, uygulanır. (⚙️ Ayarlar'dan kapatılabilir; "Güncellemeleri denetle" düğmesiyle de zorla denetim yaptırabilirsin.)</p>
  <h3>🔋 Kaynak dostu</h3>
  <p>Panel gün boyu kendini belli etmeden çalışır: <b>bildirim alanına küçültüldüğünde</b> <b>gözcülüğünü yavaşlatır</b> ve kimsenin bakmadığı görüntüyü hesaplamayı bırakır. Pencereyi yeniden açtığın anda her şey yine anında olur. (Oyun modu ya da düşük internet kullanımı etkinse hiçbir şeyi kaçırmamak için tepkisel kalır.)</p>
  <h3>🎮 Discord'daki görünürlüğün</h3>
  <p>"Rich Presence" seçeneği Discord profilinde <b>"🤖 Çevrimiçi X bot yönetiyor"</b> yazdırır (bir de oynadığın oyunu). <b>Ayarlanacak bir şey yok</b> — Discord'un açık olması yeter. Tamamen süs; ⚙️ Ayarlar'dan kapatılabilir.</p>
  <h3>🧰 Sıfır bir bilgisayarda (bir arkadaşta)</h3>
  <p>Botların <b>Node.js</b> ve <b>pm2</b>'ye ihtiyacı var. İkisinden biri eksikse panel bunu <b>fark eder</b> ve boş liste göstermek yerine doğru düğmeyi önerir ("Node.js indir" ya da "pm2 kur").</p>
  <h3>📁 Bilmekte fayda var</h3>
  <p>• Pencerenin kapatma çarpısı onu <b>bildirim alanına küçültür</b> (saatin yanına). Çıkmak için: simgeye sağ tıkla → Çık.<br>• Ayarlar <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code> içinde, günlük ise <code>panel.log</code> içinde tutulur.<br>• Ayarların bir <b>yedek kopyası</b> yanında güncel tutulur (<code>.bak</code>) ve ana dosya okunamaz hale gelir ya da yazılmayı bırakırsa otomatik olarak devreye girer. Kayıt artık çalışmıyorsa <b>kırmızı bir şerit</b> bunu sana söyler — ayarlarının güvende olduğunu sanmana izin vermek yerine.<br>• Panel Windows ile birlikte başlar (⚙️ Ayarlar'dan kapatılabilir).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['tr'] = L; }
})();
