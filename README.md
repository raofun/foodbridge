# FoodBridge

FoodBridge coordinates surplus food donations and pickup. This repository is the shared codebase; develop each module on a feature branch and integrate it through a pull request.

## Module 1 implemented

- Email registration with role selection (donor, receiver, volunteer)
- Email and password login, signed sessions, and current-user endpoint
- Google sign-in UI and server-side credential verification (requires OAuth configuration)
- Donor listing creation with food description, optional photo URL, quantity, portion unit, pickup location, and pickup opening/closing times
- Donor dashboard listing history
- Donor-only listing API with list, update, and delete operations

## Stack and folders

- `client/`: React + Vite, regular CSS, API-connected screens
- `server/`: Express REST API, Mongoose models, authentication middleware
- MongoDB stores accounts and listings

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
| `POST` | `/api/listings` | Create donor listing |
| `GET` | `/api/listings/mine` | List signed-in donor's listings |
| `PATCH` | `/api/listings/:id` | Update own listing |
| `DELETE` | `/api/listings/:id` | Delete own listing |

Protected endpoints use `Authorization: Bearer <token>`. API routes, controllers, models, and middleware are separated under `server/src/`.

## Next proposal modules

Search and filtering, receiver requests and portion reservation limits, pickup confirmation codes and deadline closure, incident reports, and administrator monitoring.
