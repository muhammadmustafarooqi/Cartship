import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  storeName: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappNumber: string;
  supportEmail?: string;
  supportPhone?: string;
  storeAddress?: string;
  deliveryFee: number;
  freeDeliveryAbove: number;
  announcementBarText: string;
  announcementBarActive: boolean;
  marqueeItems: Array<{ icon: string; text: string }>;
  offerBanner: {
    isActive: boolean;
    kickerText: string;
    kickerSubtext: string;
    titleLine1: string;
    titleLine2: string;
    highlightText: string;
    description: string;
    perk1Title: string;
    perk1Text: string;
    perk2Title: string;
    perk2Text: string;
    buttonText: string;
    buttonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    statValue: string;
    statLabel: string;
    stat2Value: string;
    stat2Label: string;
    panelNote: string;
  };
  navbar: {
    links: Array<{ label: string; href: string }>;
  };
  footer: {
    description: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    socialLinks: Array<{ platform: string; url: string }>;
    footerLinks: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
    policies: Array<{ label: string; href: string }>;
    codMessage: string;
  };
  adminEmail: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "CartShip" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    whatsappNumber: {
      type: String,
      default: process.env.WHATSAPP_NUMBER || "923713869780",
    },
    supportEmail: { type: String, default: "support@cartship.pk" },
    supportPhone: { type: String, default: "+92 300 1234567" },
    storeAddress: { type: String, default: "CartShip Headquarters, Pakistan" },
    deliveryFee: { type: Number, default: 200 },
    freeDeliveryAbove: { type: Number, default: 3000 },
    announcementBarText: {
      type: String,
      default:
        "Free Delivery on Orders Above PKR 1500 | COD Available Nationwide",
    },
    announcementBarActive: { type: Boolean, default: true },
    marqueeItems: {
      type: [
        {
          icon: String,
          text: String,
        },
      ],
      default: [
        { icon: "Lock", text: "Secure & Safe Shopping" },
        { icon: "Users", text: "10,000+ Happy Customers" },
        { icon: "Truck", text: "Free Shipping Over Rs. 1,500" },
        { icon: "ShieldCheck", text: "100% Authentic Products" },
        { icon: "Banknote", text: "Cash on Delivery" },
      ],
    },
    offerBanner: {
      type: {
        isActive: { type: Boolean, default: true },
        kickerText: { type: String, default: "Limited-time offer" },
        kickerSubtext: { type: String, default: "Ends when slots fill — same-day replies on WhatsApp" },
        titleLine1: { type: String, default: "FREE delivery + COD" },
        titleLine2: { type: String, default: "on carts" },
        highlightText: { type: String, default: "Rs. 1,500+" },
        description: { type: String, default: "Nationwide shipping, pay when it lands — no advance on standard orders. Stack cart value once and both perks unlock at checkout." },
        perk1Title: { type: String, default: "Free shipping" },
        perk1Text: { type: String, default: "Orders Rs. 1,500+ ship on us" },
        perk2Title: { type: String, default: "COD unlocked" },
        perk2Text: { type: String, default: "Pay on delivery, zero prepay" },
        buttonText: { type: String, default: "Shop the offer" },
        buttonLink: { type: String, default: "/products" },
        secondaryButtonText: { type: String, default: "Featured picks" },
        secondaryButtonLink: { type: String, default: "/products?featured=true" },
        statValue: { type: String, default: "Rs. 1,500" },
        statLabel: { type: String, default: "Minimum cart for free delivery" },
        stat2Value: { type: String, default: "COD" },
        stat2Label: { type: String, default: "No advance on standard orders" },
        panelNote: { type: String, default: "Same dispatch and support as the rest of the store — only checkout perks change so you keep full confidence." },
      },
      default: {
        isActive: true,
        kickerText: "Limited-time offer",
        kickerSubtext: "Ends when slots fill — same-day replies on WhatsApp",
        titleLine1: "FREE delivery + COD",
        titleLine2: "on carts",
        highlightText: "Rs. 1,500+",
        description: "Nationwide shipping, pay when it lands — no advance on standard orders. Stack cart value once and both perks unlock at checkout.",
        perk1Title: "Free shipping",
        perk1Text: "Orders Rs. 1,500+ ship on us",
        perk2Title: "COD unlocked",
        perk2Text: "Pay on delivery, zero prepay",
        buttonText: "Shop the offer",
        buttonLink: "/products",
        secondaryButtonText: "Featured picks",
        secondaryButtonLink: "/products?featured=true",
        statValue: "Rs. 1,500",
        statLabel: "Minimum cart for free delivery",
        stat2Value: "COD",
        stat2Label: "No advance on standard orders",
        panelNote: "Same dispatch and support as the rest of the store — only checkout perks change so you keep full confidence.",
      },
    },
    adminEmail: { type: String, default: "" },
    navbar: {
      links: {
        type: [
          {
            label: String,
            href: String,
          },
        ],
        default: [
          { label: "Home", href: "/" },
          { label: "Shop All", href: "/products" },
          { label: "Kitchen", href: "/products?category=kitchen-cooking" },
          { label: "Personal Care", href: "/products?category=personal-care-beauty" },
          { label: "Electronics", href: "/products?category=electronics-gadgets" },
        ],
      },
    },
    footer: {
      description: {
        type: String,
        default: "Pakistan's premier destination for ultra-premium tech, modern home appliances, and intelligent daily accessories.",
      },
      contactEmail: {
        type: String,
        default: "support@cartship.pk",
      },
      contactPhone: {
        type: String,
        default: "923713869780",
      },
      contactAddress: {
        type: String,
        default: "Islamabad, Pakistan",
      },
      socialLinks: {
        type: [
          {
            platform: String,
            url: String,
          },
        ],
        default: [
          { platform: "facebook", url: "#" },
          { platform: "instagram", url: "#" },
          { platform: "whatsapp", url: "#" },
        ],
      },
      footerLinks: {
        type: [
          {
            title: String,
            links: [
              {
                label: String,
                href: String,
              },
            ],
          },
        ],
        default: [
          {
            title: "Explore",
            links: [
              { label: "Home", href: "/" },
              { label: "Premium Collection", href: "/products" },
              { label: "Shopping Cart", href: "/cart" },
              { label: "Admin Portal", href: "/admin/dashboard" },
            ],
          },
          {
            title: "Departments",
            links: [
              { label: "Smart Kitchen", href: "/products?category=kitchen-cooking" },
              { label: "Personal Care", href: "/products?category=personal-care-beauty" },
              { label: "Home Essentials", href: "/products?category=home-cleaning" },
              { label: "Fitness & Health", href: "/products?category=fitness-health" },
              { label: "Tech Gadgets", href: "/products?category=electronics-gadgets" },
            ],
          },
        ],
      },
      policies: {
        type: [
          {
            label: String,
            href: String,
          },
        ],
        default: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of Service", href: "#" },
          { label: "Return Policy", href: "#" },
        ],
      },
      codMessage: {
        type: String,
        default: "Secure payments at your doorstep. Free shipping over Rs. 3000.",
      },
    },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
