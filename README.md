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

- [Project Overview & Roles](#project-overview--roles)
- [Functional Requirements Matrix (FR01 – FR10 + Admin)](#functional-requirements-matrix)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Frontend Routes](#frontend-routes)
- [Master REST API Reference](#master-rest-api-reference)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Pre-Defined Administrator Account](#pre-defined-administrator-account)
- [Environment Variables](#environment-variables)

---

## Project Overview & Roles

FoodBridge bridges surplus food from donors to local communities before it goes to waste. The platform provides a secure, role-based workflow where donors can list food items with strict storage and safety guidelines, schedule pickup windows, and coordinate with verified community recipients.

### Role Separation

- **Donors** (Restaurants, Bakeries, Caterers, Households):
  - Create food listings, configure food safety passports, and schedule collection windows.
  - Manage and edit published donations.
  - Verify recipient handover codes or scan recipient QR passes.
- **Receivers** (Shelters, Charities, Families, Individuals):
  - Browse community feed and inspect verified food safety passports.
  - Reserve available portions and receive a secure Digital Pickup Pass & QR ticket.
  - Manage active, completed, or cancelled reservations.
- **Volunteers** (Community Couriers, Dispatch Helpers):
  - Assist in delivery coordination and verify handovers between donors and recipients.
- **Administrators**:
  - Access the Control Center via `/admin`.
  - Manage user roles, provision admins, suspend/delete accounts, and moderate listings.

---

## Functional Requirements Matrix

| ID | Feature / Module | Status | Description |
| :--- | :--- | :---: | :--- |
| **FR01** | **User Registration** | ✅ | Multi-role account onboarding (Donor, Receiver, Volunteer) with email/password and Google OAuth 2.0. |
| **FR02** | **User Login & Recovery** | ✅ | Email/password login, Google One Tap sign-in, JWT session token, and password reset. |
| **FR03** | **Community Feed** | ✅ | Real-time public surplus food feed with live availability badges, portion counters, and donor profiles. |
| **FR04** | **Food Information** | ✅ | Food Freshness & Quality Passport: preparation time, storage conditions, allergens, and dietary tags. |
| **FR05** | **Create Food Listing** | ✅ | Multi-mode listing wizard with canvas-compressed device photo upload, presets, and portion configuration. |
| **FR06** | **Pickup Scheduling** | ✅ | Single authoritative collection schedule: opening and closing times, Dhaka area presets, and publishing. |
| **FR07** | **Search & Filtering** | ✅ | Real-time multi-facet filtering across Dhaka neighborhoods, food categories, availability, and pickup times. |
| **FR08** | **My Listings — Edit & Delete** | ✅ | Dedicated donor dashboard to manage active donations, continue drafts, or remove listings. |
| **FR09** | **Food Claiming & Reservation** | ✅ | Reserve portions with dynamic stock depletion, fair-share caps, and cancellation restocking. |
| **FR10** | **Pickup Verification & Pass** | ✅ | Handover authentication using 6-character HMAC-SHA256 hashed code, Digital QR Pass, and secret wiping. |
| **Admin** | **Control Center (`/admin`)** | ✅ | Privileged dashboard for user roles, account suspension/deletion, platform metrics, and listing moderation. |

---

## Technology Stack

### Frontend
- **Framework**: React 19 + Vite 6
- **Routing**: React Router DOM v7 with role guards (`ProtectedRoute`, `DonorRoute`, `AdminRoute`, `AuthRoute`)
- **Styling**: Modern CSS3 (Dark Glassmorphism design language, CSS Grid/Flexbox, custom CSS variables)
- **Icons & Animation**: Lucide React + Framer Motion
- **QR Code Engine**: Zero-dependency inline SVG QR matrix generator

### Backend
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express 4.x
- **Database**: MongoDB with Mongoose ODM
- **Security & Crypto**: JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), Google OAuth, HMAC-SHA256, AES-256-GCM

---

## Application Structure

```text
foodbridge-app/
├── client/                     # Frontend React + Vite app
│   ├── src/
│   │   ├── components/         # Reusable UI colocated with CSS (HomeLayout, ClaimModal, etc.)
│   │   ├── context/            # AuthContext (global session management)
│   │   ├── pages/              # Views colocated with CSS (HomePage, AdminDashboardPage, etc.)
│   │   ├── services/           # Centralized API fetch wrapper (api.js)
│   │   └── styles/             # Global design tokens and reset (global.css)
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── controllers/        # Business logic (auth, listings, claims, verification, admin)
│   │   ├── middleware/         # requireAuth, requireAdmin, errorHandler
│   │   ├── models/             # User, Listing, Claim (Mongoose schemas)
│   │   ├── routes/             # Express routers
│   │   ├── utils/              # verificationCode (crypto), bootstrapAdmin
│   │   └── app.js              # Server entry point & CORS
│   └── package.json
└── README.md
```

---

## Frontend Routes

| Route | Component | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Public | Real-time community surplus feed with search and filters. |
| `/login` | `LoginPage.jsx` | Guest | Email & Google sign-in; password recovery. |
| `/register` | `RegisterPage.jsx` | Guest | Multi-role user registration. |
| `/listings/new` | `FoodListingPage.jsx` | Donor | Step 1: Create surplus food listing draft. |
| `/listings/:id/information` | `FoodInformationPage.jsx` | Public / Donor | Step 2 / View: Food safety passport and storage environment. |
| `/listings/:id/pickup` | `PickupSchedulePage.jsx` | Donor | Step 3: Configure pickup schedule and publish listing. |
| `/listings/mine` | `MyListingsPage.jsx` | Donor | Manage published donations, edit portions, continue drafts. |
| `/claims/mine` | `MyClaimsPage.jsx` | Receiver | Manage active reservations, view pickup pass, delete cancelled claims. |
| `/claims/:id/pass` | `PickupPassPage.jsx` | Receiver / Volunteer | Digital Pickup Pass with 6-char code, high-contrast QR, and live status. |
| `/verify-pickup` | `PickupVerificationPage.jsx` | Donor / Volunteer | Universal direct code & camera QR scan verification station. |
| `/listings/:id/verify` | `PickupVerificationPage.jsx` | Donor / Volunteer | Listing-specific pickup station (pending vs completed). |
| `/admin` | `AdminDashboardPage.jsx` | Admin only | Control Center for user roles, moderation, and metrics. |

---

## Master REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with role (`donor`, `receiver`, `volunteer`). |
| `POST` | `/api/auth/login` | Public | Email/password sign-in; returns JWT token and user profile. |
| `POST` | `/api/auth/google` | Public | Verify Google OAuth token; login or register user. |
| `POST` | `/api/auth/reset-password` | Public | Reset account password with validation. |
| `GET` | `/api/auth/me` | User | Get current session user data on app mount. |

### Food Listings (`/api/listings`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/listings/feed` | Public | Public surplus food feed with category & area filtering. |
| `GET` | `/api/listings/mine` | Donor | Retrieve all listings created by the authenticated donor. |
| `POST` | `/api/listings` | Donor | Create new food listing draft. |
| `GET` | `/api/listings/:id` | Authenticated | Retrieve listing details and schedule data. |
| `PATCH` | `/api/listings/:id` | Donor (Owner) | Update listing title, portions, category, or photo. |
| `DELETE` | `/api/listings/:id` | Donor (Owner) | Delete a food listing. |
| `GET` | `/api/listings/:id/information` | Public | Get Food Safety & Quality Passport details. |
| `PATCH` | `/api/listings/:id/information` | Donor (Owner) | Save food condition, storage details, and safety notes. |
| `PATCH` | `/api/listings/:id/pickup` | Donor (Owner) | Save collection window, location, and publish as `available`. |

### Claims & Reservations (`/api/claims`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/listings/:id/claim` | Receiver | Reserve portions; issues HMAC-hashed verification code. |
| `GET` | `/api/claims/mine` | Receiver | Retrieve user's active, completed, and cancelled reservations. |
| `PUT` | `/api/claims/:id` | Receiver (Owner) | Update reservation portions, ETA, or notes. |
| `POST` | `/api/claims/:id/cancel` | Receiver (Owner) | Cancel reservation and return portions back to feed. |
| `DELETE` | `/api/claims/:id` | Receiver (Owner) | Permanently delete a cancelled reservation record. |

### Pickup Verification (`/api/verification` & `/api`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/claims/:id/pickup-pass` | Receiver / Volunteer | Decrypted 6-char verification code, QR URL, and live status. |
| `POST` | `/api/listings/:id/verify-pickup` | Donor / Volunteer | Verify 6-char code for listing; marks completed and wipes secret. |
| `POST` | `/api/verification/verify-code` | Donor / Volunteer | Universal 1-step verification across all donor listings. |
| `GET` | `/api/listings/:id/verification` | Donor / Volunteer | View pending vs completed handover history for a listing. |
| `GET` | `/api/verification/active-listings` | Donor / Volunteer | Retrieve donor's listings with pending collections. |

### Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/stats` | Admin | High-level platform summary (users by role, rescued portions). |
| `GET` | `/api/admin/users` | Admin | Searchable user registry with role and status filtering. |
| `POST` | `/api/admin/users/create-admin` | Admin | Directly provision a new administrator account. |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Change user role (`donor`, `receiver`, `volunteer`, `admin`, `member`). |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Toggle account status between `active` and `suspended`. |
| `DELETE` | `/api/admin/users/:id` | Admin | Permanently delete a suspended user account from the database. |
| `GET` | `/api/admin/listings` | Admin | Search all platform listings for moderation. |
| `DELETE` | `/api/admin/listings/:id` | Admin | Permanently delete a listing and its claims. |

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/foodbridge`) or MongoDB Atlas
- **Package Manager**: `npm`

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Pre-Defined Administrator Account

On server startup, if no administrator exists in the database, FoodBridge automatically initializes a default admin:

- **Email**: `admin@foodbridge.org`
- **Password**: `Admin@FoodBridge2026!`
- **Role**: `admin`

Log in at `/login` and navigate to **`/admin`** to access the Control Center.

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Express server port (default 4000) | `4000` |
| `CLIENT_ORIGIN` | Required | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `MONGODB_URI` | Required | MongoDB connection string | `mongodb://127.0.0.1:27017/foodbridge` |
| `JWT_SECRET` | Required | Secret key for signing JWTs and HMAC hashes (min 32 chars) | `my_super_secret_jwt_random_key_at_least_32_chars!` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Web Client ID | `123456-abc.apps.googleusercontent.com` |
| `DEFAULT_ADMIN_NAME` | Optional | Name for auto-seeded default admin | `System Administrator` |
| `DEFAULT_ADMIN_EMAIL` | Optional | Email for auto-seeded default admin | `admin@foodbridge.org` |
| `DEFAULT_ADMIN_PASSWORD` | Optional | Password for auto-seeded default admin | `Admin@FoodBridge2026!` |

### Frontend (`client/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Required | Backend API base URL | `http://localhost:4000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID for sign-in button | `123456-abc.apps.googleusercontent.com` |
