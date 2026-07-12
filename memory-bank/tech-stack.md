# Tech Stack Recommendation

## Recommendation Summary
For V1, the simplest robust stack is:

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Backend and database: Supabase
- Auth: Supabase Auth with email and password
- Map rendering: 高德地图 / Amap JavaScript API
- POI search and geocoding: 高德地图 / Amap Web Service API
- Deployment: Vercel
- Extraction approach: simple server-side URL fetch plus metadata parsing, always followed by user confirmation

This stack fits V1 because it keeps the system small, keeps auth and data in one backend platform, uses one map provider for mainland-China use cases, and preserves a conservative review-before-save workflow.

Product direction note:
- The main V1 audience is Chinese users.
- The default V1 UI language should be Simplified Chinese.
- English can remain a later secondary option.
- The primary mainland-China V1 provider for maps, POI search, and geocoding should be 高德地图 / Amap.
- The main discovery sources are 高德地图、大众点评、小红书、抖音 and ordinary public web pages.
- 大众点评、小红书 and 抖音 remain best-effort sources in V1.
- 百度地图 is a secondary, best-effort input source only.
- Google Maps is optional overseas support, not the core mainland-China V1 promise.
- Keep one map provider in V1 for mainland-China flows.

## Why This Stack

### 1. Next.js for the web app
Use Next.js as the main application framework.

Why:
- It handles frontend routes and backend logic in one codebase.
- It is widely used and easy to iterate with.
- It works well for authenticated flows, source intake, review/confirmation, list, edit, setup, and map pages.

V1 fit:
- One codebase
- App Router pages for `login`, `sign-up`, `restaurants`, `map`, and `setup`
- Server actions and server-side helpers for extraction, save, and enrichment flows
- Smooth deployment on Vercel

### 2. Tailwind CSS for styling
Use Tailwind CSS for the UI layer.

Why:
- Fast iteration for mobile-first card layouts
- Low overhead for a small V1 product
- Works naturally with Next.js

V1 fit:
- Auth screens
- Source intake and review cards
- Manual create and edit forms
- Saved-place list
- Map page layout and city filter controls

### 3. Supabase for backend and database
Use Supabase as the main backend platform.

Why:
- It combines Postgres, auth, and API access in one platform.
- It reduces backend setup complexity.
- It supports owner-only access rules cleanly.

V1 fit:
- User accounts
- Place records
- Source URLs
- Notes
- Privacy flags
- Existing optional coordinate storage
- Row Level Security for owner-only data access

### 4. Supabase Auth for email/password login
Use Supabase Auth with email and password for V1.

Why:
- It directly matches the V1 requirement.
- It keeps the auth stack simple.
- It works well with Next.js SSR and protected routes.

V1 fit:
- Sign up
- Log in
- Log out
- Protected user-specific data

### 5. 高德地图 / Amap for V1 location flows
Use 高德地图 / Amap as the single V1 provider for mainland-China map rendering, POI search, and geocoding.

Why:
- It matches the China-first product direction better than a global-first provider.
- It allows one provider to power link normalization, POI lookup, geocoding, and map display.
- It avoids V1 complexity from maintaining multiple provider behaviors.

#### Amap Web Service API
Use the Web Service API on the server side for:
- POI search when a 高德 link or share text needs normalization
- Forward geocoding from address or city text to coordinates
- Optional POI fallback when forward geocoding is too weak for a save flow

Rules:
- Server-side Web Service keys or secret-bearing credentials must never be exposed to the browser.
- Requests using sensitive keys must stay in server-side code only.
- If Amap returns weak matches, errors, or quota-limit responses, the system must preserve the saved place without blocking the user.

#### Amap JavaScript API
Use the JavaScript API in the browser for:
- Rendering the interactive map
- Showing markers for saved places with coordinates
- Supporting basic zoom and simple city-based browsing

Rules:
- Only browser-safe client credentials should ever be used in the frontend.
- Do not embed server-side secret keys in client bundles.
- Keep the map experience simple in V1: no advanced clustering, no second provider, no complex viewport intelligence.

V1 fit:
- High-confidence mainland-China map rendering
- Simple marker display for saved places with coordinates
- One provider for geocoding and POI flows
- Graceful fallback when enrichment fails

### 6. Vercel for deployment
Use Vercel to deploy the app.

Why:
- Very low friction for Next.js deployment
- Easy environment variable management
- Good preview and iteration workflow

V1 fit:
- Fast deployment
- Simple environment variable setup
- Suitable for a small authenticated web app

## Recommended V1 Architecture

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- Amap JavaScript API on the map page only

### Backend
- Next.js server actions and server-side helpers
- Supabase for persistence and auth
- Amap Web Service client for server-side location enrichment and source normalization

### Database
Use Supabase Postgres with a very small schema.

Current V1-compatible schema direction:
- Keep `public.restaurants` unchanged during V1
- Keep existing `latitude` and `longitude` columns as optional storage
- Keep `category` as the six-value additive place classification
- Keep `cuisine` as temporary subtype storage during V1

Suggested core `restaurants` fields:
- `id`
- `user_id`
- `name`
- `city`
- `address`
- `category`
- `cuisine`
- `source_url`
- `note`
- `privacy`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`

Notes:
- `latitude` and `longitude` remain optional.
- A place must still be saveable without coordinates.
- `privacy` can remain a simple `private` / `public` field.
- No rename work is required before V1 completion.

## Recommended Extraction Approach For V1

### Keep extraction intentionally simple and conservative
Do not build a full scraping or AI extraction pipeline in V1.

Recommended approach:
- User pastes a public URL or sharing text.
- Server extracts the first valid URL from the intake.
- Server fetches public page metadata and visible text where available.
- System attempts conservative single-place extraction from structured data and strong page signals.
- System shows an editable confirmation step before save.
- If extraction is weak, ambiguous, or blocked, the app falls back to manual completion with the source URL preserved.

Official V1 source stance:
- Ordinary public web pages and 高德地图 links or share text are the official V1 sources.
- 大众点评 is important but best-effort unless reliable official API access appears later.
- 小红书 and 抖音 are best-effort only.
- 百度地图 is accepted only as a secondary, best-effort input source.
- Google Maps is optional overseas support.

Practical limitation for V1:
- Different categories and different source types will not perform equally well.
- Structured public pages may work better than socially gated or rate-limited sources.
- The system should prefer fallback over overconfident guessing.

### What not to do in V1
- No headless browser scraping pipeline
- No login-required source access
- No AI agent pipeline for every URL
- No provider explosion across multiple mainland-China map SDKs
- No second map provider for the core V1 mainland-China flow

### Practical V1 rule
Treat extraction as a helper, not the source of truth.

The source of truth is the user-reviewed place record.

## Location Reliability And Fallback Rules
- Save first, enrich second when coordinates are missing.
- If forward geocoding fails, preserve the saved record without coordinates.
- If POI search fallback fails, preserve the saved record without coordinates.
- If Amap is unavailable, returns quota errors, or returns weak results, the app should degrade gracefully rather than block save flows.
- No-coordinate places must remain clearly usable in the saved list.
- V1 should not add a second provider just to patch individual Amap failure cases.

## Data Access And Privacy
Use Supabase Row Level Security so each user can access only their own place records by default.

For V1:
- Owner-only access remains the default
- `public` stays a stored flag only
- No public discovery feature is required

## Why I Am Not Recommending A More Complex Stack

### Not recommended for V1
- Separate frontend and backend repos
- Prisma on top of Supabase
- NextAuth as the main auth layer
- Multiple map providers for mainland-China use cases
- Browser automation for extraction
- Queue-heavy enrichment architecture
- Complex AI extraction infrastructure

Why not:
- These add complexity without improving the core V1 enough.
- They increase failure modes before the product is fully validated.
- They conflict with the goal of keeping V1 conservative and easy to reason about.

## Final Recommendation
If we optimize for simplicity, compatibility with the current repo, and a realistic path to V1, the best stack is:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Amap Web Service API
- Amap JavaScript API
- Vercel
- Conservative server-side extraction with explicit review before save

This gives the project one main app, one backend platform, one auth system, one database, one mainland-China map provider, one geocoding/POI provider, and one clear deployment path.

## References
- Next.js App Router docs: [nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure)
- Tailwind CSS with Next.js: [tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- Supabase Auth password docs: [supabase.com/docs/guides/auth/passwords](https://supabase.com/docs/guides/auth/passwords)
- Supabase Database overview: [supabase.com/docs/guides/database/overview](https://supabase.com/docs/guides/database/overview)
- Supabase Row Level Security: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Amap JavaScript API docs: [lbs.amap.com/api/javascript-api/summary](https://lbs.amap.com/api/javascript-api/summary)
- Amap Web Service docs: [lbs.amap.com/api/webservice/summary](https://lbs.amap.com/api/webservice/summary)

## Source Notes
The recommendation to use Next.js, Supabase, Vercel, and 高德地图 / Amap is an implementation recommendation derived from the current V1 product requirements. The separation between Amap Web Service usage and Amap JavaScript usage reflects the current intended architecture, not proof that those integrations are already implemented in the repository.
