#!/usr/bin/env node
// Crée la release GitHub AVANT qu'electron-builder ne s'en charge. Lancé par `npm run publish`.
//
// POURQUOI : electron-builder démarre DEUX publishers en parallèle (un par fichier : l'installeur et
// son .blockmap). Chacun lit « release doesn't exist » puis POSTe sa création. Le perdant reçoit
// « 422 Validation Failed / already_exists / tag_name » et fait ÉCHOUER tout le build — après que le
// gagnant a créé la release. Résultat observé deux fois de suite (v1.16.14 et v1.16.15) : une release
// PUBLIÉE ne contenant que le .blockmap, sans installeur et SANS latest.yml.
//
// C'est le pire des états : electron-updater lit `latest.yml` sur la release la plus récente. Absent,
// tous les panels installés échouent leur vérification de MAJ sans jamais voir la nouvelle version —
// une publication qui casse les mises à jour au lieu d'en livrer une.
//
// Le remède supprime la course au lieu de la rattraper : si la release existe déjà quand les deux
// publishers démarrent, aucun des deux ne tente de la créer.
const { execFileSync } = require('child_process');
const { version } = require('../package.json');
const tag = `v${version}`;

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

try {
  gh(['release', 'view', tag, '--repo', 'saliox/hasu-panel', '--json', 'tagName']);
  console.log(`pre-release : ${tag} existe déjà — rien à faire`);
} catch {
  // `gh release create` pose aussi le tag sur le commit courant : ne lancer `npm run publish` qu'une
  // fois le commit de version POUSSÉ, sinon le tag désigne un commit que personne d'autre n'a.
  gh(['release', 'create', tag, '--repo', 'saliox/hasu-panel', '--title', version,
    '--notes', `Hasu Panel ${version}`]);
  console.log(`pre-release : ${tag} créée — les deux publishers la trouveront au lieu de la créer`);
}
