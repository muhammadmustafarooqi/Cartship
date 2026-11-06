import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const rawId =
    process.env.ADSENSE_PUB_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    "pub-0000000000000000";

  // Normalize ca-pub-XXXX to pub-XXXX
  const pubId = rawId.replace(/^ca-/, "");

  const content = [
    "# Google AdSense Authorized Digital Sellers (ads.txt)",
    `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`,
    "",
  ].join("\n");

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

