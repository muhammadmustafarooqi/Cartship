import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import AnnouncementBar from "@/components/AnnouncementBar";
import MarqueeBanner from "@/components/MarqueeBanner";
import CategoryShowcase from "@/components/CategoryShowcase";
import dynamic from "next/dynamic";

const FAQ = dynamic(() => import("@/components/FAQ"));
const StatsSection = dynamic(() => import("@/components/StatsSection"));
import WhatsAppCTA from "@/components/WhatsAppCTA";
import ScratchCardBanner from "@/components/ScratchCardBanner";
import DeliveryProofWall from "@/components/DeliveryProofWall";
import FeaturedCollection from "@/components/FeaturedCollection";
import { LucideByName } from "@/components/LucideByName";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Banner from "@/models/Banner";

// Revalidate banners, products, and other dynamic content every 60 seconds
export const revalidate = 60;

async function getProducts(query: Record<string, unknown>, limit = 8) {
  try {
    await connectDB();
    const products = await Product.find({ ...query, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getBanners() {
  try {
    await connectDB();
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return JSON.parse(JSON.stringify(banners));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

type Product = {
  _id: string; name: string; slug: string; price: number;
  comparePrice?: number; images: string[]; category: string;
  isFeatured?: boolean; isNewArrival?: boolean;
  rating?: number; reviewCount?: number; stock?: number;
};

export default async function HomePage() {
  const [featuredProducts, newArrivals, banners] = await Promise.all([
    getProducts({ isFeatured: true }, 8),
    getProducts({ isNewArrival: true }, 8),
    getBanners(),
  ]);

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Announcement Bar */}
      <AnnouncementBar />
      <Navbar />

      {/* Hero */}
      <HeroSlider banners={banners} />

      {/* Trust ticker — below hero */}
      <MarqueeBanner />

      {/* Category Showcase */}
      <CategoryShowcase />

      <FeaturedCollection products={featuredProducts} />

      {/* Scratch Card Banner */}
      <ScratchCardBanner />

      {/* New Arrivals */}
      <section style={{ padding: "120px 0", background: "var(--cream)" }}>
        <div className="page-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: 900, color: "var(--navy-deep)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                New Arrivals
              </h2>
              <div style={{ width: "60px", height: "4px", background: "var(--orange)", borderRadius: "4px", marginBottom: "16px" }} />
              <p style={{ fontFamily: "var(--font-jakarta), sans-serif", fontSize: "1.1rem", color: "var(--slate)", margin: 0 }}>
                The latest additions to our premium collection.
              </p>
            </div>
            <Link
              href="/products?newArrival=true"
              className="view-all-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.95rem",
                color: "var(--orange)",
                textDecoration: "none",
                fontWeight: 700,
                fontFamily: "var(--font-jakarta), sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                paddingBottom: "4px",
                borderBottom: "2px solid var(--orange)",
                transition: "opacity 0.2s"
              }}
            >
              View All Collection →
            </Link>
          </div>

          {newArrivals.length > 0 ? (
            <>
              <div className="new-arrivals-grid">
                {newArrivals.map((p: Product) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <style>{`
                .new-arrivals-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  gap: 32px 24px;
                }
                @media (max-width: 640px) {
                  .new-arrivals-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 16px 10px;
                  }
                }
              `}</style>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--slate)", background: "var(--white)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-default)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--slate)" }}>
                <LucideByName name="sparkles" size={48} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, fontFamily: "var(--font-outfit), sans-serif", color: "var(--navy)" }}>New arrivals dropping soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Delivery Proof Wall */}
      <DeliveryProofWall />

      {/* FAQ */}
      <FAQ />

      {/* Trust stats — after social proof */}
      <StatsSection />

      {/* WhatsApp CTA */}
      {/* <WhatsAppCTA /> */}

      <Footer />
    </main>
  );
}
