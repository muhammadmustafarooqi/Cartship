"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  /** The data-ad-slot identifier from your Google AdSense account */
  adSlot?: string;
  /** Format of the ad: auto, horizontal, rectangle, or fluid */
  adFormat?: "auto" | "horizontal" | "rectangle" | "fluid";
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Whether to show a small subtle "Sponsored / Advertisement" label */
  showLabel?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdSlot({
  adSlot = "1234567890",
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  style = {},
  showLabel = true,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    // Only attempt to load if client id exists and slot is not already populated
    if (!clientId) return;

    try {
      if (typeof window !== "undefined" && adRef.current) {
        // Prevent duplicate push if already executed
        if (adRef.current.innerHTML.trim() === "") {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      }
    } catch (err) {
      console.warn("AdSense push error:", err);
    }
  }, [clientId]);

  // If no AdSense client ID configured, render clean placeholder in development or render nothing in production
  if (!clientId) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div
          className={`ad-container-placeholder ${className}`}
          style={{
            margin: "24px auto",
            maxWidth: "100%",
            width: adFormat === "rectangle" ? "300px" : "100%",
            minHeight: adFormat === "rectangle" ? "250px" : "90px",
            background: "#f8fafc",
            border: "1.5px dashed #cbd5e1",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            color: "#64748b",
            fontSize: "12px",
            textAlign: "center",
            ...style,
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: "0.05em", color: "#475569", marginBottom: "4px" }}>
            ADVERTISEMENT SLOT ({adFormat.toUpperCase()})
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Set <code>NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> in <code>.env.local</code> to activate live AdSense ads.
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={`ad-container ${className}`}
      style={{
        margin: "20px auto",
        textAlign: "center",
        overflow: "hidden",
        width: "100%",
        ...style,
      }}
    >
      {showLabel && (
        <div
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94a3b8",
            marginBottom: "6px",
            fontWeight: 600,
          }}
        >
          Advertisement
        </div>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          textAlign: "center",
          ...(adFormat === "rectangle"
            ? { width: "300px", height: "250px", margin: "0 auto" }
            : {}),
        }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === "rectangle" ? undefined : adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}

