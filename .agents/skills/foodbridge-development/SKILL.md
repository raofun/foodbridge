---
name: foodbridge-development
description: Continue feature work in the FoodBridge shared React, Express, and MongoDB project while respecting module ownership, API/database approval boundaries, free hosting goals, and Git collaboration workflow.
---

# FoodBridge development skill

Use this skill whenever implementing, reviewing, or handing off code in the FoodBridge repository.

## 1. Load project context

Read root `AGENTS.md`, `GEMINI.md` when working in Antigravity, and `docs/PROJECT_HANDOFF.md`. Inspect the actual source and current `git status`; written notes can become stale. Treat the user's most recent instructions as authoritative.

## 2. Preserve collaborative ownership

Module 1 ownership is:

- Raofun: FR01 registration, FR03 food listing, FR04 food information.
- Sahmina: FR02 login, FR05 pickup scheduling.

Keep one page per feature and use `client/src/App.jsx` for URL routing. Work in the contributor's own feature branch. Before any edit, inspect branch and worktree state; never overwrite unrelated changes. Do not commit, push, merge, or deploy unless the user explicitly asks.

Shared files include route configuration, auth context/components, API service, listing flow integration, API routes/controllers, and models. Coordinate changes to those files and avoid parallel ownership conflicts.

## 3. Honor the shared API/database approval boundary

The project owner requires an explanation and approval before edits that change shared APIs, endpoint contracts, backend routes/controllers, MongoDB models/schemas, or persistence behavior. If such a change is necessary:

1. State the problem and identify the exact files and contract/data behavior that would change.
2. Explain why a page-only solution is insufficient.
3. Ask the user to approve the shared change and pause only that dependent work.
4. Continue unrelated frontend work where possible.

This approval rule does not block ordinary feature-page UI changes or authorized edits already requested by the user. Never invent an API shape when one already exists; inspect it first.

## 4. Frontend conventions

- React + Vite + React Router; regular CSS is the established styling choice.
- Put feature screens in `client/src/pages/`, page-specific styles alongside the page, reusable UI under `components/`.
- Use the shared `apiRequest` helper and `AuthContext`; don't put secrets or database logic in the browser.
- Build a clean, modern, colorful, responsive interface with restrained animation and useful visual hierarchy.
- Include accessible labels, semantic elements, keyboard operation, clear focus, loading, disabled, validation, empty, and error states. Respect reduced-motion preferences.
- For authentication, keep registration (`/register`) and login (`/login`) separate. FR01 includes email registration and Google sign-in on the same registration screen; FR02 keeps Google sign-in on the separate login screen.
- Do not claim Google sign-in works without correct client/server OAuth configuration and an available API.

## 5. Backend and data conventions

- Express owns validation, authorization, Google credential verification, and persistence.
- Keep endpoint declarations in routes, request/business logic in controllers, data shape in Mongoose models, and protected-route checks in middleware.
- Authenticate protected requests and scope reads/writes to the authenticated user. Never accept a client-provided user ID as proof of ownership.
- Keep the listing workflow in its existing sequence: FR03 creates a draft; FR04 saves food/preparation information; FR05 saves pickup and publishes the listing. Inspect current implementation before changing it.
- Avoid unnecessary architecture or packages. The intended low-cost deployment is Vercel for the frontend and a suitable free-tier API/database arrangement; confirm current provider support and limits before deployment work.

## 6. Git and handoff

Before edits, note current branch and `git status`. Keep each contribution focused and leave other people's changes untouched. Do not add credentials or generated `node_modules` to Git. When asked to finish, explain changed files, how the feature connects to existing APIs, required local environment variables, and what is still pending. If the user wants a commit/push, do so only after they explicitly request it and only on the agreed feature branch.

## 7. Current continuation point

The current task begins with the saved registration UI in `client/src/pages/RegisterPage.jsx` and `client/src/pages/RegisterPage.css` on `dev/raofun`. It uses the existing `/auth/register` and `/auth/google` API operations and shared auth flow; API and database files were not changed. The UI includes role cards, name/email/password fields, show/hide password, a password-length hint, error/loading feedback, the Google option, and the “Share → Connect → Nourish” impact line. Continue from this implementation; do not recreate the app or replace this screen without inspecting it.
