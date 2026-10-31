# On bouffe où ?

Application web pour régler le choix du restaurant entre amis : on crée un groupe, on partage un code à 4 chiffres, puis chacun swipe les restos autour de soi, depuis son propre téléphone. Dès que tout le monde a validé le même, c'est un match.

**Stack** : Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Framer Motion, Supabase (Postgres + temps réel), Google Places.

## Lancer le projet

```bash
npm install
cp .env.example .env.local   # puis le remplir (voir plus bas)
npm run dev                  # http://localhost:3000
npm run build                # build de production
npm run lint
npm run test:db              # teste le schéma SQL et ses règles de sécurité (sans compte Supabase)
```

La géolocalisation du navigateur ne fonctionne qu'en **https ou sur `localhost`**. Si elle est refusée, l'utilisateur choisit une ville dans la liste.

## Où en est-on

| Fonctionnalité | État |
| --- | --- |
| Accueil, parcours de création (position, budget, cuisines, prénom) | fait |
| Groupe partagé : code à 4 chiffres, salon d'attente, membres en direct | fait (Supabase à brancher) |
| Rejoindre par le code ou par un lien direct | fait |
| Vrais restos autour de la position (Google Places, notes, prix, filtre budget) | fait (clé à renseigner) |
| Swipe synchronisé, progression de chacun, match calculé par le serveur | fait |
| Recommencer (hôte), fin de partie sans match | fait |
| Déploiement en https | à faire |

## Temps réel : Supabase

Les groupes, les membres et les votes sont dans une base **Supabase** (gratuit, sans carte bancaire). Chaque téléphone obtient un identifiant **anonyme** (pas de compte à créer pour les joueurs).

1. Sur https://supabase.com : *New project* (région proche, par exemple Paris ou Francfort).
2. *SQL Editor → New query* : coller tout le contenu de `supabase/schema.sql`, puis *Run*. Il peut être relancé sans danger.
3. *Authentication → Sign In / Providers* : activer **Allow anonymous sign-ins**.
4. *Project Settings → API* (ou *API Keys*) : copier l'**URL du projet** et la clé **anon / publishable**.
5. Les coller dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=la_clé_anon
   ```
6. Relancer `npm run dev`. Sans ces clés, l'appli affiche « Serveur à brancher ».

La clé anon est **faite pour être publique** : ce qui protège les données, ce sont les règles du schéma (RLS), testées par `npm run test:db`.

### Comment ça marche

- **Aucune écriture directe** dans les tables : tout passe par des fonctions SQL (`create_group`, `join_group`, `set_restaurants`, `start_swiping`, `cast_vote`, `reset_group`) qui vérifient qui appelle.
- **Lecture** réservée aux membres du groupe. Chacun ne voit que **ses propres votes** ; le **match** est calculé par le serveur (tous les membres ont dit oui au même resto) et diffusé à tous.
- **Temps réel** : les téléphones écoutent les changements du groupe et des membres ; une relecture toutes les 5 secondes sert de filet de sécurité si la connexion temps réel est bloquée.
- **Cycle** : l'hôte crée le groupe → les amis rejoignent (jusqu'à 12) → l'hôte lance le swipe (plus personne ne peut entrer) → chacun swipe → match.
- **Limites** : un groupe expire après 24 h, 5 groupes actifs par personne. Le code à 4 chiffres est devinable : tant que le swipe n'est pas lancé, quelqu'un qui le devine peut entrer dans le salon. Pour durcir, voir *Authentication → Rate Limits* (connexions anonymes par IP) et, si besoin, activer le CAPTCHA.

## Vrais restos : Google Places

Les restos viennent de **Google Places API (New)**, appelée **côté serveur** par `app/api/restaurants/route.ts` : la clé n'est jamais envoyée au navigateur. L'hôte déclenche la recherche dans le salon, puis la liste est enregistrée pour tout le monde.

1. Sur https://console.cloud.google.com : créer un projet et y activer la facturation.
2. *API et services → Bibliothèque* : activer **Places API (New)**.
3. *Identifiants → Créer des identifiants → Clé API*, puis la **restreindre** à *Places API (New)* uniquement.
4. *Quotas* : fixer un plafond quotidien, et créer une **alerte de budget** (*Facturation → Budgets et alertes*).
5. Dans `.env.local` : `GOOGLE_PLACES_API_KEY=ta_clé`.
6. Relancer `npm run dev`. Sans clé, l'hôte voit un message clair et peut passer à des restos d'exemple.

**Coût** : on demande la note, le prix et le téléphone, ce qui relève de la tarification « Enterprise » de *Nearby Search* (avec un quota gratuit mensuel). Un groupe consomme 2 appels (recherche générale + cuisines choisies), 4 si peu de résultats. Les résultats sont gardés quelques minutes côté serveur et la route limite chaque IP à 12 recherches par minute. Vérifier la grille tarifaire actuelle de Google avant de partager le site largement.

**Conditions d'utilisation** : l'écran de swipe affiche « données Google Maps ». La liste des restos est conservée dans la base le temps du groupe (24 h au maximum). Si l'application grandit, ne stocker que les identifiants de lieux (`place id`) et redemander les détails à Google.

## Structure

```
app/
  page.tsx                 accueil
  creer/page.tsx           parcours de création
  rejoindre/page.tsx       saisie du code
  groupe/[code]/page.tsx   salon (params résolus sous <Suspense>, requis par Cache Components)
  groupe/[code]/swipe/     swipe synchronisé et match
  api/restaurants/         route serveur : validation, limite de débit, appel Google
components/
  wizard/                  CreateWizard + StepLocation / StepBudget / StepCuisine / StepDone
  swipe/                   SwipeGame, SwipeCard (drag Framer Motion), RestaurantCard, MatchScreen
  GroupLobby, RestaurantPrep, JoinForm, JoinFields, ProfileFields, SetupNotice, ui/ …
hooks/useGeolocation.ts    machine à états de la géolocalisation
lib/supabase/client.ts     client navigateur, connexion anonyme, messages d'erreur
lib/remote.ts              appels aux fonctions SQL
lib/liveGroup.ts           suivi d'un groupe en direct (lecture, temps réel, votes optimistes)
lib/places/google.ts       recherche Google Places (serveur), normalisation, classement
lib/restaurants.ts         restos d'exemple (repli) et helpers d'affichage
supabase/schema.sql        tables, règles de sécurité et fonctions
supabase/tests/            test du schéma sur un vrai Postgres local (PGlite)
```

Le nom de l'application se change dans `lib/brand.ts`.

## Notes Next.js 16

`cacheComponents` est activé : une page ne doit pas lire de données de requête (`params`, cookies…) en dehors d'un `<Suspense>`, ni appeler `Math.random()` ou `Date.now()` pendant le rendu. L'aléatoire est donc réservé aux gestionnaires d'événements. La documentation de cette version est dans `node_modules/next/dist/docs/`.
