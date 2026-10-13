"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StoreSettings } from "@/db/schema";
import { StoreImage } from "@/components/StoreImage";
import { THEMES, UI_TEXT, type Language } from "@/lib/i18n-themes";
import { hydrateFallbackStore } from "@/lib/fallbackData";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  Paintbrush,
  Phone,
  Printer,
  ScanLine,
  Scissors,
  ShieldCheck,
  StampIcon,
  Store,
  Truck,
} from "lucide-react";

const theme = THEMES[0];

/* ────────────────────────────────────────────────────────────────────────────
   SERVICE CATALOG DATA — professional printing & finishing services
   ──────────────────────────────────────────────────────────────────────────── */

type ServiceItem = {
  id: string;
  icon: typeof Printer;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  featuresEn: string[];
  featuresAr: string[];
  priceEn?: string;
  priceAr?: string;
  badgeEn?: string;
  badgeAr?: string;
  imageSrc: string;
};

const SERVICES: ServiceItem[] = [
  {
    id: "digital-printing",
    icon: Printer,
    titleEn: "Digital Printing",
    titleAr: "الطباعة الرقمية",
    descEn: "High-resolution digital printing on demand — from single pages to large batches — using professional-grade laser and inkjet presses for crisp text and vivid colour output.",
    descAr: "طباعة رقمية عالية الدقة عند الطلب — من صفحة واحدة إلى دفعات كبيرة — باستخدام طابعات ليزرية وحبرية احترافية لنصوص واضحة وألوان نابضة بالحياة.",
    featuresEn: [
      "A4 / A3 / A2 formats",
      "Colour & black-and-white",
      "Single-sided & duplex",
      "Glossy / matte / recycled paper",
      "Same-day turnaround",
    ],
    featuresAr: [
      "مقاسات A4 / A3 / A2",
      "ملون وأبيض وأسود",
      "وجه واحد وأمامي خلفي",
      "ورق لامع / مطفي / معاد تدويره",
      "إنجاز في نفس اليوم",
    ],
    badgeEn: "Most Popular",
    badgeAr: "الأكثر طلباً",
    imageSrc: "/images/new/hero-stationery-01.jpg",
  },
  {
    id: "large-format",
    icon: Layers,
    titleEn: "Large Format & Poster Printing",
    titleAr: "طباعة اللافتات والبوسترات الكبيرة",
    descEn: "Wide-format printing for banners, posters, architectural plans, exhibition panels, and event signage on vinyl, canvas, or heavyweight photo paper.",
    descAr: "طباعة عريضة للرايرات والبوسترات والمخططات المعمارية ولوحات المعارض ولافتات الأحداث على فينيل أو قماش أو ورق صور ثقيل.",
    featuresEn: [
      "Up to 1.5 m wide",
      "Vinyl, canvas & photo paper",
      "Indoor & outdoor durable",
      "Architectural plan printing",
      "Event & exhibition panels",
    ],
    featuresAr: [
      "عرض حتى 1.5 متر",
      "فينيل وقماش وورق صور",
      "للداخل والخارج",
      "طباعة المخططات المعمارية",
      "لوحات المناسبات والمعارض",
    ],
    badgeEn: "Wide Format",
    badgeAr: "طباعة عريضة",
    imageSrc: "/images/new/landscape-01.jpg",
  },
  {
    id: "photocopying",
    icon: Copy,
    titleEn: "Photocopying & Duplication",
    titleAr: "النسخ والتصوير",
    descEn: "Fast, affordable black-and-white and colour photocopying for school handouts, exam papers, corporate documents, and training materials — from a single sheet to thousands.",
    descAr: "تصوير سريع وبأسعار مناسبة بالأبيض والأسود والملون للوثائق المدرسية وأوراق الامتحانات والمستندات التجارية والمواد التدريبية — من ورقة واحدة إلى آلاف النسخ.",
    featuresEn: [
      "B&W from 0.15 LYD/page",
      "Colour from 0.50 LYD/page",
      "Bulk volume discounts",
      "A4 / A3 / custom sizes",
      "Stapling & collation included",
    ],
    featuresAr: [
      "أبيض وأسود من 0.15 د.ل/صفحة",
      "ملون من 0.50 د.ل/صفحة",
      "خصومات الكميات الكبيرة",
      "مقاسات A4 / A3 / مخصص",
      "تخييط وترتيب مرفق",
    ],
    badgeEn: "Best Value",
    badgeAr: "أفضل قيمة",
    imageSrc: "/images/new/main-storefront-hq.jpg",
  },
  {
    id: "scanning-digitization",
    icon: ScanLine,
    titleEn: "Scanning & Digitization",
    titleAr: "المسح الضوئي والرقمنة",
    descEn: "High-resolution scanning to PDF, JPEG, or TIFF for archival records, personal documents, photos, and large-format plans — with optional OCR text recognition for searchable files.",
    descAr: "مسح ضوئي بدقة عالية بصيغ PDF أو JPEG أو TIFF للأرشيف والمستندات الشخصية والصور والمخططات الكبيرة — مع خيار التعرف الضوئي على النصوص لملفات قابلة للبحث.",
    featuresEn: [
      "Up to 1200 DPI resolution",
      "OCR text recognition",
      "PDF / JPEG / TIFF output",
      "A4 / A3 / A0 plan scanning",
      "USB or email delivery",
    ],
    featuresAr: [
      "دقة تصل إلى 1200 نقطة لكل بوصة",
      "تعرّف ضوئي على النصوص (OCR)",
      "مخرجات PDF / JPEG / TIFF",
      "مسح مقاسات A4 / A3 / A0",
      "تسليم عبر USB أو بريد إلكتروني",
    ],
    imageSrc: "/images/new/hero-it-tech-01.jpg",
  },
  {
    id: "laminating-binding",
    icon: ShieldCheck,
    titleEn: "Laminating & Binding",
    titleAr: "التغليف الحراري والتغريز",
    descEn: "Protect and present your documents with professional laminating (glossy & matte), spiral binding, comb binding, hard-cover binding, and thermal binding for reports and dissertations.",
    descAr: "احمِ واعرض مستنداتك بتغليف حراري احترافي (لامع ومطفي)، وتغريز لولبي، وتغريز أسنان، وتغليف غلاف صلب، وتغليف حراري للتقارير والأطروحات.",
    featuresEn: [
      "Glossy & matte lamination",
      "Spiral & comb binding",
      "Hard-cover thesis binding",
      "A4 / A3 / custom formats",
      "Express 30-minute service",
    ],
    featuresAr: [
      "تغليف لامع ومطفي",
      "تغريز لولبي وأسنان",
      "تغريز غلاف صلب للأطروحات",
      "مقاسات A4 / A3 / مخصص",
      "خدمة سريعة خلال 30 دقيقة",
    ],
    imageSrc: "/images/new/hero-bts-01.jpg",
  },
  {
    id: "custom-branding",
    icon: Paintbrush,
    titleEn: "Custom Branding & Personalization",
    titleAr: "التصاميم المخصصة والطباعة الشخصية",
    descEn: "Personalized stationery, business cards, letterheads, envelopes, rubber stamps, and branded corporate gift sets — designed and printed in-house with your logo and identity.",
    descAr: "قرطاسية مخصصة، بطاقات أعمال، أوراق رسمية، ظرف، أختام مطاطية، ومجموعات هدايا مؤسسية بعلامتك التجارية — تصميم وطباعة داخلية بشعارك وهويتك.",
    featuresEn: [
      "Business cards (100+ designs)",
      "Letterheads & envelopes",
      "Rubber stamps & seals",
      "Branded gift sets",
      "Logo design assistance",
    ],
    featuresAr: [
      "بطاقات أعمال (أكثر من 100 تصميم)",
      "أوراق رسمية وأظرف",
      "أختام مطاطية ورسمية",
      "مجموعات هدايا بعلامتك التجارية",
      "مساعدة في تصميم الشعار",
    ],
    badgeEn: "Corporate",
    badgeAr: "للشركات",
    imageSrc: "/images/new/landscape-01.jpg",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   PROCESS STEPS
   ──────────────────────────────────────────────────────────────────────────── */

type Step = {
  num: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
};

const PROCESS_STEPS: Step[] = [
  {
    num: "01",
    titleEn: "Tell Us What You Need",
    titleAr: "أخبرنا بما تحتاجه",
    descEn: "Share your files (PDF, Word, image) via WhatsApp, email, or bring them on a USB drive to our store.",
    descAr: "أرسل ملفاتك (PDF، Word، صورة) عبر واتساب أو البريد الإلكتروني أو أحضرها على USB إلى متجرنا.",
  },
  {
    num: "02",
    titleEn: "Choose Format & Options",
    titleAr: "اختر المقاس والخيارات",
    descEn: "Pick paper size, colour/B&W, single/double-sided, binding type, lamination — we advise you on the best option.",
    descAr: "اختر مقاس الورق، ملون/أبيض وأسود، وجه واحد/أمامي خلفي، نوع التغريز، التغليف الحراري — ننصحك بأفضل خيار.",
  },
  {
    num: "03",
    titleEn: "We Print & Finish",
    titleAr: "نطبع ونُنهي",
    descEn: "Our team prints, cuts, binds, and laminates your job with quality checks at every stage — right here in Al Bivi.",
    descAr: "فريقنا يطبع ويقص ويغزّر ويغلف طلبك مع فحص جودة في كل مرحلة — هنا في البيفي.",
  },
  {
    num: "04",
    titleEn: "Collect or We Deliver",
    titleAr: "استلم أو نوصّل إليك",
    descEn: "Pick up your completed order from our shop, or request delivery across Tripoli (free on orders over 1,900 LYD).",
    descAr: "احصل على طلبك المكتمل من متجرنا، أو اطلب التوصيل داخل طرابلس (مجاني فوق 1,900 د.ل).",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   WHY CHOOSE US
   ──────────────────────────────────────────────────────────────────────────── */

type Advantage = {
  icon: typeof Printer;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
};

const ADVANTAGES: Advantage[] = [
  {
    icon: Clock,
    titleEn: "Same-Day Service",
    titleAr: "خدمة في نفس اليوم",
    descEn: "Most jobs ready within 1–4 hours. Express service available for urgent orders — just ask.",
    descAr: "معظم الطلبات جاهزة خلال 1 إلى 4 ساعات. خدمة سريعة متاحة للطلبات العاجلة — فقط اسأل.",
  },
  {
    icon: Printer,
    titleEn: "Professional Equipment",
    titleAr: "معدات احترافية",
    descEn: "Commercial-grade laser and inkjet presses, wide-format printers, and finishing machines maintained daily.",
    descAr: "طابعات ليزرية وحبرية بمستوى تجاري، وطابعات عريضة، وماكينات تشطيب تُصان يومياً.",
  },
  {
    icon: ShieldCheck,
    titleEn: "Quality Guaranteed",
    titleAr: "جودة مضمونة",
    descEn: "We inspect every print run. If the result doesn't match your expectations, we reprint at no extra cost.",
    descAr: "نفحص كل عملية طباعة. إذا لم يطابق النتائج توقعاتك، نعيد الطباعة بدون أي تكلفة إضافية.",
  },
  {
    icon: Truck,
    titleEn: "Free Delivery in Tripoli",
    titleAr: "توصيل مجاني داخل طرابلس",
    descEn: "Orders over 1,900 LYD delivered free to your office, school, or home anywhere in Tripoli.",
    descAr: "الطلبات فوق 1,900 د.ل تُوصّل مجاناً إلى مكتبك أو مدرستك أو منزلك في أي مكان بطرابلس.",
  },
  {
    icon: Layers,
    titleEn: "Bulk & Institutional Pricing",
    titleAr: "أسعار الجملة والمؤسسات",
    descEn: "Special rates for schools, universities, government agencies, and companies with recurring volume orders.",
    descAr: "أسعار خاصة للمدارس والجامعات والجهات الحكومية والشركات ذات الطلبات الدورية بالجملة.",
  },
  {
    icon: Paintbrush,
    titleEn: "In-House Design Studio",
    titleAr: "استوديو تصميم داخلي",
    descEn: "Our graphic design team can create or refine your layout, logo, business card, or presentation — print-ready files guaranteed.",
    descAr: "فريق التصميم الجرافيكي لدينا ينشئ ويحسّن تصميمك أو شعارك أو بطاقتك أو عرضك — ملفات جاهزة للطباعة مضمونة.",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   FAQ DATA
   ──────────────────────────────────────────────────────────────────────────── */

type Faq = { qEn: string; qAr: string; aEn: string; aAr: string };

const FAQS: Faq[] = [
  {
    qEn: "What file formats do you accept?",
    qAr: "ما هي صيغ الملفات المقبولة؟",
    aEn: "We accept PDF, Microsoft Word (.doc/.docx), PowerPoint (.pptx), Excel (.xlsx), JPEG, PNG, and TIFF. For best results, send PDF files with fonts embedded and images at 300 DPI minimum.",
    aAr: "نقبل PDF، وورد (.doc/.docx)، باوربوينت (.pptx)، إكسل (.xlsx)، JPEG، PNG، وTIFF. لأفضل النتائج، أرسل ملفات PDF مع تضمين الخطوط والصور بدقة 300 نقطة على الأقل.",
  },
  {
    qEn: "How fast can I get my order?",
    qAr: "كم يستغرق تجهيز طلبي؟",
    aEn: "Standard orders are ready within 1–4 hours. Large format, binding, and custom branding orders typically take 24 hours. Urgent same-hour service is available for a small surcharge — call us to arrange.",
    aAr: "الطلبات العادية جاهزة خلال 1 إلى 4 ساعات. طلبات الطباعة الكبيرة والتغريز والتصاميم المخصصة تستغرق عادة 24 ساعة. خدمة الطوارئ خلال ساعة متاحة برسوم إضافية صغيرة — اتصل بنا للتنسيق.",
  },
  {
    qEn: "Do you offer delivery?",
    qAr: "هل تقدمون خدمة التوصيل؟",
    aEn: "Yes! We deliver across Tripoli for free on orders over 1,900 LYD. For smaller orders, a flat delivery fee of 150 LYD applies within Tripoli. We also ship to all Libyan cities via local couriers.",
    aAr: "نعم! نوصّل داخل طرابلس مجاناً للطلبات فوق 1,900 د.ل. للطلبات الأصغر، رسوم توصيل ثابتة 150 د.ل داخل طابلس. نشحن أيضاً لجميع المدن الليبية عبر شركات التوصيل المحلية.",
  },
  {
    qEn: "Can you help me design my project?",
    qAr: "هل تساعدون في تصميم مشروعي؟",
    aEn: "Absolutely. Our in-house design team can create business cards, letterheads, posters, flyers, presentations, and more. Design fees start at 50 LYD for simple layouts.",
    aAr: "بالتأكيد. فريق التصميم الداخلي لدينا يمكنه إنشاء بطاقات أعمال وأوراق رسمية وبوسترات ومنشورات وعروض تقديمية وغيرها. رسوم التصميم تبدأ من 50 د.ل للتصاميم البسيطة.",
  },
  {
    qEn: "What payment methods do you accept?",
    qAr: "ما هي طرق الدفع المقبولة؟",
    aEn: "We accept cash on delivery, bank transfer, and will soon support electronic payments (LYPay, Moamalat, Tadawul, Masarat) once our Mawthooq licence is issued. Corporate invoicing is available for institutional clients.",
    aAr: "نقبل الدفع نقداً عند التسليم والتحويل المصرفي، وسندعم قريباً الدفع الإلكتروني (LYPay، معاملات، تداول، مسارات) بعد إصدار ترخيص موثوق. الفوترة المؤسسية متاحة للعملاء من الجهات.",
  },
  {
    qEn: "Do you offer discounts for schools and institutions?",
    qAr: "هل تقدمون خصومات للمؤسسات والمدارس؟",
    aEn: "Yes. We offer volume-based institutional pricing for schools, universities, government offices, and corporations. Contact us via WhatsApp for a custom quote tailored to your recurring needs.",
    aAr: "نعم. نقدم أسعار مؤسسية بناءً على الحجم للمدارس والجامعات والجهات الحكومية والشركات. تواصل معنا عبر واتساب لعرض سعر مخصص يناسب احتياجاتك الدورية.",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   PAGE COMPONENT
   ──────────────────────────────────────────────────────────────────────────── */

export default function ServicesPage() {
  const [lang, setLang] = useState<Language>("ar");
  const isRtl = lang === "ar";
  const t = UI_TEXT[lang];
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [activeService, setActiveService] = useState<string>("digital-printing");

  const fetchSettings = useCallback(async () => {
    const fallback = hydrateFallbackStore();
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (!res.ok) throw new Error("API not available");
      const data = await res.json();
      if (!data.settings) throw new Error("No settings");
      setSettings({ ...data.settings, id: Number(data.settings.id) || 1 });
    } catch {
      setSettings(fallback.settings as StoreSettings);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSettings]);

  const whatsappNumber = (settings?.whatsappNumber || "218912145050").replace(
    /\D/g,
    ""
  );
  const contactPhone = settings?.contactPhone || "+218 91-214-5050";

  const currentService = useMemo(
    () => SERVICES.find((s) => s.id === activeService) ?? SERVICES[0],
    [activeService]
  );

  /* ── Labels ──────────────────────────────────────────────────────────── */
  const labels = {
    badge: {
      en: "Professional Printing & Finishing Services",
      ar: "خدمات الطباعة والتشطيب الاحترافية",
    },
    title: {
      en: "Printing, Copying & Document Services",
      ar: "خدمات الطباعة والنسخ والمستندات",
    },
    subtitle: {
      en: "Everything you need for professional printing — digital prints, photocopying, scanning, laminating, binding, and custom branding — all under one roof in Al Bivi, Tripoli.",
      ar: "كل ما تحتاجه للطباعة الاحترافية — طباعة رقمية، تصوير، مسح ضوئي، تغليف حراري، تغريز، وتصاميم مخصصة — كل ذلك تحت سقف واحد في البيفي، طرابلس.",
    },
    cta: {
      en: "Request a Quote",
      ar: "اطلب عرض سعر",
    },
    ctaSecondary: {
      en: "Call Us Now",
      ar: "اتصل بنا الآن",
    },
    navServices: {
      en: "Services",
      ar: "الخدمات",
    },
    servicesTitle: {
      en: "Our Services",
      ar: "خدماتنا",
    },
    servicesDesc: {
      en: "Browse our full range of printing and finishing services. Click on any service to see details, features, and pricing.",
      ar: "تصفح مجموعتنا الكاملة من خدمات الطباعة والتشطيب. انقر على أي خدمة لرؤية التفاصيل والمميزات والأسعار.",
    },
    featuresTitle: {
      en: "What's Included",
      ar: "ما يتضمنه",
    },
    processTitle: {
      en: "How It Works",
      ar: "كيف تعمل الخدمة",
    },
    processDesc: {
      en: "Four simple steps from file to finished product — we handle everything.",
      ar: "أربع خطوات بسيطة من الملف إلى المنتج النهائي — نتولى كل شيء.",
    },
    whyTitle: {
      en: "Why Choose Al Manhaj Services",
      ar: "لماذا تختار خدمات المنهج",
    },
    whyDesc: {
      en: "Trusted by hundreds of schools, businesses, and individuals across Libya for reliable, high-quality printing services.",
      ar: "موثوق من قبل مئات المدارس والشركات والأفراد في ليبيا لخدمات طباعة موثوقة وعالية الجودة.",
    },
    faqTitle: {
      en: "Frequently Asked Questions",
      ar: "الأسئلة الشائعة",
    },
    ctaSection: {
      en: "Ready to Start Your Print Job?",
      ar: "هل أنت مستعد لبدء طلب الطباعة؟",
    },
    ctaSectionDesc: {
      en: "Send us your files on WhatsApp and get a quote within minutes. We're here Saturday through Thursday, 9 AM – 9 PM.",
      ar: "أرسل لنا ملفاتك على واتساب واحصل على عرض سعر في دقائق. نحن هنا من السبت إلى الخميس، 9 صباحاً – 9 مساءً.",
    },
    backToStore: {
      en: "Back to Store",
      ar: "العودة للمتجر",
    },
    store: {
      en: "Store",
      ar: "المتجر",
    },
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-services-page
      className="min-h-screen bg-[#EEEEEE] text-[#1A1A1A]"
    >
      {/* ═══ Top Announcement Bar ═══ */}
      <div className="bg-[#222] text-white">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-3 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Phone className="h-3.5 w-3.5" />
            <span dir="ltr">{contactPhone}</span>
          </span>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === "en" ? "ar" : "en"))}
            className="inline-flex items-center gap-1 font-bold"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </div>

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-3 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#E30613] text-lg font-black text-white">
              {lang === "ar" ? "م" : "A"}
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold">
                {lang === "ar" ? "شركة المنهج للقرطاسية" : "AL-MANHAJ"}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {labels.navServices[lang]}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/magasin"
              className="hidden sm:inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-bold"
            >
              <Store className="h-3.5 w-3.5" />
              {t.ourStore}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2 text-xs font-extrabold text-white"
            >
              {labels.backToStore[lang]}
              <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
        <nav className="bg-[#E30613] text-white">
          <div className="mx-auto flex max-w-[1760px] items-center gap-1 px-2 text-xs font-bold sm:text-sm">
            <Link href="/" className="px-3 py-2.5 hover:bg-black/15">
              {labels.store[lang]}
            </Link>
            <Link href="/vente-en-ligne" className="px-3 py-2.5 hover:bg-black/15">
              {t.navOnlineSales}
            </Link>
            <span className="px-3 py-2.5 bg-black/20" aria-current="page">
              {labels.navServices[lang]}
            </span>
            <Link href="/wholesale" className="px-3 py-2.5 hover:bg-black/15">
              {t.navWholesale}
            </Link>
            <Link href="/magasin" className="px-3 py-2.5 hover:bg-black/15">
              {t.ourStore}
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1760px] px-3 py-6 sm:py-10 space-y-10">

        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO BANNER
           ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative h-[260px] overflow-hidden bg-black sm:h-[400px] lg:h-[480px]">
          <StoreImage
            src="/images/new/hero-stationery-01.jpg"
            alt={labels.title[lang]}
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-10">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-200">
              <Printer className="h-3.5 w-3.5" />
              {labels.badge[lang]}
            </p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black sm:text-4xl lg:text-5xl">
              {labels.title[lang]}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base lg:text-lg">
              {labels.subtitle[lang]}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  lang === "ar"
                    ? "مرحباً، أريد الاستفسار عن خدمات الطباعة."
                    : "Hello, I would like to inquire about printing services."
                )}`}
                className="inline-flex items-center gap-2 bg-[#25D366] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:bg-[#1EBE5D]"
              >
                <MessageCircle className="h-4 w-4 fill-current" />
                {labels.cta[lang]}
              </a>
              <a
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 bg-[#E30613] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:opacity-95"
              >
                <Phone className="h-4 w-4" />
                {labels.ctaSecondary[lang]}
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            2. SERVICE CARDS — Tab Navigation + Detail Panel
           ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black sm:text-3xl">
              {labels.servicesTitle[lang]}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              {labels.servicesDesc[lang]}
            </p>
          </div>

          {/* Service Tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
            role="tablist"
            aria-label={labels.servicesTitle[lang]}
          >
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const isActive = service.id === activeService;
              return (
                <button
                  key={service.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveService(service.id)}
                  className={`flex shrink-0 items-center gap-2 border px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                    isActive
                      ? "bg-[#E30613] text-white border-[#E30613] shadow-md"
                      : "bg-white hover:border-[#E30613] hover:text-[#E30613]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {lang === "ar" ? service.titleAr : service.titleEn}
                  </span>
                  {service.badgeEn && isActive && (
                    <span className="ms-1 hidden sm:inline-flex bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold rounded-sm">
                      {lang === "ar" ? service.badgeAr : service.badgeEn}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Service Detail Panel */}
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            {/* Left: Image */}
            <div className="lg:col-span-5">
              <div className="relative h-[220px] overflow-hidden bg-black sm:h-[320px] lg:h-[380px]">
                <StoreImage
                  src={currentService.imageSrc}
                  alt={lang === "ar" ? currentService.titleAr : currentService.titleEn}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {currentService.badgeEn && (
                  <div className="absolute top-3 start-3 bg-[#E30613] text-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider">
                    {lang === "ar" ? currentService.badgeAr : currentService.badgeEn}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-xl font-black sm:text-2xl">
                    {lang === "ar" ? currentService.titleAr : currentService.titleEn}
                  </h3>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-7 border bg-white p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-neutral-700">
                {lang === "ar" ? currentService.descAr : currentService.descEn}
              </p>

              <h4 className="mt-5 mb-3 text-sm font-extrabold uppercase tracking-wider text-neutral-500">
                {labels.featuresTitle[lang]}
              </h4>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(lang === "ar" ? currentService.featuresAr : currentService.featuresEn).map(
                  (feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  )
                )}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    lang === "ar"
                      ? `مرحباً، أريد الاستفسار عن خدمة: ${currentService.titleAr}`
                      : `Hello, I would like to inquire about: ${currentService.titleEn}`
                  )}`}
                  className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1EBE5D]"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white"
                >
                  <Phone className="h-4 w-4" />
                  {lang === "ar" ? "اتصل الآن" : "Call Now"}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            3. QUICK SERVICE GRID (ALL SERVICES AT A GLANCE)
           ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const isActive = service.id === activeService;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setActiveService(service.id)}
                  className={`group flex flex-col items-center gap-2 border p-4 text-center transition-all ${
                    isActive
                      ? "bg-[#E30613] text-white border-[#E30613] shadow-lg"
                      : "bg-white hover:border-[#E30613] hover:shadow-md"
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 ${
                      isActive ? "text-white" : "text-[#E30613] group-hover:scale-110 transition"
                    }`}
                  />
                  <span className="text-[11px] font-extrabold leading-snug sm:text-xs">
                    {lang === "ar" ? service.titleAr : service.titleEn}
                  </span>
                  {service.badgeEn && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isActive ? "text-white/80" : "text-neutral-400"
                      }`}
                    >
                      {lang === "ar" ? service.badgeAr : service.badgeEn}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            4. HOW IT WORKS — PROCESS STEPS
           ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-black sm:text-2xl">
            {labels.processTitle[lang]}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 max-w-xl">
            {labels.processDesc[lang]}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step) => (
              <article
                key={step.num}
                className="relative border bg-white p-5 group hover:border-[#E30613] transition-colors"
              >
                <span className="absolute -top-3 -start-3 flex h-10 w-10 items-center justify-center bg-[#E30613] text-sm font-black text-white shadow-md">
                  {step.num}
                </span>
                <h3 className="mt-4 text-sm font-extrabold">
                  {lang === "ar" ? step.titleAr : step.titleEn}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  {lang === "ar" ? step.descAr : step.descEn}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            5. WHY CHOOSE US — ADVANTAGES GRID
           ═══════════════════════════════════════════════════════════════════ */}
        <section className="border bg-white p-5 sm:p-8">
          <h2 className="text-xl font-black sm:text-2xl">
            {labels.whyTitle[lang]}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 max-w-2xl mb-6">
            {labels.whyDesc[lang]}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((adv) => {
              const Icon = adv.icon;
              return (
                <article
                  key={adv.titleEn}
                  className="flex items-start gap-3 border p-4 hover:border-[#E30613] transition-colors"
                >
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#E30613]" />
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {lang === "ar" ? adv.titleAr : adv.titleEn}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      {lang === "ar" ? adv.descAr : adv.descEn}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            6. TRUST & GUARANTEES BAR
           ═══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 gap-px bg-neutral-200 lg:grid-cols-4">
          {[
            { icon: Clock, titleAr: "إنجاز سريع", titleEn: "Fast Turnaround", subAr: "خلال ساعات", subEn: "Within hours" },
            { icon: ShieldCheck, titleAr: "جودة مضمونة", titleEn: "Quality Guaranteed", subAr: "فحص دقيق", subEn: "Quality-checked" },
            { icon: Truck, titleAr: "توصيل مجاني", titleEn: "Free Delivery", subAr: "فوق 1,900 د.ل", subEn: "Over 1,900 LYD" },
            { icon: Paintbrush, titleAr: "تصميم داخلي", titleEn: "In-House Design", subAr: "فريق متخصص", subEn: "Expert team" },
          ].map((item) => (
            <div key={item.titleEn} className="flex items-center gap-3 bg-white px-4 py-4">
              <item.icon className="h-8 w-8 shrink-0 text-[#E30613]" />
              <div>
                <div className="text-sm font-extrabold">
                  {lang === "ar" ? item.titleAr : item.titleEn}
                </div>
                <div className="text-xs text-neutral-500">
                  {lang === "ar" ? item.subAr : item.subEn}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            7. FAQ ACCORDION
           ═══════════════════════════════════════════════════════════════════ */}
        <section className="border bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-black sm:text-2xl">
            {labels.faqTitle[lang]}
          </h2>
          <div className="divide-y">
            {FAQS.map((item) => (
              <details key={item.qEn} className="py-3 group">
                <summary className="cursor-pointer text-sm font-extrabold list-none flex items-center justify-between gap-2">
                  <span>{lang === "ar" ? item.qAr : item.qEn}</span>
                  <span className="text-[#E30613] text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 ps-0 sm:ps-4">
                  {lang === "ar" ? item.aAr : item.aEn}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            8. FINAL CTA
           ═══════════════════════════════════════════════════════════════════ */}
        <section className="border bg-[#1a1a1a] p-6 sm:p-10 text-white text-center">
          <h2 className="text-2xl font-black sm:text-3xl">
            {labels.ctaSection[lang]}
          </h2>
          <p className="mt-2 text-sm text-neutral-300 max-w-xl mx-auto">
            {labels.ctaSectionDesc[lang]}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                lang === "ar"
                  ? "مرحباً، أريد عرض سعر لخدمات طباعة."
                  : "Hello, I would like a quote for printing services."
              )}`}
              className="inline-flex items-center gap-2 bg-[#25D366] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1EBE5D]"
            >
              <MessageCircle className="h-5 w-5 fill-current" />
              WhatsApp
            </a>
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 bg-[#E30613] px-6 py-3 text-sm font-extrabold text-white"
            >
              <Phone className="h-5 w-5" />
              {lang === "ar" ? "اتصل الآن" : "Call Now"}
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20"
            >
              <BookOpen className="h-5 w-5" />
              {lang === "ar" ? "تصفح المتجر" : "Browse Store"}
            </Link>
          </div>
        </section>

      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t bg-[#1a1a1a] py-8 text-white">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-4 px-3">
          <p className="text-xs font-bold text-neutral-400">
            {lang === "ar"
              ? "شركة المنهج للقرطاسية — طرابلس، ليبيا"
              : "Al Manhaj Company for Stationery — Tripoli, Libya"}
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-300">
            <Link href="/" className="hover:text-white hover:underline">
              {lang === "ar" ? "المتجر" : "Store"}
            </Link>
            <Link href="/wholesale" className="hover:text-white hover:underline">
              {t.navWholesale}
            </Link>
            <Link href="/vente-en-ligne" className="hover:text-white hover:underline">
              {t.navOnlineSales}
            </Link>
            <Link href="/services" className="hover:text-white hover:underline text-[#E30613]">
              {labels.navServices[lang]}
            </Link>
            <Link href="/magasin" className="hover:text-white hover:underline">
              {t.ourStore}
            </Link>
            <Link href="/returns" className="hover:text-white hover:underline">
              {lang === "ar" ? "الاسترجاع والشحن" : "Shipping & returns"}
            </Link>
            <Link href="/privacy" className="hover:text-white hover:underline">
              {lang === "ar" ? "الخصوصية" : "Privacy"}
            </Link>
            <Link href="/terms" className="hover:text-white hover:underline">
              {lang === "ar" ? "الشروط" : "Terms"}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}