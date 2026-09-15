"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, ChevronDown, Phone, MapPin, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "@/lib/useSettings";

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image: string;
    isGift?: boolean;
    selectedColor?: string;
    bundleId?: string;
    selectedBundleItems?: Array<{ name: string }>;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  notes: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const STATUS_COLORS: Record<string, string> = {
  Pending: "status-pending",
  Confirmed: "status-confirmed",
  Shipped: "status-shipped",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

const FILTERS = [
  "All",
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { settings } = useSettings();

  const fetchOrders = useCallback(async () => {
    try {
      const status = filter === "All" ? "" : filter;
      const res = await fetch(`/api/orders?status=${status}&limit=50`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchOrders();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: status as Order["status"] } : null,
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete order #${orderId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete order");
      }

      toast.success("Order deleted successfully");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to delete order");
    }
  };

  const generateWhatsAppUrl = (order: Order) => {
    const whatsappNumber =
      settings?.whatsappNumber || "923713869780";
    const customerPhone = order.phone.replace(/^0/, "92");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.cartship.pk";
    const msg = `Hi ${order.customerName}! Your order #${order.orderId} from CartShip is now *${order.status}*.\nTotal: Rs. ${order.total.toLocaleString()} (COD).\n\n📦 *Track your order live here:*\n${siteUrl}/track-order\n\nTo track your order, simply enter:\nOrder ID: *${order.orderId}*\nPhone: *${order.phone}*\n\nThank you for shopping with us!`;
    return `https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="admin-page-container admin-orders-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937" }}>
            Orders
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            {orders.length} orders
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setLoading(true);
            }}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              border: "2px solid",
              borderColor: filter === f ? "#ff6b00" : "#e5e7eb",
              background: filter === f ? "#ff6b00" : "white",
              color: filter === f ? "white" : "#374151",
              cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              transition: "all 0.2s ease",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div
        className="orders-layout"
        style={{
          display: "grid",
          gridTemplateColumns: selectedOrder ? "1fr 380px" : "1fr",
          gap: "24px",
        }}
      >
        {/* Orders Table */}
        <div>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "60px",
              }}
            >
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>City</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        cursor: "pointer",
                        background:
                          selectedOrder?.orderId === order.orderId
                            ? "#fff3e8"
                            : "white",
                      }}
                    >
                      <td>
                        <span style={{ fontWeight: 700, color: "#ff6b00" }}>
                          #{order.orderId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>
                          {order.customerName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          {order.phone}
                        </div>
                      </td>
                      <td style={{ fontSize: "13px" }}>{order.city}</td>
                      <td style={{ fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {order.items[0]?.image && (
                            <img 
                              src={order.items[0].image} 
                              alt="" 
                              style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb", flexShrink: 0 }} 
                            />
                          )}
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 500, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={order.items[0]?.name}>
                              {order.items[0]?.name}
                            </span>
                            {order.items.length > 1 && (
                              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                + {order.items.length - 1} more item(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#1f2937" }}>
                        Rs. {order.total.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-PK")}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {/* Status Dropdown */}
                          <div style={{ position: "relative" }}>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusUpdate(
                                  order.orderId,
                                  e.target.value,
                                )
                              }
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                fontSize: "12px",
                                fontFamily: "Poppins, sans-serif",
                                cursor: "pointer",
                                background: "white",
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <a
                            href={generateWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "var(--whatsapp-float-bg)",
                              color: "var(--whatsapp-float-icon)",
                              border: "2px solid rgba(201, 168, 76, 0.35)",
                              width: "30px",
                              height: "30px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none",
                              boxShadow: "var(--shadow-sm)",
                            }}
                            title="WhatsApp Customer"
                          >
                            <MessageCircle
                              size={14}
                              color="currentColor"
                              strokeWidth={2.25}
                            />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {orders.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#9ca3af",
                  }}
                >
                  <p style={{ fontSize: "18px" }}>No orders found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div
            className="order-detail-panel"
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #f0f0f0",
              alignSelf: "flex-start",
              position: "sticky",
              top: "80px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{ fontWeight: 700, fontSize: "18px", color: "#ff6b00" }}
              >
                #{selectedOrder.orderId}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#374151",
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status Update */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Update Status
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusUpdate(selectedOrder.orderId, e.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "2px solid #e5e7eb",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ color: "#9ca3af" }} />
              </div>
            </div>

            {/* Tracking Update */}
            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                background: "#fdf8f6",
                borderRadius: "12px",
                border: "1px solid #fce7d4",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "#ff6b00",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Shipment Tracking
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Courier (e.g. TCS, Leopard)"
                  value={selectedOrder.courierName || ""}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      courierName: e.target.value,
                    })
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                    fontFamily: "Poppins, sans-serif",
                  }}
                />
                <input
                  type="text"
                  placeholder="Tracking Number"
                  value={selectedOrder.trackingNumber || ""}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      trackingNumber: e.target.value,
                    })
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                    fontFamily: "Poppins, sans-serif",
                  }}
                />
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `/api/orders/${selectedOrder.orderId}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            trackingNumber: selectedOrder.trackingNumber,
                            courierName: selectedOrder.courierName,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error();
                      toast.success("Tracking details saved!");
                      fetchOrders();
                    } catch {
                      toast.error("Failed to save tracking");
                    }
                  }}
                  style={{
                    padding: "10px",
                    background: "#ff6b00",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Save Tracking Info
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div
              style={{
                padding: "16px",
                background: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Customer
              </div>
              <div
                style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}
              >
                {selectedOrder.customerName}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone
                  size={16}
                  style={{ flexShrink: 0, color: "#9ca3af" }}
                  aria-hidden
                />
                {selectedOrder.phone}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <MapPin
                  size={16}
                  style={{ flexShrink: 0, color: "#9ca3af", marginTop: "2px" }}
                  aria-hidden
                />
                <span>
                  {selectedOrder.address}, {selectedOrder.city}
                </span>
              </div>
              {selectedOrder.notes && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    marginTop: "8px",
                    fontStyle: "italic",
                  }}
                >
                  Note: {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Order Items
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt="" 
                            style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb", flexShrink: 0 }} 
                          />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ color: "#374151", fontWeight: 500 }}>
                            {item.name} ×{item.quantity}
                          </span>
                          {item.selectedColor && (
                            <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "1px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              Color: {item.selectedColor}
                            </span>
                          )}
                          {item.isGift && (
                            <span style={{ background: "#fdf2f8", color: "#db2777", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, alignSelf: "flex-start" }}>
                              🎁 Gift
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: "#ff6b00" }}>
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                    {item.bundleId && item.selectedBundleItems && item.selectedBundleItems.length > 0 && (
                      <div style={{ marginLeft: "12px", borderLeft: "2px solid #e5e7eb", paddingLeft: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {item.selectedBundleItems.map((bi, idx) => (
                          <div key={idx} style={{ fontSize: "12px", color: "#6b7280" }}>
                            • {bi.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                <span>Subtotal</span>
                <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                <span>Shipping</span>
                <span
                  style={{
                    color:
                      selectedOrder.shippingFee === 0 ? "#10b981" : undefined,
                  }}
                >
                  {selectedOrder.shippingFee === 0
                    ? "FREE"
                    : `Rs. ${selectedOrder.shippingFee}`}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: "16px",
                }}
              >
                <span>Total</span>
                <span style={{ color: "#ff6b00" }}>
                  Rs. {selectedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* WhatsApp Button */}
            <a
              href={generateWhatsAppUrl(selectedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{
                width: "100%",
                justifyContent: "center",
                display: "flex",
              }}
            >
              <MessageCircle
                size={16}
                color="var(--icon-on-brand)"
                strokeWidth={2.25}
              />{" "}
              WhatsApp Customer
            </a>

            {/* Delete Order Button */}
            <button
              onClick={() => handleDeleteOrder(selectedOrder.orderId)}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s",
              }}
            >
              <Trash2 size={16} /> Delete Order
            </button>

            <div
              style={{
                marginTop: "12px",
                textAlign: "center",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              {new Date(selectedOrder.createdAt).toLocaleString("en-PK")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
