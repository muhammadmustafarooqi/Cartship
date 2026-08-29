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

async function uploadFile(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString("base64");
  const response = await ik.upload({
    file: base64,
    fileName: fileName,
    folder: "/cartship",
    useUniqueFileName: true,
  });
  return response.url;
}

async function run() {
  const mediaDir = path.join(__dirname, "media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log(`Created folder: ${mediaDir}`);
    console.log(`Drop your product images/folders into 'scripts/media' and re-run this script.`);
    process.exit(0);
  }

  const entries = fs.readdirSync(mediaDir);
  if (entries.length === 0) {
    console.log(`Folder 'scripts/media' is empty.`);
    console.log(`You can organize photos by:`);
    console.log(` 1. Subfolders named after product slug (e.g. 'scripts/media/anti-theft-sling-bag/img1.jpg')`);
    console.log(` 2. Or single files in 'scripts/media/'`);
    process.exit(0);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  console.log(`Found ${entries.length} items in scripts/media. Starting upload to ImageKit...`);

  for (const entry of entries) {
    const fullPath = path.join(mediaDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Subfolder named after product slug or ID
      const slug = entry.toLowerCase().trim();
      const files = fs.readdirSync(fullPath).filter((f) => /\.(jpe?g|png|webp|mp4)$/i.test(f));
      
      if (files.length === 0) continue;
      console.log(`\nProcessing folder for product slug '${slug}' (${files.length} images)...`);

      const uploadedUrls = [];
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        try {
          console.log(` Uploading ${file} to ImageKit...`);
          const url = await uploadFile(filePath, file);
          uploadedUrls.push(url);
          console.log(`   -> ${url}`);
        } catch (err) {
          console.error(`   Failed to upload ${file}:`, err.message);
        }
      }

      if (uploadedUrls.length > 0) {
        // Update product in MongoDB
        const result = await db.collection("products").updateOne(
          { slug: slug },
          { $set: { images: uploadedUrls } }
        );
        if (result.matchedCount > 0) {
          console.log(` Updated MongoDB product '${slug}' with ${uploadedUrls.length} new ImageKit images!`);
        } else {
          console.log(` Warning: No product found with slug '${slug}' in database. Images are uploaded to ImageKit.`);
        }
      }
    } else if (/\.(jpe?g|png|webp|mp4)$/i.test(entry)) {
      // Single file
      try {
        console.log(`Uploading file ${entry}...`);
        const url = await uploadFile(fullPath, entry);
        console.log(` -> URL: ${url}`);
      } catch (err) {
        console.error(` Failed to upload ${entry}:`, err.message);
      }
    }
  }

  console.log("\nFinished bulk upload!");
  process.exit(0);
}

run().catch(console.error);
