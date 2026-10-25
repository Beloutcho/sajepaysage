// Édition directe sur la page. Chargé uniquement si une clé d'administration
// est enregistrée dans ce navigateur (voir js/tete.js).
//
// - Chaque texte modifiable porte data-champ="fichier:chemin" (ex. « projets/silice:fr.titre »).
// - Chaque image modifiable porte data-champ-image="fichier:chemin".
// - Toutes les modifications d'une session partent en un seul commit.
// - À chaque image ajoutée ou remplacée, l'IA (ia.js) propose son texte alternatif.
import * as gh from "./github.js";
import * as ia from "./ia.js";


const CLE_SESSION = "saje-edition";
const MAX_IMAGE = 2400;
const $ = (s, racine = document) => racine.querySelector(s);
const $$ = (s, racine = document) => [...racine.querySelectorAll(s)];

function element(balise, attributs = {}, ...enfants) {
  const el = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (cle === "texte") el.textContent = valeur;
    else if (cle.startsWith("on")) el.addEventListener(cle.slice(2), valeur);
    else if (valeur !== false && valeur != null) el.setAttribute(cle, valeur === true ? "" : valeur);
  }
  el.append(...enfants.filter((e) => e != null && e !== false));
  return el;
}

const slugifier = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";

// ---------- Chemins dans les fichiers JSON ----------

const decouper = (champ) => {
  const i = champ.indexOf(":");
  return { fichier: champ.slice(0, i), chemin: champ.slice(i + 1) };
};
const cleChemin = (morceau) => (/^\d+$/.test(morceau) ? Number(morceau) : morceau);
function lireChemin(objet, chemin) {
  return chemin.split(".").reduce((o, k) => (o == null ? undefined : o[cleChemin(k)]), objet);
}
function ecrireChemin(objet, chemin, valeur) {
  const morceaux = chemin.split(".").map(cleChemin);
  let o = objet;
  morceaux.slice(0, -1).forEach((k, i) => {
    if (o[k] == null || typeof o[k] !== "object") o[k] = typeof morceaux[i + 1] === "number" ? [] : {};
    o = o[k];
  });
  o[morceaux.at(-1)] = valeur;
}

// ---------- HTML modifiable -> Markdown réduit ----------

const echapper = (texte) => texte.replace(/([\\*_[\]])/g, "\\$1");

function enLigne(noeud) {
  if (noeud.nodeType === Node.TEXT_NODE) return echapper(noeud.textContent.replace(/\s+/g, " "));
  if (noeud.nodeType !== Node.ELEMENT_NODE) return "";
  const contenu = [...noeud.childNodes].map(enLigne).join("");
  const entourer = (marque) => {
    const m = contenu.match(/^(\s*)(.*?)(\s*)$/s);
    return m[2] ? `${m[1]}${marque}${m[2]}${marque}${m[3]}` : contenu;
  };
  switch (noeud.tagName) {
    case "BR": return "\n";
    case "STRONG": case "B": return entourer("**");
    case "EM": case "I": return entourer("*");
    case "A": {
      const href = noeud.getAttribute("href") || "";
      return /^(https?:|mailto:|tel:|\/|#)/.test(href) ? `[${contenu.trim()}](${href})` : contenu;
    }
    default: return contenu;
  }
}

function versMarkdown(racine, avecTitres) {
  const blocs = [];
  const ajouterTexte = (t) => { if (t.trim()) blocs.push(t.trim()); };
  for (const noeud of racine.childNodes) {
    if (noeud.nodeType === Node.TEXT_NODE) { ajouterTexte(enLigne(noeud)); continue; }
    if (noeud.nodeType !== Node.ELEMENT_NODE) continue;
    const balise = noeud.tagName;
    if (avecTitres && /^H[1-4]$/.test(balise)) blocs.push(`${balise === "H2" ? "##" : "###"} ${noeud.textContent.trim()}`);
    else if (balise === "UL" || balise === "OL") {
      blocs.push([...noeud.children].map((li, i) => `${balise === "OL" ? `${i + 1}.` : "-"} ${enLigne(li).trim()}`).join("\n"));
    } else if (balise === "DIV" || balise === "P" || /^H\d$/.test(balise)) ajouterTexte(enLigne(noeud).replace(/ *\n */g, "\n"));
    else ajouterTexte(enLigne(noeud));
  }
  return blocs.join("\n\n");
}

const texteBrut = (el) => el.textContent.replace(/\s+/g, " ").trim();

// ---------- Images : redimensionnement dans le navigateur ----------

async function preparerImage(fichier) {
  let source;
  try {
    source = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`« ${fichier.name} » n’est pas une image lisible par ce navigateur (essayez en JPEG ou PNG).`);
  }
  const echelle = Math.min(1, MAX_IMAGE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * echelle);
  canvas.height = Math.round(source.height * echelle);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  // Le réencodage JPEG supprime toutes les métadonnées EXIF, dont la position GPS.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  const nom = `${slugifier(fichier.name.replace(/\.[^.]+$/, ""))}-${Date.now().toString(36)}.jpg`;
  return { blob, nom, url: URL.createObjectURL(blob) };
}

// ---------- État de la session d'édition ----------

const fichiers = new Map(); // "projets/silice" -> { json, sha }
const textesModifies = new Map(); // élément -> { fichier, chemin, format }
const fichiersTouches = new Set(); // fichiers dont la structure a changé (images, réglages)
const imagesAEnvoyer = new Map(); // "medias/…" -> Blob
const imagesASupprimer = new Set(); // "medias/…"
let barre, compteur, etat;
let contenusSite = null; // /admin/contenus.json : titres des projets, adresse du service d'IA

function nombreModifications() {
  return textesModifies.size + fichiersTouches.size;
}
function majCompteur() {
  const n = nombreModifications();
  compteur.textContent = n ? `Enregistrer (${n})` : "Enregistrer";
  compteur.disabled = n === 0;
}
function signalerTouche(fichier) {
  fichiersTouches.add(fichier);
  majCompteur();
}
function annoncer(texte, type = "info") {
  etat.textContent = texte;
  etat.dataset.type = type;
}

function demarrer() {
  const params = new URLSearchParams(location.search);
  if (params.has("edition")) {
    sessionStorage.setItem(CLE_SESSION, "1");
    params.delete("edition");
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
  }
  const lien = element("link", { rel: "stylesheet", href: new URL("./admin.css", import.meta.url).href });
  document.head.append(lien);
  if (sessionStorage.getItem(CLE_SESSION)) lien.addEventListener("load", activer, { once: true });
  else document.body.append(element("button", { type: "button", class: "edition-lanceur", onclick: () => { sessionStorage.setItem(CLE_SESSION, "1"); activer(); } }, "Modifier cette page"));
}

async function activer() {
  $(".edition-lanceur")?.remove();
  document.body.classList.add("mode-edition");
  construireBarre();

  const cles = new Set();
  $$("[data-champ]").forEach((el) => cles.add(decouper(el.dataset.champ).fichier));
  $$("[data-champ-image]").forEach((el) => cles.add(decouper(el.dataset.champImage).fichier));
  if (document.body.dataset.fichier) cles.add(document.body.dataset.fichier);

  annoncer("Chargement des contenus…");
  gh.config().then((c) => { contenusSite = c; }, () => {});
  try {
    await Promise.all([...cles].map(async (fichier) => {
      const { json, sha } = await gh.lireJson(`contenu/${fichier}.json`);
      fichiers.set(fichier, { json, sha });
    }));
  } catch (e) {
    annoncer(e.message, "erreur");
    return;
  }
  annoncer(document.body.dataset.lang === "en"
    ? "Version anglaise. Les textes encadrés en orange sont affichés en français faute de traduction."
    : "Cliquez sur un texte ou une image pour le modifier.");

  preparerTextes();
  preparerImages();
  if (document.body.dataset.page === "projet") preparerProjet();
  window.addEventListener("beforeunload", (e) => {
    if (nombreModifications()) e.preventDefault();
  });
}

// ---------- Barre d'édition ----------

function construireBarre() {
  const lang = document.body.dataset.lang;
  const titre = $("h1")?.textContent.trim() || document.title;
  const autre = $(`.langues a:not([aria-current])`);
  compteur = element("button", { type: "button", class: "edition-bouton edition-bouton--principal", disabled: true, onclick: enregistrerTout }, "Enregistrer");
  etat = element("p", { class: "edition-etat", role: "status", "aria-live": "polite" });
  barre = element("div", { class: "edition-barre", role: "region", "aria-label": "Barre d’édition" },
    element("div", { class: "edition-barre__gauche" },
      element("span", { class: "edition-barre__page", texte: `${titre} · ${lang.toUpperCase()}` }),
      autre ? element("a", { class: "edition-bouton edition-bouton--discret", href: autre.href, onclick: (e) => { if (nombreModifications() && !confirm("Des modifications ne sont pas enregistrées. Changer de langue quand même ?")) e.preventDefault(); } }, `Passer en ${lang === "fr" ? "EN" : "FR"}`) : null),
    etat,
    element("div", { class: "edition-barre__droite" },
      element("a", { class: "edition-bouton edition-bouton--discret", href: new URL("./", import.meta.url).href }, "Tableau de bord"),
      compteur,
      element("button", { type: "button", class: "edition-bouton", onclick: annuler }, "Annuler"),
      element("button", { type: "button", class: "edition-bouton", onclick: quitter }, "Quitter")));
  document.body.prepend(barre);
}

function annuler() {
  if (nombreModifications() && !confirm("Abandonner les modifications non enregistrées ?")) return;
  textesModifies.clear();
  fichiersTouches.clear();
  location.reload();
}

function quitter() {
  if (nombreModifications() && !confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
  textesModifies.clear();
  fichiersTouches.clear();
  sessionStorage.removeItem(CLE_SESSION);
  location.reload();
}

// ---------- Textes ----------

const editionRiche = (el) => el.dataset.format === "markdown" || el.dataset.format === "markdown-page";
const supportePlaintext = (() => {
  const d = document.createElement("div");
  d.contentEditable = "plaintext-only";
  return d.contentEditable === "plaintext-only";
})();

function preparerTextes() {
  document.execCommand?.("defaultParagraphSeparator", false, "p");
  for (const el of $$("[data-champ]")) {
    // Champs vides de la fiche projet : visibles en mode édition seulement, avec une invite
    const cache = el.hidden ? el : el.closest("[hidden]");
    if (cache && cache !== document.body) {
      cache.hidden = false;
      cache.classList.add("edition-revele");
    }
    if (!texteBrut(el)) {
      el.replaceChildren(); // retire les espaces pour que l'invite (:empty) s'affiche
      el.dataset.invite = el.closest(".fiche") ? "À compléter" : "Cliquez pour écrire";
    }
    el.tabIndex = 0;
    el.classList.add("edition-champ");
    el.addEventListener("focus", () => commencer(el));
    el.addEventListener("click", (e) => {
      if (el.closest("a")) e.preventDefault();
      commencer(el);
    });
  }
}

let barreTexte;
function commencer(el) {
  if (el.isContentEditable) return;
  const riche = editionRiche(el);
  el.contentEditable = riche ? "true" : supportePlaintext ? "plaintext-only" : "true";
  el.spellcheck = true;
  el.focus();
  if (riche) afficherBarreTexte(el);
  if (!el.dataset.ecoute) {
    el.dataset.ecoute = "1";
    el.addEventListener("input", () => {
      const { fichier, chemin } = decouper(el.dataset.champ);
      textesModifies.set(el, { fichier, chemin, format: el.dataset.format });
      if (texteBrut(el)) delete el.dataset.invite;
      el.classList.add("edition-modifie");
      majCompteur();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !editionRiche(el)) { e.preventDefault(); el.blur(); }
      if (e.key === "Escape") el.blur();
    });
    el.addEventListener("paste", (e) => {
      // Colle uniquement du texte, sans la mise en forme d'origine
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    });
    el.addEventListener("blur", () => {
      setTimeout(() => {
        if (barreTexte?.contains(document.activeElement)) return;
        el.contentEditable = "false";
        barreTexte?.remove();
        barreTexte = null;
      }, 150);
    });
  }
}

function afficherBarreTexte(el) {
  barreTexte?.remove();
  const action = (commande, libelle, texte) => element("button", {
    type: "button", class: "edition-mini__bouton", "aria-label": libelle, title: libelle,
    onmousedown: (e) => e.preventDefault(),
    onclick: () => {
      if (commande === "createLink") {
        const url = prompt("Adresse du lien (https://…) :", "https://");
        if (url && /^(https?:\/\/|mailto:)/.test(url)) document.execCommand("createLink", false, url);
      } else document.execCommand(commande);
      el.dispatchEvent(new Event("input"));
      el.focus();
    },
  }, texte);
  barreTexte = element("div", { class: "edition-mini", role: "toolbar", "aria-label": "Mise en forme" },
    action("bold", "Gras", element("strong", { texte: "G" })),
    action("italic", "Italique", element("em", { texte: "I" })),
    action("createLink", "Lien", "Lien"),
    action("unlink", "Retirer le lien", "Sans lien"));
  el.before(barreTexte);
}

// ---------- Images ----------

// Ce que l'IA sait de la page : le titre et l'accroche (ou le projet que présente l'image)
function contexteIA(fichier, valeur) {
  const lie = valeur?.projet && contenusSite?.projets?.find((p) => p.slug === valeur.projet);
  if (lie) return { titre: lie.titre, page: "projet" };
  const json = fichiers.get(fichier)?.json || {};
  return {
    titre: json.fr?.titre || $("h1")?.textContent.trim() || document.title,
    page: fichier.startsWith("projets/") ? "projet" : fichier.startsWith("missions/") ? "mission" : "page",
    accroche: json.fr?.accroche || "",
  };
}

const sourceImage = (conteneur) => {
  const img = conteneur?.querySelector("img");
  return img?.currentSrc || img?.src || "";
};

// image : { source, contexte, proposition? } pour proposer le texte par l'IA ;
// une « proposition » déjà lancée (promesse) remplit les champs dès l'ouverture.
const dialogueTexte = (() => {
  let dialogue;
  return (valeurs, avecLegende, image) => new Promise((resolve) => {
    dialogue?.remove();
    const champ = (id, libelle, valeur, requis) => element("div", { class: "champ" },
      element("label", { for: id, texte: libelle + (requis ? " (obligatoire)" : "") }),
      element("input", { id, name: id, type: "text", value: valeur || "", required: requis }));
    const avecIA = Boolean(image?.source && contenusSite?.ia);
    const etatIA = element("p", { class: "texte-secondaire edition-ia__etat", role: "status", "aria-live": "polite",
      texte: "L’IA décrit l’image d’après le titre de la page, ou corrige et traduit le texte déjà écrit. Relisez toujours sa proposition." });
    const boutonIA = element("button", { type: "button", class: "edition-bouton", onclick: () => proposer() }, "Proposer un texte");
    const courant = dialogue = element("dialog", { class: "edition-dialogue", "aria-labelledby": "edition-dialogue-titre" },
      element("form", { method: "dialog" },
        element("h2", { id: "edition-dialogue-titre", texte: "Texte de l’image" }),
        element("p", { class: "texte-secondaire", texte: "Le texte alternatif décrit l’image pour les personnes qui ne la voient pas (lecteur d’écran, image non chargée)." }),
        avecIA ? element("div", { class: "edition-ia" }, boutonIA, etatIA) : null,
        champ("alt-fr", "Texte alternatif en français", valeurs.alt?.fr, true),
        champ("alt-en", "Texte alternatif en anglais", valeurs.alt?.en, false),
        avecLegende ? champ("legende-fr", "Légende en français", valeurs.legende?.fr, false) : null,
        avecLegende ? champ("legende-en", "Légende en anglais", valeurs.legende?.en, false) : null,
        element("div", { class: "admin-dialogue__actions" },
          element("button", { class: "edition-bouton", value: "annuler", formnovalidate: true }, "Annuler"),
          element("button", { class: "edition-bouton edition-bouton--principal", value: "ok" }, "Valider"))));
    const v = (id) => courant.querySelector(`#${id}`)?.value.trim() ?? "";
    const ids = ["alt-fr", "alt-en", ...(avecLegende ? ["legende-fr", "legende-en"] : [])];

    async function proposer(dejaLancee) {
      const envoyes = Object.fromEntries(ids.map((id) => [id, v(id)]));
      boutonIA.disabled = true;
      delete etatIA.dataset.type;
      etatIA.textContent = "Proposition en cours…";
      try {
        const r = await (dejaLancee || ia.proposer({ source: image.source, ...image.contexte,
          alt: { fr: envoyes["alt-fr"], en: envoyes["alt-en"] },
          legende: avecLegende ? { fr: envoyes["legende-fr"], en: envoyes["legende-en"] } : undefined }));
        if (!courant.open) return;
        const recus = { "alt-fr": r.alt.fr, "alt-en": r.alt.en, "legende-fr": r.legende?.fr, "legende-en": r.legende?.en };
        // Un champ modifié pendant l'attente n'est pas écrasé
        for (const id of ids) if (recus[id] && v(id) === envoyes[id]) courant.querySelector(`#${id}`).value = recus[id];
        etatIA.textContent = "Proposition de l’IA : relisez-la et corrigez-la si besoin avant de valider.";
      } catch (e) {
        etatIA.textContent = e.message;
        etatIA.dataset.type = "erreur";
      } finally {
        boutonIA.disabled = false;
      }
    }

    document.body.append(courant);
    courant.addEventListener("close", () => {
      if (courant.returnValue !== "ok") return resolve(null);
      resolve({ alt: { fr: v("alt-fr"), en: v("alt-en") }, legende: avecLegende ? { fr: v("legende-fr"), en: v("legende-en") } : undefined });
    });
    courant.showModal();
    if (avecIA && image.proposition) proposer(image.proposition);
  });
})();

// Lance la proposition de l'IA pour une image qui vient d'être choisie (sans attendre la fenêtre)
function propositionIA(source, contexte, legende) {
  if (!contenusSite?.ia) return undefined;
  const p = ia.proposer({ source, ...contexte, legende });
  p.catch(() => {}); // l'erreur s'affiche dans la fenêtre, à l'ouverture
  return p;
}

function choisirFichiers(multiple) {
  return new Promise((resolve) => {
    const input = element("input", { type: "file", accept: "image/*", multiple, hidden: true });
    input.addEventListener("change", () => { resolve([...input.files]); input.remove(); });
    document.body.append(input);
    input.click();
  });
}

function apercu(url, alt) {
  return element("img", { src: url, alt: alt || "", class: "edition-apercu" });
}

function preparerImages() {
  const projet = document.body.dataset.page === "projet" ? document.body.dataset.fichier : null;
  for (const conteneur of $$("[data-champ-image]")) {
    const { fichier } = decouper(conteneur.dataset.champImage);
    if (fichier === projet && conteneur.dataset.champImage.includes(":images.")) continue; // géré par la galerie
    ajouterOutilsImageSimple(conteneur);
  }
  if (projet) preparerGalerie(projet);
}

// Image isolée (accueil, démarche, missions) : remplacer, modifier le texte
function ajouterOutilsImageSimple(conteneur) {
  const { fichier, chemin } = decouper(conteneur.dataset.champImage);
  const outils = element("div", { class: "edition-outils-image" },
    element("button", { type: "button", onclick: async () => {
      const valeur = lireChemin(fichiers.get(fichier).json, chemin);
      const resultat = await dialogueTexte(valeur, false, { source: sourceImage(conteneur), contexte: contexteIA(fichier, valeur) });
      if (!resultat) return;
      valeur.alt = resultat.alt;
      conteneur.querySelector("img")?.setAttribute("alt", resultat.alt[document.body.dataset.lang] || resultat.alt.fr);
      signalerTouche(fichier);
    } }, "Texte"),
    element("button", { type: "button", onclick: async () => {
      const [choix] = await choisirFichiers(false);
      if (!choix) return;
      try {
        const image = await preparerImage(choix);
        const valeur = lireChemin(fichiers.get(fichier).json, chemin);
        const contexte = contexteIA(fichier, valeur);
        const resultat = await dialogueTexte({ alt: { fr: "", en: "" } }, false,
          { source: image.url, contexte, proposition: propositionIA(image.url, contexte) });
        if (!resultat?.alt.fr) return annoncer("Image non remplacée : le texte alternatif est obligatoire.", "erreur");
        valeur.image = `pages/${image.nom}`;
        valeur.alt = resultat.alt;
        imagesAEnvoyer.set(`medias/pages/${image.nom}`, image.blob);
        const ancienne = conteneur.querySelector("picture, img.edition-apercu");
        ancienne?.replaceWith(apercu(image.url, resultat.alt.fr));
        signalerTouche(fichier);
      } catch (e) {
        annoncer(e.message, "erreur");
      }
    } }, "Remplacer"));
  conteneur.classList.add("edition-image");
  conteneur.append(outils);
}

// Galerie d'un projet : remplacer, supprimer, déplacer, texte, couverture, ajouter
function preparerGalerie(cle) {
  const projet = fichiers.get(cle).json;
  const article = $(".projet");
  const dossier = `medias/projets/${projet.slug}/`;
  // Chaque image de la page, dans l'ordre du fichier JSON
  const vues = projet.images.map((_, i) => $(`[data-champ-image="${cle}:images.${i}"] .vignette`));
  let liste = projet.images.map((image, i) => ({ image, vue: vues[i] }));

  const emplacements = () => {
    const premier = $(".projet__premiere");
    return [premier, ...$$(".galerie > li")].filter(Boolean);
  };

  const assurerGalerie = () => {
    let galerie = $(".galerie");
    if (!galerie) {
      galerie = element("ul", { class: "galerie" });
      article.append(element("div", { class: "projet__galerie" }, galerie));
    }
    return galerie;
  };

  const redessiner = () => {
    // Premier emplacement
    let premier = $(".projet__premiere");
    if (!premier && liste.length) {
      premier = element("figure", { class: "projet__premiere" });
      article.prepend(premier);
    }
    const galerie = liste.length > 1 ? assurerGalerie() : $(".galerie");
    const places = [premier, ...(galerie ? $$(":scope > li", galerie) : [])].filter(Boolean);
    while (places.length < liste.length) {
      const li = element("li");
      galerie.append(li);
      places.push(li);
    }
    places.forEach((place, i) => {
      place.replaceChildren();
      if (i >= liste.length) { place.remove(); return; }
      place.classList.add("edition-image");
      place.dataset.position = i;
      const { image, vue } = liste[i];
      place.append(vue, outilsGalerie(i, image));
    });
    projet.images = liste.map(({ image }) => image);
  };

  const outilsGalerie = (i, image) => element("div", { class: "edition-outils-image" },
    image.fichier === projet.couverture ? element("span", { class: "edition-etiquette", texte: "Couverture" })
      : element("button", { type: "button", onclick: () => { projet.couverture = image.fichier; redessiner(); signalerTouche(cle); } }, "Couverture"),
    element("button", { type: "button", "aria-label": "Déplacer avant", disabled: i === 0, onclick: () => deplacer(i, -1) }, "←"),
    element("button", { type: "button", "aria-label": "Déplacer après", disabled: i === liste.length - 1, onclick: () => deplacer(i, 1) }, "→"),
    element("button", { type: "button", onclick: () => modifierTexte(i) }, "Texte"),
    element("button", { type: "button", onclick: () => remplacer(i) }, "Remplacer"),
    element("button", { type: "button", class: "edition-danger", onclick: () => supprimer(i) }, "Supprimer"));

  const deplacer = (i, sens) => {
    [liste[i], liste[i + sens]] = [liste[i + sens], liste[i]];
    redessiner();
    signalerTouche(cle);
  };

  // nouvelle : l'image vient d'être remplacée, son ancien texte alternatif ne la décrit plus
  const modifierTexte = async (i, nouvelle) => {
    const source = sourceImage(liste[i].vue);
    const contexte = contexteIA(cle);
    const valeurs = nouvelle ? { ...liste[i].image, alt: { fr: "", en: "" } } : liste[i].image;
    const resultat = await dialogueTexte(valeurs, true,
      { source, contexte, proposition: nouvelle ? propositionIA(source, contexte, valeurs.legende) : undefined });
    if (!resultat) return;
    Object.assign(liste[i].image, resultat);
    liste[i].vue.querySelector("img")?.setAttribute("alt", resultat.alt.fr);
    liste[i].vue.dataset.legende = resultat.legende.fr;
    signalerTouche(cle);
  };

  const oublierFichier = (nom) => {
    if (liste.some((l) => l.image.fichier === nom)) return;
    const chemin = dossier + nom;
    if (imagesAEnvoyer.has(chemin)) imagesAEnvoyer.delete(chemin);
    else imagesASupprimer.add(chemin);
  };

  const remplacer = async (i) => {
    const [choix] = await choisirFichiers(false);
    if (!choix) return;
    try {
      const nouvelle = await preparerImage(choix);
      const ancienNom = liste[i].image.fichier;
      liste[i].image.fichier = nouvelle.nom;
      if (projet.couverture === ancienNom) projet.couverture = nouvelle.nom;
      imagesAEnvoyer.set(dossier + nouvelle.nom, nouvelle.blob);
      liste[i].vue = element("a", { class: "vignette", href: nouvelle.url }, apercu(nouvelle.url, liste[i].image.alt?.fr));
      oublierFichier(ancienNom);
      redessiner();
      signalerTouche(cle);
      annoncer("Image remplacée. Vérifiez son texte (bouton « Texte »).");
      await modifierTexte(i, true);
    } catch (e) {
      annoncer(e.message, "erreur");
    }
  };

  const supprimer = (i) => {
    if (!confirm("Supprimer cette image du projet ? (Elle reste récupérable dans l’historique.)")) return;
    const [retiree] = liste.splice(i, 1);
    if (projet.couverture === retiree.image.fichier) projet.couverture = liste[0]?.image.fichier || "";
    oublierFichier(retiree.image.fichier);
    redessiner();
    signalerTouche(cle);
  };

  const ajouter = async () => {
    const choix = await choisirFichiers(true);
    const contexte = contexteIA(cle);
    // Les images sont préparées l'une après l'autre (mémoire du téléphone), sans attendre
    // les fenêtres : les textes des suivantes arrivent pendant qu'Alice relit le premier.
    let file = Promise.resolve();
    const preparees = choix.map((fichier) => {
      const p = file.then(() => preparerImage(fichier)).then((nouvelle) => ({ ...nouvelle, proposition: propositionIA(nouvelle.url, contexte) }));
      file = p.catch(() => {});
      return p;
    });
    for (const [n, fichier] of choix.entries()) {
      try {
        annoncer(`Préparation de « ${fichier.name} »…`);
        const nouvelle = await preparees[n];
        const textes = await dialogueTexte({ alt: { fr: "", en: "" }, legende: { fr: "", en: "" } }, true,
          { source: nouvelle.url, contexte, proposition: nouvelle.proposition });
        if (!textes?.alt.fr) {
          annoncer(`« ${fichier.name} » n’a pas été ajoutée : le texte alternatif est obligatoire.`, "erreur");
          continue;
        }
        const image = { fichier: nouvelle.nom, alt: textes.alt, legende: textes.legende };
        imagesAEnvoyer.set(dossier + nouvelle.nom, nouvelle.blob);
        liste.push({ image, vue: element("a", { class: "vignette", href: nouvelle.url }, apercu(nouvelle.url, textes.alt.fr)) });
        if (!projet.couverture) projet.couverture = nouvelle.nom;
        redessiner();
        signalerTouche(cle);
        annoncer(`${choix.length > 1 ? "Images ajoutées" : "Image ajoutée"}. N’oubliez pas d’enregistrer.`);
      } catch (e) {
        annoncer(e.message, "erreur");
      }
    }
  };

  // En mode édition, un clic sur une image ne l'ouvre pas : on utilise ses boutons
  article.addEventListener("click", (e) => { if (e.target.closest(".vignette")) e.preventDefault(); }, true);
  const boutonAjout = element("button", { type: "button", class: "edition-ajout-images", onclick: ajouter }, "+ Ajouter des images");
  article.after(element("div", { class: "conteneur edition-zone-ajout" }, boutonAjout));
  redessiner();
}

// ---------- Réglages d'un projet : publié, catégories, missions, ordre ----------

async function preparerProjet() {
  const cle = document.body.dataset.fichier;
  const projet = fichiers.get(cle).json;
  let contenus;
  try {
    contenus = await gh.config();
  } catch {
    return;
  }
  if (!projet.publie) {
    $(".projet")?.before(element("p", { class: "conteneur edition-alerte", texte: "Ce projet est masqué : il n’apparaît pas sur le site. Cochez « Publié » dans les réglages pour le mettre en ligne." }));
  }
  const panneau = element("dialog", { class: "edition-dialogue edition-reglages", "aria-labelledby": "titre-reglages" });
  const cases = (nom, options, valeurs) => element("div", { class: "admin-categories__liste" },
    ...options.map((o) => element("label", { class: "admin-case" },
      element("input", { type: "checkbox", name: nom, value: o.slug, checked: valeurs.includes(o.slug) }), ` ${o.fr || o.titre}`)));
  panneau.append(element("form", { method: "dialog" },
    element("h2", { id: "titre-reglages", texte: "Réglages du projet" }),
    element("label", { class: "admin-case admin-case--grande" }, element("input", { type: "checkbox", name: "publie", checked: projet.publie }), " Publié (visible sur le site)"),
    element("fieldset", { class: "admin-categories" }, element("legend", { texte: "Catégories (filtres de la page Projets)" }), cases("categories", contenus.categories, projet.categories || [])),
    element("fieldset", { class: "admin-categories" }, element("legend", { texte: "Missions liées" }), cases("missions", contenus.missions, projet.missions || [])),
    element("div", { class: "champ" }, element("label", { for: "reglage-ordre", texte: "Position dans la liste des projets (1 = premier)" }),
      element("input", { id: "reglage-ordre", name: "ordre", type: "number", min: 1, value: projet.ordre ?? 99 })),
    element("p", { class: "texte-secondaire", texte: "Pour réordonner tous les projets d’un coup, utilisez le tableau de bord." }),
    element("div", { class: "admin-dialogue__actions" },
      element("button", { class: "edition-bouton", value: "annuler", formnovalidate: true }, "Annuler"),
      element("button", { class: "edition-bouton edition-bouton--principal", value: "ok" }, "Appliquer"))));
  panneau.addEventListener("close", () => {
    if (panneau.returnValue !== "ok") return;
    const f = panneau.querySelector("form");
    projet.publie = f.publie.checked;
    projet.categories = [...f.querySelectorAll("[name=categories]:checked")].map((c) => c.value);
    projet.missions = [...f.querySelectorAll("[name=missions]:checked")].map((c) => c.value);
    projet.ordre = Number(f.ordre.value) || projet.ordre;
    signalerTouche(cle);
    annoncer("Réglages modifiés. N’oubliez pas d’enregistrer.");
  });
  document.body.append(panneau);
  $(".edition-barre__droite").prepend(element("button", { type: "button", class: "edition-bouton edition-bouton--discret", onclick: () => panneau.showModal() }, "Réglages du projet"));
}

// ---------- Enregistrement ----------

async function enregistrerTout() {
  if (!nombreModifications()) return;
  compteur.disabled = true;
  annoncer("Vérification…");

  // Textes : on applique chaque modification au fichier JSON correspondant
  const touches = new Set(fichiersTouches);
  for (const [el, { fichier, chemin, format }] of textesModifies) {
    const valeur = format === "markdown" ? versMarkdown(el, false) : format === "markdown-page" ? versMarkdown(el, true) : texteBrut(el);
    ecrireChemin(fichiers.get(fichier).json, chemin, valeur);
    touches.add(fichier);
  }

  // Texte alternatif obligatoire
  for (const fichier of touches) {
    const json = fichiers.get(fichier).json;
    const sansAlt = (json.images || []).find((im) => !im.alt?.fr?.trim());
    if (sansAlt) {
      compteur.disabled = false;
      return annoncer(`L’image « ${sansAlt.fichier} » n’a pas de texte alternatif : renseignez-le (bouton « Texte ») avant d’enregistrer.`, "erreur");
    }
  }

  try {
    // Le fichier a-t-il changé depuis l'ouverture de la page ?
    for (const fichier of touches) {
      const actuel = await gh.shaActuel(`contenu/${fichier}.json`);
      if (actuel !== fichiers.get(fichier).sha) {
        compteur.disabled = false;
        return annoncer(`« ${fichier} » a été modifié ailleurs depuis l’ouverture de cette page. Pour ne rien écraser, copiez vos textes, rechargez la page et recommencez.`, "erreur");
      }
    }
    annoncer(imagesAEnvoyer.size ? `Envoi de ${imagesAEnvoyer.size} image(s)…` : "Enregistrement…");
    const aEnvoyer = [
      ...[...touches].map((fichier) => ({ chemin: `contenu/${fichier}.json`, texte: `${JSON.stringify(fichiers.get(fichier).json, null, 2)}\n` })),
      ...[...imagesAEnvoyer].map(([chemin, blob]) => ({ chemin, blob })),
      ...[...imagesASupprimer].map((chemin) => ({ chemin, supprimer: true })),
    ];
    const nomPage = ($("h1")?.textContent || document.title).trim().slice(0, 60);
    const sha = await gh.enregistrer(aEnvoyer, `Modification : ${nomPage} (admin)`);

    for (const fichier of touches) fichiers.get(fichier).sha = await gh.shaActuel(`contenu/${fichier}.json`);
    textesModifies.clear();
    fichiersTouches.clear();
    imagesAEnvoyer.clear();
    imagesASupprimer.clear();
    $$(".edition-modifie").forEach((el) => el.classList.remove("edition-modifie"));
    majCompteur();
    annoncer("Enregistré. En ligne dans environ 2 minutes.", "succes");
    gh.suivreDeploiement(sha, ({ etat: e }) => {
      if (e === "en-cours") annoncer("Enregistré. Mise en ligne en cours…", "succes");
      if (e === "en-ligne") annoncer("C’est en ligne. Rechargez la page pour voir le résultat final.", "succes");
      if (e === "erreur") annoncer("Enregistré, mais la mise en ligne a échoué. Les modifications sont conservées dans l’historique.", "erreur");
    });
  } catch (e) {
    compteur.disabled = false;
    annoncer(e.message, "erreur");
  }
}

// ---------- Lancement ----------

// Le module est injecté dans <head> : on attend que la page soit construite.
const lancer = () => { if (!document.body.classList.contains("admin")) demarrer(); };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lancer, { once: true });
else lancer();
