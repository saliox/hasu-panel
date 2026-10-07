// Mode jeu : à QUI appartient le verdict « partie en ligne ».
//
// POURQUOI CE FICHIER : `sessionOnline` dit « le jeu détecté a une vraie connexion Internet », et c'est
// lui qui autorise le mode jeu à couper les bots. Mais rien ne le rattachait au jeu qui l'avait obtenu.
// Quitter un jeu EN LIGNE puis lancer un jeu SOLO dans la fenêtre de grâce (60 s par défaut, réglable
// jusqu'à une heure) laissait le verdict collé à vrai : la sonde était sautée — sa condition est
// `gameRunning && !sessionOnline` — et les bots restaient coupés TOUTE la session solo, alors que
// « ignorer les jeux solo » était coché.
//
// Les deux remises à zéro existantes étaient hors d'atteinte dans ce scénario : l'une n'agit que si le
// scan de process est SAUTÉ (il ne l'est jamais quand le mode jeu est actif, `needProcScan` le force),
// l'autre exige que la grâce soit écoulée — c'est précisément ce que le scénario contourne.
//
// La règle est une machine à états : on la rejoue ici tick par tick, et un test d'ancrage vérifie que
// main.js applique bien CETTE règle et pas une variante.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Réplique fidèle des trois lignes de main.js. L'ancrage plus bas garantit qu'elles ne divergent pas.
const faireMoteur = ({ soloSkip = true, graceSec = 60, sonde }) => {
  let sessionOnline = false, sessionOnlineFor = '';
  let lastGameAt = 0;
  const tick = (now, hit) => {
    const gameRunning = !!hit;
    if (hit) lastGameAt = now;
    const graceOver = (now - lastGameAt) > graceSec * 1000;
    if (gameRunning && hit !== sessionOnlineFor) { sessionOnline = false; sessionOnlineFor = ''; }
    if (gameRunning && !sessionOnline) {
      sessionOnline = soloSkip === false ? true : sonde(hit);
      if (sessionOnline) sessionOnlineFor = hit;
    } else if (!gameRunning && graceOver) { sessionOnline = false; sessionOnlineFor = ''; }
    return { coupe: gameRunning && sessionOnline, sessionOnline, sessionOnlineFor };
  };
  return { tick };
};

const EN_LIGNE = 'VALORANT-Win64-Shipping.exe';
const SOLO = 'Cyberpunk2077.exe';
const sondeReelle = (jeu) => jeu === EN_LIGNE; // seul le jeu en ligne a une connexion publique

test('mode jeu : un jeu SOLO lancé juste après un jeu en ligne ne coupe PAS les bots', () => {
  const m = faireMoteur({ sonde: sondeReelle });
  const t0 = 1_000_000;
  assert.equal(m.tick(t0, EN_LIGNE).coupe, true, 'témoin : le jeu en ligne coupe bien');
  // On quitte. On reste DANS la grâce (10 s < 60 s) : l'ancien code gardait le verdict.
  assert.equal(m.tick(t0 + 10_000, null).coupe, false);
  // …et on lance un jeu SOLO dans cette fenêtre. C'est LE cas qui coupait les bots à tort.
  const r = m.tick(t0 + 20_000, SOLO);
  assert.equal(r.coupe, false, 'un jeu solo ne doit rien couper quand « ignorer les jeux solo » est actif');
  assert.equal(r.sessionOnline, false);
  // …et ça tient tick après tick, pas seulement au premier.
  assert.equal(m.tick(t0 + 30_000, SOLO).coupe, false);
  assert.equal(m.tick(t0 + 600_000, SOLO).coupe, false, 'dix minutes plus tard, toujours pas coupé');
});

test('mode jeu : le verdict « en ligne » se re-gagne quand le MÊME jeu passe en ligne', () => {
  // GTA lancé en solo puis passé en multijoueur : la sonde est rejouée tant que le verdict est faux.
  let enLigne = false;
  const m = faireMoteur({ sonde: () => enLigne });
  const t0 = 2_000_000;
  assert.equal(m.tick(t0, 'GTA5.exe').coupe, false, 'histoire solo : rien coupé');
  enLigne = true;
  assert.equal(m.tick(t0 + 10_000, 'GTA5.exe').coupe, true, 'passage en ligne : les bots sont coupés');
});

test('mode jeu : repasser au jeu EN LIGNE après un solo coupe de nouveau', () => {
  // La remise à zéro ne doit pas être un blocage définitif.
  const m = faireMoteur({ sonde: sondeReelle });
  const t0 = 3_000_000;
  m.tick(t0, EN_LIGNE);
  m.tick(t0 + 10_000, SOLO);
  assert.equal(m.tick(t0 + 20_000, EN_LIGNE).coupe, true);
});

test('mode jeu : « ignorer les jeux solo » décoché → tout jeu coupe, y compris après changement', () => {
  const m = faireMoteur({ soloSkip: false, sonde: () => { throw new Error('la sonde ne doit pas être appelée'); } });
  const t0 = 4_000_000;
  assert.equal(m.tick(t0, EN_LIGNE).coupe, true);
  assert.equal(m.tick(t0 + 10_000, SOLO).coupe, true, 'changement de jeu : toujours coupé, sans sonder');
});

test('mode jeu : grâce écoulée sans jeu → le verdict est oublié', () => {
  const m = faireMoteur({ sonde: sondeReelle });
  const t0 = 5_000_000;
  m.tick(t0, EN_LIGNE);
  const r = m.tick(t0 + 61_000, null); // au-delà des 60 s
  assert.equal(r.sessionOnline, false);
  assert.equal(r.sessionOnlineFor, '');
});

test('mode jeu : main.js applique bien cette règle (et pas une variante)', () => {
  // Ce fichier RÉPLIQUE la logique de main.js : sans cet ancrage, les deux pourraient diverger et les
  // scénarios ci-dessus ne prouveraient plus rien du vrai panel.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /if \(gameRunning && hit !== sessionOnlineFor\) \{ sessionOnline = false; sessionOnlineFor = ''; \}/,
    'le verdict doit être invalidé dès que le jeu change');
  assert.match(src, /if \(sessionOnline\) sessionOnlineFor = hit;/,
    'le verdict doit retenir à QUEL jeu il appartient');
  assert.match(src, /\} else if \(!gameRunning && graceOver\) \{ sessionOnline = false; sessionOnlineFor = ''; \}/);
  // …et la remise à zéro du scan sauté doit effacer les DEUX, sinon le lien survit au verdict.
  assert.match(src, /sessionOnline = false; sessionOnlineFor = ''; statusCache\.online = false;/);
});
