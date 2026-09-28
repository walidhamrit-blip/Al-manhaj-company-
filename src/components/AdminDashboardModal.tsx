"use client";

import React, { useMemo, useState } from "react";
import type { Category, Product, StoreSettings } from "@/db/schema";
import {
  THEMES,
  UI_TEXT,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  X,
  Lock,
  Plus,
  Save,
  Trash2,
  Edit3,
  Package,
  FolderKanban,
  Settings,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Search,
  SearchX,
} from "lucide-react";

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  settings: StoreSettings | null;
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  onDataUpdated: () => Promise<void>;
}

export function AdminDashboardModal({
  isOpen,
  onClose,
  products,
  categories,
  settings,
  lang,
  theme,
  currencySymbol,
  onDataUpdated,
}: AdminDashboardModalProps) {
  const t = UI_TEXT[lang];
  const isAr = lang === "ar";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [categorySearch, setCategorySearch] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "settings"
  >("products");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Product Editor state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null
  );
  const [img1Input, setImg1Input] = useState("");
  const [img2Input, setImg2Input] = useState("");

  // Quick inline row edits for price/wholesale/stock
  const [inlineEdits, setInlineEdits] = useState<
    Record<number, { price: number; wholesalePrice: number; stock: number }>
  >({});

  // Category Editor state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Store Settings Form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(
    settings
  );

  // Admin search: products (title EN/AR, SKU, description, specs, category name)
  const filteredAdminProducts = useMemo(() => {
    const q = normalizeSearch(productSearch);
    return products.filter((p) => {
      if (productCategoryFilter !== "all" && p.categorySlug !== productCategoryFilter) {
        return false;
      }
      if (!q) return true;
      const cat = categories.find((c) => c.slug === p.categorySlug);
      const haystack = normalizeSearch(
        [
          p.sku,
          p.titleEn,
          p.titleAr,
          p.descriptionEn,
          p.descriptionAr,
          p.specsEn,
          p.specsAr,
          p.categorySlug,
          cat?.nameEn ?? "",
          cat?.nameAr ?? "",
        ].join(" ")
      );
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [products, categories, productSearch, productCategoryFilter]);

  // Admin search: categories (names, descriptions, slug)
  const filteredAdminCategories = useMemo(() => {
    const q = normalizeSearch(categorySearch);
    if (!q) return categories;
    return categories.filter((c) => {
      const haystack = normalizeSearch(
        [c.slug, c.nameEn, c.nameAr, c.descriptionEn, c.descriptionAr, c.badgeEn, c.badgeAr].join(" ")
      );
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [categories, categorySearch]);

  if (!isOpen) return null;

  const showToast = (msg: string, isError = false) => {
    setToastIsError(isError);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setAdminToken(String(data.token || ""));
        setSettingsForm(settings);
      } else {
        setAuthError(
          lang === "ar"
            ? "كلمة المرور غير صحيحة. جرب: admin2026"
            : "Invalid password. Try: admin2026"
        );
      }
    } catch {
      setAuthError("Authentication error");
    }
  };

  const openCreateProduct = () => {
    setImg1Input("");
    setImg2Input("");
    setEditingProduct({
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      categorySlug: categories[0]?.slug || "notebooks",
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      price: 25.0,
      originalPrice: 32.0,
      wholesalePrice: 18.0,
      wholesaleMinQty: 10,
      stock: 100,
      isFeatured: true,
      isPromotion: true,
      specsEn: "Premium Studio Quality",
      specsAr: "جودة احترافية عالية",
    });
  };

  const openEditProduct = (prod: Product) => {
    const imgs = Array.isArray(prod.images) ? prod.images : [];
    setImg1Input(imgs[0] || "/images/hero-stationery.jpg");
    setImg2Input(imgs[1] || "");
    setEditingProduct({ ...prod });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!img1Input.trim()) {
      showToast(
        isAr
          ? "الرجاء رفع الصورة الرئيسية للمنتج أولاً"
          : "Please upload the product's main photo first",
        true
      );
      return;
    }
    setIsSaving(true);
    try {
      const images = [img1Input.trim(), img2Input.trim()].filter(Boolean);
      const payload = {
        ...editingProduct,
        images: images.length > 0 ? images : ["/images/hero-stationery.jpg"],
      };

      const isExisting = Boolean(editingProduct.id);
      const url = isExisting
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = isExisting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await onDataUpdated();
        setEditingProduct(null);
        showToast(
          lang === "ar"
            ? "تم حفظ المنتج بنجاح في قاعدة البيانات!"
            : "Product saved to PostgreSQL database!"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickRowSave = async (prod: Product) => {
    const patch = inlineEdits[prod.id];
    if (!patch) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prod,
          price: patch.price,
          wholesalePrice: patch.wholesalePrice,
          stock: patch.stock,
        }),
      });
      if (res.ok) {
        await onDataUpdated();
        showToast(
          lang === "ar"
            ? `تم تحديث السعر والمخزون للمنتج ${prod.sku}`
            : `Updated price & stock for ${prod.sku}`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await onDataUpdated();
        showToast(
          lang === "ar"
            ? "تم حذف المنتج من قاعدة البيانات"
            : "Product deleted from database"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });
      if (res.ok) {
        await onDataUpdated();
        setEditingCategory(null);
        showToast(
          lang === "ar"
            ? "تم تحديث القسم في قاعدة البيانات!"
            : "Category updated in database!"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSettings = settingsForm || settings;
    if (!targetSettings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetSettings),
      });
      if (res.ok) {
        await onDataUpdated();
        showToast(
          lang === "ar"
            ? "تم حفظ إعدادات المتجر ومعلومات الاتصال في قاعدة البيانات!"
            : "Store settings & WhatsApp contact saved to PostgreSQL!"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          borderColor: theme.colors.border,
        }}
        className="relative z-10 flex h-[92vh] w-full max-w-6xl flex-col rounded-3xl border shadow-2xl overflow-hidden"
      >
        {/* Top Bar */}
        <div
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
          }}
          className="flex items-center justify-between border-b px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: theme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow"
            >
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                {t.adminLoginTitle}
              </h2>
              <p
                style={{ color: theme.colors.textSecondary }}
                className="text-xs hidden sm:block"
              >
                PostgreSQL Live Database • Drizzle ORM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {toastMsg && (
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md ${
                  toastIsError ? "bg-rose-600" : "bg-emerald-600"
                }`}
              >
                {toastIsError ? (
                  <X className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>{toastMsg}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:opacity-80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* If Not Authenticated: Login Gate */}
        {!isAuthenticated ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <form
              onSubmit={handleLogin}
              style={{
                backgroundColor: theme.colors.bgElevated,
                borderColor: theme.colors.border,
              }}
              className="w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div
                  style={{
                    backgroundColor: theme.colors.badgeBg,
                    color: theme.colors.badgeText,
                  }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                >
                  <KeyRound className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold">{t.adminLoginTitle}</h3>
                <p
                  style={{ color: theme.colors.textSecondary }}
                  className="text-xs sm:text-sm"
                >
                  {t.adminLoginSub}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="•••••••••"
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                />
                {authError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {authError}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="submit"
                  style={{
                    backgroundColor: theme.colors.accentPrimary,
                    color: "#FFFFFF",
                  }}
                  className="w-full rounded-xl py-3 text-sm font-extrabold shadow-md transition hover:opacity-95"
                >
                  {t.loginBtn}
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordInput("admin2026")}
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    color: theme.colors.textPrimary,
                  }}
                  className="w-full rounded-xl py-2.5 text-xs font-bold transition hover:opacity-80"
                >
                  {t.useDemoPassBtn}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
              }}
              className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
            >
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("products");
                    setEditingProduct(null);
                  }}
                  style={
                    activeTab === "products"
                      ? {
                          backgroundColor: theme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: theme.colors.bgElevated,
                          color: theme.colors.textPrimary,
                        }
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Package className="h-4 w-4" />
                  <span>
                    {t.adminTabsProducts} ({products.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("categories");
                    setEditingCategory(null);
                  }}
                  style={
                    activeTab === "categories"
                      ? {
                          backgroundColor: theme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: theme.colors.bgElevated,
                          color: theme.colors.textPrimary,
                        }
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>{t.adminTabsCategories}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("settings");
                    setSettingsForm(settings);
                  }}
                  style={
                    activeTab === "settings"
                      ? {
                          backgroundColor: theme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: theme.colors.bgElevated,
                          color: theme.colors.textPrimary,
                        }
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t.adminTabsSettings}</span>
                </button>
              </div>

              {activeTab === "products" && !editingProduct && (
                <button
                  type="button"
                  onClick={openCreateProduct}
                  style={{
                    backgroundColor: theme.colors.accentPrimary,
                    color: "#FFFFFF",
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold shadow-md transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addNewProductBtn}</span>
                </button>
              )}
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              {/* TAB 1: PRODUCTS & INVENTORY */}
              {activeTab === "products" && (
                <>
                  {editingProduct ? (
                    <form
                      onSubmit={handleSaveProduct}
                      style={{
                        backgroundColor: theme.colors.bgElevated,
                        borderColor: theme.colors.border,
                      }}
                      className="mx-auto max-w-4xl rounded-2xl border p-6 shadow-md space-y-5"
                    >
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="text-lg font-extrabold">
                          {editingProduct.id
                            ? `${t.editProductTitle}: ${editingProduct.sku}`
                            : t.createProductTitle}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="text-xs font-bold underline"
                        >
                          {t.cancelBtn}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            required
                            value={editingProduct.sku || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                sku: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold mb-1">
                            {t.filterByCategory}
                          </label>
                          <select
                            value={editingProduct.categorySlug || "notebooks"}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                categorySlug: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                              color: theme.colors.textPrimary,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.slug}>
                                {cat.nameEn} / {cat.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Bilingual Titles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Product Title (English)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingProduct.titleEn || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                titleEn: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                        <div dir="rtl">
                          <label className="block text-xs font-bold mb-1">
                            عنوان المنتج (بالعربية)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingProduct.titleAr || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                titleAr: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      {/* Bilingual Descriptions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Description (English)
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={editingProduct.descriptionEn || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                descriptionEn: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                        <div dir="rtl">
                          <label className="block text-xs font-bold mb-1">
                            الوصف التفصيلي (بالعربية)
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={editingProduct.descriptionAr || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                descriptionAr: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      {/* Prices & Stock */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            {t.retailPrice} ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={editingProduct.price ?? 0}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Old Price ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingProduct.originalPrice ?? ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                originalPrice: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            {t.wholesalePrice} ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={editingProduct.wholesalePrice ?? 0}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                wholesalePrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            {t.minWholesaleQty}
                          </label>
                          <input
                            type="number"
                            required
                            value={editingProduct.wholesaleMinQty ?? 10}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                wholesaleMinQty:
                                  parseInt(e.target.value, 10) || 10,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Stock ({t.units})
                          </label>
                          <input
                            type="number"
                            required
                            value={editingProduct.stock ?? 50}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                stock: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                          />
                        </div>
                      </div>

                      {/* Two Scrollable Product Images — uploaded from device */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ImageUploadField
                          label={isAr ? "الصورة الرئيسية (صورة 1)" : "Main Photo (Photo 1)"}
                          value={img1Input}
                          onChange={setImg1Input}
                          adminToken={adminToken}
                          lang={lang}
                          theme={theme}
                          required
                        />
                        <ImageUploadField
                          label={isAr ? "الصورة الثانية (صورة 2)" : "Second Photo (Photo 2)"}
                          value={img2Input}
                          onChange={setImg2Input}
                          adminToken={adminToken}
                          lang={lang}
                          theme={theme}
                          optional
                        />
                      </div>

                      {/* Flags */}
                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.isFeatured)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isFeatured: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded"
                          />
                          <span>Featured Bestseller</span>
                        </label>

                        <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.isPromotion)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isPromotion: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded"
                          />
                          <span>Special Promotion Badge</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          style={{
                            backgroundColor: theme.colors.bgSecondary,
                          }}
                          className="rounded-xl px-4 py-2.5 text-xs font-bold"
                        >
                          {t.cancelBtn}
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          style={{
                            backgroundColor: theme.colors.accentPrimary,
                            color: "#FFFFFF",
                          }}
                          className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-extrabold shadow-md"
                        >
                          <Save className="h-4 w-4" />
                          <span>
                            {isSaving ? t.savingBtn : t.saveChangesBtn}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Products Table with Instant Price/Wholesale/Stock Editor */
                    <div className="space-y-3">
                      {/* Admin product search bar */}
                      <div
                        style={{
                          backgroundColor: theme.colors.bgElevated,
                          borderColor: theme.colors.border,
                        }}
                        className="sticky top-0 z-10 -mx-1 flex flex-col gap-2.5 rounded-2xl border p-3 shadow-sm sm:flex-row sm:items-center"
                      >
                        <div className="relative flex-1">
                          <Search
                            style={{ color: theme.colors.textSecondary }}
                            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          />
                          <input
                            type="search"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder={
                              isAr
                                ? "ابحث بالاسم، رمز المنتج SKU، الوصف أو القسم..."
                                : "Search by name, SKU, description or category..."
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                              color: theme.colors.textPrimary,
                            }}
                            className="w-full rounded-xl border py-2.5 ps-9 pe-9 text-sm outline-none focus:ring-2"
                          />
                          {productSearch && (
                            <button
                              type="button"
                              onClick={() => setProductSearch("")}
                              aria-label={isAr ? "مسح البحث" : "Clear search"}
                              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-60 hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <select
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                          style={{
                            backgroundColor: theme.colors.bgSecondary,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary,
                          }}
                          className="rounded-xl border px-3 py-2.5 text-xs font-bold outline-none sm:w-56"
                        >
                          <option value="all">
                            {isAr ? "كل الأقسام" : "All categories"} ({products.length})
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                              {isAr ? cat.nameAr : cat.nameEn} (
                              {products.filter((p) => p.categorySlug === cat.slug).length})
                            </option>
                          ))}
                        </select>

                        <span
                          style={{
                            backgroundColor: theme.colors.badgeBg,
                            color: theme.colors.badgeText,
                          }}
                          className="shrink-0 self-start rounded-full px-3 py-1.5 text-[11px] font-extrabold tabular-nums sm:self-auto"
                        >
                          {filteredAdminProducts.length} / {products.length}
                        </span>
                      </div>

                      {filteredAdminProducts.length === 0 && (
                        <div
                          style={{
                            backgroundColor: theme.colors.bgElevated,
                            borderColor: theme.colors.border,
                          }}
                          className="flex flex-col items-center gap-2 rounded-2xl border p-10 text-center"
                        >
                          <SearchX className="h-8 w-8 opacity-40" />
                          <p className="text-sm font-bold">
                            {isAr ? "لا توجد منتجات مطابقة" : "No matching products"}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setProductSearch("");
                              setProductCategoryFilter("all");
                            }}
                            style={{ color: theme.colors.accentPrimary }}
                            className="text-xs font-bold underline"
                          >
                            {isAr ? "إعادة ضبط البحث" : "Reset search"}
                          </button>
                        </div>
                      )}

                      {filteredAdminProducts.map((prod) => {
                        const rowEdit = inlineEdits[prod.id] ?? {
                          price: prod.price,
                          wholesalePrice: prod.wholesalePrice,
                          stock: prod.stock,
                        };
                        const hasUnsavedRowChanges =
                          rowEdit.price !== prod.price ||
                          rowEdit.wholesalePrice !== prod.wholesalePrice ||
                          rowEdit.stock !== prod.stock;

                        return (
                          <div
                            key={prod.id}
                            style={{
                              backgroundColor: theme.colors.bgElevated,
                              borderColor: theme.colors.border,
                            }}
                            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <img
                                src={
                                  Array.isArray(prod.images) && prod.images[0]
                                    ? prod.images[0]
                                    : "/images/hero-stationery.jpg"
                                }
                                alt={prod.titleEn}
                                className="h-14 w-14 rounded-xl object-cover shrink-0 border border-black/10"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-bold opacity-70">
                                    {prod.sku}
                                  </span>
                                  <span
                                    style={{
                                      backgroundColor: theme.colors.badgeBg,
                                      color: theme.colors.badgeText,
                                    }}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  >
                                    {prod.categorySlug}
                                  </span>
                                  {prod.isFeatured && (
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                  )}
                                </div>
                                <h4 className="text-sm font-bold truncate">
                                  {lang === "ar" ? prod.titleAr : prod.titleEn}
                                </h4>
                              </div>
                            </div>

                            {/* Quick Inline Controls for Price, Wholesale & Stock */}
                            <div className="flex flex-wrap items-center gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold opacity-70">
                                  {t.retailPrice} ({currencySymbol})
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={rowEdit.price}
                                  onChange={(e) =>
                                    setInlineEdits({
                                      ...inlineEdits,
                                      [prod.id]: {
                                        ...rowEdit,
                                        price: parseFloat(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  style={{
                                    backgroundColor: theme.colors.bgSecondary,
                                    borderColor: theme.colors.border,
                                  }}
                                  className="w-24 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold opacity-70">
                                  {t.wholesalePrice} ({currencySymbol})
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={rowEdit.wholesalePrice}
                                  onChange={(e) =>
                                    setInlineEdits({
                                      ...inlineEdits,
                                      [prod.id]: {
                                        ...rowEdit,
                                        wholesalePrice:
                                          parseFloat(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  style={{
                                    backgroundColor: theme.colors.bgSecondary,
                                    borderColor: theme.colors.border,
                                  }}
                                  className="w-24 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold opacity-70">
                                  Stock ({t.units})
                                </label>
                                <input
                                  type="number"
                                  value={rowEdit.stock}
                                  onChange={(e) =>
                                    setInlineEdits({
                                      ...inlineEdits,
                                      [prod.id]: {
                                        ...rowEdit,
                                        stock:
                                          parseInt(e.target.value, 10) || 0,
                                      },
                                    })
                                  }
                                  style={{
                                    backgroundColor: theme.colors.bgSecondary,
                                    borderColor: theme.colors.border,
                                  }}
                                  className="w-20 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums"
                                />
                              </div>

                              <div className="flex items-center gap-1.5 pt-3.5">
                                {hasUnsavedRowChanges && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickRowSave(prod)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openEditProduct(prod)}
                                  style={{
                                    backgroundColor: theme.colors.bgSecondary,
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-80"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10"
                                  title={t.deleteBtn}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: CATEGORIES */}
              {activeTab === "categories" && (
                <div className="space-y-4">
                  {editingCategory ? (
                    <form
                      onSubmit={handleSaveCategory}
                      style={{
                        backgroundColor: theme.colors.bgElevated,
                        borderColor: theme.colors.border,
                      }}
                      className="mx-auto max-w-2xl rounded-2xl border p-6 space-y-4"
                    >
                      <h3 className="text-lg font-extrabold">
                        Edit Category: {editingCategory.nameEn}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Name (English)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingCategory.nameEn}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                nameEn: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                        <div dir="rtl">
                          <label className="block text-xs font-bold mb-1">
                            الاسم (بالعربية)
                          </label>
                          <input
                            type="text"
                            required
                            value={editingCategory.nameAr}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                nameAr: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <ImageUploadField
                        label={isAr ? "صورة القسم" : "Category Image"}
                        value={editingCategory.imageUrl}
                        onChange={(url) =>
                          setEditingCategory({
                            ...editingCategory,
                            imageUrl: url,
                          })
                        }
                        adminToken={adminToken}
                        lang={lang}
                        theme={theme}
                        required
                      />

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          style={{ backgroundColor: theme.colors.bgSecondary }}
                          className="rounded-xl px-4 py-2 text-xs font-bold"
                        >
                          {t.cancelBtn}
                        </button>
                        <button
                          type="submit"
                          style={{
                            backgroundColor: theme.colors.accentPrimary,
                            color: "#FFFFFF",
                          }}
                          className="rounded-xl px-5 py-2 text-xs font-extrabold"
                        >
                          {t.saveChangesBtn}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                    {/* Admin category search bar */}
                    <div
                      style={{
                        backgroundColor: theme.colors.bgElevated,
                        borderColor: theme.colors.border,
                      }}
                      className="flex items-center gap-2.5 rounded-2xl border p-3 shadow-sm"
                    >
                      <div className="relative flex-1">
                        <Search
                          style={{ color: theme.colors.textSecondary }}
                          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        />
                        <input
                          type="search"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder={
                            isAr ? "ابحث عن قسم..." : "Search categories..."
                          }
                          style={{
                            backgroundColor: theme.colors.bgSecondary,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary,
                          }}
                          className="w-full rounded-xl border py-2.5 ps-9 pe-4 text-sm outline-none focus:ring-2"
                        />
                      </div>
                      <span
                        style={{
                          backgroundColor: theme.colors.badgeBg,
                          color: theme.colors.badgeText,
                        }}
                        className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold tabular-nums"
                      >
                        {filteredAdminCategories.length} / {categories.length}
                      </span>
                    </div>

                    {filteredAdminCategories.length === 0 && (
                      <p className="py-8 text-center text-sm font-bold opacity-70">
                        {isAr ? "لا توجد أقسام مطابقة" : "No matching categories"}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAdminCategories.map((cat) => (
                        <div
                          key={cat.id}
                          style={{
                            backgroundColor: theme.colors.bgElevated,
                            borderColor: theme.colors.border,
                          }}
                          className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={cat.imageUrl}
                              alt={cat.nameEn}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                            <div>
                              <h4 className="font-bold text-sm">
                                {cat.nameEn}
                              </h4>
                              <p className="text-xs opacity-80">{cat.nameAr}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(cat)}
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                            }}
                            className="rounded-xl px-3.5 py-2 text-xs font-bold"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STORE CONTACT, WHATSAPP & WHOLESALE SETTINGS */}
              {activeTab === "settings" && settingsForm && (
                <form
                  onSubmit={handleSaveSettings}
                  style={{
                    backgroundColor: theme.colors.bgElevated,
                    borderColor: theme.colors.border,
                  }}
                  className="mx-auto max-w-4xl rounded-2xl border p-6 space-y-5 shadow-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Store Name (English)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.storeNameEn}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            storeNameEn: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      />
                    </div>

                    <div dir="rtl">
                      <label className="block text-xs font-bold mb-1">
                        اسم المتجر (بالعربية)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.storeNameAr}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            storeNameAr: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* WhatsApp & Contact Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-emerald-600">
                        WhatsApp Order Number (e.g. 218912145050)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            whatsappNumber: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Contact Phone Display
                      </label>
                      <input
                        type="text"
                        value={settingsForm.contactPhone}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            contactPhone: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settingsForm.contactEmail}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            contactEmail: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Address & Default Theme */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Address (English)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.addressEn}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            addressEn: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>

                    <div dir="rtl">
                      <label className="block text-xs font-bold mb-1">
                        العنوان (بالعربية)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.addressAr}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            addressAr: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Default Store Theme
                      </label>
                      <select
                        value={settingsForm.defaultTheme}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            defaultTheme: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      >
                        {THEMES.map((th) => (
                          <option key={th.id} value={th.id}>
                            {th.nameEn} ({th.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Wholesale Discount Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Wholesale Tier 1 Discount (%)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.wholesaleDiscountTier1Pct}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            wholesaleDiscountTier1Pct:
                              parseInt(e.target.value, 10) || 15,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Wholesale Tier 2 Discount (%)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.wholesaleDiscountTier2Pct}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            wholesaleDiscountTier2Pct:
                              parseInt(e.target.value, 10) || 22,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Wholesale Tier 3 Discount (%)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.wholesaleDiscountTier3Pct}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            wholesaleDiscountTier3Pct:
                              parseInt(e.target.value, 10) || 30,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Wholesale Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Wholesale Terms & Conditions (English)
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.wholesaleConditionsEn}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            wholesaleConditionsEn: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>

                    <div dir="rtl">
                      <label className="block text-xs font-bold mb-1">
                        شروط البيع بالجملة (بالعربية)
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.wholesaleConditionsAr}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            wholesaleConditionsAr: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        backgroundColor: theme.colors.accentPrimary,
                        color: "#FFFFFF",
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold shadow-lg transition hover:opacity-95"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? t.savingBtn : t.saveChangesBtn}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
