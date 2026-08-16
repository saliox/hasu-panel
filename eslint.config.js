// Filet contre LE mode de panne de ce projet : l'identifiant qui n'existe pas.
//
// POURQUOI. `cleanNotes` a été appelé dans main.js sans figurer dans son import. Le fichier COMPILE
// (une ReferenceError est une erreur d'exécution, pas de syntaxe), `node --check` passe, les tests de
// logic.js passent — et la version est partie en production avec toute sa chaîne de mise à jour
// coupée : plus aucun correctif ne pouvait arriver sur les postes installés. C'est le quatrième échec
// silencieux de ce projet en deux mois ; `no-undef` les attrape tous d'un coup, quel que soit le
// fichier et quelle que soit la portée.
//
// Volontairement MINIMAL : uniquement des règles qui signalent du code faux, aucune règle de style.
// Un lint bavard finit ignoré, et un lint ignoré ne protège plus rien.

const nodeGlobals = {
  require: 'readonly', module: 'writable', exports: 'writable', process: 'readonly',
  __dirname: 'readonly', __filename: 'readonly', Buffer: 'readonly', console: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  setImmediate: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', TextDecoder: 'readonly',
  AbortController: 'readonly', queueMicrotask: 'readonly', structuredClone: 'readonly',
};

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
  clearInterval: 'readonly', requestAnimationFrame: 'readonly', MutationObserver: 'readonly',
  addEventListener: 'readonly', removeEventListener: 'readonly', innerWidth: 'readonly',
  innerHeight: 'readonly', getComputedStyle: 'readonly', URLSearchParams: 'readonly',
  fetch: 'readonly', Notification: 'readonly', CSS: 'readonly',
  alert: 'readonly', confirm: 'readonly', prompt: 'readonly',
};

const regles = {
  'no-undef': 'error',              // la règle qui justifie ce fichier
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }], // imports et variables morts
  'no-dupe-keys': 'error',          // une clé écrasée en silence dans un objet de config
  'no-dupe-args': 'error',
  'no-unreachable': 'error',        // code après un return : intention perdue
  'no-const-assign': 'error',
  'no-self-assign': 'error',
  'no-fallthrough': 'error',
  'no-cond-assign': 'error',        // `if (a = b)` au lieu de `===`
  'valid-typeof': 'error',
  'use-isnan': 'error',
};

module.exports = [
  { ignores: ['dist/**', 'dist-*/**', 'node_modules/**'] },
  {
    // Processus principal + modules purs : contexte Node/Electron.
    files: ['main.js', 'preload.js', 'discordrpc.js', 'logic.js', 'validators.js', 'test/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: nodeGlobals },
    rules: regles,
  },
  {
    // Interface : contexte navigateur, isolée du main (elle ne voit QUE le pont `window.panel`).
    files: ['ui/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: browserGlobals },
    rules: regles,
  },
];
