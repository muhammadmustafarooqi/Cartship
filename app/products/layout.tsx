import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartship.pk").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Premium Collection",
  description:
    "Browse our full catalog of premium gadgets, kitchen tools, personal care devices, electronics, baby products, and fitness equipment. Filter by category and find what you need. Cash on Delivery across Pakistan.",
  keywords: [
    "buy gadgets online Pakistan", "kitchen tools online", "personal care Pakistan",
    "electronics online shopping", "baby products Pakistan", "fitness equipment",
    "home cleaning tools", "cheap gadgets Pakistan", "COD gadgets",
  ],
  openGraph: {
    title: "Premium Collection | CartShip",
    description: "Explore our curated selection of high-quality products. Filter by category, search, and shop with COD across Pakistan.",
    type: "website",
    url: `${SITE_URL}/products`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Collection | CartShip",
    description: "Browse gadgets, kitchen tools, personal care & more. COD available across Pakistan.",
  },
  alternates: { canonical: `${SITE_URL}/products` },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
