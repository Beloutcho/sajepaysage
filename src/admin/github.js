// Accès au dépôt GitHub pour l'administration : lecture des fichiers,
// enregistrement de plusieurs fichiers en un seul commit (API Git Trees),
// historique et état de la mise en ligne. Aucune dépendance.

const API = "https://api.github.com";
const CLE_JETON = "saje-admin-jeton";
const CLE_EXPIRATION = "saje-admin-expiration";

export const jeton = {
  lire: () => localStorage.getItem(CLE_JETON),
  expiration: () => localStorage.getItem(CLE_EXPIRATION),
  enregistrer(valeur, expiration) {
    localStorage.setItem(CLE_JETON, valeur);
    if (expiration) localStorage.setItem(CLE_EXPIRATION, expiration);
    else localStorage.removeItem(CLE_EXPIRATION);
  },
  effacer() {
    localStorage.removeItem(CLE_JETON);
    localStorage.removeItem(CLE_EXPIRATION);
  },
};

let configuration = null;

/** Lit /admin/contenus.json (dépôt, branche, liste des contenus), produit à chaque construction. */
export async function config() {
  if (configuration) return configuration;
  const url = new URL("./contenus.json", import.meta.url);
  url.searchParams.set("v", Date.now());
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error("Impossible de lire la liste des contenus du site.");
  configuration = await reponse.json();
  if (!configuration.depot) throw new Error("Le dépôt GitHub n’est pas encore indiqué dans contenu/site.json (champ github.depot).");
  return configuration;
}

export class ErreurGitHub extends Error {
  constructor(message, statut) {
    super(message);
    this.statut = statut;
  }
}

async function appel(chemin, options = {}, avecJeton = true) {
  const entetes = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...options.headers };
  const cle = jeton.lire();
  if (avecJeton && cle) entetes.Authorization = `Bearer ${cle}`;
  if (options.body && typeof options.body !== "string") {
    options = { ...options, body: JSON.stringify(options.body) };
    entetes["Content-Type"] = "application/json";
  }
  const reponse = await fetch(chemin.startsWith("http") ? chemin : `${API}${chemin}`, { ...options, headers: entetes, cache: "no-store" });
  if (!reponse.ok) {
    let detail = "";
    try { detail = (await reponse.json()).message; } catch { /* corps vide */ }
    const messages = {
      401: "La clé d’accès n’est plus valide. Reconnectez-vous depuis la page d’administration.",
      403: "La clé d’accès n’a pas les droits nécessaires sur ce dépôt.",
      404: "Fichier ou dépôt introuvable.",
      409: "Le dépôt a changé pendant l’enregistrement. Rechargez la page et recommencez.",
      422: "GitHub a refusé la modification.",
    };
    throw new ErreurGitHub(`${messages[reponse.status] || "Erreur GitHub"} (${reponse.status}${detail ? ` : ${detail}` : ""})`, reponse.status);
  }
  return reponse.status === 204 ? null : { donnees: await reponse.json(), entetes: reponse.headers };
}

const depot = async () => (await config()).depot;
const branche = async () => (await config()).branche || "main";

// Base64 <-> texte UTF-8 (accents)
export function versBase64(texte) {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}
export function depuisBase64(base64) {
  const binaire = atob(base64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)));
}
export async function blobVersBase64(blob) {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

/** Vérifie la clé : renvoie { depot, expiration } ou lève une erreur explicite. */
export async function verifierJeton(valeur) {
  const cible = await depot();
  const reponse = await fetch(`${API}/repos/${cible}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${valeur}` },
    cache: "no-store",
  });
  if (reponse.status === 401) throw new Error("Cette clé n’est pas reconnue par GitHub. Vérifiez qu’elle a été copiée en entier.");
  if (!reponse.ok) throw new Error(`Cette clé ne donne pas accès au dépôt ${cible} (${reponse.status}).`);
  const infos = await reponse.json();
  if (!infos.permissions?.push) throw new Error("Cette clé permet de lire le dépôt mais pas d’y écrire : il faut le droit « Contents : Read and write ».");
  const expiration = reponse.headers.get("github-authentication-token-expiration");
  return { depot: cible, expiration: expiration ? new Date(expiration.replace(" UTC", "Z").replace(" ", "T")).toISOString() : null };
}

/** Lit un fichier texte du dépôt : { texte, sha } */
export async function lireFichier(chemin) {
  const { donnees } = await appel(`/repos/${await depot()}/contents/${encodeURI(chemin)}?ref=${await branche()}`);
  return { texte: depuisBase64(donnees.content), sha: donnees.sha };
}

export async function lireJson(chemin) {
  const { texte, sha } = await lireFichier(chemin);
  return { json: JSON.parse(texte), sha };
}

export async function shaActuel(chemin) {
  try {
    const { donnees } = await appel(`/repos/${await depot()}/contents/${encodeURI(chemin)}?ref=${await branche()}`);
    return donnees.sha;
  } catch (e) {
    if (e.statut === 404) return null;
    throw e;
  }
}

/**
 * Enregistre plusieurs fichiers en un seul commit.
 * fichiers : [{ chemin, texte } | { chemin, blob } | { chemin, supprimer: true }]
 */
export async function enregistrer(fichiers, message) {
  const cible = await depot();
  const nomBranche = await branche();
  const { donnees: ref } = await appel(`/repos/${cible}/git/ref/heads/${nomBranche}`);
  const { donnees: commit } = await appel(`/repos/${cible}/git/commits/${ref.object.sha}`);

  const arbre = [];
  for (const f of fichiers) {
    if (f.supprimer) {
      arbre.push({ path: f.chemin, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const contenu = f.blob ? await blobVersBase64(f.blob) : versBase64(f.texte);
    const { donnees: blob } = await appel(`/repos/${cible}/git/blobs`, { method: "POST", body: { content: contenu, encoding: "base64" } });
    arbre.push({ path: f.chemin, mode: "100644", type: "blob", sha: blob.sha });
  }
  const { donnees: nouvelArbre } = await appel(`/repos/${cible}/git/trees`, { method: "POST", body: { base_tree: commit.tree.sha, tree: arbre } });
  const { donnees: nouveauCommit } = await appel(`/repos/${cible}/git/commits`, {
    method: "POST",
    body: { message, tree: nouvelArbre.sha, parents: [ref.object.sha] },
  });
  await appel(`/repos/${cible}/git/refs/heads/${nomBranche}`, { method: "PATCH", body: { sha: nouveauCommit.sha } });
  return nouveauCommit.sha;
}

/** Dernière exécution de la GitHub Action de déploiement : « en-cours », « en-ligne » ou « erreur ». */
export async function etatDeploiement() {
  const cible = await depot();
  let resultat;
  try {
    resultat = await appel(`/repos/${cible}/actions/runs?per_page=1&branch=${await branche()}`);
  } catch {
    resultat = await appel(`/repos/${cible}/actions/runs?per_page=1&branch=${await branche()}`, {}, false);
  }
  const run = resultat.donnees.workflow_runs?.[0];
  if (!run) return { etat: "inconnu" };
  const etat = run.status !== "completed" ? "en-cours" : run.conclusion === "success" ? "en-ligne" : "erreur";
  return { etat, date: run.updated_at, sha: run.head_sha, url: run.html_url };
}

/** Attend la fin du déploiement d'un commit, en appelant suivi(etat) à chaque étape. */
export async function suivreDeploiement(sha, suivi) {
  for (let essai = 0; essai < 60; essai++) {
    await new Promise((r) => setTimeout(r, essai === 0 ? 8000 : 10000));
    try {
      const etat = await etatDeploiement();
      if (etat.sha === sha) {
        suivi(etat);
        if (etat.etat !== "en-cours") return etat;
      } else {
        suivi({ etat: "en-cours" });
      }
    } catch {
      // L'état est indicatif : une erreur réseau ne doit pas inquiéter
    }
  }
  return { etat: "inconnu" };
}

export async function historique(nombre = 20) {
  const { donnees } = await appel(`/repos/${await depot()}/commits?sha=${await branche()}&per_page=${nombre}`);
  return donnees;
}

export async function detailCommit(sha) {
  const { donnees } = await appel(`/repos/${await depot()}/commits/${sha}`);
  return donnees;
}

/** Contenu brut d'un fichier à une version donnée (base64), ou null s'il n'existait pas. */
export async function fichierALaVersion(chemin, sha) {
  try {
    const { donnees } = await appel(`/repos/${await depot()}/contents/${encodeURI(chemin)}?ref=${sha}`);
    return donnees.content;
  } catch (e) {
    if (e.statut === 404) return null;
    throw e;
  }
}

/** Rétablit un fichier tel qu'il était à la version sha. */
export async function retablir(chemin, sha) {
  const contenu = await fichierALaVersion(chemin, sha);
  const fichiers = contenu === null
    ? [{ chemin, supprimer: true }]
    : [{ chemin, blob: new Blob([Uint8Array.from(atob(contenu.replace(/\s/g, "")), (c) => c.charCodeAt(0))]) }];
  return enregistrer(fichiers, `Retour à une version précédente : ${chemin} (admin)`);
}
