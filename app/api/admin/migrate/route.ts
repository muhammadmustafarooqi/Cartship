import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Banner from "@/models/Banner";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Allow authenticated admin or secret query param
  const session = await auth();
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const isValidSecret = secret && secret === process.env.NEXTAUTH_SECRET;

  if (!session && !isValidSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // 1. Find products with cloudinary URLs
    const productsWithCloudinary = await Product.find({
      images: { $regex: "cloudinary.com" },
    }).lean();

    let updatedProducts = 0;
    for (const p of productsWithCloudinary) {
      const validImages = (p.images || []).filter(
        (img: string) => !img.includes("cloudinary.com")
      );
      const replacementImages =
        validImages.length > 0
          ? validImages
          : [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
            ];

      await Product.findByIdAndUpdate(p._id, {
        $set: { images: replacementImages },
      });
      updatedProducts++;
    }

    // 2. Categories with cloudinary
    const updatedCategories = await Category.updateMany(
      { image: { $regex: "cloudinary.com" } },
      {
        $set: {
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        },
      }
    );

    // 3. Banners with cloudinary
    const updatedBanners = await Banner.updateMany(
      { image: { $regex: "cloudinary.com" } },
      {
        $set: {
          image:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully!",
      updatedProducts,
      updatedCategories: updatedCategories.modifiedCount,
      updatedBanners: updatedBanners.modifiedCount,
    });
  } catch (error) {
    console.error("Live migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
