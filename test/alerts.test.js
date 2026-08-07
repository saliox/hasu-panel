// Tests de la logique de décision des alertes et du suivi des arrêts volontaires.
//
// Ces règles ont déjà produit deux bugs réels :
//   1. le cycle de vie de `manualStop` était enfermé dans checkAlerts, derrière trois sorties
//      anticipées → couper les alertes (réglage cosmétique) bloquait `manualStop` à true pour
//      toujours, et le bot n'était plus jamais rallumé au démarrage ;
//   2. sans distinction arrêt volontaire / plantage, chaque `pm2 stop` tapé au terminal déclenchait
//      une fausse alerte « bot tombé ».
// Les tests ci-dessous figent la table de décision pour que ça ne puisse pas revenir.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isDeliberateStop, decideAlert } = require('../logic');

const on = (restarts = 0) => ({ status: 'online', restarts });
const stopped = (restarts = 0) => ({ status: 'stopped', restarts });
const errored = (restarts = 0) => ({ status: 'errored', restarts });

test('isDeliberateStop : un `pm2 stop` propre est reconnu comme volontaire', () => {
  // Arrêt propre = statut stopped ET compteur de redémarrages INCHANGÉ.
  assert.equal(isDeliberateStop(on(3), stopped(3)), true);
  assert.equal(isDeliberateStop(on(0), stopped(0)), true);
});

test('isDeliberateStop : un plantage n\'est PAS volontaire', () => {
  assert.equal(isDeliberateStop(on(3), stopped(4)), false, 'pm2 a relancé avant d\'abandonner');
  assert.equal(isDeliberateStop(on(3), errored(3)), false, 'statut errored = plantage');
  assert.equal(isDeliberateStop(stopped(3), stopped(3)), false, 'déjà arrêté avant : pas une transition');
  assert.equal(isDeliberateStop(on(3), on(3)), false, 'toujours en ligne');
});

test('decideAlert : arrêt volontaire au terminal → silence + marquage', () => {
  const d = decideAlert(on(3), stopped(3), { stoppedByGame: [], manualStop: false });
  assert.equal(d.alert, null, 'aucune alerte pour un arrêt que l\'utilisateur a fait lui-même');
  assert.equal(d.setManualStop, true, 'mémorisé pour ne pas le ressusciter au démarrage');
});

test('decideAlert : vrai plantage → alerte', () => {
  const crash = decideAlert(on(3), stopped(4), { stoppedByGame: [], manualStop: false });
  assert.equal(crash.alert, 'down');
  assert.equal(crash.setManualStop, false, 'un plantage ne doit JAMAIS marquer un arrêt volontaire');

  const err = decideAlert(on(3), errored(3), { stoppedByGame: [], manualStop: false });
  assert.equal(err.alert, 'down');
});

test('decideAlert : boucle de redémarrage → alerte dédiée', () => {
  // > prev.restarts + 2 = le bot repart en boucle
  assert.equal(decideAlert(on(3), on(9), { stoppedByGame: [], manualStop: false }).alert, 'looping');
  assert.equal(decideAlert(on(3), on(5), { stoppedByGame: [], manualStop: false }).alert, null, 'seuil non franchi');
});

test('decideAlert : retour en ligne → alerte verte + drapeau levé', () => {
  const d = decideAlert(stopped(3), on(3), { stoppedByGame: [], manualStop: true, hadAlert: true });
  assert.equal(d.alert, 'recovered');
  assert.equal(d.clearManualStop, true, 'relancé (d\'où qu\'il vienne) → il n\'est plus « arrêté à la main »');
});

test('decideAlert : retour en ligne sans alerte ouverte → pas de notification, mais drapeau levé', () => {
  const d = decideAlert(stopped(3), on(3), { stoppedByGame: [], manualStop: true, hadAlert: false });
  assert.equal(d.alert, null, 'on n\'annonce pas un retour si on n\'avait jamais signalé la chute');
  assert.equal(d.clearManualStop, true, 'le drapeau doit quand même être levé — sinon plus d\'auto-démarrage');
});

test('decideAlert : silence quand c\'est le mode jeu qui a coupé le bot', () => {
  const d = decideAlert(on(3), stopped(3), { stoppedByGame: ['saliox'], manualStop: false, name: 'saliox' });
  assert.equal(d.alert, null);
  assert.equal(d.setManualStop, false, 'coupé par le jeu ≠ arrêté par l\'utilisateur (il doit revenir après la partie)');
});

test('decideAlert : silence pour un bot déjà marqué arrêté à la main', () => {
  assert.equal(decideAlert(on(3), stopped(3), { stoppedByGame: [], manualStop: true }).alert, null);
});

test('decideAlert : aucun changement → rien', () => {
  assert.equal(decideAlert(on(3), on(3), { stoppedByGame: [], manualStop: false }).alert, null);
  assert.equal(decideAlert(stopped(3), stopped(3), { stoppedByGame: [], manualStop: false }).alert, null);
});
