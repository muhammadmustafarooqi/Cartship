import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Page from "../models/Page";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable in .env.local");
  process.exit(1);
}

const pagesToSeed = [
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: "<h2>Privacy Policy</h2><p>Your privacy is important to us. It is CartShip's policy to respect your privacy regarding any information we may collect from you across our website. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>",
    isActive: true,
  },
  {
    title: "Terms of Service",
    slug: "terms-of-service",
    content: "<h2>Terms of Service</h2><p>By accessing the website at CartShip, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>",
    isActive: true,
  },
  {
    title: "Return & Refund Policy",
    slug: "return-refund-policy",
    content: "<h2>Return & Refund Policy</h2><p>We offer a 7-day hassle-free return policy for all unused products in their original packaging. Simply contact our support team to initiate a return. If your return is approved, we will initiate a refund to your original method of payment.</p>",
    isActive: true,
  },
  {
    title: "Shipping Policy",
    slug: "shipping-policy",
    content: "<h2>Shipping Policy</h2><p>Standard shipping typically takes 2-4 business days for major cities, and up to 5-7 days for remote areas. We offer Cash on Delivery (COD) across Pakistan. You can inspect your package before handing over the payment to our delivery partners.</p>",
    isActive: true,
  },
  {
    title: "About Us",
    slug: "about-us",
    content: "<h2>About Us</h2><p>CartShip is an ultra-premium e-commerce platform dedicated to bringing you the best products at unbeatable prices. We pride ourselves on excellent customer service, rapid delivery, and a seamless shopping experience.</p>",
    isActive: true,
  },
  {
    title: "Contact Us",
    slug: "contact-us",
    content: "<h2>Contact Us</h2><p>Have questions? We're here to help!</p><ul><li><strong>Email:</strong> support@cartship.com</li><li><strong>Phone:</strong> +92 300 1234567</li><li><strong>Address:</strong> CartShip Headquarters, Pakistan</li></ul><p>Or simply use the WhatsApp widget at the bottom right of the screen to chat with us directly.</p>",
    isActive: true,
  }
];

async function seedPages() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    for (const pageData of pagesToSeed) {
      const existingPage = await Page.findOne({ slug: pageData.slug });
      if (existingPage) {
        console.log(`Page '${pageData.title}' already exists. Skipping.`);
      } else {
        await Page.create(pageData);
        console.log(`Created page: '${pageData.title}'`);
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding pages:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedPages();
