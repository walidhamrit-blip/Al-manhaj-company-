import Link from "next/link";
export const metadata = { title: "الشروط والأحكام | Terms - المنهج" };
export default function TermsPage(){
  return (
    <div dir="rtl" className="min-h-screen bg-[#FFFBF5] text-zinc-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:underline mb-6">← العودة للمتجر</Link>
        <h1 className="text-3xl font-black mb-2">الشروط والأحكام وسياسة البيع</h1>
        <p className="text-sm text-zinc-500 mb-8">Terms & Conditions — شركة المنهج للقرطاسية — البيفي، طرابلس — +218 91-214-5050</p>
        <div className="space-y-6 text-sm leading-7 bg-white rounded-2xl border p-6 shadow-sm">
          <section><h2 className="font-extrabold text-base">1. الأسعار والدفع</h2><p>جميع الأسعار بالدينار الليبي (د.ل) شاملة الضريبة حيث تنطبق، مع عرض سعر التجزئة وسعر الجملة (10+، 50+، 200+). الدفع حالياً: نقداً عند الاستلام أو تحويل مصرفي/محفظة عبر واتساب. عند تفعيل بوابة الدفع المرخصة من CBL (تداول/ معاملات/ LYPay) سيظهر خيار الدفع الإلكتروني مع إيصال فوري.</p></section>
          <section><h2 className="font-extrabold text-base">2. الطلب والتوثيق</h2><p>الطلب عبر "أضف للسلة → إرسال واتساب" يعتبر عرض شراء. نؤكد التوفر والسعر عبر واتساب قبل الشحن. نحتفظ بحق إلغاء الطلب في حال نفاد المخزون أو خطأ تسعير واضح مع استرداد كامل.</p></section>
          <section><h2 className="font-extrabold text-base">3. التوصيل</h2><p>طرابلس: توصيل مجاني فوق 1,900 د.ل، خلاف ذلك 15-25 د.ل خلال 24-48 ساعة. خارج طرابلس عبر شركات الشحن (2-4 أيام) — التكلفة حسب الوزن والمسافة تُحدد على واتساب.</p></section>
          <section><h2 className="font-extrabold text-base">4. الاسترجاع والاستبدال (حماية المستهلك)</h2><ul className="list-disc pr-5 space-y-1"><li>14 يوم استرجاع للمنتجات غير المفتوحة/غير المستخدمة بحالتها الأصلية (باستثناء الأحبار المفتوحة والورق المقطع).</li><li>عيوب مصنع: استبدال فوري أو استرداد خلال 7 أيام مع صور المنتج.</li><li>تواصل: 0912145050 واتساب مع رقم الطلب.</li></ul></section>
          <section><h2 className="font-extrabold text-base">5. الضمان</h2><p>الأجهزة (طابعات، حاسبات، مصابيح) بضمان الموزع 6-12 شهر. لا يشمل سوء الاستخدام.</p></section>
          <section><h2 className="font-extrabold text-base">6. منصة موثوق</h2><p>متجرنا قيد التسجيل في منصة موثوق التابعة لشبكة التجارة الليبية بوزارة الاقتصاد والتجارة. بعد الحصول على الترخيص سيظهر رقم الترخيص والشارة في الفوتر ويحق للزبون التحقق عبر mawthooq.ly</p></section>
          <section><h2 className="font-extrabold text-base">7. القانون النافذ</h2><p>يخضع هذا الاتفاق للقانون الليبي، وتعليمات مصرف ليبيا المركزي للدفع الإلكتروني. النزاعات تحل ودياً ثم أمام محاكم طرابلس المختصة.</p></section>
        </div>
      </div>
    </div>
  );
}
