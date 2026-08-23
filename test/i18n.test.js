// Garde-fou du dictionnaire de traduction (14 langues).
//
// POURQUOI : `t()` retombe volontairement sur le français quand une clé manque — c'est mieux qu'un
// bouton vide. Mais cette tolérance rend l'oubli INVISIBLE : l'interface reste utilisable, juste à
// moitié traduite, et personne ne s'en aperçoit. Avec 14 langues, un contrôle à l'œil est illusoire.
// Ces tests transforment chaque oubli en échec.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../ui/i18n');

const DIR = path.join(__dirname, '..', 'ui', 'lang');
const CODES = i18n.ORDRE;
const L = {};
for (const c of CODES) L[c] = require(path.join(DIR, c + '.js'));
const REF = L.fr; // le français est la langue d'origine : c'est lui qui fait référence

test('i18n : toutes les langues annoncées sont réellement présentes et chargées', () => {
  const surDisque = fs.readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => f.replace('.js', '')).sort();
  assert.deepEqual([...CODES].sort(), surDisque,
    'un fichier de langue sur le disque n\'est pas dans ORDRE (il ne sera pas proposé), ou l\'inverse');
  assert.equal(i18n.langues().length, CODES.length);
});

test('i18n : chaque langue porte un nom écrit DANS cette langue', () => {
  // « Deutsch », pas « Allemand » : le menu doit être lisible par qui ne parle pas français.
  for (const c of CODES) {
    assert.equal(typeof L[c].nom, 'string', `${c} : nom manquant`);
    assert.ok(L[c].nom.trim().length > 0, `${c} : nom vide`);
  }
  assert.equal(new Set(CODES.map((c) => L[c].nom)).size, CODES.length, 'deux langues portent le même nom');
});

test('i18n : toutes les langues ont EXACTEMENT les clés du français', () => {
  const ref = Object.keys(REF.ui).sort();
  for (const c of CODES) {
    const k = Object.keys(L[c].ui).sort();
    const manque = ref.filter((x) => !L[c].ui[x]);
    const enTrop = k.filter((x) => REF.ui[x] === undefined);
    assert.deepEqual(manque, [], `${c} : clés manquantes (elles resteront en français) → ${manque.slice(0, 6).join(', ')}`);
    assert.deepEqual(enTrop, [], `${c} : clés inconnues → ${enTrop.slice(0, 6).join(', ')}`);
  }
});

test('i18n : aucune valeur vide (un libellé vide = un bouton muet)', () => {
  for (const c of CODES) {
    for (const [k, v] of Object.entries(L[c].ui)) {
      assert.equal(typeof v, 'string', `${c}/${k} n'est pas une chaîne`);
      assert.ok(v.trim().length > 0, `${c}/${k} est vide`);
    }
  }
});

test('i18n : les emplacements {x} sont identiques à ceux du français', () => {
  // Un {n} oublié dans une traduction afficherait une phrase amputée de son chiffre.
  const trous = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
  for (const c of CODES) {
    for (const k of Object.keys(REF.ui)) {
      assert.equal(trous(L[c].ui[k]), trous(REF.ui[k]), `${c} : emplacements différents pour « ${k} »`);
    }
  }
});

test('i18n : les balises HTML sont conservées à l\'identique', () => {
  // Une <b> ouverte sans être fermée casse la mise en page de toute la zone.
  const balises = (s) => (String(s).match(/<\/?[a-z]+[^>]*>/gi) || []).map((x) => x.toLowerCase()).sort().join('|');
  for (const c of CODES) {
    for (const k of Object.keys(REF.ui)) {
      assert.equal(balises(L[c].ui[k]), balises(REF.ui[k]), `${c} : balises différentes pour « ${k} »`);
    }
  }
});

test('i18n : la fenêtre « À propos » a le même nombre de sections partout', () => {
  const n = (s) => (String(s).match(/<h3>/g) || []).length;
  const ref = n(REF.about);
  assert.ok(ref >= 10, 'le français doit avoir ses 11 sections');
  for (const c of CODES) {
    assert.equal(n(L[c].about), ref, `${c} : ${n(L[c].about)} sections contre ${ref} en français`);
    assert.ok(L[c].about.includes('{v}'), `${c} : l'emplacement {v} (numéro de version) a disparu de « À propos »`);
  }
});

test('i18n : les noms propres ne sont pas traduits', () => {
  // « pm2 » devenu « pm2 (gestionnaire) » ou Discord traduit rendrait l'aide fausse.
  for (const c of CODES) {
    assert.ok(/\bpm2\b/.test(L[c].about), `${c} : « pm2 » a disparu de « À propos »`);
    assert.ok(/Discord/.test(L[c].about), `${c} : « Discord » a disparu de « À propos »`);
  }
});

test('i18n : t() bascule, remplit les emplacements et retombe proprement', () => {
  for (const c of CODES) {
    i18n.setLang(c);
    assert.equal(i18n.getLang(), c);
    assert.match(i18n.t('gm.online', { on: 3, total: 5 }), /3\/5/, `${c} : emplacements non remplis`);
    assert.ok(i18n.about().length > 500, `${c} : « À propos » vide`);
  }
  i18n.setLang('xx'); // langue inconnue → français, jamais de page blanche
  assert.equal(i18n.getLang(), 'fr');
  assert.equal(i18n.t('cle.qui.nexiste.pas'), 'cle.qui.nexiste.pas', 'une clé absente reste VISIBLE, donc repérable');
});

test('i18n : seul l\'arabe est marqué écriture de droite à gauche', () => {
  assert.equal(i18n.isRtl('ar'), true);
  for (const c of CODES.filter((x) => x !== 'ar')) assert.equal(i18n.isRtl(c), false, `${c} ne doit pas être RTL`);
});

test('i18n : toute clé utilisée dans le code EXISTE dans le dictionnaire', () => {
  // Une faute de frappe dans t('bots.tittle') afficherait la clé brute à l'écran. ESLint ne peut pas
  // le voir (c'est une chaîne), ce test si.
  const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const src = lire('ui/app.js') + lire('main.js');
  const utilisees = new Set([...src.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)].map((m) => m[1]));
  const inconnues = [...utilisees].filter((k) => REF.ui[k] === undefined);
  assert.deepEqual(inconnues, [], `clés utilisées mais absentes du dictionnaire : ${inconnues.join(', ')}`);
});

test('i18n : le HTML charge bien TOUS les fichiers de langue', () => {
  // Un fichier oublié dans index.html ne s'enregistre pas côté fenêtre : la langue disparaît du menu
  // alors que les tests, eux, la trouvent (ils passent par require). Panne visible seulement à l'écran.
  const html = fs.readFileSync(path.join(__dirname, '..', 'ui', 'index.html'), 'utf8');
  const manquants = CODES.filter((c) => !html.includes(`lang/${c}.js`));
  assert.deepEqual(manquants, [], `langues non chargées par index.html : ${manquants.join(', ')}`);
  // …et dans le bon ordre : i18n.js les assemble, il doit venir APRÈS.
  assert.ok(html.indexOf('lang/fr.js') < html.indexOf('i18n.js'), 'i18n.js doit être chargé après les langues');
  assert.ok(html.indexOf('i18n.js') < html.indexOf('app.js'), 'app.js doit être chargé après i18n.js');
});

test('i18n : aucune clé MORTE dans le dictionnaire', () => {
  // Le sens inverse du test précédent. Quand le bouton à deux états est devenu un menu déroulant,
  // « btn.lang » (« 🇬🇧 English ») a cessé de servir — mais il est resté traduit dans les 14 langues,
  // et son voisin « btn.langTitle » décrivait encore un bouton disparu. Rien ne le signalait.
  // Les clés sont référencées de deux façons : t('x') dans le JS, et data-i18n* dans le HTML.
  const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const js = lire('ui/app.js') + lire('main.js');
  const html = lire('ui/index.html');
  const vues = new Set([
    ...[...js.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-i18n(?:-html|-title|-ph|-input)?="([^"]+)"/g)].map((m) => m[1]),
    // clés construites dynamiquement : les motifs de blocage viennent du main sous forme 'blk.*'
    ...Object.keys(REF.ui).filter((k) => k.startsWith('blk.') && /b\.push\('blk\./.test(js)),
  ]);
  const mortes = Object.keys(REF.ui).filter((k) => !vues.has(k));
  assert.deepEqual(mortes, [], `clés traduites dans 14 langues mais utilisées nulle part : ${mortes.join(', ')}`);
});

// ---------------------- les 14 langues doivent être ATTEIGNABLES, pas seulement traduites
// Défaut réel : trois bornes dans main.js ne laissaient passer que 'fr' et 'en'. Le menu déroulant en
// proposait 14, le clic changeait l'écran une fraction de seconde, puis `panel:status` renvoyait 'fr'
// et tout repartait en français — sans rien enregistrer. Les 12 autres langues étaient mort-nées, et
// avec elles chaque clé qu'on y ajoutait.
test('i18n : main.js ne borne plus la langue à fr/en', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  const bornes = src.match(/=== 'en' \? 'en' : 'fr'/g) || [];
  assert.deepEqual(bornes, [], 'une borne fr/en subsiste : les 12 autres langues seraient inatteignables');
  assert.match(src, /ORDRE: LANGUES/, 'la liste des langues doit venir de ui/i18n.js, source unique');
  // Les trois endroits qui filtrent une langue (chargement, panel:status, réglage) doivent tous
  // s'appuyer sur cette liste : en oublier un suffit à faire rebondir le choix en français.
  assert.equal((src.match(/LANGUES\.includes\(/g) || []).length, 3);
});

test('i18n : chaque langue proposée est réellement chargeable côté processus principal', () => {
  // Le menu du tray et les alertes passent par le MÊME moteur, chargé par require (pas par <script>).
  // Une langue listée mais absente du disque retomberait silencieusement en français.
  const { ORDRE } = require('../ui/i18n');
  for (const code of ORDRE) {
    const p = path.join(__dirname, '..', 'ui', 'lang', code + '.js');
    assert.ok(fs.existsSync(p), `ui/lang/${code}.js manque alors que la langue est proposée`);
    const m = require(p);
    assert.ok(m && m.ui && typeof m.nom === 'string', `ui/lang/${code}.js ne s'exporte pas correctement`);
  }
});
