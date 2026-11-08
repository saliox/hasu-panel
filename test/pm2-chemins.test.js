// Où vit pm2 ? Le préfixe npm global n'est pas toujours %APPDATA%\npm.
//
// POURQUOI CE FICHIER : le panel ne cherchait pm2 QUE sous %APPDATA%\npm, par deux chemins codés en
// dur, pendant que `probeToolchain` l'interrogeait par le PATH. Sur un poste à préfixe non standard —
// nvm-windows (un préfixe par version de Node), `npm config set prefix`, Chocolatey, une installation
// par MSI — ces deux lecteurs répondaient à des questions DIFFÉRENTES. D'où l'état le plus trompeur
// possible : l'écran annonçait « pm2 installé » et 100 % des appels échouaient. Au bout de deux
// minutes la liste des bots était remplacée par « pm2 ne répond plus depuis N min » : un diagnostic
// faux, sans remède, qui ne nommait jamais la vraie cause. Le panel était aveugle et le disait de
// travers — le pire des deux mondes pour un logiciel dont le seul métier est de voir.
//
// Ce fichier est SÉPARÉ de logic.test.js à cause des chemins Windows : les écrire dans un heredoc
// shell fait manger une barre inverse sur deux (`C:\\nvm4w` → `C:\nvm4w`, puis `\x` et `\A` sont des
// échappements invalides). Ici ils sont écrits une fois, correctement, et plus personne n'y touche.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { basesPm2, SOUS_PM2_CMD, SOUS_PM2_JS } = require('../logic');

const DEFAUT = 'C:\\Users\\x\\AppData\\Roaming\\npm';
const NVM = 'C:\\nvm4w\\nodejs';

test('basesPm2 : le préfixe appris passe AVANT l\'emplacement par défaut', () => {
  assert.deepEqual(basesPm2(NVM, DEFAUT), [NVM, DEFAUT],
    'le vrai préfixe d\'abord, le défaut en repli — jamais l\'inverse');
});

test('basesPm2 : préfixe inconnu → exactement le comportement d\'avant', () => {
  // Non-régression sur les postes ordinaires : une seule base, celle de toujours. C'est ce qui
  // garantit que ce lot ne change RIEN là où l'ancien code marchait.
  for (const vide of ['', null, undefined, '   ']) {
    assert.deepEqual(basesPm2(vide, DEFAUT), [DEFAUT], `préfixe ${JSON.stringify(vide)}`);
  }
});

test('basesPm2 : préfixe identique au défaut → UNE seule base', () => {
  // Sans dédoublonnage, chaque résolution testait deux fois le même chemin sur le disque — et c'est
  // le cas de TOUS les postes standards, donc le cas le plus fréquent.
  assert.deepEqual(basesPm2(DEFAUT, DEFAUT), [DEFAUT]);
  assert.deepEqual(basesPm2(DEFAUT + '\\', DEFAUT), [DEFAUT], 'une barre finale ne crée pas un doublon');
  assert.deepEqual(basesPm2(DEFAUT + '/', DEFAUT), [DEFAUT], 'ni une barre oblique');
  assert.deepEqual(basesPm2(' ' + DEFAUT + ' ', DEFAUT), [DEFAUT], 'npm rend sa ligne avec des blancs');
});

test('basesPm2 : rien de connu → AUCUNE base, et non une base vide', () => {
  // Une base vide ferait joindre « pm2.cmd » au dossier courant du process : on lancerait n'importe
  // quoi trouvé à côté. Le code doit alors passer par son repli PATH, pas par un chemin relatif.
  assert.deepEqual(basesPm2('', ''), []);
  assert.deepEqual(basesPm2(null, undefined), []);
  assert.deepEqual(basesPm2('  ', '\\'), [], 'une base réduite à un séparateur ne compte pas');
});

test('basesPm2 : les sous-chemins sont bien ceux de npm sous Windows', () => {
  assert.deepEqual(SOUS_PM2_CMD, ['pm2.cmd']);
  assert.deepEqual(SOUS_PM2_JS, ['node_modules', 'pm2', 'bin', 'pm2']);
});

test('basesPm2 : résolution complète sur le préfixe RÉEL de cette machine (témoin)', () => {
  // Témoin d'environnement : sur ce poste, pm2 doit être trouvé. Si ce test rougit, c'est que pm2
  // n'est plus installé là où npm le met — et l'assertion le dira au lieu de laisser le panel
  // annoncer « pm2 ne répond plus ».
  const appdata = path.join(process.env.APPDATA || '', 'npm');
  let trouve = null;
  for (const base of basesPm2('', appdata)) {
    const js = path.join(base, ...SOUS_PM2_JS);
    if (fs.existsSync(js)) { trouve = js; break; }
  }
  assert.ok(trouve, `pm2 introuvable sous ${appdata} — vérifier \`npm prefix -g\``);
});

test('pm2 : le PATH est un repli RÉEL, et non plus un cul-de-sac', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  // Les chemins ne doivent plus être codés en dur.
  assert.doesNotMatch(src, /const PM2 = path\.join\(process\.env\.APPDATA/,
    'pm2 ne doit plus être cherché UNIQUEMENT sous %APPDATA%\\npm');
  assert.doesNotMatch(src, /const PM2_JS = path\.join\(process\.env\.APPDATA/);
  // Trois chemins de lancement, dans l'ordre : node direct, pm2.cmd du préfixe, puis le PATH.
  assert.match(src, /if \(!PM2\) return execFile\('pm2', args\.map\(quoteForShell\)/,
    'sans préfixe connu, le PATH doit être essayé — sinon un pm2 présent reste inatteignable');
  // Le sondage et les appels réels doivent lire la MÊME chose.
  assert.match(src, /execFile\('npm', \['prefix', '-g'\]/, 'le préfixe réel doit être appris');
  assert.match(src, /const parChemin = !!\(PM2 \|\| PM2_JS\);/);
  assert.match(src, /if \(parPath \|\| parChemin\) return resolve\(\{ node: true, pm2: true \}\);/,
    '« pm2 présent » doit vouloir dire « lançable par l\'un des trois chemins »');
  // Un préfixe part dans un execFile avec shell : il est filtré comme un script importé.
  assert.match(src, /if \(!eP && brut && !BAD_SHELL_RE\.test\(brut\)\) npmPrefix = brut;/,
    'un préfixe porteur de métacaractères ne doit pas atteindre cmd.exe');
  // …et le lanceur doit être RE-résolu après le sondage, sinon le préfixe appris ne sert à rien.
  assert.match(src, /probeToolchain\(\)\.then\(\(t\) => \{ toolchain = t; resolvePm2Runner\(\); \}\)/);
});

test('écran : le guidage « pm2 manquant » n\'est plus écrasé par « pm2 ne répond plus »', () => {
  // Sur un poste SANS pm2, les appels échouent, pm2Health tombe au bout de ~2 min, et l'affectation
  // de santé remplaçait « pm2 n'est pas installé » AVEC SON BOUTON D'INSTALLATION. L'écran disait
  // donc qu'un logiciel absent avait cessé de répondre, et retirait la seule issue. Premier écran
  // d'un poste neuf.
  const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  assert.doesNotMatch(app, /\n  if \(!health\.ok\) \{/,
    'l\'affectation de santé doit être conditionnée à une chaîne d\'outils en place');
  assert.match(app, /if \(!health\.ok && tc\.node && tc\.pm2\) \{/);
});

test('écran : plus aucun appel à la traduction dans la portée où `t` est l\'élément cliqué', () => {
  // `const t = e.target` masque la fonction `t` : l'appeler lançait un élément du DOM comme une
  // fonction (TypeError) AVANT tout appel à installPm2, et après `t.disabled = true` — le bouton
  // restait donc grisé pour toujours. On compte la FORME sur toute la portée, pas les deux sites
  // connus : c'est le prochain appel ajouté là qui compte.
  const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  const lignes = app.split(/\r?\n/);
  const debut = lignes.findIndex((l) => /const t = e\.target/.test(l));
  assert.ok(debut > 0, 'portée introuvable — ce test ne mesure plus rien');
  let prof = 0;
  const fautifs = [];
  for (let i = debut; i < lignes.length; i++) {
    prof += (lignes[i].match(/\{/g) || []).length - (lignes[i].match(/\}/g) || []).length;
    for (const m of lignes[i].matchAll(/(^|[^.\w])t\('([^']+)'\)/g)) fautifs.push(`ligne ${i + 1} : t('${m[2]}')`);
    if (i > debut && prof < 0) break;
  }
  assert.deepEqual(fautifs, [], 'utiliser window.i18n.t(...) dans cette portée');

  // TÉMOIN : le motif doit reconnaître un porteur fabriqué, sinon « aucun » ne veut rien dire.
  const faux = "    zone.textContent = t('tc.pm2Busy');";
  assert.equal([...faux.matchAll(/(^|[^.\w])t\('([^']+)'\)/g)].length, 1, 'le motif ne détecte rien');
});
