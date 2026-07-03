// UI du panel — rendu de l'état + envoi des actions via window.panel (preload).
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtUptime = (ts) => {
  if (!ts) return '—';
  let s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60);
  return d ? `${d}j ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};
const fmtMem = (b) => (b > 0 ? `${Math.round(b / 1048576)} Mo` : '—');
// Débit réseau (octets/s) : proxy = débit d'E/S du process (réseau-dominant pour un bot Discord).
const fmtNet = (b) => {
  if (!(b > 0)) return '0 o/s';
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} Mo/s`;
  if (b >= 1024) return `${Math.round(b / 1024)} Ko/s`;
  return `${Math.round(b)} o/s`;
};

let cur = null; // dernier statut reçu
let pending = false;

const render = (st) => {
  cur = st;
  // Bandeau
  const banner = $('banner');
  if (st.game) {
    banner.className = 'banner game';
    const lownet = st.lowNetActive ? ' · 🌐 faible usage internet actif' : '';
    if (!st.online && st.cfg.gameMode.soloSkip !== false) {
      banner.innerHTML = `🎮 <b>${esc(st.game)}</b> détecté — partie <b>solo</b> : les bots restent en ligne${lownet}`;
    } else {
      banner.innerHTML = `🎮 <b>Jeu en ligne :</b>&nbsp;${esc(st.game)}${st.stoppedByGame.length ? ` — <b>${st.stoppedByGame.length} bot(s) coupé(s)</b> (relance auto à la fin de la partie)` : st.cfg.gameMode.enabled ? ' — aucun bot à couper' : ' — mode jeu désactivé'}${lownet}`;
    }
  } else {
    const on = st.bots.filter((b) => b.status === 'online').length;
    banner.className = 'banner';
    banner.innerHTML = `🟢 <b>${on}/${st.bots.length}</b>&nbsp;bots en ligne — aucun jeu détecté`;
  }

  // Bots — deux catégories : les bots « maison » et les bots importés par l'utilisateur.
  const imported = st.cfg.imported || [];
  const botRow = (b) => {
    const c = st.cfg.bots[b.name] || { auto: true, gameStop: false };
    const dot = b.status === 'online' ? 'online' : b.status === 'errored' ? 'errored' : 'stopped';
    const stoppedByGame = st.stoppedByGame.includes(b.name);
    const isImp = imported.includes(b.name);
    return `<div class="bot">
      <span class="dot ${dot}" title="${esc(b.status)}"></span>
      <span class="name">${esc(b.name)}</span>
      <span class="meta">${b.status === 'online' ? `⏱ ${fmtUptime(b.uptime)} · ${fmtMem(b.memory)} · ${b.cpu}% cpu · <span class="net" title="Réseau du bot, mesuré via ses entrées/sorties (pour un bot Discord, quasi exclusivement du réseau + un peu de disque SQLite) — ↓ reçu · ↑ envoyé">↓ ${fmtNet(b.netDown)} · ↑ ${fmtNet(b.netUp)}</span>` : stoppedByGame ? '⏸ coupé par le mode jeu' : esc(b.status)} · ↻ ${b.restarts}</span>
      <label class="chk" title="(Re)mis en ligne à l'ouverture de session Windows"><input type="checkbox" data-bot="${esc(b.name)}" data-key="auto" ${c.auto !== false ? 'checked' : ''}> Auto boot</label>
      <label class="chk" title="Arrêté quand un jeu est détecté (mode « bots cochés »)"><input type="checkbox" data-bot="${esc(b.name)}" data-key="gameStop" ${c.gameStop ? 'checked' : ''}> Coupé en jeu</label>
      ${b.status === 'online'
        ? `<button class="btn" data-act="restart" data-bot="${esc(b.name)}">⟳</button><button class="btn danger" data-act="stop" data-bot="${esc(b.name)}">⏹</button>`
        : `<button class="btn primary" data-act="start" data-bot="${esc(b.name)}">▶</button>`}
      ${isImp ? `<button class="btn danger" data-remove="${esc(b.name)}" title="Arrêter et retirer ce bot de pm2 (ses fichiers ne sont pas touchés)">🗑</button>` : ''}
    </div>`;
  };
  const main = st.bots.filter((b) => !imported.includes(b.name));
  const imps = st.bots.filter((b) => imported.includes(b.name));
  $('bots').innerHTML = (
    main.map(botRow).join('') +
    (imps.length ? `<div class="sechead">🧩 Bots importés</div>${imps.map(botRow).join('')}` : '')
  ) || '<div class="hint">Aucun process pm2 trouvé. Vérifie que pm2 tourne (pm2 list).</div>';

  // Mode jeu
  $('gm-enabled').checked = !!st.cfg.gameMode.enabled;
  $('gm-all').checked = !!st.cfg.gameMode.stopAll;
  $('gm-some').checked = !st.cfg.gameMode.stopAll;
  $('gm-soloskip').checked = st.cfg.gameMode.soloSkip !== false;
  $('gm-lownet').checked = !!st.cfg.lowNet;
  if (document.activeElement !== $('gm-grace')) $('gm-grace').value = st.cfg.gameMode.graceSec;
  $('gm-stopped').textContent = st.stoppedByGame.length ? `⏸ Coupés par le mode jeu : ${st.stoppedByGame.join(', ')}` : '';

  // Jeux
  $('games').innerHTML = st.cfg.games.map((g) => `<span class="chip">${esc(g)} <b data-rm="${esc(g)}" title="Retirer">✕</b></span>`).join('');
  const disc = st.cfg.discovered || [];
  $('game-suggest').innerHTML = disc.length ? `🔍 ${disc.length} jeu(x) installé(s) non listé(s) — <button class="btn" id="game-suggest-btn" style="font-size:11.5px;padding:2px 8px">Voir les suggestions</button>` : '';

  // Réglages
  $('set-autolaunch').checked = !!st.cfg.autoLaunch;
  if (document.activeElement !== $('set-poll')) $('set-poll').value = st.cfg.pollSec;
  $('set-scanauto').checked = st.cfg.scanAuto !== false;
  $('set-scaninfo').textContent = st.cfg.lastScanAt ? `(dernier scan : ${new Date(st.cfg.lastScanAt).toLocaleString('fr-FR')})` : '(aucun scan pour l\'instant)';
  $('dev-note').textContent = st.cfg.packaged ? '' : '(actif seulement dans la version .exe)';
  $('set-rpc').checked = st.cfg.discordRpc !== false;
  if (document.activeElement !== $('set-rpc-id')) $('set-rpc-id').value = st.cfg.discordAppId || '';
  $('rpc-status').textContent = st.cfg.discordRpc === false ? ' — désactivée.' : (st.cfg.discordAppId ? ' — ✅ activée.' : ' — ⚠️ colle ton Application ID pour l\'activer.');
};

const refresh = async () => {
  if (pending) return;
  pending = true;
  try { render(await window.panel.status()); } catch {}
  pending = false;
};

// ---------- Modale (import + à propos) ----------
const openModal = (html) => { $('modal-box').innerHTML = html; $('modal').classList.remove('hidden'); };
const closeModal = () => { $('modal').classList.add('hidden'); $('modal-box').innerHTML = ''; };

const aboutHTML = () => {
  const v = cur?.cfg?.version || '';
  return `
  <h2>🛡️ Hasu Panel ${esc(v)} — c'est quoi ?</h2>
  <p>Un panneau de contrôle pour <b>tous tes bots</b> : ils tournent en arrière-plan grâce à <b>pm2</b>, et tu les gères ici sans toucher à la console.</p>
  <h3>🤖 La liste des bots</h3>
  <p>Chaque ligne = un bot. Pastille <b style="color:#3ba55d">verte</b> = en ligne, grise = arrêté, <b style="color:#ed4245">rouge</b> = en erreur. Boutons : ▶ démarrer · ⏹ arrêter · ⟳ redémarrer.</p>
  <p><b>Auto boot</b> : coché → le bot est remis en ligne tout seul quand tu allumes le PC. Décoché → il reste éteint au démarrage.</p>
  <h3>➕ Importer un bot</h3>
  <p>Tu as un bot que tu lances d'habitude à la main (par exemple depuis <b>Visual Studio</b> avec <code>node index.js</code>) ? Clique « Importer un bot », choisis son <b>fichier principal</b> (index.js, main.js, bot.py…), donne-lui un nom, et c'est tout :</p>
  <p>• il tourne <b>en arrière-plan</b>, même Visual Studio fermé ;<br>• il <b>redémarre tout seul</b> s'il plante ;<br>• il <b>survit aux redémarrages du PC</b> ;<br>• il se gère ici <b>comme les autres</b> (auto boot, mode jeu…).</p>
  <p>Le bouton 🗑 arrête le bot et le retire de pm2 — <b>ses fichiers ne sont jamais touchés</b>.</p>
  <h3>🎮 Le mode jeu</h3>
  <p>Quand un jeu de la liste est détecté (Fortnite, Valorant…), le panel <b>coupe les bots choisis</b> pour libérer le PC pendant que tu joues, puis les <b>relance automatiquement</b> environ 1 minute après la fermeture du jeu. Tu choisis : couper <b>tous</b> les bots, ou seulement ceux cochés « Coupé en jeu ».</p>
  <p><b>Jeu solo ?</b> Le panel vérifie si le jeu est <b>vraiment connecté à Internet</b> : une partie solo/hors-ligne ne coupe rien (option « Ignorer les jeux solo »). Exemple : GTA V en mode histoire → bots conservés ; GTA Online → mode jeu déclenché.</p>
  <h3>🕹️ Ajouter un jeu à la détection</h3>
  <p>Trois façons : <b>📋 Programmes ouverts</b> (lance le jeu et choisis-le dans la liste — le plus précis, marche aussi pour un logiciel), <b>📁 Choisir un .exe</b> (parcourir le disque), ou <b>🔍 Scanner</b> (fouille les bibliothèques Steam/Epic et propose les jeux installés absents de la liste).</p>
  <p>Le scan disque ne tourne <b>jamais en continu</b> : automatiquement <b>1×/jour</b> maximum (désactivable dans ⚙️ Réglages), ou quand tu cliques « Scanner ». La surveillance permanente, elle, ne fait que lire la liste des process — quasi gratuit.</p>
  <h3>🌐 Faible usage internet</h3>
  <p>Activé, ce mode donne la <b>priorité réseau au jeu en ligne</b> : pendant la partie, les bots repoussent leurs <b>gros téléchargements</b> (listes anti-scam, sauvegardes chiffrées) et passent en <b>priorité basse</b> — d'autant plus strict que ta connexion est lente (mesurée automatiquement). À la fin de la partie, tout revient à la normale. Indépendant du mode jeu : parfait pour garder saliox en ligne <i>sans</i> qu'il fasse laguer.</p>
  <h3>🔗 Le watchdog</h3>
  <p>saliox garde un œil sur les autres bots et t'envoie un MP <b>uniquement</b> si l'un d'eux <b>plante en boucle</b> (crash-loop). Les arrêts/démarrages normaux ne génèrent aucun MP : c'est ici, dans le panel, que tu vois qui est en ligne.</p>
  <h3>📁 Bon à savoir</h3>
  <p>• La croix de la fenêtre <b>réduit dans la zone de notification</b> (à côté de l'horloge). Pour quitter : clic droit sur l'icône → Quitter.<br>• Réglages enregistrés dans <code>%APPDATA%\\hasu-panel\\panel-config.json</code>, journal dans <code>panel.log</code>.<br>• Le panel se lance tout seul avec Windows (désactivable dans ⚙️ Réglages).</p>
  <div class="modal-actions"><button class="btn primary" id="modal-close">Fermer</button></div>`;
};

const importFormHTML = (script, suggested) => `
  <h2>➕ Importer un bot</h2>
  <p>Fichier choisi : <code>${esc(script)}</code></p>
  <p style="margin-top:10px">Nom du bot dans le panel (sans espace) :</p>
  <div class="row"><input type="text" id="imp-name" value="${esc(suggested)}" style="flex:1" maxlength="40"></div>
  <p class="hint">Le bot sera lancé par pm2 depuis son dossier, tournera en arrière-plan et survivra aux redémarrages du PC.</p>
  <p id="imp-err" style="color:var(--err);font-size:12.5px"></p>
  <div class="modal-actions"><button class="btn" id="modal-close">Annuler</button><button class="btn primary" id="imp-go">Importer</button></div>`;

// Délégation d'événements (le HTML est re-rendu régulièrement)
document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.id === 'modal-close' || t.id === 'modal') { closeModal(); return; }
  const addExe = t.closest?.('[data-addexe]');
  if (addExe) { await window.panel.addGame(addExe.dataset.addexe); closeModal(); await refresh(); return; }
  if (t.dataset?.scanadd) { await window.panel.addGame(t.dataset.scanadd); document.querySelector(`[data-scanrow="${CSS.escape(t.dataset.scanadd.toLowerCase())}"]`)?.remove(); await refresh(); return; }
  if (t.dataset?.ignore) { await window.panel.ignoreGame(t.dataset.ignore); document.querySelector(`[data-scanrow="${CSS.escape(t.dataset.ignore.toLowerCase())}"]`)?.remove(); await refresh(); return; }
  if (t.id === 'game-suggest-btn') { openScanModal(cur?.cfg?.discovered || [], 'Jeux repérés par le dernier scan (1×/jour).'); return; }
  if (t.dataset?.act && t.dataset?.bot) { t.disabled = true; await window.panel.action(t.dataset.bot, t.dataset.act); await refresh(); return; }
  if (t.dataset?.remove) {
    if (confirm(`Arrêter « ${t.dataset.remove} » et le retirer du panel ?\n(Ses fichiers ne sont pas touchés — tu pourras le réimporter.)`)) {
      const r = await window.panel.removeBot(t.dataset.remove);
      if (!r.ok) alert(r.error || 'Échec du retrait');
      await refresh();
    }
    return;
  }
  if (t.dataset?.rm) { await window.panel.removeGame(t.dataset.rm); await refresh(); return; }
});

$('about-btn').addEventListener('click', () => openModal(aboutHTML()));
const startImport = async (picker) => {
  const pick = await picker();
  if (!pick.ok) { if (pick.error) alert(pick.error); return; } // annulé = silencieux ; dossier sans fichier principal = message
  openModal(importFormHTML(pick.script, pick.suggested));
  $('imp-name').focus();
  $('imp-go').addEventListener('click', async () => {
    $('imp-go').disabled = true;
    const r = await window.panel.importBot($('imp-name').value.trim(), pick.script);
    if (r.ok) { closeModal(); await refresh(); }
    else { $('imp-err').textContent = r.error || 'Échec de l\'import'; $('imp-go').disabled = false; }
  });
  $('imp-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('imp-go').click(); });
};
$('import-btn').addEventListener('click', () => startImport(window.panel.importPick));
$('import-dir-btn').addEventListener('click', () => startImport(window.panel.importPickDir));
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset?.bot && t.dataset?.key) { await window.panel.setBot(t.dataset.bot, t.dataset.key, t.checked); await refresh(); return; }
  if (t.id === 'gm-enabled') { await window.panel.setGameMode({ enabled: t.checked }); await refresh(); return; }
  if (t.id === 'gm-all' || t.id === 'gm-some') { await window.panel.setGameMode({ stopAll: $('gm-all').checked }); await refresh(); return; }
  if (t.id === 'gm-grace') { await window.panel.setGameMode({ graceSec: Number(t.value) }); await refresh(); return; }
  if (t.id === 'gm-soloskip') { await window.panel.setGameMode({ soloSkip: t.checked }); await refresh(); return; }
  if (t.id === 'gm-lownet') { await window.panel.setSetting('lowNet', t.checked); await refresh(); return; }
  if (t.id === 'set-autolaunch') { await window.panel.setSetting('autoLaunch', t.checked); await refresh(); return; }
  if (t.id === 'set-poll') { await window.panel.setSetting('pollSec', Number(t.value)); await refresh(); return; }
  if (t.id === 'set-scanauto') { await window.panel.setSetting('scanAuto', t.checked); await refresh(); return; }
  if (t.id === 'set-rpc') { await window.panel.setSetting('discordRpc', t.checked); await refresh(); return; }
  if (t.id === 'set-rpc-id') { await window.panel.setSetting('discordAppId', t.value.trim()); await refresh(); return; }
});
$('game-add-btn').addEventListener('click', async () => {
  const v = $('game-add').value.trim();
  if (!v) return;
  const r = await window.panel.addGame(v);
  if (r.ok) { $('game-add').value = ''; await refresh(); } else alert(r.error || 'Nom invalide');
});
$('game-add').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('game-add-btn').click(); });

// Sélecteur précis : programmes ACTUELLEMENT ouverts sur le PC (jeu/logiciel inconnu de la liste).
$('game-pick-btn').addEventListener('click', async () => {
  openModal(`<h2>📋 Programmes ouverts</h2>
    <p class="hint">Lance ton jeu/logiciel, puis clique dessus dans la liste pour l'ajouter à la détection.</p>
    <div id="apps" style="margin-top:10px">Recherche des fenêtres ouvertes…</div>
    <div class="modal-actions"><button class="btn" id="modal-close">Fermer</button></div>`);
  const apps = await window.panel.runningApps();
  const box = $('apps');
  if (!box) return; // modale refermée entre-temps
  const inList = new Set((cur?.cfg?.games || []).map((g) => g.toLowerCase()));
  box.innerHTML = apps.map((a) => inList.has(a.exe.toLowerCase())
    ? `<div class="bot" style="opacity:.45"><span class="name">${esc(a.exe)}</span><span class="meta">${esc(a.title)} — déjà dans la liste</span></div>`
    : `<div class="bot" style="cursor:pointer" data-addexe="${esc(a.exe)}" title="Ajouter à la détection"><span class="name">${esc(a.exe)}</span><span class="meta">${esc(a.title)}</span><span class="btn primary" style="pointer-events:none">＋</span></div>`
  ).join('') || '<p class="hint">Aucune fenêtre détectée.</p>';
});

// Ou choisir le .exe directement sur le disque (jeu pas encore lancé).
$('game-exe-btn').addEventListener('click', async () => {
  const r = await window.panel.pickExe();
  if (r.ok) { await window.panel.addGame(r.exe); await refresh(); }
});

// ---------- Scan des jeux installés (à la demande ; auto 1×/jour côté main) ----------
const scanRow = (g) => `<div class="bot" data-scanrow="${esc(g.exe.toLowerCase())}">
    <span class="name">${esc(g.exe)}</span>
    <span class="meta">${esc(g.name || '')} · ${esc(g.source || '')}</span>
    <button class="btn primary" data-scanadd="${esc(g.exe)}">＋ Ajouter</button>
    <button class="btn" data-ignore="${esc(g.exe)}" title="Ne plus proposer ce programme">🚫</button>
  </div>`;
const openScanModal = (games, note) => openModal(`<h2>🔍 Jeux trouvés sur le PC</h2>
  ${note ? `<p class="hint">${esc(note)}</p>` : ''}
  <div style="margin-top:8px">${games.length ? games.map(scanRow).join('') : '<p class="hint">Rien de nouveau — les jeux trouvés sont déjà dans la liste (ou ignorés).</p>'}</div>
  <div class="modal-actions"><button class="btn" id="modal-close">Fermer</button></div>`);

$('game-scan-btn').addEventListener('click', async () => {
  openModal('<h2>🔍 Scan des jeux installés</h2><p class="hint">Analyse des bibliothèques Steam et Epic Games… (quelques secondes)</p>');
  const r = await window.panel.scanGames();
  if (!r.ok) { openScanModal([], r.error || 'Échec du scan'); return; }
  openScanModal(r.games, 'Scan terminé. Ajoute ce qui t\'intéresse, ignore le reste.');
  await refresh();
});

refresh();
setInterval(refresh, 3000);
