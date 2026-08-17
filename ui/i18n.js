// Moteur de traduction de l'interface.
//
// Les LANGUES elles-mêmes vivent dans ui/lang/<code>.js — un fichier par langue, chacun s'enregistrant
// dans `window.LANGS` (fenêtre) et exportant son objet (processus principal). Ce fichier-ci ne
// contient plus aucun texte : uniquement la sélection de langue, `t()` et l'application au DOM.
//
// Il est chargé DEUX FOIS, par deux mondes différents : par la fenêtre (balise <script>, donc il ne
// doit rien exiger d'autre) et par le processus principal via `require`, pour que le menu de la zone
// de notification parle la même langue que l'écran. D'où la queue UMD en bas.
//
// Règles de tenue :
//  • une clé = une phrase COMPLÈTE. Découper « Relancer les bots {input} s après… » en morceaux
//    recollés dans le code produit des tournures fausses dès qu'une langue change l'ordre des mots.
//  • les valeurs peuvent contenir du HTML (gras) : elles viennent des fichiers de langue, jamais de
//    l'extérieur. Tout ce qui vient de pm2, d'un log ou d'une release passe par `esc()` côté appelant.
//  • `{x}` est un emplacement remplacé par t(clé, { x: … }).

(function () {

// Ordre d'affichage dans le menu déroulant : le français d'abord (langue d'origine), l'anglais
// ensuite, puis le reste. Une langue absente de cette liste n'apparaît pas — c'est volontaire,
// ça évite qu'un fichier de travail oublié dans ui/lang/ se retrouve proposé à l'utilisateur.
const ORDRE = ['fr', 'en', 'es', 'pt', 'de', 'it', 'nl', 'pl', 'ru', 'tr', 'ar', 'zh', 'ja', 'ko'];

// Langues qui s'écrivent de DROITE À GAUCHE : toute la mise en page doit basculer, pas seulement le
// texte. Sans ça l'arabe s'affiche correctement mais se lit à l'envers.
const RTL = new Set(['ar']);

// Registre des langues chargées. Côté fenêtre, il est rempli par les <script> de ui/lang/*.js ; côté
// processus principal il n'y a pas de balise script, on charge donc par require.
const REG = (typeof window !== 'undefined' && window.LANGS) ? window.LANGS : {};
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  for (const c of ORDRE) {
    try { REG[c] = require('./lang/' + c + '.js'); }
    catch { /* langue absente : on continue, le repli sur le français couvre tout */ }
  }
}

let LANG = 'fr';
const existe = (l) => !!(REG[l] && REG[l].ui);
const setLang = (l) => { LANG = existe(l) ? l : 'fr'; return LANG; };
const getLang = () => LANG;
const isRtl = (l) => RTL.has(l || LANG);

// Langues réellement disponibles, dans l'ordre d'affichage : [{ code, nom }]
const langues = () => ORDRE.filter(existe).map((c) => ({ code: c, nom: REG[c].nom || c }));

/**
 * Traduit une clé. `vars` remplit les emplacements {x}.
 * Repli en cascade : langue courante → français → la clé elle-même. Renvoyer la CLÉ (et non une
 * chaîne vide) la rend visible à l'écran, donc repérable — un bouton muet ne se signale pas.
 */
const t = (cle, vars) => {
  const table = (REG[LANG] && REG[LANG].ui) || {};
  const fr = (REG.fr && REG.fr.ui) || {};
  let s = table[cle];
  if (s === undefined) s = (fr[cle] !== undefined ? fr[cle] : cle);
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
};

// Corps de la fenêtre « À propos » dans la langue courante (repli français).
const about = () => (REG[LANG] && REG[LANG].about) || (REG.fr && REG.fr.about) || '';

// Applique les traductions aux éléments STATIQUES du HTML, marqués par un attribut :
//   data-i18n       → textContent      (texte simple)
//   data-i18n-html  → innerHTML        (texte contenant du gras — valeurs issues des fichiers de langue)
//   data-i18n-title → attribut title    · data-i18n-ph → attribut placeholder
//   data-i18n-input → phrase ENTOURANT un champ de saisie (voir plus bas)
// Le texte français reste ÉCRIT dans le HTML : si ces scripts venaient à ne pas se charger, la
// fenêtre resterait lisible au lieu d'afficher une grille de clés.
const applyStatic = (racine) => {
  const r = racine || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  r.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  r.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  r.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  // Phrase contenant un CHAMP de saisie : on ne peut pas réécrire innerHTML sans détruire l'élément
  // (il porte la valeur saisie et ses écouteurs). On remplace donc uniquement les deux textes qui
  // l'encadrent, découpés sur {input} — la phrase reste une seule entrée de dictionnaire, donc
  // traduisible dans n'importe quel ordre de mots.
  r.querySelectorAll('[data-i18n-input]').forEach((el) => {
    const champ = el.querySelector('input');
    if (!champ) return;
    const [avant, apres] = t(el.getAttribute('data-i18n-input')).split('{input}');
    el.textContent = '';
    el.appendChild(document.createTextNode(avant || ''));
    el.appendChild(champ);
    el.appendChild(document.createTextNode(apres || ''));
  });
};

// Queue UMD : `window.i18n` pour la fenêtre, `module.exports` pour le processus principal.
const API = { t, about, setLang, getLang, langues, isRtl, applyStatic, ORDRE };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.i18n = API;

})();
