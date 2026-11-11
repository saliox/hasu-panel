// Un surveillant qui MEURT est pire qu'un surveillant qui se trompe.
//
// POURQUOI CE FICHIER : le projet n'avait AUCUN garde-fou de plantage. Ni `uncaughtException`, ni
// `unhandledRejection`, ni `render-process-gone`, ni `window.onerror` — zéro, mesuré sur les quatre
// fichiers. Or Node >= 15 TERMINE le processus sur une promesse rejetée non captée, et il restait des
// chemins exposés, dont les DEUX chaînes de démarrage `app.whenReady().then(async …)` sans `.catch` :
// un seul throw y tuait le panel AU LANCEMENT, sans fenêtre et sans journal. On double-clique et il ne
// se passe rien.
//
// PREUVE PAR INJECTION, hors de cette suite : une vraie `Promise.reject` posée dans le chemin
// d'auto-test, puis le panel lancé pour de bon. Avant le filet, Node l'aurait tué. Mesuré :
//   arbre sain          : sortie 0
//   avec panne injectée : sortie 0 — a SURVÉCU, a fini son travail, l'a dit au journal,
//                         et le chemin y est masqué (C:\Users\[…]\…)
// Les assertions ci-dessous ne remplacent pas cette mesure : elles empêchent qu'on retire la pièce.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'ui', 'index.html'), 'utf8');

test('le processus principal intercepte les deux formes de plantage', () => {
  assert.match(main, /process\.on\('uncaughtException', \(e\) => noterPlantage\('exception', e\)\);/);
  assert.match(main, /process\.on\('unhandledRejection', \(e\) => noterPlantage\('promesse rejetée', e\)\);/);
});

test('le filet CONTINUE au lieu de sortir', () => {
  // Le choix est délibéré : poursuivre avec un état peut-être abîmé est un compromis assumé. Le pire
  // cas d'une poursuite est un affichage faux, que le reste du panel sait signaler ; le pire cas d'un
  // arrêt est que plus personne ne surveille les bots, et que rien ne le dise.
  const i = main.indexOf('const noterPlantage = ');
  const corps = main.slice(i, main.indexOf('\nprocess.on(', i));
  assert.ok(i > 0 && corps.length > 200, 'noterPlantage introuvable : ce test ne mesure plus rien');
  assert.doesNotMatch(corps, /process\.exit|app\.quit|app\.exit/, 'le filet ne doit pas tuer ce qu\'il protège');
});

test('le filet DIT ce qu\'il a attrapé, et masque le chemin', () => {
  const i = main.indexOf('const noterPlantage = ');
  const corps = main.slice(i, main.indexOf('\nprocess.on(', i));
  assert.match(corps, /log\('PLANTAGE INTERCEPTÉ —'/, 'journal');
  assert.match(corps, /masquer\(String\(\(err && err\.stack\) \|\| err/, 'la pile contient le chemin complet, donc le nom de session');
  assert.match(corps, /queueAlert\('⚠️ Erreur interne du panel'/, 'alerte de la famille PANEL');
  // …une alerte par CAUSE, pas par occurrence : une erreur dans le tick se répéterait toutes les 10 s.
  assert.match(corps, /if \(!plantagesVus\.has\(titre\)\)/);
  assert.match(corps, /if \(plantagesVus\.size > 50\) plantagesVus\.clear\(\)/, 'et la mémoire est bornée');
});

test('le filet ne peut pas devenir la cause d\'un plantage', () => {
  // Un garde-fou qui lève est pire que pas de garde-fou : il transforme une erreur récupérable en
  // mort du processus, juste au moment où tout va mal.
  const i = main.indexOf('const noterPlantage = ');
  const corps = main.slice(i, main.indexOf('\nprocess.on(', i));
  assert.match(corps, /\} catch \{ \/\* le filet ne doit JAMAIS être la cause d'un plantage \*\/ \}/);
});

test('les deux chaînes de démarrage sont protégées', () => {
  // C'est LE chemin le plus exposé : un throw y tuait le panel avant toute fenêtre et tout journal.
  const chaines = [...main.matchAll(/app\.whenReady\(\)\.then\(async \(\) => \{/g)];
  assert.equal(chaines.length, 2, `attendu 2 chaînes whenReady, vu ${chaines.length}`);
  const catches = [...main.matchAll(/\}\)\.catch\(\(e\) => \{\r?\n    \/\/ Le démarrage est le chemin le PLUS exposé/g)];
  assert.equal(catches.length, 2, 'chacune doit avoir son `.catch`');
  assert.match(main, /log\('DÉMARRAGE : erreur non captée —'/);
});

test('les promesses lancées « et oubliées » ne peuvent plus tuer le processus', () => {
  assert.match(main, /return reconcileEnCours\.catch\(\(\) => \{\}\)\.then\(\(\) => reconcilerLanceurs\(forcer\)\);/);
  // Un callback `async` dans un minuteur n'a pas d'appelant pour attraper son rejet.
  assert.match(main, /saveTimer = setTimeout\(\(\) => \{ \(async \(\) => \{/);
  assert.match(main, /\}\)\(\)\.catch\(\(e\) => log\('pm2 save auto : erreur interne —', e && e\.message\)\); \}, delayMs\);/);
  assert.doesNotMatch(main, /saveTimer = setTimeout\(async \(\) => \{/, 'plus de callback async nu dans un minuteur');
});

test('le processus d\'affichage perdu est rattrapé', () => {
  // La fenêtre devient blanche et le panel a l'air vivant depuis la zone de notification : la
  // surveillance tourne toujours, mais plus personne ne peut la LIRE.
  assert.match(main, /app\.on\('render-process-gone', \(_e, _wc, details\) => \{/);
  assert.match(main, /try \{ if \(win && !win\.isDestroyed\(\)\) win\.reload\(\); \}/);
  assert.match(main, /app\.on\('child-process-gone'/, 'un utilitaire qui tombe se note, sans recharger');
});

test('l\'écran ne gèle plus en SILENCE', () => {
  // `try { render(...) } catch {}` était NU, à l'endroit le plus visible du logiciel : l'écran gelait
  // sur sa dernière image pendant que le sondage continuait toutes les 3 s, et l'utilisateur lisait
  // des chiffres périmés en les croyant vivants. Pour un logiciel dont le métier est de montrer un
  // état, c'est le pire mensonge possible.
  assert.doesNotMatch(app, /try \{ render\(await window\.panel\.status\(\)\); \} catch \{\}/);
  assert.match(app, /console\.error\('\[panel\] échec de rendu #' \+ echecsRendu, e\);/);
  assert.match(app, /window\.addEventListener\('error',/);
  assert.match(app, /window\.addEventListener\('unhandledrejection',/);
  // …et un rendu réussi EFFACE le bandeau : sinon il resterait après le retour à la normale.
  assert.match(app, /if \(echecsRendu\) \{ echecsRendu = 0; dernierEchecRendu = ''; majBandeauRendu\(\); \}/);
});

test('le bandeau d\'échec n\'emprunte PAS le chemin en panne', () => {
  // Un rapporteur qui passe par `render()` — ce qui vient justement d'échouer — ne rapporte rien.
  const i = app.indexOf('const majBandeauRendu = ');
  const corps = app.slice(i, app.indexOf('\n};', i));
  assert.ok(i > 0, 'majBandeauRendu introuvable');
  assert.match(corps, /document\.getElementById\('rendu-ko'\)/, 'écriture directe dans le DOM');
  assert.doesNotMatch(corps, /render\(/, 'il ne doit pas rappeler le rendu');
});

test('l\'élément du bandeau EXISTE dans la page', () => {
  // Sans lui, `majBandeauRendu` sort sur `if (!zone) return;` et le bandeau n'apparaît JAMAIS : une
  // mémoire que personne n'affiche ne dit rien. C'est la troisième fois que ce piège se présente
  // dans cette passe, d'où cette assertion explicite.
  assert.match(html, /<div id="rendu-ko" class="updcard err" style="display:none"><\/div>/);
  // …et il n'a PAS de data-i18n : son texte est calculé (compteur + message), l'application des
  // traductions au DOM l'écraserait à chaque changement de langue.
  const ligne = html.split(/\r?\n/).find((l) => l.includes('id="rendu-ko"'));
  assert.doesNotMatch(ligne, /data-i18n/);
});

test('la clé du bandeau existe dans les 14 langues, avec ses deux emplacements', () => {
  const dossier = path.join(__dirname, '..', 'ui', 'lang');
  const langues = fs.readdirSync(dossier).filter((f) => f.endsWith('.js'));
  assert.equal(langues.length, 14);
  for (const l of langues) {
    const s = fs.readFileSync(path.join(dossier, l), 'utf8');
    const m = s.match(/'ui\.renderFail': '(.*)',$/m);
    assert.ok(m, `${l} : clé ui.renderFail absente`);
    assert.ok(m[1].includes('{n}') && m[1].includes('{err}'), `${l} : emplacements manquants`);
  }
});
