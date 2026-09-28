import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploadedImages } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { id } = await context.params;
    const imageId = Number(id);
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
    }

    const [image] = await db
      .select({
        mimeType: uploadedImages.mimeType,
        dataBase64: uploadedImages.dataBase64,
      })
      .from(uploadedImages)
      .where(eq(uploadedImages.id, imageId))
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const bytes = Buffer.from(image.dataBase64, "base64");

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(bytes.length),
        // Uploaded images are immutable (new upload = new id), cache aggressively.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/[id] error:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
