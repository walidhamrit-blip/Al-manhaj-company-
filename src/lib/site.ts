/**
 * Coordonnées canoniques du site — une seule source de vérité pour le nom, le
 * NAP (Name / Address / Phone), le domaine et les données structurées.
 *
 * Pourquoi un fichier dédié : le domaine et le NAP apparaissaient en dur dans
 * une dizaine de composants (footer, /magasin, /privacy, e-mails). Un audit SEO
 * ne peut pas être correct si le canonical, le sitemap et le JSON-LD ne
 * désignent pas exactement la même adresse.
 */

/**
 * Domaine de production.
 *
 * Ordre de résolution :
 *   1. `NEXT_PUBLIC_SITE_URL` — à définir sur Vercel (Production + Preview)
 *      dès que le domaine définitif est branché, sans redéploiement de code ;
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — le domaine de production du projet ;
 *   3. `VERCEL_URL` — l'URL du déploiement courant (previews) ;
 *   4. le domaine commercial, en dernier recours.
 *
 * Le résultat est toujours absolu, sans slash final : un canonical relatif est
 * résolu par `metadataBase`, mais le sitemap et le JSON-LD exigent l'absolu.
 */
const FALLBACK_SITE_URL = "https://almanhaj.ly";

function normalizeSiteUrl(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
  return withProtocol.replace(/\/+$/, "");
}

export function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeSiteUrl(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normalizeSiteUrl(production);

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return normalizeSiteUrl(deployment);

  return FALLBACK_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

/** URL absolue à partir d'un chemin interne (`/produits/...`) ou d'une URL. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE = {
  nameEn: "Al Manhaj Company for Stationery",
  nameAr: "شركة المنهج للقرطاسية",
  /** Nom légal utilisé dans le JSON-LD (Organization / LocalBusiness). */
  legalNameAr: "شركة المنهج للقرطاسية",
  legalNameEn: "Al Manhaj Company for Stationery",
  taglineEn:
    "Office supplies, school stationery, engineering equipment and printer consumables — retail and wholesale in Tripoli.",
  taglineAr:
    "أدوات مكتبية وقرطاسية مدرسية ومعدات هندسية ومستهلكات طباعة — بيع بالتقسيط وبالجملة في طرابلس.",
  phone: "+218912145050",
  phoneDisplay: "+218 91-214-5050",
  whatsapp: "218912145050",
  email: "info@almanhaj.ly",
  street: "Al Bivi (البيفي), Airport Road",
  locality: "Tripoli",
  region: "Tripoli",
  country: "LY",
  countryName: "Libya",
  postalCode: "00218",
  /**
   * Coordonnées du magasin, utilisées par le JSON-LD `geo` et par la fiche
   * Google Business Profile. Précision volontairement arrondie au quartier :
   * remplace-les par les coordonnées exactes (Google Maps → clic droit →
   * « Copier les coordonnées ») avant de soumettre la fiche GSC/GBP.
   */
  latitude: 32.8382,
  longitude: 13.1722,
  /** Fuseau horaire officiel de la Libye (UTC+2, sans heure d'été). */
  timezone: "Africa/Tripoli",
  currency: "LYD",
  /** Logo carré utilisé pour les rich results et le manifest. */
  logo: "/icon.svg",
  /** Image sociale par défaut (1200×630 idéalement). */
  socialImage: "/images/new/main-storefront-hq.jpg",
  socialImageWidth: 1200,
  socialImageHeight: 800,
  openingHours: {
    /** Samedi → jeudi, 09:00 → 21:00 (texte affiché sur le site). */
    days: [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ],
    opens: "09:00",
    closes: "21:00",
  },
};

/** Numéro WhatsApp au format `wa.me` avec message pré-rempli optionnel. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
