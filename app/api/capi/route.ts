import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "936202355839835";
    const capiToken = process.env.META_CAPI_TOKEN;

    if (!capiToken) {
      return NextResponse.json({ error: "Meta CAPI token missing" }, { status: 500 });
    }

    const body = await request.json();
    const { eventName, eventID, customData, sourceUrl } = body;

    if (!eventName || !eventID) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const eventPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: eventID,
          event_source_url: sourceUrl || request.url,
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: userAgent,
          },
          custom_data: customData || {}
        }
      ]
    };

    const capiResponse = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    if (!capiResponse.ok) {
      const errData = await capiResponse.text();
      console.error(`Meta CAPI Error for ${eventName}:`, errData);
      return NextResponse.json({ error: "Meta API Error", details: errData }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CAPI route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
