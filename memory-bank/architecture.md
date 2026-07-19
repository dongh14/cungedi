# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 12, the first validated reversible `存个地` generalization migration step, the validated Step 3A accommodation-extraction expansion, the validated Step 3B attraction-extraction expansion, the validated Step 3C shopping-extraction expansion, the validated Step 3D entertainment-extraction expansion, the validated Step 3E generic-place extraction expansion, the validated MapLibre foundation step, the validated PMTiles basemap step, the validated city-level coordinate fallback step, the validated marker rendering step, the validated city filtering and no-coordinate polish step, the validated V1 map polish step, the validated Step 13 local place search checkpoint, the validated city normalization checkpoint, the validated map search interaction polish checkpoint, the validated map clustering checkpoint, the validated map place-detail interaction checkpoint, the validated user collections checkpoint, the validated V1 add-place flow checkpoint, the validated V1 extraction architecture checkpoint, and the validated Google Maps extractor V2 checkpoint.

It does not include Step 13 multi-candidate extraction or later architecture yet.

The product is currently paused before Step 13 so the restaurant-only app can be generalized into `存个地`, a Chinese-first personal place collection app.

## Validated Google Maps Extractor V2 Checkpoint
- Google Maps extraction now uses URL-only deterministic parsing; it does not scrape Google Maps pages or call Google APIs, external APIs, or AI services.
- The parser supports `q`, `query`, `/maps/search/`, and `/maps/place/` name sources.
- The parser extracts explicit `@latitude,longitude` coordinates only when present and validates latitude and longitude ranges before returning them.
- The parser extracts an explicit `address` parameter when present and does not infer address from a place name.
- Category, city, ratings, and reviews remain empty unless a future extractor explicitly supports them; Google Maps V2 does not guess these fields.
- The source detector and extractor interface remain unchanged.
- The normalized result now carries `extractionStatus`, `confidence`, and `extractedFields` so partial URL results can be distinguished from unavailable results.
- The review flow displays the information found and the fields that still require manual input, while keeping the existing editable review form.
- The Supabase schema, saved place flow, collections system, map rendering, marker clustering, map search, city filtering, city normalization, and coordinate resolver remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Extraction tests passed (`19` tests).

## Validated V1 Server-Side Website Fetching Checkpoint
- A dedicated website URL fetching layer now validates submitted URLs before allowing only `http` and `https` requests.
- The server-side flow fetches bounded HTML for the single submitted URL and handles invalid URLs, timeouts, failed responses, oversized responses, and non-HTML responses without breaking the review flow.
- The existing Website Extractor now receives fetched HTML through the existing extraction architecture and can parse page metadata and supported schema.org JSON-LD fields.
- The extraction flow is now: URL → source detection → fetcher → extractor → review → save.
- The review UI shows the detected source, extraction status, extracted fields, and fetch failure messages while keeping all fields manually editable.
- The fetch layer does not crawl links, execute scripts, call external APIs, use AI extraction, or persist raw HTML.
- The Supabase schema, saved place creation flow, Google Maps extractor behavior, map rendering, marker clustering, map search, city filtering, city normalization, coordinate resolver, and collections system remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Extraction tests passed (`29` tests).

## Validated V1 Source-Merging Checkpoint
- A pure `place-draft-merge` helper now combines multiple normalized extraction results into one review draft without writing data.
- Multiple sources can enrich one draft, including Google Maps and Website results, before the existing save confirmation.
- The merged draft carries field-level source attribution so the review UI can show whether a value came from Google Maps, Website, or manual editing.
- Automatic field priority is preserved for structured website data, Google Maps values, website metadata, and fallback values; explicit manual edits remain supported as review overrides.
- The review page now supports adding another source and merging its extraction result into the current draft.
- The review form now uses merged name, city, address, category, and notes values while keeping the fields editable.
- Missing fields remain empty, are shown for manual review, and no values are invented.
- The Supabase schema, saved-place creation behavior, map system, collections system, and existing extractor interfaces remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused extraction tests passed (`37` tests).

## Validated AI Enrichment Architecture Checkpoint
- A provider-independent AI enrichment interface now accepts the merged place draft, extracted source data, source URLs, and missing fields.
- The interface returns proposal-only enrichment fields such as normalized name, city, category, address, notes summary, confidence, reasoning summary, and proposed fields.
- AI enrichment is suggestion-only; the deterministic extraction and source-merging result remains the primary draft.
- A placeholder provider is registered for the current V1 boundary. It makes no network calls and returns `unavailable` with a clear not-configured message.
- Explicit AI result states are supported: `unavailable`, `no_changes`, `suggestions_available`, and `failed`.
- A pure acceptance helper applies only explicitly accepted suggestions. Manual values remain protected, deterministic values are unchanged until acceptance, and accepted fields receive `ai_suggestion` attribution.
- The review page includes a non-functional AI enrichment section that can display unavailable status, proposal confidence, proposed fields, and future accept/reject controls.
- AI output never writes directly to Supabase, and no external AI API integration or API keys were added.
- The extraction architecture, Google Maps extractor, Website Extractor, source merging, saved place schema, map system, and collections system remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused enrichment/extraction tests passed (`42` tests).

## Validated V1 Final Review And Save Experience Checkpoint
- A final review preview card now presents the merged draft before save, including confirmed name, category, city, address, phone, and notes.
- Source badges and field-level attribution show whether values came from Google Maps, Website, Manual input, or a future AI suggestion.
- Conflicting source values are surfaced for user confirmation instead of being hidden.
- Missing optional information is labeled clearly; optional fields do not block saving, and users can save anyway or continue editing.
- The review page now supports selecting one or more existing collections before save.
- Inline collection creation is available from the review page and reuses the existing collection creation action.
- After the place is created, selected memberships are inserted through the existing `restaurant_collections` join-table architecture; the place schema and collection data model are unchanged.
- Manual edits remain the highest-priority values in the final review.
- The extraction architecture, source merging, AI enrichment architecture, Supabase place schema, map system, and collections data model remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`42` tests).

## Validated V1 Place Discovery Checkpoint
- A reusable `PlaceCard` component now presents saved places with optional images, a clean no-image placeholder, name, city, category, collection badges, source host, and a link to the existing place detail/edit route.
- The authenticated `/dashboard` now serves as the simple home discovery view for recently saved places and existing collection highlights.
- Recent places remain ordered by saved time; no recommendation algorithm or favorite ranking was added because no favorite field exists in the saved-place data.
- RLS-scoped discovery queries now load the current user's saved places, collection memberships, and collection counts through the existing `restaurant_collections` join-table architecture.
- Image handling remains optional and presentation-only for this checkpoint; the existing saved-place schema is unchanged.
- The extraction architecture, Google Maps extractor, Website Extractor, source merging, AI enrichment architecture, Supabase schema, collections data model, and map system remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`14` tests).

## Validated V1 Extraction Architecture Checkpoint
- The local source detection layer identifies `unknown`, `website`, `google_maps`, `xiaohongshu`, `douyin`, `instagram`, and `tiktok` source types from a submitted URL.
- The extractor interface defines `sourceType`, `canHandle()`, and `extract()` so future source implementations can be added without changing the save flow.
- The extractor registry selects the registered extractor for the detected source type.
- Placeholder extractors exist for Google Maps, Website, Xiaohongshu, and Douyin. Each returns an explicit not-implemented result and does not pretend to extract data.
- The normalized extraction result type carries name, category, city, address, latitude, longitude, source URL, notes, confidence, and extraction status.
- The existing review flow now displays the detected source and extraction availability status.
- Manual entry remains supported through the existing review-before-save flow.
- No external APIs, scraping, or AI extraction were added.
- The Supabase schema, saved place creation behavior, map rendering, marker clustering, map search, city filtering, city normalization, location resolver, and collections system remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused extraction/source-intake tests passed.

## Validated V1 Map Polish
- The existing local PMTiles and MapLibre architecture now exposes route-level, map-load, place-load, empty, city-empty, and asset-failure presentation states in Chinese.
- The server-side RLS-scoped place query, pure location resolution, and reusable marker layer remain unchanged; this checkpoint adds only local client-side place search composed with the existing city filtering flow.
- The local search and city filter remain browser-side controls over already loaded saved-place values, with no server-side search service added.
- Marker popups remain touch-compatible and now render as compact cards containing the place name, city, optional category, and approximate city-level warning when relevant.
- The authenticated `/map` experience was manually validated at `390x844` with no horizontal scrolling and with bottom navigation unaffected.
- No schema change, Supabase coordinate write, external API, geocoding, clustering, or map editing is part of this checkpoint.

## Validated City Normalization Checkpoint
- The local map system now uses one conservative city normalization layer for city filtering, local search matching, and location resolution.
- Normalization happens only during comparison, filtering, and resolution; original stored `city` values are not rewritten.
- The normalization layer supports only explicit Chinese and English aliases for cities present in the local known city dataset.
- Unknown city values stay unchanged for comparison and remain unresolved for approximate location fallback.
- The server-side RLS-scoped place query, marker rendering flow, and saved-place presentation remain unchanged apart from normalized comparisons.
- No schema change, saved-data rewrite, external API, or geocoding is part of this checkpoint.

## Validated Map Search Interaction Polish Checkpoint
- The local `/map` search UI now supports selecting a rendered result to focus that place on the map.
- Selecting a result triggers client-side `flyTo` map movement, applies an active marker state, and opens the corresponding popup automatically.
- The local search UI now includes a clear-search action.
- The server-side RLS-scoped place query, database schema, local city filtering behavior, coordinate resolver, and marker generation pipeline remain unchanged.
- This checkpoint adds interaction state on top of the existing filtered marker set and does not introduce any external API, geocoding, clustering, or recommendation behavior.

## Validated Map Clustering Checkpoint
- Marker clustering now sits on top of the existing marker data flow in the local MapLibre layer.
- Clustering is map-only and does not change the Supabase schema, saved place data, or owner-scoped query behavior.
- Clusters group nearby markers at lower zoom levels and expand back into individual markers as the user zooms in.
- Clicking or tapping a cluster zooms into that area to reveal more markers.
- Exact and approximate marker behavior remains unchanged after cluster expansion.
- Normal marker popup behavior remains unchanged, and search selection still focuses and opens the correct marker popup.

## Validated Map Place-Detail Interaction Checkpoint
- Marker popups now render as clearer place preview cards rather than simple location indicators.
- The popup now shows the saved place name, city, optional category, optional address, and exact or approximate location state.
- A touch-friendly `查看详情` action now routes to the existing place detail or edit path.
- Search selection still focuses the intended marker and opens the correct popup.
- Marker clustering behavior, city filtering, search behavior, location normalization, coordinate resolution, Supabase schema, and saved data remain unchanged.

## Validated User Collections Checkpoint
- A user-scoped collections feature now exists with a dedicated `collections` table and a `restaurant_collections` join table.
- Owner-only RLS rules now protect both collections and collection memberships.
- A saved place can belong to multiple collections, and removing a collection membership does not delete the saved place itself.
- A `/collections` page now provides minimal collection viewing and creation.
- The existing place edit page now supports adding and removing collection memberships.
- Map rendering, marker clustering, map search, city filtering, city normalization, location resolution, coordinate handling, and the saved-place schema remain unchanged.

## Validated V1 Add-Place Flow Checkpoint
- `/restaurants/new` and `/restaurants/review` now provide an improved save flow that routes both source-led and manual add flows through a review step before persistence.
- Source URL is now the primary entry point for the add flow.
- Source intake, review draft shaping, and final saved-place creation are separated into distinct layers so later extraction work can slot in without rewriting the save path.
- Source recognition is local-only and records normalized source identity without adding external APIs, AI extraction, or scraping.
- Manual entry now also passes through the same review layer before save.
- The Supabase saved-place schema remains unchanged.
- Marker rendering, clustering, map search, city filtering, city normalization, location resolution, and coordinate handling remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run build` passed.
- `npm run lint` passed.
- Focused add-place tests passed.

## Current Structure

### Root
- `app/`: Next.js App Router application files
- `public/`: static public assets generated with the base app
- `memory-bank/`: product and planning documents
- `supabase/`: database migration files for the Supabase project
- `package.json`: project metadata and scripts
- `package-lock.json`: locked dependency versions
- `tsconfig.json`: TypeScript configuration
- `next.config.ts`: Next.js configuration
- `postcss.config.mjs`: PostCSS configuration used by Tailwind CSS
- `next-env.d.ts`: Next.js TypeScript environment types
- `.gitignore`: ignored files for the repository
- `.env.example`: sample public Supabase environment variables plus the optional local PMTiles public path
- `README.md`: current project overview and available scripts

### App Router Files
- `app/layout.tsx`: root HTML layout, shared metadata, and global document setup
- `app/page.tsx`: Step 6 public home page in the new shared shell
- `app/sign-up/page.tsx`: Step 6 sign-up page using the shared auth presentation
- `app/login/page.tsx`: Step 6 login page using the shared auth presentation
- `app/dashboard/page.tsx`: Step 6 protected overview page inside the signed-in app shell
- `app/setup/page.tsx`: Step 6 Supabase setup page in the shared public shell
- `app/restaurants/new/page.tsx`: protected add-place entry page that now prioritizes source URL intake while still exposing manual entry
- `app/restaurants/review/page.tsx`: protected review-before-save page for both source-led and manual add flows
- `app/restaurants/page.tsx`: Step 8 protected full saved-list page
- `app/collections/page.tsx`: protected collections page for viewing current-user collections and creating new ones
- `app/restaurants/[id]/edit/page.tsx`: Step 9 protected restaurant edit page
- `app/restaurants/actions.ts`: server actions for create, update, source-intake flow control, manual review flow control, review-confirmation save handling, collection creation, and collection membership updates
- `app/map/page.tsx`: protected map page that loads the current user's RLS-scoped saved places and delegates local place search, local city filtering, marker rendering, and no-coordinate summary presentation to the client map browser
- `app/map/loading.tsx`: route-level mobile-friendly loading skeleton for the protected map page while place data is loading
- `app/dev-fixtures/layout.tsx`: development-only route guard for deterministic extraction fixture pages
- `app/dev-fixtures/extraction/*`: development-only deterministic fixture pages used to manually validate extraction behavior through the real source-intake and review flow
- `app/auth/actions.ts`: Step 3 server actions for auth flows
- `app/globals.css`: global styles and Tailwind import
- `app/favicon.ico`: site icon

### Shared UI Components
- `components/app-shell.tsx`: protected application shell with desktop and mobile navigation
- `components/auth-card.tsx`: shared card for sign-up and login forms
- `components/navigation.ts`: shared navigation definitions and active-route helpers
- `components/placeholder-card.tsx`: reusable content card for Step 6 placeholder pages
- `components/public-shell.tsx`: public-page shell for home, auth, and setup pages
- `components/category-field.tsx`: reusable category selector that keeps the selected category first and now renders the active subtype field directly below it
- `components/restaurant-form-card.tsx`: reusable manual-entry card that now routes through review before save
- `components/restaurant-form-fields.tsx`: shared create and review form fields used by both the source-led and manual review-before-save flows, including category-specific subtype behavior
- `components/cuisine-field.tsx`: reusable subtype picker used by create, review confirmation, and saved-record edit forms while the database still stores the value in `cuisine`
- `components/restaurant-list.tsx`: Step 8 reusable saved-list summary and list wrapper
- `components/restaurant-list-card.tsx`: Step 8 reusable saved-restaurant card
- `components/restaurant-edit-form-card.tsx`: Step 9 reusable restaurant edit form card
- `components/collection-list.tsx`: reusable current-user collection list for the collections page
- `components/collection-membership-card.tsx`: reusable collection membership management card on the existing place edit page
- `components/extraction-preview-card.tsx`: existing extraction-result card retained for the broader extraction architecture outside the local-only V1 add-place flow checkpoint
- `components/extraction-confirmation-card.tsx`: reusable review-before-save form that lets users edit, complete, and save draft place data
- `components/source-intake-card.tsx`: source-first intake card for `/restaurants/new`
- `components/source-review-card.tsx`: local source-recognition and extraction-availability summary card for `/restaurants/review`
- `components/maplibre-foundation.tsx`: reusable client-side MapLibre component that initializes the local PMTiles-backed basemap, manages the current clustered marker layer, supports search-selection map focus and popup opening, preserves basic zoom controls, and shows Chinese loading and asset-fallback states
- `components/map-marker-layer.ts`: reusable client-side MapLibre marker and popup-card layer for serializable resolved place-marker data, including active-marker state, richer place preview content, detail navigation, and cluster click-to-zoom behavior
- `components/map-browser.tsx`: client-side composition layer that applies local place search plus the selected city filter before deriving map markers, exposes search-result selection and clear-search UI, and presents place-load, empty, city-empty, and no-coordinate states
- `components/map-city-filter.tsx`: refined compact mobile-friendly city selector UI for the map browser
- `components/site-brand.tsx`: reusable product brand block
- `components/surface-card.tsx`: shared rounded card wrapper used across the UI

### Supabase Setup Files
- `lib/supabase/env.ts`: reads and validates public Supabase environment variables
- `lib/supabase/client.ts`: creates a minimal Supabase client instance for setup checks
- `lib/supabase/health.ts`: performs the Step 2 Supabase connection status check
- `lib/supabase/server.ts`: creates a cookie-aware server Supabase client for auth flows

### Auth Utilities
- `lib/auth/require-user.ts`: shared helper for protected pages that require a signed-in user
- `lib/utils.ts`: small class-name helper for reusable UI composition

### Map Utilities
- `lib/map/map-style.ts`: local MapLibre style factory and default view config for the validated PMTiles vector basemap
- `lib/map/map-style.test.js`: focused regression test confirming the local PMTiles style structure, same-origin config handling, no external tile/sprite/glyph hosts, and fresh objects per instance
- `lib/map/pmtiles-config.ts`: local PMTiles public-path resolution and fallback message helpers
- `lib/map/pmtiles-protocol.ts`: reusable global PMTiles protocol registration layer for MapLibre
- `lib/map/city-centers.ts`: small local approximate city-center dataset with conservative city-name normalization helpers for shared comparison and resolution
- `lib/map/place-location.ts`: pure resolver that prioritizes valid stored coordinates and otherwise returns a known approximate city center without writing data
- `lib/map/place-location.test.js`: focused regression test for exact-coordinate priority, conservative normalization, Chinese and English alias handling, approximate city fallback, unresolved cases, and invalid-coordinate rejection
- `lib/map/place-markers.ts`: pure conversion from saved-place records to marker data through `resolvePlaceLocation()`, skipping unresolved records
- `lib/map/place-markers.test.js`: focused regression test for exact marker data, approximate city fallback marker data, and unresolved-place skipping
- `lib/map/place-filter.ts`: pure city-option, shared normalized search-and-city filtering, and filtered map-display helpers that resolve selected records and summarize unresolved reasons
- `lib/map/place-filter.test.js`: focused regression test for local search matching, normalized search-plus-city filtering, unresolved-place summary, and exact versus approximate markers after filtering
- `lib/map/marker-clusters.ts`: pure helper for grouping nearby markers at lower zoom levels and expanding them back into individual markers at higher zoom levels
- `lib/map/marker-clusters.test.js`: focused regression test for clustering, cluster expansion, and preservation of exact versus approximate marker metadata through clustering
- `lib/map/place-popup.ts`: pure helper for marker-popup preview content, exact-versus-approximate location labels, and the existing detail-route target
- `lib/map/place-popup.test.js`: focused regression test for popup preview fields, exact-versus-approximate labels, and detail-route generation
- `lib/map/place-selection.ts`: pure helper for search-selectable marker data and active-marker synchronization against the current rendered marker set
- `lib/map/place-selection.test.js`: focused regression test for preserved saved-city display text in results, active-marker lookup, and active-selection reset when the rendered marker set changes
- `lib/map/map-page-state.ts`: pure helper for map place-loading, error, empty, city-empty, and ready presentation states
- `lib/map/map-page-state.test.js`: focused regression test for map loading, error, empty, and city-empty state selection

### Restaurant Utilities
- `lib/restaurants/constants.ts`: shared category, subtype-suggestion, cuisine, and privacy definitions for the current restaurant-first place form
- `lib/restaurants/types.ts`: shared TypeScript types for restaurant inserts, list and edit items, collections, and the minimal map-read item
- `lib/restaurants/queries.ts`: owner-only RLS-scoped restaurant and collection read helpers for the full saved list, collections page, edit route, collection membership state, and map marker data
- `lib/restaurants/collection-memberships.ts`: pure helper for deduping selected collection ids and diffing join-table membership updates
- `lib/restaurants/collection-memberships.test.ts`: focused regression test for collection selection normalization, add diffing, and membership removal without place deletion
- `lib/restaurants/source-url.ts`: generic Step 7 source URL extraction utility for direct links and sharing text
- `lib/restaurants/source-url.test.ts`: focused automated tests for URL extraction behavior
- `lib/restaurants/source-intake.ts`: local source-intake helper for source URL normalization, domain recognition, support-level labeling, and intake state creation
- `lib/restaurants/source-intake.test.ts`: focused tests for valid URL intake, invalid input handling, and local source recognition
- `lib/restaurants/extraction-architecture.ts`: source detector, normalized extraction result type, extractor interface, extractor registry, placeholder extractors, and deterministic Google Maps V2 URL parser
- `lib/restaurants/extraction-architecture.test.ts`: focused tests for source detection, extractor selection, Google Maps URL parsing, coordinate validation, extraction metadata, and placeholder results
- `lib/restaurants/extraction-types.ts`: Step 11 shared extraction result, candidate, page-type, field-evidence, diagnostics, and fetch-result types
- `lib/restaurants/source-classification.ts`: Step 11 source-kind classification and support-level rules
- `lib/restaurants/source-fetch.ts`: Step 11 bounded source fetching with timeout, response-size, and content-type limits
- `lib/restaurants/source-html.ts`: Step 11 metadata, visible-text-segment, and structured-data parsing helpers
- `lib/restaurants/page-type.ts`: Step 11 page-type classification for single-restaurant, directory/list, generic, and unknown pages
- `lib/restaurants/field-validation.ts`: Step 11 strict restaurant-field validation and structured-address formatting helpers
- `lib/restaurants/cuisine-inference.ts`: Step 11 conservative cuisine inference helper with low-confidence blank behavior
- `lib/restaurants/accommodation-inference.ts`: Step 3A conservative accommodation subtype inference and strong lodging structured-data helpers
- `lib/restaurants/attraction-inference.ts`: Step 3B conservative attraction subtype inference and strong attraction structured-data helpers
- `lib/restaurants/shopping-inference.ts`: Step 3C conservative shopping subtype inference and strong shopping structured-data helpers
- `lib/restaurants/entertainment-inference.ts`: Step 3D conservative entertainment subtype inference and strong entertainment structured-data helpers
- `lib/restaurants/generic-place-inference.ts`: Step 3E minimal and conservative generic-place subtype inference for strong `其他` candidates
- `lib/restaurants/source-extraction.ts`: Step 11, Step 3A, Step 3B, Step 3C, Step 3D, and Step 3E orchestration for shared fetching, parsing, validation, category-aware candidate acceptance, diagnostics, and fallback decisions
- `lib/restaurants/source-extraction.test.ts`: focused Step 11, Step 3A, Step 3B, Step 3C, Step 3D, and Step 3E regression tests for restaurant, accommodation, attraction, shopping, entertainment, and generic-place extraction behavior
- `lib/restaurants/review-form.ts`: local add-flow helper for shaping review draft values, listing missing review fields, and converting review data into saved-place input
- `lib/restaurants/review-form.test.ts`: focused tests for review draft shaping, manual overrides, missing-field reporting, and conversion from review data into saved-place input
- `lib/restaurants/record-payloads.ts`: shared insert and update payload builders that keep `category` threaded through current save flows while `cuisine` remains the temporary subtype storage column
- `lib/restaurants/constants.test.ts`: focused tests for allowed categories, subtype field labels, suggestion sets, and subtype-category compatibility
- `lib/restaurants/record-payloads.test.ts`: focused tests for category persistence in save and edit payloads

### Supabase Database Files
- `supabase/migrations/20260709120000_create_restaurants_table.sql`: Step 4 migration that creates the initial V1 `restaurants` table, indexes, and `updated_at` trigger
- `supabase/migrations/20260709130000_enable_restaurants_rls.sql`: Step 5 migration that enables RLS and adds owner-only access policies for restaurant records
- `supabase/migrations/20260711110000_add_restaurant_category.sql`: validated reversible migration that adds `category`, backfills existing rows to `美食`, enforces the six allowed values, and leaves current RLS behavior unchanged
- `supabase/migrations/add_restaurant_category_migration.test.ts`: focused regression test for the category migration contract
- `supabase/migrations/20260714090000_add_collections.sql`: validated migration that adds user-scoped collections, the restaurant-to-collection join table, update timestamps, and owner-only RLS policies
- `supabase/migrations/add_collections_migration.test.ts`: focused regression test for collections schema and RLS expectations

### Request Protection
- `proxy.ts`: request-time auth cookie refresh and protected-route handling

### Public Assets
- `public/file.svg`
- `public/globe.svg`
- `public/maps/README.md`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

These are starter static assets from the base app scaffold. They are not product-specific yet.
The actual local PMTiles archive is intentionally not committed and is expected at `public/maps/base.pmtiles`.

## What The Current Files Do

### `package.json`
- Defines the project name and npm scripts.
- `dev` starts the local Next.js development server.
- `build` creates a production build with Webpack.
- `start` runs the production server.
- `lint` runs TypeScript static checks with `tsc --noEmit`.
- Includes the `@supabase/supabase-js` dependency for the current Step 2 setup layer.
- Includes the `@supabase/ssr` dependency for the current Step 3 authentication layer.
- Includes the official `maplibre-gl` dependency for the current validated map foundation and PMTiles basemap steps.
- Includes the official `pmtiles` dependency for the current validated local basemap step.

### `.env.example`
- Documents the two public Supabase variables the app currently expects.
- Documents the optional same-origin `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH` override for the local PMTiles basemap.
- Gives the user a safe starting point for creating `.env.local`.

### `app/layout.tsx`
- Defines the root document shell for the app.
- Sets Chinese-first page metadata such as the title and description.
- Sets the document language to `zh-CN`.
- Hosts the global document classes used by the Step 6 mobile-first UI.

### `app/page.tsx`
 - Renders the Step 6 public home page.
 - Introduces the shared public shell and the current main CTA paths.
 - Uses Simplified Chinese as the default visible UI copy.
 - Points users to sign up, login, setup, and the signed-in flow.

### `app/sign-up/page.tsx`
 - Renders the sign-up page inside the shared public shell.
 - Uses the shared auth card rather than a one-off page layout.
 - Submits to the existing Step 3 server action.
 - Shows success or error messages through URL query parameters.

### `app/login/page.tsx`
 - Renders the login page inside the shared public shell.
 - Uses the shared auth card component.
 - Submits to the existing Step 3 login server action.
 - Shows auth success and error feedback in a Chinese-first UI.

### `app/dashboard/page.tsx`
 - Serves as the signed-in Step 6 overview page.
 - Confirms that authenticated users can reach the new protected shell.
 - Reads the current user identity through a shared auth helper.
 - Links users into the add, list, and map placeholder pages.
 - Reflects the Step 10 positioning that the add page now supports both source intake and manual save.
 - Provides the logout action entry point through the shared app shell.

### `app/setup/page.tsx`
 - Renders the Supabase setup screen inside the shared public shell.
 - Shows whether the required environment variables are present.
 - Shows the configured Supabase URL, detected project ref, and connection result.
 - Gives manual setup instructions without starting any authentication flow.

### `app/restaurants/new/page.tsx`
- Provides the protected Step 10 add page for signed-in users.
- Uses the shared signed-in shell to combine the new source intake flow with the already validated manual-create form.
- Lets the user either start from a pasted source link or skip directly to manual save.
- Keeps the Step 7 manual-save path intact while introducing the Step 10 extraction-review starting point.
- Now participates in the first reversible `存个地` migration step by requiring category selection before showing subtype in the manual create path.

### `app/restaurants/review/page.tsx`
- Provides the protected Step 12 source review, extraction preview, and explicit confirmation page after accepted URL intake.
- Reads the normalized `source_url` from the query string and rejects missing or malformed values by redirecting back to `/restaurants/new`.
- Calls the Step 11 extraction service for the normalized source URL.
- Uses the shared signed-in shell together with the source review card, extraction preview card, and extraction confirmation card.
- Shows accepted extraction results first, then requires explicit user confirmation before saving anything.
- Keeps the Step 12 boundary explicit by supporting only single-candidate confirmation and not starting Step 13 multi-candidate work.
- Still defaults extracted `美食` candidates to category `美食`.
- Now also defaults successful accommodation candidates to category `住宿` when strong lodging evidence is accepted.
- Now also defaults successful attraction candidates to category `景点` when strong attraction evidence is accepted.
- Now also defaults successful shopping candidates to category `购物` when strong shopping evidence is accepted.
- Now also defaults successful entertainment candidates to category `玩乐` when strong entertainment evidence is accepted.
- Now also defaults successful generic-place candidates to category `其他` when the high-threshold `Place` or `LocalBusiness` path is accepted.
- Keeps all accepted and missing fields editable before explicit save and still does not auto-save anything.

### `app/restaurants/page.tsx`
- Provides the protected Step 8 full saved restaurant list page.
- Reads the current user's restaurant records through the shared query helper and existing owner-only RLS protection.
- Keeps the successful-save confirmation banner through the shared `AppShell` message area.
- Highlights the just-created restaurant when a `created` query parameter is present after a successful redirect from the create flow.
- Also displays the Step 9 short success message `餐厅信息已更新` after a successful edit redirect.
- Receives successful saves from both the manual create path and the Step 12 extraction confirmation path.
- Continues to stop short of Step 13 and later work by omitting multi-candidate confirmation, geocoding, and map integration.
- Now also surfaces the saved `category` and the temporary subtype value stored in `cuisine` without renaming any route, table, or column yet.
- Continues to support saved accommodation records through the same existing list and redirect flow.
- Continues to support saved attraction records through the same existing list and redirect flow.
- Continues to support saved shopping records through the same existing list and redirect flow.
- Continues to support saved entertainment records through the same existing list and redirect flow.
- Continues to support saved `其他` records through the same existing list and redirect flow.

### `app/restaurants/[id]/edit/page.tsx`
- Provides the protected Step 9 edit page for one saved restaurant.
- Loads exactly one current-user restaurant record through the shared query helper and owner-only RLS protection.
- Uses `notFound()` when the route id is invalid or the current user cannot access the requested restaurant.
- Keeps the route focused on editing saved records only and does not start any Step 10+ page fetching or extraction behavior.
- Now also supports validated category changes and category-specific subtype UI while keeping all saved-record edits under the existing `/restaurants/[id]/edit` route.
- Continues to support editing saved accommodation category and subtype values through that unchanged saved-record edit flow.
- Continues to support editing saved attraction category and subtype values through that unchanged saved-record edit flow.
- Continues to support editing saved shopping category and subtype values through that unchanged saved-record edit flow.
- Continues to support editing saved entertainment category and subtype values through that unchanged saved-record edit flow.
- Continues to support editing saved `其他` category and subtype values through that unchanged saved-record edit flow.

### `app/restaurants/actions.ts`
- Contains the Step 7 server action that validates and creates restaurant records.
- Normalizes required and optional form fields before writing to Supabase.
- Uses the existing server Supabase client and authenticated user session.
- Extracts the first valid `http` or `https` URL from the pasted source input before saving `source_url`.
- Preserves form input in the redirect URL when validation fails.
- Redirects successful saves to `/restaurants` with a simple confirmation message and created record id.
- Also supports the Step 12 review confirmation form by preserving review-entered values on validation errors and redirecting back to `/restaurants/review`.
- Keeps Step 12 confirmation saves on the same validated create path as manual saves.
- Also contains the Step 9 `updateRestaurantAction` server action for editing existing restaurant records.
- Now validates and persists `category` in both create and edit flows.
- Keeps using the existing `cuisine` column as temporary generic subtype storage.
- Preserves validation and update errors on the edit page.
- Redirects successful updates back to `/restaurants` with the short success message `餐厅信息已更新`.
- Also contains the Step 10 `startSourceIntakeAction` server action for the new source intake flow.
- Reuses the existing generic first-`http` or first-`https` extraction logic instead of adding source-specific parsing.
- Accepts direct URLs, 高德 share text, 小红书 share text, 抖音 share text, Google Maps share text, and ordinary public-web share text as long as a valid URL can be extracted.
- Redirects accepted source input into `/restaurants/review` with the normalized URL.
- Redirects invalid source input back to `/restaurants/new` with Simplified Chinese validation feedback while preserving the pasted input.
- Keeps the current fetch timeout, response-size, and extraction security limits unchanged while allowing development-only fixture URLs to go through the same extractor for deterministic manual validation.

### `app/map/page.tsx`
- Provides the protected map page for the validated city filtering, local place search, no-coordinate polish, and V1 map polish steps.
- Establishes the map page location in the signed-in navigation.
- Loads the current user's saved place fields needed for map rendering through the existing server Supabase helper and owner-only RLS scope.
- Passes the loaded records to the client map browser, where filtering occurs locally before location resolution and marker rendering.
- Renders the reusable client-side MapLibre, local PMTiles basemap, marker layer, local place search UI, refined city filter, no-coordinate summary, and friendly map/place feedback in the existing mobile-first shell.
- Uses concise Chinese copy to explain that the current basemap is expected from a local `public/maps/base.pmtiles` file or another same-origin `/maps/...` path.
- Does not write exact or fallback coordinates back to Supabase.
- Does not start external search services, geolocation, geocoding, map editing, labels, local glyph hosting, or Step 13 multi-candidate extraction work.

### `app/auth/actions.ts`
- Contains the Step 3 server actions for sign up, login, and logout.
- Validates basic form input before calling Supabase Auth.
- Redirects users to the next screen with success or error state encoded in the URL.

### `app/globals.css`
- Imports Tailwind CSS.
- Imports the required MapLibre CSS.
- Defines the Step 6 visual tokens for the orange-accent, rounded-card UI.
- Sets the mobile-first background treatment, colors, and typography stack.
- Applies site-wide base styles for the new shell layout.
- Applies lightweight MapLibre control and compact popup-card styling so the validated foundation fits the existing UI language.

### `components/maplibre-foundation.tsx`
- Provides the reusable client-side MapLibre map component used by `/map`.
- Initializes the MapLibre instance inside `useEffect`.
- Prevents duplicate initialization during development and refresh cycles by storing the current map instance in a ref.
- Calls `map.remove()` during cleanup on unmount.
- Resolves the expected PMTiles public path from local configuration before map creation.
- Reuses one global PMTiles protocol registration so React rerenders do not register it repeatedly.
- Uses a fully local style with no external tile, sprite, glyph, or hosted map requests.
- Shows a stable loading overlay while the local map initializes.
- Checks for the local PMTiles asset and shows a friendly Simplified Chinese fallback message instead of crashing when the file is missing or unloadable.
- Adds only basic zoom controls suitable for the existing mobile-first shell.
- Receives resolved marker data and cleans up marker instances before map removal or marker-data replacement.

### `components/map-marker-layer.ts`
- Creates reusable MapLibre marker instances from resolved marker data without fetching data or resolving locations.
- Uses a solid marker for exact stored coordinates and a visually distinct dashed marker for approximate city-center fallback.
- Attaches touch-compatible compact popup cards with place name, city, category when present, and a Simplified Chinese approximate-location notice when applicable.

### `components/map-browser.tsx`
- Holds only local client state for the search query and selected city; it does not fetch data or write data.
- Filters the already loaded current-user records by local text search and city selection before requesting marker data.
- Shows the selected scope's marker count and no-coordinate summary without creating fake locations.
- Presents friendly place-load, no-saved-place, and selected-city-empty states without changing filtering or marker-resolution behavior.

### `components/map-city-filter.tsx`
- Provides a compact `<select>` control with `全部城市` plus the distinct saved city values.
- Keeps the refined city control usable within the existing iPhone-sized map layout.

### `lib/map/map-style.ts`
- Provides the current fully local MapLibre style and default map view configuration.
- Returns a PMTiles-backed vector style using a same-origin `pmtiles://` source.
- Keeps the current style intentionally simple with land, water, boundary, and road context only.
- Intentionally omits labels because local glyph hosting has not been added yet.
- Intentionally stops short of any saved-place rendering.

### `lib/map/map-style.test.js`
- Verifies that the current local PMTiles style contains no external tile, sprite, or glyph hosts.
- Verifies same-origin PMTiles path resolution and invalid-path rejection.
- Verifies the Simplified Chinese fallback-message helpers.
- Verifies that the style factory returns a fresh object for each map instance.

### `lib/map/pmtiles-config.ts`
- Restricts local PMTiles configuration to same-origin public `/maps/...` paths.
- Defaults the current basemap location to `/maps/base.pmtiles`.
- Provides the fallback messages used when configuration is invalid or the local PMTiles file cannot be loaded.

### `lib/map/pmtiles-protocol.ts`
- Registers the PMTiles protocol with MapLibre through one reusable global singleton.
- Reuses the same PMTiles protocol instance across development rerenders.
- Avoids removing the protocol on component unmount so other MapLibre instances are not broken.

### `lib/map/city-centers.ts`
- Stores a small local city-center dataset for approximate city-level placement, starting with major mainland-China cities and a limited explicit overseas set used by tests.
- Normalizes only explicit, known city-name variants, including common Chinese municipal suffixes and defined English aliases; it does not use fuzzy matching.
- City-center results are explicitly marked with `precision = city`, `approximate = true`, and `source = local_city_center`.

### `lib/map/place-location.ts`
- Is a pure helper with no React or Supabase coupling.
- Uses valid stored latitude and longitude as exact coordinates when both are present.
- Falls back to a known local city center only when exact coordinates are absent, preserving the distinction between approximate city centers and precise place coordinates.
- Rejects invalid coordinate pairs, does not treat partial pairs as exact, and returns unresolved for unknown or ambiguous city names.
- Does not write fallback coordinates into stored `latitude` or `longitude` fields.

### `lib/map/place-location.test.js`
- Verifies exact stored-coordinate priority, city-suffix and explicit English-alias normalization, known city fallback, unknown-city unresolved behavior, partial-coordinate handling, invalid-coordinate rejection, and approximate-result marking.

### `lib/map/place-markers.ts`
- Converts selected map-read records into serializable marker data by calling `resolvePlaceLocation()` for every place.
- Uses valid stored coordinates as exact marker data, uses known local city centers as clearly approximate marker data, and skips unresolved places.
- Counts unresolved records by missing-location and invalid-coordinate reasons for the no-coordinate summary.
- Does not write fallback coordinates or any other values back to Supabase.

### `lib/map/place-markers.test.js`
- Verifies exact-coordinate marker creation, approximate city-fallback marker creation, and unresolved-place skipping.

### `lib/map/place-filter.ts`
- Builds distinct local city options from the existing saved `city` field and filters the already loaded records locally.
- Applies local text search across `name`, `city`, and `category`, then composes that result with city selection before calling the marker-resolution helper.
- Returns the selected records' markers plus unresolved count and reason summary without mutating place data.

### `lib/map/place-filter.test.js`
- Verifies local search matching, composed search-plus-city filtering, all-city and empty-search behavior, unresolved-place counting without marker creation, and preserved exact/approximate marker behavior.

### `components/app-shell.tsx`
- Provides the shared protected-page shell for signed-in routes.
- Renders desktop navigation, mobile bottom navigation, account context, and logout action.
- Keeps protected placeholder pages visually consistent and reusable.

### `components/auth-card.tsx`
- Provides the shared card UI for the login and sign-up forms.
- Handles consistent display of auth messages, inputs, and action buttons.

### `components/navigation.ts`
- Stores the shared protected-route navigation items.
- Defines labels, short mobile labels, and per-page descriptions.
- Reflects that `/restaurants/new` is now both the source intake entry and the manual-save entry.
- Exposes a helper for determining the active route.

### `components/placeholder-card.tsx`
- Provides a reusable content card used throughout the Step 6 placeholder pages.
- Keeps future page placeholders visually consistent while functionality is still pending.

### `components/public-shell.tsx`
- Provides the shared public-page shell used by home, login, sign-up, and setup.
- Combines brand presentation, hero copy, and a secondary aside area in one reusable layout.

### `components/restaurant-form-card.tsx`
- Provides the main Step 7 restaurant form UI inside a reusable card.
- Keeps the visible form copy Simplified Chinese by default.
- Uses the shared Step 12 restaurant form field component so manual create and review confirmation stay aligned.
- Supports Chinese text input, category selection, the reusable subtype picker, and free-text optional fields.
- Accepts either a direct URL or a longer 小红书, 抖音, Google Maps, or public-web sharing message in the source input.
- Preserves the pasted source text and the rest of the form values when validation fails.
- Receives the Step 10 handoff from `/restaurants/review` by accepting a prefilled `source_url` value through `source_input`.
- Intentionally excludes latitude and longitude inputs in Step 7.
- Keeps manual create intentionally unselected by default for category, so subtype stays hidden until the user picks one.

### `components/restaurant-form-fields.tsx`
- Provides the shared V1 restaurant field controls for both manual creation and Step 12 extraction confirmation.
- Renders name, city, source input, address, category, subtype, privacy, and note fields in one reusable component.
- Lets the review confirmation path customize source labels and guidance without changing the underlying save contract.
- Hides subtype until category is selected in manual create.
- Keeps extracted review defaults at category `美食`.
- Shows the selected category first, then renders the matching subtype field directly below that selected category card, then shows the remaining categories afterward.
- Clears incompatible subtype values when category changes.
- Preserves category and subtype values after validation errors.

### `components/cuisine-field.tsx`
- Provides the reusable subtype picker used by manual create, extraction confirmation, and saved-record edit forms.
- Supports both free-text subtype entry and tap-to-select quick-pick suggestions.
- Keeps inferred food-cuisine values editable instead of treating suggestions as fixed values.
- Still writes the result into the existing `cuisine` column for now.

### `components/restaurant-list.tsx`
- Provides the main Step 8 saved-list presentation wrapper.
- Renders high-level summary metrics such as total records, covered cities, and records with notes.
- Maps the current user's saved restaurants into reusable restaurant cards.
- Receives the created restaurant id so the list can keep the new-record highlight behavior after a save redirect.

### `components/restaurant-list-card.tsx`
- Provides the reusable Step 8 card UI for one saved restaurant.
- Shows the core restaurant details clearly: name, city, privacy, save date, and source link.
- Handles missing optional fields with explicit `暂未填写` fallback copy for the temporary subtype value in `cuisine`, `address`, and `note`.
- Displays the newly-created highlight state and `刚刚保存` badge when requested by the parent list.
- Extracts a lightweight source host label from `source_url` for easier scanning without changing the saved source URL itself.
- Provides the Step 9 edit entry point from the saved restaurant list.
- Also shows the saved `category`.

### `components/restaurant-edit-form-card.tsx`
- Provides the main Step 9 edit UI inside a reusable card.
- Shows the non-editable restaurant context fields `name`, `city`, `address`, and `source_url`.
- Now supports editing `category`, the temporary subtype value stored in `cuisine`, `note`, and `privacy`.
- Uses the same reusable subtype picker as create and review confirmation.
- Supports clearing optional subtype and `note` values back to blank.
- Keeps validation and update errors on the edit page so the user can correct and resubmit.
- Shows the selected category first and renders its subtype field directly below it, matching the create and review confirmation layout.

### `components/extraction-preview-card.tsx`
- Provides the main Step 11 extraction-result UI on `/restaurants/review`.
- Shows only accepted extracted fields and never displays rejected or unaccepted field candidates.
- Avoids rendering giant low-confidence page-text blocks by never displaying rejected or unaccepted field candidates.
- Explains whether the current result is an accepted draft candidate or a fallback to manual completion.
- Now also shows the accepted extracted category and uses accommodation-specific subtype labeling when the Step 3A lodging path succeeds.
- Now also shows attraction-specific subtype labeling when the Step 3B attraction path succeeds.
- Now also shows shopping-specific subtype labeling and conservative-support copy when the Step 3C shopping path succeeds.
- Now also shows entertainment-specific subtype labeling and conservative-support copy when the Step 3D entertainment path succeeds.
- Now also shows `其他`-specific conservative-support copy only when the high-threshold generic-place path succeeds.
- Leaves the actual save decision to the Step 12 confirmation form on the same review page.

### `components/extraction-confirmation-card.tsx`
- Provides the main Step 12 explicit confirmation UI on `/restaurants/review`.
- Prefills the shared V1 form fields from accepted extraction results only.
- Lets users edit accepted extracted values before saving.
- Lets users manually complete partial candidates or fallback results before saving.
- Preserves user-entered values after validation errors by reading review query parameters.
- Submits to the existing `createRestaurantAction` and writes nothing until the user confirms.
- Successful saves redirect to `/restaurants` with the existing success message and newly-created highlight.
- Keeps fallback and restaurant candidates defaulted to category `美食`.
- Now also defaults successful accommodation candidates to category `住宿` while still writing the inferred subtype through the current `cuisine` field.
- Now also defaults successful attraction candidates to category `景点` while still writing the inferred subtype through the current `cuisine` field.
- Now also defaults successful shopping candidates to category `购物` while still writing the inferred subtype through the current `cuisine` field.
- Now also defaults successful entertainment candidates to category `玩乐` while still writing the inferred subtype through the current `cuisine` field.
- Now also defaults successful generic-place candidates to category `其他` while still writing the inferred subtype through the current `cuisine` field.

### `components/source-intake-card.tsx`
- Provides the main Step 10 source intake UI on `/restaurants/new`.
- Uses a textarea so the user can paste either a clean URL or a full sharing message.
- Shows Simplified Chinese guidance about the current source-intake boundary and accepted share-text workflow.
- Preserves pasted intake text and shows validation feedback when no valid `http` or `https` URL can be extracted.

### `components/source-review-card.tsx`
- Provides the main Step 11 source review UI on `/restaurants/review`.
- Displays the normalized source URL and a lightweight host label for quick confirmation.
- States the current V1 source-policy boundary so supported and best-effort sources are visible in the UI.
- Hands the normalized URL back to `/restaurants/new` so the existing manual form opens with `source_url` prefilled.
- Frames the page as a bounded best-effort extraction flow rather than a raw URL-review-only screen.
- Now explains that automatic extraction remains strongest for `美食` while adding conservative support for strong accommodation pages.
- Now also explains that the same conservative support extends to strong attraction pages.
- Now also explains that the same conservative support extends to strong shopping pages.
- Now also explains that the same conservative support extends to strong entertainment pages.
- Now also explains that only a very small number of strong generic-place pages can become `其他` candidates and that all other generic pages stay manual-first.

### `components/site-brand.tsx`
- Renders the shared product brand lockup.
- Keeps English and Chinese product naming consistent across public and protected pages.

### `components/surface-card.tsx`
- Provides the base rounded card surface used throughout the Step 6 UI.
- Keeps spacing and border treatment consistent across many pages.

### `lib/supabase/env.ts`
- Reads the public Supabase environment variables from the runtime.
- Returns `null` when the app is not configured yet.
- Extracts the Supabase project ref from the configured URL for display in the setup screen.
- Exposes a strict helper for auth code that requires the environment values to be present.

### `lib/supabase/client.ts`
- Creates a minimal Supabase client using the current public environment values.
- Disables session persistence and token refresh because Step 2 is only about connection setup, not auth behavior.

### `lib/supabase/health.ts`
- Performs the current Step 2 connection test.
- Calls the Supabase Auth settings endpoint using the configured public key.
- Returns a structured status object for the `/setup` page to render.
- Separates setup-state checking from UI code.

### `lib/supabase/server.ts`
- Creates a request-scoped Supabase server client using Next.js cookies.
- Supports server actions and protected pages in the Step 3 auth flow.
- Lets Supabase Auth read and write cookies for session management.

### `lib/auth/require-user.ts`
- Centralizes the protected-page user lookup and redirect behavior.
- Lets multiple Step 6 signed-in pages share the same auth gate.

### `lib/restaurants/constants.ts`
- Defines the Step 7 cuisine suggestions used by the form.
- Keeps cuisine choices Chinese-friendly while still allowing custom user input.
- Defines the `private` and `public` privacy radio options and their user-facing descriptions.

### `lib/restaurants/types.ts`
- Defines the minimal shared insert type used by the Step 7 server action.
- Defines the shared list-item type used by the Step 8 saved-list components.
- Defines the Step 9 update input and edit-item types used by the edit route and update action.
- Includes the Step 12 review-return fields that let the create action preserve confirmation-form state on validation errors.

### `lib/restaurants/queries.ts`
- Fetches the current user's restaurant records for `/restaurants`.
- Returns the fields needed for the Step 8 saved-list cards and summary display.
- Relies on the already-validated owner-only RLS rules for user scoping.
- Orders the saved list by `created_at desc` and no longer applies the earlier limited confirmation-only cap.
- Also exposes `getCurrentUserRestaurantById` for the Step 9 edit route.
- Uses the same owner-only RLS model so cross-user edit access is blocked at the data layer.

### `lib/restaurants/source-url.ts`
- Extracts the first valid `http` or `https` URL from direct input or longer share text.
- Trims common trailing ASCII and Chinese punctuation from pasted links.
- Uses standard URL parsing so non-URL fragments like `qrr:/` or `Z@M.jp` are not mistaken for valid links.
- Keeps the logic generic so it works across 高德, 小红书, 抖音, Google Maps, and public web sharing text.
- Is reused by both the Step 7 manual-save flow and the Step 10 source intake flow.

### `lib/restaurants/source-url.test.ts`
- Covers the focused Step 7 URL-extraction cases with automated tests.
- Verifies direct URL handling, 小红书 share-text extraction, 抖音 share-text extraction, no-URL validation input, and first-URL-wins behavior.
- Supports the Step 10 intake guarantees for direct URLs, full share text, and invalid text without requiring new source-specific parsing code.

### `lib/restaurants/extraction-types.ts`
- Defines the Step 11 extraction result model used by the review flow.
- Stores the source kind, support level, page type, extracted fields, and success-or-fallback status in one shared type layer.
- Now also carries the accepted category on successful candidates so the review layer can distinguish `美食`, `住宿`, `景点`, `购物`, and `玩乐`.
- Adds field-level confidence, evidence source, and optional rejection-reason support.
- Adds development-only diagnostics types for fetched URL, response metadata, structured-data types, accepted evidence, rejected candidates, and final extraction decision.

### `lib/restaurants/source-classification.ts`
- Classifies source URLs into product-level kinds such as public web, Google Maps, 小红书, 抖音, and unsupported social sources.
- Maps source kinds to Step 11 support levels such as official, best-effort, and unsupported.
- Does not yet add dedicated source kinds for 高德地图, 大众点评, or 百度地图; those China-first distinctions currently live in the planning documents rather than in app-specific source classification code.

### `lib/restaurants/source-fetch.ts`
- Performs the Step 11 bounded server-side fetch for source pages.
- Enforces the current timeout, response-size, and content-type limits before any extraction logic runs.
- Preserves the final fetched URL after redirects, HTTP status, and content type for diagnostics and fallback handling.
- Treats fetched content as untrusted and returns structured failure states for timeout, network, oversized response, unsupported content type, and empty body.

### `lib/restaurants/source-html.ts`
- Extracts Step 11 source metadata such as page title, meta description, and Open Graph fields.
- Parses multiple JSON-LD script blocks, top-level arrays, and `@graph` content while ignoring malformed blocks individually instead of failing the whole page.
- Normalizes structured data into restaurant-relevant nodes including `Restaurant`, `LocalBusiness`, `FoodEstablishment`, and related address/cuisine fields.
- Produces bounded visible-text segments for conservative fallback heuristics without treating the full cleaned page body as a field value.

### `lib/restaurants/page-type.ts`
- Determines whether a fetched page looks like a single-restaurant page, a restaurant list or directory page, a generic page, or an unknown page.
- Uses structured data, page metadata, and bounded visible-text signals to reject directory or index pages before field extraction succeeds.
- Helps prevent failures like accepting `Locations` as a restaurant name on location index pages.

### `lib/restaurants/field-validation.ts`
- Applies strict Step 11 validation to candidate `name`, `address`, `city`, and `cuisine` values before they can be shown as accepted extraction results.
- Rejects generic names, navigation-like content, oversized text, low-confidence cuisine, and address text that lacks strong address-like evidence.
- Formats structured postal addresses into one display string when structured address data is reliable.

### `lib/restaurants/cuisine-inference.ts`
- Performs conservative cuisine inference from title, description, and bounded visible text.
- Uses weighted keyword evidence rather than broad page-body guessing.
- Returns blank cuisine when confidence is low so Step 11 prefers missing data over incorrect data.

### `lib/restaurants/accommodation-inference.ts`
- Adds the first category-specific inference helper outside the existing `美食` path.
- Recognizes strong accommodation structured-data types such as `Hotel`, `LodgingBusiness`, `Resort`, `Motel`, `Campground`, and reliable hostel equivalents.
- Infers accommodation subtype conservatively and leaves the subtype blank when confidence is low.
- Keeps subtype output compatible with the existing temporary `cuisine` storage column.

### `lib/restaurants/attraction-inference.ts`
- Adds the second category-specific inference helper outside the existing `美食` and `住宿` paths.
- Recognizes strong attraction structured-data types such as `TouristAttraction`, `Museum`, `Park`, `LandmarksOrHistoricalBuildings`, `Zoo`, and `Aquarium`.
- Infers attraction subtype conservatively and leaves the subtype blank when confidence is low.
- Keeps subtype output compatible with the existing temporary `cuisine` storage column.

### `lib/restaurants/shopping-inference.ts`
- Adds the third category-specific inference helper outside the existing `美食`, `住宿`, and `景点` paths.
- Recognizes strong shopping structured-data types such as `ShoppingCenter`, `Store`, `BookStore`, `ClothingStore`, `GroceryStore`, `ConvenienceStore`, `DepartmentStore`, `HomeGoodsStore`, `ElectronicsStore`, and conservatively accepted beauty-shopping types.
- Infers shopping subtype conservatively and leaves the subtype blank when confidence is low.
- Keeps subtype output compatible with the existing temporary `cuisine` storage column.

### `lib/restaurants/entertainment-inference.ts`
- Adds the fourth category-specific inference helper outside the existing `美食`, `住宿`, `景点`, and `购物` paths.
- Recognizes strong entertainment structured-data types such as `EntertainmentBusiness`, `MovieTheater`, `NightClub`, `BowlingAlley`, `AmusementPark`, `SportsActivityLocation`, `PerformingArtsTheater`, and `EventVenue`.
- Infers entertainment subtype conservatively and leaves the subtype blank when confidence is low.
- Keeps subtype output compatible with the existing temporary `cuisine` storage column.

### `lib/restaurants/generic-place-inference.ts`
- Adds the fifth category-specific inference helper outside the existing `美食`, `住宿`, `景点`, `购物`, and `玩乐` paths.
- Recognizes only strong generic-place structured-data types such as `Place` and `LocalBusiness`.
- Keeps `其他` intentionally manual-first by inferring subtype only from very explicit, reliable labels and otherwise leaving the subtype blank.
- Keeps subtype output compatible with the existing temporary `cuisine` storage column.

### `lib/restaurants/source-extraction.ts`
- Orchestrates the full Step 11 extraction flow plus the validated Step 3A accommodation expansion, Step 3B attraction expansion, Step 3C shopping expansion, Step 3D entertainment expansion, and Step 3E generic-place expansion from source classification through fetch, parse, validation, and final candidate or fallback decision.
- Prioritizes structured data first, then conservative metadata and labeled-section heuristics, while avoiding broad body-text extraction.
- Supports partial candidates so genuine single-restaurant pages can return a reliable subset of fields when address, city, or cuisine are uncertain.
- Adds candidate-acceptance thresholds so successful drafts require a valid restaurant name plus sufficient single-restaurant evidence.
- Keeps the current `美食` extraction behavior and acceptance thresholds unchanged.
- Keeps the current `住宿` extraction behavior and acceptance thresholds unchanged.
- Keeps the current `景点` extraction behavior and acceptance thresholds unchanged.
- Keeps the current `购物` extraction behavior and acceptance thresholds unchanged.
- Keeps the current `玩乐` extraction behavior and acceptance thresholds unchanged.
- Adds the smallest category-aware dispatch needed for all six V1 categories.
- Accepts `住宿` only when the page looks like a single place, the name passes validation, and strong accommodation structured-data evidence exists.
- Accepts `景点` only when the page looks like a single place, the name passes validation, and strong attraction structured-data evidence exists.
- Accepts `购物` only when the page looks like a single place, the name passes validation, and strong shopping structured-data evidence exists.
- Accepts `玩乐` only when the page looks like a single place, the name passes validation, and strong entertainment structured-data evidence exists.
- Accepts `其他` only when the page looks like one concrete place, the name passes validation, strong `Place` or `LocalBusiness` structured-data evidence exists, address or city evidence is reliable, and no stronger category-specific evidence exists.
- Keeps `其他` intentionally manual-first and at the highest acceptance threshold.
- Rejects generic `LocalBusiness` as insufficient accommodation evidence.
- Rejects generic `Place` or `LocalBusiness` as insufficient attraction evidence.
- Rejects generic `LocalBusiness` or `Place` as insufficient shopping evidence.
- Rejects generic `LocalBusiness` or `Place` as insufficient entertainment evidence.
- Treats `Place` or `LocalBusiness` alone as insufficient for `其他`.
- Falls back cleanly for weak generic pages, missing-location pages, generic directories and list pages, ambiguous multi-category sources, shopping directory pages, shopping store lists, shopping search-result pages, attraction directory pages, travel blogs, hotel directory pages, entertainment directories, event schedules, entertainment search and list pages, real-world timeout responses, real-world oversized-page responses, and real-world `403` responses.
- Supports development-only deterministic extraction fixtures that still run through the same bounded fetch and extraction pipeline.
- Records development-only diagnostics for final fetched URL, page type, structured-data coverage, generic-place evidence, accepted field evidence, rejected field candidates, final category, and the final acceptance or fallback reason.
- Includes the validated Step 3E bug fix that kept generic-place logic narrow without loosening existing category thresholds:
  - the fixture chrome no longer injects `/restaurants/new` into visible text
  - generic weak-signal dispatch guards no longer run too early
  - address validation no longer misreads `Development/Test Only` as an address because `st` now requires proper street-abbreviation boundaries
  - candidate category propagation and review defaulting remain unchanged because they were already correct

### `lib/restaurants/source-extraction.test.ts`
- Covers the focused Step 11 extraction regression cases plus the validated Step 3A accommodation cases, Step 3B attraction cases, Step 3C shopping cases, Step 3D entertainment cases, and Step 3E generic-place cases with automated tests.
- Verifies success and fallback behavior for structured-data restaurant pages, hotel pages, attraction pages, shopping pages, entertainment pages, generic-place pages, resort pages, directory pages, generic pages, malformed JSON-LD, partial candidates, metadata-based address extraction, low-confidence subtype inference, ambiguous mixed-category pages, development-only fixture-aligned shopping, entertainment, and generic-place cases, and limited-fetch Google Maps fallback.
- Locks in the validated rule that weak pages should fall back cleanly and that missing data is preferred over incorrect data.

### `lib/restaurants/review-form.ts`
- Converts the Step 11 extraction result into Step 12 editable confirmation-form values.
- Prefills only accepted extracted fields for successful candidates.
- Still defaults fallback and `美食` candidates to `美食`.
- Now defaults successful accommodation candidates to `住宿` without silently overriding an explicit user-selected category override.
- Now defaults successful attraction candidates to `景点` without silently overriding an explicit user-selected category override.
- Now defaults successful shopping candidates to `购物` without silently overriding an explicit user-selected category override.
- Now defaults successful entertainment candidates to `玩乐` without silently overriding an explicit user-selected category override.
- Now defaults successful generic-place candidates to `其他` without silently overriding an explicit user-selected category override.
- Lets URL query overrides win after validation errors so user-entered values are preserved.
- Reports missing required and optional fields so partial candidates and fallback results can be manually completed.

### `lib/restaurants/review-form.test.ts`
- Covers the focused Step 12 confirmation-form state behavior.
- Verifies accepted-field prefills, user-entered overrides, partial-candidate missing fields, fallback-mode manual completion labels, and successful accommodation/attraction/shopping/entertainment/generic-place default-category behavior.

### `lib/utils.ts`
- Provides a minimal shared helper for joining CSS class names in reusable components.

### `supabase/migrations/20260709120000_create_restaurants_table.sql`
- Creates the initial V1 `public.restaurants` table in Supabase.
- Uses `source_url` directly on the restaurant record rather than a separate source table.
- Adds the required V1 fields: `name`, `city`, `source_url`, and `privacy`.
- Adds the optional V1 fields: `address`, `cuisine`, `note`, `latitude`, and `longitude`.
- Adds `user_id` so restaurant ownership can be enforced later when Step 5 introduces access policies.
- Adds `created_at` and `updated_at` timestamps for record tracking.
- Adds validation constraints for blank required values, valid privacy values, and valid coordinate ranges.
- Adds indexes on `user_id` and `city` to support expected access and browsing patterns.
- Adds a trigger-backed `updated_at` maintenance function so the timestamp refreshes automatically on updates.

### `supabase/migrations/20260709130000_enable_restaurants_rls.sql`
- Enables Row Level Security on `public.restaurants`.
- Restricts table access to authenticated users rather than anonymous access.
- Restricts sequence usage for the identity primary key to authenticated users.
- Adds an owner-only `select` policy so a user can only read rows where `user_id = auth.uid()`.
- Adds an owner-only `insert` policy so a user can only create rows for their own `user_id`.
- Adds an owner-only `update` policy so a user can only update their own rows and cannot reassign ownership.
- Adds an owner-only `delete` policy so a user can only delete their own rows.
- Keeps the V1 `privacy` field as stored metadata only and does not use it to expose restaurants to other users.

### `proxy.ts`
- Runs on incoming app requests.
- Refreshes and synchronizes auth cookies with Supabase SSR helpers.
- Redirects signed-out users away from protected routes.
- Redirects signed-in users away from guest-only auth screens.
- Protects the signed-in routes for dashboard, add flow, source review, saved list, edit flow, and map placeholder through the `/restaurants` route prefix plus the other protected paths.

### `next.config.ts`
- Holds the current Next.js project configuration.
- This is minimal in Step 1.

### `tsconfig.json`
- Configures TypeScript for the Next.js app.
- Supports the current app-router setup and static type checking.

### `postcss.config.mjs`
- Connects PostCSS processing for Tailwind CSS.

### `README.md`
- Documents the current Step 1, Step 2, and Step 3 scope and the available project scripts.

## Current Architectural Decisions
- One app and one codebase.
- Next.js App Router for both UI structure and future server logic.
- TypeScript as the default language.
- Tailwind CSS for styling.
- Supabase is the selected backend platform for V1.
- Public Supabase project configuration is handled through environment variables.
- Step 2 uses a lightweight server-side connection check before any auth flow is added.
- Step 3 uses Supabase SSR with cookie-based auth handling.
- Email/password authentication is implemented before any restaurant data features.
- Protected pages are enforced at request time with `getClaims()`-based auth checks.
- Step 4 introduces the first database schema as a single Supabase migration.
- Step 5 adds owner-only Row Level Security to the `restaurants` table.
- Step 6 adds the first cohesive product UI shell and route structure.
- Step 7 adds the first restaurant write path through a server action and protected manual-create page.
- Step 8 adds the first complete saved-list experience for the current user.
- Step 9 adds the first saved-record edit flow.
- Step 10 adds the first URL-intake and source-review entry into the future extraction flow.
- Step 11 adds the first bounded server-side extraction flow and review result layer on top of the Step 10 intake path.
- Step 12 adds explicit confirmation after extraction, editable accepted fields, manual completion for partial candidates, and confirm-before-save behavior.
- The V1 restaurant schema is intentionally small and centered on one `restaurants` table.
- `source_url` lives directly on the `restaurants` table in V1.
- Coordinates are optional by design so restaurants can still be saved without map placement.
- V1 access control is enforced with owner-only RLS policies on `public.restaurants`.
- The `privacy` field is stored for later product behavior but does not create cross-user visibility in V1.
- The app now has separate public and signed-in layout patterns built from reusable components.
- Step 6 keeps the app mobile-first and iPhone-friendly without introducing unnecessary translation infrastructure.
- Step 7 keeps the mobile-first, orange-accent Chinese-first visual direction while adding the first restaurant form.
- Step 7 accepts direct links and longer sharing text in one generic source input, but only persists the first valid `http` or `https` URL.
- Step 7 intentionally omits latitude, longitude, geocoding, extraction review, edit, and delete behavior.
- Step 8 turns `/restaurants` into the full saved-list page while preserving the successful-save confirmation and new-record highlight behavior from Step 7.
- Step 9 keeps the editable boundary intentionally small: `cuisine`, `note`, and `privacy` only.
- Step 9 preserves owner-only editing through the existing Supabase RLS model.
- Step 9 redirects successful updates back to `/restaurants` with a short success message, while keeping validation and update errors on the edit page.
- Step 10 reuses the same generic first-valid-URL extraction logic for direct URLs and longer sharing text instead of introducing source-specific parsing.
- Step 11 adds page-type detection, structured-data-first extraction, strict field validation, field-level evidence and confidence, candidate acceptance rules, development-only diagnostics, and focused extraction regression tests.
- Step 11 prefers missing data over incorrect data and never accepts large raw page-text blocks as restaurant fields.
- Step 11 never auto-saves extracted results.
- Step 12 keeps extracted results editable and routes confirmed saves through the existing validated create action.
- Step 12 preserves entered values on validation errors and returns the user to `/restaurants/review`.
- Step 12 successful saves redirect to `/restaurants` with the existing success message and highlight behavior.
- The validated map marker step reads the current user's saved places through the existing server Supabase helper and owner-only RLS policies, without changing the database schema or saved records.
- Marker data is produced through the pure `resolvePlaceLocation()` path so exact stored coordinates win, conservative city centers remain clearly approximate, and unresolved records are not placed on the map.
- Marker popups show only existing saved-place metadata and do not introduce map editing, search, clustering, or geocoding.
- The validated city filtering and local search steps use the existing saved `name`, `city`, and `category` fields locally after RLS-scoped loading; they do not add database filtering, change Supabase schema, or write coordinates.
- Step 3A adds the first category-aware extraction expansion for `住宿` only while preserving the existing `美食` path unchanged.
- Step 3A requires strong accommodation structured-data evidence and falls back cleanly for generic `LocalBusiness`, ambiguous hotel-plus-restaurant sources, hotel directory pages, and real-world timeout or `403` responses.
- Step 3B adds the second category-aware extraction expansion for `景点` only while preserving the existing `美食` and `住宿` paths unchanged.
- Step 3B requires strong attraction structured-data evidence and falls back cleanly for generic `Place` or `LocalBusiness`, attraction directories, travel blogs, and mixed-category pages.
- Step 3C adds the third category-aware extraction expansion for `购物` only while preserving the existing `美食`, `住宿`, and `景点` paths unchanged.
- Step 3C requires strong shopping structured-data evidence and falls back cleanly for generic `LocalBusiness` or `Place`, shopping directories, store lists, search-result pages, and mixed-category pages.
- Step 3C allows development-only deterministic fixture pages for manual validation without loosening fetch timeout, response-size, or extraction security limits.
- Step 3D adds the fourth category-aware extraction expansion for `玩乐` only while preserving the existing `美食`, `住宿`, `景点`, and `购物` paths unchanged.
- Step 3D requires strong entertainment structured-data evidence and falls back cleanly for generic `LocalBusiness` or `Place`, entertainment directories, event schedules, search and list pages, and mixed-category pages.
- Step 3D keeps the deterministic development fixtures unlinked from product UI and disabled in production without loosening fetch timeout, response-size, or extraction security limits.
- Step 3E adds the fifth category-aware extraction expansion for `其他` while preserving the existing `美食`, `住宿`, `景点`, `购物`, and `玩乐` paths unchanged.
- Step 3E keeps `其他` intentionally manual-first and at the highest acceptance threshold: only strong single-place `Place` or `LocalBusiness` cases with reliable location evidence can succeed, and weak generic pages still fall back.
- Step 3E keeps deterministic development fixtures unlinked from product UI and disabled in production without loosening fetch timeout, response-size, or extraction security limits.
- All six V1 categories now have conservative extraction support.
- The planning documents now define a China-first direction where 高德地图 / Amap is the primary future V1 map, POI, and geocoding provider.
- The planning documents now define the source stance as: 高德 links and share text are official V1 sources; 大众点评, 小红书, and 抖音 are best-effort; 百度地图 is secondary input only; Google Maps is optional overseas support.
- Inferred cuisine remains editable and should stay blank when confidence is low.
- Accommodation subtype remains editable and is still stored through the temporary `cuisine` field.
- Attraction subtype remains editable and is still stored through the temporary `cuisine` field.
- Shopping subtype remains editable and is still stored through the temporary `cuisine` field.
- Entertainment subtype remains editable and is still stored through the temporary `cuisine` field.
- Generic-place subtype remains editable, may stay blank, and is still stored through the temporary `cuisine` field.
- Step 13 multi-candidate work is paused while the product direction generalizes into `存个地`.

## Restaurants Table Schema

### Table
- `public.restaurants`

### Columns
- `id bigint generated by default as identity primary key`: numeric primary key for restaurant records
- `user_id uuid not null references auth.users (id) on delete cascade`: owning user from Supabase Auth
- `name text not null`: required restaurant name
- `city text not null`: required city name even when coordinates are missing
- `source_url text not null`: required original discovery URL
- `privacy text not null`: required per-record visibility flag
- `address text`: optional address
- `cuisine text`: optional cuisine label
- `note text`: optional personal note
- `latitude double precision`: optional latitude
- `longitude double precision`: optional longitude
- `created_at timestamptz not null default timezone('utc', now())`: creation timestamp
- `updated_at timestamptz not null default timezone('utc', now())`: last-update timestamp

### Constraints
- `restaurants_name_not_blank`: prevents empty or whitespace-only `name`
- `restaurants_city_not_blank`: prevents empty or whitespace-only `city`
- `restaurants_source_url_not_blank`: prevents empty or whitespace-only `source_url`
- `restaurants_privacy_check`: limits `privacy` to `private` or `public`
- `restaurants_latitude_range`: allows `null` latitude or a value between `-90` and `90`
- `restaurants_longitude_range`: allows `null` longitude or a value between `-180` and `180`

### Indexes
- `restaurants_user_id_idx`: supports user-scoped queries that will matter once Step 5 access rules and app-side CRUD flows are added
- `restaurants_city_idx`: supports city-based browsing and filtering later in V1

### `updated_at` Trigger
- `public.set_restaurants_updated_at()`: trigger function that sets `updated_at` to the current UTC time before updates
- `set_restaurants_updated_at`: `before update` trigger on `public.restaurants`
- This keeps update timestamps consistent without requiring each future app write path to manage `updated_at` manually

## Restaurants Table RLS

### RLS Status
- Row Level Security is enabled on `public.restaurants`

### Role Access
- `authenticated` is granted `select`, `insert`, `update`, and `delete` on `public.restaurants`
- `anon` is not granted direct table access for restaurant CRUD
- `authenticated` is granted the required identity-sequence access for inserts

### Owner-Only Policies
- `Authenticated users can view their own restaurants`
: allows `select` only when `auth.uid()` matches `user_id`
- `Authenticated users can insert their own restaurants`
: allows `insert` only when the new row `user_id` matches `auth.uid()`
- `Authenticated users can update their own restaurants`
: allows `update` only when the existing row belongs to the user and the updated row still keeps that same `user_id`
- `Authenticated users can delete their own restaurants`
: allows `delete` only when the row belongs to the current user

### Privacy Behavior In V1
- `privacy` is stored as `private` or `public` on each restaurant row
- In V1 this flag does not override owner-only RLS
- A restaurant marked `public` is still not readable by other users
- No public discovery or cross-user browsing behavior exists yet

## Current UI Structure

### Public Structure
- Public pages use `components/public-shell.tsx`
- The shared public shell is used by `/`, `/login`, `/sign-up`, and `/setup`
- Public pages use the same brand block, hero area, rounded cards, and orange-accent CTA treatment

### Signed-In Structure
- Signed-in pages use `components/app-shell.tsx`
- Desktop view uses a top navigation bar plus a left-side support column
- Mobile view uses a fixed bottom navigation for thumb-friendly switching
- The signed-in shell also shows account context and logout access

### Protected Placeholder Pages
- `/dashboard` acts as the signed-in overview page
- `/restaurants/new` is now the Step 10 add page with both source intake and manual-create paths
- `/restaurants/review` is now the Step 12 source review, extraction preview, and explicit confirmation page
- `/restaurants` is now the real Step 8 saved restaurant list page
- `/restaurants/[id]/edit` is now the real Step 9 saved-record edit page
- `/map` is the validated MapLibre and local PMTiles map page with saved-place marker rendering, local place search, local city filtering, and no-coordinate summary polish
- These pages are navigable now, with source intake, extraction review, explicit confirmation, manual creation, the saved list, saved-record editing, and searchable city-filtered map browsing in place while Step 13+ multi-candidate confirmation and geocoding remain for later steps

### Visual Direction Now In Use
- mobile-first layouts, closer to a mobile web app than a desktop-first site
- strong iPhone usability and tap-friendly spacing
- clean, modern, vibrant, card-based screens
- orange accent color near `#FF5B00`
- Simplified Chinese as the default visible language
- English remains a later secondary option

## Current Limitations
- The app is still intentionally narrow in scope beyond setup, auth, and basic restaurant creation.
- The restaurant create flow, Step 10 source intake flow, and Step 9 edit flow exist, but there is still no delete flow.
- `/restaurants` shows the full saved-list experience, but it does not yet support deleting, filtering, or pagination.
- Step 12 explicit single-candidate confirmation exists, but there is still no Step 13 multi-candidate extraction flow yet.
- `/map` now provides local client-side search by `name`, `city`, and `category`, composed with city-filtered MapLibre marker browsing, cluster rendering, and the existing unresolved-place summary; external search services, map editing, and geocoding remain unstarted.
- There is no 高德地图 / Amap integration; the current map rendering remains the validated local MapLibre and PMTiles architecture.
- There is no geocoding or coordinate input in the user-facing create flow yet.
- There is no multilingual switching yet, only Chinese-first copy with future English support planned.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
- The current extraction path remains intentionally conservative: unsupported or weak pages fall back instead of forcing questionable field values.
- `其他` extraction remains intentionally manual-first and is the strictest category path in the current extractor.
- The product is intentionally paused before Step 13 while the restaurant-only model is generalized into `存个地`.

## Validated AI Review-Form Integration Checkpoint
- Accepted AI suggestions now flow into the normal editable review form; the AI card remains a review control rather than a second save model.
- Persistable AI fields are mapped to existing form fields: `category`, `cuisine` as the temporary subcategory, and the accepted summary as `notes`.
- The editable form values are the final source of truth for the existing save payload.
- Manual edits remain highest priority after AI values are applied.
- Applied values are represented in the existing URL-backed review state and survive page refresh.
- Collection-creation redirects preserve the editable review draft values.
- URL-backed AI state restores group-specific accepted selections.
- Preview-only tags and place type are explicitly marked `暂不保存`, cannot be accepted, and remain outside persistence.
- Repeated application of already-applied suggestions is disabled.
- Manual browser validation with `https://www.teamlab.art/` passed: category became `景点`, subcategory became `Art Gallery`, manually changing the subcategory to `Digital Art Museum` survived refresh, and no place was saved during validation.
- The Supabase schema, map system, collections architecture, extraction architecture, DeepSeek provider behavior, and preview-only tags/place-type persistence remain unchanged.
- Validation recorded for this checkpoint:
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`36` tests).

## Step 2 Durable DeepSeek Response Caching

### Cache Model And Ownership
- `public.ai_enrichment_cache` is a durable, user-scoped cache for normalized DeepSeek enrichment results.
- The table stores `user_id`, `cache_key`, provider/model/prompt metadata, source type and URL, compact evidence hash, response JSON, timestamps, and `expires_at`.
- `(user_id, cache_key)` is unique. Indexes support owner lookup, expiry maintenance, and evidence-hash inspection.
- RLS is enabled with authenticated owner-only select, insert, update, and delete policies. No cache data is publicly readable.

### Key And Retention Design
- Cache identity is generated by a pure helper from provider, model, prompt version, source type, normalized source URL, evidence hash, sorted missing fields, and thinking mode.
- Extraction evidence is normalized and hashed before key generation. Full HTML and full pasted page text are not included in durable storage.
- Entries expire after 30 days. Only validated `suggestions_available` and `no_changes` normalized results are eligible for caching.

### Runtime Flow
- Review URL state has first priority, followed by the owner-scoped durable cache, followed by a DeepSeek request on a miss.
- A per-cache-key in-flight map coalesces concurrent duplicate requests so one logical enrichment produces at most one provider call at a time.
- Expired or invalid cache rows are ignored; invalid rows are cleaned up when possible and a fresh provider request continues if configured.
- Cache read, write, and cleanup errors are treated as non-fatal. Provider failures and invalid responses remain safe failures and are not cached.
- Manual `重新分析` explicitly bypasses the cache once, with the warning `重新分析会再次调用 AI。`.
- AI output remains suggestion-only, requires explicit user acceptance, retains manual-priority and source-attribution rules, and never writes directly to Supabase.

### Unchanged Boundaries
- Deterministic extraction, source merging, the DeepSeek provider interface, review save behavior, the saved-place schema, map rendering, marker clustering, search, city filtering, city normalization, the coordinate resolver, and collections remain unchanged by the cache architecture.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused cache, DeepSeek, AI review-state, enrichment, and migration tests passed (`42` tests).

## Step 3 Production Logging And AI Privacy

### Diagnostic Policy
- DeepSeek diagnostics are emitted through a server-only structured logger.
- Safe diagnostic events are enabled by default only when `NODE_ENV=development`; `DEEPSEEK_DEBUG_LOGS=false` disables them.
- Production emits only actionable provider/cache failures and warnings. Successful cache hits, misses, bypasses, provider calls, and provider successes are omitted.
- Diagnostic payloads may contain model, prompt version, HTTP status, finish reason, validation outcome, operation duration, cache duration, and a short cache-key prefix.
- Full cache keys, user IDs, evidence hashes, source URLs, response JSON, AI suggestions, prompts, and evidence are never included.

### Raw Response And Error Handling
- Raw DeepSeek response text is omitted by default in all environments.
- Raw response logging requires `DEEPSEEK_DEBUG_RAW_RESPONSE=true` and is still limited to development; production cannot enable it.
- Source URLs are sanitized to hostnames only. Invalid values become `unknown-host`.
- Safe errors retain only operation, error name, sanitized message, provider error code, HTTP status, and retryable boolean. Production stack traces, request/response bodies, credentials, cookies, tokens, and database connection details are excluded.

### Evidence Privacy
- Pasted webpage evidence is passed only to the existing extraction/enrichment flow when needed.
- It is not emitted in diagnostics, not stored as raw cache content, and is not written to Supabase before explicit final place save.
- Cache behavior, AI eligibility, suggestion approval, review state, and deterministic extraction remain unchanged.

### Configuration
- `DEEPSEEK_DEBUG_LOGS` controls safe development diagnostics and is not exposed to the browser.
- `DEEPSEEK_DEBUG_RAW_RESPONSE` controls the development-only raw response opt-in and is not exposed to the browser.

### Validation
- Development cache miss and hit diagnostics were tested with concise, sanitized output.
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused logging, privacy, DeepSeek, cache, review-state, enrichment, and migration tests passed (`50` tests).

## Step 4 Read-Only Place Details

### View And Edit Separation
- `/restaurants/[id]` is the authenticated read-only place details route.
- `/restaurants/[id]/edit` remains the only edit surface. The details route uses the existing authenticated server Supabase client and owner-scoped RLS queries, returning not-found for missing or inaccessible records.
- A pure `place-details` projection shapes persisted data for display without changing saved values. It hides empty optional fields, preserves legacy `玩乐`, treats `cuisine` as the visible subcategory, and safely reduces source presentation to a hostname plus an external link.
- The current schema does not persist phone or image fields, so the details view omits phone and renders the existing no-image placeholder.

### Navigation And Collection Links
- Primary saved-place entry points now target `/restaurants/[id]`: dashboard cards, saved-list names, map popup details actions, and collection place cards.
- Editing remains an explicit action to `/restaurants/[id]/edit`.
- Collection summaries remain on `/collections`; their existing RLS-scoped query now includes lightweight place previews, and each preview links to the details route. Assigned collection badges on details link to existing collection anchors. The collections schema and join-table architecture are unchanged.

### Location Reuse
- The details page uses a lightweight client wrapper around the existing `MapLibreFoundation`, `createPlaceMarkerData`, marker popup, exact coordinate, approximate city fallback, and unresolved-location behavior.
- No parallel map implementation was added. Clustering, marker rendering, search, city filtering, city normalization, and coordinate resolution remain unchanged.

### Unchanged Systems
- Saved-place schema and Supabase migrations remain unchanged.
- Extraction architecture, source merging, Google Maps and Website extractors, DeepSeek provider behavior, AI review state, and save flow remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed; `/restaurants/[id]` is included as a dynamic route.
- Focused details, collection-card, saved-place-card, map-popup, location, and collection-membership tests passed (`25` tests).
- Interactive authenticated mobile validation was not run in this environment; automated validation did not create or save a place.

## Step 10A Vercel Production Deployment Preparation

### Environment And Auth
- `lib/supabase/env.ts` is the public configuration boundary. The app requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; missing values fail server Supabase construction clearly and return a safe client-unconfigured state.
- `next.config.ts` also validates those two required public variables and `NEXT_PUBLIC_PMTILES_URL` during production builds, so deployment configuration errors surface before a Vercel release.
- DeepSeek configuration is server-only. `DEEPSEEK_API_KEY` is optional, `DEEPSEEK_MODEL` defaults to `deepseek-v4-flash`, and diagnostic flags are not browser variables. `DEEPSEEK_DEBUG_RAW_RESPONSE` remains disabled unless explicitly enabled in development.
- The root/auth/protected-route redirect contract remains server-side and uses app-relative routes, not a hardcoded localhost origin. Supabase Auth Site URL and production redirect URLs must be set after the real Vercel hostname exists.

### Deployment Boundaries
- `next.config.ts` keeps the LAN IP in `allowedDevOrigins` solely for development-origin access; it is not a production CORS configuration.
- `/setup` is guarded with `notFound()` in production. Development fixtures are already disabled in production, and neither surface is linked from normal user navigation.
- Local PMTiles URLs are same-origin public paths, the MapLibre style contains no remote localhost/LAN asset URLs, and protocol registration is stable across map lifecycle remounts. The application has no service worker or offline cache for authenticated data.
- The Vercel runtime does not require application filesystem writes or long-running processes. Client components do not import server-only DeepSeek or service-role functionality. Production errors use existing concise recovery surfaces and redacted diagnostics.

### Asset Readiness
- `public/icon.svg` is the manifest/app icon and the manifest remains standalone with `/` scope and start URL so auth routing decides the first screen.
- `lib/map/pmtiles-config.ts` is the shared PMTiles URL boundary. It uses `/maps/base.pmtiles` against the current origin during local development and requires a valid HTTPS `NEXT_PUBLIC_PMTILES_URL` for preview/production. The resolver returns the same request URL used by both MapLibre's PMTiles protocol and bounded preflight.
- `public/maps/base.pmtiles` remains ignored by Git and local-only. The immutable production asset is uploaded separately to a public Blob pathname such as `maps/base-v1.pmtiles`; replacement uses a new versioned pathname rather than overwriting cached tile data.

### Documentation And Validation
- `.env.example` now separates public and server-only variables with safe defaults and no credentials. `memory-bank/deployment-checklist.md` records before/during/after deployment, Supabase Auth URL configuration, asset readiness, security checks, and rollback guidance.
- `git diff --check`, `npm run lint`, `NEXT_PUBLIC_PMTILES_URL=https://example.com/maps/base-v1.pmtiles npm run build`, `npm test`, and read-only migration-list validation are the release-preparation gate. No Supabase schema or data mutation is part of Step 10A.

## Saved-Place Edit Architecture

### Edit Surface
- `app/restaurants/[id]/edit/page.tsx` is a normal authenticated edit route with a compact back header, `编辑地点` identity, confirmed delete action, and the existing collection-membership section. Query failures and missing records use separate safe UI states.
- `components/restaurant-edit-form-card.tsx` owns one continuous controlled form. Visible values are submitted directly as the final edit payload, so manual name, city, district, country, address, category, subcategory, notes, and coordinates remain authoritative.
- Source URLs are preserved unchanged in storage and presented only as a compact host/link row. No new source extraction behavior is coupled to editing.

### Local Location Editing
- `lib/map/location-search.ts` provides bounded local candidates from the shared city-center and district-center datasets plus the current saved place. It performs no network lookup and does not invent coordinates for unknown locations.
- `components/maplibre-foundation.tsx` retains the existing marker/clustering pipeline and adds an opt-in editable mode only for the edit form: local candidate selection recenters the map, map taps set coordinates, and a draggable edit marker reports coordinate changes.
- Coordinates are validated against the existing latitude/longitude ranges. Null coordinates remain allowed. Search selection may update available location context because it is explicit; map movement updates coordinates only, preventing silent loss of manual text corrections.
- `lib/restaurants/record-payloads.ts` conditionally includes the full edit field set while preserving legacy callers and canonical known country/district normalization. No schema, RLS, authentication, extraction, AI, collections, or map-engine changes were required.

### Persistence And Safety
- `updateRestaurantAction` validates required name/city values and complete coordinate pairs, writes through the existing owner-scoped Supabase update path, and redirects to `/restaurants/[id]` after success.
- `deleteRestaurantAction` requires the client confirmation dialog, rechecks authentication, scopes deletion by both record id and authenticated user id, and redirects to `/restaurants` after success. Existing RLS remains the database boundary.

### Validation
- `git diff --check`, `npm run lint`, and `npm run build` passed.
- Full `npm test` passed with `365/365` tests, including edit-form contracts, local location search, full update payload coverage, existing map/location tests, and all prior extraction/AI/collections coverage.

## Step 9A Data Loading And Location Integrity

### Route Boundaries
- `/` is a server redirect into `/login` or `/dashboard`; authenticated login/sign-up pages redirect to `/dashboard`, and protected application/add routes use `requireAuthenticatedUser`.
- The normal user route set is `/dashboard`, `/menu`, `/restaurants`, `/collections`, `/map`, `/settings`, place detail/edit, and the focused manual/source/review add flow. No obsolete setup page is linked from the authentication or application surfaces.

### Restaurant Read Contract
- `lib/restaurants/query-compat.ts` owns the one restaurant projection: `id`, identity/source/privacy/category fields, `country`, `city`, `district`, `address`, `latitude`, `longitude`, and timestamps.
- `selectRestaurantsWithLocation` does not retry a legacy projection. Query failures are returned as bounded structured errors and logged through `lib/restaurants/query-diagnostics.ts` with operation and sanitized diagnostics only.
- List, details, map, dashboard, and collection-preview reads use the same projection. Collection and membership reads also emit safe diagnostics, and failed collection reads remain distinguishable from empty collections.
- Dashboard/map UI preserves the existing map and marker pipeline while rendering a query-failure state instead of incorrectly showing “no places.” Empty states are reserved for successful zero-row results.

### Remote Integrity Notes
- The verified remote schema contains nullable `country` and `district` columns, collection and join tables, the durable AI cache, owner-scoped authenticated RLS policies, and expected indexes/constraints. Existing restaurant rows were not changed.
- The local and remote district definitions were confirmed equivalent. The stale remote history entry `20260719072843` was repaired to `reverted`, and canonical local migration `20260719100000_add_restaurant_district.sql` was repaired to `applied`; this changed migration metadata only and left the remote schema/data unchanged.
- RLS remains the access boundary for places, collections, memberships, and cache rows. Application queries remain authenticated and owner-scoped; no public discovery path was added.

### QA Coverage
- Tests cover the formal location projection, safe query-error normalization/redaction, thrown-query handling, error-versus-empty map state, route guards, location hierarchy/filtering, collections, map behavior, and existing extraction/AI/save boundaries.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `351/351` tests.
- Remote migration listing was read-only and completed successfully; no migration or data mutation was performed in this checkpoint.

## District Migration History Reconciliation

### Canonical History
- `supabase/migrations/20260719100000_add_restaurant_district.sql` is the repository’s canonical district migration. It is additive only: `add column if not exists district text` plus `create index if not exists restaurants_district_idx on public.restaurants (district)`.
- The remote migration `20260719072843` was an exact equivalent under a different timestamp. Supabase’s supported `migration repair` workflow marked that stale version reverted and marked `20260719100000` applied. No migration SQL was executed against the already-correct schema.
- Final `npx supabase migration list` has local and remote versions aligned through `20260719100000`; no duplicate district migration is pending.

### Preserved Remote State
- `public.restaurants.district` remains nullable `text`, with no default, constraint, comment, function, or trigger. `restaurants_district_idx` remains the only district-specific index.
- Existing RLS, restaurant rows, and location projection behavior remain unchanged. Restaurant fingerprint remains 10 rows with IDs `[1, 2, 4, 5, 6, 7, 8, 9, 10, 11]` and ID sum `63`.

## Dashboard Regression Fix

### Discovery Composition
- `app/dashboard/page.tsx` remains the homepage composition root: `DashboardMapPreview`, the shared six-category icon grid, recent saved places, and collection highlights are rendered in discovery order. The map remains an embedded homepage feature rather than a primary navigation item.
- `homepageCategoryIcons` in `lib/restaurants/home-discovery.ts` is the shared icon contract for the canonical category list. The dashboard uses the existing `AppIcon` paths at a mobile-friendly size and retains direct `/restaurants?category=...` navigation.
- `appMenuNavigation` now intentionally contains only `/restaurants`, `/collections`, and `/account`. `/map` remains an existing internal route and is still linked from the dashboard map section.

### Migrated Location Read Contract
- `lib/restaurants/query-compat.ts` now centralizes the formal `restaurantSelectWithLocation` projection and forwards every read to it without legacy fallback or warning logging. The projection includes `country`, `city`, `district`, `address`, `latitude`, and `longitude` alongside the existing saved fields.
- `lib/restaurants/queries.ts` uses this projection for dashboard discovery, lists, details, map data, and collection place previews. This keeps location data consistent across all read surfaces and surfaces real query failures instead of converting schema errors to empty data.
- The remote `public.restaurants` table was verified with nullable `country` and `district` columns; the additive district migration also created `restaurants_district_idx`. Existing RLS and restaurant rows were preserved.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests.
- Authenticated browser validation at 390x844 confirmed homepage markers, category SVGs, recent and collection data, the three menu destinations, place-list loading, and the full MapLibre canvas.

## Dashboard Discovery Restoration

### Page Composition
- `app/dashboard/page.tsx` is the discovery composition root. It renders `DashboardMapPreview` first, then the shared category shortcuts, recent saved places, and collection highlights. The dashboard does not own navigation destinations beyond its brand link to `/menu` and quick add link to `/restaurants/new`.
- Map input is derived from the same discovery places returned by `getCurrentUserDiscoveryData`. The existing location resolver, exact/approximate marker metadata, marker generation, clustering, local filtering, and popup behavior are not duplicated or changed.

### Remote Schema Compatibility
- `lib/restaurants/query-compat.ts` provides a deliberately narrow read fallback for deployments where the local additive `country`/`district` migrations have not yet been applied remotely. It first uses the extended projection, retries only for explicit missing-column errors involving those optional fields, and normalizes legacy rows with `country: null` and `district: null`.
- `lib/restaurants/queries.ts` applies this helper to the owner-scoped place list, dashboard discovery, place details, map data, and collection place previews. The fallback does not alter Supabase schema, saved values, RLS predicates, collection relationships, or write behavior. It does not catch or mask unrelated query failures.
- The single-place query uses an array-shaped limited read so the compatibility layer has one stable result shape across extended and legacy projections. Collection summaries continue to use existing collection and join-table queries.

### Navigation Boundary
- The dashboard remains `/dashboard`; `/menu` remains a separate protected route with normal document scrolling and the four existing destinations. No persistent bottom navigation or navigation-specific modal state was restored.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests, including query compatibility, dashboard discovery, map rendering, collection previews, route navigation, and all existing regression suites.

## V1 UX Refinements

### Progressive Add Flow
- `components/add-method-chooser.tsx` is now a two-choice landing page. The link path for paste intake is always `/restaurants/new/source`; the former source-selection bottom sheet and source-specific URL screens are removed from the user flow.
- `components/source-intake-card.tsx` renders one generic URL intake. `startSourceIntakeAction` continues to pass the URL through the existing parser and review pipeline, where source detection remains internal and source attribution remains display-only.
- `lib/restaurants/add-flow.ts` retains only internal source classification vocabulary and generic paste routing. No extraction interface or source parser was changed.

### Automatic Location Presentation
- `RestaurantFormFields` and `RestaurantEditFormCard` render country as a compact auto-identification row with an optional correction control. The hidden/default country value still travels through existing save actions, so resolver priority and manual override semantics are preserved.
- Details replace separate country, city, and district blocks with the shared hierarchy label `country · city · district`. Existing `formatHierarchyLocationLabel` remains the single display formatter for cards, collections, list/search results, map popup, and details.

### Dashboard Category Grid
- The dashboard category section remains data-driven from `homepageCategories` and `getHomepageCategoryHref`. CSS now gives the six links a 3x2 layout, larger icon container, 76px minimum height, readable 17px labels, accessible focus styling, and one-hand touch spacing.
- No new state manager, route, query, category model, or backend behavior was introduced.

### Unchanged Boundaries
- Database architecture, district migration, location resolver, AI enrichment, extraction pipeline, collections, map engine, marker rendering, clustering, authentication, owner-scoped RLS, saved-place creation, and private-only behavior remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `319/319` tests.

## Step 9 Location Simplification And Area-Based Map Model

### Data And Resolver Layer
- `supabase/migrations/20260719100000_add_restaurant_district.sql` adds only nullable `restaurants.district` plus a lookup index. It contains no data rewrite, delete, truncate, drop, or table recreation.
- `lib/location.ts` is the shared conservative comparison/resolution layer. It canonicalizes only the known city, country, and district dataset, preserves unknown text, and resolves country from a known city without changing the saved city string.
- `resolvePlaceArea` combines explicit country/district, address evidence, and the local city-country/district dataset. It is used at save payload, extraction, manual evidence, and review-form boundaries. AI remains a later, explicitly accepted source rather than an automatic overwrite.
- `lib/map/area-centers.ts` contains a deliberately small district center dataset. `lib/map/place-location.ts` keeps stored coordinates as the highest-priority location, then resolves a compatible district center, then a compatible city center, otherwise leaves the location unresolved.

### Extraction And Review
- Normalized extraction results and source merge drafts now carry optional `district`. Google Maps URL address parsing, structured website `PostalAddress` parsing, and pasted visible-text parsing expose district only when local evidence supports it.
- Review and manual forms include an optional district field. Country is displayed as an auto-identified value with manual correction, while saved address text and city text remain user/source data rather than being rewritten by the resolver.
- AI factual context and accepted-field attribution include district. The existing factual-evidence validation, manual approval, cache behavior, and preview-only understanding suggestions are unchanged.

### UI And Map Composition
- `lib/location-hierarchy.ts`, `components/map-location-filter.tsx`, and `components/place-library-filters.tsx` share country -> city -> district filtering and URL state. Older records with `country = null` or no district continue to appear under their existing city/unassigned location identity.
- Place cards, details, collection cards, list rows, search results, and map popups use one hierarchy label formatter that omits empty or duplicated parts.
- The MapLibre engine, marker data pipeline, clustering, exact marker style, search behavior, and city/category filtering remain unchanged. Area fallback only adds an approximate resolution tier and never changes exact coordinates.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `317/317` tests.

## 全部地点 Library Filter Architecture

### Shared Filter Layer
- `lib/restaurants/place-library-filter.ts` is the pure adapter for the saved-place library. It composes the existing local search helper, shared country/city hierarchy filtering, and canonical category normalization without changing the map pipeline.
- The filter state contains `q`, normalized country identity, normalized city identity, and canonical category. Empty state means all places; no separate browsing mode is introduced.
- Filtering order is local search, country/city location matching, then category matching. The result is an AND intersection, so location, category, and search can narrow one another without remote lookups.

### UI And URL State
- `components/place-library-filters.tsx` provides the compact mobile filter bar and uses the shared `BottomSheet` primitive. City selection is one task grouped country -> city; category selection is a separate task with canonical labels and icons.
- City options are derived only from the currently loaded owner-scoped saved places and omit countries with no city options. Existing country/city aliases are normalized for comparison while saved display values remain unchanged.
- `/restaurants` serializes active state as URL parameters and keeps the default route unfiltered. Detail links include a validated `return_to` path so returning from a place restores the previous library filters.
- The list keeps the place cards as the primary content. No duplicate map filtering logic or new state-management layer was added.

### Compatibility Boundaries
- The existing `getCurrentUserRestaurants()` owner-scoped query, saved-place schema, category model, `玩乐 -> 娱乐` compatibility, location normalization, map search, map filtering, marker generation, clustering, extraction, AI, collections, and authentication remain unchanged.
- No database migration or saved-data rewrite was introduced for the library filters.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `310/310` tests, including default-all behavior, city/category filtering, country grouping, cross-country city separation, search composition, active-state URL handling, and clear-filter behavior.

## Step 9 Location Hierarchy UI

### Shared Location Layer
- `lib/location-hierarchy.ts` is the UI comparison layer over the existing `restaurants.country` and `restaurants.city` values. It provides conservative country/city identities, country and city option trees, `country · city` display formatting, local filtering, search terms, and URL-safe state serialization.
- It deliberately keeps `country = null` separate as `__unassigned_country__` / `未标注国家`; it never infers or writes a country for legacy records. Unknown country and city text remains available rather than being discarded.

### Map Composition
- `components/map-location-filter.tsx` composes the existing `BottomSheet` primitive into a two-step country then city selector. It supports country search for larger datasets, country-only states, all-country/all-city reset actions, and URL-backed state restoration.
- `components/map-browser.tsx` passes the normalized location state into the existing local search and map filter layer. Filtering still completes before `createMapMarkerResolution`, marker rendering, popup selection, or clustering; no MapLibre or coordinate behavior was changed.
- Search haystacks include raw and normalized country/city terms plus the combined country-city form, allowing queries such as `Japan Osaka` without remote lookups.

### Saved-List Hierarchy
- `components/location-hierarchy-browser.tsx` renders the authenticated `/restaurants` country -> city -> places navigation using links to the existing list route. The page applies the selected hierarchy locally after the existing RLS-scoped query; category filtering remains compatible.
- Shared country-first labels are used by place cards, collection cards, read-only details, list rows, and map popup view models. When a record has no country, the original city is displayed alone.

### Unchanged Boundaries
- No Supabase schema or migration, saved data, country migration, coordinate resolver, extraction, AI enrichment, collections data model, MapLibre engine, marker generation, clustering, or save flow changed.

### Validation
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `299/299` tests.

## Add Flow Simplification

### Route Structure
- `/restaurants/new` is a method chooser only. `components/add-method-chooser.tsx` renders the two add methods and uses the shared `BottomSheet` for source selection without nesting sheets.
- `/restaurants/new/manual` reuses `RestaurantFormCard` for the focused manual step. Existing form values, server action validation, review redirect, and save behavior are retained.
- `/restaurants/new/source` normalizes `source_type` through `lib/restaurants/add-flow.ts`, renders source-specific copy through `SourceIntakeCard`, and keeps URL validation errors within the source step.
- `lib/restaurants/add-flow.ts` is the pure flow vocabulary for add methods, source options, source URL routes, and safe fallback for invalid or refreshed source state.

### Flow Boundaries
- The flow is progressive disclosure: method choice first, source choice second for URL intake, URL input third, then the existing extraction/review/AI/edit/save pipeline.
- `startSourceIntakeAction` still uses `parseSourceIntakeInput` and redirects to `/restaurants/review`; `startRestaurantReviewAction` and `createRestaurantAction` remain the existing manual review/save boundaries.
- Back navigation from source input carries `source_type` back to `/restaurants/new`; the chooser reopens with that source selected. No new persistence or data model was introduced.

### Unchanged Systems
- Extraction architecture, Website and Google Maps extractors, DeepSeek provider/cache/review state, source merging, Supabase schema, collections, authentication, map, city/country hierarchy, and save behavior remain unchanged.

### Validation
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `303/303` tests.
- `git diff --check` passed.

## Final Mobile UI Refinement

### Dashboard Composition
- The authenticated dashboard is a compact map-first composition. Server-side discovery data includes the existing saved-place coordinates, and `DashboardMapPreview` converts them through `createMapMarkerResolution` before handing markers to the shared `MapLibreFoundation`.
- The dashboard renders only a three-place recent preview, up to three collection shortcuts, and six direct category links. It does not introduce a second map, search backend, recommendation layer, metric dashboard, or alternate data model.
- Empty mapped data preserves the map frame and shows `添加地点`; marker selection continues through the existing MapLibre popup and detail route.

### Navigation And Sheets
- `components/navigation.ts` is the single bottom-navigation definition: 首页 `/dashboard`, 地点 `/restaurants`, 添加 `/restaurants/new`, 收藏 `/collections`, and 我的 `/account`. The full `/map` route remains a normal internal destination rather than a bottom-nav item.
- `components/bottom-sheet.tsx` is the shared dialog primitive. It provides one focused task per sheet, shared overlay/radius/spacing, close and Escape actions, focus return, body scroll protection, and safe-area-aware layout. `CreateCollectionSheet` reuses the existing `createCollectionAction`; collection persistence and RLS are unchanged.
- `/account` is a minimal authenticated account destination for the new 我的 slot and does not add social, public, or collaboration behavior.

### Typography And Mobile Constraints
- `app/globals.css` defines the final mobile hierarchy: map height is constrained to approximately 260–300px, dashboard sections use compact spacing, recent cards omit nonessential metadata, and collection/category previews avoid large counts.
- Body/application normal text targets 17px; shared form controls, buttons, navigation labels, map preview copy, and category labels use the same readable scale. Secondary metadata may use 15px, while titles remain larger.
- Bottom navigation uses five balanced slots with 48px minimum touch height, a 72px maximum regular slot, safe-area padding, and a narrow-viewport fallback to avoid horizontal overflow. Sheets use a maximum 90% viewport height and internal scrolling for keyboard-safe interaction.

### Unchanged Boundaries
- No changes were made to Supabase schema, authentication, RLS, private-only behavior, extraction, DeepSeek, AI caching/review state, category normalization, collection relationships, detail/edit routes, coordinate resolution, marker generation, clustering, map search, or city filters.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `293/293` tests, including dashboard preview and bottom-navigation regression coverage.
- Browser viewport and keyboard/focus manual validation remains a follow-up because no authenticated interactive browser session was run during this checkpoint.

## Step 14 Personal-Only Product Mode

### Privacy Boundary
- `lib/restaurants/constants.ts` defines `personalOnlyPrivacy = "private"` as the application save boundary. Insert and update payload builders ignore incoming privacy values and always write `private`; review defaults and server actions use the same value.
- `privacy` remains in restaurant types, queries, and the database solely for compatibility with existing data and the existing `private` / `public` constraint. No migration removes the column and no existing rows are rewritten.
- Public rows, if present, are not discoverable: the app has no public place route, and all place, map, dashboard, collection, new, review, details, and edit routes require `requireAuthenticatedUser`. Supabase RLS remains the owner boundary for restaurants, collections, and restaurant memberships.

### UI Boundary
- Privacy controls were removed from manual entry, review confirmation, and edit forms. Normal list and details views no longer render privacy badges or public/private labels.
- Collections remain owner-scoped personal organization. No public collections, sharing links, collaboration controls, public profiles, followers, or social discovery routes were added.
- `source_url` remains an external source reference and is not treated as a sharing URL.

### Unchanged Systems
- Supabase schema, existing RLS policies, saved-place fields, map rendering, marker clustering, search, city filtering, city normalization, coordinate resolution, extraction, AI enrichment, and collection membership behavior remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused personal-only, save-boundary, review-form, details, collection, map, category, and RLS migration tests passed (`57` tests).
- A broader Node sweep reached `205/207` passing; the two failures are existing direct-Node module-resolution issues in `source-extraction.test.ts` and `source-url.test.ts`, unrelated to this change.

## Step 7 Real-Place Workflow Validation

### Validation Artifacts
- `memory-bank/v1-real-place-test-plan.md` defines the 20-case structured validation set, pass/partial/fail criteria, manual execution guidance, privacy rules, and the Step 8 findings taxonomy.
- `memory-bank/v1-real-place-validation-report.md` is the human-readable result report. It keeps raw evidence, full AI responses, credentials, and sensitive query-bearing URLs out of the record.
- This phase does not redesign the UI, add public or social behavior, change schema, or automatically save places. It is intended to provide the Step 8 redesign brief.

### Workflow Diagnostics
- `lib/restaurants/workflow-diagnostics.ts` provides server-only development events for `intake_started`, `source_detected`, `extraction_completed`, `ai_completed`, `review_ready`, and `suggestion_applied`.
- The logger sanitizes source context to hostnames and emits only event-safe metadata. `WORKFLOW_DEBUG_LOGS=false` disables the events; production never emits successful workflow diagnostics.
- DeepSeek cache hit/miss/bypass events continue to use the existing privacy-safe diagnostics logger. No raw evidence, form contents, AI response bodies, user IDs, credentials, or complete URLs are logged.

### Test-Runner Boundary
- `npm test` now standardizes the broad sweep through `scripts/register-test-loader.mjs` and `scripts/test-loader.mjs`. The loader uses the existing TypeScript dependency, resolves extensionless TypeScript imports, and maps the Next `@/` alias without changing application modules.
- Both previously failing files now execute their assertions. No assertions were weakened and no tests were removed.

### Unchanged Boundaries
- Personal-only privacy, authenticated owner-scoped access, RLS, saved-place schema, collections, extraction, AI suggestion-only behavior, map, and no-unconfirmed-save behavior remain enforced.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `285/285` tests.
- Focused personal-only, workflow-diagnostics, save-boundary, review-form, details, collection, map, category, and RLS migration tests passed (`59` tests).

## Navigation Simplification

### App Shell Navigation
- `components/app-shell.tsx` no longer renders a persistent bottom navigation bar. It provides the shared top app bar while preserving the existing route and server-side shell contract.
- `components/app-navigation-menu.tsx` is the client-side interaction layer for the brand-triggered destination sheet. It uses the existing `BottomSheet` focus and dismissal behavior and closes after a destination is selected.
- `components/navigation.ts` keeps the four app destinations in `appMenuNavigation`: `/restaurants`, `/collections`, `/map`, and `/account`. The add action is deliberately separate at `/restaurants/new`, and `/dashboard` is not duplicated in the menu.
- The top bar is safe-area-aware and exposes 44px-or-larger interactive targets. Navigation labels use the app's 17px reading scale; the dashboard category grid remains the existing 3-by-2 discovery surface.

### Preserved Boundaries
- This is a presentation and navigation-surface change only. Routes, authentication, owner-scoped queries, database schema, collections, map engine and clustering, extraction, AI enrichment, category behavior, and save flow are unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `320/320` tests.

## Dedicated Navigation Subpage

### Route-Based Navigation
- `components/app-navigation-menu.tsx` is now a server-safe brand link to `/menu`; it no longer owns open state or renders a navigation BottomSheet.
- `app/menu/page.tsx` is a protected normal route built on `AppShell`. It renders a vertically stacked, Notion-style navigation list for `/restaurants`, `/collections`, `/map`, and `/account`, with full-row touch targets and normal document scrolling.
- `AppShell` supports a back-style top bar variant for the menu page. `components/menu-back-button.tsx` uses router history when safe and falls back to `/dashboard`. The shared top-right `/restaurants/new` add action remains present.

### Scroll Safety
- Navigation-specific overlay, backdrop, portal, absolute positioning, and body scroll-lock state were removed. The shared `BottomSheet` component and `body[data-sheet-open]` rule remain only for unrelated sheets such as filters and collection creation.
- The menu page uses safe-area-aware app-shell spacing and a minimum 72px navigation row. It does not trap scrolling or leave modal state behind during route changes.

### Unchanged Boundaries
- Existing routes, authenticated owner-scoped access, database schema, collections, map engine and clustering, extraction, AI enrichment, category behavior, privacy rules, and save flow are unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `324/324` tests, including dedicated navigation route, destination, fallback-back, scroll, and mobile layout contracts.

## Final One-Screen Dashboard

### Dashboard Composition
- `app/dashboard/page.tsx` is the discovery homepage, separate from `app/menu/page.tsx`. It loads only `getCurrentUserRestaurantsForMap()` and maps the formal `country`, `city`, `district`, `address`, `latitude`, and `longitude` projection into the existing `DashboardMapPreview` pipeline.
- The dashboard composition is intentionally limited to the app bar, map, category discovery grid, and two quick-navigation shortcuts. It does not query or render recent-place cards, collection previews, statistics, recommendation content, or duplicate navigation.
- `components/dashboard-map-preview.tsx` keeps the existing MapLibre implementation and marker pipeline while presenting a compact 280px dashboard surface. The no-data state is user-facing and local: `还没有地点` / `添加地点后会显示在地图上`.

### Discovery Navigation
- `lib/restaurants/home-discovery.ts` owns the pure homepage configuration for the six canonical category links, category icon mapping, 3x2 grid contract, map height, and `地点`/`收藏` quick links.
- Category links navigate directly to `/restaurants?category={category}`. Quick links navigate to `/restaurants` and `/collections`; they do not duplicate data loading or introduce a second filtering architecture.
- The shared top-left brand trigger continues to navigate to the dedicated `/menu` route, and the top-right add action remains globally available. Persistent bottom navigation remains removed.

### Boundaries
- The map remains a primary discovery feature rather than a primary navigation destination. MapLibre rendering, marker generation, clustering, coordinate handling, location resolution, city/country/district behavior, search, collections, extraction, AI enrichment, authentication, private-only saves, and Supabase schema remain unchanged.
- Recent places are deeper library content at `/restaurants`, and collection content remains at `/collections`; 首页 is intentionally not a management page.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests.
- 390x844 browser validation confirmed the app bar, map, six category tiles, two shortcut cards, no recent/collection preview sections, and no horizontal overflow.

## V1 Email-Only Login Architecture

### Login Composition
- `app/login/page.tsx` is a dedicated authentication surface rather than an `AppShell` dashboard page. It renders the existing `SiteBrand`, a narrow centered `AuthCard`, and no dashboard navigation or technical side panel.
- `components/auth-card.tsx` remains shared with sign-up but supports the login variant, concise error/status semantics, 17px labeled fields, and the existing alternate route. `components/password-field.tsx` owns local visibility state and accessible toggle naming; `components/auth-submit-button.tsx` uses `useFormStatus` for the existing server-action pending state.
- `components/site-brand.tsx` accepts a page-specific subtitle while preserving the same star-and-dot identity everywhere else.

### Safety And Boundaries
- `lib/auth/login-ui.ts` sanitizes provider-facing login errors for display without changing the Supabase action or session flow. Local form validation copy remains available.
- Login redirects still originate in `app/auth/actions.ts` and use the one-time `login_success=1` signal consumed by `LoginSuccessToast`. The signal is removed with `history.replaceState`; it is not stored in the database, localStorage, or persistent dashboard state.
- No OAuth provider, external authentication API, schema change, map change, collection change, or sign-up flow redesign was added.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `332/332` tests.
- Source-level login contracts cover brand/name, email/password fields, accessible password toggling, pending submission, safe errors, omitted social controls, and the preserved success redirect. Browser layout validation was blocked by the already-authenticated shared session redirecting `/login` to `/dashboard`; no session state was modified.

## Step 9B Mobile, PWA, Keyboard, And Production Hardening

### Mobile Shell And Forms
- `app/globals.css` centralizes safe-area-aware spacing for the app shell, sticky app bar, auth pages, bottom sheets, toast, and sticky review actions. Normal text and controls remain at readable mobile sizes rather than being compressed to fit.
- Form controls expose mobile keyboard intent through `enterKeyHint`, use scroll margins for keyboard visibility, and continue using normal document flow. No global `visualViewport` position hack or persistent body lock was introduced.
- `components/bottom-sheet.tsx` owns the interaction contract for all short-choice sheets: a single dialog task, bounded independent scrolling, Escape/backdrop close behavior, focus trap, focus restoration to the opening trigger, and body scroll cleanup on close/unmount.

### PWA Boundary
- `app/manifest.ts` defines the installable shell: `name`/`short_name` `存个地`, `display: standalone`, `start_url: /`, `scope: /`, accent/background colors, and the approved `public/icon.svg` icon. `app/layout.tsx` also exposes the icon and iOS web-app metadata.
- The root start URL is intentional: the existing server-side auth routing decides whether standalone launch continues to `/dashboard` or `/login`. No fake install prompt or unsupported splash-screen behavior was added.
- There is no application service worker. V1 stays online-first and avoids caching authenticated API responses, session responses, or user-specific Supabase data. Full offline mode remains deferred.

### Map And Error Recovery
- `components/maplibre-foundation.tsx` creates one MapLibre instance per mounted component, refreshes marker clusters from MapLibre zoom events without React zoom-state rerenders, resizes on window/visual-viewport changes, and removes markers, listeners, and the map on unmount.
- `components/route-error-state.tsx` is the shared safe recovery surface used by route-level `error.tsx` boundaries for dashboard, places/details/review, collections, map, and the app shell. Production users see concise retry/home actions; raw error details are development-only.

### Production Privacy And Configuration
- `app/auth/actions.ts` now places sanitized login/sign-up messages in redirect state instead of raw Supabase provider errors. Existing authentication/session logic and one-time login toast behavior are unchanged.
- DeepSeek diagnostics remain environment-gated and redacted: production keeps only actionable sanitized failures, development events use host-only source context and short cache-key prefixes, and raw response logging remains explicitly opt-in and disabled by default.
- `.env.example` documents public Supabase/PMTiles configuration, optional `NEXT_PUBLIC_APP_URL`, and server-only DeepSeek configuration without credentials. RLS, owner-scoped queries, private saves, collections, extraction, and cache behavior are unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `359/359` tests.
- Read-only `npx --yes supabase@latest migration list` confirmed all eight local and remote migration versions align; no database mutation was performed.
- Browser-driven 375/390/393/430 viewport and standalone-install checks remain manual follow-up because this session's in-app browser could not connect to the local dev server.

## Auto-Filled Review Architecture

### Draft Assembly
- `app/restaurants/review/page.tsx` still runs the existing source detector, extraction pipeline, source merge, eligibility check, cache/provider flow, and URL-backed review state. After normalization, it derives safe auto-applied AI fields and reuses the existing editable `MergedPlaceDraft` path.
- `lib/restaurants/ai-enrichment-merge.ts` exposes `getAutoAppliedAIFields` and `applyAutoAIEnrichment`. These helpers allow only persistable, non-preview fields with medium/high confidence to fill empty fields. Manual sources and existing deterministic values are never replaced; accepted/automatic AI attribution remains `ai_suggestion`.
- `lib/restaurants/ai-review-state.ts` and `lib/restaurants/ai-enrichment.ts` preserve optional per-field confidence in snapshots. This keeps low-confidence decisions stable across refresh, cache restoration, reanalysis, and redirect cycles.

### Review Surface
- `components/extraction-confirmation-card.tsx` is the primary review surface. It combines host/source status, required-field messaging, compact location/form editing, optional details, and the existing save action form.
- `components/restaurant-form-fields.tsx` supports `compactReview`, which places source URL and street address under `更多地点信息` while retaining persisted fields and direct editing. `components/review-save-button.tsx` provides a single explicit, duplicate-resistant save action.
- `components/review-collection-selector.tsx` synchronizes URL-backed draft values and checked collection ids before collection creation, so the existing join-table flow returns to the same editable draft.
- The prior AI acceptance card and final preview card remain available as modules for compatibility but are not rendered in the standard review flow. Reanalysis is secondary under `更多操作`; preview-only AI fields are not exposed as save controls.

### Safety Boundaries
- Automatic application is suggestion-only at the draft layer. Deterministic extraction precedes AI, manual edits take priority, low-confidence factual data remains empty, and no AI path writes directly to Supabase. The final server action still validates the visible form values and enforces private save behavior.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `322/322` tests.

## Step 6 Generalized Place Category Architecture

### Canonical Module
- `lib/restaurants/constants.ts` is the single category authority. It exports the canonical ordered values `美食`, `景点`, `住宿`, `购物`, `娱乐`, `其他`, shared labels/descriptions/subtype configuration, evidence terms, `normalizePlaceCategory`, and `getPlaceCategoryLabel`.
- The compatibility alias `玩乐 -> 娱乐` is intentionally retained for existing saved records and internal extraction compatibility. It is normalized only at comparison, filtering, review/display, and save boundaries; existing database rows are not rewritten.
- New and edited save payloads, review defaults, query filters, homepage counts, map search, place cards, details, popups, collection cards, source review, extraction review, and AI review all consume the canonical layer.

### Category Flow
- Manual evidence and AI understanding use the shared evidence vocabulary rather than separate category alias tables. AI mappings accept only supported general-place signals and leave unsupported values unaccepted.
- The restaurant list maps `娱乐` filters to both `娱乐` and legacy `玩乐` records. Homepage counts use the same normalized bucket. Map search remains local and matches canonical category, legacy category, cuisine/subcategory, city, address, and notes before marker generation.
- Save validation rejects invalid category values. Canonical values are written for new or edited records, while legacy values remain readable and compatible.

### Unchanged Boundaries
- No Supabase schema or migration change was required because the existing category constraint already supports the canonical six values and legacy `玩乐`.
- Map rendering, marker generation, clustering, coordinate resolution, city normalization/filtering, collections, extraction and source merging, DeepSeek provider behavior, and saved-place data remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused category, save-boundary, review-form, home-discovery, map-filter, marker, popup, card, details, collection, and manual-evidence tests passed (`58` tests).
- Interactive browser validation was not run in this environment; no place was created or modified during automated validation.

## Step 5 Homepage Experience

### Authenticated Dashboard
- `/dashboard` is the focused `存个地` home: a single primary `添加地点` action, compact recent saved places, collection summaries, generalized category shortcuts, and map/search access.
- Recent cards reuse `PlaceCard` and its `/restaurants/[id]` details target. The dashboard derives a newest-first compact preview from the discovery result and provides a full-list link to `/restaurants`.
- Collection cards link to existing `/collections#collection-{id}` anchors. Category cards link to the existing `/restaurants?category={category}` list route rather than adding a second filtering system.
- The dashboard uses the existing `AppShell`, including the mobile bottom navigation and existing add affordance, with spacing and minimum touch targets that keep the primary action visible on small screens.

### Discovery Derivations
- `lib/restaurants/home-discovery.ts` is a pure local layer for recent-place limiting, generalized category counts, category routes, and the map route.
- Category counts normalize legacy `玩乐` to the display bucket `娱乐`; saved category values remain unchanged.
- The dashboard makes one owner-scoped discovery data request and derives recent items, category counts, and collection counts locally. Error text is replaced with safe generic UI messaging.
- `getCurrentUserRestaurants(category)` supports the same list route for category shortcuts and matches both `娱乐` and legacy `玩乐` when the `娱乐` filter is selected.

### Unchanged Systems
- Supabase schema, authenticated owner-scoped access, place details, edit flow, collections data model, extraction architecture, DeepSeek behavior, map architecture, marker clustering, location resolver, and authentication remain unchanged.
- No recommendation, social, favorite-ranking, public-collection, or alternate search backend was added.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused homepage, navigation, category, place-card, collection-card, and collection-membership tests passed (`14` tests).
- Interactive authenticated mobile validation was not run in this environment; automated validation did not create or save a place.
