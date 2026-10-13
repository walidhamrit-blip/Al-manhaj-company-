"use client";

import React, { useEffect, useRef, useState } from "react";

/** Reference size of the wordmark — Tailwind `text-xl`, the design's baseline. */
export const MAX_FONT_SIZE = 20;
/** Floor for the JavaScript refinement, in px. */
export const MIN_FONT_SIZE = 9;
/**
 * Average advance of one character of Inter Black, card tracking
 * (`-0.06em`) included, in em. Deliberately over-estimated (real mixed-case
 * Latin sits around 0.55 em): the CSS fit below must never overflow, the
 * JavaScript refinement then enlarges the name to its exact fit.
 */
export const EM_PER_CHAR = 0.62;

/**
 * CSS-only fit, applied straight on the server-rendered HTML.
 *
 * The brand row is a container (`@container` in `ProductTile`), so `100cqw` is
 * exactly the width available to the name, at every breakpoint and for every
 * card width. `font-size: min(20px, 100cqw / (0.62 × characters))` is the
 * largest size at which the estimated width still fits — no measurement, no
 * effect, no flash: the name is complete on the very first paint, and stays
 * complete with JavaScript disabled.
 *
 * Browsers without container queries drop the declaration and fall back to the
 * static `text-[13px]` on the same element, which fits the narrowest card too.
 */
export function cssFitFontSize(text: string): string {
  const length = text.trim().length;
  if (length === 0) return `${MAX_FONT_SIZE}px`;
  const divisor = (length * EM_PER_CHAR).toFixed(2);
  return `min(${MAX_FONT_SIZE}px, calc(100cqw / ${divisor}))`;
}

/**
 * Largest size, in px, at which `measure` reports a width that fits.
 *
 * `measure(size)` must return the rendered width of the label at that size.
 * Three passes: glyph widths are not perfectly proportional to the font size
 * (hinting, letter-spacing rounding, synthetic bold and italic), so a single
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
 * Three levels of guarantee, in order:
 *   1. CSS — `cssFitFontSize` sizes the name from the card's own width
 *      (`100cqw`), so the server-rendered card is already complete;
 *   2. JavaScript — once mounted, the real glyphs are measured and the name is
 *      enlarged (or shrunk) to its exact fit, 20px → 9px, again on every
 *      resize and once the webfont has loaded;
 *   3. layout — the label wraps (`break-words whitespace-normal`) and the row
 *      is `min-h-9`, so even a name that no size can fit shows on two lines
 *      instead of being clipped.
 *
 * The box is `flex-1` (never shrink-to-fit): its width does not depend on the
 * label it contains, which keeps the ResizeObserver from measuring its own
 * result in a loop.
 */
export function BrandWordmark({ text, className = "" }: BrandWordmarkProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Last measured size pushed to the state, so an observer callback that
  // measures the same result twice does not re-render. Effects only.
  const appliedSize = useRef<number>(0);
  // `null` = the CSS fit is in charge (server render, first paint, no layout).
  const [measured, setMeasured] = useState<number | null>(null);

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
        // Measure as one line, whatever the wrapping the CSS currently applies.
        label.style.whiteSpace = "nowrap";
        label.style.fontSize = `${size}px`;
        return label.getBoundingClientRect().width;
      };

      const size = computeFitFontSize(available, measure);
      // Hand the inline styles back to the stylesheet and keep the DOM in sync
      // with the value React is about to render: `white-space` returns to the
      // class (`normal`), so an impossible name wraps instead of clipping.
      label.style.whiteSpace = "";
      label.style.fontSize = `${size}px`;

      if (size !== appliedSize.current) {
        appliedSize.current = size;
        setMeasured(size);
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
        style={{ fontSize: measured === null ? cssFitFontSize(text) : `${measured}px` }}
        className="inline-block break-words whitespace-normal text-[13px] font-black italic leading-none tracking-[-0.06em] text-[#171717]"
      >
        {text}
      </span>
    </span>
  );
}
