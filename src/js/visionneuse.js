// Visionneuse plein écran des pages projet : clic sur une image, flèches,
// clavier (← → Échap) et balayage. Le focus revient sur l'image d'origine.
// Sans JavaScript, chaque vignette reste un lien vers l'image en grand.
const dialogue = document.querySelector(".visionneuse");
const vignettes = [...document.querySelectorAll(".projet .vignette")]
  .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

if (dialogue && vignettes.length && typeof dialogue.showModal === "function") {
  const zoneImage = dialogue.querySelector(".visionneuse__image");
  const texte = dialogue.querySelector(".visionneuse__texte");
  const compteur = dialogue.querySelector(".visionneuse__compteur");
  const precedent = dialogue.querySelector(".visionneuse__precedent");
  const suivant = dialogue.querySelector(".visionneuse__suivant");
  let actuelle = 0;
  let origine = null;

  const afficher = (index) => {
    actuelle = (index + vignettes.length) % vignettes.length;
    const vignette = vignettes[actuelle];
    const image = vignette.querySelector("picture").cloneNode(true);
    const img = image.querySelector("img");
    image.querySelectorAll("source").forEach((s) => s.setAttribute("sizes", "100vw"));
    img.setAttribute("sizes", "100vw");
    img.loading = "eager";
    img.removeAttribute("fetchpriority");
    zoneImage.replaceChildren(image);
    texte.textContent = vignette.dataset.legende || "";
    compteur.textContent = `${actuelle + 1} / ${vignettes.length}`;
    // Précharge l'image suivante pour un défilement fluide
    const suivante = vignettes[(actuelle + 1) % vignettes.length].querySelector("img");
    if (suivante) suivante.loading = "eager";
  };

  const ouvrir = (index, depuis) => {
    origine = depuis;
    afficher(index);
    dialogue.showModal();
    dialogue.querySelector(".visionneuse__fermer").focus();
    document.documentElement.style.overflow = "hidden";
  };

  for (const vignette of vignettes) {
    vignette.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || document.body.classList.contains("mode-edition")) return;
      e.preventDefault();
      ouvrir(Number(vignette.dataset.index), vignette);
    });
  }

  const seule = vignettes.length === 1;
  precedent.hidden = seule;
  suivant.hidden = seule;
  precedent.addEventListener("click", () => afficher(actuelle - 1));
  suivant.addEventListener("click", () => afficher(actuelle + 1));
  dialogue.querySelector(".visionneuse__fermer").addEventListener("click", () => dialogue.close());

  dialogue.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") afficher(actuelle - 1);
    else if (e.key === "ArrowRight") afficher(actuelle + 1);
  });
  dialogue.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    zoneImage.replaceChildren();
    origine?.focus();
  });
  // Clic sur le fond (hors image et boutons) : fermeture
  dialogue.addEventListener("click", (e) => {
    if (e.target === dialogue || e.target.classList.contains("visionneuse__scene") || e.target.classList.contains("visionneuse__image")) dialogue.close();
  });

  let departX = null;
  dialogue.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") departX = e.clientX; });
  dialogue.addEventListener("pointerup", (e) => {
    if (departX === null) return;
    const ecart = e.clientX - departX;
    departX = null;
    if (Math.abs(ecart) > 50 && !seule) afficher(actuelle + (ecart < 0 ? 1 : -1));
  });
}
