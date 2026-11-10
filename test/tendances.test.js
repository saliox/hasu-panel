// Tendances : ce que le panel savait déjà sans le dire.
//
// POURQUOI CE FICHIER : deux données étaient relevées puis jetées. L'historique garde 40 incidents
// déjà typés et déjà classés en français, et n'en tirait aucune fréquence ; la mémoire de chaque bot
// était relevée à CHAQUE tick, affichée à l'instant, jamais comparée à hier. Or une panne qui revient
// et une mémoire qui monte sont deux choses qu'on ne voit QUE dans le temps : un chiffre instantané ne
// les montre jamais, quel que soit le soin qu'on met à le regarder.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  echantillonnerMemoire, tendanceMemoire, tendanceIncidents, MEM_PAS_MS, MEM_MAX,
} = require('../logic');

const H = 3600000;
const Mo = (n) => n * 1048576;

// ---------------------------------------------------------------- échantillonnage
test('échantillon : un point par heure, pas un par tick', () => {
  // Le tick passe toutes les 10 s. Sans cette borne, on écrirait le fichier de configuration
  // 8 640 fois par jour pour tracer une courbe.
  let s = echantillonnerMemoire([], 1000 * H, Mo(100));
  assert.equal(s.length, 1);
  s = echantillonnerMemoire(s, 1000 * H + 10_000, Mo(101)); // 10 s plus tard
  assert.equal(s.length, 1, 'un tick ne doit pas ajouter de point');
  s = echantillonnerMemoire(s, 1001 * H, Mo(102));          // une heure plus tard
  assert.equal(s.length, 2);
});

test('échantillon : la série est BORNÉE (elle part dans le fichier de config)', () => {
  let s = [];
  for (let i = 0; i < MEM_MAX + 20; i++) s = echantillonnerMemoire(s, (1000 + i) * H, Mo(100 + i));
  assert.equal(s.length, MEM_MAX, 'au-delà, le fichier de réglages grossirait sans fin');
  assert.equal(s[s.length - 1][1], Mo(100 + MEM_MAX + 19), 'ce sont les points RÉCENTS qu\'on garde');
});

test('échantillon : entrées malsaines écartées, horodatage futur refusé', () => {
  // La série vient du disque : un fichier bricolé ou une horloge reculée ne doit pas la casser.
  const sale = [['pas un nombre', 1], [1, 'pas un nombre'], null, [9e15, Mo(1)], [1000 * H, Mo(50)]];
  const s = echantillonnerMemoire(sale, 1001 * H, Mo(51));
  assert.deepEqual(s, [[1000 * H, Mo(50)], [1001 * H, Mo(51)]]);
});

test('échantillon : une mémoire nulle ou absente n\'ajoute rien', () => {
  // pm2 rend 0 pour un bot arrêté : un zéro dans la série ferait croire à une chute de mémoire.
  assert.deepEqual(echantillonnerMemoire([], 1000 * H, 0), []);
  assert.deepEqual(echantillonnerMemoire([], 1000 * H, undefined), []);
});

// ---------------------------------------------------------------- pente mémoire
test('pente : une fuite régulière est VUE', () => {
  // +10 Mo par heure sur 24 h = +240 Mo/24 h. C'est le cas que le panel ne pouvait pas montrer.
  let s = [];
  for (let i = 0; i <= 24; i++) s = echantillonnerMemoire(s, (1000 + i) * H, Mo(180 + i * 10));
  const t = tendanceMemoire(s);
  assert.equal(t.parJour, Mo(240), 'la pente doit être ramenée à 24 h');
  assert.equal(t.pic, Mo(420));
  assert.equal(t.heures, 24);
});

test('pente : un plateau rassure (pente nulle, pas d\'absence de réponse)', () => {
  let s = [];
  for (let i = 0; i <= 12; i++) s = echantillonnerMemoire(s, (1000 + i) * H, Mo(200));
  assert.equal(tendanceMemoire(s).parJour, 0);
});

test('pente : on se TAIT quand le recul ne permet pas de conclure', () => {
  // Afficher « +0 Mo/24 h » sur vingt minutes de recul serait une affirmation sans fondement — donc
  // pire que le silence. C'est la même doctrine que les replis du reste du panel.
  assert.equal(tendanceMemoire([]), null);
  assert.equal(tendanceMemoire([[1000 * H, Mo(100)]]), null, 'un seul point n\'est pas une pente');
  assert.equal(tendanceMemoire([[1000 * H, Mo(100)], [1002 * H, Mo(400)]]), null, '2 h de recul : trop court');
  assert.ok(tendanceMemoire([[1000 * H, Mo(100)], [1006 * H, Mo(400)]]), '6 h : on peut parler');
});

test('pente : une BAISSE est rendue telle quelle (et non en valeur absolue)', () => {
  // Un bot redémarré repart bas : la pente devient négative, et c'est une information.
  const t = tendanceMemoire([[1000 * H, Mo(400)], [1012 * H, Mo(200)]]);
  assert.ok(t.parJour < 0, `attendu négatif, vu ${t.parJour}`);
});

// ---------------------------------------------------------------- fréquence des pannes
const INC = (at, name, kind, cause) => ({ at, name, kind, cause });
const NOW = 100 * 86400000;
const J = (n) => NOW - n * 86400000;

test('pannes : fréquence et cause dominante', () => {
  const inc = [
    INC(J(1), 'saliox', 'chute', 'Internet/DNS injoignable'),
    INC(J(2), 'saliox', 'chute', 'Internet/DNS injoignable'),
    INC(J(3), 'saliox', 'chute', 'Internet/DNS injoignable'),
    INC(J(4), 'saliox', 'chute', 'Token invalide'),
    INC(J(5), 'saliox', 'boucle', 'Internet/DNS injoignable'),
    INC(J(6), 'saliox', 'retour', ''),
  ];
  const t = tendanceIncidents(inc, NOW);
  assert.equal(t.saliox.chutes, 5, 'un RETOUR n\'est pas une panne à additionner');
  assert.equal(t.saliox.cause, 'Internet/DNS injoignable');
  assert.equal(t.saliox.combien, 4);
});

test('pannes : une chute ISOLÉE n\'est pas une tendance', () => {
  // Sinon le bandeau crierait sur le moindre incident, et un bandeau qui crie toujours ne dit rien.
  const t = tendanceIncidents([INC(J(1), 'a', 'chute', 'x')], NOW);
  assert.deepEqual(t, {});
});

test('pannes : hors de la fenêtre, ça ne compte pas', () => {
  const vieux = [INC(J(30), 'a', 'chute', 'x'), INC(J(31), 'a', 'chute', 'x')];
  assert.deepEqual(tendanceIncidents(vieux, NOW, 10), {});
  assert.ok(tendanceIncidents(vieux, NOW, 40).a, 'avec une fenêtre plus large, oui');
});

test('pannes : entrées malsaines absorbées', () => {
  assert.deepEqual(tendanceIncidents(null, NOW), {});
  assert.deepEqual(tendanceIncidents([null, {}, { at: 'x', name: 'a', kind: 'chute' }], NOW), {});
  // Un horodatage dans le FUTUR (horloge reculée, fichier bricolé) ne doit pas compter.
  assert.deepEqual(tendanceIncidents([INC(NOW + 86400000, 'a', 'chute', 'x'),
    INC(NOW + 2 * 86400000, 'a', 'chute', 'x')], NOW), {});
});

// ---------------------------------------------------------------- les cinq porteurs
test('les CINQ porteurs de l\'état « mem » sont en place', () => {
  // Trois fois dans cette passe, un correctif complet en apparence ne faisait rien : l'assainisseur
  // jetait le champ, personne ne l'écrivait, ou la condition était lue après la mutation. On compte
  // donc les porteurs un par un : écrivain, lecteur, assainisseur, nettoyage, borne.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /^  mem: \{\},/m, 'DÉFAUT : la clé doit exister');
  assert.match(src, /out\[k\] = echantillonnerMemoire\(src\[k\], Date\.now\(\), 0\);/, 'ASSAINISSEUR');
  assert.match(src, /const echantillonnerMem = \(\) => \{/, 'ÉCRIVAIN');
  assert.match(src, /    echantillonnerMem\(\); \/\/ au plus un point par heure/, 'ÉCRIVAIN appelé par le tick');
  assert.match(src, /if \(change\) saveCfg\(\);/, 'ÉCRIVAIN : enregistre SEULEMENT quand un point est ajouté');
  assert.match(src, /tendanceMem: Object\.fromEntries\(Object\.entries\(cfg\.mem \|\| \{\}\)/, 'LECTEUR');
  assert.match(src, /tendancePannes: tendanceIncidents\(cfg\.incidents, Date\.now\(\)\),/, 'LECTEUR');
  // NETTOYAGE et BORNE vivent dans la fonction pure, et sont éprouvés plus haut (MEM_MAX).
  assert.ok(MEM_MAX > 0 && MEM_PAS_MS > 0);
  // …et l'écrivain ne tourne que si pm2 a répondu : échantillonner un `memory: 0` d'une lecture
  // ratée créerait une fausse chute de mémoire dans la courbe.
  const i = src.indexOf('if (pm2Health.ok) {');
  const j = src.indexOf('echantillonnerMem();');
  assert.ok(i > 0 && j > i && j - i < 200, 'l\'échantillonnage doit être DANS la branche pm2Health.ok');
});

test('écran : la pente et la tendance atteignent le DOM', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  assert.match(app, /const tm = \(st\.tendanceMem \|\| \{\}\)\[b\.name\];/);
  assert.match(app, /\$\{fmtMem\(b\.memory\)\}\$\{pente \? ' ' \+ pente : ''\}/, 'la pente doit être AFFICHÉE');
  assert.match(app, /const incHtml = tendHtml \+ \(\(st\.incidents \|\| \[\]\)\.length/,
    'parenthèses : « + » lie plus fort que « ? : », et « "" + 0 » vaut la chaîne "0", qui est VRAIE');
  assert.match(app, /: t\('inc\.none'\)\);/, 'la parenthèse doit bien se refermer autour du ternaire');
});

test('la précédence corrigée change VRAIMENT le résultat (contre-épreuve)', () => {
  // Reproduction exacte des deux formes. Sans cette épreuve, « j'ai mis des parenthèses » serait une
  // intention, pas un effet.
  const avant = (tend, n) => tend + n ? 'LISTE' : 'AUCUN';
  const apres = (tend, n) => tend + (n ? 'LISTE' : 'AUCUN');
  assert.equal(avant('', 0), 'LISTE', 'témoin : l\'ancienne forme rendait la branche « aucun » inatteignable');
  assert.equal(apres('', 0), 'AUCUN');
  assert.equal(avant('T', 0), 'LISTE', 'témoin : et elle AVALAIT le bandeau de tendance');
  assert.equal(apres('T', 0), 'TAUCUN');
});

test('les trois clés de tendance existent dans les 14 langues', () => {
  const dossier = path.join(__dirname, '..', 'ui', 'lang');
  const langues = fs.readdirSync(dossier).filter((f) => f.endsWith('.js'));
  assert.equal(langues.length, 14);
  for (const l of langues) {
    const s = fs.readFileSync(path.join(dossier, l), 'utf8');
    for (const cle of ['bots.memTrend', 'inc.trend', 'inc.trendCause']) {
      assert.ok(s.includes(`'${cle}'`), `${l} : clé ${cle} absente`);
    }
    const trend = s.match(/'inc\.trend': '(.*)',$/m);
    assert.ok(trend && trend[1].includes('<b>{name}</b>'), `${l} : inc.trend doit porter <b>{name}</b>`);
  }
});
