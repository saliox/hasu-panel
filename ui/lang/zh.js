// 简体中文 — Hasu Panel 界面翻译。
//
// 格式（所有语言都必须一模一样）：
//  • `ui`：一个键对应一条文案。所有语言的键完全相同 — 绝不在这里增加、删除或改名：
//    以法语（fr.js）为准。
//  • {x} 这样的占位符必须原样保留：运行时会填入实际的值。
//  • HTML 标签（<b>、<span class="mut11">、<br>）同样要原样保留。
//  • `about`：「关于」窗口的正文。其中的 {v} 会填入版本号。
// 每次 `npm test` 都会跑一个测试（test/i18n.test.js），检查各语言的键和占位符是否一致。
(function () {
  const L = { nom: '简体中文', ui: {
    'app.sub': 'pm2 机器人管理 · 游戏模式',
    'btn.about': 'ℹ️ 关于',
    'btn.langTitle': '界面语言',
    'banner.loading': '加载中…',
    'bots.title': '🤖 机器人 (pm2)',
    'bots.import': '➕ 导入（文件）',
    'bots.importTitle': '选择机器人的主文件（index.js、bot.py…）',
    'bots.importDir': '📁 导入（文件夹）',
    'bots.importDirTitle': '选择机器人所在的文件夹 — 主文件会自动识别',
    'bots.stopAll': '⏹ 全部停止',
    'bots.stopAllTitle': '停止所有在线的机器人（再点一次确认）',
    'bots.stopAllArm': '⏹ 确认？',
    'bots.stopAllBusy': '⏳ 正在停止…',
    'bots.stopAllDone': '✅ 已停止 {n} 个',
    'bots.stopAllFail': '⚠️ 失败',
    'bots.hint': '「自动启动」：Windows 登录时把机器人重新拉上线。「游戏时关闭」：游戏模式触发时停止这个机器人（前提是选了「只停止勾选的机器人」）。',
    'bots.none': '目前还没有由 pm2 管理的机器人。用上面的「➕ 导入」添加一个。',
    'bots.searching': '⏳ 正在查找机器人…',
    'bots.imported': '🧩 已导入的机器人',
    'bots.autoboot': '自动启动',
    'bots.gamestop': '游戏时关闭',
    'bots.uptime': '⏱ {v}',
    'bots.fix': '一键恢复上线',
    'bots.fixBanner': '<b>{n}</b> 个机器人本该在线',
    'bots.fixDone': '✅ 已重启 {n} 个',
    'bots.fixPartial': '⚠️ 已重启 {n} 个，{k} 个仍离线',
    'gm.title': '🎮 游戏模式',
    'gm.enable': '检测到游戏时停止机器人',
    'gm.all': '所有机器人',
    'gm.some': '只停止勾选了「游戏时关闭」的机器人',
    'gm.grace': '游戏关闭 {input} 秒后重启机器人',
    'gm.soloskip': '忽略<b>单机</b>游戏 <span class="mut12">（只在游戏真的联网时才停止）</span>',
    'gm.banner': '🎮 <b>联机游戏：</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 检测到 <b>{game}</b> — <b>单机</b>对局：机器人保持在线',
    'gm.bannerCut': ' — <b>已停止 {n} 个机器人</b>（游戏结束后自动重启）',
    'gm.bannerNone': ' — 没有要停止的机器人',
    'gm.bannerOff': ' — 游戏模式已关闭',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;个机器人在线 — 未检测到游戏',
    'lownet.title': '🌐 低网络占用',
    'lownet.enable': '把网络优先让给联机游戏',
    'lownet.hint': '联机对局期间：机器人的大流量下载（反诈骗域名表、加密备份）会被暂停，优先级也会调低 — 网速越慢限制越严。对局结束后一切恢复正常。与游戏模式互不相干：适合那些你一直挂着的机器人。',
    'lownet.active': ' · 🌐 低网络占用生效中',
    'lownet.broken': ' · ⚠️ 低网络占用：优先级已设置，但发给机器人的信号没送到',
    'games.title': '🕹️ 已识别的游戏（进程）',
    'games.ph': 'MyGame.exe',
    'games.add': '添加',
    'games.pick': '📋 运行中的程序',
    'games.pickTitle': '从打开的窗口里选（先把游戏启动起来）',
    'games.exe': '📁 选择 .exe',
    'games.exeTitle': '浏览磁盘，选出游戏的 .exe',
    'games.scan': '🔍 扫描',
    'games.scanTitle': '查找已安装但不在列表里的游戏（Steam、Epic）',
    'games.hint': '「运行中的程序」列出你这台电脑上真正在跑的东西（游戏，或默认列表不认识的软件）：先启动游戏再选它 — 这是最准的办法。「扫描」会翻查 Steam/Epic 库（每天自动一次，绝不持续运行）。',
    'set.title': '⚙️ 设置',
    'set.autolaunch': '随 Windows 启动面板',
    'set.poll': '每 {input} 秒检查一次游戏 / 机器人',
    'set.scanauto': '<b>每天一次</b>查找新装的游戏',
    'set.scanHint': '上面这个检查只读取进程列表（非常轻）。查找游戏的磁盘扫描则<b>绝不持续运行</b>：最多每天一次，或者点「🔍 扫描」。',
    'set.saveInfoTitle': '开机时 pm2 会还原这份列表 — 每次在这里启动/停止之后都会重新保存一遍。',
    'set.saved': '上次 pm2 保存：{d}',
    'set.savedNever': '这个面板还没做过 pm2 保存。',
    'alerts.title': '🔔 提醒（机器人掉线）',
    'alerts.enable': '机器人<b>掉线</b>或<b>反复重启</b>时通知我',
    'alerts.toast': 'Windows 通知（只有我在电脑前才有用）',
    'alerts.sound': '通知时带一点提示音',
    'alerts.volTitle': '提示音音量',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/…（打游戏时也能找到你）',
    'alerts.test': '测试',
    'alerts.hint': '<b>Discord webhook</b> 最管用：你在对局中或者不在电脑前都能收到。在 Discord 里：<b>频道设置 → 整合 → Webhook → 新建 Webhook → 复制 URL</b>。提醒里会<b>把原因说清楚</b>（断网、token 失效、缺少模块…）。',
    'alerts.suppressed': ' — ⚠️ 本小时有 {n} 条提醒被延后（防刷屏上限）。',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': '在我的 Discord 个人资料上显示「🤖 正在管理 X 个在线机器人」',
    'rpc.idPh': '留空就行 — 默认用 Hasu Panel 这个应用',
    'rpc.hint': '不用配置：一开就能用（只需要这台电脑上<b>开着 Discord</b>）。上面那个字段只在你想显示<b>你自己的</b> Discord 应用时才有用 — 那就把它的 <b>Application ID</b> 粘进来（discord.com/developers/applications → General Information）。',
    'rpc.off': ' — 已关闭。',
    'rpc.on': ' — ✅ 已开启。',
    'rpc.needId': ' — ⚠️ 粘贴你的 Application ID 才能开启。',
    'upd.title': '🔄 更新',
    'upd.version': '版本：',
    'upd.check': '检查更新',
    'upd.auto': '<b>自动</b>安装更新 <span class="mut11">（绝不在对局中，也不在操作机器人时）</span>',
    'upd.searching': '⏳ 正在检查更新…',
    'upd.dev': 'ℹ️ 自动更新只在安装版（Setup.exe）里有效，开发环境下用不了。',
    'upd.uptodate': '✅ 你已经是最新版本（{v}）。',
    'upd.availableMsg': '⬇️ 发现新版本 <b>{v}</b> — 正在下载，稍等片刻就好。',
    'upd.readyMsg': '✅ <b>更新已就绪</b> — 点「重启并应用」。',
    'upd.errorMsg': '⚠️ 现在查不了{d}。过一会儿再试。',
    'upd.unexpected': '⚠️ 收到意外的响应。',
    'upd.cardDownloading': '正在下载更新…',
    'upd.cardReady': '更新已就绪，可以安装',
    'upd.cardAvailable': '有新版本可用',
    'upd.cardPreparing': '准备中…',
    'upd.cardBroken': '更新中断了',
    'upd.install': '安装并重启',
    'upd.later': '稍后',
    'upd.laterTitle': '隐藏这张卡片',
    'upd.retry': '重试',
    'upd.restarting': '正在重启…',
    'upd.whyManual': '自动安装已关闭 — 你想什么时候应用都行。',
    'upd.whyWaiting': '它会尽快自己装好 — 正在等：{list}。',
    'upd.whyWindow': '你一关掉这个窗口，它就会自己装上。',
    'heal.title': '🔧 自动重启',
    'heal.enable': '自动重启<b>掉线</b>的机器人 <span class="mut11">（先等 5 分钟，再 15 分钟，然后 1 小时）</span>',
    'heal.hint': 'pm2 用光自己的重启次数之后，机器人就一直死在那儿，直到你偶然发现。面板替你重试，然后<b>试满 3 次就停手</b>：连着三次都起不来的机器人是真出了问题，提醒必须留着让你看见。它绝不碰<b>你自己</b>停掉的机器人，也不碰被游戏模式停掉的。',
    'inc.title': '📓 最近的故障',
    'inc.none': '没有记录到任何故障。这是好事。',
    'dual.title': '这台电脑上有两份面板',
    'dual.body': '还存在另一份安装：{path}。两份都会随 Windows 启动并各自更新。请卸载你不想要的那份（设置 → 应用）。',
    'cfg.failTitle': '你的设置已经保存不了了',
    'cfg.failBody': '它们存在一份备份里，仍然生效，但主文件写不进去。',
    'cfg.failWhy': '文件：{path} — 看看是不是杀毒软件、文件夹同步，或者磁盘满了。',
    'logs.title': '{name} 的日志',
    'logs.out': '输出',
    'logs.err': '错误',
    'logs.filterPh': '筛选…',
    'logs.copy': '复制',
    'logs.openFolder': '📂 日志文件夹',
    'logs.close': '关闭',
    'logs.empty': '暂时没有日志。',
    'logs.unreadable': '日志文件在，但读不出来（被占用，或者没有权限）。',
    'logs.noMatch': '没有哪一行包含「{q}」。',
    'logs.failed': '读取日志失败。',
    'tc.pm2Missing': '<b>⚠️ 还没装 pm2。</b><br>pm2 就是让你的机器人一直在线的那个工具。点一下自动安装（不需要管理员权限）。',
    'tc.pm2Install': '安装 pm2',
    'tc.pm2Busy': ' ⏳ 正在安装 pm2…（最多 1 分钟）',
    'tc.pm2Ok': ' ✅ pm2 装好了！',
    'tc.pm2NoNode': ' ❌ 得先有 Node.js。',
    'tc.pm2Fail': ' ❌ 失败 — 再试一次，或者手动装 pm2。',
    'tc.pm2Down': 'pm2 没有响应 — 读不到机器人的状态。',
    'tray.open': '打开面板',
    'tray.game': '游戏模式：{v}',
    'tray.on': '已开启 ✔',
    'tray.off': '已关闭',
    'tray.update': '🔄 更新已就绪 — 应用并重启',
    'tray.quit': '退出',
    'tray.tipBots': 'Hasu Panel — {on}/{total} 个机器人在线',
    'tray.online': '（联机）',
    'tray.solo': '（单机）',
    'tray.cut': ' · 已停止 {n} 个机器人',
    'tray.low': ' · 🌐 省网络',
    'blk.game': '正在玩游戏',
    'blk.unknown': '不确定是不是在玩游戏',
    'blk.busy': '正在切换游戏模式',
    'blk.action': '正在对机器人做操作',
    'blk.stopAll': '正在全部停止',
    'blk.parked': '有机器人被游戏模式停着',
    'blk.lownet': '低网络占用生效中',
    'blk.window': '窗口开着',
    'blk.grace': '等待缓冲时间',
    'set.lastScan': '（上次扫描：{d}）',
    'set.noScan': '（还没扫描过）',
    'set.devOnly': '（只在 .exe 版本里有效）',
    'bots.netTitle': '机器人的网络流量，按它的读写量估算（对 Discord 机器人来说几乎全是网络，外加一点 SQLite 磁盘）— ↓ 接收 · ↑ 发送',
    'bots.parked': '⏸ 已被游戏模式停止',
    'bots.autobootTitle': 'Windows 登录时重新拉上线',
    'bots.gamestopTitle': '检测到游戏时停止（「勾选的机器人」模式）',
    'bots.logsTitle': '查看最近的日志（崩溃、报错…）',
    'bots.folderTitle': '在资源管理器里打开机器人的文件夹',
    'bots.removeTitle': '停止这个机器人并把它从 pm2 移除（它的文件一点不动）',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — 这是什么？</h2>
  <p>一个管<b>你所有机器人</b>的控制面板：它们靠 <b>pm2</b> 在后台跑着，而你在这里管理它们，不用碰命令行。</p>
  <h3>🤖 机器人列表</h3>
  <p>一行一个机器人。<b style="color:#3ba55d">绿</b>点 = 在线，灰点 = 已停止，<b style="color:#ed4245">红</b>点 = 出错。按钮：▶ 启动 · ⏹ 停止 · ⟳ 重启 · <b>📄 日志</b>。</p>
  <p><b>📄 日志</b>：显示这个机器人<b>最后几行输出</b>（报错、崩溃…）— 想知道它为什么掉线时很方便，<b>不用开终端</b>。</p>
  <p><b>自动启动</b>：勾上 → 开机后机器人自己重新上线。不勾 → 开机时它保持关闭。</p>
  <p><b>⏹ 全部停止</b>（列表上方）一下子停掉<b>所有在线的机器人</b>。为了安全，要点<b>两次</b>确认。</p>
  <p>每次停止时面板都会顺手打扫：那些<b>由机器人拉起来的小程序</b>（音乐机器人的 ffmpeg、正在跑的安装…）以前会活下来占着电脑，现在也会被<b>干净地关掉</b>。</p>
  <p>如果某个本该在线的机器人是关着的，列表顶部会出现一条<b>横幅</b>，带一个<b>「一键恢复上线」</b>按钮，一次把它们全拉起来。它只统计<b>真正起来了的</b>：要是某个机器人起不来（文件夹被移动、文件缺失），它会直接告诉你，而不是谎报成功。</p>
  <h3>🔔 机器人掉线时收到提醒</h3>
  <p>这就是这个面板存在的意义：别再<b>三天之后</b>才发现某个机器人早就死了。机器人掉线或反复重启时，你会收到一条<b>不打扰人的 Windows 通知</b>，配一点<b>轻柔的提示音</b>（音量可调），而且提醒里会<b>用大白话写清原因</b> — 断网、token 失效、缺少模块、内存爆了…</p>
  <p>最管用的还是 <b>Discord webhook</b>：你在对局中、或者根本不在电脑前，它都能找到你。在 Discord 里：<b>频道设置 → 整合 → Webhook → 新建 Webhook → 复制 URL</b>，然后粘到 ⚙️ 设置里。</p>
  <p>面板分得清<b>故障</b>和<b>你主动停掉</b>：如果是你自己停的 — 在面板里<i>或者</i>在终端里 — 它不会提醒你，不会把它拉起来，下次开机也不会。电脑刚唤醒时和刚启动那会儿它也保持安静，等网络回来，免得一口气蹦出一堆假警报。</p>
  <p>要是提醒发不出去 — 典型情况就是故障本身正是断网 — 这条提醒会被<b>重试</b>，而不是丢掉。而如果连 pm2 自己都不应声了，面板也会告诉你：不然就一条提醒都发不出来，而这份沉默看上去还像「一切正常」。</p>
  <h3>➕ 导入一个机器人</h3>
  <p>你有个平时手动启动的机器人（比如在 <b>Visual Studio</b> 里敲 <code>node index.js</code>）？点「导入」（选<b>文件</b>或<b>整个文件夹</b> — 后者会自动认出主文件），给它起个名字，就这么简单：</p>
  <p>• 它在<b>后台</b>跑，Visual Studio 关了也照跑；<br>• 崩了会<b>自己重启</b>；<br>• <b>电脑重启也活得下来</b>；<br>• 在这里<b>和别的机器人一样管</b>（自动启动、游戏模式…）。</p>
  <p>🗑 按钮会停掉这个机器人并把它从 pm2 移除 — <b>它的文件一点都不会动</b>。</p>
  <h3>🎮 游戏模式</h3>
  <p>检测到列表里的游戏（Fortnite、Valorant…）时，面板会<b>停掉你选好的机器人</b>，把电脑腾给你玩，等游戏关掉大约 1 分钟后再<b>自动重启</b>它们。你自己定：停<b>所有</b>机器人，还是只停勾了「游戏时关闭」的那些。</p>
  <p><b>单机游戏呢？</b>面板会看这个游戏是不是<b>真的连着网</b>：单机／离线的对局什么都不停（对应「忽略单机游戏」这个选项）。举例：GTA V 剧情模式 → 机器人照常在线；GTA Online → 触发游戏模式。</p>
  <h3>🕹️ 把一个游戏加入检测</h3>
  <p>三种办法：<b>📋 运行中的程序</b>（先启动游戏，再从列表里选它 — 最准，对普通软件也管用）、<b>📁 选择 .exe</b>（浏览磁盘），或者 <b>🔍 扫描</b>（翻查 Steam/Epic 库，把已装但不在列表里的游戏推给你）。</p>
  <p>磁盘扫描<b>绝不持续运行</b>：自动的话最多<b>每天一次</b>（可以在 ⚙️ 设置里关掉），或者你点「扫描」时。常驻的那个监视只是读一下进程列表 — 几乎不花什么资源。</p>
  <h3>🌐 低网络占用</h3>
  <p>打开之后，这个模式会<b>把网络优先让给联机游戏</b>：对局期间，机器人会推迟自己的<b>大流量下载</b>（反诈骗域名表、加密备份）并降到<b>低优先级</b> — 你的网速越慢（会自动测），限制越严。对局结束后一切恢复正常。它与游戏模式互不相干：想让某个机器人一直在线<i>又</i>不拖慢你的网，正好用它。</p>
  <h3>🔄 自动更新</h3>
  <p>面板会<b>自己更新</b>：启动时查一次，之后每 6 小时一次，整个过程都<b>在这个窗口里</b>完成。一发现新版本，顶部就会出现一张卡片：带百分比、速度和大小的<b>进度条</b>，接着是<b>这一版的更新内容</b>和一个<b>「安装并重启」</b>按钮。「稍后」只是把卡片收起来 — 安装照样继续。</p>
  <p>原则上你<b>什么都不用点</b>：一旦没有风险，更新就会自己装上。它<b>绝不</b>在对局中、在操作机器人时、或者在你正盯着窗口时动手 — 卡片会明确告诉你<b>它在等什么</b>。你把窗口关掉，它就装。（可以在 ⚙️ 设置里关掉，另有「检查更新」按钮可以强制查一次。）</p>
  <h3>🔋 不占资源</h3>
  <p>面板 24 小时开着也不碍事：<b>缩到通知区</b>的时候，它会<b>放慢监视节奏</b>，也不再去算没人看的界面。你一把窗口打开，一切又立刻恢复。（如果游戏模式或低网络占用正生效，它会保持灵敏，什么都不会漏。）</p>
  <h3>🎮 你的 Discord 状态</h3>
  <p>「Rich Presence」选项会让你的 Discord 个人资料显示 <b>「🤖 正在管理 X 个在线机器人」</b>（以及正在玩的游戏）。<b>不用配置</b> — 只要 Discord 开着就行。纯装饰，可以在 ⚙️ 设置里关掉。</p>
  <h3>🧰 换一台新电脑（比如朋友的）</h3>
  <p>机器人需要 <b>Node.js</b> 和 <b>pm2</b>。要是少了哪一个，面板会<b>检测出来</b>，并给出对应的按钮（「下载 Node.js」或「安装 pm2」），而不是丢给你一个空列表。</p>
  <h3>📁 值得一提</h3>
  <p>• 窗口的关闭按钮是<b>缩到通知区</b>（时钟旁边）。要退出：右键图标 → 退出。<br>• 设置存在 <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>，日志在 <code>panel.log</code>。<br>• 旁边还会同步维护一份设置的<b>备份</b>（<code>.bak</code>），主文件一旦读不了或者不再被写入就自动改用它。如果确实存不进去了，会有一条<b>红色横幅</b>告诉你 — 而不是让你以为设置都好好保存着。<br>• 面板会随 Windows 自己启动（可以在 ⚙️ 设置里关掉）。</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['zh'] = L; }
})();
