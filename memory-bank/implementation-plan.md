# V1 Implementation Plan

## Plan Goal
Build only the current V1 web app described in the PRD:
- email and password login
- source intake from links or sharing text
- conservative extraction with explicit review before save
- manual fallback
- six-category place saving
- list and edit flows
- post-save coordinate enrichment when possible
- simple Amap-based map browsing for records with coordinates

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
- 高德地图 / Amap is the primary V1 mainland-China provider for map rendering, POI search, and geocoding.
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
- No Amap integration has started

## Current Validated Checkpoint
The repository is currently validated through:
- Step 12 confirmation-before-save
- place-category migration
- six-category conservative extraction

The main remaining V1 gaps are:
- real 高德 foundation
- 高德-aware source normalization
- coordinate enrichment
- real map rendering
- city filtering and no-coordinate polish
- reassessment of whether multi-candidate extraction is still truly needed for V1

## Remaining V1 Sequence

### Next Step A: 高德 foundation and setup health check
Scope:
- Add Amap environment/config handling
- Add a server-side Amap Web Service client foundation
- Normalize Amap request and response error handling
- Surface Amap setup status on the setup page
- Do not change save behavior, extraction behavior, or map behavior yet

Dependencies:
- Completed Step 2 setup foundation
- Completed Step 3 auth foundation

Manual test:
- Start the app with and without Amap configuration present
- Open the setup page
- Confirm the app clearly reports whether Amap configuration is ready
- Confirm no create, review, list, or edit behavior changes

Automated test expectations:
- Environment parsing tests
- Server-side Amap client request construction tests
- Normalized error handling tests for missing config, failed response, and quota-like failure cases

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step B: 高德 link/share-text normalization
Scope:
- Recognize 高德 source URLs and sharing text more explicitly
- Normalize official 高德 source intake into the existing Step 12 review flow
- Preserve the current review/confirmation architecture
- Keep no-auto-save behavior
- Keep graceful fallback when normalization is weak or unavailable

Dependencies:
- Next Step A complete and validated
- Existing Step 10 intake and Step 12 review flow

Manual test:
- Paste a valid 高德 URL
- Paste representative 高德 sharing text
- Confirm intake lands in the existing review flow
- Confirm weak or malformed 高德 input falls back gracefully instead of blocking manual save

Automated test expectations:
- Source recognition tests for 高德 URLs
- Sharing-text normalization tests
- Graceful fallback tests for malformed or partial 高德 inputs

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step C: post-save coordinate enrichment
Scope:
- Preserve save-first behavior
- After save, attempt forward geocoding using Amap Web Service
- Use POI search fallback only when appropriate
- Use existing `latitude` / `longitude` columns
- Preserve saved records even when enrichment fails
- Do not block save on weak enrichment results

Dependencies:
- Next Step A complete and validated
- Existing save flow from Step 7 and Step 12

Manual test:
- Save one place with a strong address or city and confirm coordinates are added
- Save one place with incomplete location data and confirm the record still saves without coordinates
- Confirm existing list/edit behavior remains intact

Automated test expectations:
- Save-then-enrich flow tests
- Forward geocoding success and failure handling tests
- POI fallback tests for appropriate weak-address cases
- Tests confirming failed enrichment does not remove or corrupt saved records

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step D: real 高德 map
Scope:
- Replace the map placeholder with a real Amap-backed map
- Render markers for records that have coordinates
- Keep records without coordinates available in the list only
- Keep the map behavior simple

Dependencies:
- Next Step C complete and validated

Manual test:
- Save several records, including some with coordinates
- Open the map page
- Confirm the map renders
- Confirm coordinate-bearing records show markers
- Confirm records without coordinates are still not treated as broken

Automated test expectations:
- Map page integration smoke coverage where practical
- Serialization tests for marker data passed to the map layer
- Basic guard tests for empty marker state

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step E: city filtering and incomplete-location polish
Scope:
- Add a simple city filter or city list
- Improve no-coordinate states in list and map-adjacent UI
- Keep the experience understandable when some records cannot be mapped
- Do not add advanced clustering

Dependencies:
- Next Step D complete and validated

Manual test:
- Save records across at least two cities
- Confirm city filtering works
- Confirm records without coordinates remain clearly usable in the list
- Confirm no-coordinate states are explicit rather than confusing

Automated test expectations:
- City filter behavior tests
- No-coordinate display-state tests
- Regression coverage for mixed coordinate and non-coordinate datasets

Database migration required:
- No

Validation rule:
- Do not start the next step until this step is manually and automatically validated.

### Next Step F: reassess multi-candidate extraction
Scope:
- Reassess whether multi-candidate extraction is still required by the updated PRD
- Do not assume it must be built
- Only retain it if the updated PRD still requires it
- If retained, merge simple bulk review into the same step rather than splitting them

Dependencies:
- Updated PRD direction confirmed
- Next Step B complete and validated

Manual test:
- If the step is retained, use a representative multi-place source and confirm the user can review and save the intended subset
- If the step is removed from V1, confirm planning documents clearly reflect that reclassification

Automated test expectations:
- If retained: multi-candidate selection and multi-save regression tests
- If removed: no new automated coverage required beyond documentation alignment

Database migration required:
- No

Validation rule:
- Do not start the final V1 pass until this step has either been implemented and validated or explicitly removed from V1 with documentation alignment.

### Final Step: V1 acceptance pass
Scope:
- Verify the full V1 user journey end to end
- Check the app against the updated PRD and validated implementation sequence
- Confirm auth, source intake, extraction/review, manual save, category/subtype handling, list/edit, Amap enrichment, map behavior, and fallback behavior all work together

Dependencies:
- All retained V1 steps above complete and validated

Manual test:
1. Sign up with a new account
2. Paste a supported source URL or sharing text
3. Review and edit the extracted place draft
4. Save the place
5. Manually save another place as a fallback path
6. Confirm category and subtype persist correctly
7. Edit a saved record
8. Confirm enrichment succeeds for at least one place and fails gracefully for another
9. Open the saved list and confirm all records remain usable
10. Open the map and confirm coordinate-bearing records appear
11. Confirm no-coordinate records remain available in the list without breaking the map experience

Automated test expectations:
- End-to-end regression coverage for critical V1 flows where practical
- Focused regression coverage for save, review, enrichment, and map data preparation

Database migration required:
- No, unless a future retained V1 step discovers a truly necessary additive migration

Validation rule:
- Do not declare V1 complete until this pass is validated.

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
1. Next Step A: 高德 foundation and setup health check
2. Next Step B: 高德 link/share-text normalization
3. Next Step C: post-save coordinate enrichment
4. Next Step D: real 高德 map
5. Next Step E: city filtering and incomplete-location polish
6. Next Step F: reassess multi-candidate extraction
7. Final Step: V1 acceptance pass
