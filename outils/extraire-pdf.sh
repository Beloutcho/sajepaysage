#!/usr/bin/env bash
# Découpe les deux PDF du dossier Sources/ et range leurs images dans /medias/.
#
# - Les photos et illustrations sont extraites telles quelles (pdfimages -j),
#   sans recompression, puis réenregistrées en JPEG qualité 90 sans métadonnées.
# - Les plans vectoriels (Laigné-Saint-Gervais, Yzernay) sont rendus à 300 dpi
#   puis recadrés.
#
# Les PDF étant des versions « light », leurs images font 300 à 1200 px de
# large : elles complètent celles du site WordPress, sans les remplacer.
#
# Usage : bash outils/extraire-pdf.sh   (nécessite poppler-utils et ImageMagick)
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
PORTFOLIO="$RACINE/Sources/20260123 Portfolio Art Alice Stevens.pdf"
PRESENTATION="$RACINE/Sources/Présentation Saje Arts Paysage été 2026 light.pdf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pdfimages -j -p "$PORTFOLIO" "$TMP/port"
pdfimages -j -p "$PRESENTATION" "$TMP/pres"

# copie <image extraite> <destination relative à medias/>
copie() {
  mkdir -p "$(dirname "$RACINE/medias/$2")"
  convert "$TMP/$1" -strip -quality 90 "$RACINE/medias/$2"
}

# rendu <pdf> <page> <x%> <y%> <largeur%> <hauteur%> <destination>
rendu() {
  local base="$TMP/rendu-$(basename "$7" .jpg)"
  pdftoppm -r 300 -f "$2" -l "$2" -png "$1" "$base"
  mkdir -p "$(dirname "$RACINE/medias/$7")"
  convert "$base"-*.png -gravity NorthWest \
    -crop "$(identify -format "%[fx:round(w*$5/100)]x%[fx:round(h*$6/100)]+%[fx:round(w*$3/100)]+%[fx:round(h*$4/100)]" "$base"-*.png)" \
    +repage -resize '2400x2400>' -strip -quality 88 "$RACINE/medias/$7"
  rm -f "$base"-*.png
}

# Silice (portfolio p. 8 à 15)
copie port-008-009.jpg projets/silice/beaulieu-fin-de-concert.jpg
copie port-010-013.jpg projets/silice/beaulieu-performance-01.jpg
copie port-011-015.jpg projets/silice/beaulieu-performance-02.jpg
copie port-012-017.jpg projets/silice/naif-dessin-charmeuse.jpg
copie port-013-019.jpg projets/silice/naif-salle-cultes.jpg
copie port-014-022.jpg projets/silice/naif-dessin-live.jpg
copie port-015-024.jpg projets/silice/naif-chant.jpg

# L'Île de la Félicité, jardin réalisé (portfolio p. 18-19, présentation p. 11)
copie port-018-027.jpg projets/chaumont-sur-loire/jardin-entree.jpg
copie port-018-028.jpg projets/chaumont-sur-loire/jardin-structure.jpg
copie port-019-029.jpg projets/chaumont-sur-loire/jardin-ilot.jpg
copie pres-011-410.jpg projets/chaumont-sur-loire/jardin-allee.jpg
copie pres-011-411.jpg projets/chaumont-sur-loire/jardin-plantes.jpg

# La Demeure des paysages (portfolio p. 22-23)
copie port-022-032.jpg projets/chateau-des-arcis/tente-installee.jpg
copie port-023-033.jpg projets/chateau-des-arcis/tente-detail-01.jpg
copie port-023-034.jpg projets/chateau-des-arcis/tente-detail-02.jpg
copie port-023-035.jpg projets/chateau-des-arcis/tente-detail-03.jpg
copie port-023-036.jpg projets/chateau-des-arcis/tente-detail-04.jpg

# Douceur Power (portfolio p. 24-27)
copie port-024-037.jpg projets/douceur-power/affiche.jpg
copie port-025-038.jpg projets/douceur-power/helianthus.jpg
copie port-025-039.jpg projets/douceur-power/delphinium.jpg
copie port-025-040.jpg projets/douceur-power/exposition-abbaye-la-roe.jpg
copie port-026-041.jpg projets/douceur-power/un-moment-entre-nous.jpg
copie port-027-043.jpg projets/douceur-power/pour-la-vie.jpg

# Potager du Roi (portfolio p. 28-31, présentation p. 15)
mkdir -p "$RACINE/medias/projets/potager-du-roi"
convert "$TMP/port-030-050.jpg" "$TMP/port-031-051.jpg" +append -strip -quality 90 \
  "$RACINE/medias/projets/potager-du-roi/plan-vue-oiseau.jpg"
copie pres-015-428.jpg projets/potager-du-roi/panneau-01.jpg
copie pres-015-429.jpg projets/potager-du-roi/panneau-02.jpg
copie pres-015-430.jpg projets/potager-du-roi/panneau-03.jpg
copie pres-015-431.jpg projets/potager-du-roi/panneau-04.jpg

# Bestiaire des paysages lasséens (portfolio p. 32-33)
copie port-032-052.jpg projets/bestiaire-lasseen/le-chant-de-bois-thibault.jpg
copie port-033-053.jpg projets/bestiaire-lasseen/le-leopard-selenien.jpg

# Festival el CASC (portfolio p. 34)
copie port-034-055.jpg projets/festival-casc/anneau-de-dessin.jpg

# Parc naturel des Îlots Changeants, Yzernay (présentation p. 9, plans vectoriels)
rendu "$PRESENTATION" 9 0 0.5 100 24.5 projets/parc-ilots-changeants/croquis-terrasse-accueil.jpg
rendu "$PRESENTATION" 9 0 31.5 100 17.5 projets/parc-ilots-changeants/coupe-promenade-des-ilots.jpg
rendu "$PRESENTATION" 9 0 55.5 100 44.5 projets/parc-ilots-changeants/plan-amenagement.jpg
rendu "$PRESENTATION" 9 0 68.6 100 31.4 projets/parc-ilots-changeants/plan-vue-aerienne.jpg

# Cour d'école Jean-Baptiste Galan, Laigné-Saint-Gervais (présentation p. 6-7)
rendu "$PRESENTATION" 6 3.5 42.4 41.5 19 projets/cour-ecole-laigne-saint-gervais/dessin-enfant.jpg
rendu "$PRESENTATION" 6 3.8 64 28.6 33 projets/cour-ecole-laigne-saint-gervais/atelier-classe-01.jpg
rendu "$PRESENTATION" 6 35.4 64 28.9 33 projets/cour-ecole-laigne-saint-gervais/atelier-classe-02.jpg
rendu "$PRESENTATION" 6 67.1 64 29.1 33 projets/cour-ecole-laigne-saint-gervais/atelier-classe-03.jpg
rendu "$PRESENTATION" 7 4 3.5 95 41 projets/cour-ecole-laigne-saint-gervais/diagnostic-conflits.jpg
rendu "$PRESENTATION" 7 4 54.5 95 44 projets/cour-ecole-laigne-saint-gervais/plan-esquisse.jpg

# Pages
copie pres-001-000.jpg pages/ombres-feuillages.jpg
copie port-001-000.jpg pages/illustration-flutiste.jpg
copie port-036-059.jpg pages/alice-peint-atelier.jpg
copie port-037-061.jpg pages/alice-peint-au-sol.jpg

echo "Images des PDF rangées dans medias/."
