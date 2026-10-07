"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Category, Product, StoreSettings } from "@/db/schema";
import {
  THEMES,
  UI_TEXT,
  formatPrice,
  type Language,
  type ThemeId,
} from "@/lib/i18n-themes";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from "@/lib/fallbackData";
import { ProductCard } from "@/components/ProductCard";
import { CategoryImage } from "@/components/CategoryImage";
import { MasterCatalogDrawer } from "@/components/MasterCatalogDrawer";
import { CartDrawer, type CartItem } from "@/components/CartDrawer";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { AdminDashboardModal } from "@/components/AdminDashboardModal";
import { OrderTrackingSection, type OrderTrackingRequest } from "@/components/OrderTrackingSection";
import { WhatsAppOrderPanel } from "@/components/WhatsAppOrderPanel";
import {
  BookOpen,
  Search,
  ShoppingBag,
  PackageSearch,
  Palette,
  Globe,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  SlidersHorizontal,
  MessageCircle,
  Check,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  Percent,
  RotateCcw,
} from "lucide-react";

export default function StorefrontPage() {
  // Language & Direction state
  const [lang, setLang] = useState<Language>("ar");
  const isRtl = lang === "ar";
  const t = UI_TEXT[lang];

  // Visual Theme state (6 curated e-commerce themes)
  const [themeId, setThemeId] = useState<ThemeId>("paperSource");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const currentTheme = useMemo(
    () => THEMES.find((th) => th.id === themeId) || THEMES[0],
    [themeId]
  );

  // Store Data from PostgreSQL
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Carousel state
  const [heroIndex, setHeroIndex] = useState(0);

  // Search & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [onlyPromo, setOnlyPromo] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    "featured" | "price-asc" | "price-desc" | "stock"
  >("featured");

  // Wholesale Interactive Estimator states
  const [wholesaleProductId, setWholesaleProductId] = useState<number>(0);
  const [wholesaleQty, setWholesaleQty] = useState<number>(25);

  // Drawers & Modals state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );

  // WhatsApp in-app panel state
  const [waPanelOpen, setWaPanelOpen] = useState(false);
  const [waPanelMessage, setWaPanelMessage] = useState("");

  // Shopping Cart state (persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [trackingRequest, setTrackingRequest] =
    useState<OrderTrackingRequest | null>(null);

  // The same tracking area is available from navigation and order confirmation.
  const goToOrderTracking = useCallback(
    (orderNumber?: string, phone?: string) => {
      if (orderNumber && phone) {
        setTrackingRequest({
          orderNumber,
          phone,
          requestId: Date.now(),
        });
      }
      setIsCartOpen(false);
      window.setTimeout(() => {
        document
          .getElementById("order-tracking")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    },
    []
  );

  // Fetch live store data from PostgreSQL API
  const fetchStoreData = useCallback(async () => {
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (!res.ok) throw new Error("API not available - using seed");
      const data = await res.json();
      setCategories(data.categories || []);
      setProducts(data.products || []);
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.products && data.products.length > 0) {
        setWholesaleProductId((prev) => prev || data.products[0].id);
        const highest = Math.max(
          ...data.products.map((p: Product) => Number(p.price) || 100),
          120
        );
        setMaxPrice(Math.ceil(highest + 20));
      }
    } catch (err) {
      console.error("Failed to fetch store data, using seed fallback:", err);
      // Fallback pour Cloudflare Pages sans base de données - affiche les données de démo
      try {
        setCategories(INITIAL_CATEGORIES as any);
        setProducts(INITIAL_PRODUCTS as any);
        setSettings(INITIAL_STORE_SETTINGS as any);
        if (INITIAL_PRODUCTS.length > 0) {
          setWholesaleProductId((prev) => prev || (INITIAL_PRODUCTS[0] as any).id || 1);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchStoreData();
      try {
        const savedCart = localStorage.getItem("atelier_cart_v1");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        const savedTheme = localStorage.getItem("atelier_theme_v1") as ThemeId;
        if (savedTheme && THEMES.some((th) => th.id === savedTheme)) {
          setThemeId(savedTheme);
        }
      } catch {
        // ignore storage errors
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStoreData]);

  // Keep cart synced with latest product prices/stocks from DB
  useEffect(() => {
    if (products.length === 0) return;
    const timer = window.setTimeout(() => {
      setCart((prev) =>
        prev
          .map((item) => {
            const fresh = products.find((p) => p.id === item.product.id);
            return fresh ? { ...item, product: fresh } : item;
          })
          .filter((item) => products.some((p) => p.id === item.product.id))
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    try {
      localStorage.setItem("atelier_cart_v1", JSON.stringify(nextCart));
    } catch {
      // ignore
    }
  };

  const handleAddToCart = (product: Product, qtyToAdd: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) =>
          i.product.id === product.id
            ? { ...i, product, quantity: i.quantity + qtyToAdd }
            : i
        );
      } else {
        updated = [...prev, { product, quantity: qtyToAdd }];
      }
      try {
        localStorage.setItem("atelier_cart_v1", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    saveCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: number) => {
    saveCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleSelectTheme = (id: ThemeId) => {
    setThemeId(id);
    setIsThemeMenuOpen(false);
    try {
      localStorage.setItem("atelier_theme_v1", id);
    } catch {
      // ignore
    }
  };

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", currentTheme.colors.bgPrimary);
    root.style.setProperty("--bg-secondary", currentTheme.colors.bgSecondary);
    root.style.setProperty("--bg-elevated", currentTheme.colors.bgElevated);
    root.style.setProperty("--text-primary", currentTheme.colors.textPrimary);
    root.style.setProperty(
      "--text-secondary",
      currentTheme.colors.textSecondary
    );
    root.style.setProperty(
      "--accent-primary",
      currentTheme.colors.accentPrimary
    );
    root.style.setProperty("--border-color", currentTheme.colors.border);
  }, [currentTheme]);

  // Hero Slides from DB settings or fallback
  const heroSlides = useMemo(() => {
    const fromDb =
      settings?.heroSlides &&
      Array.isArray(settings.heroSlides) &&
      settings.heroSlides.length > 0
        ? settings.heroSlides
        : [];
    // Filter out any slide that would duplicate the storefront background.
    const filtered = fromDb.filter(
      (slide) => slide?.imageUrl !== "/images/new/main-storefront-hq.jpg" && slide?.imageUrl !== "/images/almanhaj-storefront.jpg"
    );
    if (filtered.length > 0) return filtered;
    return [
      {
        id: "default-1",
        imageUrl: "/images/hero-stationery.jpg",
        badgeEn: "2026 Academic & Studio Collection",
        badgeAr: "مجموعة الموسم الدراسي والاستوديو 2026",
        titleEn: "Tactile Paper Goods & Precision Writing Tools",
        titleAr: "قرطاسية فاخرة وأدوات كتابة وهندسة عالية الدقة",
        subtitleEn:
          "From 120gsm Japanese dotted notebooks to German-nib fountain pens — crafted for students, architects, and creators.",
        subtitleAr:
          "من الدفاتر اليابانية الفاخرة بوزن 120 جرام إلى أقلام الحبر السائل والأدوات الهندسية المصممة للطلاب والمبدعين.",
        ctaEn: "Explore Stationery",
        ctaAr: "استكشف القرطاسية",
        targetCategory: "notebooks",
      },
    ];
  }, [settings]);

  // Auto-advance Hero Carousel every 6 seconds
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currencySymbol = lang === "ar" ? "د.ل" : "LYD";

  // Featured / Promotion products for the highlight section after Landscape Banner (hidden products excluded)
  const featuredProducts = useMemo(() => {
    return products.filter((p) => !p.isHidden && (p.isFeatured || p.isPromotion)).slice(0, 6);
  }, [products]);

  // Highest product price for filter slider max
  const highestCatalogPrice = useMemo(() => {
    if (products.length === 0) return 2000;
    return Math.ceil(
      Math.max(...products.map((p) => Number(p.price) || 50), 100)
    );
  }, [products]);

  // Filtered & Sorted Products for the main catalog (hidden products excluded from storefront)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (p.isHidden) return false;
      if (selectedCategory !== "all" && p.categorySlug !== selectedCategory) {
        return false;
      }
      if (Number(p.price) > maxPrice) {
        return false;
      }
      if (onlyPromo && !p.isPromotion) {
        return false;
      }
      if (q) {
        const match =
          p.titleEn.toLowerCase().includes(q) ||
          p.titleAr.toLowerCase().includes(q) ||
          p.descriptionEn.toLowerCase().includes(q) ||
          p.descriptionAr.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.specsEn.toLowerCase().includes(q) ||
          p.specsAr.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "stock") return b.stock - a.stock;
      return Number(b.isFeatured) - Number(a.isFeatured);
    });
  }, [products, selectedCategory, maxPrice, onlyPromo, searchQuery, sortBy]);

  // Keep every product under its parent category in the complete catalog.
  const catalogGroups = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        category,
        items: filteredProducts.filter((product) => product.categorySlug === category.slug),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredProducts]);

  // Category selection handler that smoothly scrolls to the catalog section
  const handleSelectCategoryAndScroll = (slug: string) => {
    setSelectedCategory(slug);
    const el = document.getElementById("catalog-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Wholesale Calculator Logic
  const selectedWholesaleProduct = useMemo(() => {
    return (
      products.find((p) => p.id === wholesaleProductId) || products[0] || null
    );
  }, [products, wholesaleProductId]);

  const wholesaleCalculation = useMemo(() => {
    if (!selectedWholesaleProduct) return null;
    const retailUnit = Number(selectedWholesaleProduct.price);
    const baseWholesaleUnit = Number(selectedWholesaleProduct.wholesalePrice);
    const minQty = selectedWholesaleProduct.wholesaleMinQty || 10;

    let appliedUnit = retailUnit;
    let tierName =
      lang === "ar" ? "سعر التقسيط العادي" : "Standard Retail Rate";

    if (wholesaleQty >= 200) {
      appliedUnit = Number((baseWholesaleUnit * 0.88).toFixed(2));
      tierName = t.tier3Label;
    } else if (wholesaleQty >= 50) {
      appliedUnit = Number((baseWholesaleUnit * 0.94).toFixed(2));
      tierName = t.tier2Label;
    } else if (wholesaleQty >= minQty) {
      appliedUnit = baseWholesaleUnit;
      tierName = t.tier1Label;
    }

    const totalCost = appliedUnit * wholesaleQty;
    const totalSavings = Math.max(0, (retailUnit - appliedUnit) * wholesaleQty);

    return {
      retailUnit,
      appliedUnit,
      tierName,
      totalCost,
      totalSavings,
    };
  }, [selectedWholesaleProduct, wholesaleQty, lang, t]);

  const totalCartUnits = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const currentHero = heroSlides[heroIndex % heroSlides.length] || heroSlides[0];
  const landscapeBanner = settings?.landscapeBanner || {
    imageUrl: "/images/landscape-banner.jpg",
    badgeEn: "THE COMPLETE STUDIO & OFFICE ECOSYSTEM",
    badgeAr: "منظومة متكاملة للدراسة والمكاتب الحديثة",
    titleEn:
      "Where Traditional Paper Craftsmanship Meets Digital Productivity",
    titleAr: "حيث تلتقي حرفية الورق الفاخر مع أحدث تقنيات المكتب الرقمي",
    subtitleEn:
      "Every item in our catalog is tested for durability, archival quality, and daily ergonomics — available individually or in wholesale cartons with instant WhatsApp ordering.",
    subtitleAr:
      "كل منتج في كتالوجنا مختبر بعناية لضمان المتانة والجودة العالية والراحة اليومية — متوفر بالقطعة أو بكميات الجملة مع طلب فوري ومباشر عبر واتساب.",
    ctaEn: "Open Full Master Catalog",
    ctaAr: "افتح الكتالوج الشامل",
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundColor: currentTheme.colors.bgPrimary,
        color: currentTheme.colors.textPrimary,
      }}
      className="min-h-screen flex flex-col transition-colors duration-300 pb-20 lg:pb-0"
    >
      {/* ===== PAPER SOURCE TOP BAR ===== */}
      <div className="w-full bg-black text-white text-center py-2 text-[11px] sm:text-xs font-semibold tracking-widest uppercase">
        <span className="hidden sm:inline">توصيل مجاني داخل طرابلس فوق 1900 د.ل — Free Standard Shipping $60+ → </span>
        <span className="sm:hidden">توصيل مجاني 1900 د.ل+ →</span>
        <span className="opacity-60 font-normal normal-case tracking-normal hidden md:inline"> &nbsp;•&nbsp; البيفي، طرابلس • 0912145050</span>
      </div>
      {/* ===== PAPER SOURCE HEADER - Minimal White ===== */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "#E8E6E1",
        }}
        className="sticky top-0 z-40 border-b bg-white"
      >
        <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-2 sm:gap-4 px-2 sm:px-3 lg:px-4 py-3">
          {/* Top-Corner Master Catalogue Button + Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              style={{
                backgroundColor: "#111111",
                color: "#FFFFFF",
              }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-widest uppercase transition hover:bg-black active:scale-95"
              title={t.masterCatalog}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>{t.masterCatalog}</span>
            </button>

            <a
              href="#top"
              className="flex flex-col leading-tight hover:opacity-80 transition"
            >
              <span style={{fontFamily: "'Cormorant Garamond','Playfair Display',serif"}} className="text-base sm:text-xl font-semibold tracking-tight truncate max-w-[190px] sm:max-w-xs lg:max-w-none">
                {settings
                  ? lang === "ar"
                    ? settings.storeNameAr
                    : settings.storeNameEn
                  : lang === "ar"
                    ? "شركة المنهج للقرطاسية"
                    : "AL-MANHAJ"}
              </span>
              <span
                style={{ color: "#6B6B6B" }}
                className="hidden md:block text-[10px] font-medium tracking-[0.14em] uppercase truncate max-w-xs"
              >
                PAPER • STATIONERY • ATELIER • TRIPOLI
              </span>
            </a>
          </div>

          {/* Quick Search Bar in Header (Desktop) */}
          <div className="hidden lg:flex relative flex-1 max-w-md mx-4">
            <Search
              style={{ color: currentTheme.colors.textSecondary }}
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  document
                    .getElementById("catalog-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              placeholder={t.searchPlaceholder}
              style={{
                backgroundColor: "#FAFAF8",
                borderColor: "#E8E6E1",
                color: "#111111",
              }}
              className="w-full rounded-full border py-2 ps-10 pe-4 text-xs font-medium outline-none focus:border-black focus:bg-white transition"
            />
          </div>

          {/* Right Utility Controls: 6 Themes, EN/AR Switcher, Admin, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* 6-Theme Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                style={{
                  backgroundColor: currentTheme.colors.bgSecondary,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.textPrimary,
                }}
                className="flex items-center gap-1.5 rounded-none border px-2.5 sm:px-3 py-2 text-xs font-bold transition hover:opacity-85"
                title={t.themeSelectorTitle}
              >
                <Palette
                  style={{ color: currentTheme.colors.accentPrimary }}
                  className="h-4 w-4"
                />
                <span className="hidden xl:inline">
                  {lang === "ar" ? currentTheme.nameAr : currentTheme.nameEn}
                </span>
              </button>

              {isThemeMenuOpen && (
                <>
                  <div
                    onClick={() => setIsThemeMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div
                    style={{
                      backgroundColor: currentTheme.colors.bgElevated,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.textPrimary,
                    }}
                    className="absolute end-0 mt-2 z-40 w-72 rounded-none border p-3 shadow-2xl space-y-1.5"
                  >
                    <div className="px-2 py-1 text-xs font-extrabold uppercase tracking-wider opacity-70">
                      {t.themeSelectorTitle} (6 Themes)
                    </div>
                    {THEMES.map((th) => {
                      const active = th.id === themeId;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => handleSelectTheme(th.id)}
                          style={{
                            backgroundColor: active
                              ? currentTheme.colors.bgSecondary
                              : "transparent",
                            borderColor: active
                              ? currentTheme.colors.accentPrimary
                              : "transparent",
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-none border px-3 py-2 text-start transition hover:opacity-90"
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Swatch Preview */}
                            <div className="flex -space-x-1 rtl:space-x-reverse">
                              <span
                                style={{ backgroundColor: th.colors.bgPrimary }}
                                className="h-5 w-5 rounded-full border border-black/20"
                              />
                              <span
                                style={{
                                  backgroundColor: th.colors.accentPrimary,
                                }}
                                className="h-5 w-5 rounded-full border border-white/40"
                              />
                              <span
                                style={{
                                  backgroundColor: th.colors.textPrimary,
                                }}
                                className="h-5 w-5 rounded-full border border-white/40"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold">
                                {lang === "ar" ? th.nameAr : th.nameEn}
                              </div>
                              <div
                                style={{
                                  color: currentTheme.colors.textSecondary,
                                }}
                                className="text-[10px]"
                              >
                                {lang === "ar" ? th.subtitleAr : th.subtitleEn}
                              </div>
                            </div>
                          </div>
                          {active && (
                            <Check
                              style={{
                                color: currentTheme.colors.accentPrimary,
                              }}
                              className="h-4 w-4 shrink-0"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Bilingual Language Toggle (EN <-> AR with auto RTL) */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === "en" ? "ar" : "en"))}
              style={{
                backgroundColor: currentTheme.colors.bgSecondary,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.textPrimary,
              }}
              className="flex items-center gap-1.5 rounded-none border px-2.5 sm:px-3 py-2 text-xs font-extrabold transition hover:opacity-85"
              title="Switch Language (English / العربية)"
            >
              <Globe
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4"
              />
              <span>{lang === "en" ? "العربية" : "English"}</span>
            </button>

            {/* Order Tracking Shortcut */}
            <button
              type="button"
              onClick={() => goToOrderTracking()}
              style={{
                backgroundColor: currentTheme.colors.bgSecondary,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.textPrimary,
              }}
              className="hidden lg:flex items-center gap-1.5 rounded-none border px-3 py-2 text-xs font-bold transition hover:opacity-85"
            >
              <PackageSearch
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4"
              />
              <span>{t.trackOrder}</span>
            </button>

            {/* Secured Admin Button */}
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              style={{
                backgroundColor: currentTheme.colors.bgSecondary,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.textPrimary,
              }}
              className="hidden sm:flex items-center gap-1.5 rounded-none border px-3 py-2 text-xs font-bold transition hover:opacity-85"
            >
              <ShieldCheck
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4"
              />
              <span>{t.adminBtn}</span>
            </button>

            {/* Cart Button with Live Badge */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              style={{
                backgroundColor: currentTheme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="relative flex items-center gap-2 rounded-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold shadow-md transition hover:opacity-95 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="tabular-nums">{totalCartUnits}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          0. COMPANY STOREFRONT BACKGROUND WITH KEN BURNS ZOOM
      ===================================================================== */}
      <section
        id="top"
        className="relative w-full overflow-hidden h-[64vh] min-h-[420px] sm:h-[78vh] sm:min-h-[560px] max-h-[860px]"
      >
        <img
          src="/images/new/main-storefront-hq.jpg"
          alt={
            lang === "ar"
              ? "واجهة شركة المنهج للقرطاسية — البيفي، طرابلس"
              : "Al Manhaj Company for Stationery storefront — Al Bivi, Tripoli"
          }
          className="absolute inset-0 h-full w-full object-cover kenburns-bg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1580px] flex-col justify-end px-2 sm:px-4 lg:px-6 pb-6 sm:pb-10 text-white">
          <div className="max-w-3xl space-y-3 sm:space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/35 px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5" />
              {lang === "ar"
                ? "البيفي، طرابلس، ليبيا"
                : "Al Bivi, Tripoli, Libya"}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight drop-shadow-none">
              {lang === "ar"
                ? "شركة المنهج للقرطاسية"
                : "Al Manhaj Company for Stationery"}
            </h1>
            <p className="text-sm sm:text-xl font-bold tracking-[0.12em] text-amber-300/95 uppercase">
              Almanhaj for Stationery and Computer Equipment
            </p>

            <p className="text-sm sm:text-lg text-white/90 leading-relaxed max-w-2xl">
              {lang === "ar"
                ? "أدوات مكتبية • معدات هندسية • أدوات مدرسية • خزائن مختلفة • حبر طابعات ومعدات الحاسوب"
                : "Office tools • Engineering equipment • School supplies • Cabinets • Printer ink & computer equipment"}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setWaPanelMessage(
                    lang === "ar"
                      ? "مرحباً شركة المنهج للقرطاسية، أود الاستفسار عن منتجاتكم."
                      : "Hello Al Manhaj Company for Stationery, I would like to ask about your products."
                  );
                  setWaPanelOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-none bg-[#25D366] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-none transition hover:bg-[#1EBE5D]"
              >
                <MessageCircle className="h-4 w-4 fill-current" />
                <span dir="ltr">+218 91-214-5050</span>
              </button>

              <a
                href="tel:+218912145050"
                className="inline-flex items-center gap-2 rounded-none bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition"
              >
                <Phone className="h-4 w-4" />
                <span>{lang === "ar" ? "اتصل الآن" : "Call now"}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="inline-flex items-center gap-2 rounded-none bg-amber-500 hover:bg-amber-400 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-slate-950 shadow-none transition"
              >
                <BookOpen className="h-4 w-4" />
                <span>{t.masterCatalog}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAPER SOURCE HERO - Editorial Minimal ===== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pt-6 sm:pt-8">
        <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] w-full overflow-hidden rounded-none border border-[#E8E6E1] bg-white">
          {/* Slide Image */}
          <img
            src={currentHero.imageUrl}
            alt={lang === "ar" ? currentHero.titleAr : currentHero.titleEn}
            className="h-full w-full object-cover transition-all duration-700"
          />
          {/* Soft Paper Source overlay - white bottom for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent hidden sm:block" />

          {/* Slide Content - Paper Source editorial centered */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-12">
            <div className="max-w-2xl space-y-3 sm:space-y-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black border border-black px-3 py-1 bg-white/80 backdrop-blur">
                {lang === "ar" ? currentHero.badgeAr : currentHero.badgeEn}
              </span>

              <h1 style={{fontFamily: "'Cormorant Garamond','Playfair Display',serif"}} className="text-3xl sm:text-4xl lg:text-[44px] font-medium leading-tight tracking-tight text-black">
                {lang === "ar" ? currentHero.titleAr : currentHero.titleEn}
              </h1>

              <p className="text-xs sm:text-[13px] text-[#6B6B6B] leading-relaxed max-w-xl font-medium">
                {lang === "ar"
                  ? currentHero.subtitleAr
                  : currentHero.subtitleEn}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectCategoryAndScroll(
                      currentHero.targetCategory || "all"
                    )
                  }
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-zinc-800 transition"
                >
                  <span>
                    {lang === "ar" ? currentHero.ctaAr : currentHero.ctaEn}
                  </span>
                  <ArrowRight
                    className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="inline-flex items-center gap-2 bg-white border border-black text-black px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-black hover:text-white transition"
                >
                  <span>{t.masterCatalog}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Prev/Next Controls & Dots */}
          {heroSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setHeroIndex(
                    (heroIndex - 1 + heroSlides.length) % heroSlides.length
                  )
                }
                aria-label="Previous slide"
                className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/70 transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((heroIndex + 1) % heroSlides.length)
                }
                aria-label="Next slide"
                className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/70 transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-5 end-6 flex items-center gap-2">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      heroIndex === idx
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* =====================================================================
          2. SEVEN VISUAL CATEGORY CARDS ON HOME PAGE (CLICKABLE TO FILTER)
      ===================================================================== */}
      <section
        id="departments-section"
        className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 py-10 sm:py-14 bg-white"
      >
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center gap-3">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black border-b border-black pb-1 block mb-3">
              {lang === "ar" ? "أقسامنا الرئيسية" : "SHOP BY CATEGORY"}
            </span>
            <h2 style={{fontFamily: "'Cormorant Garamond',serif"}} className="text-2xl sm:text-3xl font-medium tracking-tight text-black">
              {t.categoriesTitle}
            </h2>
            <p
              style={{ color: currentTheme.colors.textSecondary }}
              className="text-xs sm:text-sm mt-1"
            >
              {t.categoriesSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSelectCategoryAndScroll("all")}
            style={{
              backgroundColor: currentTheme.colors.bgSecondary,
              color: currentTheme.colors.textPrimary,
            }}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-none px-4 py-2.5 text-xs font-bold transition hover:opacity-80"
          >
            <span>
              {t.allCategories} ({products.filter(p=>!p.isHidden).length})
            </span>
          </button>
        </div>

        {/* Main Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const countInCat = products.filter(
              (p) => !p.isHidden && p.categorySlug === cat.slug
            ).length;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategoryAndScroll(cat.slug)}
                style={{
                  borderColor: isSelected
                    ? currentTheme.colors.accentPrimary
                    : currentTheme.colors.border,
                }}
                className={`group relative flex h-64 sm:h-72 flex-col overflow-hidden rounded-none border-2 bg-white text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  isSelected ? "ring-2 ring-offset-2" : ""
                }`}
              >
                <CategoryImage
                  slug={cat.slug}
                  src={cat.imageUrl}
                  alt={lang === "ar" ? cat.nameAr : cat.nameEn}
                  className="h-[78%] w-full scale-125 bg-white object-contain px-2 pt-2 transition-transform duration-300 group-hover:scale-150"
                />

                <div
                  style={{
                    backgroundColor: currentTheme.colors.bgElevated,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="mt-auto min-h-0 border-t px-3 py-2.5"
                >
                  <span
                    style={{ color: currentTheme.colors.accentPrimary }}
                    className="mb-0.5 block truncate text-[9px] font-bold uppercase tracking-wider"
                  >
                    {lang === "ar" ? cat.badgeAr : cat.badgeEn}
                  </span>
                  <h3 className="line-clamp-2 text-xs font-extrabold leading-snug text-neutral-900 sm:text-sm">
                    {lang === "ar" ? cat.nameAr : cat.nameEn}
                  </h3>
                </div>

                <span
                  style={{
                    backgroundColor: currentTheme.colors.bgElevated,
                    color: currentTheme.colors.textPrimary,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="absolute start-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-bold shadow-sm"
                >
                  {countInCat} {t.itemsLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. LARGE LANDSCAPE PANORAMIC BACKGROUND BANNER
      ===================================================================== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-10 sm:pb-14">
        <div className="relative min-h-[300px] sm:min-h-[360px] w-full overflow-hidden rounded-none border border-[#E8E6E1] flex items-center">
          <img
            src={landscapeBanner.imageUrl}
            alt={
              lang === "ar" ? landscapeBanner.titleAr : landscapeBanner.titleEn
            }
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

          <div className="relative z-10 max-w-2xl p-6 sm:p-12 text-white space-y-4">
            <span
              style={{ backgroundColor: currentTheme.colors.accentPrimary }}
              className="inline-block rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest"
            >
              {lang === "ar"
                ? landscapeBanner.badgeAr
                : landscapeBanner.badgeEn}
            </span>

            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
              {lang === "ar"
                ? landscapeBanner.titleAr
                : landscapeBanner.titleEn}
            </h2>

            <p className="text-xs sm:text-base text-white/90 leading-relaxed">
              {lang === "ar"
                ? landscapeBanner.subtitleAr
                : landscapeBanner.subtitleEn}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                style={{
                  backgroundColor: currentTheme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="inline-flex items-center gap-2 rounded-none px-5 py-3 text-xs sm:text-sm font-extrabold shadow-none transition hover:opacity-95"
              >
                <BookOpen className="h-4 w-4" />
                <span>
                  {lang === "ar"
                    ? landscapeBanner.ctaAr
                    : landscapeBanner.ctaEn}
                </span>
              </button>

              <a
                href="#wholesale-section"
                className="inline-flex items-center gap-2 rounded-none bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 px-5 py-3 text-xs sm:text-sm font-bold text-white transition"
              >
                <Layers className="h-4 w-4" />
                <span>
                  {lang === "ar"
                    ? "عروض البيع بالجملة"
                    : "Wholesale B2B Pricing"}
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. FEATURED BESTSELLERS & PROMOTIONS SECTION (FOLLOWING LANDSCAPE BANNER)
      ===================================================================== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-12 sm:pb-16">
        <div
          style={{
            backgroundColor: currentTheme.colors.bgSecondary,
            borderColor: currentTheme.colors.border,
          }}
          className="rounded-none border p-5 sm:p-8"
        >
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider mb-1">
                <Sparkles
                  style={{ color: currentTheme.colors.accentPrimary }}
                  className="h-4 w-4"
                />
                <span style={{ color: currentTheme.colors.accentPrimary }}>
                  {lang === "ar"
                    ? "اختياراتنا المميزة والتخفيضات"
                    : "TOP PICKS & SPECIAL PROMOTIONS"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {t.featuredTitle}
              </h2>
              <p
                style={{ color: currentTheme.colors.textSecondary }}
                className="text-xs sm:text-sm mt-1"
              >
                {t.featuredSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyPromo(true);
                handleSelectCategoryAndScroll("all");
              }}
              style={{
                backgroundColor: currentTheme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-none px-4 py-2.5 text-xs font-extrabold shadow-sm"
            >
              <Percent className="h-3.5 w-3.5" />
              <span>{t.onlyPromotions}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {featuredProducts.map((product) => {
              const cat = categories.find(
                (c) => c.slug === product.categorySlug
              );
              const inCart =
                cart.find((c) => c.product.id === product.id)?.quantity || 0;
              return (
                <ProductCard
                  key={`featured-${product.id}`}
                  product={product}
                  category={cat}
                  lang={lang}
                  theme={currentTheme}
                  currencySymbol={currencySymbol}
                  cartQty={inCart}
                  onAddToCart={handleAddToCart}
                  onQuickView={setQuickViewProduct}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. COMPLETE STORE CATALOG WITH SEARCH BAR & ADVANCED FILTERS
      ===================================================================== */}
      <section
        id="catalog-section"
        className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-14 sm:pb-20"
      >
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t.allProductsTitle}
          </h2>
          <p
            style={{ color: currentTheme.colors.textSecondary }}
            className="text-xs sm:text-sm mt-1"
          >
            {t.showingItems} <strong>{filteredProducts.length}</strong>{" "}
            {t.itemsLabel} • {t.swipePhotosHint}
          </p>
        </div>

        {/* Interactive Filter & Search Toolbar */}
        <div
          style={{
            backgroundColor: currentTheme.colors.bgElevated,
            borderColor: currentTheme.colors.border,
          }}
          className="mb-8 rounded-none border p-4 sm:p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search
                style={{ color: currentTheme.colors.textSecondary }}
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  backgroundColor: currentTheme.colors.bgSecondary,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.textPrimary,
                }}
                className="w-full rounded-none border py-2.5 ps-10 pe-4 text-sm outline-none focus:ring-2"
              />
            </div>

            {/* Max Price Range Filter */}
            <div className="md:col-span-3 flex flex-col">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="inline-flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t.filterByPrice}
                </span>
                <span
                  style={{ color: currentTheme.colors.accentPrimary }}
                  className="tabular-nums font-extrabold"
                >
                  {formatPrice(maxPrice, lang)}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={highestCatalogPrice}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-current cursor-pointer"
              />
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "featured"
                      | "price-asc"
                      | "price-desc"
                      | "stock"
                  )
                }
                style={{
                  backgroundColor: currentTheme.colors.bgSecondary,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.textPrimary,
                }}
                className="w-full rounded-none border px-3 py-2.5 text-xs font-bold outline-none"
              >
                <option value="featured">{t.sortFeatured}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
                <option value="stock">{t.sortStock}</option>
              </select>
            </div>

            {/* Promotions Toggle & Reset */}
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOnlyPromo((prev) => !prev)}
                style={
                  onlyPromo
                    ? {
                        backgroundColor: currentTheme.colors.accentPrimary,
                        color: "#FFFFFF",
                      }
                    : {
                        backgroundColor: currentTheme.colors.bgSecondary,
                        color: currentTheme.colors.textPrimary,
                      }
                }
                className="flex-1 rounded-none px-3 py-2.5 text-xs font-bold transition"
              >
                {t.onlyPromotions}
              </button>

              {(selectedCategory !== "all" ||
                searchQuery ||
                onlyPromo ||
                maxPrice < highestCatalogPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setOnlyPromo(false);
                    setMaxPrice(highestCatalogPrice);
                  }}
                  style={{
                    backgroundColor: currentTheme.colors.bgSecondary,
                    color: currentTheme.colors.textPrimary,
                  }}
                  title={t.resetFilters}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none transition hover:opacity-80"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Keep every category visible without a horizontal scrolling strip. */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              style={
                selectedCategory === "all"
                  ? {
                      backgroundColor: currentTheme.colors.accentPrimary,
                      borderColor: currentTheme.colors.accentPrimary,
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: currentTheme.colors.bgSecondary,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.textPrimary,
                    }
              }
              className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start text-xs font-bold transition hover:opacity-85"
            >
              <span className="min-w-0 flex-1 line-clamp-2">{t.allCategories}</span>
              <span className="shrink-0 tabular-nums opacity-75">
                ({products.filter((product) => !product.isHidden).length})
              </span>
            </button>

            {categories.map((cat) => {
              const countInCat = products.filter(
                (product) => !product.isHidden && product.categorySlug === cat.slug
              ).length;
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  aria-pressed={active}
                  style={
                    active
                      ? {
                          backgroundColor: currentTheme.colors.accentPrimary,
                          borderColor: currentTheme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: currentTheme.colors.bgSecondary,
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.textPrimary,
                        }
                  }
                  className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start text-xs font-semibold transition hover:opacity-85"
                >
                  <span className="min-w-0 flex-1 line-clamp-2">
                    {lang === "ar" ? cat.nameAr : cat.nameEn}
                  </span>
                  <span className="shrink-0 tabular-nums opacity-75">({countInCat})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{ backgroundColor: currentTheme.colors.bgSecondary }}
                className="h-44 sm:h-52 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: currentTheme.colors.bgElevated,
              borderColor: currentTheme.colors.border,
            }}
            className="rounded-none border p-12 text-center space-y-3"
          >
            <p className="text-lg font-bold">
              {lang === "ar"
                ? "لم يتم العثور على منتجات مطابقة للفلاتر المحددة"
                : "No products match your active filters"}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setOnlyPromo(false);
                setMaxPrice(highestCatalogPrice);
              }}
              style={{
                backgroundColor: currentTheme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="inline-flex items-center gap-2 rounded-none px-5 py-2.5 text-xs font-extrabold"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.resetFilters}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {catalogGroups.map(({ category, items: categoryProducts }) => (
              <section
                key={category.id}
                id={`catalog-category-${category.slug}`}
                className="scroll-mt-28 space-y-3 sm:space-y-4"
              >
                <div
                  style={{
                    backgroundColor: currentTheme.colors.bgElevated,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="flex items-center justify-between gap-3 rounded-2xl border p-3 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryImage
                      slug={category.slug}
                      src={category.imageUrl}
                      alt={lang === "ar" ? category.nameAr : category.nameEn}
                      className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold sm:text-base">
                        {lang === "ar" ? category.nameAr : category.nameEn}
                      </h3>
                      <p
                        style={{ color: currentTheme.colors.textSecondary }}
                        className="line-clamp-1 text-xs"
                      >
                        {lang === "ar" ? category.descriptionAr : category.descriptionEn}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: currentTheme.colors.badgeBg,
                      color: currentTheme.colors.badgeText,
                    }}
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs"
                  >
                    {categoryProducts.length} {t.itemsLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  {categoryProducts.map((product) => {
                    const inCart =
                      cart.find((item) => item.product.id === product.id)?.quantity || 0;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        category={category}
                        lang={lang}
                        theme={currentTheme}
                        currencySymbol={currencySymbol}
                        cartQty={inCart}
                        onAddToCart={handleAddToCart}
                        onQuickView={setQuickViewProduct}
                        layout="list"
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          6. DEDICATED WHOLESALE & B2B BULK ORDERING SECTION
      ===================================================================== */}
      <section
        id="wholesale-section"
        className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-16 sm:pb-24"
      >
        <div
          style={{
            backgroundColor: currentTheme.colors.bgElevated,
            borderColor: currentTheme.colors.border,
          }}
          className="rounded-none border p-6 sm:p-10 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Wholesale Tiers & Conditions */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span
                  style={{
                    backgroundColor: currentTheme.colors.badgeBg,
                    color: currentTheme.colors.badgeText,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider mb-3"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {t.wholesaleSectionBadge}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {t.wholesaleSectionTitle}
                </h2>

                <p
                  style={{ color: currentTheme.colors.textSecondary }}
                  className="mt-2 text-sm leading-relaxed"
                >
                  {t.wholesaleSectionDesc}
                </p>
              </div>

              {/* 3 Volume Discount Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div
                  style={{
                    backgroundColor: currentTheme.colors.bgSecondary,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="rounded-none border p-4"
                >
                  <div
                    style={{ color: currentTheme.colors.accentPrimary }}
                    className="text-2xl font-black tabular-nums mb-1"
                  >
                    -{settings?.wholesaleDiscountTier1Pct ?? 15}%{" "}
                    <span className="text-xs font-bold">{t.discountOff}</span>
                  </div>
                  <div className="text-xs font-extrabold">{t.tier1Label}</div>
                </div>

                <div
                  style={{
                    backgroundColor: currentTheme.colors.bgSecondary,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="rounded-none border p-4"
                >
                  <div
                    style={{ color: currentTheme.colors.accentPrimary }}
                    className="text-2xl font-black tabular-nums mb-1"
                  >
                    -{settings?.wholesaleDiscountTier2Pct ?? 22}%{" "}
                    <span className="text-xs font-bold">{t.discountOff}</span>
                  </div>
                  <div className="text-xs font-extrabold">{t.tier2Label}</div>
                </div>

                <div
                  style={{
                    backgroundColor: currentTheme.colors.badgeBg,
                    borderColor: currentTheme.colors.accentPrimary,
                    color: currentTheme.colors.badgeText,
                  }}
                  className="rounded-none border-2 p-4"
                >
                  <div className="text-2xl font-black tabular-nums mb-1">
                    -{settings?.wholesaleDiscountTier3Pct ?? 30}%{" "}
                    <span className="text-xs font-bold">{t.discountOff}</span>
                  </div>
                  <div className="text-xs font-extrabold">{t.tier3Label}</div>
                </div>
              </div>

              {/* Dynamic Wholesale Conditions from PostgreSQL */}
              <div
                style={{
                  backgroundColor: currentTheme.colors.bgSecondary,
                  borderColor: currentTheme.colors.border,
                }}
                className="rounded-none border p-4 text-xs sm:text-sm leading-relaxed"
              >
                <p className="font-medium">
                  {settings
                    ? lang === "ar"
                      ? settings.wholesaleConditionsAr
                      : settings.wholesaleConditionsEn
                    : ""}
                </p>
              </div>
            </div>

            {/* Right Column: Interactive Bulk Wholesale Estimator */}
            <div
              style={{
                backgroundColor: currentTheme.colors.bgSecondary,
                borderColor: currentTheme.colors.border,
              }}
              className="lg:col-span-5 rounded-none border p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Layers
                  style={{ color: currentTheme.colors.accentPrimary }}
                  className="h-5 w-5"
                />
                <h3 className="text-base sm:text-lg font-extrabold">
                  {t.wholesaleCalculatorTitle}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {t.selectProduct}
                </label>
                <select
                  value={wholesaleProductId}
                  onChange={(e) =>
                    setWholesaleProductId(Number(e.target.value))
                  }
                  style={{
                    backgroundColor: currentTheme.colors.bgElevated,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.textPrimary,
                  }}
                  className="w-full rounded-none border px-3 py-2.5 text-xs sm:text-sm font-bold outline-none"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {lang === "ar" ? prod.titleAr : prod.titleEn} (
                      {formatPrice(prod.wholesalePrice, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>{t.quantityLabel}</span>
                  <span className="text-sm font-black tabular-nums">
                    {wholesaleQty} {t.units}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={250}
                  step={5}
                  value={wholesaleQty}
                  onChange={(e) => setWholesaleQty(Number(e.target.value))}
                  className="w-full cursor-pointer accent-current"
                />
                <div className="flex justify-between text-[10px] opacity-70 mt-1">
                  <span>10+ (Tier 1)</span>
                  <span>50+ (Tier 2)</span>
                  <span>200+ (Tier 3)</span>
                </div>
              </div>

              {wholesaleCalculation && selectedWholesaleProduct && (
                <div
                  style={{
                    backgroundColor: currentTheme.colors.bgElevated,
                    borderColor: currentTheme.colors.border,
                  }}
                  className="rounded-none border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-75">{t.unitPriceApplied}:</span>
                    <span className="font-extrabold tabular-nums">
                      {formatPrice(wholesaleCalculation.appliedUnit, lang)} /{" "}
                      {lang === "ar" ? "قطعة" : "unit"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                    <span>{t.totalSavings}:</span>
                    <span className="tabular-nums">
                      -{formatPrice(wholesaleCalculation.totalSavings, lang)}
                    </span>
                  </div>

                  <div className="border-t pt-2 flex items-center justify-between text-base font-black">
                    <span>{t.totalEstimated}:</span>
                    <span className="tabular-nums">
                      {formatPrice(wholesaleCalculation.totalCost, lang)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {selectedWholesaleProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(selectedWholesaleProduct, wholesaleQty);
                      setIsCartOpen(true);
                    }}
                    style={{
                      backgroundColor: currentTheme.colors.accentPrimary,
                      color: "#FFFFFF",
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-none py-3 px-4 text-xs sm:text-sm font-extrabold shadow-md transition hover:opacity-95"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {t.addEstimateToCart} ({wholesaleQty} {t.units})
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!selectedWholesaleProduct || !wholesaleCalculation)
                      return;
                    const prodTitle =
                      lang === "ar"
                        ? selectedWholesaleProduct.titleAr
                        : selectedWholesaleProduct.titleEn;
                    setWaPanelMessage(
                      lang === "ar"
                        ? `مرحباً، أود طلب عرض سعر جملة للمؤسسات:\n• المنتج: ${prodTitle} (${selectedWholesaleProduct.sku})\n• الكمية: ${wholesaleQty} قطعة\n• الإجمالي التقديري: ${formatPrice(wholesaleCalculation.totalCost, "ar")}`
                        : `Hello, I would like a B2B Wholesale Quote:\n• Product: ${prodTitle} (${selectedWholesaleProduct.sku})\n• Quantity: ${wholesaleQty} units\n• Estimated Total: ${formatPrice(wholesaleCalculation.totalCost, "en")}`
                    );
                    setWaPanelOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-none bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 px-4 text-xs font-extrabold shadow transition"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>{t.inquireWholesaleWhatsApp}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OrderTrackingSection
        lang={lang}
        theme={currentTheme}
        trackingRequest={trackingRequest}
      />

      {/* =====================================================================
          7. FOOTER WITH LIVE CONTACT INFORMATION & WHATSAPP DIRECT LINK
      ===================================================================== */}
      <footer
        style={{
          backgroundColor: currentTheme.colors.bgSecondary,
          borderColor: currentTheme.colors.border,
        }}
        className="mt-auto border-t py-10"
      >
        <div className="mx-auto max-w-[1580px] px-2 sm:px-3 lg:px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-black">
              {settings
                ? lang === "ar"
                  ? settings.storeNameAr
                  : settings.storeNameEn
                : lang === "ar"
                  ? "شركة المنهج للقرطاسية"
                  : "Al Manhaj Company for Stationery"}
            </h3>
            <p
              style={{ color: currentTheme.colors.textSecondary }}
              className="text-xs sm:text-sm leading-relaxed"
            >
              {settings
                ? lang === "ar"
                  ? settings.taglineAr
                  : settings.taglineEn
                : ""}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                style={{
                  backgroundColor: currentTheme.colors.bgElevated,
                  borderColor: currentTheme.colors.border,
                }}
                className="inline-flex items-center gap-1.5 rounded-none border px-3.5 py-2 text-xs font-bold"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t.adminBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => goToOrderTracking()}
                style={{
                  backgroundColor: currentTheme.colors.bgElevated,
                  borderColor: currentTheme.colors.border,
                }}
                className="inline-flex items-center gap-1.5 rounded-none border px-3.5 py-2 text-xs font-bold"
              >
                <PackageSearch className="h-4 w-4" />
                <span>{t.trackOrder}</span>
              </button>
            </div>
          </div>

          {/* Quick Departments */}
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3">
              {t.categoriesTitle}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategoryAndScroll(cat.slug)}
                  className="text-start hover:underline truncate"
                >
                  • {lang === "ar" ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Contact Details from PostgreSQL */}
          <div className="space-y-2.5 text-xs sm:text-sm">
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3">
              {t.contactUsTitle}
            </h4>
            <div className="flex items-center gap-2.5">
              <Phone
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4 shrink-0"
              />
              <span className="font-mono font-semibold">
                {settings?.contactPhone || "+218 91-214-5050"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4 shrink-0"
              />
              <span>
                {settings?.contactEmail || "info@almanhaj.ly"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4 shrink-0"
              />
              <span>
                {settings
                  ? lang === "ar"
                    ? settings.addressAr
                    : settings.addressEn
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock
                style={{ color: currentTheme.colors.accentPrimary }}
                className="h-4 w-4 shrink-0"
              />
              <span>
                {settings
                  ? lang === "ar"
                    ? settings.workingHoursAr
                    : settings.workingHoursEn
                  : ""}
              </span>
            </div>
          </div>
        </div>
        {/* ===== CBL / Mawthooq Compliance Bar ===== */}
        <div className="mx-auto max-w-[1580px] px-2 sm:px-3 lg:px-4 mt-10 pt-6 border-t" style={{borderColor: currentTheme.colors.border}}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-[11px] sm:text-xs leading-5">
            <div className="flex flex-wrap items-center gap-2">
              <span style={{backgroundColor: currentTheme.colors.bgElevated, borderColor: currentTheme.colors.border}} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> متجر قيد التسجيل في منصة موثوق بوزارة الاقتصاد
              </span>
              <span className="opacity-70">السجل التجاري: <span className="font-mono font-extrabold">[XXXXXX]</span> — ترخيص موثوق: <span className="font-mono font-extrabold">[MTQ-XXXX]</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-bold">
              <a href="/privacy" className="hover:underline underline-offset-4">سياسة الخصوصية</a>
              <span className="opacity-30">•</span>
              <a href="/terms" className="hover:underline underline-offset-4">الشروط والأحكام</a>
              <span className="opacity-30">•</span>
              <a href="/returns" className="hover:underline underline-offset-4">الاسترجاع والشحن</a>
              <span className="opacity-30">•</span>
              <a href="https://cbl.gov.ly/electronic-payment/" target="_blank" rel="noopener" className="hover:underline underline-offset-4">مزودو الدفع المرخصون CBL</a>
            </div>
          </div>
          <div style={{color: currentTheme.colors.textSecondary}} className="mt-3 flex flex-wrap gap-2 text-[11px] leading-5">
            <span>الدفع عند التسليم و عبر التحويل المصرفي حالياً — الدفع الإلكتروني (LYPay / معاملات / تداول / مسارات) يُفعل بعد إصدار ترخيص موثوق حسب تعليمات مصرف ليبيا المركزي (منشور 7/2020).</span>
            <span className="hidden sm:inline opacity-30">—</span>
            <span>© {new Date().getFullYear()} شركة المنهج للقرطاسية — جميع الحقوق محفوظة • البيفي، طرابلس — LYD الدينار الليبي</span>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MOBILE STICKY BOTTOM BAR (PERFECT ERGONOMICS ON SMARTPHONES)
      ===================================================================== */}
      <nav
        style={{
          backgroundColor: currentTheme.colors.bgElevated,
          borderColor: currentTheme.colors.border,
        }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t py-2 px-2 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold"
        >
          <BookOpen
            style={{ color: currentTheme.colors.accentPrimary }}
            className="h-5 w-5"
          />
          <span>{t.masterCatalog}</span>
        </button>

        <a
          href="#wholesale-section"
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold"
        >
          <Layers
            style={{ color: currentTheme.colors.accentPrimary }}
            className="h-5 w-5"
          />
          <span>{t.wholesalePrice}</span>
        </a>

        <button
          type="button"
          onClick={() => goToOrderTracking()}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold"
        >
          <PackageSearch
            style={{ color: currentTheme.colors.accentPrimary }}
            className="h-5 w-5"
          />
          <span>{t.trackOrderShort}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          style={{
            backgroundColor: "#25D366",
            color: "#FFFFFF",
          }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold shadow-md"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span>
            {t.cartTitle} ({totalCartUnits})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold"
        >
          <ShieldCheck
            style={{ color: currentTheme.colors.accentPrimary }}
            className="h-5 w-5"
          />
          <span>Admin</span>
        </button>
      </nav>

      {/* =====================================================================
          OVERLAYS: MASTER CATALOGUE DRAWER, CART DRAWER, QUICK VIEW, ADMIN
      ===================================================================== */}
      <MasterCatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        categories={categories}
        products={products}
        lang={lang}
        theme={currentTheme}
        currencySymbol={currencySymbol}
        onSelectCategory={handleSelectCategoryAndScroll}
        onAddToCart={handleAddToCart}
        onQuickView={(prod) => {
          setIsCatalogOpen(false);
          setQuickViewProduct(prod);
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        settings={settings}
        lang={lang}
        theme={currentTheme}
        currencySymbol={currencySymbol}
        onTrackOrder={goToOrderTracking}
      />

      <ProductQuickViewModal
        key={quickViewProduct?.id ?? "closed"}
        product={quickViewProduct}
        category={categories.find(
          (c) => c.slug === quickViewProduct?.categorySlug
        )}
        onClose={() => setQuickViewProduct(null)}
        lang={lang}
        theme={currentTheme}
        currencySymbol={currencySymbol}
        onAddToCart={handleAddToCart}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        settings={settings}
        lang={lang}
        theme={currentTheme}
        currencySymbol={currencySymbol}
        onDataUpdated={fetchStoreData}
      />

      <WhatsAppOrderPanel
        isOpen={waPanelOpen}
        onClose={() => setWaPanelOpen(false)}
        phoneNumber={settings?.whatsappNumber || "218912145050"}
        message={waPanelMessage}
        lang={lang}
        theme={currentTheme}
      />

      {/* Cookie Consent - CBL Privacy requirement */}
      <div id="cookie-banner" className="fixed bottom-4 inset-x-4 lg:inset-x-auto lg:right-4 lg:max-w-md z-[60] hidden">
        <div style={{backgroundColor: currentTheme.colors.bgElevated, borderColor: currentTheme.colors.border}} className="rounded-none border shadow-2xl p-4 flex flex-col gap-3">
          <p className="text-xs leading-5 font-semibold">نستخدم ملفات ضرورية فقط لتذكر سلتك ولغتك. بالمتابعة أنت توافق على سياسة الخصوصية. <a href="/privacy" className="underline text-amber-700">اقرأ المزيد</a></p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { const el=document.getElementById('cookie-banner'); if(el) el.style.display='none'; try{localStorage.setItem('almanhaj_cookie','1')}catch{} }} style={{backgroundColor: currentTheme.colors.accentPrimary, color:'#fff'}} className="flex-1 rounded-none py-2 text-xs font-extrabold">موافق</button>
            <a href="/privacy" className="flex-1 text-center rounded-none border py-2 text-xs font-bold" style={{borderColor: currentTheme.colors.border}}>سياسة الخصوصية</a>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{__html: `(function(){try{if(!localStorage.getItem('almanhaj_cookie')){var b=document.getElementById('cookie-banner'); if(b) b.style.display='block';}}catch(e){}})()`}} />
    </div>
  );
}
