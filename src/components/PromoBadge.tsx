import React from "react";
import type { Language } from "@/lib/i18n-themes";

interface PromoBadgeProps {
  /** Storefront language: "PROMO" in English, "عرض" in Arabic. */
  lang: Language;
  /** Escape hatch for a variant (size, placement) without touching the theme. */
  className?: string;
}

/**
 * Badge promotionnel des cartes « Hot Deals ».
 *
 * Une seule pastille par carte produit, posée dans le coin opposé au
 * pourcentage de réduction :
 * - ovale légèrement irrégulier, jaune doré, contour rouge, petite ombre noire ;
 * - un reflet lumineux traversant le badge (`promo-shimmer`) ;
 * - un léger rebond (`promo-lift`) ;
 * - quatre petits scintillements rouges près du périmètre (`promo-twinkle`).
 *
 * Aucun long rayon partant du centre, aucun clignotement brutal : le cycle
 * complet dure 3,6 s et se met en pause via `prefers-reduced-motion`
 * (voir `src/app/globals.css`).
 *
 * Le badge n'est pas un contrôle : `pointer-events: none` en CSS, donc les
 * clics passent à travers et ouvrent toujours la fiche produit.
 */
export function PromoBadge({ lang, className }: PromoBadgeProps) {
  const label = lang === "ar" ? "عرض" : "PROMO";
  const ariaLabel = lang === "ar" ? "عرض ترويجي" : "Promotional offer";

  return (
    <span
      data-promo-badge
      data-promo-lang={lang}
      role="img"
      aria-label={ariaLabel}
      className={className ? `promo-badge ${className}` : "promo-badge"}
    >
      {/* Le mot reste visible pour les voyants, l'annonce vocale est l'aria-label. */}
      <span
        className="promo-badge__label"
        aria-hidden="true"
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
      >
        {label}
      </span>
      <span className="promo-badge__sheen" aria-hidden="true" />
      {/* Quatre scintillements seulement — pas de rayons autour du badge. */}
      <span className="promo-badge__sparkles" aria-hidden="true">
        <i className="promo-badge__sparkle" />
        <i className="promo-badge__sparkle" />
        <i className="promo-badge__sparkle" />
        <i className="promo-badge__sparkle" />
      </span>
    </span>
  );
}
