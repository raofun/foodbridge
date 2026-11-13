# 🌿 FoodBridge — Surplus Food Rescue & Redistribution Platform

> A community-driven web application connecting food donors (restaurants, bakeries, caterers, and households) with receivers and charitable organizations to eliminate food waste and coordinate safe, scheduled pickups.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of Contents

- [Project Overview](#project-overview)
  - [Meaningful Role Separation (Donors vs. Receivers vs. Volunteers)](#meaningful-role-separation-donors-vs-receivers-vs-volunteers)
- [Functional Requirements Matrix (FR01 – FR10)](#functional-requirements-matrix-fr01--fr10)
- [Technology Stack](#technology-stack)
- [Application Architecture & Folder Layout](#application-architecture--folder-layout)
- [Frontend Pages & Routes](#frontend-pages--routes)
- [Complete API Reference by Functional Requirement](#complete-api-reference-by-functional-requirement)
  - [Global Auth Session (`AuthContext.jsx`)](#global-auth-session-authcontextjsx)
  - [FR01: User Registration (`RegisterPage.jsx`)](#fr01-user-registration-registerpagejsx)
  - [FR02: User Login & Password Recovery (`LoginPage.jsx`)](#fr02-user-login--password-recovery-loginpagejsx)
  - [FR03: Community Feed (`HomePage.jsx`)](#fr03-community-feed-homepagejsx)
  - [FR04: Food Information & Safety Passport (`FoodInformationPage.jsx`)](#fr04-food-information--safety-passport-foodinformationpagejsx)
  - [FR05: Create Food Listing (`FoodListingPage.jsx`)](#fr05-create-food-listing-foodlistingpagejsx)
  - [FR06: Pickup Scheduling & Publishing (`PickupSchedulePage.jsx`)](#fr06-pickup-scheduling--publishing-pickupschedulepagejsx)
  - [FR07: Search & Filtering (`HomePage.jsx` & `HomeLayout.jsx`)](#fr07-search--filtering-homepagejsx--homelayoutjsx)
  - [FR08: My listings- Edit, Delete (`MyListingsPage.jsx`)](#fr08-my-listings--edit-delete-mylistingspagejsx)
  - [System Health Check (`server/src/app.js`)](#system-health-check-serversrcappjs)
- [Master API Endpoint Summary](#master-api-endpoint-summary)
- [Future Functional Requirements Roadmap (FR09 & FR10)](#future-functional-requirements-roadmap-fr09--fr10)
  - [FR09: Food claiming & Reservation](#fr09-food-claiming--reservation)
  - [FR10: Pickup Verification & Confirmation](#fr10-pickup-verification--confirmation)
- [Getting Started (Local Development Setup)](#getting-started-local-development-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Deployment & Free-Tier Optimization](#deployment--free-tier-optimization)

---

## Project Overview

FoodBridge bridges surplus food from donors to local communities before it goes to waste. The platform provides a secure, role-based workflow where donors can list food items with strict storage and safety guidelines, schedule pickup windows, and coordinate with verified community recipients.

The application is architected as an API-first single-page application (SPA) powered by React and Vite, supported by a modular Express/Node.js REST backend and MongoDB database.

### Meaningful Role Separation (Donors vs. Receivers vs. Volunteers)

To ensure the integrity of community surplus distribution, FoodBridge enforces strict, meaningful role boundaries:

* **Donors** (Restaurants, Bakeries, Caterers, Community Kitchens, Households):
  * **Can**: Create food listings, configure food safety passports, schedule pickup windows, manage and delete their listings, and observe the community feed.
  * **Cannot**: Request, reserve, or receive food donations. Their interface is tailored for surplus dispatching and observation.
* **Receivers** (Shelters, Community Charities, Low-Income Families, Students):
  * **Can**: Browse the real-time community feed, inspect verified food safety passports, search by area and pickup times, and claim/receive food portions.
  * **Cannot**: Create, edit, schedule, or delete food listings.
* **Volunteers** (Community Couriers, Dispatch Helpers):
  * **Can**: Assist in neighborhood delivery coordination and verify pickup handovers between donors and recipients.

---

## Functional Requirements Matrix (FR01 – FR10)

| Requirement ID | Module / Feature | Status | Description |
| :--- | :--- | :--- | :--- |
| **FR01** | **User Registration** | ✅ Implemented | Multi-role account onboarding (Donor, Receiver, Volunteer) with email/password and Google OAuth 2.0. |
| **FR02** | **User Login & Recovery** | ✅ Implemented | Secure email/password login, Google One Tap sign-in, JWT token generation, and password recovery. |
| **FR03** | **Community Feed** | ✅ Implemented | Real-time public discovery feed displaying published food listings with live availability indicators, portion counts, and donor profile badges. |
| **FR04** | **Food Information** | ✅ Implemented | Comprehensive Food Freshness & Quality Passport: preparation timestamps, storage environment, temperature verification, dietary tags, and allergen warnings. |
| **FR05** | **Create Food Listing** | ✅ Implemented | Guided surplus creation wizard: title, category, portion quantities, packaging description, and high-efficiency client-compressed photo upload (canvas JPEG 0.80) or image link. |
| **FR06** | **Pickup Scheduling** | ✅ Implemented | Single authoritative collection schedule: opening and closing time window, physical address, Dhaka neighborhood presets, and publishing listing to `available`. |
| **FR07** | **Search & Filtering** | ✅ Implemented | **Filter by area, food category, availability & pickup time.** Real-time multi-facet filtering across active community surplus donations. |
| **FR08** | **My listings- Edit, Delete** | ✅ Implemented | **Allows users to view, edit and delete their published food listings.** Dedicated donor dashboard to manage active listings, continue draft setups, or remove listings. |
| **FR09** | **Food claiming & Reservation** | ⏳ Planned Roadmap | **Allows users to claim available food donations and reserve them for pickup.** Dynamic portion reduction, fair-share caps, and real-time stock status transitions. |
| **FR10** | **Pickup Verification & Confirmation** | ⏳ Planned Roadmap | **Use a reservation specific code to confirm collection.** Secure alphanumeric token/QR verification exchange upon physical collection to finalize handover. |

---

## Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM (v7) with route guards (`ProtectedRoute`, `DonorRoute`, `AuthRoute`)
- **Styling**: Modern CSS3 (Glassmorphism design language, CSS Grid/Flexbox, custom CSS variables, native micro-animations, reduced-motion accessibility)
- **Icons**: Lucide React
- **Animation**: Native CSS transitions + lightweight Framer Motion

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Security**: JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), Google Auth Library (`google-auth-library`), CORS whitelist middleware
- **Seed Utilities**: Built-in on-demand CLI seed runner for test environments

---

## Application Architecture & Folder Layout

```
foodbridge-app/
├── client/                     # Frontend React + Vite application
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── components/         # Reusable UI & layout components
│   │   │   ├── AuthDivider.jsx
│   │   │   ├── AuthFrame.jsx
│   │   │   ├── DonorProfileSection.jsx
│   │   │   ├── GoogleSignInButton.jsx
│   │   │   ├── HomeLayout.jsx  # FR03 - Feed layout wrapper & search bar
│   │   │   └── ListingSteps.jsx
│   │   ├── context/            # React context providers
│   │   │   └── AuthContext.jsx # Global user session & auth state
│   │   ├── pages/              # Main view screens
│   │   │   ├── RegisterPage.jsx          # FR01 - Multi-role registration
│   │   │   ├── LoginPage.jsx             # FR02 - Email & Google sign-in
│   │   │   ├── HomePage.jsx              # FR03 - Community surplus food feed
│   │   │   ├── MyListingsPage.jsx        # FR03 - Donor listing dashboard
│   │   │   ├── FoodInformationPage.jsx   # FR04 - Food safety & storage details
│   │   │   ├── FoodListingPage.jsx       # FR05 - Create food listing
│   │   │   └── PickupSchedulePage.jsx    # FR06 - Pickup scheduling & publishing
│   │   ├── services/
│   │   │   └── api.js          # Centralized fetch wrapper & interceptor
│   │   ├── styles/             # Global CSS stylesheets
│   │   ├── App.jsx             # Route declarations & lazy-loading boundaries
│   │   └── main.jsx            # React root mounting
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # DB connection & seed datasets
│   │   │   ├── db.js
│   │   │   └── seedBangladeshiData.js
│   │   ├── controllers/        # Business logic & request handlers
│   │   │   ├── authController.js
│   │   │   ├── foodInformationController.js
│   │   │   ├── foodListingController.js
│   │   │   └── pickupScheduleController.js
│   │   ├── middleware/         # Auth verification & error handling
│   │   │   ├── errorHandler.js
│   │   │   └── requireAuth.js
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── Listing.js
│   │   │   └── User.js
│   │   ├── routes/             # Express API route endpoints
│   │   │   ├── auth.js
│   │   │   ├── foodInformation.js
│   │   │   ├── foodListings.js
│   │   │   ├── listings.js
│   │   │   └── pickupSchedules.js
│   │   ├── app.js              # Server entry point & CORS configuration
│   │   └── seed.js             # Standalone on-demand DB seeding runner
│   └── package.json
│
├── .gitignore                  # Comprehensive production gitignore
├── README.md                   # Project documentation
└── vercel.json                 # Frontend deployment configuration
```

---

## Frontend Pages & Routes

| FR ID | Route | Page Component | Access Level | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **FR01** | `/register` | `RegisterPage.jsx` | Guest only | New user registration with role selection (Donor, Receiver, Volunteer). |
| **FR02** | `/login` | `LoginPage.jsx` | Guest only | Sign in with email/password or Google OAuth; password reset modal. |
| **FR03** | `/` | `HomePage.jsx` | Public | Real-time community discovery feed displaying active food donations with portion counts and donor info. |
| **FR04** | `/listings/:id/information` | `FoodInformationPage.jsx` | Public / Donor | Comprehensive food safety passport, storage verification, dietary tags, and collection window details. |
| **FR05** | `/listings/new` | `FoodListingPage.jsx` | Donor only | Multi-mode surplus food creator with canvas-compressed device photo upload, presets, or image links. |
| **FR06** | `/listings/:id/pickup` | `PickupSchedulePage.jsx` | Donor only | Configure pickup address, quick Dhaka area presets, collection opening/closing times, and publish listing. |
| **FR07** | `/` (Search Toolbar) | `HomeLayout.jsx` & `HomePage.jsx` | Public | **Search & Filtering**: Filter by area, food category, availability & pickup time in real time. |
| **FR08** | `/listings/mine` | `MyListingsPage.jsx` | Donor only | **My listings- Edit, Delete**: Allows users to view, edit, and delete their published food listings. |
| **FR09** | `/listings/:id/claim` | Claim Modal (Planned) | Receiver only | **Food claiming & Reservation**: Allows users to claim available food donations and reserve them for pickup. |
| **FR10** | `/listings/:id/verify` | Verification Modal (Planned) | Donor / Receiver | **Pickup Verification & Confirmation**: Use a reservation specific code to confirm collection. |

---

## Complete API Reference by Functional Requirement

Every frontend screen connects to the REST API via the centralized `client/src/services/api.js` client. Below is the complete mapping of API endpoints organized by functional requirement:

---

### Global Auth Session (`AuthContext.jsx`)
Maintains active login state across browser reloads.

- **`GET /api/auth/me`**
  - **Invoked by**: `client/src/context/AuthContext.jsx` (on mount when a JWT token is found in `localStorage`)
  - **Auth Required**: `Bearer <token>`
  - **Request Body**: None
  - **Response Payload**:
    ```json
    {
      "user": {
        "id": "673...",
        "name": "Tanvir Rahman",
        "email": "tanvir@dhakabakery.com",
        "role": "donor",
        "organizationName": "Dhaka Bakery Co.",
        "phone": "+8801712345678",
        "city": "Dhaka",
        "avatarUrl": ""
      }
    }
    ```
  - **UI Action**: Populates global user context. If token is invalid or expired, session is cleared and user is redirected to `/login`.

---

### FR01: User Registration (`RegisterPage.jsx`)
Handles account creation with specific user roles and Google OAuth signup.

- **`POST /api/auth/register`**
  - **Invoked by**: `client/src/pages/RegisterPage.jsx` (form submission)
  - **Auth Required**: Public
  - **Request Body**:
    ```json
    {
      "name": "Nusrat Jahan",
      "email": "nusrat@example.com",
      "password": "SecurePassword123!",
      "role": "receiver",
      "organizationName": "Community Care Center",
      "phone": "+8801812345678",
      "city": "Chittagong"
    }
    ```
  - **Response Payload**: `{ "user": { ... }, "token": "jwt-token-string" }`
  - **UI Action**: Stores session, updates `AuthContext`, and navigates user to intended route or `/`.

- **`POST /api/auth/google`**
  - **Invoked by**: `client/src/pages/RegisterPage.jsx` (Google One Tap / button callback)
  - **Auth Required**: Public
  - **Request Body**:
    ```json
    {
      "credential": "google-id-token-credential-string",
      "role": "donor"
    }
    ```
  - **Response Payload**: `{ "user": { ... }, "token": "jwt-token-string" }`
  - **UI Action**: Automatically provisions account using Google profile information and signs the user in.

---

### FR02: User Login & Password Recovery (`LoginPage.jsx`)
Handles authentication and demo account password resetting.

- **`POST /api/auth/login`**
  - **Invoked by**: `client/src/pages/LoginPage.jsx`
  - **Auth Required**: Public
  - **Request Body**:
    ```json
    {
      "email": "tanvir@dhakabakery.com",
      "password": "Password123!"
    }
    ```
  - **Response Payload**: `{ "user": { ... }, "token": "jwt-token-string" }`
  - **UI Action**: Authenticates session and redirects to the previous page or home feed.

- **`POST /api/auth/google`**
  - **Invoked by**: `client/src/pages/LoginPage.jsx`
  - **Auth Required**: Public
  - **Request Body**: `{ "credential": "google-id-token-credential-string" }`
  - **Response Payload**: `{ "user": { ... }, "token": "jwt-token-string" }`
  - **UI Action**: Authenticates existing Google account and logs in.

- **`POST /api/auth/reset-password`**
  - **Invoked by**: `client/src/pages/LoginPage.jsx` (Password recovery modal)
  - **Auth Required**: Public
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "newPassword": "NewSecurePassword123!"
    }
    ```
  - **Response Payload**: `{ "message": "Password reset successfully. You can now log in." }`
  - **UI Action**: Displays confirmation message and returns user to the login form.

---

### FR03: Community Feed (`HomePage.jsx`)
Powers the central real-time discovery feed of all available surplus food donations for community members, receivers, and observing donors.

- **`GET /api/listings/feed`**
  - **Invoked by**: `client/src/components/HomeLayout.jsx` & `client/src/pages/HomePage.jsx` (on mount, interval, and route transitions)
  - **Auth Required**: Public (No auth required)
  - **Query Parameters**:
    - `category` *(optional)*: Filter by category (`meals`, `bakery`, `produce`, `fruits`, `dairy`, `packaged`, `beverages`, `other`, or `all`).
  - **Response Payload**:
    ```json
    {
      "listings": [
        {
          "_id": "67301...",
          "foodName": "Fresh Shingara & Vegetable Samosa Batch",
          "description": "Surplus freshly fried shingara and vegetable samosas.",
          "category": "bakery",
          "quantity": 35,
          "portionUnit": "pieces",
          "photoUrl": "https://images.unsplash.com/photo-...",
          "foodCondition": "fresh",
          "storageDetails": "Room temperature in covered bakery trays",
          "safetyNotes": "Contains gluten. Best consumed within 6 hours.",
          "preparedAt": "2026-11-08T16:00:00.000Z",
          "useByAt": "2026-11-08T23:00:00.000Z",
          "pickupLocation": "Dhanmondi 27, Dhaka",
          "pickupOpensAt": "2026-11-08T18:00:00.000Z",
          "pickupClosesAt": "2026-11-08T22:30:00.000Z",
          "pickupDeadline": "2026-11-08T22:30:00.000Z",
          "status": "available",
          "createdAt": "2026-11-08T16:30:00.000Z",
          "donor": {
            "name": "Bikrampur Mistanna Bhandar",
            "role": "donor"
          }
        }
      ]
    }
    ```
  - **UI Action**: Populates feed cards, active portion count badges, live countdown clocks, and donor attribution pills. Enforces role-specific actions: receivers see *"View details & receive"*, while donors see *"View food details"* with a clear banner stating donors cannot claim items.

---

### FR04: Food Information & Safety Passport (`FoodInformationPage.jsx`)
Comprehensive food freshness, handling conditions, safe storage temperatures, and preparation verification screen.

- **`GET /api/listings/:id/information`**
  - **Invoked by**: `client/src/pages/FoodInformationPage.jsx` (on mount)
  - **Auth Required**: Optional / Public for published (`available`/`closed`) listings; Donor-only for `draft` records.
  - **Request Body**: None
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67301...",
        "foodName": "Fresh Shingara & Vegetable Samosa Batch",
        "category": "bakery",
        "quantity": 35,
        "portionUnit": "pieces",
        "foodCondition": "fresh",
        "storageDetails": "Room temperature in covered bakery trays",
        "safetyNotes": "Contains gluten. Best consumed within 6 hours.",
        "preparedAt": "2026-11-08T16:00:00.000Z",
        "useByAt": "2026-11-08T23:00:00.000Z",
        "pickupLocation": "Dhanmondi 27, Dhaka",
        "pickupOpensAt": "2026-11-08T18:00:00.000Z",
        "pickupClosesAt": "2026-11-08T22:30:00.000Z",
        "status": "available",
        "donor": {
          "name": "Bikrampur Mistanna Bhandar",
          "role": "donor",
          "email": "contact@bikrampur.com"
        }
      },
      "isOwner": false,
      "isDraft": false
    }
    ```
  - **UI Action**: Renders the complete Food Safety & Freshness Passport. Allows receivers to inspect food hygiene, allergens, and preparation details before requesting pickup.

- **`PATCH /api/listings/:id/information`**
  - **Invoked by**: `client/src/pages/FoodInformationPage.jsx` (Save & Proceed button during wizard)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only; receivers receive 403 Forbidden)
  - **Request Body**:
    ```json
    {
      "preparedAt": "2026-11-08T16:00:00.000Z",
      "storageDetails": "Keep refrigerated below 4°C in covered aluminum containers",
      "foodCondition": "refrigerated",
      "useByAt": "2026-11-09T12:00:00.000Z",
      "safetyNotes": "Contains dairy. Reheat thoroughly before consumption."
    }
    ```
  - **Response Payload**: `{ "listing": { ... } }`
  - **UI Action**: Persists food safety parameters to MongoDB and advances the donor to Step 3: Pickup Scheduling (`/listings/:id/pickup`).

---

### FR05: Create Food Listing (`FoodListingPage.jsx`)
Initial step of the donor surplus food creation wizard, focused strictly on food identity, categorization, portion size, and visual documentation.

- **`POST /api/listings`**
  - **Invoked by**: `client/src/pages/FoodListingPage.jsx` (Save & Continue button)
  - **Auth Required**: `Bearer <token>` (Donor only; receivers receive 403 Forbidden)
  - **Request Body**:
    ```json
    {
      "foodName": "Chicken Biryani Catering Surplus",
      "category": "meals",
      "quantity": 25,
      "portionUnit": "servings",
      "description": "Hot catering surplus packed in clean thermal food warmers.",
      "photoUrl": "data:image/jpeg;base64,... (or https://images.unsplash.com/...)"
    }
    ```
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67302...",
        "foodName": "Chicken Biryani Catering Surplus",
        "category": "meals",
        "quantity": 25,
        "portionUnit": "servings",
        "status": "draft",
        "donor": {
          "_id": "673...",
          "name": "Dhaka Catering Co.",
          "role": "donor"
        }
      }
    }
    ```
  - **UI Action & Features**:
    - **Flexible Image Selection**: Donors can choose high-definition food presets, supply an external web image URL, or upload directly from their device.
    - **Client-Side Canvas Compression**: When a device photo is selected, it is automatically compressed client-side (JPEG quality 0.80, max 1200px width/height) to ensure rapid uploads, minimal bandwidth usage, and zero server storage bloat.
    - **Clean, Minimal Wizard**: Date and pickup schedule inputs are omitted from Step 1 to keep listing creation quick, distraction-free, and simple.
    - Saves initial listing in `draft` status and navigates donor to Step 2 (`/listings/:id/information`).

---

### FR06: Pickup Scheduling & Publishing (`PickupSchedulePage.jsx`)
Final stage of the donor listing creation pipeline to establish collection hours, designate pickup locations, and publish the listing.

- **`GET /api/listings/:id`** *(or `/api/listings/:id/pickup`)*
  - **Invoked by**: `client/src/pages/PickupSchedulePage.jsx` (on mount)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**: None
  - **Response Payload**: Listing details to verify ownership and pre-populate saved schedule and location data.
  - **UI Action**: Validates that Step 2 (Food Information) has been completed before allowing schedule configuration.

- **`PATCH /api/listings/:id/pickup`**
  - **Invoked by**: `client/src/pages/PickupSchedulePage.jsx` (Publish Listing button)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**:
    ```json
    {
      "pickupLocation": "House 14, Road 7, Sector 4, Uttara, Dhaka (Ring bell at reception)",
      "pickupOpensAt": "2026-11-08T18:30:00.000Z",
      "pickupClosesAt": "2026-11-08T22:00:00.000Z"
    }
    ```
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67302...",
        "status": "available",
        "pickupLocation": "House 14, Road 7, Sector 4, Uttara, Dhaka (Ring bell at reception)",
        "pickupOpensAt": "2026-11-08T18:30:00.000Z",
        "pickupClosesAt": "2026-11-08T22:00:00.000Z",
        "pickupDeadline": "2026-11-08T22:00:00.000Z"
      }
    }
    ```
  - **UI Action**: Switches listing status from `draft` to `available`. Synchronizes `pickupDeadline` with closing time, renders celebratory publishing confirmation, and redirects donor to `/listings/mine` or the community feed.

---

### FR07: Search & Filtering (`HomePage.jsx` & `HomeLayout.jsx`)
**Filter by area, food category, availability & pickup time.** Provides a responsive, multi-facet discovery engine so recipients can locate suitable surplus food quickly before it expires.

- **Core Capabilities**:
  1. **Filter by Area**: Instant filtering by neighborhood or location keyword (e.g. *Dhanmondi*, *Gulshan*, *Uttara*, *Mirpur*, *Mohammadpur*, *Banani*).
  2. **Filter by Food Category**: Interactive category pills (`Prepared Meals`, `Bakery & Bread`, `Fresh Produce`, `Fruits`, `Dairy & Eggs`, `Packaged & Canned`, `Beverages`, `Other`).
  3. **Filter by Availability**: Active surplus listings in `available` state are highlighted and prioritized at the top of the feed; listings past their pickup deadline or manually marked closed are automatically demoted or filtered out.
  4. **Filter by Pickup Time**: Live deadline computation (`formatPickupDeadline`) formats remaining pickup collection windows (*"Pickup before 25 October, 2026, 7:00 PM"*), flagging urgency and highlighting same-day collection items.

- **API Endpoint**:
  - **`GET /api/listings/feed?category=:category`**
    - **Invoked by**: `client/src/components/HomeLayout.jsx` & `client/src/pages/HomePage.jsx`
    - **Auth Required**: Public
    - **Query Options**: Server-side category filtering combined with client-side reactive filtering on query text, area neighborhood, and pickup window urgency.
    - **Response Payload**: Array of populated public food listings matching the query parameters.

---

### FR08: My listings- Edit, Delete (`MyListingsPage.jsx`)
**Allows users to view, edit and delete their published food listings.** A dedicated management portal built exclusively for food donors.

- **`GET /api/listings/mine`**
  - **Invoked by**: `client/src/pages/MyListingsPage.jsx` (on mount)
  - **Auth Required**: `Bearer <token>` (Donor only; receivers receive 403 Forbidden)
  - **Request Body**: None
  - **Response Payload**:
    ```json
    {
      "listings": [
        {
          "_id": "67302...",
          "foodName": "Fresh Shingara & Vegetable Samosa Batch",
          "description": "Surplus freshly fried shingara and vegetable samosas.",
          "category": "bakery",
          "quantity": 35,
          "portionUnit": "pieces",
          "photoUrl": "https://images.unsplash.com/photo-...",
          "status": "available",
          "pickupLocation": "Dhanmondi 27, Dhaka",
          "pickupOpensAt": "2026-11-08T18:00:00.000Z",
          "pickupClosesAt": "2026-11-08T22:30:00.000Z",
          "foodCondition": "fresh",
          "storageDetails": "Room temperature in covered trays",
          "createdAt": "2026-11-08T16:00:00.000Z"
        }
      ]
    }
    ```
  - **UI Action**: Displays donor's published donations, active pickups, and incomplete drafts in chronological order. Draft listings render an intelligent *"Continue setup →"* link directing the donor to either Step 2 (`/listings/:id/information`) or Step 3 (`/listings/:id/pickup`) based on completion state.

- **`DELETE /api/listings/:id`**
  - **Invoked by**: `client/src/pages/MyListingsPage.jsx` (Delete listing button with confirmation)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only; receivers receive 403 Forbidden)
  - **Request Body**: None
  - **Response Payload**: `{ "success": true, "message": "Listing removed successfully." }`
  - **UI Action**: Immediately removes the listing from MongoDB and updates the UI state with a deletion notification banner.

- **`PATCH /api/listings/:id`** *(or `PUT`)*
  - **Invoked by**: Donor management workflows
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**: Updated listing fields (`foodName`, `quantity`, `portionUnit`, `category`, `description`, `photoUrl`, `pickupDeadline`).
  - **Response Payload**: `{ "listing": { ... } }`
  - **UI Action**: Updates published listing parameters while guarding against unauthorized edits or modifications to closed listings.

---

### System Health Check (`server/src/app.js`)

- **`GET /api/health`**
  - **Invoked by**: Monitoring probes, hosting platforms (Render, Railway), or manual ping
  - **Auth Required**: Public
  - **Response Payload**: `{ "status": "ok", "service": "foodbridge-api" }`

---

## Master API Endpoint Summary

| FR ID | HTTP Method | API Path | Calling Page / Component | Auth Level | Key Operations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| — | `GET` | `/api/health` | System Monitor | Public | Health and uptime verification. |
| **FR01** | `POST` | `/api/auth/register` | `RegisterPage.jsx` | Public | Register new user with designated role (Donor, Receiver, Volunteer). |
| **FR02** | `POST` | `/api/auth/login` | `LoginPage.jsx` | Public | Sign in with email/password; returns JWT session token. |
| **FR01/02** | `POST` | `/api/auth/google` | `RegisterPage.jsx`, `LoginPage.jsx` | Public | Verify Google OAuth credential; login or provision account. |
| **FR02** | `POST` | `/api/auth/reset-password` | `LoginPage.jsx` | Public | Reset password with validation. |
| — | `GET` | `/api/auth/me` | `AuthContext.jsx` | `Bearer <token>` | Fetch authenticated user profile on app load / token refresh. |
| **FR03** | `GET` | `/api/listings/feed` | `HomeLayout.jsx`, `HomePage.jsx` | Public | Fetch real-time public community surplus feed with donor badges. |
| **FR04** | `GET` | `/api/listings/:id/information` | `FoodInformationPage.jsx` | Optional Auth | Retrieve Food Freshness & Quality Passport details. |
| **FR04** | `PATCH` | `/api/listings/:id/information` | `FoodInformationPage.jsx` | `Bearer <token>` | Save food safety, storage environment & handling guidelines. |
| **FR05** | `POST` | `/api/listings` | `FoodListingPage.jsx` | `Bearer <token>` | Create new food listing draft with canvas-compressed image or link. |
| **FR06** | `GET` | `/api/listings/:id` | `PickupSchedulePage.jsx` | `Bearer <token>` | Fetch specific listing draft to verify progress and setup schedule. |
| **FR06** | `PATCH` | `/api/listings/:id/pickup` | `PickupSchedulePage.jsx` | `Bearer <token>` | Save collection window, pickup location & publish listing as `available`. |
| **FR07** | `GET` | `/api/listings/feed?category=...` | `HomePage.jsx`, `HomeLayout.jsx` | Public | **Search & Filtering**: Filter by area, food category, availability & pickup time. |
| **FR08** | `GET` | `/api/listings/mine` | `MyListingsPage.jsx` | `Bearer <token>` | **My listings**: Retrieve all food donations owned by authenticated donor. |
| **FR08** | `DELETE` | `/api/listings/:id` | `MyListingsPage.jsx` | `Bearer <token>` | **Delete listing**: Permanently delete donor's food listing. |
| **FR08** | `PATCH` | `/api/listings/:id` | `MyListingsPage.jsx` | `Bearer <token>` | **Edit listing**: Update listing parameters, quantity, or description. |

---

## Future Functional Requirements Roadmap (FR09 & FR10)

The FoodBridge architecture is designed to integrate the following planned modules seamlessly in upcoming release cycles:

### FR09: Food claiming & Reservation
> **Allows users to claim available food donations and reserve them for pickup.**

- **Portion Allocation**: Receivers and verified community partners can reserve specific portions of active surplus listings according to their immediate need.
- **Fair-Share Reservation Limits**: Enforces daily per-user portion caps to prevent single-entity hoarding and guarantee equitable distribution.
- **Dynamic Stock Depletion**: Real-time decrement of remaining available portions. When all portions are claimed, the listing automatically transitions from `available` to `claimed`.
- **Planned API Endpoints**:
  - `POST /api/listings/:id/claim`: Submits claim request with requested portion count and estimated pickup time.
  - `GET /api/listings/claims/mine`: Receiver dashboard to track pending, approved, and past reservations.

### FR10: Pickup Verification & Confirmation
> **Use a reservation specific code to confirm collection.**

- **Secure Handover Verification Code**: Upon placing a reservation, the system generates a unique, single-use 6-character alphanumeric verification code (and scannable QR code) issued exclusively to the claiming receiver.
- **Physical Handover Authentication**: At collection, the receiver presents their code to the donor. The donor inputs or scans the code to confirm the physical exchange of food.
- **Automatic Completion & Audit Trail**: Verifying the code instantly transitions the listing to `completed`, records the handover timestamp, and closes the transaction.
- **Auto-Expiry Cancellation**: Unclaimed or uncollected listings past their `pickupClosesAt` window are automatically transitioned to `closed` to maintain feed hygiene.
- **Planned API Endpoints**:
  - `POST /api/listings/:id/verify-pickup`: Validates receiver's reservation code and marks transaction complete.
  - `POST /api/listings/:id/cancel-claim`: Allows receiver to release reserved portions if unable to attend.

### Extended Platform Roadmap (Post-Launch)
- **Incident Reporting & Food Quality Flags**: Mechanism for recipients to report packaging defects, unhygienic conditions, or inaccurate descriptions.
- **Volunteer Transport Routing**: Route matching for volunteers delivering food from donors to remote shelters or community centers.
- **Administrative Moderation Console**: Dashboard for administrators to suspend repeat offenders, monitor surplus metrics, and inspect donation impact reports.

---

## Getting Started (Local Development Setup)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or free [MongoDB Atlas M0 Cluster](https://www.mongodb.com/cloud/atlas)
- **Package Manager**: `npm` (v9+)

---

### 1. Backend Setup

```bash
cd server

# Install server dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

Open `server/.env` and configure:
```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/foodbridge
JWT_SECRET=super_secret_jwt_random_key_at_least_32_characters_long!
GOOGLE_CLIENT_ID=optional-google-client-id.apps.googleusercontent.com
```

### 2. Frontend Setup

```bash
cd ../client

# Install client dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

Open `client/.env` and configure:
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=optional-google-client-id.apps.googleusercontent.com
```

### 3. Running the Application

You can start each service in separate terminals:

```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Vite Client
cd client
npm run dev
```

Alternatively, from the project root:
```bash
npm run server   # Starts Express API on http://localhost:4000
npm run client   # Starts Vite Dev Server on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

### 4. Optional Demo Data Management (CLI)

The database does not auto-seed on startup to protect live data. For local development or test staging, optional CLI commands are provided:

```bash
# Seed demo listings (safely skipped if live user data already exists)
npm run seed

# Force re-seed demo listings alongside existing data
npm run seed -- --force

# Clean up / remove all demo listings and sample donor accounts from the database
npm run seed:clean
```

---

## Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | Port for the Express server (default `4000`) | `4000` |
| `CLIENT_ORIGIN` | Required | Allowed CORS frontend origins (comma-separated) | `http://localhost:5173,https://foodbridge.vercel.app` |
| `MONGODB_URI` | Required | Connection string for MongoDB | `mongodb://127.0.0.1:27017/foodbridge` |
| `JWT_SECRET` | Required | Cryptographic secret for signing JWTs (min 32 chars) | `my_super_secure_jwt_secret_token_12345` |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud OAuth 2.0 Web Client ID | `123456789-abc.apps.googleusercontent.com` |

### Frontend (`client/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Required | URL to the backend `/api` endpoint | `http://localhost:4000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth Web Client ID for One Tap / Sign-In | `123456789-abc.apps.googleusercontent.com` |

---

## Deployment & Free-Tier Optimization

- **Frontend (Vercel)**:
  - Framework Preset: `Vite`
  - Root Directory: `client`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Uses `vercel.json` rewrite rule to direct all routes to `/index.html` for client-side routing.
- **Backend (Render / Railway / Fly.io)**:
  - Root Directory: `server`
  - Start Command: `node src/app.js`
  - Node version: `18+`
  - Accommodates cold-starts: Client fetch includes an automatic 25-second AbortController timeout.
- **Database (MongoDB Atlas M0)**:
  - Free-tier 512 MB cluster with replica set. Whitelist IP `0.0.0.0/0` in Atlas Network Access for cloud hosts.
