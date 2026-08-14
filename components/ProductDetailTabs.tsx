"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import { Camera, FileText, MessageSquareQuote, PenLine, Sparkles, Star, X } from "lucide-react";

type TabId = "details" | "reviews";

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: string;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface ProductDetailTabsProps {
  productId: string;
  description: string;
  initialRating?: number;
  initialReviewCount?: number;
  onStatsChange?: (stats: { rating: number; reviewCount: number }) => void;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="pd-stars" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rounded ? "currentColor" : "none"}
          strokeWidth={1.75}
          className={n <= rounded ? "pd-stars__on" : "pd-stars__off"}
        />
      ))}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function ratingBreakdown(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  }
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star - 1],
    pct: total ? Math.round((counts[star - 1] / total) * 100) : 0,
  }));
}

function FormattedDescription({ text }: { text: string }) {
  if (!text) return null;
  
  // If it already contains HTML tags like <p>, <ul>, <br>, just render it as HTML
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <div className="pd-detail-tabs__prose" dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // Pre-process common plain text patterns
  // 1. Add newlines before "Product Features" or "Product Details"
  let processed = text.replace(/(Product Features|Product Details|Key Features|Specifications):?/gi, '\n\n$1:\n');
  
  // 2. Replace " - " with a bullet point if it looks like a list item
  processed = processed.replace(/\s+-\s+(?=[A-Z0-9\uD83C-\uDBFF\uDC00-\uDFFF])/g, '\n• ');

  const lines = processed.split('\n');

  return (
    <div className="pd-detail-tabs__prose pd-detail-tabs__prose--formatted" style={{ whiteSpace: "pre-line" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Check if it's a heading
        if (trimmed.match(/^(Product Features|Product Details|Key Features|Specifications):?$/i)) {
          return (
            <h4 key={i} style={{ marginTop: "1.25em", marginBottom: "0.5em", color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>
              {trimmed.replace(/:$/, '')}
            </h4>
          );
        }

        // Check if it's a bullet point
        if (trimmed.startsWith('•')) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "0.4em", paddingLeft: "0.5em" }}>
              <span style={{ color: "var(--color-brand)" }}>•</span>
              <span style={{ flex: 1 }}>{trimmed.substring(1).trim()}</span>
            </div>
          );
        }

        return <p key={i} style={{ marginBottom: "0.75em" }}>{trimmed}</p>;
      })}
    </div>
  );
}

export default function ProductDetailTabs({
  productId,
  description,
  initialRating = 0,
  initialReviewCount = 0,
  onStatsChange,
}: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [stats, setStats] = useState({
    rating: initialRating,
    reviewCount: initialReviewCount,
  });
  const [form, setForm] = useState({ name: "", rating: 0, comment: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setReviews(data.reviews ?? []);
      if (data.stats) {
        setStats(data.stats);
        onStatsChange?.(data.stats);
      }
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoadingReviews(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error("Please use JPG, PNG, or WebP");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be 5 MB or smaller");
      e.target.value = "";
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = "";

      if (photoFile) {
        const uploadData = new FormData();
        uploadData.append("file", photoFile);
        const uploadRes = await fetch(`/api/products/${productId}/reviews/upload`, {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadJson.error || "Failed to upload photo");
          return;
        }
        imageUrl = uploadJson.url;
      }

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      if (data.stats) {
        setStats(data.stats);
        onStatsChange?.(data.stats);
      }
      setForm({ name: "", rating: 0, comment: "" });
      clearPhoto();
      toast.success("Thank you! Your review has been posted.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasDescription = Boolean(description?.trim());
  const displayRating = hoverRating || form.rating;
  const breakdown = ratingBreakdown(reviews);
  const hasReviews = stats.reviewCount > 0;

  return (
    <section className="pd-detail-tabs">
      <div className="pd-detail-tabs__top">
        <div className="pd-detail-tabs__intro">
          <span className="section-tag">
            <Sparkles size={14} color="var(--color-icon)" />
            Learn more
          </span>
          <h2 className="pd-detail-tabs__heading">Product Information</h2>
        </div>

        <div
          className="pd-detail-tabs__switch"
          role="tablist"
          aria-label="Product information"
        >
          <span
            className="pd-detail-tabs__switch-slider"
            data-active={activeTab}
            aria-hidden
          />
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            className={`pd-detail-tabs__switch-btn pd-detail-tabs__switch-btn--details${activeTab === "details" ? " pd-detail-tabs__switch-btn--on" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            <FileText size={16} strokeWidth={2} />
            Details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reviews"}
            className={`pd-detail-tabs__switch-btn pd-detail-tabs__switch-btn--reviews${activeTab === "reviews" ? " pd-detail-tabs__switch-btn--on" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <MessageSquareQuote size={16} strokeWidth={2} />
            Reviews
            {stats.reviewCount > 0 && (
              <span className="pd-detail-tabs__count">{stats.reviewCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="pd-detail-tabs__body">
        {activeTab === "details" && (
          <div role="tabpanel" className="pd-detail-tabs__details-panel">
            {hasDescription ? (
              <FormattedDescription text={description} />
            ) : (
              <div className="pd-detail-tabs__empty-details">
                <FileText size={40} strokeWidth={1.25} />
                <p>No detailed description available for this product yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div role="tabpanel" className="pd-reviews">
            <div className="pd-rating-summary" aria-label="Product rating summary">
              <div className="pd-rating-summary__left">
                <div className="pd-rating-summary__score-wrap">
                  {hasReviews ? (
                    <>
                      <span className="pd-rating-summary__number">{stats.rating.toFixed(1)}</span>
                      <span className="pd-rating-summary__denom">/ 5</span>
                    </>
                  ) : (
                    <span className="pd-rating-summary__new">New</span>
                  )}
                </div>
                <p className="pd-rating-summary__label">
                  {hasReviews ? "Average rating" : "No ratings yet"}
                </p>
              </div>

              <div className="pd-rating-summary__center">
                <StarDisplay rating={hasReviews ? stats.rating : 0} size={22} />
                <p className="pd-rating-summary__headline">
                  {hasReviews ? (
                    <>
                      <strong>{stats.reviewCount}</strong>{" "}
                      {stats.reviewCount === 1 ? "customer review" : "customer reviews"}
                    </>
                  ) : (
                    "Be the first to review this product"
                  )}
                </p>
                <p className="pd-rating-summary__sub">
                  {hasReviews
                    ? "Scores are calculated from real buyer feedback on this page."
                    : "Your rating and comment help others shop with confidence."}
                </p>
              </div>

              {hasReviews && (
                <div className="pd-rating-summary__bars" aria-label="Rating distribution">
                  {breakdown.map((row) => (
                    <div key={row.star} className="pd-rating-bar">
                      <span className="pd-rating-bar__label">{row.star}★</span>
                      <div className="pd-rating-bar__track">
                        <div
                          className="pd-rating-bar__fill"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="pd-rating-bar__pct">{row.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form className="pd-review-form" onSubmit={handleSubmit}>
                <div className="pd-review-form__head">
                  <div className="pd-review-form__icon" aria-hidden>
                    <PenLine size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>Share your experience</h3>
                    <p>Help other shoppers — your review appears instantly.</p>
                  </div>
                </div>

                <label className="pd-field">
                  <span>Your name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ahmed Khan"
                    maxLength={80}
                    required
                  />
                </label>

                <div className="pd-field">
                  <span>Rating</span>
                  <div
                    className="pd-star-picker"
                    role="group"
                    aria-label="Rating"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`pd-star-picker__star${
                          (hoverRating || form.rating) >= n ? " pd-star-picker__star--on" : ""
                        }`}
                        onMouseEnter={() => setHoverRating(n)}
                        onClick={() => setForm((f) => ({ ...f, rating: n }))}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        <Star size={32} fill="currentColor" strokeWidth={1.25} />
                      </button>
                    ))}
                  </div>
                  <p className="pd-star-picker__hint">
                    {displayRating > 0
                      ? RATING_LABELS[displayRating]
                      : "Tap a star to rate"}
                  </p>
                </div>

                <label className="pd-field">
                  <span>Your review</span>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="What did you like? How is the quality, packaging, and delivery?"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                  <span className="pd-field__hint">{form.comment.length}/2000</span>
                </label>

                <div className="pd-field">
                  <span>Product photo <em className="pd-field__optional">(optional)</em></span>
                  <p className="pd-photo-field__help">
                    Upload a photo of the product you received — helps other buyers see the real item.
                  </p>
                  <input
                    ref={photoInputRef}
                    id={`review-photo-${productId}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="pd-photo-field__input"
                    onChange={handlePhotoSelect}
                  />
                  {photoPreview ? (
                    <div className="pd-photo-preview">
                      <div className="pd-photo-preview__img-wrap">
                        <Image
                          src={photoPreview}
                          alt="Your product photo preview"
                          fill
                          sizes="160px"
                          className="pd-photo-preview__img"
                          
                        />
                      </div>
                      <div className="pd-photo-preview__actions">
                        <label htmlFor={`review-photo-${productId}`} className="pd-photo-preview__change">
                          Change photo
                        </label>
                        <button type="button" className="pd-photo-preview__remove" onClick={clearPhoto}>
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor={`review-photo-${productId}`} className="pd-photo-upload">
                      <Camera size={22} strokeWidth={2} color="var(--color-icon)" />
                      <span className="pd-photo-upload__title">Add a product photo</span>
                      <span className="pd-photo-upload__sub">JPG, PNG or WebP · max 5 MB</span>
                    </label>
                  )}
                </div>

                <button type="submit" className="btn-primary pd-review-form__submit" disabled={submitting}>
                  {submitting ? "Posting…" : "Post Review"}
                </button>
              </form>

            <div className="pd-reviews__list-section">
              <div className="pd-reviews__list-head">
                <h3>Customer feedback</h3>
                {!loadingReviews && reviews.length > 0 && (
                  <span className="pd-reviews__list-pill">{reviews.length} shown</span>
                )}
              </div>

              {loadingReviews ? (
                <div className="pd-reviews__loading">
                  <div className="spinner" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="pd-reviews__empty">
                  <MessageSquareQuote size={36} strokeWidth={1.25} />
                  <p>No reviews yet</p>
                  <span>Be the first to tell others about this product.</span>
                </div>
              ) : (
                <ul className="pd-reviews__list">
                  {reviews.map((review) => (
                    <li key={review._id} className="pd-review-item">
                      <div className="pd-review-item__avatar" aria-hidden>
                        {initials(review.name)}
                      </div>
                      <div className="pd-review-item__content">
                        <div className="pd-review-item__top">
                          <div>
                            <strong>{review.name}</strong>
                            <StarDisplay rating={review.rating} size={14} />
                          </div>
                          <time dateTime={review.createdAt}>
                            {format(new Date(review.createdAt), "dd MMM yyyy")}
                          </time>
                        </div>
                        <p>{review.comment}</p>
                        {review.imageUrl ? (
                          <a
                            href={review.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pd-review-item__photo-link"
                          >
                            <div className="pd-review-item__photo">
                              <Image
                                src={review.imageUrl}
                                alt={`Photo from ${review.name}`}
                                fill
                                sizes="(max-width: 520px) 100vw, 280px"
                                className="pd-review-item__photo-img"
                                
                              />
                            </div>
                            <span>View full photo</span>
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pd-detail-tabs {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          margin-bottom: 64px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }

        .pd-detail-tabs__top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 28px 36px 24px;
          border-bottom: 1px solid var(--border-default);
          background: linear-gradient(180deg, var(--cream-dark) 0%, var(--bg-card) 100%);
          min-width: 0;
        }

        .pd-detail-tabs__intro {
          min-width: 0;
          flex: 1 1 auto;
        }

        .pd-detail-tabs__intro .section-tag {
          margin-bottom: 8px;
        }

        .pd-detail-tabs__heading {
          font-size: clamp(1.35rem, 2.5vw, 1.75rem);
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.03em;
        }

        .pd-detail-tabs__switch {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
          flex: 1 1 220px;
          width: 100%;
          max-width: 360px;
          padding: 4px;
          border-radius: 999px;
          background: var(--navy-deep);
          border: 1px solid rgba(255, 97, 2, 0.35);
          box-shadow: 0 6px 20px rgba(16, 40, 87, 0.28);
          margin-bottom: 0;
          box-sizing: border-box;
        }

        .pd-detail-tabs__switch-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc(50% - 4px);
          border-radius: 999px;
          background: var(--white);
          box-shadow: 0 2px 8px rgba(42, 21, 24, 0.12);
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 0;
        }

        .pd-detail-tabs__switch-slider[data-active="reviews"] {
          left: calc(50%);
        }

        .pd-detail-tabs__switch-btn {
          grid-row: 1;
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          background: transparent;
          padding: 10px 12px;
          border-radius: 999px;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: clamp(11px, 3.2vw, 13px);
          font-weight: 700;
          color: var(--white);
          cursor: pointer;
          transition: color 0.22s ease;
          white-space: nowrap;
          min-width: 0;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .pd-detail-tabs__switch-btn--details {
          grid-column: 1;
        }

        .pd-detail-tabs__switch-btn--reviews {
          grid-column: 2;
        }

        .pd-detail-tabs__switch-btn--on {
          color: var(--text-primary);
        }

        .pd-detail-tabs__count {
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          padding: 3px 7px;
          border-radius: 999px;
          background: var(--color-brand-dim);
          color: var(--color-brand);
        }

        .pd-detail-tabs__switch-btn--on .pd-detail-tabs__count {
          background: rgba(126, 26, 53, 0.12);
        }

        .pd-detail-tabs__body {
          padding: 36px 40px 44px;
        }

        .pd-detail-tabs__details-panel {
          animation: pdTabIn 0.35s ease;
        }

        .pd-detail-tabs__prose {
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.85;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pd-detail-tabs__prose img,
        .pd-detail-tabs__prose table,
        .pd-detail-tabs__prose pre {
          max-width: 100%;
          height: auto;
        }

        .pd-detail-tabs__prose p {
          margin-bottom: 1em;
        }

        .pd-detail-tabs__prose ul,
        .pd-detail-tabs__prose ol {
          margin: 0 0 1em 1.25em;
        }

        .pd-detail-tabs__prose li {
          margin-bottom: 0.35em;
        }

        .pd-detail-tabs__prose strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .pd-detail-tabs__empty-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 48px 24px;
          text-align: center;
          color: var(--text-secondary);
          background: var(--bg-primary);
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-lg);
        }

        .pd-detail-tabs__empty-details p {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .pd-reviews {
          display: flex;
          flex-direction: column;
          gap: 36px;
          animation: pdTabIn 0.35s ease;
        }

        @keyframes pdTabIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pd-rating-summary {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 28px 32px;
          align-items: center;
          padding: 24px 28px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .pd-rating-summary__left {
          text-align: center;
          padding-right: 28px;
          border-right: 1px solid var(--border-default);
          min-width: 120px;
        }

        .pd-rating-summary__score-wrap {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          line-height: 1;
        }

        .pd-rating-summary__number {
          font-family: Outfit, sans-serif;
          font-size: 3rem;
          font-weight: 900;
          color: var(--orange);
          letter-spacing: -0.04em;
        }

        .pd-rating-summary__denom {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .pd-rating-summary__new {
          font-family: Outfit, sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--orange);
          letter-spacing: -0.02em;
        }

        .pd-rating-summary__label {
          margin: 8px 0 0;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
          font-family: Outfit, sans-serif;
        }

        .pd-rating-summary__center {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .pd-rating-summary__headline {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: Outfit, sans-serif;
        }

        .pd-rating-summary__headline strong {
          color: var(--orange);
          font-weight: 900;
        }

        .pd-rating-summary__sub {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: 420px;
        }

        .pd-rating-summary__bars {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 180px;
          padding-left: 28px;
          border-left: 1px solid var(--border-default);
        }

        .pd-rating-bar {
          display: grid;
          grid-template-columns: 28px 1fr 36px;
          align-items: center;
          gap: 8px;
        }

        .pd-rating-bar__label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          font-family: Outfit, sans-serif;
        }

        .pd-rating-bar__track {
          height: 8px;
          border-radius: 999px;
          background: var(--cream-mid);
          overflow: hidden;
        }

        .pd-rating-bar__fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--orange), var(--navy-soft));
          min-width: 0;
          transition: width 0.4s ease;
        }

        .pd-rating-bar__pct {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-align: right;
        }

        .pd-stars {
          display: inline-flex;
          gap: 4px;
          color: var(--orange);
        }

        .pd-stars__off {
          opacity: 0.28;
        }

        .pd-review-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 26px 28px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .pd-review-form__head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .pd-review-form__icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-brand);
          color: var(--white);
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(126, 26, 53, 0.25);
        }

        .pd-review-form__head h3 {
          margin: 0 0 4px;
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .pd-review-form__head p {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .pd-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pd-field > span:first-child {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          font-family: Outfit, sans-serif;
        }

        .pd-field__optional {
          font-style: normal;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          color: var(--gray);
          font-size: 11px;
        }

        .pd-photo-field__help {
          margin: -4px 0 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .pd-photo-field__input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .pd-photo-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 22px 20px;
          border: 2px dashed var(--border-hover);
          border-radius: var(--radius-md);
          background: var(--bg-card);
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
          text-align: center;
        }

        .pd-photo-upload:hover {
          border-color: var(--navy-soft);
          background: var(--color-brand-dim);
        }

        .pd-photo-upload__title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: Outfit, sans-serif;
        }

        .pd-photo-upload__sub {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pd-photo-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 12px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          background: var(--bg-card);
        }

        .pd-photo-preview__img-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-default);
          flex-shrink: 0;
        }

        .pd-photo-preview__img {
          object-fit: cover;
        }

        .pd-photo-preview__actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pd-photo-preview__change {
          font-size: 13px;
          font-weight: 700;
          color: var(--orange);
          cursor: pointer;
          font-family: Outfit, sans-serif;
        }

        .pd-photo-preview__remove {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-error);
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .pd-field input,
        .pd-field textarea {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid var(--border-default);
          border-radius: var(--radius-md);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pd-field input:focus,
        .pd-field textarea:focus {
          outline: none;
          border-color: var(--navy-soft);
          box-shadow: 0 0 0 3px var(--color-brand-dim);
        }

        .pd-field textarea {
          resize: vertical;
          min-height: 108px;
          line-height: 1.6;
        }

        .pd-field__hint {
          font-size: 11px;
          color: var(--text-secondary);
          text-align: right;
          font-weight: 600;
        }

        .pd-star-picker {
          display: flex;
          gap: 6px;
          padding: 4px 0;
        }

        .pd-star-picker__star {
          border: none;
          background: transparent;
          padding: 2px;
          cursor: pointer;
          color: var(--cream-mid);
          transition: color 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .pd-star-picker__star:hover,
        .pd-star-picker__star--on {
          color: var(--orange);
        }

        .pd-star-picker__star:hover {
          transform: scale(1.12);
        }

        .pd-star-picker__hint {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--orange);
          font-family: Outfit, sans-serif;
        }

        .pd-review-form__submit {
          align-self: flex-start;
          padding: 14px 28px !important;
          font-size: 14px !important;
        }

        .pd-reviews__list-section {
          padding-top: 8px;
          border-top: 1px solid var(--border-default);
        }

        .pd-reviews__list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pd-reviews__list-head h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .pd-reviews__list-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          background: var(--color-brand-dim);
          color: var(--color-brand);
        }

        .pd-reviews__loading {
          display: flex;
          justify-content: center;
          padding: 48px 0;
        }

        .pd-reviews__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 56px 24px;
          text-align: center;
          color: var(--text-secondary);
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border-hover);
        }

        .pd-reviews__empty p {
          margin: 8px 0 0;
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
          font-family: Outfit, sans-serif;
        }

        .pd-reviews__empty span {
          font-size: 14px;
          font-weight: 500;
        }

        .pd-reviews__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 14px;
        }

        .pd-review-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          padding: 22px 24px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pd-review-item:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-sm);
        }

        .pd-review-item__avatar {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: var(--gradient-brand);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          font-family: Outfit, sans-serif;
          box-shadow: 0 4px 12px rgba(126, 26, 53, 0.2);
        }

        .pd-review-item__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .pd-review-item__top strong {
          display: block;
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          font-family: Outfit, sans-serif;
          margin-bottom: 6px;
        }

        .pd-review-item__top time {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          padding: 4px 10px;
          background: var(--bg-card);
          border-radius: 999px;
          border: 1px solid var(--border-default);
        }

        .pd-review-item__content > p {
          margin: 0;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .pd-review-item__photo-link {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 14px;
          text-decoration: none;
          color: inherit;
          max-width: 280px;
        }

        .pd-review-item__photo-link > span {
          font-size: 12px;
          font-weight: 700;
          color: var(--orange);
          font-family: Outfit, sans-serif;
        }

        .pd-review-item__photo {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: var(--gradient-card-img);
        }

        .pd-review-item__photo-img {
          object-fit: cover;
          transition: transform 0.25s ease;
        }

        .pd-review-item__photo-link:hover .pd-review-item__photo-img {
          transform: scale(1.03);
        }

        .pd-stars__off {
          opacity: 0.3;
        }

        @media (max-width: 900px) {
          .pd-detail-tabs {
            margin-bottom: 40px;
            border-radius: var(--radius-lg);
          }

          .pd-detail-tabs__top {
            padding: 18px 16px 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .pd-detail-tabs__switch {
            flex: none;
            max-width: 100%;
            width: 100%;
          }

          .pd-detail-tabs__switch-slider {
            display: none;
          }

          .pd-detail-tabs__switch-btn--on {
            background: var(--white);
            box-shadow: 0 2px 8px rgba(42, 21, 24, 0.12);
          }

          .pd-detail-tabs__body {
            padding: 18px 16px 24px;
          }

          .pd-rating-summary {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 18px 16px;
          }

          .pd-rating-summary__left {
            padding-right: 0;
            padding-bottom: 14px;
            border-right: none;
            border-bottom: 1px solid var(--border-default);
            min-width: 0;
          }

          .pd-rating-summary__center {
            text-align: center;
            align-items: center;
          }

          .pd-rating-summary__sub {
            max-width: none;
          }

          .pd-rating-summary__bars {
            padding-left: 0;
            border-left: none;
            padding-top: 14px;
            border-top: 1px solid var(--border-default);
            min-width: 0;
            width: 100%;
          }

          .pd-review-form {
            padding: 20px 16px;
          }

          .pd-review-form__submit {
            align-self: stretch;
            width: 100%;
            justify-content: center;
          }

          .pd-star-picker {
            justify-content: center;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 520px) {
          .pd-detail-tabs__switch {
            padding: 3px;
          }

          .pd-detail-tabs__switch-btn {
            padding: 9px 6px;
            gap: 4px;
            font-size: 11px;
          }

          .pd-detail-tabs__switch-btn svg {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
          }

          .pd-detail-tabs__count {
            font-size: 9px;
            padding: 2px 5px;
          }

          .pd-rating-summary__number {
            font-size: 2.5rem;
          }

          .pd-rating-summary__new {
            font-size: 1.65rem;
          }

          .pd-rating-summary__headline {
            font-size: 15px;
          }

          .pd-rating-summary__sub {
            font-size: 13px;
          }

          .pd-review-item {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
          }

          .pd-review-item__avatar {
            width: 44px;
            height: 44px;
            border-radius: 12px;
          }

          .pd-review-item__top {
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
