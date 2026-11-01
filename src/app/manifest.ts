import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Manifest PWA minimal : nom, icône, langue et direction — utile pour l'ajout à
 * l'écran d'accueil mobile (une part importante du trafic d'une boutique de
 * quartier) et pour l'affichage du nom dans les résultats de recherche mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.nameAr} — ${SITE.nameEn}`,
    short_name: "المنهج",
    description: SITE.taglineAr,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#EEEEEE",
    theme_color: "#E30613",
    lang: "ar",
    dir: "rtl",
    orientation: "portrait-primary",
    categories: ["shopping", "business", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
