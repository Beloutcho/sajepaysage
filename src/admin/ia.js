// Propositions de texte alternatif par l'IA, pour l'édition des images.
// Le service est un workflow n8n (« SAJE — textes des images ») : il reçoit
// l'image réduite, le titre de la page et les textes déjà écrits, et renvoie
// { alt: { fr, en }, legende?: { fr, en } }. Aucune dépendance.
import * as gh from "./github.js";

const COTE_MAX = 1280;
const DELAI = 90000;

/** Adresse du service, ou "" si le site n'en déclare pas (contenu/site.json, champ ia.adresse). */
export async function adresse() {
  try {
    return (await gh.config()).ia || "";
  } catch {
    return "";
  }
}

/** Réduit une image (adresse blob: ou du site) en JPEG data: d'au plus 1 280 px de côté. */
export async function versDataUrl(source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const echelle = Math.min(1, COTE_MAX / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * echelle);
  canvas.height = Math.round(image.naturalHeight * echelle);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * Demande une proposition de textes pour une image.
 * @param {{ source: string, titre: string, page: "projet"|"mission"|"page", accroche?: string,
 *           alt?: { fr, en }, legende?: { fr, en } }} demande
 */
export async function proposer({ source, ...demande }) {
  const url = await adresse();
  if (!url) throw new Error("Aucun service de proposition n’est configuré pour ce site.");
  const image = await versDataUrl(source);
  let reponse;
  try {
    reponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, ...demande }),
      signal: AbortSignal.timeout(DELAI),
    });
  } catch {
    throw new Error("Le service de proposition ne répond pas. Vérifiez la connexion, ou écrivez le texte vous-même.");
  }
  let corps = {};
  try { corps = await reponse.json(); } catch { /* corps vide */ }
  if (!reponse.ok || !corps.alt) throw new Error(corps.erreur || "La proposition a échoué. Réessayez, ou écrivez le texte vous-même.");
  return corps;
}
