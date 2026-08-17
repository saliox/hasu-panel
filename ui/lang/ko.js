// 한국어 — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: '한국어', ui: {
    'app.sub': 'pm2 봇 관리 · 게임 모드',
    'btn.about': 'ℹ️ 정보',
    'btn.langTitle': '인터페이스 언어',
    'banner.loading': '불러오는 중…',
    'bots.title': '🤖 봇 (pm2)',
    'bots.import': '➕ 가져오기 (파일)',
    'bots.importTitle': '봇의 메인 파일 고르기 (index.js, bot.py…)',
    'bots.importDir': '📁 가져오기 (폴더)',
    'bots.importDirTitle': '봇의 폴더 고르기 — 메인 파일은 알아서 찾아요',
    'bots.stopAll': '⏹ 전부 정지',
    'bots.stopAllTitle': '켜져 있는 봇을 전부 정지 (한 번 더 누르면 확인)',
    'bots.stopAllArm': '⏹ 확인?',
    'bots.stopAllBusy': '⏳ 정지 중…',
    'bots.stopAllDone': '✅ {n}개 정지',
    'bots.stopAllFail': '⚠️ 실패',
    'bots.hint': '‘자동 시작’: Windows에 로그인하면 봇이 다시 켜져요. ‘게임 중 정지’: 게임 모드가 작동하면 이 봇을 정지해요 (‘체크한 봇만’을 고른 경우).',
    'bots.none': 'pm2가 관리하는 봇이 아직 없어요. 위의 ‘➕ 가져오기’로 봇을 추가하세요.',
    'bots.searching': '⏳ 봇을 찾는 중…',
    'bots.imported': '🧩 가져온 봇',
    'bots.autoboot': '자동 시작',
    'bots.gamestop': '게임 중 정지',
    'bots.uptime': '⏱ {v}',
    'bots.fix': '다시 켜기',
    'bots.fixBanner': '봇 <b>{n}</b>개가 켜져 있어야 해요',
    'bots.fixDone': '✅ {n}개 재시작',
    'bots.fixPartial': '⚠️ {n}개 재시작, {k}개는 아직 꺼짐',
    'gm.title': '🎮 게임 모드',
    'gm.enable': '게임이 감지되면 봇 정지하기',
    'gm.all': '모든 봇',
    'gm.some': '‘게임 중 정지’를 체크한 봇만',
    'gm.grace': '게임을 닫고 {input}초 뒤에 봇 재시작',
    'gm.soloskip': '<b>싱글 플레이</b> 게임 무시 <span class="mut12">(정말 온라인일 때만 정지)</span>',
    'gm.banner': '🎮 <b>온라인 게임:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> 감지 — <b>싱글 플레이</b>: 봇은 켜둔 채로 있어요',
    'gm.bannerCut': ' — <b>봇 {n}개 정지</b> (게임이 끝나면 자동 재시작)',
    'gm.bannerNone': ' — 정지할 봇 없음',
    'gm.bannerOff': ' — 게임 모드 꺼짐',
    'gm.online': '🟢 봇 <b>{on}/{total}</b>&nbsp;개 온라인 — 감지된 게임 없음',
    'lownet.title': '🌐 인터넷 사용 줄이기',
    'lownet.enable': '온라인 게임에 네트워크 우선권 주기',
    'lownet.hint': '온라인 게임 중에는 봇의 큰 다운로드(사기 방지 목록, 암호화 백업)를 멈추고 우선순위를 낮춰요 — 인터넷이 느릴수록 더 강하게. 게임이 끝나면 전부 원래대로 돌아가요. 게임 모드와는 별개라서, 계속 켜두는 봇에 유용해요.',
    'lownet.active': ' · 🌐 인터넷 절약 작동 중',
    'lownet.broken': ' · ⚠️ 인터넷 절약: 우선순위는 적용됐지만 봇에 보낸 신호가 전달되지 않았어요',
    'games.title': '🕹️ 감지된 게임 (프로세스)',
    'games.ph': '게임이름.exe',
    'games.add': '추가',
    'games.pick': '📋 실행 중인 프로그램',
    'games.pickTitle': '열려 있는 창에서 고르기 (게임을 먼저 실행)',
    'games.exe': '📁 .exe 고르기',
    'games.exeTitle': '디스크에서 게임의 .exe 찾아보기',
    'games.scan': '🔍 검색',
    'games.scanTitle': '목록에 없는 설치된 게임 찾기 (Steam, Epic)',
    'games.hint': '‘실행 중인 프로그램’은 지금 이 PC에서 돌아가는 것을 보여줘요(기본 목록이 모르는 게임이나 프로그램도): 게임을 켜고 거기서 고르는 게 가장 정확해요. ‘검색’은 Steam/Epic 라이브러리를 뒤져요 (하루 1번 자동, 계속 돌지는 않아요).',
    'set.title': '⚙️ 설정',
    'set.autolaunch': 'Windows가 시작될 때 패널도 실행',
    'set.poll': '{input}초마다 게임 / 봇 확인',
    'set.scanauto': '새로 설치된 게임을 <b>하루 1번</b> 찾기',
    'set.scanHint': '위의 확인은 프로세스 목록만 읽어요(아주 가벼움). 게임 디스크 검색은 <b>절대 계속 돌지 않아요</b>: 하루 1번까지, 또는 ‘🔍 검색’ 버튼으로.',
    'set.saveInfoTitle': 'PC가 켜질 때 pm2가 이 목록을 복원해요 — 여기서 시작/정지할 때마다 다시 저장돼요.',
    'set.saved': '마지막 pm2 저장: {d}',
    'set.savedNever': '이 패널에서 pm2를 저장한 적이 아직 없어요.',
    'alerts.title': '🔔 알림 (봇이 죽었을 때)',
    'alerts.enable': '봇이 <b>죽거나</b> <b>재시작을 반복</b>하면 알려주기',
    'alerts.toast': 'Windows 알림 (PC 앞에 있을 때만 쓸모 있음)',
    'alerts.sound': '알림과 함께 작은 소리',
    'alerts.volTitle': '소리 크기',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (게임 중에도 알려줌)',
    'alerts.test': '테스트',
    'alerts.hint': '가장 쓸모 있는 건 <b>Discord webhook</b>이에요: 게임 한복판이든 PC 앞에 없든 알려줘요. Discord에서: <b>채널 설정 → 연동 → webhook → 새 webhook → URL 복사</b>. 알림에는 <b>원인이 쉬운 말로</b> 적혀요 (인터넷 끊김, 토큰 오류, 모듈 없음…).',
    'alerts.suppressed': ' — ⚠️ 이번 시간에 알림 {n}개를 미뤘어요 (스팸 방지 상한).',
    'rpc.title': '🎮 Discord Rich Presence',
    'rpc.enable': '내 Discord 프로필에 ‘🤖 봇 X개 관리 중’ 표시',
    'rpc.idPh': '비워 두세요 — 기본으로 Hasu Panel 애플리케이션을 써요',
    'rpc.hint': '설정할 게 없어요: 켜면 바로 작동해요 (이 PC에 <b>Discord가 켜져 있기만</b> 하면 돼요). 위 칸은 <b>직접 만든</b> Discord 애플리케이션을 표시하고 싶을 때만 필요해요 — 그럴 땐 그 <b>Application ID</b>를 붙여넣으세요 (discord.com/developers/applications → General Information).',
    'rpc.off': ' — 꺼짐.',
    'rpc.on': ' — ✅ 켜짐.',
    'rpc.needId': ' — ⚠️ 켜려면 Application ID를 붙여넣으세요.',
    'upd.title': '🔄 업데이트',
    'upd.version': '버전:',
    'upd.check': '업데이트 확인',
    'upd.auto': '업데이트를 <b>알아서</b> 설치 <span class="mut11">(게임 중이나 봇 작업 중에는 절대 안 함)</span>',
    'upd.searching': '⏳ 업데이트 확인 중…',
    'upd.dev': 'ℹ️ 자동 업데이트는 설치판(Setup.exe)에서만 작동해요. 개발 환경에서는 안 돼요.',
    'upd.uptodate': '✅ 이미 최신 버전이에요 ({v}).',
    'upd.availableMsg': '⬇️ 새 버전 <b>{v}</b> 발견 — 내려받는 중, 곧 준비돼요.',
    'upd.readyMsg': '✅ <b>업데이트 준비 완료</b> — ‘재시작 & 적용’을 누르세요.',
    'upd.errorMsg': '⚠️ 지금은 확인할 수 없어요{d}. 나중에 다시 시도하세요.',
    'upd.unexpected': '⚠️ 예상치 못한 응답.',
    'upd.cardDownloading': '업데이트 내려받는 중…',
    'upd.cardReady': '설치 준비된 업데이트',
    'upd.cardAvailable': '새 버전 있음',
    'upd.cardPreparing': '준비 중…',
    'upd.cardBroken': '업데이트 중단됨',
    'upd.install': '설치하고 재시작',
    'upd.later': '나중에',
    'upd.laterTitle': '이 카드 숨기기',
    'upd.retry': '다시 시도',
    'upd.restarting': '재시작 중…',
    'upd.whyManual': '자동 설치가 꺼져 있어요 — 원할 때 적용하세요.',
    'upd.whyWaiting': '가능해지는 대로 알아서 설치돼요 — 기다리는 중: {list}.',
    'upd.whyWindow': '이 창을 닫으면 알아서 설치돼요.',
    'heal.title': '🔧 자동 재시작',
    'heal.enable': '<b>죽은</b> 봇을 알아서 다시 켜기 <span class="mut11">(5분 뒤, 그다음 15분, 그다음 1시간)</span>',
    'heal.hint': 'pm2가 자체 재시작을 다 써버리면, 봇은 네가 알아챌 때까지 죽어 있어요. 패널이 대신 다시 시도하고, <b>3번 만에 멈춰요</b>: 세 번이나 살아나지 않는 봇은 진짜 문제가 있고, 알림은 계속 보여야 하니까요. <b>네가</b> 직접 정지한 봇이나 게임 모드가 끈 봇은 절대 건드리지 않아요.',
    'inc.title': '📓 최근 문제',
    'inc.none': '기록된 문제가 없어요. 좋은 신호예요.',
    'cfg.failTitle': '설정이 더 이상 저장되지 않아요',
    'cfg.failBody': '백업 사본에 보관돼서 계속 작동하긴 하지만, 원본 파일에 쓸 수가 없어요.',
    'cfg.failWhy': '파일: {path} — 백신, 폴더 동기화, 꽉 찬 디스크 쪽을 확인해 보세요.',
    'logs.title': '{name} 로그',
    'logs.out': '출력',
    'logs.err': '오류',
    'logs.filterPh': '필터…',
    'logs.copy': '복사',
    'logs.openFolder': '📂 로그 폴더',
    'logs.close': '닫기',
    'logs.empty': '아직 로그가 없어요.',
    'logs.unreadable': '로그 파일은 있지만 읽지 못했어요 (잠겨 있거나 접근 거부).',
    'logs.noMatch': '‘{q}’이(가) 들어간 줄이 없어요.',
    'logs.failed': '로그를 읽지 못했어요.',
    'tc.pm2Missing': '<b>⚠️ pm2가 설치되어 있지 않아요.</b><br>pm2는 봇을 계속 켜두는 도구예요. 누르면 자동으로 설치돼요 (관리자 권한 필요 없음).',
    'tc.pm2Install': 'pm2 설치',
    'tc.pm2Busy': ' ⏳ pm2 설치 중… (최대 1분)',
    'tc.pm2Ok': ' ✅ pm2 설치 완료!',
    'tc.pm2NoNode': ' ❌ Node.js가 먼저 필요해요.',
    'tc.pm2Fail': ' ❌ 실패 — 다시 시도하거나 pm2를 직접 설치하세요.',
    'tc.pm2Down': 'pm2가 응답하지 않아요 — 봇 상태를 읽을 수 없어요.',
    'tray.open': '패널 열기',
    'tray.game': '게임 모드: {v}',
    'tray.on': '켜짐 ✔',
    'tray.off': '꺼짐',
    'tray.update': '🔄 업데이트 준비 완료 — 적용 & 재시작',
    'tray.quit': '종료',
    'tray.tipBots': 'Hasu Panel — 봇 {on}/{total}개 온라인',
    'tray.online': ' (온라인)',
    'tray.solo': ' (싱글)',
    'tray.cut': ' · 봇 {n}개 정지',
    'tray.low': ' · 🌐 인터넷 절약',
    'blk.game': '게임 실행 중',
    'blk.unknown': '게임 중인지 알 수 없음',
    'blk.busy': '게임 모드 전환 중',
    'blk.action': '봇 작업 진행 중',
    'blk.stopAll': '전체 정지 진행 중',
    'blk.parked': '게임 모드가 정지한 봇',
    'blk.lownet': '인터넷 절약 작동 중',
    'blk.window': '창 열림',
    'blk.grace': '유예 시간',
    'set.lastScan': '(마지막 검색: {d})',
    'set.noScan': '(아직 검색한 적 없음)',
    'set.devOnly': '(.exe 버전에서만 작동)',
    'bots.netTitle': '봇의 네트워크 사용량, 입출력으로 측정 (Discord 봇이면 거의 전부 네트워크 + 약간의 SQLite 디스크) — ↓ 받음 · ↑ 보냄',
    'bots.parked': '⏸ 게임 모드로 정지됨',
    'bots.autobootTitle': 'Windows에 로그인하면 다시 켜짐',
    'bots.gamestopTitle': '게임이 감지되면 정지 (‘체크한 봇’ 모드)',
    'bots.logsTitle': '최근 로그 보기 (크래시, 오류…)',
    'bots.folderTitle': '탐색기에서 봇 폴더 열기',
    'bots.removeTitle': '이 봇을 정지하고 pm2에서 제거 (파일은 건드리지 않아요)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — 이게 뭐예요?</h2>
  <p><b>네 봇 전부</b>를 위한 제어판이에요: 봇들은 <b>pm2</b> 덕분에 백그라운드에서 돌아가고, 콘솔을 건드리지 않고 여기서 관리해요.</p>
  <h3>🤖 봇 목록</h3>
  <p>한 줄이 봇 하나. <b style="color:#3ba55d">초록</b> 점은 켜짐, 회색은 정지, <b style="color:#ed4245">빨강</b>은 오류. 버튼: ▶ 시작 · ⏹ 정지 · ⟳ 재시작 · <b>📄 로그</b>.</p>
  <p><b>📄 로그</b>는 봇의 <b>마지막 줄들</b>(오류, 크래시…)을 보여줘요 — <b>터미널을 열지 않고</b> 왜 죽었는지 알아보기 좋아요.</p>
  <p><b>자동 시작</b>: 체크하면 → PC를 켤 때 봇이 알아서 다시 켜져요. 체크를 풀면 → 시작할 때 꺼진 채로 있어요.</p>
  <p><b>⏹ 전부 정지</b>(목록 위)는 <b>켜져 있는 봇을 전부</b> 한 번에 정지해요. 안전장치: 확인하려면 <b>두 번</b> 눌러야 해요.</p>
  <p>정지할 때마다 패널이 뒷정리를 해요: <b>봇이 띄운 작은 프로그램들</b>(음악 봇의 ffmpeg, 진행 중인 설치…)이 살아남아 PC를 어지럽히던 것도 이제 <b>깨끗하게 종료</b>돼요.</p>
  <p>켜져 있어야 할 봇이 꺼져 있으면 목록 맨 위에 <b>배너</b>가 뜨고, <b>‘다시 켜기’</b> 버튼이 한 번에 전부 재시작해요. 개수는 <b>진짜로 살아난 봇만</b> 세어요: 봇이 시작을 거부하면(폴더 이동, 파일 없음) 성공했다고 하지 않고 그대로 알려줘요.</p>
  <h3>🔔 봇이 죽으면 알림 받기</h3>
  <p>이게 패널의 존재 이유예요: 봇이 죽은 걸 <b>사흘 뒤에</b> 알게 되는 일은 이제 없어요. 봇이 죽거나 재시작을 반복하면 <b>조용한 Windows 알림</b>과 <b>부드러운 소리</b>(크기 조절 가능)를 받고, 알림에는 <b>원인이 쉬운 말로</b> 적혀요 — 인터넷 끊김, 토큰 오류, 모듈 없음, 메모리 부족…</p>
  <p>가장 쓸모 있는 건 역시 <b>Discord webhook</b>이에요: 게임 한복판이든 PC 앞에 없든 알려줘요. Discord에서: <b>채널 설정 → 연동 → webhook → 새 webhook → URL 복사</b>, 그다음 ⚙️ 설정에 붙여넣으세요.</p>
  <p>패널은 <b>고장</b>과 <b>일부러 끈 것</b>을 구분해요: 네가 봇을 직접 껐다면 — 패널에서<i>든</i> 터미널에서<i>든</i> — 알리지도 않고 다음 부팅 때 다시 켜지도 않아요. PC가 절전에서 깨어날 때와 실행 직후에도 네트워크가 돌아올 때까지 조용히 있어서, 엉터리 알림이 쏟아지지 않아요.</p>
  <p>보내기가 실패하면 — 보통 고장의 정체가 바로 인터넷 끊김이니까 — 알림을 잃어버리는 대신 <b>다시 시도</b>해요. 그리고 pm2 자체가 응답을 멈추면 패널이 알려줘요: 그게 없으면 아무 알림도 불가능해지고, 그 침묵이 ‘다 괜찮음’처럼 보일 테니까요.</p>
  <h3>➕ 봇 가져오기</h3>
  <p>평소에 손으로 실행하던 봇이 있어요? (예를 들어 <b>Visual Studio</b>에서 <code>node index.js</code>로) ‘가져오기’를 누르고(<b>파일</b> 또는 <b>폴더 전체</b> — 폴더면 메인 파일을 알아서 찾아요), 이름을 붙이면 끝이에요:</p>
  <p>• Visual Studio를 닫아도 <b>백그라운드에서</b> 돌아가요;<br>• 죽으면 <b>알아서 재시작</b>해요;<br>• <b>PC를 재부팅해도 살아남아요</b>;<br>• 여기서 <b>다른 봇들처럼</b> 관리해요 (자동 시작, 게임 모드…).</p>
  <p>🗑 버튼은 봇을 정지하고 pm2에서 빼요 — <b>파일은 절대 건드리지 않아요</b>.</p>
  <h3>🎮 게임 모드</h3>
  <p>목록에 있는 게임이 감지되면(Fortnite, Valorant…), 네가 게임하는 동안 PC를 비워주려고 패널이 <b>골라둔 봇들을 정지</b>하고, 게임을 닫은 뒤 약 1분 후에 <b>자동으로 다시 켜요</b>. 선택은 네 몫: <b>모든</b> 봇을 끄거나, ‘게임 중 정지’를 체크한 봇만.</p>
  <p><b>싱글 플레이?</b> 패널은 게임이 <b>정말 인터넷에 연결됐는지</b> 확인해요: 싱글/오프라인 플레이는 아무것도 끄지 않아요(‘싱글 플레이 게임 무시’ 옵션). 예: GTA V 스토리 모드 → 봇 유지; GTA Online → 게임 모드 작동.</p>
  <h3>🕹️ 감지할 게임 추가하기</h3>
  <p>세 가지 방법: <b>📋 실행 중인 프로그램</b>(게임을 켜고 목록에서 고르기 — 가장 정확하고, 게임이 아닌 프로그램에도 통해요), <b>📁 .exe 고르기</b>(디스크 탐색), <b>🔍 검색</b>(Steam/Epic 라이브러리를 뒤져서 목록에 없는 설치된 게임을 제안).</p>
  <p>디스크 검색은 <b>절대 계속 돌지 않아요</b>: 자동으로 <b>하루 1번</b>까지(⚙️ 설정에서 끌 수 있어요), 또는 네가 ‘검색’을 누를 때. 상시 감시는 프로세스 목록만 읽어서 부담이 거의 없어요.</p>
  <h3>🌐 인터넷 사용 줄이기</h3>
  <p>켜두면 <b>온라인 게임에 네트워크 우선권</b>을 줘요: 게임 중에 봇들은 <b>큰 다운로드</b>(사기 방지 목록, 암호화 백업)를 미루고 <b>낮은 우선순위</b>로 내려가요 — 인터넷이 느릴수록 더 강하게(자동 측정). 게임이 끝나면 전부 원래대로 돌아와요. 게임 모드와는 별개라서, 봇을 <i>렉 없이</i> 계속 켜두기에 딱이에요.</p>
  <h3>🔄 자동 업데이트</h3>
  <p>패널은 <b>스스로 업데이트해요</b>: 실행할 때 확인하고 그다음 6시간마다, 전부 <b>이 창 안에서</b> 이뤄져요. 새 버전이 발견되면 위에 카드가 나타나요: 퍼센트·속도·용량이 붙은 <b>진행 막대</b>, 그다음 <b>이번 버전의 새 소식</b>과 <b>‘설치하고 재시작’</b> 버튼. ‘나중에’는 카드를 숨길 뿐, 설치는 그대로 진행돼요.</p>
  <p>원칙적으로 <b>누를 게 없어요</b>: 안전해지는 즉시 업데이트가 알아서 설치돼요. 게임 중에도, 봇 작업 중에도, 네가 창을 보고 있는 동안에도 <b>절대</b> 하지 않아요 — 카드가 <b>무엇을 기다리는지</b> 알려줘요. 창을 닫으면 적용돼요. (⚙️ 설정에서 끌 수 있고, ‘업데이트 확인’ 버튼으로 강제 확인도 돼요.)</p>
  <h3>🔋 가벼운 자원 사용</h3>
  <p>패널은 24시간 내내 티 안 나게 돌아가요: <b>알림 영역으로 최소화돼 있으면</b> <b>감시를 느리게</b> 하고 아무도 안 보는 화면 계산을 멈춰요. 창을 다시 열면 전부 즉시 돌아와요. (게임 모드나 인터넷 사용 줄이기가 작동 중이면 놓치는 게 없도록 계속 반응해요.)</p>
  <h3>🎮 내 Discord 상태</h3>
  <p>‘Rich Presence’ 옵션을 켜면 Discord 프로필에 <b>‘🤖 봇 X개 관리 중’</b>(그리고 지금 하는 게임)이 표시돼요. <b>설정할 건 없어요</b> — Discord가 켜져 있기만 하면 돼요. 순전히 장식이고, ⚙️ 설정에서 끌 수 있어요.</p>
  <h3>🧰 새 PC에서 (친구 집에서)</h3>
  <p>봇에는 <b>Node.js</b>와 <b>pm2</b>가 필요해요. 둘 중 하나가 없으면 패널이 <b>알아채고</b>, 빈 목록을 보여주는 대신 알맞은 버튼(‘Node.js 내려받기’ 또는 ‘pm2 설치’)을 띄워요.</p>
  <h3>📁 알아두면 좋은 것</h3>
  <p>• 창의 닫기 버튼은 창을 <b>알림 영역으로 최소화해요</b>(시계 옆). 종료하려면: 아이콘 우클릭 → 종료.<br>• 설정은 <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>에, 기록은 <code>panel.log</code>에 저장돼요.<br>• 설정의 <b>백업 사본</b>이 바로 옆에(<code>.bak</code>) 최신으로 유지되고, 원본이 읽히지 않거나 더 이상 기록되지 않으면 자동으로 이어받아요. 저장이 안 되면 <b>빨간 배너</b>가 알려줘요 — 설정이 안전하다고 착각하게 두는 대신에요.<br>• 패널은 Windows와 함께 알아서 실행돼요 (⚙️ 설정에서 끌 수 있어요).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['ko'] = L; }
})();
