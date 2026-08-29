import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { uploadImageBuffer } from "@/lib/imagekit";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(id).select("_id").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Please choose a photo to upload" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { url } = await uploadImageBuffer(
      buffer,
      file.type,
      "cartship/reviews"
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Review image upload error:", error);
    if (error instanceof Error && error.message === "IMAGEKIT_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error:
            "Photo upload is not available right now. You can still post your review without a photo.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
