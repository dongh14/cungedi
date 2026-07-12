# Tech Stack Recommendation

## Recommendation Summary
For V1, the simplest robust stack is:

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Backend and database: Supabase
- Auth: Supabase Auth with email and password
- Map rendering: MapLibre GL JS
- Basemap data and hosting: OpenStreetMap-derived vector data packaged as self-hosted Protomaps PMTiles
- Deployment: Vercel
- Extraction approach: simple server-side URL fetch plus metadata parsing, always followed by user confirmation

This stack fits V1 because it keeps the system small, keeps auth and data in one backend platform, avoids paid or metered map dependencies, and preserves a conservative review-before-save workflow.

Product direction note:
- The main V1 audience is Chinese users.
- The default V1 UI language should be Simplified Chinese.
- English can remain a later secondary option.
- The V1 map stack should be open-source and self-hosted where practical.
- The main discovery sources are 高德地图、大众点评、小红书、抖音 and ordinary public web pages.
- 大众点评、小红书 and 抖音 remain best-effort sources in V1.
- 百度地图 is a secondary, best-effort input source only.
- Google Maps is optional overseas support, not the core mainland-China V1 promise.
- Do not use Google Maps, Apple Maps, 高德, or Mapbox for map rendering in V1.
- Do not use OpenStreetMap public tile servers as the production tile backend.

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

### 5. MapLibre + PMTiles for V1 location browsing
Use MapLibre GL JS for rendering and a self-hosted PMTiles basemap built from OpenStreetMap-derived vector data.

Why:
- It avoids paid or metered production map APIs in V1.
- It gives the app a portable, vendor-light basemap architecture.
- It matches the product requirement that V1 only needs country / region / city context plus approximate saved-place markers, not navigation-grade POI precision.

#### MapLibre GL JS
Use MapLibre GL JS in the browser for:
- Rendering the interactive map
- Showing markers for saved places
- Supporting basic zoom and simple city-based browsing

Rules:
- Keep the V1 map experience simple: no advanced clustering, no navigation features, and no second rendering provider.
- Approximate marker placement must be visually or textually labeled in the UI.

V1 fit:
- Open-source interactive map rendering
- Simple marker display for exact and approximate saved places
- No dependency on paid map tiles or metered JavaScript map SDKs
- A straightforward path to city filtering and no-coordinate fallback UI

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
- MapLibre GL JS on the map page only

### Backend
- Next.js server actions and server-side helpers
- Supabase for persistence and auth
- A lightweight coordinate fallback layer for conservative city-level or region-level map placement when exact coordinates are unavailable

### Map Data
- Self-hosted PMTiles basemap
- OpenStreetMap-derived vector data prepared ahead of time
- No production reliance on public OSM tile servers

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
- No self-hosted Nominatim
- No paid geocoding provider
- No production use of public OSM tile servers
- No navigation-grade coordinate claims when only approximate placement is available

### Practical V1 rule
Treat extraction as a helper, not the source of truth.

The source of truth is the user-reviewed place record.

## Location Reliability And Fallback Rules
- Save first, enrich second when coordinates are missing.
- If exact coordinates are unavailable, preserve the saved record without coordinates or use a clearly marked conservative city-level or region-level fallback when appropriate for browsing.
- Never invent exact POI coordinates from weak evidence.
- No-coordinate places must remain clearly usable in the saved list.
- Approximate placement is acceptable for V1 map browsing as long as the UI clearly marks it as approximate.

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
- MapLibre GL JS
- Self-hosted PMTiles built from OpenStreetMap-derived data
- Vercel
- Conservative server-side extraction with explicit review before save

This gives the project one main app, one backend platform, one auth system, one database, one open map-rendering stack, and one clear deployment path.

## References
- Next.js App Router docs: [nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure)
- Tailwind CSS with Next.js: [tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- Supabase Auth password docs: [supabase.com/docs/guides/auth/passwords](https://supabase.com/docs/guides/auth/passwords)
- Supabase Database overview: [supabase.com/docs/guides/database/overview](https://supabase.com/docs/guides/database/overview)
- Supabase Row Level Security: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- MapLibre GL JS docs: [maplibre.org/maplibre-gl-js/docs](https://maplibre.org/maplibre-gl-js/docs)
- PMTiles docs: [docs.protomaps.com/pmtiles](https://docs.protomaps.com/pmtiles/)

## Source Notes
The recommendation to use Next.js, Supabase, Vercel, MapLibre, and self-hosted PMTiles is an implementation recommendation derived from the current V1 product requirements. The approximate-marker and city-level fallback guidance reflects the current intended architecture, not proof that those integrations are already implemented in the repository.
