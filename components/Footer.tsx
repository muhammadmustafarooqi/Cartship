"use client";

import Link from "next/link";
import { MapPin, Mail, Phone, MessageCircle, Globe } from "lucide-react";
import { useState, useEffect } from "react";

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("facebook")) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
  );
  if (p.includes("instagram")) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
  );
  if (p.includes("twitter") || p.includes("x")) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
  );
  if (p.includes("youtube")) return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
  );
  if (p.includes("whatsapp")) return <MessageCircle size={18} />;
  return <Globe size={18} />;
};

export default function Footer() {
  const [pages, setPages] = useState<{title: string, slug: string}[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/pages?activeOnly=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPages(data.data);
      })
      .catch(console.error);

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.footer) {
          setSettings(data.footer);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-top">
          
          <div className="footer-col brand-col">
            <Link href="/" className="footer-logo">
              <span>Cart</span>Ship.
            </Link>
            <p className="footer-desc">
              {settings?.description || "Your premium destination for modern lifestyle essentials, electronics, and smart home gadgets across Pakistan."}
            </p>
            {settings?.socialLinks && settings.socialLinks.length > 0 && (
              <div className="footer-socials">
                {settings.socialLinks.map((social: any, idx: number) => (
                  <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" title={social.platform}>
                    {getSocialIcon(social.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {settings?.footerLinks && settings.footerLinks.length > 0 ? (
            settings.footerLinks.map((section: any, idx: number) => (
              <div key={idx} className="footer-col">
                <h3 className="footer-title">{section.title}</h3>
                <ul className="footer-links">
                  {section.links.map((link: any, lidx: number) => (
                    <li key={lidx}><Link href={link.href}>{link.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              <div className="footer-col">
                <h3 className="footer-title">Quick Links</h3>
                <ul className="footer-links">
                  <li><Link href="/products">Shop All</Link></li>
                  <li><Link href="/products?category=electronics">Electronics</Link></li>
                  <li><Link href="/products?category=kitchen">Kitchen</Link></li>
                  <li><Link href="/track-order">Track Order</Link></li>
                  <li><Link href="/about">About Us</Link></li>
                </ul>
              </div>

              <div className="footer-col">
                <h3 className="footer-title">Customer Care</h3>
                <ul className="footer-links">
                  <li><Link href="/contact">Contact Us</Link></li>
                  <li><Link href="/faq">FAQs</Link></li>
                  {pages.length > 0 ? (
                    pages.map(page => (
                      <li key={page.slug}>
                        <Link href={`/pages/${page.slug}`}>{page.title}</Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="/pages/returns">Returns & Exchanges</Link></li>
                      <li><Link href="/pages/shipping-policy">Shipping Policy</Link></li>
                      <li><Link href="/pages/privacy-policy">Privacy Policy</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}

          <div className="footer-col">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="contact-icon" />
                <span>{settings?.contactAddress || "123 Commerce Street, Lahore, Pakistan"}</span>
              </li>
              <li>
                <Phone size={18} className="contact-icon" />
                <span>{settings?.contactPhone || "+92 300 1234567"}</span>
              </li>
              <li>
                <Mail size={18} className="contact-icon" />
                <span>{settings?.contactEmail || "support@cartship.pk"}</span>
              </li>
            </ul>
          </div>

        </div>

        {settings?.codMessage && (
          <div style={{ textAlign: "center", marginBottom: "20px", color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
            {settings.codMessage}
          </div>
        )}

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} CartShip. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            {[
              { label: "Privacy Policy", href: "/pages/privacy-policy" },
              { label: "Terms of Service", href: "/pages/terms-of-service" },
              { label: "Return & Refund Policy", href: "/pages/return-refund-policy" },
              { label: "Contact Us", href: "/pages/contact-us" },
              { label: "Shipping Policy", href: "/pages/shipping-policy" },
              { label: "FAQ", href: "/faq" },
              { label: "About Us", href: "/pages/about-us" },
            ].map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href} 
                style={{ 
                  color: "rgba(255, 255, 255, 0.6)", 
                  fontSize: "0.85rem", 
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "var(--orange)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .site-footer {
          background: var(--navy);
          color: var(--white);
          padding: 80px 0 0 0;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 60px;
          margin-bottom: 60px;
        }

        .footer-logo {
          font-family: var(--font-outfit), sans-serif;
          font-size: 2rem;
          font-weight: 900;
          color: var(--white);
          text-decoration: none;
          letter-spacing: -0.05em;
          display: inline-block;
          margin-bottom: 20px;
        }

        .footer-logo span {
          color: var(--orange);
        }

        .footer-desc {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin: 0 0 24px;
          max-width: 320px;
        }

        .footer-socials {
          display: flex;
          gap: 16px;
        }

        .footer-socials a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          color: var(--white);
          transition: all 0.3s ease;
        }

        .footer-socials a:hover {
          background: var(--orange);
          color: var(--white);
          transform: translateY(-2px);
        }

        .footer-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--white);
          margin: 0 0 24px;
          letter-spacing: 0.02em;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links a {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--orange);
        }

        .footer-contact-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-contact-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .contact-icon {
          color: var(--orange);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .copyright {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .footer-bottom-links {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .payment-methods {
          display: flex;
          gap: 8px;
        }

        .payment-pill {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 1024px) {
          .footer-top {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
          }
        }

        @media (max-width: 640px) {
          .footer-top {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
