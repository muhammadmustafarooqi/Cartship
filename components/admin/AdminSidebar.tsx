"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Store,
  Users,
  X,
  ChevronDown,
  FolderTree,
  Image as ImageIcon,
  List,
  Sliders,
  Tag,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Sparkles,
  MessageSquareQuote,
  FileText,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/settings/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Spin Results", href: "/admin/spins", icon: Sparkles },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Bundles", href: "/admin/bundles", icon: Package },
  { label: "Pages", href: "/admin/pages", icon: FileText },
];

const settingsItems = [
  { label: "General Settings", href: "/admin/settings", icon: Sliders },
  { label: "Navigation Menu", href: "/admin/settings/navbar", icon: Package },
  { label: "Footer", href: "/admin/settings/footer", icon: Package },
  { label: "Categories", href: "/admin/settings/categories", icon: FolderTree },
  { label: "Banners", href: "/admin/settings/banners", icon: ImageIcon },
  { label: "Marquee Banner", href: "/admin/settings/marquee", icon: List },
  { label: "Offer Banner", href: "/admin/settings/offer-banner", icon: Tag },
  { label: "Testimonials", href: "/admin/settings/testimonials", icon: MessageSquareQuote },
  { label: "FAQs", href: "/admin/settings/faqs", icon: HelpCircle },
  { label: "Stats", href: "/admin/settings/stats", icon: TrendingUp },
];

export default function AdminSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/admin/settings"));

  return (
    <>
      {isOpen && <div className="admin-overlay" onClick={onClose} />}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
        <button
          onClick={onClose}
          className="mobile-close-btn"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}
        >
          <X size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <BrandLogoMark size={48} tone="elevated" decorative />
          <div>
            <div className="text-xl font-black tracking-tight leading-tight text-white flex flex-col">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">CartShip</span>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>
              ADMIN PANEL
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <Icon size={18} strokeWidth={2} style={{ color: isActive ? "#FF6102" : "rgba(255,255,255,0.7)" }} />
              <span>{item.label}</span>
              {isActive && (
                <div style={{
                  marginLeft: "auto",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#FF6102",
                }} />
              )}
            </Link>
          );
        })}

        {/* Settings Dropdown */}
        <div style={{ marginTop: "4px" }}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`nav-item ${pathname.startsWith("/admin/settings") ? "active" : ""}`}
            style={{
              width: "calc(100% - 24px)",
              cursor: "pointer",
              background: "none",
              border: "none",
              textAlign: "left",
            }}
          >
            <Settings size={18} strokeWidth={2} style={{ color: pathname.startsWith("/admin/settings") ? "#FF6102" : "rgba(255,255,255,0.7)" }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Settings</span>
            <ChevronDown 
              size={16} 
              style={{ 
                transition: "transform 0.2s ease",
                transform: settingsOpen ? "rotate(180deg)" : "rotate(0deg)"
              }} 
            />
          </button>

          {/* Settings Sub-items */}
          <div style={{
            maxHeight: settingsOpen ? "500px" : "0",
            overflow: "hidden",
            transition: "max-height 0.3s ease",
          }}>
            {settingsItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item nav-sub-item ${isActive ? "active" : ""}`}
                  onClick={onClose}
                  style={{
                    paddingLeft: "48px",
                    fontSize: "13px",
                  }}
                >
                  <Icon size={16} strokeWidth={2} style={{ color: isActive ? "#FF6102" : "rgba(255,255,255,0.6)" }} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#FF6102",
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Link
          href="/"
          className="nav-item"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
        >
          <Store size={18} strokeWidth={2} style={{ color: "rgba(255,255,255,0.7)" }} />
          <span>View Store</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="nav-item"
          style={{
            width: "calc(100% - 24px)",
            cursor: "pointer",
            background: "none",
            border: "none",
            textAlign: "left",
          }}
        >
          <LogOut size={18} strokeWidth={2} style={{ color: "rgba(255,255,255,0.7)" }} />
          <span>Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
}
