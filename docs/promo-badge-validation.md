# Badge promo « Hot Deals » — validation et état de production

## État actuel

La PR nº 29 (« Badge promo sur chaque carte Hot Deals ») a été fusionnée dans
`main` le 13 octobre 2026, au commit `b5411f9`. L'affichage du badge a ensuite
été vérifié sur la production : <https://al-manhaj-company.vercel.app/>.

L'aperçu statique autonome créé pour les contrôles ponctuels n'est plus
nécessaire depuis cette validation en production. Cette machinerie a été
retirée ; elle ne fait pas partie du storefront.

## Historique de la fonctionnalité

À l'ouverture du travail de la PR nº 29, sur la base de la PR nº 28 (`aabdb86`),
`src/components/PromoBadge.tsx`, `tests/promo-badge.test.tsx` et les traces
`promotional`, `data-promo-badge`, `promo-shimmer` et `promo-lift` étaient
absentes du dépôt. Le badge a donc été recréé à partir de la spécification
écrite.

La PR nº 29 a livré les changements suivants :

- `src/components/PromoBadge.tsx` : pastille décorative (`role="img"`,
  `pointer-events: none`), texte **PROMO** en anglais et **عرض** en arabe.
- `src/components/ProductTile.tsx` : prop `showPromoBadge` (désactivée par
  défaut), avec le badge dans le cadre photo, à l'opposé du pourcentage de
  réduction.
- `src/components/ProductCarousel.tsx` : transmission de la prop `promoBadge`
  aux cartes.
- `src/app/page.tsx` : badge activé uniquement sur le carrousel **Hot Deals**.
- `src/app/globals.css` : ovale doré au contour rouge, reflet, léger rebond et
  quatre scintillements rouges sur un cycle de 3,6 s ; animation neutralisée
  par `prefers-reduced-motion: reduce`.
- `tests/promo-badge.test.tsx` : cinq tests du badge, de son placement et de
  son activation limitée à Hot Deals.

## Contrôles après le nettoyage

Les contrôles ci-dessous ont été exécutés dans une copie isolée du dépôt. Les
installations et sorties temporaires sont restées hors du dépôt de travail.

| Contrôle | Résultat |
| --- | --- |
| `npm run test:promo` | 5 réussis, 0 échec |
| `npm run test:brands` | 5 réussis, 1 ignoré (test PostgreSQL réel, `BRAND_TEST_DATABASE_URL` non défini) |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run build` | OK — 8 pages statiques générées, routes API intactes |

Les tests de rubans de marques restent verts ; le badge et les rubans de
marques ne sont pas modifiés par le nettoyage de l'aperçu.
