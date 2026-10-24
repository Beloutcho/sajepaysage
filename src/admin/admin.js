// Tableau de bord /admin/ : connexion par clé d'accès, liste des contenus,
// nouveau projet, ordre des projets, accueil (diaporama, « À la une »),
// état de la mise en ligne et historique.
import * as gh from "./github.js";

const $ = (s, racine = document) => racine.querySelector(s);
const base = new URL("../", import.meta.url);
const lienSite = (chemin) => new URL(chemin.replace(/^\//, ""), base).href;
const vignette = (chemin) => (chemin ? lienSite(chemin) : "");

const message = $(".admin-message");
function annoncer(texte, type = "info") {
  message.textContent = texte;
  message.dataset.type = type;
  message.hidden = !texte;
  if (texte) message.scrollIntoView({ block: "nearest" });
}

const element = (balise, attributs = {}, ...enfants) => {
  const el = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (cle === "texte") el.textContent = valeur;
    else if (cle.startsWith("on")) el.addEventListener(cle.slice(2), valeur);
    else if (valeur !== false && valeur != null) el.setAttribute(cle, valeur === true ? "" : valeur);
  }
  el.append(...enfants.filter(Boolean));
  return el;
};

const slugifier = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// ---------- Connexion ----------

async function demarrer() {
  try {
    await gh.config();
  } catch (e) {
    annoncer(e.message, "erreur");
    return;
  }
  if (gh.jeton.lire()) afficherTableau();
  else afficherConnexion();
}

function afficherConnexion() {
  $(".admin-connexion").hidden = false;
  $(".admin-tableau").hidden = true;
  $(".admin-deconnexion").hidden = true;
  $("#cle").focus();
}

$(".admin-connexion__formulaire").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erreur = $(".admin-connexion__erreur");
  const valeur = $("#cle").value.trim();
  erreur.hidden = true;
  const bouton = e.submitter;
  bouton.disabled = true;
  bouton.textContent = "Vérification…";
  try {
    const { expiration } = await gh.verifierJeton(valeur);
    gh.jeton.enregistrer(valeur, expiration);
    $("#cle").value = "";
    $(".admin-connexion").hidden = true;
    afficherTableau();
  } catch (err) {
    erreur.textContent = err.message;
    erreur.hidden = false;
  } finally {
    bouton.disabled = false;
    bouton.textContent = "Se connecter";
  }
});

$(".admin-deconnexion").addEventListener("click", () => {
  gh.jeton.effacer();
  annoncer("Vous êtes déconnectée. La clé a été effacée de ce navigateur.");
  afficherConnexion();
});

// ---------- Tableau de bord ----------

let contenus = null;

async function afficherTableau() {
  $(".admin-tableau").hidden = false;
  $(".admin-deconnexion").hidden = false;
  contenus = await gh.config();
  avertirExpiration();
  remplirListes();
  remplirOrdre();
  remplirAccueil();
  majDeploiement();
  remplirHistorique();
}

function avertirExpiration() {
  const expiration = gh.jeton.expiration();
  const zone = $(".admin-avertissement");
  if (!expiration) return;
  const jours = Math.floor((new Date(expiration) - Date.now()) / 86400000);
  if (jours <= 30) {
    zone.hidden = false;
    zone.textContent = jours < 0
      ? "Votre clé d’accès a expiré : créez-en une nouvelle (voir l’aide d’administration) puis reconnectez-vous."
      : `Votre clé d’accès expire dans ${jours} jour${jours > 1 ? "s" : ""}. Pensez à en créer une nouvelle (voir l’aide d’administration).`;
  }
}

function ligneContenu(entree, { statut } = {}) {
  return element("li", { class: "admin-ligne" },
    entree.vignette ? element("img", { src: vignette(entree.vignette), alt: "", width: 64, height: 43, loading: "lazy" }) : element("span", { class: "admin-ligne__vide", "aria-hidden": "true" }),
    element("span", { class: "admin-ligne__titre", texte: entree.titre }),
    element("span", { class: "admin-ligne__etiquettes" },
      statut !== undefined ? element("span", { class: `etiquette ${statut ? "etiquette--ok" : "etiquette--masque"}`, texte: statut ? "Publié" : "Masqué" }) : null,
      element("span", { class: `etiquette ${entree.enComplet ? "etiquette--ok" : "etiquette--alerte"}`, texte: entree.enComplet ? "EN complet" : "EN incomplet" })),
    element("span", { class: "admin-ligne__actions" },
      element("a", { class: "bouton bouton--contour bouton--petit", href: `${lienSite(entree.url.fr)}?edition=1`, texte: "Modifier sur la page" }),
      element("a", { class: "bouton bouton--contour bouton--petit", href: `${lienSite(entree.url.en)}?edition=1`, "aria-label": `Modifier la version anglaise : ${entree.titre}`, texte: "EN" })));
}

function remplirListes() {
  $("[data-liste=pages] ul").replaceChildren(...contenus.pages.map((p) => ligneContenu(p)));
  $("[data-liste=missions] ul").replaceChildren(...contenus.missions.map((m) => ligneContenu(m)));
  $("[data-liste=projets] ul").replaceChildren(...contenus.projets.map((p) => ligneContenu(p, { statut: p.publie })));
}

// ---------- Listes triables (flèches + glisser-déposer) ----------

function listeTriable(ol, elements, rendu, auChangement) {
  let ordre = [...elements];
  const dessiner = () => {
    ol.replaceChildren(...ordre.map((item, i) => {
      const li = element("li", { class: "admin-tri__item", draggable: "true", "data-index": i },
        element("span", { class: "admin-tri__poignee", "aria-hidden": "true", texte: "⠿" }),
        rendu(item),
        element("span", { class: "admin-tri__boutons" },
          element("button", { type: "button", class: "admin-tri__bouton", "aria-label": "Monter", disabled: i === 0, onclick: () => deplacer(i, -1) }, "↑"),
          element("button", { type: "button", class: "admin-tri__bouton", "aria-label": "Descendre", disabled: i === ordre.length - 1, onclick: () => deplacer(i, 1) }, "↓")));
      li.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", String(i)); li.classList.add("est-deplace"); });
      li.addEventListener("dragend", () => li.classList.remove("est-deplace"));
      li.addEventListener("dragover", (e) => e.preventDefault());
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const depart = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(depart) || depart === i) return;
        const [item] = ordre.splice(depart, 1);
        ordre.splice(i, 0, item);
        dessiner();
        auChangement(ordre);
      });
      return li;
    }));
  };
  const deplacer = (i, sens) => {
    const j = i + sens;
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
    dessiner();
    auChangement(ordre);
    ol.querySelectorAll(".admin-tri__item")[j]?.querySelector(`[aria-label="${sens < 0 ? "Monter" : "Descendre"}"]:not([disabled])`)?.focus();
  };
  dessiner();
  return {
    valeur: () => ordre,
    ajouter: (item) => { ordre.push(item); dessiner(); auChangement(ordre); },
    retirer: (i) => { ordre.splice(i, 1); dessiner(); auChangement(ordre); },
  };
}

// ---------- Ordre des projets ----------

let triProjets;
function remplirOrdre() {
  const bouton = $(".admin-enregistrer-ordre");
  const projets = [...contenus.projets].sort((a, b) => a.ordre - b.ordre);
  triProjets = listeTriable($("[data-tri=projets]"), projets, (p) => element("span", { class: "admin-tri__texte" },
    element("img", { src: vignette(p.vignette), alt: "", width: 48, height: 32 }),
    element("span", { texte: p.titre }),
    p.publie ? null : element("span", { class: "etiquette etiquette--masque", texte: "Masqué" })), () => { bouton.disabled = false; });

  bouton.onclick = async () => {
    bouton.disabled = true;
    annoncer("Enregistrement de l’ordre…");
    try {
      const fichiers = [];
      const nouvelOrdre = triProjets.valeur();
      for (const [i, p] of nouvelOrdre.entries()) {
        if (p.ordre === i + 1) continue;
        const chemin = `contenu/${p.fichier}.json`;
        const { json } = await gh.lireJson(chemin);
        json.ordre = i + 1;
        fichiers.push({ chemin, texte: `${JSON.stringify(json, null, 2)}\n` });
        p.ordre = i + 1;
      }
      if (!fichiers.length) return annoncer("L’ordre n’a pas changé.");
      const sha = await gh.enregistrer(fichiers, "Modification : ordre des projets (admin)");
      enregistre(sha);
    } catch (e) {
      bouton.disabled = false;
      annoncer(e.message, "erreur");
    }
  };
}

// ---------- Accueil : diaporama et « À la une » ----------

let triDiaporama;
function remplirAccueil() {
  const bouton = $(".admin-enregistrer-accueil");
  const modifie = () => { bouton.disabled = false; };
  const publies = contenus.projets.filter((p) => p.publie);
  const titreProjet = (slug) => contenus.projets.find((p) => p.slug === slug)?.titre || slug;

  triDiaporama = listeTriable($("[data-tri=diaporama]"), contenus.accueil.diaporama, (d) => element("span", { class: "admin-tri__texte" },
    element("img", { src: vignette(d.vignette), alt: "", width: 96, height: 48 }),
    element("span", { texte: d.legende || titreProjet(d.projet) }),
    element("button", { type: "button", class: "bouton bouton--contour bouton--petit", onclick: () => triDiaporama.retirer(triDiaporama.valeur().indexOf(d)) }, "Retirer")), modifie);

  const choixProjet = $("#diapo-projet");
  choixProjet.replaceChildren(element("option", { value: "", texte: "Choisir un projet…" }), ...publies.map((p) => element("option", { value: p.slug, texte: p.titre })));
  choixProjet.onchange = () => {
    const projet = contenus.projets.find((p) => p.slug === choixProjet.value);
    $(".admin-choix-images").replaceChildren(...(projet?.images || []).map((im) => element("button", {
      type: "button", class: "admin-choix-image", onclick: () => {
        triDiaporama.ajouter({ image: `projets/${projet.slug}/${im.fichier}`, projet: projet.slug, legende: projet.titre, alt: im.alt, vignette: im.vignette, nouvelle: true });
        $(".admin-ajout-diapo").open = false;
      },
    }, element("img", { src: vignette(im.vignette), alt: im.alt || im.fichier }))));
  };

  for (const select of document.querySelectorAll("[data-une]")) {
    const i = Number(select.dataset.une);
    select.replaceChildren(...publies.map((p) => element("option", { value: p.slug, texte: p.titre, selected: contenus.accueil.aLaUne[i] === p.slug })));
    select.onchange = modifie;
  }

  bouton.onclick = async () => {
    bouton.disabled = true;
    annoncer("Enregistrement de l’accueil…");
    try {
      const chemin = "contenu/accueil.json";
      const { json } = await gh.lireJson(chemin);
      const existantes = new Map(json.diaporama.map((d) => [d.image, d]));
      json.diaporama = triDiaporama.valeur().map((d) => existantes.get(d.image) || {
        image: d.image,
        projet: d.projet,
        alt: { fr: d.alt || "", en: "" },
        legende: { fr: d.legende, en: "" },
      });
      json.aLaUne = [...document.querySelectorAll("[data-une]")].map((s) => s.value);
      const sha = await gh.enregistrer([{ chemin, texte: `${JSON.stringify(json, null, 2)}\n` }], "Modification : accueil, diaporama et projets à la une (admin)");
      enregistre(sha);
    } catch (e) {
      bouton.disabled = false;
      annoncer(e.message, "erreur");
    }
  };
}

// ---------- Nouveau projet ----------

const dialogueNouveau = $(".admin-dialogue-nouveau");
$(".admin-nouveau").addEventListener("click", () => {
  $(".admin-categories__liste").replaceChildren(...contenus.categories.map((c) => element("label", { class: "admin-case" },
    element("input", { type: "checkbox", name: "categories", value: c.slug }), ` ${c.fr}`)));
  $(".admin-nouveau__erreur").hidden = true;
  dialogueNouveau.showModal();
  $("#nouveau-titre").focus();
});

dialogueNouveau.addEventListener("close", async () => {
  if (dialogueNouveau.returnValue !== "creer") return;
  const titre = $("#nouveau-titre").value.trim();
  const categories = [...dialogueNouveau.querySelectorAll("[name=categories]:checked")].map((c) => c.value);
  const slug = slugifier(titre);
  const erreur = (texte) => {
    $(".admin-nouveau__erreur").textContent = texte;
    $(".admin-nouveau__erreur").hidden = false;
    dialogueNouveau.showModal();
  };
  if (!slug) return erreur("Indiquez un titre.");
  if (contenus.projets.some((p) => p.slug === slug) || await gh.shaActuel(`contenu/projets/${slug}.json`)) {
    return erreur(`Un projet porte déjà l’adresse « ${slug} ». Choisissez un autre titre.`);
  }
  const projet = {
    slug,
    publie: false,
    ordre: Math.max(0, ...contenus.projets.map((p) => p.ordre || 0)) + 1,
    categories,
    lieu: "", date: "", commanditaire: "", partenaires: "",
    missions: [],
    fr: { titre, accroche: "", intervention: "", descriptif: "" },
    en: { titre: "", accroche: "", intervention: "", descriptif: "" },
    couverture: "",
    images: [],
  };
  annoncer("Création du projet…");
  try {
    const sha = await gh.enregistrer([{ chemin: `contenu/projets/${slug}.json`, texte: `${JSON.stringify(projet, null, 2)}\n` }], `Nouveau projet : ${titre} (admin)`);
    $("#nouveau-titre").value = "";
    enregistre(sha, `${lienSite(`/projets/${slug}/`)}?edition=1`);
  } catch (e) {
    annoncer(e.message, "erreur");
  }
});

// ---------- Mise en ligne ----------

const LIBELLES = { "en-cours": "Mise en ligne en cours…", "en-ligne": "En ligne", erreur: "Erreur lors de la mise en ligne", inconnu: "État inconnu" };

async function majDeploiement() {
  try {
    const etat = await gh.etatDeploiement();
    afficherEtat(etat);
    if (etat.etat === "en-cours") setTimeout(majDeploiement, 10000);
  } catch {
    afficherEtat({ etat: "inconnu" });
  }
}

function afficherEtat({ etat, date, url }) {
  $(".admin-deploiement .pastille").dataset.etat = etat;
  const texte = $(".admin-deploiement__texte");
  texte.textContent = LIBELLES[etat] || LIBELLES.inconnu;
  if (date) texte.append(` · ${new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`);
  if (etat === "erreur" && url) texte.append(" · ", element("a", { href: url, rel: "noopener", texte: "voir le détail sur GitHub" }));
}

function enregistre(sha, lienSuivant) {
  annoncer("Enregistré. En ligne dans environ 2 minutes.", "succes");
  afficherEtat({ etat: "en-cours" });
  gh.suivreDeploiement(sha, afficherEtat).then((etat) => {
    if (etat.etat === "en-ligne") {
      annoncer(lienSuivant ? "C’est en ligne. Ouverture de la page…" : "C’est en ligne.", "succes");
      if (lienSuivant) location.href = lienSuivant;
      else setTimeout(() => location.reload(), 1500);
    } else if (etat.etat === "erreur") {
      annoncer("La mise en ligne a échoué. Vos modifications sont enregistrées dans l’historique ; prévenez la personne qui gère le site si le problème persiste.", "erreur");
    }
  });
  remplirHistorique();
}

// ---------- Historique ----------

async function remplirHistorique() {
  const liste = $(".admin-historique");
  try {
    const commits = await gh.historique(20);
    liste.replaceChildren(...commits.map((c) => {
      const details = element("details", { class: "admin-historique__item" },
        element("summary", {},
          element("span", { class: "admin-historique__date", texte: new Date(c.commit.author.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) }),
          element("span", { texte: c.commit.message.split("\n")[0] })));
      details.addEventListener("toggle", async () => {
        if (!details.open || details.dataset.charge) return;
        details.dataset.charge = "1";
        const detail = await gh.detailCommit(c.sha);
        const fichiers = detail.files.filter((f) => f.filename.startsWith("contenu/") || f.filename.startsWith("medias/"));
        details.append(element("ul", { class: "admin-historique__fichiers" }, ...fichiers.map((f) => element("li", {},
          element("code", { texte: f.filename }),
          element("button", {
            type: "button", class: "bouton bouton--contour bouton--petit", texte: "Revenir à cette version",
            onclick: async (e) => {
              if (!confirm(`Rétablir ${f.filename} tel qu’il était après cette modification ?`)) return;
              e.target.disabled = true;
              try {
                enregistre(await gh.retablir(f.filename, c.sha));
              } catch (err) {
                annoncer(err.message, "erreur");
                e.target.disabled = false;
              }
            },
          })))), fichiers.length ? null : element("p", { class: "texte-secondaire", texte: "Aucun fichier de contenu dans cette modification." }));
      });
      return element("li", {}, details);
    }));
  } catch (e) {
    liste.replaceChildren(element("li", { texte: e.message }));
  }
}

demarrer();
