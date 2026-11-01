import type { Metadata } from "next";
import Link from "next/link";
import { SeoPageShell } from "@/components/SeoPageShell";
import { pageMetadata } from "@/lib/seo";

/**
 * Page 404 réelle (statut HTTP 404, contenu utile).
 *
 * Sans `not-found.tsx`, Next renvoyait sa page par défaut en anglais, sans lien
 * de retour : une impasse d'exploration. Celle-ci renvoie vers le catalogue et
 * les rayons, et reste en `noindex` (une 404 ne doit jamais être indexée).
 */
export const metadata: Metadata = pageMetadata({
  title: "الصفحة غير موجودة | Page not found — المنهج",
  description:
    "The page you requested does not exist. Browse the Al Manhaj catalogue of stationery, office and engineering supplies in Tripoli.",
  path: "/404",
  noindex: true,
});

const SUGGESTIONS = [
  { href: "/catalogue", label: "الكتالوج الكامل / Full catalogue" },
  { href: "/vente-en-ligne", label: "البيع أونلاين / Online sales" },
  { href: "/wholesale", label: "البيع بالجملة / Wholesale B2B" },
  { href: "/services", label: "خدمات الطباعة / Printing services" },
  { href: "/magasin", label: "المغازن — البيفي، طرابلس / Our store" },
];

export default function NotFound() {
  return (
    <SeoPageShell breadcrumbs={[{ name: "404", path: "/404" }]}>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-5xl font-black text-[#E30613]">404</p>
        <h1 className="mt-2 text-2xl font-black">الصفحة غير موجودة — Page not found</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-700">
          قد يكون الرابط قديماً أو أن المنتج أُزيل من الكتالوج. استخدم الروابط
          التالية للمتابعة، أو اتصل بنا على واتساب{" "}
          <span dir="ltr">+218 91-214-5050</span>.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded border border-zinc-200 px-3 py-2 text-sm font-bold hover:border-[#E30613] hover:text-[#E30613]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-[#E30613] hover:underline">
          ← العودة إلى الصفحة الرئيسية
        </Link>
      </section>
    </SeoPageShell>
  );
}
