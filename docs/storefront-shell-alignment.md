# Zone d'affichage sous les rubans : une seule coquille, cartes entières — validation

Demande traitée : élargir la zone d'affichage de **toutes** les sections placées
sous les rubans de marques défilants en utilisant la moitié du vide latéral,
les aligner entre elles, ne jamais dépasser **4 cartes produits** par vue (quitte
à élargir les cartes) et ne plus afficher ni carte ni département coupé.

Contrôle automatique : `npm run test:layout`
(`tests/storefront-layout.test.tsx`, 12 tests).

## 1. Une coquille d'affichage unique : 1760 px

Le contenu passait par `max-w-[1584px]` avec des gouttières différentes selon la
section (`px-3 sm:px-4 lg:px-6` pour les bannières et les carrousels,
`px-2 sm:px-3 lg:px-4` pour la passerelle gros et le bandeau services) : les
sections n'étaient donc alignées ni entre elles, ni sur l'en-tête et le pied de
page qui sont à 1760 px.

`src/app/globals.css` définit désormais **une** classe, `.storefront-shell`
(1760 px, gouttières 8 / 12 / 16 px), utilisée partout :

- `src/app/page.tsx` : barre d'annonce, en-tête, barre de navigation, tuiles de
  départements, bannière paysage intermédiaire, passerelle gros, bandeau
  services, pied de page et son bandeau légal ;
- `src/components/TopBannerRow.tsx`, `SectionBannerCarousel.tsx`,
  `ArticleBannerGrid.tsx`, `ProductCarousel.tsx`.

Plus aucune section ne porte sa propre largeur : le seul `1760px` du projet est
dans `globals.css`.

**Le vide latéral** sur un écran de 1920 px passe de 336 px (à 1584 px) à
160 px : 176 px rendus au contenu, soit 52 % du blanc — la moitié demandée — et
les sections tombent exactement sur les bords de l'en-tête et du pied de page.

Restent volontairement pleine largeur : la **bannière principale** (carrousel
héros, `sizes="100vw"`) et les **rubans de marques** (`.brand-ribbon`,
`width: 100%`, aucun `max-width`).

## 2. Carrousels produits : 4 cartes au plus, toujours entières

`ProductCarousel` mesurait ses cartes en `vw` plafonné
(`lg:w-[min(31vw,350px)]`) : à 1920 px cela donnait des cartes de 350 px dans
une piste de 1536 px, donc **4 cartes et demie** — la cinquième apparaissait
coupée sous la flèche de droite.

La largeur d'une carte vient maintenant de `.product-carousel-card`
(`globals.css`), calculée sur la largeur réelle de la piste :

```
flex-basis: calc((100% - (n - 1) × gouttière) / n)
```

| Largeur d'écran | Cartes par vue | Largeur d'une carte |
| --------------: | -------------: | ------------------: |
| 360 – 639 px    | 1              | 344 – 374 px        |
| 640 – 1023 px   | 2              | 302 – 366 px        |
| 1024 – 1279 px  | 3              | 323 px              |
| 1280 px et +    | **4**          | 303 → 423 px        |

Jamais plus de 4, et la piste est remplie bord à bord : comme `n` cartes
retirent exactement `n - 1` gouttières, chaque position d'arrêt du
`scroll-snap-type: x mandatory` tombe sur le bord d'une carte. Aucune carte
entamée au repos, **y compris en fin de piste** — le dernier point d'ancrage
reste atteignable (`(N - n) × (carte + gouttière)`), donc le navigateur n'a
jamais à clamper le défilement.

Les cartes s'élargissent avec la coquille : 423 px à 1920 px contre 350 px
avant (+21 %).

Les flèches paginent par **page entière** : le pas est mesuré sur la première
carte plus la gouttière réelle de la piste, puis multiplié par le nombre de
cartes visibles (`perView * step` dans `src/components/ProductCarousel.tsx`).
Elles retombent donc toujours sur un bord de carte, à toute largeur.

## 3. Tuiles de départements : aucune tuile coupée

Les 11 départements du catalogue de référence étaient montés dans une piste
`overflow-x-auto` (`HScrollStrip`) avec `min-w-[196px] max-w-[240px]` :
11 × 196 + 80 = 2236 px dans 1536 px utiles — la piste débordait et le dernier
département restait **coupé** au bord droit.

La piste défilante est remplacée par une grille, `.category-tile-grid` :

```
grid-template-columns: repeat(auto-fit, minmax(min(100%, 145px), 1fr));
```

`auto-fit` ouvre autant de colonnes que la largeur le permet et **étire** les
tuiles sur toute la ligne (contrairement à `auto-fill`, qui laisserait des
pistes vides). Les 11 départements tiennent sur une seule ligne dans la
coquille de 1760 px (11 × 145 + 10 × 12 = 1715 ≤ 1728 utiles), soit ≈ 146 px
par tuile à 1920 px. En dessous, les tuiles passent à la ligne suivante au lieu
de déborder : rien n'est jamais tronqué, quel que soit le nombre de
départements cochés « Afficher sur la page d'accueil » par l'administrateur.

| Largeur d'écran | Colonnes | Largeur d'une tuile | Lignes |
| --------------: | -------: | ------------------: | -----: |
| 360 – 639 px    | 2        | 168 – 183 px        | 6      |
| 640 – 1023 px   | 4        | 145 – 177 px        | 3      |
| 1024 – 1279 px  | 6        | 155 px              | 2      |
| 1280 – 1919 px  | 8 – 10   | 146 – 156 px        | 2      |
| 1920 px et +    | **11**   | 146 px              | **1**  |

`src/components/HScrollStrip.tsx` est supprimé : la page d'accueil était son
seul utilisateur.

## 4. Ce que le test vérifie

`tests/storefront-layout.test.tsx` lit `globals.css`, en extrait les règles et
leurs points de rupture, puis **recalcule** la géométrie pour 12 largeurs
d'écran (360 → 2560 px) :

- la coquille ne déclare qu'une largeur (1760 px) et les trois gouttières
  (8 / 12 / 16 px) ; aucune section sous les rubans ne porte de `max-w-[…]` ;
- le vide restant à 1920 px (160 px) ne dépasse pas la moitié du vide d'origine
  (336 px) ;
- le nombre de cartes par vue reste entre 1 et 4, et le nombre de gouttières
  retirées vaut toujours `n - 1` — la propriété qui garantit la piste remplie et
  la fin de piste atteignable ;
- une carte desktop mesure au moins 400 px ;
- la grille des départements ouvre assez de colonnes pour les 11 départements du
  catalogue à 1920 px, et chaque tuile reste au-dessus de son plancher ;
- `ProductCarousel` rendu sert bien 10 emplacements `product-carousel-card`, et
  les bannières (`TopBannerRow`, `ArticleBannerGrid`) suivent la coquille.
