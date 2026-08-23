import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import FAQ from "../models/FAQ";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable in .env.local");
  process.exit(1);
}

const faqsToSeed = [
  {
    question: "What is your return policy?",
    answer: "We offer a 7-day hassle-free return policy for all unused products in their original packaging. Simply contact our support team to initiate a return.",
    order: 1,
    isActive: true,
  },
  {
    question: "Do you offer Cash on Delivery?",
    answer: "Yes, we offer Cash on Delivery (COD) across Pakistan. You can inspect your package before handing over the payment to our delivery partners.",
    order: 2,
    isActive: true,
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping typically takes 2-4 business days for major cities, and up to 5-7 days for remote areas.",
    order: 3,
    isActive: true,
  },
  {
    question: "Are your products covered by warranty?",
    answer: "All electronics and appliances come with a minimum 6-month brand warranty. Specific warranty details are listed on the individual product pages.",
    order: 4,
    isActive: true,
  }
];

async function seedFaqs() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    for (const faqData of faqsToSeed) {
      const existingFaq = await FAQ.findOne({ question: faqData.question });
      if (existingFaq) {
        console.log(`FAQ '${faqData.question}' already exists. Skipping.`);
      } else {
        await FAQ.create(faqData);
        console.log(`Created FAQ: '${faqData.question}'`);
      }
    }

    console.log("Seeding FAQs complete!");
  } catch (error) {
    console.error("Error seeding FAQs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedFaqs();
