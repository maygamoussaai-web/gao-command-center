# Rendre opérationnelles les pages Restaurants et Historique des paiements

## Pourquoi elles affichent « arrive bientôt »

Ces deux pages ont été créées volontairement comme simples placeholders lors de la première étape : seuls la connexion et le tableau de bord devaient être développés. Le contenu n'a donc jamais été construit — ce n'est pas un bug.

## Ce que le backend fournit déjà (vérifié en direct)

L'Edge Function `admin-api` répond déjà à ces actions :

- `list_restaurants` — liste complète des restaurants (id, nom, logo, restaurateur, etc.)
- `detail_restaurant` — fiche d'un restaurant + statistiques jour/semaine/mois (commandes validées, promotions) + ses paiements
- `historique_paiements` — tous les encaissements enregistrés
- `enregistrer_paiement` — enregistrer un encaissement (montant requis)
- `suspendre` — suspendre un restaurant (motif obligatoire)

## Page Restaurants

- Liste dense façon command center : logo, nom, statut (actif / suspendu), solde dû en FCFA, tri par solde décroissant.
- Recherche par nom + filtre statut.
- Accent de couleur uniquement sur les signaux : solde dû élevé, restaurant suspendu.
- Clic sur une ligne → panneau de détail (`detail_restaurant`) : infos du restaurant, stats jour/semaine/mois, historique de ses paiements.
- Depuis le détail : bouton « Encaisser » (modal montant en FCFA → `enregistrer_paiement`) et bouton « Suspendre » (modal avec motif obligatoire → `suspendre`).
- États de chargement, erreurs backend en français, rafraîchissement automatique après action.

## Page Historique des paiements

- Tableau de tous les encaissements (`historique_paiements`) : date, restaurant, montant FCFA.
- Total encaissé en en-tête, filtres par restaurant et par période (jour / semaine / mois / tout).
- État vide explicite (« Aucun encaissement enregistré ») — actuellement la table est vide côté backend.

## Détails techniques

- Ajout des helpers typés dans `src/lib/admin-api.ts` (`listRestaurants`, `detailRestaurant`, `historiquePaiements`, `enregistrerPaiement`, `suspendreRestaurant`), tous avec `token`.
- Données via React Query, comme le tableau de bord ; invalidation des caches après encaissement/suspension.
- Remplacement du contenu placeholder de `src/routes/restaurants.tsx` et `src/routes/historique-paiements.tsx`, toujours enveloppés dans `ConsoleLayout`.
- Réutilisation des tokens visuels existants (`.panel`, `.num`, couleurs de signal) et de `formatFCFA`.
- Vérification de bout en bout dans le navigateur avec une session réelle avant de te répondre.

## Points à confirmer

- La réactivation d'un restaurant suspendu n'a pas d'action confirmée côté backend ; je la vérifierai au moment de l'implémentation et l'ajouterai si elle existe.
- Le réglage des paramètres économiques (`prix_promotion`, `prix_par_commande_payee`) reste hors périmètre de ces deux pages.
