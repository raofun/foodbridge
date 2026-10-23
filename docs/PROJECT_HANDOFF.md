# FoodBridge project handoff

This note is the working brief for a human or coding assistant continuing the shared FoodBridge repository. Read it together with the root `AGENTS.md` and `.agents/skills/foodbridge-development/SKILL.md`.

## Goal

Build Module 1 of FoodBridge, a web app that helps people share surplus food and coordinate collection. The project uses separate feature screens, a React frontend, API calls for application processes, an Express server, and MongoDB. The user plans to host the web frontend on Vercel and keep hosting/database costs at zero using free tiers. Choose designs and architecture with that goal in mind, and verify up-to-date free-tier constraints when deployment work begins.

## Feature ownership

| Feature | Requirement | Owner | Page / route |
| --- | --- | --- | --- |
| Registration + Google sign-in | FR01 | Raofun | `client/src/pages/RegisterPage.jsx`, `/register` |
| Login + Google sign-in | FR02 | Sahmina | `client/src/pages/LoginPage.jsx`, `/login` |
| Food listing | FR03 | Raofun | `client/src/pages/FoodListingPage.jsx`, `/dashboard/listings/new` |
| Food information | FR04 | Raofun | `client/src/pages/FoodInformationPage.jsx`, `/dashboard/listings/:listingId/information` |
| Pickup scheduling | FR05 | Sahmina | `client/src/pages/PickupSchedulePage.jsx`, `/dashboard/listings/:listingId/pickup` |

Dashboard and listing history are supporting navigation/screens, not separate Module 1 requirements. Work in separate branches (`dev/raofun` for Raofun and Sahmina's own branch) and coordinate integration. The shared `main` branch should receive reviewed, focused changes through the team's agreed GitHub merge process.

## Current state: registration screen

The latest local work on `dev/raofun` is a visual and usability pass on registration:

- `client/src/pages/RegisterPage.jsx` now presents role selection cards for donor, receiver, and volunteer; full name, email, and password; a show/hide password control; a lightweight password-length indicator; request loading/error states; an email-registration submit action; and Google sign-in.
- `client/src/pages/RegisterPage.css` contains the page-specific responsive styles and motion for the registration experience.
- The page reuses `AuthFrame`, `AuthDivider`, `GoogleSignInButton`, `AuthContext`, and the shared API helper. Login is still a distinct route and screen.
- Email registration calls the existing `POST /api/auth/register` endpoint. Google sign-in calls `POST /api/auth/google`. Successful responses are passed to the existing auth context and navigate to `/dashboard`.
- No API contract, server route, model, or database code was changed as part of this registration UI work.
- The CSS/JSX are saved in the working tree; they have not been committed or pushed. Keep them intact and include them when Raofun commits this feature.

The client packages were installed locally into `client/node_modules` for preview; the install used `--no-save --package-lock=false`, so it is not intended as a source change. A Vite preview was launched at `http://127.0.0.1:5173/register`. Stop that dev server with Ctrl+C in its terminal when finished.

## What is needed to use authentication end to end

- Client config: copy `client/.env.example` to `client/.env`, set `VITE_API_BASE_URL` to the API URL, and set `VITE_GOOGLE_CLIENT_ID` to a Google OAuth web client ID.
- Server config: copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, a random `JWT_SECRET` (at least 32 characters), `CLIENT_ORIGIN`, and the matching `GOOGLE_CLIENT_ID`.
- Run the Express server and Vite client in separate terminals. MongoDB must be reachable for real registration/login.
- Google sign-in will render as a disabled setup hint until the frontend client ID is configured. Google also requires the authorized origin to match the local/deployed site, and the server must verify the credential against the same client ID.
- Never commit `.env` files, OAuth secrets, database credentials, or JWT secrets. Use the provider's environment-variable settings for deployment.

## Code map

- `client/src/App.jsx`: route table and protected/auth-only route guards.
- `client/src/pages/`: one component per feature screen.
- `client/src/components/`: shared layout, auth widgets, and listing flow components.
- `client/src/context/AuthContext.jsx`: current authenticated session.
- `client/src/services/api.js`: frontend API base URL, request helper, and auth token handling.
- `server/src/app.js`: Express app, middleware, and API route mounting.
- `server/src/routes/`: HTTP endpoint definitions.
- `server/src/controllers/`: request processing and business rules.
- `server/src/models/`: Mongoose schemas.
- `server/src/middleware/requireAuth.js`: authentication gate for protected endpoints.

## Collaboration and change boundaries

Page-level presentation and interaction work can proceed on its assigned feature branch. Shared integration work needs coordination to avoid both contributors editing the same file. In particular, before changing a shared API contract, server route/controller behavior, Mongoose schema, or persistence behavior, explain what needs to change and ask Raofun first. This instruction came directly from the project owner. Do not silently make database changes while styling a page.

When an API change is approved, record the agreed method, path, request fields, response shape, authentication requirement, and ownership rule in the handoff or README. Scope MongoDB data by the authenticated account; do not use a browser-provided owner ID as authority.

## Immediate next step

Continue refining the registration screen from the current preview, with responsive layout and accessible interaction states. Keep the separate login link and Google option in place. If visual changes do not work as expected, inspect the existing shared auth styles in `client/src/styles/global.css` and `AuthFrame` before editing shared styles. Once the user approves the visual direction, commit the registration page files on `dev/raofun` and push that branch through the user's Git workflow. Do not commit or push on the user's behalf unless asked.
