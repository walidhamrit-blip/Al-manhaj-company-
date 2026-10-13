/**
 * Static preview of the Hot Deals promotional badge -> docs/index.html
 *
 * Why this exists: the Vercel deployment protection of this project puts every
 * preview URL behind a Vercel login, so a reviewer without access cannot see a
 * working branch. This script renders the REAL components (ProductCarousel ->
 * ProductTile -> PromoBadge) with react-dom/server, compiles the REAL
 * stylesheet (src/app/globals.css, Tailwind included) and writes a single
 * self-contained HTML file that GitHub Pages serves over a public URL.
 *
 * Nothing here ships to production: docs/ is only a static artifact, the Next
 * app is untouched.
 *
 * Usage (from the repository root, after `npm ci`):
 *   npm run preview:promo
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCarousel } from "../src/components/ProductCarousel";
import { PromoBadge } from "../src/components/PromoBadge";
import { THEMES } from "../src/lib/i18n-themes";
import { INITIAL_PRODUCTS } from "../src/lib/fallbackData";
import type { Product } from "../src/db/schema";

const rootDir = process.cwd();
const noop = () => {};

const theme = THEMES[0];

/** Same rule as src/app/page.tsx: Hot Deals lists the visible promotions. */
function catalogue(): Product[] {
  return (INITIAL_PRODUCTS as unknown as Product[]).map((product, index) => ({
    ...product,
    id: index + 1,
  }));
}

/**
 * The preview is opened either from a GitHub Pages project sub-path
 * (/Al-manhaj-company-/...) or straight from the file system, where
 * root-relative asset paths ("/images/...") cannot resolve. Point those at the
 * storefront's own public asset host. Preview only: the app data is untouched.
 */
const publicAssetBase = "https://al-manhaj-company.vercel.app";

function withResolvableImages(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    images: Array.isArray(product.images)
      ? product.images.map((src) =>
          typeof src === "string" && src.startsWith("/") ? `${publicAssetBase}${src}` : src,
        )
      : product.images,
  }));
}

const all = catalogue();
const hotDeals = withResolvableImages(
  all.filter((p) => !p.isHidden && p.isPromotion).slice(0, 10),
);
const otherSection = withResolvableImages(
  all.filter((p) => !p.isHidden && p.categorySlug === "notebooks").slice(0, 4),
);

function carousel(lang: "ar" | "en", products: Product[], promoBadge: boolean) {
  return renderToStaticMarkup(
    <ProductCarousel
      title={lang === "ar" ? "العروض الساخنة" : "Hot deals"}
      promoBadge={promoBadge}
      seeMoreLabel={lang === "ar" ? "عرض المزيد" : "See more"}
      products={products}
      categories={[]}
      lang={lang}
      theme={theme}
      currencySymbol={lang === "ar" ? "د.ل" : "LYD"}
      cart={[]}
      onAddToCart={noop}
      onQuickView={noop}
      onSeeMore={noop}
    />,
  );
}

function badgeStage(lang: "ar" | "en") {
  return renderToStaticMarkup(
    <span className="badge-stage" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <PromoBadge lang={lang} />
    </span>,
  );
}

/** Shell styles, hand written on purpose: they never touch the app stylesheet. */
const shellCss = `
  body { padding: 0 0 3rem; }
  .shell { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 0; }
  .kicker { display: inline-block; margin: 0 0 .6rem; padding: .25rem .6rem; border-radius: 999px;
    background: #e30613; color: #fff; font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .shell h1 { margin: 0 0 .6rem; font-size: clamp(1.35rem, 2.6vw, 2rem); line-height: 1.2; }
  .lede { margin: 0 0 1rem; color: #444; max-width: 70ch; }
  .lede code, .build code { background: #e6e6e6; border-radius: 4px; padding: .1rem .3rem; font-size: .85em; }
  .criteria { margin: 0 0 1.2rem; padding: 1rem 1rem 1rem 1.4rem; background: #fff; border: 1px solid var(--border-color, #dcdcdc); border-radius: 10px; max-width: 78ch; }
  .criteria li { margin: .2rem 0; }
  .controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0 0 1rem; }
  .controls button { padding: .5rem .9rem; border: 1px solid #c9c9c9; border-radius: 999px; background: #fff;
    font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
  .controls button[aria-pressed="true"] { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
  .build { margin: 0 0 1.5rem; color: #555; font-size: .82rem; }
  .panel { margin: 0 0 1.75rem; background: #fff; border: 1px solid var(--border-color, #dcdcdc); border-radius: 12px; overflow: hidden; }
  .panel-label { margin: 0; padding: .7rem 1rem .1rem; font-size: .78rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #6b6b6b; }
  .panel-note { margin: 0; padding: .2rem 1rem .6rem; color: #555; font-size: .85rem; }
  .stage-row { display: flex; flex-wrap: wrap; gap: 1.25rem; padding: 1rem 1rem 1.4rem; }
  .badge-stage { position: relative; display: block; inline-size: 190px; block-size: 92px; border: 1px dashed #d5d5d5; border-radius: 10px; background: #fafafa; }
  .badge-stage .promo-badge { zoom: 2.6; }
  .footnotes { color: #555; font-size: .82rem; max-width: 82ch; }
  .footnotes li { margin: .3rem 0; }
  /* Preview-only switches. The real reduced-motion query lives in globals.css. */
  .no-anim .promo-badge, .no-anim .promo-badge__sheen, .no-anim .promo-badge__sparkle { animation: none; }
  .simulate-reduced .promo-badge, .simulate-reduced .promo-badge__sheen, .simulate-reduced .promo-badge__sparkle { animation: none; }
  .simulate-reduced .promo-badge__sheen { opacity: 0; }
  .simulate-reduced .promo-badge__sparkle { opacity: .55; transform: none; }
  body.zoomed .panel { zoom: 2; }
`;

function panel(
  label: string,
  note: string,
  dir: "rtl" | "ltr",
  content: string,
) {
  return `<section class="panel" dir="${dir}">
    <p class="panel-label" dir="ltr">${label}</p>
    <p class="panel-note" dir="ltr">${note}</p>
    ${content}
  </section>`;
}

function shell(compiledCss: string, stamp: { sha: string; branch: string; date: string }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Aperçu — badge promo des cartes Hot Deals | Al Manhaj</title>
<style>${compiledCss}</style>
<style>${shellCss}</style>
</head>
<body>
<div class="shell">
  <p class="kicker">Aperçu public · sans authentification</p>
  <h1>Badge promotionnel « Hot Deals » — aperçu consultable</h1>
  <p class="lede">
    Cette page est un rendu statique des composants réels du site
    (<code>ProductCarousel</code> &rarr; <code>ProductTile</code> &rarr; <code>PromoBadge</code>)
    avec la feuille de style réelle (<code>src/app/globals.css</code>, Tailwind compilé).
    L'animation tourne en direct dans la page : aucun GIF, aucune vidéo, aucun aperçu iframe.
  </p>
  <ul class="criteria">
    <li>Badge sur <strong>chaque carte produit de la section Hot Deals</strong> — pas à côté du titre, pas sur les autres sections (voir le 4<sup>e</sup> bloc).</li>
    <li>Forme ovale légèrement irrégulière, jaune doré, contour rouge, petite ombre noire.</li>
    <li>Texte <strong>PROMO</strong> en anglais, <strong>عرض</strong> en arabe.</li>
    <li>Reflet lumineux traversant le badge, léger rebond, quatre petits scintillements rouges près du périmètre.</li>
    <li>Aucun long rayon partant du centre, aucun clignotement brutal (les scintillements ne s'éteignent jamais complètement).</li>
    <li>Cycle d'animation de 3,6 s, désactivé par <code>prefers-reduced-motion</code>.</li>
    <li>Le pourcentage de réduction reste dans l'autre coin, et le badge n'intercepte aucun clic (<code>pointer-events: none</code>).</li>
  </ul>
  <div class="controls">
    <button type="button" data-action="replay">Rejouer l'animation</button>
    <button type="button" data-action="zoom" aria-pressed="false">Zoom ×2</button>
    <button type="button" data-action="reduced" aria-pressed="false">Simuler prefers-reduced-motion</button>
  </div>
  <p class="build">
    Branche <code>${stamp.branch}</code> · commit <code>${stamp.sha}</code> · généré le ${stamp.date}.
    Instantané statique : ce n'est pas la production, et la PR n'est pas fusionnée.
  </p>

  ${panel(
    "1 · Le badge seul, agrandi ×2,6",
    "Arabe (RTL) et anglais (LTR), chacun dans le sens de lecture de sa langue.",
    "ltr",
    `<div class="stage-row">${badgeStage("ar")}${badgeStage("en")}</div>`,
  )}

  ${panel(
    "2 · Section Hot Deals — arabe (RTL)",
    "« عرض » sur chaque carte, le pourcentage de réduction restant dans le coin opposé.",
    "rtl",
    carousel("ar", hotDeals, true),
  )}

  ${panel(
    "3 · Section Hot Deals — anglais (LTR)",
    "Même carrousel, même composant, texte « PROMO ».",
    "ltr",
    carousel("en", hotDeals, true),
  )}

  ${panel(
    "4 · Témoin — un autre carrousel, sans badge",
    "Les carrousels de catégories gardent la carte d'origine : seul Hot Deals opte pour le badge.",
    "ltr",
    carousel("en", otherSection, false),
  )}

  <ul class="footnotes">
    <li>Le badge est décoratif : <code>pointer-events: none</code>, aucun arrêt de tabulation, aucun bouton — le clic ouvre toujours la fiche produit.</li>
    <li>Le bouton « Simuler prefers-reduced-motion » applique la même neutralisation que le bloc <code>@media (prefers-reduced-motion: reduce)</code> présent dans <code>globals.css</code>.</li>
    <li>Les rubans de marques publiés par la PR nº 28 et les autres sections ne sont pas modifiés.</li>
  </ul>
</div>
<script>
  (function () {
    var body = document.body;
    document.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.action;
        if (action === "replay") {
          body.classList.add("no-anim");
          void body.offsetWidth;
          requestAnimationFrame(function () { body.classList.remove("no-anim"); });
          return;
        }
        var property = action === "zoom" ? "zoomed" : "simulate-reduced";
        var active = body.classList.toggle(property);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  })();
</script>
</body>
</html>
`;
}

async function main() {
  const globalCssPath = path.join(rootDir, "src/app/globals.css");
  const source = readFileSync(globalCssPath, "utf8");
  // `@source` right after the Tailwind import keeps the scan explicit and fast.
  const [firstLine, ...rest] = source.split("\n");
  const input = [firstLine, `@source "${path.join(rootDir, "src")}";`, ...rest].join("\n");
  const compiled = await postcss([tailwindcss()]).process(input, { from: globalCssPath });

  const stamp = {
    sha: (process.env.BUILD_SHA || "local").slice(0, 7),
    branch: process.env.BUILD_BRANCH || "local",
    date: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  };

  const html = shell(compiled.css, stamp);

  const outDir = path.join(rootDir, "docs");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  // GitHub Pages runs Jekyll by default; the preview needs no processing.
  writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log(`docs/index.html written (${kb} kB) — Hot Deals cards: ${hotDeals.length}, control carousel: ${otherSection.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
