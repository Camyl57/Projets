# Portfolio de Camyl Khebache

Site statique (HTML, CSS, JavaScript sans dépendance) sur le thème « traceroute » : chaque section est un hop, avec sa latence et son adresse fictive.

## Lancer en local

```
python -m http.server 8080
```

Puis ouvrir http://localhost:8080.

## Animations et fond

- Écran d'entrée « Établir la connexion » : joué à chaque nouvel onglet ou nouvelle session, pas au rechargement de l'onglet (mémorisé avec `sessionStorage`).
- Fond « réseau » (`assets/js/bg.js`, `assets/css/background.css`) : nœuds, liens, paquets, grille, et photos très atténuées (Ctrl K → « Afficher / masquer les photos de fond »).
- Tout est coupé ou rendu statique avec `prefers-reduced-motion`.

## Crédits des images de fond

Photos libres de droits issues de [Wikimedia Commons](https://commons.wikimedia.org/), redimensionnées (1 400 px de large), converties en WebP et recouvertes d'un voile pour la lisibilité. Elles sont hébergées dans `assets/img/bg/`, sans lien vers un autre site.

| Fichier | Image d'origine | Auteur | Licence |
| --- | --- | --- | --- |
| `salle-serveurs.webp` | [NOIRLab HQ Server Racks](https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(6V6A0375-CC).jpg) | NOIRLab/NSF/AURA/T. Slovinský | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `fibre-optique.webp` | [Fiber optic cable installation](https://commons.wikimedia.org/wiki/File:Fiber_optic_cable_installation_(rubin-20170124-101126).jpg) | Rubin Observatory/NSF/AURA | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `baie-reseau.webp` | [Cable closet bh](https://commons.wikimedia.org/wiki/File:Cable_closet_bh.jpg) | Domaine public | Domaine public |

Modifications : recadrage proportionnel, réduction de taille, conversion en niveaux de gris par CSS, compression WebP.
