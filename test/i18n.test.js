// Garde-fou du dictionnaire de traduction.
//
// POURQUOI : `t()` retombe volontairement sur le français quand une clé manque en anglais — c'est
// mieux qu'un bouton vide. Mais cette tolérance rend l'oubli INVISIBLE : l'interface reste utilisable,
// juste à moitié traduite, et personne ne s'en aperçoit. Ces tests transforment l'oubli en échec.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DICT, t, setLang } = require('../ui/i18n');

const cles = (l) => Object.keys(DICT[l]).sort();

test('i18n : les deux langues ont EXACTEMENT les mêmes clés', () => {
  const fr = cles('fr'), en = cles('en');
  const manqueEn = fr.filter((k) => !DICT.en[k]);
  const manqueFr = en.filter((k) => !DICT.fr[k]);
  assert.deepEqual(manqueEn, [], `clés absentes de l'anglais (elles resteront en français) : ${manqueEn.join(', ')}`);
  assert.deepEqual(manqueFr, [], `clés présentes en anglais mais pas en français : ${manqueFr.join(', ')}`);
});

test('i18n : aucune valeur vide (un libellé vide = un bouton muet)', () => {
  for (const l of ['fr', 'en']) {
    for (const [k, v] of Object.entries(DICT[l])) {
      assert.equal(typeof v, 'string', `${l}/${k} n'est pas une chaîne`);
      assert.ok(v.trim().length > 0, `${l}/${k} est vide`);
    }
  }
});

test('i18n : les emplacements {x} sont les MÊMES dans les deux langues', () => {
  // Un {n} oublié dans la traduction anglaise afficherait une phrase amputée de son chiffre.
  const trous = (s) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
  for (const k of Object.keys(DICT.fr)) {
    assert.equal(trous(DICT.en[k]), trous(DICT.fr[k]), `emplacements différents pour « ${k} »`);
  }
});

test('i18n : t() remplit les emplacements et retombe proprement', () => {
  setLang('fr');
  assert.match(t('gm.online', { on: 3, total: 5 }), /3\/5/);
  assert.equal(t('cle.qui.nexiste.pas'), 'cle.qui.nexiste.pas', 'une clé absente reste VISIBLE, donc repérable');
  setLang('en');
  assert.match(t('gm.online', { on: 1, total: 2 }), /1\/2/);
  assert.match(t('gm.online', { on: 1, total: 2 }), /online/);
  setLang('xx'); // langue inconnue → français, jamais de page blanche
  assert.equal(t('upd.later'), DICT.fr['upd.later']);
  setLang('fr');
});

test('i18n : toute clé utilisée dans le code EXISTE dans le dictionnaire', () => {
  // Une faute de frappe dans t('bots.tittle') afficherait la clé brute à l'écran. ESLint ne peut pas
  // le voir (c'est une chaîne), ce test si.
  const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const src = lire('ui/app.js') + lire('main.js');
  const utilisees = new Set([...src.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)].map((m) => m[1]));
  const inconnues = [...utilisees].filter((k) => DICT.fr[k] === undefined);
  assert.deepEqual(inconnues, [], `clés utilisées mais absentes du dictionnaire : ${inconnues.join(', ')}`);
});

test('i18n : le corps anglais de « À propos » couvre les mêmes sections que le français', () => {
  // Il vit dans son propre fichier : rien ne garantit qu'il suive quand on enrichit la version FR.
  const fr = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  const en = fs.readFileSync(path.join(__dirname, '..', 'ui', 'about-en.js'), 'utf8');
  const iA = fr.indexOf('const aboutHTML');
  const blocFr = fr.slice(iA, fr.indexOf('\n};', iA));
  const nFr = (blocFr.match(/<h3>/g) || []).length;
  const nEn = (en.match(/<h3>/g) || []).length;
  assert.equal(nEn, nFr, `« À propos » : ${nFr} sections en français contre ${nEn} en anglais`);
});
