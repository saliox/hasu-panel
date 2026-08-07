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
// Bots dont une action est en cours : render() réécrit tout le HTML toutes les 3 s, donc un bouton
// désactivé redevenait actif AVANT la fin de l'action (on recliquait, le verrou refusait en silence).
// On garde l'état ici pour afficher « ⏳ » tant que l'action tourne.
const pendingBots = new Set();
let pending = false;
let updBusy = false, updMsg = ''; // état du bouton « Vérifier les mises à jour »
// Dernier HTML rendu pour chaque zone : on ne réécrit le DOM que si le contenu a réellement changé.
let lastBotsHtml = null, lastBannerHtml = null, lastGamesHtml = null, lastSuggestHtml = null;

const render = (st) => {
  cur = st;
  // Bandeau (réécrit seulement s'il change)
  const banner = $('banner');
  let bannerHtml, bannerCls;
  if (st.game) {
    bannerCls = 'banner game';
    const lownet = st.lowNetActive ? ' · 🌐 faible usage internet actif' : '';
    bannerHtml = (!st.online && st.cfg.gameMode.soloSkip !== false)
      ? `🎮 <b>${esc(st.game)}</b> détecté — partie <b>solo</b> : les bots restent en ligne${lownet}`
      : `🎮 <b>Jeu en ligne :</b>&nbsp;${esc(st.game)}${st.stoppedByGame.length ? ` — <b>${st.stoppedByGame.length} bot(s) coupé(s)</b> (relance auto à la fin de la partie)` : st.cfg.gameMode.enabled ? ' — aucun bot à couper' : ' — mode jeu désactivé'}${lownet}`;
  } else {
    const on = st.bots.filter((b) => b.status === 'online').length;
    bannerCls = 'banner';
    bannerHtml = `🟢 <b>${on}/${st.bots.length}</b>&nbsp;bots en ligne — aucun jeu détecté`;
  }
  if (bannerHtml !== lastBannerHtml) { lastBannerHtml = bannerHtml; banner.className = bannerCls; banner.innerHTML = bannerHtml; }

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
      ${pendingBots.has(b.name)
        ? '<button class="btn" disabled>⏳…</button>'
        : b.status === 'online'
        ? `<button class="btn" data-act="restart" data-bot="${esc(b.name)}">⟳</button><button class="btn danger" data-act="stop" data-bot="${esc(b.name)}">⏹</button>`
        : `<button class="btn primary" data-act="start" data-bot="${esc(b.name)}">▶</button>`}
      <button class="btn" data-logs="${esc(b.name)}" title="Voir les logs récents (crash, erreurs…)">📄</button>
      <button class="btn" data-folder="${esc(b.name)}" title="Ouvrir le dossier du bot dans l'Explorateur">📂</button>
      ${isImp ? `<button class="btn danger" data-remove="${esc(b.name)}" title="Arrêter et retirer ce bot de pm2 (ses fichiers ne sont pas touchés)">🗑</button>` : ''}
    </div>`;
  };
  const main = st.bots.filter((b) => !imported.includes(b.name));
  const imps = st.bots.filter((b) => imported.includes(b.name));
  const tc = st.toolchain || { node: true, pm2: true };
  // Chaîne d'outils manquante : au lieu du trompeur « Aucun process », on guide.
  let empty;
  if (!tc.node) {
    empty = '<div class="tc-warn"><b>⚠️ Node.js n\'est pas installé.</b><br>pm2 (qui fait tourner les bots) a besoin de Node.js. '
      + 'Installe-le d\'abord, puis reviens installer pm2.<div class="row" style="margin-top:8px">'
      + '<button class="btn primary" id="tc-node">Télécharger Node.js</button></div></div>';
  } else if (!tc.pm2) {
    empty = '<div class="tc-warn"><b>⚠️ pm2 n\'est pas installé.</b><br>pm2 est l\'outil qui garde tes bots en ligne. '
      + 'Clique pour l\'installer automatiquement (sans droits administrateur).'
      + '<div class="row" style="margin-top:8px"><button class="btn primary" id="tc-pm2">Installer pm2</button>'
      + '<span id="tc-pm2-status" style="color:var(--mut);font-size:12px"></span></div></div>';
  } else {
    empty = '<div class="hint">Aucun bot géré par pm2 pour l\'instant. Importe un bot avec « ➕ Importer » ci-dessus.</div>';
  }
  // pm2 muet : ne PAS afficher « aucun bot » (l'écran mentirait alors que tes bots sont peut-être tous morts).
  const health = st.pm2Health || { ok: true };
  if (!health.ok) {
    const mins = health.since ? Math.max(1, Math.round((Date.now() - health.since) / 60000)) : 1;
    empty = `<div class="tc-warn"><b>⚠️ pm2 ne répond plus depuis ~${mins} min.</b><br>`
      + `L'état ci-dessous est le <b>dernier connu</b>, il n'est plus rafraîchi.${health.reason ? ` <span style="opacity:.7">(${esc(health.reason)})</span>` : ''}</div>`;
  }
  // Bandeau « X bots devraient être en ligne » (Auto boot coché, pas arrêtés par toi ni par le mode jeu).
  const nf = st.needFix || [];
  const fixBanner = nf.length
    ? `<div class="tc-warn" style="border-color:#e2b341"><b>⚠️ ${nf.length} bot(s) devraient être en ligne :</b> ${esc(nf.join(', '))}`
      + '<div class="row" style="margin-top:8px"><button class="btn primary" id="fix-all">Remettre en ordre</button>'
      + '<span id="fix-status" style="color:var(--mut);font-size:12px"></span></div></div>'
    : '';
  // La liste n'est RECONSTRUITE que si son contenu a changé. Avant, `innerHTML` était réassigné toutes
  // les 3 s même à l'identique : ~16 éléments par bot détruits/recréés en boucle (rendu logiciel, GPU
  // coupé), et surtout les cases à cocher perdaient focus et survol à chaque cycle — d'où le clic qui
  // « ne prend pas » quand le rafraîchissement tombe au mauvais moment.
  const botsHtml = (!health.ok ? empty : '') + fixBanner + (
    main.map(botRow).join('') +
    (imps.length ? `<div class="sechead">🧩 Bots importés</div>${imps.map(botRow).join('')}` : '')
  ) || (fixBanner + empty);
  if (botsHtml !== lastBotsHtml) { lastBotsHtml = botsHtml; $('bots').innerHTML = botsHtml; }

  // Mode jeu
  $('gm-enabled').checked = !!st.cfg.gameMode.enabled;
  $('gm-all').checked = !!st.cfg.gameMode.stopAll;
  $('gm-some').checked = !st.cfg.gameMode.stopAll;
  $('gm-soloskip').checked = st.cfg.gameMode.soloSkip !== false;
  $('gm-lownet').checked = !!st.cfg.lowNet;
  if (document.activeElement !== $('gm-grace')) $('gm-grace').value = st.cfg.gameMode.graceSec;
  $('gm-stopped').textContent = st.stoppedByGame.length ? `⏸ Coupés par le mode jeu : ${st.stoppedByGame.join(', ')}` : '';

  // Jeux (liste stable : ~16 puces reconstruites toutes les 3 s pour rien avant cette garde)
  const gamesHtml = st.cfg.games.map((g) => `<span class="chip">${esc(g)} <b data-rm="${esc(g)}" title="Retirer">✕</b></span>`).join('');
  if (gamesHtml !== lastGamesHtml) { lastGamesHtml = gamesHtml; $('games').innerHTML = gamesHtml; }
  const disc = st.cfg.discovered || [];
  const suggestHtml = disc.length ? `🔍 ${disc.length} jeu(x) installé(s) non listé(s) — <button class="btn" id="game-suggest-btn" style="font-size:11.5px;padding:2px 8px">Voir les suggestions</button>` : '';
  if (suggestHtml !== lastSuggestHtml) { lastSuggestHtml = suggestHtml; $('game-suggest').innerHTML = suggestHtml; }

  // Réglages
  $('set-autolaunch').checked = !!st.cfg.autoLaunch;
  if (document.activeElement !== $('set-poll')) $('set-poll').value = st.cfg.pollSec;
  $('set-scanauto').checked = st.cfg.scanAuto !== false;
  $('set-scaninfo').textContent = st.cfg.lastScanAt ? `(dernier scan : ${new Date(st.cfg.lastScanAt).toLocaleString('fr-FR')})` : '(aucun scan pour l\'instant)';
  $('dev-note').textContent = st.cfg.packaged ? '' : '(actif seulement dans la version .exe)';
  $('set-rpc').checked = st.cfg.discordRpc !== false;
  if (document.activeElement !== $('set-rpc-id')) $('set-rpc-id').value = st.cfg.discordAppId || '';
  $('set-autoupdate').checked = st.autoApplyUpdates !== false;
  $('set-alerts').checked = st.cfg.alerts !== false;
  $('set-alert-toast').checked = st.cfg.alertToast !== false;
  if (document.activeElement !== $('set-alert-webhook')) $('set-alert-webhook').value = st.cfg.alertWebhook || '';
  // Dernière sauvegarde pm2 = ce qui reviendra vraiment au prochain démarrage du PC.
  const sv = $('save-info');
  if (sv) sv.textContent = st.lastSaveAt
    ? `Dernière sauvegarde pm2 : ${new Date(st.lastSaveAt).toLocaleString('fr-FR')}`
    : 'Aucune sauvegarde pm2 depuis ce panel.';
  $('rpc-status').textContent = st.cfg.discordRpc === false ? ' — désactivée.' : (st.cfg.discordAppId ? ' — ✅ activée.' : ' — ⚠️ colle ton Application ID pour l\'activer.');

  // Mises à jour
  $('upd-version').textContent = st.cfg.version || '—';
  const applyBtn = $('upd-apply');
  applyBtn.style.display = st.updateReady ? '' : 'none';
  if (st.updateReady && !updBusy) {
    // Avec l'installation automatique, on explique POURQUOI elle attend encore (au lieu de laisser croire
    // qu'il faut absolument cliquer). « fenêtre ouverte » est normal : elle s'installera dès que tu fermes.
    const bl = st.updateBlockers || [];
    $('upd-status').innerHTML = st.autoApplyUpdates === false
      ? '✅ <b>Mise à jour prête</b> — clique « Redémarrer & appliquer » (installation automatique désactivée).'
      : bl.length
        ? `✅ <b>Mise à jour prête</b> — elle s'installera toute seule dès que possible.<br><span style="opacity:.75">En attente : ${esc(bl.join(', '))}.</span> Tu peux aussi l'appliquer maintenant.`
        : '✅ <b>Mise à jour prête</b> — installation automatique imminente…';
  }
  else if (!updBusy && !st.updateReady && !updMsg) $('upd-status').textContent = st.cfg.packaged ? '' : 'ℹ️ L\'auto-update est actif seulement dans la version installée (Setup.exe).';
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
  <p>Chaque ligne = un bot. Pastille <b style="color:#3ba55d">verte</b> = en ligne, grise = arrêté, <b style="color:#ed4245">rouge</b> = en erreur. Boutons : ▶ démarrer · ⏹ arrêter · ⟳ redémarrer · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> : affiche les <b>dernières lignes du bot</b> (erreurs, plantage…) — pratique pour comprendre pourquoi il est tombé, <b>sans ouvrir de terminal</b>.</p>
  <p><b>Auto boot</b> : coché → le bot est remis en ligne tout seul quand tu allumes le PC. Décoché → il reste éteint au démarrage.</p>
  <p><b>⏹ Tout arrêter</b> (en haut de la liste) coupe <b>tous les bots en ligne</b> d'un coup. Sécurité : il faut cliquer <b>deux fois</b> pour confirmer.</p>
  <p>À chaque arrêt, le panel fait le ménage : les <b>petits programmes lancés par un bot</b> (ffmpeg de la musique, installations en cours…) qui survivaient et encombraient le PC sont <b>fermés proprement</b> eux aussi.</p>
  <h3>➕ Importer un bot</h3>
  <p>Tu as un bot que tu lances d'habitude à la main (par exemple depuis <b>Visual Studio</b> avec <code>node index.js</code>) ? Clique « Importer un bot » (<b>fichier</b> ou <b>dossier entier</b> — dans ce cas le fichier principal est détecté tout seul), donne-lui un nom, et c'est tout :</p>
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
  <h3>🔄 Mises à jour automatiques</h3>
  <p>Le panel <b>se met à jour tout seul</b> : il vérifie au lancement puis toutes les 6 h, télécharge en fond (tu vois la <b>progression</b> dans ⚙️ Réglages) et applique la nouvelle version au <b>prochain démarrage</b>. Rien à réinstaller. Tu peux forcer une vérification avec le bouton « Vérifier les mises à jour ».</p>
  <h3>🔋 Économe en ressources</h3>
  <p>Le panel tourne 24h/24 sans se faire remarquer : quand il est <b>réduit dans la zone de notification</b>, il <b>ralentit sa surveillance</b> et arrête de calculer l'affichage inutile. Dès que tu rouvres la fenêtre, tout redevient instantané. (Si le mode jeu ou le faible usage internet est actif, il reste réactif pour ne rien rater.)</p>
  <h3>🎮 Ta présence Discord</h3>
  <p>Option « Rich Presence » : ton profil Discord affiche <b>« 🤖 Gère X bots en ligne »</b> (et le jeu en cours). <b>Rien à configurer</b> — il suffit que Discord soit ouvert. Purement décoratif, désactivable dans ⚙️ Réglages.</p>
  <h3>🧰 Sur un PC neuf (chez un ami)</h3>
  <p>Les bots ont besoin de <b>Node.js</b> et <b>pm2</b>. Si l'un des deux manque, le panel le <b>détecte</b> et propose le bouton qui va bien (« Télécharger Node.js » ou « Installer pm2 ») au lieu d'afficher une liste vide.</p>
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

// Modale des logs : lecture DIRECTE des fichiers (instantané, marche même si pm2 est malade),
// deux onglets Sortie/Erreurs, filtre par mot-clé, copier, ouvrir le dossier des logs.
let logsFilter = '';
const renderLogsBody = (text) => {
  const pre = $('logs-pre');
  if (!pre) return;
  const f = logsFilter.trim().toLowerCase();
  const lines = String(text || '').split('\n');
  const shown = f ? lines.filter((l) => l.toLowerCase().includes(f)) : lines;
  pre.textContent = shown.join('\n').trim() || (f ? `Aucune ligne ne contient « ${logsFilter} ».` : 'Aucun log pour l\'instant.');
  pre.scrollTop = pre.scrollHeight; // le plus récent est en bas
};
let logsRaw = '';
const openLogs = async (name, which) => {
  which = which === 'err' ? 'err' : 'out';
  const tab = (id, label) => `<button class="btn${which === id ? ' primary' : ''}" data-logtab="${esc(name)}" data-which="${id}">${label}</button>`;
  openModal(`<h3 style="margin:0 0 8px">📄 Logs — ${esc(name)}</h3>
    <div class="row" style="gap:6px;margin-bottom:8px;flex-wrap:wrap">
      ${tab('out', 'Sortie')}${tab('err', '⚠️ Erreurs')}
      <input type="text" id="logs-filter" placeholder="Filtrer…" style="flex:1;min-width:120px">
      <button class="btn" id="logs-copy">📋 Copier</button>
      <button class="btn" id="logs-folder" data-bot="${esc(name)}" title="Ouvrir le dossier des logs">📂</button>
    </div>
    <pre id="logs-pre" style="max-height:56vh;overflow:auto;white-space:pre-wrap;word-break:break-word;font:11px/1.5 Consolas,monospace;background:#0b0e16;color:#cdd6f4;padding:10px;border-radius:8px;margin:0">Chargement…</pre>
    <div class="modal-actions"><button class="btn primary" id="modal-close">Fermer</button></div>`);
  const inp = $('logs-filter');
  if (inp) { inp.value = logsFilter; inp.addEventListener('input', () => { logsFilter = inp.value; renderLogsBody(logsRaw); }); }
  try {
    const r = await window.panel.logs(name, which);
    if (!$('logs-pre')) return; // modale refermée entre-temps
    logsRaw = (r && r.ok) ? r.out : '';
    if (r && !r.ok) { $('logs-pre').textContent = r.error || 'Impossible de lire les logs.'; return; }
    renderLogsBody(logsRaw);
  } catch { if ($('logs-pre')) $('logs-pre').textContent = 'Échec de lecture des logs.'; }
};

// Échap ferme la modale (removeMenu() a supprimé les raccourcis Electron par défaut → aucun n'existait).
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').classList.contains('hidden')) closeModal(); });

// Délégation d'événements (le HTML est re-rendu régulièrement)
document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.id === 'modal-close' || t.id === 'modal') { closeModal(); return; }
  // Chaîne d'outils manquante : télécharger Node.js / installer pm2.
  if (t.id === 'tc-node') { window.open?.('https://nodejs.org/fr/download'); return; }
  if (t.id === 'tc-pm2') {
    t.disabled = true;
    const st = document.getElementById('tc-pm2-status'); if (st) st.textContent = ' ⏳ installation de pm2… (jusqu\'à 1 min)';
    let r; try { r = await window.panel.installPm2(); } catch { r = { ok: false }; }
    if (r.ok) { if (st) st.textContent = ' ✅ pm2 installé !'; setTimeout(refresh, 800); }
    else { t.disabled = false; if (st) st.textContent = r.reason === 'no-node' ? ' ❌ Node.js requis d\'abord.' : ' ❌ Échec — réessaie ou installe pm2 à la main.'; }
    return;
  }
  const addExe = t.closest?.('[data-addexe]');
  if (addExe) { await window.panel.addGame(addExe.dataset.addexe); closeModal(); await refresh(); return; }
  if (t.dataset?.scanadd) { await window.panel.addGame(t.dataset.scanadd); document.querySelector(`[data-scanrow="${CSS.escape(t.dataset.scanadd.toLowerCase())}"]`)?.remove(); await refresh(); return; }
  if (t.dataset?.ignore) { await window.panel.ignoreGame(t.dataset.ignore); document.querySelector(`[data-scanrow="${CSS.escape(t.dataset.ignore.toLowerCase())}"]`)?.remove(); await refresh(); return; }
  if (t.id === 'game-suggest-btn') { openScanModal(cur?.cfg?.discovered || [], 'Jeux repérés par le dernier scan (1×/jour).'); return; }
  if (t.dataset?.act && t.dataset?.bot) {
    const name = t.dataset.bot;
    t.disabled = true; pendingBots.add(name); render(cur); // ⏳ visible même après un re-rendu
    try { await window.panel.action(name, t.dataset.act); } finally { pendingBots.delete(name); }
    await refresh();
    return;
  }
  if (t.dataset?.folder) { await window.panel.openFolder(t.dataset.folder); return; }
  if (t.id === 'fix-all') {
    t.disabled = true;
    const s = $('fix-status'); if (s) s.textContent = ' ⏳ relance en cours…';
    let r; try { r = await window.panel.fixAll(); } catch { r = null; }
    if (s) s.textContent = r && r.ok ? ` ✅ ${r.started} relancé(s)` : ' ⚠️ échec';
    setTimeout(refresh, 1200);
    return;
  }
  if (t.dataset?.logs) { openLogs(t.dataset.logs, 'out'); return; }
  if (t.dataset?.logtab) { openLogs(t.dataset.logtab, t.dataset.which); return; }
  if (t.id === 'logs-copy') {
    const pre = $('logs-pre');
    if (pre) { try { await navigator.clipboard.writeText(pre.textContent || ''); t.textContent = '✅ Copié'; setTimeout(() => { t.textContent = '📋 Copier'; }, 1400); } catch {} }
    return;
  }
  if (t.id === 'logs-folder') { await window.panel.openFolder(t.dataset.bot, 'logs'); return; }
  if (t.id === 'alert-test') {
    t.disabled = true;
    const s = $('alert-status'); if (s) s.textContent = ' ⏳ envoi…';
    let r; try { r = await window.panel.testAlert(); } catch { r = null; }
    if (s) s.textContent = r && r.ok
      ? ` ✅ envoyé (${r.webhook ? 'webhook Discord' : 'pas de webhook'}${r.toast ? ' + notification Windows' : ''})`
      : ` ❌ ${(r && r.error) || 'échec'}`;
    t.disabled = false;
    return;
  }
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

// « Tout arrêter » : double-clic de confirmation (1er clic arme pour 4 s, 2e clic exécute).
let stopAllArmed = false, stopAllTimer = null;
$('stop-all-btn').addEventListener('click', async () => {
  const btn = $('stop-all-btn');
  if (!stopAllArmed) {
    stopAllArmed = true;
    btn.classList.add('armed'); btn.textContent = '⏹ Confirmer ?';
    stopAllTimer = setTimeout(() => { stopAllArmed = false; btn.classList.remove('armed'); btn.textContent = '⏹ Tout arrêter'; }, 4000);
    return;
  }
  clearTimeout(stopAllTimer); stopAllArmed = false;
  btn.classList.remove('armed'); btn.disabled = true; btn.textContent = '⏳ Arrêt…';
  let r; try { r = await window.panel.stopAll(); } catch { r = null; }
  btn.textContent = (r && r.ok) ? `✅ ${r.stopped} arrêté(s)` : '⚠️ Échec';
  await refresh();
  setTimeout(() => { btn.disabled = false; btn.textContent = '⏹ Tout arrêter'; }, 1600);
});

// Mises à jour : vérification manuelle + application.
$('upd-check').addEventListener('click', async () => {
  updBusy = true; updMsg = '';
  $('upd-check').disabled = true;
  $('upd-status').textContent = '⏳ Recherche de mise à jour…';
  let r; try { r = await window.panel.checkUpdate(); } catch { r = { state: 'error' }; }
  const msg = {
    dev: 'ℹ️ L\'auto-update ne fonctionne que dans la version installée (Setup.exe), pas en développement.',
    uptodate: `✅ Tu as déjà la dernière version (${r.current || ''}).`,
    available: `⬇️ Nouvelle version <b>${r.version || ''}</b> trouvée — téléchargement en cours, elle sera prête dans un instant.`,
    downloaded: '✅ <b>Mise à jour prête</b> — clique « Redémarrer & appliquer ».',
    error: `⚠️ Impossible de vérifier maintenant${r.message ? ' (' + r.message + ')' : ''}. Réessaie plus tard.`,
  }[r.state] || '⚠️ Réponse inattendue.';
  updMsg = msg;
  $('upd-status').innerHTML = msg;
  $('upd-check').disabled = false;
  updBusy = false;
  refresh();
});
$('upd-apply').addEventListener('click', async () => {
  $('upd-apply').disabled = true;
  $('upd-status').textContent = '🔄 Application de la mise à jour et redémarrage…';
  await window.panel.applyUpdate();
});

// Progression du téléchargement de la MAJ, poussée EN DIRECT par le main (event update-status).
const fmtBps = (b) => b >= 1e6 ? (b / 1e6).toFixed(1) + ' Mo/s' : Math.max(0, Math.round(b / 1e3)) + ' Ko/s';
const renderUpdateStatus = (s) => {
  if (!s) return;
  const st = $('upd-status');
  if (s.state === 'downloading') {
    const pct = Math.max(0, Math.min(100, s.percent || 0));
    const speed = s.bps ? ` · ${fmtBps(s.bps)}` : '';
    const size = (s.transferred && s.total) ? ` · ${(s.transferred / 1e6).toFixed(0)}/${(s.total / 1e6).toFixed(0)} Mo` : '';
    st.innerHTML = `⬇️ Téléchargement de la mise à jour… <b>${pct}%</b>${speed}${size}`
      + `<div class="upd-bar"><div class="upd-bar-fill" style="width:${pct}%"></div></div>`;
    $('upd-check').disabled = true;
    $('upd-apply').style.display = 'none';
  } else if (s.state === 'downloaded') {
    st.innerHTML = '✅ <b>Mise à jour prête</b> — clique « Redémarrer & appliquer ».';
    $('upd-check').disabled = false;
    $('upd-apply').style.display = '';
  } else if (s.state === 'available') {
    st.innerHTML = `⬇️ Nouvelle version <b>${s.version || ''}</b> trouvée — téléchargement…`;
    $('upd-check').disabled = true;
  } else if (s.state === 'error') {
    st.innerHTML = `⚠️ MàJ : ${s.message || 'erreur'}`;
    $('upd-check').disabled = false;
  }
};
if (window.panel.onUpdate) window.panel.onUpdate(renderUpdateStatus);
// Le webhook s'enregistre AUSSI à la frappe (anti-perte) : `change` ne se déclenche qu'à la perte de
// focus, donc coller l'URL puis fermer la fenêtre directement ne sauvegardait rien.
let webhookTimer = null;
document.addEventListener('input', (e) => {
  if (e.target?.id !== 'set-alert-webhook') return;
  clearTimeout(webhookTimer);
  const val = e.target.value.trim();
  webhookTimer = setTimeout(async () => {
    const r = await window.panel.setSetting('alertWebhook', val);
    const s = $('alert-status');
    if (s) s.textContent = val ? (r && r.ok ? ' ✅ enregistré' : ` ❌ ${(r && r.error) || 'refusé'}`) : '';
  }, 800);
});

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
  if (t.id === 'set-autoupdate') { await window.panel.setSetting('autoApplyUpdates', t.checked); await refresh(); return; }
  if (t.id === 'set-alerts') { await window.panel.setSetting('alerts', t.checked); await refresh(); return; }
  if (t.id === 'set-alert-toast') { await window.panel.setSetting('alertToast', t.checked); await refresh(); return; }
  if (t.id === 'set-alert-webhook') {
    const r = await window.panel.setSetting('alertWebhook', t.value.trim());
    const s = $('alert-status'); if (s) s.textContent = r && r.ok ? ' ✅ enregistré' : ` ❌ ${(r && r.error) || 'refusé'}`;
    await refresh(); return;
  }
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
