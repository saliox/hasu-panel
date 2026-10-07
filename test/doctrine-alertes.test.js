// À QUI l'interrupteur « Alertes » s'applique-t-il ?
//
// L'écran promet : « Me prévenir quand un bot TOMBE ou REDÉMARRE EN BOUCLE ». Il n'existait aucune
// règle dans le code : sur 13 émetteurs, 8 n'avaient AUCUNE garde, dans les deux familles à la fois.
// Décocher l'interrupteur laissait quand même passer « 🔧 relancé automatiquement », « ⛔ ne repart
// pas » et « ⚠️ bots non relancés après la partie » — alors que leurs jumeaux « ✅ est de retour » et
// « ⚠️ est tombé », qui annoncent la même chose, étaient bien gardés.
//
// Pire, un commentaire affirmait qu'un certain site était « le seul émetteur qui ignorait
// l'interrupteur ». C'était faux, et cette prémisse avait fait garder un site de la famille PANEL
// (« deux installations ») pendant que trois sites de la famille BOT restaient libres.
//
// La règle est désormais : famille BOT → `alerteBot` ; famille PANEL → `queueAlert` direct.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const brut = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

// ⚠️ On juge le CODE, pas les commentaires. Le recensement qui a servi à écrire ce test a d'abord
// « trouvé » une garde dans la phrase qui RACONTE la garde retirée. Un relevé de source qui lit ses
// propres commentaires se donne raison tout seul.
const code = brut.split(/\r?\n/).map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');

test('doctrine : le code dépouillé ne contient plus de commentaires (témoin)', () => {
  // Sans ce témoin, un dépouillage cassé rendrait toutes les assertions ci-dessous vides de sens.
  assert.ok(code.length > 50_000, 'dépouillage suspect : il ne reste presque rien');
  assert.equal(/\/\/ Photo de l'état des bots/.test(code), false, 'un commentaire a survécu au dépouillage');
  assert.match(code, /const alerteBot = /, 'le code, lui, est toujours là');
});

test('doctrine : les alertes qui parlent d\'un BOT passent par alerteBot', () => {
  for (const motif of [
    /alerteBot\(`🔧 \$\{b\.name\} relancé automatiquement/,
    /alerteBot\(`⛔ \$\{b\.name\} ne repart pas/,
    /alerteBot\('⚠️ Bots non relancés après la partie'/,
  ]) assert.match(code, motif, `cet émetteur doit obéir à « me prévenir quand un bot tombe » : ${motif}`);
});

test('doctrine : alerteBot applique bien l\'interrupteur', () => {
  const i = code.indexOf('const alerteBot = ');
  const corps = code.slice(i, code.indexOf('};', i));
  assert.match(corps, /if \(cfg\.alerts === false\) return;/);
  assert.match(corps, /queueAlert\(titre, corps, couleur, cle\)/);
  // …et PAS les fenêtres de silence : ces alertes reposent sur un fait mesuré et ne sont jamais
  // rejouées. Les taire pendant 90 s au démarrage reviendrait à les perdre, pas à les différer.
  assert.doesNotMatch(corps, /quietUntil|ALERT_QUIET_BOOT_MS/,
    'une alerte non rejouable ne doit pas être silencieusement jetée');
});

test('doctrine : une panne DU PANEL n\'est pas cachée par l\'interrupteur des bots', () => {
  // « Deux installations qui se mettent à jour chacune de leur côté » est une panne du panel. Elle
  // était taillée par `cfg.alerts === false`, sur la foi d'un commentaire faux. Sa vraie protection
  // contre le spam — une alerte par signature de chemin — reste, elle, en place.
  const i = code.indexOf('secondeInstall = autres[0]');
  assert.ok(i > 0, 'site « deux installations » introuvable');
  const bloc = code.slice(i, i + 900);
  assert.doesNotMatch(bloc, /if \(cfg\.alerts === false\) return;/,
    'une panne du panel ne doit pas disparaître parce qu\'on a décoché les alertes de bots');
  assert.match(bloc, /dualWarnedFor/, 'la mémoire anti-spam, elle, doit rester');
});

test('doctrine : aucun émetteur de la famille BOT n\'est reparti en direct (contre-épreuve)', () => {
  // Le vrai risque n'est pas celui d'aujourd'hui, c'est le PROCHAIN émetteur ajouté sans y penser.
  // On relève les appels DIRECTS à queueAlert dont le titre nomme un bot (`${b.name}`).
  //
  // `notifyAllowed` est accepté comme équivalent : c'est une garde PLUS STRICTE (elle contient
  // `cfg.alerts !== false` et y ajoute les fenêtres de silence). Elle est à sa place sur les alertes
  // de TRANSITION, et seulement là : quand elle refuse, l'appelant RETIENT l'arête (`held`), donc
  // l'alerte est différée, pas perdue. Les alertes passées par `alerteBot`, elles, ne sont jamais
  // rejouées — d'où l'absence volontaire de fenêtre de silence dans le juge.
  const lignes = code.split('\n');
  const fautifs = [];
  for (const m of code.matchAll(/queueAlert\(\s*`[^`]*\$\{b\.name\}/g)) {
    const i = code.slice(0, m.index).split('\n').length - 1;
    if (!/\bnotifyAllowed\b/.test(lignes[i])) fautifs.push(`ligne ${i + 1} : ${lignes[i].trim().slice(0, 70)}`);
  }
  assert.deepEqual(fautifs, [],
    'une alerte nommant un bot doit passer par alerteBot (ou être gardée par notifyAllowed)');
});

test('doctrine : le relevé ci-dessus voit vraiment quelque chose (témoin)', () => {
  // Une assertion « la liste est vide » passe aussi quand le motif ne trouve RIEN. On vérifie donc
  // que le motif attrape bien le site légitime connu, celui qui est gardé par notifyAllowed.
  const trouves = [...code.matchAll(/queueAlert\(\s*`[^`]*\$\{b\.name\}/g)];
  assert.equal(trouves.length, 1, 'le motif doit encore reconnaître « ✅ est de retour »');
});
