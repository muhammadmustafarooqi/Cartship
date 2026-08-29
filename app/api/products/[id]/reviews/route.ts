import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductReview from "@/models/ProductReview";
import { isAllowedReviewImageUrl } from "@/lib/imagekit";

export const runtime = "nodejs";

async function syncProductRating(productId: string) {
  const reviews = await ProductReview.find({ productId }).select("rating").lean();
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
        ) / 10
      : 0;

  await Product.findByIdAndUpdate(productId, { rating, reviewCount });
  return { rating, reviewCount };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(id).select("rating reviewCount").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await ProductReview.find({ productId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        _id: r._id.toString(),
        productId: r.productId,
        name: r.name,
        rating: r.rating,
        comment: r.comment,
        imageUrl: r.imageUrl || "",
        createdAt: r.createdAt,
      })),
      stats: {
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Product reviews GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

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

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const comment = String(body.comment ?? "").trim();
    const rating = Number(body.rating);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Please select a rating from 1 to 5" }, { status: 400 });
    }
    if (!comment || comment.length < 10) {
      return NextResponse.json(
        { error: "Review must be at least 10 characters" },
        { status: 400 }
      );
    }

    const imageUrl = String(body.imageUrl ?? "").trim();
    if (imageUrl && !isAllowedReviewImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Invalid review photo" }, { status: 400 });
    }

    const review = await ProductReview.create({
      productId: id,
      name,
      rating,
      comment,
      imageUrl: imageUrl || "",
    });

    const stats = await syncProductRating(id);

    return NextResponse.json(
      {
        review: {
          _id: review._id.toString(),
          productId: review.productId,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          imageUrl: review.imageUrl || "",
          createdAt: review.createdAt,
        },
        stats,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product reviews POST error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
