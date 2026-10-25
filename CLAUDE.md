# Site SAJE – Art & Paysage

Site statique bilingue d'Alice Stevens, paysagiste-conceptrice et artiste à Laval. Le cahier des charges complet est dans `docs/PRD.md` : le relire avant toute évolution.

## Règles

- **Voix** : textes à la troisième personne (« Alice Stevens… »), y compris sur la page Démarche. Plus aucun « je » ni « nous ».
- **Aucune information inventée** : un fait absent des sources (site WordPress, PDF de `Sources/`, Alice) laisse le champ vide. Les doutes vont dans `docs/rapport-migration.md`.
- **Aucun script ni service tiers** : pas de CDN, pas de Google Fonts, pas de traceur. La Content-Security-Policy (`src/_includes/layouts/base.njk`) n'autorise que le site et `api.github.com`.
- **Contenu uniquement dans `/contenu/`** (JSON) et `/medias/` (images originales, 2 400 px max). Les gabarits ne contiennent que des libellés d'interface (`src/_data/i18n.json`).
- Tout texte affiché qu'Alice peut modifier porte `data-champ="fichier:chemin"` (filtre `champ`) ; toute image modifiable, `data-champ-image`.
- Accessibilité WCAG 2.2 AA, « réduire les animations » respecté, JavaScript visiteur < 30 Ko, site lisible sans JavaScript.
- `Sources/` n'est jamais commité (CV, adresse, téléphone ; le dépôt est public).

## Commandes

```sh
npm install
npm start            # serveur local avec rechargement (http://localhost:8080)
npm run build        # construit _site/ (premier passage : ~6 min pour les images, ensuite quelques secondes)
npm run verifier     # contrôle le contenu, écrit docs/rapport-contenu.md
npm run migrer       # relit l'API WordPress (ne réécrit pas les JSON existants, sauf --force)
bash outils/extraire-pdf.sh      # redécoupe les PDF de Sources/ dans medias/
node outils/decouper-logo.mjs    # régénère le logo et les icônes depuis Sources/
```

## Organisation

- `contenu/` : `site.json`, `accueil.json`, `pages/*.json`, `missions/*.json`, `projets/*.json` (un fichier par projet ; `publie: false` = masqué, `noindex`, hors listes et sitemap).
- `src/` : gabarits Nunjucks (`index.njk`, `projet.njk`… chacun produit les versions FR et EN), `_lib/routes.js` (adresses FR/EN), `_lib/images.js` (eleventy-img), `css/`, `js/` (modules natifs), `admin/` (tableau de bord et édition sur la page via l'API GitHub).
- `.eleventy.js` : filtres (`loc` pour le repli anglais → français, `champ`, `md`, `image`…).
- `.github/workflows/deploy.yml` : construction et publication sur GitHub Pages à chaque commit sur `main`.
- `docs/` : PRD, maquette, aide d'administration, rapports de migration et de contenu.
