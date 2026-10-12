// Server component (no "use client"): reads the same build stamp as the
// data-build-* attributes on <html>, so the badge and the attributes always agree.
// Hidden in production. Purely informational: pointer-events-none so it never
// blocks a click, and it sits above the mobile bottom bar (bottom-[4.5rem]).
export default function BuildBadge() {
  const env = process.env.BUILD_ENV ?? "dev";
  if (env === "production") return null;
  const sha = process.env.BUILD_SHA ?? "local";

  return (
    <div
      dir="ltr"
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[4.5rem] start-2 z-[55] rounded bg-black/70 px-2 py-1 font-mono text-[11px] leading-none text-white lg:bottom-2"
    >
      {env} · {sha}
    </div>
  );
}
