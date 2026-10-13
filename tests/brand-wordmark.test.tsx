// Run with tsx: `npm run test:wordmark`.
//
// The brand line of a product card must show the whole English name, whatever
// the card width. `tests/storefront-layout.test.tsx` only checks the markup the
// server sends; this file mounts the real component in a DOM and runs its
// effect, so the measured fit (and the resize / wrap paths) are covered too.
//
// jsdom has no layout engine: the geometry is stubbed with the same model the
// component assumes — the brand box reports the width of a real card row, and
// the label reports a width proportional to its font size.
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";

/** Brand box width: a phone carousel card is ≈ 295px wide minus the row's px-3. */
const PHONE_BOX = 271;
/** Modelled advance of one character of Inter Black with -0.06em tracking. */
const EM_PER_CHAR = 0.62;

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
let guessFontSize: WordmarkModule["guessFontSize"];
let createRoot: ClientModule["createRoot"];

before(async () => {
  const wordmark = await import("../src/components/BrandWordmark");
  BrandWordmark = wordmark.BrandWordmark;
  computeFitFontSize = wordmark.computeFitFontSize;
  guessFontSize = wordmark.guessFontSize;
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

test("a long English brand name is shrunk until it fits the card", async () => {
  boxWidth = PHONE_BOX;
  const { label, size, width } = await mount("Tactile Mechanical-Switch");

  assert.equal(label.textContent, "Tactile Mechanical-Switch", "nothing is dropped");
  assert.ok(width() <= boxWidth, `fits the row: ${width()}px <= ${boxWidth}px`);
  assert.ok(size() < 20, `shrunk below the reference size (got ${size()}px)`);
  assert.ok(size() >= 9, `never below the floor (got ${size()}px)`);
  assert.ok(size() > 15, `as large as the row allows (got ${size()}px)`);
  assert.match(label.className, /whitespace-nowrap/, "still a single line");
});

test("a short brand name keeps the reference size", async () => {
  boxWidth = PHONE_BOX;
  const { size, width } = await mount("HP");
  assert.equal(size(), 20);
  assert.ok(width() <= boxWidth);
});

test("the size follows the card width (carousel resize, rotation)", async () => {
  boxWidth = PHONE_BOX;
  const { label, size, width } = await mount("Back-to-School Starter");
  const wide = size();
  assert.ok(width() <= PHONE_BOX);

  // Same card squeezed to half the width: the observer refits it.
  boxWidth = 135;
  await React.act(async () => {
    observers[observers.length - 1].callback();
  });
  assert.ok(size() < wide, `shrinks from ${wide}px to ${size()}px`);
  assert.ok(width() <= boxWidth, `fits the narrower row: ${width()}px`);
  assert.match(label.className, /whitespace-nowrap/);
});

test("an absurdly long name wraps instead of being clipped", async () => {
  boxWidth = PHONE_BOX;
  const name = "Extraordinary Superlative Stationery Manufacture International";
  const { label, size, width } = await mount(name);

  assert.equal(label.textContent, name);
  assert.equal(size(), 9, "shrinks down to the floor");
  assert.ok(width() > boxWidth, "still wider than the row at the floor size");
  assert.match(label.className, /whitespace-normal/, "so it wraps on two lines");
  assert.match(label.className, /break-words/);
});

test("the first paint already fits, before any measurement", () => {
  // The server-rendered size must not overflow the narrowest card we plan for,
  // otherwise the brand flashes cut until the effect runs.
  const names = [
    "HP",
    "Office A4",
    "Kyoto Linen",
    "Sakura Smooth-Flow",
    "HyperDock 10-in-1",
    "GraphMaster FX-991EX",
    "Back-to-School Starter",
    "Tactile Mechanical-Switch",
  ];
  for (const name of names) {
    const size = guessFontSize(name);
    assert.ok(size >= 9 && size <= 20, `${name}: ${size}px is in range`);
    assert.ok(
      name.length * size * EM_PER_CHAR <= 238 + 0.5,
      `${name}: ${size}px fits the narrowest card`
    );
  }
});

test("the fit algorithm is monotonic and bounded", () => {
  const measure = (size: number) => 25 * size * EM_PER_CHAR;

  assert.equal(computeFitFontSize(1000, measure), 20, "plenty of room: full size");
  const tight = computeFitFontSize(271, measure);
  assert.ok(measure(tight) <= 271, "the result fits");
  assert.ok(measure(tight + 0.1) > 271, "and one tenth larger would not");

  const impossible = computeFitFontSize(20, measure);
  assert.equal(impossible, 9, "never below the floor");
  assert.equal(computeFitFontSize(0, () => 0), 20, "nothing measured: keep the reference");
});
