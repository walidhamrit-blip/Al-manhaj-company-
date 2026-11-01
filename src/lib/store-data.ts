import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  products,
  storeSettings,
  type Category,
  type Product,
  type StoreSettings,
} from "@/db/schema";
import { hydrateFallbackStore, INITIAL_STORE_SETTINGS } from "@/lib/fallbackData";
import { DEFAULT_ONLINE_SALES_PAGE, DEFAULT_WHOLESALE_PAGE } from "@/lib/page-content";

/**
 * Chargement du catalogue côté **serveur**, pour les pages indexables
 * (accueil statique, `/catalogue`, `/categories/[slug]`, `/produits/[slug]`)
 * et pour le sitemap / llms.txt.
 *
 * Pourquoi ne pas réutiliser `/api/store` comme le font les composants clients :
 * une requête HTTP interne pendant le rendu ajoute de la latence, casse la mise
 * en cache statique et n'apporte rien — on est déjà dans le serveur. On lit
 * donc la base directement, avec trois garde-fous :
 *
 *  1. **pas de DATABASE_URL → pas de tentative de connexion** : le build et le
 *     développement local reposent sur le catalogue de seed, instantanément ;
 *  2. **timeout de 8 s** : une base froide (Neon) ne doit jamais bloquer un
 *     build ni faire échouer une page produit ;
 *  3. **mémoïsation courte** : un seul chargement par instance et par fenêtre
 *     de 5 minutes, pour que les pages statiques ne fassent pas N requêtes.
 */

export type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cached: { at: number; promise: Promise<CatalogSnapshot> } | null = null;

/** Le catalogue de secours est déjà typé côté « insert » : on complète les ids. */
function fallbackSnapshot(): CatalogSnapshot {
  const fallback = hydrateFallbackStore();
  return {
    categories: fallback.categories as unknown as Category[],
    products: fallback.products as unknown as Product[],
    settings: {
      ...INITIAL_STORE_SETTINGS,
      id: 1,
      onlineSalesPage: INITIAL_STORE_SETTINGS.onlineSalesPage ?? DEFAULT_ONLINE_SALES_PAGE,
      wholesalePage: INITIAL_STORE_SETTINGS.wholesalePage ?? DEFAULT_WHOLESALE_PAGE,
    } as unknown as StoreSettings,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`db timeout after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function loadFromDatabase(): Promise<CatalogSnapshot> {
  const [allCategories, allProducts, settingsRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(products).orderBy(desc(products.isFeatured), asc(products.id)),
    db.select().from(storeSettings).limit(1),
  ]);

  const row = settingsRows[0];
  if (!row) return fallbackSnapshot();

  // Les colonnes CMS JSON sont nullables (ajoutées après coup) : on retombe sur
  // les valeurs par défaut pour que les pages publiques ne rendent jamais un
  // bloc vide quand l'admin n'a jamais ouvert l'éditeur.
  const settings = {
    ...row,
    onlineSalesPage: row.onlineSalesPage ?? DEFAULT_ONLINE_SALES_PAGE,
    wholesalePage: row.wholesalePage ?? DEFAULT_WHOLESALE_PAGE,
  } as StoreSettings;

  return {
    categories: allCategories,
    products: allProducts,
    settings,
  };
}

/** Catalogue courant (base si disponible, seed sinon). Jamais d'exception. */
export async function getCatalog(): Promise<CatalogSnapshot> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.promise;

  const promise = (async (): Promise<CatalogSnapshot> => {
    if (!process.env.DATABASE_URL) return fallbackSnapshot();
    try {
      return await withTimeout(loadFromDatabase(), 8000);
    } catch (error) {
      console.warn("[seo] catalogue unavailable, serving seed fallback:", error);
      return fallbackSnapshot();
    }
  })();

  cached = { at: now, promise };
  // Un échec ne doit pas rester collé 5 minutes en mémoire.
  promise.catch(() => {
    cached = null;
  });
  return promise;
}

/** Produits visibles, dans l'ordre du catalogue. */
export function visibleProducts(snapshot: CatalogSnapshot): Product[] {
  return snapshot.products.filter((product) => !product.isHidden);
}

/** Catégories visibles (rayons et sous-rayons), ordonnées. */
export function visibleCategories(snapshot: CatalogSnapshot): Category[] {
  return [...snapshot.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}
