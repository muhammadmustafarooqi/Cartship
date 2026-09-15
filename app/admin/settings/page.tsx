"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDraft } from "@/lib/useDraft";
import { uploadToImageKit } from "@/lib/uploadClient";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [dbSettings, setDbSettings] = useState<any>(null);
  const [hasDraftEdits, setHasDraftEdits] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    logoUrl: "",
    faviconUrl: "",
    whatsappNumber: "923713869780",
    supportEmail: "support@cartship.pk",
    supportPhone: "+92 300 1234567",
    storeAddress: "CartShip Headquarters, Pakistan",
    deliveryFee: 200,
    freeDeliveryAbove: 3000,
    announcementBarText: "Free Delivery on Orders Above PKR 3000 | COD Available Nationwide",
    announcementBarActive: true,
  });

  const { lastSavedText, clearDraft } = useDraft(
    "cartship_admin_draft_settings",
    form,
    { enabled: !isLoadingSettings && hasDraftEdits }
  );

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const baseSettings = {
            storeName: data.storeName || "CartShip",
            logoUrl: data.logoUrl || "",
            faviconUrl: data.faviconUrl || "",
            whatsappNumber: data.whatsappNumber || "923713869780",
            supportEmail: data.supportEmail || data.footer?.contactEmail || "support@cartship.pk",
            supportPhone: data.supportPhone || data.footer?.contactPhone || data.whatsappNumber || "+92 300 1234567",
            storeAddress: data.storeAddress || data.footer?.contactAddress || "CartShip Headquarters, Pakistan",
            deliveryFee: data.deliveryFee || 200,
            freeDeliveryAbove: data.freeDeliveryAbove || 3000,
            announcementBarText: data.announcementBarText || "Free Delivery on Orders Above PKR 3000 | COD Available Nationwide",
            announcementBarActive: data.announcementBarActive ?? true,
          };
          setDbSettings(baseSettings);

          // Check if there are unsaved draft settings
          try {
            const savedDraft = localStorage.getItem("cartship_admin_draft_settings");
            if (savedDraft) {
              const parsed = JSON.parse(savedDraft);
              if (parsed?.data) {
                setForm({ ...baseSettings, ...parsed.data });
                setHasDraftEdits(true);
                toast.success("Restored unsaved draft settings from your last session!");
                return;
              }
            }
          } catch {}

          setForm(baseSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Fetch current settings to preserve all existing data
      const currentRes = await fetch("/api/settings", {
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const currentData = await currentRes.json();

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentData,
          ...form,
          footer: {
            ...(currentData?.footer || {}),
            contactEmail: form.supportEmail,
            contactPhone: form.supportPhone,
            contactAddress: form.storeAddress,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Settings updated successfully!");
      clearDraft();
      localStorage.removeItem("cartship_admin_draft_settings");
      setHasDraftEdits(false);
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "faviconUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const toastId = toast.loading("Uploading image...");

    try {
      const data = await uploadToImageKit(file, { folder: "/cartship/settings" });
      setForm(f => ({ ...f, [field]: data.url }));
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload image", { id: toastId });
    }
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937" }}>Store Settings</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <p style={{ color: "#6b7280", margin: 0 }}>Manage your store configuration</p>
            {hasDraftEdits && (
              <>
                <span style={{ color: "#d1d5db" }}>•</span>
                <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}></span>
                  {lastSavedText || "Auto-saving draft"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Discard unsaved settings changes and revert to saved store settings?")) {
                      clearDraft();
                      localStorage.removeItem("cartship_admin_draft_settings");
                      setHasDraftEdits(false);
                      if (dbSettings) {
                        setForm(dbSettings);
                      }
                      toast("Reverted to saved settings", { icon: "↩️" });
                    }
                  }}
                  style={{
                    fontSize: "12px",
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0
                  }}
                >
                  Discard Draft Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "16px", padding: "32px", border: "1px solid #f0f0f0" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1f2937", marginBottom: "16px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              General Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Store Name</label>
                <input 
                  type="text" 
                  value={form.storeName} 
                  onChange={(e) => setForm(f => ({ ...f, storeName: e.target.value }))} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>WhatsApp Number (format: 92XXXXXXXXXX)</label>
                <input 
                  type="text" 
                  value={form.whatsappNumber} 
                  onChange={(e) => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} 
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Store Logo</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="Logo" style={{ height: "40px", objectFit: "contain", borderRadius: "4px", background: "#f8f9fa", padding: "4px" }} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logoUrl")} 
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Favicon (32x32 recommended)</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {form.faviconUrl && (
                    <img src={form.faviconUrl} alt="Favicon" style={{ height: "32px", width: "32px", objectFit: "contain", borderRadius: "4px", background: "#f8f9fa", padding: "4px" }} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "faviconUrl")} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1f2937", marginBottom: "8px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              Contact Information (Contact Us Page & Footer)
            </h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px" }}>
              These details automatically populate your customer-facing Contact Us page and website footer.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Customer Support Email</label>
                <input 
                  type="email" 
                  value={form.supportEmail} 
                  onChange={(e) => setForm(f => ({ ...f, supportEmail: e.target.value }))} 
                  placeholder="e.g. support@cartship.pk"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Customer Support Phone / Helpline</label>
                <input 
                  type="text" 
                  value={form.supportPhone} 
                  onChange={(e) => setForm(f => ({ ...f, supportPhone: e.target.value }))} 
                  placeholder="e.g. +92 300 1234567"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: "16px", marginBottom: 0 }}>
              <label>Store Physical Address / Headquarters</label>
              <input 
                type="text" 
                value={form.storeAddress} 
                onChange={(e) => setForm(f => ({ ...f, storeAddress: e.target.value }))} 
                placeholder="e.g. CartShip Headquarters, Pakistan"
              />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1f2937", marginBottom: "16px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              Shipping Rules
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Standard Delivery Fee (PKR)</label>
                <input 
                  type="number" 
                  value={form.deliveryFee} 
                  onChange={(e) => setForm(f => ({ ...f, deliveryFee: Number(e.target.value) }))} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Free Delivery Threshold (PKR)</label>
                <input 
                  type="number" 
                  value={form.freeDeliveryAbove} 
                  onChange={(e) => setForm(f => ({ ...f, freeDeliveryAbove: Number(e.target.value) }))} 
                />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1f2937", marginBottom: "16px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              Announcement Bar
            </h3>
            <div className="form-group" style={{ margin: 0, marginBottom: "16px" }}>
              <label>Text Content</label>
              <input 
                type="text" 
                value={form.announcementBarText} 
                onChange={(e) => setForm(f => ({ ...f, announcementBarText: e.target.value }))} 
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={form.announcementBarActive}
                onChange={(e) => setForm((f) => ({ ...f, announcementBarActive: e.target.checked }))}
                style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
              />
              Show Announcement Bar on Website
            </label>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: "150px", justifyContent: "center" }}>
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
