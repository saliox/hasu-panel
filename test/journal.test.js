// Le journal du panel : ce qu'il garantit quand le disque se dérobe.
//
// POURQUOI CE FICHIER : `log()` avalait ses propres échecs (`catch {}` vide). Or le journal est le seul
// témoin de presque toutes les pannes de ce panel — c'est lui qui a permis de diagnostiquer, dans la
// journée, le lanceur en double, le « Quitter » sans effet et la config figée. S'il meurt en silence,
// plus rien n'est traçable, et rien ne le signale : le moyen de signaler est justement ce qui est cassé.
//
// La logique est reproduite à l'identique ci-dessous (elle vit dans main.js, non importable hors
// Electron) et exercée sur un VRAI fichier, avec un verrou simulé.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Copie fidèle de la logique de main.js. Le test d'invariant plus bas vérifie qu'elle ne diverge pas.
const faireJournal = (fichier, estBloque) => {
  const enAttente = [];
  const MAX = 300;
  let echec = false;
  const alertes = [];
  const ecrire = (texte) => { if (estBloque()) throw new Error('EBUSY: resource busy or locked'); fs.appendFileSync(fichier, texte); };
  const log = (ligne) => {
    try {
      const rattrapage = enAttente.length ? enAttente.join('\n') + '\n' : '';
      ecrire(rattrapage + ligne + '\n');
      enAttente.length = 0;
      if (echec) { echec = false; try { ecrire('journal de nouveau accessible\n'); } catch { /* rare */ } }
    } catch (e) {
      enAttente.push(ligne);
      if (enAttente.length > MAX) enAttente.shift();
      if (echec) return;
      echec = true;
      alertes.push(e.message);
    }
  };
  return { log, alertes, enAttente, MAX };
};

const dossierTemp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hasu-journal-'));

test('journal : un verrou passager ne TROUE pas le journal', () => {
  // Les minutes les plus intéressantes sont justement celles d'une panne en cours : ce sont elles
  // qu'on perdait. Elles doivent réapparaître dès que le fichier redevient accessible.
  const dir = dossierTemp(); const f = path.join(dir, 'panel.log');
  let bloque = false;
  const j = faireJournal(f, () => bloque);
  j.log('avant'); bloque = true;
  j.log('pendant-1'); j.log('pendant-2'); bloque = false;
  j.log('apres');
  assert.deepEqual(fs.readFileSync(f, 'utf8').trim().split('\n'),
    ['avant', 'pendant-1', 'pendant-2', 'apres', 'journal de nouveau accessible']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('journal : vider la file AVANT l\'écriture perdait tout — régression à ne pas refaire', () => {
  // Mon premier jet faisait `enAttente.splice(0)` dans la construction du texte : si l'écriture
  // échouait ensuite, la file entière partait avec elle. Le correctif en perdait plus qu'il n'en
  // sauvait — attrapé par ce scénario, pas par une relecture du code.
  const dir = dossierTemp(); const f = path.join(dir, 'panel.log');
  let bloque = true;
  const j = faireJournal(f, () => bloque);
  j.log('a'); j.log('b'); j.log('c');
  assert.deepEqual(j.enAttente, ['a', 'b', 'c'], 'les trois lignes doivent être encore en attente');
  bloque = false;
  j.log('d');
  assert.deepEqual(fs.readFileSync(f, 'utf8').trim().split('\n'), ['a', 'b', 'c', 'd', 'journal de nouveau accessible']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('journal : une seule alerte par panne, pas une par ligne', () => {
  // Sinon une panne de disque déclencherait une rafale de webhooks — l'inverse du service rendu.
  const dir = dossierTemp(); const f = path.join(dir, 'panel.log');
  const j = faireJournal(f, () => true);
  for (let i = 0; i < 50; i++) j.log('x' + i);
  assert.equal(j.alertes.length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('journal : la file est bornée et garde les lignes les plus RÉCENTES', () => {
  // Une panne longue ne doit pas faire enfler la mémoire ; et si on doit choisir, ce sont les
  // dernières lignes qui expliquent ce qui vient de se passer.
  const dir = dossierTemp(); const f = path.join(dir, 'panel.log');
  const j = faireJournal(f, () => true);
  for (let i = 0; i < 500; i++) j.log('spam-' + i);
  assert.equal(j.enAttente.length, j.MAX);
  assert.equal(j.enAttente[j.enAttente.length - 1], 'spam-499');
  assert.equal(j.enAttente[0], 'spam-200', 'les plus anciennes sont abandonnées');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('journal : main.js applique bien cette logique (et pas une variante)', () => {
  // Ce fichier REPRODUIT le code de main.js : sans cet ancrage, les deux pourraient diverger et les
  // tests ci-dessus ne prouveraient plus rien du vrai panel.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /logEnAttente\.length = 0; \/\/ APRÈS le succès seulement/);
  // On cherche la ligne telle qu'elle est ÉCRITE : un antislash suivi d'un « n », pas un vrai saut
  // de ligne. D'où le doublement dans le motif.
  assert.match(src, /const rattrapage = logEnAttente\.length \? logEnAttente\.join\('\\n'\) \+ '\\n' : '';/);
  assert.equal(/logEnAttente\.splice\(0\)/.test(src), false, 'vider avant l\'écriture = perdre la file');
  assert.match(src, /if \(logWriteFailed\) return;/, 'une seule alerte par panne');
  assert.match(src, /if \(logEnAttente\.length > LOG_ATTENTE_MAX\) logEnAttente\.shift\(\);/, 'file bornée');
});
