## Projet : Ecobank Guinée

## Introduction et Objectifs du Projet
Ce projet est une application de cartographie interactive qui permet de gérer et de visualiser divers points d'intérêt (agences, points Xpress et GAB) sur une carte.

**/**Les fonctionnalités principales incluent :

- Ajout et personnalisation de points d'intérêt géographiques
- Recherche de points spécifiques par leur nom
- Exportation et importation de données au format JSON
- Affichage conditionnel des marqueurs selon le niveau de zoom

## Objectifs principaux :

- Simplifier la gestion des points d'intérêt
- Faciliter la recherche et la visualisation de ces points sur une carte interactive
## Guide d'Utilisation de l'Application
**/** Ajout de points
- Cliquez sur la carte pour ouvrir le formulaire de saisie.
- Remplissez les informations requises et sélectionnez le type de point (agence, Xpress, GAB).
- Validez les informations pour afficher le point sur la carte et l'ajouter à la liste dans la barre latérale.

**/**Visualisation des points
- Cliquez sur un marqueur pour afficher une boîte d'information avec les détails du point.
- Utilisez la liste des points dans la barre latérale pour centrer la carte sur le point sélectionné.
**/** Recherche de points
- Saisissez le nom du point dans la barre de recherche.
- Appuyez sur Entrée ou cliquez sur l'icône de recherche pour centrer la carte sur le point et afficher ses informations.
**/** Suppression de points
Dans la liste des points, cliquez sur l'icône de suppression pour retirer un point de la carte et de la liste.

## Exportation et Importation des Points
- Exportateur : Téléchargez un fichier JSON contenant les informations de tous les points ajoutés.
- Importateur : Charge des points depuis un fichier JSON pour les ajouter à la carte.

## Description des Fonctionnalités Implémentées
1. Ajout et personnalisation de points : Le formulaire ajuste les champs disponibles selon le type de point sélectionné (agence, Xpress, GAB).

2. Affichage Détail des Points : Une boîte d'information personnalisée s'affiche pour chaque point sélectionné.
3. Suppression : Les points peuvent être supprimés individuellement depuis la liste latérale.
4. Recherche : Permet une recherche rapide par nom avec centrage automatique sur le point trouvé.
5. Export/Import JSON : Les points peuvent être exportés en JSON et importés pour une gestion simplifiée.
6. Affichage Conditionnel : Les marqueurs apparaissant ou disparaissent en fonction du niveau de zoom, optimisant ainsi la fluidité de navigation.
## Choix Techniques Effectués
- Classes JavaScript : Utilisation de classes pour structurer les différents types de points (agence, Xpress, GAB) avec leurs propriétés spécifiques.
- Leaflet.js pour la Cartographie : Bibliothèque utilisée pour gérer la carte interactive, placer les marqueurs et afficher les boîtes d'information.
- localStorage pour la Persistance : Les points sont sauvegardés dans le localStorage du navigateur, permettant une récupération des données même après un rechargement de la page.
- Format JSON pour Export/Import : JSON est choisi pour sa compatibilité, facilitant la sauvegarde et le transfert des données.
## Problèmes rencontrés et solutions apportées
***/*** Sauvegarde de Données Incomplètes

- Problème : Des informations spécifiques (services, horaires) manquaient après un rechargement de page.
- Solution : Adaptation du format de sauvegarde dans le localStorage pour inclure toutes les propriétés spécifiques de chaque type de point.
Erreur d'Importation de Coordonnées et Types

- Problème : Certains points étaient incorrectement chargés à l'import.
- Solution : Validation des types de points dans la fonction d'importation JSON pour garantir la cohérence des données.
Problèmes de Recherche avec Casse et Espaces

- Problème : La recherche échouait en raison des différences de casse et d'espaces.
- Solution : Uniformisation des critères de recherche en supprimant les espaces et en convertissant le texte en minuscules.
Performance avec Nombreux Marqueurs

- Problème : Afficher trop de marqueurs ralentissait l'application.
- Solution : Mise en place d'un affichage conditionnel par niveau de zoom pour limiter le nombre de marqueurs visibles.
Synchronisation des Données à l'Importation

- Problème : L'importation remplaçait les points existants au lieu de les combiner avec les nouveaux.
- Solution : Modification de l'import pour ajouter les nouveaux points à la liste existant sans supprimer les précédents.


Lien du projet : https://map-eco.vercel.app
