"use client";

import React from "react";
import type {
  PageCopyItem,
  PageFaqItem,
  PageTrustItem,
  PageTrustLink,
  StoreSettings,
} from "@/db/schema";
import {
  UI_TEXT,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  MAX_PAGE_FAQS,
  MAX_PAGE_STEPS,
  MAX_PAGE_TRUST,
  emptyCopyItem,
  emptyFaqItem,
  emptyTrustItem,
  normalizeOnlineSalesPage,
  normalizeWholesalePage,
} from "@/lib/page-content";
import {
  ArrowDown,
  ArrowUp,
  HelpCircle,
  Images,
  ListOrdered,
  Megaphone,
  MessageCircle,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Truck,
  Building2,
} from "lucide-react";

function TextField({
  label,
  value,
  onChange,
  theme,
  rtl,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: ThemeConfig;
  rtl?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  const style = {
    backgroundColor: theme.colors.bgSecondary,
    borderColor: theme.colors.border,
  };
  const className = "w-full rounded-xl border px-3 py-2 text-sm";
  return (
    <div dir={rtl ? "rtl" : undefined}>
      <label className="block text-xs font-bold mb-1">{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={style}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={style}
          className={className}
        />
      )}
    </div>
  );
}

function BilingualField({
  labelEn,
  labelAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  theme,
  textarea,
}: {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  theme: ThemeConfig;
  textarea?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField
        label={labelEn}
        value={valueEn}
        onChange={onChangeEn}
        theme={theme}
        textarea={textarea}
      />
      <TextField
        label={labelAr}
        value={valueAr}
        onChange={onChangeAr}
        theme={theme}
        rtl
        textarea={textarea}
      />
    </div>
  );
}

function PanelSection({
  title,
  hint,
  icon,
  theme,
  children,
}: {
  title: string;
  hint?: string;
  icon: React.ReactNode;
  theme: ThemeConfig;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.border,
      }}
      className="rounded-2xl border p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <span style={{ color: theme.colors.accentPrimary }} className="mt-0.5">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-extrabold">{title}</h3>
          {hint ? (
            <p
              style={{ color: theme.colors.textSecondary }}
              className="text-[11px] leading-relaxed"
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

function ListToolbar({
  index,
  total,
  onMove,
  onRemove,
  theme,
  moveUpLabel,
  moveDownLabel,
  deleteLabel,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  theme: ThemeConfig;
  moveUpLabel: string;
  moveDownLabel: string;
  deleteLabel: string;
}) {
  const btnStyle = {
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.border,
  };
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        title={moveUpLabel}
        style={btnStyle}
        className="rounded-lg border p-1.5 disabled:opacity-30"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        title={moveDownLabel}
        style={btnStyle}
        className="rounded-lg border p-1.5 disabled:opacity-30"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        title={deleteLabel}
        style={btnStyle}
        className="rounded-lg border p-1.5 text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function PageContentEditor({
  page,
  settingsForm,
  patchSettings,
  onSubmit,
  isSaving,
  adminToken,
  lang,
  theme,
}: {
  page: "onlineSales" | "wholesale";
  settingsForm: StoreSettings;
  patchSettings: (patch: Partial<StoreSettings>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  adminToken: string;
  lang: Language;
  theme: ThemeConfig;
}) {
  const t = UI_TEXT[lang];
  const isAr = lang === "ar";
  const isOnline = page === "onlineSales";

  const online = normalizeOnlineSalesPage(settingsForm.onlineSalesPage);
  const wholesale = normalizeWholesalePage(settingsForm.wholesalePage);

  const patchOnline = (patch: Partial<typeof online>) =>
    patchSettings({ onlineSalesPage: { ...online, ...patch } });
  const patchWholesale = (patch: Partial<typeof wholesale>) =>
    patchSettings({ wholesalePage: { ...wholesale, ...patch } });

  const updateOnlineStep = (index: number, patch: Partial<PageCopyItem>) =>
    patchOnline({
      steps: online.steps.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  const updateWholesaleStep = (index: number, patch: Partial<PageCopyItem>) =>
    patchWholesale({
      steps: wholesale.steps.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  const updateTrust = (index: number, patch: Partial<PageTrustItem>) =>
    patchOnline({
      trust: online.trust.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  const updateOnlineFaq = (index: number, patch: Partial<PageFaqItem>) =>
    patchOnline({
      faqs: online.faqs.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  const updateWholesaleFaq = (index: number, patch: Partial<PageFaqItem>) =>
    patchWholesale({
      faqs: wholesale.faqs.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });

  const addButtonStyle = {
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.border,
  };

  return (
    <form
      onSubmit={onSubmit}
      data-admin-page-cms={page}
      className="mx-auto max-w-4xl space-y-5"
    >
      <p
        style={{ color: theme.colors.textSecondary }}
        className="text-xs leading-relaxed"
      >
        {isOnline ? t.adminOnlineSalesHint : t.adminWholesaleHint}
      </p>

      {isOnline ? (
        <>
          <PanelSection
            title={t.adminPageHero}
            hint={t.adminPageHeroHint}
            icon={<Images className="h-4 w-4" />}
            theme={theme}
          >
            <ImageUploadField
              label={isAr ? "صورة البانر" : "Hero photo"}
              value={online.heroImage}
              onChange={(url) => patchOnline({ heroImage: url })}
              adminToken={adminToken}
              lang={lang}
              theme={theme}
              required
            />
            <BilingualField
              labelEn={`${t.homepageBadge} (EN)`}
              labelAr={`${t.homepageBadge} (AR)`}
              valueEn={online.badgeEn}
              valueAr={online.badgeAr}
              onChangeEn={(v) => patchOnline({ badgeEn: v })}
              onChangeAr={(v) => patchOnline({ badgeAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.titleEn}
              valueAr={online.titleAr}
              onChangeEn={(v) => patchOnline({ titleEn: v })}
              onChangeAr={(v) => patchOnline({ titleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.adminPageLead} (EN)`}
              labelAr={`${t.adminPageLead} (AR)`}
              valueEn={online.leadEn}
              valueAr={online.leadAr}
              onChangeEn={(v) => patchOnline({ leadEn: v })}
              onChangeAr={(v) => patchOnline({ leadAr: v })}
              theme={theme}
              textarea
            />
            <BilingualField
              labelEn={`${t.adminPageCtaLabel} (EN)`}
              labelAr={`${t.adminPageCtaLabel} (AR)`}
              valueEn={online.ctaEn}
              valueAr={online.ctaAr}
              onChangeEn={(v) => patchOnline({ ctaEn: v })}
              onChangeAr={(v) => patchOnline({ ctaAr: v })}
              theme={theme}
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageTrust}
            hint={t.adminPageTrustHint}
            icon={<ShoppingBag className="h-4 w-4" />}
            theme={theme}
          >
            {online.trust.map((item, index) => (
              <div
                key={`trust-${index}`}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {t.adminCard} {index + 1}
                  </span>
                  <ListToolbar
                    index={index}
                    total={online.trust.length}
                    onMove={(dir) =>
                      patchOnline({ trust: moveItem(online.trust, index, dir) })
                    }
                    onRemove={() =>
                      patchOnline({
                        trust: online.trust.filter((_, i) => i !== index),
                      })
                    }
                    theme={theme}
                    moveUpLabel={t.homepageMoveUp}
                    moveDownLabel={t.homepageMoveDown}
                    deleteLabel={t.deleteBtn}
                  />
                </div>
                <BilingualField
                  labelEn={`${t.homepageTitle} (EN)`}
                  labelAr={`${t.homepageTitle} (AR)`}
                  valueEn={item.titleEn}
                  valueAr={item.titleAr}
                  onChangeEn={(v) => updateTrust(index, { titleEn: v })}
                  onChangeAr={(v) => updateTrust(index, { titleAr: v })}
                  theme={theme}
                />
                <BilingualField
                  labelEn={`${t.adminSubtitle} (EN)`}
                  labelAr={`${t.adminSubtitle} (AR)`}
                  valueEn={item.descEn}
                  valueAr={item.descAr}
                  onChangeEn={(v) => updateTrust(index, { descEn: v })}
                  onChangeAr={(v) => updateTrust(index, { descAr: v })}
                  theme={theme}
                />
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {t.adminTrustLink}
                  </label>
                  <select
                    value={item.link ?? "none"}
                    onChange={(e) =>
                      updateTrust(index, {
                        link: e.target.value as PageTrustLink,
                      })
                    }
                    style={{
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                  >
                    <option value="none">{t.adminTrustLinkNone}</option>
                    <option value="returns">{t.adminTrustLinkReturns}</option>
                    <option value="whatsapp">{t.adminTrustLinkWhatsApp}</option>
                  </select>
                </div>
              </div>
            ))}
            {online.trust.length < MAX_PAGE_TRUST ? (
              <button
                type="button"
                onClick={() =>
                  patchOnline({ trust: [...online.trust, emptyTrustItem()] })
                }
                style={addButtonStyle}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.adminPageAddCard}
              </button>
            ) : null}
          </PanelSection>

          <PanelSection
            title={t.adminPageSteps}
            hint={t.adminPageStepsHint}
            icon={<ListOrdered className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.stepsTitleEn}
              valueAr={online.stepsTitleAr}
              onChangeEn={(v) => patchOnline({ stepsTitleEn: v })}
              onChangeAr={(v) => patchOnline({ stepsTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={online.stepsDescEn}
              valueAr={online.stepsDescAr}
              onChangeEn={(v) => patchOnline({ stepsDescEn: v })}
              onChangeAr={(v) => patchOnline({ stepsDescAr: v })}
              theme={theme}
              textarea
            />
            {online.steps.map((step, index) => (
              <div
                key={`os-step-${index}`}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {t.adminStep} {index + 1}
                  </span>
                  <ListToolbar
                    index={index}
                    total={online.steps.length}
                    onMove={(dir) =>
                      patchOnline({ steps: moveItem(online.steps, index, dir) })
                    }
                    onRemove={() =>
                      patchOnline({
                        steps: online.steps.filter((_, i) => i !== index),
                      })
                    }
                    theme={theme}
                    moveUpLabel={t.homepageMoveUp}
                    moveDownLabel={t.homepageMoveDown}
                    deleteLabel={t.deleteBtn}
                  />
                </div>
                <BilingualField
                  labelEn={`${t.homepageTitle} (EN)`}
                  labelAr={`${t.homepageTitle} (AR)`}
                  valueEn={step.titleEn}
                  valueAr={step.titleAr}
                  onChangeEn={(v) => updateOnlineStep(index, { titleEn: v })}
                  onChangeAr={(v) => updateOnlineStep(index, { titleAr: v })}
                  theme={theme}
                />
                <BilingualField
                  labelEn={`${t.homepageDescription} (EN)`}
                  labelAr={`${t.homepageDescription} (AR)`}
                  valueEn={step.descEn}
                  valueAr={step.descAr}
                  onChangeEn={(v) => updateOnlineStep(index, { descEn: v })}
                  onChangeAr={(v) => updateOnlineStep(index, { descAr: v })}
                  theme={theme}
                  textarea
                />
              </div>
            ))}
            {online.steps.length < MAX_PAGE_STEPS ? (
              <button
                type="button"
                onClick={() =>
                  patchOnline({ steps: [...online.steps, emptyCopyItem()] })
                }
                style={addButtonStyle}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.adminPageAddStep}
              </button>
            ) : null}
          </PanelSection>

          <PanelSection
            title={t.adminPagePayment}
            icon={<Megaphone className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.paymentTitleEn}
              valueAr={online.paymentTitleAr}
              onChangeEn={(v) => patchOnline({ paymentTitleEn: v })}
              onChangeAr={(v) => patchOnline({ paymentTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.adminSubtitle} (EN)`}
              labelAr={`${t.adminSubtitle} (AR)`}
              valueEn={online.paymentCodTitleEn}
              valueAr={online.paymentCodTitleAr}
              onChangeEn={(v) => patchOnline({ paymentCodTitleEn: v })}
              onChangeAr={(v) => patchOnline({ paymentCodTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={online.paymentCodDescEn}
              valueAr={online.paymentCodDescAr}
              onChangeEn={(v) => patchOnline({ paymentCodDescEn: v })}
              onChangeAr={(v) => patchOnline({ paymentCodDescAr: v })}
              theme={theme}
              textarea
            />
            <BilingualField
              labelEn={`${t.homepageDescription} 2 (EN)`}
              labelAr={`${t.homepageDescription} 2 (AR)`}
              valueEn={online.paymentConfirmDescEn}
              valueAr={online.paymentConfirmDescAr}
              onChangeEn={(v) => patchOnline({ paymentConfirmDescEn: v })}
              onChangeAr={(v) => patchOnline({ paymentConfirmDescAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageDelivery}
            icon={<Truck className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.deliveryTitleEn}
              valueAr={online.deliveryTitleAr}
              onChangeEn={(v) => patchOnline({ deliveryTitleEn: v })}
              onChangeAr={(v) => patchOnline({ deliveryTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Tripoli (EN)"
              labelAr="طرابلس (AR)"
              valueEn={online.deliveryTripoliEn}
              valueAr={online.deliveryTripoliAr}
              onChangeEn={(v) => patchOnline({ deliveryTripoliEn: v })}
              onChangeAr={(v) => patchOnline({ deliveryTripoliAr: v })}
              theme={theme}
              textarea
            />
            <BilingualField
              labelEn="Libya (EN)"
              labelAr="ليبيا (AR)"
              valueEn={online.deliveryLibyaEn}
              valueAr={online.deliveryLibyaAr}
              onChangeEn={(v) => patchOnline({ deliveryLibyaEn: v })}
              onChangeAr={(v) => patchOnline({ deliveryLibyaAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageReturns}
            icon={<HelpCircle className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.returnsTitleEn}
              valueAr={online.returnsTitleAr}
              onChangeEn={(v) => patchOnline({ returnsTitleEn: v })}
              onChangeAr={(v) => patchOnline({ returnsTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={online.returnsDescEn}
              valueAr={online.returnsDescAr}
              onChangeEn={(v) => patchOnline({ returnsDescEn: v })}
              onChangeAr={(v) => patchOnline({ returnsDescAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageFaq}
            hint={t.adminPageFaqHint}
            icon={<HelpCircle className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.faqTitleEn}
              valueAr={online.faqTitleAr}
              onChangeEn={(v) => patchOnline({ faqTitleEn: v })}
              onChangeAr={(v) => patchOnline({ faqTitleAr: v })}
              theme={theme}
            />
            {online.faqs.map((item, index) => (
              <div
                key={item.id || `os-faq-${index}`}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    FAQ {index + 1}
                  </span>
                  <ListToolbar
                    index={index}
                    total={online.faqs.length}
                    onMove={(dir) =>
                      patchOnline({ faqs: moveItem(online.faqs, index, dir) })
                    }
                    onRemove={() =>
                      patchOnline({
                        faqs: online.faqs.filter((_, i) => i !== index),
                      })
                    }
                    theme={theme}
                    moveUpLabel={t.homepageMoveUp}
                    moveDownLabel={t.homepageMoveDown}
                    deleteLabel={t.deleteBtn}
                  />
                </div>
                <BilingualField
                  labelEn={`${t.adminQuestion} (EN)`}
                  labelAr={`${t.adminQuestion} (AR)`}
                  valueEn={item.qEn}
                  valueAr={item.qAr}
                  onChangeEn={(v) => updateOnlineFaq(index, { qEn: v })}
                  onChangeAr={(v) => updateOnlineFaq(index, { qAr: v })}
                  theme={theme}
                />
                <BilingualField
                  labelEn={`${t.adminAnswer} (EN)`}
                  labelAr={`${t.adminAnswer} (AR)`}
                  valueEn={item.aEn}
                  valueAr={item.aAr}
                  onChangeEn={(v) => updateOnlineFaq(index, { aEn: v })}
                  onChangeAr={(v) => updateOnlineFaq(index, { aAr: v })}
                  theme={theme}
                  textarea
                />
              </div>
            ))}
            {online.faqs.length < MAX_PAGE_FAQS ? (
              <button
                type="button"
                onClick={() =>
                  patchOnline({
                    faqs: [...online.faqs, emptyFaqItem("os-faq")],
                  })
                }
                style={addButtonStyle}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.adminPageAddFaq}
              </button>
            ) : null}
          </PanelSection>

          <PanelSection
            title={t.adminPageCta}
            icon={<MessageCircle className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={online.ctaTitleEn}
              valueAr={online.ctaTitleAr}
              onChangeEn={(v) => patchOnline({ ctaTitleEn: v })}
              onChangeAr={(v) => patchOnline({ ctaTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={online.ctaDescEn}
              valueAr={online.ctaDescAr}
              onChangeEn={(v) => patchOnline({ ctaDescEn: v })}
              onChangeAr={(v) => patchOnline({ ctaDescAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>
        </>
      ) : (
        <>
          <PanelSection
            title={t.adminPageHero}
            hint={t.adminPageHeroHint}
            icon={<Images className="h-4 w-4" />}
            theme={theme}
          >
            <ImageUploadField
              label={isAr ? "صورة البانر" : "Hero photo"}
              value={wholesale.heroImage}
              onChange={(url) => patchWholesale({ heroImage: url })}
              adminToken={adminToken}
              lang={lang}
              theme={theme}
              required
            />
            <BilingualField
              labelEn={`${t.homepageBadge} (EN)`}
              labelAr={`${t.homepageBadge} (AR)`}
              valueEn={wholesale.badgeEn}
              valueAr={wholesale.badgeAr}
              onChangeEn={(v) => patchWholesale({ badgeEn: v })}
              onChangeAr={(v) => patchWholesale({ badgeAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={wholesale.titleEn}
              valueAr={wholesale.titleAr}
              onChangeEn={(v) => patchWholesale({ titleEn: v })}
              onChangeAr={(v) => patchWholesale({ titleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.adminPageLead} (EN)`}
              labelAr={`${t.adminPageLead} (AR)`}
              valueEn={wholesale.descEn}
              valueAr={wholesale.descAr}
              onChangeEn={(v) => patchWholesale({ descEn: v })}
              onChangeAr={(v) => patchWholesale({ descAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageTiers}
            hint={t.adminPageTiersHint}
            icon={<Building2 className="h-4 w-4" />}
            theme={theme}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  [
                    "wholesaleDiscountTier1Pct",
                    settingsForm.wholesaleDiscountTier1Pct,
                    15,
                  ],
                  [
                    "wholesaleDiscountTier2Pct",
                    settingsForm.wholesaleDiscountTier2Pct,
                    22,
                  ],
                  [
                    "wholesaleDiscountTier3Pct",
                    settingsForm.wholesaleDiscountTier3Pct,
                    30,
                  ],
                ] as const
              ).map(([key, value, fallback], index) => (
                <div key={key}>
                  <label className="block text-xs font-bold mb-1">
                    {isAr
                      ? `شريحة ${index + 1} — الخصم %`
                      : `Tier ${index + 1} discount %`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={value}
                    onChange={(e) =>
                      patchSettings({
                        [key]: parseInt(e.target.value, 10) || fallback,
                      })
                    }
                    style={{
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
                  />
                </div>
              ))}
            </div>
            <BilingualField
              labelEn="Tier 1 label (EN)"
              labelAr="تسمية الشريحة 1 (AR)"
              valueEn={wholesale.tier1LabelEn}
              valueAr={wholesale.tier1LabelAr}
              onChangeEn={(v) => patchWholesale({ tier1LabelEn: v })}
              onChangeAr={(v) => patchWholesale({ tier1LabelAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Tier 2 label (EN)"
              labelAr="تسمية الشريحة 2 (AR)"
              valueEn={wholesale.tier2LabelEn}
              valueAr={wholesale.tier2LabelAr}
              onChangeEn={(v) => patchWholesale({ tier2LabelEn: v })}
              onChangeAr={(v) => patchWholesale({ tier2LabelAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Tier 3 label (EN)"
              labelAr="تسمية الشريحة 3 (AR)"
              valueEn={wholesale.tier3LabelEn}
              valueAr={wholesale.tier3LabelAr}
              onChangeEn={(v) => patchWholesale({ tier3LabelEn: v })}
              onChangeAr={(v) => patchWholesale({ tier3LabelAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Terms & conditions (EN)"
              labelAr="شروط البيع بالجملة (AR)"
              valueEn={settingsForm.wholesaleConditionsEn}
              valueAr={settingsForm.wholesaleConditionsAr}
              onChangeEn={(v) => patchSettings({ wholesaleConditionsEn: v })}
              onChangeAr={(v) => patchSettings({ wholesaleConditionsAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageSteps}
            hint={t.adminPageStepsHint}
            icon={<ListOrdered className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={wholesale.stepsTitleEn}
              valueAr={wholesale.stepsTitleAr}
              onChangeEn={(v) => patchWholesale({ stepsTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ stepsTitleAr: v })}
              theme={theme}
            />
            {wholesale.steps.map((step, index) => (
              <div
                key={`ws-step-${index}`}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {t.adminStep} {index + 1}
                  </span>
                  <ListToolbar
                    index={index}
                    total={wholesale.steps.length}
                    onMove={(dir) =>
                      patchWholesale({
                        steps: moveItem(wholesale.steps, index, dir),
                      })
                    }
                    onRemove={() =>
                      patchWholesale({
                        steps: wholesale.steps.filter((_, i) => i !== index),
                      })
                    }
                    theme={theme}
                    moveUpLabel={t.homepageMoveUp}
                    moveDownLabel={t.homepageMoveDown}
                    deleteLabel={t.deleteBtn}
                  />
                </div>
                <BilingualField
                  labelEn={`${t.homepageTitle} (EN)`}
                  labelAr={`${t.homepageTitle} (AR)`}
                  valueEn={step.titleEn}
                  valueAr={step.titleAr}
                  onChangeEn={(v) => updateWholesaleStep(index, { titleEn: v })}
                  onChangeAr={(v) => updateWholesaleStep(index, { titleAr: v })}
                  theme={theme}
                />
                <BilingualField
                  labelEn={`${t.homepageDescription} (EN)`}
                  labelAr={`${t.homepageDescription} (AR)`}
                  valueEn={step.descEn}
                  valueAr={step.descAr}
                  onChangeEn={(v) => updateWholesaleStep(index, { descEn: v })}
                  onChangeAr={(v) => updateWholesaleStep(index, { descAr: v })}
                  theme={theme}
                  textarea
                />
              </div>
            ))}
            {wholesale.steps.length < MAX_PAGE_STEPS ? (
              <button
                type="button"
                onClick={() =>
                  patchWholesale({
                    steps: [...wholesale.steps, emptyCopyItem()],
                  })
                }
                style={addButtonStyle}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.adminPageAddStep}
              </button>
            ) : null}
          </PanelSection>

          <PanelSection
            title={t.adminPageRanges}
            icon={<ShoppingBag className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={wholesale.rangesTitleEn}
              valueAr={wholesale.rangesTitleAr}
              onChangeEn={(v) => patchWholesale({ rangesTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ rangesTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={wholesale.rangesDescEn}
              valueAr={wholesale.rangesDescAr}
              onChangeEn={(v) => patchWholesale({ rangesDescEn: v })}
              onChangeAr={(v) => patchWholesale({ rangesDescAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageDelivery}
            icon={<Truck className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} — Tripoli (EN)`}
              labelAr={`${t.homepageTitle} — طرابلس (AR)`}
              valueEn={wholesale.deliveryTitleEn}
              valueAr={wholesale.deliveryTitleAr}
              onChangeEn={(v) => patchWholesale({ deliveryTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ deliveryTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn={`${t.homepageDescription} (EN)`}
              labelAr={`${t.homepageDescription} (AR)`}
              valueEn={wholesale.deliveryFreeEn}
              valueAr={wholesale.deliveryFreeAr}
              onChangeEn={(v) => patchWholesale({ deliveryFreeEn: v })}
              onChangeAr={(v) => patchWholesale({ deliveryFreeAr: v })}
              theme={theme}
              textarea
            />
            <BilingualField
              labelEn="Pickup title (EN)"
              labelAr="عنوان الاستلام (AR)"
              valueEn={wholesale.pickupTitleEn}
              valueAr={wholesale.pickupTitleAr}
              onChangeEn={(v) => patchWholesale({ pickupTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ pickupTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Pickup details (EN)"
              labelAr="تفاصيل الاستلام (AR)"
              valueEn={wholesale.pickupDescEn}
              valueAr={wholesale.pickupDescAr}
              onChangeEn={(v) => patchWholesale({ pickupDescEn: v })}
              onChangeAr={(v) => patchWholesale({ pickupDescAr: v })}
              theme={theme}
              textarea
            />
            <BilingualField
              labelEn="Other cities title (EN)"
              labelAr="عنوان المدن الأخرى (AR)"
              valueEn={wholesale.citiesTitleEn}
              valueAr={wholesale.citiesTitleAr}
              onChangeEn={(v) => patchWholesale({ citiesTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ citiesTitleAr: v })}
              theme={theme}
            />
            <BilingualField
              labelEn="Other cities details (EN)"
              labelAr="تفاصيل المدن الأخرى (AR)"
              valueEn={wholesale.citiesDescEn}
              valueAr={wholesale.citiesDescAr}
              onChangeEn={(v) => patchWholesale({ citiesDescEn: v })}
              onChangeAr={(v) => patchWholesale({ citiesDescAr: v })}
              theme={theme}
              textarea
            />
          </PanelSection>

          <PanelSection
            title={t.adminPageFaq}
            hint={t.adminPageFaqHint}
            icon={<HelpCircle className="h-4 w-4" />}
            theme={theme}
          >
            <BilingualField
              labelEn={`${t.homepageTitle} (EN)`}
              labelAr={`${t.homepageTitle} (AR)`}
              valueEn={wholesale.faqTitleEn}
              valueAr={wholesale.faqTitleAr}
              onChangeEn={(v) => patchWholesale({ faqTitleEn: v })}
              onChangeAr={(v) => patchWholesale({ faqTitleAr: v })}
              theme={theme}
            />
            {wholesale.faqs.map((item, index) => (
              <div
                key={item.id || `ws-faq-${index}`}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    FAQ {index + 1}
                  </span>
                  <ListToolbar
                    index={index}
                    total={wholesale.faqs.length}
                    onMove={(dir) =>
                      patchWholesale({
                        faqs: moveItem(wholesale.faqs, index, dir),
                      })
                    }
                    onRemove={() =>
                      patchWholesale({
                        faqs: wholesale.faqs.filter((_, i) => i !== index),
                      })
                    }
                    theme={theme}
                    moveUpLabel={t.homepageMoveUp}
                    moveDownLabel={t.homepageMoveDown}
                    deleteLabel={t.deleteBtn}
                  />
                </div>
                <BilingualField
                  labelEn={`${t.adminQuestion} (EN)`}
                  labelAr={`${t.adminQuestion} (AR)`}
                  valueEn={item.qEn}
                  valueAr={item.qAr}
                  onChangeEn={(v) => updateWholesaleFaq(index, { qEn: v })}
                  onChangeAr={(v) => updateWholesaleFaq(index, { qAr: v })}
                  theme={theme}
                />
                <BilingualField
                  labelEn={`${t.adminAnswer} (EN)`}
                  labelAr={`${t.adminAnswer} (AR)`}
                  valueEn={item.aEn}
                  valueAr={item.aAr}
                  onChangeEn={(v) => updateWholesaleFaq(index, { aEn: v })}
                  onChangeAr={(v) => updateWholesaleFaq(index, { aAr: v })}
                  theme={theme}
                  textarea
                />
              </div>
            ))}
            {wholesale.faqs.length < MAX_PAGE_FAQS ? (
              <button
                type="button"
                onClick={() =>
                  patchWholesale({
                    faqs: [...wholesale.faqs, emptyFaqItem("ws-faq")],
                  })
                }
                style={addButtonStyle}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.adminPageAddFaq}
              </button>
            ) : null}
          </PanelSection>
        </>
      )}

      <div className="flex justify-end pb-2">
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
  );
}
