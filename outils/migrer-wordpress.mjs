// Migration du site WordPress sajepaysage.fr vers /contenu/ et /medias/.
//
// Lit l'API WordPress (pages et médiathèque), télécharge chaque image dans sa
// plus grande version publiée, la ramène à 2400 px maximum (JPEG qualité 85,
// métadonnées EXIF supprimées) et crée les fichiers JSON des projets.
//
// Usage :
//   node outils/migrer-wordpress.mjs            crée ce qui manque, ne touche à rien d'existant
//   node outils/migrer-wordpress.mjs --force    réécrit aussi les JSON des projets déjà présents
//
// Le script ne contient que la structure : les textes ont été rédigés ensuite
// à la main dans /contenu/ à partir des PDF du dossier Sources/ (voir docs/).

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const API = "https://sajepaysage.fr/wp-json/wp/v2";
const FORCE = process.argv.includes("--force");
const LARGEUR_MAX = 2400;

// Ancienne page WordPress -> nouveau projet
const PROJETS = {
  "amenagement-public": { slug: "prairie-ludique", categories: ["espaces-publics"], missions: ["conception-espaces-exterieurs"] },
  "bande-dessinee-paysage": { slug: "bande-dessinee-paysage", categories: ["illustration"], missions: ["illustration-graphisme"] },
  "campaneta": { slug: "campaneta", categories: ["pedagogie", "espaces-publics"], missions: ["ateliers-mediation"] },
  "chateau-de-la-roche": { slug: "chateau-de-la-roche", categories: ["espaces-publics"], missions: ["conception-espaces-exterieurs"] },
  "chateau-des-arcis": { slug: "chateau-des-arcis", categories: ["art-installations"], missions: ["installations-performances"] },
  "chaumont-sur-loire": { slug: "chaumont-sur-loire", categories: ["art-installations"], missions: ["installations-performances", "conception-espaces-exterieurs"] },
  "cueillette-andrya": { slug: "cueillette-andrya", categories: ["jardins-prives"], missions: ["conception-espaces-exterieurs"] },
  "festival-casc": { slug: "festival-casc", categories: ["pedagogie", "art-installations"], missions: ["ateliers-mediation", "installations-performances"] },
  "jardin-eve": { slug: "jardin-eve", categories: ["jardins-prives"], missions: ["conception-espaces-exterieurs"] },
  "jardin-madda": { slug: "jardin-madda", categories: ["jardins-prives"], missions: ["conception-espaces-exterieurs"] },
  "jardin-marjamin": { slug: "jardin-marjamin", categories: ["jardins-prives"], missions: ["conception-espaces-exterieurs"] },
  "siege-caddif": { slug: "siege-caddif", categories: ["jardins-prives"], missions: ["conception-espaces-exterieurs"] },
  "silice": { slug: "silice", categories: ["art-installations"], missions: ["installations-performances"] },
};

// Images des pages (missions, démarche, accueil) : fichier WordPress -> /medias/pages/
const IMAGES_PAGES = {
  "plan-projet-avec-curculations-voit-piet2": "amo-plan-circulations.jpg",
  "IMG_20200902_160215_01": "valorisation-de-site.jpg",
  "001-28166670_175765946483250_3622025290911095915_n": "formation-01.jpg",
  "31531592_10214185668509168_4252358106572390400_o": "formation-02.jpg",
  "31919454_10214185669029181_8647814911310692352_o": "formation-03.jpg",
  "31946361_10214185667989155_3352920658332876800_o": "formation-04.jpg",
  "IMG_20180421_101114-1": "formation-05.jpg",
  "thumbnail-4": "formation-06.jpg",
  "thumbnail-9": "formation-07.jpg",
  "thumbnail": "formation-08.jpg",
  "1": "installations-silice.jpg",
  "P1090884-copie-1": "mediation-atelier.jpg",
  "20241128-banniere-prestation": "banniere-prestations.jpg",
  "DSC05857-2": "alice-peint-en-exterieur.jpg",
  "DSC05857": "alice-peint-en-exterieur-2.jpg",
  "Alice-Stevens-1204-HD": "portrait-alice-stevens.jpg",
  "1767386788696": "demarche-01.jpg",
  "1767386788701": "demarche-02.jpg",
  "1767386788708": "accueil-01.jpg",
  "1767386788714": "accueil-prestations.jpg",
  "1767609548751": "accueil-biographie.jpg",
  "IMG_20251219_144754": "demarche-03.jpg",
  "20241128-banniere-chaumont-sans-logo": "banniere-chaumont.jpg",
  "20241128-banniere-arts-et-mediations": "banniere-arts-et-mediations.jpg",
  "20241128-banniere-pedagogie": "banniere-pedagogie.jpg",
  "20241128-banniere-projet-public": "banniere-projet-public.jpg",
  "banniere-2025": "banniere-2025.jpg",
  "banniere-chaumont": "banniere-chaumont-2025.jpg",
  "photomontage-dessin-entree": "photomontage-dessin-entree.jpg",
  "dessin-jardin": "dessin-jardin.jpg",
  "dessin-jardin-silhouette": "dessin-jardin-silhouette.jpg",
  "serre-idees": "serre-idees.jpg",
  "saje": "logo-saje.png",
};

// Images WordPress rattachées à des projets qui n'ont pas de page WordPress
const IMAGES_PROJETS_SANS_PAGE = {
  "parc-ilots-changeants": ["dessin-saut-orage"],
  "jardin-laurriere": ["vue-schema-global", "vue-jardin-large"],
};

const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return { data: await r.json(), total: Number(r.headers.get("x-wp-totalpages") || 1) };
};

async function toutLire(type) {
  const premier = await json(`${API}/${type}?per_page=100&page=1`);
  let tout = premier.data;
  for (let p = 2; p <= premier.total; p++) tout = tout.concat((await json(`${API}/${type}?per_page=100&page=${p}`)).data);
  return tout;
}

// "IMG_2218-photoshop-1024x683.jpg" -> "IMG_2218-photoshop"
const nomDeBase = (url) =>
  decodeURIComponent(url.split("?")[0].split("/").pop())
    .replace(/\.(jpe?g|png|gif|webp)$/i, "")
    .replace(/-\d+x\d+$/, "")
    .replace(/-scaled$/, "");

const nomFichier = (base) =>
  base.replace(/^001-/, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".jpg";

const existe = (f) => fs.access(f).then(() => true, () => false);

async function telecharger(media, destination) {
  if (await existe(destination)) return false;
  const r = await fetch(media.source_url);
  if (!r.ok) throw new Error(`${r.status} ${media.source_url}`);
  const tampon = Buffer.from(await r.arrayBuffer());
  await fs.mkdir(path.dirname(destination), { recursive: true });
  let image = sharp(tampon).rotate().resize({ width: LARGEUR_MAX, height: LARGEUR_MAX, fit: "inside", withoutEnlargement: true });
  if (destination.endsWith(".png")) await image.png().toFile(destination);
  else await image.flatten({ background: "#ffffff" }).jpeg({ quality: 85, mozjpeg: true }).toFile(destination);
  return true;
}

function imagesDeLaPage(html) {
  const vues = new Set();
  const liste = [];
  for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const base = nomDeBase(src);
    const cle = base.replace(/^001-/, "");
    if (vues.has(cle)) continue;
    vues.add(cle);
    liste.push(base);
  }
  return liste;
}

function texteBrut(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&#8217;/g, "’").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  console.log("Lecture de l'API WordPress…");
  const [pages, medias] = await Promise.all([toutLire("pages"), toutLire("media")]);
  const parBase = new Map();
  // Le plus récent gagne : WordPress contient des doublons d'un mois sur l'autre
  for (const m of medias.sort((a, b) => a.id - b.id)) parBase.set(nomDeBase(m.source_url), m);

  const manquants = [];
  let telecharges = 0;

  for (const page of pages) {
    const def = PROJETS[page.slug];
    if (!def) continue;
    const dossier = path.join(RACINE, "medias/projets", def.slug);
    const images = [];
    for (const base of imagesDeLaPage(page.content.rendered)) {
      const media = parBase.get(base) || parBase.get(base.replace(/^001-/, ""));
      if (!media) { manquants.push(`${def.slug} : ${base}`); continue; }
      const fichier = nomFichier(base);
      if (await telecharger(media, path.join(dossier, fichier))) telecharges++;
      images.push({ fichier, couverture: base.startsWith("001-") });
    }

    const cible = path.join(RACINE, "contenu/projets", `${def.slug}.json`);
    if ((await existe(cible)) && !FORCE) continue;
    const texte = texteBrut(page.content.rendered);
    const projet = {
      slug: def.slug,
      publie: true,
      ordre: 99,
      categories: def.categories,
      lieu: "",
      date: "",
      commanditaire: "",
      partenaires: "",
      missions: def.missions,
      fr: { titre: page.title.rendered.replace(/&#8217;/g, "’"), accroche: "", descriptif: texte },
      en: { titre: "", accroche: "", descriptif: "" },
      couverture: (images.find((i) => i.couverture) || images[0] || {}).fichier || "",
      images: images.map(({ fichier }) => ({ fichier, alt: { fr: "", en: "" }, legende: { fr: "", en: "" } })),
      ancienneAdresse: `/${page.slug}/`,
    };
    await fs.writeFile(cible, JSON.stringify(projet, null, 2) + "\n");
    console.log(`  ${def.slug} : ${images.length} images`);
  }

  for (const [slug, bases] of Object.entries(IMAGES_PROJETS_SANS_PAGE)) {
    for (const base of bases) {
      const media = parBase.get(base);
      if (!media) { manquants.push(`${slug} : ${base}`); continue; }
      if (await telecharger(media, path.join(RACINE, "medias/projets", slug, nomFichier(base)))) telecharges++;
    }
  }

  for (const [base, fichier] of Object.entries(IMAGES_PAGES)) {
    const media = parBase.get(base);
    if (!media) { manquants.push(`pages : ${base}`); continue; }
    if (await telecharger(media, path.join(RACINE, "medias/pages", fichier))) telecharges++;
  }

  console.log(`${telecharges} image(s) téléchargée(s).`);
  if (manquants.length) console.log("Introuvables dans la médiathèque :\n  " + manquants.join("\n  "));
}

main().catch((e) => { console.error(e); process.exit(1); });
