"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/components/CartProvider";
import { useSettings } from "@/lib/useSettings";
import { fbq } from "@/lib/fpq";
import { getColorHex } from "@/lib/utils";
import { ShoppingCart, Minus, Plus, Package, Zap, ShieldCheck, Frown, Truck, RefreshCcw, Play, Pause, ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";
import ProductDetailTabs from "@/components/ProductDetailTabs";

interface ColorVariant {
  color: string;
  images: string[];
}

interface Product {
  _id: string; name: string; slug: string; price: number; comparePrice?: number;
  images: string[]; previewVideoUrl?: string; category: string; description: string; shortDescription: string;
  isFeatured?: boolean; isNewArrival?: boolean; rating?: number;
  reviewCount?: number; stock?: number; tags?: string[]; colors?: string[];
  colorVariants?: ColorVariant[];
}

type MediaMode = "video" | "photos";

interface Pack {
  quantity: number;
  price: number;
  label?: string;
}

const getFallbackImage = (category: string, name: string) => {
  const fallbacks: Record<string, string[]> = {
    "kitchen-cooking": [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=400",
    ],
    "personal-care-beauty": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    ],
    "home-cleaning": [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1584820927498-cafe2c1c9699?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1527515637-67c2dd43d411?auto=format&fit=crop&q=80&w=400",
    ],
    "fitness-health": [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
    ],
    "electronics-gadgets": [
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400",
    ],
    "baby-kids": [
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400",
    ]
  };
  const catImages = fallbacks[category] || fallbacks["electronics-gadgets"];
  const index = name.length % catImages.length;
  return catImages[index];
};

export default function ProductClient({ initialProduct, initialRelated, initialPacks = [] }: { initialProduct: Product; initialRelated: Product[]; initialPacks?: Pack[] }) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const { settings, loading: settingsLoading } = useSettings();
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [related, setRelated] = useState<Product[]>(initialRelated);
  const [loading, setLoading] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>("photos");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(null);
  const [imgFade, setImgFade] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>(
    initialProduct?.colors?.[0] || initialProduct?.colorVariants?.[0]?.color || ""
  );
  const [isHovered, setIsHovered] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const detailVideoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Active color variant images if available
  const activeColorVariant = product?.colorVariants?.find(
    (cv) => cv.color.toLowerCase() === selectedColor.toLowerCase()
  );
  const activeColorImages =
    activeColorVariant?.images && activeColorVariant.images.length > 0
      ? activeColorVariant.images
      : null;

  const allImages =
    activeColorImages && activeColorImages.length > 0
      ? activeColorImages
      : product && product.images.length > 0
      ? product.images
      : product
      ? [getFallbackImage(product.category, product.name)]
      : [];

  const imageCount = Math.max(allImages.length, 1);

  const handleSelectColor = (color: string) => {
    if (selectedColor.toLowerCase() === color.toLowerCase()) return;
    setImgFade(false);
    setSelectedColor(color);
    setPhotoIndex(0);
    setTimeout(() => {
      setImgFade(true);
    }, 150);
  };

  // Zoom and Pan states
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleReviewStatsChange = useCallback(
    (stats: { rating: number; reviewCount: number }) => {
      setProduct((p) =>
        p ? { ...p, rating: stats.rating, reviewCount: stats.reviewCount } : p
      );
    },
    []
  );

  const advancePhoto = () => {
    setImgFade(false);
    setTimeout(() => {
      setPhotoIndex((prev) => (prev + 1) % imageCount);
      setImgFade(true);
    }, 200);
  };

  const switchMediaMode = (mode: MediaMode) => {
    setAutoRotate(false);
    if (mode === "photos" && mediaMode === "photos" && imageCount > 1) {
      advancePhoto();
      return;
    }
    setMediaMode(mode);
    setImgFade(false);
    if (mode === "video" && detailVideoRef.current) {
      detailVideoRef.current.currentTime = 0;
      void detailVideoRef.current.play().catch(() => {});
    }
    setTimeout(() => setImgFade(true), 200);
  };

  // Auto-rotation (Standard interval)
  useEffect(() => {
    if (imageCount <= 1 || !autoRotate || mediaMode !== "photos" || isHovered || zoom > 1) {
      return;
    }

    const interval = setInterval(advancePhoto, 4000);
    return () => clearInterval(interval);
  }, [imageCount, isHovered, autoRotate, mediaMode, zoom]);

  // Auto-rotation (Accelerated hover interval)
  useEffect(() => {
    if (imageCount <= 1 || !isHovered || mediaMode !== "photos" || !autoRotate || zoom > 1) {
      return;
    }

    advancePhoto();
    const interval = setInterval(advancePhoto, 1200);
    return () => clearInterval(interval);
  }, [imageCount, isHovered, mediaMode, autoRotate, zoom]);

  // Reset zoom and panning when image details change (photoIndex, mediaMode, selectedColor)
  useEffect(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [photoIndex, mediaMode, selectedColor]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getConstrainedPan = (x: number, y: number, currentZoom: number) => {
    if (!viewerRef.current || currentZoom <= 1) {
      return { x: 0, y: 0 };
    }
    const rect = viewerRef.current.getBoundingClientRect();
    const maxX = (rect.width * (currentZoom - 1)) / 2;
    const maxY = (rect.height * (currentZoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const constrained = getConstrainedPan(newX, newY, zoom);
    setPanOffset(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    const constrained = getConstrainedPan(newX, newY, zoom);
    setPanOffset(constrained);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (product) {
      fbq("track", "ViewContent", {
        content_ids: [product._id],
        content_name: product.name,
        value: product.price,
        currency: "PKR"
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product || isAlreadyInCart) return;
    const eventID = `atc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const customData = {
      content_ids: [product._id],
      content_name: product.name,
      value: product.price,
      currency: "PKR"
    };
    
    fbq("track", "AddToCart", customData, { eventID });
    fetch("/api/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "AddToCart", eventID, customData, sourceUrl: window.location.href })
    }).catch(console.error);

    let cartProductId = product._id;
    let finalQuantity = quantity;
    let finalPrice = product.price;
    let nameSuffix = "";
    
    if (selectedPackIndex !== null && initialPacks[selectedPackIndex]) {
      const pack = initialPacks[selectedPackIndex];
      cartProductId = `pack-${product._id}-${pack.quantity}`;
      finalQuantity = 1;
      finalPrice = pack.price;
      nameSuffix = ` - ${pack.quantity} Pack`;
    }

    addItem({
      productId: cartProductId,
      name: product.name + nameSuffix,
      price: finalPrice,
      quantity: finalQuantity,
      image: allImages[0] || product.images[0] || "",
      slug: product.slug,
      selectedColor: selectedColor || undefined,
    });
    if (cartBtnRef.current) {
      cartBtnRef.current.style.background = "var(--color-success)";
      cartBtnRef.current.style.borderColor = "var(--color-success)";
      cartBtnRef.current.style.color = "white";
      setTimeout(() => {
        if (cartBtnRef.current) {
          cartBtnRef.current.style.background = "";
          cartBtnRef.current.style.borderColor = "";
          cartBtnRef.current.style.color = "";
        }
      }, 500);
    }
  };

  const handleDirectCheckout = () => {
    if (!product) return;
    const eventID = `atc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const customData = {
      content_ids: [product._id],
      content_name: product.name,
      value: product.price,
      currency: "PKR"
    };
    
    fbq("track", "AddToCart", customData, { eventID });
    fetch("/api/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "AddToCart", eventID, customData, sourceUrl: window.location.href })
    }).catch(console.error);

    let cartProductId = product._id;
    let finalQuantity = quantity;
    let finalPrice = product.price;
    let nameSuffix = "";
    
    if (selectedPackIndex !== null && initialPacks[selectedPackIndex]) {
      const pack = initialPacks[selectedPackIndex];
      cartProductId = `pack-${product._id}-${pack.quantity}`;
      finalQuantity = 1;
      finalPrice = pack.price;
      nameSuffix = ` - ${pack.quantity} Pack`;
    }

    addItem({
      productId: cartProductId,
      name: product.name + nameSuffix,
      price: finalPrice,
      quantity: finalQuantity,
      image: allImages[0] || product.images[0] || "",
      slug: product.slug,
      selectedColor: selectedColor || undefined,
    });
    router.push('/checkout');
  };

  const s = { background: "var(--bg-primary)", minHeight: "100vh", width: "100%", maxWidth: "100%", overflowX: "hidden" as const };

  if (loading) return (
    <div style={s}><Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}><div className="spinner" /></div>
      <Footer /></div>
  );

  if (!product) return (
    <div style={s}><Navbar />
      <div style={{ textAlign: "center", padding: "120px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", color: "var(--text-secondary)" }}>
          <Frown size={64} strokeWidth={1.5} aria-hidden />
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>Product Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "16px" }}>This product doesn&apos;t exist or has been removed from our catalog.</p>
        <Link href="/products" className="btn-primary">Browse Collection</Link>
      </div>
      <Footer /></div>
  );

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  const waNum = settings?.whatsappNumber || "923713869780";
  const waMsg = `Hi! I want to order:\n*${product.name}*\nPrice: Rs. ${product.price.toLocaleString()}\n\nPlease confirm availability.`;
  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`;

  const previewVideoUrl = product.previewVideoUrl?.trim() ?? "";
  const hasVideo =
    Boolean(previewVideoUrl) &&
    (/^https?:\/\//i.test(previewVideoUrl) || previewVideoUrl.startsWith("/"));
  const showMediaToggle = hasVideo || allImages.length > 1;
  const activePhotoIndex = photoIndex < allImages.length ? photoIndex : 0;
  const currentPhoto = allImages[activePhotoIndex] ?? allImages[0] ?? "";

  const currentCartProductId = product ? (selectedPackIndex !== null && initialPacks[selectedPackIndex] ? `pack-${product._id}-${initialPacks[selectedPackIndex].quantity}` : product._id) : "";
  const isAlreadyInCart = items.some(
    item => item.productId === currentCartProductId && (item.selectedColor || "") === (selectedColor || "")
  );

  return (
    <div style={s}>
      <Navbar />

      <div className="pd-page">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}>Home</Link>
          <span>/</span>
          <Link href="/products" style={{ color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}>Collection</Link>
          <span>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div className="product-detail-grid">

          {/* Gallery */}
          <div
            className="pd-gallery-col"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Main viewer */}
            <div
              ref={viewerRef}
              className="pd-main-viewer"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                if (mediaMode === "photos") {
                  if (zoom === 1) {
                    setZoom(2);
                  } else {
                    handleResetZoom();
                  }
                }
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: mediaMode === "photos" ? (zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in") : "default",
              }}
            >
              {mediaMode === "video" && hasVideo ? (
                <video
                  ref={detailVideoRef}
                  key={previewVideoUrl}
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="pd-main-media"
                  style={{
                    opacity: imgFade ? 1 : 0,
                    transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 200ms ease-out",
                  }}
                >
                  <Image
                    src={currentPhoto}
                    alt={product.name}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="pd-main-media"
                    style={{
                      opacity: imgFade ? 1 : 0,
                      transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    
                  />
                </div>
              )}

              {discount > 0 && (
                <div style={{ position: "absolute", top: "20px", left: "20px", background: "var(--text-primary)", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "white", fontWeight: 700, fontFamily: "Outfit, sans-serif", zIndex: 2 }}>
                  −{discount}%
                </div>
              )}

              {/* Play / Pause Toggle Button */}
              {mediaMode === "photos" && imageCount > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoRotate((prev) => !prev);
                  }}
                  className="pd-play-pause-btn"
                  aria-label={autoRotate ? "Pause auto-rotation" : "Play auto-rotation"}
                  title={autoRotate ? "Pause auto-rotation" : "Play auto-rotation"}
                >
                  {autoRotate ? <Pause size={18} /> : <Play size={18} />}
                </button>
              )}

              {/* Zoom Buttons overlay */}
              {mediaMode === "photos" && (
                <div className="pd-zoom-controls">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="pd-zoom-btn"
                    disabled={zoom >= 3}
                    aria-label="Zoom In"
                    title="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="pd-zoom-btn"
                    disabled={zoom <= 1}
                    aria-label="Zoom Out"
                    title="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  {zoom > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetZoom();
                      }}
                      className="pd-zoom-btn pd-zoom-reset"
                      aria-label="Reset Zoom"
                      title="Reset Zoom"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {showMediaToggle && (
              <div className="pd-media-toggle-wrap">
                <div
                  className={`pd-media-toggle${hasVideo ? "" : " pd-media-toggle--solo"} pd-media-toggle--mode-${mediaMode}`}
                  role="group"
                  aria-label="Product media"
                >
                  <span className="pd-media-toggle-slider" aria-hidden />
                  {hasVideo && (
                    <button
                      type="button"
                      className={`pd-media-toggle-seg${mediaMode === "video" ? " pd-media-toggle-seg--active" : ""}`}
                      aria-pressed={mediaMode === "video"}
                      onClick={() => switchMediaMode("video")}
                    >
                      Video
                    </button>
                  )}
                  <button
                    type="button"
                    className={`pd-media-toggle-seg${mediaMode === "photos" ? " pd-media-toggle-seg--active" : ""}`}
                    aria-pressed={mediaMode === "photos"}
                    onClick={() => switchMediaMode("photos")}
                  >
                    Photos {activePhotoIndex + 1}/{allImages.length}
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail Carousel Strip */}
            {mediaMode === "photos" && allImages.length > 1 && (
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "12px 2px", scrollbarWidth: "thin", maxWidth: "100%" }}>
                {allImages.map((img, idx) => {
                  const isThumbActive = activePhotoIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAutoRotate(false);
                        setImgFade(false);
                        setPhotoIndex(idx);
                        setTimeout(() => setImgFade(true), 150);
                      }}
                      style={{
                        position: "relative",
                        width: "64px",
                        height: "64px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: isThumbActive ? "2px solid var(--text-primary)" : "1px solid var(--border-default)",
                        padding: 0,
                        cursor: "pointer",
                        background: "var(--bg-card)",
                        flexShrink: 0,
                        opacity: isThumbActive ? 1 : 0.65,
                        transition: "all 0.2s ease",
                        boxShadow: isThumbActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none"
                      }}
                      aria-label={`Select photo ${idx + 1}`}
                    >
                      <Image src={img} alt={`View ${idx + 1}`} fill sizes="64px" style={{ objectFit: "cover" }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="pd-product-info">
            {/* Category badge */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
              <span style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", padding: "4px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", boxShadow: "var(--shadow-sm)" }}>
                <Package size={14} color="var(--color-icon)" /> {product.category}
              </span>
              {product.isNewArrival && <span style={{ background: "var(--color-brand-dim)", color: "var(--color-brand)", padding: "4px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>New Arrival</span>}
              {/* {product.isFeatured && (
                <span style={{ background: "var(--text-primary)", color: "white", padding: "4px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Star size={14} fill="white" aria-hidden /> Editor&apos;s Pick
                </span>
              )} */}
            </div>

            <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.15, fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>{product.name}</h1>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ color: "var(--color-warning)", fontSize: "18px", letterSpacing: "2px" }}>{"★".repeat(Math.round(product.rating || 4))}<span style={{ color: "var(--border-hover)" }}>{"★".repeat(5 - Math.round(product.rating || 4))}</span></span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>{product.rating || 4.5} ({product.reviewCount || 0} reviews)</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>Rs. {product.price.toLocaleString()}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span style={{ fontSize: "18px", color: "var(--text-old-price)", textDecoration: "line-through", fontWeight: 500 }}>Rs. {product.comparePrice.toLocaleString()}</span>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border-default)", marginBottom: "24px" }} />

            {/* Short description */}
            {product.shortDescription && (
              <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px", fontWeight: 500 }}>{product.shortDescription}</p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
                {product.tags.slice(0, 4).map((tag) => (
                  <span key={tag} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Color Selection */}
            {((product.colors && product.colors.length > 0) || (product.colorVariants && product.colorVariants.length > 0)) && (() => {
              const displayColors = Array.from(
                new Set([
                  ...(product.colors || []),
                  ...(product.colorVariants?.map((cv) => cv.color) || []),
                ])
              ).filter(Boolean);

              if (displayColors.length === 0) return null;

              return (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ display: "block", fontWeight: 700, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "Outfit, sans-serif" }}>
                      Select Color: <span style={{ color: "var(--text-primary)", fontWeight: 800, textTransform: "capitalize" }}>{selectedColor}</span>
                    </label>
                    {activeColorImages && activeColorImages.length > 0 && (
                      <span style={{ fontSize: "12px", color: "var(--color-brand)", fontWeight: 600 }}>
                        {activeColorImages.length} photo{activeColorImages.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {displayColors.map((color) => {
                      const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                      const variant = product.colorVariants?.find((cv) => cv.color.toLowerCase() === color.toLowerCase());
                      const variantThumb = variant?.images?.[0];
                      const hexColor = getColorHex(color);

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleSelectColor(color)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 18px 8px 10px",
                            borderRadius: "100px",
                            border: isSelected ? "2px solid var(--text-primary)" : "2px solid var(--border-default)",
                            background: isSelected ? "var(--text-primary)" : "var(--bg-card)",
                            color: isSelected ? "white" : "var(--text-primary)",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: isSelected ? 700 : 500,
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            transition: "all 0.2s ease",
                            boxShadow: isSelected ? "0 4px 12px rgba(15,23,42,0.15)" : "var(--shadow-sm)"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLElement).style.borderColor = "var(--text-primary)";
                              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                            }
                          }}
                        >
                          {variantThumb ? (
                            <div style={{ position: "relative", width: 22, height: 22, borderRadius: "50%", overflow: "hidden", border: isSelected ? "1.5px solid white" : "1.5px solid var(--border-default)", flexShrink: 0 }}>
                              <Image src={variantThumb} alt={color} fill sizes="22px" style={{ objectFit: "cover" }} />
                            </div>
                          ) : (
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: hexColor,
                                border: isSelected ? "1.5px solid white" : (color.toLowerCase() === "white" || color.toLowerCase() === "#ffffff" ? "1.5px solid #cbd5e1" : "1.5px solid rgba(0,0,0,0.15)"),
                                display: "inline-block",
                                flexShrink: 0,
                                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)"
                              }}
                            />
                          )}
                          <span style={{ textTransform: "capitalize" }}>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Offers / Packs */}
            {initialPacks && initialPacks.length > 0 ? (
              <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontWeight: 800, fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "Outfit, sans-serif" }}>Choose an offer:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <label
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "20px", borderRadius: "12px",
                      border: selectedPackIndex === null ? "2px solid #1f1212" : "1px solid #e5e7eb",
                      cursor: "pointer", background: "white",
                      boxShadow: selectedPackIndex === null ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setSelectedPackIndex(null)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: selectedPackIndex === null ? "6px solid #1f1212" : "2px solid #e5e7eb", background: "white", transition: "border 0.2s ease" }} />
                      <div style={{ fontWeight: 800, fontSize: "16px", color: "#1f1212", fontFamily: "Outfit, sans-serif" }}>1 PACK</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "16px", color: "#1f1212", fontFamily: "Outfit, sans-serif" }}>Rs. {product.price.toLocaleString()}</div>
                  </label>

                  {initialPacks.map((pack, index) => {
                    const isSelected = selectedPackIndex === index;

                    return (
                      <label
                        key={index}
                        style={{
                          position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "20px", borderRadius: "12px",
                          border: isSelected ? "2px solid #1f1212" : "1px solid #e5e7eb",
                          cursor: "pointer", background: "white",
                          boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                          transition: "all 0.2s ease",
                          marginTop: pack.label ? "8px" : "0"
                        }}
                        onClick={() => setSelectedPackIndex(index)}
                      >
                        {pack.label && (
                          <div style={{
                            position: "absolute", top: "-14px", right: "24px",
                            background: "#1f1212", color: "white",
                            padding: "6px 14px", borderRadius: "6px",
                            fontSize: "12px", fontWeight: 700,
                            fontFamily: "Outfit, sans-serif",
                            letterSpacing: "0.5px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                          }}>
                            {pack.label}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "6px solid #1f1212" : "2px solid #e5e7eb", background: "white", transition: "border 0.2s ease" }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "16px", color: "#1f1212", fontFamily: "Outfit, sans-serif" }}>{pack.quantity} PACK</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: "16px", color: "#1f1212", fontFamily: "Outfit, sans-serif" }}>Rs. {pack.price.toLocaleString()}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "Outfit, sans-serif" }}>Quantity</label>
                <div className="pd-qty-row">
                  <div className="qty-control" style={{ background: "var(--bg-card)" }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} color="var(--color-icon)" /></button>
                    <span style={{ minWidth: "48px", fontSize: "16px" }}>{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}><Plus size={16} color="var(--color-icon)" /></button>
                  </div>
                  {product.stock !== undefined && product.stock <= 5 && (
                    <span style={{ fontSize: "14px", color: "var(--color-warning)", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}><Zap size={16} color="var(--color-icon)" style={{ display: "inline", verticalAlign: "text-bottom" }} /> Only {product.stock} units left!</span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <button 
                ref={cartBtnRef} 
                onClick={handleAddToCart} 
                disabled={isAlreadyInCart}
                className="btn-primary" 
                style={{ 
                  width: "100%", 
                  justifyContent: "center", 
                  padding: "18px", 
                  fontSize: "16px",
                  opacity: isAlreadyInCart ? 0.7 : 1,
                  cursor: isAlreadyInCart ? "not-allowed" : "pointer"
                }}
              >
                {isAlreadyInCart ? (
                  <><Check size={18} color="white" style={{ marginRight: "8px" }} /> Added to Cart</>
                ) : (
                  <><ShoppingCart size={18} color="white" style={{ marginRight: "8px" }} /> Add to Cart</>
                )}
              </button>
              <button onClick={handleDirectCheckout} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "18px", fontSize: "16px" }}>
                <Zap size={18} color="white" style={{ marginRight: "6px" }} /> Buy Now
              </button>
            </div>

            {/* Delivery & returns */}
            <div className="pd-delivery-panel">
              <div className="pd-delivery-col">
                <div className="pd-delivery-icon" aria-hidden>
                  <Truck size={28} color="var(--orange)" strokeWidth={1.75} />
                </div>
                <h3 className="pd-delivery-heading">Estimate Delivery Times</h3>
                <p className="pd-delivery-line">1-2 days karachi</p>
                <p className="pd-delivery-line">3-5 days pakistan</p>
              </div>
              <div className="pd-delivery-divider" aria-hidden />
              <div className="pd-delivery-col">
                <div className="pd-delivery-icon" aria-hidden>
                  <RefreshCcw size={28} color="var(--orange)" strokeWidth={1.75} />
                </div>
                <h3 className="pd-delivery-heading">Return And Exchange Within</h3>
                <p className="pd-delivery-line">
                  <strong>7 Days</strong> Of Purchase.
                </p>
                <p className="pd-delivery-line pd-delivery-line--muted">
                  Duties, Taxes &amp; Shipping Are Non-Refundable.
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="pd-trust-badges">
              {[
                { icon: <ShieldCheck size={20} color="var(--color-icon)" />, title: "100% Original", sub: "Quality checked" },
                { icon: <Zap size={20} color="var(--color-icon)" />, title: "Fast Shipping", sub: settings ? `Free over Rs.${settings.freeDeliveryAbove.toLocaleString()}` : "Free over Rs.3000" },
              ].map((item) => (
                <div key={item.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "16px 12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px", fontFamily: "Outfit, sans-serif" }}>{item.title}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProductDetailTabs
          productId={product._id}
          description={product.description || ""}
          initialRating={product.rating}
          initialReviewCount={product.reviewCount}
          onStatsChange={handleReviewStatsChange}
        />

        {/* Related Products */}
        {related.length > 0 && (
          <div className="pd-page-section">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px" }}>
              <h2 className="section-title">Similar Products</h2>
              <Link href={`/products?category=${product.category}`} style={{ fontSize: "14px", color: "var(--color-brand)", textDecoration: "none", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}>See All &rarr;</Link>
            </div>
            <div className="products-grid">
              {related.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
      <style>{`
        .pd-page {
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 40px 24px;
          overflow-x: hidden;
        }

        .pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 4px;
          max-width: 100%;
          min-width: 0;
          -webkit-overflow-scrolling: touch;
        }

        .pd-breadcrumb span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 32px;
          min-width: 0;
          width: 100%;
        }

        .pd-qty-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          max-width: 100%;
        }

        .pd-product-info {
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pd-product-info h1 {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pd-gallery-col {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        .pd-product-info .btn-primary {
          max-width: 100%;
          box-sizing: border-box;
        }

        .pd-main-viewer {
          border-radius: 0;
          overflow: hidden;
          background: var(--gradient-card-img);
          border: 1px solid var(--border-default);
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--shadow-sm);
          user-select: none;
        }

        .pd-play-pause-btn {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .pd-play-pause-btn:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(255, 255, 255, 0.45);
          transform: scale(1.05);
        }

        .pd-zoom-controls {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pd-zoom-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .pd-zoom-btn:hover:not(:disabled) {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(255, 255, 255, 0.45);
          transform: scale(1.05);
        }

        .pd-zoom-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .pd-zoom-reset {
          background: rgba(185, 28, 28, 0.7);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .pd-zoom-reset:hover {
          background: rgba(185, 28, 28, 0.9);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .pd-main-media,
        .pd-main-viewer img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 24px;
          box-sizing: border-box;
          border-radius: 0;
        }

        @media (min-width: 901px) {
          .product-detail-grid {
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-bottom: 64px;
          }
        }

        @media (max-width: 900px) {
          .pd-page {
            padding: 16px 16px 28px;
            max-width: 100%;
          }

          .pd-main-viewer {
            width: 100%;
            max-width: 100%;
            border-radius: var(--radius-md) !important;
            aspect-ratio: 1;
            background: var(--gradient-card-img);
          }

          .pd-main-media,
          .pd-main-viewer img,
          .pd-main-viewer video {
            object-fit: cover !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .pd-media-toggle-wrap {
            padding: 0;
          }

          .pd-product-info {
            padding: 0;
            width: 100%;
          }

          .pd-page-section {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            margin-left: 0;
            margin-right: 0;
          }

          .pd-delivery-panel {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .pd-trust-badges {
            width: 100%;
            min-width: 0;
            grid-template-columns: 1fr;
          }

          .pd-delivery-panel {
            grid-template-columns: 1fr;
          }

          .pd-delivery-divider {
            width: auto;
            height: 1px;
            margin: 0 12px;
          }
        }

        .pd-media-toggle-wrap {
          display: flex;
          justify-content: center;
          margin-top: 14px;
          padding-bottom: 4px;
        }

        .pd-media-toggle {
          position: relative;
          width: 100%;
          max-width: 320px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 4px;
          border-radius: 999px;
          background: var(--navy-deep);
          border: 1px solid rgba(201, 168, 76, 0.35);
          box-shadow: 0 4px 14px rgba(86, 18, 40, 0.35);
          pointer-events: none;
          box-sizing: border-box;
        }

        .pd-media-toggle--solo {
          grid-template-columns: 1fr;
          max-width: 200px;
        }

        .pd-media-toggle-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc((100% - 8px) / 2);
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 0;
        }

        .pd-media-toggle--solo .pd-media-toggle-slider {
          width: calc(100% - 8px);
          transform: none !important;
        }

        .pd-media-toggle--mode-video .pd-media-toggle-slider {
          transform: translateX(0);
        }

        .pd-media-toggle--mode-photos .pd-media-toggle-slider {
          transform: translateX(100%);
        }

        .pd-media-toggle-seg {
          position: relative;
          z-index: 1;
          border: none;
          background: transparent;
          color: var(--white);
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          padding: 9px 14px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.22s ease;
          pointer-events: auto;
        }

        .pd-media-toggle-seg--active {
          color: var(--text);
        }

        .pd-media-toggle-seg:not(.pd-media-toggle-seg--active):hover {
          color: var(--white);
        }

        .pd-delivery-panel {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: stretch;
          margin-bottom: 24px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .pd-delivery-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 16px;
          gap: 6px;
        }

        .pd-delivery-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .pd-delivery-heading {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
          line-height: 1.35;
        }

        .pd-delivery-line {
          margin: 0;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .pd-delivery-line strong {
          font-weight: 800;
          color: var(--text-primary);
        }

        .pd-delivery-line--muted {
          font-size: 11px;
          line-height: 1.45;
        }

        .pd-delivery-divider {
          width: 1px;
          background: var(--border-default);
          margin: 12px 0;
        }

        .pd-trust-badges {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 520px) {
          .pd-delivery-panel {
            grid-template-columns: 1fr;
          }

          .pd-delivery-divider {
            width: auto;
            height: 1px;
            margin: 0 12px;
          }
        }
      `}</style>
    </div>
  );
}
