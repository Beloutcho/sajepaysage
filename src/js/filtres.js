// Filtres de la liste des projets. Sans JavaScript, tous les projets s'affichent.
// L'adresse /projets/?categorie=espaces-publics ouvre la liste déjà filtrée.
const boutons = [...document.querySelectorAll(".filtre")];
const cartes = [...document.querySelectorAll(".grille-cartes .carte")];
const etat = document.querySelector(".filtres__etat");
const vide = document.querySelector(".grille-vide");

if (boutons.length) {
  document.querySelector(".filtres").hidden = false;

  const filtrer = (categorie, majAdresse = true) => {
    let visibles = 0;
    for (const carte of cartes) {
      const garde = !categorie || carte.dataset.categories.split(" ").includes(categorie);
      carte.classList.toggle("est-masquee", !garde);
      if (garde) visibles++;
    }
    let libelle = "";
    for (const bouton of boutons) {
      const actif = bouton.dataset.filtre === categorie;
      bouton.setAttribute("aria-pressed", String(actif));
      if (actif) libelle = bouton.textContent.trim();
    }
    vide.hidden = visibles > 0;
    etat.textContent = `${libelle} : ${visibles}`;
    if (majAdresse) {
      const url = new URL(location.href);
      if (categorie) url.searchParams.set("categorie", categorie);
      else url.searchParams.delete("categorie");
      history.replaceState(null, "", url);
    }
  };

  boutons.forEach((b) => b.addEventListener("click", () => filtrer(b.dataset.filtre)));
  const initiale = new URLSearchParams(location.search).get("categorie");
  if (initiale && boutons.some((b) => b.dataset.filtre === initiale)) filtrer(initiale, false);
}
