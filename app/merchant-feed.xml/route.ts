import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Google Product Taxonomy mapping
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  "kitchen-cooking": "Home & Garden > Kitchen & Dining",
  "personal-care-beauty": "Health & Beauty > Personal Care",
  "home-cleaning": "Home & Garden > Household Supplies",
  "fitness-health": "Sporting Goods > Exercise & Fitness",
  "electronics-gadgets": "Electronics",
  "baby-kids": "Baby & Toddler",
};

// Website category title formatting
const PRODUCT_TYPE_MAP: Record<string, string> = {
  "kitchen-cooking": "Kitchen & Cooking",
  "personal-care-beauty": "Personal Care & Beauty",
  "home-cleaning": "Home & Cleaning",
  "fitness-health": "Fitness & Health",
  "electronics-gadgets": "Electronics & Gadgets",
  "baby-kids": "Baby & Kids",
};

function cleanCdata(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\]\]>/g, "]]&gt;");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCategoryTitle(slug: string): string {
  if (!slug) return "General";
  if (PRODUCT_TYPE_MAP[slug]) return PRODUCT_TYPE_MAP[slug];
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartship.pk").replace(/\/$/, "");

    // Fetch store settings for metadata, shipping fees, and store name
    const settings = (await Settings.findOne().lean()) as any;
    const storeName = settings?.storeName || "CartShip";
    const storeDescription = "CartShip.pk — Premium Gadgets & Accessories Pakistan";
    const freeDeliveryAbove = typeof settings?.freeDeliveryAbove === "number" ? settings.freeDeliveryAbove : 3000;
    const standardDeliveryFee = typeof settings?.deliveryFee === "number" ? settings.deliveryFee : 199;

    // Fetch all eligible active products (sorted by latest)
    const products = await Product.find({
      isActive: true,
      price: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .lean();

    const seenIds = new Set<string>();
    const items: string[] = [];

    for (const product of products as any[]) {
      const id = product._id.toString();
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const productSlug = product.slug || id;
      const productUrl = `${siteUrl}/products/${productSlug}`;

      // Images formatting (must be absolute HTTPS URLs)
      const allImages = (product.images || [])
        .map((img: string) => {
          if (!img) return "";
          return img.startsWith("http") ? img : `${siteUrl}${img.startsWith("/") ? "" : "/"}${img}`;
        })
        .filter(Boolean);

      const mainImage = allImages[0] || `${siteUrl}/CartShip.png`;
      const additionalImages = allImages.slice(1, 11);

      // Title & Description
      const rawTitle = product.name || "Product";
      const titleText = cleanCdata(rawTitle);

      const rawDesc =
        stripHtml(product.description) ||
        stripHtml(product.shortDescription) ||
        product.name;
      const descText = cleanCdata(rawDesc);

      // Price & Sale Price calculation
      // In Google Merchant Center RSS spec:
      // - <g:price> is the regular base price
      // - <g:sale_price> is the discounted price (only when comparePrice > price)
      const isSale = typeof product.comparePrice === "number" && product.comparePrice > product.price;
      const regularPrice = isSale ? product.comparePrice : product.price;
      const salePrice = isSale ? product.price : null;

      // Availability: strictly in_stock or out_of_stock
      const availability = (product.stock ?? 1) > 0 ? "in_stock" : "out_of_stock";

      // Brand
      const brandName = cleanCdata(product.brand || storeName);

      // Categories
      const categorySlug = product.category || "";
      const googleCategory = GOOGLE_CATEGORY_MAP[categorySlug] || "";
      const productType = cleanCdata(formatCategoryTitle(categorySlug));

      // Shipping calculation
      const shippingRate = product.price >= freeDeliveryAbove ? 0 : standardDeliveryFee;

      // Build additional image tags
      const additionalImageTags = additionalImages
        .map((imgUrl: string) => `      <g:additional_image_link>${cleanCdata(imgUrl)}</g:additional_image_link>`)
        .join("\n");

      // Optional genuine identifiers if present
      const gtinTag = product.gtin ? `\n      <g:gtin>${cleanCdata(product.gtin)}</g:gtin>` : "";
      const mpnTag = product.mpn ? `\n      <g:mpn>${cleanCdata(product.mpn)}</g:mpn>` : "";
      const identifierExists = product.gtin || product.mpn ? "yes" : "no";

      const googleCatTag = googleCategory
        ? `\n      <g:google_product_category><![CDATA[${googleCategory}]]></g:google_product_category>`
        : "";

      const salePriceTag = salePrice !== null
        ? `\n      <g:sale_price>${Number(salePrice).toFixed(2)} PKR</g:sale_price>`
        : "";

      items.push(`    <item>
      <g:id>${id}</g:id>
      <g:title><![CDATA[${titleText}]]></g:title>
      <g:description><![CDATA[${descText}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${cleanCdata(mainImage)}</g:image_link>${additionalImageTags ? `\n${additionalImageTags}` : ""}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${Number(regularPrice).toFixed(2)} PKR</g:price>${salePriceTag}
      <g:brand><![CDATA[${brandName}]]></g:brand>${gtinTag}${mpnTag}
      <g:identifier_exists>${identifierExists}</g:identifier_exists>${googleCatTag}
      <g:product_type><![CDATA[${productType}]]></g:product_type>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>${Number(shippingRate).toFixed(2)} PKR</g:price>
      </g:shipping>
    </item>`);
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${cleanCdata(storeName)} Product Feed]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${cleanCdata(storeDescription)}]]></description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Merchant feed generation error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate feed</error>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}
