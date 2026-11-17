import { NextRequest } from "next/server";
import { GET as merchantFeedGet } from "@/app/merchant-feed.xml/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return merchantFeedGet(request);
}
