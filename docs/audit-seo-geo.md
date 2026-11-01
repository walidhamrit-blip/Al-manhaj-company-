# Audit SEO + GEO — شركة المنهج للقرطاسية

**Date :** 1er novembre 2026
**Périmètre :** code du dépôt (`almanhaj.ly` / `al-manhaj-company.vercel.app`) — Next.js 16 (App Router), React 19, PostgreSQL/Neon
**Ce qui a été audité :** rendu HTML, métadonnées, données structurées, sitemap, robots, maillage interne, indexabilité, performance de chargement, préparation aux moteurs génératifs (GEO), configuration Search Console.

---

## 1. Résumé exécutif

Le site était **techniquement propre mais quasi invisible pour les moteurs** : une SPA dont tout le contenu (catalogue, fiches, filtres) vivait dans des modales ouvertes en JavaScript, sans URL propre, **sans sitemap, sans robots.txt, sans données structurées, sans canonical, sans page produit ni page catégorie**. Google pouvait indexer 6 pages de texte, et les moteurs génératifs (ChatGPT Search, Perplexity, AI Overviews) n'avaient littéralement rien à citer sur les produits.

Ce qui a été livré dans cette passe :

| Chantier | Avant | Après |
|---|---|---|
| `sitemap.xml` | ❌ absent | ✅ 84 URL générées (9 pages + 32 rayons + 43 produits) avec images |
| `robots.txt` | ❌ absent | ✅ ouvert aux 14 robots (dont GPTBot, ClaudeBot, PerplexityBot), `/api` exclu |
| Pages produits indexables | ❌ 0 | ✅ 43 (`/produits/<titre>--<sku>`) — HTML serveur, prix, stock, specs |
| Pages catégories indexables | ❌ 0 | ✅ 32 (`/categories/<slug>`) |
| Hub de maillage interne | ❌ aucun | ✅ `/catalogue` (43 produits + 32 rayons + FAQ factuelle) |
| Canonical | ❌ 0 page | ✅ toutes les pages (absolu, via `metadataBase`) |
| Open Graph / Twitter Card | ❌ partiel, relatif | ✅ complet sur toutes les pages |
| JSON-LD | ❌ aucun | ✅ Organization, WebSite+SearchAction, Store/LocalBusiness (NAP + géo + horaires), Product (offre, prix LYD, stock, retours, livraison), BreadcrumbList, ItemList, FAQPage |
| `llms.txt` (GEO) | ❌ | ✅ dynamique, prix et stock à jour, politique de citation |
| 404 | page Next par défaut, impasse | ✅ 404 réelle, statut correct, liens de secours |
| Manifest / icône | ❌ aucun favicon | ✅ `manifest.webmanifest` + `icon.svg` |
| En-têtes de sécurité / perf | ❌ | ✅ HSTS, nosniff, Referrer-Policy, Permissions-Policy, cache long `/images` |
| Vérification Search Console | ❌ aucune | ✅ balise injectable par variable d'environnement |
| Tests de non-régression SEO | ❌ | ✅ 11 tests (`npm run test:seo`) |

**Note globale avant : ~35/100. Après cette passe : ~85/100 côté technique.** Le reste (15 points) dépend d'actions manuelles hors code : domaine, Search Console, fiche Google Business Profile, numéros légaux réels, et la phase 2 décrite en §7.

---

## 2. Constats détaillés

### 2.1 Bloquants (corrigés)

**B1 — Aucune URL de contenu.** Le catalogue, les rayons et les fiches produits n'existaient que comme état React (`catalogDeptSlug`, `quickViewProduct`). Un moteur ne peut pas indexer une modale. Conséquence : **0 produit indexable sur 43**.
→ Corrigé : `/produits/[slug]`, `/categories/[slug]`, `/catalogue`, rendus côté serveur avec `generateStaticParams` + ISR 1 h.

**B2 — Aucun sitemap, aucun robots.txt.** Aucune découverte possible au-delà des 6 liens du menu.
→ Corrigé : `src/app/sitemap.ts` (revalidé toutes les heures : un produit ajouté dans l'admin entre dans le sitemap sans redéploiement) et `src/app/robots.ts`.

**B3 — Aucun canonical.** Sans canonical, Google choisit lui-même l'URL de référence. Avec un domaine `almanhaj.ly` **et** un `*.vercel.app` qui servent le même contenu, c'est un doublon d'indexation garanti (et les previews Vercel sont indexables par défaut).
→ Corrigé : `metadataBase` + canonical absolu sur chaque page, `X-Robots-Tag: noindex` sur `/api/*`.

**B4 — Aucune donnée structurée.** Pas d'`Organization`, pas de `LocalBusiness`, pas de `Product` : pas de rich results possibles, pas de fiche locale, et rien de fiable à citer pour un moteur génératif.
→ Corrigé : voir §3, `src/lib/seo.ts`.

**B5 — Une seule page avait un `<title>` correct.** `/services` n'avait **aucune métadonnée** (il héritait du titre de l'accueil) ; les pages légales n'avaient ni description ni canonical ; les layouts `magasin`/`wholesale`/`vente-en-ligne` n'avaient que titre + description.
→ Corrigé : `pageMetadata()` impose titre, description ≤ 158 car., canonical, OG et Twitter Card partout.

### 2.2 Importants (corrigés)

- **I1 — `<html lang="ar">` sans `dir`.** Le sens de lecture était posé sur des `<div>` internes ; l'absence de `dir` au niveau du document brouille les signaux de langue. → `dir="rtl"` sur `<html>`.
- **I2 — Aucun fil d'Ariane.** Ni visuel, ni structuré. → `BreadcrumbList` + fil visible sur toutes les nouvelles pages.
- **I3 — Zéro lien interne vers le catalogue.** La barre de navigation n'exposait que 4 pages + un bouton (donc pas un lien). → liens `/catalogue` dans la barre, le pied de page et le bloc « À propos » ; le pied de page des pages serveur liste aussi les rayons.
- **I4 — Pas de `SearchAction` fonctionnelle.** Une recherche déclarée doit pointer vers une URL qui marche. → `/?q=...` pré-remplit désormais la recherche, et `SearchAction` est déclaré dans le JSON-LD `WebSite`.
- **I5 — 404 par défaut en anglais, sans liens.** → `src/app/not-found.tsx` (statut 404 réel vérifié, `noindex`).
- **I6 — Images de héros sans priorité ni `sizes`.** `StoreImage` recevait `priority` et `sizes` mais les ignorait : l'élément LCP n'était ni préchargé ni priorisé. → `fetchPriority="high"`, `loading="eager"`, `decoding="async"`, `sizes` transmis.
- **I7 — Aucun favicon.** Google affiche un globe gris dans les résultats. → `icon.svg` + manifest.
- **I8 — `X-Powered-By` exposé, aucun en-tête de sécurité.** → `poweredByHeader: false` + en-têtes (§3).

### 2.3 Restants — à traiter hors code ou en phase 2

| # | Problème constaté | Impact | Priorité |
|---|---|---|---|
| R1 | **L'accueil est rendu client** : les sections produits/rayons arrivent après un `fetch("/api/store")`. Le HTML initial ne contient que le héros et les textes statiques (vérifié : 0 nom de produit dans le HTML servi) | Contenu principal non lisible en première vague de crawl, LCP dégradé, rien à citer pour les LLM sur les produits | **Haute** |
| R2 | **Aucune URL anglaise.** La bascule AR/EN est un état local : même URL, deux contenus | Impossible de déclarer `hreflang` ; Google n'indexe qu'une version ; perte de la moitié du potentiel de requêtes (anglophones/expats, requêtes « stationery Tripoli ») | **Haute** |
| R3 | **Numéros légaux fictifs en ligne** : `[XXXXXX]` (registre de commerce) et `[MTQ-XXXX]` (licence موثوق) dans `/privacy` et le pied de page | Signal de confiance (E-E-A-T) négatif, incohérence avec les exigences de موثوق (Mawthooq) et de la CBL | **Haute** |
| R4 | **Photos produits issues de Pexels, partagées entre plusieurs produits** (`images.pexels.com`) | Contenu visuel dupliqué, pas de photo réelle ⇒ pas de Google Images, faible conversion, et 43 fiches sans visuel propre | **Haute** |
| R5 | **Images lourdes** : 7,9 Mo dans `public/images` (41 fichiers), 10 fichiers > 300 Ko, le plus gros à **722 Ko** (`bag-oslo-01.jpg`) ; `unoptimized` en dev | LCP mobile médiocre | Moyenne |
| R6 | **Polices chargées depuis Google Fonts en `<link>`** (2 familles, 8 graisses) | Requête tierce bloquante, CLS/FCP ; `next/font` auto-hébergerait | Moyenne |
| R7 | **Coordonnées géographiques approximatives** (32.8382 / 13.1722 = niveau quartier) | Fiche locale moins précise | Moyenne |
| R8 | **Pas de page « À propos » dédiée**, pas de blog/guides d'achat | Pas de contenu informationnel pour capter « meilleur carnet A4 Libye », « أحبار طابعات ليزر » etc. | Moyenne |
| R9 | **Aucun avis client structuré** (`AggregateRating`) | Les étoiles manquent dans les résultats — à n'ajouter **que** si de vrais avis existent (sinon sanction) | Basse (dépend des données) |
| R10 | **Pas de `hreflang`/`x-default`** (dépend de R2) | — | Suit R2 |
| R11 | **Pas de mesure de recherche** (GSC API / GA4) au-delà de Vercel Analytics | Pilotage à l'aveugle | Moyenne |

---

## 3. Ce qui a été implémenté (fichiers)

| Fichier | Rôle |
|---|---|
| `src/lib/site.ts` | Source unique du domaine, du NAP, des coordonnées, des horaires, de la devise. `resolveSiteUrl()` : `NEXT_PUBLIC_SITE_URL` → domaine de prod Vercel → URL du déploiement → `https://almanhaj.ly`. |
| `src/lib/seo.ts` | Constructeurs JSON-LD (`organizationJsonLd`, `websiteJsonLd`, `storeJsonLd`, `productJsonLd`, `breadcrumbJsonLd`, `itemListJsonLd`, `faqJsonLd`) + `pageMetadata()` (canonical, robots, OG, Twitter). |
| `src/lib/product-slug.ts` | URL produit `titre-anglais--sku` : lisible **et** stable quand le titre est réécrit. Le SKU seul reste résolu (compatibilité ascendante). |
| `src/lib/store-data.ts` | Lecture du catalogue côté serveur : pas de tentative de connexion sans `DATABASE_URL`, timeout 8 s, mémoïsation 5 min, repli sur le seed. Aucune page ne casse si Neon est froid. |
| `src/components/JsonLd.tsx` | Injection JSON-LD avec échappement `<` (un titre contenant `</script>` ne peut pas casser la page). |
| `src/components/SeoPageShell.tsx` | Gabarit des pages serveur : en-tête, fil d'Ariane + `BreadcrumbList`, pied de page NAP complet. |
| `src/app/layout.tsx` | `metadataBase`, `title`/`description`/`keywords`, robots + directives Googlebot, OG/Twitter par défaut, vérification GSC/Bing par variable d'env, `dir="rtl"`, `Organization` + `WebSite` en JSON-LD, `viewport`/`themeColor`. |
| `src/app/sitemap.ts` | 84 URL, `lastmod` réel par produit, `images` par produit, revalidation horaire. |
| `src/app/robots.ts` | Ouverture aux robots IA, `/api` et `/admin` exclus, sitemap + host absolus. |
| `src/app/llms.txt/route.ts` | Index Markdown pour moteurs génératifs : faits (NAP, horaires, devise, livraison, retours), pages, 32 rayons, 43 produits avec prix et disponibilité, politique de citation. |
| `src/app/produits/[slug]/page.tsx` | Fiche produit serveur : `<h1>`, prix LYD + prix barré, stock, prix de gros, specs, description, CTA WhatsApp pré-rempli, produits liés, JSON-LD `Product` + `ItemList`. |
| `src/app/categories/[slug]/page.tsx` | Page rayon : description bilingue, sous-rayons, grille produits, `ItemList`. |
| `src/app/catalogue/page.tsx` | Hub : 32 rayons + 43 produits listés (liens + prix), bloc de faits Q/R (GEO), `FAQPage`. |
| `src/app/not-found.tsx` | 404 utile et `noindex`. |
| `src/app/manifest.ts`, `public/icon.svg` | PWA + favicon. |
| `src/app/{services,magasin,wholesale,vente-en-ligne}/layout.tsx` | Métadonnées complètes + `BreadcrumbList` ; `FAQPage` construit **depuis le CMS** (les questions affichées, donc jamais de divergence) ; `Store` sur `/magasin`. |
| `src/app/{privacy,terms,returns}/page.tsx` | Descriptions réelles + canonical. |
| `src/app/page.tsx` | Recherche `?q=`, liens `/catalogue` (nav + footer), bloc « À propos » factuel rendu en HTML, priorités d'image. |
| `src/components/StoreImage.tsx` | `priority`/`sizes`/`fetchPriority`/`decoding` honorés. |
| `next.config.ts` | `poweredByHeader: false`, AVIF/WebP, `X-Robots-Tag` sur `/api`, cache `/images`, HSTS/nosniff/Referrer-Policy/Permissions-Policy. |
| `env.example` | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`. |
| `tests/seo-metadata.test.ts` | 11 tests : réversibilité des slugs, canonical, robots, prix/devise/dispo du `Product`, NAP, breadcrumbs, FAQ. |

**Vérifications exécutées :** `npm run typecheck` ✅ · `npm run lint` ✅ (0 erreur) · `npm run build` ✅ (41 produits + 32 rayons prérendus) · 8 suites de tests existantes ✅ + `test:seo` ✅ · `curl` : `/`, `/catalogue`, `/sitemap.xml` (84 `<loc>`), `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, `/wholesale` (`FAQPage` présent), `/magasin` (`Store` présent), `/produits/nb-atelier-01` (200), `/produits/inconnu` (404), `/page-inconnue` (404).

---

## 4. Ce que TOI tu dois faire — dans cet ordre

### Étape 1 — Domaine et URL canonique (bloquant, 15 min)

1. Vercel → *Project → Settings → Domains* : brancher `almanhaj.ly` (+ `www` en redirection 301 vers l'apex, ou l'inverse — mais **une seule** version canonique).
2. Vercel → *Settings → Environment Variables* → **Production et Preview** :
   ```
   NEXT_PUBLIC_SITE_URL = https://almanhaj.ly
   ```
3. Redéployer. Sans cette variable, le sitemap et les canonical désignent le domaine de production Vercel — corrigé automatiquement dès qu'elle est posée, sans toucher au code.
4. Vérifier : `curl -s https://almanhaj.ly/robots.txt | grep Sitemap` doit afficher `https://almanhaj.ly/sitemap.xml`.

### Étape 2 — Google Search Console (30 min)

1. [search.google.com/search-console](https://search.google.com/search-console) → **Ajouter une propriété** → choisis **Domaine** (`almanhaj.ly`) : vérification par TXT/DNS, elle couvre `http`, `https`, `www` et les sous-domaines. Ajoute **aussi** une propriété **Préfixe d'URL** `https://almanhaj.ly/` (nécessaire pour lire les rapports par URL et utiliser l'API).
2. Pour la propriété « Préfixe d'URL », méthode **Balise HTML** : copie la valeur de `content` et pose la variable :
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = <la valeur copiée>
   ```
   → redéploie → clique **Vérifier**. La balise est injectée sur toutes les pages par `src/app/layout.tsx`.
3. **Sitemaps** → *Ajouter un sitemap* → `sitemap.xml` (l'URL complète s'affiche automatiquement). Statut attendu : « Réussite » sous 24–48 h, 84 URL découvertes.
4. **Inspection d'URL** → demande l'indexation de, dans cet ordre (10–15 URL/jour, pas plus) :
   `/`, `/catalogue`, `/wholesale`, `/vente-en-ligne`, `/services`, `/magasin`, puis 3–5 fiches produit et 2–3 rayons. C'est ce qui accélère la première indexation (le sitemap seul peut prendre 1–3 semaines).
5. Configure **Paramètres → Crawl statistics** et surveille **Indexation des pages** : les 404 volontaires (`/produits/<inconnu>`) doivent y apparaître comme 404, pas comme « Erreur serveur ».
6. **Expérience de page / Core Web Vitals** : à consulter après 28 jours (données de terrain).

### Étape 3 — Google Business Profile / local (1 h, le plus gros levier local)

1. [business.google.com](https://business.google.com) → créer ou revendiquer la fiche **شركة المنهج للقرطاسية** :
   - Catégorie principale : *Fournitures de bureau* ; secondaires : *Magasin de papeterie*, *Service d'impression*.
   - Adresse exacte, téléphone **+218 91-214-5050**, site `https://almanhaj.ly`.
   - **Coordonnées GPS exactes** : Google Maps → clic droit sur le magasin → copier `32.xxxxx, 13.xxxxx` → les reporter dans `SITE.latitude/longitude` (`src/lib/site.ts`) **et** dans la fiche. La valeur actuelle est au niveau quartier.
   - Horaires identiques au site (Sam–Jeu 09:00–21:00, vendredi fermé).
   - Photos réelles du magasin (le stock actuel vient de banques d'images).
2. Ajouter le lien de la fiche Google dans `/magasin` (bouton « Itinéraire ») — améliore le signal d'entité.
3. Le NAP du site (`src/lib/site.ts`) doit rester **strictement identique** à celui de la fiche, et à celui de Facebook/Instagram si tu les crées (`sameAs` du JSON-LD est prêt à les recevoir).

### Étape 4 — Bing / IndexNow (10 min)

1. [bing.com/webmasters](https://www.bing.com/webmasters) → importer depuis GSC (le plus rapide).
2. Optionnel mais utile : la variable `NEXT_PUBLIC_BING_SITE_VERIFICATION` est déjà branchée si tu préfères la balise.
3. Bing alimente ChatGPT Search et Copilot : c'est un canal GEO direct, pas un canal secondaire.

### Étape 5 — Validation des données structurées (15 min)

1. [Rich Results Test](https://search.google.com/test/rich-results) sur `/catalogue`, `/produits/<un slug>`, `/magasin`, `/wholesale`.
2. [Schema Markup Validator](https://validator.schema.org/) — doit être **sans erreur ni avertissement bloquant**.
3. Points qui dépendent de tes données : `price` et `availability` doivent correspondre au stock réel ; `image` doit être une **photo réelle** du produit (aujourd'hui des visuels Pexels partagés).

### Étape 6 — Remplir les données légales (bloquant confiance)

Audit immédiat : `/privacy` et le pied de page affichent `[XXXXXX]` et `[MTQ-XXXX]`. Google et les moteurs génératifs recoupent ces informations ; un numéro fictif dégrade la confiance et peut faire perdre les signaux « commerce vérifié ».
→ Admin → Settings, puis mettre à jour `src/lib/site.ts` si le NAP change.

---

## 5. Comment vérifier soi-même (copier-coller)

```bash
# 1. Le sitemap est-il absolu et complet ?
curl -s https://almanhaj.ly/sitemap.xml | grep -c "<loc>"        # attendu : 84 (croît avec le catalogue)

# 2. robots.txt : robots IA autorisés + sitemap
curl -s https://almanhaj.ly/robots.txt | grep -E "GPTBot|ClaudeBot|Sitemap"

# 3. Une fiche produit est-elle rendue côté serveur (contenu dans le HTML) ?
curl -s https://almanhaj.ly/produits/nb-atelier-01 | grep -o "<h1[^>]*>[^<]*"

# 4. Canonical + OG présents ?
curl -s https://almanhaj.ly/wholesale | grep -E "canonical|og:url"

# 5. llms.txt servi et à jour ?
curl -s https://almanhaj.ly/llms.txt | head -20

# 6. /api non indexable ?
curl -sI https://almanhaj.ly/api/store | grep -i x-robots-tag   # noindex, nofollow

# 7. Une URL inconnue renvoie bien 404 (pas 200) ?
curl -s -o /dev/null -w "%{http_code}\n" https://almanhaj.ly/produits/inconnu
```

---

## 6. Plan de suivi (4 semaines)

| Semaine | Action | Indicateur attendu |
|---|---|---|
| S1 | Domaine + `NEXT_PUBLIC_SITE_URL` + GSC + sitemap soumis | Sitemap « Réussite », 84 URL découvertes |
| S1–S2 | Demandes d'indexation (15/jour) + fiche GBP | 10–25 pages indexées, premières impressions |
| S2–S3 | Photos produits réelles (R4) + poids images (R5) | Google Images > 0, LCP < 2,5 s |
| S3–S4 | Premier guide d'achat (« دليل تجهيز العودة المدرسية ») | Premières requêtes longue traîne |
| S4 | Bilan GSC : requêtes, CTR, pages | Plan phase 2 (§7) |

**Requêtes à surveiller dans GSC :** `قرطاسية طرابلس`, `شركة المنهج`, `أدوات مكتبية ليبيا`, `بيبفي قرطاسية`, `stationery Tripoli`, `printer ink Libya`, `بيع بالجملة قرطاسية`.

---

## 7. Phase 2 — le reste du chemin (estimations)

| # | Chantier | Pourquoi | Effort |
|---|---|---|---|
| 1 | **Rendre l'accueil serveur** : sortir les sections produits/rayons du `fetch` client (RSC + `getCatalog()`, état client uniquement pour filtres/panier) | Le HTML initial doit contenir les produits : c'est le contenu principal, et c'est ce que lisent les LLM | 1–2 j |
| 2 | **URL bilingues** `/ar/...` et `/en/...` + `hreflang` + `x-default` | Double le nombre de requêtes adressables ; rend le site citable en anglais | 2–3 j |
| 3 | **Photos produits réelles + noms de fichiers parlants** (`nb-atelier-01-kyoto-linen-journal.webp`) | Google Images, conversion, unicité (R4) | dépend de la prise de vue |
| 4 | **Optimiser les images** : conversion WebP/AVIF des 41 fichiers (7,9 Mo → ~1,5 Mo), `next/image` partout | Core Web Vitals mobiles (R5) | 0,5 j |
| 5 | **`next/font` pour Inter + IBM Plex Sans Arabic** | Supprime 2 requêtes tierces, stabilise le CLS (R6) | 0,5 j |
| 6 | **Contenu informationnel** : 4–6 guides (fournitures scolaires, choix d'imprimante, papeterie d'entreprise, rentrée) avec liens vers les fiches | Le SEO local se gagne sur l'information, pas sur le catalogue seul (R8) | 1 j/guide |
| 7 | **Avis clients réels → `AggregateRating`** | Étoiles dans les résultats — uniquement avec de vrais avis (R9) | après 20 avis |
| 8 | **GA4 + GSC API + suivi des clics WhatsApp** | Piloter par les conversions, pas par les impressions (R11) | 0,5 j |
| 9 | **Citations locales** (annuaires libyens, Facebook, Instagram, PDF du catalogue) + `sameAs` dans le JSON-LD | Cohérence NAP = signal local majeur | 0,5 j |
| 10 | **Suivi de position + alertes** (404, couverture, CWV) | Détecter les régressions | 0,5 j |

---

## 8. Notes techniques pour la suite

- **Ajouter un produit** : rien à faire pour le SEO. La fiche `/produits/...` et la page rayon existent, le sitemap et `llms.txt` se mettent à jour en < 1 h (ISR).
- **Renommer un produit** : l'URL change (le titre est dans le slug) mais l'ancienne URL `/produits/<sku>` continue de résoudre → 200, pas de lien mort. Si le trafic le justifie, ajouter une redirection 301 dans `next.config.ts`.
- **Retirer un produit** : le passer en `isHidden` (jamais le supprimer) → il sort des pages, du sitemap et de `llms.txt` en une heure, et son URL renvoie 404.
- **Le domaine change une seule fois** : mettre à jour `NEXT_PUBLIC_SITE_URL`, redéployer, puis *Modification d'adresse* dans GSC (ne jamais changer de domaine sans cette étape).
- **Ne pas ajouter de `AggregateRating`, d'avis ni de `Review` inventés** : c'est le motif de sanction manuelle le plus courant sur un commerce local.
