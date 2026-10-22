# Antigravity / Gemini project guide

Before acting, read [`AGENTS.md`](AGENTS.md), [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md), and [`.agents/skills/foodbridge-development/SKILL.md`](.agents/skills/foodbridge-development/SKILL.md). Treat these as project context, while the user's latest request always takes precedence.

Continue the existing FoodBridge project in this repository; do not scaffold a replacement. The current task is the Module 1 registration screen (FR01) with email registration and Google sign-in together, while login remains a separate screen. Continue from the saved files `client/src/pages/RegisterPage.jsx` and `client/src/pages/RegisterPage.css` on branch `dev/raofun`.

Respect the feature ownership in the handoff: Raofun owns FR01, FR03 food listing, and FR04 food information; Sahmina owns FR02 login and FR05 pickup scheduling. Each feature has its own page. Avoid overlapping edits to shared integration files.

Important collaboration rule: the user specifically wants an explanation and approval before shared API, route-contract, database/model, or persistence changes. If the next necessary step touches those shared boundaries, explain the exact files and behavior you propose to change, then wait for the user's approval. Continue independently on frontend-only tasks. Do not ask again for approval to edit ordinary feature-page UI.

The app is intended for free hosting, with the React frontend on Vercel and MongoDB for persistence. Keep the Express API structure and check current provider free-tier and serverless constraints before implementing deployment-specific changes. Never commit secrets. Do not commit, push, merge, or deploy unless asked. Preserve existing changes and report where work stopped, what is already working, and the next concrete step.
