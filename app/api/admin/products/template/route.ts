import { NextResponse } from "next/server";
import { generateCSV } from "@/lib/csv";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const sampleRows = [
    {
      name: "Wireless Ultrasonic Cleaner Pro",
      slug: "wireless-ultrasonic-cleaner-pro",
      category: "electronics-gadgets",
      price: 2499,
      comparePrice: 3499,
      stock: 50,
      images:
        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800, https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      colors: "White, Green",
      tags: "gadget, cleaner, electronics",
      shortDescription: "High-frequency ultrasonic cleaning tool for watches, jewelry, and spectacles.",
      description:
        "Experience deep 45,000Hz ultrasonic wave cleaning. Removes grime and dirt in 3 minutes without chemicals. Includes USB rechargeable base and waterproof seal.",
      previewVideoUrl: "",
      isFeatured: "TRUE",
      isNewArrival: "TRUE",
      isActive: "TRUE",
    },
    {
      name: "Smart Kitchen Digital Food Scale",
      slug: "smart-kitchen-digital-food-scale",
      category: "kitchen-cooking",
      price: 1850,
      comparePrice: 2400,
      stock: 35,
      images:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800, https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800",
      colors: "Black, Silver",
      tags: "kitchen, cooking, scale, fitness",
      shortDescription: "Precision digital food scale with tare function and backlit LCD display.",
      description:
        "Accurate up to 1g with 10kg capacity. Supports g, oz, ml, and lb units. Tempered glass top with anti-fingerprint coating.",
      previewVideoUrl: "",
      isFeatured: "FALSE",
      isNewArrival: "TRUE",
      isActive: "TRUE",
    },
    {
      name: "Automatic Electric Hair Straightener Brush",
      slug: "automatic-electric-hair-straightener-brush",
      category: "personal-care-beauty",
      price: 2999,
      comparePrice: 4200,
      stock: 20,
      images:
        "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800, https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
      colors: "Pink, Black",
      tags: "beauty, hair, personal care",
      shortDescription: "Rapid heating ceramic hair straightening comb with negative ion protection.",
      description:
        "Heat up in 30 seconds with 5 temperature settings. Anti-scald teeth ensure safe grooming at home.",
      previewVideoUrl: "",
      isFeatured: "TRUE",
      isNewArrival: "FALSE",
      isActive: "TRUE",
    },
  ];

  const csvContent = generateCSV(sampleRows, columns);

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cartship-products-sample-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}

