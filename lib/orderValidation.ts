import mongoose from "mongoose";
import Bundle from "@/models/Bundle";
import Product from "@/models/Product";

export interface CartItemInput {
  productId?: string;
  name?: string;
  quantity: number;
  image?: string;
  selectedColor?: string;
}

export interface ValidatedOrderItem {
  isGift?: boolean;
  productId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
}

export async function validateAndPriceOrderItems(items: CartItemInput[], session: mongoose.ClientSession) {
  let recalculatedSubtotal = 0;
  const validatedItems: ValidatedOrderItem[] = [];

  for (const item of items) {
    if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1) {
      throw new Error("Invalid item data format");
    }

    const quantity = Math.floor(item.quantity);
    const rawProductId = item.productId;
    let actualProductId = rawProductId;
    let isPack = false;
    let packQuantity = 1;

    // Check if it's a pack offer (e.g. "pack-64a1b2c3-2")
    if (rawProductId.startsWith("pack-")) {
      const parts = rawProductId.split("-");
      if (parts.length === 3) {
        actualProductId = parts[1];
        packQuantity = parseInt(parts[2], 10);
        isPack = true;
      }
    }

    if (!mongoose.Types.ObjectId.isValid(actualProductId)) {
      throw new Error(`Invalid product ID: ${actualProductId}`);
    }

    const product = await Product.findById(actualProductId).session(session);
    if (!product || !product.isActive) {
      throw new Error(`Product "${item.name}" is unavailable or does not exist.`);
    }

    let finalPrice = product.price;

    if (isPack) {
      // Find the bundle for this product
      const bundle = await Bundle.findOne({ product: product._id, isActive: true }).session(session);
      if (!bundle) {
        throw new Error(`Pack offer for "${product.name}" is no longer available.`);
      }

      // Find the specific pack
      const pack = bundle.packs.find((p: any) => p.quantity === packQuantity);
      if (!pack) {
        throw new Error(`The specific ${packQuantity}-pack offer for "${product.name}" is not available.`);
      }

      // Use authoritative price from bundle pack
      finalPrice = pack.price;
    }

    const totalRequiredQuantity = isPack ? packQuantity * quantity : quantity;

    if (product.stock !== undefined && product.stock < totalRequiredQuantity) {
      throw new Error(`Product "${product.name}" is out of stock. You requested ${totalRequiredQuantity} but only ${product.stock} are available.`);
    }

    // Decrement stock if tracked
    if (product.stock !== undefined) {
      product.stock -= totalRequiredQuantity;
      await product.save({ session });
    }

    recalculatedSubtotal += finalPrice * quantity;

    validatedItems.push({
      productId: product._id,
      name: item.name || product.name,
      price: finalPrice,
      quantity,
      image: item.image || (product.images && product.images[0]) || "",
      selectedColor: item.selectedColor || "",
    });
  }

  return { validatedItems, recalculatedSubtotal };
}
