// Official « Website by Nukhba » credit badge — https://nokhba.net.ly/badge
//
// Nukhba asks for one thing from the sites it delivers: a real, crawlable link
// to nokhba.net.ly at the bottom of the site. This component is that link. The
// mark-up follows their snippet to the letter:
//   • one lightweight remote SVG (≈4 KB), never re-hosted or re-coloured;
//   • the UTM-tagged destination (client_footer / badge / client_credit);
//   • rel="sponsored nofollow noopener" — the commercial relationship is
//     disclosed and the link is explicitly not a ranking signal;
//   • a bilingual alt, plus the visible « نخبة » wordmark.
//
// Two artworks, one URL: `onDark` (light artwork) for our dark footers,
// `onLight` (dark artwork) for the light, parchment-coloured legal pages.
// Server component on purpose: no state, no effect, renders identically on the
// server and on the client, so it can sit in any footer without hydration cost.

const BADGE_HREF =
  "https://nokhba.net.ly/?utm_source=client_footer&utm_medium=badge&utm_campaign=client_credit";

const ARTWORK = {
  onDark: "https://nokhba.net.ly/badge/nukhba-badge-light.svg",
  onLight: "https://nokhba.net.ly/badge/nukhba-badge.svg",
} as const;

type NukhbaBadgeProps = {
  /** `onDark` for dark footers (light artwork), `onLight` for light footers. */
  variant?: keyof typeof ARTWORK;
  className?: string;
};

export default function NukhbaBadge({
  variant = "onDark",
  className = "",
}: NukhbaBadgeProps) {
  return (
    <a
      dir="ltr"
      href={BADGE_HREF}
      target="_blank"
      rel="sponsored nofollow noopener"
      title="نخبة"
      data-nukhba-badge
      className={`inline-block no-underline opacity-90 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${className}`.trim()}
    >
      {/* Remote SVG: next/image refuses SVG sources without dangerouslyAllowSVG,
          and the artwork must stay byte-identical to Nukhba's own file. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ARTWORK[variant]}
        alt="نخبة | Website by Nukhba"
        width={176}
        height={44}
        loading="lazy"
        decoding="async"
        style={{ display: "block", width: 176, height: "auto" }}
      />
      <span
        style={{
          display: "block",
          marginTop: 6,
          fontSize: 12,
          lineHeight: 1.4,
          color: "#9C9A94",
        }}
      >
        نخبة · Website by Nukhba
      </span>
    </a>
  );
}
