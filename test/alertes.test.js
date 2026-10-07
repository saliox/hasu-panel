// Alertes : que devient une alerte dont TOUS les envois ont échoué ?
//
// POURQUOI CE FICHIER : une alerte « bot tombé » naît d'une TRANSITION (en ligne → tombé). Cette
// transition est consommée au premier envoi — `prevStatus` avance. Si l'envoi échoue (webhook
// injoignable : typiquement la coupure réseau qui a tué les bots, c'est-à-dire LE scénario fondateur),
// le code réessayait quatre fois sur ~7 min 30 puis abandonnait en effaçant l'anti-doublon, avec un
// commentaire promettant qu'« un tick ultérieur pourra réessayer ». C'était faux : ce n'est pas
// l'anti-doublon qui bloquait, c'est l'absence d'arête. Prev et cur disaient tous deux « tombé », donc
// plus aucune décision, donc silence DÉFINITIF. Les bots pouvaient rester morts cinq jours — le constat
// qui avait motivé la fonctionnalité.
//
// On rejoue donc la machine à états tick par tick. La DÉCISION vient du vrai `decideAlert` (logic.js),
// pas d'une copie ; seule l'orchestration est répliquée, et un test d'ancrage vérifie qu'elle
// correspond bien à celle de main.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { decideAlert } = require('../logic');

const ALERT_DEDUP_MS = 30 * 60 * 1000;
const ALERT_RETRY_MS = [30 * 1000, 2 * 60 * 1000, 5 * 60 * 1000];

// Orchestration : le tick (transitions) + drainAlerts (envois et réessais), en temps simulé.
// `avecCorrectif` = false reproduit l'arbre AVANT le correctif. Sans ce commutateur, le test passerait
// aussi sur le code défaillant et ne prouverait rien.
const simuler = ({ avecCorrectif, dureeMin, webhookOk = () => false, statutAu = () => 'errored' }) => {
  const lastAlertAt = new Map();
  const rejouerArete = new Map();
  let prevStatus = new Map();
  let amorce = false;
  const enAttente = [];        // file d'alertes : { cle, essais, prochainEssaiA }
  const tentatives = [];       // horodatage de chaque envoi RÉELLEMENT tenté
  const partis = [];           // horodatage de chaque envoi réussi

  for (let now = 0; now <= dureeMin * 60 * 1000; now += 10 * 1000) {
    // --- drainAlerts : envois dus ---
    for (let i = enAttente.length - 1; i >= 0; i--) {
      const a = enAttente[i];
      if (now < a.prochainEssaiA) continue;
      tentatives.push(now);
      if (webhookOk(now)) { partis.push(now); enAttente.splice(i, 1); continue; }
      const attente = ALERT_RETRY_MS[a.essais];
      if (attente === undefined) {
        enAttente.splice(i, 1);
        lastAlertAt.delete(a.cle);
        if (avecCorrectif) rejouerArete.set(a.cle, now + ALERT_DEDUP_MS);
        continue;
      }
      a.essais++;
      a.prochainEssaiA = now + attente;
    }

    // --- tick : photo + transitions ---
    const cur = { status: statutAu(now), restarts: 0 };
    const suivant = new Map([['bot', cur]]);
    if (!amorce) { prevStatus = new Map([['bot', { status: 'online', restarts: 0 }]]); amorce = true; continue; }
    const prev = prevStatus;
    if (avecCorrectif) {
      for (const [nom, quand] of rejouerArete) {
        if (now < quand) continue;
        const c = suivant.get(nom);
        if (!c) continue;
        rejouerArete.delete(nom);
        if (c.status === 'online') continue;
        prev.set(nom, { status: 'online', restarts: c.restarts });
      }
    }
    const d = decideAlert(prev.get('bot'), cur, {
      name: 'bot', stoppedByGame: [], manualStop: false, hadAlert: lastAlertAt.has('bot'), transientTicks: 0,
    });
    if (d.alert === 'down' || d.alert === 'looping') {
      if (now - (lastAlertAt.get('bot') || 0) >= ALERT_DEDUP_MS || !lastAlertAt.has('bot')) {
        lastAlertAt.set('bot', now);
        enAttente.push({ cle: 'bot', essais: 0, prochainEssaiA: now });
      }
    } else if (d.alert === 'recovered') lastAlertAt.delete('bot');
    prevStatus = suivant;
  }
  // Une « campagne » = un premier envoi (essais à 0) ; les réessais n'en sont pas de nouvelles.
  const campagnes = tentatives.filter((t, i) => i === 0 || t - tentatives[i - 1] > 20 * 60 * 1000);
  return { tentatives, campagnes, partis };
};

test('alerte abandonnée : AVANT, le bot restait muet pour toujours (contre-épreuve)', () => {
  // Cette assertion décrit le DÉFAUT. Elle doit rester verte : c'est elle qui prouve que le test
  // ci-dessous mesure bien quelque chose, et non une propriété que l'ancien code avait déjà.
  const r = simuler({ avecCorrectif: false, dureeMin: 120 });
  assert.equal(r.campagnes.length, 1, 'une seule campagne en deux heures : après l\'abandon, plus rien');
  assert.equal(r.partis.length, 0);
});

test('alerte abandonnée : elle est RÉÉMISE tant que le bot est à terre', () => {
  const r = simuler({ avecCorrectif: true, dureeMin: 120 });
  assert.ok(r.campagnes.length >= 4,
    `le bot est tombé il y a deux heures et le panel doit continuer à le dire (campagnes : ${r.campagnes.length})`);
});

test('alerte abandonnée : au plus une campagne par fenêtre d\'anti-doublon (pas de volée)', () => {
  // Un webhook durablement cassé ne doit pas déclencher une notification toutes les sept minutes.
  const r = simuler({ avecCorrectif: true, dureeMin: 120 });
  for (let i = 1; i < r.campagnes.length; i++) {
    assert.ok(r.campagnes[i] - r.campagnes[i - 1] >= ALERT_DEDUP_MS,
      `deux campagnes à ${Math.round((r.campagnes[i] - r.campagnes[i - 1]) / 60000)} min d'écart : trop rapproché`);
  }
  assert.ok(r.campagnes.length <= 5, `${r.campagnes.length} campagnes en 2 h : c'est du harcèlement`);
});

test('alerte abandonnée : le réseau revient → l\'alerte part enfin, et UNE seule fois', () => {
  const r = simuler({ avecCorrectif: true, dureeMin: 120, webhookOk: (now) => now >= 45 * 60 * 1000 });
  assert.equal(r.partis.length, 1, 'une alerte envoyée, pas une rafale de rattrapage');
  assert.ok(r.partis[0] >= 45 * 60 * 1000 && r.partis[0] <= 80 * 60 * 1000,
    `partie à ${Math.round(r.partis[0] / 60000)} min : attendu peu après le retour du réseau`);
});

test('alerte abandonnée : le bot revient en ligne → aucune alerte périmée', () => {
  // Le rejeu ne doit pas ressusciter une chute déjà terminée : on dirait « X est tombé » d'un bot
  // qui tourne, ce qui est pire que le silence (on perd confiance dans toutes les alertes).
  const r = simuler({
    avecCorrectif: true, dureeMin: 120,
    statutAu: (now) => (now >= 20 * 60 * 1000 ? 'online' : 'errored'),
  });
  assert.equal(r.campagnes.length, 1, 'une seule campagne : celle de la vraie chute');
});

test('alerte abandonnée : main.js applique bien cette règle (et pas une variante)', () => {
  // Ce fichier RÉPLIQUE l'orchestration de main.js. Sans cet ancrage, les deux pourraient diverger et
  // les scénarios ci-dessus ne prouveraient plus rien du vrai panel.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /if \(a\.cle\) \{ lastAlertAt\.delete\(a\.cle\); rejouerArete\.set\(a\.cle, Date\.now\(\) \+ ALERT_DEDUP_MS\); \}/,
    'l\'abandon doit ARMER le rejeu, pas seulement oublier l\'anti-doublon');
  assert.match(src, /prev\.set\(nom, \{ status: 'online', restarts: c\.restarts \}\)/,
    'le rejeu doit reconstruire l\'arête en remettant l\'instantané précédent à « en ligne »');
  assert.match(src, /if \(c\.status === 'online'\) continue;/,
    'un bot revenu en ligne ne doit pas déclencher d\'alerte périmée');
  // …et le rejeu doit être DANS le tick, avant applyTransitions : ailleurs il ne servirait à rien.
  const i = src.indexOf('for (const [nom, quand] of rejouerArete)');
  const j = src.indexOf('applyTransitions(statusCache.bots, prev)');
  assert.ok(i > 0 && j > i, 'le rejeu doit précéder applyTransitions dans le tick');
});

// ---------------------------------------------------------------------------------------------
// La FILE PLEINE : l'autre porte par laquelle une alerte disparaissait définitivement.
//
// `queueAlert` refusait d'empiler au-delà de 20 entrées, avec un simple `return`. Or l'appelant a
// déjà posé `lastAlertAt` et consommé la transition AVANT d'arriver là : le bot n'était signalé
// nulle part, ni sur le moment ni plus tard. Et la file se remplit précisément pendant une panne
// large — réseau coupé, tous les bots tombent ensemble, chaque webhook expire en 10 s — donc au seul
// moment qui compte.
const CAPACITE = 20;

// Modèle minimal : la file est SATURÉE par d'autres alertes, et notre bot tombe à ce moment-là.
const chuteFilePleine = (avecCorrectif) => {
  const lastAlertAt = new Map();
  const rejouerArete = new Map();
  let file = CAPACITE;            // saturée par d'autres bots
  let prev = 'online';
  const campagnes = [];

  for (let now = 0; now <= 120 * 60 * 1000; now += 10 * 1000) {
    if (now === 30 * 60 * 1000) file = 0;   // la file se vide enfin (le réseau est revenu)

    // tick : rejeu éventuel de l'arête
    if (avecCorrectif) {
      for (const [n, quand] of rejouerArete) {
        if (now < quand) continue;
        rejouerArete.delete(n);
        prev = 'online';                     // l'arête est reconstruite
      }
    }
    const cur = 'errored';
    if (prev === 'online') {                 // transition détectée
      if (now - (lastAlertAt.get('bot') || 0) >= 30 * 60 * 1000 || !lastAlertAt.has('bot')) {
        lastAlertAt.set('bot', now);         // l'appelant pose l'anti-doublon AVANT d'empiler
        if (file >= CAPACITE) {
          // C'est ICI que tout se joue.
          if (avecCorrectif) { lastAlertAt.delete('bot'); rejouerArete.set('bot', now + 30 * 60 * 1000); }
        } else { file++; campagnes.push(now); }
      }
    }
    prev = cur;
  }
  return campagnes;
};

test('file pleine : AVANT, la chute n\'était signalée NULLE PART (contre-épreuve)', () => {
  assert.deepEqual(chuteFilePleine(false), [],
    'aucune alerte en deux heures, alors que le bot est tombé et que la file s\'est vidée depuis');
});

test('file pleine : la chute est signalée dès que la file se dégage', () => {
  const c = chuteFilePleine(true);
  assert.ok(c.length >= 1, 'la chute doit finir par être annoncée');
  assert.ok(c[0] >= 30 * 60 * 1000, `annoncée à ${Math.round(c[0] / 60000)} min, soit après le dégagement`);
});

test('file pleine : main.js diffère au lieu de perdre (et le dit)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /const ALERT_QUEUE_MAX = 20;/);
  assert.match(src, /if \(cle\) \{ lastAlertAt\.delete\(cle\); rejouerArete\.set\(cle, Date\.now\(\) \+ ALERT_DEDUP_MS\); \}/,
    'une alerte refusée par la file doit redevenir rejouable');
  // `\\?` : dans la SOURCE l'apostrophe est échappée (`d\'alertes`). Chercher la chaîne telle qu'elle
  // s'AFFICHE ne la trouve pas — un motif de source s'écrit sur le texte écrit, pas sur le texte rendu.
  assert.match(src, /file d\\?'alertes pleine/, 'un rejet muet est un rejet qu\'on ne corrigera jamais');
  // …et le refus ne doit PAS rester un `return` nu.
  assert.doesNotMatch(src, /if \(alertQueue\.length >= 20\) return;/);
});
