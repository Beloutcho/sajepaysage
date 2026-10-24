// Diaporama d'accueil : fondu enchaîné de 1,2 s toutes les 6 s, pause au survol,
// au focus clavier et dès qu'on utilise une flèche ou un point. Aucun défilement
// automatique si le visiteur a demandé à réduire les animations.
const DELAI = 6000;

const racine = document.querySelector(".diaporama");
if (racine) {
  const diapos = [...racine.querySelectorAll(".diapo")];
  const points = [...racine.querySelectorAll(".diaporama__point")];
  const boutonPause = racine.querySelector(".diaporama__pause");
  const commandes = racine.querySelector(".diaporama__commandes");
  const reduit = matchMedia("(prefers-reduced-motion: reduce)");

  let actuelle = 0;
  let minuterie = null;
  let pauseVoulue = reduit.matches; // pause décidée par le visiteur (bouton, flèche, point)
  let pauseTemporaire = false; // survol ou focus

  if (diapos.length < 2) {
    commandes?.remove();
  } else {
    commandes.hidden = false;

    const afficher = (index) => {
      actuelle = (index + diapos.length) % diapos.length;
      diapos.forEach((diapo, i) => {
        const active = i === actuelle;
        diapo.classList.toggle("est-active", active);
        diapo.toggleAttribute("aria-hidden", !active);
        diapo.querySelector("a")?.setAttribute("tabindex", active ? "0" : "-1");
      });
      points.forEach((point, i) => (i === actuelle ? point.setAttribute("aria-current", "true") : point.removeAttribute("aria-current")));
    };

    const majBouton = () => {
      boutonPause.classList.toggle("est-en-pause", pauseVoulue);
      boutonPause.setAttribute("aria-label", pauseVoulue ? boutonPause.dataset.libelleLecture : boutonPause.dataset.libellePause);
    };

    const planifier = () => {
      clearTimeout(minuterie);
      if (!pauseVoulue && !pauseTemporaire && !document.hidden) {
        minuterie = setTimeout(() => {
          afficher(actuelle + 1);
          planifier();
        }, DELAI);
      }
    };

    const pauseDefinitive = () => {
      pauseVoulue = true;
      majBouton();
      planifier();
    };

    boutonPause.addEventListener("click", () => {
      pauseVoulue = !pauseVoulue;
      majBouton();
      if (!pauseVoulue) afficher(actuelle + 1);
      planifier();
    });
    for (const fleche of racine.querySelectorAll(".diaporama__fleche")) {
      fleche.addEventListener("click", () => {
        pauseDefinitive();
        afficher(actuelle + Number(fleche.dataset.sens));
      });
    }
    points.forEach((point, i) => point.addEventListener("click", () => {
      pauseDefinitive();
      afficher(i);
    }));

    const cadre = racine.querySelector(".diaporama__cadre");
    cadre.addEventListener("mouseenter", () => { pauseTemporaire = true; planifier(); });
    cadre.addEventListener("mouseleave", () => { pauseTemporaire = cadre.contains(document.activeElement); planifier(); });
    cadre.addEventListener("focusin", () => { pauseTemporaire = true; planifier(); });
    cadre.addEventListener("focusout", (e) => {
      if (!cadre.contains(e.relatedTarget)) { pauseTemporaire = cadre.matches(":hover"); planifier(); }
    });
    document.addEventListener("visibilitychange", planifier);
    reduit.addEventListener?.("change", () => { if (reduit.matches) pauseDefinitive(); });

    // Balayage sur mobile
    let departX = null;
    cadre.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") departX = e.clientX; });
    cadre.addEventListener("pointerup", (e) => {
      if (departX === null) return;
      const ecart = e.clientX - departX;
      departX = null;
      if (Math.abs(ecart) > 50) {
        pauseDefinitive();
        afficher(actuelle + (ecart < 0 ? 1 : -1));
      }
    });

    // Les images des diapositives suivantes attendent la fin du chargement de la page
    const chargerDiapos = () => {
      for (const modele of racine.querySelectorAll("template.diapo__differee")) modele.replaceWith(modele.content.cloneNode(true));
    };
    if (document.readyState === "complete") chargerDiapos();
    else addEventListener("load", chargerDiapos, { once: true });

    majBouton();
    afficher(0);
    planifier();
  }
}
