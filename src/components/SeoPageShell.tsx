import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE, whatsappUrl } from "@/lib/site";

export type Crumb = { name: string; path: string };

/**
 * Gabarit commun aux pages **rendues côté serveur** et destinées à l'indexation
 * (`/catalogue`, `/categories/[slug]`, `/produits/[slug]`, 404).
 *
 * Le site d'origine est une application cliente : la navigation, les filtres et
 * les fiches produits s'ouvrent dans des modales, sans URL. Ces pages-ci
 * apportent ce qui manquait à l'exploration :
 *
 *  - un vrai `<h1>` unique par page ;
 *  - un fil d'Ariane visible **et** en JSON-LD ;
 *  - des liens `<a>`/`<Link>` vers le reste du catalogue (maillage interne) ;
 *  - le NAP complet en pied de page, répété sur toutes les pages (cohérence
 *    des citations locales pour Google et pour les moteurs génératifs).
 */
export function SeoPageShell({
  children,
  breadcrumbs,
}: {
  children: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  const trail: Crumb[] = [{ name: "الرئيسية / Home", path: "/" }, ...(breadcrumbs ?? [])];

  return (
    <div dir="rtl" className="min-h-screen bg-[#EEEEEE] text-[#1A1A1A]">
      <header className="border-b border-black/10 bg-white">
        <div className="storefront-shell flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-sm font-black">{SITE.nameAr}</span>
              <span className="block text-[11px] font-semibold text-zinc-500">
                {SITE.nameEn}
              </span>
            </span>
          </Link>

          <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold">
            <Link href="/" className="hover:text-[#E30613] hover:underline">المتجر</Link>
            <Link href="/catalogue" className="hover:text-[#E30613] hover:underline">الكتالوج</Link>
            <Link href="/vente-en-ligne" className="hover:text-[#E30613] hover:underline">البيع أونلاين</Link>
            <Link href="/wholesale" className="hover:text-[#E30613] hover:underline">البيع بالجملة</Link>
            <Link href="/services" className="hover:text-[#E30613] hover:underline">الخدمات</Link>
            <Link href="/magasin" className="hover:text-[#E30613] hover:underline">المغازن</Link>
          </nav>
        </div>
      </header>

      <div className="storefront-shell py-4">
        {breadcrumbs ? (
          <>
            <JsonLd data={breadcrumbJsonLd(trail)} />
            <nav aria-label="مسار التصفح" className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
              {trail.map((crumb, index) => {
                const isLast = index === trail.length - 1;
                return (
                  <span key={crumb.path} className="flex items-center gap-1.5">
                    {isLast ? (
                      <span aria-current="page" className="text-zinc-800">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.path} className="hover:text-[#E30613] hover:underline">
                        {crumb.name}
                      </Link>
                    )}
                    {!isLast && <span className="text-zinc-400">/</span>}
                  </span>
                );
              })}
            </nav>
          </>
        ) : null}
        <main>{children}</main>
      </div>

      <footer className="mt-10 bg-[#171717] text-white">
        <div className="storefront-shell grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="mb-2 text-sm font-extrabold">{SITE.nameAr}</h2>
            <p className="text-xs leading-6 text-neutral-300">{SITE.taglineAr}</p>
            <p className="mt-3 text-xs leading-6 text-neutral-300" dir="ltr">
              {SITE.street} — {SITE.locality}, {SITE.countryName}
              <br />
              {SITE.phoneDisplay} · {SITE.email}
            </p>
          </div>
          <div className="text-xs leading-6 text-neutral-300">
            <h2 className="mb-2 text-sm font-extrabold text-white">أوقات العمل</h2>
            <p>
              السبت – الخميس: 09:00 – 21:00
              <br />
              الجمعة: مغلق
            </p>
            <p className="mt-2">التوصيل داخل طرابلس 24–48 ساعة، ومجاناً فوق 1,900 د.ل.</p>
          </div>
          <div className="text-xs leading-6">
            <h2 className="mb-2 text-sm font-extrabold text-white">روابط</h2>
            <ul className="space-y-1 text-neutral-300">
              <li><Link href="/catalogue" className="hover:underline">كل المنتجات والكتالوج</Link></li>
              <li><Link href="/returns" className="hover:underline">الاسترجاع والشحن</Link></li>
              <li><Link href="/terms" className="hover:underline">الشروط والأحكام</Link></li>
              <li><Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link></li>
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noopener" className="hover:underline">
                  واتساب {SITE.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-3 text-center text-[11px] text-neutral-400">
          © {new Date().getFullYear()} {SITE.legalNameAr} — {SITE.legalNameEn}
        </div>
      </footer>
    </div>
  );
}
