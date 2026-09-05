"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;

type Cat = {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  imagePosition: string;
};

const DEFAULT_CATEGORIES: Cat[] = [
  {
    name: "Kitchen & Cooking",
    slug: "kitchen-cooking",
    image: unsplash("photo-1556911220-e15b29be8c8f", 800),
    imagePosition: "center 60%",
  },
  {
    name: "Personal Care",
    slug: "personal-care-beauty",
    image: unsplash("photo-1596462502278-27bfdc403348", 800),
    imagePosition: "center 42%",
  },
  {
    name: "Home & Clean",
    slug: "home-cleaning",
    image: unsplash("photo-1581578731548-c64695cc6952", 800),
    imagePosition: "center 55%",
  },
  {
    name: "Fitness",
    slug: "fitness-health",
    image: unsplash("photo-1517836357463-d25dfeac3438", 800),
    imagePosition: "center 45%",
  },
  {
    name: "Electronics",
    slug: "electronics-gadgets",
    image: unsplash("photo-1498049794561-7780e7231661", 800),
    imagePosition: "center 50%",
  },
];

export default function CategoryShowcase() {
  const router = useRouter();
  const [categories, setCategories] = useState<Cat[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Desktop active state
  const [activeCategory, setActiveCategory] = useState<number>(0);

  // Mobile overlay state
  const [mobileOverlayIndex, setMobileOverlayIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", {
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories.slice(0, 12));
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return null;

  const handleMobileTextClick = (idx: number) => {
    if (window.innerWidth <= 1024) {
      setMobileOverlayIndex(idx);
    }
  };

  const handleDoubleClick = (slug: string) => {
    router.push(`/products?category=${slug}`);
  };

  const handleArrowClick = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    router.push(`/products?category=${slug}`);
  };

  return (
    <section className="category-section">
      <div className="page-container" style={{ position: 'relative' }}>
        
        <h2 className="section-heading">Curated<br />Collections.</h2>

        <div className="category-split">

          <div className="category-list">
            <div className="list-container">
              {categories.map((cat, idx) => (
                <div
                  key={cat._id || cat.slug || idx}
                  className="list-item"
                  onMouseEnter={() => {
                    if (window.innerWidth > 1024) setActiveCategory(idx);
                  }}
                >
                  <div
                    className="list-text-area"
                    onClick={() => handleMobileTextClick(idx)}
                    onDoubleClick={() => handleDoubleClick(cat.slug)}
                  >
                    <span className="list-number">{(idx + 1).toString().padStart(2, '0')}</span>
                    <h3 className="list-name">{cat.name}</h3>
                  </div>
                  <div
                    className="list-arrow"
                    onClick={(e) => handleArrowClick(e, cat.slug)}
                  >
                    <ArrowRight size={32} strokeWidth={1.5} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`category-preview ${mobileOverlayIndex !== null ? 'mobile-visible' : ''}`}>

            {/* Close button for mobile overlay */}
            <button
              className="mobile-close-btn"
              onClick={() => setMobileOverlayIndex(null)}
            >
              <X size={24} />
            </button>

            <div className="preview-sticky">
              {categories.map((cat, idx) => {
                // Determine active index based on viewport
                const isActive = typeof window !== 'undefined' && window.innerWidth <= 1024
                  ? mobileOverlayIndex === idx
                  : activeCategory === idx;

                return (
                  <div
                    key={cat.slug}
                    className={`preview-image-wrapper ${isActive ? 'active' : ''}`}
                  >
                    <div
                      className="preview-image"
                      style={{
                        backgroundImage: `url(${cat.image})`,
                        backgroundPosition: cat.imagePosition || "center",
                      }}
                    />
                    <div className="preview-overlay">
                      <div className="preview-content-box">
                        <div className="preview-text">Explore {cat.name}</div>
                        <button
                          className="mobile-view-btn"
                          onClick={() => router.push(`/products?category=${cat.slug}`)}
                        >
                          View Products
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .category-section {
          padding: 120px 0;
          background: var(--cream);
          border-top: 1px solid var(--border-default);
          position: relative;
        }

        .category-split {
          display: flex;
          gap: 80px;
          align-items: stretch;
          position: relative;
          height: 600px;
        }

        .category-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .section-heading {
          font-family: var(--font-jakarta), sans-serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 900;
          color: var(--navy);
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin: 0 0 40px 0;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
        }

        .list-item {
          display: flex;
          flex: 1;
          align-items: center;
          border-top: 1px solid var(--border-default);
          color: var(--navy);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .list-item:last-child {
          border-bottom: 1px solid var(--border-default);
        }

        .list-text-area {
          display: flex;
          align-items: center;
          flex: 1;
          cursor: pointer;
          user-select: none;
        }

        .list-number {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--slate);
          margin-right: 40px;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }

        .list-name {
          font-family: var(--font-jakarta), sans-serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
          flex: 1;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease;
        }

        .list-arrow {
          color: var(--orange);
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          padding: 8px;
        }

        .list-item:hover {
          border-top-color: var(--navy);
        }
        
        .list-item:hover + .list-item {
          border-top-color: var(--navy);
        }

        .list-item:hover .list-number {
          opacity: 1;
          color: var(--orange);
        }

        .list-item:hover .list-name {
          transform: translateX(10px);
          color: var(--navy-deep);
        }

        .list-item:hover .list-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .category-preview {
          flex: 1;
          position: relative;
          height: 100%;
        }

        .mobile-close-btn {
          display: none;
        }

        .preview-sticky {
          position: sticky;
          top: 120px;
          height: 480px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--navy);
        }

        .preview-image-wrapper {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 1;
          pointer-events: none;
        }

        .preview-image-wrapper.active {
          opacity: 1;
          z-index: 2;
          pointer-events: auto;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          background-size: cover;
          transform: scale(1.1);
          transition: transform 6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .preview-image-wrapper.active .preview-image {
          transform: scale(1);
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(16,40,87,0.8) 0%, transparent 50%);
          display: flex;
          align-items: flex-end;
          padding: 40px;
        }
        
        .preview-content-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-text {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--white);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transform: translateY(20px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
        }

        .preview-image-wrapper.active .preview-text {
          transform: translateY(0);
          opacity: 1;
        }

        .mobile-view-btn {
          display: none;
        }

        @media (max-width: 1024px) {
          .category-section {
            padding: 80px 0;
          }
          
          /* Keep the list active but optimize layout */
          .category-split {
            flex-direction: column;
            gap: 0;
            width: 100%;
            height: auto;
          }
          .category-list {
            width: 100%;
            height: auto;
          }
          .list-item {
            padding: 32px 0;
            width: 100%;
            flex: none;
          }
          .list-arrow {
            opacity: 1;
            transform: translateX(0);
            background: rgba(255, 97, 2, 0.1);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Hide hover translation on mobile */
          .list-item:hover .list-name {
            transform: none;
          }
          .list-item:hover .list-number {
            color: var(--slate);
          }
          
          /* Mobile Card Overlay Logic */
          .category-preview {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(16, 40, 87, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }

          .category-preview.mobile-visible {
            opacity: 1;
            pointer-events: auto;
          }

          .preview-sticky {
            position: relative;
            top: 0;
            left: 0;
            width: 85%;
            max-width: 400px;
            aspect-ratio: 3/4;
            height: auto;
            border-radius: 24px;
            box-shadow: 0 24px 48px rgba(0,0,0,0.4);
            overflow: hidden;
            transform: scale(0.95) translateY(20px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            margin: 0 auto;
          }
          
          .category-preview.mobile-visible .preview-sticky {
            transform: scale(1) translateY(0);
          }

          .preview-image-wrapper {
            position: absolute;
            inset: 0;
          }

          .mobile-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 24px;
            right: 24px;
            width: 44px;
            height: 44px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 50%;
            z-index: 1010;
            cursor: pointer;
            backdrop-filter: blur(4px);
            transition: background 0.3s ease;
          }

          .mobile-view-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 14px 28px;
            background: var(--orange);
            color: var(--white);
            font-family: var(--font-jakarta), sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            border: none;
            border-radius: 100px;
            margin-top: 12px;
            cursor: pointer;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
            width: 100%;
          }

          .preview-image-wrapper.active .mobile-view-btn {
            transform: translateY(0);
            opacity: 1;
          }
          
          .preview-overlay {
            padding: 32px 24px;
            background: linear-gradient(to top, rgba(16,40,87,0.95) 0%, rgba(16,40,87,0.6) 40%, transparent 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          
          .preview-content-box {
            width: 100%;
          }
          
          .preview-text {
            font-size: 1.5rem;
            margin-bottom: 4px;
          }
        }

        @media (max-width: 640px) {
          .category-section {
            padding: 60px 0;
          }
          .section-heading {
            font-size: 2.5rem;
            margin-bottom: 24px;
          }
          .list-item {
            padding: 24px 0;
          }
          .list-number {
            margin-right: 16px;
            font-size: 0.9rem;
          }
          .list-name {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
}
