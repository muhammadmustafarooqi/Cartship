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
  return html.replace(/<[^>]*>?/gm, "").trim();
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cartship.pk").replace(/\/$/, "");
    
    // Get store settings if present
    const settings = await Settings.findOne().lean();
    const storeName = settings?.storeName || "CartShip";
    const storeDescription = "Premium Gadgets & Accessories Pakistan";

    // Fetch active products
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    const format = request.nextUrl.searchParams.get("format");

    if (format === "json") {
      return NextResponse.json({
        store: storeName,
        totalProducts: products.length,
        products: products.map((p: any) => ({
          id: p._id.toString(),
          title: p.name,
          description: p.shortDescription || stripHtml(p.description),
          link: `${siteUrl}/products/${p.slug}`,
          image_link: p.images?.[0] || "",
          price: `${p.price} PKR`,
          compare_at_price: p.comparePrice ? `${p.comparePrice} PKR` : null,
          availability: p.stock > 0 ? "in stock" : "out of stock",
          category: p.category,
        })),
      });
    }

    // Default RSS 2.0 XML Catalog Feed for Meta Commerce Manager & Google Shopping
    const itemsXml = products
      .map((product: any) => {
        const productUrl = `${siteUrl}/products/${product.slug}`;
        const mainImage = product.images?.[0] || "";
        const additionalImages = (product.images || []).slice(1, 10);
        
        const isSale = product.comparePrice && product.comparePrice > product.price;
        const priceStr = isSale ? `${product.comparePrice} PKR` : `${product.price} PKR`;
        const salePriceStr = isSale ? `${product.price} PKR` : "";

        const availability = product.stock > 0 ? "in stock" : "out of stock";
        const descText = cleanCdata(stripHtml(product.shortDescription || product.description || product.name));
        const titleText = cleanCdata(product.name);

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
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>` : ""}
      <g:product_type><![CDATA[${product.category || "General"}]]></g:product_type>
    </item>`;
      })
      .join("\n");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${storeName} Meta Product Catalog Feed]]></title>
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
    console.error("Meta feed generator error:", error);
    return new NextResponse("Error generating feed", { status: 500 });
  }
}
