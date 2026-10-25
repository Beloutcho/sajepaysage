# Rapport de migration

Migration du contenu de sajepaysage.fr (WordPress) et des documents du dossier `Sources/` vers `/contenu/` et `/medias/`, réalisée le 24 octobre 2026. Le relevé automatique des champs vides est dans `docs/rapport-contenu.md` (`npm run verifier`).

## Sources

| Source | Ce qu'elle contenait | Outil |
| --- | --- | --- |
| API WordPress (24 pages, 208 médias) | Textes de Chaumont, Démarche, biographie, introductions Projets et Prestations ; toutes les galeries d'images | `outils/migrer-wordpress.mjs` |
| Présentation Saje Arts Paysage été 2026 (16 p.) | CV, texte « Le paysage comme récit », Laigné Saint-Gervais, Yzernay, Chaumont, Campaneta, Potager du Roi, coordonnées et SIRET | `outils/extraire-pdf.sh` |
| Portfolio Art Alice Stevens 2026 (38 p.) | CV artistique, démarche artistique, Silice et Silice en Naïf, Chaumont, Demeure des paysages, Douceur Power, Potager du Roi, Bestiaire lasséen, el CASC | `outils/extraire-pdf.sh` |
| `logo saje serre couleurs.svg` | Logo complet (mot + serre) | `outils/decouper-logo.mjs` |
| PDF joint à l'ancienne page Château des Arcis (août 2024) | Note d'intention de la Demeure des paysages | lecture seule, pour vérifier les faits |

Le dossier `Sources/` est exclu du dépôt (`.gitignore`) : les PDF contiennent le CV complet, l'adresse et le téléphone d'Alice, et le dépôt doit être public pour GitHub Pages.

## Découpage des PDF

| Contenu du PDF | Nouvel emplacement |
| --- | --- |
| Présentation p. 5 « Démarche » (le déjà-là, la pluridisciplinarité, la transmission, le paysage résilient) | Page Démarche, section « Le paysage comme récit, le vivant comme matière » |
| CV des deux PDF | Page Démarche, section « Parcours » ; textes des missions Enseignement, Installations, Médiation, Illustration |
| Portfolio p. 6 « Démarche artistique » (à la 1re personne) | Mission Installations et performances, réécrit à la 3e personne |
| Présentation p. 6-7 (Laigné Saint-Gervais) | Nouveau projet « La cour-jardin de l'école Jean-Baptiste Galan » : texte, plan d'esquisse et plan des conflits (vectoriels, rendus à 300 dpi), dessin d'enfant, photos d'ateliers |
| Présentation p. 8-9 (Yzernay) | Projet « Le parc naturel des Îlots Changeants » : texte, plan, croquis, coupe |
| Présentation p. 10-11, portfolio p. 16-19 (Chaumont) | Projet L'Île de la Félicité : photos du jardin réalisé (absentes de WordPress), compléments du texte (galets de verre, dates d'ouverture) |
| Présentation p. 12-13 (Campaneta) | Projet Campaneta : texte, encadrement, partenaires |
| Présentation p. 14-15, portfolio p. 28-31 (Potager du Roi) | Nouveau projet ; plan à vue d'oiseau recomposé à partir des deux moitiés du portfolio ; panneaux ; image d'ouverture de la mission Illustration |
| Portfolio p. 7-15 (Silice) | Projet Silice : texte, représentations, partie « Silice en Naïf », photos de Beaulieu-sur-Oudon et du MANAS |
| Portfolio p. 20-23 (Château des Arcis) | Projet La Demeure des paysages : texte, photo de la tente installée, détails du tissu |
| Portfolio p. 24-27 (Douceur Power) | Nouveau projet : texte, affiche, œuvres avec leurs légendes, vue de l'exposition |
| Portfolio p. 32-33 (Bestiaire lasséen) | Nouveau projet : texte, deux œuvres |
| Portfolio p. 34-36 (el CASC) | Projet Festival Casc : texte, photo de l'anneau |
| Couverture de la présentation (ombres de feuillages) | Accueil, bloc Démarche (comme la maquette) |
| Illustration de couverture du portfolio, photos d'Alice au travail | Mission Installations et performances |
| Fin de la présentation : SIRET, statut, adresse | Mentions légales |

## Corrections faites en reprenant les sources

- Chaumont-sur-Loire est noté « (53) » sur les pages projet des PDF : corrigé en (41), comme dans le CV.
- Le texte WordPress de Chaumont disait « notre jardin » : passé à la troisième personne, comme tous les projets.
- Les liens « Parc des Ilôts Changeants » et « Jardin Laurrière » de l'ancienne page Projets pointaient vers Silice : chacun a maintenant sa propre fiche.
- La prestation « Assistance à maîtrise d'ouvrage », vide sur WordPress, est rédigée dans la mission Conception, à partir de l'intervention d'Yzernay.
- Les témoignages ont été supprimés, comme prévu.
- Deux photos de visite portant le logo du CAUE de la Mayenne ne sont rattachées à aucun projet (le lieu n'est pas identifiable) ; l'une illustre la mission Médiation.

## Images en meilleure définition (25 octobre 2026)

Alice a fourni le dossier de travail du site (`Sources/Source  Site internet/`, 2,2 Go, non publié) avec ses fichiers d'origine. Chaque image de `medias/` y a été recherchée par empreinte visuelle, image entière ou zone recadrée, puis vérifiée à l'œil avant remplacement. Les noms de fichiers ne changent pas, les JSON non plus. Traitement identique à la migration : 2 400 px au plus, JPEG qualité 85, profil converti en sRGB, métadonnées supprimées.

**Remplacées : 98 images.**

- 89 images entières, reprises de l'original au lieu de la copie WordPress compressée deux fois. La plupart restent à 2 400 px mais gagnent en netteté. Parmi elles, les trois premières images du diaporama d'accueil (Chaumont, Jardin Madda, Prairie ludique). Deux images issues du portfolio gagnent aussi en taille : Alice peignant au sol (723 → 2 040 px) et dans l'atelier (574 → 1 530 px).
- 9 recadrages du PDF de présentation ou du portfolio, refaits dans l'original au même cadrage. Concernés : le bloc Démarche de l'accueil (`ombres-feuillages`, 830 → 1 698 × 2 400), la tente et ses quatre détails (Château des Arcis, 368 → 2 400 px), deux vues du jardin de Chaumont et une photo d'atelier de la cour d'école Galan. L'allée de Chaumont (`jardin-allee`) est plus sombre que la version du PDF, qui avait été éclaircie : c'est la photo d'origine.

**Laissées telles quelles**

- Les sept bannières WordPress (`pages/banniere-*.jpg`) : elles ne sont affichées nulle part sur le nouveau site, et leurs originaux sont en CMJN sans profil, ce qui fausserait les couleurs.
- Les images dont l'original n'est pas plus grand (Festival Casc, Silice, Campaneta en 2 048 px, photos de formation en 1 080 px…), et quatre plans et dessins de Chaumont déjà tirés de leur original.
- Le croquis et le plan d'Yzernay : la version du site porte des annotations ou des numéros absents des originaux. Les plans d'Yzernay et de la cour Galan, rendus à 300 dpi depuis le PDF vectoriel, sont déjà plus fins que les fichiers fournis.
- Les images des PDF dont aucun original n'a été trouvé : Douceur Power, Bestiaire, Potager du Roi, Silice (Beaulieu, MANAS), portrait, illustration de la flûtiste, trois photos d'ateliers de la cour Galan, et les photos Château des Arcis venues de WordPress.

**Le favicon** est déjà celui de `favico 1.png` (les lettres SA/JE), produit depuis le logo vectoriel par `outils/decouper-logo.mjs`.

**Absent du site** (le dossier a été supprimé de la copie locale après usage ; ces fichiers restent chez Alice, à ajouter depuis l'administration si elle le souhaite) :

- Château des Arcis : 8 photos (juin et juillet 2025) ;
- Jardin Eve : 6 photos (juin 2025 à janvier 2026) ;
- Jardin Laurrière, projet masqué en attente d'images : 3 croquis de terrasse et une photo ;
- Chaumont : 9 photos, dont 4 en 8 368 px ;
- cour Galan : 3 photos d'ateliers, un plan d'enfant et 4 rendus générés par ChatGPT (mai 2026) ;
- Médiation : 3 photos de juin 2025 ;
- divers : 2 photos du dossier « Jardin » sans projet indiqué, `aquarell1.jpg`, `serres.png`, deux bannières Chaumont, deux variantes du logo et `favico 2.png` (favicon avec la serre).

Le dossier contenait aussi les fichiers maîtres (PSD, AI, PDF de concours, carte de visite). Il contenait enfin `Texte site internet a propos et demarche.odt`, l'ancien texte Démarche à la première personne du pluriel, avec une liste de partenaires absente du site : L'échappée verte (Jean-Christophe Ravaux), Odyssée Paysage (Adrien Hecquet et Théophile Lenglet), CAUE de la Mayenne (Carole Dauphin), CFP la Futaie (Olivier Delepine).

## Points à faire vérifier par Alice

Rien n'a été inventé : chaque fait vient d'une des sources ci-dessus. Les points suivants sont des interprétations ou des contradictions entre sources.

1. **Demeure des paysages** : la note d'intention date d'août 2024, le portfolio indique une commande de mai à juin 2025 et le CV « été 2025 ». Date retenue : 2025.
2. **Douceur Power** : les œuvres « Delphinium » et « Helianthus » ont été attribuées d'après les fleurs représentées (épis bleus, fleurs orangées), l'ordre du PDF étant ambigu.
3. **Cour d'école** : nom de la commune écrit « Laigné Saint-Gervais (53) » comme dans la présentation ; le budget de 200 000 € est publié, comme dans la présentation. À retirer si ce n'est pas souhaité.
4. **Mentions légales** : le SIRET 450 982 830 00025 et l'adresse du 48 rue du Bas des Bois viennent de la présentation. Est-ce le SIRET d'Alice ou celui de COODEM 53 ? Faut-il publier cette adresse ou celle de la coopérative ?
5. **Catégories** : Siège CADDIF classé « Espaces publics » (esplanade urbaine plantée), Cueillette Andrya « Jardins privés ».
6. **Projets sans texte** : seuls les noms de fichiers donnent des indices, non publiés : plans de plantation du Siège datés de 2019 et photos de 2018-2019 ; plans de la Prairie ludique datés du 20/07/2021 ; photos du Jardin Eve prises en 2024.
7. **Missions** : rédigées à partir du CV et de l'ancienne introduction des Prestations. À relire en particulier : la phrase de la mission Enseignement invitant les communes à proposer un sujet aux étudiants (demandée par le PRD), et la liste des ateliers de médiation (carte sensible, empreintes, collages, maquettes, reprise du PRD).
8. **Silice** : le lien YouTube a été reconstitué à partir du texte espacé du portfolio ; vérifier qu'il ouvre la bonne chaîne. « Les Entrelassés » et « Pissaro » (Bestiaire) sont écrits comme dans les PDF.
9. **Crédits** : photographe du portrait à nommer ; photos el CASC et CAUE créditées à leurs organismes, d'après leurs logos.
10. **Traductions anglaises** : toutes rédigées ; à relire (étape 5 du PRD).
11. **Choix éditoriaux** : images du diaporama, trois projets « À la une », couvertures des projets et ordre des projets sont des propositions, modifiables depuis l'administration.
