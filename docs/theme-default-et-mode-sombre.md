# Thème par défaut (admin) et sélecteur sombre/clair

## Le défaut constaté

Le panneau admin proposait depuis le début un champ « Default Store Theme »
(onglet *Store settings*) et l'API l'enregistrait bien dans
`store_settings.default_theme`. Mais **la vitrine ne le lisait nulle part** :

- `src/app/page.tsx` démarrait toujours sur `useState<ThemeId>("cyber")` ;
- une préférence enregistrée dans `localStorage` (`atelier_theme_v2`) était
  relue au montage, mais un garde-fou ignorait `cyber` et `paperSource` ;
- `settings.defaultTheme` n'était jamais transmis au sélecteur de thème.

Résultat : choisir un thème par défaut dans l'admin ne changeait rien pour
personne — la fonction était « là mais inactive ».

## La règle appliquée maintenant

Trois volontés, dans cet ordre de priorité :

| # | Source | Qui gagne |
| --- | --- | --- |
| 1 | Choix explicite du visiteur (`localStorage.atelier_theme_v2`, écrit par le sélecteur sombre/clair **ou** par le menu des 7 palettes) | toujours |
| 2 | Thème par défaut de la boutique (`store_settings.default_theme`, réglé dans l'admin) | tant que le visiteur n'a rien choisi |
| 3 | Palette principale claire (`cyber`) | valeur rendue par le serveur — première peinture sans écart d'hydratation |

La préférence du visiteur est lue avec `useSyncExternalStore`
(`src/lib/use-store-theme.ts`) : le serveur et l'hydratation voient `null`, le
navigateur voit la valeur stockée. Aucun `setState` dans un effet, donc pas de
rendu en cascade, et la synchronisation entre onglets est gratuite (événement
`storage`).

Un visiteur qui a déjà choisi une palette conserve donc **son** choix : c'est
voulu. Pour vérifier ce que voit un nouveau visiteur — ou pour revenir au défaut
de la boutique — le menu des thèmes contient une entrée
« مظهر المتجر الافتراضي / Use the store theme » qui efface la préférence locale.

## Le sélecteur sombre/clair

Ajouté dans l'en-tête de la vitrine, juste avant le menu des palettes
(`data-theme-toggle`) :

- icône **lune** en mode clair (clic → sombre), **soleil** en mode sombre
  (clic → clair) ; libellé visible à partir de `xl`, libellé accessible
  (`aria-label`, `aria-pressed`) sur toutes les largeurs ;
- le passage en sombre utilise la palette sombre du jeu (`obsidian`) ;
- le retour en clair restitue **la dernière palette claire** utilisée
  (`atelier_theme_last_light_v1`), et à défaut le thème par défaut de la
  boutique s'il est clair, puis `cyber` ;
- chaque entrée du menu des 7 palettes affiche désormais une icône soleil/lune et
  une puce « افتراضي / default » sur le thème par défaut de la boutique.

Le hook pose aussi sur `<html>` :

- les variables CSS de la palette (`--bg-primary`, `--accent-primary`, …) ;
- `data-theme-id` et `data-theme-mode` (`light` / `dark`) ;
- `color-scheme`, pour que les contrôles natifs (barres de défilement, champs,
  menus) suivent le mode.

## Panneau admin

Le simple `<select>` est remplacé par un bloc dédié (`data-admin-default-theme`)
dans l'onglet *Store settings* :

- une carte par palette (`data-theme-option="<id>"`) avec aperçu des trois
  couleurs, nom anglais + nom arabe, et badge clair/sombre ;
- coche sur la palette active, badge « افتراضي / default » ;
- texte d'aide bilingue expliquant à qui le défaut s'applique réellement.

Côté API (`PUT /api/settings`), `defaultTheme` passe désormais par
`resolveThemeId()` : un identifiant inconnu est ignoré et la valeur stockée est
conservée, au lieu d'écrire une palette qui n'existe pas dans `THEMES`.

## Fichiers touchés

| Fichier | Rôle |
| --- | --- |
| `src/lib/i18n-themes.ts` | clés de stockage, `resolveThemeId`, `themeById`, `firstDarkThemeId`, `firstLightThemeId`, libellés bilingues du mode |
| `src/lib/use-store-theme.ts` | hook : priorité des sources, bascule sombre/clair, retour au défaut, variables CSS |
| `src/app/page.tsx` | en-tête : bouton sombre/clair ; menu : icônes de mode, puce « default », entrée « Use the store theme » |
| `src/components/AdminDashboardModal.tsx` | bloc « Default store theme » avec cartes d'aperçu |
| `src/app/api/settings/route.ts` | validation de `defaultTheme` |
| `tests/store-theme.test.tsx` | 9 tests (priorité, bascule, persistance, câblage) |

## Vérifications

```bash
npm run test:theme      # 9 tests
npm run test:layout
npm run test:online
npm run test:wholesale
npm run lint
npm run typecheck
```

## Limite connue

Seule la page d'accueil est pilotée par les palettes : `/services`,
`/vente-en-ligne`, `/wholesale`, `/magasin` et les pages légales sont composées
avec des couleurs Tailwind fixes. Un thème par défaut sombre ne les assombrit
pas — c'était déjà le cas du sélecteur de palettes existant, qui n'agissait que
sur la vitrine. Les y étendre demande de convertir ces pages aux variables CSS.
