// Anciennes adresses du site WordPress -> nouvelles pages.
// Les adresses « ?page_id= » arrivent toutes sur l'accueil : elles sont
// traitées par js/site.js (voir PAGE_IDS ci-dessous, repris dans ce script).
import fs from "node:fs";
import path from "node:path";

const CONTENU = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../contenu");

export default function () {
  const liste = [
    { ancienne: "/prestations/", nouvelle: "/missions/" },
    { ancienne: "/page-d-exemple/", nouvelle: "/" },
  ];
  for (const dossier of ["projets", "missions"]) {
    for (const fichier of fs.readdirSync(path.join(CONTENU, dossier)).filter((f) => f.endsWith(".json"))) {
      const contenu = JSON.parse(fs.readFileSync(path.join(CONTENU, dossier, fichier), "utf8"));
      const anciennes = [contenu.ancienneAdresse, ...(contenu.anciennesAdresses || [])].filter(Boolean);
      for (const ancienne of anciennes) liste.push({ ancienne, nouvelle: `/${dossier}/${contenu.slug}/` });
    }
  }
  return liste;
}
