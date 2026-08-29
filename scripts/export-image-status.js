const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ImageKit = require("imagekit");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI missing in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const products = await db.collection("products").find({}).toArray();
  const categories = await db.collection("categories").find({}).toArray();
  const banners = await db.collection("banners").find({}).toArray();

  const report = {
    productsWithCloudinary: [],
    categoriesWithCloudinary: [],
    bannersWithCloudinary: [],
  };

  for (const p of products) {
    const cloudImgs = (p.images || []).filter((img) => img.includes("cloudinary"));
    if (cloudImgs.length > 0) {
      report.productsWithCloudinary.push({
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        category: p.category,
        imageCount: cloudImgs.length,
      });
    }
  }

  for (const c of categories) {
    if (c.image?.includes("cloudinary") || c.icon?.includes("cloudinary")) {
      report.categoriesWithCloudinary.push({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        image: c.image,
        icon: c.icon,
      });
    }
  }

  for (const b of banners) {
    if (b.image?.includes("cloudinary")) {
      report.bannersWithCloudinary.push({
        id: b._id.toString(),
        title: b.title,
        image: b.image,
      });
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "cloudinary-items-report.json"),
    JSON.stringify(report, null, 2)
  );

  console.log("=== CLOUDINARY STATUS REPORT ===");
  console.log(`Products affected: ${report.productsWithCloudinary.length}`);
  console.log(`Categories affected: ${report.categoriesWithCloudinary.length}`);
  console.log(`Banners affected: ${report.bannersWithCloudinary.length}`);
  console.log(`\nDetailed report saved to: scripts/cloudinary-items-report.json`);

  process.exit(0);
}

main().catch(console.error);
