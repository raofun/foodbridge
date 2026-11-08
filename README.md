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
- [Functional Requirements Matrix (FR01 – FR09)](#functional-requirements-matrix-fr01--fr09)
- [Technology Stack](#technology-stack)
- [Application Architecture & Folder Layout](#application-architecture--folder-layout)
- [Frontend Pages & Routes](#frontend-pages--routes)
- [Complete API Reference by Functional Requirement](#complete-api-reference-by-functional-requirement)
  - [Global Auth Session (`AuthContext.jsx`)](#global-auth-session-authcontextjsx)
  - [FR01: User Registration (`RegisterPage.jsx`)](#fr01-user-registration-registerpagejsx)
  - [FR02: User Login & Password Recovery (`LoginPage.jsx`)](#fr02-user-login--password-recovery-loginpagejsx)
  - [FR03: Community Feed & Donor Dashboard (`HomePage.jsx` & `MyListingsPage.jsx`)](#fr03-community-feed--donor-dashboard-homepagejsx--mylistingspagejsx)
  - [FR04: Food Information (`FoodInformationPage.jsx`)](#fr04-food-information-foodinformationpagejsx)
  - [FR05: Create Food Listing (`FoodListingPage.jsx`)](#fr05-create-food-listing-foodlistingpagejsx)
  - [FR06: Pickup Scheduling & Publishing (`PickupSchedulePage.jsx`)](#fr06-pickup-scheduling--publishing-pickupschedulepagejsx)
  - [System Health Check (`server/src/app.js`)](#system-health-check-serversrcappjs)
- [Master API Endpoint Summary](#master-api-endpoint-summary)
- [Future Functional Requirements Roadmap (FR07, FR08, FR09)](#future-functional-requirements-roadmap-fr07-fr08-fr09)
- [Getting Started (Local Development Setup)](#getting-started-local-development-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Deployment & Free-Tier Optimization](#deployment--free-tier-optimization)

---

## Project Overview

FoodBridge bridges surplus food from donors to local communities before it goes to waste. The platform provides a secure, role-based workflow where donors can list food items with strict storage and safety guidelines, schedule pickup windows, and coordinate with verified community recipients.

The application is architected as an API-first single-page application (SPA) powered by React and Vite, supported by a modular Express/Node.js REST backend and MongoDB database.

---

## Functional Requirements Matrix (FR01 – FR09)

| Requirement ID | Module / Feature | Status | Description |
| :--- | :--- | :--- | :--- |
| **FR01** | **User Registration** | ✅ Implemented | Multi-role account onboarding (Donor, Receiver, Volunteer) with email/password and Google OAuth 2.0. |
| **FR02** | **User Login & Recovery** | ✅ Implemented | Secure email/password login, Google One Tap sign-in, JWT token generation, and password recovery. |
| **FR03** | **Feed or Dashboard** | ✅ Implemented | Public discovery feed of active surplus food, live search, category filtering, and donor listing management dashboard. |
| **FR04** | **Food Information** | ✅ Implemented | Comprehensive food preparation timestamps, storage condition/temperature guidelines, packaging details, and allergen warnings. |
| **FR05** | **Create Listing** | ✅ Implemented | Guided food creation wizard: title, description, category, portion quantities, food type (cooked/raw), dietary tags, and photo. |
| **FR06** | **Pickup Scheduling** | ✅ Implemented | Precise pickup time-window allocation, pickup address/access instructions, and publishing the listing to `available`. |
| **FR07** | **Food Claiming & Reservations** | ⏳ Planned | Receiver portion claims, quantity limits, reservation confirmation, and remaining stock tracking. |
| **FR08** | **Pickup Verification & Confirmation** | ⏳ Planned | Secure OTP / QR code exchange upon physical handover, recipient verification, and automated deadline closure. |
| **FR09** | **Incident Reporting & Monitoring** | ⏳ Planned | Food safety incident reports, community feedback, volunteer transport coordination, and administrative moderation. |

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
│   │   │   ├── FoodListing.js
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
| **FR03** | `/` | `HomePage.jsx` | Public | Main community feed displaying published food listings, search, and category filters. |
| **FR03** | `/listings/mine` | `MyListingsPage.jsx` | Donor only | Donor dashboard to review all drafts, active listings, and delete listings. |
| **FR04** | `/listings/:id/information` | `FoodInformationPage.jsx` | Public / Donor | View or edit preparation details, storage conditions, and allergen warnings. |
| **FR05** | `/listings/new` | `FoodListingPage.jsx` | Donor only | Create draft listing with food details, quantities, tags, and photo. |
| **FR06** | `/listings/:id/pickup` | `PickupSchedulePage.jsx` | Donor only | Set pickup address, time window, and publish listing to `available`. |

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

### FR03: Community Feed & Donor Dashboard (`HomePage.jsx` & `MyListingsPage.jsx`)
Powers the central discovery feed of all available food donations and the donor management dashboard.

- **`GET /api/listings/feed`**
  - **Invoked by**: `client/src/components/HomeLayout.jsx` (on mount and refresh)
  - **Auth Required**: Public (No auth required)
  - **Request Body**: None
  - **Response Payload**:
    ```json
    {
      "listings": [
        {
          "_id": "67301...",
          "title": "Fresh Shingara & Vegetable Samosa Batch",
          "description": "Surplus freshly fried shingara and vegetable samosas.",
          "category": "Prepared Meals",
          "foodType": "cooked",
          "quantity": 35,
          "unit": "pieces",
          "status": "available",
          "dietary": ["Vegetarian"],
          "allergens": ["Gluten"],
          "packaging": "Clean, covered cardboard pastry boxes",
          "storageTemperature": "Room Temperature",
          "pickupWindowStart": "2026-11-08T18:00:00.000Z",
          "pickupWindowEnd": "2026-11-08T22:30:00.000Z",
          "pickupLocation": {
            "address": "Dhanmondi 27, Dhaka",
            "city": "Dhaka"
          },
          "donorId": {
            "_id": "673...",
            "name": "Bikrampur Mistanna Bhandar",
            "organizationName": "Bikrampur Sweets & Snacks",
            "phone": "+8801711223344",
            "city": "Dhaka"
          }
        }
      ]
    }
    ```
  - **UI Action**: Populates feed cards, category filters, and live search on `HomePage.jsx`.

- **`GET /api/listings/mine`**
  - **Invoked by**: `client/src/pages/MyListingsPage.jsx` (on mount)
  - **Auth Required**: `Bearer <token>` (Donor only)
  - **Request Body**: None
  - **Response Payload**: Array of all listings (draft, available, claimed, completed) owned by the logged-in donor.
  - **UI Action**: Renders donor's listing cards sorted by newest updates, showing progress pills (Draft, Available, Claimed, Completed).

- **`DELETE /api/listings/:id`**
  - **Invoked by**: `client/src/pages/MyListingsPage.jsx` (Delete listing action)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**: None
  - **Response Payload**: `{ "success": true, "message": "Listing removed successfully" }`
  - **UI Action**: Instantly removes listing from local state and database.

---

### FR04: Food Information (`FoodInformationPage.jsx`)
Comprehensive food safety, handling, storage, and preparation details screen.

- **`GET /api/listings/:id/information`**
  - **Invoked by**: `client/src/pages/FoodInformationPage.jsx` (on page load)
  - **Auth Required**: Optional / Public for published listings; Donor-only for drafts.
  - **Request Body**: None
  - **Response Payload**: Returns full listing record with populated `donorId` (name, organization, contact phone, city) and safety fields.
  - **UI Action**: Pre-populates all form fields (preparation date, storage condition, temperature, packaging notes) from the database. Also powers public viewing for receivers inspecting food details before pickup.

- **`PATCH /api/listings/:id/information`**
  - **Invoked by**: `client/src/pages/FoodInformationPage.jsx` (Save & Proceed to Schedule button)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**:
    ```json
    {
      "preparedAt": "2026-11-08T16:00:00.000Z",
      "bestBefore": "2026-11-09T02:00:00.000Z",
      "storageTemperature": "Keep Refrigerated (0-4°C)",
      "packaging": "Sealed aluminum food containers",
      "handlingInstructions": "Reheat thoroughly before serving. Keep refrigerated until collection."
    }
    ```
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67302...",
        "storageTemperature": "Keep Refrigerated (0-4°C)",
        "packaging": "Sealed aluminum food containers",
        "status": "draft"
      }
    }
    ```
  - **UI Action**: Persists all safety details to MongoDB and automatically advances to FR06 Pickup Scheduling (`/listings/:id/pickup`).

---

### FR05: Create Food Listing (`FoodListingPage.jsx`)
Initial step of the donor food listing creation wizard.

- **`POST /api/listings`**
  - **Invoked by**: `client/src/pages/FoodListingPage.jsx` (Save & Continue button)
  - **Auth Required**: `Bearer <token>` (Donor only)
  - **Request Body**:
    ```json
    {
      "title": "Biryani Portions",
      "description": "Freshly cooked kacchi biryani from evening catering event.",
      "category": "Prepared Meals",
      "quantity": 20,
      "unit": "servings",
      "foodType": "cooked",
      "dietary": ["Halal"],
      "allergens": ["Dairy"],
      "imageUrl": "https://images.unsplash.com/photo-..."
    }
    ```
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67302...",
        "title": "Biryani Portions",
        "status": "draft",
        "donorId": "673..."
      }
    }
    ```
  - **UI Action**: Creates a persistent database document in `draft` status and navigates the donor to FR04: `/listings/:id/information`.

---

### FR06: Pickup Scheduling & Publishing (`PickupSchedulePage.jsx`)
Final stage of the donor pipeline to set pickup access and publish the donation.

- **`GET /api/listings/:id`**
  - **Invoked by**: `client/src/pages/PickupSchedulePage.jsx` (on mount)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**: None
  - **Response Payload**: Returns draft listing details to verify ownership and prefill default pickup location from the donor's profile.
  - **UI Action**: Validates listing state before rendering schedule forms.

- **`PATCH /api/listings/:id/pickup`**
  - **Invoked by**: `client/src/pages/PickupSchedulePage.jsx` (Publish Listing button)
  - **Auth Required**: `Bearer <token>` (Owner / Donor only)
  - **Request Body**:
    ```json
    {
      "pickupWindowStart": "2026-11-08T20:00:00.000Z",
      "pickupWindowEnd": "2026-11-08T23:00:00.000Z",
      "pickupLocation": {
        "address": "House 12, Road 4, Sector 3, Uttara",
        "city": "Dhaka",
        "instructions": "Call upon arrival at the security gate."
      }
    }
    ```
  - **Response Payload**:
    ```json
    {
      "listing": {
        "_id": "67302...",
        "status": "available",
        "pickupWindowStart": "2026-11-08T20:00:00.000Z",
        "pickupWindowEnd": "2026-11-08T23:00:00.000Z"
      }
    }
    ```
  - **UI Action**: Switches listing status from `draft` to `available`. Displays success state and redirects donor to `/listings/mine` or the public feed.

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
| **FR01** | `POST` | `/api/auth/register` | `RegisterPage.jsx` | Public | Register new user with designated role. |
| **FR02** | `POST` | `/api/auth/login` | `LoginPage.jsx` | Public | Sign in with email/password; returns JWT. |
| **FR01/02** | `POST` | `/api/auth/google` | `RegisterPage.jsx`, `LoginPage.jsx` | Public | Verify Google OAuth credential; login/register. |
| **FR02** | `POST` | `/api/auth/reset-password` | `LoginPage.jsx` | Public | Reset password with validation. |
| — | `GET` | `/api/auth/me` | `AuthContext.jsx` | `Bearer <token>` | Fetch authenticated user profile on app load. |
| **FR03** | `GET` | `/api/listings/feed` | `HomeLayout.jsx`, `HomePage.jsx` | Public | Fetch public community feed with donor info. |
| **FR03** | `GET` | `/api/listings/mine` | `MyListingsPage.jsx` | `Bearer <token>` | Retrieve all listings owned by logged-in donor. |
| **FR03** | `DELETE` | `/api/listings/:id` | `MyListingsPage.jsx` | `Bearer <token>` | Permanently delete donor's food listing. |
| **FR04** | `GET` | `/api/listings/:id/information` | `FoodInformationPage.jsx` | Optional Auth | Retrieve food safety, storage & donor details. |
| **FR04** | `PATCH` | `/api/listings/:id/information` | `FoodInformationPage.jsx` | `Bearer <token>` | Save food safety, storage & handling. |
| **FR05** | `POST` | `/api/listings` | `FoodListingPage.jsx` | `Bearer <token>` | Create new food listing draft. |
| **FR06** | `GET` | `/api/listings/:id` | `PickupSchedulePage.jsx` | `Bearer <token>` | Fetch specific listing draft to continue setup. |
| **FR06** | `PATCH` | `/api/listings/:id/pickup` | `PickupSchedulePage.jsx` | `Bearer <token>` | Save pickup window & publish listing. |

---

## Future Functional Requirements Roadmap (FR07, FR08, FR09)

The platform architecture is designed to seamlessly integrate the following planned modules in future development cycles:

### 1. FR07: Food Claiming & Portion Reservations
- **Portion Allocation**: Receivers and verified community partners can reserve specific portions of active surplus listings.
- **Fair-Share Reservation Limits**: Prevent single-entity hoarding with configurable maximum portions per recipient per day.
- **Dynamic Stock Depletion**: Automatic decrement of available listing portions in real-time, transitioning to `claimed` when fully reserved.

### 2. FR08: Real-Time Pickup Verification & Handover
- **Secure Handover Verification**: Generation of single-use numerical OTP or cryptographic QR codes shared between donor and recipient.
- **Physical Handover Confirmation**: Donors scan or input recipient code upon collection to immediately mark the listing as `completed`.
- **Automated Expiry & Closure**: Server-side cron/worker to auto-expire uncollected listings past their `pickupWindowEnd` deadline.

### 3. FR09: Incident Reporting, Monitoring & Moderation
- **Food Quality & Safety Flags**: Mechanism for recipients to report safety concerns, unhygienic packaging, or inaccurate listings.
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
