"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, Eye, Heart, Star, Sparkles, MoreHorizontal } from "lucide-react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { fbq } from "@/lib/fpq";

import { getColorHex } from "@/lib/utils";

interface ColorVariant {
  color: string;
  images: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  /** Optional MP4/WebM URL — plays when Video segment is selected */
  previewVideoUrl?: string;
  shortDescription?: string;
  category: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  colors?: string[];
  colorVariants?: ColorVariant[];
}

type MediaMode = "video" | "photos";

function getFallbackImage(category: string, name: string) {
  const fallbacks: Record<string, string[]> = {
    "kitchen-cooking": [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584990347449-39b4aa02b01f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
    ],
    "personal-care-beauty": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400&h=400&fit=crop",
    ],
    "home-cleaning": [
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1600428877938-29c5e5b8b250?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584820927498-cafe2c1c9699?w=400&h=400&fit=crop",
    ],
    "fitness-health": [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop",
    ],
    "electronics-gadgets": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    ],
    "baby-kids": [
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
    ],
  };
  const catImages = fallbacks[category] || fallbacks["electronics-gadgets"];
  const index =
    Math.abs(name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % catImages.length;
  return catImages[index];
}

function formatCategoryLabel(slug: string) {
  return slug
    .split("-")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" · ");
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const wishlisted = isWishlisted(product._id);

  const displayColors = useMemo(() => {
    return Array.from(
      new Set([
        ...(product.colors || []),
        ...(product.colorVariants?.map((cv) => cv.color) || []),
      ])
    ).filter(Boolean);
  }, [product.colors, product.colorVariants]);

  const [selectedColor, setSelectedColor] = useState<string>(
    displayColors[0] || ""
  );

  const activeColorVariant = useMemo(() => {
    if (!selectedColor) return null;
    return product.colorVariants?.find(
      (cv) => cv.color.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product.colorVariants, selectedColor]);

  const activeColorImages =
    activeColorVariant?.images && activeColorVariant.images.length > 0
      ? activeColorVariant.images
      : null;

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const galleryUrls = useMemo(() => {
    if (activeColorImages && activeColorImages.length > 0) {
      return activeColorImages;
    }
    const raw = (product.images || []).filter((u) => typeof u === "string" && u.trim().length > 0);
    if (raw.length > 0) return raw;
    return [getFallbackImage(product.category, product.name)];
  }, [activeColorImages, product.images, product.category, product.name]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const eventID = `atc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const customData = {
      content_ids: [product._id],
      content_name: product.name,
      value: product.price,
      currency: "PKR"
    };
    fbq("track", "AddToCart", customData, { eventID });
    if (typeof window !== "undefined") {
      fetch("/api/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName: "AddToCart", eventID, customData, sourceUrl: window.location.href })
      }).catch(console.error);
    }
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: galleryUrls[0] || product.images?.[0] || "",
      slug: product.slug,
      selectedColor: selectedColor || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const rating = product.rating || 4.5;
  const fullStars = Math.floor(rating);
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  const previewVideoUrl = product.previewVideoUrl?.trim() ?? "";
  const hasVideo =
    Boolean(previewVideoUrl) &&
    (/^https?:\/\//i.test(previewVideoUrl) || previewVideoUrl.startsWith("/"));
  const hasGalleryCycle = galleryUrls.length >= 2;
  const showMediaToggle = hasVideo || galleryUrls.length > 1;

  const [mediaMode, setMediaMode] = useState<MediaMode>("photos");
  const [stageHover, setStageHover] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [prevGalleryIndex, setPrevGalleryIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoCapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGalleryInterval = () => {
    if (galleryIntervalRef.current) {
      clearInterval(galleryIntervalRef.current);
      galleryIntervalRef.current = null;
    }
  };

  const clearVideoCap = () => {
    if (videoCapTimerRef.current) {
      clearTimeout(videoCapTimerRef.current);
      videoCapTimerRef.current = null;
    }
  };

  const stopVideo = () => {
    clearVideoCap();
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const hoverMediaAllowed = () => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (!window.matchMedia("(hover: hover)").matches) return false;
    return true;
  };

  const playPreviewVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => { });
    clearVideoCap();
    videoCapTimerRef.current = setTimeout(() => {
      v.pause();
    }, 5000);
  };

  const advanceGallery = () => {
    if (!hasGalleryCycle) return;
    setGalleryIndex((prev) => {
      const next = (prev + 1) % galleryUrls.length;
      setPrevGalleryIndex(prev);
      setIsTransitioning(true);
      setShimmer(true);
      setTimeout(() => setShimmer(false), 300);
      setTimeout(() => {
        setIsTransitioning(false);
        setPrevGalleryIndex(null);
      }, 550);
      return next;
    });
  };

  const startPhotoCycle = () => {
    clearGalleryInterval();
    advanceGallery();
    galleryIntervalRef.current = setInterval(advanceGallery, 1200);
  };

  const switchMediaMode = (mode: MediaMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === "photos" && mediaMode === "photos" && hasGalleryCycle) {
      advanceGallery();
      if (stageHover) startPhotoCycle();
      return;
    }
    setMediaMode(mode);
    clearGalleryInterval();
    if (mode === "video" && hasVideo) {
      setPrevGalleryIndex(null);
      setIsTransitioning(false);
      setShimmer(false);
      playPreviewVideo();
    } else {
      clearVideoCap();
      stopVideo();
      if (stageHover && hasGalleryCycle) startPhotoCycle();
    }
  };

  const handleStageEnter = () => {
    setStageHover(true);

    if (mediaMode === "video" && hasVideo) {
      clearGalleryInterval();
      if (hoverMediaAllowed()) playPreviewVideo();
      return;
    }

    if (hasGalleryCycle && mediaMode === "photos") {
      startPhotoCycle();
    }
  };

  const handleStageLeave = () => {
    setStageHover(false);
    clearGalleryInterval();
    clearVideoCap();
    setPrevGalleryIndex(null);
    setIsTransitioning(false);
    setShimmer(false);
    setGalleryIndex(0);
    stopVideo();
  };

  useEffect(() => {
    return () => {
      clearGalleryInterval();
      clearVideoCap();
      const v = videoRef.current;
      if (v) {
        v.pause();
      }
    };
  }, []);

  return (
    <Link href={`/products/${product.slug}`} className="pc-root">
      <div className="pc-shell">
        <article
          className={`pc-card${isOutOfStock ? " pc-card--oos" : ""}${added ? " pc-card--added" : ""}`}
        >
          <div
            className="pc-stage"
            onMouseEnter={handleStageEnter}
            onMouseLeave={handleStageLeave}
          >
            <div className={`pc-media${isOutOfStock ? " pc-media--oos" : ""}`}>
              {galleryUrls.map((src, i) => {
                const isActive = i === galleryIndex;
                const isLeaving = i === prevGalleryIndex && isTransitioning;
                let layerClass = "pc-img-layer";
                if (isActive) layerClass += " pc-img-layer--active";
                if (isLeaving) layerClass += " pc-img-layer--leaving";
                return (
                  <Image
                    key={`${src}-${i}`}
                    src={src}
                    alt={i === 0 ? product.name : ""}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={layerClass}
                    
                  />
                );
              })}
              {shimmer && <div className="pc-img-shimmer" aria-hidden />}
              {hasVideo ? (
                <video
                  ref={videoRef}
                  className={`pc-preview-video${mediaMode === "video" ? " pc-preview-video--visible" : ""}`}
                  src={previewVideoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={`${product.name} preview clip`}
                />
              ) : null}


            </div>

            {isOutOfStock && <div className="pc-oos-ribbon">Out of stock</div>}

            <div className="pc-float-badges">
              {product.isFeatured && discount === 0 && (
                <span className="pc-badge pc-badge--featured">
                  <Sparkles size={11} strokeWidth={2.5} aria-hidden />
                  Popular
                </span>
              )}
              {product.isNewArrival && <span className="pc-badge pc-badge--new">New</span>}
            </div>

            {discount > 0 && (
              <div className="pc-sale-badge" aria-label={`${discount}% off`}>
                <span className="pc-sale-badge-fire" aria-hidden>🔥</span>
                <span className="pc-sale-badge-text">-{discount}%</span>
                <span className="pc-sale-badge-label">OFF</span>
                <span className="pc-sale-badge-shine" aria-hidden />
              </div>
            )}

            <button
              type="button"
              className={`pc-wish${wishlisted ? " pc-wish--on" : ""}`}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!wishlisted) {
                  fbq("track", "AddToWishlist", {
                    content_ids: [product._id],
                    content_name: product.name,
                    value: product.price,
                    currency: "PKR"
                  });
                }
                toggleItem({
                  productId: product._id,
                  name: product.name,
                  price: product.price,
                  comparePrice: product.comparePrice,
                  image: galleryUrls[0] || "",
                  category: product.category,
                  slug: product.slug,
                });
              }}
            >
              <Heart
                size={20}
                strokeWidth={2}
                fill={wishlisted ? "currentColor" : "none"}
                style={{ transition: "fill 0.2s ease, transform 0.2s ease", transform: wishlisted ? "scale(1.15)" : "scale(1)" }}
              />
            </button>

            <button
              type="button"
              className="pc-more-actions"
              aria-label="More options"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(e);
              }}
            >
              <MoreHorizontal size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="pc-body">
            <p className="pc-cat">{formatCategoryLabel(product.category)}</p>
            <h3 className="pc-title">{product.name}</h3>
            {product.shortDescription?.trim() ? (
              <p className="pc-desc">{product.shortDescription.trim()}</p>
            ) : null}

            {displayColors.length > 0 && (
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center", margin: "6px 0 10px 0", flexWrap: "wrap" }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {displayColors.slice(0, 5).map((col) => {
                  const isSel = selectedColor.toLowerCase() === col.toLowerCase();
                  const cv = product.colorVariants?.find((c) => c.color.toLowerCase() === col.toLowerCase());
                  const thumb = cv?.images?.[0];
                  const hex = getColorHex(col);

                  return (
                    <button
                      key={col}
                      type="button"
                      title={`Select ${col}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColor(col);
                        setGalleryIndex(0);
                      }}
                      style={{
                        padding: 0,
                        border: isSel ? "2px solid var(--text-primary)" : "1.5px solid var(--border-default)",
                        borderRadius: "50%",
                        background: "none",
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: isSel ? "scale(1.15)" : "scale(1)",
                        transition: "all 0.15s ease",
                        boxShadow: isSel ? "0 2px 6px rgba(0,0,0,0.15)" : "none"
                      }}
                    >
                      {thumb ? (
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", overflow: "hidden", display: "inline-block", position: "relative" }}>
                          <Image src={thumb} alt={col} fill sizes="16px" style={{ objectFit: "cover" }} />
                        </span>
                      ) : (
                        <span
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: hex,
                            display: "inline-block",
                            border: col.toLowerCase() === "white" || col.toLowerCase() === "#ffffff" ? "1px solid #cbd5e1" : "none",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)"
                          }}
                        />
                      )}
                    </button>
                  );
                })}
                {displayColors.length > 5 && (
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    +{displayColors.length - 5}
                  </span>
                )}
              </div>
            )}

            <div className="pc-rating">
              <div className="pc-stars" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < fullStars ? "pc-star pc-star--on" : "pc-star"}
                    fill={i < fullStars ? "currentColor" : "none"}
                    strokeWidth={i < fullStars ? 0 : 1.5}
                  />
                ))}
              </div>
              <span className="pc-reviews">{product.reviewCount ?? 0} reviews</span>
            </div>

            <div className="pc-prices">
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="pc-compare">Rs. {product.comparePrice.toLocaleString()}</span>
              )}
              <span className="pc-price">Rs. {product.price.toLocaleString()}</span>
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .pc-root {
          text-decoration: none;
          height: 100%;
          display: block;
          color: inherit;
          -webkit-user-drag: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .pc-shell {
          border-radius: 0;
          background: transparent;
          border: none;
          box-shadow: none;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pc-root:hover .pc-shell,
        .pc-root:focus-within .pc-shell {
          transform: translateY(-6px);
        }

        .pc-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 300px;
          border-radius: inherit;
          overflow: hidden;
          background: transparent;
          cursor: pointer;
        }

        @media (min-width: 769px) {
          .pc-card {
            aspect-ratio: 1 / 1.55;
            min-height: 0;
          }
        }

        .pc-card--oos {
          opacity: 0.94;
        }

        .pc-stage {
          position: relative;
          flex: 1;
          min-height: 220px;
          margin: 0 0 12px 0;
          background: var(--gradient-card-img);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: box-shadow 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .pc-root:hover .pc-stage,
        .pc-root:focus-within .pc-stage {
          box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08);
        }

        @media (min-width: 769px) {
          .pc-stage {
            min-height: 0;
          }
        }

        .pc-media {
          position: absolute;
          inset: 0;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        .pc-root:hover .pc-media,
        .pc-root:focus-within .pc-media {
          transform: scale(1.04);
        }

        .pc-root:hover .pc-media-toggle,
        .pc-root:focus-within .pc-media-toggle {
          transform: none;
        }

        .pc-img-layer {
          object-fit: cover;
          padding: 0;
          z-index: 2;
          opacity: 0;
          transform: scale(1.06) translateX(18px);
          transition:
            opacity 0.5s cubic-bezier(0.25, 0.8, 0.25, 1),
            transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
          pointer-events: none;
          -webkit-user-drag: none;
          user-select: none;
        }

        .pc-img-layer--active {
          opacity: 1;
          z-index: 3;
          transform: scale(1) translateX(0);
        }

        .pc-img-layer--leaving {
          opacity: 0;
          z-index: 2;
          transform: scale(0.95) translateX(-18px);
          transition:
            opacity 0.5s cubic-bezier(0.25, 0.8, 0.25, 1),
            transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        @keyframes pc-shimmer-flash {
          0%   { opacity: 0; }
          30%  { opacity: 0.28; }
          100% { opacity: 0; }
        }

        .pc-img-shimmer {
          position: absolute;
          inset: 0;
          z-index: 9;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            transparent 20%,
            rgba(255,255,255,0.6) 50%,
            transparent 80%
          );
          background-size: 200% 100%;
          animation: pc-shimmer-flash 0.3s ease-out forwards;
        }

        .pc-media-toggle {
          display: none;
        }

        .pc-media-toggle--solo {
          display: none;
        }

        .pc-media-toggle-slider {
          display: none;
        }

        .pc-media-toggle--mode-video .pc-media-toggle-slider {
          display: none;
        }

        .pc-media-toggle--mode-photos .pc-media-toggle-slider {
          display: none;
        }

        .pc-media-toggle-seg {
          display: none;
        }

        .pc-media-toggle-seg--active {
          display: none;
        }

        .pc-media-toggle-seg:not(.pc-media-toggle-seg--active):hover {
          display: none;
        }

        .pc-preview-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          padding: 0;
          z-index: 4;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
          background: var(--cream-dark);
        }

        .pc-preview-video--visible {
          opacity: 1;
          z-index: 7;
        }

        .pc-media--oos {
          filter: grayscale(1) opacity(0.52);
        }

        .pc-oos-ribbon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-7deg);
          z-index: 10;
          padding: 7px 16px;
          font-family: Outfit, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--white);
          background: var(--navy-deep);
          border-radius: 6px;
          box-shadow: var(--shadow-md);
          pointer-events: none;
        }

        .pc-float-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 8;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          pointer-events: none;
        }

        .pc-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .pc-badge--featured {
          background: #fff8e1;
          color: #f57f17;
        }

        .pc-badge--new {
          background: #e8f5e9;
          color: #2e7d32;
        }

        /* ── Discount / Sale badge ── */
        @keyframes pc-sale-shimmer {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }

        @keyframes pc-sale-pop {
          0%   { transform: scale(0.6) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(-2deg); opacity: 1; }
        }

        .pc-sale-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 5px 10px 5px 8px;
          border-radius: 99px;
          background: linear-gradient(135deg, var(--orange) 0%, #cc4e02 100%);
          box-shadow:
            0 3px 12px rgba(255, 97, 2, 0.55),
            inset 0 1px 0 rgba(255,255,255,0.18);
          overflow: hidden;
          pointer-events: none;
          animation: pc-sale-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          transform-origin: top right;
        }

        .pc-sale-badge-fire {
          font-size: 13px;
          line-height: 1;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        .pc-sale-badge-text {
          font-family: Outfit, sans-serif;
          font-size: 13px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1;
        }

        .pc-sale-badge-label {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 8px;
          font-weight: 800;
          color: rgba(255,255,255,0.8);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          align-self: flex-end;
          margin-bottom: 1px;
        }

        .pc-sale-badge-shine {
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.35) 50%,
            transparent 100%
          );
          animation: pc-sale-shimmer 2.8s ease-in-out 0.5s infinite;
        }

        /* ── Wishlist heart button ── */
        .pc-wish {
          position: absolute;
          bottom: 10px;
          right: 10px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          backdrop-filter: blur(4px);
          opacity: 0;
          transform: scale(0.85);
        }

        .pc-root:hover .pc-wish,
        .pc-root:focus-within .pc-wish {
          opacity: 1;
          transform: scale(1);
        }

        .pc-wish:hover {
          background: #fff;
          color: var(--orange);
          transform: scale(1.15) !important;
          box-shadow: 0 4px 16px rgba(255, 97, 2, 0.3);
        }

        .pc-wish--on {
          background: var(--orange) !important;
          color: #fff !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          box-shadow: 0 4px 16px rgba(255, 97, 2, 0.45) !important;
        }

        .pc-wish--on:hover {
          background: #cc4e02 !important;
          transform: scale(1.12) !important;
        }

        /* ── More-actions quick-cart button ── */
        .pc-more-actions {
          position: absolute;
          bottom: 10px;
          left: 10px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.9);
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          backdrop-filter: blur(4px);
          opacity: 0;
          transform: scale(0.85);
        }

        .pc-root:hover .pc-more-actions,
        .pc-root:focus-within .pc-more-actions {
          opacity: 1;
          transform: scale(1);
        }

        .pc-more-actions:hover {
          background: var(--navy-deep);
          color: #fff;
          transform: scale(1.12) !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        }

        .pc-cat,
        .pc-rating {
          display: none !important;
        }

        .pc-title {
          margin: 0 0 4px;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
          color: #000;
          text-transform: uppercase;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: 0.2px;
        }

        .pc-desc {
          margin: 0 0 8px;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.45;
          color: #6b7280;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pc-prices {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
        }

        .pc-compare {
          font-size: 14px;
          font-weight: 500;
          color: #888;
          text-decoration: line-through;
        }

        .pc-price {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--orange);
        }

        .pc-actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .pc-btn {
          flex: 1;
          border: none;
          border-radius: 6px;
          padding: 12px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          transition: all 0.25s ease;
        }

        .pc-btn--cart {
          background: #111;
          color: #fff;
          box-shadow: none;
        }

        .pc-btn--cart:hover:not(:disabled) {
          background: #333;
          color: #fff;
          transform: translateY(-1px);
        }

        .pc-btn--cart:disabled {
          cursor: not-allowed;
          background: #f5f5f5;
          color: #bdbdbd;
          border: 1px solid #e0e0e0;
        }

        .pc-card--added .pc-btn--cart {
          background: #10b981;
          color: white;
        }

        .pc-cart-check {
          font-size: 14px;
          font-weight: 800;
        }

        @media (max-width: 768px) {
          .pc-root:hover .pc-shell,
          .pc-root:focus-within .pc-shell {
            transform: translateY(-3px);
          }

          .pc-card {
            aspect-ratio: unset;
            min-height: 0;
          }

          .pc-stage {
            height: 280px;
            flex: none;
            min-height: 280px;
            border-radius: 0;
          }

          .pc-title {
            font-size: 15px;
          }

          .pc-desc {
            font-size: 13px;
          }

          .pc-price {
            font-size: 16px;
          }

          .pc-wish {
            opacity: 1;
            transform: scale(1);
          }

          .pc-root:hover .pc-media,
          .pc-root:focus-within .pc-media {
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pc-shell,
          .pc-media,
          .pc-img-layer,
          .pc-preview-video,
          .pc-btn {
            transition: none !important;
          }
          .pc-root:hover .pc-shell,
          .pc-root:focus-within .pc-shell {
            transform: none;
          }
          .pc-root:hover .pc-media,
          .pc-root:focus-within .pc-media {
            transform: none;
          }
        }
      `}</style>
    </Link>
  );
}
