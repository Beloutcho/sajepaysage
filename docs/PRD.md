# PRD — Nouveau site SAJE Art & Paysage

Oct 24, 2026 · @Gauthier

Ce document décrit le nouveau site de SAJE – Art & Paysage, la structure d'Alice Stevens, paysagiste-conceptrice et artiste à Laval. Il remplace le site WordPress actuel, jugé trop générique et trop difficile à maintenir, par un site statique bilingue hébergé sur GitHub Pages, modifiable directement sur la page. Il est écrit pour être confié à Claude Code, étape par étape (section « Plan de réalisation »).

## Contexte et décisions

**Problèmes du site actuel** ([sajepaysage.fr](https://sajepaysage.fr/)) : thème générique sans cohérence graphique, images mal mises en page, pages vides ou cassées, maintenance WordPress trop lourde pour quelques modifications par an.

**Objectifs**

1. Donner au travail d'Alice Stevens une vitrine élégante, poétique et professionnelle, où l'image porte le propos.
2. Permettre à un client (particulier, collectivité, structure culturelle) de comprendre l'offre et d'écrire en moins de deux minutes, sur mobile comme sur ordinateur.
3. Permettre à Alice de modifier un texte, une image ou d'ajouter un projet seule, sans outil technique, quelques fois par an.
4. Reprendre l'intégralité du contenu actuel, corrigé et enrichi.

**Décisions prises**

| Sujet | Décision |
| --- | --- |
| Technologie | HTML, CSS et JavaScript, pages statiques générées (une page par projet) |
| Hébergement | GitHub Pages, domaine sajepaysage.fr conservé chez OVH en pointage DNS |
| Langues | Français et anglais, bouton FR / EN sur chaque page |
| Administration | Page de connexion, puis édition directe sur la page en cliquant sur le texte ; impossible sans connexion |
| Contact | Formulaire qui prépare un e-mail (mailto) vers stevensajf@gmail.com |
| Direction graphique | Version B « Atelier » du canevas de maquettes, palette crème, anthracite, vert citron, violet |
| Voix | Troisième personne (Alice Stevens), y compris la page Démarche (texte remplacé en octobre 2026) ; plus aucun « je » ni « nous » |
| Témoignages | Supprimés |
| Animations | Très discrètes |

## Périmètre

**Dans le projet**

- Toutes les pages publiques en français et en anglais : accueil, démarche, liste des projets, une page par projet, cinq pages missions, contact, mentions légales, page 404.
- La migration de tout le contenu WordPress (textes et images en pleine définition), avec les corrections listées plus bas.
- Un espace d'administration : connexion, liste de tous les contenus, édition sur la page, gestion des images, ajout et masquage d'un projet, ordre des projets et du diaporama.
- Le déploiement automatique sur GitHub Pages et le basculement du domaine.
- Les redirections des anciennes adresses WordPress vers les nouvelles.

**Hors projet**

- Blog, actualités, newsletter.
- Boutique, paiement, prise de rendez-vous.
- Statistiques de visite et cookies (aucun traceur, donc aucun bandeau).
- Envoi de mail par un serveur : le formulaire prépare un message dans la messagerie du visiteur.
- Plusieurs comptes d'administration : Alice est la seule rédactrice.

## Utilisateurs et parcours

| Qui | Ce qu'il vient faire | Parcours attendu |
| --- | --- | --- |
| Particulier avec un jardin | Voir des réalisations, savoir si Alice peut l'aider | Accueil → un projet de jardin → Contact, en 3 clics |
| Collectivité, élu, technicien | Vérifier les références en espace public, l'AMO, la concertation | Accueil → mission Conception d'espaces extérieurs → projets filtrés « Espaces publics » |
| Structure culturelle, festival, école | Découvrir les installations, Silice, les ateliers | Accueil → mission Installations ou Médiation → projet → Contact |
| Visiteur anglophone | Comprendre l'offre | Bouton EN sur n'importe quelle page → même page en anglais |
| Alice Stevens | Corriger un texte, changer une photo, ajouter un projet | /admin/ → connexion → clic sur la page à modifier → modifier → Enregistrer → en ligne en 1 à 2 minutes |

Le parcours d'Alice est le critère de réussite principal : chaque modification courante doit se faire sans jamais ouvrir GitHub, un éditeur de code ou un terminal.

## Arborescence et gabarits

Le français est servi à la racine, l'anglais sous /en/, avec la même structure. Menu principal : Démarche, Projets, Missions (menu déroulant des cinq missions), bouton Contact, sélecteur FR / EN.

| Page | URL française | URL anglaise | Gabarit |
| --- | --- | --- | --- |
| Accueil | / | /en/ | accueil |
| Démarche | /demarche/ | /en/approach/ | page-texte |
| Projets | /projets/ | /en/projects/ | liste-projets |
| Un projet | /projets/\<slug>/ | /en/projects/\<slug>/ | projet |
| Missions (sommaire) | /missions/ | /en/services/ | liste-missions |
| Une mission | /missions/\<slug>/ | /en/services/\<slug>/ | mission |
| Contact | /contact/ | /en/contact/ | contact |
| Mentions légales | /mentions-legales/ | /en/legal-notice/ | page-texte |
| Administration | /admin/ | — | admin |
| Erreur | /404.html | — | 404 bilingue |

Le slug d'un projet est le même dans les deux langues. Le sélecteur FR / EN mène toujours à la page équivalente, jamais à l'accueil.

**Gabarits**

- **accueil** (maquette B, voir le canevas) : en-tête ; diaporama arrondi avec encart crème (surtitre, titre court, lien « Voir les projets ») ; bandeau violet de présentation qui passe sous le diaporama ; « À la une » : trois projets choisis, image à gauche et texte à droite avec lieu, commanditaire, partenaires ; bloc Démarche (image + citation « nous ») ; bandeau citron « Un projet en tête ? » ; pied de page anthracite.
- **liste-projets** : introduction courte, filtres en boutons (Tous, Jardins privés, Espaces publics, Art et installations, Illustration, Pédagogie), grille de cartes (image 3:2, catégorie et lieu, titre). Sans JavaScript, tous les projets s'affichent.
- **projet** : sur ordinateur, deux colonnes ; à gauche une grille d'images, à droite le texte qui reste visible au défilement (titre, accroche, descriptif, fiche : lieu, date, commanditaire, partenaires, missions). Un clic sur une image ouvre la visionneuse plein écran avec la légende ; flèches, clavier et balayage sur mobile. Sur mobile, le texte passe sous la première image. En bas : projet précédent / suivant.
- **mission** : image d'ouverture, texte, liste de ce que la mission comprend, projets liés (cartes filtrées par la catégorie correspondante), appel au contact.
- **page-texte** : colonne de lecture de 68 caractères maximum, intertitres, images pleine largeur possibles.
- **contact** : coordonnées, réseaux, formulaire (section dédiée).

## Contenu à migrer

Tout le texte du site actuel est repris, réécrit à la troisième personne là où il dit « je » ou « moi ». La source est l'API de WordPress (`/wp-json/wp/v2/pages` et `/wp-json/wp/v2/media`), qui donne le contenu complet et les images originales ; les deux PDF du projet (présentation 2026 et portfolio art) complètent les projets peu décrits.

**Sources effectivement utilisées** (étape 3 réalisée, détail dans `docs/rapport-migration.md`)

- API WordPress : 24 pages et 208 médias. Seules les pages Chaumont, Démarche, la biographie et l'introduction des Prestations contiennent du texte ; les autres pages projet ne sont que des galeries d'images.
- Dossier `Sources/` (non publié dans le dépôt) : `Présentation Saje Arts Paysage été 2026 light.pdf` (16 p.), `20260123 Portfolio Art Alice Stevens.pdf` (38 p.) et `logo saje serre couleurs.svg`. Les PDF ont été découpés : textes réécrits dans les fiches projet, les missions et la Démarche ; images extraites dans `medias/` par `outils/extraire-pdf.sh` (plans vectoriels rendus à 300 dpi). Ces images font 300 à 1 200 px (PDF « light ») : elles complètent celles du site sans les remplacer.

**Pages**

| Contenu actuel | Destination |
| --- | --- |
| Accueil : accroches Démarche, Projets, Prestations | Accueil (encart du diaporama, bandeau violet) |
| Accueil : « À propos de moi » (biographie) | Démarche, section « Alice Stevens » avec portrait, à la troisième personne |
| Accueil : trois témoignages | Supprimés |
| Démarche (texte en « nous ») | Remplacé par le texte à la troisième personne « Le paysage comme récit, le vivant comme matière » |
| Projets : introduction | Liste des projets |
| Prestations : introduction et six pages | Cinq missions (tableau suivant) |
| Contact : coordonnées, réseaux, formulaire | Contact |

**Missions** (les six prestations deviennent cinq missions)

| Nouvelle mission | Reprend | Contenu à compléter |
| --- | --- | --- |
| Conception d'espaces extérieurs | Conception de jardin, Assistance à maîtrise d'ouvrage, Valorisation de site | Déroulé des phases EP, ESQ, AVP, PRO, DCE, ACT, VISA, DET, AOR ; volet AMO (page actuelle vide) |
| Enseignement | Formation | Enseignement en design d'espace, interventions possibles des étudiants |
| Installations et performances | Installations et performance | Œuvres in situ, spectacle Silice |
| Ateliers de médiation | Médiation | Carte sensible, empreintes, collages, maquettes |
| Illustration et graphisme | Nouvelle | Plans illustrés, bande dessinée, travail d'illustratrice au sein de l'agence [Le Cocoom](https://lecocoom.fr/lagence/) (Laval) |

**Projets** (catégories proposées, à valider par Alice ; un projet peut en avoir plusieurs)

| Projet | Adresse actuelle | Catégorie proposée | État |
| --- | --- | --- | --- |
| Prairie ludique | /amenagement-public/ | Espaces publics | À migrer |
| Bande-dessinée Paysage | /bande-dessinee-paysage/ | Illustration | À migrer |
| Campaneta (Onda, Espagne) | /campaneta/ | Pédagogie, Espaces publics | À migrer |
| Château de la Roche | /chateau-de-la-roche/ | Espaces publics | À migrer |
| Château des Arcis (Demeure des paysages) | /chateau-des-arcis/ | Art et installations | À migrer |
| Chaumont-sur-Loire (L'Île de la Félicité) | /chaumont-sur-loire/ | Art et installations | À migrer |
| Cueillette Andrya | /cueillette-andrya/ | À confirmer | À migrer |
| Festival Casc | /festival-casc/ | Pédagogie, Art et installations | À migrer |
| Jardin Eve | /jardin-eve/ | Jardins privés | À migrer |
| Jardin Madda | /jardin-madda/ | Jardins privés | À migrer |
| Jardin Marjamin | /jardin-marjamin/ | Jardins privés | À migrer |
| Siège CADDIF | /siege-caddif/ | À confirmer | À migrer |
| Silice | /silice/ | Art et installations | À migrer |
| Parc naturel des Îlots Changeants (Yzernay) | aucune | Espaces publics | Rédigé d'après la présentation 2026 |
| Jardin Laurrière | aucune | Jardins privés (à confirmer) | Créé masqué, texte et images à fournir par Alice |
| Potager du Roi (illustration, ENSP Versailles) | aucune | Illustration | Ajouté d'après la présentation et le portfolio |
| Cour d'école Jean-Baptiste Galan (Laigné Saint-Gervais) | aucune | Espaces publics, Pédagogie | Ajouté d'après la présentation 2026 |
| Douceur Power (exposition) | aucune | Art et installations | Ajouté d'après le portfolio |
| Bestiaire des paysages lasséens | aucune | Illustration, Art et installations | Ajouté d'après le portfolio |

État après migration : les 13 projets WordPress sont dans `/contenu/projets/` avec leurs images en pleine définition. Sept d'entre eux (jardins Eve, Madda, Marjamin, Siège CADDIF, Cueillette Andrya, Château de la Roche, Prairie ludique) n'ont aucun texte dans les sources : seuls le titre, les images et leurs textes alternatifs sont en place (voir `docs/rapport-contenu.md`).

**Anomalies du site actuel, à ne pas reproduire**

- « Parc des Ilôts Changeants » et « Jardin Laurrière » renvoient vers la page Silice.
- La page Assistance à maîtrise d'ouvrage est vide.
- La page Contact affiche des images cassées d'un ancien thème (domaine tyler.com).
- Trois prestations n'ont pas d'adresse lisible (?page\_id=233, 236, 239).
- Les fiches projet n'ont ni lieu, ni date, ni commanditaire : les compléter depuis les PDF, sinon laisser le champ vide (jamais d'information inventée).

## Direction graphique

La référence est la version B « Atelier » du [canevas de maquettes](https://claude.ai/artifact/No7CzhiPhwbN7MpRCJQgYd) : l'exporter en HTML et la placer dans `docs/maquette/` du dépôt. Les versions A et C ne servent plus.

**Couleurs** (variables CSS)

| Variable | Valeur | Usage |
| --- | --- | --- |
| `--creme` | #F3EEE3 | Fond général |
| `--creme-fonce` | #E9E2D3 | Fonds de section, fond des images en chargement |
| `--carte` | #FBF8F2 | Cartes |
| `--filet` | #D8D0BF | Filets, bordures |
| `--anthracite` | #2A2C2E | Texte, pied de page, bouton du bandeau citron |
| `--texte-2` | #4A4C4E | Texte secondaire |
| `--violet` | #74508F | Bandeau de présentation, bouton Contact, liens, étiquettes |
| `--citron` | #CDDC4B | Bandeau « Un projet en tête ? », petits accents ; jamais en couleur de texte sur fond clair |

Contrastes vérifiés à viser : texte violet sur crème et blanc sur violet ≥ 4,5:1.

**Typographie** : titres en Fraunces (300 à 500), texte courant en Source Sans 3 (400 et 600), toutes deux hébergées sur le site (pas d'appel à Google Fonts). Corps 17 px, titres de 28 à 44 px sur ordinateur, réduits d'environ 30 % sur mobile.

**Logo** : le logo SAJE actuel, conservé, en SVG (à fournir). La maquette utilise un mot « SAJE » provisoire.

**Formes** : coins arrondis 12 px (cartes, images) et 16 px (diaporama) ; boutons en pilule ; marges latérales 32 px sur ordinateur, 16 px sur mobile ; largeur de contenu 1280 px.

**Diaporama d'accueil**

- Défilement automatique toutes les 6 secondes, fondu enchaîné de 1,2 seconde.
- Pause au survol, au focus clavier et dès qu'on utilise une flèche ou un point.
- Bouton pause / lecture visible (obligatoire pour l'accessibilité).
- Aucun défilement automatique si le visiteur a activé « réduire les animations ».
- Chaque diapositive : une image, un texte alternatif, une légende courte (projet et lieu) et un lien vers le projet.

**Animations** : apparition en fondu léger (opacité et 12 px de déplacement) des blocs au défilement, survols de 150 ms ; tout est désactivé avec « réduire les animations ». Ni parallaxe, ni effet de zoom.

## Architecture technique

Le contenu vit dans des fichiers JSON ; Eleventy (11ty) les transforme en pages HTML statiques ; une GitHub Action reconstruit et publie le site sur GitHub Pages à chaque modification du dépôt. Le site publié ne contient que du HTML, du CSS et du JavaScript sans dépendance.

**Choix**

- **Générateur** : Eleventy 3, gabarits Nunjucks. Il produit du HTML pur, une page par projet, sans framework côté visiteur.
- **JavaScript visiteur** : modules natifs, sans bibliothèque (diaporama, filtres, visionneuse, menu mobile, formulaire). Le site reste lisible sans JavaScript.
- **Images** : `@11ty/eleventy-img` génère des versions de 480, 960, 1600 et 2400 px en AVIF, WebP et JPEG, avec `srcset`, `loading="lazy"` et dimensions fixées.
- **Dépôt** : public (condition de GitHub Pages gratuit), aucune donnée secrète dedans.
- **Déploiement** : GitHub Action officielle Pages, déclenchée à chaque commit sur `main`.

**Structure du dépôt**

```
/contenu/
  site.json            coordonnées, réseaux, textes communs FR/EN
  accueil.json         diaporama, bandeau, projets à la une
  pages/demarche.json, contact.json, mentions-legales.json
  missions/<slug>.json
  projets/<slug>.json
/medias/projets/<slug>/  images originales (2400 px max)
/medias/pages/
/src/
  _includes/           gabarits Nunjucks
  css/  js/  polices/
  admin/               interface d'administration
/docs/                 PRD, maquette exportée
.eleventy.js
.github/workflows/deploy.yml
CNAME                  sajepaysage.fr
```

**Modèle d'un projet** (`contenu/projets/chaumont-sur-loire.json`)

```json
{
  "slug": "chaumont-sur-loire",
  "publie": true,
  "ordre": 3,
  "categories": ["art-installations"],
  "lieu": "Chaumont-sur-Loire (41)",
  "date": "",
  "commanditaire": "",
  "partenaires": "Aude Seigneur, Raphaël Fenoglio, Jean-Christophe Ravaux",
  "missions": ["installations-performances"],
  "fr": { "titre": "L'Île de la Félicité", "accroche": "…", "descriptif": "…" },
  "en": { "titre": "The Island of Felicity", "accroche": "…", "descriptif": "…" },
  "couverture": "01.jpg",
  "images": [
    { "fichier": "01.jpg", "alt": { "fr": "…", "en": "…" }, "legende": { "fr": "…", "en": "…" } }
  ]
}
```

Le descriptif accepte un Markdown réduit : paragraphes, gras, italique, liens. Un champ vide n'est pas affiché. Si la version anglaise d'un texte manque, la page anglaise affiche le français avec la mention « Text available in French only ».

## Administration et édition sur la page

Alice modifie le site depuis le site lui-même : chaque enregistrement devient un commit dans le dépôt via l'API GitHub, puis le site se reconstruit et se met en ligne en une à deux minutes.

&#91;embedded content: publication d'une modification · 6 étapes\]

Alice n'intervient qu'à la première étape ; tout le reste est automatique.

**Connexion**

- Page /admin/ : un champ « Clé d'accès » où Alice colle, une fois par appareil, un jeton GitHub à portée limitée (fine-grained token : ce seul dépôt, droit Contents en lecture et écriture, validité un an).
- Le jeton est vérifié auprès de l'API GitHub puis gardé dans le navigateur (localStorage). Un bouton « Se déconnecter » l'efface.
- Sans jeton valide, aucun outil d'édition n'est chargé : un petit script ne charge `editeur.js` que si un jeton est présent. Un visiteur ne voit rien et, même en forçant l'interface, ne peut rien enregistrer.
- Le tableau de bord prévient 30 jours avant l'expiration du jeton et rappelle comment en créer un nouveau (procédure illustrée dans `docs/aide-admin.md`).
- Évolution possible : connexion « Se connecter avec GitHub » via un petit relais OAuth sur Cloudflare Workers, si la saisie du jeton s'avère gênante.

**Tableau de bord /admin/**

- Liste de tous les contenus : accueil, démarche, contact, mentions légales, cinq missions, tous les projets, avec pour chacun publié ou masqué, version anglaise complète ou non, et un bouton « Modifier sur la page ».
- Bouton « Nouveau projet » : titre français, catégories ; crée le fichier en état masqué et ouvre sa page en mode édition une fois construite.
- Ordre des projets, choix des images du diaporama et des trois projets « À la une » : listes avec boutons monter / descendre (et glisser-déposer sur ordinateur).
- État de la mise en ligne : « en cours », « en ligne » ou « erreur », lu dans les GitHub Actions.
- Historique : les 20 dernières modifications, avec « Revenir à cette version » pour un fichier.

**Mode édition sur la page**

- Une barre fixe en haut : nom de la page, bascule FR / EN, Enregistrer, Annuler, Quitter. Le bouton Enregistrer indique le nombre de modifications en attente.
- Chaque texte modifiable porte un attribut `data-champ` (par exemple `projets/chaumont-sur-loire:fr.titre`) ; il s'entoure d'un pointillé violet au survol et devient éditable au clic.
- Titres et champs courts : texte brut. Descriptifs : petite barre d'outils gras, italique, lien, convertie en Markdown à l'enregistrement.
- Les champs vides de la fiche projet (lieu, date, commanditaire, partenaires) apparaissent en mode édition seulement, avec un texte d'invite.
- Catégories, statut publié / masqué et ordre : panneau latéral sur la page projet.

**Images**

- Sur chaque image en mode édition : remplacer, supprimer, déplacer, modifier le texte alternatif et la légende.
- « Ajouter des images » accepte plusieurs fichiers, y compris depuis un téléphone.
- Avant envoi, le navigateur redimensionne l'image à 2400 px maximum (JPEG qualité 85) et supprime les métadonnées EXIF, dont la position GPS.
- Le texte alternatif est obligatoire avant enregistrement.

**Enregistrement**

- Toutes les modifications d'une session partent en un seul commit (API Git Trees), message « Modification : \<page> (admin) ».
- Avant d'écrire, l'outil vérifie que le fichier n'a pas changé depuis son ouverture ; sinon il prévient au lieu d'écraser.
- Après l'enregistrement : « Enregistré. En ligne dans environ 2 minutes », puis suivi de l'état de la GitHub Action.
- Le contenu Markdown est nettoyé à la génération (liste blanche de balises) pour éviter toute injection de code.

**Sécurité**

- Aucun script tiers sur le site ; Content-Security-Policy par balise meta limitant les connexions à `api.github.com`.
- Jeton limité à un seul dépôt ; rien de secret dans le dépôt public.
- Un projet supprimé reste récupérable dans l'historique Git ; le tableau de bord propose d'abord de le masquer.

## Formulaire de contact

Le formulaire ne passe par aucun serveur : au clic sur « Préparer mon message », il ouvre la messagerie du visiteur avec un e-mail déjà rempli vers stevensajf@gmail.com.

**Champs**

| Champ | Type | Obligatoire |
| --- | --- | --- |
| Nom | texte | oui |
| E-mail | e-mail | oui |
| Téléphone | téléphone | non |
| Type de projet | liste : jardin privé, espace public, installation ou performance, atelier de médiation, enseignement, illustration, autre | oui |
| Commune du projet | texte | non |
| Budget envisagé | liste : moins de 5 000 €, 5 000 à 15 000 €, 15 000 à 50 000 €, plus de 50 000 €, je ne sais pas | non |
| Échéance souhaitée | texte libre | non |
| Message | zone de texte | oui |

Les tranches de budget sont une proposition, à valider par Alice.

**Fonctionnement**

- Validation dans le navigateur, avec messages d'erreur à côté du champ concerné.
- Le lien `mailto:` est construit avec un objet « Projet de jardin privé — Nom » et un corps reprenant chaque champ sur sa ligne, encodé correctement (accents, retours à la ligne).
- Message affiché après le clic : « Votre messagerie va s'ouvrir avec votre message prêt à envoyer. Rien ne s'ouvre ? Copiez le message ou écrivez directement à stevensajf@gmail.com. » avec un bouton « Copier le message » et l'adresse cliquable.
- Pas de pièce jointe possible : le texte invite à envoyer des photos du lieu en réponse au premier échange.
- Aucune donnée n'est stockée ni transmise par le site.

## Qualité, référencement et obligations légales

**Accessibilité** (niveau AA des WCAG 2.2)

- Navigation complète au clavier, focus visible, lien d'évitement « Aller au contenu ».
- Vrais boutons et liens, `aria-pressed` sur les filtres, visionneuse en `dialog` avec retour du focus.
- Texte alternatif sur chaque image, `lang` correct sur chaque page, titres hiérarchisés.
- Zones cliquables de 44 px minimum, contrastes conformes, respect de « réduire les animations ».
- Page « Accessibilité » non requise pour une entreprise de cette taille, mais une ligne dans les mentions légales indique comment signaler un problème.

**Performance** (cibles mesurées avec Lighthouse sur mobile)

- Score Performance ≥ 90 sur l'accueil et une page projet.
- Image principale de l'accueil préchargée ; toutes les autres en chargement différé.
- Polices en WOFF2 hébergées sur le site, `font-display: swap`.
- Moins de 30 Ko de JavaScript visiteur.

**Référencement**

- Balises `title` et `description` propres à chaque page et langue (modifiables dans l'admin).
- `hreflang` FR / EN et `x-default` vers le français, `sitemap.xml`, `robots.txt`.
- Balises Open Graph avec l'image de couverture pour le partage.
- Données structurées `LocalBusiness` (SAJE, Laval) sur l'accueil.
- Les projets masqués portent `noindex` et n'apparaissent ni dans les listes ni dans le sitemap.

**Mentions légales et RGPD**

- Page obligatoire : nom et statut de l'entreprise, SIRET, adresse, directrice de la publication, contact, hébergeur (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis), crédits photos.
- Aucun cookie, aucun traceur, aucune police chargée chez un tiers : pas de bandeau de consentement.
- Le formulaire n'envoie rien au site ; la politique de confidentialité tient en un paragraphe dans les mentions légales.

## Mise en ligne

Le nouveau site est d'abord testé à l'adresse GitHub (`<compte>.github.io/<depot>/`), puis le domaine bascule en une fois ; le WordPress reste en place jusqu'à la vérification finale.

**Bascule du domaine** (d'après la [documentation GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site))

1. Vérifier le domaine dans les réglages du compte GitHub (enregistrement TXT fourni par GitHub), avant toute modification DNS.
2. Ajouter `sajepaysage.fr` dans les réglages Pages du dépôt (fichier `CNAME`).
3. Chez OVH, remplacer les enregistrements de l'hébergement WordPress par :

| Enregistrement | Nom | Valeur |
| --- | --- | --- |
| A | sajepaysage.fr | 185.199.108.153 |
| A | sajepaysage.fr | 185.199.109.153 |
| A | sajepaysage.fr | 185.199.110.153 |
| A | sajepaysage.fr | 185.199.111.153 |
| AAAA | sajepaysage.fr | 2606:50c0:8000::153 (et 8001, 8002, 8003) |
| CNAME | www | \<compte>.github.io |

4. Ne toucher ni aux enregistrements MX ni aux autres services du domaine.
5. Activer « Enforce HTTPS » dès qu'il est proposé (jusqu'à 24 h).
6. Résilier l'hébergement WordPress chez OVH seulement après deux semaines sans problème, en gardant une sauvegarde complète.

**Redirections des anciennes adresses**

GitHub Pages ne gère pas les redirections côté serveur : Eleventy génère, pour chaque ancienne adresse, une petite page avec `meta refresh`, `link rel="canonical"` et un lien visible vers la nouvelle page.

| Ancienne adresse | Nouvelle adresse |
| --- | --- |
| /\<slug-projet>/ (13 projets) | /projets/\<slug>/ |
| /amenagement-public/ | /projets/prairie-ludique/ |
| /prestations/ | /missions/ |
| /assistance-a-maitrise-douvrage/, /valorisation-de-site/, ?page\_id=233 | /missions/conception-espaces-exterieurs/ |
| ?page\_id=236 | /missions/enseignement/ |
| ?page\_id=239 | /missions/installations-performances/ |
| /mediation/ | /missions/ateliers-mediation/ |

Les adresses `?page_id=` arrivent sur l'accueil (/) : un court script de l'accueil lit le paramètre et renvoie vers la bonne mission.

## Plan de réalisation pour Claude Code

Sept étapes, chacune livrée, vérifiée et validée avant la suivante. Placer ce PRD dans `docs/PRD.md` et un `CLAUDE.md` à la racine qui y renvoie et rappelle les règles : textes à la troisième personne sauf Démarche, aucune information inventée, aucun script tiers, contenu uniquement dans `/contenu/`.

1. **Socle et déploiement**
   - Dépôt, Eleventy, structure de dossiers, GitHub Action de déploiement, page « en construction » en ligne sur `<compte>.github.io`.
   - Validé quand : un commit sur `main` met le site à jour sans intervention.
2. **Thème et accueil**
   - Variables de couleurs, polices auto-hébergées, en-tête, pied de page, sélecteur FR / EN, menu mobile, accueil conforme à la maquette B avec diaporama complet.
   - Validé quand : l'accueil correspond à la maquette sur ordinateur et reste lisible à 360 px de large ; le diaporama respecte toutes les règles de la direction graphique.
3. **Migration du contenu**
   - Script `outils/migrer-wordpress.mjs` : lecture de l'API WordPress, création des JSON, téléchargement des images originales, rapport des champs vides.
   - Validé quand : les 13 projets, la démarche, la biographie et les textes des prestations sont dans `/contenu/`, images comprises, et le rapport liste ce qui manque.
4. **Gabarits des pages**
   - Liste des projets avec filtres, page projet avec visionneuse, cinq missions, démarche, contact (mailto), mentions légales, 404, redirections.
   - Validé quand : chaque page de l'arborescence existe en français, tous les liens internes fonctionnent, la visionneuse s'utilise au clavier et au doigt.
5. **Version anglaise**
   - Traduction de tous les textes dans les champs `en`, pages /en/, `hreflang`.
   - Validé quand : le sélecteur mène toujours à la page équivalente ; la liste des traductions est relue par Alice.
6. **Administration**
   - /admin/ (connexion par jeton, tableau de bord), mode édition sur la page, images, nouveau projet, ordre, historique, état du déploiement, `docs/aide-admin.md` illustré.
   - Validé quand : Alice, seule et sans aide, corrige un texte, remplace une photo depuis son téléphone et crée un projet masqué puis le publie.
7. **Contrôles et bascule**
   - Lighthouse, test clavier, vérification des contrastes, sitemap, bascule DNS, HTTPS, test des anciennes adresses.
   - Validé quand : les cibles de la section Qualité sont atteintes et sajepaysage.fr sert le nouveau site en HTTPS.

Conseil d'usage : une session Claude Code par étape, en commençant par lui demander de relire le PRD et de proposer son plan pour l'étape avant d'écrire du code.

## À fournir et questions ouvertes

Mise à jour du 24 octobre 2026 : les éléments trouvés dans les PDF et le logo du dossier `Sources/` sont intégrés. Les réponses marquées « proposé » sont en place sur le site et restent à valider par Alice.

**À fournir avant l'étape indiquée**

- [ ] Compte GitHub et nom du dépôt (étape 1), à reporter dans `contenu/site.json` (`github.depot`)
- [x] Logo SAJE en SVG : `Sources/logo saje serre couleurs.svg`, découpé par `outils/decouper-logo.mjs` (mot « SAJE Art&Paysage » en ligne dans l'en-tête et le pied de page, serre en icône du site)
- [ ] Photos en haute définition : celles de WordPress suffisent ; à fournir seulement pour les images issues des PDF (300 à 1 200 px : jardin réalisé de Chaumont, Silice au musée, Douceur Power, Bestiaire, Potager du Roi, ateliers de Laigné)
- [x] Texte du Parc naturel des Îlots Changeants : présentation 2026, p. 8-9
- [ ] Texte et images du Jardin Laurrière (projet créé masqué)
- [ ] Textes des sept projets sans description (liste dans `docs/rapport-contenu.md`)
- [x] Portrait d'Alice : `Alice-Stevens-1204-HD` de la médiathèque WordPress (même séance que celui des PDF) ; crédit du photographe à fournir
- [~] Mentions légales : SIRET 450 982 830 00025, statut (entrepreneure salariée de COODEM 53, Maison des Artistes) et adresse (48 rue du Bas des Bois, Laval) repris de la présentation ; à confirmer (SIRET d'Alice ou de la coopérative ? adresse à publier ?) ; crédits photos à compléter
- [ ] Accès à la zone DNS OVH de sajepaysage.fr (étape 7)

**Questions à trancher**

- [~] Catégories : proposées ci-dessus. Siège CADDIF classé « Espaces publics » (esplanade urbaine), Cueillette Andrya « Jardins privés » : à confirmer.
- [x] Potager du Roi et autres références de la présentation 2026 : ajoutés (Potager du Roi, cour d'école de Laigné Saint-Gervais ; Campaneta enrichi). Ajoutés aussi depuis le portfolio : Douceur Power et le Bestiaire des paysages lasséens. Chacun peut être masqué depuis l'administration.
- [ ] Illustrations réalisées pour les clients du CoCoom : aucune n'est montrée pour l'instant ; la mission Illustration mentionne seulement l'agence.
- [~] Tranches de budget : proposition du PRD reprise telle quelle.
- [~] Diaporama (proposé) : Chaumont-sur-Loire, Jardin Madda, Prairie ludique, Silice, el CASC. À la une (proposé, comme la maquette) : Îlots Changeants, Île de la Félicité, Demeure des paysages.
- [~] Téléphone : affiché en clair (comme sur le site actuel) ; se désactive par `afficherTelephone` dans `contenu/site.json`.
