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
// Icônes : les quatre lettres du logo sur deux lignes (SA / JE), comme le favicon de l'ancien site WordPress
// (anthracite #2C2D35, fond transparent ; fond blanc pour l'icône d'écran d'accueil et l'icône 512).
// Les quatre grandes lettres sont les quatre premières formes de `lettres` ; leur boîte englobante
// (x min, largeur) est mesurée sur le dessin : S, A, J, E de gauche à droite.
const grandes = lettres.slice(0, 4);
const boites = [
  { i: 3, x: 60.4, l: 9.5 }, // S
  { i: 0, x: 71.9, l: 13.8 }, // A
  { i: 2, x: 90.1, l: 10.5 }, // J
  { i: 1, x: 105.2, l: 9.9 }, // E
];
const HAUT = 35, H = 18.9, COL = 13.8, ECART_X = 4, ECART_Y = 2.5, MARGE = 1.5;
const bloc = { l: 2 * COL + ECART_X, h: 2 * H + ECART_Y };
const cote = bloc.h + 2 * MARGE;
const lettreIcone = ({ i, x, l }, n) => {
  const colonne = n % 2, ligne = Math.floor(n / 2);
  const dx = (cote - bloc.l) / 2 + colonne * (COL + ECART_X) + (COL - l) / 2 - x;
  const dy = MARGE + ligne * (H + ECART_Y) - HAUT;
  return `<g transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)})"><mask id="m${n}"><rect x="50" y="30" width="80" height="40" fill="#fff"/><g fill="#000">${contreFormes.map(nu).join("")}</g></mask><g mask="url(#m${n})">${nu(grandes[i])}</g></g>`;
};
const carre = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote.toFixed(2)} ${cote.toFixed(2)}" fill="#2C2D35">${boites.map(lettreIcone).join("")}</svg>`);
const icone = (taille, fond) => {
  const image = sharp(carre, { density: 600 }).resize(taille, taille);
  return (fond ? image.flatten({ background: fond }) : image).png();
};
await icone(32).toFile(path.join(RACINE, "src/favicon-32.png"));
await icone(180, "#ffffff").toFile(path.join(RACINE, "src/apple-touch-icon.png"));
await icone(512, "#ffffff").toFile(path.join(RACINE, "src/icone-512.png"));
console.log("Logo découpé.");
