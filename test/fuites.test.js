// Ce qui SORT de la machine : rien d'identifiant ne doit partir vers le webhook Discord.
//
// POURQUOI : quand aucune règle de `classifyErrorFr` ne reconnaît l'erreur — c'est-à-dire pour toute
// panne qui n'est pas une des sept catégories connues, donc le cas COURANT — l'alerte emporte la
// dernière ligne BRUTE du log du bot. Les règles d'origine masquaient l'IP et le nom de session.
// Rien d'autre. Un bot qui plante en affichant sa chaîne de connexion, son token, une en-tête
// Authorization ou l'URL d'un autre webhook publiait l'identifiant dans un salon Discord — qui a des
// membres, un historique, et parfois des bots tiers qui le lisent.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { redactSensitive, classifyErrorFr } = require('../logic');

// Chaque cas porte le secret à retrouver. Le TÉMOIN (premier test) vérifie que la ligne contient
// vraiment ce secret avant masquage : sans lui, une assertion « le secret n'est plus là » passerait
// aussi sur une ligne qui ne l'a jamais contenu.
// Les jetons d'épreuve sont ASSEMBLÉS, jamais écrits en entier : le scanner de secrets de GitHub
// refuse un push contenant une chaîne en forme de token Discord, même inventée — et il a raison, on
// ne lui apprend pas à être ignoré. redactSensitive reçoit la même chaîne qu'avant ; seul ce fichier
// n'en porte plus la forme complète.
const assembler = (...parts) => parts.join('.');
const FAUX_TOKEN = assembler('MTIzNDU2Nzg5MDEyMzQ1Njc4', 'GhIjKl', 'MnOpQrStUvWxYz0123456789abcdef');
const FAUX_TOKEN_COURT = assembler('MTIzNDU2Nzg5MDEyMzQ1Njc4', 'GhIjKl', 'xyz');
const FAUX_JWT = assembler('eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjM0NSJ9', 'dBjftJeZ4CVPmB92K27uhbUJU1p1r');

const CAS = [
  ['chaîne de connexion', 'MongoServerError: mongodb+srv://admin:Sup3rS3cret@cluster0.abc.mongodb.net/db', 'Sup3rS3cret'],
  ['URL de webhook', 'POST https://discord.com/api/webhooks/1234567890/AbCdEf-GhIjKlMnOpQrStUvWxYz123456789 a échoué',
    'AbCdEf-GhIjKlMnOpQrStUvWxYz123456789'],
  ['token Discord', `An invalid token was provided: ${FAUX_TOKEN}`, FAUX_TOKEN],
  ['en-tête Authorization', 'headers={Authorization: Bearer sk-proj-AbCd1234EfGh5678IjKl}', 'sk-proj-AbCd1234EfGh5678IjKl'],
  ['variable d\'environnement', `cannot read DISCORD_TOKEN=${FAUX_TOKEN_COURT}`, 'MTIzNDU2Nzg5MDEyMzQ1Njc4'],
  ['mot de passe', 'connect failed db_password=hunter2hunter user=admin', 'hunter2hunter'],
  ['clé d\'API', 'header x-api-key=sk_live_51abcdefghij refusé', 'sk_live_51abcdefghij'],
  ['JWT', `jwt malformed: ${FAUX_JWT}`, 'dBjftJeZ4CVPmB92K27uhbUJU1p1r'],
  ['adresse e-mail', 'SMTP error for jean.dupont@example.com', 'jean.dupont@example.com'],
];

test('fuites : le témoin — chaque ligne d\'épreuve contient bien son secret', () => {
  for (const [quoi, ligne, secret] of CAS) {
    assert.ok(ligne.includes(secret), `${quoi} : la ligne d'épreuve ne contient pas le secret annoncé`);
  }
});

test('fuites : aucun identifiant ne survit à redactSensitive', () => {
  for (const [quoi, ligne, secret] of CAS) {
    const out = redactSensitive(ligne);
    assert.equal(out.includes(secret), false, `${quoi} : « ${secret} » partirait vers Discord → ${out}`);
  }
});

test('fuites : le masquage garde le diagnostic lisible', () => {
  // Masquer en écrasant toute la ligne serait « sûr » et inutile : l'alerte doit encore dire QUOI.
  const out = redactSensitive('MongoServerError: mongodb+srv://admin:Sup3rS3cret@cluster0.abc.mongodb.net/db');
  assert.match(out, /MongoServerError/);
  assert.match(out, /cluster0\.abc\.mongodb\.net/, 'l\'hôte reste : c\'est lui qui dit quoi réparer');
});

test('fuites : la prose ordinaire n\'est pas abîmée (contre-épreuve)', () => {
  // Si les règles mordaient sur du texte normal, l'alerte deviendrait illisible et on l'ignorerait —
  // une alerte qu'on n'ouvre plus ne vaut pas mieux qu'une alerte qui ne part pas.
  for (const t of [
    'Une erreur bizarre sans motif connu',
    'TypeError: Cannot read properties of undefined (reading \'guild\')',
    'at Client.emit (node:events:518:28)',
  ]) assert.equal(redactSensitive(t), t, `la prose a été modifiée : ${redactSensitive(t)}`);
});

test('fuites : les règles d\'origine tiennent toujours (IP, chemin)', () => {
  assert.equal(redactSensitive('connect ETIMEDOUT 104.16.59.5:443'), 'connect ETIMEDOUT [ip]:443');
  assert.equal(redactSensitive('at (C:\\Users\\teamf\\Desktop\\bot\\index.js)').includes('teamf'), false);
});

test('fuites : le chemin de repli de classifyErrorFr masque bien (bout en bout)', () => {
  // C'est CE chemin qui alimente l'alerte. Le tester séparément de redactSensitive évite qu'un jour
  // le repli cesse d'y passer sans que rien ne rougisse.
  const log = 'ligne sans intérêt\nUnhandledRejection: db_password=hunter2hunter sur 10.0.0.7';
  const cause = classifyErrorFr(log);
  assert.equal(cause.includes('hunter2hunter'), false, cause);
  assert.equal(cause.includes('10.0.0.7'), false, cause);
  assert.ok(cause.length > 0, 'le diagnostic ne doit pas devenir vide pour autant');
});

test('publication : la course des deux publishers est supprimée en amont', () => {
  // electron-builder lance DEUX publishers (installeur + .blockmap). Chacun lit « release doesn't
  // exist » puis POSTe sa création ; le perdant reçoit 422 already_exists et fait échouer le build —
  // après que le gagnant a créé la release. Constaté deux fois : v1.16.14 et v1.16.15 publiées avec
  // le seul .blockmap, SANS latest.yml, donc sans aucune MAJ possible pour les panels installés.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.match(pkg.scripts.publish, /pre-release\.js && electron-builder/,
    'la release doit être créée AVANT electron-builder, sinon les deux publishers se la disputent');
  const src = fs.readFileSync(path.join(__dirname, '..', 'tools', 'pre-release.js'), 'utf8');
  assert.match(src, /'release', 'view'/, 'ne créer que si absente');
  assert.match(src, /'release', 'create'/);
});
