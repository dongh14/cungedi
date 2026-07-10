# Tech Stack Recommendation

## Recommendation Summary
For V1, the simplest robust stack is:

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Backend and database: Supabase
- Auth: Supabase Auth with email and password
- Maps, POI search, and geocoding: 高德地图 / Amap
- Deployment: Vercel
- Extraction approach: simple server-side URL fetch plus metadata parsing, always followed by user confirmation

This stack is a good fit for V1 because it keeps the number of moving parts low while still covering login, data storage, APIs, map display, and deployment in a beginner-friendly way.

Product direction note:
- The main V1 audience is Chinese users.
- The primary V1 map and geocoding provider should be 高德地图 / Amap.
- The main mainland-China discovery sources are 高德地图, 大众点评, 小红书, 抖音, and ordinary public web pages.
- Keep extraction realistic for 大众点评, 小红书, and 抖音 and treat them as best-effort sources in V1.
- Google Maps is optional support for overseas restaurants, not part of the core mainland-China V1 promise.

## Why This Stack

### 1. Next.js for the web app
Use Next.js as the main application framework.

Why:
- It handles frontend pages and backend endpoints in one project.
- It is widely used, well documented, and beginner friendly.
- It makes it easy to build a simple list view, map page, login flow, and URL submission flow without setting up a separate frontend and backend repo.

V1 fit:
- One codebase for UI and server logic
- Easy route structure for pages like `login`, `add`, `restaurants`, and `map`
- Good deployment experience on Vercel

### 2. Tailwind CSS for styling
Use Tailwind CSS for UI styling.

Why:
- It is easy to start with and avoids spending too much time on CSS architecture.
- It works very well with Next.js.
- It is fast for building a clean V1 interface with forms, cards, tables, and a map layout.

V1 fit:
- Simple login screens
- Restaurant list cards
- Confirmation and edit forms
- Responsive map and list layout

### 3. Supabase for backend and database
Use Supabase as the main backend platform.

Why:
- It combines Postgres database, authentication, APIs, and fileless backend setup in one product.
- It is much simpler for a beginner than setting up a separate Node backend, ORM, auth library, database hosting, and API deployment.
- It can scale beyond V1 without forcing an early rewrite.

V1 fit:
- Store users
- Store restaurants
- Store source URLs
- Store optional notes
- Store privacy settings
- Support user-specific access rules

### 4. Supabase Auth for email/password login
Use Supabase Auth with email and password for V1.

Why:
- It directly matches the V1 requirement.
- It is much simpler than adding Google login or WeChat login now.
- It works well with Next.js and Supabase database access patterns.

V1 fit:
- Sign up
- Log in
- Log out
- Protected user data

### 5. 高德地图 / Amap for maps, POI search, and geocoding
Use 高德地图 / Amap as the primary V1 provider for interactive maps, POI search, and address-to-coordinate lookup.

Why:
- It matches the product's mainland-China-first direction better than a global-first provider.
- It gives you one provider for map display, POI search, and geocoding in the core V1 market.
- It avoids introducing a second map provider for the main use case in V1.

V1 fit:
- Show saved restaurant pins on a simple map
- Convert address or city text into coordinates when possible
- Support China-first POI and location normalization flows later
- Still allow saving restaurants even when geocoding fails

### 6. Vercel for deployment
Use Vercel to deploy the web app.

Why:
- It is the easiest deployment path for a Next.js app.
- It reduces infrastructure setup and ongoing maintenance.
- It is friendly for quick iteration in V1.

V1 fit:
- Fast deployment
- Preview links for changes later
- Simple environment variable management

## Recommended V1 Architecture

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS

### Backend
- Next.js server routes for URL submission and extraction
- Supabase for database and auth

### Database
Use Supabase Postgres with a very small schema.

Suggested core tables:
- `profiles`
- `restaurants`

Suggested `restaurants` fields:
- `id`
- `user_id`
- `name`
- `city`
- `address`
- `cuisine`
- `source_url`
- `note`
- `privacy`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`

Notes:
- `latitude` and `longitude` should be optional.
- A restaurant must still be saveable without map coordinates.
- `privacy` can start as a simple enum like `private` or `public`.

## Recommended Extraction Approach For V1

### Keep extraction intentionally simple
Do not build a full scraping or AI extraction system in V1.

Recommended approach:
- User pastes a public URL.
- Server fetches the page and reads basic metadata and visible text.
- System tries to infer restaurant candidates from the page title, description, Open Graph metadata, and URL text.
- If the source seems to contain multiple restaurants, return multiple candidate entries.
- Always show a confirmation and editing step before save.

Official V1 source stance:
- Ordinary public web pages and 高德地图 links or sharing text are officially supported sources for V1.
- 大众点评 is an important China-first source and should be treated as best-effort unless reliable official API access becomes available.
- Xiaohongshu (RedNote) and Douyin are accepted on a best-effort basis only.
- 百度地图 may be accepted as a secondary best-effort input source, but V1 should not integrate a second map provider around it.
- Google Maps is optional support for overseas restaurants, not part of the core mainland-China V1 promise.
- TikTok and Instagram are future or best-effort sources, not part of the main V1 promise.

### Why this is the right V1 approach
- It matches the PRD requirement that users confirm and edit extracted data.
- It avoids overbuilding brittle source-specific scrapers too early.
- It keeps platform risk lower for 大众点评, Xiaohongshu (RedNote), Douyin, TikTok, and Instagram links where extraction quality can vary or public page content may be limited.
- It allows you to ship the workflow first, then improve extraction later.

Practical limitation for V1:
- 大众点评, Xiaohongshu (RedNote), and Douyin often do not expose page content as cleanly as ordinary public web pages or map links.
- V1 should not rely on full scraping, browser automation, login-required access, or platform-specific extraction systems.
- If extraction fails or returns weak results, the product should fall back to manual entry with `source_url` prefilled.

### What not to do in V1
- No headless browser scraping pipeline
- No queue system
- No AI agent flow for every URL
- No attempt to guarantee perfect extraction from social platforms
- No custom scraping infrastructure built specifically for Xiaohongshu (RedNote) or Douyin in V1

### Practical V1 rule
Treat extraction as a helper, not as the source of truth.

The source of truth is the user-reviewed restaurant record.

## Data Access And Privacy
Use Supabase Row Level Security so each user can access only their own restaurant records by default.

For V1:
- Private restaurants should only be visible to the owner.
- Public restaurants can be stored with a public flag now, even if broader discovery is added later.

This is the simplest secure model and fits the product direction.

## Why I Am Not Recommending A More Complex Stack

### Not recommended for V1
- Separate React frontend plus Express backend
- Prisma on top of Supabase
- Custom auth setup with NextAuth as the primary auth layer
- Microservices
- Docker-heavy local development
- Elasticsearch or advanced search infra
- Browser automation for extraction
- A dedicated AI pipeline for every pasted URL

Why not:
- These add complexity without helping the core V1 workflow enough.
- They increase setup burden for a beginner.
- They create more places for bugs before the product is even validated.

## Final Recommendation
If we optimize for simplicity, beginner-friendliness, and a realistic path to shipping V1, the best stack is:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- 高德地图 / Amap
- Vercel
- Server-side metadata extraction with manual confirmation

This gives the project one main app, one backend platform, one auth system, one database, one map provider, and one easy deployment path.

## References
- Next.js App Router docs: [nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure)
- Tailwind CSS with Next.js: [tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- Supabase Auth password docs: [supabase.com/docs/guides/auth/passwords](https://supabase.com/docs/guides/auth/passwords)
- Supabase Database overview: [supabase.com/docs/guides/database/overview](https://supabase.com/docs/guides/database/overview)
- Supabase Row Level Security: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Amap JS API docs: [lbs.amap.com/api/javascript-api/summary](https://lbs.amap.com/api/javascript-api/summary)
- Amap Web Service docs: [lbs.amap.com/api/webservice/summary](https://lbs.amap.com/api/webservice/summary)

## Source Notes
The specific recommendation to pair Next.js, Supabase, 高德地图 / Amap, and Vercel is an inference based on the V1 requirements in the PRD and the current official documentation for those tools. The extraction approach is also a product recommendation, not something taken from a single vendor source.
