// Tests unitaires (node:test) des validateurs de sécurité. Lancer : npm test
// Ces fonctions gardent la frontière anti-injection / anti-pollution du panel :
// toute régression ici rouvrirait les bugs corrigés (proto-pollution, noms CON/COM,
// injection cmd) — les tests les figent.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NAME_RE, EXE_RE, RESERVED_NAMES, isSafeName, BAD_SHELL_RE, isPublicIp, isSafePm2Arg, isDiscordWebhookUrl } = require('../validators');

test('isSafeName : accepte les noms pm2 légitimes', () => {
  for (const n of ['saliox', 'mon-bot', 'bot_2', 'a', 'bot.prod', 'A1.b-c_d']) {
    assert.equal(isSafeName(n), true, n);
  }
});

test('isSafeName : rejette espaces, quotes, métacaractères, longueur, non-string', () => {
  for (const n of ['mon bot', 'bot"x', "bot'x", 'bot&calc', 'bot|x', 'a'.repeat(65), '', null, undefined, 42, {}]) {
    assert.equal(isSafeName(n), false, String(n));
  }
});

test('isSafeName : bloque la pollution de prototype et les périphériques Windows', () => {
  for (const n of ['__proto__', 'constructor', 'prototype', 'con', 'CON', 'Com3', 'NUL', 'lpt9', 'AUX']) {
    assert.equal(isSafeName(n), false, n);
  }
  // Régression concrète : la clé « __proto__ » sur un objet simple réassigne le
  // prototype au lieu de créer une propriété (pollution silencieuse en mémoire).
  const bots = {};
  const evil = '__proto__';
  assert.equal(isSafeName(evil), false, 'le garde doit refuser AVANT toute écriture cfg.bots[name]');
  assert.equal(RESERVED_NAMES.has(evil), true);
});

test('NAME_RE / EXE_RE : formats attendus', () => {
  assert.equal(NAME_RE.test('bot-1'), true);
  assert.equal(NAME_RE.test('bot 1'), false);
  assert.equal(EXE_RE.test('RocketLeague.exe'), true);
  assert.equal(EXE_RE.test("Tony Hawk's (2).exe"), true);
  assert.equal(EXE_RE.test('game&calc.exe'), false);
  assert.equal(EXE_RE.test('pasunexe.txt'), false);
});

test('BAD_SHELL_RE : détecte les métacaractères cmd dans un chemin', () => {
  for (const p of ['C:\\bots\\a&b.js', 'C:\\x|y.js', 'C:\\x">y.js', 'C:\\x%APPDATA%.js', 'C:\\x`y.js', 'C:\\x;y.js']) {
    assert.equal(BAD_SHELL_RE.test(p), true, p);
  }
  assert.equal(BAD_SHELL_RE.test('C:\\Mes Bots\\bot (v2).js'), false, 'espaces et parenthèses restent permis');
});

test('isPublicIp : plages IPv4 privées/spéciales refusées', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.10', '169.254.0.5', '0.0.0.0', '255.255.255.255',
    '172.16.0.1', '172.31.255.254']) {
    assert.equal(isPublicIp(ip), false, ip);
  }
});

test('isPublicIp : IPv4 publiques acceptées (dont bornes 172.x hors 16-31)', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '93.184.216.34']) {
    assert.equal(isPublicIp(ip), true, ip);
  }
});

test('isPublicIp : IPv6 locales refusées, globales acceptées, crochets tolérés', () => {
  for (const ip of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1']) {
    assert.equal(isPublicIp(ip), false, ip);
  }
  for (const ip of ['2001:4860:4860::8888', '2606:4700::1111', '[2606:4700::1111]']) {
    assert.equal(isPublicIp(ip), true, ip);
  }
});

test('isPublicIp : plages nouvellement exclues (multicast, réservé, CGNAT, IPv6 documentation)', () => {
  for (const ip of ['224.0.0.1', '239.255.255.250', '240.0.0.1', '255.0.0.1', '100.64.0.1', '100.127.255.255',
    '2001:db8::1', '[2001:db8::1]', '2001:0db8::1']) {
    assert.equal(isPublicIp(ip), false, ip);
  }
  // Bornes hors plage CGNAT (100.64.0.0/10 seulement) restent publiques
  for (const ip of ['100.63.255.255', '100.128.0.0', '223.255.255.255']) {
    assert.equal(isPublicIp(ip), true, ip);
  }
  // 2001:db80::/32 n'est PAS 2001:db8::/32 (piège de préfixe) : reste publique
  assert.equal(isPublicIp('2001:db80::1'), true);
});

test('isPublicIp : IPv4 mappée en IPv6 suit les règles IPv4', () => {
  assert.equal(isPublicIp('::ffff:192.168.1.1'), false);
  assert.equal(isPublicIp('::ffff:8.8.8.8'), true);
});

test('isPublicIp : entrées invalides refusées', () => {
  for (const ip of ['', null, undefined, 'localhost', 'not-an-ip']) {
    assert.equal(isPublicIp(ip), false, String(ip));
  }
});

test('isSafePm2Arg : accepte les arguments pm2 légitimes (alphanumérique/point/tiret/underscore)', () => {
  for (const a of ['start', 'stop', 'restart', 'jlist', 'save', 'mon-bot', 'bot_2', 'A1.b-c_d', '0']) {
    assert.equal(isSafePm2Arg(a), true, a);
  }
});

test('isSafePm2Arg : rejette espaces, métacaractères shell et non-string', () => {
  for (const a of ['mon bot', 'a;b', 'a`b`', 'a$(whoami)', 'a|b', 'a&b', 'a<b', 'a>b', 'a"b', "a'b",
    'C:\\bots\\a.js', '', null, undefined, 42, {}, []]) {
    assert.equal(isSafePm2Arg(a), false, String(a));
  }
});

test('isDiscordWebhookUrl : accepte discord.com et ses sous-domaines en https', () => {
  for (const u of ['https://discord.com/api/webhooks/123/abc', 'https://x.discord.com/api/webhooks/123/abc',
    'https://canary.discord.com/api/webhooks/123/abc', 'https://ptb.discord.com/api/webhooks/1/a']) {
    assert.equal(isDiscordWebhookUrl(u), true, u);
  }
});

test('isDiscordWebhookUrl : rejette http, hôtes non-Discord, sosies et entrées invalides', () => {
  for (const u of ['http://discord.com/api/webhooks/123/abc', 'https://discord.com.evil.com/x',
    'https://evil.com/discord.com', 'https://discordapp.com/api/webhooks/1/a', 'https://notdiscord.com/x',
    'ftp://discord.com/x', 'not-a-url', '', null, undefined, 42]) {
    assert.equal(isDiscordWebhookUrl(u), false, String(u));
  }
});
