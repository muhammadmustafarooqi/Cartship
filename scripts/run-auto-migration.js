const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables if running locally
if (fs.existsSync(".env.local")) {
  require("dotenv").config({ path: ".env.local" });
}

const MONGODB_URI = process.env.MONGODB_URI;

/** High quality product mock images by category to safely replace broken 401 Cloudinary links */
const CATEGORY_FALLBACK_IMAGES = {
  electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop",
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&h=800&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=800&fit=crop",
  ],
  home: [
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&h=800&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  ],
};

function getFallbackImages(categoryName) {
  const cat = (categoryName || "").toLowerCase();
  if (cat.includes("kitchen") || cat.includes("cook")) return CATEGORY_FALLBACK_IMAGES.kitchen;
  if (cat.includes("beauty") || cat.includes("care") || cat.includes("personal")) return CATEGORY_FALLBACK_IMAGES.beauty;
  if (cat.includes("electronic") || cat.includes("gadget")) return CATEGORY_FALLBACK_IMAGES.electronics;
  if (cat.includes("home") || cat.includes("clean")) return CATEGORY_FALLBACK_IMAGES.home;
  return CATEGORY_FALLBACK_IMAGES.default;
}

async function autoMigrate() {
  if (!MONGODB_URI) {
    console.log("[Migration] No MONGODB_URI found, skipping build-time migration.");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    // Check if any products have cloudinary URLs
    const productsWithCloudinary = await db
      .collection("products")
      .find({ images: { $regex: "cloudinary.com" } })
      .toArray();

    if (productsWithCloudinary.length === 0) {
      console.log("[Migration] No broken Cloudinary URLs found. Database is up to date!");
      return;
    }

    console.log(`[Migration] Found ${productsWithCloudinary.length} products with broken Cloudinary URLs.`);
    
    // Check if user provided local replacement files in scripts/media or public/media
    const mediaDir = path.join(__dirname, "media");
    let hasLocalMedia = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).length > 0;

    let imagekit = null;
    if (process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_PUBLIC_KEY) {
      const ImageKit = require("imagekit");
      imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
      });
    }

    let updatedCount = 0;

    for (const p of productsWithCloudinary) {
      let newImages = [];
      const slugFolder = path.join(mediaDir, p.slug || "");

      // If local folder exists for this product slug, upload to ImageKit
      if (hasLocalMedia && imagekit && fs.existsSync(slugFolder)) {
        const files = fs.readdirSync(slugFolder).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
        for (const file of files) {
          const filePath = path.join(slugFolder, file);
          const base64 = fs.readFileSync(filePath).toString("base64");
          const uploadRes = await imagekit.upload({
            file: base64,
            fileName: `${p.slug}_${file}`,
            folder: "/cartship/products",
          });
          newImages.push(uploadRes.url);
        }
      }

      // If no local files provided, preserve valid URLs and filter out broken Cloudinary links
      if (newImages.length === 0) {
        const nonCloudinary = (p.images || []).filter((img) => !img.includes("cloudinary.com"));
        if (nonCloudinary.length > 0) {
          newImages = nonCloudinary;
        } else {
          // Provide clean fallback images so the storefront renders beautifully
          newImages = getFallbackImages(p.category);
        }
      }

      await db.collection("products").updateOne(
        { _id: p._id },
        { $set: { images: newImages } }
      );
      updatedCount++;
    }

    // Update categories with broken Cloudinary URLs
    await db.collection("categories").updateMany(
      { image: { $regex: "cloudinary.com" } },
      { $set: { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800" } }
    );

    // Update banners with broken Cloudinary URLs
    await db.collection("banners").updateMany(
      { image: { $regex: "cloudinary.com" } },
      { $set: { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200" } }
    );

    console.log(`[Migration] Successfully cleaned up ${updatedCount} products, categories, and banners!`);
  } catch (error) {
    console.error("[Migration Error]", error.message);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
  }
}

autoMigrate().then(() => process.exit(0));
