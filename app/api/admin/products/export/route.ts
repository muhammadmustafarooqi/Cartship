import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { generateCSV } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (category && category !== "all") query.category = category;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    const columns = [
      { key: "name", label: "Product Name" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price (PKR)" },
      { key: "comparePrice", label: "Compare Price (PKR)" },
      { key: "stock", label: "Stock" },
      { key: "images", label: "Images (Comma Separated URLs)" },
      { key: "colors", label: "Colors (Comma Separated)" },
      { key: "tags", label: "Tags (Comma Separated)" },
      { key: "shortDescription", label: "Short Description" },
      { key: "description", label: "Full Description" },
      { key: "previewVideoUrl", label: "Preview Video URL" },
      { key: "isFeatured", label: "Featured (TRUE/FALSE)" },
      { key: "isNewArrival", label: "New Arrival (TRUE/FALSE)" },
      { key: "isActive", label: "Active (TRUE/FALSE)" },
    ];

    const rows = products.map((p: any) => ({
      name: p.name || "",
      slug: p.slug || "",
      category: p.category || "",
      price: p.price ?? 0,
      comparePrice: p.comparePrice ?? 0,
      stock: p.stock ?? 0,
      images: Array.isArray(p.images) ? p.images.join(", ") : "",
      colors: Array.isArray(p.colors)
        ? p.colors.join(", ")
        : Array.isArray(p.colorVariants)
        ? p.colorVariants.map((c: any) => c.color).join(", ")
        : "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      previewVideoUrl: p.previewVideoUrl || "",
      isFeatured: p.isFeatured ? "TRUE" : "FALSE",
      isNewArrival: p.isNewArrival ? "TRUE" : "FALSE",
      isActive: p.isActive !== false ? "TRUE" : "FALSE",
    }));

    const csvContent = generateCSV(rows, columns);
    const filename = `cartship-products-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Products export error:", error);
    return NextResponse.json(
      { error: "Failed to export products", details: error.message },
      { status: 500 }
    );
  }
}

