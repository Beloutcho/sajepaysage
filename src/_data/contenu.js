// Lit tout le contenu du site dans /contenu/ (fichiers JSON modifiés par l'administration).
import fs from "node:fs";
import path from "node:path";

const CONTENU = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../contenu");

const lire = (fichier) => JSON.parse(fs.readFileSync(path.join(CONTENU, fichier), "utf8"));
const lireDossier = (dossier) =>
  fs.readdirSync(path.join(CONTENU, dossier))
    .filter((f) => f.endsWith(".json"))
    .map((f) => lire(`${dossier}/${f}`));
const parOrdre = (a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.slug.localeCompare(b.slug);

export default function () {
  const projets = lireDossier("projets").sort(parOrdre);
  const missions = lireDossier("missions").sort(parOrdre);
  const publies = projets.filter((p) => p.publie);

  return {
    site: lire("site.json"),
    accueil: lire("accueil.json"),
    demarche: lire("pages/demarche.json"),
    contact: lire("pages/contact.json"),
    mentions: lire("pages/mentions-legales.json"),
    pageProjets: lire("pages/projets.json"),
    pageMissions: lire("pages/missions.json"),
    projets,
    projetsPublies: publies,
    missions,
    // Une entrée par page générée : chaque projet et chaque mission, en français et en anglais
    pagesProjets: projets.flatMap((projet) => ["fr", "en"].map((lang) => {
      const i = publies.indexOf(projet);
      return {
        projet,
        lang,
        precedent: i > 0 ? publies[i - 1] : null,
        suivant: i >= 0 && i < publies.length - 1 ? publies[i + 1] : null,
      };
    })),
    pagesMissions: missions.flatMap((mission) => ["fr", "en"].map((lang) => ({ mission, lang }))),
  };
}
