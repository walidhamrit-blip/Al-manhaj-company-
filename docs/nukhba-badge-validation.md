# شارة « Website by Nukhba » — validation

Référence : <https://nokhba.net.ly/badge> — la seule exigence de la charte est un
lien réel vers `nokhba.net.ly` au pied du site, dans chaque page.

## Ce qui a été livré

| Élément | Valeur |
| --- | --- |
| Composant | `src/components/NukhbaBadge.tsx` (server component, sans état) |
| Cible du lien | `https://nokhba.net.ly/?utm_source=client_footer&utm_medium=badge&utm_campaign=client_credit` |
| `rel` | `sponsored nofollow noopener` (divulgation de la relation commerciale) |
| `target` | `_blank` |
| Image (pied de page sombre) | `https://nokhba.net.ly/badge/nukhba-badge-light.svg` — 176 × 44 |
| Image (pages claires) | `https://nokhba.net.ly/badge/nukhba-badge.svg` |
| Texte alternatif | `نخبة \| Website by Nukhba` |
| Texte visible | `نخبة · Website by Nukhba` |

L'image reste l'original hébergé par Nukhba : elle n'est ni copiée dans
`public/`, ni recolorée, ni redimensionnée en CSS (`width:176px; height:auto`).
`next/image` n'est pas utilisé car il refuse les SVG distants sans
`dangerouslyAllowSVG` ; une balise `<img>` native suffit et évite d'ouvrir ce
réglage.

## Où le badge apparaît

| Page | Emplacement | Variante |
| --- | --- | --- |
| `/` | pied de page sombre, sous le bandeau légal CBL / Mawthooq | `onDark` |
| `/services` | pied de page sombre | `onDark` |
| `/vente-en-ligne` | pied de page sombre | `onDark` |
| `/magasin` | nouveau pied de page sombre (la page n'en avait pas) | `onDark` |
| `/wholesale` | nouveau pied de page sombre (la page n'en avait pas) | `onDark` |
| `/privacy`, `/terms`, `/returns` | bas de la page claire, badge centré | `onLight` |

Sur la page d'accueil, la rangée est alignée sur `.storefront-shell`, le même
cordon de 1760 px que le reste du pied de page.

## Vérifications

```bash
npm run test:badge     # 3 tests : URL/rel, image/alt, présence sur les 8 pages
npm run test:layout
npm run test:online
npm run test:wholesale
npm run lint
npm run typecheck
```

Les 8 routes ont aussi été servies en développement (`next dev`) et leur HTML
contient exactement un `data-nukhba-badge` chacune.

## Retrait

La charte autorise le client à refuser le badge. Pour la retirer d'un coup,
supprimer les lignes `<NukhbaBadge … />` des pages listées ci-dessus (le
composant peut rester en place, sans être importé).
