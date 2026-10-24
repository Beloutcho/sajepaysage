// Produit le guide d'administration d'Alice en deux fichiers à envoyer tels quels :
//   docs/guide-alice.html   un seul fichier (images et polices incluses), lisible dans tout navigateur
//   docs/guide-alice.pdf    version imprimable A4
// Source : docs/guide-alice/index.html et docs/guide-alice/images/ (captures)
//
// Usage : node outils/guide-alice.mjs   (nécessite Chromium ou Chrome)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DOSSIER = path.join(RACINE, "docs/guide-alice");
const TYPES = { ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2" };
const dataUri = (fichier) => `data:${TYPES[path.extname(fichier)]};base64,${fs.readFileSync(fichier).toString("base64")}`;

let html = fs.readFileSync(path.join(DOSSIER, "index.html"), "utf8");
html = html.replace(/src="(images\/[^"]+)"/g, (_, f) => `src="${dataUri(path.join(DOSSIER, f))}"`);
html = html.replace(/url\("(\.\.\/\.\.\/src\/polices\/[^"]+)"\)/g, (_, f) => `url("${dataUri(path.resolve(DOSSIER, f))}")`);

const sortieHtml = path.join(RACINE, "docs/guide-alice.html");
fs.writeFileSync(sortieHtml, html);

const navigateur = ["chromium", "chromium-browser", "google-chrome"].find((b) => {
  try { execFileSync("which", [b], { stdio: "ignore" }); return true; } catch { return false; }
});
if (!navigateur) throw new Error("Chromium ou Chrome est nécessaire pour produire le PDF.");
execFileSync(navigateur, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
  `--print-to-pdf=${path.join(RACINE, "docs/guide-alice.pdf")}`, `file://${sortieHtml}`], { stdio: "ignore" });
console.log("docs/guide-alice.html et docs/guide-alice.pdf produits.");
