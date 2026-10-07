import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const [settings] = await db.select().from(storeSettings).limit(1);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await request.json();
    const [existing] = await db.select().from(storeSettings).limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Settings record not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(storeSettings)
      .set({
        storeNameEn: String(body.storeNameEn ?? existing.storeNameEn),
        storeNameAr: String(body.storeNameAr ?? existing.storeNameAr),
        // ----- Editable homepage content -----
        announcementEnabled:
          typeof body.announcementEnabled === "boolean"
            ? body.announcementEnabled
            : existing.announcementEnabled,
        announcementEn: String(body.announcementEn ?? existing.announcementEn),
        announcementAr: String(body.announcementAr ?? existing.announcementAr),
        announcementShortEn: String(
          body.announcementShortEn ?? existing.announcementShortEn
        ),
        announcementShortAr: String(
          body.announcementShortAr ?? existing.announcementShortAr
        ),
        announcementNoteEn: String(
          body.announcementNoteEn ?? existing.announcementNoteEn
        ),
        announcementNoteAr: String(
          body.announcementNoteAr ?? existing.announcementNoteAr
        ),
        headerTaglineEn: String(
          body.headerTaglineEn ?? existing.headerTaglineEn
        ),
        headerTaglineAr: String(
          body.headerTaglineAr ?? existing.headerTaglineAr
        ),
        storefrontImage: String(
          body.storefrontImage ?? existing.storefrontImage
        ),
        storefrontBadgeEn: String(
          body.storefrontBadgeEn ?? existing.storefrontBadgeEn
        ),
        storefrontBadgeAr: String(
          body.storefrontBadgeAr ?? existing.storefrontBadgeAr
        ),
        storefrontTitleEn: String(
          body.storefrontTitleEn ?? existing.storefrontTitleEn
        ),
        storefrontTitleAr: String(
          body.storefrontTitleAr ?? existing.storefrontTitleAr
        ),
        storefrontSubtitleEn: String(
          body.storefrontSubtitleEn ?? existing.storefrontSubtitleEn
        ),
        storefrontSubtitleAr: String(
          body.storefrontSubtitleAr ?? existing.storefrontSubtitleAr
        ),
        storefrontDescriptionEn: String(
          body.storefrontDescriptionEn ?? existing.storefrontDescriptionEn
        ),
        storefrontDescriptionAr: String(
          body.storefrontDescriptionAr ?? existing.storefrontDescriptionAr
        ),
        taglineEn: String(body.taglineEn ?? existing.taglineEn),
        taglineAr: String(body.taglineAr ?? existing.taglineAr),
        whatsappNumber: String(body.whatsappNumber ?? existing.whatsappNumber),
        contactEmail: String(body.contactEmail ?? existing.contactEmail),
        contactPhone: String(body.contactPhone ?? existing.contactPhone),
        addressEn: String(body.addressEn ?? existing.addressEn),
        addressAr: String(body.addressAr ?? existing.addressAr),
        workingHoursEn: String(body.workingHoursEn ?? existing.workingHoursEn),
        workingHoursAr: String(body.workingHoursAr ?? existing.workingHoursAr),
        currencyEn: String(body.currencyEn ?? existing.currencyEn),
        currencyAr: String(body.currencyAr ?? existing.currencyAr),
        wholesaleDiscountTier1Pct: Number(
          body.wholesaleDiscountTier1Pct ?? existing.wholesaleDiscountTier1Pct
        ),
        wholesaleDiscountTier2Pct: Number(
          body.wholesaleDiscountTier2Pct ?? existing.wholesaleDiscountTier2Pct
        ),
        wholesaleDiscountTier3Pct: Number(
          body.wholesaleDiscountTier3Pct ?? existing.wholesaleDiscountTier3Pct
        ),
        wholesaleConditionsEn: String(
          body.wholesaleConditionsEn ?? existing.wholesaleConditionsEn
        ),
        wholesaleConditionsAr: String(
          body.wholesaleConditionsAr ?? existing.wholesaleConditionsAr
        ),
        heroSlides: Array.isArray(body.heroSlides)
          ? body.heroSlides
          : existing.heroSlides,
        landscapeBanner: body.landscapeBanner ?? existing.landscapeBanner,
        defaultTheme: String(body.defaultTheme ?? existing.defaultTheme),
      })
      .where(eq(storeSettings.id, existing.id))
      .returning();

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
