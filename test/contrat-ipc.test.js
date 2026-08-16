// Contrat entre le processus principal et l'écran (`panel:status`).
//
// POURQUOI CE FICHIER. main.js fait ~2000 lignes et n'était couvert par AUCUN test : il a besoin
// d'Electron pour se charger, donc `require('../main')` est impossible ici. Or DEUX des pannes
// silencieuses livrées par ce projet vivaient précisément à cette frontière :
//   • les réglages d'alertes n'étaient pas envoyés dans `panel:status` → l'interrupteur se recochait
//     tout seul (undefined !== false) et le champ webhook se vidait au premier rafraîchissement ;
//     la fonctionnalité phare ne marchait pas, tout en affichant « activé ».
//   • `cleanNotes` appelé sans être importé → toute la chaîne de mise à jour coupée.
// Le point commun : un champ lu d'un côté, jamais fourni de l'autre, et rien pour le dire.
//
// On analyse donc les DEUX fichiers en texte et on croise leurs champs. C'est grossier, mais ça
// attrape exactement la classe de bug qui a coûté cher, sans exiger Electron ni refonte.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/\r\n?/g, '\n');
const MAIN = lire('main.js');
const UI = lire('ui/app.js');
const PRELOAD = lire('preload.js');

// Corps du `ipcMain.handle('panel:status', () => ({ … }))`, découpé par équilibrage d'accolades.
const corpsStatus = (() => {
  const i = MAIN.indexOf("ipcMain.handle('panel:status'");
  assert.ok(i > 0, 'gestionnaire panel:status introuvable dans main.js');
  const debut = MAIN.indexOf('({', i);
  let d = 0, fin = -1;
  for (let k = debut + 1; k < MAIN.length; k++) {
    if (MAIN[k] === '{') d++;
    else if (MAIN[k] === '}') { d--; if (d === 0) { fin = k; break; } }
  }
  assert.ok(fin > 0, 'fin du gestionnaire panel:status introuvable');
  return MAIN.slice(debut, fin);
})();

// Clés de premier niveau réellement envoyées.
const champsEnvoyes = new Set(
  [...corpsStatus.matchAll(/^\s{2}([A-Za-z_$][\w$]*)\s*[:,]/gm)].map((m) => m[1])
);

// On fouille TOUT ui/app.js, pas seulement le corps de render().
//
// La première version se limitait à render() parce qu'un `const st = $('upd-status')` masquait
// l'objet de statut et produisait de faux manquants (textContent, innerHTML). Mais restreindre la
// fouille créait un FAUX NÉGATIF bien pire : un champ lu depuis un helper appelé par render() —
// c'est-à-dire le sens dans lequel ce fichier évolue — n'était plus vérifié du tout. Le masquage a
// donc été levé à la source (la variable locale s'appelle `zone`), et on peut fouiller partout.
const corpsRender = UI;

test('garde-fou : aucune variable locale ne masque plus l\'objet de statut', () => {
  // Si quelqu'un réintroduit un `const st = …` local, la fouille globale ci-dessus redevient
  // bruyante et ce test le dit tout de suite, au lieu de laisser le contrat se dégrader en silence.
  const masques = [...UI.matchAll(/\b(?:const|let|var)\s+st\s*=/g)];
  assert.equal(masques.length, 0,
    'une variable locale nommée `st` masque l\'objet de statut : renomme-la (voir `zone`)');
});

test('panel:status envoie bien les champs que l\'écran lit', () => {
  const lus = new Set([...corpsRender.matchAll(/\bst\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  lus.delete('cfg'); // sous-objet vérifié séparément ci-dessous
  const manquants = [...lus].filter((c) => !champsEnvoyes.has(c));
  assert.deepEqual(manquants, [],
    `l'écran lit ${manquants.join(', ')} mais panel:status ne l'envoie pas → undefined silencieux`);
});

test('panel:status : le sous-objet cfg contient ce que l\'écran y lit', () => {
  const iCfg = corpsStatus.indexOf('cfg: {');
  assert.ok(iCfg > 0, 'sous-objet cfg introuvable dans panel:status');
  let d = 0, fin = -1;
  for (let k = corpsStatus.indexOf('{', iCfg); k < corpsStatus.length; k++) {
    if (corpsStatus[k] === '{') d++;
    else if (corpsStatus[k] === '}') { d--; if (d === 0) { fin = k; break; } }
  }
  const bloc = corpsStatus.slice(iCfg, fin);
  const envoyes = new Set([...bloc.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]));
  const lus = new Set([...UI.matchAll(/\bst\.cfg\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const manquants = [...lus].filter((c) => !envoyes.has(c));
  assert.deepEqual(manquants, [],
    `l'écran lit st.cfg.${manquants.join(', st.cfg.')} mais le main ne l'envoie pas`);
});

test('preload : tout ce que l\'écran appelle sur window.panel est exposé', () => {
  // Un appel à une méthode non exposée lève un TypeError dans le renderer — invisible côté main.
  const exposes = new Set([...PRELOAD.matchAll(/^\s{2}([A-Za-z_$][\w$]*)\s*:/gm)].map((m) => m[1]));
  const appeles = new Set([...UI.matchAll(/window\.panel\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const manquants = [...appeles].filter((m) => !exposes.has(m));
  assert.deepEqual(manquants, [], `window.panel.${manquants.join(', window.panel.')} n'existe pas dans preload.js`);
});

test('preload : tout ce qui est exposé est un canal réellement géré par le main', () => {
  // L'inverse : un `invoke('panel:xxx')` sans `ipcMain.handle` correspondant reste en attente
  // pour toujours — le bouton se fige sans le moindre message.
  const canaux = [...PRELOAD.matchAll(/invoke\('([^']+)'/g)].map((m) => m[1]);
  const geres = new Set([...MAIN.matchAll(/ipcMain\.handle\('([^']+)'/g)].map((m) => m[1]));
  const orphelins = [...new Set(canaux)].filter((c) => !geres.has(c));
  assert.deepEqual(orphelins, [], `canaux exposés mais non gérés dans main.js : ${orphelins.join(', ')}`);
});

test('les réglages à interrupteur voyagent tous (le bug qui recochait les cases tout seul)', () => {
  // Ces champs valaient `undefined` côté écran ; comme le code teste `!== false`, l'interrupteur
  // se réaffichait « activé » à chaque rafraîchissement, quel que soit le réglage réel.
  for (const champ of ['alerts', 'alertToast', 'alertSound', 'alertVolume', 'alertWebhook']) {
    assert.ok(new RegExp(`\\b${champ}\\s*:`).test(corpsStatus), `panel:status n'envoie pas cfg.${champ}`);
  }
  for (const champ of ['autoApplyUpdates', 'autoHeal']) {
    assert.ok(champsEnvoyes.has(champ), `panel:status n'envoie pas ${champ}`);
  }
});
