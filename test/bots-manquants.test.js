// Les bots qu'on attend et que pm2 ne nomme plus.
//
// POURQUOI CE FICHIER : le panel ne surveillait que ce que pm2 voulait bien nommer. Un bot supprimé
// de pm2 — `pm2 delete` tapé au terminal, un `pm2 resurrect` depuis un dump périmé, un démon
// réinstallé, un dossier de données pm2 perdu — disparaissait simplement de l'écran : plus de ligne,
// donc plus de pastille, plus d'alerte, plus de relance automatique, et « 0/0 en ligne » affiché EN
// VERT. C'est l'angle mort exact du constat qui a motivé ce logiciel (quatre bots morts cinq jours
// sans que personne ne le signale) : un bot ABSENT est plus silencieux qu'un bot TOMBÉ.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { botsManquants } = require('../logic');

const EN_LIGNE = (nom) => ({ name: nom, status: 'online' });

test('manquants : un bot attendu et absent de pm2 est signalé', () => {
  const confs = { saliox: { auto: true }, 'hasu-music': { auto: true } };
  assert.deepEqual(botsManquants(confs, [EN_LIGNE('saliox')]), ['hasu-music']);
});

test('manquants : pm2 vide alors qu\'on attend des bots → tous signalés, triés', () => {
  // Le cas le plus grave : l'écran affichait « 0/0 en ligne » en vert.
  const confs = { zeta: { auto: true }, alpha: { auto: true }, mid: { auto: true } };
  assert.deepEqual(botsManquants(confs, []), ['alpha', 'mid', 'zeta']);
});

test('manquants : un bot dont on ne veut PAS n\'est pas une panne', () => {
  // « Auto boot » décoché ou arrêt volontaire = un choix, pas un incident. Sans ce filtre, le
  // bandeau crierait en permanence sur les postes où des bots sont volontairement de côté — et un
  // bandeau qui crie toujours ne dit plus rien.
  assert.deepEqual(botsManquants({ a: { auto: false } }, []), []);
  assert.deepEqual(botsManquants({ a: { auto: true, manualStop: true } }, []), []);
  assert.deepEqual(botsManquants({ a: {} }, []), ['a'], 'auto non précisé = on le veut en ligne');
});

test('manquants : un bot présent, quel que soit son ÉTAT, n\'est pas manquant', () => {
  // Un bot tombé est déjà couvert par les alertes et la relance : ce bandeau parle d'autre chose,
  // d'un process que pm2 ne connaît plus du tout, et pour lequel « Remettre en ordre » ne peut rien.
  for (const etat of ['online', 'stopped', 'errored', 'launching', 'stopping']) {
    assert.deepEqual(botsManquants({ a: { auto: true } }, [{ name: 'a', status: etat }]), [], etat);
  }
});

test('manquants : entrées malsaines absorbées', () => {
  assert.deepEqual(botsManquants(null, null), []);
  assert.deepEqual(botsManquants({ a: { auto: true } }, [null, undefined, {}]), ['a']);
  assert.deepEqual(botsManquants({ a: null }, []), [], 'une config nulle ne réclame rien');
});

test('manquants : JAMAIS calculé quand pm2 est muet', () => {
  // Le piège serait spectaculaire : pm2 injoignable → aucune liste → TOUS les bots « manquants »,
  // c'est-à-dire un mensonge maximal au pire moment. Tout le reste du panel s'applique à distinguer
  // « aucun bot » de « pm2 ne répond pas » ; ce bandeau doit suivre la même règle.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /manquants: pm2Health\.ok \? botsManquants\(cfg\.bots, statusCache\.bots\) : \[\],/);
});

test('écran : le bandeau atteint le DOM dans les DEUX branches', () => {
  // `botsHtml` a un repli `|| (… + empty)` pour le cas « aucune ligne de bot » — et c'est
  // précisément le cas où un bot manquant compte le plus : s'il est le seul attendu, il n'y a
  // aucune ligne à afficher. Une mémoire que personne n'affiche ne dit rien.
  const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  assert.match(app, /const botsHtml = \(!health\.ok \? empty : ''\) \+ missBanner \+ fixBanner \+ \(/);
  assert.match(app, /\|\| \(missBanner \+ fixBanner \+ empty\);/);
  assert.match(app, /t\('bots\.missing', \{ n: manquants\.length \}\)/);
  assert.match(app, /t\('bots\.missingWhy'\)/, 'dire QUOI faire, pas seulement qu\'il y a un problème');
});

test('écran : « hors ligne depuis » n\'est affiché que si on le SAIT', () => {
  // La durée venait de `healState`, qui ne couvre pas tous les bots. Pas de date plutôt qu'une date
  // fausse : afficher « hors ligne depuis 0 s » sur un bot tombé la nuit dernière serait pire que rien.
  const app = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');
  assert.match(app, /const depuis = b\.status !== 'online' \? \(st\.horsLigneDepuis \|\| \{\}\)\[b\.name\] : 0;/);
  assert.match(app, /depuis \? ' · ' \+ t\('bots\.downFor', \{ v: fmtUptime\(depuis\) \}\) : ''/);
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /horsLigneDepuis: Object\.fromEntries\(\[\.\.\.healState\]\.map\(\(\[n, v\]\) => \[n, v\.downSince \|\| 0\]\)\)/);
});

test('les trois clés existent dans les 14 langues, avec leurs emplacements', () => {
  // Doublon volontaire avec les épreuves d'i18n : ici on vérifie les clés DE CE LOT, pour que leur
  // absence dans une langue rougisse sous un libellé qui dit de quoi il s'agit.
  const dossier = path.join(__dirname, '..', 'ui', 'lang');
  const langues = fs.readdirSync(dossier).filter((f) => f.endsWith('.js'));
  assert.equal(langues.length, 14, `attendu 14 langues, vu ${langues.length}`);
  for (const l of langues) {
    const s = fs.readFileSync(path.join(dossier, l), 'utf8');
    for (const cle of ['bots.missing', 'bots.missingWhy', 'bots.downFor']) {
      assert.ok(s.includes(`'${cle}'`), `${l} : clé ${cle} absente`);
    }
    const missing = s.match(/'bots\.missing': '(.*)',$/m);
    assert.ok(missing && missing[1].includes('<b>{n}</b>'), `${l} : bots.missing doit porter <b>{n}</b>`);
    const downFor = s.match(/'bots\.downFor': '(.*)',$/m);
    assert.ok(downFor && downFor[1].includes('{v}'), `${l} : bots.downFor doit porter {v}`);
    assert.ok(/'bots\.missingWhy': '[^']*pm2/.test(s), `${l} : « pm2 » ne se traduit pas`);
  }
});
