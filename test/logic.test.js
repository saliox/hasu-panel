// Tests de la logique pure du panel (logic.js) : versions, bornes, parsing, fenêtre, cadence.
// Chaque cas limite ci-dessous correspond à un vrai piège rencontré (ils sont commentés comme tels).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  semverGt, clampInt, quoteForShell, descendantsOf, parseProcessTree, parseTasklistCsv,
  hasEstablishedPublic, classifyErrorFr, computeDefaultBounds, boundsAreVisible, pollDelayFor,
  cleanNotes, pickCfgSource,
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
