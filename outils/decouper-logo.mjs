// Découpe Sources/logo saje serre couleurs.svg en fichiers utilisables par le site :
//   src/img/logo-saje.svg           logo complet d'origine (mot + serre)
//   src/_includes/partials/logo-mot.njk   mot « SAJE Art&Paysage » seul, couleur du texte (inclus en ligne)
//   src/img/serre.webp, serre@2x.webp      la serre seule, pour l'en-tête
//   src/favicon-32.png, src/apple-touch-icon.png, src/icone-512.png
//
// Usage : node outils/decouper-logo.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const source = await fs.readFile(path.join(RACINE, "Sources/logo saje serre couleurs.svg"), "utf8");
const style = source.match(/<style>([\s\S]*?)<\/style>/)[1];
const elements = source.match(/<(?:path|circle|polygon|rect|ellipse)\b[^>]*?\/>/gs);

const classe = (e) => (e.match(/class="([^"]+)"/) || [])[1];
const ordonnee = (e) => {
  const m = e.match(/d="M\s*([-\d.]+)[ ,]*([-\d.]+)/) || e.match(/points="([-\d.]+)[ ,]+([-\d.]+)/) || e.match(/cy="([-\d.]+)"/);
  return Number(m[2] ?? m[1]);
};
const nu = (e) => e.replace(/\s+/g, " ").replace(/\s*class="[^"]+"/, "");

// Le mot occupe le haut du dessin (y < 72), la serre le bas.
const lettres = elements.filter((e) => classe(e) === "st10" && ordonnee(e) < 72);
const contreFormes = elements.filter((e) => classe(e) === "st12" && ordonnee(e) < 72);
const serre = elements.filter((e) => ordonnee(e) >= 72);

// Gabarit Nunjucks : « suffixe » rend l'identifiant du masque unique (le mot est inclus dans l'en-tête et le pied de page).
const mot = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="58.5 33.5 61 33.5" fill="currentColor" aria-hidden="true" focusable="false"><mask id="logo-contreformes-{{ suffixe }}"><rect x="50" y="30" width="80" height="40" fill="#fff"/><g fill="#000">${contreFormes.map(nu).join("")}</g></mask><g mask="url(#logo-contreformes-{{ suffixe }})">${lettres.map(nu).join("")}</g></svg>\n`;

const svgSerre = (vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><style>${style.replace(/\s+/g, " ")}</style>${serre.join("")}</svg>`;
const cadrageSerre = "40 74 100 79";

await fs.mkdir(path.join(RACINE, "src/img"), { recursive: true });
await fs.copyFile(path.join(RACINE, "Sources/logo saje serre couleurs.svg"), path.join(RACINE, "src/img/logo-saje.svg"));
await fs.writeFile(path.join(RACINE, "src/_includes/partials/logo-mot.njk"), mot);

const serreSvg = Buffer.from(svgSerre(cadrageSerre));
for (const [h, nom] of [[56, "serre.webp"], [112, "serre@2x.webp"]]) {
  await sharp(serreSvg, { density: 600 }).resize({ height: h }).webp({ quality: 90 }).toFile(path.join(RACINE, "src/img", nom));
}
// Icônes : serre centrée sur fond crème, cadrage carré
const carre = Buffer.from(svgSerre("35 68 110 110"));
const icone = (taille) => sharp(carre, { density: 600 }).resize(taille, taille).flatten({ background: "#F3EEE3" }).png();
await icone(32).toFile(path.join(RACINE, "src/favicon-32.png"));
await icone(180).toFile(path.join(RACINE, "src/apple-touch-icon.png"));
await icone(512).toFile(path.join(RACINE, "src/icone-512.png"));
console.log("Logo découpé.");
