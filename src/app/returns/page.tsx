import Link from "next/link";
export const metadata = { title: "الاسترجاع والشحن | Returns - المنهج" };
export default function ReturnsPage(){
  return (
    <div dir="rtl" className="min-h-screen bg-[#FFFBF5] text-zinc-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:underline mb-6">← العودة للمتجر</Link>
        <h1 className="text-3xl font-black mb-2">الاسترجاع والشحن</h1>
        <p className="text-sm text-zinc-500 mb-8">Shipping & Returns — وضوح كامل حسب توجيهات حماية المستهلك</p>
        <div className="space-y-6 text-sm leading-7 bg-white rounded-2xl border p-6 shadow-sm">
          <section><h2 className="font-extrabold">الشحن</h2><p>طرابلس مجاناً فوق 1,900 د.ل. مدة 1-2 يوم. باقي ليبيا 20-45 د.ل حسب الوزن (يُحتسب على واتساب قبل الشحن). تغليف آمن للورق والأحبار.</p></section>
          <section><h2 className="font-extrabold">الاسترجاع خلال 14 يوم</h2><p>شرط عدم الفتح/الاستخدام. تواصل واتساب 0912145050 مع صور. نرسل مندوب للاستلام بطرابلس أو ترجع عبر الشحن (تكلفة الإرجاع على المشتري إلا في حالة العيب).</p></section>
          <section><h2 className="font-extrabold">الاستثناءات</h2><p>الأحبار المفتوحة، الورق المقطوع حسب الطلب، المنتجات المخفضة نهائياً لا تسترجع إلا لعيب مصنعي.</p></section>
        </div>
      </div>
    </div>
  );
}
