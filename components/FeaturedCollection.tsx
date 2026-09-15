"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export type FeaturedProduct = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  previewVideoUrl?: string;
  shortDescription?: string;
};

export default function FeaturedCollection({ products }: { products: FeaturedProduct[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasMoved = useRef(false);

  const displayProducts = products.slice(0, 8);

  // Update navigation button and active dot state based on scroll position
  const checkScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate approximate active card index
    const card = el.querySelector(".fc-card-slot") as HTMLElement;
    if (card) {
      const cardWidth = card.offsetWidth + 24; // width + gap
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), displayProducts.length - 1));
    }
  }, [displayProducts.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState, { passive: true });

    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState]);

  const scrollToCard = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".fc-card-slot") as HTMLElement;
    if (!card) return;
    const cardWidth = card.offsetWidth + 24;
    el.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  const scrollByStep = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".fc-card-slot") as HTMLElement;
    const step = card ? card.offsetWidth + 24 : 300;
    el.scrollBy({
      left: direction === "right" ? step : -step,
      behavior: "smooth",
    });
  };

  // Mouse drag-to-scroll support for desktop trackpads & mice
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    hasMoved.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    scrollStartX.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
    }
    trackRef.current.scrollLeft = scrollStartX.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="editorial-fc-section" aria-labelledby="featured-collection-heading">
      <div className="page-container editorial-fc-inner">
        
        {/* Left Side: Sticky Description */}
        <div className="editorial-fc-sticky">
          <div className="fc-sticky-content">
            <h2 id="featured-collection-heading" className="fc-title">
              Our Top Picks.
            </h2>
            <div className="fc-title-underline" />
            <p className="fc-sub">
              A curated selection of our most loved, premium products. Hand-picked for quality and performance.
            </p>
            <div className="fc-action-row">
              <Link href="/products?featured=true" className="fc-catalog-link">
                Shop the Collection
                <ArrowUpRight size={18} strokeWidth={2.5} aria-hidden />
              </Link>
            </div>

            {/* Desktop Slide Navigation */}
            {displayProducts.length > 2 && (
              <div className="fc-desktop-nav">
                <button
                  type="button"
                  onClick={() => scrollByStep("left")}
                  disabled={!canScrollLeft}
                  className="fc-nav-arrow"
                  aria-label="Previous products"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="fc-nav-counter">
                  <span className="fc-nav-current">{activeIndex + 1}</span>
                  <span className="fc-nav-sep">/</span>
                  <span className="fc-nav-total">{displayProducts.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => scrollByStep("right")}
                  disabled={!canScrollRight}
                  className="fc-nav-arrow"
                  aria-label="Next products"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Horizontal Scrolling List */}
        <div className="editorial-fc-scroll">
          {displayProducts.length > 0 ? (
            <>
              {/* Mobile Quick Navigation Controls */}
              <div className="fc-mobile-nav-bar">
                <span className="fc-mobile-badge">Swipe to explore ({displayProducts.length})</span>
                <div className="fc-mobile-arrows">
                  <button
                    type="button"
                    onClick={() => scrollByStep("left")}
                    disabled={!canScrollLeft}
                    className="fc-nav-arrow fc-nav-arrow--sm"
                    aria-label="Slide left"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByStep("right")}
                    disabled={!canScrollRight}
                    className="fc-nav-arrow fc-nav-arrow--sm"
                    aria-label="Slide right"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div
                ref={trackRef}
                className={`fc-scroll-track ${isDragging ? "is-dragging" : ""}`}
                role="list"
                aria-label="Featured products"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
              >
                {displayProducts.map((p, idx) => (
                  <div
                    key={p._id}
                    className="fc-card-slot"
                    role="listitem"
                    onClickCapture={(e) => {
                      // If user was actively dragging on desktop, prevent opening the link
                      if (hasMoved.current) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Dots Indicator for Mobile & Tablet */}
              <div className="fc-dots-container" aria-hidden="true">
                {displayProducts.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToCard(i)}
                    className={`fc-dot ${i === activeIndex ? "fc-dot--active" : ""}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="fc-empty" role="status">
              <p className="fc-empty-title">Featured picks are on the way</p>
              <p className="fc-empty-text">Check back soon for our curated selections.</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .editorial-fc-section {
          padding: 100px 0;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }

        .editorial-fc-inner {
          display: flex;
          gap: 50px;
          align-items: flex-start;
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
        }

        /* --- Left Side --- */
        .editorial-fc-sticky {
          flex: 0 0 340px;
          position: sticky;
          top: 140px;
        }

        .fc-sticky-content {
          padding-right: 15px;
        }

        .fc-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(2.2rem, 3.8vw, 3.2rem);
          font-weight: 900;
          color: var(--navy-deep);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
        }

        .fc-title-underline {
          width: 70px;
          height: 5px;
          background: var(--orange);
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .fc-sub {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1.05rem;
          color: var(--slate);
          line-height: 1.6;
          margin: 0 0 28px;
        }

        .fc-action-row {
          margin-bottom: 28px;
        }

        .fc-catalog-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 999px;
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--white);
          background: var(--orange);
          text-decoration: none;
          box-shadow: 0 10px 25px -5px rgba(255, 97, 2, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fc-catalog-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -5px rgba(255, 97, 2, 0.5);
          background: #ff7825;
        }

        /* --- Desktop Nav Controls --- */
        .fc-desktop-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .fc-nav-arrow {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border-default);
          background: var(--white);
          color: var(--navy-deep);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .fc-nav-arrow--sm {
          width: 36px;
          height: 36px;
        }

        .fc-nav-arrow:hover:not(:disabled) {
          background: var(--navy-deep);
          color: var(--white);
          border-color: var(--navy-deep);
          transform: translateY(-1px);
        }

        .fc-nav-arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        .fc-nav-counter {
          font-family: var(--font-outfit), sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--slate);
          padding: 0 4px;
        }

        .fc-nav-current {
          color: var(--navy-deep);
          font-weight: 900;
        }

        .fc-nav-sep {
          margin: 0 4px;
          opacity: 0.5;
        }

        /* --- Right Side: Horizontal Track --- */
        .editorial-fc-scroll {
          flex: 1;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          position: relative;
        }

        .fc-mobile-nav-bar {
          display: none;
        }

        .fc-scroll-track {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 15px 4px 35px 4px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-x pan-y;
          overscroll-behavior-x: contain;
          -ms-overflow-style: none;
          scrollbar-width: none;
          cursor: grab;
          width: 100%;
          max-width: 100%;
        }

        .fc-scroll-track.is-dragging {
          cursor: grabbing;
          scroll-snap-type: none;
          scroll-behavior: auto;
          user-select: none;
        }

        .fc-scroll-track::-webkit-scrollbar {
          display: none;
        }

        .fc-card-slot {
          flex: 0 0 calc(50% - 11px);
          min-width: 270px;
          max-width: 320px;
          scroll-snap-align: start;
          scroll-snap-stop: normal;
        }

        /* Dots */
        .fc-dots-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .fc-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #cbd5e1;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fc-dot--active {
          width: 26px;
          background: var(--orange);
          border-radius: 999px;
        }

        .fc-empty {
          text-align: center;
          padding: 60px;
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border-default);
        }

        .fc-empty-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--navy);
        }

        .fc-empty-text {
          color: var(--slate);
          margin-top: 8px;
        }

        /* --- Mobile / Tablet Viewport Adjustments --- */
        @media (max-width: 1024px) {
          .editorial-fc-section {
            padding: 60px 0 80px 0;
          }

          .editorial-fc-inner {
            flex-direction: column;
            align-items: stretch !important;
            gap: 28px;
            width: 100%;
          }

          .editorial-fc-sticky {
            flex: none;
            position: relative;
            top: 0;
            max-width: 100%;
          }

          .fc-desktop-nav {
            display: none;
          }

          .fc-mobile-nav-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 0 4px;
          }

          .fc-mobile-badge {
            font-family: var(--font-jakarta), sans-serif;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--slate);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .fc-mobile-arrows {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .editorial-fc-scroll {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow: visible;
          }

          .fc-scroll-track {
            padding-left: 20px;
            padding-right: 20px;
            margin-left: -20px;
            margin-right: -20px;
            width: calc(100% + 40px) !important;
            max-width: calc(100% + 40px) !important;
            gap: 16px;
            padding-bottom: 20px;
          }

          .fc-card-slot {
            flex: 0 0 270px;
            min-width: 270px;
            max-width: 280px;
          }
        }

        @media (max-width: 480px) {
          .fc-card-slot {
            flex: 0 0 260px;
            min-width: 260px;
            max-width: 260px;
          }
        }
      `}</style>
    </section>
  );
}
