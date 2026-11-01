import type { Metadata } from "next";
import type { Category, Product, StoreSettings } from "@/db/schema";
import { SITE, absoluteUrl } from "@/lib/site";
import { productSlug } from "@/lib/product-slug";

/**
 * Données structurées (JSON-LD) et helpers de métadonnées.
 *
 * Deux objectifs distincts, complémentaires :
 *
 *  - **SEO classique** — aider Google/Bing à construire des rich results
 *    (Organization, LocalBusiness, Product, BreadcrumbList, FAQPage) ;
 *  - **GEO (Generative Engine Optimization)** — les moteurs génératifs
 *    (AI Overviews, ChatGPT Search, Perplexity, Copilot) n'exécutent pas de JS
 *    et citent ce qu'ils peuvent lire tel quel : un JSON-LD explicite, un NAP
 *    complet, des prix et une disponibilité en clair sont la matière première
 *    la plus fiable pour eux.
 *
 * Toutes les URL produites ici sont absolues : le JSON-LD n'a pas de `<base>`.
 */

export type JsonLdObject = Record<string, unknown>;

const BRAND_MATCHERS = [
  "HP",
  "Canon",
  "Epson",
  "Brother",
  "Logitech",
  "Dell",
  "BIC",
  "Faber-Castell",
  "Staedtler",
  "Maped",
  "Pilot",
  "Stabilo",
] as const;

/** Marque déduite du titre / des specs quand l'admin n'a pas de champ dédié. */
export function detectBrandName(
  product: Pick<Product, "titleEn" | "specsEn">
): string | undefined {
  const haystack = `${product.titleEn} ${product.specsEn}`.toLowerCase();
  return BRAND_MATCHERS.find((brand) =>
    haystack.includes(brand.toLowerCase())
  );
}

/** Date ISO dans `days` jours — utilisée par `priceValidUntil`. */
function isoInDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Image absolue (les JSON-LD n'acceptent pas les chemins relatifs). */
export function absoluteImage(src: string | null | undefined): string {
  if (!src || !src.trim()) return absoluteUrl(SITE.socialImage);
  const value = src.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return absoluteUrl(value);
}

/** Adresse postale réutilisée par Organization / LocalBusiness. */
function postalAddress(): JsonLdObject {
  return {
    "@type": "PostalAddress",
    streetAddress: SITE.street,
    addressLocality: SITE.locality,
    addressRegion: SITE.region,
    postalCode: SITE.postalCode,
    addressCountry: SITE.country,
  };
}

function openingHoursSpecification(): JsonLdObject[] {
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SITE.openingHours.days,
      opens: SITE.openingHours.opens,
      closes: SITE.openingHours.closes,
    },
  ];
}

/** `Organization` — la société, indépendamment d'un point de vente. */
export function organizationJsonLd(
  settings?: Partial<StoreSettings> | null
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE.legalNameEn,
    alternateName: [SITE.legalNameAr, "Al Manhaj", "المنهج"],
    legalName: SITE.legalNameEn,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteImage(SITE.logo),
      width: 512,
      height: 512,
    },
    image: absoluteImage(SITE.socialImage),
    description: SITE.taglineEn,
    telephone: settings?.contactPhone?.trim() || SITE.phone,
    email: settings?.contactEmail?.trim() || SITE.email,
    address: postalAddress(),
    areaServed: [
      { "@type": "City", name: "Tripoli" },
      { "@type": "Country", name: "Libya" },
    ],
    knowsLanguage: ["ar", "en"],
    sameAs: [absoluteUrl("/magasin"), absoluteUrl("/catalogue")],
  };
}

/** `WebSite` + `SearchAction` (la recherche `/?q=` est prise en charge). */
export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: SITE.nameAr,
    alternateName: SITE.nameEn,
    inLanguage: ["ar", "en"],
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * `LocalBusiness` (magasin physique) — la fiche qui alimente la recherche
 * locale, Google Maps et les réponses « où acheter … à Tripoli ».
 */
export function storeJsonLd(
  settings?: Partial<StoreSettings> | null
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "OfficeEquipmentStore"],
    "@id": absoluteUrl("/magasin#store"),
    name: SITE.nameAr,
    alternateName: SITE.nameEn,
    url: absoluteUrl("/magasin"),
    image: absoluteImage(settings?.storefrontImage || SITE.socialImage),
    logo: absoluteImage(SITE.logo),
    description: SITE.taglineAr,
    telephone: settings?.contactPhone?.trim() || SITE.phone,
    email: settings?.contactEmail?.trim() || SITE.email,
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.latitude,
      longitude: SITE.longitude,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${SITE.latitude},${SITE.longitude}`,
    openingHoursSpecification: openingHoursSpecification(),
    priceRange: "10–500 LYD",
    currenciesAccepted: SITE.currency,
    paymentAccepted: ["Cash", "Bank Transfer"],
    areaServed: [
      { "@type": "City", name: "Tripoli" },
      { "@type": "Country", name: "Libya" },
    ],
    parentOrganization: { "@id": absoluteUrl("/#organization") },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Catalogue Al Manhaj",
      url: absoluteUrl("/catalogue"),
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; path: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[]
): JsonLdObject | null {
  const entries = faqs.filter(
    (faq) => faq.question.trim().length > 0 && faq.answer.trim().length > 0
  );
  if (entries.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * `Product` complet (offre, prix, stock, retours, livraison).
 *
 * Les moteurs génératifs citent volontiers un prix et une disponibilité
 * explicites ; c'est aussi ce qui rend la fiche éligible aux rich results
 * « produit » de Google. La devise est toujours le dinar libyen.
 */
export function productJsonLd(
  product: Product,
  category?: Category | null
): JsonLdObject {
  const url = absoluteUrl(`/produits/${productSlug(product)}`);
  const images = (Array.isArray(product.images) ? product.images : [])
    .filter((image) => typeof image === "string" && image.trim().length > 0)
    .map(absoluteImage);
  const inStock = product.stock > 0 && !product.isHidden;
  const brand = detectBrandName(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.titleAr || product.titleEn,
    alternateName: product.titleEn,
    description: product.descriptionAr || product.descriptionEn,
    sku: product.sku,
    mpn: product.sku,
    image: images.length > 0 ? images : [absoluteImage(SITE.socialImage)],
    url,
    category: category
      ? category.nameEn
      : product.subcategorySlug || product.categorySlug,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: SITE.currency,
      price: Number(product.price).toFixed(2),
      priceValidUntil: isoInDays(365),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": absoluteUrl("/#organization") },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: SITE.country,
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: SITE.country },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: SITE.currency,
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
        },
      },
    },
  };
}

type PageMetadataInput = {
  title: string;
  description: string;
  /** Chemin interne, ex. `/wholesale`. Sert de canonical ET d'`og:url`. */
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
};

/**
 * Métadonnées complètes d'une page : canonical, Open Graph, Twitter Card.
 *
 * Toutes les pages l'utilisent, ce qui garantit qu'aucune ne sort sans
 * canonical ni sans carte sociale — deux manques fréquents qui laissent Google
 * choisir lui-même l'URL à indexer.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  noindex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialImage = absoluteImage(image);
  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: path },
    ...(noindex
      ? { robots: { index: false, follow: true } }
      : {
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large" as const,
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          },
        }),
    openGraph: {
      type,
      url,
      siteName: SITE.nameAr,
      title,
      description,
      locale: "ar_LY",
      alternateLocale: ["en_US"],
      images: [
        {
          url: socialImage,
          width: SITE.socialImageWidth,
          height: SITE.socialImageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
