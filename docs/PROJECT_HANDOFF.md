# FoodBridge Project Handoff & Architecture Blueprint

This document is the working brief and architectural source of truth for any collaborator (Raofun, Sahmina) or AI assistant (such as Antigravity) continuing work in the shared FoodBridge repository. Read this together with the root `AGENTS.md` and `.agents/skills/foodbridge-development/SKILL.md`.

---

## 1. Goal & Product Vision

FoodBridge is an accessible, community-driven web application for rescuing surplus food and coordinating safe, dignified pickups between local donors (restaurants, caterers, households) and receivers/volunteers (shelters, community members).

* **Hosting Target**: Designed for 100% free-tier deployment (Frontend on Vercel; Backend on free-tier cloud platforms like Render/Railway/Fly.io; Database on MongoDB Atlas free M0 cluster).
* **Guiding Constraints**: Zero deployment costs, no secrets committed to Git, zero direct DB access from the client, lean queries, and high-performance UX.

---

## 2. Feature Ownership & Module 1 Map

| Feature | Requirement | Owner | Primary Page / Component | Route |
| :--- | :--- | :--- | :--- | :--- |
| **Registration + Google Sign-In** | FR01 | **Raofun** | `client/src/pages/RegisterPage.jsx` | `/register` |
| **Login + Google Sign-In** | FR02 | **Sahmina** | `client/src/pages/LoginPage.jsx` | `/login` |
| **Food Listing (Creation)** | FR03 | **Raofun** | `client/src/pages/FoodListingPage.jsx` | `/listings/new` (or `/create-listing`) |
| **Food Information (Details)** | FR04 | **Raofun** | `client/src/pages/FoodInformationPage.jsx` | `/listings/:listingId/information` |
| **Pickup Scheduling** | FR05 | **Sahmina** | `client/src/pages/PickupSchedulePage.jsx` | `/listings/:listingId/pickup` |

> [!IMPORTANT]
> **Branching & Collaboration Rules**:
> * Raofun works on `dev/raofun`; Sahmina works on her feature branch.
> * Never commit or push without explicit approval from the developer.
> * Before altering shared API contracts, Mongoose models, or cross-cutting middleware, coordinate with Raofun.

---

## 3. Current Working State (as of October 2026)

### A. Authentication & Onboarding (FR01 / FR02)
* **Registration UI (`client/src/pages/RegisterPage.jsx`)**:
  * Role selection cards: Donor, Receiver, Volunteer.
  * Form fields: Full name, email, password with toggleable show/hide and visual length meter.
  * Dual signup path: Standard email registration (`POST /api/auth/register`) and Google OAuth popup (`POST /api/auth/google`).
  * Reusable auth frame, dividers, and branded "Share → Connect → Nourish" community visual.
* **Navigation Gating & Destination Memory**:
  * Protected routes wrap `/listings/new` and `/create-listing`.
  * If a guest attempts to create a listing or claim an item, they are redirected to login with `state: { from: location, listing }`, preserving their flow seamlessly after authentication.

### B. Layout & Shell Architecture (`client/src/components/HomeLayout.jsx`)
* **Single Source of Truth for Feed Data**:
  * `HomeLayout` executes the `GET /api/listings/feed` request centrally with `AbortController` cancellation to eliminate memory leaks and race conditions.
  * Provides `{ feedListings, feedLoading, feedError, reloadFeed }` to nested views via React Router's `<Outlet context={...} />`. This eliminates duplicate network calls between parent layout and child views.
* **Contextual Navigation & Mobile Drawer**:
  * Topbar displays section indicators ("Community Feed", "Create Listing", etc.).
  * Desktop sidebar features "Create Listing" **only for signed-in users**; guests see a "Get Started Free" conversion card.
  * Fully responsive mobile navigation drawer with backdrop blur and background scroll-lock.
  * "Community Pulse" counter dynamically displays real-time active meal counts.

### C. Public Community Feed (`client/src/pages/HomePage.jsx`)
* **Zero Friction for Public Browsers**:
  * Anyone can browse surplus food without logging in.
* **Comprehensive Pickup Window Engine (`formatPickupWindow`)**:
  * Supports all real-world scheduling patterns:
    1. *Flexible windows* (e.g., "Flexible pickup window" or "Flexible · Until 9:00 PM").
    2. *Same-day ranges* (e.g., "Today · 2:00 PM – 6:00 PM").
    3. *Upcoming / Multi-day windows* (e.g., "Tomorrow · 10:00 AM – 2:00 PM").
    4. *Open-ended slots* (e.g., "Today · from 5:00 PM").
    5. *Expired items* (e.g., "Expired · Closed at 4:00 PM").
* **Expired Listing Management**:
  * Expired or closed listings (`status === 'closed'` or `pickupClosesAt < Date.now()`) automatically sink to the bottom of the feed.
  * Cards render an inactive state with a disabled "Pickup Expired" button, preventing invalid interactions.
* **Auth-Gate Modal**:
  * Unauthenticated users clicking active food cards see an intuitive modal preview prompting them to join or sign in, with their selection preserved.

### D. Backend REST API & Database
* **Controller (`server/src/controllers/foodListingController.js`)**:
  * `getPublicFeed`: Queries `{ status: { $in: ['available', 'closed'] } }` using Mongoose `.lean()` and `.populate('donor', 'name role')`. Sanitizes output to expose only safe public fields.
  * Authenticated endpoints: `createListing`, `myListings`, `getListing` scoped strictly to `req.user.id`.
* **Database & Seed Data (`server/src/config/seedBangladeshiData.js` & `server/src/seed.js`)**:
  * Realistic Bangladeshi demo dataset (Biryani, Khichuri, Paratha, Roshogolla, Lentil Curry) representing diverse conditions (fresh, refrigerated, shelf-stable) across Dhaka neighborhoods (Dhanmondi, Gulshan, Mirpur, Uttara, Mohakhali, Banani).
  * Includes 6 active listings with diverse timestamp profiles and 2 expired listings for testing.
  * Standalone runner executable via `npm run seed`.

---

## 4. Design Principles & Thinking Procedure

When building or styling any feature in FoodBridge, adhere to these established standards:

### 1. Visual Language & Aesthetics
* **Theme & Atmosphere**: Modern, clean, warm, and inviting. The app must feel like a premier civic-tech platform, not a generic bootstrap template.
* **Color Palette**:
  * *Primary Green / Emerald*: `#10b981` / `#059669` (evokes freshness, nourishment, sustainability).
  * *Warm Amber / Orange*: `#f59e0b` / `#ea580c` (evokes warmth, hospitality, urgency for quick pickups).
  * *Surfaces & Backgrounds*: Deep dark slate/charcoal tones (`#090d16`, `#0f172a`, `#1e293b`) for headers/sidebar accents contrasted with clean, crisp cards.
  * *Pills & Badges*: Tinted translucent backgrounds with matching borders (e.g., emerald for active, red/slate for expired, amber for flexible).
* **Typography & Hierarchy**:
  * Clear visual hierarchy: Crisp section badges, bold card headings (1.05rem–1.25rem), subtle metadata captions (0.8rem), and high-contrast text for accessibility.
* **Micro-interactions & Motion**:
  * Subtle hover elevations (`transform: translateY(-2px)`), smooth glassmorphic blur (`backdrop-filter: blur(12px)`), and gentle transitions (150ms–250ms).
  * **Always respect `@media (prefers-reduced-motion: reduce)`**.
  * Use regular CSS transitions; do not add heavy external JS animation packages.

### 2. Engineering & Code Principles
* **Performance & Efficiency First**:
  * Always use `.lean()` on MongoDB read queries that do not require Mongoose document save methods.
  * Use `React.useMemo` for derived client-side sorting and filtering.
  * Prevent duplicate API calls: lift feed requests to parent layout and distribute via `useOutletContext()`.
  * Always attach an `AbortController` signal to asynchronous `useEffect` fetch calls.
* **Resilient Data & Time Handling**:
  * Store all dates/timestamps in UTC in MongoDB (`Date` type).
  * Format dates and times on the client using the user's local timezone via native `Intl` or `toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })`.
  * Never assume a pickup window always has both open and close timestamps; provide robust fallbacks for flexible or open-ended schedules.
* **Zero Trust Security Boundary**:
  * Never trust a client-supplied `donorId` or `userId`. The backend extracts identity exclusively from verified JWT tokens (`req.user.id`).
  * Keep `.env` files out of Git. Never log secrets or tokens.

---

## 5. Development & Verification Guide

### Prerequisites & Environment Setup
1. **Client (`client/.env`)**:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
2. **Server (`server/.env`)**:
   ```env
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/foodbridge
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

### Running Locally
* **Start Backend**: `npm run server` (runs Express with `node --watch src/app.js` on port 4000).
* **Start Frontend**: `npm run client` (runs Vite dev server on `http://localhost:5173`).
* **Seed Database**: `npm run seed` in root or `node src/seed.js` inside `server/`.

---

## 6. Next Steps for Feature Implementation

1. **FR03: Food Listing Creation (`client/src/pages/FoodListingPage.jsx`)**:
   * Build the donor flow to submit surplus food details (dish name, quantity, category, condition, pickup window, address).
   * Submit to `POST /api/listings`.
2. **FR04: Food Information Detail View (`client/src/pages/FoodInformationPage.jsx`)**:
   * Present allergen details, storage advice, donor notes, and location map/pin.
3. **FR05: Pickup Scheduling (Sahmina - `client/src/pages/PickupSchedulePage.jsx`)**:
   * Allow receivers to book a pickup slot against active listings.

