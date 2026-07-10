// Validateurs de sécurité du panel (logique pure, sans Electron) : extraits de
// main.js pour être testables unitairement (npm test). Ils gardent la frontière
// anti-injection / anti-pollution — toute modification doit faire passer les tests.

const NAME_RE = /^[A-Za-z0-9_.-]{1,64}$/; // noms pm2 autorisés (jamais d'espace ni de quote → sûr en argument)
const EXE_RE = /^[A-Za-z0-9 _.()+'-]{1,80}\.exe$/i; // noms de process de jeu autorisés

// Noms interdits comme clé de cfg.bots (objet simple) : "__proto__" via `cfg.bots[name] = …`
// ne crée PAS une propriété normale, il réassigne le PROTOTYPE de cfg.bots (pollution en mémoire,
// affecte la lecture de tout autre nom non configuré ensuite). "constructor"/"prototype" par
// prudence pour la même raison. Les noms de périphériques Windows (CON, COM1…) sont aussi rejetés :
// pm2 dérive son nom de fichier de log du nom du process, et un fichier littéralement nommé "CON"
// bloque/plante les I/O sous Windows.
const RESERVED_NAMES = new Set([
  '__proto__', 'constructor', 'prototype',
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);
const isSafeName = (n) => typeof n === 'string' && NAME_RE.test(n) && !RESERVED_NAMES.has(n.toLowerCase());

// Métacaractères cmd interdits dans un chemin. Depuis le passage de pm2 en invocation
// directe (sans shell), ce filtre n'est plus la seule barrière — il reste en défense
// en profondeur pour le repli shell (layout npm inhabituel) et contre les chemins pièges.
const BAD_SHELL_RE = /[&|<>^"%!\r\n`;]/;

// Une IP « publique » = ni privée/locale/loopback (IPv4 ET IPv6). Sert à distinguer une vraie
// session multijoueur (connexion vers Internet) d'un jeu solo/LAN.
const isPublicIp = (raw) => {
  const ip = String(raw || '').replace(/^\[|\]$/g, '').toLowerCase(); // retire les crochets IPv6
  if (ip.includes('.') && !ip.includes(':')) { // IPv4
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|255\.)/.test(ip)) return false;
    const b2 = Number(ip.split('.')[1]);
    if (ip.startsWith('172.') && b2 >= 16 && b2 <= 31) return false;
    return true;
  }
  if (ip.includes(':')) { // IPv6
    if (ip === '::1' || ip === '::') return false;          // loopback / non spécifié
    if (ip.startsWith('fe80')) return false;                // link-local
    if (/^f[cd]/.test(ip)) return false;                    // unique-local (fc00::/7)
    if (ip.startsWith('::ffff:')) return isPublicIp(ip.slice(7)); // IPv4 mappée
    return true;                                            // adresse IPv6 globale
  }
  return false;
};

module.exports = { NAME_RE, EXE_RE, RESERVED_NAMES, isSafeName, BAD_SHELL_RE, isPublicIp };
