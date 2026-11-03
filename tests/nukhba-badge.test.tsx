// Run with tsx: `npm run test:badge`.
//
// Nukhba ships the « Website by Nukhba » badge for the sites it delivers and
// asks for one thing in return: a real link to nokhba.net.ly in the footer.
// Their rules are checked here, on the rendered markup — not on the source
// string — so a refactor cannot quietly drop the disclosure:
//   • the anchor really points at the UTM-tagged nokhba.net.ly URL, opens in a
//     new tab and keeps rel="sponsored nofollow noopener";
//   • the artwork is Nukhba's own remote SVG (unchanged, never re-hosted) with
//     the bilingual alt and the visible « نخبة » wordmark underneath;
//   • the dark-footer variant uses the light artwork, and every page of the
//     site actually renders the badge at its foot.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import NukhbaBadge from "../src/components/NukhbaBadge";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const html = renderToStaticMarkup(React.createElement(NukhbaBadge));
const lightHtml = renderToStaticMarkup(
  React.createElement(NukhbaBadge, { variant: "onLight" }),
);

test("the badge links to nokhba.net.ly with the agreed UTM campaign", () => {
  assert.match(
    html,
    /href="https:\/\/nokhba\.net\.ly\/\?utm_source=client_footer&amp;utm_medium=badge&amp;utm_campaign=client_credit"/,
  );
  assert.match(html, /target="_blank"/);
  // Sponsored disclosure: the link is credited, not passed off as an editorial one.
  assert.match(html, /rel="sponsored nofollow noopener"/);
  assert.match(html, /title="نخبة"/);
});

test("the artwork is Nukhba's own SVG with a bilingual alt and wordmark", () => {
  // Dark footer → light artwork; light footer → dark artwork. Same link either way.
  assert.match(html, /src="https:\/\/nokhba\.net\.ly\/badge\/nukhba-badge-light\.svg"/);
  assert.match(lightHtml, /src="https:\/\/nokhba\.net\.ly\/badge\/nukhba-badge\.svg"/);
  assert.match(html, /alt="نخبة \| Website by Nukhba"/);
  assert.match(html, /width="176"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.match(html, /نخبة · Website by Nukhba/);
  // The image is never stretched by CSS: height stays proportional.
  assert.match(html, /width:176px;height:auto/);
});

test("every page of the site carries the badge at its foot", () => {
  const pages = [
    "src/app/page.tsx",
    "src/app/services/page.tsx",
    "src/app/vente-en-ligne/page.tsx",
    "src/app/magasin/page.tsx",
    "src/app/wholesale/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/returns/page.tsx",
  ];
  for (const page of pages) {
    const source = read(page);
    assert.match(source, /import NukhbaBadge from "@\/components\/NukhbaBadge"/, page);
    assert.match(source, /<NukhbaBadge\b/, `${page} renders the credit badge`);
    // The badge sits after the page's own footer opening, never in a header.
    const badgeAt = source.indexOf("<NukhbaBadge");
    assert.ok(badgeAt > source.indexOf("</main>"), `${page} keeps the badge at the foot`);
  }
});
