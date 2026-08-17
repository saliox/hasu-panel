// 日本語 — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: '日本語', ui: {
    'app.sub': 'pm2 のボット管理 · ゲームモード',
    'btn.about': 'ℹ️ ヘルプ',
    'btn.langTitle': '表示言語',
    'banner.loading': '読み込み中…',
    'bots.title': '🤖 ボット (pm2)',
    'bots.import': '➕ 取り込み（ファイル）',
    'bots.importTitle': 'ボットのメインファイルを選ぶ（index.js、bot.py…）',
    'bots.importDir': '📁 取り込み（フォルダ）',
    'bots.importDirTitle': 'ボットの「フォルダ」を選ぶ — メインファイルは自動で見つかる',
    'bots.stopAll': '⏹ 全部止める',
    'bots.stopAllTitle': '稼働中のボットを「全部」止める（もう一度クリックで確定）',
    'bots.stopAllArm': '⏹ 確定する？',
    'bots.stopAllBusy': '⏳ 停止中…',
    'bots.stopAllDone': '✅ {n} 件停止',
    'bots.stopAllFail': '⚠️ 失敗',
    'bots.hint': '「自動起動」：Windows にログインすると、このボットが（再び）稼働する。「ゲーム中は停止」：ゲームモードが働いたとき、このボットは止まる（「チェックしたボットだけ」を選んでいる場合）。',
    'bots.none': 'pm2 が管理しているボットはまだない。上の「➕ 取り込み」で追加してみて。',
    'bots.searching': '⏳ ボットを探している…',
    'bots.imported': '🧩 取り込んだボット',
    'bots.autoboot': '自動起動',
    'bots.gamestop': 'ゲーム中は停止',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'まとめて復旧',
    'bots.fixBanner': '<b>{n}</b> 件のボットが稼働しているはず',
    'bots.fixDone': '✅ {n} 件を再起動',
    'bots.fixPartial': '⚠️ {n} 件を再起動、{k} 件はまだ停止中',
    'gm.title': '🎮 ゲームモード',
    'gm.enable': 'ゲームを検出したらボットを止める',
    'gm.all': 'すべてのボット',
    'gm.some': '「ゲーム中は停止」にチェックしたボットだけ',
    'gm.grace': 'ゲームを閉じてから {input} 秒後にボットを再起動する',
    'gm.soloskip': '<b>ソロ</b>のゲームは無視する <span class="mut12">（本当にオンラインのときだけ止める）</span>',
    'gm.banner': '🎮 <b>オンラインのゲーム：</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> を検出 — <b>ソロ</b>プレイ：ボットは稼働したまま',
    'gm.bannerCut': ' — <b>{n} 件のボットを停止</b>（プレイが終われば自動で再起動）',
    'gm.bannerNone': ' — 止めるボットはなし',
    'gm.bannerOff': ' — ゲームモードはオフ',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;ボット稼働中 — ゲームは検出なし',
    'lownet.title': '🌐 通信ひかえめ',
    'lownet.enable': 'オンラインのゲームの通信を優先する',
    'lownet.hint': 'オンラインでプレイしている間：ボットの大きなダウンロード（詐欺対策リスト、暗号化バックアップ）を一時停止し、優先度を下げる — 回線が遅いほど自動で厳しくなる。プレイが終われば元どおり。ゲームモードとは別物：動かしっぱなしのボットに便利。',
    'lownet.active': ' · 🌐 通信ひかえめ 作動中',
    'lownet.broken': ' · ⚠️ 通信ひかえめ：優先度は下げたが、ボットへの合図が届かなかった',
    'games.title': '🕹️ 検出するゲーム（プロセス）',
    'games.ph': 'MyGame.exe',
    'games.add': '追加',
    'games.pick': '📋 起動中のプログラム',
    'games.pickTitle': '開いているウィンドウから選ぶ（先にゲームを起動する）',
    'games.exe': '📁 .exe を選ぶ',
    'games.exeTitle': 'ディスクを見てゲームの .exe を選ぶ',
    'games.scan': '🔍 スキャン',
    'games.scanTitle': 'リストにないインストール済みのゲーム（Steam、Epic）を探す',
    'games.hint': '「起動中のプログラム」は、いま自分の PC で動いているもの（ゲーム、または初期リストにないソフト）を並べる：先にゲームを起動して選ぶのがいちばん正確。「スキャン」は Steam / Epic のライブラリを探す（自動は1日1回、常時ではない）。',
    'set.title': '⚙️ 設定',
    'set.autolaunch': 'Windows の起動時にパネルを立ち上げる',
    'set.poll': 'ゲーム / ボットを {input} 秒ごとに確認する',
    'set.scanauto': '新しく入れたゲームを <b>1日1回</b> 探す',
    'set.scanHint': '上の確認はプロセス一覧を読むだけ（とても軽い）。ゲームのディスクスキャンのほうは <b>常時は動かない</b>：多くても1日1回、あとは「🔍 スキャン」ボタンから。',
    'set.saveInfoTitle': 'pm2 は PC の起動時にこのリストを復元する — ここで起動 / 停止するたびに保存し直される。',
    'set.saved': 'pm2 の最終保存：{d}',
    'set.savedNever': 'このパネルからの pm2 保存はまだない。',
    'alerts.title': '🔔 通知（ボットが落ちたとき）',
    'alerts.enable': 'ボットが <b>落ちた</b> とき、<b>再起動を繰り返す</b> ときに知らせる',
    'alerts.toast': 'Windows の通知（PC の前にいるときだけ役に立つ）',
    'alerts.sound': '通知に小さな音をつける',
    'alerts.volTitle': '音の大きさ',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/…（ゲーム中でも届く）',
    'alerts.test': 'テスト',
    'alerts.hint': 'いちばん役に立つのは <b>Discord の webhook</b>：プレイの最中でも、PC を離れていても届く。Discord では <b>チャンネル設定 → 連携サービス → ウェブフック → 新しいウェブフック → URL をコピー</b>。通知には <b>原因がそのまま書かれる</b>（ネット切断、トークン不正、モジュール不足…）。',
    'alerts.suppressed': ' — ⚠️ この1時間で {n} 件の通知を先送りした（スパム防止の上限）。',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': 'Discord のプロフィールに「🤖 X 個のボットを管理中」と出す',
    'rpc.idPh': '空のままでいい — 既定で Hasu Panel のアプリケーションを使う',
    'rpc.hint': '設定はいらない：オンにすればすぐ動く（この PC で <b>Discord が開いている</b> ことだけ必要）。上の欄は <b>自分の</b> Discord アプリケーションを出したいときだけ使う — その場合は <b>Application ID</b> を貼る（discord.com/developers/applications → General Information）。',
    'rpc.off': ' — オフ。',
    'rpc.on': ' — ✅ オン。',
    'rpc.needId': ' — ⚠️ オンにするには Application ID を貼って。',
    'upd.title': '🔄 アップデート',
    'upd.version': 'バージョン：',
    'upd.check': 'アップデートを確認',
    'upd.auto': 'アップデートを <b>自動で</b> 入れる <span class="mut11">（プレイ中とボットの操作中は絶対にしない）</span>',
    'upd.searching': '⏳ アップデートを確認中…',
    'upd.dev': 'ℹ️ 自動アップデートはインストール版（Setup.exe）でしか動かない。開発中は無効。',
    'upd.uptodate': '✅ すでに最新版（{v}）。',
    'upd.availableMsg': '⬇️ 新しいバージョン <b>{v}</b> を発見 — ダウンロード中、まもなく準備できる。',
    'upd.readyMsg': '✅ <b>アップデートの準備完了</b> — 「再起動して適用」をクリック。',
    'upd.errorMsg': '⚠️ いまは確認できない{d}。あとでもう一度。',
    'upd.unexpected': '⚠️ 予期しない応答。',
    'upd.cardDownloading': 'アップデートをダウンロード中…',
    'upd.cardReady': 'アップデートを入れる準備ができた',
    'upd.cardAvailable': '新しいバージョンあり',
    'upd.cardPreparing': '準備中…',
    'upd.cardBroken': 'アップデートが中断した',
    'upd.install': 'インストールして再起動',
    'upd.later': 'あとで',
    'upd.laterTitle': 'このカードを隠す',
    'upd.retry': 'もう一度',
    'upd.restarting': '再起動中…',
    'upd.whyManual': '自動インストールはオフ — 好きなときに適用して。',
    'upd.whyWaiting': 'できしだい自動で入る — 待っているもの：{list}。',
    'upd.whyWindow': 'このウィンドウを閉じたら自動で入る。',
    'heal.title': '🔧 自動再起動',
    'heal.enable': '<b>落ちた</b> ボットを自分で再起動する <span class="mut11">（5分後、次は15分後、次は1時間後）</span>',
    'heal.hint': 'pm2 が自前の再起動を使い切ると、気づくまでボットは死んだまま。パネルが代わりに試し、<b>3回でやめる</b>：3回やっても戻らないボットは本当に問題があるので、通知は見えたままにしておく。<b>自分で</b>止めたボットや、ゲームモードが止めたボットには絶対に触らない。',
    'inc.title': '📓 最近の障害',
    'inc.none': '記録された障害はなし。いい兆候。',
    'cfg.failTitle': '設定がもう保存できない',
    'cfg.failBody': '設定は予備のコピーに残っていて有効なままだが、本体のファイルが書き込みを受け付けない。',
    'cfg.failWhy': 'ファイル：{path} — ウイルス対策ソフト、フォルダの同期、ディスクの空き不足あたりを見て。',
    'logs.title': '{name} のログ',
    'logs.out': '出力',
    'logs.err': 'エラー',
    'logs.filterPh': '絞り込み…',
    'logs.copy': 'コピー',
    'logs.openFolder': '📂 ログのフォルダ',
    'logs.close': '閉じる',
    'logs.empty': 'まだログはない。',
    'logs.unreadable': 'ログファイルはあるが、読めなかった（ロック中、またはアクセス拒否）。',
    'logs.noMatch': '「{q}」を含む行はない。',
    'logs.failed': 'ログを読めなかった。',
    'tc.pm2Missing': '<b>⚠️ pm2 が入っていない。</b><br>pm2 はボットを動かし続けるための道具。クリックすると自動で入る（管理者権限はいらない）。',
    'tc.pm2Install': 'pm2 を入れる',
    'tc.pm2Busy': ' ⏳ pm2 をインストール中…（最大1分）',
    'tc.pm2Ok': ' ✅ pm2 が入った！',
    'tc.pm2NoNode': ' ❌ 先に Node.js が必要。',
    'tc.pm2Fail': ' ❌ 失敗 — もう一度試すか、pm2 を手で入れて。',
    'tc.pm2Down': 'pm2 が応答しない — ボットの状態を読めない。',
    'tray.open': 'パネルを開く',
    'tray.game': 'ゲームモード：{v}',
    'tray.on': 'オン ✔',
    'tray.off': 'オフ',
    'tray.update': '🔄 アップデート準備完了 — 適用して再起動',
    'tray.quit': '終了',
    'tray.tipBots': 'Hasu Panel — {on}/{total} ボット稼働中',
    'tray.online': '（オンライン）',
    'tray.solo': '（ソロ）',
    'tray.cut': ' · {n} 件のボットを停止',
    'tray.low': ' · 🌐 通信ひかえめ',
    'blk.game': 'ゲーム中',
    'blk.unknown': 'ゲーム中かどうか不明',
    'blk.busy': 'ゲームモードの切り替え中',
    'blk.action': 'ボットの操作中',
    'blk.stopAll': '全体停止の実行中',
    'blk.parked': 'ゲームモードが止めたボットあり',
    'blk.lownet': '通信ひかえめが作動中',
    'blk.window': 'ウィンドウが開いている',
    'blk.grace': '猶予時間',
    'set.lastScan': '（最後のスキャン：{d}）',
    'set.noScan': '（スキャンはまだ）',
    'set.devOnly': '（.exe 版でだけ有効）',
    'bots.netTitle': 'ボットの通信量。入出力から測っている（Discord ボットならほぼ通信、あとは SQLite のディスクが少し） — ↓ 受信 · ↑ 送信',
    'bots.parked': '⏸ ゲームモードで停止中',
    'bots.autobootTitle': 'Windows にログインすると（再び）稼働する',
    'bots.gamestopTitle': 'ゲームを検出したら止まる（「チェックしたボット」モード）',
    'bots.logsTitle': '最近のログを見る（クラッシュ、エラー…）',
    'bots.folderTitle': 'ボットのフォルダをエクスプローラーで開く',
    'bots.removeTitle': 'このボットを止めて pm2 から外す（ファイルはそのまま）',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — これは何？</h2>
  <p><b>自分のボット全部</b>のためのコントロールパネル：ボットは <b>pm2</b> のおかげで裏で動き、コンソールを触らずにここで管理できる。</p>
  <h3>🤖 ボットの一覧</h3>
  <p>1行が1つのボット。<b style="color:#3ba55d">緑</b>の丸は稼働中、灰色は停止、<b style="color:#ed4245">赤</b>はエラー。ボタン：▶ 起動 · ⏹ 停止 · ⟳ 再起動 · <b>📄 ログ</b>。</p>
  <p><b>📄 ログ</b>：そのボットの <b>最後の数行</b>（エラー、クラッシュ…）を出す — なぜ落ちたのかを <b>ターミナルを開かずに</b> 追える。</p>
  <p><b>自動起動</b>：チェックあり → PC をつけると、そのボットが自分で稼働に戻る。チェックなし → 起動時は止まったまま。</p>
  <p><b>⏹ 全部止める</b>（一覧の上）は <b>稼働中のボット全部</b> をまとめて止める。安全のため、確定には <b>2回</b> クリックが必要。</p>
  <p>停止のたびにパネルは後始末をする：<b>ボットが起動した小さなプログラム</b>（音楽ボットの ffmpeg、途中のインストール…）は、以前は生き残って PC を散らかしていたが、いまは <b>ちゃんと閉じる</b>。</p>
  <p>動いているはずのボットが止まっていると、一覧の先頭に <b>帯</b> が出て、<b>「まとめて復旧」</b> ボタンでまとめて起動し直せる。数えるのは <b>本当に戻ったもの</b> だけ：起動を拒むボットがあれば（フォルダを移動した、ファイルが足りない）、成功したふりをせずにそう伝える。</p>
  <h3>🔔 ボットが落ちたら知らせる</h3>
  <p>このパネルの存在理由：ボットが死んでいたことに <b>3日後に</b> 気づく——そんな事態をなくすこと。ボットが落ちたり再起動を繰り返したりすると、<b>控えめな Windows の通知</b> が <b>やさしい音</b>（音量は調整可）つきで届き、通知には <b>原因がそのまま</b> 書かれる — ネット切断、トークン不正、モジュール不足、メモリ不足…</p>
  <p>いちばん役に立つのは <b>Discord の webhook</b>：プレイの最中でも、PC を離れていても届く。Discord では <b>チャンネル設定 → 連携サービス → ウェブフック → 新しいウェブフック → URL をコピー</b>、それを ⚙️ 設定に貼る。</p>
  <p>パネルは <b>故障</b> と <b>わざと止めた</b> を区別する：自分でボットを止めたときは — パネルからでも <i>ターミナル</i>からでも — 通知もしないし、勝手に戻しもしないし、次回の起動時にも上げない。PC の復帰直後と立ち上げ直後も、ネットが戻るまでは黙っている。にせの通知が一気に来ないように。</p>
  <p>送信に失敗したときは — たいてい故障そのものがネット切断なので — 通知は捨てずに <b>再送</b> される。そして pm2 自身が応答しなくなったら、パネルはそれを知らせる：黙っていたらどの通知も出せず、その静けさが「問題なし」に見えてしまうから。</p>
  <h3>➕ ボットを取り込む</h3>
  <p>いつも手で起動しているボットがある（たとえば <b>Visual Studio</b> から <code>node index.js</code>）？「取り込み」をクリックして（<b>ファイル</b>でも <b>フォルダごと</b>でも — フォルダならメインファイルは自動で見つかる）、名前をつける。それだけ：</p>
  <p>• Visual Studio を閉じても <b>裏で動き続ける</b>；<br>• 落ちたら <b>自分で再起動する</b>；<br>• <b>PC の再起動をまたいで生き残る</b>；<br>• <b>ほかのボットと同じように</b> ここで管理できる（自動起動、ゲームモード…）。</p>
  <p>🗑 ボタンはボットを止めて pm2 から外す — <b>ファイルには一切触らない</b>。</p>
  <h3>🎮 ゲームモード</h3>
  <p>リストにあるゲームを検出すると（Fortnite、Valorant…）、パネルは <b>選んだボットを止めて</b> プレイ中の PC を空け、ゲームを閉じてから1分ほどで <b>自動的に起動し直す</b>。選べるのは：<b>すべての</b>ボットを止めるか、「ゲーム中は停止」にチェックしたものだけか。</p>
  <p><b>ソロプレイ？</b> パネルはゲームが <b>本当にインターネットにつながっているか</b> を見る：ソロ / オフラインのプレイでは何も止めない（「ソロのゲームは無視する」の設定）。たとえば GTA V のストーリーモード → ボットはそのまま、GTA Online → ゲームモードが働く。</p>
  <h3>🕹️ 検出するゲームを増やす</h3>
  <p>3つのやり方：<b>📋 起動中のプログラム</b>（ゲームを起動して一覧から選ぶ — いちばん正確で、ゲーム以外のソフトにも使える）、<b>📁 .exe を選ぶ</b>（ディスクを見て回る）、<b>🔍 スキャン</b>（Steam / Epic のライブラリを探して、リストにないインストール済みのゲームを出す）。</p>
  <p>ディスクスキャンは <b>常時は動かない</b>：自動なら多くても <b>1日1回</b>（⚙️ 設定でオフにできる）、あとは「スキャン」を押したとき。ずっと動いている監視のほうはプロセス一覧を読むだけ — ほぼ負荷ゼロ。</p>
  <h3>🌐 通信ひかえめ</h3>
  <p>オンにすると <b>オンラインのゲームの通信を優先</b> する：プレイ中、ボットは <b>大きなダウンロード</b>（詐欺対策リスト、暗号化バックアップ）を後回しにし、<b>優先度を下げる</b> — 回線が遅いほど厳しくなる（速度は自動で測る）。プレイが終われば元どおり。ゲームモードとは別物：ゲームを <i>ラグらせずに</i> ボットを稼働させたままにするのにぴったり。</p>
  <h3>🔄 自動アップデート</h3>
  <p>パネルは <b>自分で更新する</b>：起動時と、その後は6時間ごとに確認し、すべて <b>このウィンドウの中</b> で終わる。新しいバージョンが見つかると上にカードが出る：割合・速度・容量つきの <b>進捗バー</b>、続けて <b>そのバージョンの変更点</b> と <b>「インストールして再起動」</b> ボタン。「あとで」はカードを隠すだけ — インストール自体は進み続ける。</p>
  <p>基本的に <b>クリックすることは何もない</b>：危なくないと分かった時点でアップデートは自分で入る。プレイの最中、ボットの操作中、そしてこのウィンドウを見ている間は <b>絶対に</b> しない — カードには <b>何を待っているか</b> がちゃんと出る。ウィンドウを閉じれば適用される。（⚙️ 設定でオフにでき、「アップデートを確認」ボタンで手動確認もできる。）</p>
  <h3>🔋 動作が軽い</h3>
  <p>パネルは24時間動いていても邪魔をしない：<b>通知領域にしまわれている</b> あいだは <b>監視の間隔をゆるめ</b>、誰も見ていない表示の計算をやめる。ウィンドウを開き直せば、すぐまた元の反応に戻る。（ゲームモードや通信ひかえめが作動中なら、取りこぼさないよう反応を保ったままにする。）</p>
  <h3>🎮 Discord での見え方</h3>
  <p>「Rich Presence」の設定を入れると、Discord のプロフィールに <b>「🤖 X 個のボットを管理中」</b>（と、いま遊んでいるゲーム）が出る。<b>設定はいらない</b> — Discord が開いてさえいればいい。完全に飾りで、⚙️ 設定でオフにできる。</p>
  <h3>🧰 まっさらな PC で（友だちの家など）</h3>
  <p>ボットには <b>Node.js</b> と <b>pm2</b> が必要。どちらかが足りなければパネルが <b>気づいて</b>、空の一覧を出す代わりに合ったボタン（「Node.js をダウンロード」か「pm2 を入れる」）を出す。</p>
  <h3>📁 知っておくといいこと</h3>
  <p>• ウィンドウの × は <b>通知領域にしまう</b>（時計のとなり）。終了するには：アイコンを右クリック → 終了。<br>• 設定は <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code> に、記録は <code>panel.log</code> に入る。<br>• 設定の <b>予備のコピー</b> がとなり（<code>.bak</code>）に用意されていて、本体のファイルが読めなくなったり書かれなくなったりすると自動で拾われる。保存がもう通らないときは <b>赤い帯</b> が知らせる — 設定が守られていると勘違いさせないために。<br>• パネルは Windows と一緒に立ち上がる（⚙️ 設定でオフにできる）。</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['ja'] = L; }
})();
