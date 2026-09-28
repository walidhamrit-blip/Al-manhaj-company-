import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploadedImages } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

const ADMIN_TOKEN = "atelier-admin-session-2026";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Detect the real image format from the file's first bytes ("magic numbers").
 * We never trust the browser-provided MIME type: many phones / Windows report
 * "image/jpg", "application/octet-stream" or an empty string for normal JPGs.
 */
function detectImageMime(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  // GIF: "GIF8"
  if (bytes.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  // ISO-BMFF based formats: ....ftypXXXX
  if (bytes.toString("ascii", 4, 8) === "ftyp") {
    const brand = bytes.toString("ascii", 8, 12).toLowerCase();
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand))
      return "image/heic";
  }
  // BMP: "BM"
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  return null;
}

interface ParsedUpload {
  token: string;
  name: string;
  bytes: Buffer;
}

async function parseUpload(request: NextRequest): Promise<ParsedUpload | { error: string; status: number }> {
  const contentType = request.headers.get("content-type") || "";
  const headerToken = request.headers.get("x-admin-token") || "";

  // Preferred path: JSON body with base64 data (most robust behind proxies).
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.data !== "string") {
      return { error: "Missing image data", status: 400 };
    }
    const base64 = body.data.includes(",") ? body.data.split(",").pop() || "" : body.data;
    return {
      token: String(body.token || headerToken),
      name: String(body.name || "image"),
      bytes: Buffer.from(base64, "base64"),
    };
  }

  // Fallback path: classic multipart/form-data.
  const formData = await request.formData().catch(() => null);
  if (!formData) return { error: "Invalid upload body", status: 400 };
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "No image file provided", status: 400 };
  }
  return {
    token: String(formData.get("token") || headerToken),
    name: file.name || "image",
    bytes: Buffer.from(await file.arrayBuffer()),
  };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseUpload(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    if (parsed.token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: "Admin session expired — please log in again." },
        { status: 401 }
      );
    }

    if (parsed.bytes.length === 0) {
      return NextResponse.json({ error: "The image file is empty." }, { status: 400 });
    }

    if (parsed.bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 8 MB)." }, { status: 413 });
    }

    const mimeType = detectImageMime(parsed.bytes);
    if (!mimeType) {
      return NextResponse.json(
        { error: "This file is not a valid image (JPG, PNG, WEBP, GIF)." },
        { status: 415 }
      );
    }
    if (mimeType === "image/heic") {
      return NextResponse.json(
        {
          error:
            "HEIC photos are not supported by browsers. Please export the photo as JPG.",
        },
        { status: 415 }
      );
    }

    await ensureDatabaseSeeded();

    const [saved] = await db
      .insert(uploadedImages)
      .values({
        originalName: parsed.name.slice(0, 200),
        mimeType,
        sizeBytes: parsed.bytes.length,
        dataBase64: parsed.bytes.toString("base64"),
      })
      .returning({ id: uploadedImages.id });

    return NextResponse.json(
      {
        id: saved.id,
        url: `/api/uploads/${saved.id}`,
        name: parsed.name,
        size: parsed.bytes.length,
        mimeType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/uploads error:", error);
    return NextResponse.json(
      { error: "Upload failed on the server. Please try again." },
      { status: 500 }
    );
  }
}
