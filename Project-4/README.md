# On bouffe où ?

Application web pour régler le choix du restaurant entre amis : on crée un groupe, on partage un code à 4 chiffres, puis chacun swipe les restos autour de soi. Dès que tout le monde a validé le même, c'est un match.

**Stack** : Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Framer Motion.

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint
```

La géolocalisation du navigateur ne fonctionne qu'en **https ou sur `localhost`**. Sur téléphone, passer par un déploiement (ex. Vercel) ou un tunnel https. Si elle est refusée, l'utilisateur choisit une ville dans la liste.

## Où en est-on

| Fonctionnalité | État |
| --- | --- |
| Accueil : « Créer un groupe » / « Rejoindre (code à 4 chiffres) » | fait |
| Parcours de création : localisation, budget, cuisines | fait |
| Génération du code à 4 chiffres, copie et partage | fait |
| Page « Rejoindre » (saisie du code) et salon du groupe | fait (local) |
| Swipe des restos (cartes empilées, glisser ou boutons ou flèches du clavier) | fait |
| Restos mockés autour de la position (12, fictifs, déterministes) | fait |
| Match quand tout le monde a validé | fait (amis simulés) |
| Groupes et votes partagés entre téléphones (serveur temps réel) | à faire |
| Vrais restos (API Places) à la place des restos fictifs | à faire |

## Important : mode démo

Le swipe fonctionne de bout en bout, mais **tes amis sont simulés** (Lina, Tom et Sarah, voir `lib/friends.ts`) et les **restos sont fictifs** (`lib/restaurants.ts`). Un match est garanti entre le 4e et le 7e resto. Pour passer en vrai : remplacer `consensusIds` par les votes reçus du serveur et `buildRestaurants` par un appel à une API de lieux.

## Les groupes sont locaux pour l'instant

Les groupes sont stockés dans le `localStorage` du navigateur (`lib/storage.ts`). Le code est donc unique **sur un appareil seulement** et un ami ne peut pas encore rejoindre depuis son propre téléphone. Pour la suite, il faut un back-end partagé (Redis / base de données, avec temps réel : SSE ou WebSocket) derrière la même interface `createGroup` / `getGroupSnapshot`.

## Structure

```
app/
  page.tsx                 accueil
  creer/page.tsx           parcours de création
  rejoindre/page.tsx       saisie du code
  groupe/[code]/page.tsx   salon (params résolus sous <Suspense>, requis par Cache Components)
  groupe/[code]/swipe/     swipe des restos et match
components/
  HomeScreen.tsx           accueil animé
  wizard/                  CreateWizard + StepLocation / StepBudget / StepCuisine / StepDone
  swipe/                   SwipeGame, SwipeCard (drag Framer Motion), RestaurantCard, MatchScreen
  ui/                      Button, ChoiceCard
  CodeDigits, ShareCode, GroupSummary, GroupLobby, JoinForm, Logo
hooks/useGeolocation.ts    machine à états de la géolocalisation
lib/                       types, données, stockage, restaurants fictifs, amis simulés, aléatoire déterministe, nom de l'app
```

Le nom de l'application se change dans `lib/brand.ts`.

## Notes Next.js 16

`cacheComponents` est activé : une page ne doit pas lire de données de requête (`params`, cookies…) en dehors d'un `<Suspense>`, ni appeler `Math.random()` ou `Date.now()` pendant le rendu. L'aléatoire (génération du code) est donc réservé aux gestionnaires d'événements. La documentation de cette version est dans `node_modules/next/dist/docs/`.
