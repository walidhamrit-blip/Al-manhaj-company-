"use client";

import React, { useEffect, useRef, useState } from "react";

/** Reference size of the wordmark — Tailwind `text-xl`, the design's baseline. */
export const MAX_FONT_SIZE = 20;
/** Floor: below this the name is unreadable; the label wraps instead of shrinking further. */
export const MIN_FONT_SIZE = 9;
/**
 * Narrowest brand box we plan for, in CSS pixels: a phone carousel card is
 * `min(82vw, 320px)` wide (≈ 262px on a 320px screen) minus the row's `px-3`.
 * Only used for the first paint, before the real measurement lands.
 */
const NARROWEST_BOX = 238;
/**
 * Average advance of one character of Inter Black with the card's
 * `tracking-[-0.06em]`, in em. Slightly over-estimated on purpose: the first
 * paint must never overflow, the measurement then enlarges what fits.
 */
const EM_PER_CHAR = 0.62;

/**
 * Largest size, in px, at which `measure` reports a width that fits.
 *
 * `measure(size)` must return the rendered width of the label at that size.
 * Three passes: glyph widths are not perfectly proportional to the font size
 * (hinting, letter-spacing rounding, synthetic bold/italic), so a single
 * ratio can leave the label a pixel too wide.
 */
export function computeFitFontSize(
  available: number,
  measure: (size: number) => number,
  max: number = MAX_FONT_SIZE,
  min: number = MIN_FONT_SIZE
): number {
  let size = max;
  for (let pass = 0; pass < 3; pass += 1) {
    const natural = measure(size);
    if (!(natural > 0) || natural <= available) return size;
    size = Math.max(min, Math.floor((available / natural) * size * 10) / 10);
  }
  return size;
}

/**
 * Size used for the server-rendered HTML and the first client paint, so the
 * card never shows an overflowing (or visibly reflowing) brand line while the
 * real measurement is still one frame away.
 */
export function guessFontSize(text: string): number {
  const length = text.trim().length;
  if (length === 0) return MAX_FONT_SIZE;
  const estimate = Math.min(
    MAX_FONT_SIZE,
    NARROWEST_BOX / (length * EM_PER_CHAR)
  );
  return Math.max(MIN_FONT_SIZE, Math.floor(estimate * 10) / 10);
}

interface BrandWordmarkProps {
  /** Brand / wordmark shown on the card, always in Latin characters. */
  text: string;
  className?: string;
}

/**
 * Brand line of a product card.
 *
 * The name is written in English (Latin) even on the Arabic page, and the
 * wordmarks are long — usually the fallback built from the first words of the
 * English title, like « Tactile Mechanical-Switch » or « Back-to-School
 * Starter ». At a fixed `text-xl` with `truncate` they were cut with an
 * ellipsis as soon as the card got narrow (two cards per row on a phone, four
 * in the catalogue drawer): the brand was never completely visible.
 *
 * Two levels of guarantee:
 *   1. the size is measured against the real width of the row and reduced
 *      until the whole name fits on its single line (20px → 9px);
 *   2. if the name still does not fit at the floor size, it wraps onto two
 *      lines instead of being clipped — the row is `min-h-9`, not `h-9`.
 *
 * The box is `flex-1` (never shrink-to-fit): its width therefore does not
 * depend on the label it contains, which keeps the ResizeObserver from
 * re-measuring its own result in a loop.
 */
export function BrandWordmark({ text, className = "" }: BrandWordmarkProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Last layout pushed to the state, so a ResizeObserver callback that measures
  // the same result twice does not re-render. Read and written inside effects.
  const applied = useRef({ size: 0, wraps: false });
  const [fontSize, setFontSize] = useState<number>(() => guessFontSize(text));
  const [wraps, setWraps] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const label = labelRef.current;
    if (!box || !label) return;
    let active = true;

    const fit = () => {
      if (!active) return;
      const available = box.clientWidth;
      if (available <= 0) return;

      const measure = (size: number) => {
        // Measure as a single line, whatever the current wrapping state.
        label.style.whiteSpace = "nowrap";
        label.style.fontSize = `${size}px`;
        return label.getBoundingClientRect().width;
      };

      const size = computeFitFontSize(available, measure);
      const overflow = measure(size) > available;
      label.style.whiteSpace = overflow ? "normal" : "nowrap";

      if (size !== applied.current.size || overflow !== applied.current.wraps) {
        applied.current = { size, wraps: overflow };
        setFontSize(size);
        setWraps(overflow);
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);

    // The webfont (Inter, synthesized at weight 900) usually lands after the
    // first measurement and its glyphs are wider than the fallback's: refit.
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(fit).catch(() => {});
    }

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text]);

  return (
    <span
      ref={boxRef}
      data-brand-wordmark={text}
      className={`block min-w-0 flex-1 overflow-hidden text-start ${className}`}
    >
      <span
        ref={labelRef}
        dir="ltr"
        style={{ fontSize }}
        className={`inline-block font-black italic leading-none tracking-[-0.06em] text-[#171717] ${
          wraps ? "break-words whitespace-normal" : "whitespace-nowrap"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
