// Comportements communs à toutes les pages : menu mobile, sous-menu Missions,
// apparition des blocs au défilement, anciennes adresses « ?page_id= ».

const base = document.body.dataset.base || "/";
const animationsReduites = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Menu mobile
const boutonMenu = document.querySelector(".menu-bouton");
const menu = document.getElementById("menu-principal");
if (boutonMenu && menu) {
  const fermerMenu = () => {
    boutonMenu.setAttribute("aria-expanded", "false");
    menu.classList.remove("est-ouvert");
  };
  boutonMenu.addEventListener("click", () => {
    const ouvert = boutonMenu.getAttribute("aria-expanded") === "true";
    boutonMenu.setAttribute("aria-expanded", String(!ouvert));
    menu.classList.toggle("est-ouvert", !ouvert);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && boutonMenu.getAttribute("aria-expanded") === "true") {
      fermerMenu();
      boutonMenu.focus();
    }
  });
}

// Sous-menu Missions : bouton à côté du lien, fermeture avec Échap
for (const bouton of document.querySelectorAll(".nav__ouvrir")) {
  const element = bouton.closest(".nav__deroulant");
  bouton.addEventListener("click", () => {
    const ouvert = bouton.getAttribute("aria-expanded") === "true";
    bouton.setAttribute("aria-expanded", String(!ouvert));
    element.classList.toggle("est-ferme", ouvert);
  });
  element.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      bouton.setAttribute("aria-expanded", "false");
      element.classList.add("est-ferme");
      bouton.focus();
    }
  });
  element.addEventListener("mouseleave", () => element.classList.remove("est-ferme"));
  element.addEventListener("focusout", (e) => {
    if (!element.contains(e.relatedTarget)) {
      bouton.setAttribute("aria-expanded", "false");
      element.classList.remove("est-ferme");
    }
  });
}

// Apparition en fondu léger des blocs au défilement
const blocs = document.querySelectorAll(".apparition");
if (animationsReduites || !("IntersectionObserver" in window)) {
  blocs.forEach((b) => b.classList.add("est-visible"));
} else {
  const observateur = new IntersectionObserver((entrees) => {
    for (const entree of entrees) {
      if (entree.isIntersecting) {
        entree.target.classList.add("est-visible");
        observateur.unobserve(entree.target);
      }
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  blocs.forEach((b) => observateur.observe(b));
}

// Anciennes adresses WordPress de la forme /?page_id=233 (elles arrivent toutes sur l'accueil)
const PAGE_IDS = {
  10: "demarche/", 13: "projets/", 16: "missions/", 19: "contact/",
  229: "missions/conception-espaces-exterieurs/", 233: "missions/conception-espaces-exterieurs/",
  241: "missions/conception-espaces-exterieurs/", 236: "missions/enseignement/",
  239: "missions/installations-performances/", 240: "missions/ateliers-mediation/",
  128: "projets/prairie-ludique/", 138: "projets/bande-dessinee-paysage/", 139: "projets/campaneta/",
  140: "projets/chateau-de-la-roche/", 141: "projets/chateau-des-arcis/", 142: "projets/chaumont-sur-loire/",
  143: "projets/cueillette-andrya/", 144: "projets/festival-casc/", 145: "projets/jardin-eve/",
  146: "projets/jardin-madda/", 147: "projets/jardin-marjamin/", 148: "projets/siege-caddif/", 149: "projets/silice/",
};
const pageId = new URLSearchParams(location.search).get("page_id");
if (pageId && PAGE_IDS[pageId]) location.replace(base + PAGE_IDS[pageId]);
