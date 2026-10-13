// Run with tsx: `npm run test:wordmark`.
//
// The brand line of a product card must show the whole English name, whatever
// the card width and whatever the language of the page. `storefront-layout`
// only reads the markup the server sends; this file mounts the real component
// in a DOM and runs its effect, so the measured fit and the resize path are
// covered too, and it checks the CSS-only fit that holds when no effect runs.
//
// jsdom has no layout engine: the geometry is stubbed with the same model the
// component assumes — the brand box reports the width of a real card row, and
// the label reports a width proportional to its font size.
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Brand box width: a phone carousel card is ≈ 295px wide minus the row's px-3. */
const PHONE_BOX = 271;
/** Narrowest card we plan for (320px screen), minus the row's px-3. */
const TINIEST_BOX = 238;
/** Desktop carousel card ≈ 350px wide, minus the row's px-3. */
const DESKTOP_BOX = 326;
/** Modelled advance of one character of Inter Black with -0.06em tracking. */
const EM_PER_CHAR = 0.62;

const NAMES = [
  "HP",
  "Office A4",
  "Kyoto Linen",
  "Sakura Smooth-Flow",
  "HyperDock 10-in-1",
  "GraphMaster FX-991EX",
  "Back-to-School Starter",
  "Tactile Mechanical-Switch",
];

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
});
const { window } = dom;

/** Mutable so a test can narrow the card and fire the ResizeObserver. */
let boxWidth = PHONE_BOX;
const observers: { callback: () => void }[] = [];

class ResizeObserverStub {
  callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "navigator", {
  // Node 22 exposes a getter-only global navigator.
  value: window.navigator,
  configurable: true,
  writable: true,
});

Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  HTMLSpanElement: window.HTMLSpanElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  MutationObserver: window.MutationObserver,
  ResizeObserver: ResizeObserverStub,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 0),
  cancelAnimationFrame: (handle: number) => window.clearTimeout(handle),
  IS_REACT_ACT_ENVIRONMENT: true,
});
(window as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

Object.defineProperty(window.HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get(this: HTMLElement) {
    return this.classList.contains("flex-1") ? boxWidth : 0;
  },
});

window.HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
  const fontSize = parseFloat(this.style.fontSize || "0") || 0;
  const text = this.textContent ?? "";
  const width =
    this.getAttribute("dir") === "ltr" ? text.length * fontSize * EM_PER_CHAR : boxWidth;
  return {
    width,
    height: fontSize,
    top: 0,
    left: 0,
    right: width,
    bottom: fontSize,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
};

type WordmarkModule = typeof import("../src/components/BrandWordmark");
type ClientModule = typeof import("react-dom/client");

let BrandWordmark: WordmarkModule["BrandWordmark"];
let computeFitFontSize: WordmarkModule["computeFitFontSize"];
let cssFitFontSize: WordmarkModule["cssFitFontSize"];
let createRoot: ClientModule["createRoot"];

before(async () => {
  const wordmark = await import("../src/components/BrandWordmark");
  BrandWordmark = wordmark.BrandWordmark;
  computeFitFontSize = wordmark.computeFitFontSize;
  cssFitFontSize = wordmark.cssFitFontSize;
  ({ createRoot } = await import("react-dom/client"));
});

async function mount(text: string) {
  const container = window.document.createElement("div");
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(<BrandWordmark text={text} />);
  });
  const label = container.querySelector('span[dir="ltr"]') as HTMLElement;
  assert.ok(label, "the brand label is in the DOM");
  const size = () => parseFloat(label.style.fontSize);
  const width = () => label.getBoundingClientRect().width;
  return { container, label, root, size, width };
}

/* ------------------------------------------------------------------ *
 * CSS fit — what the visitor sees before any script runs
 * ------------------------------------------------------------------ */

test("the CSS fit sizes the name from the card width, with no JavaScript", () => {
  for (const name of NAMES) {
    const css = cssFitFontSize(name);
    const parsed = /^min\((\d+)px, calc\(100cqw \/ ([\d.]+)\)\)$/.exec(css);
    assert.ok(parsed, `${name}: ${css} is a min() of the cap and the container width`);

    const cap = Number(parsed![1]);
    const divisor = Number(parsed![2]);
    assert.equal(cap, 20, "the design's reference size is the cap");
    assert.ok(
      Math.abs(divisor - name.trim().length * EM_PER_CHAR) < 0.01,
      `${name}: the divisor follows the character count`
    );

    for (const box of [TINIEST_BOX, PHONE_BOX, DESKTOP_BOX]) {
      const size = Math.min(cap, box / divisor);
      assert.ok(size > 0 && size <= cap);
      assert.ok(
        name.trim().length * size * EM_PER_CHAR <= box + 0.01,
        `${name} at ${size}px fits a ${box}px card without any script`
      );
    }
  }
});

test("the server sends the CSS fit, so the first paint is complete", () => {
  const html = renderToStaticMarkup(<BrandWordmark text="Tactile Mechanical-Switch" />);
  assert.match(html, /font-size:min\(20px, calc\(100cqw \/ 15\.50\)\)/);
  assert.doesNotMatch(html, /truncate/, "no ellipsis anywhere");
  assert.match(html, /break-words whitespace-normal/, "wrapping is the last resort");
  // Browsers without container queries fall back to a size that fits too.
  assert.match(html, /text-\[13px\]/);
});

/* ------------------------------------------------------------------ *
 * JavaScript refinement — measured fit inside a real DOM
 * ------------------------------------------------------------------ */

test("a long English brand name is shrunk until it fits the card", async () => {
  boxWidth = PHONE_BOX;
  const { label, size, width } = await mount("Tactile Mechanical-Switch");

  assert.equal(label.textContent, "Tactile Mechanical-Switch", "nothing is dropped");
  assert.ok(width() <= boxWidth, `fits the row: ${width()}px <= ${boxWidth}px`);
  assert.ok(size() < 20, `shrunk below the reference size (got ${size()}px)`);
  assert.ok(size() >= 9, `never below the floor (got ${size()}px)`);
  assert.ok(size() > 15, `as large as the row allows (got ${size()}px)`);
});

test("a short brand name keeps the reference size", async () => {
  boxWidth = PHONE_BOX;
  const { size, width } = await mount("HP");
  assert.equal(size(), 20);
  assert.ok(width() <= boxWidth);
});

test("the size follows the card width (carousel resize, rotation)", async () => {
  boxWidth = DESKTOP_BOX;
  const { size, width } = await mount("Back-to-School Starter");
  const wide = size();
  assert.ok(width() <= DESKTOP_BOX);

  // Same card squeezed to the phone width: the observer refits it.
  boxWidth = 135;
  await React.act(async () => {
    observers[observers.length - 1].callback();
  });
  assert.ok(size() < wide, `shrinks from ${wide}px to ${size()}px`);
  assert.ok(width() <= boxWidth, `fits the narrower row: ${width()}px`);
});

test("an absurdly long name stops at the floor and wraps on two lines", async () => {
  boxWidth = PHONE_BOX;
  const name = "Extraordinary Superlative Stationery Manufacture International";
  const { label, size } = await mount(name);

  assert.equal(label.textContent, name, "the whole name stays in the DOM");
  assert.equal(size(), 9, "shrinks down to the floor");
  assert.match(label.className, /whitespace-normal/, "so it wraps instead of clipping");
  assert.match(label.className, /break-words/);
});

test("the fit algorithm is monotonic and bounded", () => {
  const measure = (size: number) => 25 * size * EM_PER_CHAR;

  assert.equal(computeFitFontSize(1000, measure), 20, "plenty of room: full size");
  const tight = computeFitFontSize(PHONE_BOX, measure);
  assert.ok(measure(tight) <= PHONE_BOX, "the result fits");
  assert.ok(measure(tight + 0.1) > PHONE_BOX, "and one tenth larger would not");

  assert.equal(computeFitFontSize(20, measure), 9, "never below the floor");
  assert.equal(computeFitFontSize(0, () => 0), 20, "nothing measured: keep the reference");
});
