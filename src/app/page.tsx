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
import { CatalogVerticalMenu } from "@/components/CatalogVerticalMenu";
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

  // Editable homepage strings (Admin → Store & homepage) with their built-in fallbacks
  const announcementEnabled = settings?.announcementEnabled ?? true;
  const pickText = (en?: string | null, ar?: string | null, fallback = "") =>
    ((lang === "ar" ? ar : en) || "").trim() || fallback;
  const announcementText = pickText(
    settings?.announcementEn,
    settings?.announcementAr,
    lang === "ar"
      ? "توصيل مجاني داخل طرابلس فوق 1900 د.ل — Free Standard Shipping $60+"
      : "Free shipping inside Tripoli over 1,900 LYD"
  );
  const announcementShort = pickText(
    settings?.announcementShortEn,
    settings?.announcementShortAr,
    lang === "ar" ? "توصيل مجاني 1900 د.ل+" : "Free shipping 1,900 LYD+"
  );
  const announcementNote = pickText(
    settings?.announcementNoteEn,
    settings?.announcementNoteAr,
    lang === "ar" ? "البيفي، طرابلس • 0912145050" : "Al Bivi, Tripoli • 0912145050"
  );
  // Contact details shown in the homepage hero come from the admin panel too
  const whatsappDigits = (settings?.whatsappNumber || "218912145050").replace(
    /[^\d]/g,
    ""
  );
  const contactPhoneDisplay =
    (settings?.contactPhone || "").trim() || "+218 91-214-5050";
  const headerTagline = pickText(
    settings?.headerTaglineEn,
    settings?.headerTaglineAr,
    "PAPER • STATIONERY • ATELIER • TRIPOLI"
  );
  const storefront = {
    image: settings?.storefrontImage || "/images/new/main-storefront-hq.jpg",
    badge: pickText(
      settings?.storefrontBadgeEn,
      settings?.storefrontBadgeAr,
      lang === "ar"
        ? "البيفي، طرابلس، ليبيا"
        : "Al Bivi, Tripoli, Libya"
    ),
    title: pickText(
      settings?.storefrontTitleEn,
      settings?.storefrontTitleAr,
      lang === "ar"
        ? "شركة المنهج للقرطاسية"
        : "Al Manhaj Company for Stationery"
    ),
    subtitle: pickText(
      settings?.storefrontSubtitleEn,
      settings?.storefrontSubtitleAr,
      "Almanhaj for Stationery and Computer Equipment"
    ),
    description: pickText(
      settings?.storefrontDescriptionEn,
      settings?.storefrontDescriptionAr,
      lang === "ar"
        ? "أدوات مكتبية • معدات هندسية • أدوات مدرسية • خزائن مختلفة • حبر طابعات ومعدات الحاسوب"
        : "Office tools • Engineering equipment • School supplies • Cabinets • Printer ink & computer equipment"
    ),
  };

  // Legal footer bar (Admin → Store & homepage → الشريط القانوني)
  const complianceEnabled = settings?.complianceEnabled ?? true;
  const complianceStatus = pickText(
    settings?.complianceStatusEn,
    settings?.complianceStatusAr,
    lang === "ar"
      ? "متجر قيد التسجيل في منصة موثوق بوزارة الاقتصاد والتجارة"
      : "Store registration with the Mawthooq platform (Ministry of Economy) is in progress"
  );
  const commercialRegistry =
    (settings?.commercialRegistry || "").trim() || "[XXXXXX]";
  const mawthooqLicense = (settings?.mawthooqLicense || "").trim() || "[MTQ-XXXX]";
  const paymentNotice = pickText(
    settings?.paymentNoticeEn,
    settings?.paymentNoticeAr,
    lang === "ar"
      ? "الدفع عند التسليم و عبر التحويل المصرفي حالياً — الدفع الإلكتروني (LYPay / معاملات / تداول / مسارات) يُفعّل بعد إصدار ترخيص موثوق حسب تعليمات مصرف ليبيا المركزي (منشور 7/2020)."
      : "Cash on delivery and bank transfer are available today — electronic payment (LYPay / Moamalat / Tadawul / Masarat) will be enabled once the Mawthooq licence is issued, in line with the Central Bank of Libya instructions (Circular 7/2020)."
  );
  const copyrightLine = pickText(
    settings?.copyrightEn,
    settings?.copyrightAr,
    lang === "ar"
      ? "© {year} شركة المنهج للقرطاسية — جميع الحقوق محفوظة • البيفي، طرابلس — الدينار الليبي"
      : "© {year} Al Manhaj Company for Stationery — All rights reserved • Al Bivi, Tripoli — Libyan Dinar (LYD)"
  ).replaceAll("{year}", String(new Date().getFullYear()));
  const paymentProvidersUrl =
    (settings?.paymentProvidersUrl || "").trim() ||
    "https://cbl.gov.ly/electronic-payment/";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundColor: currentTheme.colors.bgPrimary,
        color: currentTheme.colors.textPrimary,
      }}
      className="min-h-screen flex flex-col transition-colors duration-300 pb-20 lg:pb-0"
    >
      {/* ===== MYTEK-STYLE TOP ANNOUNCEMENT BAR ===== */}
      {announcementEnabled && (
        <div className="w-full text-center py-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide" style={{backgroundColor: '#1A1A2E', color: '#FFFFFF'}}>
          <span className="hidden sm:inline">{announcementText}</span>
          <span className="sm:hidden">{announcementShort}</span>
          {announcementNote ? (
            <span className="opacity-70 font-normal hidden md:inline">
              {" "}&nbsp;|&nbsp; {announcementNote}
            </span>
          ) : null}
        </div>
      )}
      {/* ===== MYTEK-STYLE HEADER - Dark Navy Modern ===== */}
      <header
        style={{
          backgroundColor: "#1A1A2E",
          borderColor: "#2A2A4A",
        }}
        className="sticky top-0 z-40 border-b"
      >
        <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-2 sm:gap-4 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5">
          {/* Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#top"
              className="flex flex-col leading-tight hover:opacity-80 transition"
            >
              <span className="text-white text-sm sm:text-lg font-extrabold tracking-wide truncate max-w-[180px] sm:max-w-xs lg:max-w-none">
                {settings
                  ? lang === "ar"
                    ? settings.storeNameAr
                    : settings.storeNameEn
                  : lang === "ar"
                    ? "شركة المنهج للقرطاسية"
                    : "AL-MANHAJ"}
              </span>
              <span className="text-gray-400 text-[9px] sm:text-[10px] font-medium tracking-wider uppercase hidden md:block truncate max-w-xs">
                {headerTagline}
              </span>
            </a>
          </div>

          {/* Quick Search Bar in Header (Desktop) */}
          <div className="hidden lg:flex relative flex-1 max-w-xl mx-4">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-gray-400" />
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
              className="w-full rounded-md py-2 ps-10 pe-4 text-xs font-medium outline-none transition bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:bg-white focus:text-gray-900 focus:border-red-500"
            />
          </div>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/20"
                title={t.themeSelectorTitle}
              >
                <Palette className="h-3.5 w-3.5 text-red-400" />
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
                    className="absolute end-0 mt-2 z-40 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-2xl space-y-1.5"
                  >
                    <div className="px-2 py-1 text-xs font-extrabold uppercase tracking-wider text-gray-500">
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
                            backgroundColor: active ? "#FFF0F0" : "transparent",
                            borderColor: active ? "#E31837" : "transparent",
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-start transition hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-1 rtl:space-x-reverse">
                              <span
                                style={{ backgroundColor: th.colors.bgPrimary }}
                                className="h-5 w-5 rounded-full border border-gray-200"
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
                              <div className="text-xs font-bold text-gray-900">
                                {lang === "ar" ? th.nameAr : th.nameEn}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {lang === "ar" ? th.subtitleAr : th.subtitleEn}
                              </div>
                            </div>
                          </div>
                          {active && (
                            <Check className="h-4 w-4 shrink-0 text-red-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Bilingual Language Toggle */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === "en" ? "ar" : "en"))}
              className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-extrabold text-white transition hover:bg-white/20"
              title="Switch Language (English / العربية)"
            >
              <Globe className="h-3.5 w-3.5 text-red-400" />
              <span>{lang === "en" ? "العربية" : "EN"}</span>
            </button>

            {/* Order Tracking */}
            <button
              type="button"
              onClick={() => goToOrderTracking()}
              className="hidden lg:flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/20"
            >
              <PackageSearch className="h-3.5 w-3.5 text-red-400" />
              <span>{t.trackOrder}</span>
            </button>

            {/* Admin Button */}
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/20"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
              <span>{t.adminBtn}</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 active:scale-95"
              style={{backgroundColor: '#E31837'}}
            >
              <ShoppingBag className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="tabular-nums">{totalCartUnits}</span>
            </button>
          </div>
        </div>

        {/* ===== MYTEK-STYLE NAVIGATION STRIP =====
            The vertical catalogue opens as a floating dropdown anchored here,
            so it never takes up room in the homepage layout. On mobile the
            same menu is opened from the bottom bar as an off-canvas drawer. */}
        <div
          className="hidden lg:block border-t"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }}
        >
          <div className="mx-auto flex max-w-[1580px] items-center gap-1 px-2 sm:px-3 lg:px-4">
            <CatalogVerticalMenu
              isOpen={isCatalogOpen}
              onOpenChange={setIsCatalogOpen}
              categories={categories}
              products={products}
              lang={lang}
              onSelectCategory={handleSelectCategoryAndScroll}
              onShowPromotions={() => {
                setOnlyPromo(true);
                handleSelectCategoryAndScroll("all");
              }}
              onQuickView={setQuickViewProduct}
              onAddToCart={handleAddToCart}
            />

            <nav
              aria-label="Quick links"
              className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto no-scrollbar ps-2 text-[11px] font-bold text-gray-700"
            >
              <button
                type="button"
                onClick={() => handleSelectCategoryAndScroll("all")}
                className="shrink-0 rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-red-600"
              >
                {t.catalogMenuAllProducts}
              </button>
              <a
                href="#departments-section"
                className="shrink-0 rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-red-600"
              >
                {t.navDepartments}
              </a>
              <button
                type="button"
                onClick={() => {
                  setOnlyPromo(true);
                  handleSelectCategoryAndScroll("all");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-red-600 transition hover:bg-red-50"
              >
                <Percent className="h-3 w-3" />
                <span>{t.navPromotions}</span>
              </button>
              <a
                href="#wholesale-section"
                className="shrink-0 rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-red-600"
              >
                {t.navWholesale}
              </a>
              <a
                href="#contact-section"
                className="shrink-0 rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-red-600"
              >
                {t.navContact}
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* =====================================================================
          0. MYTEK-STYLE HERO BANNER
      ===================================================================== */}
      <section
        id="top"
        className="relative w-full overflow-hidden"
      >
        {/* Full-width hero banner image */}
        <div className="relative w-full h-[220px] sm:h-[340px] lg:h-[440px]">
          <img
            src={storefront.image}
            alt={storefront.title}
            className="absolute inset-0 h-full w-full object-cover kenburns-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-[1580px] flex-col justify-end px-3 sm:px-6 lg:px-8 pb-4 sm:pb-8 text-white">
            <div className="max-w-2xl space-y-2 sm:space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white" style={{backgroundColor: '#E31837'}}>
                <MapPin className="h-3 w-3" />
                {storefront.badge}
              </span>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {storefront.title}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-red-300 uppercase tracking-wide">
                {storefront.subtitle}
              </p>
              <p className="text-[11px] sm:text-sm text-white/80 leading-relaxed max-w-lg hidden sm:block">
                {storefront.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
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
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold text-white transition hover:bg-[#1EBE5D]"
                >
                  <MessageCircle className="h-3.5 w-3.5 fill-current" />
                  <span dir="ltr">{contactPhoneDisplay}</span>
                </button>

                <a
                  href={`tel:+${whatsappDigits}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold text-white transition"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{lang === "ar" ? "اتصل الآن" : "Call now"}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-extrabold text-white transition hover:opacity-90"
                  style={{backgroundColor: '#E31837'}}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{t.masterCatalog}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick category strip below hero (Mytek style) */}
        <div className="w-full border-b" style={{backgroundColor: '#F5F5F5', borderColor: '#E0E0E0'}}>
          <div className="mx-auto max-w-[1580px] flex items-center gap-1 overflow-x-auto no-scrollbar px-2 sm:px-4 py-2">
            <button
              type="button"
              onClick={() => handleSelectCategoryAndScroll("all")}
              className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] font-bold transition hover:shadow-sm"
              style={{
                backgroundColor: selectedCategory === "all" ? '#E31837' : '#FFFFFF',
                color: selectedCategory === "all" ? '#FFFFFF' : '#1A1A1A',
                border: selectedCategory === "all" ? '1px solid #E31837' : '1px solid #E0E0E0',
              }}
            >
              {t.allCategories}
            </button>
            {categories.slice(0, 8).map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategoryAndScroll(cat.slug)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] font-bold transition hover:shadow-sm"
                  style={{
                    backgroundColor: active ? '#E31837' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#1A1A1A',
                    border: active ? '1px solid #E31837' : '1px solid #E0E0E0',
                  }}
                >
                  {lang === "ar" ? cat.nameAr : cat.nameEn}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== MYTEK-STYLE HERO SLIDER ===== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pt-4 sm:pt-6">
        <div className="relative h-[200px] sm:h-[320px] lg:h-[400px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Slide Image */}
          <img
            src={currentHero.imageUrl}
            alt={lang === "ar" ? currentHero.titleAr : currentHero.titleEn}
            className="h-full w-full object-cover transition-all duration-700"
          />
          {/* Mytek-style overlay - strong gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Slide Content - Mytek style with prominent CTA */}
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="max-w-lg space-y-2 sm:space-y-3">
              <span className="inline-block rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white" style={{backgroundColor: '#E31837'}}>
                {lang === "ar" ? currentHero.badgeAr : currentHero.badgeEn}
              </span>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight text-white drop-shadow-lg">
                {lang === "ar" ? currentHero.titleAr : currentHero.titleEn}
              </h2>

              <p className="text-[11px] sm:text-sm text-white/90 leading-relaxed max-w-md font-medium">
                {lang === "ar"
                  ? currentHero.subtitleAr
                  : currentHero.subtitleEn}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectCategoryAndScroll(
                      currentHero.targetCategory || "all"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-extrabold text-white transition hover:opacity-90 shadow-lg"
                  style={{backgroundColor: '#E31837'}}
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
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white transition"
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
                className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((heroIndex + 1) % heroSlides.length)
                }
                aria-label="Next slide"
                className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div className="absolute bottom-3 end-4 flex items-center gap-1.5">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`rounded-full transition-all ${
                      heroIndex === idx
                        ? "w-6 h-2 bg-white"
                        : "w-2 h-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* =====================================================================
          2. MYTEK-STYLE CATEGORY CARDS
      ===================================================================== */}
      <section
        id="departments-section"
        className="mx-auto w-full max-w-[1580px] scroll-mt-24 px-2 sm:px-3 lg:px-4 py-8 sm:py-12 bg-white"
      >
        <div className="mb-5 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-1">
              {lang === "ar" ? "تسوق حسب القسم" : "SHOP BY DEPARTMENT"}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {t.categoriesTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              {t.categoriesSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSelectCategoryAndScroll("all")}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-[11px] font-bold transition hover:bg-gray-50 text-gray-700"
          >
            <span>
              {t.allCategories} ({products.filter(p=>!p.isHidden).length})
            </span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Mytek-style Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                className="category-card-mytek group relative flex h-48 sm:h-56 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-start shadow-sm"
                style={{
                  borderColor: isSelected ? '#E31837' : '#E0E0E0',
                  borderWidth: isSelected ? '2px' : '1px',
                }}
              >
                <CategoryImage
                  slug={cat.slug}
                  src={cat.imageUrl}
                  alt={lang === "ar" ? cat.nameAr : cat.nameEn}
                  className="h-[70%] w-full bg-gray-50 object-contain px-3 pt-3 transition-transform duration-300 group-hover:scale-105"
                />

                <div className="mt-auto border-t border-gray-100 px-3 py-2 bg-white">
                  <h3 className="line-clamp-1 text-[11px] font-extrabold leading-snug text-gray-900 sm:text-xs">
                    {lang === "ar" ? cat.nameAr : cat.nameEn}
                  </h3>
                  <span className="text-[9px] text-gray-500 font-medium">
                    {countInCat} {t.itemsLabel}
                  </span>
                </div>

                {isSelected && (
                  <span className="absolute top-2 end-2 rounded-full px-2 py-0.5 text-[8px] font-bold text-white" style={{backgroundColor: '#E31837'}}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. MYTEK-STYLE PROMOTIONAL BANNER
      ===================================================================== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-8 sm:pb-12">
        <div className="relative min-h-[180px] sm:min-h-[240px] w-full overflow-hidden rounded-lg border border-gray-200 flex items-center shadow-sm">
          <img
            src={landscapeBanner.imageUrl}
            alt={
              lang === "ar" ? landscapeBanner.titleAr : landscapeBanner.titleEn
            }
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/90 via-[#1A1A2E]/70 to-transparent" />

          <div className="relative z-10 max-w-xl p-6 sm:p-10 text-white space-y-3">
            <span className="inline-block rounded-full px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white" style={{backgroundColor: '#E31837'}}>
              {lang === "ar"
                ? landscapeBanner.badgeAr
                : landscapeBanner.badgeEn}
            </span>

            <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight">
              {lang === "ar"
                ? landscapeBanner.titleAr
                : landscapeBanner.titleEn}
            </h2>

            <p className="text-[11px] sm:text-sm text-white/80 leading-relaxed max-w-md">
              {lang === "ar"
                ? landscapeBanner.subtitleAr
                : landscapeBanner.subtitleEn}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[11px] sm:text-xs font-extrabold text-white shadow-lg transition hover:opacity-95"
                style={{backgroundColor: '#E31837'}}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>
                  {lang === "ar"
                    ? landscapeBanner.ctaAr
                    : landscapeBanner.ctaEn}
                </span>
              </button>

              <a
                href="#wholesale-section"
                className="inline-flex items-center gap-1.5 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 px-4 py-2 text-[11px] sm:text-xs font-bold text-white transition"
              >
                <Layers className="h-3.5 w-3.5" />
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
          4. MYTEK-STYLE FEATURED PRODUCTS SECTION
      ===================================================================== */}
      <section className="mx-auto w-full max-w-[1580px] px-2 sm:px-3 lg:px-4 pb-10 sm:pb-14">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 text-red-600" />
                <span className="text-red-600">
                  {lang === "ar"
                    ? "اختياراتنا المميزة والتخفيضات"
                    : "TOP PICKS & SPECIAL PROMOTIONS"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {t.featuredTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {t.featuredSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyPromo(true);
                handleSelectCategoryAndScroll("all");
              }}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-extrabold text-white shadow-sm"
              style={{backgroundColor: '#E31837'}}
            >
              <Percent className="h-3 w-3" />
              <span>{t.onlyPromotions}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
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
          5. MYTEK-STYLE CATALOG WITH FILTERS
      ===================================================================== */}
      <section
        id="catalog-section"
        className="mx-auto w-full max-w-[1580px] scroll-mt-24 px-2 sm:px-3 lg:px-4 pb-12 sm:pb-18"
      >
        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-1">
            {lang === "ar" ? "جميع المنتجات" : "ALL PRODUCTS"}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {t.allProductsTitle}
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            {t.showingItems} <strong>{filteredProducts.length}</strong>{" "}
            {t.itemsLabel} • {t.swipePhotosHint}
          </p>
        </div>

        {/* Interactive Filter & Search Toolbar */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{ backgroundColor: currentTheme.colors.bgSecondary }}
                className="aspect-[3/4] rounded-lg animate-pulse"
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

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
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
          6. MYTEK-STYLE WHOLESALE SECTION
      ===================================================================== */}
      <section
        id="wholesale-section"
        className="mx-auto w-full max-w-[1580px] scroll-mt-24 px-2 sm:px-3 lg:px-4 pb-12 sm:pb-20"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-8 shadow-sm">
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
          7. MYTEK-STYLE DARK FOOTER
      ===================================================================== */}
      <footer
        id="contact-section"
        className="mt-auto scroll-mt-24 py-8 sm:py-10"
        style={{backgroundColor: '#1A1A2E', borderTop: '3px solid #E31837'}}
      >
        <div className="mx-auto max-w-[1580px] px-2 sm:px-3 lg:px-4 grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 text-white">
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              {settings
                ? lang === "ar"
                  ? settings.storeNameAr
                  : settings.storeNameEn
                : lang === "ar"
                  ? "شركة المنهج للقرطاسية"
                  : "Al Manhaj Company for Stationery"}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-400">
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
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                <span>{t.adminBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => goToOrderTracking()}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition"
              >
                <PackageSearch className="h-3.5 w-3.5 text-red-400" />
                <span>{t.trackOrder}</span>
              </button>
            </div>
          </div>

          {/* Quick Departments */}
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3 text-white">
              {t.categoriesTitle}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategoryAndScroll(cat.slug)}
                  className="text-start hover:text-red-400 transition truncate text-gray-400"
                >
                  • {lang === "ar" ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Contact Details */}
          <div className="space-y-2.5 text-xs sm:text-sm">
            <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3 text-white">
              {t.contactUsTitle}
            </h4>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-red-400" />
              <span className="font-mono font-semibold text-gray-300">
                {settings?.contactPhone || "+218 91-214-5050"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-red-400" />
              <span className="text-gray-400">
                {settings?.contactEmail || "info@almanhaj.ly"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-red-400" />
              <span className="text-gray-400">
                {settings
                  ? lang === "ar"
                    ? settings.addressAr
                    : settings.addressEn
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-red-400" />
              <span className="text-gray-400">
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
        {complianceEnabled && (
          <div className="mx-auto max-w-[1580px] px-2 sm:px-3 lg:px-4 mt-8 pt-5 border-t border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-[10px] sm:text-[11px] leading-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-bold text-gray-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> {complianceStatus}
                </span>
                <span className="text-gray-500">
                  {t.footerCommercialRegistry}: <span className="font-mono font-extrabold text-gray-400">{commercialRegistry}</span> — {t.footerMawthooqLicense}: <span className="font-mono font-extrabold text-gray-400">{mawthooqLicense}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-bold">
                <a href="/privacy" className="hover:text-red-400 transition text-gray-400">{t.footerPrivacy}</a>
                <span className="opacity-30 text-white">•</span>
                <a href="/terms" className="hover:text-red-400 transition text-gray-400">{t.footerTerms}</a>
                <span className="opacity-30 text-white">•</span>
                <a href="/returns" className="hover:text-red-400 transition text-gray-400">{t.footerReturns}</a>
                <span className="opacity-30 text-white">•</span>
                <a href={paymentProvidersUrl} target="_blank" rel="noopener" className="hover:text-red-400 transition text-gray-400">{t.footerPaymentProviders}</a>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] leading-5 text-gray-500">
              <span>{paymentNotice}</span>
              <span className="hidden sm:inline opacity-30 text-white">—</span>
              <span>{copyrightLine}</span>
            </div>
          </div>
        )}
      </footer>

      {/* =====================================================================
          MOBILE STICKY BOTTOM BAR - MYTEK STYLE
      ===================================================================== */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t py-1.5 px-2 shadow-2xl"
        style={{backgroundColor: '#1A1A2E', borderColor: '#2A2A4A'}}
      >
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-white"
        >
          <BookOpen className="h-4.5 w-4.5 text-red-400" />
          <span>{t.masterCatalog}</span>
        </button>

        <a
          href="#wholesale-section"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-white"
        >
          <Layers className="h-4.5 w-4.5 text-red-400" />
          <span>{t.wholesalePrice}</span>
        </a>

        <button
          type="button"
          onClick={() => goToOrderTracking()}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-white"
        >
          <PackageSearch className="h-4.5 w-4.5 text-red-400" />
          <span>{t.trackOrderShort}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-md"
          style={{backgroundColor: '#E31837'}}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>
            {t.cartTitle} ({totalCartUnits})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-white"
        >
          <ShieldCheck className="h-4.5 w-4.5 text-red-400" />
          <span>Admin</span>
        </button>
      </nav>

      {/* =====================================================================
          OVERLAYS: CART DRAWER, QUICK VIEW, ADMIN, WHATSAPP
          (the vertical catalogue menu lives in the header navigation strip)
      ===================================================================== */}
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
