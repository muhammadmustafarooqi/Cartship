"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/RichTextEditor";
import slugify from "slugify";
import { useDraft } from "@/lib/useDraft";

export default function NewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    isActive: true,
  });

  const isFormDirty = Boolean(formData.title.trim() || formData.content.trim());

  const { lastSavedText, clearDraft } = useDraft(
    "cartship_admin_draft_page_new",
    formData,
    { enabled: isFormDirty }
  );

  // Check on mount if an unsaved draft exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartship_admin_draft_page_new");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.data?.title?.trim() || parsed?.data?.content?.trim()) {
          setFormData(parsed.data);
          toast.success("Restored your unsaved page draft!");
        }
      }
    } catch {}
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: slugify(title, { lower: true, strict: true }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      return toast.error("Please fill in all required fields.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Page created successfully!");
        clearDraft();
        localStorage.removeItem("cartship_admin_draft_page_new");
        router.push("/admin/pages");
      } else {
        toast.error(result.message || "Failed to create page");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardDraft = () => {
    if (confirm("Are you sure you want to discard this draft? All typed content will be lost.")) {
      clearDraft();
      localStorage.removeItem("cartship_admin_draft_page_new");
      setFormData({
        title: "",
        slug: "",
        content: "",
        isActive: true,
      });
      toast("Draft discarded", { icon: "🗑️" });
    }
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937", fontFamily: "Outfit, sans-serif" }}>Create New Page</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Add a new custom page to your store</p>
            {isFormDirty && (
              <>
                <span style={{ color: "#d1d5db" }}>•</span>
                <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}></span>
                  {lastSavedText || "Auto-saving draft"}
                </span>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
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
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/pages")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "white",
            color: "#4b5563",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>

      {/* Form Container */}
      <div style={{ background: "white", borderRadius: "16px", padding: "32px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Page Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="e.g. Privacy Policy"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>URL Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="privacy-policy"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Page Content</label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "#374151" }}>
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "#ff6b00", cursor: "pointer" }}
            />
            Publish Page (Active)
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", paddingTop: "24px", borderTop: "1px solid #f0f0f0" }}>
            <button
              type="button"
              onClick={() => router.push("/admin/pages")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "white",
                color: "#4b5563",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ minWidth: "120px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Saving..." : "Save Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
