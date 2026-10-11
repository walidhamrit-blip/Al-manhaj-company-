"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type HScrollStripProps = {
  /** Layout of the scrolling track itself: gaps, bleed margins, padding. */
  className?: string;
  /** Name for the region, announced when it is focused or reached by keyboard. */
  ariaLabel?: string;
  children: ReactNode;
};

/**
 * One-line row that never wraps: items stay on a single line at every
 * breakpoint and the track scrolls horizontally when they overflow.
 *
 * The soft fade on the inline-end edge is the discoverability cue — it is only
 * rendered while there is actually content left to scroll, and it disappears
 * once the track reaches its end. `Math.abs(scrollLeft)` is what makes that
 * check correct in RTL (Arabic), where the scroll offset runs negative.
 */
export function HScrollStrip({
  className = "",
  ariaLabel,
  children,
}: HScrollStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasMoreToEnd, setHasMoreToEnd] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const remaining =
      el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);
    // A few px of slack: rounding and the focus ring would otherwise keep the
    // fade flickering at the very end of the track.
    setHasMoreToEnd(remaining > 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Categories arrive from /api/store after the first paint, which changes the
  // track's content without changing its own box — so remeasure on every
  // render rather than only on resize.
  useEffect(measure);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={measure}
        role="group"
        aria-label={ariaLabel}
        className={`no-scrollbar flex flex-nowrap overflow-x-auto scroll-smooth ${className}`}
      >
        {children}
      </div>
      {hasMoreToEnd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-[var(--bg-primary)] to-transparent sm:w-16 rtl:bg-gradient-to-r"
        />
      )}
    </div>
  );
}
