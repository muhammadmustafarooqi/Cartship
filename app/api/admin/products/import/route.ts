import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { parseCSV } from "@/lib/csv";
import slugify from "slugify";

export const runtime = "nodejs";

function parseCleanPrice(val: any): number {
  if (typeof val === "number") return Math.max(0, val);
  if (!val) return 0;
  // Remove currency words, symbols, and commas
  const cleaned = String(val)
    .replace(/[Rs.|PKR|₨|$|,|\s]/gi, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, Math.round(num));
}

function parseCleanStock(val: any, fallback = 10): number {
  if (typeof val === "number") return Math.max(0, Math.floor(val));
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? fallback : Math.max(0, num);
}

function parseBool(val: any, fallback = false): boolean {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "boolean") return val;
  const s = String(val).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "active" || s === "y") return true;
  if (s === "false" || s === "0" || s === "no" || s === "inactive" || s === "n") return false;
  return fallback;
}

function extractImages(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((url) => typeof url === "string" && url.trim().length > 0);
  const rawStr = String(val);
  // Split on pipe |, comma ,, or newline
  const parts = rawStr.split(/[\r\n|,]+/);
  const results: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim().replace(/^['"]|['"]$/g, "");
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
      if (!results.includes(trimmed)) results.push(trimmed);
    }
  }
  return results;
}

function extractList(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const parts = String(val).split(/[\r\n|,]+/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const contentType = request.headers.get("content-type") || "";
    let csvText = "";
    let updateExisting = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      updateExisting = formData.get("updateExisting") === "true";
      if (!file) {
        return NextResponse.json({ error: "No CSV file uploaded" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = body.csvText || "";
      updateExisting = Boolean(body.updateExisting);
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV content is empty" }, { status: 400 });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }

    // Fetch existing categories to map names/slugs
    const existingCategories = await Category.find({}).lean();
    const categoryMap = new Map<string, string>();
    for (const cat of existingCategories) {
      categoryMap.set(cat.slug.toLowerCase(), cat.slug);
      categoryMap.set(cat.name.toLowerCase(), cat.slug);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Row index in spreadsheet (header is row 1)

      // Find fields flexibly
      const name =
        row.product_name ||
        row.name ||
        row.title ||
        row.product_title ||
        "";

      if (!name.trim()) {
        errors.push({ row: rowNum, error: "Missing product name" });
        skippedCount++;
        continue;
      }

      const rawPrice =
        row.price ||
        row.selling_price ||
        row.sale_price ||
        row.price_pkr ||
        "0";
      const price = parseCleanPrice(rawPrice);
      if (price <= 0) {
        errors.push({ row: rowNum, error: `Invalid price for product "${name}"` });
        skippedCount++;
        continue;
      }

      const rawComparePrice =
        row.compare_price ||
        row.compareprice ||
        row.compare_price_pkr ||
        row.original_price ||
        row.mrp ||
        "0";
      const comparePrice = parseCleanPrice(rawComparePrice);

      // Category matching
      const rawCategory =
        row.category ||
        row.category_name ||
        row.category_slug ||
        "";
      let matchedCategory = "kitchen-cooking"; // sensible fallback
      if (rawCategory.trim()) {
        const catLower = rawCategory.trim().toLowerCase();
        if (categoryMap.has(catLower)) {
          matchedCategory = categoryMap.get(catLower)!;
        } else {
          matchedCategory = slugify(catLower, { lower: true, strict: true }) || "general";
        }
      }

      const stock = parseCleanStock(row.stock || row.quantity || row.inventory, 10);
      const images = extractImages(
        row.images ||
        row.image_urls ||
        row.image_url ||
        row.image ||
        row.picture_url
      );
      const colors = extractList(row.colors || row.color);
      const tags = extractList(row.tags || row.tag);
      const shortDescription = (row.short_description || row.summary || "").trim();
      const description = (row.description || row.details || row.full_description || "").trim();
      const previewVideoUrl = (row.preview_video_url || row.video || "").trim();

      const isFeatured = parseBool(row.is_featured || row.featured, false);
      const isNewArrival = parseBool(row.is_new_arrival || row.new_arrival || row.new, true);
      const isActive = parseBool(row.is_active || row.active || row.status, true);

      // Determine slug
      let baseSlug = (row.slug || "").trim();
      if (!baseSlug) {
        baseSlug = slugify(name, { lower: true, strict: true });
      } else {
        baseSlug = slugify(baseSlug, { lower: true, strict: true });
      }
      if (!baseSlug) baseSlug = `product-${Date.now()}`;

      // Check for existing product by slug or exact name
      const existingProduct = await Product.findOne({
        $or: [{ slug: baseSlug }, { name: name.trim() }],
      });

      if (existingProduct) {
        if (updateExisting) {
          existingProduct.name = name.trim();
          existingProduct.price = price;
          if (comparePrice > 0) existingProduct.comparePrice = comparePrice;
          existingProduct.category = matchedCategory;
          existingProduct.stock = stock;
          if (images.length > 0) existingProduct.images = images;
          if (colors.length > 0) existingProduct.colors = colors;
          if (tags.length > 0) existingProduct.tags = tags;
          if (shortDescription) existingProduct.shortDescription = shortDescription;
          if (description) existingProduct.description = description;
          if (previewVideoUrl) existingProduct.previewVideoUrl = previewVideoUrl;
          existingProduct.isFeatured = isFeatured;
          existingProduct.isNewArrival = isNewArrival;
          existingProduct.isActive = isActive;

          await existingProduct.save();
          updatedCount++;
        } else {
          // If not updating, create with guaranteed unique slug
          const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
          await Product.create({
            name: name.trim(),
            slug: uniqueSlug,
            price,
            comparePrice,
            category: matchedCategory,
            stock,
            images,
            colors,
            tags,
            shortDescription,
            description,
            previewVideoUrl,
            isFeatured,
            isNewArrival,
            isActive,
          });
          createdCount++;
        }
      } else {
        await Product.create({
          name: name.trim(),
          slug: baseSlug,
          price,
          comparePrice,
          category: matchedCategory,
          stock,
          images,
          colors,
          tags,
          shortDescription,
          description,
          previewVideoUrl,
          isFeatured,
          isNewArrival,
          isActive,
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      createdCount,
      updatedCount,
      skippedCount,
      errors: errors.slice(0, 20), // return up to 20 errors
    });
  } catch (error: any) {
    console.error("Products import error:", error);
    return NextResponse.json(
      { error: "Failed to import products", details: error.message },
      { status: 500 }
    );
  }
}

