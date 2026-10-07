import { db, pool } from "./index";
import {
  categories,
  products,
  storeSettings,
  type NewCategory,
  type NewProduct,
  type NewStoreSettings,
} from "./schema";
import { count, eq } from "drizzle-orm";

const USD_TO_LYD = 5.5;

function toLyd(amount: number): number {
  return Math.round(amount * USD_TO_LYD * 100) / 100;
}

function toLydOrNull(amount: number | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  return toLyd(amount);
}

export const INITIAL_CATEGORIES: NewCategory[] = [
  {
    slug: "notebooks",
    nameEn: "Notebooks & Paper Goods",
    nameAr: "الدفاتر والمنتجات الورقية",
    descriptionEn: "100gsm fountain-pen friendly notebooks, dotted journals, academic pads & archival A4 paper.",
    descriptionAr: "دفاتر ملاحظات فاخرة بوزن 100 جرام، دفاتر منقطة، كراسات أكاديمية وورق A4 عالي الجودة.",
    imageUrl: "/images/category-illustrations/notebooks.webp",
    badgeEn: "100–120 GSM Paper",
    badgeAr: "ورق فاخر 120 جرام",
    sortOrder: 1,
  },
  {
    slug: "writing",
    nameEn: "Fine Writing & Pens",
    nameAr: "أدوات الكتابة والأقلام الفاخرة",
    descriptionEn: "Precision fountain pens, Japanese gel rollers, architectural fineliners & pastel highlighters.",
    descriptionAr: "أقلام حبر سائلة دقيقة، أقلام جل يابانية، محددات هندسية وأقلام تظليل بألوان الباستيل.",
    imageUrl: "/images/category-illustrations/writing.webp",
    badgeEn: "Precision Nib",
    badgeAr: "كتابة فائقة الدقة",
    sortOrder: 2,
  },
  {
    slug: "bags",
    nameEn: "School Bags & Organizers",
    nameAr: "الحقائب المدرسية وحلول التنظيم",
    descriptionEn: "Ergonomic waterproof backpacks, padded laptop sleeves, canvas pen cases & modular desk trays.",
    descriptionAr: "حقائب ظهر مدرسية مريحة ومقاومة للماء، حافظات حاسوب مبطنة، مقلمات قماشية ومنظمات مكتبية.",
    imageUrl: "/images/category-illustrations/bags.webp",
    badgeEn: "Ergonomic Series",
    badgeAr: "تصميم مريح للظهر",
    sortOrder: 3,
  },
  {
    slug: "it-peripherals",
    nameEn: "IT Peripherals & Accessories",
    nameAr: "ملحقات الحاسوب والتقنية",
    descriptionEn: "Wireless mechanical keyboards, ergonomic silent mice, USB-C 10-in-1 hubs & NVMe portable SSDs.",
    descriptionAr: "لوحات مفاتيح ميكانيكية لاسلكية، فئران مريحة صامتة، موزعات USB-C وأقراص تخزين SSD سريعة.",
    imageUrl: "/images/category-illustrations/it-accessories.webp",
    badgeEn: "Pro Studio Tech",
    badgeAr: "تقنيات احترافية",
    sortOrder: 4,
  },
  {
    slug: "ink-consumables",
    nameEn: "Ink, Toner & Consumables",
    nameAr: "الأحبار والتونر والمستهلكات",
    descriptionEn: "High-yield laser toner cartridges, pigment ink bottles, thermal labels & studio paper reams.",
    descriptionAr: "خراطيش تونر ليزر عالية الإنتاجية، عبوات حبر ملونة، ملصقات حرارية ورزم ورق للمكاتب.",
    imageUrl: "/images/category-illustrations/ink-toner.webp",
    badgeEn: "High-Yield OEM",
    badgeAr: "إنتاجية طباعة عالية",
    sortOrder: 5,
  },
  {
    slug: "art-drafting",
    nameEn: "Art & Technical Drafting",
    nameAr: "الفنون الجميلة والرسم الهندسي",
    descriptionEn: "Dual-tip alcohol markers, brass drafting compass sets, watercolor brush pens & heavy sketchbooks.",
    descriptionAr: "أقلام ماركر مزدوجة الرأس، أطقم فرجار هندسي نحاسي، أقلام ألوان مائية وكراسات رسم سميكة.",
    imageUrl: "/images/category-illustrations/art-drafting.webp",
    badgeEn: "Studio Grade",
    badgeAr: "درجة استوديو فنية",
    sortOrder: 6,
  },
  {
    slug: "calculators-tech",
    nameEn: "Calculators & Desk Tech",
    nameAr: "الآلات الحاسبة وإلكترونيات المكتب",
    descriptionEn: "Scientific graphing calculators, solar financial calculators, LED desk lamps & Pomodoro timers.",
    descriptionAr: "آلات حاسبة علمية وبيانية، حاسبات مكتبية بالطاقة الشمسية، مصابيح LED ذكية ومؤقتات الدراسة.",
    imageUrl: "/images/category-illustrations/calculators.webp",
    badgeEn: "Exam Approved",
    badgeAr: "معتمدة للامتحانات",
    sortOrder: 7,
  },
];

export const INITIAL_PRODUCTS: NewProduct[] = [
  // 1. Notebooks
  {
    sku: "NB-ATELIER-01",
    categorySlug: "notebooks",
    titleEn: "Kyoto Linen Hardcover Dotted Journal A5 (Set of 2)",
    titleAr: "دفتر كيوتو بغلافتان من الكتان منقط حجم A5 (طقم من قطعتين)",
    descriptionEn: "Thread-bound lay-flat A5 journals featuring 120gsm ivory Japanese acid-free paper. Zero bleed-through with fountain pens and markers, complete with dual ribbon bookmarks and expandable inner pocket.",
    descriptionAr: "دفتر ملاحظات A5 يفتح بشكل مسطح بالكامل مع ورق ياباني عاجي بوزن 120 جرام خالٍ من الأحماض. مثالي لأقلام الحبر السائل دون تسرب، مزود بشريطين مرجعيين وجيب داخلي.",
    price: 24.90,
    originalPrice: 32.00,
    wholesalePrice: 17.50,
    wholesaleMinQty: 15,
    stock: 140,
    images: [
      "https://images.pexels.com/photos/8251117/pexels-photo-8251117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/1174122/pexels-photo-1174122.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "A5 (148 × 210 mm) • 192 Pages • 120 GSM Ivory Paper",
    specsAr: "حجم A5 • 192 صفحة • ورق عاجي 120 جرام",
  },
  {
    sku: "NB-SPIRAL-02",
    categorySlug: "notebooks",
    titleEn: "Academic Pro B5 Twin-Wire Grid Notebook Pack (5 pcs)",
    titleAr: "مجموعة دفاتر أكاديمية B5 بسلك مزدوج مربعات (5 قطع)",
    descriptionEn: "Engineered for university lectures and STEM notes. Micro-perforated 100gsm sheets with smart margin rules and color-coded polypropylene waterproof covers.",
    descriptionAr: "مصممة للمحاضرات الجامعية والملاحظات العلمية. أوراق بوزن 100 جرام قابلة للنزع الدقيق مع أغلفة مقاومة للماء بألوان متعددة.",
    price: 19.50,
    originalPrice: 24.00,
    wholesalePrice: 13.80,
    wholesaleMinQty: 20,
    stock: 280,
    images: [
      "https://images.pexels.com/photos/7657377/pexels-photo-7657377.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/867483/pexels-photo-867483.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: true,
    isHidden: false,
    specsEn: "B5 • 5 Notebooks × 120 Sheets • 100 GSM",
    specsAr: "حجم B5 • 5 دفاتر × 120 ورقة • 100 جرام",
  },
  {
    sku: "NB-PLANNER-03",
    categorySlug: "notebooks",
    titleEn: "Architect Weekly Desk Planner & Sticky Note Folio",
    titleAr: "منظم المكتب الأسبوعي وحافظة الملاحظات اللاصقة",
    descriptionEn: "Undated 52-week panoramic desk pad paired with 6 sizes of pastel architectural index tabs and grid sticky notes.",
    descriptionAr: "منظم مكتبي أسبوعي يكفي لمدة 52 أسبوعاً غير مؤرخ، مرفق مع 6 أحجام من الملاحظات اللاصقة وفواصل التصنيف.",
    price: 16.00,
    originalPrice: null,
    wholesalePrice: 11.20,
    wholesaleMinQty: 25,
    stock: 95,
    images: [
      "https://images.pexels.com/photos/1007025/pexels-photo-1007025.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/5594313/pexels-photo-5594313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "52 Tear-Off Sheets • 450 Sticky Notes Included",
    specsAr: "52 ورقة أسبوعية • 450 ملاحظة لاصقة مرفقة",
  },

  // 2. Fine Writing & Pens
  {
    sku: "WR-FOUNT-01",
    categorySlug: "writing",
    titleEn: "Meister Matte Black & Brass Fountain Pen (Fine Nib)",
    titleAr: "قلم حبر سائل مايستر أسود مطفي ونحاسي (ريشة دقيقة)",
    descriptionEn: "Balanced anodized aluminum barrel with a German iridium-tipped fine nib. Includes refillable piston converter and 2 archival midnight-blue ink cartridges.",
    descriptionAr: "هيكل متوازن من الألمنيوم المؤكسد مع ريشة ألمانية دقيقة مطلية بالإيريديوم. يشمل محول تعبئة وعبوتين من الحبر الأزرق الليلي.",
    price: 38.00,
    originalPrice: 48.00,
    wholesalePrice: 26.50,
    wholesaleMinQty: 10,
    stock: 85,
    images: [
      "/images/new/pen-fountain-01.jpg",
      "https://images.pexels.com/photos/3720819/pexels-photo-3720819.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "0.5mm Fine German Nib • Converter Included",
    specsAr: "ريشة ألمانية 0.5 ملم • مرفق مع محول تعبئة",
  },
  {
    sku: "WR-GEL-02",
    categorySlug: "writing",
    titleEn: "Sakura Smooth-Flow 0.5mm Gel Roller Set (12 Colors)",
    titleAr: "طقم أقلام جل ساكورا سريعة الجفاف 0.5 ملم (12 لوناً)",
    descriptionEn: "Instant-dry pigment gel ink prevents smudging for both left-handed and right-handed writers. Ergonomic silicone grip for marathon exam sessions.",
    descriptionAr: "حبر جل صبغي سريع الجفاف يمنع التلطخ لليد اليمنى واليسرى. قبضة سيليكون مريحة لجلسات الدراسة والامتحانات الطويلة.",
    price: 14.90,
    originalPrice: 18.50,
    wholesalePrice: 9.80,
    wholesaleMinQty: 24,
    stock: 320,
    images: [
      "/images/new/gel-sakura-01.jpg",
      "https://images.pexels.com/photos/1099813/pexels-photo-1099813.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "12 Pens • 0.5mm Twin-Ball Tip • Waterproof Ink",
    specsAr: "12 قلماً • رأس 0.5 ملم • حبر مقاوم للماء",
  },
  {
    sku: "WR-PASTEL-03",
    categorySlug: "writing",
    titleEn: "Nordic Dual-Tip Chisel & Fine Pastel Highlighters (8 Pack)",
    titleAr: "مجموعة أقلام تظليل باستيل مزدوجة الرأس (8 ألوان)",
    descriptionEn: "Soft muted tones that highlight key study passages without fatiguing the eyes. Features a 4mm chisel tip and a 1mm underlining tip.",
    descriptionAr: "ألوان باستيل هادئة تبرز النصوص المهمة دون إجهاد العين. مزودة برأس مشطوف 4 ملم ورأس دقيق 1 ملم للتسطير.",
    price: 11.50,
    originalPrice: null,
    wholesalePrice: 7.90,
    wholesaleMinQty: 30,
    stock: 210,
    images: [
      "https://images.pexels.com/photos/5088009/pexels-photo-5088009.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "8 Muted Tones • Dual Tip (4mm + 1mm)",
    specsAr: "8 ألوان هادئة • رأس مزدوج (4 ملم + 1 ملم)",
  },

  // 3. School Bags & Organizers
  {
    sku: "BG-PACK-01",
    categorySlug: "bags",
    titleEn: "Oslo Ergonomic 26L Waterproof Scholar & Laptop Backpack",
    titleAr: "حقيبة ظهر أوسلو المريحة المقاومة للماء سعة 26 لتر مع جيب للحاسوب",
    descriptionEn: "Orthopedic breathable back support, dedicated 16-inch suspended laptop compartment, hidden anti-theft pocket, and water-repellent ballistic nylon.",
    descriptionAr: "دعم طبي مريح للظهر قابل للتهوية، قسم مبطن مخصص لحاسوب محمول حتى 16 بوصة، جيب خفي مضاد للسرقة وقماش مقاوم للماء.",
    price: 59.00,
    originalPrice: 75.00,
    wholesalePrice: 41.00,
    wholesaleMinQty: 10,
    stock: 65,
    images: [
      "/images/new/bag-oslo-01.jpg",
      "https://images.pexels.com/photos/2901248/pexels-photo-2901248.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "26L Capacity • Fits 16\" Laptop • Water-Repellent",
    specsAr: "سعة 26 لتر • تناسب حاسوب 16 بوصة • مقاومة للماء",
  },
  {
    sku: "BG-CASE-02",
    categorySlug: "bags",
    titleEn: "Expandable Cordura Standing Pencil & Tech Pouch",
    titleAr: "مقلمة وحافظة تقنية قابلة للتوسيع من قماش كوردورا المتين",
    descriptionEn: "Holds up to 45 pens, a scientific calculator, USB cables, and power bank. Folds down into a magnetic standing desk caddy in seconds.",
    descriptionAr: "تتسع لـ 45 قلماً، آلة حاسبة علمية، كابلات USB وشاحن متنقل. تتحول إلى حامل مكتبي قائم بفضل المغناطيس المدمج.",
    price: 18.00,
    originalPrice: 22.00,
    wholesalePrice: 12.50,
    wholesaleMinQty: 20,
    stock: 150,
    images: [
      "https://images.pexels.com/photos/3304855/pexels-photo-3304855.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: true,
    isHidden: false,
    specsEn: "Cordura 1000D • Magnetic Stand • 6 Mesh Pockets",
    specsAr: "قماش كوردورا متين • قاعدة مغناطيسية • 6 جيوب داخلية",
  },
  {
    sku: "BG-TRAY-03",
    categorySlug: "bags",
    titleEn: "Modular Walnut & Matte Steel Desktop Organizer Suite",
    titleAr: "طقم تنظيم المكتب المعياري من خشب الجوز والفولاذ المطفي",
    descriptionEn: "4-piece interlocking desk tray system for documents, pens, smartphones, and sticky notes with non-slip cork base.",
    descriptionAr: "نظام تنظيم مكتبي مكون من 4 قطع متداخلة للمستندات والأقلام والهواتف الذكية مع قاعدة من الفلين المانع للانزلاق.",
    price: 34.00,
    originalPrice: null,
    wholesalePrice: 24.00,
    wholesaleMinQty: 12,
    stock: 50,
    images: [
      "/images/new/organizer-walnut-01.jpg",
      "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "4 Modular Pieces • Solid Walnut & Powder-Coated Steel",
    specsAr: "4 قطع معيارية • خشب جوز طبيعي وفولاذ مطلي",
  },

  // 4. IT Peripherals & Accessories
  {
    sku: "IT-KEY-01",
    categorySlug: "it-peripherals",
    titleEn: "KeyChronos Low-Profile Wireless Mechanical Keyboard (Tri-Mode)",
    titleAr: "لوحة مفاتيح ميكانيكية لاسلكية نحيفة كي-كرونوس (ثلاثية الاتصال)",
    descriptionEn: "Connect up to 3 devices via Bluetooth 5.2, 2.4GHz dongle, or USB-C. Hot-swappable tactile quiet switches with warm white backlight and Mac/Windows/Arabic keycap support.",
    descriptionAr: "اتصال بثلاثة أجهزة عبر البلوتوث 5.2 أو مستقبل 2.4 جيجاهرتز أو كابل USB-C. مفاتيح ميكانيكية هادئة مع إضاءة خلفية مريحة ودعم كامل لنظامي ماك وويندوز.",
    price: 89.00,
    originalPrice: 109.00,
    wholesalePrice: 64.00,
    wholesaleMinQty: 8,
    stock: 48,
    images: [
      "https://images.pexels.com/photos/38094551/pexels-photo-38094551.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/12512639/pexels-photo-12512639.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "75% Layout • Bluetooth 5.2 + 2.4GHz • 180h Battery",
    specsAr: "حجم 75% مدمج • بلوتوث 5.2 + لاسلكي • بطارية 180 ساعة",
  },
  {
    sku: "IT-MOUSE-02",
    categorySlug: "it-peripherals",
    titleEn: "ErgoFlow Master Silent Wireless Mouse (8000 DPI Sensor)",
    titleAr: "فأرة لاسلكية احترافية صامتة إيرغو-فلو (حساس 8000 DPI)",
    descriptionEn: "Sculpted thumb rest with electromagnetic MagSpeed scroll wheel and 95% quieter clicks. Tracks on glass and wood surfaces with USB-C quick charge.",
    descriptionAr: "تصميم مريح لليد مع عجلة تمرير كهرومغناطيسية فائقة السرعة ونقرات صامتة بنسبة 95%. تعمل على كافة الأسطح بما فيها الزجاج مع شحن سريع USB-C.",
    price: 49.00,
    originalPrice: 62.00,
    wholesalePrice: 35.00,
    wholesaleMinQty: 10,
    stock: 75,
    images: [
      "https://images.pexels.com/photos/7151696/pexels-photo-7151696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/9128856/pexels-photo-9128856.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "8000 DPI Glass Sensor • Silent Click • 70-Day Battery",
    specsAr: "حساس 8000 نقطة • نقرات صامتة • بطارية تدوم 70 يوماً",
  },
  {
    sku: "IT-HUB-03",
    categorySlug: "it-peripherals",
    titleEn: "HyperDock 10-in-1 Aluminum USB-C Hub & 1TB NVMe Enclosure",
    titleAr: "موزع USB-C احترافي 10 في 1 من الألمنيوم مع منفذ HDMI 4K",
    descriptionEn: "Features 4K@60Hz HDMI, Gigabit Ethernet, 100W PD pass-through charging, SD/TF card readers, and 4 high-speed USB 3.2 ports.",
    descriptionAr: "يضم منفذ HDMI بدقة 4K@60Hz، منفذ شبكة جيجابت، شحن سريع بقوة 100 واط، قارئ بطاقات ذاكرة و4 منافذ USB 3.2 فائقة السرعة.",
    price: 44.00,
    originalPrice: null,
    wholesalePrice: 31.00,
    wholesaleMinQty: 10,
    stock: 90,
    images: [
      "/images/new/hub-usbc-01.jpg",
      "https://images.pexels.com/photos/28228014/pexels-photo-28228014.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "4K 60Hz HDMI • 100W PD • 10Gbps USB 3.2",
    specsAr: "دعم 4K 60Hz • شحن 100 واط • سرعة نقل 10 جيجابت",
  },

  // 5. Ink, Toner & Consumables
  {
    sku: "INK-TONER-01",
    categorySlug: "ink-consumables",
    titleEn: "LaserJet Pro High-Yield Black Toner Cartridge (3,500 Pages)",
    titleAr: "خرطوشة تونر ليزر أسود عالية الإنتاجية (3500 صفحة)",
    descriptionEn: "Smart-chip equipped high-density monochrome laser toner producing razor-sharp text and technical diagrams without smudging.",
    descriptionAr: "خرطوشة تونر ليزر مزودة بشريحة ذكية لطباعة نصوص ومخططات هندسية فائقة الوضوح والكثافة دون تلطخ.",
    price: 42.00,
    originalPrice: 54.00,
    wholesalePrice: 29.50,
    wholesaleMinQty: 10,
    stock: 110,
    images: [
      "/images/new/toner-01.jpg",
      "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "3,500 Pages ISO Yield • Smart Chip • Crisp Black",
    specsAr: "إنتاجية 3500 صفحة • شريحة ذكية مدمجة • أسود فاحم",
  },
  {
    sku: "INK-CMYK-02",
    categorySlug: "ink-consumables",
    titleEn: "EcoTank CMYK Pigment Refill Ink Multipack (4 × 100ml Bottles)",
    titleAr: "طقم عبوات حبر إيكو-تانك الأربعة CMYK (4 × 100 مل)",
    descriptionEn: "Spill-free auto-stop nozzles delivering up to 7,500 color pages and 6,000 black pages with fade-resistant archival ink.",
    descriptionAr: "فوهات ذكية مانعة للانسكاب توفر طباعة حتى 7500 صفحة ملونة و6000 صفحة سوداء بحبر مقاوم للبهتان.",
    price: 29.90,
    originalPrice: 36.00,
    wholesalePrice: 21.00,
    wholesaleMinQty: 15,
    stock: 160,
    images: [
      "https://images.pexels.com/photos/2330137/pexels-photo-2330137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: true,
    isHidden: false,
    specsEn: "4 × 100ml (C/M/Y/K) • 7,500 Page Yield",
    specsAr: "4 عبوات × 100 مل • تكفي لطباعة 7500 صفحة",
  },
  {
    sku: "INK-PAPER-03",
    categorySlug: "ink-consumables",
    titleEn: "Atelier Ultra-White 90gsm A4 Laser & Inkjet Paper Box (5 Reams / 2500 Sheets)",
    titleAr: "صندوق ورق A4 فائق البياض 90 جرام للطباعة الليزرية والحبرية (5 رزم / 2500 ورقة)",
    descriptionEn: "High-opacity CIE 168 whiteness paper engineered for jam-free high-speed duplex printing in schools, copy centers, and corporate offices.",
    descriptionAr: "ورق فائق البياض والنعومة مصمم للطباعة المزدوجة عالية السرعة دون انحشار، مثالي للمدارس والمكاتب والشركات.",
    price: 32.50,
    originalPrice: null,
    wholesalePrice: 24.90,
    wholesaleMinQty: 10,
    stock: 400,
    images: [
      "/images/new/paper-a4-01.jpg",
      "https://images.pexels.com/photos/4226123/pexels-photo-4226123.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "5 Reams × 500 Sheets • 90 GSM • CIE 168 Whiteness",
    specsAr: "5 رزم × 500 ورقة • 90 جرام • بياض ناصع CIE 168",
  },

  // 6. Art & Technical Drafting
  {
    sku: "ART-MARK-01",
    categorySlug: "art-drafting",
    titleEn: "StudioPro 48-Color Dual-Tip Alcohol Art Markers in Carrying Case",
    titleAr: "حقيبة أقلام ماركر فنية مزدوجة الرأس 48 لوناً",
    descriptionEn: "Blendable alcohol-based ink with Japanese brush and broad chisel nibs for architecture rendering, illustration, and industrial design.",
    descriptionAr: "حبر كحولي قابل للدمج الاحترافي مع رأس فرشاة مرن ورأس عريض للرسم المعماري والتصميم الصناعي والفنون.",
    price: 45.00,
    originalPrice: 58.00,
    wholesalePrice: 31.50,
    wholesaleMinQty: 10,
    stock: 70,
    images: [
      "/images/new/markers-48-01.jpg",
      "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "48 Colors + Blender • Brush & Chisel Nibs",
    specsAr: "48 لوناً + قلم دمج • رأس فرشاة ورأس مشطوف",
  },
  {
    sku: "ART-GEOM-02",
    categorySlug: "art-drafting",
    titleEn: "Precision Solid Brass & Steel Architecture Compass & Drafting Kit",
    titleAr: "طقم الهندسة والرسم التقني الاحترافي من النحاس والفولاذ",
    descriptionEn: "Micro-screw adjustment giant bow compass, extension beam, anodized aluminum scale ruler, and metal protractor in a shockproof tin case.",
    descriptionAr: "فرجار هندسي دقيق ببرغي ضبط ميكروي، مسطرة مقياس من الألمنيوم المؤكسد ومنقلة معدنية داخل حافظة معدنية مقاومة للصدمات.",
    price: 22.00,
    originalPrice: null,
    wholesalePrice: 15.40,
    wholesaleMinQty: 15,
    stock: 115,
    images: [
      "/images/new/compass-brass-01.jpg",
      "https://images.pexels.com/photos/3772509/pexels-photo-3772509.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "9-Piece Metal Set • Micro-Adjust Wheel",
    specsAr: "طقم معدني من 9 قطع • عجلة ضبط دقيقة",
  },
  {
    sku: "ART-SKETCH-03",
    categorySlug: "art-drafting",
    titleEn: "A4 Cold-Press 300gsm Watercolor & Mixed Media Pad (30 Sheets)",
    titleAr: "كراسة رسم مائي وفنون مختلطة A4 بوزن 300 جرام (30 لوحة)",
    descriptionEn: "100% cotton-blend textured cold-press sheets glued on all 4 sides to prevent warping under heavy washes.",
    descriptionAr: "أوراق فنية بملمس بارد غنية بالقطن بوزن 300 جرام مثالية للألوان المائية والأكريليك والغواش دون تموج الورق.",
    price: 17.50,
    originalPrice: 21.00,
    wholesalePrice: 12.20,
    wholesaleMinQty: 20,
    stock: 90,
    images: [
      "https://images.pexels.com/photos/1028599/pexels-photo-1028599.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/37539/pexels-photo-37539.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: true,
    isHidden: false,
    specsEn: "A4 • 300 GSM Cold-Press • Acid-Free",
    specsAr: "حجم A4 • وزن 300 جرام • خالٍ من الأحماض",
  },

  // 7. Calculators & Desk Tech
  {
    sku: "CALC-SCI-01",
    categorySlug: "calculators-tech",
    titleEn: "GraphMaster FX-991EX High-Resolution Scientific Calculator (552 Functions)",
    titleAr: "آلة حاسبة علمية متطورة عالية الدقة (552 وظيفة حسابية)",
    descriptionEn: "Natural textbook display showing matrices, integrals, vectors, and spreadsheet calculations exactly as written in textbooks. Dual solar & battery powered.",
    descriptionAr: "شاشة عرض طبيعية تظهر المعادلات والمصفوفات والتكاملات تماماً كما في الكتب الدراسية. تعمل بالطاقة الشمسية والبطارية.",
    price: 27.50,
    originalPrice: 34.00,
    wholesalePrice: 19.80,
    wholesaleMinQty: 12,
    stock: 130,
    images: [
      "https://images.pexels.com/photos/6232444/pexels-photo-6232444.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/6232426/pexels-photo-6232426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "552 Functions • Natural Textbook LCD • Solar + Battery",
    specsAr: "552 وظيفة علمية • شاشة عرض طبيعية • طاقة مزدوجة",
  },
  {
    sku: "CALC-DESK-02",
    categorySlug: "calculators-tech",
    titleEn: "Tactile Mechanical-Switch 12-Digit Executive Financial Calculator",
    titleAr: "آلة حاسبة مكتبية مالية 12 رقماً بمفاتيح ميكانيكية مريحة",
    descriptionEn: "Tilted large LCD readout with crisp mechanical key switches, tax/margin keys, and brushed aluminum faceplate for accounting desks.",
    descriptionAr: "شاشة LCD كبيرة مائلة مع مفاتيح ميكانيكية سريعة الاستجابة وأزرار حساب الضرائب والربح وواجهة من الألمنيوم المصقول.",
    price: 21.00,
    originalPrice: null,
    wholesalePrice: 14.50,
    wholesaleMinQty: 15,
    stock: 80,
    images: [
      "/images/new/calculator-desk-01.jpg",
      "https://images.pexels.com/photos/399160/pexels-photo-399160.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "12-Digit Display • Mechanical Keys • GT & Tax Functions",
    specsAr: "شاشة 12 رقماً • مفاتيح ميكانيكية • وظائف المحاسبة والضرائب",
  },
  {
    sku: "CALC-LAMP-03",
    categorySlug: "calculators-tech",
    titleEn: "Luminaire Eye-Care Architect LED Desk Lamp with Wireless Charger",
    titleAr: "مصباح مكتب LED لحماية العين مع قاعدة شحن لاسلكي للهاتف",
    descriptionEn: "Flicker-free CRI 95+ studio lighting with 5 color temperatures (2700K–6500K), Pomodoro 45-minute study timer, and 15W Qi wireless charging pad.",
    descriptionAr: "إضاءة خالية من الوميض بمعيار CRI 95+ مع 5 درجات حرارة لونية، مؤقت دراسة ذكي وقاعدة شحن لاسلكي سريع بقوة 15 واط.",
    price: 46.00,
    originalPrice: 59.00,
    wholesalePrice: 32.00,
    wholesaleMinQty: 10,
    stock: 60,
    images: [
      "/images/new/lamp-led-01.jpg",
      "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    isFeatured: false,
    isPromotion: true,
    isHidden: false,
    specsEn: "CRI >95 Eye-Care • 15W Qi Wireless Pad • Study Timer",
    specsAr: "حماية للعين CRI 95+ • شاحن لاسلكي 15 واط • مؤقت دراسة",
  },
];

export const INITIAL_STORE_SETTINGS: NewStoreSettings = {
  storeNameEn: "Al Manhaj Company for Stationery",
  storeNameAr: "شركة المنهج للقرطاسية",
  taglineEn:
    "Office Tools • Engineering Equipment • School Supplies • Cabinets • Printer Ink & Computer Equipment",
  taglineAr:
    "أدوات مكتبية • معدات هندسية • أدوات مدرسية • خزائن مختلفة • حبر طابعات",
  whatsappNumber: "218912145050",
  contactEmail: "info@almanhaj.ly",
  contactPhone: "+218 91-214-5050",
  addressEn: "Al Bivi, Tripoli, Libya",
  addressAr: "البيفي، طرابلس، ليبيا",
  workingHoursEn: "Sat – Thu: 09:00 – 21:00",
  workingHoursAr: "السبت – الخميس: 09:00 صباحاً – 09:00 مساءً",
  currencyEn: "LYD",
  currencyAr: "د.ل",
  wholesaleDiscountTier1Pct: 15,
  wholesaleDiscountTier2Pct: 22,
  wholesaleDiscountTier3Pct: 30,
  wholesaleConditionsEn:
    "Enjoy instant B2B & institutional pricing for schools, universities, copy centers, and companies across Libya. Orders of 10+ units per SKU unlock Wholesale Price automatically. Free delivery in Tripoli on orders over 1,900 LYD and dedicated pro-forma invoicing via WhatsApp +218 91-214-5050.",
  wholesaleConditionsAr:
    "استفد من أسعار الجملة الفورية للمدارس والجامعات ومراكز الطباعة والشركات في ليبيا. الطلبات ابتداءً من 10 قطع للصنف الواحد تفعّل سعر الجملة تلقائياً، مع توصيل مجاني داخل طرابلس للطلبيات فوق 1,900 د.ل وفوترة احترافية مباشرة عبر واتساب 0912145050.",
  defaultTheme: "royal",
  heroSlides: [
    {
      id: "slide-1",
      imageUrl: "/images/new/hero-stationery-01.jpg",
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
    {
      id: "slide-2",
      imageUrl: "/images/new/hero-it-tech-01.jpg",
      badgeEn: "IT Peripherals & Office Consumables",
      badgeAr: "معدات المعلوماتية والأحبار والمستهلكات",
      titleEn: "High-Performance Workspace Tech & Original Toners",
      titleAr: "ملحقات الحاسوب الاحترافية وأحبار الطباعة عالية الإنتاجية",
      subtitleEn:
        "Equip your study desk or company office with wireless mechanical keyboards, ergonomic mice, and high-yield laser toners.",
      subtitleAr:
        "جهّز مكتبك أو مؤسستك بلوحات المفاتيح الميكانيكية اللاسلكية والفئران المريحة وخراطيش الليزر والأوراق الفاخرة.",
      ctaEn: "Shop IT & Consumables",
      ctaAr: "تسوّق التقنية والأحبار",
      targetCategory: "it-peripherals",
    },
    {
      id: "slide-3",
      imageUrl: "/images/new/hero-bts-01.jpg",
      badgeEn: "Retail & Wholesale B2B Supply",
      badgeAr: "البيع بالتقسيط وبالجملة للمؤسسات والمدارس",
      titleEn: "Complete Back-to-School & Bulk Institutional Packs",
      titleAr: "تجهيز شامل للعودة المدرسية وعروض خاصة للبيع بالجملة",
      subtitleEn:
        "Up to 30% wholesale discounts on school bags, scientific calculators, art markers, and A4 paper boxes.",
      subtitleAr:
        "خصومات تصل إلى 30% لطلبات الجملة على الحقائب المدرسية والآلات الحاسبة العلمية وأدوات الرسم وصناديق الورق.",
      ctaEn: "View Wholesale Offers",
      ctaAr: "عروض البيع بالجملة",
      targetCategory: "bags",
    },
  ],
  landscapeBanner: {
    imageUrl: "/images/new/landscape-01.jpg",
    badgeEn: "THE COMPLETE STUDIO & OFFICE ECOSYSTEM",
    badgeAr: "منظومة متكاملة للدراسة والمكاتب الحديثة",
    titleEn: "Where Traditional Paper Craftsmanship Meets Digital Productivity",
    titleAr: "حيث تلتقي حرفية الورق الفاخر مع أحدث تقنيات المكتب الرقمي",
    subtitleEn:
      "Every item in our catalog is tested for durability, archival quality, and daily ergonomics — available individually or in wholesale cartons with instant WhatsApp ordering.",
    subtitleAr:
      "كل منتج في كتالوجنا مختبر بعناية لضمان المتانة والجودة العالية والراحة اليومية — متوفر بالقطعة أو بكميات الجملة مع طلب فوري ومباشر عبر واتساب.",
    ctaEn: "Open Full Master Catalog",
    ctaAr: "افتح الكتالوج الشامل",
  },
};

let isInitialized = false;

export async function ensureDatabaseSeeded() {
  if (isInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge_en TEXT NOT NULL DEFAULT 'Collection',
      badge_ar TEXT NOT NULL DEFAULT 'مجموعة',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      original_price DOUBLE PRECISION,
      wholesale_price DOUBLE PRECISION NOT NULL,
      wholesale_min_qty INTEGER NOT NULL DEFAULT 10,
      stock INTEGER NOT NULL DEFAULT 50,
      images JSONB NOT NULL,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      is_promotion BOOLEAN NOT NULL DEFAULT false,
      is_hidden BOOLEAN NOT NULL DEFAULT false,
      specs_en TEXT NOT NULL DEFAULT '',
      specs_ar TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      store_name_en TEXT NOT NULL,
      store_name_ar TEXT NOT NULL,
      tagline_en TEXT NOT NULL,
      tagline_ar TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      address_en TEXT NOT NULL,
      address_ar TEXT NOT NULL,
      working_hours_en TEXT NOT NULL,
      working_hours_ar TEXT NOT NULL,
      currency_en TEXT NOT NULL DEFAULT 'LYD',
      currency_ar TEXT NOT NULL DEFAULT 'د.ل',
      wholesale_discount_tier1_pct INTEGER NOT NULL DEFAULT 15,
      wholesale_discount_tier2_pct INTEGER NOT NULL DEFAULT 22,
      wholesale_discount_tier3_pct INTEGER NOT NULL DEFAULT 30,
      wholesale_conditions_en TEXT NOT NULL,
      wholesale_conditions_ar TEXT NOT NULL,
      hero_slides JSONB NOT NULL,
      landscape_banner JSONB NOT NULL,
      default_theme TEXT NOT NULL DEFAULT 'atelier'
    );

    CREATE TABLE IF NOT EXISTS uploaded_images (
      id SERIAL PRIMARY KEY,
      original_name TEXT NOT NULL DEFAULT 'image',
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_phone_normalized TEXT NOT NULL,
      customer_notes TEXT NOT NULL DEFAULT '',
      items JSONB NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL DEFAULT 'LYD',
      status TEXT NOT NULL DEFAULT 'pending',
      status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders (customer_phone_normalized);
  `);

  // Migration: add is_hidden column if not exists (for existing DBs)
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;`);

  const [{ value: catCount }] = await db.select({ value: count() }).from(categories);
  if (catCount === 0) {
    await db.insert(categories).values(INITIAL_CATEGORIES);
  } else {
    // Upgrade category illustrative images to new high-quality (migrate old Pexels/cat-*.jpg)
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/notebooks.webp' WHERE slug='notebooks'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/writing.webp' WHERE slug='writing'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/bags.webp' WHERE slug='bags'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/it-accessories.webp' WHERE slug='it-peripherals'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/ink-toner.webp' WHERE slug='ink-consumables'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/art-drafting.webp' WHERE slug='art-drafting'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/calculators.webp' WHERE slug='calculators-tech'`);
  }

  const [{ value: prodCount }] = await db.select({ value: count() }).from(products);
  if (prodCount === 0) {
    await db.insert(products).values(
      INITIAL_PRODUCTS.map((product) => ({
        ...product,
        price: toLyd(product.price),
        originalPrice: toLydOrNull(product.originalPrice),
        wholesalePrice: toLyd(product.wholesalePrice),
      }))
    );
  }

  const existingSettings = await db.select().from(storeSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(storeSettings).values(INITIAL_STORE_SETTINGS);
  } else {
    const current = existingSettings[0];
    if (current.currencyEn !== "LYD") {
      await pool.query(`
        UPDATE products SET
          price = ROUND((price * 5.5)::numeric, 2),
          original_price = CASE
            WHEN original_price IS NULL THEN NULL
            ELSE ROUND((original_price * 5.5)::numeric, 2)
          END,
          wholesale_price = ROUND((wholesale_price * 5.5)::numeric, 2)
      `);
    }
    await db
      .update(storeSettings)
      .set(INITIAL_STORE_SETTINGS)
      .where(eq(storeSettings.id, current.id));
  }

  isInitialized = true;
}
