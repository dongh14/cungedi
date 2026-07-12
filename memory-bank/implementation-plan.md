# V1 Implementation Plan

## Plan Goal
Build only the current V1 web app described in the PRD:
- email and password login
- source intake from links or sharing text
- conservative extraction with explicit review before save
- manual fallback
- six-category place saving
- list and edit flows
- conservative coordinate handling when possible
- simple open-source map browsing for records with exact or approximate placement

This plan is intentionally small and does not include V2 or future expansion ideas.

## Product Direction Notes
- The product is now `存个地`, a Chinese-first personal place collection app.
- The default V1 UI language should be Simplified Chinese.
- English remains a later secondary option.
- The product should remain mobile-first and comfortable on iPhone screens.
- The visual direction should keep the orange accent near `#FF5B00`.
- High-confidence review and explicit confirmation remain mandatory before save.
- Extraction remains conservative and best-effort.
- Owner-only data access remains the default.
- `public` / `private` remains a stored per-record flag only.
- The V1 map stack should use MapLibre GL JS with self-hosted PMTiles based on OpenStreetMap-derived data.
- V1 does not use Google Maps, Apple Maps, 高德, Mapbox, or any paid / metered map API dependency for rendering.
- V1 does not use OpenStreetMap public tile servers as the production tile backend.
- 大众点评、小红书、抖音 remain best-effort sources.
- 百度地图 remains a secondary, best-effort input source only.
- Google Maps remains optional overseas support.

## Working Rules
- Keep one app and one codebase.
- Prefer the simplest solution that satisfies the PRD.
- Do not add advanced AI extraction in V1.
- Do not add social login in V1.
- Do not add public discovery features in V1.
- Do not build custom scraping infrastructure for 小红书 or 抖音 in V1.
- Do not build full translation infrastructure unless a current step explicitly requires it.
- Finish and validate one small step before starting the next.

## V1 Compatibility Decisions To Preserve
- `public.restaurants` remains unchanged through V1.
- `/restaurants` routes remain unchanged through V1.
- `cuisine` remains temporary subtype storage through V1.
- Current extraction modules and TypeScript types may remain restaurant-named internally through V1.
- No route, table, module, type, or column rename work is required before V1 completion.

## Completed Historical Work

### Step 1: Project setup
Status:
- Complete and validated.

Scope completed:
- Base Next.js app
- TypeScript
- Tailwind CSS
- Initial app shell

### Step 2: Supabase project setup
Status:
- Complete and validated.

Scope completed:
- Supabase environment wiring
- Setup/health-check entry point

### Step 3: Authentication
Status:
- Complete and validated.

Scope completed:
- Email/password sign-up
- Login
- Logout
- Protected routes

### Step 4: Database schema for V1 records
Status:
- Complete and validated.

Scope completed:
- `public.restaurants`
- Required fields
- Optional `latitude` / `longitude`
- `privacy`
- `source_url`

### Step 5: Data security rules
Status:
- Complete and validated.

Scope completed:
- Owner-only RLS
- `public` / `private` stored flag behavior

### Step 6: Basic app layout and navigation
Status:
- Complete and validated.

Scope completed:
- Main route structure
- Chinese-first app shell
- Mobile-first navigation
- Placeholder map route

### Step 7: Manual creation
Status:
- Complete and validated.

Scope completed:
- Signed-in manual create flow
- Chinese text input
- Required and optional field handling

### Step 8: Saved list
Status:
- Complete and validated.

Scope completed:
- User-scoped saved-place list
- Card-based list UI

### Step 9: Edit flow
Status:
- Complete and validated.

Scope completed:
- Saved-record edit route
- Note / privacy / subtype-compatible editing path

### Step 10: Source intake
Status:
- Complete and validated.

Scope completed:
- Paste URL or share text
- Extract first valid URL
- Start review flow

### Step 11: Conservative extraction
Status:
- Complete and validated.

Scope completed:
- Server-side fetch
- Metadata and visible-text parsing
- Structured-data-first extraction
- Graceful fallback when extraction is weak

### Step 12: Explicit review and confirmation before save
Status:
- Complete and validated.

Scope completed:
- Editable confirmation screen
- No auto-save
- Shared save path with manual creation

### Validated place-category migration
Status:
- Complete and validated.

Scope completed:
- `category` added to `public.restaurants`
- Six allowed V1 categories:
  - `美食`
  - `购物`
  - `玩乐`
  - `景点`
  - `住宿`
  - `其他`
- Current route/table/column names preserved
- `cuisine` retained as temporary subtype storage

### Validated six-category conservative extraction expansion
Status:
- Complete and validated.

Scope completed:
- Conservative category-aware extraction now exists for:
  - `美食`
  - `购物`
  - `玩乐`
  - `景点`
  - `住宿`
  - `其他`
- Confirmation architecture remains Step 12 single-candidate review-first
- No Step 13 multi-candidate work has started
- No open-source map integration has started

## Current Validated Checkpoint
The repository is currently validated through:
- Step 12 confirmation-before-save
- place-category migration
- six-category conservative extraction

The main remaining V1 gaps are:
- MapLibre foundation
- PMTiles basemap integration
- conservative city-level coordinate fallback
- marker rendering
- city filtering and no-coordinate polish
- final V1 acceptance pass
- reassessment of whether multi-candidate extraction is still truly needed for V1

## Remaining V1 Sequence

### Next Step A: MapLibre foundation
Scope:
- Add the minimal MapLibre client-side foundation for the existing `/map` route
- Introduce browser-safe map configuration only
- Keep the current placeholder flow boundaries intact until the map is actually wired in this step
- Do not change save behavior, extraction behavior, review behavior, auth, or RLS

Dependencies:
- Completed Step 6 app layout foundation

Manual test:
- Open the existing `/map` route
- Confirm the page can load the new map foundation without introducing third-party paid SDK dependencies
- Confirm no create, review, list, or edit behavior changes

Automated test expectations:
- Basic map page integration smoke coverage where practical
- Serialization or config tests for browser-safe map initialization

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step B: PMTiles basemap integration
Scope:
- Integrate a self-hosted PMTiles basemap for the map page
- Use OpenStreetMap-derived vector data
- Do not use OpenStreetMap public tile servers as the production backend
- Keep the map experience simple and fast

Dependencies:
- Next Step A complete and validated
- Basemap artifact and hosting path prepared

Manual test:
- Open the map page
- Confirm the basemap loads from the intended self-hosted PMTiles-backed source
- Confirm no paid or metered map provider is involved

Automated test expectations:
- Map source and layer configuration tests where practical
- Guard tests for missing or malformed basemap configuration

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step C: city-level coordinate fallback
Scope:
- Preserve save-first behavior
- Add conservative city-level or region-level coordinate fallback for map browsing
- Use existing `latitude` / `longitude` columns
- Do not invent exact POI coordinates
- Clearly distinguish exact coordinates from approximate placement in application logic and future UI

Dependencies:
- Existing save flow from Step 7 and Step 12

Manual test:
- Save one place with exact coordinates and confirm they remain unchanged
- Save one place without exact coordinates but with a strong city and confirm conservative fallback data can support map browsing
- Save one place with insufficient location detail and confirm the record still saves without coordinates
- Confirm existing list/edit behavior remains intact

Automated test expectations:
- Fallback selection tests for city / region-level placement
- Tests confirming weak evidence does not produce fake exact coordinates
- Tests confirming failed fallback does not remove or corrupt saved records

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step D: marker rendering
Scope:
- Replace the map placeholder with a real MapLibre-based map
- Render markers for records that have exact or approximate placement
- Keep records without any usable placement available in the list only
- Keep the map behavior simple

Dependencies:
- Next Step C complete and validated

Manual test:
- Save several records, including some with coordinates
- Open the map page
- Confirm the map renders
- Confirm exact and approximate coordinate-bearing records show markers
- Confirm records without coordinates are still not treated as broken

Automated test expectations:
- Map page integration smoke coverage where practical
- Serialization tests for marker data passed to the map layer
- Basic guard tests for empty marker state

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step E: city filtering and no-coordinate polish
Scope:
- Add city filtering to the map browsing experience
- Clearly mark approximate placements in the UI
- Ensure records without coordinates remain understandable and usable
- Keep the experience simple and V1-sized

Dependencies:
- Next Step D complete and validated

Manual test:
- Save records across multiple cities
- Filter by city and confirm the list and map reflect the selected city correctly
- Confirm approximate placements are clearly labeled
- Confirm no-coordinate records still have a clear non-broken fallback presentation

Automated test expectations:
- City filtering behavior tests
- Approximate-marker labeling tests where practical
- Empty-state and no-coordinate guard tests

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step F: V1 acceptance pass
Scope:
- Run a final V1 acceptance pass across auth, source intake, review, save, list, edit, and map browsing
- Reconfirm that exact-coordinate, approximate-coordinate, and no-coordinate records all behave acceptably
- Reassess whether multi-candidate extraction is still necessary for V1 before any Step 13 decision

Dependencies:
- Next Step E complete and validated

Manual test:
- Execute the core end-to-end flows from the PRD
- Confirm no validated earlier step regressed
- Confirm the map experience meets the V1 browsing bar without implying navigation-grade precision

Automated test expectations:
- Final targeted regression pass across the validated flows most likely to be affected by map integration

Database migration required:
- No

Validation rule:
- Do not start Step 13 until this pass is complete and accepted.

## Out Of Scope For This Plan
- Rich AI-generated place descriptions
- Google login or WeChat login
- Desktop app
- Public discovery features
- Perfect extraction across all social platforms
- Advanced clustering
- Neighborhood-scale map intelligence
- Recommendations, rankings, or community features

## Revised Remaining Build Order Summary
1. Next Step A: MapLibre foundation
2. Next Step B: PMTiles basemap integration
3. Next Step C: city-level coordinate fallback
4. Next Step D: marker rendering
5. Next Step E: city filtering and no-coordinate polish
6. Next Step F: V1 acceptance pass
