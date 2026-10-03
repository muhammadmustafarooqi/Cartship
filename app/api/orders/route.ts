import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import Settings from "@/models/Settings";
import { generateOrderId, validatePakistaniPhone, calculateShipping } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { validateAndPriceOrderItems } from "@/lib/orderValidation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Protect: only admin can list all orders
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // cap at 100
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status && status !== "all") query.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({ orders, total, pages: Math.ceil(total / limit), page });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session = null;
  try {
    const authSession = await auth();
    await connectDB();
    const body = await request.json();

    // ── Server-side validation ──────────────────────────────────────
    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!body.phone?.trim() || !validatePakistaniPhone(body.phone)) {
      return NextResponse.json({ error: "Valid Pakistani phone number is required" }, { status: 400 });
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    if (!body.address?.trim() || body.address.trim().length < 10) {
      return NextResponse.json({ error: "Complete delivery address is required" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    // Start Mongoose Transaction
    // NOTE: MongoDB must be running as a replica set for transactions to work.
    // If not configured, this will throw an error.
    session = await mongoose.startSession();
    session.startTransaction();

    let validationResult;
    try {
      validationResult = await validateAndPriceOrderItems(body.items, session);
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const { validatedItems, recalculatedSubtotal } = validationResult;
    const recalcSubtotal = recalculatedSubtotal;

    // Fetch settings for dynamic shipping calculation
    let settings = await Settings.findOne().session(session);
    const freeDeliveryAbove = settings?.freeDeliveryAbove || 3000;
    const deliveryFee = settings?.deliveryFee || 200;

    let recalcShipping = calculateShipping(recalcSubtotal, freeDeliveryAbove, deliveryFee);

    // Coupon Validation & Application Logic
    let discountAmount = 0;
    let appliedCouponCode = "";
    let isCouponUsed = false;
    let couponUserDoc: any = null;

    if (body.couponCode && body.couponCode.trim()) {
      const cleanCode = body.couponCode.trim().toUpperCase();

      // 1. Try Global Admin Coupons first
      const globalCoupon = await Coupon.findOne({ code: cleanCode, isActive: true }).session(session);
      if (globalCoupon) {
        const hasExpired = globalCoupon.expiresAt && new Date(globalCoupon.expiresAt) < new Date();
        const overLimit = globalCoupon.usageLimit && globalCoupon.timesUsed >= globalCoupon.usageLimit;
        const meetsMinPurchase = recalcSubtotal >= (globalCoupon.minPurchase || 0);

        if (!hasExpired && !overLimit && meetsMinPurchase) {
          appliedCouponCode = cleanCode;
          isCouponUsed = true;
          
          if (globalCoupon.discountType === "percentage") {
            discountAmount = Math.round(recalcSubtotal * (globalCoupon.discountValue / 100));
          } else if (globalCoupon.discountType === "fixed") {
            discountAmount = globalCoupon.discountValue;
          } else if (globalCoupon.discountType === "free_shipping") {
            recalcShipping = 0;
          }

          globalCoupon.timesUsed += 1;
          await globalCoupon.save({ session });
        }
      } else {
        // 2. Fallback to Spin-to-Win User Coupons
        const normalizedPhone = body.phone.trim().replace(/\s+/g, "").replace(/-/g, "");
        let couponUser = await User.findOne({ 
          $or: [
            { phone: normalizedPhone },
            { phone: body.phone.trim() }
          ]
        }).session(session);

        if (!couponUser && authSession && authSession.user && authSession.user.email) {
          couponUser = await User.findOne({ email: authSession.user.email.toLowerCase() }).session(session);
        }

        if (couponUser && couponUser.couponCode === cleanCode && couponUser.couponStatus === "active") {
          const hasExpired = couponUser.couponExpiry && new Date(couponUser.couponExpiry) < new Date();
          
          if (!hasExpired) {
            appliedCouponCode = cleanCode;
            couponUserDoc = couponUser;
            const prefix = cleanCode.split("-")[0];

            switch (prefix) {
              case "WIN10":
                discountAmount = Math.round(recalcSubtotal * 0.1);
                break;
              case "WIN5":
                discountAmount = Math.round(recalcSubtotal * 0.05);
                break;
              case "FREE":
                recalcShipping = 0;
                break;
              case "CASH150":
                discountAmount = 150;
                break;
              case "CASH200":
                discountAmount = 200;
                break;
              case "RETURNS":
                discountAmount = Math.round(recalcSubtotal * 0.1);
                break;
              case "B2G10":
                const qtyB2 = validatedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
                if (qtyB2 >= 2) discountAmount = Math.round(recalcSubtotal * 0.1);
                break;
              case "B3G15":
                const qtyB3 = validatedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
                if (qtyB3 >= 3) discountAmount = Math.round(recalcSubtotal * 0.15);
                break;
              case "GIFT":
                validatedItems.push({
                  isGift: true,
                  name: "Surprise Gift (Promo Reward)",
                  price: 0,
                  quantity: 1,
                  image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=200",
                });
                break;
              case "B4G1":
                const qtyB4 = validatedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
                if (qtyB4 >= 4) {
                  const prices = validatedItems.map((item: any) => item.price);
                  const cheapestPrice = Math.min(...prices);
                  discountAmount = cheapestPrice;
                }
                break;
            }
            isCouponUsed = true;
          }
        }
      }
    }

    const recalcTotal = Math.max(0, (recalcSubtotal - discountAmount)) + recalcShipping;

    // Generate unique order ID
    let orderId = generateOrderId();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await Order.findOne({ orderId }).session(session);
      if (!existing) break;
      orderId = generateOrderId();
      attempts++;
    }

    // Create Order
    const order = new Order({
      orderId,
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      city: body.city.trim(),
      address: body.address.trim(),
      notes: body.notes?.trim() || "",
      items: validatedItems,
      subtotal: recalcSubtotal,
      shippingFee: recalcShipping,
      total: recalcTotal,
      paymentMethod: "COD",
      status: "Pending",
      couponCode: appliedCouponCode,
      discount: discountAmount
    });

    await order.save({ session });

    // Mark user's coupon as used
    if (isCouponUsed && couponUserDoc) {
      couponUserDoc.couponStatus = "used";
      await couponUserDoc.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // --- Meta Conversions API (CAPI) Integration ---
    try {
      const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "936202355839835";
      const capiToken = process.env.META_CAPI_TOKEN;
      
      if (capiToken) {
        const hashData = (data: string) => crypto.createHash("sha256").update(data).digest("hex");
        
        let hashedPhone = "";
        if (body.phone) {
          // Clean phone and ensure 92 prefix (Pakistani format)
          let cleanPhone = body.phone.trim().replace(/\D/g, "");
          if (cleanPhone.startsWith("0")) {
            cleanPhone = "92" + cleanPhone.substring(1);
          }
          hashedPhone = hashData(cleanPhone);
        }

        const cleanCity = body.city ? body.city.toLowerCase().trim().replace(/[^a-z]/g, "") : "";
        const hashedCity = cleanCity ? hashData(cleanCity) : "";
        const hashedCountry = hashData("pk");

        let hashedFirstName = "";
        let hashedLastName = "";
        if (body.customerName) {
          const parts = body.customerName.trim().split(/\s+/);
          if (parts[0]) hashedFirstName = hashData(parts[0].toLowerCase());
          if (parts.length > 1) hashedLastName = hashData(parts.slice(1).join(" ").toLowerCase());
        }

        let hashedEmail = "";
        const userEmail = body.email || authSession?.user?.email;
        if (userEmail) {
          hashedEmail = hashData(userEmail.toLowerCase().trim());
        }

        const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "";
        const userAgent = request.headers.get("user-agent") || "";

        const eventPayload = {
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_id: orderId,
              user_data: {
                client_ip_address: clientIp,
                client_user_agent: userAgent,
                ...(hashedPhone ? { ph: [hashedPhone] } : {}),
                ...(hashedEmail ? { em: [hashedEmail] } : {}),
                ...(hashedFirstName ? { fn: [hashedFirstName] } : {}),
                ...(hashedLastName ? { ln: [hashedLastName] } : {}),
                ...(hashedCity ? { ct: [hashedCity] } : {}),
                country: [hashedCountry],
              },
              custom_data: {
                currency: "PKR",
                value: recalcTotal
              }
            }
          ]
        };

        const capiResponse = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        });
        
        if (!capiResponse.ok) {
          const errData = await capiResponse.text();
          console.error("Meta CAPI Error:", errData);
        } else {
          console.log("Meta CAPI Purchase event sent successfully for order:", orderId);
        }
      }
    } catch (capiError) {
      console.error("Meta CAPI execution error:", capiError);
    }
    // -----------------------------------------------

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
