"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit, X, Upload, GripVertical, Star } from "lucide-react";
import toast from "react-hot-toast";
import { uploadToImageKit } from "@/lib/uploadClient";

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  imagePosition: string;
  tagline: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  showName: boolean;
  showIcon: boolean;
  showExploreBtn: boolean;
}

const EMPTY_CATEGORY = {
  name: "",
  slug: "",
  icon: "ChefHat",
  image: "",
  imagePosition: "center 50%",
  tagline: "",
  isFeatured: false,
  order: 0,
  isActive: true,
  showName: true,
  showIcon: true,
  showExploreBtn: true,
};

const ICON_OPTIONS = [
  "ChefHat",
  "Sparkles",
  "Home",
  "Dumbbell",
  "Zap",
  "Baby",
  "Shirt",
  "Watch",
  "Laptop",
  "Book",
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?includeInactive=true");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setForm({ ...EMPTY_CATEGORY, order: categories.length });
    setShowForm(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      image: category.image,
      imagePosition: category.imagePosition,
      tagline: category.tagline,
      isFeatured: category.isFeatured,
      order: category.order,
      isActive: category.isActive,
      showName: category.showName ?? true,
      showIcon: category.showIcon ?? true,
      showExploreBtn: category.showExploreBtn ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Category deleted!");
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
      const data = await uploadToImageKit(file, { folder: "/cartship/categories" });
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
    if (!form.name || !form.image) {
      toast.error("Name and image are required");
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success("Category updated!");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success("Category created!");
      }
      setShowForm(false);
      fetchCategories();
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
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937" }}>Categories</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>Manage shop categories</p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {categories.map((category) => (
            <div key={category._id} style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}>
              <GripVertical size={20} style={{ cursor: "grab", color: "#cbd5e1" }} />
              
              <div style={{ width: "120px", height: "80px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                <Image src={category.image} alt={category.name} fill style={{ objectFit: "cover", objectPosition: category.imagePosition }}  />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontWeight: 700, color: "#1f2937", fontSize: "15px" }}>{category.name}</h3>
                  {category.isFeatured && (
                    <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                      <Star size={10} style={{ display: "inline", marginRight: "2px" }} />
                      FEATURED
                    </span>
                  )}
                  {!category.isActive && (
                    <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                      INACTIVE
                    </span>
                  )}
                </div>
                <p style={{ color: "#6b7280", fontSize: "13px" }}>{category.slug}</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openEditForm(category)} style={{ background: "rgba(59,130,246,0.1)", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", color: "#3b82f6" }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(category._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", color: "#ef4444" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
              <p>No categories found. Add one to display on homepage.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "600px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "#f3f4f6", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#1f2937" }}>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Name *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: generateSlug(name) }));
                  }} 
                  required 
                />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label>Slug *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Icon</label>
                <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Image URL *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} required style={{ flex: 1 }} placeholder="https://example.com/image.jpg" />
                  <label htmlFor="category-upload" className="btn-secondary" style={{ padding: "10px 16px", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? "Uploading..." : <Upload size={16} />}
                  </label>
                  <input 
                    id="category-upload" 
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
                <label>Image Position</label>
                <input type="text" value={form.imagePosition} onChange={(e) => setForm((f) => ({ ...f, imagePosition: e.target.value }))} placeholder="center 50%" />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Tagline (for featured category)</label>
                <input type="text" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="Short description" />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                  />
                  Featured
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                  />
                  Active
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={form.showName}
                    onChange={(e) => setForm((f) => ({ ...f, showName: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                  />
                  Show Name
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={form.showIcon}
                    onChange={(e) => setForm((f) => ({ ...f, showIcon: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                  />
                  Show Icon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={form.showExploreBtn}
                    onChange={(e) => setForm((f) => ({ ...f, showExploreBtn: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                  />
                  Show "Explore" Button
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
