// Lancement au démarrage de Windows et installations multiples.
//
// POURQUOI CE FICHIER : sur la machine de développement, TROIS lanceurs démarraient le panel pour une
// seule application — deux valeurs dans la clé Run et une tâche planifiée orpheline. L'interrupteur
// « Lancer au démarrage » n'en pilotait qu'une : le désactiver ne désactivait rien, et le panel se
// relançait quand même. La cause : on laissait Electron nommer notre valeur, et ce nom a dérivé deux
// fois (AppUserModelId, puis app.getName()). Le panel impose désormais un nom constant.
//
// Ces tests figent DEUX invariants qui ont chacun déjà été violés :
//   1. on ne supprime jamais l'entrée de démarrage d'un AUTRE logiciel — la clé Run est partagée ;
//   2. on ne laisse jamais zéro lanceur alors que l'interrupteur dit « activé ».
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseRegQuery, parseStartupApproved, planLanceurs, LOGIN_ITEM, autresInstallations } = require('../logic');

// Sortie réelle de `reg query HKCU\…\Run` relevée sur la machine (chemins raccourcis).
const EXE = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
const ligne = (nom, data) => `    ${nom}    REG_SZ    ${data}`;
const SORTIE = [
  '',
  'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
  ligne('electron.app.HasuPanel', `${EXE} --hidden --startup`),
  ligne('com.saliox.hasupanel', `${EXE} --hidden --startup`),
  ligne('Discord', '"C:\\Users\\moi\\AppData\\Local\\Discord\\Update.exe" --processStart Discord.exe'),
  ligne('Steam', '"C:\\Program Files (x86)\\Steam\\steam.exe" -silent'),
  '',
].join('\n');
const A_JOUR = [SORTIE, ligne(LOGIN_ITEM, `"${EXE}" --hidden --startup`)].join('\n');
const SEULEMENT_NOUS = ['', ligne(LOGIN_ITEM, `"${EXE}" --hidden --startup`), ''].join('\n');
const RIEN_A_NOUS = ['', ligne('Discord', 'C:\\Discord\\Update.exe'), ''].join('\n');

test('parseRegQuery : lit nom et données, y compris avec espaces et guillemets', () => {
  const v = parseRegQuery(SORTIE);
  assert.equal(v.length, 4, 'les 4 valeurs doivent être lues (l\'en-tête de clé n\'en est pas une)');
  assert.deepEqual(v.map((x) => x.nom), ['electron.app.HasuPanel', 'com.saliox.hasupanel', 'Discord', 'Steam']);
  assert.ok(v[3].data.includes('Program Files (x86)'), 'un chemin avec espaces reste entier');
});

test('parseRegQuery : entrée vide ou illisible ne plante pas', () => {
  for (const bad of ['', null, undefined, 'ERREUR : accès refusé']) assert.deepEqual(parseRegQuery(bad), []);
});

// ---------- parseStartupApproved ----------
test('parseStartupApproved : octet pair = actif, impair = désactivé', () => {
  const out = [
    ligne('HasuPanel', '0200000000000000000000000000000000000000000000000000000000000000'), // REG_BINARY
    ligne('Steam', '030000000000000000000000'),
    ligne('Discord', '06000000'),
    ligne('Autre', '07000000'),
  ].join('\n');
  const m = parseStartupApproved(out);
  assert.equal(m.get('HasuPanel'), true);
  assert.equal(m.get('Steam'), false);
  assert.equal(m.get('Discord'), true);
  assert.equal(m.get('Autre'), false);
});

test('parseStartupApproved : données illisibles → on suppose actif (jamais de faux « désactivé »)', () => {
  // Se tromper dans ce sens ne fait que laisser le démarrage tel quel. Se tromper dans l'autre
  // couperait le démarrage automatique de quelqu'un qui ne l'a jamais demandé.
  const m = parseStartupApproved([ligne('X', 'zz'), ligne('Y', ' ')].join('\n'));
  assert.equal(m.get('X'), true);
  assert.equal(m.get('Y'), true);
  assert.deepEqual([...parseStartupApproved('').keys()], []);
});

// ---------- planLanceurs ----------
test('planLanceurs : migration — on écrit la nôtre AVANT de purger les anciennes', () => {
  // Cas exact de la machine : les deux entrées présentes sont des orphelines, aucune n'est la nôtre.
  const p = planLanceurs({ runOut: SORTIE, exe: EXE, autoLaunch: true, autoLaunchInit: true });
  assert.equal(p.ecrire, true, 'sans ça, la purge laissait le PC sans aucun lanceur');
  assert.deepEqual(p.supprimer, ['electron.app.HasuPanel', 'com.saliox.hasupanel']);
  assert.equal(p.autoLaunch, true);
  assert.equal(p.nom, LOGIN_ITEM);
});

test('planLanceurs : ne touche JAMAIS au démarrage des autres logiciels', () => {
  // La clé Run est partagée : une purge trop large casserait le démarrage de Discord ou de Steam.
  const p = planLanceurs({ runOut: SORTIE, exe: EXE, autoLaunch: true });
  assert.equal(p.supprimer.includes('Discord'), false);
  assert.equal(p.supprimer.includes('Steam'), false);
});

test('planLanceurs : sans chemin d\'exécutable, on ne supprime RIEN', () => {
  // Une cible vide rendrait `includes('')` vrai pour TOUTE entrée : on effacerait tout le démarrage
  // de la session. C'est la garde la plus importante du fichier.
  for (const bad of ['', null, undefined]) {
    const p = planLanceurs({ runOut: SORTIE, exe: bad, autoLaunch: true });
    assert.deepEqual(p.supprimer, []);
  }
  assert.deepEqual(planLanceurs().supprimer, []);
});

test('planLanceurs : régime établi — rien à faire', () => {
  const p = planLanceurs({ runOut: SEULEMENT_NOUS, exe: EXE, autoLaunch: true });
  // Comparaison STRICTE de tout l'objet : c'est elle qui signale un champ ajouté sans être pensé
  // pour ce cas — le plan pilote des écritures registre, aucun champ ne doit y apparaître par accident.
  assert.deepEqual(p, { ecrire: false, supprimer: [], drapeauxMorts: [], autoLaunch: true, nom: LOGIN_ITEM });
});

test('planLanceurs : notre entrée existe → l\'écran dit « activé », même si la config dit non', () => {
  // Une config restaurée depuis une sauvegarde peut mentir. Le registre, lui, décrit ce qui va
  // RÉELLEMENT se passer au prochain démarrage : c'est lui qui fait foi.
  const p = planLanceurs({ runOut: SEULEMENT_NOUS, exe: EXE, autoLaunch: false });
  assert.equal(p.autoLaunch, true);
  assert.equal(p.ecrire, false);
});

test('planLanceurs : purge des anciennes une fois la nôtre en place', () => {
  const p = planLanceurs({ runOut: A_JOUR, exe: EXE, autoLaunch: true });
  assert.equal(p.ecrire, false, 'elle est déjà là : ne pas réécrire à chaque démarrage');
  assert.deepEqual(p.supprimer, ['electron.app.HasuPanel', 'com.saliox.hasupanel']);
});

test('planLanceurs : désactivé à la main dans Gestionnaire des tâches → on respecte', () => {
  // Windows garde la valeur Run et pose un drapeau à côté, indexé sur le NOM. Recréer une entrée sous
  // un autre nom repartirait de zéro : elle serait active. C'est un contournement, pas une réparation.
  const approvedOut = ligne(LOGIN_ITEM, '030000000000000000000000');
  const p = planLanceurs({ runOut: SEULEMENT_NOUS, approvedOut, exe: EXE, autoLaunch: true });
  assert.equal(p.ecrire, false);
  assert.equal(p.autoLaunch, false, 'et l\'écran doit le montrer, sinon il ment');
});

test('planLanceurs : une seule des entrées désactivée ne suffit pas', () => {
  // Si une orpheline est désactivée mais que la nôtre est active, le panel démarre bel et bien.
  const approvedOut = ligne('com.saliox.hasupanel', '030000000000000000000000');
  const p = planLanceurs({ runOut: A_JOUR, approvedOut, exe: EXE, autoLaunch: true });
  assert.equal(p.autoLaunch, true);
  assert.deepEqual(p.supprimer, ['electron.app.HasuPanel', 'com.saliox.hasupanel']);
});

test('planLanceurs : entrée retirée de l\'extérieur → l\'écran suit, on ne la recrée pas', () => {
  const p = planLanceurs({ runOut: RIEN_A_NOUS, exe: EXE, autoLaunch: true, autoLaunchInit: true });
  assert.equal(p.autoLaunch, false);
  assert.equal(p.ecrire, false, 'la réimposer à chaque démarrage écraserait le choix de l\'utilisateur');
});

test('planLanceurs : tout premier lancement → on pose l\'entrée', () => {
  const p = planLanceurs({ runOut: RIEN_A_NOUS, exe: EXE, autoLaunch: true, autoLaunchInit: false });
  assert.equal(p.ecrire, true);
  assert.equal(p.autoLaunch, true);
});

test('planLanceurs : INSTALLATION NEUVE — le champ est absent, pas à false', () => {
  // RÉGRESSION RÉELLE, livrée puis rattrapée : `DEFAULTS` ne porte pas `autoLaunchInit`, donc au tout
  // premier lancement il vaut `undefined` — ce qui déclenche la valeur par défaut `= true` du
  // paramètre, et le plan conclut « entrée retirée volontairement ». Résultat : aucune entrée posée
  // sur une machine neuve, et l'interrupteur qui se coupe tout seul.
  //
  // Le test précédent ne l'attrapait pas : il force `autoLaunchInit: false`, une valeur que main.js
  // n'envoie jamais dans ce cas. 163 tests étaient verts avec le défaut dedans.
  const p = planLanceurs({ runOut: RIEN_A_NOUS, exe: EXE, autoLaunch: true });
  assert.equal(p.ecrire, false, 'valeur par défaut du paramètre : « déjà initialisé »');
  // …c'est pourquoi main.js doit passer `cfg.autoLaunchInit === true` et JAMAIS la valeur brute.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /autoLaunchInit: cfg\.autoLaunchInit === true/,
    'sans le `=== true`, un undefined vaut « déjà initialisé » et la machine neuve perd son démarrage auto');
  assert.equal(/autoLaunchInit: cfg\.autoLaunchInit(?! === true)/.test(src), false,
    'aucun passage de la valeur brute ne doit subsister');
});

test('planLanceurs : premier lancement avec démarrage refusé → on n\'écrit rien', () => {
  const p = planLanceurs({ runOut: RIEN_A_NOUS, exe: EXE, autoLaunch: false, autoLaunchInit: false });
  assert.equal(p.ecrire, false);
  assert.equal(p.autoLaunch, false);
});

test('planLanceurs : casse et guillemets ne masquent pas nos entrées', () => {
  // Windows ignore la casse et le chemin est tantôt entre guillemets, tantôt nu selon qui l'a écrit.
  const out = [ligne('vieux', `"${EXE.toUpperCase()}" --hidden`), ligne('autre', EXE.toLowerCase())].join('\n');
  const p = planLanceurs({ runOut: out, exe: EXE, autoLaunch: true });
  assert.deepEqual(p.supprimer, ['vieux', 'autre']);
});

// ---------- Drapeaux « désactivé » restés seuls ----------
// Constaté sur la machine : StartupApproved gardait `com.saliox.hasupanel` et `electron.app.HasuPanel`
// à 03 (désactivé) alors que leurs valeurs Run avaient disparu depuis longtemps. Un drapeau sans
// valeur ne fait rien, mais il reste AFFICHÉ dans Gestionnaire des tâches > Démarrage — exactement la
// confusion des « trois lanceurs » qu'on vient de supprimer.
test('planLanceurs : nettoie les drapeaux de NOS anciens noms restés sans valeur Run', () => {
  const approvedOut = [
    ligne('com.saliox.hasupanel', '030000009FEB3779C72FDD01'),
    ligne('electron.app.HasuPanel', '0300000078A2207BC72FDD01'),
    ligne('Steam', '030000005D8D0EE810F3DC01'),
  ].join('\n');
  const p = planLanceurs({ runOut: SEULEMENT_NOUS, approvedOut, exe: EXE, autoLaunch: true });
  assert.deepEqual(p.drapeauxMorts, ['electron.app.HasuPanel', 'com.saliox.hasupanel']);
  assert.equal(p.drapeauxMorts.includes('Steam'), false, 'JAMAIS le drapeau d\'un autre logiciel');
});

test('planLanceurs : un drapeau dont la valeur Run existe encore n\'est PAS touché', () => {
  // Il porte le choix de l'utilisateur (désactivé dans Gestionnaire des tâches) : l'effacer le
  // contournerait. On ne nettoie que ce qui ne sert plus à rien.
  const approvedOut = ligne('electron.app.HasuPanel', '030000000000000000000000');
  const p = planLanceurs({ runOut: A_JOUR, approvedOut, exe: EXE, autoLaunch: true });
  assert.deepEqual(p.drapeauxMorts, [], 'la valeur existe → le drapeau a encore un sens');
  assert.ok(p.supprimer.includes('electron.app.HasuPanel'), '…elle sera purgée, avec son drapeau');
});

test('planLanceurs : aucun drapeau à nettoyer quand il n\'y en a pas', () => {
  const p = planLanceurs({ runOut: SEULEMENT_NOUS, exe: EXE, autoLaunch: true });
  assert.deepEqual(p.drapeauxMorts, []);
});

test('le ménage des drapeaux ne tourne PAS sur une bascule de l\'interrupteur', () => {
  // Sur un « activer », le panel écrit le drapeau « autorisé » de son entrée juste avant : lancer le
  // ménage dans la foulée l'effacerait, et l'interrupteur redeviendrait décoratif. Le nettoyage est
  // donc réservé au démarrage, où aucune écriture ne le précède.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  const branche = src.slice(src.indexOf('? { nom: LOGIN_ITEM, ecrire: !!forcer'), src.indexOf(': planLanceurs({ runOut, approvedOut, exe, autoLaunch'));
  assert.equal(/drapeauxMorts/.test(branche), false, 'la branche « bascule » ne doit pas calculer de ménage');
});

// ---------- Deux installations ----------
test('autresInstallations : ne signale pas celle qui tourne', () => {
  const moi = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
  const autre = 'C:\\Program Files\\HasuPanel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations([moi], moi), []);
  assert.deepEqual(autresInstallations([moi, autre], moi), [autre]);
});

test('autresInstallations : casse et séparateurs ne créent pas de faux doublon', () => {
  // Windows accepte les deux séparateurs et ignore la casse : sans normalisation, l'installation qui
  // TOURNE serait signalée comme un doublon d'elle-même à chaque démarrage.
  const moi = 'C:\\Users\\moi\\AppData\\Local\\Programs\\hasu-panel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations(['C:/Users/moi/AppData/Local/Programs/hasu-panel/HasuPanel.exe'], moi), []);
  assert.deepEqual(autresInstallations([moi.toUpperCase()], moi), []);
  // …et un même chemin listé deux fois n'est signalé qu'une.
  const autre = 'D:\\Panel\\HasuPanel.exe';
  assert.deepEqual(autresInstallations([autre, autre.toLowerCase()], moi), [autre]);
});

test('autresInstallations : liste vide ou nulle', () => {
  assert.deepEqual(autresInstallations([], 'x'), []);
  assert.deepEqual(autresInstallations(null, 'x'), []);
  assert.deepEqual(autresInstallations([null, undefined, ''], 'x'), []);
});

// ---------- Invariants de code ----------
test('plus personne ne laisse Electron nommer l\'entrée de démarrage', () => {
  // C'est LA cause du bug d'origine : `setLoginItemSettings` nomme la valeur Run d'après une convention
  // interne d'Electron, qui a déjà changé deux fois. Chaque changement = un lanceur de plus, hors de
  // portée de l'interrupteur. Le panel écrit désormais sa valeur lui-même, sous un nom constant.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.equal(/setLoginItemSettings/.test(src), false, 'utiliser reg.exe avec LOGIN_ITEM à la place');
  assert.equal(/getLoginItemSettings/.test(src), false, 'l\'état se lit dans le registre, pas via Electron');
});

test('ce que le panel ÉCRIT dans StartupApproved, il le relit comme « activé »', () => {
  // Le lecteur et l'écrivain doivent rester d'accord : si la constante change et que le premier octet
  // devient impair, le panel poserait un drapeau « désactivé » en croyant activer le démarrage — et
  // l'interrupteur redeviendrait décoratif, exactement le bug d'origine.
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  const m = src.match(/const ACTIVE = '([0-9a-f]+)'/i);
  assert.ok(m, 'la constante ACTIVE doit rester le seul endroit qui décrit ce format');
  assert.equal(m[1].length, 24, '12 octets : 4 d\'état + 8 d\'horodatage, ce qu\'attend Windows');
  assert.equal(parseStartupApproved(ligne(LOGIN_ITEM, m[1])).get(LOGIN_ITEM), true);
});

test('l\'identité de désinstallation est figée (sinon : deux entrées dans Applications)', () => {
  // Sans GUID épinglé, electron-builder le dérive de appId + productName : le jour où l'un des deux
  // bouge, l'installeur écrit une NOUVELLE entrée de désinstallation au lieu de remplacer l'ancienne,
  // et le PC se retrouve avec deux panels installés. Cette valeur est celle déjà posée sur les machines.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.equal(pkg.build.nsis.guid, '281f63ab-643c-53f0-8742-2f555b7705f7');
  assert.equal(pkg.build.nsis.perMachine, false, 'per-user : une install par session, sans admin');
  assert.equal(pkg.build.nsis.allowToChangeInstallationDirectory, false, 'un seul dossier possible');
});

// ---------------------- Fermeture : les règles qui protègent les bots
// Un audit a montré qu'en quittant le panel PENDANT une bascule de mode jeu, la relance partait hors
// du verrou : des `pm2 start` pouvaient croiser les `pm2 stop` d'une coupure en cours, puis
// `cfg.stoppedByGame` — le seul enregistrement disque, écrit exprès AVANT la coupure pour survivre à
// une mort du panel — était effacé. Résultat possible : des bots éteints, sans trace.
// Ce chemin ne se teste pas en unitaire (Electron, pm2, minuteurs) ; on fige donc ses règles.
const mainSrc = () => fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

test('fermeture : la relance de fin de partie passe par le verrou de mode jeu', () => {
  const src = mainSrc();
  assert.match(src, /await withGameLock\(exitGameMode\) === true/,
    'appel direct = course avec un tick déjà en vol');
  // `undefined` veut dire « demande mise en attente », pas « réussi » : seul `true` autorise la suite.
  assert.equal(/relanceOk = await exitGameMode\(\)/.test(src), false);
});

test('fermeture : withGameLock rend la valeur de la fonction qu\'il protège', () => {
  // Sans ça, l'appelant ne peut pas savoir si les bots sont repartis, et autoriserait un `pm2 save`
  // qui graverait leur extinction dans le dump que pm2 restaure au démarrage du PC.
  assert.match(mainSrc(), /try \{ return await fn\(\); \} finally/);
});

test('fermeture : la boucle de sondage ne fait plus rien pendant l\'arrêt', () => {
  const src = mainSrc();
  const tick = src.slice(src.indexOf('const tick = async () => {'), src.indexOf('const tick = async () => {') + 700);
  assert.match(tick, /if \(quitting\) return;/, 'un tick pendant la fermeture relance une transition concurrente');
});

test('fermeture : pas de second nettoyage en parallèle sur un 2e clic « Quitter »', () => {
  assert.match(mainSrc(), /if \(quitEnCours\) \{ e\.preventDefault\(\); return; \}/);
});

test('fermeture : le compte à rebours démarre APRÈS l\'attente d\'apaisement', () => {
  // Armé avant, il en mangeait la moitié : le nettoyage se faisait couper en pleine relance.
  const src = mainSrc();
  const iAttente = src.indexOf('for (let i = 0; i < 30 && busy; i++)');
  const iDeadline = src.indexOf('deadline = setTimeout(');
  assert.ok(iAttente > 0 && iDeadline > iAttente, 'le minuteur doit être armé après la boucle d\'attente');
});

test('fermeture : le repli du tray reste le DERNIER recours', () => {
  // 6 s d'apaisement + 12 s de nettoyage = 18 s. Un repli à 15 s coupait le nettoyage au lieu de le
  // secourir. Il doit rester strictement au-dessus du budget complet.
  const src = mainSrc();
  const budget = Number(src.match(/QUIT_DEADLINE_MS = (\d+)/)[1]) + 30 * 200;
  const repli = Number(src.match(/Quitter : sortie forcee[\s\S]{0,80}?\}, (\d+)\)/)[1]);
  assert.ok(repli > budget, `repli ${repli} ms doit dépasser le budget de nettoyage ${budget} ms`);
});

test('MAJ : un redémarrage qui n\'arrive pas ne fige pas le panel', () => {
  // `quitAndInstall` ne lève pas en cas d'échec : sans chien de garde, `updateApplying` et `quitting`
  // restaient à true — plus aucune MAJ, et la fenêtre détruite au lieu d'être réduite dans le tray.
  const src = mainSrc();
  assert.match(src, /if \(!updateApplying\) return;\s*\r?\n\s*updateApplying = false; quitting = false;/);
});

// ---------------------- Mise à jour : un échec de contrôle ne doit pas coûter la journée
// MESURÉ sur le journal réel de la machine : 12 journées où le contrôle du démarrage a échoué
// (`net::ERR_INTERNET_DISCONNECTED` — le réseau n'est pas encore là 12 s après l'ouverture de
// session), et 11 sessions sur 11 d'une durée INFÉRIEURE à 6 h, médiane 10 minutes. Le réessai de
// croisière (6 h) n'était donc jamais atteint : chaque échec supprimait tout contrôle de la session.
test('MAJ : un contrôle raté est rattrapé bien avant la cadence de 6 h', () => {
  const src = mainSrc();
  const m = src.match(/const RATTRAPAGE_MS = \[([^\]]+)\]/);
  assert.ok(m, 'l\'échelle de rattrapage doit exister — sans elle, un échec au démarrage est définitif');
  // Les paliers sont écrits lisiblement (`2 * 60_000`) : on évalue les produits simples.
  const paliers = m[1].split(',').map((x) => {
    const t = x.replace(/_/g, '').trim();
    const p = t.match(/^(\d+)\s*\*\s*(\d+)$/);
    return p ? Number(p[1]) * Number(p[2]) : Number(t);
  }).filter((n) => Number.isFinite(n));

  assert.ok(paliers.length >= 3, `au moins 3 rattrapages (${paliers.length})`);
  // Le premier doit tomber DANS une session typique : la médiane mesurée est de 10 minutes.
  assert.ok(paliers[0] <= 60_000, `1er rattrapage à ${paliers[0]} ms — trop tard pour une session de 10 min`);
  // Croissants : réessayer toujours à la même cadence sur un réseau durablement absent serait du
  // martèlement inutile à chaque démarrage.
  for (let i = 1; i < paliers.length; i++) {
    assert.ok(paliers[i] > paliers[i - 1], `l'échelle doit croître (${paliers[i - 1]} → ${paliers[i]})`);
  }
  // …et BORNÉE : au-delà, on retombe sur la cadence de croisière au lieu de boucler.
  assert.match(src, /if \(essaisRates >= RATTRAPAGE_MS\.length\) return;/);
  // Un succès remet le compteur à zéro, sinon la deuxième panne de la journée n'aurait plus de filet.
  assert.match(src, /\.then\(\(\) => \{ essaisRates = 0; \}\)/);
  // Tous les paliers restent très en deçà des 6 h : sinon le rattrapage ne rattrape rien.
  assert.ok(Math.max(...paliers) < 6 * 3600_000 / 4, 'un palier dépasse le quart de la cadence de croisière');
});
