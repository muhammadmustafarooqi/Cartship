# CartShip Project Overview

This document serves as the single source of truth for the **CartShip** (CartShipstore) Next.js e-commerce project.

---

## 1. PROJECT SUMMARY

- **Purpose & Target Users**: CartShip is an ultra-premium, full-featured e-commerce web application targeted primarily at Pakistani consumers. It heavily features "Cash on Delivery" (COD) and utilizes a "Spin-to-Win" discount mechanic.
- **Tech Stack**:
  - **Framework**: Next.js 16.2.4 (App Router)
  - **UI Library**: React 19.2.4
  - **Styling**: Tailwind CSS v4, Lucide React (for icons)
  - **Database**: MongoDB (via Mongoose 9.6)
  - **Language**: TypeScript
  - **Authentication**: NextAuth.js (v5 Beta)
  - **Media Management**: ImageKit

---

## 2. ARCHITECTURE

- **Router**: Next.js App Router (`/app` directory).
- **Directory Structure**:
  - `app/`: Contains all route definitions (`page.tsx`, `layout.tsx`), API endpoints (`api/`), and core SEO files (`sitemap.ts`, `robots.ts`).
  - `components/`: Contains UI components (e.g., `MetaPixel`, `Navbar`, `ProductCard`) and state providers (`CartProvider`, `WishlistProvider`).
  - `models/`: Mongoose schemas defining the MongoDB database entities.
  - `lib/`: Utility functions, database connection logic (`mongodb.ts`), NextAuth configuration (`auth.ts`), and checkout validation (`orderValidation.ts`).
  - `scripts/`: Development scripts (e.g., database seeding with `seed.ts`).
- **Rendering Strategy**: The application uses a hybrid approach. 
  - **Server-Side Rendering (SSR) & Static Generation**: Core layouts and pages are Server Components for maximum SEO (Metadata API usage). 
  - **Client-Side Rendering**: Interactivity (Cart, Wishlist, Product viewing) uses Client Components (e.g., `ProductClient.tsx`, `SpinnerBanner.tsx`).

---

## 3. DATABASE

CartShip uses **MongoDB** with **Mongoose** as the ODM.

### Models & Schemas

| Model | Description & Key Fields | Indexes |
|---|---|---|
| **Product** | Core product catalog. Fields: `name`, `slug` (unique), `price`, `comparePrice`, `stock`, `category`, `isFeatured`, `isActive`, `images`. | `slug` (unique), `category`, `isFeatured`, `isNewArrival`, `isActive` |
| **Order** | Handles customer orders. Fields: `orderId` (unique), `customerName`, `phone`, `city`, `address`, `items[]` (nested schema), `subtotal`, `shippingFee`, `total`, `paymentMethod` (default COD), `status`, `couponCode`, `discount`. | `status`, `createdAt` |
| **User** | Admin and Spin-to-Win users. Fields: `name`, `email` (unique), `password`, `phone`, `spinResult`, `couponCode`, `couponStatus`. | `email` (unique) |
| **Category** | Product categorization. Fields: `name`, `slug` (unique), `icon`, `image`, `isActive`, `isFeatured`. | `slug` (unique) |
| **Bundle** | Pack-based pricing for products. Fields: `product` (ObjectId), `packs[]` (quantity, price), `isActive`. | `product` (unique), `isActive` |
| **Coupon** | Admin-generated discount codes. Fields: `code` (unique), `discountType` (percentage/fixed/free_shipping), `discountValue`, `minPurchase`, `timesUsed`. | `code`, `isActive` |
| **Settings** | Global store configurations (Singleton). Fields: `storeName`, `whatsappNumber`, `deliveryFee`, `freeDeliveryAbove`, `offerBanner`, `navbar`, `footer`. | N/A |
| **Banner** | Homepage promotional banners. Fields: `title`, `image`, `link`, `isActive`. | N/A |
| **Other Models** | `FAQ`, `Testimonial`, `Stat`, `VisitorSession`, `AnalyticsEvent`, `ProductReview`. | N/A |

---

## 4. AUTHENTICATION & AUTHORIZATION

- **Library Used**: NextAuth.js (v5 Beta)
- **Providers Configured**: Google OAuth (`GoogleProvider`) and presumably a Credentials provider for internal admin auth.
- **Authorization / Roles**:
  - **Admin Access**: Protected via Next.js Middleware (`middleware.ts`). Any route matching `/admin/:path*` requires a valid session. Unauthenticated users are redirected to `/auth/admin-login`.
  - **Customers**: Standard users do not need an account to checkout (Guest Checkout model), but can sign in via Google to save Spin-to-Win coupons.

---

## 5. API ROUTES

All API routes live under `/app/api/`.

| Route | Methods | Access | Purpose |
|---|---|---|---|
| `/api/auth/signup` & `login` | POST | Public | Credentials registration and authentication. |
| `/api/banners` & `[id]` | GET, POST, PUT, DELETE | Mixed | Manage homepage banners. |
| `/api/bundles/[slug]` | GET | Public | Fetch pack-pricing for a specific product. |
| `/api/capi` | POST | Public | Endpoint to handle Meta CAPI proxy requests. |
| `/api/categories` & `[id]` | GET, POST, PUT, DELETE | Mixed | CRUD for Categories. |
| `/api/coupons/validate` | POST | Public | Validates a coupon code during checkout. |
| `/api/faqs` & `[id]` | GET, POST, PUT, DELETE | Mixed | CRUD for FAQs. |
| `/api/orders` | GET, POST | Mixed | `POST` creates a new order (Public). `GET` lists orders (Admin). |
| `/api/orders/[id]` | GET, PATCH, DELETE | Admin | Manage specific orders (e.g., change status to "Shipped"). |
| `/api/phone-otp/send` & `/verify` | POST | Public | Verifies customer phone numbers (often for COD validation). |
| `/api/products` & `[id]` | GET, POST, PUT, DELETE | Mixed | CRUD for Products. |
| `/api/products/[id]/reviews` | GET, POST | Public | Handle product reviews. |
| `/api/seed` | GET | Admin | Triggers database seeding script. |
| `/api/settings` | GET, POST, PATCH | Mixed | Fetch (Public) or Update (Admin) global store settings. |
| `/api/stats` & `[id]` | GET, POST, PUT, DELETE | Mixed | CRUD for store statistics. |
| `/api/testimonials` & `[id]` | GET, POST, PUT, DELETE | Mixed | CRUD for customer testimonials. |
| `/api/upload` | POST | Admin | General file upload handler. |
| `/api/upload/signature` | GET | Admin | Generates ImageKit authentication parameters for secure uploads. |
| `/api/user/profile` | GET | Private | Fetch logged-in user profile. |
| `/api/user/spin` & `spin-status` | POST, GET | Public | Handles Spin-to-Win discount logic. |

---

## 6. CORE FEATURES

- **Product Catalog**: Supports standard products, categorical filtering, and active/featured toggles.
- **Cart & Bundle Logic**:
  - Items are added to the cart normally, but can also be added as **"Packs"**.
  - `pack-` prefixed IDs in the cart trigger bundle pricing lookups (e.g., 3-pack discounts).
- **Checkout Flow**:
  - Payment method is strictly **Cash on Delivery (COD)**.
  - Server-side recalculation of subtotal and shipping (`freeDeliveryAbove` threshold) ensures data integrity.
  - Robust coupon evaluation prioritizing Global Admin Coupons, then falling back to User-specific Spin-to-Win coupons.
- **Inventory/Stock Handling**:
  - **Atomic Operations**: Stock is decremented explicitly during checkout inside a **Mongoose Transaction** (`session.startTransaction()`) in `lib/orderValidation.ts`. 
  - `product.stock -= totalRequiredQuantity; await product.save({ session })`.
  - *Note: Transactions require a MongoDB Replica Set environment to function correctly.*

---

## 7. STATE MANAGEMENT

- **Global State**: Purely utilizes **React Context API**.
  - `CartProvider.tsx` manages shopping cart state.
  - `WishlistProvider.tsx` manages user favorite items.
- **Strategy**: State lives primarily on the **Client-side** inside `localStorage` to persist across page reloads, hydrating on initial load. No complex libraries like Redux or Zustand are utilized.

---

## 8. THIRD-PARTY INTEGRATIONS

- **Meta (Facebook) Pixel**: Custom `MetaPixel.tsx` component tracking `PageView`, `ViewContent`, `AddToCart`, `AddToWishlist`, `Purchase`, `Search`, and `Contact`.
- **Meta Conversions API (CAPI)**: Integrated directly into the `POST /api/orders` route to dispatch server-side `Purchase` events securely.
- **ImageKit**: Used for robust image & video storage, optimization, and delivery.
- **Google OAuth**: For easy user sign-ins via NextAuth.
- **WhatsApp**: Floating action button natively tracking click intent via FB Pixel before redirecting to WhatsApp.

---

## 9. SEO SETUP

- **Metadata API**: Utilized across all route layouts (`export const metadata: Metadata`) to handle Open Graph, Titles, and Descriptions.
- **Robots & Sitemap**: `app/robots.ts` and `app/sitemap.ts` are dynamically generated to serve web crawlers.
- **Dynamic Routing SEO**: Dynamic pages (like `app/products/[slug]/layout.tsx`) are structured to inject dynamic metadata appropriately.

---

## 10. ENVIRONMENT VARIABLES

*Values are omitted for security. Below is the mapping of required `.env.local` keys.*

| Variable Name | Description |
|---|---|
| `MONGODB_URI` | Connection string for the MongoDB cluster (Replica Set recommended). |
| `NEXTAUTH_SECRET` | Secret key used to encrypt NextAuth session tokens. |
| `NEXTAUTH_URL` | Base URL of the application for NextAuth redirects. |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key for client/server uploads. |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key for authenticating server uploads. |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint for delivering optimized media. |
| `WHATSAPP_NUMBER` | Contact number used in the floating WhatsApp widget. |
| `ADMIN_EMAIL` | Default admin email for the dashboard. |
| `ADMIN_PASSWORD` | Default admin password for the dashboard. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID for client-side and CAPI tracking. |
| `META_CAPI_TOKEN` | Access token for server-side Meta Conversions API events. |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for User sign-in. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret for User sign-in. |

---

## 11. KNOWN ISSUES / TECH DEBT

- **Mongoose Transactions Constraint**: The atomic stock decrement relies on `session.startTransaction()`. If the deployment MongoDB is a standalone server (not a Replica Set), checkout will crash. 
- **Legacy Admin Login Route**: `middleware.ts` intercepts `/admin/login` and redirects to `/auth/admin-login`. Refactoring old links to the new path would remove this middleware overhead.
- **Phone Number Parsing for CAPI**: Phone hashing in the CAPI request assumes all non-zero starting numbers are correctly formatted without leading zeros; edge cases in local formats could result in mismatched CAPI profiles.
- **Node.js Runtime Dependency**: `export const runtime = "nodejs";` in `app/api/orders/route.ts` limits the ability to deploy these specific Next.js routes to the Edge network.

---

## 12. DEPLOYMENT

- **Hosting Platform**: Built for Vercel or any Node.js compatible environment supporting Next.js Server Components. 
- **Build Command**: Standard `npm run build` triggering `next build`.
- **Database Dependency**: MongoDB Atlas or a self-hosted Replica Set is required for the transactional safety mechanisms built into the checkout pipeline.
