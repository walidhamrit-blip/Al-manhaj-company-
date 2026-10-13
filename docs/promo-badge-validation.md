# Badge promo « Hot Deals » — bilan et aperçu public

## État initial (vérifié, pas supposé)

Branche `arena/aac5e088-al-manhaj-company` au commit `aabdb86` (fusion de la
PR nº 28), arbre de travail propre. Les fichiers annoncés par la session
précédente étaient **absents du dépôt** :

- `src/components/PromoBadge.tsx` : inexistant ;
- `tests/promo-badge.test.tsx` : inexistant (`tests/` ne contenait que
  `brand-ribbons.test.tsx`) ;
- `promotional`, `data-promo-badge`, `promo-shimmer`, `promo-lift` : aucune
  occurrence dans le code (seul un commentaire `badge-pulse` existait) ;
- `git stash list`, `git log --all -- '*PromoBadge*'`, `git reflog` : vides.

Les modifications locales de l'ancienne session n'étaient donc pas
récupérables : le badge est **recréé** à partir de la spécification écrite.

## Changements

- `src/components/PromoBadge.tsx` : pastille décorative (`role="img"`,
  `pointer-events: none`), texte **PROMO** (en) / **عرض** (ar), un reflet, quatre
  scintillements.
- `src/components/ProductTile.tsx` : prop `showPromoBadge` (défaut `false`),
  rendue dans le cadre photo, dans le coin **opposé** au pourcentage de
  réduction (`.promo-badge` est en `inset-inline-end`, le `-%` reste en
  `start-2 top-2`).
- `src/components/ProductCarousel.tsx` : prop `promoBadge` transmise aux cartes.
- `src/app/page.tsx` : `promoBadge` sur **le seul carrousel Hot Deals**.
- `src/app/globals.css` : ovale légèrement irrégulier doré (`border-radius`
  à huit valeurs), contour rouge 2 px, petite ombre noire, un cycle de **3,6 s**
  avec `promo-shimmer` (reflet), `promo-lift` (léger rebond) et `promo-twinkle`
  (quatre scintillements rouges près du périmètre). Aucun rayon central, aucun
  clignotement brutal (l'opacité des scintillements ne descend pas sous 0,28),
  tout est neutralisé par `prefers-reduced-motion: reduce`.
- `tests/promo-badge.test.tsx` : 5 tests (`npm run test:promo`).
- `scripts/build-promo-preview.tsx` : génère l'aperçu statique (`npm run preview:promo`).

## Contrôles (copie isolée `/home/user/promo-badge-validation`, `npm ci`)

| Contrôle | Résultat |
| --- | --- |
| `npm run test:promo` | 5 / 5 |
| `npm run test:brands` | 5 réussis, 1 ignoré, 0 échec |
| `npm run typecheck` | propre |
| `npm run lint` | propre |
| `npm run build` | OK — 8/8 pages statiques, routes API intactes |

Le dépôt de travail n'a reçu que les fichiers versionnés : ni `.env`, ni
`.pglite/`, ni `.next/`, ni `node_modules/` n'ont été modifiés (toutes les
exécutions ont lieu dans la copie isolée).

## Accessibilité des aperçus (mesurée)

| URL | Résultat constaté |
| --- | --- |
| `al-manhaj-company-git-arena-aac5e088-al-ma-6f888f-walid-website.vercel.app` (aperçu Vercel de la PR nº 29) | Redirige vers `vercel.com/login` → **authentification Vercel exigée** |
| `al-manhaj-company-rxsu686s9-walid-website.vercel.app` (URL de déploiement) | Idem : protection Vercel |
| `al-manhaj-company.vercel.app` | **Public**, mais c'est la **production** (build de `main`) : non touchée |
| `cdn.jsdelivr.net/gh/…/docs/index.html` | Sert le fichier en `text/plain` (restriction jsDelivr) : affiche le code, pas la page |
| `rawcdn.githack.com` / `raw.githack.com` | Page intermédiaire « External Content Notice » avant affichage |
| `walidhamrit-blip.github.io/Al-manhaj-company-/` | **404** : GitHub Pages n'est pas activé sur le dépôt (création refusée au jeton : `Resource not accessible by integration` sur `POST /repos/:owner/:repo/pages`, y compris via un workflow Actions — celui-ci a été retiré) |

Conclusion : aucune URL d'aperçu Vercel de ce projet n'est consultable sans
authentification, et je ne peux pas modifier les réglages Vercel (compte du
propriétaire) ni activer GitHub Pages (permission `pages` absente du jeton).

## Comment valider

1. **Le plus simple** : `docs/index.html` est autonome (CSS et JS en ligne).
   Il s'ouvre directement dans un navigateur, y compris en local
   (les images externes nécessitent une connexion).
2. **Lien public sans authentification** : activer une fois
   *Settings → Pages → Source : Deploy from a branch → Branch :
   `arena/aac5e088-al-manhaj-company`, dossier `/docs` → Save*, puis
   `https://walidhamrit-blip.github.io/Al-manhaj-company-/`.
3. **Vercel** : si le navigateur a une session Vercel ouverte, l'aperçu de la
   PR nº 29 s'affiche directement. Pour le rendre public, il faut désactiver
   *Deployment Protection → Vercel Authentication* dans les réglages du projet
   (action réservée au propriétaire du compte).

## Limites

- PR nº 29 **non fusionnée**, aucune mise en production : la validation
  visuelle précède tout merge.
- L'aperçu est un instantané statique : il ne remplace pas un essai du
  storefront complet, qui demande la base de données ou les données de secours.
- Les rubans de marques de la PR nº 28 ne sont pas modifiés (vérifié par test).
