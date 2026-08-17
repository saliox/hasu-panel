// Português (BR) — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: 'Português (BR)', ui: {
    'app.sub': 'gerenciador de bots pm2 · modo jogo',
    'btn.about': 'ℹ️ Sobre',
    'btn.lang': '🇫🇷 Français',
    'btn.langTitle': 'Voltar o panel para o francês',
    'banner.loading': 'Carregando…',
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Importar (arquivo)',
    'bots.importTitle': 'Escolher o arquivo principal do bot (index.js, bot.py…)',
    'bots.importDir': '📁 Importar (pasta)',
    'bots.importDirTitle': 'Escolher a PASTA do bot — o arquivo principal é detectado sozinho',
    'bots.stopAll': '⏹ Parar tudo',
    'bots.stopAllTitle': 'Parar TODOS os bots online (clique uma 2ª vez para confirmar)',
    'bots.stopAllArm': '⏹ Confirmar?',
    'bots.stopAllBusy': '⏳ Parando…',
    'bots.stopAllDone': '✅ {n} parado(s)',
    'bots.stopAllFail': '⚠️ Falhou',
    'bots.hint': '"Auto boot": o bot volta a ficar online quando você entra no Windows. "Parar no jogo": esse bot é parado quando o modo jogo dispara (se estiver em "só os bots marcados").',
    'bots.none': 'Nenhum bot gerenciado pelo pm2 por enquanto. Importe um com "➕ Importar" aí em cima.',
    'bots.searching': '⏳ Procurando os bots…',
    'bots.imported': '🧩 Bots importados',
    'bots.autoboot': 'Auto boot',
    'bots.gamestop': 'Parar no jogo',
    'bots.logs': '📄 Logs',
    'bots.folder': '📂',
    'bots.remove': '🗑',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Religar tudo',
    'bots.fixBanner': '<b>{n}</b> bot(s) deveriam estar online',
    'bots.fixDone': '✅ {n} religado(s)',
    'bots.fixPartial': '⚠️ {n} religado(s), {k} ainda offline',
    'gm.title': '🎮 Modo jogo',
    'gm.enable': 'Parar bots quando um jogo for detectado',
    'gm.all': 'Todos os bots',
    'gm.some': 'Só os bots marcados "Parar no jogo"',
    'gm.grace': 'Religar os bots {input} s depois que o jogo fechar',
    'gm.soloskip': 'Ignorar jogos <b>solo</b> <span class="mut12">(só parar se o jogo estiver mesmo online)</span>',
    'gm.banner': '🎮 <b>Jogo online:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> detectado — partida <b>solo</b>: os bots continuam online',
    'gm.bannerCut': ' — <b>{n} bot(s) parado(s)</b> (religados sozinhos no fim da partida)',
    'gm.bannerNone': ' — nenhum bot para parar',
    'gm.bannerOff': ' — modo jogo desativado',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bots online — nenhum jogo detectado',
    'lownet.title': '🌐 Baixo uso de internet',
    'lownet.enable': 'Prioridade de rede para o jogo online',
    'lownet.hint': 'Durante uma partida online: os downloads pesados dos bots (listas anti-golpe, backups criptografados) ficam em pausa e a prioridade deles cai — mais rígido ainda se sua conexão for lenta. Tudo volta ao normal no fim da partida. Independente do modo jogo: útil para os bots que você deixa rodando.',
    'lownet.active': ' · 🌐 baixo uso de internet ativo',
    'lownet.broken': ' · ⚠️ baixo uso de internet: prioridades aplicadas, mas o sinal não chegou aos bots',
    'games.title': '🕹️ Jogos detectados (processos)',
    'games.ph': 'MeuJogo.exe',
    'games.add': 'Adicionar',
    'games.pick': '📋 Programas abertos',
    'games.pickTitle': 'Escolher entre as janelas abertas (abra o jogo antes)',
    'games.exe': '📁 Escolher um .exe',
    'games.exeTitle': 'Procurar no disco o .exe do jogo',
    'games.scan': '🔍 Escanear',
    'games.scanTitle': 'Procura jogos instalados (Steam, Epic) que faltam na lista',
    'games.hint': '"Programas abertos" lista o que está rodando no SEU PC (um jogo, ou qualquer programa que a lista padrão não conhece): abra o jogo e escolha — é o jeito mais preciso. "Escanear" vasculha as bibliotecas Steam/Epic (1×/dia automático, nunca sem parar).',
    'set.title': '⚙️ Ajustes',
    'set.autolaunch': 'Abrir o panel junto com o Windows',
    'set.poll': 'Verificar jogos / bots a cada {input} segundos',
    'set.scanauto': 'Procurar jogos recém-instalados <b>1×/dia</b>',
    'set.scanHint': 'A verificação acima só lê a lista de processos (bem leve). Já o escaneamento do disco <b>nunca roda sem parar</b>: 1×/dia no máximo, ou pelo botão "🔍 Escanear".',
    'set.saveInfoTitle': 'O pm2 restaura essa lista quando o PC liga — ela é regravada sempre que um bot é iniciado ou parado aqui.',
    'set.saved': 'Último salvamento do pm2: {d}',
    'set.savedNever': 'Nenhum salvamento do pm2 por este panel ainda.',
    'alerts.title': '🔔 Alertas (bot que cai)',
    'alerts.enable': 'Me avisar quando um bot <b>cair</b> ou <b>reiniciar em loop</b>',
    'alerts.toast': 'Notificação do Windows (só serve se eu estiver na frente do PC)',
    'alerts.sound': 'Som discreto junto com a notificação',
    'alerts.volTitle': 'Volume do som',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (te avisa até no meio do jogo)',
    'alerts.test': 'Testar',
    'alerts.hint': 'O <b>webhook do Discord</b> é o mais útil: ele te alcança no meio da partida ou longe do PC. No Discord: <b>Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL</b>. O alerta diz <b>a causa em bom português</b> (internet caiu, token inválido, módulo faltando…).',
    'alerts.suppressed': ' — ⚠️ {n} alerta(s) adiado(s) nesta hora (limite anti-spam).',
    'rpc.title': '🎮 Rich Presence do Discord',
    'rpc.enable': 'Mostrar "🤖 Cuidando de X bots online" no meu perfil do Discord',
    'rpc.idPh': 'Deixe vazio — a aplicação Hasu Panel é usada por padrão',
    'rpc.hint': 'Nada para configurar: funciona assim que você ativa (basta o <b>Discord estar aberto</b> neste PC). O campo acima só importa se você quiser mostrar a <b>sua própria</b> aplicação do Discord — nesse caso, cole o <b>Application ID</b> dela (discord.com/developers/applications → General Information).',
    'rpc.off': ' — desativada.',
    'rpc.on': ' — ✅ ativada.',
    'rpc.needId': ' — ⚠️ cole o seu Application ID para ativar.',
    'upd.title': '🔄 Atualizações',
    'upd.version': 'Versão:',
    'upd.check': 'Procurar atualizações',
    'upd.apply': 'Reiniciar e aplicar',
    'upd.auto': 'Instalar as atualizações <b>sozinho</b> <span class="mut11">(nunca no meio de uma partida nem de uma ação nos bots)</span>',
    'upd.searching': '⏳ Procurando atualização…',
    'upd.dev': 'ℹ️ O auto-update só funciona na versão instalada (Setup.exe), não em desenvolvimento.',
    'upd.uptodate': '✅ Você já está na última versão ({v}).',
    'upd.availableMsg': '⬇️ Nova versão <b>{v}</b> encontrada — baixando, fica pronta num instante.',
    'upd.readyMsg': '✅ <b>Atualização pronta</b> — clique em "Reiniciar e aplicar".',
    'upd.errorMsg': '⚠️ Não dá para verificar agora{d}. Tente de novo mais tarde.',
    'upd.unexpected': '⚠️ Resposta inesperada.',
    'upd.cardDownloading': 'Baixando a atualização…',
    'upd.cardReady': 'Atualização pronta para instalar',
    'upd.cardAvailable': 'Nova versão disponível',
    'upd.cardPreparing': 'preparando…',
    'upd.cardBroken': 'Atualização interrompida',
    'upd.install': 'Instalar e reiniciar',
    'upd.later': 'Depois',
    'upd.laterTitle': 'Esconder este cartão',
    'upd.retry': 'Tentar de novo',
    'upd.restarting': 'Reiniciando…',
    'upd.whyManual': 'Instalação automática desligada — aplique quando quiser.',
    'upd.whyWaiting': 'Ela vai se instalar sozinha assim que der — esperando: {list}.',
    'upd.whyWindow': 'Ela vai se instalar sozinha assim que você fechar esta janela.',
    'heal.title': '🔧 Reinício automático',
    'heal.enable': 'Reiniciar sozinho um bot <b>caído</b> <span class="mut11">(depois de 5 min, depois 15 min, depois 1 h)</span>',
    'heal.hint': 'Quando o pm2 esgota as próprias tentativas, o bot fica morto até você perceber. O panel tenta de novo no seu lugar e <b>para depois de 3 tentativas</b>: um bot que se recusa a voltar três vezes tem um problema de verdade, e o alerta precisa continuar visível. Ele nunca mexe num bot que <b>você</b> parou, nem num bot parado pelo modo jogo.',
    'inc.title': '📓 Últimos incidentes',
    'inc.none': 'Nenhum incidente registrado. Isso é bom sinal.',
    'cfg.failTitle': 'Seus ajustes não estão mais sendo salvos',
    'cfg.failBody': 'Eles ficam guardados numa cópia de segurança e continuam valendo, mas o arquivo principal recusa a gravação.',
    'cfg.failWhy': 'Arquivo: {path} — olhe o antivírus, alguma sincronização de pasta, ou um disco cheio.',
    'logs.title': 'Logs de {name}',
    'logs.out': 'Saída',
    'logs.err': 'Erros',
    'logs.filterPh': 'Filtrar…',
    'logs.copy': 'Copiar',
    'logs.openFolder': '📂 Pasta dos logs',
    'logs.close': 'Fechar',
    'logs.empty': 'Nenhum log por enquanto.',
    'logs.unreadable': 'O arquivo de log existe, mas não deu para ler (travado, ou acesso negado).',
    'logs.noMatch': 'Nenhuma linha contém "{q}".',
    'logs.failed': 'Não deu para ler os logs.',
    'tc.pm2Missing': '<b>⚠️ O pm2 não está instalado.</b><br>O pm2 é a ferramenta que mantém seus bots online. Clique para instalar automaticamente (sem direitos de administrador).',
    'tc.pm2Install': 'Instalar o pm2',
    'tc.pm2Busy': ' ⏳ instalando o pm2… (até 1 min)',
    'tc.pm2Ok': ' ✅ pm2 instalado!',
    'tc.pm2NoNode': ' ❌ Node.js é necessário antes.',
    'tc.pm2Fail': ' ❌ Falhou — tente de novo, ou instale o pm2 na mão.',
    'tc.pm2Down': 'O pm2 parou de responder — não dá para ler o estado dos bots.',
    'tray.open': 'Abrir o panel',
    'tray.game': 'Modo jogo: {v}',
    'tray.on': 'ativado ✔',
    'tray.off': 'desativado',
    'tray.update': '🔄 Atualização pronta — aplicar e reiniciar',
    'tray.quit': 'Sair',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bots online',
    'tray.online': ' (online)',
    'tray.solo': ' (solo)',
    'tray.cut': ' · {n} bot(s) parado(s)',
    'tray.low': ' · 🌐 rede econômica',
    'blk.game': 'jogo rodando',
    'blk.unknown': 'não dá para saber se tem jogo rodando',
    'blk.busy': 'troca de modo jogo em andamento',
    'blk.action': 'ação num bot em andamento',
    'blk.stopAll': 'parada geral em andamento',
    'blk.parked': 'bots parados pelo modo jogo',
    'blk.lownet': 'baixo uso de internet ativo',
    'blk.window': 'janela aberta',
    'blk.grace': 'tempo de espera',
    'upd.readyManual': '✅ <b>Atualização pronta</b> — clique em "Reiniciar e aplicar" (instalação automática desligada).',
    'upd.readyWaiting': '✅ <b>Atualização pronta</b> — ela vai se instalar sozinha assim que der.<br><span style="opacity:.75">Esperando: {list}.</span> Você também pode aplicar agora.',
    'upd.readySoon': '✅ <b>Atualização pronta</b> — instalação automática a qualquer momento…',
    'set.lastScan': '(último escaneamento: {d})',
    'set.noScan': '(nenhum escaneamento por enquanto)',
    'set.devOnly': '(só funciona na versão .exe)',
    'bots.netTitle': 'Rede do bot, medida pelas entradas/saídas dele (num bot do Discord, quase só rede mais um pouco de disco do SQLite) — ↓ recebido · ↑ enviado',
    'bots.parked': '⏸ parado pelo modo jogo',
    'bots.autobootTitle': 'Volta a ficar online quando você entra no Windows',
    'bots.gamestopTitle': 'Parado quando um jogo é detectado (modo "bots marcados")',
    'bots.logsTitle': 'Ver os logs recentes (travadas, erros…)',
    'bots.folderTitle': 'Abrir a pasta do bot no Explorador',
    'bots.removeTitle': 'Parar e tirar este bot do pm2 (os arquivos dele não são tocados)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — o que é isso?</h2>
  <p>Um painel de controle para <b>todos os seus bots</b>: eles rodam em segundo plano graças ao <b>pm2</b>, e você cuida deles aqui sem encostar num console.</p>
  <h3>🤖 A lista dos bots</h3>
  <p>Uma linha por bot. Bolinha <b style="color:#3ba55d">verde</b> = online, cinza = parado, <b style="color:#ed4245">vermelha</b> = com erro. Botões: ▶ iniciar · ⏹ parar · ⟳ reiniciar · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b>: mostra as <b>últimas linhas do bot</b> (erros, travadas…) — prático para entender por que ele caiu, <b>sem abrir terminal</b>.</p>
  <p><b>Auto boot</b>: marcado → o bot volta a ficar online sozinho quando você liga o PC. Desmarcado → ele fica desligado na inicialização.</p>
  <p><b>⏹ Parar tudo</b> (em cima da lista) para <b>todos os bots online</b> de uma vez. Segurança: é preciso clicar <b>duas vezes</b> para confirmar.</p>
  <p>A cada parada o panel faz a faxina: os <b>programinhas abertos por um bot</b> (o ffmpeg da música, uma instalação em andamento…) que sobreviviam e entupiam o PC também são <b>fechados direitinho</b>.</p>
  <p>Se um bot que deveria estar rodando está desligado, aparece uma <b>faixa</b> no topo da lista com o botão <b>"Religar tudo"</b>, que religa todos de uma vez. Ele só conta o que <b>voltou de verdade</b>: se um bot se recusa a iniciar (pasta movida, arquivo faltando), ele te avisa em vez de anunciar sucesso.</p>
  <h3>🔔 Ser avisado quando um bot cai</h3>
  <p>É para isso que o panel existe: nunca mais descobrir <b>três dias depois</b> que um bot está morto. Quando um bot cai ou reinicia em loop, você recebe uma <b>notificação discreta do Windows</b> com um <b>som suave</b> (volume ajustável), e o alerta diz <b>a causa em bom português</b> — internet caiu, token inválido, módulo faltando, memória estourada…</p>
  <p>O mais útil continua sendo o <b>webhook do Discord</b>: ele te alcança no meio da partida, ou quando você não está na frente do PC. No Discord: <b>Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL</b>, depois cole em ⚙️ Ajustes.</p>
  <p>O panel sabe distinguir uma <b>pane</b> de uma <b>parada de propósito</b>: se você mesmo parar um bot — pelo panel <i>ou</i> por um terminal — ele não te alerta, não religa o bot e não o traz de volta na próxima inicialização. Ele também fica quieto quando o PC acorda e logo depois de abrir, enquanto a rede volta, para não disparar uma rajada de alertas à toa.</p>
  <p>Se o envio falhar — normalmente porque a pane é justamente a internet caída — o alerta é <b>reenviado</b> em vez de se perder. E se o próprio pm2 parar de responder, o panel te avisa: sem isso, nenhum alerta seria possível e o silêncio pareceria "está tudo bem".</p>
  <h3>➕ Importar um bot</h3>
  <p>Tem um bot que você costuma iniciar na mão (pelo <b>Visual Studio</b> com <code>node index.js</code>, por exemplo)? Clique em "Importar" (<b>arquivo</b> ou <b>pasta inteira</b> — nesse caso o arquivo principal é detectado sozinho), dê um nome a ele, e pronto:</p>
  <p>• ele roda <b>em segundo plano</b>, mesmo com o Visual Studio fechado;<br>• ele <b>reinicia sozinho</b> se travar;<br>• ele <b>sobrevive aos reinícios do PC</b>;<br>• ele é gerenciado aqui <b>como os outros</b> (auto boot, modo jogo…).</p>
  <p>O botão 🗑 encerra o bot e o tira do pm2 — <b>os arquivos dele nunca são tocados</b>.</p>
  <h3>🎮 O modo jogo</h3>
  <p>Quando um jogo da lista é detectado (Fortnite, Valorant…), o panel <b>para os bots escolhidos</b> para liberar o PC enquanto você joga, e depois <b>religa todos sozinho</b> mais ou menos 1 minuto depois que o jogo fecha. Você escolhe: parar <b>todos</b> os bots, ou só os marcados "Parar no jogo".</p>
  <p><b>Jogo solo?</b> O panel verifica se o jogo está <b>mesmo conectado à internet</b>: uma partida solo/offline não para nada (opção "Ignorar jogos solo"). Exemplo: GTA V no modo história → bots mantidos; GTA Online → modo jogo disparado.</p>
  <h3>🕹️ Adicionar um jogo à detecção</h3>
  <p>Três jeitos: <b>📋 Programas abertos</b> (abra o jogo e escolha na lista — o mais preciso, e funciona para qualquer programa), <b>📁 Escolher um .exe</b> (procurar no disco), ou <b>🔍 Escanear</b> (vasculha as bibliotecas Steam/Epic e sugere os jogos instalados que faltam na lista).</p>
  <p>O escaneamento do disco <b>nunca roda sem parar</b>: automaticamente <b>1×/dia</b> no máximo (dá para desligar em ⚙️ Ajustes), ou quando você clica em "Escanear". Já a vigilância permanente só lê a lista de processos — praticamente de graça.</p>
  <h3>🌐 Baixo uso de internet</h3>
  <p>Ligado, esse modo dá <b>prioridade de rede ao jogo online</b>: durante a partida, os bots adiam seus <b>downloads pesados</b> (listas anti-golpe, backups criptografados) e caem para <b>prioridade baixa</b> — mais rígido quanto mais lenta for sua conexão (medida sozinho). No fim da partida, tudo volta ao normal. Independente do modo jogo: perfeito para manter um bot online <i>sem</i> que ele faça o PC travar.</p>
  <h3>🔄 Atualizações automáticas</h3>
  <p>O panel <b>se atualiza sozinho</b>: ele verifica ao abrir e depois a cada 6 h, e tudo acontece <b>dentro da janela</b>. Um cartão aparece no topo assim que uma versão é encontrada: <b>barra de progresso</b> com porcentagem, velocidade e tamanho, depois as <b>novidades da versão</b> e um botão <b>"Instalar e reiniciar"</b>. "Depois" esconde o cartão — mas a instalação continua normalmente.</p>
  <p>Em princípio você <b>não precisa clicar em nada</b>: a atualização se instala sozinha assim que não tem risco. Ela <b>nunca</b> faz isso no meio de uma partida, nem durante uma ação nos bots, nem enquanto você está olhando a janela — o cartão te diz justamente <b>o que ela está esperando</b>. Feche a janela e ela é aplicada. (Dá para desligar em ⚙️ Ajustes, com o botão "Procurar atualizações" para forçar uma verificação.)</p>
  <h3>🔋 Leve nos recursos</h3>
  <p>O panel roda 24 h por dia sem incomodar: quando está <b>minimizado na área de notificação</b>, ele <b>desacelera a vigilância</b> e para de calcular a tela que ninguém está vendo. Assim que você reabre a janela, tudo volta a ser instantâneo. (Se o modo jogo ou o baixo uso de internet estiver ativo, ele continua reativo para não perder nada.)</p>
  <h3>🎮 Sua presença no Discord</h3>
  <p>Opção "Rich Presence": seu perfil do Discord mostra <b>"🤖 Cuidando de X bots online"</b> (e o jogo atual). <b>Nada para configurar</b> — basta o Discord estar aberto. Puramente decorativo, dá para desligar em ⚙️ Ajustes.</p>
  <h3>🧰 Num PC novo (o de um amigo)</h3>
  <p>Os bots precisam do <b>Node.js</b> e do <b>pm2</b>. Se faltar um dos dois, o panel <b>detecta</b> e oferece o botão certo ("Baixar o Node.js" ou "Instalar o pm2") em vez de mostrar uma lista vazia.</p>
  <h3>📁 Bom saber</h3>
  <p>• O X da janela <b>minimiza na área de notificação</b> (do lado do relógio). Para sair: clique com o botão direito no ícone → Sair.<br>• Ajustes salvos em <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, o registro em <code>panel.log</code>.<br>• Uma <b>cópia de segurança</b> dos ajustes é mantida ao lado (<code>.bak</code>) e retomada sozinha se o arquivo principal ficar ilegível ou parar de ser gravado. Se o salvamento parar de funcionar, uma <b>faixa vermelha</b> te avisa — em vez de deixar você achar que seus ajustes estão salvos.<br>• O panel abre sozinho com o Windows (dá para desligar em ⚙️ Ajustes).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['pt'] = L; }
})();
