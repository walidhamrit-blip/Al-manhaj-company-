"use client";

// Thème de la vitrine : un seul endroit qui décide quelle palette est active,
// d'où elle vient et comment elle revient au thème par défaut de la boutique.
//
// Priorité (voir aussi le bloc de commentaire de i18n-themes.ts) :
//   1. choix explicite du visiteur — bouton sombre/clair ou menu des thèmes,
//      conservé dans `atelier_theme_v2` ;
//   2. thème par défaut réglé dans le panneau admin (`settings.defaultTheme`),
//      appliqué tant que le visiteur n'a rien choisi ;
//   3. thème principal du magasin, seule valeur rendue par le serveur : le HTML
//      et la première peinture restent donc identiques, puis la préférence
//      prend le relais — aucun écart d'hydratation.
//
// La préférence du visiteur est lue via `useSyncExternalStore` : le serveur (et
// l'hydratation) voient `null`, le navigateur voit la valeur stockée. C'est le
// mécanisme prévu par React pour une source externe comme localStorage — pas de
// setState dans un effet, donc pas de rendu en cascade. L'écriture, elle, passe
// par une petite fonction qui met à jour la valeur puis prévient les abonnés
// (y compris les autres onglets, via l'événement `storage`).
//
// Le hook applique aussi les variables CSS et `color-scheme` sur <html>, ce qui
// aligne les contrôles natifs (barres de défilement, champs, menus) sur le mode
// sombre, et expose `data-theme-id` / `data-theme-mode` pour la CSS et les tests.

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  LAST_LIGHT_THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  THEMES,
  THEME_STORAGE_KEY,
  firstDarkThemeId,
  firstLightThemeId,
  resolveThemeId,
  themeById,
  type ThemeConfig,
  type ThemeId,
} from "@/lib/i18n-themes";

export type ThemeMode = "light" | "dark";

export interface StoreThemeController {
  /** Identifiant de la palette active. */
  themeId: ThemeId;
  /** Palette complète (couleurs, noms bilingues, `isDark`). */
  theme: ThemeConfig;
  /** Mode binaire, celui du sélecteur sombre/clair. */
  mode: ThemeMode;
  isDark: boolean;
  /** Vrai dès que le visiteur a choisi lui-même (stockage local présent). */
  hasVisitorChoice: boolean;
  /** Choisit une palette et la retient pour les prochaines visites. */
  selectTheme: (id: ThemeId) => void;
  /** Bascule clair ⇄ sombre en gardant la dernière palette claire. */
  toggleMode: () => void;
  /** Oublie le choix du visiteur et revient au thème par défaut de l'admin. */
  resetToStoreDefault: () => void;
}

/** Variables CSS que la vitrine et les autres pages lisent. */
export function themeCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--bg-primary": theme.colors.bgPrimary,
    "--bg-secondary": theme.colors.bgSecondary,
    "--bg-elevated": theme.colors.bgElevated,
    "--text-primary": theme.colors.textPrimary,
    "--text-secondary": theme.colors.textSecondary,
    "--accent-primary": theme.colors.accentPrimary,
    "--accent-primary-hover": theme.colors.accentPrimaryHover,
    "--accent-secondary": theme.colors.accentSecondary,
    "--border-color": theme.colors.border,
    "--badge-bg": theme.colors.badgeBg,
    "--badge-text": theme.colors.badgeText,
  };
}

/* ------------------------------------------------------------------------- *
 * Petite réserve externe : le choix du visiteur, et ses abonnés.
 * ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function readStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      resolveThemeId(window.localStorage.getItem(THEME_STORAGE_KEY)) ??
      resolveThemeId(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY))
    );
  } catch {
    return null;
  }
}

function readStoredLastLight(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = resolveThemeId(
      window.localStorage.getItem(LAST_LIGHT_THEME_STORAGE_KEY),
    );
    return stored && !themeById(stored)?.isDark ? stored : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Snapshot client. Il relit le stockage à chaque appel mais renvoie une valeur
 * primitive : tant que le visiteur ne change rien, `===` tient et React ne
 * boucle pas. `null` = aucune préférence, c'est la boutique qui décide.
 */
function getSnapshot(): ThemeId | null {
  return readStoredTheme();
}

/** Snapshot serveur (et hydratation) : aucune préférence, palette principale. */
function getServerSnapshot(): ThemeId | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") return () => listeners.delete(listener);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key !== THEME_STORAGE_KEY &&
      event.key !== LEGACY_THEME_STORAGE_KEY
    ) {
      return;
    }
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Écrit (ou efface avec `null`) le choix du visiteur et prévient les abonnés. */
function writeChoice(id: ThemeId | null) {
  try {
    if (id) {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    }
  } catch {
    // stockage indisponible (navigation privée saturée, quota) : le thème tient
    // pour la session en cours, c'est tout.
  }
  emit();
}

function writeLastLight(id: ThemeId) {
  try {
    window.localStorage.setItem(LAST_LIGHT_THEME_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function useStoreTheme(defaultTheme?: string | null): StoreThemeController {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storeDefaultId = resolveThemeId(defaultTheme);

  const themeId: ThemeId =
    choice ?? storeDefaultId ?? firstLightThemeId();
  const theme = useMemo(() => themeById(themeId) ?? THEMES[0], [themeId]);
  const mode: ThemeMode = theme.isDark ? "dark" : "light";

  // Variables CSS + mode natif sur <html> : synchronisation avec le document,
  // pas de state React ici.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themeCssVars(theme))) {
      root.style.setProperty(name, value);
    }
    root.dataset.themeId = theme.id;
    root.dataset.themeMode = theme.isDark ? "dark" : "light";
    root.style.colorScheme = theme.isDark ? "dark" : "light";
  }, [theme]);

  const selectTheme = useCallback((id: ThemeId) => {
    const next = themeById(id);
    if (!next) return;
    writeChoice(next.id);
    if (!next.isDark) writeLastLight(next.id);
  }, []);

  const toggleMode = useCallback(() => {
    if (theme.isDark) {
      // Retour au dernier thème clair ; sinon au défaut clair de la boutique.
      const storedLight = readStoredLastLight();
      const defaultLight =
        storeDefaultId && !themeById(storeDefaultId)?.isDark
          ? storeDefaultId
          : null;
      selectTheme(storedLight ?? defaultLight ?? firstLightThemeId());
      return;
    }
    writeLastLight(theme.id);
    selectTheme(firstDarkThemeId());
  }, [selectTheme, storeDefaultId, theme]);

  const resetToStoreDefault = useCallback(() => {
    writeChoice(null);
    const target = storeDefaultId ?? firstLightThemeId();
    if (!themeById(target)?.isDark) writeLastLight(target);
  }, [storeDefaultId]);

  return {
    themeId,
    theme,
    mode,
    isDark: theme.isDark,
    hasVisitorChoice: choice !== null,
    selectTheme,
    toggleMode,
    resetToStoreDefault,
  };
}
