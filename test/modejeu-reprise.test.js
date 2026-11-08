// Mode jeu : un geste MANUEL reprend la main, et la garde ne l'annule plus.
//
// POURQUOI CE FICHIER : `panel:action` retirait bien le bot de `cfg.stoppedByGame` au nom d'une
// doctrine écrite noir sur blanc dans le code — « un geste MANUEL reprend la main sur ce bot : le
// mode jeu n'en est plus propriétaire ». Mais cette même liste sert AUSSI de porte d'entrée au mode
// jeu dans le tick : l'entrée a lieu quand la liste est VIDE (`cfg.stoppedByGame.length === 0`).
// Quand le bot repris était le SEUL parqué — le cas le plus courant sur ce poste — la liste se
// vidait, la porte se rouvrait, et `enterGameMode` recoupait le bot 10 à 15 secondes plus tard. En
// boucle, pendant toute la partie. La règle s'annulait donc elle-même, et uniquement dans ce cas-là,
// ce qui explique qu'elle ait survécu : avec deux bots parqués, tout semblait marcher.
//
// Une propriété se MÉMORISE ; elle ne se déduit pas d'une liste qui sert à deux choses.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ciblesModeJeu } = require('../logic');

const EN_LIGNE = (nom) => ({ name: nom, status: 'online' });
const CONFS = { saliox: { gameStop: true }, 'hasu-music': { gameStop: false } };

test('cibles : seuls les bots « coupé en jeu » et EN LIGNE sont visés', () => {
  const bots = [EN_LIGNE('saliox'), EN_LIGNE('hasu-music'), { name: 'dmall-bot', status: 'errored' }];
  assert.deepEqual(ciblesModeJeu(bots, { confs: CONFS }), ['saliox']);
});

test('cibles : « couper TOUS les bots » ignore les cases individuelles', () => {
  const bots = [EN_LIGNE('saliox'), EN_LIGNE('hasu-music')];
  assert.deepEqual(ciblesModeJeu(bots, { stopAll: true, confs: CONFS }), ['saliox', 'hasu-music']);
  // …mais jamais un bot déjà arrêté : on ne « coupe » pas ce qui ne tourne pas.
  assert.deepEqual(ciblesModeJeu([{ name: 'x', status: 'stopped' }], { stopAll: true }), []);
});

test('LE DÉFAUT : sans mémoire de la reprise, le bot est recoupé (contre-épreuve)', () => {
  // On rejoue la boucle. Le bot repris est le SEUL parqué, donc la liste se vide et la porte du tick
  // se rouvre : enterGameMode est rappelé avec le bot DE NOUVEAU en ligne.
  const bots = [EN_LIGNE('saliox')];
  assert.deepEqual(ciblesModeJeu(bots, { confs: CONFS, repris: [] }), ['saliox'],
    'témoin : c\'est bien ce calcul qui recoupait le bot à chaque tick');
});

test('LE CORRECTIF : le bot repris à la main n\'est plus visé', () => {
  const bots = [EN_LIGNE('saliox')];
  assert.deepEqual(ciblesModeJeu(bots, { confs: CONFS, repris: ['saliox'] }), [],
    'aucune cible → le mode jeu pose son marqueur « déjà traité » et ne recoupe rien');
});

test('la reprise d\'UN bot ne protège pas les autres', () => {
  // Desserrage à ne pas commettre : reprendre saliox ne doit pas empêcher de couper hasu-music.
  const bots = [EN_LIGNE('saliox'), EN_LIGNE('hasu-music')];
  assert.deepEqual(ciblesModeJeu(bots, { stopAll: true, confs: CONFS, repris: ['saliox'] }), ['hasu-music']);
});

test('cibles : entrées malsaines absorbées sans lever', () => {
  // Cette fonction est appelée sur une sortie pm2 et sur une config venue du disque.
  assert.deepEqual(ciblesModeJeu(null), []);
  assert.deepEqual(ciblesModeJeu(undefined, { stopAll: true }), []);
  assert.deepEqual(ciblesModeJeu([null, undefined, EN_LIGNE('a')], { stopAll: true }), ['a']);
  assert.deepEqual(ciblesModeJeu([EN_LIGNE('a')], { confs: null, repris: 'pas un tableau' }), []);
  assert.deepEqual(ciblesModeJeu([EN_LIGNE('a')], { stopAll: true, repris: 'pas un tableau' }), ['a']);
});

test('main.js : la reprise est ÉCRITE, pas seulement lue', () => {
  // Le piège qu'on a déjà payé deux fois dans cette passe : un correctif dont la moitié manque a
  // l'air complet. `reprisEnJeu` a besoin d'un écrivain, d'un lecteur, d'un nettoyage et d'une
  // traversée du disque — les quatre, ou rien ne se passe.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /cfg\.reprisEnJeu = \[\.\.\.new Set\(\[\.\.\.\(cfg\.reprisEnJeu \|\| \[\]\), name\]\)\];/,
    'panel:action doit MÉMORISER la reprise');
  // …et la condition doit être lue AVANT le filtre qui vide la liste, sinon elle est fausse
  // précisément dans le cas qui motive le correctif (le bot était le seul parqué).
  const iLu = src.indexOf('const etaitParque = cfg.stoppedByGame.includes(name);');
  const iFiltre = src.indexOf('cfg.stoppedByGame = cfg.stoppedByGame.filter((n) => n !== name);\r\n    //');
  assert.ok(iLu > 0, 'la lecture préalable est absente');
  assert.ok(iFiltre > iLu, 'la condition doit précéder le filtre qu\'elle observe');
  assert.match(src, /if \(action !== 'stop' && etaitParque\) \{/);
  // Nettoyée à la fin de l'épisode : sinon un bot repris une fois ne serait PLUS JAMAIS coupé en jeu.
  assert.match(src, /cfg\.stoppedByGame = \[\];\r?\n  \/\/ La reprise manuelle ne vaut QUE pour l'épisode/);
  assert.match(src, /cfg\.reprisEnJeu = \[\];/);
  // Et elle traverse le disque, comme stoppedByGame.
  assert.match(src, /reprisEnJeu: Array\.isArray\(raw\.reprisEnJeu\)/);
});

test('bootEnforce : revérifie juste avant de démarrer, sous le verrou du mode jeu', () => {
  // La garde de la collecte lit `cfg.stoppedByGame` au moment de la COLLECTE, or plusieurs secondes
  // s'écoulent ensuite — le lot d'arrêts comporte une grâce de 4 s, et c'est le lot v1.16.15 qui a
  // élargi cette fenêtre en groupant les arrêts avant les démarrages. Un jeu lancé au logon fait
  // entrer le tick en mode jeu dans cet intervalle, et bootEnforce rallumait ce qu'il venait de couper.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /await withGameLock\(async \(\) => \{\r?\n      for \(const n of aDemarrer\) \{/,
    'les démarrages doivent être sérialisés avec les bascules du mode jeu');
  assert.match(src, /if \(cfg\.stoppedByGame\.includes\(n\)\) \{ log\('boot: skip', n, '\(coupé par le mode jeu entre-temps\)'\)/);
  assert.match(src, /if \(cfg\.bots\[n\] && cfg\.bots\[n\]\.manualStop\) \{ log\('boot: skip', n/);
});

test('« Tout arrêter » marque TOUS les bots, pas seulement ceux en ligne', () => {
  // Le marquage ne visait que les bots EN LIGNE : un bot déjà tombé — donc inscrit dans healState et
  // attendant une relance à 5 / 15 / 60 min — n'était jamais marqué. La relance automatique le
  // rallumait quelques minutes après le clic, et « Auto boot » au démarrage suivant. L'utilisateur
  // voyait revenir exactement ce qu'il venait d'éteindre, et c'était le bot qui venait de tomber :
  // la raison même de son clic.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /for \(const b of tous\) \{ const c = cfg\.bots\[b\.name\][^\n]*c\.manualStop = true; \}/,
    'le marquage porte sur tous les bots connus de pm2');
  assert.match(src, /const online = tous\.filter\(\(b\) => b\.status === 'online'\);/,
    'l\'arrêt, lui, ne vise que ceux qui tournent');
  assert.doesNotMatch(src, /for \(const b of online\) \{ const c = cfg\.bots\[b\.name\]/);
});

test('éco réseau : le blocage des mises à jour est BORNÉ, comme le doute sur le jeu', () => {
  // `lowNetApplied` reste volontairement levé quand pm2 est muet (c'est lui qui permettra de
  // restaurer les priorités CPU plus tard). Mais il bloquait AUSSI toute mise à jour, sans borne :
  // un pm2 durablement injoignable gelait les mises à jour du panel POUR TOUJOURS, en silence —
  // alors que le blocage voisin (`blk.unknown`) est borné depuis longtemps, avec la raison écrite
  // en commentaire. Asymétrie entre deux doutes de même nature.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.doesNotMatch(src, /\n  if \(cfg\.lowNetApplied\) b\.push\('blk\.lownet'\);/);
  assert.match(src, /if \(cfg\.lowNetApplied && !\(lowNetCoinceDepuis && Date\.now\(\) - lowNetCoinceDepuis > GAME_UNKNOWN_MAX_MS\)\)/);
  assert.match(src, /if \(!lowNetCoinceDepuis\) lowNetCoinceDepuis = Date\.now\(\);/, 'le début du blocage doit être daté');
  assert.match(src, /lowNetCoinceDepuis = 0;\r?\n  cfg\.lowNetApplied = false;/, 'et remis à zéro quand ça repart');
});
