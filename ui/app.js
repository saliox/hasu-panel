// UI du panel — rendu de l'état + envoi des actions via window.panel (preload).
const $ = (id) => document.getElementById(id);
// Traductions : le dictionnaire est chargé par <script src="i18n.js"> AVANT ce fichier, et partagé
// avec le processus principal (menu de la zone de notification).
const t = (k, v) => window.i18n.t(k, v);
let langCourante = 'fr';
// Repeint TOUT ce qui est traduit : le HTML statique (attributs data-i18n*) et, via les gardes de
// signature remises à zéro, chaque zone dynamique au prochain rendu.
const appliquerLangue = (l) => {
  if (l === langCourante) return;
  langCourante = window.i18n.setLang(l);
  document.documentElement.lang = langCourante;
  // L'arabe s'écrit de droite à gauche : c'est toute la mise en page qui bascule, pas juste le texte.
  document.documentElement.dir = window.i18n.isRtl(langCourante) ? 'rtl' : 'ltr';
  const sel = $('lang-select');
  if (sel && sel.value !== langCourante) sel.value = langCourante;
  window.i18n.applyStatic();
  lastBotsHtml = lastBannerHtml = lastGamesHtml = lastSuggestHtml = null;
  lastUpdHtml = lastUpdCls = lastWarnHtml = lastIncHtml = null;
  if (cur) render(cur);
};
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

// ---------- Carte de mise à jour (haut de fenêtre) ----------
// Tout le parcours de MAJ se fait ICI, sans aller le chercher dans ⚙️ Réglages. Deux sources
// l'alimentent : l'event `update-status` poussé en direct par le main (progression fluide, ~10×/s)
// et le sondage `panel:status` toutes les 3 s (blockers + réglage auto, qui ne transitent pas par l'event).
const upd = { s: null, ready: false, blockers: [], auto: true, current: '', dismissed: '', sawDl: false };
let lastUpdHtml = null, lastUpdCls = null;

const fmtBps = (b) => b >= 1e6 ? (b / 1e6).toFixed(1) + ' Mo/s' : Math.max(0, Math.round(b / 1e3)) + ' Ko/s';
const fmtMo = (b) => (b / 1e6).toFixed(b < 1e7 ? 1 : 0) + ' Mo';

const paintUpdCard = () => {
  const box = $('updcard');
  if (!box) return;
  const s = upd.s || {};
  const ver = s.version || '';
  const head = (ico, ttl, act) =>
    `<div class="updcard-head"><span class="updcard-ico">${ico}</span><div><div class="updcard-ttl">${ttl}</div>`
    + (ver ? `<div class="updcard-ver">${esc(upd.current || '?')} → <b>${esc(ver)}</b></div>` : '')
    + `</div>${act ? `<div class="updcard-act">${act}</div>` : ''}</div>`;
  const notes = (s.notes || []).length
    ? `<div class="updcard-notes">${s.notes.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : '';

  let cls = 'updcard', html = '';
  if (upd.dismissed && upd.dismissed === ver) {
    // « Plus tard » : on s'efface, mais l'installation automatique, elle, suit son cours.
  } else if (s.state === 'downloading') {
    const pct = Math.max(0, Math.min(100, Math.round(s.percent || 0)));
    html = head('⬇️', t('upd.cardDownloading'), `<b style="font-size:15px">${pct}%</b>`)
      + `<div class="upd-bar"><div class="upd-bar-fill live" style="width:${pct}%"></div></div>`
      + `<div class="updcard-prog"><span>${s.bps ? esc(fmtBps(s.bps)) : ''}</span>`
      + `<span>${(s.transferred && s.total) ? `${esc(fmtMo(s.transferred))} / ${esc(fmtMo(s.total))}` : ''}</span></div>`;
  } else if (upd.ready || s.state === 'downloaded') {
    cls += ' ready';
    // « fenêtre ouverte » est TOUJOURS dans les blockers tant que tu regardes l'écran : l'afficher tel quel
    // ferait croire à un blocage. On l'exprime en clair et on ne liste que les autres raisons.
    const others = (upd.blockers || []).filter((b) => b !== 'blk.window').map((b) => t(b));
    const why = upd.auto === false
      ? t('upd.whyManual')
      : others.length ? t('upd.whyWaiting', { list: esc(others.join(', ')) })
        : t('upd.whyWindow');
    // Un redémarrage raté (installeur en quarantaine antivirus, fichier verrouillé) arrive alors que
    // `updateReady` est TOUJOURS vrai : sans ce cas, l'erreur ne s'affichait nulle part et le bouton
    // restait bloqué sur « Redémarrage… » pour toujours.
    const rate = s.state === 'error' ? `<div class="updcard-why" style="color:var(--err)">${esc(s.message || 'échec')}</div>` : '';
    html = head('✅', t('upd.cardReady'),
      `<button class="btn primary big" data-upd="apply">${t('upd.install')}</button>`
      + `<button class="btn" data-upd="later" title="${t('upd.laterTitle')}">${t('upd.later')}</button>`)
      + notes + rate + `<div class="updcard-why">${why}</div>`;
  } else if (s.state === 'available') {
    html = head('🎉', t('upd.cardAvailable'), `<span class="mut12">${t('upd.cardPreparing')}</span>`) + notes;
  } else if (s.state === 'error' && upd.sawDl) {
    // Une erreur de simple vérification (PC hors ligne) ne mérite pas une bannière rouge plein écran :
    // on ne l'affiche que si un téléchargement était réellement engagé.
    cls += ' err';
    html = head('⚠️', t('upd.cardBroken'),
      `<button class="btn" data-upd="retry">${t('upd.retry')}</button>`)
      + `<div class="updcard-why">${esc(s.message || 'erreur inconnue')}</div>`;
  }

  if (!html) cls += ' hidden';
  if (html !== lastUpdHtml) { lastUpdHtml = html; box.innerHTML = html; }
  if (cls !== lastUpdCls) { lastUpdCls = cls; box.className = cls; }
};

$('updcard').addEventListener('click', async (e) => {
  const a = e.target?.dataset?.upd;
  if (!a) return;
  if (a === 'apply') {
    e.target.disabled = true;
    e.target.textContent = t('upd.restarting');
    await window.panel.applyUpdate();
  } else if (a === 'later') {
    upd.dismissed = upd.s?.version || '-';
    paintUpdCard();
  } else if (a === 'retry') {
    e.target.disabled = true;
    upd.s = null; lastUpdHtml = null; paintUpdCard();
    await window.panel.checkUpdate();
  }
});

let lastWarnHtml = null, lastIncHtml = null;

// Vrai entre `mousedown` et `mouseup` : pendant ce laps, aucune zone cliquable ne doit être remplacée,
// sinon le `click` n'est jamais émis (il exige un ancêtre commun encore vivant entre les deux
// événements). En capture, pour ne dépendre d'aucun handler intermédiaire.
let sourisEnfoncee = false;
addEventListener('mousedown', () => { sourisEnfoncee = true; }, true);
addEventListener('mouseup', () => { sourisEnfoncee = false; }, true);
addEventListener('blur', () => { sourisEnfoncee = false; }); // relâché hors fenêtre : on ne reste pas figé

const render = (st) => {
  cur = st;
  // La langue vient du processus principal : elle survit au redémarrage, et l'écran s'y aligne même
  // si le choix a été fait ailleurs (autre fenêtre, config éditée à la main).
  if (st.lang && st.lang !== langCourante) appliquerLangue(st.lang);
  // Réglages qui ne s'enregistrent plus : ça doit se VOIR. Ce mode de panne a duré six semaines sans
  // le moindre signe (fichier lisible mais plus écrit), et il fait perdre webhook et préférences.
  const dualHtml = st.secondeInstall
    ? `<div class="updcard-head"><span class="updcard-ico">⚠️</span><div><div class="updcard-ttl">${t('dual.title')}</div>`
      + `<div class="updcard-ver">${esc(t('dual.body', { path: st.secondeInstall }))}</div></div></div>`
    : '';
  const warnHtml = st.cfgWriteFailed
    ? dualHtml + `<div class="updcard-head"><span class="updcard-ico">⚠️</span><div><div class="updcard-ttl">${t('cfg.failTitle')}</div>`
      + `<div class="updcard-ver">${t('cfg.failBody')}</div></div></div>`
      + `<div class="updcard-why">${t('cfg.failWhy', { path: esc(st.cfgPath || '') })}</div>`
    : dualHtml;
  if (warnHtml !== lastWarnHtml) {
    lastWarnHtml = warnHtml;
    const w = $('cfgwarn');
    w.innerHTML = warnHtml;
    w.className = warnHtml ? 'updcard err' : 'updcard err hidden';
  }

  // Bandeau (réécrit seulement s'il change)
  const banner = $('banner');
  let bannerHtml, bannerCls;
  if (st.game) {
    bannerCls = 'banner game';
    // « actif » seulement si le drapeau que LISENT les bots a bien pu être écrit : sinon le bandeau
    // annonçait une fonctionnalité dont la moitié ne s'appliquait pas (les bots ne différaient rien).
    const lownet = st.lowNetActive
      ? (st.lowNetFlagOk === false ? t('lownet.broken') : t('lownet.active'))
      : '';
    bannerHtml = (!st.online && st.cfg.gameMode.soloSkip !== false)
      ? t('gm.bannerSolo', { game: esc(st.game) }) + lownet
      : t('gm.banner', { game: esc(st.game) })
        + (st.stoppedByGame.length ? t('gm.bannerCut', { n: st.stoppedByGame.length })
          : st.cfg.gameMode.enabled ? t('gm.bannerNone') : t('gm.bannerOff')) + lownet;
  } else {
    const on = st.bots.filter((b) => b.status === 'online').length;
    bannerCls = 'banner';
    bannerHtml = t('gm.online', { on, total: st.bots.length });
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
      <span class="meta">${b.status === 'online' ? `${t('bots.uptime', { v: fmtUptime(b.uptime) })} · ${fmtMem(b.memory)} · ${b.cpu}% cpu · <span class="net" title="${t('bots.netTitle')}">↓ ${fmtNet(b.netDown)} · ↑ ${fmtNet(b.netUp)}</span>` : stoppedByGame ? t('bots.parked') : esc(b.status)} · ↻ ${b.restarts}</span>
      <label class="chk" title="${t('bots.autobootTitle')}"><input type="checkbox" data-bot="${esc(b.name)}" data-key="auto" ${c.auto !== false ? 'checked' : ''}> ${t('bots.autoboot')}</label>
      <label class="chk" title="${t('bots.gamestopTitle')}"><input type="checkbox" data-bot="${esc(b.name)}" data-key="gameStop" ${c.gameStop ? 'checked' : ''}> ${t('bots.gamestop')}</label>
      ${pendingBots.has(b.name)
        ? '<button class="btn" disabled>⏳…</button>'
        : b.status === 'online'
        ? `<button class="btn" data-act="restart" data-bot="${esc(b.name)}">⟳</button><button class="btn danger" data-act="stop" data-bot="${esc(b.name)}">⏹</button>`
        : `<button class="btn primary" data-act="start" data-bot="${esc(b.name)}">▶</button>`}
      <button class="btn" data-logs="${esc(b.name)}" title="${t('bots.logsTitle')}">📄</button>
      <button class="btn" data-folder="${esc(b.name)}" title="${t('bots.folderTitle')}">📂</button>
      ${isImp ? `<button class="btn danger" data-remove="${esc(b.name)}" title="${t('bots.removeTitle')}">🗑</button>` : ''}
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
    empty = `<div class="tc-warn">${t('tc.pm2Missing')}`
      + `<div class="row" style="margin-top:8px"><button class="btn primary" id="tc-pm2">${t('tc.pm2Install')}</button>`
      + '<span id="tc-pm2-status" style="color:var(--mut);font-size:12px"></span></div></div>';
  } else if (!st.ready) {
    // Au démarrage, la fenêtre s'ouvre avant la fin de la première mesure. Afficher « aucun bot »
    // à ce moment-là est un mensonge inquiétant : on dit ce qui se passe réellement.
    empty = `<div class="hint">${t('bots.searching')}</div>`;
  } else {
    empty = `<div class="hint">${t('bots.none')}</div>`;
  }
  // pm2 muet : ne PAS afficher « aucun bot » (l'écran mentirait alors que tes bots sont peut-être tous morts).
  const health = st.pm2Health || { ok: true };
  if (!health.ok) {
    const mins = health.since ? Math.max(1, Math.round((Date.now() - health.since) / 60000)) : 1;
    empty = `<div class="tc-warn">${t('tc.pm2Down', { min: mins })}`
      + `${health.reason ? ` <span style="opacity:.7">(${esc(health.reason)})</span>` : ''}</div>`;
  }
  // Bandeau « X bots devraient être en ligne » (Auto boot coché, pas arrêtés par toi ni par le mode jeu).
  const nf = st.needFix || [];
  const fixBanner = nf.length
    ? `<div class="tc-warn" style="border-color:#e2b341">${t('bots.fixBanner', { n: nf.length })} : ${esc(nf.join(', '))}`
      + `<div class="row" style="margin-top:8px"><button class="btn primary" id="fix-all">${t('bots.fix')}</button>`
      + '<span id="fix-status" style="color:var(--mut);font-size:12px"></span></div></div>'
    : '';
  // La liste n'est RECONSTRUITE que si son contenu a changé. Attention : la comparaison porte sur du
  // HTML qui contient cpu, mémoire, uptime et débits — quatre valeurs qui bougent à CHAQUE tick pour
  // un bot en ligne. La garde ne tient donc quasiment jamais en usage réel, et ~14 éléments par bot
  // sont détruits/recréés en boucle : les cases à cocher perdent focus et survol, et un clic dont le
  // `mouseup` tombe après un rafraîchissement n'émet aucun `click` (le nœud pressé n'existe plus).
  // D'où le clic qui « ne prend pas ». Tant que le bouton de la souris est ENFONCÉ, on ne remplace
  // donc rien — et surtout on ne met pas `lastBotsHtml` à jour, sinon le changement sauté serait
  // perdu définitivement.
  const botsHtml = (!health.ok ? empty : '') + fixBanner + (
    main.map(botRow).join('') +
    (imps.length ? `<div class="sechead">${t('bots.imported')}</div>${imps.map(botRow).join('')}` : '')
  ) || (fixBanner + empty);
  if (botsHtml !== lastBotsHtml && !sourisEnfoncee) { lastBotsHtml = botsHtml; $('bots').innerHTML = botsHtml; }

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
  const loc = langCourante === 'en' ? 'en-GB' : 'fr-FR';
  $('set-scaninfo').textContent = st.cfg.lastScanAt
    ? t('set.lastScan', { d: new Date(st.cfg.lastScanAt).toLocaleString(loc) })
    : t('set.noScan');
  $('dev-note').textContent = st.cfg.packaged ? '' : t('set.devOnly');
  $('set-rpc').checked = st.cfg.discordRpc !== false;
  if (document.activeElement !== $('set-rpc-id')) $('set-rpc-id').value = st.cfg.discordAppId || '';
  $('set-autoupdate').checked = st.autoApplyUpdates !== false;
  $('set-alerts').checked = st.cfg.alerts !== false;
  // Alertes différées par le plafond horaire : sans ça, l'écran affichait « alertes activées » alors
  // que certaines n'étaient pas parties.
  const supp = $('alert-status');
  if (supp && !supp.textContent.trim()) supp.textContent = st.alertsSuppressed ? t('alerts.suppressed', { n: st.alertsSuppressed }) : '';
  $('set-alert-toast').checked = st.cfg.alertToast !== false;
  $('set-alert-sound').checked = st.cfg.alertSound !== false;
  if (document.activeElement !== $('set-alert-volume')) $('set-alert-volume').value = st.cfg.alertVolume || 10;
  $('alert-vol-val').textContent = `${st.cfg.alertVolume || 10} %`;
  if (document.activeElement !== $('set-alert-webhook')) $('set-alert-webhook').value = st.cfg.alertWebhook || '';
  // Dernière sauvegarde pm2 = ce qui reviendra vraiment au prochain démarrage du PC.
  const sv = $('save-info');
  if (sv) sv.textContent = st.lastSaveAt
    ? t('set.saved', { d: new Date(st.lastSaveAt).toLocaleString(langCourante === 'en' ? 'en-GB' : 'fr-FR') })
    : t('set.savedNever');
  $('rpc-status').textContent = st.cfg.discordRpc === false ? t('rpc.off') : (st.cfg.discordAppId ? t('rpc.on') : t('rpc.needId'));

  $('set-autoheal').checked = st.autoHeal !== false;

  // Derniers incidents — le panel voyait chaque chute et l'oubliait aussitôt. Écrit seulement quand
  // la liste change : c'est du DOM reconstruit, et le sondage passe toutes les 3 s.
  const ICONES = { chute: '⚠️', boucle: '🔁', retour: '✅', relance: '🔧', 'relance-ko': '⛔' };
  const incHtml = (st.incidents || []).length
    ? (st.incidents || []).map((i) => {
      const h = new Date(i.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `<div style="padding:3px 0;border-bottom:1px solid var(--line)">`
        + `<span style="opacity:.7">${esc(h)}</span> ${ICONES[i.kind] || '•'} <b>${esc(i.name)}</b>`
        + (i.cause ? ` — ${esc(i.cause)}` : '') + `</div>`;
    }).join('')
    : t('inc.none');
  if (incHtml !== lastIncHtml) { lastIncHtml = incHtml; $('incidents').innerHTML = incHtml; }

  // Mises à jour
  $('upd-version').textContent = st.cfg.version || '—';
  // ANTI-DOUBLON : dès qu'une mise à jour est en cours ou prête, TOUT se passe dans la carte du haut —
  // barre de progression, notes de version, bouton d'installation, motif d'attente. Ce panneau ne
  // répète plus rien : il masque même son propre bouton « Redémarrer & appliquer », qui faisait
  // doublon avec « Installer et redémarrer » de la carte. Il ne sert plus qu'à la vérification
  // manuelle et à son résultat.
  const enCoursOuPrete = st.updateReady || ['downloading', 'available', 'downloaded'].includes((upd.s || st.updateStatus || {}).state);
  if (enCoursOuPrete) {
    if (!updBusy) $('upd-status').textContent = '';
  } else if (!updBusy && !updMsg) {
    $('upd-status').textContent = st.cfg.packaged ? '' : t('upd.dev');
  }
  // Le bouton n'est grisé QUE pendant un travail réellement en cours. Avant, l'état `available`
  // (poussé une seule fois) le désactivait sans que rien ne le réactive : si le téléchargement
  // n'aboutissait pas — c'était le cas en 1.10.0, où la chaîne de MAJ était cassée —, « Vérifier les
  // mises à jour » restait mort jusqu'au redémarrage du panel.
  const enCours = (upd.s || st.updateStatus || {}).state;
  $('upd-check').disabled = updBusy || enCours === 'downloading';

  // La carte du haut n'apprend les blockers / le réglage auto QUE par ce sondage (l'event n'a que l'état
  // brut de l'updater). `updateStatus` n'est repris que si on n'a rien : sinon un sondage de 3 s
  // écraserait une progression plus fraîche et la barre reculerait.
  upd.ready = !!st.updateReady;
  upd.blockers = st.updateBlockers || [];
  upd.auto = st.autoApplyUpdates !== false;
  upd.current = st.cfg.version || '';
  if (!upd.s && st.updateStatus) upd.s = st.updateStatus;
  paintUpdCard();
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
  // Le corps de l'aide vit dans le fichier de la langue (ui/lang/<code>.js), aux côtés de ses
  // libellés : les deux décrivent les mêmes boutons, les séparer les ferait diverger.
  const corps = window.i18n.about();
  if (corps) {
    return corps.split('{v}').join(esc(v))
      + `<div class="modal-actions"><button class="btn primary" id="modal-close">${t('logs.close')}</button></div>`;
  }
  return `
  <h2>🛡️ Hasu Panel ${esc(v)} — c'est quoi ?</h2>
  <p>Un panneau de contrôle pour <b>tous tes bots</b> : ils tournent en arrière-plan grâce à <b>pm2</b>, et tu les gères ici sans toucher à la console.</p>
  <h3>🤖 La liste des bots</h3>
  <p>Chaque ligne = un bot. Pastille <b style="color:#3ba55d">verte</b> = en ligne, grise = arrêté, <b style="color:#ed4245">rouge</b> = en erreur. Boutons : ▶ démarrer · ⏹ arrêter · ⟳ redémarrer · <b>📄 Logs</b>.</p>
  <p><b>📄 Logs</b> : affiche les <b>dernières lignes du bot</b> (erreurs, plantage…) — pratique pour comprendre pourquoi il est tombé, <b>sans ouvrir de terminal</b>.</p>
  <p><b>Auto boot</b> : coché → le bot est remis en ligne tout seul quand tu allumes le PC. Décoché → il reste éteint au démarrage.</p>
  <p><b>⏹ Tout arrêter</b> (en haut de la liste) coupe <b>tous les bots en ligne</b> d'un coup. Sécurité : il faut cliquer <b>deux fois</b> pour confirmer.</p>
  <p>À chaque arrêt, le panel fait le ménage : les <b>petits programmes lancés par un bot</b> (ffmpeg de la musique, installations en cours…) qui survivaient et encombraient le PC sont <b>fermés proprement</b> eux aussi.</p>
  <p>Si un bot censé tourner est éteint, un <b>bandeau</b> apparaît en tête de liste avec le bouton <b>« Remettre en ordre »</b>, qui les relance tous d'un coup. Il ne compte que ce qui est <b>réellement reparti</b> : si un bot refuse de démarrer (dossier déplacé, fichier manquant), il te le dit au lieu d'annoncer un succès.</p>
  <h3>🔔 Être prévenu quand un bot tombe</h3>
  <p>C'est la raison d'être du panel : ne plus découvrir <b>trois jours plus tard</b> qu'un bot est mort. Quand un bot tombe ou redémarre en boucle, tu reçois une <b>notification Windows discrète</b> accompagnée d'un <b>son doux</b> (volume réglable), et l'alerte indique <b>la cause en français</b> — Internet coupé, token invalide, module manquant, mémoire saturée…</p>
  <p>Le plus utile reste le <b>webhook Discord</b> : il te touche même en pleine partie, ou quand tu n'es pas devant le PC. Dans Discord : <b>Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l'URL</b>, puis colle-la dans ⚙️ Réglages.</p>
  <p>Le panel fait la différence entre une <b>panne</b> et un <b>arrêt volontaire</b> : si tu coupes un bot toi-même — depuis le panel <i>ou</i> depuis un terminal — il ne t'alerte pas et ne le rallume pas au démarrage suivant. Il se tait aussi au réveil du PC et au démarrage, le temps que le réseau revienne, pour ne pas déclencher une rafale d'alertes bidon.</p>
  <p>Si l'envoi échoue — typiquement parce que la panne, c'est justement la coupure Internet — l'alerte est <b>réessayée</b> au lieu d'être perdue. Et si pm2 lui-même ne répond plus, le panel te prévient : sans ça, plus aucune alerte ne serait possible et le silence passerait pour « tout va bien ».</p>
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
  <p>Le panel <b>se met à jour tout seul</b> : il vérifie au lancement puis toutes les 6 h, et tout se passe <b>dans la fenêtre</b>. Une carte apparaît en haut dès qu'une version est trouvée : <b>barre de progression</b> avec pourcentage, vitesse et poids, puis les <b>nouveautés de la version</b> et un bouton <b>« Installer et redémarrer »</b>. « Plus tard » masque la carte — l'installation, elle, suit son cours.</p>
  <p>Tu n'as en principe <b>rien à cliquer</b> : la mise à jour s'installe seule dès que c'est sans risque. Elle ne le fait <b>jamais</b> pendant une partie, ni pendant une manœuvre sur les bots, ni tant que tu regardes la fenêtre — la carte t'indique justement <b>ce qu'elle attend</b>. Ferme la fenêtre et elle s'applique. (Désactivable dans ⚙️ Réglages, avec le bouton « Vérifier les mises à jour » pour forcer un contrôle.)</p>
  <h3>🔋 Économe en ressources</h3>
  <p>Le panel tourne 24h/24 sans se faire remarquer : quand il est <b>réduit dans la zone de notification</b>, il <b>ralentit sa surveillance</b> et arrête de calculer l'affichage inutile. Dès que tu rouvres la fenêtre, tout redevient instantané. (Si le mode jeu ou le faible usage internet est actif, il reste réactif pour ne rien rater.)</p>
  <h3>🎮 Ta présence Discord</h3>
  <p>Option « Rich Presence » : ton profil Discord affiche <b>« 🤖 Gère X bots en ligne »</b> (et le jeu en cours). <b>Rien à configurer</b> — il suffit que Discord soit ouvert. Purement décoratif, désactivable dans ⚙️ Réglages.</p>
  <h3>🧰 Sur un PC neuf (chez un ami)</h3>
  <p>Les bots ont besoin de <b>Node.js</b> et <b>pm2</b>. Si l'un des deux manque, le panel le <b>détecte</b> et propose le bouton qui va bien (« Télécharger Node.js » ou « Installer pm2 ») au lieu d'afficher une liste vide.</p>
  <h3>📁 Bon à savoir</h3>
  <p>• La croix de la fenêtre <b>réduit dans la zone de notification</b> (à côté de l'horloge). Pour quitter : clic droit sur l'icône → Quitter.<br>• Réglages enregistrés dans <code>%APPDATA%\\hasu-panel\\panel-config.json</code>, journal dans <code>panel.log</code>.<br>• Une <b>copie de secours</b> des réglages est tenue à jour à côté (<code>.bak</code>) et reprise automatiquement si le fichier principal devient illisible ou cesse d'être écrit. Si l'enregistrement ne passe plus, un <b>bandeau rouge</b> te le dit — plutôt que de te laisser croire que tes réglages sont sauvegardés.<br>• Le panel se lance tout seul avec Windows (désactivable dans ⚙️ Réglages).</p>
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
// « Illisible » et « vide » ne veulent pas dire la même chose : un fichier tourné par pm2-logrotate
// ou dont l'accès est refusé affichait « Aucun log pour l'instant », ce qui envoie chercher le
// problème au mauvais endroit.
let logsUnreadable = false;
const renderLogsBody = (text) => {
  const pre = $('logs-pre');
  if (!pre) return;
  const f = logsFilter.trim().toLowerCase();
  const lines = String(text || '').split('\n');
  const shown = f ? lines.filter((l) => l.toLowerCase().includes(f)) : lines;
  pre.textContent = shown.join('\n').trim()
    || (f ? t('logs.noMatch', { q: logsFilter })
      : logsUnreadable ? t('logs.unreadable') : t('logs.empty'));
  pre.scrollTop = pre.scrollHeight; // le plus récent est en bas
};
let logsRaw = '';
const openLogs = async (name, which) => {
  which = which === 'err' ? 'err' : 'out';
  const tab = (id, label) => `<button class="btn${which === id ? ' primary' : ''}" data-logtab="${esc(name)}" data-which="${id}">${label}</button>`;
  openModal(`<h3 style="margin:0 0 8px">📄 ${t('logs.title', { name: esc(name) })}</h3>
    <div class="row" style="gap:6px;margin-bottom:8px;flex-wrap:wrap">
      ${tab('out', t('logs.out'))}${tab('err', '⚠️ ' + t('logs.err'))}
      <input type="text" id="logs-filter" placeholder="${t('logs.filterPh')}" style="flex:1;min-width:120px">
      <button class="btn" id="logs-copy">📋 ${t('logs.copy')}</button>
      <button class="btn" id="logs-folder" data-bot="${esc(name)}" title="${t('logs.openFolder')}">📂</button>
    </div>
    <pre id="logs-pre" style="max-height:56vh;overflow:auto;white-space:pre-wrap;word-break:break-word;font:11px/1.5 Consolas,monospace;background:#0b0e16;color:#cdd6f4;padding:10px;border-radius:8px;margin:0">${t('banner.loading')}</pre>
    <div class="modal-actions"><button class="btn primary" id="modal-close">${t('logs.close')}</button></div>`);
  const inp = $('logs-filter');
  if (inp) { inp.value = logsFilter; inp.addEventListener('input', () => { logsFilter = inp.value; renderLogsBody(logsRaw); }); }
  try {
    const r = await window.panel.logs(name, which);
    if (!$('logs-pre')) return; // modale refermée entre-temps
    logsRaw = (r && r.ok) ? r.out : '';
    logsUnreadable = !!(r && r.unreadable);
    if (r && !r.ok) { $('logs-pre').textContent = r.error || 'Impossible de lire les logs.'; return; }
    renderLogsBody(logsRaw);
  } catch { if ($('logs-pre')) $('logs-pre').textContent = t('logs.failed'); }
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
    const zone = document.getElementById('tc-pm2-status'); if (zone) zone.textContent = t('tc.pm2Busy');
    let r; try { r = await window.panel.installPm2(); } catch { r = { ok: false }; }
    if (r.ok) { if (zone) zone.textContent = t('tc.pm2Ok'); setTimeout(refresh, 800); }
    else { t.disabled = false; if (zone) zone.textContent = r.reason === 'no-node' ? window.i18n.t('tc.pm2NoNode') : window.i18n.t('tc.pm2Fail'); }
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
    const s = $('fix-status'); if (s) s.textContent = window.i18n.t('bots.stopAllBusy');
    let r; try { r = await window.panel.fixAll(); } catch { r = null; }
    // Le nombre annoncé est celui des bots RÉELLEMENT repartis, pas des bots tentés : quand une
    // partie échoue, on le dit plutôt que d'annoncer un succès complet.
    if (s) {
      const rates = (r && r.failed) ? r.failed.length : 0;
      s.textContent = !r || !r.ok ? window.i18n.t('bots.stopAllFail')
        : rates ? window.i18n.t('bots.fixPartial', { n: r.started, k: rates })
          : window.i18n.t('bots.fixDone', { n: r.started });
    }
    setTimeout(refresh, 1200);
    return;
  }
  if (t.dataset?.logs) { openLogs(t.dataset.logs, 'out'); return; }
  if (t.dataset?.logtab) { openLogs(t.dataset.logtab, t.dataset.which); return; }
  if (t.id === 'logs-copy') {
    const pre = $('logs-pre');
    // `t` désigne ici la CIBLE du clic (elle masque la fonction de traduction) : on passe par
    // window.i18n.t directement plutôt que de renommer une variable utilisée dans tout le handler.
    if (pre) { try { await navigator.clipboard.writeText(pre.textContent || ''); t.textContent = '✅'; setTimeout(() => { t.textContent = '📋 ' + window.i18n.t('logs.copy'); }, 1400); } catch {} }
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
// Le menu est REMPLI depuis les fichiers de langue réellement chargés : une liste écrite en dur ici
// se désynchroniserait dès qu'on ajoute ou retire une langue.
const remplirMenuLangues = () => {
  const sel = $('lang-select');
  if (!sel || sel.options.length) return;
  for (const { code, nom } of window.i18n.langues()) {
    const o = document.createElement('option');
    o.value = code; o.textContent = nom;
    sel.appendChild(o);
  }
};
remplirMenuLangues();

// Les longs textes explicatifs sont REPLIÉS par défaut et dépliés par un « ? » posé à côté du titre
// de leur section. Ils font un quart de la hauteur de la fenêtre : les garder dépliés obligeait à
// faire défiler pour voir des réglages, alors que ce sont des explications lues une fois.
// On ne replie que les textes PUREMENT explicatifs (ceux portant data-i18n-html) : les zones qui
// affichent un état (incidents, statut de MAJ, dernière sauvegarde, résultat du test d'alerte)
// restent visibles.
const preparerAides = () => {
  document.querySelectorAll('.card').forEach((carte) => {
    const titre = carte.querySelector('h2');
    const aides = [...carte.querySelectorAll('.hint[data-i18n-html], .hint > span[data-i18n-html]')]
      .map((el) => (el.classList.contains('hint') ? el : el.parentElement))
      .filter((el, i, arr) => arr.indexOf(el) === i);
    if (!titre || !aides.length || titre.nextElementSibling?.classList?.contains('aide-btn')) return;
    aides.forEach((el) => el.classList.add('replie'));
    const b = document.createElement('button');
    b.className = 'aide-btn';
    b.textContent = '?';
    b.addEventListener('click', () => {
      const ouvert = aides[0].classList.contains('replie');
      aides.forEach((el) => el.classList.toggle('replie', !ouvert));
      b.classList.toggle('ouvert', ouvert);
    });
    titre.appendChild(b);
  });
};
preparerAides();
$('lang-select').addEventListener('change', async (e) => {
  const choix = e.target.value;
  appliquerLangue(choix);               // effet immédiat, sans attendre l'aller-retour disque
  await window.panel.setSetting('lang', choix);
  await refresh();
});
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
    btn.classList.add('armed'); btn.textContent = t('bots.stopAllArm');
    stopAllTimer = setTimeout(() => { stopAllArmed = false; btn.classList.remove('armed'); btn.textContent = t('bots.stopAll'); }, 4000);
    return;
  }
  clearTimeout(stopAllTimer); stopAllArmed = false;
  btn.classList.remove('armed'); btn.disabled = true; btn.textContent = t('bots.stopAllBusy');
  let r; try { r = await window.panel.stopAll(); } catch { r = null; }
  btn.textContent = (r && r.ok) ? t('bots.stopAllDone', { n: r.stopped }) : t('bots.stopAllFail');
  await refresh();
  setTimeout(() => { btn.disabled = false; btn.textContent = t('bots.stopAll'); }, 1600);
});

// Mises à jour : vérification manuelle + application.
$('upd-check').addEventListener('click', async () => {
  updBusy = true; updMsg = '';
  $('upd-check').disabled = true;
  $('upd-status').textContent = t('upd.searching');
  // Le `finally` plus bas garantit la réactivation du bouton : sans lui, une exception ou un retour
  // inattendu du main laissait « Vérifier les mises à jour » grisé jusqu'au redémarrage du panel.
  let r; try { r = await window.panel.checkUpdate(); } catch (e) { r = { state: 'error', message: e && e.message }; }
  if (!r || typeof r !== 'object') r = { state: 'error', message: 'aucune réponse du panel' };
  // `version`, `current` et `message` viennent du flux de mise à jour DISTANT (electron-updater
  // recopie tel quel le contenu du latest.yml téléchargé dans ses messages d'erreur) : jamais
  // d'interpolation brute dans innerHTML. Le reste du gabarit contient du <b> volontaire, donc on
  // échappe les valeurs une par une plutôt que la chaîne entière.
  const msg = {
    dev: t('upd.dev'),
    uptodate: t('upd.uptodate', { v: esc(r.current || '') }),
    available: t('upd.availableMsg', { v: esc(r.version || '') }),
    downloaded: t('upd.readyMsg'),
    error: t('upd.errorMsg', { d: r.message ? ' (' + esc(r.message) + ')' : '' }),
  }[r.state] || t('upd.unexpected');
  updMsg = msg;
  try { $('upd-status').innerHTML = msg; }
  finally { $('upd-check').disabled = false; updBusy = false; } // le bouton se réactive quoi qu'il arrive
  refresh();
});

// Progression du téléchargement de la MAJ, poussée EN DIRECT par le main (event update-status).
const renderUpdateStatus = (s) => {
  if (!s) return;
  upd.s = s;
  if (s.state === 'downloading' || s.state === 'available') upd.sawDl = true;
  if (s.state === 'downloaded' && s.version !== upd.dismissed) upd.dismissed = ''; // nouvelle version = on ré-affiche
  paintUpdCard();
  // ANTI-DOUBLON : la carte du haut est le SEUL endroit qui montre le déroulé d'une mise à jour
  // (barre de progression, version prête, erreur). Ce panneau répétait exactement la même chose
  // quelques centaines de pixels plus bas — deux barres de téléchargement à l'écran en même temps.
  // Il ne garde que ce que la carte n'affiche pas : le résultat d'une vérification MANUELLE.
  $('upd-status').textContent = '';
  $('upd-check').disabled = (s.state === 'downloading');
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
  if (t.id === 'set-autoheal') { await window.panel.setSetting('autoHeal', t.checked); await refresh(); return; }
  if (t.id === 'set-alerts') { await window.panel.setSetting('alerts', t.checked); await refresh(); return; }
  if (t.id === 'set-alert-toast') { await window.panel.setSetting('alertToast', t.checked); await refresh(); return; }
  if (t.id === 'set-alert-sound') { await window.panel.setSetting('alertSound', t.checked); await refresh(); return; }
  if (t.id === 'set-alert-volume') { await window.panel.setSetting('alertVolume', Number(t.value)); await refresh(); return; }
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
// Le main pousse un signal dès que l'état a changé : au démarrage, la liste des bots s'affiche dès
// qu'elle est connue au lieu d'attendre jusqu'à 3 s le prochain sondage.
if (window.panel.onStatusChanged) window.panel.onStatusChanged(() => refresh());
