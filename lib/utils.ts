// Generate WhatsApp URL for order confirmation
export function generateWhatsAppOrderURL(
  order: {
    orderId: string;
    customerName: string;
    phone: string;
    city: string;
    address: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingFee: number;
    paymentMethod: string;
  },
  whatsappNumber: string
): string {
  const itemsList = order.items
    .map((item) => `• ${item.name} x${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}`)
    .join("\n");

  const message = `*NEW ORDER #${order.orderId}*

*Customer:* ${order.customerName}
*Phone:* ${order.phone}
*City:* ${order.city}
*Address:* ${order.address}

*Order items:*
${itemsList}

*Shipping:* Rs. ${order.shippingFee}
*Total:* Rs. ${order.total.toLocaleString()}
*Payment:* ${order.paymentMethod}

Please confirm the order!`;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Generate customer WhatsApp URL for product enquiry
export function generateProductWhatsAppURL(
  product: {
    name: string;
    price: number;
  },
  whatsappNumber: string
): string {
  const message = `Hi! I'm interested in ordering:\n\n*${product.name}*\nPrice: Rs. ${product.price.toLocaleString()}\n\nPlease confirm availability.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Format price in PKR
export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

// Generate order ID
export function generateOrderId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `SHC-${num}`;
}

// Calculate shipping fee
export function calculateShipping(subtotal: number, freeAbove = 3000, fee = 200): number {
  return subtotal >= freeAbove ? 0 : fee;
}

// Validate Pakistani phone number
export function validatePakistaniPhone(phone: string): boolean {
  const regex = /^03[0-9]{9}$/;
  return regex.test(phone.replace(/\s/g, ""));
}

// Pakistani cities list
export const PAKISTANI_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Sukkur",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Mardan",
  "Mingora",
  "Nawabshah",
  "Sahiwal",
  "Mirpur Khas",
  "Larkana",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Dera Ghazi Khan",
  "Gujrat",
  "Wah Cantonment",
  "Kasur",
  "Okara",
  "Chiniot",
  "Kotri",
  "Kamoke",
  "Hafizabad",
  "Sadiqabad",
  "Burewala",
  "Kohat",
  "Khanewal",
  "Dera Ismail Khan",
  "Muzaffargarh",
  "Muridke",
  "Jhelum",
  "Shikarpur",
  "Jacobabad",
  "Muzaffarabad",
  "Mirpur (AJK)",
  "Gilgit",
  "Skardu",
  "Khuzdar",
  "Hub",
  "Turbat",
  "Other",
];

// Product categories
export const PRODUCT_CATEGORIES = [
  { name: "Kitchen & Cooking", slug: "kitchen-cooking" },
  { name: "Personal Care & Beauty", slug: "personal-care-beauty" },
  { name: "Home & Cleaning", slug: "home-cleaning" },
  { name: "Fitness & Health", slug: "fitness-health" },
  { name: "Electronics & Gadgets", slug: "electronics-gadgets" },
  { name: "Baby & Kids", slug: "baby-kids" },
];

// Common product colors
export const PRODUCT_COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Gray",
  "Silver",
  "Gold",
  "Brown",
  "Beige",
  "Navy",
  "Maroon",
  "Teal",
  "Mint",
  "Rose Gold",
  "Multicolor",
];

// Helper to get hex or CSS color for color swatches
export function getColorHex(colorName: string): string {
  if (!colorName) return "#cbd5e1";
  const normalized = colorName.trim().toLowerCase();

  if (normalized.startsWith("#") || normalized.startsWith("rgb") || normalized.startsWith("hsl") || normalized.startsWith("linear-gradient")) {
    return colorName;
  }

  const colorMap: Record<string, string> = {
    black: "#0f172a",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#16a34a",
    yellow: "#eab308",
    pink: "#ec4899",
    purple: "#a855f7",
    orange: "#f97316",
    gray: "#64748b",
    grey: "#64748b",
    silver: "#94a3b8",
    gold: "#d97706",
    golden: "#d97706",
    brown: "#78350f",
    beige: "#f5f5dc",
    navy: "#1e3a8a",
    maroon: "#800000",
    teal: "#0d9488",
    mint: "#6ee7b7",
    "rose gold": "#f43f5e",
    rose: "#f43f5e",
    multicolor: "linear-gradient(135deg, #ff0000, #00ff00, #0000ff)",
    cyan: "#06b6d4",
    olive: "#65a30d",
    violet: "#7c3aed",
    emerald: "#059669",
    amber: "#d97706",
  };

  return colorMap[normalized] || normalized;
}

