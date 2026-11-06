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
    content: `<p><strong>Last Updated:</strong> November 4, 2026</p>
<p>At <strong>CartShip</strong> (accessible from <a href="https://cartship.pk">https://cartship.pk</a>), protecting our visitors' privacy is one of our main priorities. This Privacy Policy explains what information may be collected, how it is used, and how third-party advertising services operate on our website.</p>
<h2>1. Information We Collect</h2>
<p>We may collect information such as your browser type, device information, IP address, pages visited, and other usage information when you visit our website. If you contact us or place an order, we may also receive the information you voluntarily provide (such as your name, delivery address, phone number, and email).</p>
<h2>2. Cookies and Web Beacons</h2>
<p>Our website may use cookies and similar technologies to improve the browsing experience, remember shopping cart items, understand website traffic, and display advertisements.</p>
<p>Cookies are small files stored on your device that help websites recognize browsers and remember certain information.</p>
<h2>3. Google AdSense and Third-Party Advertising</h2>
<p>We may use Google AdSense to display advertisements on our website. Google and other third-party advertising providers may use cookies, web beacons, IP addresses, or similar technologies to collect information when advertisements are displayed.</p>
<p>This information may be used to provide, measure, and personalize advertisements, subject to your applicable privacy settings and consent choices.</p>
<p>For more information about how Google uses information from websites that use its services, please visit: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/partner-sites</a></p>
<p>You can learn more about Google's advertising practices here: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a></p>
<h2>4. Third-Party Privacy Policies</h2>
<p>Our website may contain advertisements or links to third-party websites. These websites have their own privacy policies and practices. We encourage visitors to review the privacy policies of any third-party services they use.</p>
<h2>5. How We Use Information</h2>
<p>We may use collected information to:</p>
<ul>
  <li>Operate and maintain our website.</li>
  <li>Fulfill Cash on Delivery (COD) orders and coordinate delivery with couriers.</li>
  <li>Improve website performance and user experience.</li>
  <li>Understand visitor activity and website traffic.</li>
  <li>Display and measure advertisements.</li>
  <li>Protect our website against fraud, abuse, and security threats.</li>
</ul>
<h2>6. Your Privacy Choices</h2>
<p>You may be able to manage cookies through your browser settings and control personalized advertising through your Google Account's ad settings.</p>
<p>Where required by applicable law, we will provide appropriate consent choices and respect users' applicable privacy rights.</p>
<h2>7. Children's Privacy</h2>
<p>Our website does not knowingly collect personal information from children in violation of applicable privacy laws. If you believe a child has provided personal information improperly, please contact us so that we can review the matter.</p>
<h2>8. Data Security</h2>
<p>We take reasonable measures to protect information associated with our website. However, no method of transmission or electronic storage can be guaranteed to be completely secure.</p>
<h2>9. Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time. Any changes will be published on this page, together with an updated revision date.</p>
<h2>10. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us:</p>
<ul>
  <li><strong>Website Name:</strong> CartShip</li>
  <li><strong>Website URL:</strong> <a href="https://cartship.pk">https://cartship.pk</a></li>
  <li><strong>Email:</strong> support@cartship.pk</li>
  <li><strong>Phone:</strong> +92 300 1234567</li>
</ul>
<p>By using our website, you acknowledge that you have read this Privacy Policy.</p>`,
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
    content: "<h2>Contact Us</h2><p>Have questions? We're here to help!</p><ul><li><strong>Email:</strong> support@cartship.pk</li><li><strong>Phone:</strong> +92 300 1234567</li><li><strong>Address:</strong> CartShip Headquarters, Pakistan</li></ul><p>Or simply use the WhatsApp widget at the bottom right of the screen to chat with us directly.</p>",
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
        existingPage.title = pageData.title;
        existingPage.content = pageData.content;
        existingPage.isActive = pageData.isActive;
        await existingPage.save();
        console.log(`Page '${pageData.title}' updated with latest content.`);
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
