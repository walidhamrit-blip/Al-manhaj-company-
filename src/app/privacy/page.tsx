import Link from "next/link";

export const metadata = { title: "سياسة الخصوصية | Privacy Policy - المنهج" };

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FFFBF5] text-zinc-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:underline mb-6">← العودة للمتجر / Back to Store</Link>
        <h1 className="text-3xl font-black mb-2">سياسة الخصوصية</h1>
        <p className="text-sm text-zinc-500 mb-8">Privacy Policy — شركة المنهج للقرطاسية • آخر تحديث: مايو 2026 — متوافقة مع لائحة الدفع الإلكتروني CBL ومتطلبات منصة موثوق بوزارة الاقتصاد</p>

        <div className="space-y-6 text-sm leading-7 bg-white rounded-2xl border p-6 shadow-sm">
          <section>
            <h2 className="font-extrabold text-base">1. من نحن</h2>
            <p>شركة المنهج للقرطاسية — البيفي، طرابلس، ليبيا. هاتف: ‎+218 91-214-5050‬ — بريد: info@almanhaj.ly — <span className="bg-amber-100 px-1 rounded font-mono text-xs">رقم السجل التجاري: [XXXXXX] — ترخيص موثوق: [MTQ-XXXX]</span> <br/>أدخل أرقامك الحقيقية من Admin → Settings بعد استلام ترخيص موثوق.</p>
          </section>
          <section>
            <h2 className="font-extrabold text-base">2. البيانات التي نجمعها</h2>
            <ul className="list-disc pr-5 space-y-1">
              <li>ما تدخله عند الطلب عبر واتساب: الاسم، الهاتف، العنوان، تفاصيل السلة.</li>
              <li>بيانات تقنية: عنوان IP، نوع الجهاز، تفضيل اللغة (العربية/English) لتذكر السلة.</li>
              <li>لا نجمع بيانات بطاقات بنكية على موقعنا — الدفع يتم عبر مزودي الدفع المرخصين من مصرف ليبيا المركزي (مواصلات، تداول، مسارات، LYPay) عند تفعيل الدفع الإلكتروني.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-extrabold text-base">3. لماذا نستخدم بياناتك (CBL Art. 5)</h2>
            <p>تنفيذ الطلب، التواصل واتساب، التوصيل، الفوترة، الامتثال لمكافحة غسل الأموال (AML/CFT) حسب تعليمات مصرف ليبيا المركزي، وتحسين الخدمة. لا نبيع بياناتك لأطراف ثالثة.</p>
          </section>
          <section>
            <h2 className="font-extrabold text-base">4. ملفات تعريف الارتباط (Cookies)</h2>
            <p>نستخدم ملفات ضرورية فقط: تذكر سلة التسوق، اللغة، والثيم. لا إعلانات تتبع. يمكنك حذفها من إعدادات المتصفح وسيظهر لك بانر الموافقة عند أول زيارة — موافق عليه = متابعة التصفح.</p>
          </section>
          <section>
            <h2 className="font-extrabold text-base">5. التخزين والمدة</h2>
            <p>الطلبات تُحفظ في قاعدة بيانات Neon مشفرة (Frankfurt) لمدة 5 سنوات لأغراض المحاسبة والضمان. يمكنك طلب الحذف عبر واتساب 0912145050 مع مراعاة الالتزامات القانونية.</p>
          </section>
          <section>
            <h2 className="font-extrabold text-base">6. حقوقك</h2>
            <p>الوصول، التصحيح، الحذف، الاعتراض على المعالجة — تواصل عبر info@almanhaj.ly أو ‎+218 91-214-5050‬. سنرد خلال 72 ساعة.</p>
          </section>
          <section>
            <h2 className="font-extrabold text-base">7. الاتصال والشكاوى</h2>
            <p>للشكاوى المتعلقة بالدفع: أولاً تواصل معنا، ثم يمكنك التصعيد لمزود الدفع المرخص أو لمنصة LYPay التابعة لمصرف ليبيا المركزي: Lypay.gov.ly</p>
          </section>
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs leading-5">
          <b>ملاحظة للمالك:</b> بعد استلام ترخيص موثوق، عدّل هذا النص من الملف <code>src/app/privacy/page.tsx</code> واستبدل [XXXXXX] برقمك الحقيقي، ثم ادفع على Vercel.
        </div>
      </div>
    </div>
  );
}
