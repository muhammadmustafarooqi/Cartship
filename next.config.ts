import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/pages/privacy-policy",
        permanent: true,
      },
      {
        source: "/terms-of-service",
        destination: "/pages/terms-of-service",
        permanent: true,
      },
      {
        source: "/return-refund-policy",
        destination: "/pages/return-refund-policy",
        permanent: true,
      },
      {
        source: "/shipping-policy",
        destination: "/pages/shipping-policy",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/pages/about-us",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/pages/contact-us",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/pages/faq",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
