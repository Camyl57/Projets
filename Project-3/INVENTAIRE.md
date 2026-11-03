# INVENTAIRE — refonte « traceroute »

Dossier : `Project-3` · branche : `refonte-traceroute`. Relevé automatique (navigateur headless) sur le **code source avant toute modification**, puis comparaison avec le code refondu.
Méthode : le HTML brut est lu **JavaScript coupé** (donc exactement ce qui est écrit dans les fichiers), les éléments créés par JavaScript sont comptés à part, et chaque texte, lien, image et attribut d'accessibilité est comparé un par un.

## 1. Inventaire « avant » (site actuel)

### 1.1 Ce que la demande annonce, vérifié dans le code source

| Élément | Annoncé | Relevé | Verdict |
| --- | ---: | ---: | :---: |
| Lien d'évitement « Aller au contenu » | 1 | 1 | ✓ |
| En-tête : 6 liens (À propos, Projets, Parcours, Compétences, Certifications, Langues) | 6 | 6 | ✓ |
| En-tête : bouton Contact | 1 | 1 | ✓ |
| Hero : 2 boutons (Voir mes projets, Me contacter) | 2 | 2 | ✓ |
| Hero : titre | 1 | 1 | ✓ |
| Hero : encart terminal (whoami, cat profil.txt…) | — | 8 | ajouté à l'inventaire |
| Hero : 4 chiffres clés (3 projets, 2 stages, 6 langues, 09/2027) | 4 | 4 | ✓ |
| Hero : liste de technologies affichée 2 fois | 2 | 2 | ✓ |
|    dont 13 technologies × 2 = 26 | 26 | 26 | ✓ |
| § 01 : 3 thèmes (Réseaux, Cloud, Automatisation) | 3 | 3 | ✓ |
| § 01 : illustration animée de réseau | — | 5 | ajouté à l'inventaire |
| § 02 : 3 projets | 3 | 3 | ✓ |
|    chacun avec sa page dédiée | 3 | 3 | ✓ |
| § 02 : lien « Voir tous les projets » | 1 | 1 | ✓ |
| § 03 : 7 entrées numérotées | 7 | 7 | ✓ |
| § 04 : 4 catégories | 4 | 4 | ✓ |
|    soit 5 + 9 + 4 + 5 = 23 éléments | 23 | 23 | ✓ |
|    chacune avec sa description | 4 | 4 | ✓ |
| § 05 : 4 attestations | 4 | 4 | ✓ |
| § 06 : 6 langues avec leur niveau | 6 | 6 | ✓ |
| § 07 : e-mail, téléphone, GitHub, LinkedIn | 4 | 4 | ✓ |
| § 07 : bouton de téléchargement du CV (PDF) | 1 | 1 | ✓ |
| Pied de page | 1 | 1 | ✓ |
| Sections § 01 à § 07 | 7 | 7 | ✓ |

**Aucun écart** : tous les chiffres annoncés dans la demande correspondent au code source.

Précisions relevées dans le code :
- Le terminal du hero compte **8 lignes** : `$ whoami`, `camyl.khebache`, `$ cat profil.txt`, puis `école`, `base`, `focus`, `stage`, et le prompt final avec curseur.
- La liste de technologies (13 : Linux, Docker, Nginx, Bash, Python, TypeScript, PHP, Symfony, SQL, Git, GitLab, Vue.js, Java) est répétée **2 fois** (boucle du bandeau défilant).
- § 04 Compétences : Réseaux et systèmes **5**, Développement **9**, Outils **4**, Qualités **5** = **23**. Elles sont présentées dans un sélecteur à 4 onglets, avec la description de chaque catégorie. Cela reste à l'identique après la refonte (la demande parle d'une « grille » ; le composant actuel est ce sélecteur).
- § 03 : les 7 entrées sont dans une liste ordonnée `<ol>` (numérotation sémantique) ; elles totalisent 15 puces de détail.

### 1.2 Éléments présents que la demande ne chiffre pas (à préserver aussi)

| Élément | Relevé |
| --- | ---: |
| Logo « CK » animé (lien vers l'accueil) | 1 |
| Bouton de bascule thème clair / sombre | 1 |
| § 01 : fiche profil (Formation, Disponibilité, Base, Statut) | 4 |
| § 01 : photo de profil | 1 |
| § 03 : puces de détail des 7 entrées | 15 |
| § 03 : légende (● expérience professionnelle, ○ formation) | 1 |
| Bandeau « Réseaux · Cloud · Automatisation » (avant § 07) | 1 |
| Titres h2 des 7 sections | 7 |
| Sections avec ancre (#apropos … #contact) | 7 |
| entrées de la palette Ctrl+K (généré par JavaScript) | 18 |
| bouton Ctrl K dans la barre (généré par JavaScript) | 0 |
| Barre de progression, rideau d'entrée (1re visite), curseur personnalisé, toast, halo/inclinaison des cartes, effet magnétique des boutons (JavaScript) | présents |

### 1.3 Pages du site

| Page | Éléments `<body>` | Textes | Liens | Titre `<title>` |
| --- | ---: | ---: | ---: | --- |
| `index.html` | 469 | 265 | 22 | Camyl Khebache · Étudiant ingénieur Réseaux et Télécoms, stage 2027 |
| `projets/index.html` | 77 | 46 | 14 | Projets · Camyl Khebache |
| `projets/symfony-docker.html` | 76 | 43 | 13 | Application Symfony conteneurisée · Camyl Khebache |
| `projets/jeu-2048.html` | 70 | 38 | 14 | Jeu web 2048 · Camyl Khebache |
| `projets/portfolio.html` | 73 | 41 | 14 | Portfolio personnel · Camyl Khebache |

Pages de projet (détail) : `.page-head` 1, sections de détail 5 (Contexte, Problème, Solution, Technologies, Résultats) et lien de pager 1, sur chacune des 3 pages ; la page liste contient les 3 projets.

### 1.4 Longueur du site (hauteur de page, en px, mouvement réduit)

| Largeur · thème | `index.html` | `projets/index.html` | `projets/symfony-docker.html` | `projets/jeu-2048.html` | `projets/portfolio.html` |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280px light | 7238 | 1159 | 1661 | 1508 | 1629 |
| 1280px dark | 7238 | 1159 | 1661 | 1508 | 1629 |
| 390px light | 9486 | 1676 | 2020 | 1679 | 1924 |
| 390px dark | 9486 | 1676 | 2020 | 1679 | 1924 |

### 1.5 Empreinte du contenu (avant)

Somme de contrôle (SHA-256 tronqué) de la liste triée de tous les textes de chaque page : permet de prouver que le contenu est identique.

| Page | Textes | Empreinte |
| --- | ---: | --- |
| `index.html` | 265 | `0fc4c3e204a7` |
| `projets/index.html` | 46 | `362aadf41813` |
| `projets/symfony-docker.html` | 43 | `878010e8286f` |
| `projets/jeu-2048.html` | 38 | `9767bb507f16` |
| `projets/portfolio.html` | 41 | `44a12128a5c8` |

### 1.6 Palette Ctrl+K (18 entrées)

`À propos§ 01` · `Projets§ 02` · `Parcours§ 03` · `Compétences§ 04` · `Certifications§ 05` · `Langues§ 06` · `Contact§ 07` · `Tous les projetsliste` · `Application Symfony conteneurisée2025` · `Jeu web 20482025` · `Portfolio personnel2026` · `Télécharger mon CVPDF` · `Copier mon e-mailcamyl.khebache@gmail.com` · `Écrire un e-mailmailto` · `Appeler06 73 60 88 94` · `GitHub↗` · `LinkedIn↗` · `Basculer thème clair / sombrethème`

---

## 2. Comparaison « avant » → « après » (refonte)

### 2.1 Compteurs

| Élément | Avant | Après | Δ | Verdict |
| --- | ---: | ---: | ---: | :---: |
| lien d'évitement (.skip) | 1 | 1 | +0 | ✓ |
| liens de navigation (.menu a) | 6 | 6 | +0 | ✓ |
| bouton Contact (.nav-contact) | 1 | 1 | +0 | ✓ |
| boutons du hero | 2 | 2 | +0 | ✓ |
| titre h1 | 1 | 1 | +0 | ✓ |
| lignes du terminal (.term-body .l) | 8 | 12 | +4 | ✓ |
| chiffres clés (.stats li) | 4 | 4 | +0 | ✓ |
| listes de technologies (.mq) | 2 | 2 | +0 | ✓ |
| technologies affichées (.mq span) | 26 | 26 | +0 | ✓ |
| thèmes (.focus > div) | 3 | 3 | +0 | ✓ |
| nœuds de l'illustration (.topo .hop) | 5 | 5 | +0 | ✓ |
| projets (.project) | 3 | 3 | +0 | ✓ |
| liens de projet (.project h3 a) | 3 | 3 | +0 | ✓ |
| lien « Voir tous les projets » | 1 | 1 | +0 | ✓ |
| entrées du parcours (.timeline > li) | 7 | 7 | +0 | ✓ |
| catégories de compétences (.skill-tab) | 4 | 4 | +0 | ✓ |
| compétences (.chips li) | 23 | 23 | +0 | ✓ |
| panneaux de compétences (.skill-panel) | 4 | 4 | +0 | ✓ |
| attestations (.cert) | 4 | 4 | +0 | ✓ |
| langues (.langs li) | 6 | 6 | +0 | ✓ |
| liens de contact (.contact-list a) | 4 | 3 | -1 | ✓ voulu (adresse e-mail non cliquable, demande § 07) |
| téléchargement du CV (a[download]) | 1 | 1 | +0 | ✓ |
| pied de page (footer) | 1 | 1 | +0 | ✓ |
| sections numérotées (.eyebrow) | 7 | 7 | +0 | ✓ |
| logo (.brand) | 1 | 1 | +0 | ✓ |
| bouton thème (.theme-toggle) | 1 | 1 | +0 | ✓ |
| lignes de la fiche profil (.kv dt) | 4 | 4 | +0 | ✓ |
| photo (img) | 1 | 1 | +0 | ✓ |
| puces du parcours (.timeline li ul li) | 15 | 15 | +0 | ✓ |
| légende (.legend) | 1 | 1 | +0 | ✓ |
| bandeau de texte (.bigtext) | 1 | 1 | +0 | ✓ |
| titres de section h2 | 7 | 7 | +0 | ✓ |
| sections avec ancre (section[id]) | 7 | 7 | +0 | ✓ |
| mots animés dans les titres (.w) (JavaScript) | 27 | 27 | +0 | ✓ |
| onglet de compétences actif (JavaScript) | 1 | 1 | +0 | ✓ |
| panneau de compétences actif (JavaScript) | 1 | 1 | +0 | ✓ |
| photo affichée (.portrait visible) (JavaScript) | 1 | 1 | +0 | ✓ |
| entrées de la palette Ctrl+K (JavaScript) | 18 | 19 | +1 | ✓ |
| bouton Ctrl K dans la barre (JavaScript) | 0 | 0 | +0 | ✓ |

### 2.2 Contenu textuel, liens, images : élément par élément

| Page | Textes avant | Textes après | Absents après | Liens avant → après | Images | Éléments `<body>` avant → après |
| --- | ---: | ---: | ---: | ---: | :---: | ---: |
| `index.html` | 265 | 318 | 0 | 22 → 22 | = | 469 → 605 |
| `projets/index.html` | 46 | 67 | 0 | 14 → 14 | = | 77 → 110 |
| `projets/symfony-docker.html` | 43 | 64 | 0 | 13 → 13 | = | 76 → 109 |
| `projets/jeu-2048.html` | 38 | 59 | 0 | 14 → 14 | = | 70 → 103 |
| `projets/portfolio.html` | 41 | 62 | 0 | 14 → 14 | = | 73 → 106 |

Seuls remplacements de texte, documentés et voulus : les numéros de section `§ 01 … § 07` deviennent des numéros de hop (`hop 01 … hop 07`), dans la page d'accueil et dans la palette Ctrl+K (`§ NN` → `hop NN`).

Écarts **voulus par la demande** (§ 07 Contact) : (1) l’adresse e-mail reste affichée mais n’est plus un lien cliquable (liens de contact 4 → 3) ; (2) les boutons « Contact » du menu (toutes les pages) et « Me contacter » du hero pointent vers `mailto:camyl.khebache@gmail.com` au lieu de `#contact` ; (3) nouveau bouton « Cliquez ici pour me contacter » (mailto). Aucun texte n’a été retiré.

### 2.3 Libellés de navigation

Les libellés d'origine **restent visibles** (À propos, Projets, Parcours, Compétences, Certifications, Langues, Contact). Chaque lien reçoit en plus un numéro de hop, une latence fictive en ms (qui varie légèrement) et, au survol ou au focus, une adresse IP fictive. Ces ajouts sont décoratifs (`aria-hidden`) : le nom accessible du lien reste son libellé d'origine. Toutes les ancres et tous les liens sont conservés.

| Lien | Hop | Latence de départ | IP fictive (survol) |
| --- | :-: | ---: | --- |
| À propos | 01 | 2 ms | `10.57.1.1 · apropos.camyl.lan` |
| Projets | 02 | 5 ms | `10.57.2.1 · projets.camyl.lan` |
| Parcours | 03 | 9 ms | `10.57.3.1 · parcours.camyl.lan` |
| Compétences | 04 | 14 ms | `10.57.4.1 · competences.camyl.lan` |
| Certifications | 05 | 21 ms | `10.57.5.1 · certifications.camyl.lan` |
| Langues | 06 | 27 ms | `10.57.6.1 · langues.camyl.lan` |

### 2.4 Éléments décoratifs ajoutés (tous `aria-hidden`, aucun ne remplace un contenu)

- 6 numéros de hop et latences en ms dans la navigation (en-tête)
- 6 bulles d'IP fictive : au survol ou au focus clavier sur ordinateur, toujours visibles dans le menu mobile
- 7 numéros « hop NN » et 7 latences sur les titres de section (les numéros remplacent « § NN »)
- 1 ligne de commande « traceroute » en haut du hero
- 4 lignes ajoutées au terminal du hero : 1 commande ping + 3 réponses (le terminal passe de 8 à 12 lignes ; les 8 lignes d'origine sont inchangées)
- 1 ligne de fin de traceroute dans le pied de page
- 17 latences animées au total (vibrent de 1 à 2 ms ; figées si le mouvement est réduit)
- Animations (étape 2), éléments décoratifs créés par JavaScript uniquement avec le mouvement normal, tous aria-hidden et retirés ou masqués si le mouvement est réduit : écran d'entrée « Établir la connexion » (page d'accueil, 1re visite de la session, retiré après ~2 s ; remplace l'ancien rideau), tampon « CONNECTED » (retiré après 2,4 s), indicateur de latence « Hop n/7 » en bas d'écran (1 élément fixe + 24 barres), volet de transition + paquet (créés à chaque saut de section, retirés après 1,1 s). Aucun contenu du site n'est modifié.
- Fond animé (étape 3), éléments décoratifs aria-hidden créés par JavaScript sur toutes les pages : 1 conteneur fixe « .bg-scene » = 3 photos de fond (WebP, 3 fichiers dans assets/img/bg, chargées en différé, masquables via Ctrl+K), 1 voile de lisibilité, 1 canvas animé (nœuds, liens, paquets ; statique si le mouvement est réduit) et une grille CSS. Les sections alternées et le hero deviennent légèrement translucides ; la grille propre au hero est remplacée par la grille globale du fond. 1 entrée ajoutée à la palette Ctrl+K : « Afficher / masquer les photos de fond ». 1 fichier README.md (crédits des images).
- § 03 Parcours, schémas télécom / cybersécurité (figures aria-hidden, SVG), à côté de la frise : sur ordinateur (≥ 1000 px), 1 grand schéma créé par JavaScript occupe toute la hauteur de la frise à droite (7 équipements reliés aux entrées par une dorsale : antenne 5G, serveur, pare-feu avec bouclier et cadenas, poste, routeur, cloud, TLS ; 26 liaisons ; libellés décoratifs « 5G », « SERVEUR », « PARE-FEU », « POSTE », « ROUTEUR », « CLOUD », « TLS », « // liaison sécurisée » ; une vingtaine de paquets créés par JavaScript quand le mouvement est normal). Sur téléphone et tablette, 1 petit schéma (11 nœuds) s'affiche sous la 3e entrée « BUT Informatique ». Les 7 entrées de la frise, leurs dates, intitulés et descriptions sont inchangés (la 3e entrée reçoit seulement la classe « has-art » ; le texte des entrées se replie un peu plus tôt sur ordinateur pour laisser la colonne de droite libre).
- § 07 Contact (étape 4) : 1 bloc de droite « .contact-aside » ajouté (sous les coordonnées sur téléphone) avec 1 bouton « Cliquez ici pour me contacter » (lien mailto:camyl.khebache@gmail.com) et 1 schéma réseau / cybersécurité décoratif (aria-hidden : 5 nœuds POSTE, ROUTEUR, PARE-FEU avec bouclier et cadenas, CLOUD, E-MAIL ; 4 liaisons ; légende « // message chiffré » ; 4 paquets créés par JavaScript si le mouvement est normal). Les boutons « Contact » du menu (5 pages) et « Me contacter » du hero ouvrent maintenant ce même lien mailto (ils pointaient vers #contact).
- Liens mailto (étape 4) : si aucune messagerie ne s'ouvre au clic (la fenêtre garde le focus 1,6 s), l'adresse est copiée et la bulle existante (« toast ») affiche « Aucune messagerie détectée : adresse copiée ». Aucun élément ajouté dans la page.
- § 01 À propos (étape 4) : le bloc « Réseaux / Cloud / Automatisation » et le schéma réseau sont sortis de la colonne de droite dans le HTML (ils suivent désormais le bloc de profil, au lieu d'être dans la même colonne) pour être centrés sur la page, avec 56 px d'espace sous le bloc de profil. Contenu et nombre d'éléments identiques.
- Animation d'entrée : jouée à chaque nouvel onglet ou nouvelle session, pas au rechargement de l'onglet (sessionStorage) ; jouée normalement si le stockage est indisponible.
- Animations (étape 2), CSS seul : voyant de statut après le titre du hero (pseudo-élément), chute des hops, tableau d'affichage, rotations au survol. 6 attributs style --i:N ajoutés sur les <li> des hops de chaque page.
- Purement CSS (aucun élément HTML ajouté) : en-tête « --- camyl.dev ping statistics --- » du bloc de chiffres, numéros « 01 ▸ … 07 ▸ » devant les dates du parcours, adresses IP sous les 5 nœuds de l'illustration réseau, « › » devant les libellés de contact, flèches « ▸ » du bandeau de technologies

### 2.5 Longueur du site (hauteur de page, en px)

| Largeur · thème | Page | Avant | Après | Δ | Verdict |
| --- | --- | ---: | ---: | ---: | :---: |
| 1280px light | `index.html` | 7238 | 7426 | +188 | ✓ |
| 1280px light | `projets/index.html` | 1159 | 1188 | +29 | ✓ |
| 1280px light | `projets/symfony-docker.html` | 1661 | 1690 | +29 | ✓ |
| 1280px light | `projets/jeu-2048.html` | 1508 | 1538 | +30 | ✓ |
| 1280px light | `projets/portfolio.html` | 1629 | 1658 | +29 | ✓ |
| 1280px dark | `index.html` | 7238 | 7426 | +188 | ✓ |
| 1280px dark | `projets/index.html` | 1159 | 1188 | +29 | ✓ |
| 1280px dark | `projets/symfony-docker.html` | 1661 | 1690 | +29 | ✓ |
| 1280px dark | `projets/jeu-2048.html` | 1508 | 1538 | +30 | ✓ |
| 1280px dark | `projets/portfolio.html` | 1629 | 1658 | +29 | ✓ |
| 390px light | `index.html` | 9486 | 10340 | +854 | ✓ |
| 390px light | `projets/index.html` | 1676 | 1724 | +48 | ✓ |
| 390px light | `projets/symfony-docker.html` | 2020 | 2069 | +49 | ✓ |
| 390px light | `projets/jeu-2048.html` | 1679 | 1727 | +48 | ✓ |
| 390px light | `projets/portfolio.html` | 1924 | 1972 | +48 | ✓ |
| 390px dark | `index.html` | 9486 | 10340 | +854 | ✓ |
| 390px dark | `projets/index.html` | 1676 | 1724 | +48 | ✓ |
| 390px dark | `projets/symfony-docker.html` | 2020 | 2069 | +49 | ✓ |
| 390px dark | `projets/jeu-2048.html` | 1679 | 1727 | +48 | ✓ |
| 390px dark | `projets/portfolio.html` | 1924 | 1972 | +48 | ✓ |

### 2.6 Empreinte du contenu (après)

| Page | Avant | Après |
| --- | --- | --- |
| `index.html` | `0fc4c3e204a7` | `a5d6479c39f1` (différence attendue : numéros de hop + éléments décoratifs ajoutés) |
| `projets/index.html` | `362aadf41813` | `21e07d4387b2` (différence attendue : numéros de hop + éléments décoratifs ajoutés) |
| `projets/symfony-docker.html` | `878010e8286f` | `03b1917d012b` (différence attendue : numéros de hop + éléments décoratifs ajoutés) |
| `projets/jeu-2048.html` | `9767bb507f16` | `776e324c768a` (différence attendue : numéros de hop + éléments décoratifs ajoutés) |
| `projets/portfolio.html` | `44a12128a5c8` | `cbf46cd045fc` (différence attendue : numéros de hop + éléments décoratifs ajoutés) |

**Résultat : aucun écart.** Chaque élément de l'avant est présent dans l'après, et aucun total ne diminue.
