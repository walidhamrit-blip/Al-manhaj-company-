// Run with tsx: `npm run test:theme`.
//
// Le thème par défaut réglé dans le panneau admin était enregistré en base mais
// jamais lu par la vitrine : le sélecteur « Default Store Theme » ne changeait
// rien. Ces tests fixent le contrat, dans l'ordre de priorité attendu :
//   1. le choix explicite du visiteur (`atelier_theme_v2`) gagne toujours ;
//   2. sinon le thème par défaut de la boutique (`settings.defaultTheme`) ;
//   3. sinon la palette principale claire, seule valeur rendue par le serveur.
// Ils couvrent aussi le sélecteur sombre/clair : bascule, retour au dernier
// thème clair, et « revenir au thème du magasin » qui efface la préférence.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const dom = new JSDOM(
  "<!doctype html><html><body><div id='root'></div></body></html>",
  { url: "https://almanhaj.test/", pretendToBeVisual: true },
);
const { window } = dom;

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
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  MutationObserver: window.MutationObserver,
  localStorage: window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type ThemeModule = typeof import("../src/lib/use-store-theme");
type ThemesModule = typeof import("../src/lib/i18n-themes");
type ClientModule = typeof import("react-dom/client");

let useStoreTheme: ThemeModule["useStoreTheme"];
let themeCssVars: ThemeModule["themeCssVars"];
let resolveThemeId: ThemesModule["resolveThemeId"];
let THEMES: ThemesModule["THEMES"];
let act: typeof React.act;
let createRoot: ClientModule["createRoot"];

before(async () => {
  const hook = await import("../src/lib/use-store-theme");
  useStoreTheme = hook.useStoreTheme;
  themeCssVars = hook.themeCssVars;
  const themes = await import("../src/lib/i18n-themes");
  resolveThemeId = themes.resolveThemeId;
  THEMES = themes.THEMES;
  const react = await import("react");
  act = react.act;
  const client = await import("react-dom/client");
  createRoot = client.createRoot;
});

let container: HTMLElement | null = null;
let appRoot: Root | null = null;

function settle() {
  // Le hook écrit dans des effets : on laisse passer une microtâche.
  return act(async () => {});
}

async function mount(defaultTheme?: string | null) {
  container = window.document.createElement("div");
  window.document.body.appendChild(container);
  appRoot = createRoot(container);
  await render(defaultTheme);
}

async function render(defaultTheme?: string | null) {
  await act(async () => {
    appRoot!.render(
      React.createElement(Probe, { defaultTheme: defaultTheme ?? null }),
    );
  });
  await settle();
}

async function click(id: string) {
  const button = container!.querySelector<HTMLButtonElement>(`#${id}`);
  assert.ok(button, `button #${id} exists`);
  await act(async () => {
    button.click();
  });
  await settle();
}

function shown() {
  return {
    themeId: window.document.documentElement.dataset.themeId,
    mode: window.document.documentElement.dataset.themeMode,
    colorScheme: window.document.documentElement.style.colorScheme,
    stored: window.localStorage.getItem("atelier_theme_v2"),
  };
}

function Probe({ defaultTheme }: { defaultTheme: string | null }) {
  const { themeId, mode, selectTheme, toggleMode, resetToStoreDefault } =
    useStoreTheme(defaultTheme);
  return React.createElement(
    "div",
    { "data-theme": themeId, "data-mode": mode },
    React.createElement("button", { id: "toggle", onClick: toggleMode }, "toggle"),
    React.createElement(
      "button",
      { id: "default", onClick: resetToStoreDefault },
      "default",
    ),
    React.createElement(
      "button",
      { id: "royal", onClick: () => selectTheme("royal") },
      "royal",
    ),
  );
}

after(async () => {
  if (appRoot) await act(async () => appRoot!.unmount());
  window.document.body.innerHTML = "";
  window.localStorage.clear();
});

test("only real palettes pass the id guard", () => {
  for (const theme of THEMES) {
    assert.equal(resolveThemeId(theme.id), theme.id);
  }
  assert.equal(resolveThemeId("neon-disco"), null);
  assert.equal(resolveThemeId(""), null);
  assert.equal(resolveThemeId(null), null);
  assert.equal(resolveThemeId(42), null);
  // The palette set must keep at least one dark and one light theme, otherwise
  // the dark/light switch has nowhere to go.
  assert.ok(THEMES.some((th) => th.isDark), "a dark palette exists");
  assert.ok(THEMES.some((th) => !th.isDark), "a light palette exists");
});

test("the CSS variables cover every colour of the palette", () => {
  const theme = THEMES[0];
  const vars = themeCssVars(theme);
  assert.equal(vars["--bg-primary"], theme.colors.bgPrimary);
  assert.equal(vars["--text-primary"], theme.colors.textPrimary);
  assert.equal(vars["--accent-primary"], theme.colors.accentPrimary);
  assert.equal(vars["--border-color"], theme.colors.border);
  assert.equal(
    Object.keys(vars).length,
    Object.keys(theme.colors).length,
    "one CSS variable per palette colour",
  );
});

test("a first-time visitor gets the server palette", async () => {
  window.localStorage.clear();
  await mount(null);
  assert.deepEqual(shown(), {
    themeId: "cyber",
    mode: "light",
    colorScheme: "light",
    stored: null,
  });
  await act(async () => appRoot!.unmount());
});

test("the admin default theme is applied once settings arrive", async () => {
  window.localStorage.clear();
  // The storefront mounts before the settings fetch resolves.
  await mount(null);
  assert.equal(shown().themeId, "cyber");

  await render("obsidian"); // settings.defaultTheme lands
  assert.equal(shown().themeId, "obsidian");
  assert.equal(shown().mode, "dark");
  assert.equal(shown().colorScheme, "dark");
  // A store default is not a visitor choice: nothing is written to storage.
  assert.equal(shown().stored, null);
  // The palette's colours reach the document.
  assert.equal(
    window.document.documentElement.style.getPropertyValue("--bg-primary"),
    THEMES.find((th) => th.id === "obsidian")!.colors.bgPrimary,
  );
  await act(async () => appRoot!.unmount());
});

test("an explicit visitor choice beats the admin default", async () => {
  window.localStorage.clear();
  window.localStorage.setItem("atelier_theme_v2", "royal");
  await mount("obsidian");
  assert.equal(shown().themeId, "royal");
  assert.equal(shown().mode, "light");
  await act(async () => appRoot!.unmount());
});

test("the dark/light switch toggles and remembers the light palette", async () => {
  window.localStorage.clear();
  await mount(null);
  await click("royal"); // visitor picks a light palette
  assert.equal(shown().themeId, "royal");
  assert.equal(shown().stored, "royal");

  await click("toggle"); // → dark
  assert.equal(shown().mode, "dark");
  assert.equal(shown().themeId, "obsidian");
  assert.equal(shown().stored, "obsidian");

  await click("toggle"); // → back to the palette they had
  assert.equal(shown().themeId, "royal");
  assert.equal(shown().mode, "light");
  assert.equal(shown().stored, "royal");
  await act(async () => appRoot!.unmount());
});

test("switching to dark from the admin default returns to that default", async () => {
  window.localStorage.clear();
  await mount("royal"); // admin default = a light palette
  await click("toggle");
  assert.equal(shown().themeId, "obsidian");
  await click("toggle");
  assert.equal(shown().themeId, "royal");
  await act(async () => appRoot!.unmount());
});

test("« use the store theme » forgets the visitor choice", async () => {
  window.localStorage.clear();
  window.localStorage.setItem("atelier_theme_v2", "emerald");
  await mount("obsidian");
  assert.equal(shown().themeId, "emerald");
  await click("default");
  assert.equal(shown().stored, null);
  assert.equal(shown().themeId, "obsidian");
  await act(async () => appRoot!.unmount());
});

test("the switch, the admin default and the API are wired where they should be", () => {
  const page = read("src/app/page.tsx");
  // The storefront reads the admin default and renders the dark/light switch.
  assert.match(page, /useStoreTheme\(settings\?\.defaultTheme\)/);
  assert.match(page, /data-theme-toggle/);
  assert.match(page, /toggleThemeMode/);
  // The old hard-coded restore that ignored saved light palettes is gone.
  assert.doesNotMatch(page, /atelier_theme_v2"\)\s*\|\|/);

  const admin = read("src/components/AdminDashboardModal.tsx");
  assert.match(admin, /data-admin-default-theme/);
  assert.match(admin, /defaultTheme: th\.id/);

  const api = read("src/app/api/settings/route.ts");
  assert.match(api, /resolveThemeId\(body\.defaultTheme\)/);
});
