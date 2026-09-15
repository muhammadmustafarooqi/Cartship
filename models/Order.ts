import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  bundleId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isGift?: boolean;
  selectedColor?: string;
  selectedBundleItems?: { productId: mongoose.Types.ObjectId; name: string }[];
}

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: "COD";
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  notes: string;
  trackingNumber?: string;
  courierName?: string;
  couponCode?: string;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  bundleId: { type: Schema.Types.ObjectId, ref: "Bundle" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: "" },
  isGift: { type: Boolean, default: false },
  selectedColor: { type: String, default: "" },
  selectedBundleItems: [
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String },
    },
  ],
});

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 200 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    notes: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    courierName: { type: String, default: "" },
    couponCode: { type: String, default: "" },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
