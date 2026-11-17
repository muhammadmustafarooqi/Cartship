import mongoose from "mongoose";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Bundle from "@/models/Bundle";
import Settings from "@/models/Settings";
import ProductClient from "./ProductClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartship.pk").replace(/\/$/, "");

function stripHtml(input?: string): string {
  if (!input) return "";
  return input
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

async function getProductBySlugOrId(slugOrId: string) {
  await connectDB();
  let product = (await Product.findOne({ slug: slugOrId }).lean()) as any;
  if (!product && mongoose.Types.ObjectId.isValid(slugOrId)) {
    product = (await Product.findById(slugOrId).lean()) as any;
  }
  return product;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlugOrId(slug);
    if (!product) return {};

    const productUrl = `${SITE_URL}/products/${product.slug}`;
    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = product.images?.[0] || "";
    const descriptionText =
      stripHtml(product.shortDescription) ||
      stripHtml(product.description).substring(0, 160) ||
      `Buy ${product.name} at CartShip with Cash on Delivery across Pakistan.`;

    return {
      title: `${product.name} | CartShip`,
      description: descriptionText,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: product.name,
        description: descriptionText,
        url: productUrl,
        images: mainImage ? [mainImage, ...previousImages] : previousImages,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: descriptionText,
        images: mainImage ? [mainImage] : [],
      },
    };
  } catch (e) {
    return {};
  }
}

export default async function ProductPageServer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const productDoc = await getProductBySlugOrId(slug);

  if (!productDoc) {
    notFound();
  }

  // Convert MongoDB document to plain serializable object
  const product = { ...productDoc, _id: productDoc._id.toString() };

  // Fetch settings for structured data (shipping, storeName, return policy)
  let storeName = "CartShip";
  let freeDeliveryAbove = 3000;
  let deliveryFee = 199;
  try {
    const settings = (await Settings.findOne().lean()) as any;
    if (settings?.storeName) storeName = settings.storeName;
    if (typeof settings?.freeDeliveryAbove === "number") freeDeliveryAbove = settings.freeDeliveryAbove;
    if (typeof settings?.deliveryFee === "number") deliveryFee = settings.deliveryFee;
  } catch (err) {
    console.error("Failed to fetch settings for structured data:", err);
  }

  // Fetch related products
  const relatedDocs = (await Product.find({
    category: product.category,
    _id: { $ne: productDoc._id },
    isActive: true,
  })
    .limit(5)
    .lean()) as any[];

  const related = relatedDocs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  }));

  // Fetch bundle packs
  let packs: any[] = [];
  try {
    const bundle = (await Bundle.findOne({ product: productDoc._id, isActive: true }).lean()) as any;
    if (bundle && bundle.packs) {
      packs = bundle.packs
        .map((p: any) => ({
          quantity: p.quantity,
          price: p.price,
          label: p.label || "",
        }))
        .sort((a: any, b: any) => a.quantity - b.quantity);
    }
  } catch (err) {
    console.error("Failed to fetch bundle packs:", err);
  }

  const productUrl = `${SITE_URL}/products/${product.slug}`;

  // Ensure absolute URLs for images
  const cleanImages = (product.images || [])
    .map((img: string) => {
      if (!img) return "";
      return img.startsWith("http") ? img : `${SITE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
    })
    .filter(Boolean);

  const cleanDescription =
    stripHtml(product.description) ||
    stripHtml(product.shortDescription) ||
    product.name;

  // Set priceValidUntil to 1 year in the future
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Schema.org Product structured data for Google Merchant Center & Rich Results
  const productJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: cleanDescription,
    image: cleanImages.length > 0 ? cleanImages : undefined,
    sku: product._id,
    mpn: product._id,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "PKR",
      price: Number(product.price).toFixed(2),
      priceValidUntil: priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        (product.stock ?? 1) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: storeName,
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.price >= freeDeliveryAbove ? "0.00" : Number(deliveryFee).toFixed(2),
          currency: "PKR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "PK",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  // Only include aggregateRating if reviewCount is greater than 0
  if (product.reviewCount && product.reviewCount > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating || 4.5).toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Schema.org BreadcrumbList structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${SITE_URL}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductClient initialProduct={product} initialRelated={related} initialPacks={packs} />
    </>
  );
}
