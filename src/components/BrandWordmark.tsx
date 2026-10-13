"use client";

import React, { useEffect, useRef, useState } from "react";

/** Reference size of the wordmark — Tailwind `text-xl`, the design's baseline. */
const MAX_FONT_SIZE = 20;
/** Floor: below this the name is unreadable, and 30 characters still fit a phone card. */
const MIN_FONT_SIZE = 9;

/**
 * First guess from the character count. Server-rendered HTML and the first
 * client paint already carry a size close to the final one, so the card does
 * not visibly jump when the real measurement lands right after hydration.
 */
function guessFontSize(text: string): number {
  const length = text.trim().length;
  if (length <= 10) return MAX_FONT_SIZE;
  if (length <= 14) return 17;
  if (length <= 18) return 14.5;
  if (length <= 24) return 12;
  return MIN_FONT_SIZE + 1;
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
 * fallback wordmarks are long ("Tactile Mechanical-Switch", "Back-to-School
 * Starter"). At a fixed `text-xl` with `truncate` they were cut with an
 * ellipsis as soon as the card got narrow — two cards per row on a phone, four
 * in the catalogue drawer. The size is now measured against the real width of
 * the row and reduced until the whole name fits on its single line, so every
 * brand stays completely visible.
 *
 * The box is `flex-1` (never shrink-to-fit): its width therefore does not
 * depend on the label it contains, which keeps the ResizeObserver from
 * re-measuring its own result in a loop.
 */
export function BrandWordmark({ text, className = "" }: BrandWordmarkProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Last size pushed to the state, so a ResizeObserver callback that measures
  // the same result twice does not re-render. Read and written inside effects.
  const appliedSize = useRef<number>(0);
  const [fontSize, setFontSize] = useState<number>(() => guessFontSize(text));

  useEffect(() => {
    const box = boxRef.current;
    const label = labelRef.current;
    if (!box || !label) return;
    let active = true;

    const fit = () => {
      if (!active) return;
      const available = box.clientWidth;
      if (available <= 0) return;

      // Measure from the reference size, then scale down. Two passes: rendered
      // glyph widths are not perfectly proportional to the font size (hinting,
      // letter-spacing rounding), so the first estimate can stay a pixel wide.
      let size = MAX_FONT_SIZE;
      label.style.fontSize = `${size}px`;
      for (let pass = 0; pass < 2; pass += 1) {
        const natural = label.getBoundingClientRect().width;
        if (natural <= 0 || natural <= available) break;
        size = Math.max(
          MIN_FONT_SIZE,
          Math.floor((available / natural) * size * 10) / 10
        );
        label.style.fontSize = `${size}px`;
      }

      if (size !== appliedSize.current) {
        appliedSize.current = size;
        setFontSize(size);
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);

    // The webfont (Inter) usually lands after the first measurement, and its
    // glyphs are wider than the fallback's: refit once the fonts are ready.
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
      className={`block min-w-0 flex-1 overflow-hidden text-start ${className}`}
    >
      <span
        ref={labelRef}
        dir="ltr"
        style={{ fontSize }}
        className="inline-block whitespace-nowrap font-black italic leading-none tracking-[-0.06em] text-[#171717]"
      >
        {text}
      </span>
    </span>
  );
}
