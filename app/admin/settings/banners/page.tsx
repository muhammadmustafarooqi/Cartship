"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit, X, Upload, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { uploadToImageKit } from "@/lib/uploadClient";

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
}

const EMPTY_BANNER = {
  title: "",
  subtitle: "",
  image: "",
  link: "/",
  isActive: true,
  order: 0,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY_BANNER);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners?includeInactive=true");
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingBanner(null);
    setForm({ ...EMPTY_BANNER, order: banners.length });
    setShowForm(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      link: banner.link,
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Banner deleted!");
      fetchBanners();
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const data = await uploadToImageKit(file, { folder: "/cartship/banners" });
      setForm((f) => ({ ...f, image: data.url }));
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.image) {
      toast.error("Title and image are required");
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingBanner) {
        const res = await fetch(`/api/banners/${editingBanner._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success("Banner updated!");
      } else {
        const res = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success("Banner created!");
      }
      setShowForm(false);
      fetchBanners();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937" }}>Hero Banners</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>Manage your homepage slider</p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {banners.map((banner) => (
            <div key={banner._id} style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}>
              <GripVertical size={20} style={{ cursor: "grab", color: "#cbd5e1" }} />
              
              <div style={{ width: "160px", height: "80px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                <Image src={banner.image} alt={banner.title} fill sizes="160px" style={{ objectFit: "cover" }}  />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, color: "#1f2937", fontSize: "15px", marginBottom: "4px" }}>{banner.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>{banner.subtitle}</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openEditForm(banner)} style={{ background: "rgba(59,130,246,0.1)", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", color: "#3b82f6" }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(banner._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", color: "#ef4444" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
              <p>No banners found. Add one to show on the homepage.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "#f3f4f6", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#1f2937" }}>
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Image URL *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} required style={{ flex: 1 }} placeholder="https://example.com/image.jpg" />
                  <label htmlFor="banner-upload" className="btn-secondary" style={{ padding: "10px 16px", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? "Uploading..." : <Upload size={16} />}
                  </label>
                  <input 
                    id="banner-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ display: "none" }} 
                    disabled={uploading}
                  />
                </div>
                {form.image && (
                  <div style={{ marginTop: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <Image src={form.image} alt="Preview" width={400} height={200} style={{ width: "100%", height: "auto", objectFit: "cover" }}  />
                  </div>
                )}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Link / URL</label>
                <input type="text" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
