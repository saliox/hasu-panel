// Rien ne doit échouer en silence.
//
// POURQUOI CE FICHIER : le panel existe pour qu'une panne ne passe pas inaperçue, et plusieurs de ses
// propres gestes échouaient sans un mot — ni message à l'écran, ni ligne de journal. C'est la même
// classe que les trois portes d'alerte perdues (v1.16.14, .17, .18), mais du côté des boutons.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const main = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');

const { motifAction } = require('../logic');

test('motif : une action réussie ne produit AUCUN motif', () => {
  assert.equal(motifAction(true, 'peu importe ce que pm2 a dit'), '');
});

test('motif : un refus produit toujours un motif lisible', () => {
  // Le cœur du défaut : on rendait `{ ok: r.ok }` et on jetait `r.out`, qui contient précisément le
  // motif. Le bouton reprenait son état normal, le bot restait éteint, et il ne restait RIEN — ni
  // message, ni ligne de journal.
  assert.equal(motifAction(false, "Error: Cannot find module 'discord.js'"),
    'Module manquant (npm install à refaire)', 'les causes connues sont traduites');
  assert.match(motifAction(false, '[PM2][ERROR] Script not found: C:/x/index.js'), /Script not found/,
    'une cause inconnue remonte telle quelle, c\'est mieux que rien');
});

test('motif : même sans un mot de pm2, le refus se DIT', () => {
  // Un motif vide ferait réapparaître le silence par la porte de derrière : « ok: false » sans
  // explication est exactement ce que l'utilisateur voyait avant.
  for (const vide of ['', null, undefined, '   ']) {
    assert.match(motifAction(false, vide), /refusé/, `sortie ${JSON.stringify(vide)}`);
  }
  assert.equal(motifAction(false, 42), '42', 'une sortie non textuelle ne doit pas faire lever');
});

test('un ▶/⏹/⟳ refusé par pm2 laisse une trace, et le chemin y est masqué', () => {
  assert.doesNotMatch(main, /await refreshBots\(\);\r?\n    return \{ ok: r\.ok \};/,
    'le motif donné par pm2 ne doit plus être jeté');
  assert.match(main, /log\('action REFUSÉE :', action, name, '—', masquer\(/,
    'un refus doit laisser une trace, et le chemin du script y est masqué');
  assert.match(main, /const motif = motifAction\(r\.ok, r\.out\);/, 'la décision doit venir de la fonction pure');
  assert.match(main, /return \{ ok: false, error: masquer\(motif\) \};/);
});

// ⚠️ CE QUE CE FICHIER NE PROUVE PAS, et il faut le dire. Les assertions ci-dessus qui portent sur le
//    TEXTE de main.js montrent qu'un code est ÉCRIT, jamais qu'il s'EXÉCUTE. Mesuré : en remplaçant
//    `if (!r.ok)` par `if (false)` dans le gestionnaire, la suite restait VERTE — le mutant a survécu.
//    La décision a donc été extraite en fonction pure (`motifAction`, éprouvée juste au-dessus), mais
//    l'ATTEIGNABILITÉ de la branche qui l'appelle reste hors de portée d'une suite qui n'exécute pas
//    Electron. C'est une limite de l'outillage, pas une épreuve oubliée : la combler demanderait de
//    lancer le processus principal et de piloter un vrai pm2 depuis les tests.

test('« 📂 Dossier » : openPath est une PROMESSE, son échec est rendu', () => {
  // `shell.openPath` ne lève JAMAIS : elle se résout sur une chaîne vide en cas de succès et sur le
  // message d'erreur sinon. Le try/catch ne protégeait de rien, et `ok: true` était annoncé même
  // quand le dossier n'existait plus (bot désinstallé, disque externe débranché, dossier renommé).
  assert.doesNotMatch(main, /try \{ shell\.openPath\(target\); return \{ ok: true \}; \} catch/);
  assert.match(main, /const err = await shell\.openPath\(target\)\.catch\(/);
  assert.match(main, /ipcMain\.handle\('panel:openFolder', async /, 'le gestionnaire doit être async');
});

test('« 📂 Dossier » : les DEUX points d\'appel montrent le refus', () => {
  // Le jumeau manqué. J'avais corrigé le 📂 de la ligne du bot et oublié celui de la modale des
  // logs — c'est un recensement de FORME qui l'a trouvé, pas une relecture. Chercher un nom trouve
  // un porteur ; chercher la forme les trouve tous.
  const porteurs = [...app.matchAll(/window\.panel\.openFolder\(/g)];
  assert.equal(porteurs.length, 2, 'si un troisième apparaît, il doit être traité comme les deux autres');
  for (const m of porteurs) {
    const contexte = app.slice(Math.max(0, m.index - 60), m.index + 200);
    assert.match(contexte, /const r = await window\.panel\.openFolder/,
      `un openFolder dont le résultat est jeté : ${contexte.slice(0, 90).replace(/\s+/g, ' ')}`);
    assert.match(contexte, /if \(r && !r\.ok\) alert\(/);
  }
});

test('un « pm2 save » en ÉCHEC est réessayé, comme un « pm2 save » différé', () => {
  // « Différé doit vouloir dire RÉESSAYÉ » : la phrase est écrite dans ce fichier, pour le report
  // pendant une partie, et elle n'était PAS appliquée au cas de l'échec. Un save raté était
  // journalisé puis ABANDONNÉ : le dump restait périmé et le prochain reboot restaurait un état
  // faux — très exactement la plaie que ce report existe pour éviter. Deux cas voisins, un seul
  // réessayait : l'asymétrie EST le défaut.
  assert.doesNotMatch(main, /else log\('pm2 save auto échec'\);/);
  assert.match(main, /if \(saveRetries % 10 === 1\) log\('pm2 save auto ÉCHEC/);
  assert.match(main, /schedulePm2Save\(Math\.min\(15000 \* saveRetries, 120000\)\);/,
    'le réessai doit s\'espacer, et être plafonné');
  // …et un succès remet le compteur à zéro, sinon l'espacement resterait maximal pour toujours.
  assert.match(main, /log\('pm2 save auto OK'\); saveRetries = 0; return;/);
});

test('l\'écran garde et montre le refus sur la ligne du bot', () => {
  assert.match(app, /const echecsAction = new Map\(\);/);
  assert.match(app, /const ECHEC_VISIBLE_MS = 60 \* 1000;/, 'un refus ne doit pas rester affiché pour toujours');
  assert.match(app, /const r = await window\.panel\.action\(name, t\.dataset\.act\);/,
    'le retour de l\'action ne doit plus être jeté');
  assert.match(app, /if \(r && r\.ok\) echecsAction\.delete\(name\);/, 'un succès efface le refus précédent');
  assert.match(app, /echecsAction\.set\(name, \{ texte: \(r && r\.error\)/);
  // …et c'est bien affiché, pas seulement mémorisé : une mémoire que personne ne lit ne dit rien.
  assert.match(app, /\$\{motif \? ` · <span style="color:var\(--err\)">⚠️ \$\{esc\(motif\)\}<\/span>` : ''\}/,
    'le motif doit atteindre le gabarit de la ligne du bot');
  assert.match(app, /const motif = \(echec && Date\.now\(\) - echec\.at < ECHEC_VISIBLE_MS\) \? echec\.texte : '';/);
});

test('l\'ajout d\'un .exe refusé le DIT, sur les trois points d\'appel', () => {
  // `addGame` refuse les noms qui ne sont pas « NomDuJeu.exe ». Deux des trois appels jetaient ce
  // refus : on fermait la modale et « rien ne se passait ». Le troisième (le champ de saisie)
  // montrait déjà `r.error` — c'est cette asymétrie dans un même fichier qui désignait l'oubli.
  const porteurs = [...app.matchAll(/window\.panel\.addGame\(/g)];
  assert.ok(porteurs.length >= 3, `attendu au moins 3 points d'appel, vu ${porteurs.length}`);
  for (const m of porteurs) {
    const contexte = app.slice(Math.max(0, m.index - 80), m.index + 220);
    assert.match(contexte, /const r = await window\.panel\.addGame|r\.ok/,
      `un addGame dont le refus est jeté : ${contexte.slice(60, 150).replace(/\s+/g, ' ')}`);
  }
});

test('témoin : les motifs ci-dessus reconnaissent bien quelque chose', () => {
  // Toutes les assertions de ce fichier portent sur du texte source. Si un motif ne reconnaissait
  // plus rien — fichier renommé, code réécrit — les `doesNotMatch` passeraient pour la mauvaise
  // raison et les `match` rougiraient en accusant le mauvais coupable.
  assert.ok(main.length > 100_000, 'main.js est vide ou introuvable : ce fichier ne mesure plus rien');
  assert.ok(app.length > 40_000, 'ui/app.js est vide ou introuvable');
  assert.match(main, /ipcMain\.handle\('panel:action'/, 'le gestionnaire visé existe toujours');
  assert.match(main, /const schedulePm2Save = /);
  assert.match(app, /window\.panel\.action\(/);
});
