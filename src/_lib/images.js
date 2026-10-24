// Variantes des images de /medias/ (480 à 2400 px, AVIF, WebP, JPEG), générées
// avant chaque construction. Les fichiers déjà présents dans _site/images/
// ne sont pas recalculés : seule une image nouvelle ou modifiée coûte du temps.
import fs from "node:fs/promises";
import path from "node:path";
import Image from "@11ty/eleventy-img";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const MEDIAS = path.join(RACINE, "medias");

const OPTIONS = {
  widths: [480, 960, 1600, 2400],
  formats: ["avif", "webp", "jpeg"],
  outputDir: path.join(RACINE, "_site/images/"),
  urlPath: "/images/",
  sharpAvifOptions: { quality: 55, effort: 2 },
  sharpWebpOptions: { quality: 78 },
  sharpJpegOptions: { quality: 80, mozjpeg: true, progressive: true },
};

Image.concurrency = 4;

async function lister(dossier) {
  const entrees = await fs.readdir(dossier, { withFileTypes: true });
  const fichiers = await Promise.all(entrees.map((e) => {
    const chemin = path.join(dossier, e.name);
    if (e.isDirectory()) return lister(chemin);
    return /\.(jpe?g|png|webp)$/i.test(e.name) ? [chemin] : [];
  }));
  return fichiers.flat();
}

/** Renvoie { "projets/silice/1.jpg": métadonnées eleventy-img, … } */
export async function traiterImages() {
  const resultat = {};
  const fichiers = await lister(MEDIAS);
  await Promise.all(fichiers.map(async (fichier) => {
    const cle = path.relative(MEDIAS, fichier).split(path.sep).join("/");
    resultat[cle] = await Image(fichier, OPTIONS);
  }));
  return resultat;
}

/** Balise <picture> complète pour une image de /medias/. */
export function balisePicture(meta, attributs) {
  return Image.generateHTML(meta, attributs);
}
