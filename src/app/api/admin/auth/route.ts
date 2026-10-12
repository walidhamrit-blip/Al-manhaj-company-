import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_TOKEN } from "@/lib/admin-auth";

// Fallback password for local development and previews ONLY. In production the
// route is fail-closed: without ADMIN_PASSWORD it answers 503 and the admin
// panel stays locked, instead of silently accepting the well-known demo value.
const DEMO_PASSWORD = "admin2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isProduction = process.env.VERCEL_ENV === "production";
    const configured = process.env.ADMIN_PASSWORD?.trim();

    // Fail-closed: in production, a missing ADMIN_PASSWORD must never fall
    // back to the demo password — the gate stays locked (503) instead.
    if (isProduction && !configured) {
      return NextResponse.json(
        {
          authenticated: false,
          error:
            "Admin access is not configured: set ADMIN_PASSWORD in the Vercel Production environment variables.",
        },
        { status: 503 }
      );
    }

    const expectedPassword = configured || DEMO_PASSWORD;
    const provided = String(body.password || "").trim();

    if (provided === expectedPassword) {
      return NextResponse.json({
        authenticated: true,
        token: ADMIN_SESSION_TOKEN,
      });
    }

    // The demo hint is returned ONLY outside production, and only while the
    // fallback password is the one actually in use (ADMIN_PASSWORD not set).
    const demo =
      !isProduction && expectedPassword === DEMO_PASSWORD
        ? {
            demoHint: "Local/preview demo password",
            demoPassword: DEMO_PASSWORD,
          }
        : {};

    return NextResponse.json(
      {
        authenticated: false,
        error: "Invalid administrator password",
        ...demo,
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
