"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Upload, Package, Star, Sparkles, Eye, FileText } from "lucide-react";
import { PRODUCT_CATEGORIES, PRODUCT_COLORS } from "@/lib/utils";
import toast from "react-hot-toast";
import { useDraft } from "@/lib/useDraft";
import { uploadToImageKit } from "@/lib/uploadClient";

interface ColorVariant {
  color: string;
  images: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  images: string[];
  previewVideoUrl?: string;
  category: string;
  stock: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  description: string;
  shortDescription: string;
  tags: string[];
  colors: string[];
  colorVariants?: ColorVariant[];
}

const EMPTY_PRODUCT = {
  name: "",
  price: 0,
  comparePrice: 0,
  images: [] as string[],
  previewVideoUrl: "",
  category: "",
  stock: 10,
  isFeatured: false,
  isNewArrival: false,
  isActive: true,
  description: "",
  shortDescription: "",
  tags: [] as string[],
  colors: [] as string[],
  colorVariants: [] as ColorVariant[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ name: string; slug: string }>>(PRODUCT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [colorImageUrlMap, setColorImageUrlMap] = useState<Record<string, string>>({});
  const [persistedNewDraft, setPersistedNewDraft] = useState<{ data: typeof EMPTY_PRODUCT; savedAt: string } | null>(null);

  const draftKey = editingProduct
    ? `cartship_admin_draft_product_edit_${editingProduct._id}`
    : "cartship_admin_draft_product_new";

  const isFormDirty = Boolean(
    form.name.trim() ||
    form.description.trim() ||
    form.shortDescription.trim() ||
    form.price > 0 ||
    form.images.length > 0 ||
    form.previewVideoUrl.trim() ||
    form.colors.length > 0 ||
    (form.colorVariants && form.colorVariants.length > 0)
  );

  const { lastSavedText, clearDraft } = useDraft(draftKey, form, {
    enabled: showForm && isFormDirty,
  });

  // Check on mount for any unsaved new product draft
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartship_admin_draft_product_new");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.data?.name?.trim() || parsed?.data?.description?.trim() || parsed?.data?.price > 0) {
          setPersistedNewDraft(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/categories?includeInactive=true")
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          setCategoriesList(data.categories.map((c: any) => ({ name: c.name, slug: c.slug })));
        }
      })
      .catch(console.error);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const toastId = toast.loading("Uploading image(s)...");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await uploadToImageKit(file, { folder: "/cartship" });
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setForm((f) => {
        const newImages = [...f.images];
        uploadedUrls.forEach((url) => {
          if (!newImages.includes(url)) {
            newImages.push(url);
          }
        });
        return { ...f, images: newImages };
      });
      toast.success("Uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image(s)", { id: toastId });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size check (100MB max)
    const maxMb = 100;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Video file is too large (max ${maxMb}MB)`);
      e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const toastId = toast.loading(`Uploading video (${fileSizeMb}MB)...`);

    try {
      const data = await uploadToImageKit(file, { folder: "/cartship/videos" });
      if (data.url) {
        setForm((f) => ({ ...f, previewVideoUrl: data.url }));
        toast.success("Video uploaded successfully!", { id: toastId });
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(err.message || "Failed to upload video", { id: toastId });
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?limit=200&admin=true");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddForm = () => {
    setEditingProduct(null);
    if (persistedNewDraft) {
      setForm(persistedNewDraft.data);
      toast.success("Restored your unsaved draft!");
    } else {
      setForm(EMPTY_PRODUCT);
    }
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    const existingVariants: ColorVariant[] =
      product.colorVariants && product.colorVariants.length > 0
        ? product.colorVariants
        : (product.colors || []).map((c) => ({ color: c, images: [] }));

    let initialForm = {
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice || 0,
      images: product.images,
      previewVideoUrl: product.previewVideoUrl || "",
      category: product.category,
      stock: product.stock,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isActive: product.isActive,
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      tags: product.tags || [],
      colors: product.colors || [],
      colorVariants: existingVariants,
    };

    // Check if there was an unsaved edit draft for this product
    try {
      const editDraftKey = `cartship_admin_draft_product_edit_${product._id}`;
      const saved = localStorage.getItem(editDraftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data) {
          initialForm = { ...initialForm, ...parsed.data };
          toast.success("Restored unsaved draft edits for this product!");
        }
      }
    } catch {}

    setForm(initialForm);
    setShowForm(true);
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && !form.images.includes(imageUrl.trim())) {
      setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }));
      setImageUrl("");
    }
  };

  const handleRemoveImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const handleAddColor = (newColor?: string) => {
    const col = (newColor || colorInput).trim();
    if (!col) return;

    setForm((f) => {
      const existsInColors = f.colors.some((c) => c.toLowerCase() === col.toLowerCase());
      const nextColors = existsInColors ? f.colors : [...f.colors, col];

      const existsInVariants = (f.colorVariants || []).some(
        (cv) => cv.color.toLowerCase() === col.toLowerCase()
      );
      const nextVariants = existsInVariants
        ? f.colorVariants
        : [...(f.colorVariants || []), { color: col, images: [] }];

      return {
        ...f,
        colors: nextColors,
        colorVariants: nextVariants,
      };
    });
    setColorInput("");
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((c) => c.toLowerCase() !== colorToRemove.toLowerCase()),
      colorVariants: (f.colorVariants || []).filter(
        (cv) => cv.color.toLowerCase() !== colorToRemove.toLowerCase()
      ),
    }));
  };

  const handleColorImageUpload = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingColor(color);
    const toastId = toast.loading(`Uploading image(s) for ${color}...`);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await uploadToImageKit(file, { folder: "/cartship/colors" });
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((f) => ({
          ...f,
          colorVariants: (f.colorVariants || []).map((cv) =>
            cv.color.toLowerCase() === color.toLowerCase()
              ? { ...cv, images: [...cv.images, ...uploadedUrls] }
              : cv
          ),
        }));
        toast.success(`Uploaded ${uploadedUrls.length} image(s) for ${color}!`, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image", { id: toastId });
    } finally {
      setUploadingColor(null);
      e.target.value = "";
    }
  };

  const handleAddColorImageUrl = (color: string) => {
    const url = (colorImageUrlMap[color] || "").trim();
    if (!url) return;

    setForm((f) => ({
      ...f,
      colorVariants: (f.colorVariants || []).map((cv) =>
        cv.color.toLowerCase() === color.toLowerCase() && !cv.images.includes(url)
          ? { ...cv, images: [...cv.images, url] }
          : cv
      ),
    }));

    setColorImageUrlMap((prev) => ({ ...prev, [color]: "" }));
  };

  const handleRemoveColorImage = (color: string, imgUrl: string) => {
    setForm((f) => ({
      ...f,
      colorVariants: (f.colorVariants || []).map((cv) =>
        cv.color.toLowerCase() === color.toLowerCase()
          ? { ...cv, images: cv.images.filter((i) => i !== imgUrl) }
          : cv
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);

    const submitPayload = {
      ...form,
      colors: Array.from(
        new Set([
          ...form.colors,
          ...(form.colorVariants || []).map((cv) => cv.color),
        ])
      ).filter(Boolean),
      colorVariants: form.colorVariants || [],
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Product updated!");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Product created!");
      }

      // Purge draft from local storage upon successful save
      if (editingProduct) {
        localStorage.removeItem(`cartship_admin_draft_product_edit_${editingProduct._id}`);
      } else {
        localStorage.removeItem("cartship_admin_draft_product_new");
        setPersistedNewDraft(null);
      }
      clearDraft();

      setShowForm(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      fetchProducts();
    } catch {
      toast.error("Failed to update");
    }
  };

  const activeProducts = products.filter((p) => p.isActive);
  const inactiveProducts = products.filter((p) => !p.isActive);

  const renderProductRow = (product: Product) => (
    <tr key={product._id}>
      <td>
        <div style={{ width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", background: "#f5f5f5" }}>
          {product.images[0] ? (
            <Image src={product.images[0]} alt={product.name} width={52} height={52} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
              <Package size={22} strokeWidth={2} aria-hidden />
            </div>
          )}
        </div>
      </td>
      <td>
        <div style={{ fontWeight: 600, fontSize: "13px", maxWidth: "200px" }}>{product.name}</div>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{product.slug}</div>
        {((product.colors && product.colors.length > 0) || (product.colorVariants && product.colorVariants.length > 0)) && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
            {(product.colors || product.colorVariants?.map(c => c.color) || []).slice(0, 3).map((col) => (
              <span key={col} style={{ fontSize: "10px", background: "#f3f4f6", color: "#4b5563", padding: "1px 6px", borderRadius: "4px", fontWeight: 500 }}>
                {col}
              </span>
            ))}
            {((product.colors?.length || product.colorVariants?.length || 0) > 3) && (
              <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                +{((product.colors?.length || product.colorVariants?.length || 0) - 3)}
              </span>
            )}
          </div>
        )}
      </td>
      <td style={{ fontSize: "13px" }}>{product.category}</td>
      <td>
        <div style={{ fontWeight: 700, color: "#ff6b00", fontSize: "13px" }}>Rs. {product.price.toLocaleString()}</div>
        {product.comparePrice > 0 && (
          <div style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "line-through" }}>Rs. {product.comparePrice.toLocaleString()}</div>
        )}
      </td>
      <td style={{ fontSize: "13px", fontWeight: product.stock <= 5 ? 700 : 400, color: product.stock <= 5 ? "#ef4444" : "#374151" }}>
        {product.stock}
      </td>
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {product.isFeatured && (
            <span style={{ fontSize: "11px", background: "rgba(255,107,0,0.1)", color: "#ff6b00", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Star size={12} aria-hidden /> Featured
            </span>
          )}
          {product.isNewArrival && (
            <span style={{ fontSize: "11px", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={12} aria-hidden /> New
            </span>
          )}
        </div>
      </td>
      <td>
        <button
          onClick={() => handleToggleActive(product)}
          title={product.isActive ? "Click to deactivate" : "Click to activate"}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {product.isActive
            ? <ToggleRight size={28} style={{ color: "#10b981" }} />
            : <ToggleLeft size={28} style={{ color: "#9ca3af" }} />}
        </button>
      </td>
      <td>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => openEditForm(product)} style={{ background: "rgba(59,130,246,0.1)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#3b82f6" }}>
            <Edit size={15} />
          </button>
          <button onClick={() => handleDelete(product._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#ef4444" }}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderTable = (list: Product[], emptyMsg: string) => (
    <div style={{ overflowX: "auto" }}>
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" }}>{emptyMsg}</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Flags</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{list.map(renderProductRow)}</tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="admin-page-container">
      {persistedNewDraft && !showForm && (
        <div style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          border: "1px solid #fed7aa",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 10px rgba(255, 97, 2, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--orange)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#9a3412", fontSize: "15px" }}>
                Unsaved Product Draft Found
              </div>
              <div style={{ fontSize: "13px", color: "#c2410c" }}>
                &ldquo;{persistedNewDraft.data.name || "Untitled Product"}&rdquo; was automatically saved from your previous session.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setForm(persistedNewDraft.data);
                setShowForm(true);
                toast.success("Draft restored!");
              }}
              style={{
                background: "var(--orange)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Resume Editing
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("cartship_admin_draft_product_new");
                setPersistedNewDraft(null);
                clearDraft();
                toast("Draft discarded", { icon: "🗑️" });
              }}
              style={{
                background: "white",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 14px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937" }}>Products</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>{activeProducts.length} active · {inactiveProducts.length} inactive</p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Active Products Section */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>Active Products</h2>
              <span style={{ background: "#d1fae5", color: "#065f46", fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px" }}>{activeProducts.length}</span>
            </div>
            {renderTable(activeProducts, "No active products.")}
          </div>

          {/* Inactive Products Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#9ca3af" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#6b7280" }}>Inactive Products</h2>
              <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px" }}>{inactiveProducts.length}</span>
            </div>
            {renderTable(inactiveProducts, "No inactive products.")}
          </div>
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="admin-form-modal" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "32px 16px" }}>
          <div className="admin-form-content" style={{ background: "white", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "700px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1f2937", margin: 0 }}>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }}></span>
                    {lastSavedText || "Draft auto-saving enabled"}
                  </span>
                  {isFormDirty && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to discard this draft and reset the form?")) {
                          if (editingProduct) {
                            localStorage.removeItem(`cartship_admin_draft_product_edit_${editingProduct._id}`);
                          } else {
                            localStorage.removeItem("cartship_admin_draft_product_new");
                            setPersistedNewDraft(null);
                          }
                          clearDraft();
                          setForm(EMPTY_PRODUCT);
                          setShowForm(false);
                          toast("Draft discarded", { icon: "🗑️" });
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
                      Discard Draft
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>


            <form onSubmit={handleSubmit} className="admin-product-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Rechargeable Coffee Beater" required />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                    <option value="">Select Category</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))} min={0} />
                </div>

                <div className="form-group">
                  <label>Price (PKR) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} min={0} required />
                </div>

                <div className="form-group">
                  <label>Compare Price (PKR)</label>
                  <input type="number" value={form.comparePrice} onChange={(e) => setForm((f) => ({ ...f, comparePrice: parseFloat(e.target.value) || 0 }))} min={0} placeholder="Original price for discount" />
                </div>

                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Short Description</label>
                  <input type="text" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} placeholder="Brief one-line description" />
                </div>

                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Full Description</label>
                  <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detailed product description" />
                </div>

                {/* Images */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Product Images *</span>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
                      {form.images.length} added
                    </span>
                  </label>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f9fafb", padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    {/* Add via URL */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImage(); } }}
                        placeholder="Paste image URL (e.g., https://example.com/image.jpg)"
                        style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" }}
                      />
                      <button type="button" onClick={handleAddImage} className="btn-secondary" style={{ padding: "10px 16px", whiteSpace: "nowrap", height: "42px", fontSize: "13px" }}>
                        Add URL
                      </button>
                    </div>

                    {/* Or Upload from device */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #d1d5db", borderRadius: "8px", padding: "16px", background: "white", cursor: "pointer", transition: "border-color 0.2s ease" }}
                         onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff6b00")}
                         onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                    >
                      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", width: "100%" }}>
                        <div style={{ background: "rgba(255, 107, 0, 0.1)", color: "#ff6b00", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Upload size={20} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                            {uploadingImage ? "Uploading..." : "Click to upload images from device"}
                          </span>
                          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                            Supports PNG, JPG, JPEG, WEBP (Multiple allowed)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>

                  {form.images.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                      {form.images.map((img, i) => (
                        <div key={i} style={{ position: "relative", width: "76px", height: "76px", borderRadius: "8px", overflow: "hidden", border: "2px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                          <Image src={img} alt="" width={76} height={76} style={{ width: "100%", height: "100%", objectFit: "cover" }}  />
                          <button type="button" onClick={() => handleRemoveImage(img)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(239, 68, 68, 0.9)", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s ease" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ef4444")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)")}
                          >
                            <X size={12} style={{ color: "white" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Product Video — shown in gallery on product page (optional)</label>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f9fafb", padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    {/* Paste URL */}
                    <input
                      type="url"
                      value={form.previewVideoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, previewVideoUrl: e.target.value }))}
                      placeholder="Paste video URL (e.g., https://example.com/video.mp4)"
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" }}
                    />

                    {/* Or Upload from device */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #d1d5db", borderRadius: "8px", padding: "16px", background: "white", cursor: "pointer", transition: "border-color 0.2s ease" }}
                         onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff6b00")}
                         onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                    >
                      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", width: "100%" }}>
                        <div style={{ background: "rgba(255, 107, 0, 0.1)", color: "#ff6b00", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Upload size={20} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                            {uploadingVideo ? "Uploading..." : "Click to upload video from device"}
                          </span>
                          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                            Supports MP4, WebM, OGG
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          disabled={uploadingVideo}
                          onChange={handleVideoUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                    If set, the video appears as the first thumbnail in the product gallery so customers can play it. It also plays on hover in the product card.
                  </p>
                  {form.previewVideoUrl && (
                    <div style={{ marginTop: "12px", borderRadius: "10px", overflow: "hidden", border: "2px solid #e5e7eb", maxWidth: "280px" }}>
                      <video
                        src={form.previewVideoUrl}
                        controls
                        muted
                        style={{ width: "100%", display: "block", background: "#000" }}
                      />
                      <div style={{ padding: "8px 12px", background: "#f9fafb", fontSize: "12px", color: "#6b7280", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb" }}>
                        <span style={{ fontWeight: 500 }}>Video preview</span>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, previewVideoUrl: "" }))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Tags</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} placeholder="Add a tag and press Enter" style={{ flex: 1, padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" }} />
                    <button type="button" onClick={handleAddTag} className="btn-secondary" style={{ padding: "10px 14px" }}>Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {form.tags.map((tag) => (
                        <span key={tag} style={{ background: "#fff3e8", color: "#ff6b00", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          {tag}
                          <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b00", display: "flex" }}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors & Per-Color Dedicated Pictures */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <label style={{ fontWeight: 700, fontSize: "14px", color: "#111827", marginBottom: "2px", display: "block" }}>
                        Color Options &amp; Dedicated Pictures
                      </label>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        Add product colors and upload specific photos for each color (automatically switches when customer picks a color)
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#ff6b00", fontWeight: 700 }}>
                      {form.colorVariants?.length || 0} color variant{form.colorVariants?.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Add color input bar */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", background: "#f9fafb", padding: "12px", borderRadius: "10px", border: "1.5px solid #e5e7eb", flexWrap: "wrap" }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddColor(e.target.value);
                        }
                      }}
                      style={{ flex: "1 1 200px", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", background: "white" }}
                    >
                      <option value="">Select a standard color...</option>
                      {PRODUCT_COLORS.map((c) => {
                        const alreadyAdded = (form.colorVariants || []).some(cv => cv.color.toLowerCase() === c.toLowerCase());
                        return (
                          <option key={c} value={c} disabled={alreadyAdded}>
                            {c} {alreadyAdded ? "(Already added)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    <div style={{ display: "flex", gap: "8px", flex: "1 1 240px" }}>
                      <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddColor(); } }}
                        placeholder="Or type custom color (e.g. Navy Blue)..."
                        style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", background: "white" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddColor()}
                        className="btn-secondary"
                        style={{ padding: "10px 16px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Plus size={16} /> Add Color
                      </button>
                    </div>
                  </div>

                  {/* Color Variant Cards */}
                  {(!form.colorVariants || form.colorVariants.length === 0) ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "#f9fafb", border: "1.5px dashed #e5e7eb", borderRadius: "12px", color: "#6b7280", fontSize: "13px" }}>
                      No color options added yet. Select or type a color above to upload color-specific photos.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {form.colorVariants.map((variant) => {
                        const isUploadingThisColor = uploadingColor === variant.color;
                        const urlValue = colorImageUrlMap[variant.color] || "";

                        return (
                          <div
                            key={variant.color}
                            style={{
                              background: "white",
                              border: "1.5px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "16px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                            }}
                          >
                            {/* Header row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    background: variant.color.toLowerCase(),
                                    border: "1.5px solid #d1d5db",
                                    display: "inline-block",
                                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)"
                                  }}
                                />
                                <span style={{ fontWeight: 700, fontSize: "15px", color: "#111827", textTransform: "capitalize" }}>
                                  {variant.color}
                                </span>
                                <span style={{ background: "#f3f4f6", color: "#4b5563", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px" }}>
                                  {variant.images.length} {variant.images.length === 1 ? "photo" : "photos"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveColor(variant.color)}
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <Trash2 size={13} /> Remove Color
                              </button>
                            </div>

                            {/* Upload & URL Controls for this color */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                              {/* File upload button */}
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  border: "1.5px dashed #cbd5e1",
                                  borderRadius: "8px",
                                  background: isUploadingThisColor ? "#fff7ed" : "#f8fafc",
                                  cursor: isUploadingThisColor ? "not-allowed" : "pointer",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: isUploadingThisColor ? "#ff6b00" : "#334155",
                                  transition: "all 0.2s"
                                }}
                              >
                                <Upload size={16} color={isUploadingThisColor ? "#ff6b00" : "#64748b"} />
                                <span>{isUploadingThisColor ? "Uploading..." : `Upload ${variant.color} Photos`}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={isUploadingThisColor}
                                  onChange={(e) => handleColorImageUpload(variant.color, e)}
                                  style={{ display: "none" }}
                                />
                              </label>

                              {/* URL input */}
                              <div style={{ display: "flex", gap: "6px" }}>
                                <input
                                  type="url"
                                  value={urlValue}
                                  onChange={(e) => setColorImageUrlMap(prev => ({ ...prev, [variant.color]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddColorImageUrl(variant.color); } }}
                                  placeholder="Paste image URL..."
                                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "13px" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddColorImageUrl(variant.color)}
                                  className="btn-secondary"
                                  style={{ padding: "8px 12px", fontSize: "12px", height: "auto", whiteSpace: "nowrap" }}
                                >
                                  Add URL
                                </button>
                              </div>
                            </div>

                            {/* Pictures Thumbnails */}
                            {variant.images.length > 0 ? (
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                {variant.images.map((img, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    style={{
                                      position: "relative",
                                      width: "68px",
                                      height: "68px",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      border: imgIdx === 0 ? "2px solid #ff6b00" : "1.5px solid #cbd5e1",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                      background: "white"
                                    }}
                                  >
                                    <Image src={img} alt={`${variant.color} preview ${imgIdx + 1}`} width={68} height={68} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {imgIdx === 0 && (
                                      <span style={{ position: "absolute", bottom: "0", left: "0", right: "0", background: "rgba(255, 107, 0, 0.95)", color: "white", fontSize: "9px", fontWeight: 700, textAlign: "center", padding: "1px 0" }}>
                                        Main
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveColorImage(variant.color, img)}
                                      style={{
                                        position: "absolute",
                                        top: "2px",
                                        right: "2px",
                                        background: "rgba(220, 38, 38, 0.9)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "18px",
                                        height: "18px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white"
                                      }}
                                      title="Remove photo"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: "4px 0 0 0" }}>
                                No photos uploaded yet for {variant.color}. If empty, standard product images will be displayed.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Toggles */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    {[
                      { key: "isFeatured", label: "Featured product", Icon: Star },
                      { key: "isNewArrival", label: "New arrival", Icon: Sparkles },
                      { key: "isActive", label: "Active (visible)", Icon: Eye },
                    ].map(({ key, label, Icon }) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}>
                        <Icon size={16} style={{ color: "#6b7280", flexShrink: 0 }} aria-hidden />
                        <input
                          type="checkbox"
                          checked={form[key as keyof typeof form] as boolean}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                          style={{ width: "18px", height: "18px", accentColor: "#ff6b00" }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: "1 1 auto", minWidth: "120px" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: "1 1 auto", minWidth: "120px" }}>
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
