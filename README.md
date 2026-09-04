# Gao Command Center

Ce que tu construis : "GAO FOOD — Console Admin", l'interface personnelle de Moussa, fondateur unique de GAO FOOD (plateforme de commande de repas à Gao, Mali). Il l'utilisera seul, quotidiennement, pour piloter tous les restaurants de la plateforme, surveiller l'activité, encaisser les soldes dus par les restaurateurs, et ajuster les paramètres économiques. L'action clé qu'il doit pouvoir faire en un coup d'œil en ouvrant l'app : voir l'état de santé global de la plateforme aujourd'hui (commandes, chiffre d'affaires, restaurants qui posent problème).

DIRECTION VISUELLE — carte blanche totale, sois audacieux : pense "command center" premium et data-dense, façon Stripe Dashboard / Linear / Vercel. Sombre par défaut (avec bascule vers un mode clair sobre), typographie nette et resserrée, cartes de statistiques avec chiffres en avant, accents de couleur réservés aux signaux importants (alerte, argent dû, suspension), grille dense mais respirable, coins légèrement arrondis, ombres discrètes, jamais de dégradés criards. Police : Inter pour tout le texte (variable --font-sans), une police display distincte réservée uniquement au wordmark "GAO FOOD" (variable --font-display, par exemple Sora ExtraBold) — jamais utilisée ailleurs que le logo. Sauvegarde cette direction de style dans la Knowledge du projet pour que toutes mes prochaines demandes restent cohérentes avec elle sans que j'aie à la répéter.

Connecte le projet au backend Supabase EXISTANT (ne provisionne rien de nouveau) :
- SUPABASE_URL = https://wqyebuohgyldvpaktdts.supabase.co
- SUPABASE_PUBLISHABLE_KEY = sb_publishable_bRVMTcHql3FQnFBmOwvW3Q_YxZCmc4V
- SUPABASE_ANON_KEY (legacy, si besoin) = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxeWVidW9oZ3lsZHZwYWt0ZHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NzQ0MTUsImV4cCI6MjEwMzQ1MDQxNX0.0LK2acov3l26pabCOILD62ueCwC7ADaEHRZlGzPtOrc
N'utilise QUE la clé publique côté client, jamais de service_role.

Pour cette première étape, construis UNIQUEMENT ces deux écrans (le reste viendra dans des prompts séparés et ciblés, ne les anticipe pas) :

1. ÉCRAN DE CONNEXION — authentification par mot de passe unique (pas d'email, pas de numéro). Appelle l'Edge Function `admin-auth` déjà déployée via `supabase.functions.invoke("admin-auth", { body: {...} })` :
   - `{action:"login", mot_de_passe}` → retourne `{token, prenom, nom, numero}` en cas de succès, ou `{error}` sinon.
   - Stocke le token en localStorage et crée un AuthProvider qui, au chargement, appelle `{action:"session", token}` pour restaurer la session (redirige vers /connexion si absente/expirée).
   - Champ mot de passe avec icône œil ouvert/barré pour afficher/masquer.
   - Design épuré, centré, qui pose déjà le ton "command center premium" du reste de l'app.

2. TABLEAU DE BORD (page protégée après connexion) — appelle `{action:"dashboard", token}` sur `admin-api`, qui retourne :
   `{ nombre_restaurants, nombre_clients, jour:{nombre_commandes, restaurant_plus_commandes:{nom,nb}|null, restaurant_plus_chiffre_affaires:{nom,ca}|null}, semaine:{...même forme...}, mois:{...même forme...}, moyenne_commandes_par_jour, total_solde_admin, parametres:{prix_promotion, prix_par_commande_payee} }`
   Affiche ces données avec un vrai sélecteur de période (Aujourd'hui / Cette semaine / Ce mois) qui bascule l'affichage entre jour/semaine/mois sans recharger la page. Inclus une carte dédiée et bien visible pour `total_solde_admin` (l'argent dû par tous les restaurateurs — c'est la métrique la plus importante pour Moussa). En haut à droite, icône de profil affichant en lecture seule Prénom "Moussa Issoufi", Nom "MAYGA", Numéro "60673302", avec un lien "Changer de mot de passe" (modal : ancien mot de passe, nouveau, confirmation, tous avec icône œil — appelle `{action:"changer_mot_de_passe", token, ancien, nouveau}`).
   Prévois déjà, dans la navigation (sidebar ou barre), des entrées "Restaurants" et "Historique des paiements" qui pointent vers des pages à venir (simple placeholder pour l'instant, je les construirai juste après) — mais NE développe PAS leur contenu maintenant, uniquement le Dashboard.

Utilise du vrai contenu partout (vrais libellés en français, vrais chiffres formatés en FCFA, pas de lorem ipsum). Teste que la connexion et le dashboard fonctionnent réellement de bout en bout avant de me répondre.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea02ecaf-0a66-46b9-b6f5-a16de83d1e92).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
