# Hasu Panel

Un petit panneau de contrôle Windows pour tes bots [pm2](https://pm2.keymetrics.io/).
Il les démarre à l'ouverture de session, les met en pause quand tu joues, et se met à jour tout seul.

---

## Ce qu'il fait

**Tous tes bots au même endroit.** L'état de chaque process pm2 en direct — durée de fonctionnement,
RAM, CPU, réseau, nombre de redémarrages — avec démarrer, arrêter et relancer en un clic.

**Le démarrage automatique, bot par bot.** Tu choisis lesquels se lancent avec Windows. Le panel passe
à la fois par la clé Run *et* par une tâche planifiée à l'ouverture de session, parce que Windows 11
retarde parfois les applis de la clé Run de plusieurs minutes.

**Le mode jeu.** Quand tu lances une partie multijoueur **en ligne**, le panel coupe les bots que tu as
cochés et les relance une minute après que tu aies fermé le jeu. Une partie solo ou hors-ligne ne
déclenche rien : la détection se base sur l'activité réseau réelle, pas juste sur le nom du process.

**Le mode faible débit.** Pendant une partie en ligne, les bots repoussent leurs gros téléchargements et
passent en priorité CPU basse pour te laisser la bande passante. Tout revient à la normale ensuite.

**L'import de n'importe quel bot.** Tu pointes un script (`index.js`, `bot.py`…) ou un dossier, il est
confié à pm2 et géré comme les autres. Tes fichiers ne sont jamais modifiés.

**La détection des jeux.** Le panel parcourt tes bibliothèques Steam et Epic une fois par jour — jamais
en continu — et te laisse ajouter n'importe quel programme en cours d'exécution en un clic.

**Le Rich Presence Discord**, si tu veux : « 🤖 Gère X bots en ligne » sur ton profil.

**Les mises à jour automatiques.** Les nouvelles versions se téléchargent en fond et s'installent au
redémarrage suivant.

## Installation

Télécharge le dernier **`HasuPanel-Setup.exe`** depuis la page
[Releases](https://github.com/saliox/hasu-panel/releases/latest) et lance-le.

Pas besoin de droits admin : l'installation se fait par utilisateur et l'appli démarre à l'ouverture de
session (désactivable). Fermer la fenêtre la réduit dans la zone de notification — pour vraiment quitter,
clic droit sur l'icône puis **Quitter**.

## Comment marchent les mises à jour

Le panel regarde les releases GitHub au démarrage puis toutes les quelques heures. S'il y en a une
nouvelle, elle se télécharge en silence et s'applique au prochain lancement de l'appli — ou tout de
suite via l'entrée **« Mise à jour prête »** du menu de la zone de notification. Tu l'installes une
fois, elle reste à jour ensuite.

## Vie privée

Hasu Panel ne détient **aucun identifiant**. Il ne parle qu'à ton pm2 local et n'envoie tes données
nulle part : les seuls appels réseau sont la vérification de mise à jour (GitHub) et, si tu l'actives,
le Rich Presence Discord. Réglages et journaux restent dans `%APPDATA%\hasu-panel`.

## Sécurité

Le panel lance des commandes système, donc quelques précautions sont prises :

- pm2 est appelé **directement avec node**, sans passer par un shell — l'injection de commande est
  impossible par construction.
- Les noms de bots et de process sont validés par des règles strictes (`validators.js`), avec les tests
  unitaires qui vont avec.
- La fenêtre tourne avec `contextIsolation`, sans intégration Node, et ne charge aucun contenu distant.

## Développer

```bash
npm install
npm test           # tests unitaires des validateurs
npm start          # lancer en dev
npm run installer  # construire l'installeur Windows (dist/)
```

---

*Fait avec Electron, pm2 et beaucoup de thé.*
