// Adresses des pages dans les deux langues. Le slug d'un projet ou d'une
// mission est le même en français et en anglais.
export const ROUTES = {
  accueil: { fr: "/", en: "/en/" },
  demarche: { fr: "/demarche/", en: "/en/approach/" },
  projets: { fr: "/projets/", en: "/en/projects/" },
  projet: { fr: "/projets/:slug/", en: "/en/projects/:slug/" },
  missions: { fr: "/missions/", en: "/en/services/" },
  mission: { fr: "/missions/:slug/", en: "/en/services/:slug/" },
  contact: { fr: "/contact/", en: "/en/contact/" },
  mentions: { fr: "/mentions-legales/", en: "/en/legal-notice/" },
};

export const LANGUES = ["fr", "en"];

export function lien(cle, lang = "fr", slug = "") {
  const route = ROUTES[cle];
  if (!route) throw new Error(`Route inconnue : ${cle}`);
  return route[lang].replace(":slug", slug);
}
