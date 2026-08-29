import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getImageKit, getImageKitConfig } from "@/lib/imagekit";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getImageKitConfig();
  if (!config) {
    return NextResponse.json(
      { error: "ImageKit is not configured in .env.local" },
      { status: 503 }
    );
  }

  try {
    const imagekit = getImageKit();
    const authParams = imagekit.getAuthenticationParameters();

    return NextResponse.json({
      ...authParams,
      publicKey: config.publicKey,
      urlEndpoint: config.urlEndpoint,
    });
  } catch (error) {
    console.error("ImageKit auth signature error:", error);
    return NextResponse.json(
      { error: "Failed to generate ImageKit authentication parameters" },
      { status: 500 }
    );
  }
}
