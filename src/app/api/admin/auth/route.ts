import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_TOKEN } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin2026";
    const provided = String(body.password || "").trim();

    if (provided === expectedPassword) {
      return NextResponse.json({
        authenticated: true,
        token: ADMIN_SESSION_TOKEN,
      });
    }

    return NextResponse.json(
      { authenticated: false, error: "Invalid administrator password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
