"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSettings } from "@/lib/useSettings";
import { LOGO_URL } from "@/lib/site";

export default function StarterLoader() {
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const { settings } = useSettings();
  const logoSrc = settings?.logoUrl || LOGO_URL;
  const storeName = settings?.storeName || "CartShip";

  useEffect(() => {
    try {
      const hasSeen = sessionStorage.getItem("hasSeenStarterLoader");
      if (hasSeen === "true") {
        setShouldShow(false);
        return;
      }
      sessionStorage.setItem("hasSeenStarterLoader", "true");
    } catch {
      // Ignore if sessionStorage is not accessible
    }

    setShouldShow(true);
    document.body.style.overflow = "hidden";

    // Counter animation over 1100ms
    const duration = 1100;
    const stepTime = 16;
    const increment = 100 / (duration / stepTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment + Math.random() * 1.5;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, stepTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const openTimer = setTimeout(() => {
        setIsOpening(true);
      }, 150);

      const hideTimer = setTimeout(() => {
        setIsFinished(true);
        document.body.style.overflow = "";
      }, 850);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [progress]);

  // Don't render if already shown in this session or if loading state hasn't resolved
  if (shouldShow === false || shouldShow === null || isFinished) return null;

  return (
    <>
      {/* ── LEFT BOUTIQUE DOOR ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "50vw",
          height: "100vh",
          zIndex: 999998,
          backgroundColor: "#0B1C3D",
          backgroundImage:
            "linear-gradient(135deg, #071530 0%, #0B1C3D 60%, #102857 100%)",
          transform: isOpening ? "translateX(-100%)" : "translateX(0%)",
          transition: "transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)",
          boxShadow: "12px 0 30px rgba(0, 0, 0, 0.4)",
          willChange: "transform",
        }}
      >
        {/* Decorative Grid Lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── RIGHT BOUTIQUE DOOR ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "50vw",
          height: "100vh",
          zIndex: 999998,
          backgroundColor: "#0B1C3D",
          backgroundImage:
            "linear-gradient(-135deg, #071530 0%, #0B1C3D 60%, #102857 100%)",
          transform: isOpening ? "translateX(100%)" : "translateX(0%)",
          transition: "transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── CENTER STAGE FLOATING BRAND EMBLEM CARD ── */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: isOpening
            ? "translate(-50%, -50%) scale(1.15)"
            : "translate(-50%, -50%) scale(1)",
          opacity: isOpening ? 0 : 1,
          transition:
            "opacity 0.45s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          pointerEvents: "none",
          backgroundColor: "rgba(11, 28, 61, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "32px 40px",
          borderRadius: "28px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 60px -10px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Glowing Emblem Circle */}
        <div
          style={{
            position: "relative",
            width: "96px",
            height: "96px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Pulsing Outer Glow */}
          <div
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              border: "2px solid rgba(255, 97, 2, 0.5)",
              boxShadow: "0 0 25px rgba(255, 97, 2, 0.5)",
              animation: "doorPulse 1.8s ease-in-out infinite alternate",
            }}
          />

          {/* White Circular Logo Holder */}
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              position: "relative",
              zIndex: 2,
            }}
          >
            <Image
              src={logoSrc}
              alt={storeName}
              width={64}
              height={64}
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
              priority
            />
          </div>
        </div>

        {/* Brand Name */}
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "3px",
            margin: "0 0 4px 0",
            color: "#ffffff",
          }}
        >
          {storeName.toUpperCase()}
        </h2>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.65)",
            margin: "0 0 20px 0",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Premium Store Experience
        </p>

        {/* Sleek Progress Pill Counter */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 20px",
            borderRadius: "999px",
            background: "rgba(255, 97, 2, 0.15)",
            border: "1px solid rgba(255, 97, 2, 0.4)",
            boxShadow: "0 4px 15px rgba(255, 97, 2, 0.2)",
          }}
        >
          {/* Progress bar inside pill */}
          <div
            style={{
              width: "48px",
              height: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, progress)}%`,
                backgroundColor: "#FF6102",
                transition: "width 0.05s linear",
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "1px",
            }}
          >
            {Math.min(100, Math.floor(progress))}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes doorPulse {
          0% { transform: scale(0.96); opacity: 0.5; }
          100% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
    </>
  );
}
