# FoodBridge

FoodBridge coordinates surplus food donations and pickup. This repository is the shared codebase; develop each module on a feature branch and integrate it through a pull request.


## Module 1 implemented

- Email registration with role selection (donor, receiver, volunteer)
- Email and password login, signed sessions, and current-user endpoint
- Google sign-in UI and server-side credential verification (requires OAuth configuration)
- Three-step donor listing flow: food listing (FR03), preparation and storage information (FR04), and pickup scheduling (FR05)
- Donor dashboard listing history
- Donor-only listing API saves a draft at FR03 and publishes it after FR04 and FR05 are complete

## Stack and folders

- `client/`: React + Vite, regular CSS, API-connected screens
- `server/`: Express REST API, Mongoose models, authentication middleware
- MongoDB stores accounts and listings

Each Module 1 feature has its own page under `client/src/pages/`: `RegisterPage.jsx` (FR01), `LoginPage.jsx` (FR02), `FoodListingPage.jsx` (FR03), `FoodInformationPage.jsx` (FR04), and `PickupSchedulePage.jsx` (FR05). `DashboardPage.jsx` and `MyListingsPage.jsx` provide dashboard utilities. Shared authentication UI, navigation, API calls, and session state live under `components/`, `services/`, and `context/` respectively. `App.jsx` maps URLs to pages; `main.jsx` starts React and the router.

### Module 1 ownership

- **Raofun:** registration (FR01), food listing (FR03), and food information (FR04).
- **Sahmina:** login (FR02) and pickup scheduling (FR05).
- **Shared integration:** Google sign-in is used on both account screens. Coordinate changes to shared auth files, `App.jsx`, the listing model, and the listing router so only one person edits each shared file at a time.

The donor listing flow is connected as three API-backed steps. FR03 creates a draft listing; FR04 saves preparation, condition, and storage information; FR05 adds the pickup window and changes the listing to available. The dashboard shows drafts and lets the donor continue setup.

## Run locally

Requirements: Node.js and a MongoDB database. A local MongoDB instance can be used during development.

1. In `server/`, run `npm install`, copy `.env.example` to `.env`, and set `MONGODB_URI` plus a random `JWT_SECRET` of at least 32 characters.
2. In `client/`, run `npm install` and copy `.env.example` to `.env`.
3. In separate terminals, run `npm run dev` from `server/` and `npm run dev` from `client/`.
4. Open the Vite URL shown in the client terminal.

Email/password auth and listings work with a configured database. To enable Google sign-in, create a Google OAuth web client and put its client ID in both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`). Configure authorized origins for local development and the eventual deployed domain in Google Cloud. Never commit `.env` files or OAuth secrets.

Photo is currently an optional public image URL. A persistent image service can be selected when deployment/storage is planned; saving uploads on an application server is not a reliable production approach.

## Module 1 API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API health |
| `POST` | `/api/auth/register` | Create email/password account |
| `POST` | `/api/auth/login` | Sign in with email/password |
| `POST` | `/api/auth/google` | Verify Google credential and sign in/register |
| `GET` | `/api/auth/me` | Read signed-in user |
| `POST` | `/api/listings` | Create draft food listing (FR03) |
| `GET` | `/api/listings/mine` | List signed-in donor's listings |
| `GET` | `/api/listings/:id` | Read own listing to continue its setup |
| `PATCH` | `/api/listings/:id/information` | Save preparation and storage information (FR04) |
| `PATCH` | `/api/listings/:id/pickup` | Save pickup schedule and publish listing (FR05) |
| `DELETE` | `/api/listings/:id` | Delete own listing |

Protected endpoints use `Authorization: Bearer <token>`. API routes, controllers, models, and middleware are separated under `server/src/`.

## Next proposal modules

Search and filtering, receiver requests and portion reservation limits, pickup confirmation codes and deadline closure, incident reports, and administrator monitoring.
