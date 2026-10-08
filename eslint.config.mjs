import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy copies kept at the repo root; the Next app lives in src/.
    "page.tsx",
    "layout.tsx",
    "globals.css",
    "ProductCard.tsx",
    "ProductQuickViewModal.tsx",
    "AdminDashboardModal.tsx",
    "CartDrawer.tsx",
    "MasterCatalogDrawer.tsx",
    "WhatsAppOrderPanel.tsx",
    "ImageUploadField.tsx",
  ]),
]);
