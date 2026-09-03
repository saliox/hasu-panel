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
// Cherché dans `stripped`, PAS dans `src` : le fichier est en CRLF et `stripped` a été normalisé en
// LF, donc un bloc extrait de `src` ne se retrouvait plus dans `stripped`. Le `replace` ci-dessous ne
// retirait alors rien, le bloc d'import restait dans le texte fouillé, et TOUS les imports
// paraissaient utilisés : la détection d'imports morts était morte elle-même, sans un mot. C'est
// ESLint (`no-unused-vars`) qui a fini par trouver `isDeliberateStop`, resté importé pour rien.
const importedFrom = (mod) => {
  const re = new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*require\\(['"]\\./${mod}['"]\\)`, 'm');
  const m = stripped.match(re);
  assert.ok(m, `aucun import destructuré de ./${mod} trouvé dans main.js`);
  return { noms: m[1].split(',').map((s) => s.trim()).filter(Boolean), bloc: m[0] };
};

// …et on vérifie que le retrait fonctionne vraiment, sinon ce fichier ment de nouveau en silence.
test('garde-fou : le bloc d\'import est bien retiré du texte fouillé', () => {
  const re = /const\s*\{([^}]*)\}\s*=\s*require\(['"]\.\/logic['"]\)/m;
  const m = stripped.match(re);
  assert.ok(m, 'bloc d\'import de logic.js introuvable dans le texte nettoyé');
  assert.equal(stripped.replace(m[0], ' ').includes(m[0]), false, 'le bloc d\'import n\'a pas été retiré');
});

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

// ---------------------- rien ne sort de la machine sans passer par le masqueur
// Fuite réelle : l'alerte « Réglages non enregistrés » envoyait le chemin de config EN CLAIR vers le
// webhook Discord — donc le nom de session Windows. Le journal LOCAL, lui, doit garder le chemin
// entier : c'est là qu'il sert. La règle est donc « masqué dans queueAlert, entier dans log ».
test('aucune alerte ne fait sortir un chemin de fichier en clair', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  // Toute interpolation d'un chemin à l'intérieur d'un appel queueAlert(...) doit passer par un masqueur.
  const detecter = (code) => {
    const suspects = [];
    const re = /queueAlert\(([\s\S]{0,900}?)\);/g;
    let m;
    while ((m = re.exec(code))) {
      for (const v of m[1].match(/\$\{[^}]*\}/g) || []) {
        if (/\b(file|cfgPath|chemin)\b/.test(v) && !/masquer\(|redactSensitive\(/.test(v)) suspects.push(v);
      }
    }
    return suspects;
  };
  assert.deepEqual(detecter(src), [], 'un chemin part vers le webhook sans être masqué');

  // CONTRÔLE NÉGATIF, dans le test lui-même. La première version de ce détecteur cherchait « ), 0x »
  // alors que le code écrit « , 0xfaa61a » : elle ne voyait RIEN et « passait » pour cette raison —
  // un test anti-fuite qui ne détecte pas la fuite est pire qu'aucun test, il rassure à tort.
  // On réintroduit donc la fuite d'origine et on exige que le détecteur la voie.
  const avecLaFuite = src.replace('${masquer(file)}', '${file}');
  assert.notEqual(src, avecLaFuite, 'le point de fuite historique doit rester repérable dans le code');
  assert.ok(detecter(avecLaFuite).length > 0, 'le détecteur ne voit pas la fuite qu\'il est censé surveiller');
});

test('le masqueur efface le nom de session, pas seulement la forme du chemin', () => {
  // redactSensitive ne reconnaît que les formes habituelles. Un chemin UNC ou un profil placé hors de
  // \Users passait entier. Le nom de session littéral couvre ces cas.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /const NOM_SESSION = String\(process\.env\.USERNAME/);
  assert.match(src, /const masquer = \(texte\) => \{ const s = redactSensitive\(texte\)/);
  assert.match(src, /NOM_SESSION\.length >= 3/, 'un nom trop court hacherait tout le texte');
});


// ---------------------- l'écrivain doit fournir ce que le lecteur tolère de ne pas trouver
test('runtime : main.js écrit bien lastTryAt (l\'oubli est invisible côté lecture)', () => {
  // `sanitizeRuntime` accepte un `lastTryAt` absent sans broncher — c'est voulu, mais ça rend l'oubli
  // de l'écrivain totalement muet. Seul un regard sur l'écrivain le rattrape.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  const m = src.match(/heal\[k\] = \{ downSince: [^}]+\}/);
  assert.ok(m, 'la ligne d\'écriture de persistRuntime doit être trouvable');
  assert.match(m[0], /lastTryAt/, 'persistRuntime doit enregistrer lastTryAt');
});

// ---------------------- aucun verrou de manœuvre ne doit être oublié par la relance automatique
// Défaut réel : `fixAllInFlight` existait mais n'était testé que dans son propre gestionnaire. La
// relance automatique gardait `actionsInFlight` et `stopAllInFlight`, pas lui — et « Remettre en
// ordre » agit précisément sur les bots qu'elle surveille. Deux `pm2 start` concurrents sur le même
// bot, et un « relance automatique réussie » mensonger qui s'attribuait le clic de l'utilisateur.
//
// Ce test énumère TOUS les drapeaux de manœuvre déclarés et exige que la garde les connaisse : un
// cinquième drapeau ajouté demain ne pourra pas être oublié en silence.
test('relance automatique : la garde connaît tous les verrous de manœuvre', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  const declares = [...new Set([...src.matchAll(/^let (\w*InFlight)\b/gm)].map((m) => m[1]))];
  assert.ok(declares.length >= 2, `au moins deux drapeaux attendus, trouvés : ${declares.join(', ')}`);

  const garde = src.match(/if \(actionsInFlight\.size[^)]*\) \{/);
  assert.ok(garde, 'la garde de runAutoHeal doit rester repérable');
  const oublies = declares.filter((d) => !garde[0].includes(d));
  assert.deepEqual(oublies, [],
    `drapeau(x) absent(s) de la garde : ${oublies.join(', ')} — une manœuvre de l'utilisateur et la relance automatique agiraient en même temps sur le même bot`);
});
