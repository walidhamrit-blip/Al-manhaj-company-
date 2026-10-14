// Run with tsx: `npm run test:banners`.
//
// Régression corrigée : en version arabe, **toute** photo de bannière était
// retournée par `-scale-x-100`. Une photo qui contient du texte imprimé —
// accroche anglaise, logo de produit, clavier QWERTY, couverture de cahier —
// devenait alors illisible (`Work Smarter.` s'affichait `.ɿɘtɿɒmS ʞɿoW`).
//
// Ce que ces tests verrouillent :
//   1. le cadre de photo (`bannerImageFrameClass`) ne retourne plus rien sans
//      demande explicite : `mirrorInArabic` est la seule source du miroir ;
//   2. les quatre familles de bannières de la page d'accueil (héros, panoramique,
//      carrousel médian, rangée du haut, grille articles) respectent ce drapeau
//      et n'inversent jamais une photo en arabe quand il est absent ;
//   3. le héros et la bannière panoramique passent bien le drapeau de l'admin ;
//   4. les photos de démarrage qui portent du texte imprimé ne sont jamais
//      marquées « miroir » dans le catalogue de seed ;
//   5. le panneau d'administration propose la case, bannière par bannière.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionBannerCarousel } from "../src/components/SectionBannerCarousel";
import { TopBannerRow } from "../src/components/TopBannerRow";
import { ArticleBannerGrid } from "../src/components/ArticleBannerGrid";
import { bannerImageFrameClass } from "../src/lib/i18n-themes";
import { INITIAL_STORE_SETTINGS } from "../src/lib/fallbackData";
import type { HeroSlide } from "../src/db/schema";
import { THEMES } from "../src/lib/i18n-themes";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const pageSource = read("src/app/page.tsx");
const adminSource = read("src/components/AdminDashboardModal.tsx");
const theme = THEMES[0];
const noop = () => {};

const MIRROR = "-scale-x-100";

/** Une bannière complète, tous textes remplis. */
function banner(overrides: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: "b1",
    imageUrl: "/images/new/hero-it-tech-01.jpg",
    badgeEn: "Badge",
    badgeAr: "شارة",
    titleEn: "Title",
    titleAr: "عنوان",
    subtitleEn: "Subtitle",
    subtitleAr: "وصف",
    ctaEn: "CTA",
    ctaAr: "زر",
    targetCategory: "all",
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * 1. Le cadre de photo
 * ------------------------------------------------------------------ */

test("aucune photo n'est retournée sans demande explicite", () => {
  assert.equal(bannerImageFrameClass("ar"), "absolute inset-0");
  assert.equal(bannerImageFrameClass("ar", false), "absolute inset-0");
  assert.equal(
    bannerImageFrameClass("ar", true),
    `absolute inset-0 ${MIRROR}`,
    "le miroir reste disponible quand la bannière le demande"
  );
});

test("le miroir est réservé à la version arabe", () => {
  assert.equal(bannerImageFrameClass("en", true), "absolute inset-0");
  assert.equal(bannerImageFrameClass("en"), "absolute inset-0");
});

/* ------------------------------------------------------------------ *
 * 2. Les bannières du storefront
 * ------------------------------------------------------------------ */

test("le carrousel médian ne retourne pas une photo en arabe", () => {
  const html = renderToStaticMarkup(
    <SectionBannerCarousel
      banners={[banner()] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.ok(html.includes("/images/new/hero-it-tech-01.jpg"), "la photo est rendue");
  assert.ok(
    !html.includes(MIRROR),
    "sans mirrorInArabic, la photo garde son sens de lecture en arabe"
  );

  const mirrored = renderToStaticMarkup(
    <SectionBannerCarousel
      banners={[banner({ mirrorInArabic: true })] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.ok(mirrored.includes(MIRROR), "le drapeau de la bannière est honoré");
});

test("la rangée du haut et la grille d'articles suivent le même drapeau", () => {
  const topFr = renderToStaticMarkup(
    <TopBannerRow
      banners={[{ ...banner(), id: "t1" }, { ...banner(), id: "t2" }, { ...banner(), id: "t3" }] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.ok(!topFr.includes(MIRROR), "rangée du haut : photo intacte par défaut");

  const topMirrored = renderToStaticMarkup(
    <TopBannerRow
      banners={[
        banner({ id: "t1", mirrorInArabic: true }),
        banner({ id: "t2" }),
        banner({ id: "t3" }),
      ] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.equal(
    topMirrored.split(MIRROR).length - 1,
    1,
    "seule la bannière cochée est retournée"
  );
  assert.ok(
    !renderToStaticMarkup(
      <TopBannerRow banners={[banner()] as never} lang="en" theme={theme} onOpenCatalog={noop} />
    ).includes(MIRROR)
  );

  const articles = renderToStaticMarkup(
    <ArticleBannerGrid
      banners={[{ ...banner(), id: "a1" }, { ...banner(), id: "a2" }] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.ok(!articles.includes(MIRROR), "grille articles : photo intacte par défaut");

  const articlesMirrored = renderToStaticMarkup(
    <ArticleBannerGrid
      banners={[banner({ id: "a1", mirrorInArabic: true })] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.ok(articlesMirrored.includes(MIRROR));
});

test("le cadre porte le miroir, pas l'image : Ken Burns et zoom survivent", () => {
  const html = renderToStaticMarkup(
    <SectionBannerCarousel
      banners={[banner({ mirrorInArabic: true })] as never}
      lang="ar"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  // L'animation Ken Burns (transform) et le miroir ne peuvent pas cohabiter sur
  // le même élément : le miroir doit rester sur le cadre qui enveloppe l'image.
  const img = html.match(/<img[^>]*>/)?.[0] ?? "";
  assert.ok(img.includes("kenburns-bg"), "l'animation est bien sur l'image");
  assert.ok(!img.includes(MIRROR), "l'image ne porte pas le miroir");
  assert.match(
    html,
    new RegExp(`<div class="absolute inset-0 ${MIRROR}"><img`),
    "le cadre de la photo porte le miroir"
  );
});

/* ------------------------------------------------------------------ *
 * 3. Héros et bannière panoramique (dans page.tsx)
 * ------------------------------------------------------------------ */

test("le héros et la bannière panoramique passent le drapeau de l'admin", () => {
  assert.match(
    pageSource,
    /bannerImageFrameClass\(lang, currentHero\.mirrorInArabic\)/,
    "le miroir du héros vient de la bannière, jamais du seul choix de langue"
  );
  assert.match(
    pageSource,
    /bannerImageFrameClass\(lang, landscapeBanner\.mirrorInArabic\)/
  );
  assert.doesNotMatch(
    pageSource,
    /bannerImageClass/,
    "l'ancien miroir automatique a disparu de la page d'accueil"
  );
  // L'ancienne règle : `lang === "ar" ? ... -scale-x-100` — aucune trace.
  assert.doesNotMatch(pageSource, /-scale-x-100/);
});

/* ------------------------------------------------------------------ *
 * 4. Les photos de démarrage qui portent du texte imprimé
 * ------------------------------------------------------------------ */

const TEXT_BEARING_PHOTOS = [
  "/images/new/hero-it-tech-01.jpg", // « Work Smarter. Create More. » + clavier
  "/images/new/hero-stationery-01.jpg", // « JOURNAL », « NOTES », « HIGHLIGHTER »
  "/images/new/hero-bts-01.jpg", // marques imprimées sur les boîtes
  "/images/hero-stationery.jpg", // « TO DO: START A BUSINESS »
  "/images/hero-backtoschool.jpg", // « Classwork » au tableau
  "/images/new/landscape-01.jpg", // titre sur les cahiers, « ember » sur la tasse
];

test("aucune photo contenant du texte n'est marquée « miroir » dans le seed", () => {
  const settings = INITIAL_STORE_SETTINGS as unknown as Record<string, unknown[]>;
  const lists = ["heroSlides", "midBanners", "topBanners", "articleBanners"];
  for (const list of lists) {
    for (const slide of (settings[list] ?? []) as Record<string, unknown>[]) {
      if (TEXT_BEARING_PHOTOS.includes(String(slide.imageUrl))) {
        assert.notEqual(
          slide.mirrorInArabic,
          true,
          `${list}/${slide.id} : une photo avec du texte imprimé ne peut pas être retournée`
        );
      }
    }
  }
  const landscape = settings.landscapeBanner as unknown as Record<string, unknown>;
  assert.notEqual(landscape?.mirrorInArabic, true, "bannière panoramique du seed");
});

/* ------------------------------------------------------------------ *
 * 5. Le réglage dans le panneau d'administration
 * ------------------------------------------------------------------ */

test("l'admin propose la case sur chaque famille de bannières", () => {
  const toggles = adminSource.match(/<MirrorInArabicField/g) ?? [];
  assert.equal(
    toggles.length,
    5,
    "héros, bannière panoramique, carrousel médian, rangée du haut, grille articles"
  );
  for (const field of ["slide", "banner", "landscapeBannerForm"]) {
    assert.match(
      adminSource,
      new RegExp(`Boolean\\(${field}\\.mirrorInArabic\\)`),
      `l'état enregistré de ${field} pilote la case`
    );
  }
  assert.match(adminSource, /t\.homepageMirrorInArabicHint/, "l'aide est affichée");
});

test("l'aide annonce la règle : texte imprimé = pas de miroir", () => {
  const messages = read("src/lib/i18n-themes.ts");
  const hints = (messages.match(/homepageMirrorInArabicHint:\s*"([^"]+)"/g) ?? []).map(
    (entry) => entry.replace(/^homepageMirrorInArabicHint:\s*"/, "").replace(/"$/, "")
  );
  assert.equal(hints.length, 2, "l'aide existe en anglais et en arabe");
  assert.match(hints[0], /printed text|photo/i, "l'aide anglaise nomme la règle");
  assert.match(hints[1], /كتابة مطبوعة/, "l'aide arabe nomme la règle");
  assert.match(hints[1], /صورة/, "et parle bien de la photo");
});
