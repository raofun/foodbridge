# FoodBridge project instructions

Read this file and `docs/PROJECT_HANDOFF.md` before changing code. The detailed reusable workflow is in `.agents/skills/foodbridge-development/SKILL.md`.

## Project purpose and constraints

FoodBridge is a community web app for donating surplus food and arranging safe pickups. The goal is a modern, accessible, API-driven React app with an Express/MongoDB backend. The project must be deployable using free tiers (the frontend is intended for Vercel); verify current provider limits before making deployment promises. Keep secrets out of Git.

## Stack and layout

- `client/`: React, Vite, React Router, regular CSS. Pages are in `client/src/pages/`; shared UI is in `components/`; API calls are in `services/api.js`; session state is in `context/AuthContext.jsx`.
- `server/`: Express REST API. Routes, controllers, Mongoose models, and middleware are separated under `server/src/`.
- `docs/`: project handoff and design/development notes.
- `client/.env.example`, `server/.env.example`: safe templates; never put real credentials in these or commit `.env` files.

## Module 1 screens and ownership

- FR01 registration: Raofun. Registration and Google sign-in share `/register`.
- FR02 login: Sahmina. Login remains a separate `/login` screen; Google sign-in is shared between the account screens.
- FR03 food listing: Raofun.
- FR04 food information: Raofun.
- FR05 pickup scheduling: Sahmina.
- Dashboard/history are supporting screens, not extra Module 1 features.

Each feature page should remain independently understandable and have a clear route. Coordinate before editing shared files such as `App.jsx`, auth context/components, API service, listing models, or shared routes/controllers.

## API and data boundary

Pages should call the API through `client/src/services/api.js`; do not add direct database access in the browser. The server owns validation, authorization, persistence, and Google credential verification. User documents must remain isolated by authenticated user identity; never trust a client-supplied owner ID. Before changing shared API contracts, routes, models/schemas, or database behavior, explain the proposed change and ask Raofun for approval. Do not block independent page/UI work while waiting.

## Development workflow

1. Confirm the current directory, branch, and `git status` before edits. Preserve unrelated user changes.
2. Work on the assigned feature branch (`dev/raofun` for Raofun; Sahmina uses her own branch). Never commit or push unless explicitly asked.
3. Keep commits focused on the assigned feature. Agree on ownership before editing shared files; communicate endpoint/field changes before integrating.
4. Match the existing FoodBridge visual language. Use responsive layouts, clear focus/hover/disabled/error/loading states, reduced-motion support for animation, and semantic accessible controls. Prefer CSS animation over adding a library for small effects.
5. Keep forms API-backed, show useful errors, disable duplicate submissions, and never display success before the server confirms it.
6. Do not add packages unless needed; document why. Do not create tests or run a test suite unless the user asks. Use a production build only when asked to verify/build.
7. Summarize files changed, behavior, configuration needs, and any unresolved integration points. Keep `.env` and credentials private.

## Current handoff

On `dev/raofun`, the following features and foundations are completed and operational:
1. **Registration & Auth Flow (FR01)**: `client/src/pages/RegisterPage.jsx` and `client/src/pages/RegisterPage.css` with role cards, validation, show/hide password, and Google OAuth option. Gated navigation preserves destination paths (`state: { from: location }`).
2. **Community Feed & Layout (`HomeLayout.jsx` + `HomePage.jsx`)**: Glassmorphic layout with responsive sidebar/topbar. Centrally fetches public listings via `GET /api/listings/feed` and shares state through `<Outlet context={...} />`. Contextual sidebar shows "Create Listing" only when signed in.
3. **Timestamp Engine & Expired Sorting**: `formatPickupWindow()` supports flexible, same-day, and multi-day time windows. Expired listings automatically sort to the bottom and show an inactive "Pickup Expired" badge and disabled button.
4. **Backend Feed & Bangladeshi Seed Data**: `server/src/controllers/foodListingController.js` exposes public feed queries with `.lean()` and sanitized fields. `server/src/config/seedBangladeshiData.js` and `server/src/seed.js` provide 8 authentic Bangladeshi demo listings.
5. **Design Principles**: Forest Emerald (`#10b981`), warm amber accents (`#f59e0b`), dark slate headers (`#0f172a`), native CSS micro-animations with reduced-motion support, and zero direct client database access.

