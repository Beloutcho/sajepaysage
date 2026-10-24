// Chargé dans <head>, avant l'affichage : signale que JavaScript est actif et,
// seulement si une clé d'administration est enregistrée sur cet appareil,
// charge l'outil d'édition. Un visiteur ne télécharge jamais l'éditeur.
(function () {
  var html = document.documentElement;
  html.classList.remove("sans-js");
  html.classList.add("js");
  try {
    if (localStorage.getItem("saje-admin-jeton")) {
      var script = document.createElement("script");
      script.type = "module";
      script.src = new URL("../admin/editeur.js", document.currentScript.src).href;
      document.head.appendChild(script);
    }
  } catch (e) {
    // Stockage indisponible (navigation privée stricte) : pas d'édition, le site reste lisible.
  }
})();
