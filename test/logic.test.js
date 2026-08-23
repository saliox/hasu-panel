// Tests de la logique pure du panel (logic.js) : versions, bornes, parsing, fenêtre, cadence.
// Chaque cas limite ci-dessous correspond à un vrai piège rencontré (ils sont commentés comme tels).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  semverGt, clampInt, quoteForShell, descendantsOf, parseProcessTree, parseTasklistCsv,
  hasEstablishedPublic, classifyErrorFr, computeDefaultBounds, boundsAreVisible, pollDelayFor,
  cleanNotes, pickCfgSource, seqDe, decideAlert,
} = require('../logic');

// ------------------------------------------- config : quelle copie charger ?
// Régression réelle : panel-config.json est resté figé au 5 juillet pendant six semaines — LISIBLE mais
// plus écrit — pendant que le .bak suivait. L'ancienne règle (« la principale sauf si illisible »)
// rechargeait donc à chaque démarrage des réglages vieux de six semaines, webhook d'alerte compris.
const M = (raw, mtime) => ({ ok: true, raw, mtime });
const KO = { ok: false };

test('pickCfgSource : le principal PÉRIMÉ perd contre un .bak plus récent', () => {
  const r = pickCfgSource(M({ v: 'juillet' }, 1000), M({ v: 'aout' }, 2000));
  assert.equal(r.source, 'bak');
  assert.deepEqual(r.raw, { v: 'aout' });
  assert.match(r.warn, /périmé/);
});

test('pickCfgSource : cas normal — le principal est le plus récent, il gagne sans avertissement', () => {
  const r = pickCfgSource(M({ v: 'neuf' }, 5000), M({ v: 'vieux' }, 4000));
  assert.equal(r.source, 'main');
  assert.equal(r.warn, undefined);
});

test('pickCfgSource : à ÉGALITÉ de date, le principal gagne', () => {
  // saveCfg écrit le .bak AVANT le principal : à mtime égal (granularité du système de fichiers),
  // le principal est au moins aussi frais. Sans cette règle, on basculerait sur le .bak à chaque save.
  assert.equal(pickCfgSource(M({ v: 'a' }, 3000), M({ v: 'b' }, 3000)).source, 'main');
});

test('pickCfgSource : principal illisible → repli sur le .bak (comportement historique conservé)', () => {
  const r = pickCfgSource(KO, M({ v: 'secours' }, 1));
  assert.equal(r.source, 'bak');
  assert.match(r.warn, /illisible/);
});

test('pickCfgSource : .bak absent → on garde le principal, même vieux', () => {
  const r = pickCfgSource(M({ v: 'seul' }, 1), KO);
  assert.equal(r.source, 'main');
  assert.equal(r.warn, undefined);
});

test('pickCfgSource : les deux illisibles → valeurs par défaut', () => {
  assert.equal(pickCfgSource(KO, KO).source, 'defaults');
  assert.equal(pickCfgSource(null, undefined).source, 'defaults');
});

test('pickCfgSource : mtime absente ou corrompue ne fait pas basculer par erreur', () => {
  // Un mtime NaN/undefined vaut 0 : sans la coercition, NaN > NaN est faux mais NaN comparé
  // à un nombre l'était aussi — on veut un comportement défini, pas un hasard.
  assert.equal(pickCfgSource(M({ v: 'a' }), M({ v: 'b' })).source, 'main');
  assert.equal(pickCfgSource(M({ v: 'a' }, NaN), M({ v: 'b' }, 9)).source, 'bak');
  assert.equal(pickCfgSource(M({ v: 'a' }, 9), M({ v: 'b' }, NaN)).source, 'main');
});

// ---------------------- config : le compteur d'ordre prime sur les dates de fichier
// POURQUOI : les dates de modification ne sont pas fiables pour départager deux copies — une
// sauvegarde, un antivirus, une restauration ou un simple script de diagnostic les font mentir.
// Mesuré sur la machine : en 55 démarrages, l'avertissement « principal périmé » n'est apparu que
// 3 fois, dont 2 provoquées par des écritures extérieures pendant un diagnostic. Le compteur, lui,
// voyage AVEC le contenu : il dit ce qu'on veut savoir, quoi que raconte le système de fichiers.
const S = (n, mtime, extra) => ({ ok: true, raw: { _seq: n, ...extra }, mtime });

test('pickCfgSource : le compteur tranche même quand les dates disent l\'inverse', () => {
  // Le principal a une date PLUS RÉCENTE mais un compteur plus BAS : c'est une vieille copie remise
  // en place (restauration, synchronisation, copie de dossier). Les dates se trompent, le compteur non.
  const r = pickCfgSource(S(4, 9000), S(7, 1000));
  assert.equal(r.source, 'bak');
  assert.equal(r.seq, 7, 'le prochain enregistrement doit repartir AU-DESSUS des deux');
  assert.match(r.warn, /sauvegarde plus récente/);
});

test('pickCfgSource : compteur du principal plus haut → il gagne, sans avertissement', () => {
  const r = pickCfgSource(S(9, 1000), S(8, 9000));
  assert.equal(r.source, 'main');
  assert.equal(r.warn, undefined);
  assert.equal(r.seq, 9);
});

test('pickCfgSource : compteurs ÉGAUX → même enregistrement, le principal fait foi', () => {
  // Il est écrit en dernier : à numéro égal, c'est lui la copie de référence.
  const r = pickCfgSource(S(5, 1000, { v: 'a' }), S(5, 9000, { v: 'b' }));
  assert.equal(r.source, 'main');
  assert.equal(r.raw.v, 'a');
  assert.equal(r.seq, 5);
});

test('pickCfgSource : une copie sans compteur a forcément été écrite avant', () => {
  // Migration : la version qui pose des compteurs vient d'arriver. Celle qui en porte un est
  // postérieure, quelle que soit sa date.
  assert.equal(pickCfgSource(M({ v: 'ancien' }, 9000), S(1, 1000)).source, 'bak');
  assert.equal(pickCfgSource(S(1, 1000), M({ v: 'ancien' }, 9000)).source, 'main');
});

test('pickCfgSource : sans aucun compteur, on retombe sur les dates (comportement d\'avant)', () => {
  // Premier démarrage après la mise à jour : les deux copies sont anciennes. On ne casse rien, et le
  // premier enregistrement posera un compteur dans les deux.
  assert.equal(pickCfgSource(M({ v: 'a' }, 1000), M({ v: 'b' }, 2000)).source, 'bak');
  assert.equal(pickCfgSource(M({ v: 'a' }, 2000), M({ v: 'b' }, 1000)).source, 'main');
  assert.equal(pickCfgSource(M({ v: 'a' }, 1000), M({ v: 'b' }, 2000)).seq, 0);
});

test('pickCfgSource : compteur illisible ou absurde ne décide pas à la place des dates', () => {
  for (const pourri of ['abc', -3, null, undefined, NaN, Infinity, {}]) {
    const r = pickCfgSource({ ok: true, raw: { _seq: pourri }, mtime: 1000 }, S(2, 500));
    assert.equal(r.source, 'bak', `_seq=${String(pourri)} doit compter pour absent`);
    assert.equal(r.seq, 2);
  }
  assert.equal(seqDe({ _seq: 3.9 }), 3, 'un fractionnaire est tronqué, pas rejeté');
  assert.equal(seqDe(null), 0);
});

test('pickCfgSource : contenus IDENTIQUES → aucun avertissement, quoi que disent les dates', () => {
  // Le faux positif observé en vrai : les deux fichiers au même octet près, une date qui a bougé
  // toute seule, et le panel annonçait « fichier principal périmé → repli ». Il n'y a rien à
  // départager quand les contenus sont les mêmes — et donc rien à signaler.
  const meme = { v: 'pareil', n: 1 };
  const r = pickCfgSource({ ok: true, raw: { ...meme }, mtime: 1000 }, { ok: true, raw: { ...meme }, mtime: 9000 });
  assert.equal(r.source, 'main');
  assert.equal(r.warn, undefined, 'ne pas alarmer pour deux fichiers identiques');
});

test('pickCfgSource : contenus DIFFÉRENTS à date égale → on tranche quand même', () => {
  // La sortie « identiques » ne doit pas avaler les vrais cas : ici les copies divergent réellement.
  const r = pickCfgSource(M({ v: 'a' }, 1000), M({ v: 'b' }, 9000));
  assert.equal(r.source, 'bak');
  assert.match(r.warn, /périmé/);
});

test('pickCfgSource : un fichier principal MASQUÉ reste détecté — la sortie « identiques » ne le couvre pas', () => {
  // LE scénario de la panne de juillet, établi par l'enquête : le fichier principal cesse d'être écrit
  // (il est masqué par une couche de virtualisation) et se fige, pendant que le .bak continue d'avancer.
  // L'avertissement est alors VRAI, et c'est le seul témoin — il ne doit surtout pas être étouffé.
  //
  // La sortie anticipée « contenus identiques » ne peut PAS le couvrir : le compteur fait partie du
  // contenu, donc dès qu'un enregistrement est perdu les deux copies diffèrent forcément, ne serait-ce
  // que par lui. C'est ce que ce test verrouille.
  const gele = { _seq: 10, webhook: 'ancien', alerts: false };
  const frais = { _seq: 57, webhook: 'a-jour', alerts: true };
  const r = pickCfgSource({ ok: true, raw: gele, mtime: 1000 }, { ok: true, raw: frais, mtime: 2000 });
  assert.equal(r.source, 'bak', 'les réglages à jour doivent être chargés');
  assert.ok(r.warn, 'et la panne doit rester signalée');
  assert.equal(r.raw.webhook, 'a-jour');
  assert.equal(r.seq, 57, 'le prochain enregistrement passe devant les deux → il réaligne le principal');

  // Même figé, si SEULE la date diffère et que le contenu est au même octet près, il n'y a rien à
  // signaler : les deux copies portent le même enregistrement, aucun réglage n'est en retard.
  const memeSauvegarde = { _seq: 10, webhook: 'ancien', alerts: false };
  const q = pickCfgSource({ ok: true, raw: gele, mtime: 1000 }, { ok: true, raw: memeSauvegarde, mtime: 9999 });
  assert.equal(q.warn, undefined);
});

test('pickCfgSource : le compteur remonte même quand une seule copie est lisible', () => {
  // Sinon un enregistrement fait après un .bak illisible repartirait de zéro, donc DERRIÈRE la copie
  // qu'on vient de lire — et le choix suivant redeviendrait arbitraire.
  assert.equal(pickCfgSource(S(12, 1), KO).seq, 12);
  assert.equal(pickCfgSource(KO, S(12, 1)).seq, 12);
  assert.equal(pickCfgSource(KO, KO).seq, 0);
});

// ------------------------------------------------- notes de version (MAJ)
test('cleanNotes : le HTML de GitHub devient des lignes de texte', () => {
  const html = '<h2>Nouveautés</h2><ul><li>Son doux sur les alertes</li><li>Carte de MAJ</li></ul><p>Fin</p>';
  assert.deepEqual(cleanNotes(html), ['Nouveautés', '• Son doux sur les alertes', '• Carte de MAJ', 'Fin']);
});

test('cleanNotes : entités HTML — & décodé en DERNIER (sinon double décodage)', () => {
  // Piège : décoder &amp; d'abord transformerait « &amp;lt; » (un < littéral échappé) en vrai « < ».
  assert.deepEqual(cleanNotes('<p>A &amp;lt;b&amp;gt; B &amp; C</p>'), ['A &lt;b&gt; B & C']);
  assert.deepEqual(cleanNotes('<p>&quot;x&quot; &#39;y&#39;&nbsp;z</p>'), ['"x" \'y\' z']);
});

test('cleanNotes : aucune balise ne survit (contenu de release = donnée non fiable)', () => {
  const out = cleanNotes('<script>alert(1)</script><img src=x onerror=alert(1)><b>gras</b>');
  assert.equal(out.join('\n').includes('<'), false, 'une balise a survécu');
  assert.equal(out.join('\n').includes('>'), false);
});

test('cleanNotes : tableau {version, note} d\'electron-updater', () => {
  assert.deepEqual(cleanNotes([{ version: '1.9.3', note: '<li>A</li><li>B</li>' }]), ['• A', '• B']);
});

test('cleanNotes : vide, null, et plafond de lignes', () => {
  assert.deepEqual(cleanNotes(null), []);
  assert.deepEqual(cleanNotes(''), []);
  assert.deepEqual(cleanNotes('<p></p><p>   </p>'), [], 'les lignes vides sont retirées');
  const long = Array.from({ length: 30 }, (_, i) => `<li>ligne ${i}</li>`).join('');
  assert.equal(cleanNotes(long).length, 8, 'une release bavarde ne doit pas envahir la carte');
  assert.equal(cleanNotes(long, 3).length, 3);
});

// ---------------------------------------------------------------- semverGt
test('semverGt : comparaison de base', () => {
  assert.equal(semverGt('1.8.1', '1.8.0'), true);
  assert.equal(semverGt('1.9.0', '1.10.0'), false, '10 > 9 en numérique, pas en texte');
  assert.equal(semverGt('2.0.0', '1.99.99'), true);
  assert.equal(semverGt('1.8.0', '1.8.0'), false, 'égal n\'est pas supérieur');
});

test('semverGt : préfixe « v » (sinon parseInt("v1") = NaN → 0)', () => {
  assert.equal(semverGt('v1.8.1', '1.8.0'), true);
  assert.equal(semverGt('1.8.1', 'v1.8.0'), true);
});

test('semverGt : pré-release et métadonnées de build ignorées', () => {
  // parseInt("5-rc") vaut 5 : sans découpe, « 1.7.5-rc.1 » passait pour ÉGAL à « 1.7.5 ».
  assert.equal(semverGt('1.7.5-rc.1', '1.7.5'), false);
  assert.equal(semverGt('1.7.6-rc.1', '1.7.5'), true);
  assert.equal(semverGt('1.7.5+build9', '1.7.5'), false);
});

test('semverGt : entrées incomplètes ou invalides ne plantent pas', () => {
  assert.equal(semverGt('1.9', '1.8.7'), true, 'champ manquant = 0');
  assert.equal(semverGt('', '1.0.0'), false);
  assert.equal(semverGt(null, undefined), false);
  assert.equal(semverGt('abc', 'def'), false);
});

// ---------------------------------------------------------------- clampInt
test('clampInt : borne, tronque et retombe sur le défaut', () => {
  assert.equal(clampInt(50, 5, 120, 10), 50);
  assert.equal(clampInt(1, 5, 120, 10), 5, 'sous la borne basse');
  assert.equal(clampInt(999, 5, 120, 10), 120, 'au-dessus de la borne haute');
  assert.equal(clampInt(10.9, 5, 120, 10), 10, 'tronqué vers le bas');
  assert.equal(clampInt('42', 5, 120, 10), 42, 'chaîne numérique acceptée');
});

test('clampInt : une valeur corrompue retombe sur le défaut (protège la boucle de sondage)', () => {
  // Un NaN qui atteignait pollDelayMs transformait la boucle en boucle folle (spawns en continu).
  for (const bad of ['10x', 'abc', NaN, undefined, null, {}, [], Infinity, -Infinity]) {
    assert.equal(clampInt(bad, 5, 120, 10), 10, String(bad));
  }
});

// ---------------------------------------------------------- quoteForShell
test('quoteForShell : ne cite que si nécessaire', () => {
  assert.equal(quoteForShell('C:\\bots\\index.js'), 'C:\\bots\\index.js', 'sans espace : inchangé');
  assert.equal(quoteForShell('C:\\mes bots\\index.js'), '"C:\\mes bots\\index.js"');
});

test('quoteForShell : un chemin finissant par « \\ » ne casse pas cmd', () => {
  // « "D:\" » : cmd lit le \" final comme un guillemet échappé et fusionne les jetons suivants.
  assert.equal(quoteForShell('D:\\mes jeux\\'), '"D:\\mes jeux\\."');
});

// ---------------------------------------------------------- descendantsOf
const tree = (pairs) => { const m = new Map(); for (const [p, kids] of pairs) m.set(p, kids); return m; };

test('descendantsOf : descend récursivement', () => {
  const t = tree([[100, [200, 201]], [200, [300]], [300, [400]]]);
  assert.deepEqual(descendantsOf(t, 100).sort((a, b) => a - b), [200, 201, 300, 400]);
});

test('descendantsOf : PID sans enfant ou invalide', () => {
  assert.deepEqual(descendantsOf(tree([]), 100), []);
  for (const bad of [0, -1, 'abc', null, undefined, 1.5]) assert.deepEqual(descendantsOf(tree([]), bad), [], String(bad));
});

test('descendantsOf : un cycle (PID recyclé) ne boucle pas à l\'infini', () => {
  const t = tree([[100, [200]], [200, [100, 300]]]); // 200 « enfant » de 100 et inversement
  const r = descendantsOf(t, 100);
  assert.ok(r.includes(200) && r.includes(300));
  assert.ok(r.length < 10, 'terminé sans exploser');
});

test('descendantsOf : borne dure à 500', () => {
  const kids = Array.from({ length: 900 }, (_, i) => i + 2);
  assert.equal(descendantsOf(tree([[1, kids]]), 1).length, 500);
});

// --------------------------------------------------------- parseProcessTree
test('parseProcessTree : construit la table parent→enfants et les dates de création', () => {
  const { children, born } = parseProcessTree('100:4:63800\n200:100:63900\n201:100:\nligne invalide\n');
  assert.deepEqual(children.get(100), [200, 201]);
  assert.equal(born.get(200), '63900');
  assert.equal(born.get(201), '', 'date indisponible tolérée');
  assert.equal(children.has(999), false);
});

test('parseProcessTree : entrée vide', () => {
  const { children, born } = parseProcessTree('');
  assert.equal(children.size, 0); assert.equal(born.size, 0);
});

// --------------------------------------------------------- parseTasklistCsv
test('parseTasklistCsv : noms en minuscules + PID groupés', () => {
  const out = '"Fortnite.exe","1234","Console"\n"chrome.exe","10","C"\n"chrome.exe","11","C"\n';
  const { names, pids } = parseTasklistCsv(out);
  assert.ok(names.has('fortnite.exe'));
  assert.deepEqual(pids.get('chrome.exe'), [10, 11], 'plusieurs PID pour un même exe');
});

test('parseTasklistCsv : lignes malformées ignorées', () => {
  const { names } = parseTasklistCsv('poubelle\n\n"ok.exe","5","C"\n');
  assert.equal(names.size, 1);
});

// ------------------------------------------------------ hasEstablishedPublic
const NS = (rows) => rows.map((r) => '  ' + r.join('  ')).join('\n');

test('hasEstablishedPublic : connexion établie vers Internet = partie en ligne', () => {
  const out = NS([['TCP', '192.168.1.10:5000', '13.107.4.50:443', 'ESTABLISHED', '1234']]);
  assert.equal(hasEstablishedPublic(out, [1234]), true);
});

test('hasEstablishedPublic : LAN seul = partie solo (on ne coupe pas les bots)', () => {
  const out = NS([['TCP', '192.168.1.10:5000', '192.168.1.20:443', 'ESTABLISHED', '1234']]);
  assert.equal(hasEstablishedPublic(out, [1234]), false);
});

test('hasEstablishedPublic : ignore les autres PID, les états non établis, l\'écoute', () => {
  const out = NS([
    ['TCP', '0.0.0.0:80', '0.0.0.0:0', 'LISTENING', '1234'],
    ['TCP', '192.168.1.10:5000', '13.107.4.50:443', 'TIME_WAIT', '1234'],
    ['TCP', '192.168.1.10:5001', '13.107.4.50:443', 'ESTABLISHED', '9999'],
  ]);
  assert.equal(hasEstablishedPublic(out, [1234]), false);
});

test('hasEstablishedPublic : IPv6 entre crochets', () => {
  const out = NS([['TCP', '[::1]:5000', '[2606:4700::1111]:443', 'ESTABLISHED', '1234']]);
  assert.equal(hasEstablishedPublic(out, [1234]), true);
});

test('hasEstablishedPublic : aucun PID / sortie vide', () => {
  assert.equal(hasEstablishedPublic('', [1234]), false);
  assert.equal(hasEstablishedPublic(NS([['TCP', 'a:1', '8.8.8.8:53', 'ESTABLISHED', '1']]), []), false);
});

// ----------------------------------------------------------- classifyErrorFr
test('classifyErrorFr : reconnaît les pannes courantes', () => {
  assert.match(classifyErrorFr('Error: getaddrinfo ENOTFOUND discord.com'), /DNS/);
  assert.match(classifyErrorFr('Error [TOKEN_INVALID]: An invalid token'), /[Tt]oken/);
  assert.match(classifyErrorFr('Error: Cannot find module \'discord.js\''), /Module manquant/);
  assert.match(classifyErrorFr('SyntaxError: Unexpected token }'), /syntaxe/);
  assert.match(classifyErrorFr('Error: listen EADDRINUSE :::3000'), /Port/);
  assert.match(classifyErrorFr('FATAL ERROR: heap out of memory'), /Mémoire/);
  assert.match(classifyErrorFr('Error: connect ECONNREFUSED 1.2.3.4:443'), /réseau/);
});

test('classifyErrorFr : ORDRE des règles — la plus spécifique gagne', () => {
  // Un log réel contient souvent plusieurs signatures ; l'ordre doit être stable et intentionnel.
  const mixte = 'Error: connect ECONNRESET\nSyntaxError: Unexpected token }';
  assert.match(classifyErrorFr(mixte), /syntaxe/, 'une erreur de syntaxe prime sur un aléa réseau');
  const dnsEtReseau = 'ETIMEDOUT\ngetaddrinfo ENOTFOUND discord.com';
  assert.match(classifyErrorFr(dnsEtReseau), /DNS/, 'DNS prime : c\'est la cause, le timeout la conséquence');
});

test('classifyErrorFr : sans signature connue → dernière ligne tronquée', () => {
  assert.equal(classifyErrorFr('bla\nsouci inconnu ici'), 'souci inconnu ici');
  assert.equal(classifyErrorFr('x'.repeat(200)).length, 120, 'tronqué à 120');
  assert.equal(classifyErrorFr(''), '');
  assert.equal(classifyErrorFr(null), '');
});

test('classifyErrorFr : un numéro de LIGNE 401 dans la pile ne doit pas passer pour un HTTP 401', () => {
  // La règle « 401 » passe AVANT celles de SyntaxError et de module manquant : sans neutralisation
  // des positions fichier:ligne:colonne, une erreur de syntaxe à la ligne 401 était annoncée dans
  // l'alerte Discord comme « Token invalide » — le diagnostic le plus trompeur possible.
  assert.equal(classifyErrorFr('SyntaxError: Unexpected token }\n    at Object..js (C:/bots/x/index.js:401:9)'),
    'Erreur de syntaxe dans le code');
  assert.equal(classifyErrorFr('Error: connect ECONNREFUSED\n    at TCP (net.js:401)'),
    'Connexion réseau refusée ou coupée');
  assert.equal(classifyErrorFr('Cannot find module discord.js\n    at Module._load (node:internal/modules/cjs/loader:401:12)'),
    'Module manquant (npm install à refaire)');
  // …tout en gardant les VRAIS 401
  assert.equal(classifyErrorFr('DiscordAPIError[401]: Unauthorized'), 'Token invalide ou intents Discord manquants');
  assert.equal(classifyErrorFr('Request failed with status code 401'), 'Token invalide ou intents Discord manquants');
});

// ----------------------------------------------------- fenêtre : dimensions
test('computeDefaultBounds : grande fenêtre, centrée, qui tient à l\'écran', () => {
  const b = computeDefaultBounds({ x: 0, y: 0, width: 1920, height: 1032 });
  assert.equal(b.width, 1651); assert.equal(b.height, 929);
  assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 1920 && b.y + b.height <= 1032);
  // Le point de la demande : sur un écran courant, l'ouverture doit être GRANDE, pas timide.
  assert.ok(b.width / 1920 > 0.8 && b.height / 1032 > 0.85, 'fenêtre trop petite à l\'ouverture');
});

test('computeDefaultBounds : petit écran — la fenêtre ne déborde jamais', () => {
  // Cas piège : le plancher (820) dépasse la hauteur utile d'un 1280x720.
  for (const [w, h] of [[1366, 720], [1280, 672], [1024, 600]]) {
    const b = computeDefaultBounds({ x: 0, y: 0, width: w, height: h });
    assert.ok(b.width <= w, `largeur ${b.width} > ${w}`);
    assert.ok(b.height <= h, `hauteur ${b.height} > ${h}`);
  }
});

test('computeDefaultBounds : très grand écran — plafonné pour rester lisible', () => {
  const b = computeDefaultBounds({ x: 0, y: 0, width: 3840, height: 2112 });
  assert.equal(b.width, 1800); assert.equal(b.height, 1150);
});

test('computeDefaultBounds : écran secondaire (origine décalée)', () => {
  const b = computeDefaultBounds({ x: 1920, y: 0, width: 1920, height: 1032 });
  assert.ok(b.x >= 1920, 'la fenêtre reste sur cet écran');
});

// ---------------------------------------------------- fenêtre : visibilité
const disp = (x, y, w, h) => ({ workArea: { x, y, width: w, height: h } });

test('boundsAreVisible : fenêtre sur l\'écran principal', () => {
  assert.equal(boundsAreVisible({ x: 100, y: 100, width: 1200, height: 800 }, [disp(0, 0, 1920, 1032)]), true);
});

test('boundsAreVisible : moniteur débranché → bornes rejetées', () => {
  // Position sur un 2e écran qui n'existe plus : sans ce test la fenêtre s'ouvrait hors champ.
  assert.equal(boundsAreVisible({ x: 2500, y: 200, width: 1200, height: 800 }, [disp(0, 0, 1920, 1032)]), false);
});

test('boundsAreVisible : reste vrai tant qu\'une portion attrapable est visible', () => {
  assert.equal(boundsAreVisible({ x: 1800, y: 100, width: 1200, height: 800 }, [disp(0, 0, 1920, 1032)]), true);
  assert.equal(boundsAreVisible({ x: 1900, y: 100, width: 1200, height: 800 }, [disp(0, 0, 1920, 1032)]), false,
    'moins de 80 px visibles = inattrapable');
});

test('boundsAreVisible : deuxième écran branché → accepté', () => {
  assert.equal(boundsAreVisible({ x: 2500, y: 200, width: 1200, height: 800 },
    [disp(0, 0, 1920, 1032), disp(1920, 0, 1920, 1032)]), true);
});

test('boundsAreVisible : entrées invalides', () => {
  assert.equal(boundsAreVisible(null, [disp(0, 0, 1920, 1032)]), false);
  assert.equal(boundsAreVisible({ x: NaN, y: 0, width: 900, height: 600 }, [disp(0, 0, 1920, 1032)]), false);
  assert.equal(boundsAreVisible({ x: 0, y: 0, width: 900, height: 600 }, []), false, 'aucun écran');
});

// ------------------------------------------------------------ pollDelayFor
const CFG = (o = {}) => ({ pollSec: 10, idlePollSec: 30, lowNet: false, gameMode: { enabled: false }, ...o });

test('pollDelayFor : fenêtre visible → cadence réactive', () => {
  assert.equal(pollDelayFor(true, CFG()), 10000);
});

test('pollDelayFor : dans la zone de notification → ralenti (économie batterie)', () => {
  assert.equal(pollDelayFor(false, CFG()), 30000);
});

test('pollDelayFor : caché MAIS une bascule auto en dépend → reste réactif (15 s max)', () => {
  assert.equal(pollDelayFor(false, CFG({ gameMode: { enabled: true } })), 15000);
  assert.equal(pollDelayFor(false, CFG({ lowNet: true })), 15000);
});

test('pollDelayFor : un sondage lent l\'emporte sur la cadence ralentie', () => {
  assert.equal(pollDelayFor(false, CFG({ pollSec: 60, idlePollSec: 30 })), 60000);
});

// -------------------------------------------------------- makeChimeWav
const { makeChimeWav } = require('../logic');

test('makeChimeWav : produit un WAV PCM valide', () => {
  const w = makeChimeWav();
  assert.equal(w.slice(0, 4).toString(), 'RIFF');
  assert.equal(w.slice(8, 12).toString(), 'WAVE');
  assert.equal(w.readUInt16LE(20), 1, 'format PCM');
  assert.equal(w.readUInt16LE(22), 1, 'mono');
  assert.equal(w.readUInt16LE(34), 16, '16 bits');
  assert.equal(w.readUInt32LE(24), 44100);
  assert.equal(w.readUInt32LE(4), w.length - 8, 'taille RIFF cohérente');
  assert.equal(w.readUInt32LE(40), w.length - 44, 'taille du bloc data cohérente');
});

test('makeChimeWav : reste DOUX (le volume est le point de la fonctionnalité)', () => {
  const peak = (buf) => { let m = 0; for (let i = 44; i < buf.length; i += 2) m = Math.max(m, Math.abs(buf.readInt16LE(i))); return m / 32767; };
  assert.ok(peak(makeChimeWav()) < 0.15, 'défaut discret (< 15 % du maximum)');
  // Le volume demandé doit réellement changer l'amplitude, de façon monotone.
  assert.ok(peak(makeChimeWav({ amplitude: 0.5 })) > peak(makeChimeWav({ amplitude: 0.1 })));
});

test('makeChimeWav : amplitude bornée, jamais de saturation', () => {
  const peak = (buf) => { let m = 0; for (let i = 44; i < buf.length; i += 2) m = Math.max(m, Math.abs(buf.readInt16LE(i))); return m / 32767; };
  assert.ok(peak(makeChimeWav({ amplitude: 5 })) <= 1, 'amplitude > 1 écrêtée, pas de dépassement');
  assert.ok(peak(makeChimeWav({ amplitude: -1 })) === 0, 'amplitude négative → silence');
});

test('makeChimeWav : court (une notification ne doit pas s\'éterniser)', () => {
  const secondes = (makeChimeWav().readUInt32LE(40) / 2) / 44100;
  assert.ok(secondes > 0.1 && secondes < 1, `durée ${secondes}s hors plage raisonnable`);
});

// ------------------------------- statuts pm2 de PASSAGE (stopping / launching)
const { decideAlert: dA, TRANSIENT_MAX_TICKS } = require('../logic');
const tr = (p, s, opts = {}) => dA({ status: p, restarts: opts.pr || 0 }, { status: s, restarts: opts.r || 0 },
  { name: 'x', transientTicks: opts.t || 0, ...opts.ctx });

test('decideAlert : « stopping » n\'est pas une chute — pas de fausse alerte sur un pm2 stop', () => {
  // Le sondage tombe dans la fenêtre kill_timeout environ une fois sur six : sans ça, un simple
  // `pm2 stop` tapé au terminal envoyait « ⚠️ x est tombé » sur Discord.
  for (const s of ['stopping', 'launching', 'one-launch-status']) {
    const d = tr('online', s);
    assert.equal(d.alert, null, `« ${s} » ne doit pas alerter`);
    assert.equal(d.hold, true, `« ${s} » doit demander de figer l'instantané`);
  }
});

test('decideAlert : la tolérance est BORNÉE — un bot coincé en « launching » finit par être signalé', () => {
  // Sans borne, un bot bloqué (wait_ready qui n'arrive jamais) devenait invisible à la surveillance.
  assert.equal(tr('online', 'launching', { t: TRANSIENT_MAX_TICKS - 1 }).hold, true);
  assert.equal(tr('online', 'launching', { t: TRANSIENT_MAX_TICKS }).alert, 'down');
  assert.equal(tr('online', 'launching', { t: TRANSIENT_MAX_TICKS }).hold, false);
});

test('decideAlert : un redémarrage en boucle passe AVANT la tolérance', () => {
  // 'launching' est justement l'état d'un bot qui boucle : le suspendre masquerait la panne.
  assert.equal(tr('online', 'launching', { r: 9, pr: 0 }).alert, 'looping');
});

test('decideAlert : l\'arrêt volontaire reste détecté après le passage par « stopping »', () => {
  // C'est tout l'intérêt de figer l'instantané : au tick suivant, prev vaut encore 'online'.
  assert.equal(tr('online', 'stopped').setManualStop, true);
});

// ------------------------------------------ fuite de données dans les alertes
// Le corps de l'alerte part vers un webhook Discord. Quand aucune règle ne reconnaît l'erreur, on
// renvoie la dernière ligne BRUTE du log : elle contient couramment le chemin personnel complet et
// parfois une adresse IP. Contrainte du projet : aucune IP ne sort de la machine.
const { redactSensitive } = require('../logic');

test('redactSensitive : les adresses IP ne sortent jamais', () => {
  assert.equal(redactSensitive('connect ETIMEDOUT 104.16.59.5:443'), 'connect ETIMEDOUT [ip]:443');
  assert.equal(redactSensitive('bind 192.168.1.42'), 'bind [ip]');
  assert.match(redactSensitive('listen fe80::1c2d:3e4f:5a6b:7c8d'), /\[ipv6\]/);
});

test('redactSensitive : le prénom dans le chemin Windows disparaît', () => {
  const s = redactSensitive('at Object.<anonymous> (C:\\Users\\teamf\\Desktop\\bot\\index.js)');
  assert.equal(s.includes('teamf'), false, 'le nom d\'utilisateur ne doit pas partir sur Discord');
  assert.ok(s.includes('C:\\Users\\[…]'), s);
  assert.match(s, /Desktop/, 'le reste du chemin reste utile au diagnostic');
});

test('redactSensitive : chemins POSIX, et texte sans rien à masquer inchangé', () => {
  assert.match(redactSensitive('at /home/salomon/bot/index.js'), /\/home\/\[…\]/);
  assert.equal(redactSensitive('Une erreur bizarre sans motif connu'), 'Une erreur bizarre sans motif connu');
  assert.equal(redactSensitive(''), '');
  assert.equal(redactSensitive(null), '');
});

test('redactSensitive : un nom de session AVEC ESPACE est masqué en ENTIER', () => {
  // Trou réel : la règle s'arrêtait au premier blanc. « C:\\Users\\Jean Dupont\\… » ne masquait que
  // « Jean » — le nom de famille partait vers le webhook Discord. Les noms avec espace sont courants.
  const s = redactSensitive('erreur dans C:\\Users\\Jean Dupont\\AppData\\panel.log');
  assert.equal(/Dupont/.test(s), false, 'le nom de famille ne doit pas survivre');
  assert.equal(/Jean/.test(s), false);
  assert.ok(s.includes('C:\\Users\\[…]'), s);
});

test('redactSensitive : la lettre de lecteur est CONSERVÉE', () => {
  // Elle était réécrite en « C: » : l'alerte désignait alors un chemin qui n'existe pas, et le
  // message devenait inutilisable pour aller voir le dossier incriminé.
  assert.ok(redactSensitive('D:\\Users\\bob\\x.log').startsWith('D:\\Users\\[…]'));
  assert.ok(redactSensitive('E:\\Users\\bob\\x.log').startsWith('E:\\Users\\[…]'));
});

test('redactSensitive : les deux séparateurs, sans se marcher dessus', () => {
  // « c:/users/… » est un chemin Windows valide et n'était pas reconnu. Et la règle POSIX repassait
  // derrière la règle Windows, transformant « c:/Users/[…] » en « c:/home/[…] » — inexistant.
  const s = redactSensitive('c:/users/teamf/app/x.js');
  assert.equal(/teamf/.test(s), false);
  assert.equal(/home/.test(s), false, 'un chemin Windows ne doit pas devenir un chemin Linux');
  assert.ok(s.startsWith('c:/Users/[…]'), s);
});

test('classifyErrorFr : le repli est expurgé avant de partir en alerte', () => {
  const out = classifyErrorFr('Boom inattendu chez C:\\Users\\teamf\\bot depuis 10.0.0.7');
  assert.equal(out.includes('teamf'), false);
  assert.equal(out.includes('10.0.0.7'), false);
  // …mais le repli reste informatif : c'est le cas où l'alerte sert le plus.
  assert.match(out, /Boom inattendu/);
});

// --------------------------------------- relance automatique d'un bot tombé
// Le panel constatait les pannes sans jamais les réparer : quatre bots morts cinq jours durant sur
// cette machine. La décision « est-ce le moment de retenter ? » est ici ; l'exécution est dans main.js.
const { shouldAutoHeal, AUTO_HEAL_DELAYS_MS } = require('../logic');
const MIN = 60 * 1000;
const T = 1_700_000_000_000;

test('shouldAutoHeal : rien avant le premier délai', () => {
  assert.equal(shouldAutoHeal(T, T - 2 * MIN, 0), false);
  assert.equal(shouldAutoHeal(T, T - 4 * MIN, 0), false);
  assert.equal(shouldAutoHeal(T, T - 5 * MIN, 0), true, 'exactement 5 min = on tente');
});

test('shouldAutoHeal : espacement CROISSANT entre les essais', () => {
  // Les délais se comptent depuis la chute, pas depuis l'essai précédent.
  assert.equal(shouldAutoHeal(T, T - 6 * MIN, 1), false, '6 min : trop tôt pour le 2e essai');
  assert.equal(shouldAutoHeal(T, T - 15 * MIN, 1), true);
  assert.equal(shouldAutoHeal(T, T - 30 * MIN, 2), false, '30 min : trop tôt pour le 3e');
  assert.equal(shouldAutoHeal(T, T - 60 * MIN, 2), true);
});

test('shouldAutoHeal : PLAFOND à 3 essais — on cesse et on laisse l\'alerte parler', () => {
  // S'acharner ne répare pas un dossier déplacé ou un token révoqué, et noierait l'alerte.
  assert.equal(shouldAutoHeal(T, T - 24 * 60 * MIN, 3), false);
  assert.equal(shouldAutoHeal(T, T - 24 * 60 * MIN, 9), false);
  assert.equal(AUTO_HEAL_DELAYS_MS.length, 3);
});

test('shouldAutoHeal : date de chute inconnue ou corrompue → on ne tente rien', () => {
  // Ce retour déclenche un `pm2 start` : dans le doute, il ne se passe rien.
  for (const bad of [0, -1, NaN, undefined, null, 'hier', {}]) {
    assert.equal(shouldAutoHeal(T, bad, 0), false, String(bad));
  }
  assert.equal(shouldAutoHeal(T, T - 60 * MIN, NaN), true, 'un compteur d\'essais corrompu vaut 0');
});

// ------------------------------------- branches défensives (entrées dégradées)
// Chaque cas ci-dessous correspond à une branche que la couverture signalait comme jamais prise, et
// à une entrée RÉALISTE : champ de config vide, commande système muette, API écran en échec.
test('clampInt : une chaîne VIDE retombe sur le défaut (champ de formulaire effacé)', () => {
  // Number('') vaut 0 : sans la garde, un pollSec effacé devenait 5 s et doublait la cadence.
  assert.equal(clampInt('', 5, 120, 10), 10);
  assert.equal(clampInt('   ', 5, 120, 10), 10);
});

test('parseTasklistCsv / hasEstablishedPublic : sortie muette ou PID absents', () => {
  // tasklist peut renvoyer une chaîne vide (charge disque, blocage antivirus) : pas de plantage.
  const r = parseTasklistCsv(undefined);
  assert.equal(r.names.size, 0);
  assert.equal(parseTasklistCsv('').names.size, 0);
  assert.equal(hasEstablishedPublic('TCP 1.2.3.4:1 5.6.7.8:2 ESTABLISHED 42', undefined), false);
  assert.equal(hasEstablishedPublic(undefined, [42]), false);
});

test('decideAlert : instantané précédent absent (premier tick) → aucune décision', () => {
  assert.equal(decideAlert(null, { status: 'stopped', restarts: 0 }, { name: 'x' }).alert, null);
  assert.equal(decideAlert({ status: 'online', restarts: 0 }, null, { name: 'x' }).alert, null);
});

test('computeDefaultBounds / boundsAreVisible : API écran en échec', () => {
  // screen.getPrimaryDisplay() peut lever (session verrouillée, écran débranché) : on veut une
  // fenêtre utilisable plutôt qu'un plantage au démarrage.
  const b = computeDefaultBounds(undefined);
  assert.ok(b.width > 0 && b.height > 0);
  assert.equal(boundsAreVisible({ x: 0, y: 0, width: 800, height: 600 }, undefined), false);
  // Un écran renvoyé SANS workArea (formes dégradées d'Electron) : on retombe sur l'objet lui-même.
  assert.equal(boundsAreVisible({ x: 100, y: 100, width: 800, height: 600 },
    [{ x: 0, y: 0, width: 1920, height: 1080 }]), true);
});

test('pollDelayFor : idlePollSec absent → 30 s par défaut', () => {
  assert.equal(pollDelayFor(false, { pollSec: 10 }), 30000);
});

test('cleanNotes : entrées de tableau sans champ « note »', () => {
  // electron-updater renvoie parfois [{version, note: null}] : ne doit produire aucune ligne fantôme.
  assert.deepEqual(cleanNotes([{ version: '1.0.0' }]), []);
  assert.deepEqual(cleanNotes([{ version: '1.0.0', note: null }, { note: '<li>vrai</li>' }]), ['• vrai']);
});

// ------------------- nettoyage de l'historique et de l'état de surveillance
// Extraits de loadCfg pour être testables : ces structures viennent d'un fichier JSON sur le disque
// (éditable à la main, corruptible) et alimentent des relances `pm2 start`.
const { sanitizeIncidents, sanitizeRuntime } = require('../logic');

test('sanitizeIncidents : garde les entrées valides, borne la taille, tronque les champs', () => {
  const brut = [{ at: 1, name: 'saliox', kind: 'chute', cause: 'x'.repeat(500) }];
  const out = sanitizeIncidents(brut);
  assert.equal(out.length, 1);
  assert.equal(out[0].cause.length, 160, 'la cause est tronquée');
  // kind absent : un incident écrit par une version future/plus ancienne ne doit pas produire
  // "undefined" à l'écran (la liste affiche cette valeur telle quelle).
  assert.equal(sanitizeIncidents([{ at: 1, name: 'saliox' }])[0].kind, '');
  const cinquante = Array.from({ length: 50 }, (_, i) => ({ at: i, name: 'bot', kind: 'chute', cause: '' }));
  assert.equal(sanitizeIncidents(cinquante).length, 40, 'plafond à 40');
  assert.equal(sanitizeIncidents(cinquante, 5).length, 5);
  assert.equal(sanitizeIncidents(cinquante, 5)[0].at, 45, 'ce sont les PLUS RÉCENTS qui restent');
});

test('sanitizeIncidents : rejette tout ce qui n\'est pas exploitable', () => {
  const out = sanitizeIncidents([
    { at: 1, name: '__proto__', kind: 'chute' },      // pollution de prototype
    { at: 1, name: '-rf', kind: 'chute' },            // nom refusé par isSafeName ? (accepté en lecture)
    { at: 'hier', name: 'saliox' },                   // horodatage non numérique
    { name: 'saliox' },                               // pas d'horodatage
    null, undefined, 'chaine', 42,
  ]);
  assert.equal(out.some((i) => i.name === '__proto__'), false, '__proto__ ne doit jamais passer');
  assert.equal(out.every((i) => Number.isFinite(i.at)), true);
});

test('sanitizeIncidents : entrée non tabulaire → tableau vide', () => {
  for (const bad of [null, undefined, {}, 'x', 42]) assert.deepEqual(sanitizeIncidents(bad), []);
});

test('sanitizeRuntime : reconstruit depuis zéro, jamais de recopie', () => {
  const out = sanitizeRuntime({
    lastAlertAt: { saliox: 1000, __proto__: 5, 'hasu-music': 'bientot' },
    heal: { saliox: { downSince: 2000, tries: 2 }, mauvais: { downSince: 'x' }, __proto__: { downSince: 1 } },
  });
  assert.deepEqual(Object.keys(out.lastAlertAt), ['saliox'], 'seul un nom sûr avec un nombre survit');
  assert.deepEqual(out.heal, { saliox: { downSince: 2000, tries: 2, lastTryAt: 0 } });
  assert.equal(Object.getPrototypeOf(out.heal), Object.prototype, 'le prototype n\'a pas été touché');
});

test('sanitizeRuntime : compteur d\'essais borné, structures inattendues absorbées', () => {
  assert.equal(sanitizeRuntime({ heal: { a: { downSince: 1, tries: 999 } } }).heal.a.tries, 9);
  assert.equal(sanitizeRuntime({ heal: { a: { downSince: 1, tries: 'x' } } }).heal.a.tries, 0);
  assert.equal(sanitizeRuntime({ heal: { a: { downSince: 1 } } }).heal.a.tries, 0);
  assert.equal(sanitizeRuntime({ heal: { a: 'pas un objet' } }).heal.a, undefined);
  for (const bad of [null, undefined, 'x', 42, []]) assert.deepEqual(sanitizeRuntime(bad), { lastAlertAt: {}, heal: {} });
});

test('sanitizeRuntime : aller-retour sans perte pour des données saines', () => {
  const sain = { lastAlertAt: { saliox: 1700000000000 }, heal: { 'hasu-music': { downSince: 1700000000001, tries: 1, lastTryAt: 1700000000002 } } };
  assert.deepEqual(sanitizeRuntime(sain), sain);
});

// ---- non-régression : les défauts trouvés par l'audit du lot de relance automatique ----
const { healPending, isDeliberateStop } = require('../logic');

test('shouldAutoHeal : les délais courent depuis le DERNIER essai, pas depuis la chute', () => {
  // Défaut trouvé : un bot tombé depuis longtemps (panel redémarré, état repris du disque) avait
  // 5, 15 et 60 min tous déjà écoulés — ses trois tentatives partaient en trente secondes et
  // l'abandon tombait aussitôt, l'espacement croissant ne servant plus à rien.
  const tombe = T - 3 * 60 * MIN; // à terre depuis 3 h
  assert.equal(shouldAutoHeal(T, tombe, 0, 0), true, '1er essai : dû');
  assert.equal(shouldAutoHeal(T, tombe, 1, T), false, '2e essai juste après le 1er : NON');
  assert.equal(shouldAutoHeal(T, tombe, 1, T - 14 * MIN), false);
  assert.equal(shouldAutoHeal(T, tombe, 1, T - 15 * MIN), true, '15 min après le 1er : dû');
  assert.equal(shouldAutoHeal(T, tombe, 2, T - 59 * MIN), false);
  assert.equal(shouldAutoHeal(T, tombe, 2, T - 60 * MIN), true);
});

test('healPending : vrai seulement si une relance est réellement DUE', () => {
  // Sert au tick à décider de lire la liste des process. Un bot présent dans la table mais dont
  // les 3 essais sont épuisés ne doit RIEN forcer : sinon un `tasklist` par tick, pour toujours.
  const due = new Map([['a', { downSince: T - 10 * MIN, tries: 0, lastTryAt: 0 }]]);
  const pasEncore = new Map([['a', { downSince: T - 1 * MIN, tries: 0, lastTryAt: 0 }]]);
  const epuise = new Map([['a', { downSince: T - 10 * 60 * MIN, tries: 3, lastTryAt: T - 5 * 60 * MIN }]]);
  assert.equal(healPending(T, due), true);
  assert.equal(healPending(T, pasEncore), false);
  assert.equal(healPending(T, epuise), false, 'un bot mort pour de bon ne doit rien déclencher');
  assert.equal(healPending(T, new Map()), false);
  assert.equal(healPending(T, null), false);
  // un seul bot dû parmi plusieurs suffit
  assert.equal(healPending(T, new Map([...epuise, ...due])), true);
});

test('isDeliberateStop : un « pm2 stop » sur un bot DÉJÀ tombé compte comme volontaire', () => {
  // Défaut trouvé : la règle exigeait un état précédent « online ». Couper au terminal un bot déjà
  // en erreur ne produisait donc aucune transition depuis 'online' → l'arrêt n'était pas reconnu,
  // et la relance automatique rallumait cinq minutes plus tard un bot délibérément éteint.
  assert.equal(isDeliberateStop({ status: 'errored', restarts: 5 }, { status: 'stopped', restarts: 5 }), true);
  assert.equal(isDeliberateStop({ status: 'online', restarts: 0 }, { status: 'stopped', restarts: 0 }), true);
  // …mais un plantage (compteur de redémarrages qui grimpe) reste une panne, pas un arrêt voulu
  assert.equal(isDeliberateStop({ status: 'online', restarts: 3 }, { status: 'stopped', restarts: 7 }), false);
  // …et rester arrêté n'est pas un nouvel arrêt
  assert.equal(isDeliberateStop({ status: 'stopped', restarts: 2 }, { status: 'stopped', restarts: 2 }), false);
});

// ---------------------- enregistrement de la config : « invérifiable » n'est pas « perdu »
// Défaut réel : la relecture de contrôle était dans le MÊME try que l'écriture. Un verrou passager de
// l'antivirus sur la LECTURE faisait conclure « écriture perdue » alors que le renommage avait réussi
// — bandeau rouge et alerte Discord pour une écriture parfaitement valide.
const { verdictEcriture } = require('../logic');

test('verdictEcriture : écrit et relu conforme → tout va bien', () => {
  assert.deepEqual(verdictEcriture('ok', 'ok'), { ok: true, bakMort: false });
});

test('verdictEcriture : « perdu » est le SEUL vrai échec d\'écriture', () => {
  // C'est le mode de panne qui a figé la config six semaines : aucune erreur levée, mais le disque
  // ne contient pas ce qu'on vient d'écrire.
  assert.equal(verdictEcriture('perdu', 'ok').ok, false);
  assert.equal(verdictEcriture('echec', 'ok').ok, false);
});

test('verdictEcriture : « illisible » ne déclenche PAS l\'alarme', () => {
  // Écrit, mais impossible de relire pour vérifier. On ne sait pas — et on ne crie pas au loup :
  // c'est ce faux positif qui envoyait une alerte Discord pour une écriture réussie.
  assert.equal(verdictEcriture('illisible', 'ok').ok, true);
  assert.equal(verdictEcriture('ok', 'illisible').bakMort, false, 'idem pour la copie de secours');
});

test('verdictEcriture : la mort de la COPIE DE SECOURS est signalée séparément', () => {
  // Elle n'était jamais relue : sa disparition était totalement silencieuse, pendant que l'alerte
  // d'échec du principal promettait « tes réglages sont conservés dans la copie de secours ».
  assert.deepEqual(verdictEcriture('ok', 'echec'), { ok: true, bakMort: true });
  assert.deepEqual(verdictEcriture('ok', 'perdu'), { ok: true, bakMort: true });
  // Le pire cas : les deux à terre. L'alerte doit alors dire la vérité, pas rassurer.
  assert.deepEqual(verdictEcriture('perdu', 'perdu'), { ok: false, bakMort: true });
});
