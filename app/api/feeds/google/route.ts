import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Settings from "@/models/Settings";

function cleanCdata(text: string) {
  if (!text) return "";
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(/\]\]>/g, "]]&gt;");
}

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartship.pk").replace(/\/$/, "");

    // Get store settings
    const settings = (await Settings.findOne().lean()) as any;
    const storeName = settings?.storeName || "CartShip";
    const storeDescription = "CartShip — Premium Gadgets & Accessories Pakistan";
    const freeDeliveryAbove = typeof settings?.freeDeliveryAbove === "number" ? settings.freeDeliveryAbove : 3000;
    const standardDeliveryFee = typeof settings?.deliveryFee === "number" ? settings.deliveryFee : 199;

    // Fetch all active products
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    const itemsXml = products
      .map((product: any) => {
        const productUrl = `${siteUrl}/products/${product.slug}`;
        const mainImage = product.images?.[0] || "";
        const additionalImages = (product.images || []).slice(1, 10);

        const isSale = product.comparePrice && product.comparePrice > product.price;
        // In Google Merchant Center, g:price is the base price, and g:sale_price is discounted price if on sale
        const regularPrice = isSale ? product.comparePrice : product.price;
        const salePrice = isSale ? product.price : null;

        const availability = (product.stock ?? 1) > 0 ? "in stock" : "out of stock";
        const descText = cleanCdata(
          stripHtml(product.shortDescription) ||
          stripHtml(product.description) ||
          product.name
        );
        const titleText = cleanCdata(product.name);
        const shippingFee = product.price >= freeDeliveryAbove ? 0 : standardDeliveryFee;

        const additionalImageTags = additionalImages
          .filter((imgUrl: string) => Boolean(imgUrl))
          .map((imgUrl: string) => `<g:additional_image_link>${imgUrl}</g:additional_image_link>`)
          .join("\n        ");

        return `    <item>
      <g:id>${product._id.toString()}</g:id>
      <g:title><![CDATA[${titleText}]]></g:title>
      <g:description><![CDATA[${descText}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${mainImage}</g:image_link>
      ${additionalImageTags ? `\n      ${additionalImageTags}` : ""}
      <g:brand><![CDATA[${storeName}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${Number(regularPrice).toFixed(2)} PKR</g:price>
      ${salePrice ? `<g:sale_price>${Number(salePrice).toFixed(2)} PKR</g:sale_price>` : ""}
      <g:product_type><![CDATA[${product.category || "General"}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>${Number(shippingFee).toFixed(2)} PKR</g:price>
      </g:shipping>
    </item>`;
      })
      .join("\n");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${storeName} Google Merchant Center Product Feed]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${storeDescription}]]></description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Google feed generator error:", error);
    return new NextResponse("Error generating Google feed", { status: 500 });
  }
}
