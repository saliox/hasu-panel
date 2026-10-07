// Démarrage : bootEnforce ne doit plus arrêter les bots UN PAR UN.
//
// POURQUOI : `stopTree(nom)` refait un `pm2 jlist` pour retrouver le PID du bot — alors que
// bootEnforce vient de lire la liste complète, PID compris — puis prend un instantané de tout l'arbre
// de process (~333 ms de PowerShell) et attend une grâce de 4 s. PAR BOT. Et surtout : si ce jlist
// interne échoue, le PID vaut 0, l'arbre est vide, et les enfants orphelins du bot ne sont PLUS reapés
// du tout — en silence. `stopBotsTree` prend les PID déjà connus : un instantané, une grâce, tout le lot.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

// « Ce code est-il DANS telle fonction ? » est une question de PORTÉE, pas de voisinage : une fenêtre
// de N lignes attrape le code d'à côté et rate le code éloigné. On délimite donc par les accolades.
const corpsDe = (nom) => {
  const debut = src.indexOf(`const ${nom} = async () => {`);
  assert.ok(debut > 0, `fonction ${nom} introuvable`);
  const ouvrante = src.indexOf('{', debut);
  let n = 0;
  for (let i = ouvrante; i < src.length; i++) {
    if (src[i] === '{') n++;
    else if (src[i] === '}' && --n === 0) return src.slice(ouvrante, i + 1);
  }
  throw new Error(`accolades non équilibrées dans ${nom}`);
};

test('bootEnforce : l\'extraction par portée fonctionne (témoin)', () => {
  // Sans ce témoin, un extracteur cassé renverrait du vide et TOUTES les assertions « n'appelle pas X »
  // ci-dessous passeraient pour la mauvaise raison.
  const corps = corpsDe('bootEnforce');
  assert.ok(corps.length > 500, `corps suspicieusement court (${corps.length} caractères)`);
  assert.match(corps, /pm2\(\['resurrect'\]\)/, 'le corps extrait doit bien contenir le code de bootEnforce');
});

test('bootEnforce : arrête les bots en UN lot, jamais un par un', () => {
  const corps = corpsDe('bootEnforce');
  assert.doesNotMatch(corps, /\bstopTree\(/,
    'stopTree refait un jlist + un instantané + 4 s de grâce PAR bot, et perd le reap si ce jlist échoue');
  assert.match(corps, /stopBotsTree\(aArreter\)/, 'les arrêts doivent passer par le lot');
  // …et avec les PID qu'on a DÉJÀ : c'est tout l'intérêt, le jlist interne ne peut plus échouer.
  assert.match(corps, /aArreter\.push\(\{ name: b\.name, pid: b\.pid \}\)/);
});

test('bootEnforce : les arrêts précèdent les démarrages', () => {
  const corps = corpsDe('bootEnforce');
  const stop = corps.indexOf('await stopBotsTree(aArreter)');
  const start = corps.indexOf("await pm2(['start', n])");
  assert.ok(stop > 0 && start > 0 && stop < start, 'on libère avant d\'allouer');
});

test('pm2 : une LECTURE n\'attend pas aussi longtemps qu\'une écriture', () => {
  assert.match(src, /const PM2_LECTURE = new Set\(\['jlist', 'list', 'prettylist'\]\)/);
  assert.match(src, /timeout: lecture \? 20000 : 60000/,
    'un jlist mesuré à ~300 ms ne doit pas bloquer le tick 60 s quand pm2 est coincé');
  // La détection doit porter sur la commande SEULE : `pm2(['stop','jlist'])` n'existe pas, mais un bot
  // pourrait s'appeler « jlist » — et un `stop` déguisé en lecture se verrait couper à 20 s.
  assert.match(src, /args\.length === 1 && PM2_LECTURE\.has\(String\(args\[0\]\)\)/);
});

test('pm2 : le délai d\'écriture reste intact (contre-épreuve)', () => {
  // Si quelqu'un « simplifie » en mettant 20 s partout, un `pm2 resurrect` lent au boot serait coupé
  // en plein vol. Cette assertion existe pour que ce changement-là ne passe pas inaperçu.
  assert.ok(src.includes('60000'), 'les commandes d\'écriture gardent leur délai long');
});
