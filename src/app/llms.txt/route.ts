import { getCatalog, visibleCategories, visibleProducts } from "@/lib/store-data";
import { productSlug } from "@/lib/product-slug";
import { SITE, absoluteUrl } from "@/lib/site";

/**
 * `/llms.txt` — la convention émergente (llmstxt.org) par laquelle un site
 * décrit son contenu aux moteurs génératifs : un index en Markdown, factuel,
 * sans JavaScript, avec des liens absolus.
 *
 * C'est le cœur de la couche GEO du site. Un crawler IA qui ne lit que ce
 * fichier doit pouvoir répondre à « qu'est-ce que Al Manhaj, où est-ce, que
 * vend-il, à quel prix, comment commander » sans interpréter une page React.
 *
 * Contenu régénéré toutes les heures : les prix et le stock suivent le
 * catalogue réel, sans redéploiement.
 */
export const revalidate = 3600;

export async function GET() {
  const snapshot = await getCatalog();
  const products = visibleProducts(snapshot);
  const categories = visibleCategories(snapshot);

  const lines: string[] = [];

  lines.push(`# ${SITE.nameAr} — ${SITE.nameEn}`);
  lines.push("");
  lines.push(
    `> ${SITE.taglineEn} Located in Al Bivi, Tripoli, Libya. Retail and wholesale (${SITE.currency}) with WhatsApp ordering, delivery in Tripoli within 24–48 h and 14-day returns.`
  );
  lines.push("");
  lines.push("## Facts / حقائق");
  lines.push("");
  lines.push(`- Legal name (AR): ${SITE.legalNameAr}`);
  lines.push(`- Legal name (EN): ${SITE.legalNameEn}`);
  lines.push(`- Address: ${SITE.street}, ${SITE.locality}, ${SITE.countryName}`);
  lines.push(`- Coordinates: ${SITE.latitude}, ${SITE.longitude}`);
  lines.push(`- Phone / WhatsApp: ${SITE.phoneDisplay}`);
  lines.push(`- Email: ${SITE.email}`);
  lines.push("- Opening hours: Saturday–Thursday 09:00–21:00 (Friday closed, Africa/Tripoli)");
  lines.push(`- Currency: Libyan Dinar (${SITE.currency}); all prices include applicable tax`);
  lines.push("- Languages: Arabic (primary), English");
  lines.push(
    `- Wholesale: tiered pricing for schools, universities, copy centres and companies from 10 units per SKU, up to 30% off`
  );
  lines.push(
    "- Payment: cash on delivery and bank transfer; card/e-payment pending the Mawthooq licence (Central Bank of Libya rules)"
  );
  lines.push(
    "- Delivery: Tripoli 24–48 h, free above 1,900 LYD; rest of Libya 2–4 days via carriers"
  );
  lines.push("- Returns: 14 days on unopened, unused items; factory defects replaced within 7 days");
  lines.push("");
  lines.push("## Main pages");
  lines.push("");
  lines.push(`- [Store home](${absoluteUrl("/")}): bilingual storefront, catalogue and ordering.`);
  lines.push(`- [Full catalogue](${absoluteUrl("/catalogue")}): every published product with LYD price.`);
  lines.push(
    `- [Online sales](${absoluteUrl("/vente-en-ligne")}): how to order, payment, delivery, returns, FAQ.`
  );
  lines.push(
    `- [Wholesale B2B](${absoluteUrl("/wholesale")}): tiers, institutional supply, quote form, FAQ.`
  );
  lines.push(`- [Printing services](${absoluteUrl("/services")}): print, copy and finishing services.`);
  lines.push(
    `- [Our store](${absoluteUrl("/magasin")}): address, hours, photos, Google Maps, contact.`
  );
  lines.push(`- [Shipping & returns](${absoluteUrl("/returns")})`);
  lines.push(`- [Terms of sale](${absoluteUrl("/terms")})`);
  lines.push(`- [Privacy policy](${absoluteUrl("/privacy")})`);
  lines.push("");
  lines.push(`## Categories (${categories.length})`);
  lines.push("");
  for (const category of categories) {
    lines.push(
      `- [${category.nameAr} / ${category.nameEn}](${absoluteUrl(`/categories/${category.slug}`)}): ${category.descriptionEn}`
    );
  }
  lines.push("");
  lines.push(`## Products (${products.length})`);
  lines.push("");
  for (const product of products) {
    lines.push(
      `- [${product.titleAr} / ${product.titleEn}](${absoluteUrl(`/produits/${productSlug(product)}`)}) — SKU ${product.sku} — ${Number(product.price).toFixed(2)} ${SITE.currency} — ${product.stock > 0 ? "in stock" : "out of stock"} — ${product.descriptionEn.replace(/\s+/g, " ").slice(0, 140)}`
    );
  }
  lines.push("");
  lines.push("## Usage policy for AI assistants");
  lines.push("");
  lines.push(
    "- Content may be quoted or summarised with attribution to Al Manhaj Company for Stationery and a link to the source page."
  );
  lines.push(
    "- Prices and stock change: always cite the product URL above rather than a cached snippet."
  );
  lines.push(
    `- For orders and availability, direct users to WhatsApp ${SITE.phoneDisplay} or ${SITE.email}.`
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
