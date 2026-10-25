import fs from "node:fs/promises";
import path from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";
import { traiterImages, balisePicture } from "./src/_lib/images.js";
import { lien } from "./src/_lib/routes.js";

// Markdown réduit : paragraphes, gras, italique, liens, listes (et intertitres
// pour les pages de texte). Le HTML saisi est échappé, jamais interprété.
const REGLES = ["paragraph", "emphasis", "link", "list", "newline", "text", "escape", "entity", "balance_pairs", "fragments_join", "text_join", "inline", "block", "normalize", "linkify"];
const mdTexte = markdownIt("zero", { breaks: true }).enable(REGLES);
const mdPage = markdownIt("zero", { breaks: true }).enable([...REGLES, "heading"]);

// Les intertitres reçoivent un identifiant (ex. #accessibilite) pour pouvoir y faire un lien
const ancre = (texte) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
mdPage.core.ruler.push("ancres", (state) => {
  state.tokens.forEach((jeton, i) => {
    if (jeton.type === "heading_open") jeton.attrSet("id", ancre(state.tokens[i + 1].content));
  });
});

const chemin = (objet, cheminPointe) =>
  cheminPointe.split(".").reduce((o, cle) => (o == null ? undefined : o[cle]), objet);

const echapper = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export default function (config) {
  let images = {};
  config.on("eleventy.before", async () => {
    images = await traiterImages();
  });
  // Supprime les variantes d'images qui ne correspondent plus à aucun fichier de /medias/
  config.on("eleventy.after", async ({ dir }) => {
    const utilisees = new Set(Object.values(images).flatMap((meta) => Object.values(meta).flat().map((v) => path.basename(v.outputPath))));
    const dossier = path.join(dir.output, "images");
    for (const fichier of await fs.readdir(dossier).catch(() => [])) {
      if (!utilisees.has(fichier)) await fs.rm(path.join(dossier, fichier));
    }
  });

  config.addPlugin(HtmlBasePlugin);

  config.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/polices": "polices",
    "src/img": "img",
    "src/admin/*.{js,css}": "admin",
    "src/favicon-32.png": "favicon-32.png",
    "src/apple-touch-icon.png": "apple-touch-icon.png",
    "src/icone-512.png": "icone-512.png",
  });
  config.addWatchTarget("./contenu/");
  config.addWatchTarget("./medias/");

  // Adresses
  config.addFilter("lien", (cle, lang, slug) => lien(cle, lang, slug));
  config.addFilter("absolu", (url, site) => new URL(url, site.url).href);
  config.addFilter("origine", (url) => (url ? new URL(url).origin : ""));

  // Textes localisés : la valeur anglaise manquante est remplacée par le français
  config.addFilter("loc", (objet, lang, cle) => {
    const valeur = chemin(objet?.[lang], cle);
    return valeur === undefined || valeur === "" || (Array.isArray(valeur) && !valeur.length) ? chemin(objet?.fr, cle) ?? "" : valeur;
  });
  config.addFilter("repli", (objet, lang, cle) => {
    if (lang !== "en") return false;
    const en = chemin(objet?.en, cle);
    return (en === undefined || en === "") && Boolean(chemin(objet?.fr, cle));
  });

  // Attributs d'un texte modifiable dans l'administration : data-champ="fichier:chemin"
  config.addFilter("champ", (fichier, cle, lang, objet) => {
    const complet = lang ? `${lang}.${cle}` : cle;
    let attributs = ` data-champ="${echapper(`${fichier}:${complet}`)}"`;
    if (lang === "en" && objet) {
      const en = chemin(objet.en, cle);
      if ((en === undefined || en === "") && chemin(objet.fr, cle)) attributs += ` lang="fr" data-repli`;
    }
    return attributs;
  });

  config.addFilter("md", (texte) => (texte ? mdTexte.render(String(texte)) : ""));
  config.addFilter("mdPage", (texte) => (texte ? mdPage.render(String(texte)) : ""));
  config.addFilter("mdLigne", (texte) => (texte ? mdTexte.renderInline(String(texte)) : ""));

  // Images
  config.addFilter("image", (source, alt = "", sizes = "100vw", options = {}) => {
    const meta = images[source];
    if (!meta) {
      console.warn(`[images] introuvable dans /medias/ : ${source}`);
      return "";
    }
    const attributs = {
      alt,
      sizes,
      loading: options.prioritaire ? "eager" : "lazy",
      decoding: options.prioritaire ? "sync" : "async",
    };
    if (options.prioritaire) attributs.fetchpriority = "high";
    if (options.classe) attributs.class = options.classe;
    return balisePicture(meta, attributs);
  });
  config.addFilter("imageUrl", (source, largeur = 1600, format = "jpeg") => {
    const variantes = images[source]?.[format];
    if (!variantes) return "";
    return (variantes.find((v) => v.width >= largeur) || variantes.at(-1)).url;
  });
  // Pour <link rel="preload" imagesrcset>, attribut que le plugin HtmlBase ne préfixe pas
  const prefixe = (process.env.PATH_PREFIX || "/").replace(/\/$/, "");
  config.addFilter("srcset", (source, format = "avif") =>
    (images[source]?.[format] || []).map((v) => `${prefixe}${v.url} ${v.width}w`).join(", "));
  config.addFilter("imageMeta", (source) => {
    const jpeg = images[source]?.jpeg;
    return jpeg ? jpeg.at(-1) : null;
  });

  // Recherches dans le contenu
  config.addFilter("parSlug", (liste, slug) => liste.find((e) => e.slug === slug));
  config.addFilter("categorie", (slug, site, lang) => site.categories.find((c) => c.slug === slug)?.[lang] ?? slug);
  config.addFilter("projetsDeMission", (projets, mission) => projets.filter((p) => p.missions?.includes(mission)));
  config.addFilter("json", (valeur) => JSON.stringify(valeur));
  // Version anglaise complète : chaque texte français non vide a son équivalent anglais
  config.addFilter("enComplet", (objet) => {
    const complet = (fr, en) => {
      if (typeof fr === "string") return !fr || (typeof en === "string" && en.trim() !== "");
      if (Array.isArray(fr)) return fr.every((v, i) => complet(v, en?.[i]));
      if (fr && typeof fr === "object") return Object.keys(fr).every((k) => complet(fr[k], en?.[k]));
      return true;
    };
    return complet(objet?.fr, objet?.en);
  });
  config.addFilter("localBusiness", (site, lang, image) => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `SAJE – ${site[lang].sousTitre}`,
    description: site[lang].description,
    url: site.url,
    email: site.email,
    ...(site.afficherTelephone ? { telephone: site.telephone } : {}),
    ...(image ? { image: new URL(image, site.url).href } : {}),
    founder: { "@type": "Person", name: "Alice Stevens", jobTitle: site[lang].metier },
    address: { "@type": "PostalAddress", addressLocality: "Laval", postalCode: "53000", addressRegion: "Mayenne", addressCountry: "FR" },
    sameAs: site.reseaux.map((r) => r.url),
  }).replace(/</g, "\\u003c"));
  config.addFilter("telephoneLien", (numero) => `tel:${String(numero).replace(/[^+\d]/g, "")}`);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
