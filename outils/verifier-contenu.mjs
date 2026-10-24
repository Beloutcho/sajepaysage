// Contrôle du contenu et rapport des champs vides : docs/rapport-contenu.md
//
// Vérifie, pour chaque projet, page et mission : champs de la fiche vides,
// textes anglais manquants, images introuvables, textes alternatifs absents,
// images présentes dans /medias/ mais inutilisées.
//
// Usage : npm run verifier   (code de sortie 1 si une image référencée manque)
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "contenu", f), "utf8"));
const existe = (f) => fs.existsSync(path.join(RACINE, "medias", f));
const dossier = (d) => fs.readdirSync(path.join(RACINE, "contenu", d)).filter((f) => f.endsWith(".json")).map((f) => lire(`${d}/${f}`));

let bloquant = 0;
const lignes = [];
const ecrire = (s = "") => lignes.push(s);

// Textes anglais manquants (chemins des champs français non vides sans équivalent anglais)
function manquesAnglais(fr, en, prefixe = "") {
  if (typeof fr === "string") return fr.trim() && !(typeof en === "string" && en.trim()) ? [prefixe] : [];
  if (Array.isArray(fr)) return fr.flatMap((v, i) => manquesAnglais(v, en?.[i], `${prefixe}.${i}`));
  if (fr && typeof fr === "object") return Object.keys(fr).flatMap((k) => manquesAnglais(fr[k], en?.[k], prefixe ? `${prefixe}.${k}` : k));
  return [];
}

ecrire("# Rapport du contenu");
ecrire();
ecrire(`Produit par \`npm run verifier\` le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}. Ce rapport liste ce qui manque ; il ne juge pas la justesse des textes (voir docs/rapport-migration.md pour les points à faire vérifier par Alice).`);
ecrire();

// Projets
const projets = dossier("projets").sort((a, b) => (a.ordre ?? 99) - (b.ordre ?? 99));
ecrire("## Projets");
ecrire();
ecrire("| Projet | Publié | Fiche vide | Texte FR manquant | Anglais manquant | Images |");
ecrire("| --- | --- | --- | --- | --- | --- |");
const problemesImages = [];
for (const p of projets) {
  const fiche = ["lieu", "date", "commanditaire", "partenaires"].filter((k) => !p[k]);
  if (!p.fr.intervention) fiche.push("intervention");
  const texteFr = ["accroche", "descriptif"].filter((k) => !p.fr[k]);
  const anglais = manquesAnglais(p.fr, p.en);
  const nbImages = p.images.length;
  for (const im of p.images) {
    const chemin = `projets/${p.slug}/${im.fichier}`;
    if (!existe(chemin)) { problemesImages.push(`**${p.slug}** : fichier introuvable \`medias/${chemin}\``); bloquant++; }
    if (!im.alt?.fr) problemesImages.push(`**${p.slug}** : texte alternatif français manquant pour \`${im.fichier}\``);
    if (!im.alt?.en) problemesImages.push(`**${p.slug}** : texte alternatif anglais manquant pour \`${im.fichier}\``);
  }
  if (p.couverture && !p.images.some((im) => im.fichier === p.couverture)) problemesImages.push(`**${p.slug}** : la couverture \`${p.couverture}\` n’est pas dans la liste des images`);
  const surDisque = fs.existsSync(path.join(RACINE, "medias/projets", p.slug)) ? fs.readdirSync(path.join(RACINE, "medias/projets", p.slug)) : [];
  const inutilisees = surDisque.filter((f) => !p.images.some((im) => im.fichier === f));
  if (inutilisees.length) problemesImages.push(`**${p.slug}** : ${inutilisees.length} image(s) présente(s) dans medias/ mais non affichée(s) : ${inutilisees.map((f) => `\`${f}\``).join(", ")}`);
  ecrire(`| ${p.fr.titre} (\`${p.slug}\`) | ${p.publie ? "oui" : "**non**"} | ${fiche.join(", ") || "—"} | ${texteFr.join(", ") || "—"} | ${anglais.join(", ") || "—"} | ${nbImages} |`);
}
ecrire();
if (problemesImages.length) {
  ecrire("### Images");
  ecrire();
  problemesImages.forEach((l) => ecrire(`- ${l}`));
  ecrire();
}

// Pages et missions
ecrire("## Pages et missions");
ecrire();
const pages = [
  ["Accueil", "accueil.json"], ["Démarche", "pages/demarche.json"], ["Projets (introduction)", "pages/projets.json"],
  ["Missions (introduction)", "pages/missions.json"], ["Contact", "pages/contact.json"], ["Mentions légales", "pages/mentions-legales.json"],
  ...dossier("missions").map((m) => [`Mission : ${m.fr.titre}`, `missions/${m.slug}.json`]),
];
ecrire("| Page | Anglais manquant | Images introuvables |");
ecrire("| --- | --- | --- |");
for (const [nom, fichier] of pages) {
  const json = lire(fichier);
  const references = JSON.stringify(json).match(/"image":"([^"]+)"/g)?.map((m) => m.slice(9, -1)) || [];
  const absentes = references.filter((r) => !existe(r));
  bloquant += absentes.length;
  ecrire(`| ${nom} | ${manquesAnglais(json.fr, json.en).join(", ") || "—"} | ${absentes.join(", ") || "—"} |`);
}
ecrire();

const site = lire("site.json");
ecrire("## Réglages du site");
ecrire();
ecrire(`- Dépôt GitHub pour l’administration : ${site.github.depot ? `\`${site.github.depot}\`` : "**à renseigner** (`contenu/site.json`, champ `github.depot`, ex. `compte/sajepaysage`)"}`);
ecrire(`- Téléphone affiché sur le site : ${site.afficherTelephone ? "oui" : "non"}`);
ecrire();

fs.writeFileSync(path.join(RACINE, "docs/rapport-contenu.md"), `${lignes.join("\n")}\n`);
console.log(`Rapport écrit dans docs/rapport-contenu.md (${projets.length} projets, ${pages.length} pages).`);
if (bloquant) {
  console.error(`${bloquant} image(s) référencée(s) introuvable(s).`);
  process.exitCode = 1;
}
