"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HScrollStripProps = {
  /** Layout of the scrolling track itself: gaps, bleed margins, padding. */
  className?: string;
  /** Name for the region, announced when it is focused or reached by keyboard. */
  ariaLabel?: string;
  /**
   * Show previous/next buttons on screens ≥ sm. Mouse users have no obvious
   * way to scroll a hidden-scrollbar track (the wheel scrolls the page), so
   * the buttons are the visible affordance there. Touch and trackpad keep the
   * native swipe / horizontal scroll.
   */
  showArrows?: boolean;
  /** Accessible names for the two buttons (physical left / right). */
  arrowLabels?: { left: string; right: string };
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
 *
 * The arrow buttons work on physical sides: scrollLeft is physical in every
 * browser, so "left" always means "reveal more on the left", RTL or not.
 */
export function HScrollStrip({
  className = "",
  ariaLabel,
  showArrows = false,
  arrowLabels,
  children,
}: HScrollStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasMoreToEnd, setHasMoreToEnd] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    const remaining = overflow - Math.abs(el.scrollLeft);
    // A few px of slack: rounding and the focus ring would otherwise keep the
    // fade flickering at the very end of the track.
    setHasMoreToEnd(remaining > 4);

    // Physical bounds: in LTR scrollLeft runs 0 → +overflow; in RTL it runs
    // 0 → -overflow (0 is the start, on the right).
    const rtl = getComputedStyle(el).direction === "rtl";
    const minLeft = rtl ? -overflow : 0;
    const maxLeft = rtl ? 0 : overflow;
    setCanScrollLeft(el.scrollLeft > minLeft + 4);
    setCanScrollRight(el.scrollLeft < maxLeft - 4);
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

  const scrollByPage = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

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
      {showArrows && canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label={arrowLabels?.left ?? "Scroll left"}
          className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white shadow-md hover:bg-neutral-50 sm:flex"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      )}
      {showArrows && canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label={arrowLabels?.right ?? "Scroll right"}
          className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white shadow-md hover:bg-neutral-50 sm:flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
