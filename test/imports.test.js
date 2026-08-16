// Garde-fou anti « identifiant utilisé mais jamais importé ».
//
// POURQUOI CE FICHIER EXISTE : `cleanNotes` a été appelé dans main.js sans figurer dans la liste
// d'import de logic.js. Le fichier COMPILE (c'est une ReferenceError d'exécution, pas de syntaxe),
// `node -c` passe, les tests unitaires de logic.js passent — et la version est partie en production
// avec ses gestionnaires de mise à jour cassés : plus de carte, plus de notification, plus d'entrée
// dans la zone de notification. Seul un vrai lancement de l'application l'aurait vu, et il ne
// déclenche pas les événements de l'updater (ils n'existent que dans la version installée).
//
// Ce test relit main.js et croise les deux sens :
//   1. tout ce qui est UTILISÉ et exporté par logic.js/validators.js doit être IMPORTÉ ;
//   2. tout ce qui est IMPORTÉ doit être UTILISÉ (sinon c'est un import mort à supprimer).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MAIN = path.join(__dirname, '..', 'main.js');
const src = fs.readFileSync(MAIN, 'utf8');

// Retire les commentaires : un nom cité dans un commentaire ne compte pas comme une utilisation.
// On ne touche PAS aux chaînes — apparier les guillemets à la regex sur un fichier plein d'apostrophes
// françaises et de littéraux d'expression régulière fait sauter des pans entiers du code (première
// version de ce test : les 15 imports ressortaient « morts »). Un nom présent uniquement dans une
// chaîne comptera comme utilisé : c'est le sens conservateur, il ne crée pas de faux échec.
// ORDRE IMPORTANT : les commentaires de LIGNE d'abord. main.js contient « test/*.test.js » dans un
// commentaire ; en commençant par les blocs, ce `/*` s'appariait à un `*/` bien plus loin et effaçait
// 102 Ko sur 109. C'est le test d'auto-vérification juste en dessous qui l'a attrapé.
const stripped = src
  // Fins de ligne normalisées D'ABORD : le fichier est en CRLF, et `.` ne matche pas `\r`, donc
  // `\/\/.*$` ne trouvait JAMAIS rien — le nettoyage des commentaires de ligne retirait 0 caractère.
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');

// Le test se vérifie lui-même : si le nettoyage ci-dessus mange le fichier, tout le reste ment.
test('garde-fou : le nettoyage des commentaires ne détruit pas main.js', () => {
  assert.ok(stripped.length > src.length * 0.5,
    `nettoyage trop agressif : ${stripped.length} caractères restants sur ${src.length}`);
  assert.match(stripped, /ipcMain\.handle\('panel:status'/, 'le code a survécu au nettoyage');
});

// Bloc d'import destructuré : const { a, b, c } = require('./mod');
const importedFrom = (mod) => {
  const re = new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*require\\(['"]\\./${mod}['"]\\)`, 'm');
  const m = src.match(re);
  assert.ok(m, `aucun import destructuré de ./${mod} trouvé dans main.js`);
  return { noms: m[1].split(',').map((s) => s.trim()).filter(Boolean), bloc: m[0] };
};

// Utilisé ailleurs que dans son propre bloc d'import ?
const utiliseAilleurs = (nom, bloc) => {
  const sansImport = stripped.replace(bloc, ' ');
  return new RegExp(`\\b${nom}\\b`).test(sansImport);
};

for (const mod of ['logic', 'validators']) {
  const exports = Object.keys(require(`../${mod}`));
  const { noms: importes, bloc } = importedFrom(mod);

  test(`main.js : rien d'utilisé sans être importé depuis ${mod}.js`, () => {
    const sansImport = stripped.replace(bloc, ' ');
    const manquants = exports.filter((e) => !importes.includes(e) && new RegExp(`\\b${e}\\b`).test(sansImport));
    assert.deepEqual(manquants, [],
      `main.js appelle ${manquants.join(', ')} sans l'importer → ReferenceError à l'exécution, invisible à la compilation`);
  });

  test(`main.js : aucun import mort depuis ${mod}.js`, () => {
    const inutiles = importes.filter((n) => !utiliseAilleurs(n, bloc));
    assert.deepEqual(inutiles, [], `imports jamais utilisés : ${inutiles.join(', ')}`);
  });

  test(`main.js : n'importe rien qui n'existe pas dans ${mod}.js`, () => {
    // Un nom retiré de logic.js mais laissé dans l'import vaut `undefined` — l'appel échoue à l'exécution.
    const fantomes = importes.filter((n) => !exports.includes(n));
    assert.deepEqual(fantomes, [], `importés mais absents de ${mod}.js : ${fantomes.join(', ')}`);
  });
}
