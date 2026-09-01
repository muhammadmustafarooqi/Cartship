"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSettings } from "@/lib/useSettings";
import { LOGO_URL } from "@/lib/site";
import { ShoppingBag, Zap, ShieldCheck } from "lucide-react";

export default function Preloader() {
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const logoSrc = settings?.logoUrl || LOGO_URL;
  const storeName = settings?.storeName || "CartShip";

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling while preloader is active
    document.body.style.overflow = "hidden";

    const duration = 1400; // ms
    const intervalTime = 20;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step + (Math.random() * 2);
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const fadeTimeout = setTimeout(() => {
        setIsFadingOut(true);
      }, 200);

      const removeTimeout = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "";
      }, 750);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(removeTimeout);
      };
    }
  }, [progress]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      className={`preloader-overlay ${isFadingOut ? "preloader-exit" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
      }}
      aria-hidden={isFadingOut}
      role="dialog"
      aria-label="Loading application"
    >
      {/* Dynamic Background Glows */}
      <div className="preloader-bg-glow glow-1" />
      <div className="preloader-bg-glow glow-2" />
      
      {/* Decorative Grid Pattern */}
      <div className="preloader-grid" />

      {/* Main Content Card */}
      <div className="preloader-card">
        {/* Animated Brand Logo Badge */}
        <div className="preloader-logo-wrapper">
          <div className="preloader-ring-outer" />
          <div className="preloader-ring-inner" />
          <div className="preloader-logo-box">
            <Image
              src={logoSrc}
              alt={storeName}
              width={72}
              height={72}
              priority
              className="preloader-logo-img"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="preloader-brand-text">
          <h1 className="preloader-title">
            {storeName.toUpperCase()}
          </h1>
          <p className="preloader-subtitle">
            Premium Shopping Experience
          </p>
        </div>

        {/* Progress Bar & Counter */}
        <div className="preloader-progress-container">
          <div className="preloader-progress-info">
            <span className="preloader-status-text">
              {progress < 40
                ? "Connecting to Store..."
                : progress < 85
                ? "Loading Catalog & Offers..."
                : "Almost Ready..."}
            </span>
            <span className="preloader-percentage">
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>

          <div className="preloader-track">
            <div
              className="preloader-bar"
              style={{ width: `${Math.min(100, progress)}%` }}
            >
              <div className="preloader-bar-spark" />
            </div>
          </div>
        </div>

        {/* Micro Trust Badges */}
        <div className="preloader-badges">
          <div className="preloader-badge">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>Fast Delivery</span>
          </div>
          <div className="preloader-badge">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Original</span>
          </div>
          <div className="preloader-badge">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <span>COD Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
