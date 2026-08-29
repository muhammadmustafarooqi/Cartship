import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getImageKit, getImageKitConfig } from "@/lib/imagekit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getImageKitConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env.local",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const imagekit = getImageKit();
    const isVideo = file.type.startsWith("video/");
    const safeFileName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, "_") : `file_${Date.now()}`;

    const result = await imagekit.upload({
      file: base64,
      fileName: safeFileName,
      folder: isVideo ? "/cartship/videos" : "/cartship",
      useUniqueFileName: true,
      isPrivateFile: false,
    });

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      publicId: result.fileId, // backwards compatibility
      name: result.name,
      filePath: result.filePath,
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to upload file to ImageKit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
