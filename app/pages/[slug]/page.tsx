import { Metadata } from "next";
import Link from "next/link";
import connectToDatabase from "@/lib/mongodb";
import Page from "@/models/Page";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Truck, 
  HelpCircle, 
  Info, 
  Phone, 
  ChevronRight, 
  MessageCircle,
  Mail,
  Clock,
  Sparkles
} from "lucide-react";

export const revalidate = 60;

// Default fallback content for common policy pages in case DB record is empty or not yet seeded
const DEFAULT_PAGES: Record<string, { title: string; subtitle: string; icon: string; content: string }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How CartShip collects, protects, and handles your personal data responsibly.",
    icon: "shield",
    content: `
      <h2>1. Introduction</h2>
      <p>At CartShip (cartship.pk), we are dedicated to protecting your personal information and ensuring a transparent, secure online shopping environment. This Privacy Policy details how we collect, store, and process your data across Pakistan.</p>

      <h2>2. Information We Collect</h2>
      <p>To provide a smooth order fulfillment and delivery experience, we collect necessary customer details during checkout, registration, or interaction:</p>
      <ul>
        <li><strong>Contact Information:</strong> Full Name, active Mobile / WhatsApp phone number, and email address.</li>
        <li><strong>Shipping Information:</strong> Complete delivery address, street details, landmark, and destination city.</li>
        <li><strong>Order & Transaction Data:</strong> Purchased products, Cash-on-Delivery (COD) records, discount vouchers, and order history.</li>
        <li><strong>Device & Analytics:</strong> IP address, device type, browser settings, and anonymized interaction cookies to optimize site speed.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>Your information is used strictly for legitimate e-commerce operations, including:</p>
      <ul>
        <li>Processing and dispatching your Cash on Delivery (COD) orders via our courier partners (TCS, Trax, Leopards, Call Courier).</li>
        <li>Sending order confirmation SMS, WhatsApp delivery status notifications, and verification OTPs.</li>
        <li>Providing dedicated customer care and addressing exchange / replacement inquiries.</li>
        <li>Preventing fraudulent orders and improving our product catalog.</li>
      </ul>

      <h2>4. Data Protection & Security</h2>
      <p>We enforce strict SSL encryption (HTTPS) across our entire web platform. We never sell, rent, or lease your personal information to third-party marketers. Your data is only shared with authorized logistics couriers strictly for delivering your parcel.</p>

      <h2>5. Cookies & Tracking Technologies</h2>
      <p>We utilize essential cookies and Meta Pixel tracking to remember your cart items, apply your Spin-to-Win discounts, and deliver relevant promotions. You can manage cookie preferences directly through your browser settings.</p>

      <h2>6. Your Rights & Contact</h2>
      <p>You have the right to request a review, update, or deletion of your personal records stored with us. For inquiries or data requests, please reach out to our team at <strong>support@cartship.pk</strong> or message our official WhatsApp helpline.</p>
    `,
  },
  "terms-of-service": {
    title: "Terms of Service",
    subtitle: "Terms and conditions governing your use of CartShip Pakistan.",
    icon: "file",
    content: `
      <h2>1. Agreement to Terms</h2>
      <p>By accessing or placing an order on <strong>CartShip (cartship.pk)</strong>, you agree to be bound by these Terms of Service and all applicable laws in Pakistan. If you do not agree with any part of these terms, please do not use our services.</p>

      <h2>2. Products & Pricing</h2>
      <p>We strive to display accurate descriptions, high-definition images, and real-time pricing for all gadgets, lifestyle, and home products. However:</p>
      <ul>
        <li>Prices are listed in Pakistani Rupees (PKR) and are subject to change without prior notice.</li>
        <li>In the event of a pricing or stock error, CartShip reserves the right to cancel or revise the affected order.</li>
        <li>Colors, dimensions, and specifications are described as accurately as possible.</li>
      </ul>

      <h2>3. Orders & Payment (Cash on Delivery)</h2>
      <p>Our primary payment method across Pakistan is <strong>Cash on Delivery (COD)</strong>.</p>
      <ul>
        <li>Placing an order constitutes a binding purchase intent. Please provide a valid, reachable phone number for order confirmation.</li>
        <li>Customers are requested to inspect the sealed flyer and pay the courier rider in cash upon receiving the parcel.</li>
        <li>Repeated unconfirmed or deliberate rejected deliveries may result in phone blacklisting from future COD orders.</li>
      </ul>

      <h2>4. Shipping & Delivery</h2>
      <p>Standard delivery across major cities (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, etc.) typically takes <strong>2 to 4 working days</strong>. Remote areas may take 4 to 6 working days.</p>

      <h2>5. Intellectual Property</h2>
      <p>All logos, visual branding, graphics, product writeups, and website architecture are the exclusive property of CartShip and cannot be reproduced without explicit written consent.</p>

      <h2>6. Modifications to Terms</h2>
      <p>CartShip reserves the right to update or modify these Terms of Service at any time. Continued usage of our website signifies acceptance of updated policies.</p>
    `,
  },
  "return-refund-policy": {
    title: "Return & Refund Policy",
    subtitle: "Hassle-free 7-day checking warranty and replacement process.",
    icon: "rotate",
    content: `
      <h2>1. 7-Day Replacement Warranty</h2>
      <p>At CartShip, customer satisfaction is our top priority. We offer a <strong>7-Day Checking & Replacement Warranty</strong> on eligible products starting from the day your parcel is delivered.</p>

      <h2>2. Eligibility for Returns & Exchanges</h2>
      <p>A product is eligible for exchange or replacement if:</p>
      <ul>
        <li>The item arrived damaged, defective, or non-functional.</li>
        <li>The incorrect item, model, or color was delivered.</li>
        <li>The product is in its original condition, complete with all accessories, cables, manuals, and original box packaging.</li>
      </ul>

      <h2>3. Non-Eligible Items</h2>
      <p>The following cannot be returned or refunded:</p>
      <ul>
        <li>Items showing signs of physical damage, water damage, or electrical surge misuse by the customer.</li>
        <li>Personal care items that have been opened or used for hygienic reasons.</li>
        <li>Products returned without original packaging or missing accessories.</li>
      </ul>

      <h2>4. How to Request a Return / Replacement</h2>
      <ol>
        <li>Record a quick unboxing photo/video showing the defect or issue.</li>
        <li>Contact our customer support via WhatsApp or email (<strong>support@cartship.pk</strong>) with your Order ID.</li>
        <li>Our team will verify the claim within 24–48 hours and arrange a replacement parcel or reverse pickup.</li>
      </ol>

      <h2>5. Refund Process</h2>
      <p>Where a replacement is unavailable, approved refunds will be processed via <strong>Bank Transfer, JazzCash, or EasyPaisa</strong> within 3 to 5 business days after inspection.</p>
    `,
  },
  "returns": {
    title: "Returns & Exchanges",
    subtitle: "Simple, transparent guidelines for returning or exchanging your order.",
    icon: "rotate",
    content: `
      <h2>Returns & Exchanges Guide</h2>
      <p>We want you to shop with absolute confidence. If you encounter any issue with your parcel, our dedicated support team is here to assist you.</p>
      <ul>
        <li><strong>Standard Warranty:</strong> 7 Days checking warranty from date of delivery.</li>
        <li><strong>Verification:</strong> Simply WhatsApp us your order ID and a short photo/video of the issue.</li>
        <li><strong>Quick Replacement:</strong> We dispatch a replacement unit or resolve the matter promptly.</li>
      </ul>
      <p>Please refer to our complete <a href="/pages/return-refund-policy">Return & Refund Policy</a> for complete terms.</p>
    `,
  },
  "shipping-policy": {
    title: "Shipping Policy",
    subtitle: "Fast, reliable Cash-on-Delivery nationwide delivery information.",
    icon: "truck",
    content: `
      <h2>1. Nationwide Delivery Coverage</h2>
      <p>CartShip delivers to every corner of Pakistan through our logistics courier network including TCS, Trax, Leopards, and Call Courier.</p>

      <h2>2. Delivery Timeframes</h2>
      <ul>
        <li><strong>Major Metros (Karachi, Lahore, Islamabad, Rawalpindi):</strong> 2 to 3 Business Days.</li>
        <li><strong>Other Cities (Peshawar, Faisalabad, Multan, Sialkot, Quetta, Gujranwala):</strong> 3 to 4 Business Days.</li>
        <li><strong>Rural & Remote Towns:</strong> 4 to 6 Business Days.</li>
      </ul>

      <h2>3. Shipping Charges</h2>
      <ul>
        <li><strong>Standard Shipping Fee:</strong> Rs. 200 – Rs. 250 flat nationwide.</li>
        <li><strong>Free Delivery:</strong> Orders exceeding Rs. 3,000 qualify for <strong>100% Free Shipping</strong>.</li>
      </ul>

      <h2>4. Order Tracking</h2>
      <p>As soon as your parcel is dispatched, you will receive an SMS and WhatsApp update with your courier tracking number. You can also track your shipment live anytime using our <a href="/track-order">Track Order Page</a>.</p>

      <h2>5. Parcel Inspection on Delivery</h2>
      <p>Per courier COD regulations in Pakistan, couriers require payment before opening sealed flyers. If you find any issue after unsealing, our 7-day replacement warranty immediately protects you.</p>
    `,
  },
  "about-us": {
    title: "About CartShip",
    subtitle: "Pakistan's premier destination for smart lifestyle gadgets & essentials.",
    icon: "info",
    content: `
      <h2>Welcome to CartShip</h2>
      <p>CartShip is built to revolutionize online shopping in Pakistan by delivering high-quality, practical, and trendsetting gadgets, kitchen innovations, personal care devices, and lifestyle accessories directly to your doorstep.</p>

      <h2>Our Mission</h2>
      <p>We bridge the gap between quality and affordability. Every item in our catalog is carefully sourced, tested for durability, and backed by genuine customer support.</p>

      <h2>Why Choose CartShip?</h2>
      <ul>
        <li><strong>Cash on Delivery:</strong> Safe and stress-free shopping with payment on arrival.</li>
        <li><strong>Quality Checked:</strong> Rigorous product quality checks before shipping.</li>
        <li><strong>7-Day Checking Warranty:</strong> Complete peace of mind on every order.</li>
        <li><strong>Fast Dispatch:</strong> Swift fulfillment across all provinces of Pakistan.</li>
      </ul>
    `,
  },
  "contact-us": {
    title: "Contact Us",
    subtitle: "We're here to help! Reach out to our customer support team anytime.",
    icon: "phone",
    content: `
      <h2>Get In Touch</h2>
      <p>Have questions about a product, your order status, or wholesale inquiries? Our friendly support team is ready to assist you!</p>
      
      <h2>Customer Support Channels</h2>
      <ul>
        <li><strong>WhatsApp Support:</strong> Available Monday to Saturday, 10:00 AM – 8:00 PM.</li>
        <li><strong>Email:</strong> support@cartship.pk (Response within 24 hours).</li>
        <li><strong>Live Order Tracking:</strong> Track parcels 24/7 on our <a href="/track-order">Track Order Page</a>.</li>
      </ul>
    `,
  },
  "faq": {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers to common questions about orders, shipping, and returns.",
    icon: "help",
    content: `
      <h2>Frequently Asked Questions</h2>
      
      <h3>How do I place an order?</h3>
      <p>Browse our products, select your desired quantity or pack offer, and tap "Add to Cart" or "Buy Now". Fill in your shipping address and phone number, then confirm with Cash on Delivery.</p>

      <h3>How long does delivery take?</h3>
      <p>Orders typically arrive within 2 to 4 working days across Pakistan.</p>

      <h3>What if I receive a broken or defective item?</h3>
      <p>Every product is backed by our 7-Day Replacement Warranty. Simply reach out on WhatsApp with a photo/video, and we will dispatch a replacement.</p>

      <h3>Is there any delivery charge?</h3>
      <p>Standard delivery is Rs. 200–250. Orders over Rs. 3,000 receive <strong>Free Delivery</strong>!</p>
    `,
  },
};

function getIconComponent(iconType: string) {
  switch (iconType) {
    case "shield": return <ShieldCheck size={28} className="text-orange-500" />;
    case "rotate": return <RotateCcw size={28} className="text-orange-500" />;
    case "truck": return <Truck size={28} className="text-orange-500" />;
    case "phone": return <Phone size={28} className="text-orange-500" />;
    case "info": return <Info size={28} className="text-orange-500" />;
    case "help": return <HelpCircle size={28} className="text-orange-500" />;
    default: return <FileText size={28} className="text-orange-500" />;
  }
}

/** Cleans raw meta strings (e.g. "URL Slug:", "Meta Title:", etc.) if leaked into rich-text content */
function cleanContentHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  
  let cleaned = rawHtml;
  // Remove lines like "URL Slug: ...", "Meta Title: ...", "Meta Description: ..."
  cleaned = cleaned.replace(/<p[^>]*>\s*<strong>\s*(URL Slug|Meta Title|Meta Description)\s*:?\s*<\/strong>[^<]*<\/p>/gi, "");
  cleaned = cleaned.replace(/(URL Slug|Meta Title|Meta Description):\s*[^\n<]+/gi, "");
  cleaned = cleaned.replace(/<p[^>]*>\s*URL Slug:[^<]*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p[^>]*>\s*Meta Title:[^<]*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p[^>]*>\s*Meta Description:[^<]*<\/p>/gi, "");
  
  return cleaned;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  
  try {
    await connectToDatabase();
    const page = await Page.findOne({ slug: normalizedSlug, isActive: true }).lean();
    if (page) {
      return {
        title: `${page.title} | CartShip Pakistan`,
        description: `Read CartShip's official ${page.title}. 100% genuine products and reliable Cash on Delivery across Pakistan.`,
      };
    }
  } catch (err) {
    console.error("Metadata error:", err);
  }

  const defaultPage = DEFAULT_PAGES[normalizedSlug];
  if (defaultPage) {
    return {
      title: `${defaultPage.title} | CartShip Pakistan`,
      description: defaultPage.subtitle,
    };
  }

  return {
    title: "Page | CartShip Pakistan",
  };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  
  let pageTitle = "";
  let pageSubtitle = "Official store policy and customer information.";
  let pageContent = "";
  let iconName = "file";

  try {
    await connectToDatabase();
    const pageDoc = await Page.findOne({ slug: normalizedSlug, isActive: true }).lean() as any;
    if (pageDoc && pageDoc.content && pageDoc.content.trim().length > 20) {
      pageTitle = pageDoc.title;
      pageContent = cleanContentHtml(pageDoc.content);
    }
  } catch (error) {
    console.error("Error fetching custom page from database:", error);
  }

  // Use fallback if not found in DB or empty
  if (!pageContent && DEFAULT_PAGES[normalizedSlug]) {
    const fallback = DEFAULT_PAGES[normalizedSlug];
    pageTitle = fallback.title;
    pageSubtitle = fallback.subtitle;
    pageContent = fallback.content;
    iconName = fallback.icon;
  }

  if (!pageTitle) {
    pageTitle = normalizedSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream, #fdfbf7)" }}>
      {/* Top Announcements & Header */}
      <AnnouncementBar />
      <Navbar />

      {/* Hero Banner Header */}
      <section className="policy-hero">
        <div className="page-container policy-hero-inner">
          <div className="policy-breadcrumbs">
            <Link href="/" className="crumb-link">Home</Link>
            <ChevronRight size={14} className="crumb-separator" />
            <span className="crumb-current">Policies</span>
            <ChevronRight size={14} className="crumb-separator" />
            <span className="crumb-active">{pageTitle}</span>
          </div>

          <div className="policy-title-wrapper">
            <div className="policy-icon-badge">
              {getIconComponent(iconName)}
            </div>
            <div>
              <div className="policy-pill">
                <Sparkles size={13} style={{ color: "var(--orange, #FF6102)" }} />
                <span>CartShip Official Policy</span>
              </div>
              <h1 className="policy-title">{pageTitle}</h1>
              <p className="policy-subtitle">{pageSubtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Content Body */}
      <section className="policy-body-section">
        <div className="page-container policy-container">
          <div className="policy-card">
            {/* Last updated indicator */}
            <div className="policy-meta-bar">
              <div className="policy-meta-left">
                <Clock size={15} />
                <span>Last Updated: August 2026</span>
              </div>
              <div className="policy-meta-right">
                <ShieldCheck size={16} style={{ color: "#10b981" }} />
                <span>Applies to all orders in Pakistan</span>
              </div>
            </div>

            <div className="policy-divider" />

            {/* Rendered HTML Content */}
            <div
              className="static-page-content"
              dangerouslySetInnerHTML={{ __html: pageContent }}
            />

            {/* Need Help Box */}
            <div className="policy-support-box">
              <div className="support-box-content">
                <div className="support-box-icon">
                  <MessageCircle size={28} />
                </div>
                <div>
                  <h3 className="support-box-title">Have Questions About This Policy?</h3>
                  <p className="support-box-desc">
                    Our customer experience team is available on WhatsApp and email to assist you with order verification, replacements, and inquiries.
                  </p>
                </div>
              </div>
              <div className="support-box-actions">
                <a
                  href="https://wa.me/923000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-btn-whatsapp"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp Support</span>
                </a>
                <Link href="/track-order" className="support-btn-track">
                  <Truck size={18} />
                  <span>Track Your Order</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Rich CSS Styling for Static Pages */}
      <style>{`
        .policy-hero {
          background: linear-gradient(135deg, #091a38 0%, #102857 50%, #1e3a6e 100%);
          padding: 44px 0 52px;
          position: relative;
          overflow: hidden;
          border-bottom: 3px solid var(--orange, #FF6102);
        }
        .policy-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 85% 30%, rgba(255, 97, 2, 0.15) 0%, transparent 65%);
          pointer-events: none;
        }
        .policy-hero-inner {
          position: relative;
          z-index: 1;
        }
        .policy-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          font-family: var(--font-jakarta), sans-serif;
        }
        .crumb-link {
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          transition: color 0.2s;
        }
        .crumb-link:hover {
          color: #fff;
        }
        .crumb-separator {
          color: rgba(255, 255, 255, 0.35);
        }
        .crumb-current {
          color: rgba(255, 255, 255, 0.65);
        }
        .crumb-active {
          color: var(--orange, #FF6102);
          font-weight: 600;
        }
        .policy-title-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 24px;
        }
        .policy-icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        .policy-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          font-family: var(--font-jakarta), sans-serif;
          margin-bottom: 10px;
          backdrop-filter: blur(6px);
        }
        .policy-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .policy-subtitle {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          max-width: 650px;
          line-height: 1.5;
        }

        /* Body & Card */
        .policy-body-section {
          padding: 48px 0 80px;
          flex: 1;
        }
        .policy-container {
          max-width: 960px;
          margin: 0 auto;
        }
        .policy-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 10px 30px -5px rgba(16, 40, 87, 0.06), 0 2px 6px -1px rgba(16, 40, 87, 0.04);
          border: 1px solid rgba(16, 40, 87, 0.08);
        }
        .policy-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13.5px;
          color: var(--slate, #64748b);
          font-family: var(--font-jakarta), sans-serif;
          font-weight: 500;
        }
        .policy-meta-left, .policy-meta-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .policy-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 24px 0 36px;
        }

        /* Typography inside Static Page Content */
        .static-page-content {
          font-family: var(--font-jakarta), sans-serif !important;
          color: #334155 !important;
          line-height: 1.8 !important;
          font-size: 1.05rem !important;
        }
        .static-page-content h2 {
          font-family: var(--font-outfit), sans-serif !important;
          color: #0f172a !important;
          font-size: 1.45rem !important;
          font-weight: 800 !important;
          margin: 36px 0 16px !important;
          letter-spacing: -0.01em !important;
          padding-bottom: 8px !important;
          border-bottom: 2px solid #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
        }
        .static-page-content h2:first-of-type {
          margin-top: 0 !important;
        }
        .static-page-content h3 {
          font-family: var(--font-outfit), sans-serif !important;
          color: #1e293b !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          margin: 24px 0 10px !important;
        }
        .static-page-content p {
          margin-bottom: 18px !important;
          font-size: 1.05rem !important;
          color: #334155 !important;
          line-height: 1.8 !important;
        }
        .static-page-content ul, .static-page-content ol {
          margin: 16px 0 24px !important;
          padding-left: 24px !important;
        }
        .static-page-content ul li, .static-page-content ol li {
          margin-bottom: 10px !important;
          line-height: 1.7 !important;
          color: #334155 !important;
        }
        .static-page-content ul li strong, .static-page-content ol li strong {
          color: #0f172a !important;
        }
        .static-page-content a {
          color: var(--orange, #FF6102) !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          border-bottom: 1.5px solid rgba(255, 97, 2, 0.3) !important;
          transition: all 0.2s ease !important;
        }
        .static-page-content a:hover {
          color: #d94800 !important;
          border-color: #d94800 !important;
        }

        /* Support CTA Box */
        .policy-support-box {
          margin-top: 48px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }
        .support-box-content {
          display: flex;
          align-items: center;
          gap: 20px;
          max-width: 540px;
        }
        .support-box-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--orange, #FF6102);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }
        .support-box-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .support-box-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        .support-box-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .support-btn-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #25d366;
          color: #ffffff;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
        }
        .support-btn-whatsapp:hover {
          background: #1eb855;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }
        .support-btn-track {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .support-btn-track:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .policy-card {
            padding: 24px;
            border-radius: 16px;
          }
          .policy-title-wrapper {
            flex-direction: column;
            gap: 16px;
          }
          .policy-icon-badge {
            width: 52px;
            height: 52px;
          }
          .policy-support-box {
            padding: 20px;
          }
          .support-box-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .support-box-actions {
            width: 100%;
          }
          .support-btn-whatsapp, .support-btn-track {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}
