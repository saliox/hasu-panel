// Lancement au démarrage de Windows et installations multiples.
//
// POURQUOI CE FICHIER : sur la machine de développement, TROIS lanceurs démarraient le panel pour une
// seule application — deux valeurs dans la clé Run et une tâche planifiée orpheline. L'interrupteur
// « Lancer au démarrage » n'en pilotait qu'une : le désactiver ne désactivait rien, et le panel se
// relançait quand même. Ces tests figent les règles de purge, car une purge trop large supprimerait
// les entrées de démarrage d'AUTRES logiciels — c'est un registre partagé.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRegQuery, orphanRunValues, autresInstallations, doitReposerLanceur } = require('../logic');
const fs = require('node:fs');
const path = require('node:path');

// Sortie réelle de `reg query HKCU\…\Run` relevée sur la machine (chemins raccourcis).
const EXE = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
const SORTIE = [
  '',
  'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
  `    electron.app.HasuPanel    REG_SZ    ${EXE} --hidden --startup`,
  `    com.saliox.hasupanel    REG_SZ    ${EXE} --hidden --startup`,
  '    Discord    REG_SZ    "C:\\Users\\moi\\AppData\\Local\\Discord\\Update.exe" --processStart Discord.exe',
  '    Steam    REG_SZ    "C:\\Program Files (x86)\\Steam\\steam.exe" -silent',
  '',
].join('\n');

test('parseRegQuery : lit nom et données, y compris avec espaces et guillemets', () => {
  const v = parseRegQuery(SORTIE);
  assert.equal(v.length, 4, 'les 4 valeurs doivent être lues (l\'en-tête de clé n\'en est pas une)');
  assert.deepEqual(v.map((x) => x.nom), ['electron.app.HasuPanel', 'com.saliox.hasupanel', 'Discord', 'Steam']);
  assert.ok(v[3].data.includes('Program Files (x86)'), 'un chemin avec espaces reste entier');
});

test('parseRegQuery : entrée vide ou illisible ne plante pas', () => {
  for (const bad of ['', null, undefined, 'ERREUR : accès refusé']) assert.deepEqual(parseRegQuery(bad), []);
});

test('orphanRunValues : supprime le doublon, JAMAIS l\'entrée courante', () => {
  // Le doublon vient d'un ancien AppUserModelId : Electron nomme la valeur d'après lui, donc chaque
  // changement d'identifiant en créait une nouvelle sans retirer l'ancienne.
  assert.deepEqual(orphanRunValues(SORTIE, 'electron.app.HasuPanel', EXE), ['com.saliox.hasupanel']);
  // …et si c'est l'autre qui est la courante, c'est l'autre qu'on garde.
  assert.deepEqual(orphanRunValues(SORTIE, 'com.saliox.hasupanel', EXE), ['electron.app.HasuPanel']);
});

test('orphanRunValues : ne touche JAMAIS au démarrage des autres logiciels', () => {
  // Le registre Run est partagé : une purge trop large casserait le démarrage de Discord ou de Steam.
  const cibles = orphanRunValues(SORTIE, 'electron.app.HasuPanel', EXE);
  assert.equal(cibles.includes('Discord'), false);
  assert.equal(cibles.includes('Steam'), false);
});

test('orphanRunValues : sans chemin d\'exécutable, on ne supprime RIEN', () => {
  // Une valeur vide rendrait `includes('')` vrai pour TOUTE entrée : on effacerait tout le démarrage
  // de la session. La garde est là pour ça.
  for (const bad of ['', null, undefined]) assert.deepEqual(orphanRunValues(SORTIE, 'x', bad), []);
});

test('orphanRunValues : comparaison insensible à la casse', () => {
  const sortie = `    vieux    REG_SZ    ${EXE.toUpperCase()} --hidden`;
  assert.deepEqual(orphanRunValues(sortie, 'electron.app.HasuPanel', EXE.toLowerCase()), ['vieux']);
});

test('autresInstallations : ne signale pas celle qui tourne', () => {
  const moi = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
  const autre = 'C:\\Program Files\\HasuPanel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations([moi], moi), []);
  assert.deepEqual(autresInstallations([moi, autre], moi), [autre]);
});

test('autresInstallations : casse et séparateurs ne créent pas de faux doublon', () => {
  // Windows accepte les deux séparateurs et ignore la casse : sans normalisation, l'installation qui
  // TOURNE serait signalée comme un doublon d'elle-même à chaque démarrage.
  const moi = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations(['C:/Users/moi/AppData/Local/Programs/hasu-panel/HasuPanel.exe'], moi), []);
  assert.deepEqual(autresInstallations([moi.toUpperCase()], moi), []);
  // …et un même chemin listé deux fois n'est signalé qu'une.
  const autre = 'D:\\Panel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations([autre, autre.toLowerCase()], moi), [autre]);
});

test('autresInstallations : liste vide ou nulle', () => {
  assert.deepEqual(autresInstallations([], 'x'), []);
  assert.deepEqual(autresInstallations(null, 'x'), []);
  assert.deepEqual(autresInstallations([null, undefined, ''], 'x'), []);
});

// ---------- Ne jamais laisser l'utilisateur sans aucun lanceur ----------
// La purge efface les entrées portant un ANCIEN nom. Si l'entrée au nom courant n'a jamais été écrite
// (c'est le cas exact ici : le nom a suivi l'AppUserModelId), purger sans reposer d'abord la bonne
// coupait le démarrage automatique alors que l'interrupteur affichait « activé ».
const EXE2 = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
const SANS_COURANTE = [
  `    electron.app.HasuPanel    REG_SZ    ${EXE2} --hidden --startup`,
  `    com.saliox.hasupanel    REG_SZ    ${EXE2} --hidden --startup`,
].join('\n');
const AVEC_COURANTE = SANS_COURANTE + `\n    hasu.panel    REG_SZ    ${EXE2} --hidden --startup`;

test('doitReposerLanceur : entrée courante absente + démarrage voulu → on la repose', () => {
  assert.equal(doitReposerLanceur(SANS_COURANTE, 'hasu.panel', true, false), true);
});

test('doitReposerLanceur : entrée courante déjà là → rien à reposer', () => {
  assert.equal(doitReposerLanceur(AVEC_COURANTE, 'hasu.panel', true, false), false);
});

test('doitReposerLanceur : démarrage désactivé → on ne recrée jamais rien', () => {
  // Sinon la purge RÉACTIVERAIT le démarrage automatique que l'utilisateur venait de couper.
  assert.equal(doitReposerLanceur(SANS_COURANTE, 'hasu.panel', false, false), false);
});

test('doitReposerLanceur : désactivé à la main dans Gestionnaire des tâches → on respecte', () => {
  // Windows garde la valeur Run et pose un drapeau « désactivé » à côté, indexé sur le NOM de la valeur.
  // Recréer une entrée sous un autre nom repartirait de zéro : elle serait active. C'est un contournement
  // du choix de l'utilisateur, pas une réparation.
  assert.equal(doitReposerLanceur(SANS_COURANTE, 'hasu.panel', true, true), false);
});

test('doitReposerLanceur : registre illisible → on ne repose pas à l\'aveugle', () => {
  // Une sortie vide ferait croire « aucune entrée courante » et déclencherait une écriture registre
  // gratuite à chaque démarrage. Ici il n'y a de toute façon rien à purger, donc rien à compenser.
  assert.equal(doitReposerLanceur('', 'hasu.panel', true, false), true);
  assert.equal(orphanRunValues('', 'hasu.panel', EXE2).length, 0, 'et surtout : rien à supprimer');
});

// ---------- Invariant : un seul identifiant nomme l'entrée de démarrage ----------
test('AUMID packagé == build.appId (sinon : entrée de démarrage orpheline + zéro notification)', () => {
  // C'est LA cause du bug d'origine. Electron nomme la valeur Run d'après l'AppUserModelId ; Windows
  // associe les notifications au même identifiant, qui doit être celui du raccourci installé (build.appId).
  // Un écart ici crée un lanceur de plus à chaque version et coupe les toasts, sans le moindre message.
  const racine = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(racine, 'main.js'), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  const m = src.match(/const AUMID = app\.isPackaged \? '([^']+)'/);
  assert.ok(m, 'la constante AUMID doit rester le SEUL endroit qui décide de cet identifiant');
  assert.equal(m[1], pkg.build.appId);
  assert.equal(/setAppUserModelId\(/.test(src), true);
  assert.equal(src.match(/setAppUserModelId\(/g).length, 1, 'un seul appel : deux valeurs = deux lanceurs');
});

test('l\'identité de désinstallation est figée (deux entrées dans Applications, sinon)', () => {
  // Sans GUID épinglé, electron-builder le dérive de appId+productName : le jour où l'un des deux bouge,
  // l'installeur écrit une NOUVELLE entrée de désinstallation au lieu de remplacer l'ancienne — et le PC
  // se retrouve avec deux panels installés. Cette valeur est celle déjà posée sur les machines existantes.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.equal(pkg.build.nsis.guid, '281f63ab-643c-53f0-8742-2f555b7705f7');
  assert.equal(pkg.build.nsis.perMachine, false, 'per-user : une install par session, sans admin');
  assert.equal(pkg.build.nsis.allowToChangeInstallationDirectory, false, 'un seul dossier possible');
});
