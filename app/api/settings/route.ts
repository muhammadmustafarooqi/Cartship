import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne().lean();
    
    // If no settings exist, return defaults
    if (!settings) {
      const defaults = {
        storeName: "CartShip",
        whatsappNumber: "923713869780",
        supportEmail: "support@cartship.pk",
        supportPhone: "+92 300 1234567",
        storeAddress: "CartShip Headquarters, Pakistan",
        deliveryFee: 200,
        freeDeliveryAbove: 3000,
        announcementBarText: "Free Delivery on Orders Above PKR 3000 | COD Available Nationwide",
        announcementBarActive: true,
        marqueeItems: [
          { icon: "Lock", text: "Secure & Safe Shopping" },
          { icon: "Users", text: "10,000+ Happy Customers" },
          { icon: "Truck", text: "Free Shipping Over Rs. 1,500" },
          { icon: "ShieldCheck", text: "100% Authentic Products" },
          { icon: "Banknote", text: "Cash on Delivery" },
        ],
      };
      return NextResponse.json(defaults, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return defaults on error instead of error response
    return NextResponse.json({
      storeName: "CartShip",
      whatsappNumber: "923713869780",
      supportEmail: "support@cartship.pk",
      supportPhone: "+92 300 1234567",
      storeAddress: "CartShip Headquarters, Pakistan",
      deliveryFee: 200,
      freeDeliveryAbove: 3000,
      announcementBarText: "Free Delivery on Orders Above PKR 3000 | COD Available Nationwide",
      announcementBarActive: true,
      marqueeItems: [
        { icon: "Lock", text: "Secure & Safe Shopping" },
        { icon: "Users", text: "10,000+ Happy Customers" },
        { icon: "Truck", text: "Free Shipping Over Rs. 1,500" },
        { icon: "ShieldCheck", text: "100% Authentic Products" },
        { icon: "Banknote", text: "Cash on Delivery" },
      ],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Keep support contact fields synced with footer contact info
    if (body.supportEmail && !body.footer?.contactEmail) {
      body.footer = { ...(body.footer || {}), contactEmail: body.supportEmail };
    } else if (body.footer?.contactEmail && !body.supportEmail) {
      body.supportEmail = body.footer.contactEmail;
    }

    if (body.supportPhone && !body.footer?.contactPhone) {
      body.footer = { ...(body.footer || {}), contactPhone: body.supportPhone };
    } else if (body.footer?.contactPhone && !body.supportPhone) {
      body.supportPhone = body.footer.contactPhone;
    }

    if (body.storeAddress && !body.footer?.contactAddress) {
      body.footer = { ...(body.footer || {}), contactAddress: body.storeAddress };
    } else if (body.footer?.contactAddress && !body.storeAddress) {
      body.storeAddress = body.footer.contactAddress;
    }

    // Use findOneAndUpdate to properly merge nested objects
    const settings = await Settings.findOneAndUpdate(
      {}, // Match any single document
      body, // Update with the provided data
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Failed to save settings", details: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (body.supportEmail && !body.footer?.contactEmail) {
      body.footer = { ...(body.footer || {}), contactEmail: body.supportEmail };
    }
    if (body.supportPhone && !body.footer?.contactPhone) {
      body.footer = { ...(body.footer || {}), contactPhone: body.supportPhone };
    }
    if (body.storeAddress && !body.footer?.contactAddress) {
      body.footer = { ...(body.footer || {}), contactAddress: body.storeAddress };
    }

    const settings = await Settings.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings", details: String(error) }, { status: 500 });
  }
}
