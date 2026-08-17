// Español — traduction de l'interface du Hasu Panel.
//
// FORMAT (à respecter à l'identique dans toutes les langues) :
//  • `ui` : une entrée par clé. Les clés sont IDENTIQUES dans toutes les langues — ne jamais en
//    ajouter, retirer ni renommer ici : c'est le français (fr.js) qui fait référence.
//  • les emplacements {x} doivent être CONSERVÉS tels quels : ils reçoivent des valeurs à l'exécution.
//  • les balises HTML (<b>, <span class="mut11">, <br>) doivent être conservées elles aussi.
//  • `about` : le corps de la fenêtre « À propos ». {v} y reçoit le numéro de version.
// Un test (test/i18n.test.js) vérifie la parité des clés et des emplacements à chaque `npm test`.
(function () {
  const L = { nom: 'Español', ui: {
    'app.sub': 'gestión de bots pm2 · modo juego',
    'btn.about': 'ℹ️ Acerca de',
    'btn.langTitle': 'Idioma de la interfaz',
    'banner.loading': 'Cargando…',
    'bots.title': '🤖 Bots (pm2)',
    'bots.import': '➕ Importar (archivo)',
    'bots.importTitle': 'Elige el archivo principal del bot (index.js, bot.py…)',
    'bots.importDir': '📁 Importar (carpeta)',
    'bots.importDirTitle': 'Elige la CARPETA del bot — el archivo principal se detecta automáticamente',
    'bots.stopAll': '⏹ Parar todo',
    'bots.stopAllTitle': 'Parar TODOS los bots en línea (haz clic otra vez para confirmar)',
    'bots.stopAllArm': '⏹ ¿Confirmas?',
    'bots.stopAllBusy': '⏳ Parando…',
    'bots.stopAllDone': '✅ {n} parados',
    'bots.stopAllFail': '⚠️ Ha fallado',
    'bots.hint': '«Auto arranque»: el bot se vuelve a poner en línea al iniciar sesión en Windows. «Parar al jugar»: este bot se para cuando salta el modo juego (si eliges «solo los bots marcados»).',
    'bots.none': 'Todavía no hay ningún bot gestionado por pm2. Añade uno con «➕ Importar» aquí arriba.',
    'bots.searching': '⏳ Buscando bots…',
    'bots.imported': '🧩 Bots importados',
    'bots.autoboot': 'Auto arranque',
    'bots.gamestop': 'Parar al jugar',
    'bots.uptime': '⏱ {v}',
    'bots.fix': 'Volver a levantar',
    'bots.fixBanner': '<b>{n}</b> bot(s) deberían estar en línea',
    'bots.fixDone': '✅ {n} reiniciados',
    'bots.fixPartial': '⚠️ {n} reiniciados, {k} siguen fuera de línea',
    'gm.title': '🎮 Modo juego',
    'gm.enable': 'Parar bots cuando se detecte un juego',
    'gm.all': 'Todos los bots',
    'gm.some': 'Solo los bots marcados «Parar al jugar»',
    'gm.grace': 'Reiniciar los bots {input} s después de cerrar el juego',
    'gm.soloskip': 'Ignorar los juegos <b>de un jugador</b> <span class="mut12">(parar solo si el juego está realmente en línea)</span>',
    'gm.banner': '🎮 <b>Juego en línea:</b>&nbsp;{game}',
    'gm.bannerSolo': '🎮 <b>{game}</b> detectado — partida <b>de un jugador</b>: los bots siguen en línea',
    'gm.bannerCut': ' — <b>{n} bot(s) parados</b> (se reinician solos al terminar la partida)',
    'gm.bannerNone': ' — ningún bot que parar',
    'gm.bannerOff': ' — modo juego desactivado',
    'gm.online': '🟢 <b>{on}/{total}</b>&nbsp;bots en línea — ningún juego detectado',
    'lownet.title': '🌐 Uso bajo de internet',
    'lownet.enable': 'Dar prioridad de red al juego en línea',
    'lownet.hint': 'Durante una partida en línea: las descargas grandes de los bots (listas antiestafa, copias de seguridad cifradas) se pausan y su prioridad baja — más estricto todavía si tu conexión es lenta. Todo vuelve a la normalidad al terminar la partida. Independiente del modo juego: útil para los bots que dejas funcionando.',
    'lownet.active': ' · 🌐 uso bajo de internet activo',
    'lownet.broken': ' · ⚠️ uso bajo de internet: prioridades aplicadas, pero la señal enviada a los bots no ha llegado',
    'games.title': '🕹️ Juegos detectados (procesos)',
    'games.ph': 'MiJuego.exe',
    'games.add': 'Añadir',
    'games.pick': '📋 Programas abiertos',
    'games.pickTitle': 'Elige entre las ventanas abiertas (abre el juego primero)',
    'games.exe': '📁 Elegir un .exe',
    'games.exeTitle': 'Explorar el disco para elegir el .exe del juego',
    'games.scan': '🔍 Escanear',
    'games.scanTitle': 'Busca juegos instalados (Steam, Epic) que falten en la lista',
    'games.hint': '«Programas abiertos» lista lo que está funcionando en TU PC (un juego, o cualquier programa que la lista por defecto no conozca): abre el juego y elígelo — es lo más preciso. «Escanear» rebusca en tus bibliotecas de Steam/Epic (1×/día automático, nunca de forma continua).',
    'set.title': '⚙️ Ajustes',
    'set.autolaunch': 'Abrir el panel al iniciar Windows',
    'set.poll': 'Comprobar juegos / bots cada {input} segundos',
    'set.scanauto': 'Buscar juegos recién instalados <b>1×/día</b>',
    'set.scanHint': 'La comprobación de arriba solo lee la lista de procesos (muy ligero). El escaneo del disco, en cambio, <b>nunca funciona de forma continua</b>: 1×/día como mucho, o con el botón «🔍 Escanear».',
    'set.saveInfoTitle': 'pm2 restaura esta lista al arrancar el PC — se vuelve a guardar después de cada arranque/parada hecho aquí.',
    'set.saved': 'Última copia de pm2: {d}',
    'set.savedNever': 'Todavía no se ha guardado pm2 desde este panel.',
    'alerts.title': '🔔 Avisos (bot que se cae)',
    'alerts.enable': 'Avisarme cuando un bot <b>se caiga</b> o <b>reinicie en bucle</b>',
    'alerts.toast': 'Notificación de Windows (solo útil si estoy delante del PC)',
    'alerts.sound': 'Sonido suave con la notificación',
    'alerts.volTitle': 'Volumen del sonido',
    'alerts.webhookPh': 'https://discord.com/api/webhooks/… (te avisa incluso jugando)',
    'alerts.test': 'Probar',
    'alerts.hint': 'El <b>webhook de Discord</b> es el más útil: te llega en plena partida o lejos del PC. En Discord: <b>Ajustes del canal → Integraciones → Webhooks → Nuevo webhook → Copiar URL</b>. El aviso indica <b>la causa en palabras claras</b> (internet caído, token no válido, módulo que falta…).',
    'alerts.suppressed': ' — ⚠️ {n} aviso(s) aplazados esta hora (tope antispam).',
    'rpc.title': '🎮 Rich Presence de Discord',
    'rpc.enable': 'Mostrar «🤖 Gestiona X bots en línea» en mi perfil de Discord',
    'rpc.idPh': 'Déjalo vacío — se usa la aplicación Hasu Panel por defecto',
    'rpc.hint': 'Nada que configurar: funciona en cuanto lo activas (solo hace falta que <b>Discord esté abierto</b> en este PC). El campo de arriba solo sirve si quieres mostrar <b>tu propia</b> aplicación de Discord — en ese caso, pega su <b>Application ID</b> (discord.com/developers/applications → General Information).',
    'rpc.off': ' — desactivada.',
    'rpc.on': ' — ✅ activada.',
    'rpc.needId': ' — ⚠️ pega tu Application ID para activarla.',
    'upd.title': '🔄 Actualizaciones',
    'upd.version': 'Versión:',
    'upd.check': 'Buscar actualizaciones',
    'upd.apply': 'Reiniciar y aplicar',
    'upd.auto': 'Instalar las actualizaciones <b>automáticamente</b> <span class="mut11">(nunca durante una partida ni mientras manejas los bots)</span>',
    'upd.searching': '⏳ Buscando actualización…',
    'upd.dev': 'ℹ️ La actualización automática solo funciona en la versión instalada (Setup.exe), no en desarrollo.',
    'upd.uptodate': '✅ Ya tienes la última versión ({v}).',
    'upd.availableMsg': '⬇️ Nueva versión <b>{v}</b> encontrada — descargando, estará lista en un momento.',
    'upd.readyMsg': '✅ <b>Actualización lista</b> — haz clic en «Reiniciar y aplicar».',
    'upd.errorMsg': '⚠️ No se puede comprobar ahora mismo{d}. Inténtalo más tarde.',
    'upd.unexpected': '⚠️ Respuesta inesperada.',
    'upd.cardDownloading': 'Descargando la actualización…',
    'upd.cardReady': 'Actualización lista para instalar',
    'upd.cardAvailable': 'Nueva versión disponible',
    'upd.cardPreparing': 'preparando…',
    'upd.cardBroken': 'Actualización interrumpida',
    'upd.install': 'Instalar y reiniciar',
    'upd.later': 'Más tarde',
    'upd.laterTitle': 'Ocultar esta tarjeta',
    'upd.retry': 'Reintentar',
    'upd.restarting': 'Reiniciando…',
    'upd.whyManual': 'Instalación automática desactivada — aplícala cuando quieras.',
    'upd.whyWaiting': 'Se instalará sola en cuanto se pueda — en espera de: {list}.',
    'upd.whyWindow': 'Se instalará sola en cuanto cierres esta ventana.',
    'heal.title': '🔧 Reinicio automático',
    'heal.enable': 'Reiniciar automáticamente un bot <b>caído</b> <span class="mut11">(tras 5 min, luego 15 min, luego 1 h)</span>',
    'heal.hint': 'Cuando pm2 ha agotado sus propios reinicios, el bot se queda muerto hasta que te das cuenta. El panel lo reintenta por ti y luego <b>se detiene al cabo de 3 intentos</b>: un bot que se niega a volver tres veces tiene un problema de verdad, y el aviso debe seguir a la vista. Nunca toca un bot que has parado <b>tú</b>, ni uno parado por el modo juego.',
    'inc.title': '📓 Últimos incidentes',
    'inc.none': 'Ningún incidente registrado. Buena señal.',
    'cfg.failTitle': 'Tus ajustes ya no se guardan',
    'cfg.failBody': 'Se conservan en una copia de seguridad y siguen activos, pero el archivo principal no se deja escribir.',
    'cfg.failWhy': 'Archivo: {path} — revisa el antivirus, la sincronización de una carpeta o un disco lleno.',
    'logs.title': 'Logs de {name}',
    'logs.out': 'Salida',
    'logs.err': 'Errores',
    'logs.filterPh': 'Filtrar…',
    'logs.copy': 'Copiar',
    'logs.openFolder': '📂 Carpeta de logs',
    'logs.close': 'Cerrar',
    'logs.empty': 'Todavía no hay logs.',
    'logs.unreadable': 'El archivo de log existe, pero no se ha podido leer (bloqueado, o acceso denegado).',
    'logs.noMatch': 'Ninguna línea contiene «{q}».',
    'logs.failed': 'No se han podido leer los logs.',
    'tc.pm2Missing': '<b>⚠️ pm2 no está instalado.</b><br>pm2 es la herramienta que mantiene tus bots en línea. Haz clic para instalarlo automáticamente (sin permisos de administrador).',
    'tc.pm2Install': 'Instalar pm2',
    'tc.pm2Busy': ' ⏳ instalando pm2… (hasta 1 min)',
    'tc.pm2Ok': ' ✅ ¡pm2 instalado!',
    'tc.pm2NoNode': ' ❌ Antes hace falta Node.js.',
    'tc.pm2Fail': ' ❌ Ha fallado — reinténtalo o instala pm2 a mano.',
    'tc.pm2Down': 'pm2 ya no responde — no se puede leer el estado de los bots.',
    'tray.open': 'Abrir el panel',
    'tray.game': 'Modo juego: {v}',
    'tray.on': 'activado ✔',
    'tray.off': 'desactivado',
    'tray.update': '🔄 Actualización lista — aplicar y reiniciar',
    'tray.quit': 'Salir',
    'tray.tipBots': 'Hasu Panel — {on}/{total} bots en línea',
    'tray.online': ' (en línea)',
    'tray.solo': ' (un jugador)',
    'tray.cut': ' · {n} bot(s) parados',
    'tray.low': ' · 🌐 ahorro de red',
    'blk.game': 'juego en marcha',
    'blk.unknown': 'posible juego en marcha',
    'blk.busy': 'cambio de modo juego',
    'blk.action': 'acción sobre un bot en curso',
    'blk.stopAll': 'parada global en curso',
    'blk.parked': 'bots parados por el modo juego',
    'blk.lownet': 'uso bajo de internet activo',
    'blk.window': 'ventana abierta',
    'blk.grace': 'periodo de gracia',
    'upd.readyManual': '✅ <b>Actualización lista</b> — haz clic en «Reiniciar y aplicar» (instalación automática desactivada).',
    'upd.readyWaiting': '✅ <b>Actualización lista</b> — se instalará sola en cuanto se pueda.<br><span style="opacity:.75">En espera de: {list}.</span> También puedes aplicarla ahora.',
    'upd.readySoon': '✅ <b>Actualización lista</b> — instalación automática inminente…',
    'set.lastScan': '(último escaneo: {d})',
    'set.noScan': '(todavía sin escaneo)',
    'set.devOnly': '(solo activo en la versión .exe)',
    'bots.netTitle': 'Red del bot, medida por sus entradas/salidas (para un bot de Discord, casi todo red más un poco de disco por SQLite) — ↓ recibido · ↑ enviado',
    'bots.parked': '⏸ parado por el modo juego',
    'bots.autobootTitle': 'Se vuelve a poner en línea al iniciar sesión en Windows',
    'bots.gamestopTitle': 'Se para cuando se detecta un juego (modo «bots marcados»)',
    'bots.logsTitle': 'Ver los logs recientes (fallos, errores…)',
    'bots.folderTitle': 'Abrir la carpeta del bot en el Explorador',
    'bots.removeTitle': 'Parar este bot y quitarlo de pm2 (sus archivos no se tocan)',
  },
  about: `
  <h2>🛡️ Hasu Panel {v} — ¿qué es esto?</h2>
  <p>Un panel de control para <b>todos tus bots</b>: funcionan en segundo plano gracias a <b>pm2</b>, y los gestionas aquí sin tocar la consola.</p>
  <h3>🤖 La lista de bots</h3>
  <p>Cada línea = un bot. Punto <b style="color:#3ba55d">verde</b> = en línea, gris = parado, <b style="color:#ed4245">rojo</b> = con error. Botones: ▶ arrancar · ⏹ parar · ⟳ reiniciar · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b>: muestra las <b>últimas líneas del bot</b> (errores, cuelgues…) — práctico para entender por qué se ha caído, <b>sin abrir un terminal</b>.</p>
  <p><b>Auto arranque</b>: marcado → el bot se vuelve a poner en línea solo cuando enciendes el PC. Sin marcar → se queda apagado al arrancar.</p>
  <p><b>⏹ Parar todo</b> (encima de la lista) para <b>todos los bots en línea</b> de golpe. Seguridad: hay que hacer clic <b>dos veces</b> para confirmar.</p>
  <p>En cada parada el panel hace limpieza: los <b>programillas lanzados por un bot</b> (el ffmpeg de la música, una instalación en curso…) que antes sobrevivían y atascaban el PC se <b>cierran bien</b> también.</p>
  <p>Si un bot que debería estar funcionando está apagado, aparece un <b>banner</b> encima de la lista con el botón <b>«Volver a levantar»</b>, que los reinicia todos de golpe. Solo cuenta lo que <b>ha vuelto de verdad</b>: si un bot se niega a arrancar (carpeta movida, archivo que falta), te lo dice en vez de cantar victoria.</p>
  <h3>🔔 Que te avisen cuando un bot se cae</h3>
  <p>Esta es la razón de ser del panel: no volver a enterarte <b>tres días después</b> de que un bot está muerto. Cuando un bot se cae o reinicia en bucle, recibes una <b>notificación discreta de Windows</b> con un <b>sonido suave</b> (volumen ajustable), y el aviso indica <b>la causa en palabras claras</b> — internet caído, token no válido, módulo que falta, memoria llena…</p>
  <p>Lo más útil sigue siendo el <b>webhook de Discord</b>: te llega en plena partida, o cuando no estás delante del PC. En Discord: <b>Ajustes del canal → Integraciones → Webhooks → Nuevo webhook → Copiar URL</b>, y luego la pegas en ⚙️ Ajustes.</p>
  <p>El panel distingue entre una <b>avería</b> y una <b>parada voluntaria</b>: si paras un bot tú mismo — desde el panel <i>o</i> desde un terminal — no te avisa ni lo vuelve a encender en el siguiente arranque. También se calla al despertar el PC y al arrancar, mientras vuelve la red, para no soltar una ráfaga de avisos falsos.</p>
  <p>Si el envío falla — normalmente porque la avería es justo el corte de internet — el aviso se <b>reintenta</b> en vez de perderse. Y si es pm2 el que deja de responder, el panel te avisa: sin eso, ningún aviso sería posible y el silencio pasaría por «todo va bien».</p>
  <h3>➕ Importar un bot</h3>
  <p>¿Tienes un bot que sueles arrancar a mano (por ejemplo desde <b>Visual Studio</b> con <code>node index.js</code>)? Haz clic en «➕ Importar» (<b>archivo</b> o <b>carpeta entera</b> — en ese caso el archivo principal se detecta solo), ponle un nombre, y ya está:</p>
  <p>• funciona <b>en segundo plano</b>, aunque cierres Visual Studio;<br>• se <b>reinicia solo</b> si se cuelga;<br>• <b>sobrevive a los reinicios del PC</b>;<br>• se gestiona aquí <b>como los demás</b> (auto arranque, modo juego…).</p>
  <p>El botón 🗑 para el bot y lo quita de pm2 — <b>sus archivos no se tocan nunca</b>.</p>
  <h3>🎮 El modo juego</h3>
  <p>Cuando se detecta un juego de la lista (Fortnite, Valorant…), el panel <b>para los bots que hayas elegido</b> para liberar el PC mientras juegas, y luego los <b>reinicia automáticamente</b> alrededor de 1 minuto después de cerrar el juego. Tú eliges: parar <b>todos</b> los bots, o solo los marcados «Parar al jugar».</p>
  <p><b>¿Partida de un jugador?</b> El panel comprueba si el juego está <b>realmente conectado a internet</b>: una partida de un jugador o sin conexión no para nada (opción «Ignorar los juegos de un jugador»). Ejemplo: GTA V en modo historia → los bots se quedan; GTA Online → salta el modo juego.</p>
  <h3>🕹️ Añadir un juego a la detección</h3>
  <p>Tres formas: <b>📋 Programas abiertos</b> (abre el juego y elígelo en la lista — lo más preciso, vale también para cualquier programa), <b>📁 Elegir un .exe</b> (explorar el disco), o <b>🔍 Escanear</b> (rebusca en las bibliotecas de Steam/Epic y propone los juegos instalados que faltan en la lista).</p>
  <p>El escaneo del disco <b>nunca funciona de forma continua</b>: automáticamente <b>1×/día</b> como mucho (se puede desactivar en ⚙️ Ajustes), o cuando haces clic en «Escanear». La vigilancia permanente solo lee la lista de procesos — prácticamente gratis.</p>
  <h3>🌐 Uso bajo de internet</h3>
  <p>Activado, este modo da <b>prioridad de red al juego en línea</b>: durante la partida, los bots aplazan sus <b>descargas grandes</b> (listas antiestafa, copias de seguridad cifradas) y pasan a <b>prioridad baja</b> — más estricto cuanto más lenta sea tu conexión (medida automáticamente). Al terminar la partida, todo vuelve a la normalidad. Independiente del modo juego: perfecto para mantener un bot en línea <i>sin</i> que la partida vaya a tirones.</p>
  <h3>🔄 Actualizaciones automáticas</h3>
  <p>El panel <b>se actualiza solo</b>: comprueba al arrancar y luego cada 6 h, y todo pasa <b>dentro de la ventana</b>. Aparece una tarjeta arriba en cuanto encuentra una versión: <b>barra de progreso</b> con porcentaje, velocidad y tamaño, y luego las <b>novedades de la versión</b> y un botón <b>«Instalar y reiniciar»</b>. «Más tarde» oculta la tarjeta — la instalación sigue su curso.</p>
  <p>En principio <b>no tienes que hacer clic en nada</b>: la actualización se instala sola en cuanto es seguro. <b>Nunca</b> lo hace durante una partida, ni mientras manejas los bots, ni mientras miras la ventana — la tarjeta te dice justo <b>qué está esperando</b>. Cierra la ventana y se aplica. (Se puede desactivar en ⚙️ Ajustes, con el botón «Buscar actualizaciones» para forzar una comprobación.)</p>
  <h3>🔋 Ligero en recursos</h3>
  <p>El panel funciona 24/7 sin hacerse notar: cuando está <b>minimizado en el área de notificación</b>, <b>ralentiza su vigilancia</b> y deja de calcular lo que nadie mira. En cuanto vuelves a abrir la ventana, todo es instantáneo otra vez. (Si el modo juego o el uso bajo de internet está activo, sigue igual de atento para no perderse nada.)</p>
  <h3>🎮 Tu presencia en Discord</h3>
  <p>Opción «Rich Presence»: tu perfil de Discord muestra <b>«🤖 Gestiona X bots en línea»</b> (y el juego en curso). <b>Nada que configurar</b> — basta con que Discord esté abierto. Puramente decorativo, se puede desactivar en ⚙️ Ajustes.</p>
  <h3>🧰 En un PC nuevo (en casa de un amigo)</h3>
  <p>Los bots necesitan <b>Node.js</b> y <b>pm2</b>. Si falta alguno de los dos, el panel lo <b>detecta</b> y ofrece el botón que toca («Descargar Node.js» o «Instalar pm2») en vez de mostrar una lista vacía.</p>
  <h3>📁 Bueno saberlo</h3>
  <p>• La cruz de la ventana la <b>minimiza en el área de notificación</b> (al lado del reloj). Para salir: clic derecho en el icono → Salir.<br>• Ajustes guardados en <code>%APPDATA%\\\\hasu-panel\\\\panel-config.json</code>, registro en <code>panel.log</code>.<br>• Se mantiene al día una <b>copia de seguridad</b> de los ajustes al lado (<code>.bak</code>), que se recupera automáticamente si el archivo principal se vuelve ilegible o deja de escribirse. Si el guardado deja de funcionar, un <b>banner rojo</b> te lo dice — en vez de dejarte creer que tus ajustes están a salvo.<br>• El panel se abre solo con Windows (se puede desactivar en ⚙️ Ajustes).</p>` };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  if (typeof window !== 'undefined') { window.LANGS = window.LANGS || {}; window.LANGS['es'] = L; }
})();
