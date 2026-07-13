# Progress

## Current Status
Step 1 is complete and has been validated.

Step 2 is complete and has been validated.

Step 3 is complete and has been validated.

Step 4 is complete and has been validated.

Step 5 is complete and has been validated.

Step 6 is complete and has been validated.

Step 7 is complete and has been validated.

Step 8 is complete and has been validated.

Step 9 is complete and has been validated.

Step 10 is complete and has been validated.

Step 11 is complete and has been validated.

Step 12 is complete and has been validated.

The product is now paused before Step 13 so the restaurant-only direction can be generalized into `存个地`, a Chinese-first personal place collection app.

The first small, reversible `存个地` generalization migration step is now complete and has been validated without starting Step 13.

The second small, reversible `存个地` extraction migration step is now complete and has been validated without starting Step 13.

The third small, reversible `存个地` extraction migration step is now complete and has been validated without starting Step 13.

The fourth small, reversible `存个地` extraction migration step is now complete and has been validated without starting Step 13.

The fifth small, reversible `存个地` extraction migration step is now complete and has been validated without starting Step 13.

Migration Steps 3A through 3E are complete and manually validated.

All six V1 categories now have conservative extraction support:
- `美食`
- `住宿`
- `景点`
- `购物`
- `玩乐`
- `其他`

The MapLibre foundation step is now complete and has been validated.

The PMTiles basemap step is now complete and has been validated without starting geocoding or Step 13.

The city-level coordinate fallback step is now complete and has been validated without starting geocoding or Step 13.

The marker rendering step is now complete and has been validated without starting clustering, search, geocoding, or Step 13.

The city filtering and no-coordinate polish step is now complete and has been validated without starting clustering, search, geocoding, map editing, or Step 13.

The V1 map polish step is now complete and has been validated without changing the map architecture or starting deferred map work.

The Step 13 local place search checkpoint is now complete and has been validated with local-only `/map` search, without schema changes, external APIs, or geocoding.

The city normalization checkpoint is now complete and has been validated with a conservative local comparison layer, without schema changes or external APIs.

## Validated City Normalization Checkpoint

### Normalization Scope
- The map system now has a conservative city normalization layer used only during comparison, filtering, and location resolution.
- The normalization layer supports explicit Chinese and English aliases for cities already present in the local known city dataset.
- Original database `city` values remain unchanged.
- Original saved city text remains the text shown when rendering saved places.
- Unknown cities remain unchanged for comparison and unresolved for location fallback.

### Shared Comparison Behavior
- City filtering now compares saved city values through the shared normalization layer.
- Local search matching now uses the same normalization layer when matching city aliases.
- Location resolution now continues through the same conservative normalization layer used by filtering and search.
- Search, city filtering, and location resolution now share one normalization path instead of diverging by feature.

### Boundaries
- No database schema changes were made.
- No saved city values were rewritten.
- No external APIs were added.
- No geocoding was added.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `node --test lib/map/*.test.js` passed (`33` tests).

## Validated Step 13 Local Place Search Checkpoint

### Map Scope
- `/map` now provides local client-side place search on top of the existing RLS-scoped saved-place load.
- Search matches the existing loaded place data by `name`, `city`, and `category`.
- Search combines with the existing city filter instead of replacing it.
- The current user's places are still loaded once through the existing `/map` query and then filtered locally in the browser.
- No database schema, migration, or server query shape changed for this checkpoint.

### Filtering And Marker Behavior
- Search filtering happens before coordinate resolution and before MapLibre marker rendering.
- Only the filtered subset is passed into the existing marker-resolution path.
- The existing exact-coordinate and approximate city-center resolver behavior remains unchanged.
- Existing exact versus approximate marker presentation remains unchanged.
- Unresolved places are still skipped rather than receiving invented locations.

### Boundaries
- No database schema changes were made.
- No external APIs were added.
- No geocoding was added.
- No coordinate writeback behavior was added.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `node --test lib/map/*.test.js` passed (`31` tests).

## Validated V1 Map Polish

### Presentation And Feedback
- `/map` now has stable loading feedback for both route-level place loading and local MapLibre basemap loading.
- The map provides Chinese-first empty states when the current user has no saved places and city-empty states when the selected city has no matching places.
- Place-loading failures and local map asset failures show friendly Chinese recovery messages without changing saved data.
- The city filter keeps its existing local filtering behavior while using a more compact, mobile-friendly presentation.
- Marker popups now use a compact card layout with the place name, city, optional category, and a clear approximate-location warning when the marker is city-level.

### Mobile Validation
- The authenticated `/map` route was manually validated at `390x844`.
- The city filter, markers, popup card, and bottom navigation remain usable with no horizontal scrolling.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused map tests passed (`27` tests).
- Manual browser validation passed.

### Architecture Boundaries
- No database schema changes were made.
- No exact or fallback coordinates are written back to Supabase.
- No external APIs were added.
- Clustering has not started.
- Search has not started.
- Geocoding has not started.
- Map editing has not started.
- Step 13 has not started.

## Validated City Filtering And No-Coordinate Polish

### Map Scope
- `/map` now provides local city filtering from each saved place's existing `city` field.
- The current user's RLS-scoped places are loaded once through the existing server-side query, then filtering occurs locally in the client map browser.
- Filtering occurs before location resolution and MapLibre marker rendering.
- No database column, migration, or Supabase query shape was added for filtering.

### Marker And No-Coordinate Behavior
- Exact-coordinate and approximate city-center marker behavior remain unchanged after filtering.
- Only markers belonging to the selected city are rendered.
- Unresolved places never receive fake markers and remain available through the saved-place list.
- The selected filter scope shows how many saved places cannot be rendered and distinguishes missing usable location data from invalid stored coordinates.
- No exact or fallback coordinates are written back to Supabase.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused map tests passed (`23` tests).

### Product State
- Clustering has not started.
- Search has not started.
- Geocoding has not started.
- Map editing has not started.
- Step 13 has not started.

## Validated Marker Rendering

### Map Scope
- `/map` now renders saved-place markers on the validated local PMTiles-backed MapLibre map.
- The map page loads only the current user's saved places through the existing Supabase server client and owner-only RLS scope.
- MapLibre marker lifecycle and popup rendering remain in a reusable client-side marker layer, separate from server-side data loading.
- This step does not change `public.restaurants`, create migrations, or modify any saved data.

### Location And Marker Behavior
- Every loaded place is resolved through `resolvePlaceLocation()` before a marker is created.
- Valid stored latitude and longitude render as exact markers.
- Records without exact coordinates can render a visually distinct approximate marker only when the conservative local city-center fallback resolves them.
- Unresolved places are skipped instead of receiving an invented map location.
- City-center fallback coordinates are never written back into Supabase.

### Popup Behavior
- Tapping or clicking a marker opens a popup with the place name, city, and category when available.
- Approximate city-level markers show a clear Simplified Chinese notice that the location is near the city center and is not precise.
- The marker and popup behavior remains touch-compatible in the current mobile layout.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused MapLibre, location-resolution, and marker-data node tests passed (`19` tests).

### Product State
- City filtering and no-coordinate polish are now separately validated above.
- Clustering has not started.
- Search has not started.
- Geocoding has not started.
- Map editing has not started.
- Step 13 has not started.

## Validated City-Level Coordinate Fallback

### Map Scope
- `lib/map/city-centers.ts` has been added as a small local city-center dataset for conservative approximate placement.
- `lib/map/place-location.ts` has been added as a pure place-location resolver.
- The new fallback layer is local-only and does not call external map or location APIs.
- The new fallback layer does not write any fallback coordinates into `public.restaurants`.

### Resolution Behavior
- Exact stored latitude and longitude take priority when both values are present and valid.
- Exact stored coordinates are returned as exact rather than approximate.
- Known city names can now fall back to approximate city-center coordinates only when exact coordinates are missing.
- Approximate city-center results are clearly marked as approximate city-level fallback rather than precise place coordinates.
- Conservative normalization now supports only explicit known variants such as `上海市 -> 上海`, `北京市 -> 北京`, `广州市 -> 广州`, `Hong Kong -> 香港`, and `New York City -> New York`.
- Unknown or ambiguous city names remain unresolved.
- Partial coordinate pairs are not treated as exact stored coordinates.
- Invalid latitude or longitude values are rejected rather than used.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused node tests passed.

### Product State
- Marker rendering and Supabase place queries on `/map` are now separately validated above.
- City filtering and no-coordinate polish are now separately validated above.
- Geocoding has not started.
- Step 13 has not started.

## Validated PMTiles Basemap

### Map Scope
- The official `pmtiles` dependency has been added.
- `/map` now renders a local PMTiles vector basemap successfully through the existing MapLibre foundation.
- The expected local basemap file path is `public/maps/base.pmtiles`.
- `public/maps/base.pmtiles` is intentionally gitignored and is not committed to the repository.
- The basemap path can be configured only through a same-origin public `/maps/...` path.
- No paid or metered hosted map API is involved.
- No OpenStreetMap public tile server is used.
- No Mapbox, Google, Apple, or 高德 map rendering dependency has been added.

### Protocol And Configuration
- PMTiles protocol registration is reusable and global rather than tied to one React render cycle.
- Duplicate protocol registration is avoided across React development rerenders.
- Registration is not torn down on component unmount, so other MapLibre instances are not broken.
- The local basemap continues to use the existing MapLibre browser-only foundation.

### Fallback And Current Limitations
- Missing or unloadable local PMTiles files now fail gracefully instead of crashing the map page.
- `/map` shows a clear Simplified Chinese fallback message when the local PMTiles file is missing, unloadable, or configured with an invalid path.
- The current local background remains visible during fallback.
- The current basemap has no labels because local glyph hosting has not been added.
- External sprite, glyph, and hosted style dependencies are still intentionally absent.

### Validation
- Focused PMTiles and local map-style tests passed.
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser validation passed.

### Product State
- Saved-place markers and Supabase place queries on `/map` are now separately validated above.
- City filtering and no-coordinate polish are now separately validated above.
- City-level coordinate fallback is now separately validated above.
- Geocoding has not started.
- Step 13 has not started.
- Labels and local glyph hosting have not started.

## Validated MapLibre Foundation

### Map Scope
- `/map` now renders a reusable client-side MapLibre GL JS foundation.
- `maplibre-gl` is the only map SDK added.
- The current style is fully local and contains no external tile, sprite, glyph, or hosted map requests.
- The current map style makes no external network tile requests.
- The foundation currently renders only a background layer and basic zoom controls.
- No clustering, search, or geolocation has been added.
- PMTiles integration, city-level coordinate fallback, marker rendering, and city filtering are now separately validated above.

### Component Behavior
- The MapLibre component initializes inside `useEffect`.
- Duplicate initialization is prevented with a stored map ref.
- Cleanup calls `map.remove()` on unmount.
- Refreshes did not create duplicate canvases.

### Validation
- The component was manually validated on desktop and iPhone-sized viewports.
- `npm run build` passed.
- `npm run lint` passed.
- The focused local map-style test passed.

### Product State
- PMTiles integration was the next map step after this foundation checkpoint and is now separately validated above.
- City-level coordinate fallback is now separately validated above.
- Marker rendering is now separately validated above.
- City filtering and no-coordinate polish are now separately validated above.
- Step 13 has not started.
- Routes, database schema, extraction, auth, RLS, and Step 12 confirmation behavior remain unchanged.

## Validated Reversible Generalization Step 1

### Database
- `public.restaurants` now has a `category` text column with `not null` and default `美食`.
- Existing rows were successfully backfilled to `美食`.
- `category` is restricted to exactly these values:
  - `美食`
  - `购物`
  - `玩乐`
  - `景点`
  - `住宿`
  - `其他`
- The existing owner-only RLS behavior remains unchanged.
- The `restaurants` table name remains unchanged for now.
- The `cuisine` column remains unchanged for now and is still used temporarily.

### Application
- `category` is now threaded through create, Step 12 review/confirmation, list, and edit flows.
- Manual creation now requires the user to select a category.
- Extracted restaurant candidates still default to `美食`.
- Saved records can now change category.
- Category values were validated to persist correctly.
- The existing `cuisine` column is temporarily used as generic subtype storage in the UI and application logic.

### Category-Specific Subtype UX
- In manual creation, subtype stays hidden until a category is selected.
- `美食` shows `菜系或类型`.
- `购物` shows `购物类型`.
- `玩乐` shows `玩乐类型`.
- `景点` shows `景点类型`.
- `住宿` shows `住宿类型`.
- `其他` shows `类型`.
- Subtype supports both tap-to-select suggestions and custom free-text input.
- Incompatible subtype values are cleared when category changes.
- Validation errors preserve both category and subtype values.
- The selected category is shown first.
- Its subtype field appears directly below the selected category card.
- Remaining unselected categories appear after the subtype field.
- This behavior is now validated in manual create, Step 12 review/confirmation, and saved-record edit flows.

### Verification
- The category migration was successfully applied in Supabase.
- Existing rows were verified as `美食` with no null `category` values.
- `npm run build` passed.
- `npm run lint` passed.
- Focused category and subtype tests passed.
- Manual create, review, edit, category switching, subtype suggestion selection, custom subtype input, and subtype placement were all validated.

### Product State
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No database column rename has started.
- No category-aware extraction beyond `景点` has started.
- `存个地` generalization is proceeding in small reversible migration steps.

## Validated Reversible Generalization Step 3A

### Extraction Scope
- Category-aware extraction now supports `住宿` in addition to the existing `美食` path.
- `美食` extraction behavior and acceptance thresholds remain unchanged.
- `住宿` extraction succeeds only when strong accommodation structured-data evidence exists.
- Supported strong accommodation types now include:
  - `Hotel`
  - `LodgingBusiness`
  - `Resort`
  - `Motel`
  - `Campground`
  - reliable hostel equivalents when exposed through strong structured data
- Generic `LocalBusiness` alone is not sufficient accommodation evidence.
- Ambiguous hotel-plus-restaurant sources now fall back to manual completion.
- Hotel directory and list pages now fall back to manual completion.
- Partial accommodation candidates are now allowed when the name is reliable even if `address` or `city` are missing.

### Review And Save Behavior
- Subtype is inferred conservatively and still stored temporarily through the existing `cuisine` field.
- Successful accommodation candidates now default the review form category to `住宿`.
- All extracted fields remain editable before save.
- Nothing auto-saves.
- Saving still redirects to `/restaurants`.
- Saved accommodation category and subtype editing remain functional in the existing saved-record edit flow.

### Validation
- Real-world timeout and `403` source responses were validated to fall back gracefully.
- Focused extraction tests now pass `35/35`.
- Manual hotel extraction, review, save, list, and edit flow were validated.
- Resort subtype inference is validated through focused fixtures even when a real resort site returns `403`.

### Product State
- `购物`, `玩乐`, and `其他` category-aware extraction have not started.
- 高德 integration has not started.
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No module rename has started.
- No TypeScript type rename has started.
- No database column rename has started.

## Validated Reversible Generalization Step 3B

### Extraction Scope
- Category-aware extraction now supports `景点` alongside the existing `美食` and `住宿` paths.
- Existing `美食` and `住宿` extraction behavior remains unchanged.
- `景点` extraction now requires strong structured-data evidence such as:
  - `TouristAttraction`
  - `Museum`
  - `Park`
  - `LandmarksOrHistoricalBuildings`
  - `Zoo`
  - `Aquarium`
- Generic `Place` or `LocalBusiness` alone is insufficient attraction evidence.
- Only single-place pages are accepted for `景点`.
- Attraction directories, travel blogs, and mixed-category pages now fall back to manual completion.
- Partial `景点` candidates are now allowed when the name is reliable even if `city` or `address` are missing.

### Review And Save Behavior
- Subtype is inferred conservatively and is still stored temporarily through the existing `cuisine` field.
- Successful `景点` candidates now default the review form category to `景点`.
- All extracted fields remain editable before save.
- Nothing auto-saves.
- Successful saves still redirect to `/restaurants`.
- Saved `景点` category and subtype editing remain functional in the existing saved-record edit flow.

### Validation
- Focused extraction tests now pass `47/47`.
- Real-world single-attraction extraction, directory fallback, review, save, list, and edit flow were manually validated.

### Product State
- `购物`, `玩乐`, and `其他` category-aware extraction have not started.
- 高德 integration has not started.
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No module rename has started.
- No TypeScript type rename has started.
- No database column rename has started.

## Validated Reversible Generalization Step 3C

### Extraction Scope
- Category-aware extraction now supports `购物` alongside the existing `美食`, `住宿`, and `景点` paths.
- Existing `美食`, `住宿`, and `景点` extraction behavior remains unchanged.
- `购物` extraction now requires strong shopping structured-data evidence.
- Supported shopping types now include:
  - `ShoppingCenter`
  - `Store`
  - `BookStore`
  - `ClothingStore`
  - `GroceryStore`
  - `ConvenienceStore`
  - `DepartmentStore`
  - `HomeGoodsStore`
  - `ElectronicsStore`
  - conservatively accepted beauty-shopping structured-data types when the evidence clearly matches a shopping-place subtype
- Generic `LocalBusiness` or `Place` alone is insufficient shopping evidence.
- Only single-place shopping pages are accepted for `购物`.
- Shopping directories, store lists, search-result pages, and mixed-category pages now fall back to manual completion.
- Generic `Store` may now produce a partial candidate with a blank subtype when the place evidence is strong but subtype confidence stays low.

### Review And Save Behavior
- Shopping subtype inference is conservative and is still stored temporarily through the existing `cuisine` field.
- Successful shopping candidates now default the review form category to `购物`.
- All extracted fields remain editable before save.
- Nothing auto-saves.
- Successful saves still redirect to `/restaurants`.
- Saved shopping category and subtype editing remain functional in the existing saved-record edit flow.

### Validation
- Focused extraction tests now pass `59/59`.
- `ShoppingCenter` fixture validation now succeeds as `购物 / 商场` after a fixture-only correction that avoided accidental directory-like copy.
- `BookStore` fixture validation now succeeds as `购物 / 书店`.
- Generic `Store` fixture validation now succeeds as `购物` with accepted `name`, `address`, and `city`, plus a blank subtype.
- Shopping directory fixture validation now correctly falls back.
- Mixed `ShoppingCenter + Restaurant` fixture validation now correctly falls back.
- Save, list, and edit flow for a shopping candidate were manually validated.
- Real-world shopping sites frequently returned timeout, `403`, or oversized-page fallbacks, and those failures remained graceful.
- Development-only deterministic extraction fixtures were added for manual validation.
- Fixture routes are not linked from the product UI and are disabled in production.
- Fetch timeout, response-size limits, and extraction security boundaries were not loosened.

### Product State
- `玩乐` and `其他` category-aware extraction have not started.
- 高德 integration has not started.
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No module rename has started.
- No TypeScript type rename has started.
- No database column rename has started.

## Validated Reversible Generalization Step 3D

### Extraction Scope
- Category-aware extraction now supports `玩乐` alongside the existing `美食`, `住宿`, `景点`, and `购物` paths.
- Existing `美食`, `住宿`, `景点`, and `购物` extraction behavior remains unchanged.
- `玩乐` extraction now requires strong entertainment structured-data evidence.
- Supported entertainment types now include:
  - `EntertainmentBusiness`
  - `MovieTheater`
  - `NightClub`
  - `BowlingAlley`
  - `AmusementPark`
  - `SportsActivityLocation`
  - `PerformingArtsTheater`
  - `EventVenue`
- Generic `LocalBusiness` or `Place` alone is insufficient entertainment evidence.
- Only single-place entertainment pages are accepted for `玩乐`.
- Entertainment directories, event schedules, search and list pages, and mixed-category pages now fall back to manual completion.
- Generic `EntertainmentBusiness` may now produce a partial candidate with a blank subtype when the place evidence is strong but subtype confidence stays low.

### Review And Save Behavior
- Entertainment subtype inference is conservative and is still stored temporarily through the existing `cuisine` field.
- Successful entertainment candidates now default the review form category to `玩乐`.
- All extracted fields remain editable before save.
- Nothing auto-saves.
- Successful saves still redirect to `/restaurants`.
- Saved `玩乐` category and subtype editing remain functional in the existing saved-record edit flow.

### Validation
- Focused extraction tests now pass `74/74`.
- `movie-theater` fixture validation now succeeds as `玩乐 / 电影院`.
- `generic-entertainment` fixture validation now succeeds as `玩乐` with a blank subtype.
- Entertainment directory fixture validation now correctly falls back.
- Event schedule fixture validation now correctly falls back.
- Mixed `EntertainmentBusiness + Restaurant` fixture validation now correctly falls back.
- Save, list, and edit flow for a `玩乐` candidate were manually validated.
- Deterministic development fixtures remain unlinked from the product UI and are disabled in production.
- Fetch timeout, response-size limits, and extraction security boundaries were not loosened.

### Product State
- 高德 integration has not started.
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No module rename has started.
- No TypeScript type rename has started.
- No database column rename has started.

## Validated Reversible Generalization Step 3E

### Extraction Scope
- Category-aware extraction now supports all six V1 categories:
  - `美食`
  - `住宿`
  - `景点`
  - `购物`
  - `玩乐`
  - `其他`
- Existing `美食`, `住宿`, `景点`, `购物`, and `玩乐` extraction behavior remains unchanged.
- `其他` remains intentionally manual-first and has the highest acceptance threshold.
- `其他` only accepts strong `Place` or `LocalBusiness` structured-data cases when:
  - the page represents one concrete place
  - name is reliable
  - address or city evidence is reliable
  - no stronger category-specific evidence exists
- `Place` or `LocalBusiness` alone is not sufficient.
- Weak generic pages, missing-location pages, directories and lists, ambiguous pages, and mixed-category pages now fall back to manual completion.
- Subtype inference for `其他` is minimal and conservative.
- `其他` subtype may remain blank.
- The subtype is still temporarily stored through the existing `cuisine` database column.

### Review And Save Behavior
- Successful generic-place candidates now default the review form category to `其他`.
- Explicit user category choices still take precedence.
- All extracted fields remain editable before save.
- Nothing auto-saves.
- Successful saves still redirect to `/restaurants`.
- Saved `其他` category and subtype editing remain functional in the existing saved-record edit flow.

### Step 3E Bug Fix
- Initial manual validation failed because the development fixture chrome injected `/restaurants/new` into visible page text and triggered restaurant-like blocking.
- Generic weak-signal dispatch guards were evaluated too early.
- The address regex incorrectly matched `Development/Test Only` because `st` was treated as a street abbreviation without sufficient boundaries.
- Candidate category propagation and review defaulting were already correct.
- The fix was limited to generic-place extraction, field validation, fixture scaffolding, diagnostics, and regression coverage.
- Existing category acceptance thresholds were not loosened.

### Validation
- Focused extraction and review tests now pass `83/83`.
- Generic `Place` fixture validation now succeeds as `其他 / 服务中心` with accepted `name`, `city`, and `address`.
- Generic `LocalBusiness` fixture validation now succeeds as `其他` with a blank subtype plus accepted `name`, `city`, and `address`.
- Missing-location fixture validation now correctly falls back.
- Generic directory fixture validation now correctly falls back.
- Mixed `generic + Restaurant` fixture validation now correctly falls back.
- Save, list, and edit flow for a successful `其他` candidate were manually validated.
- Deterministic development fixtures remain unlinked from the product UI and are disabled in production.
- Fetch timeout, response-size limits, and extraction security boundaries were not loosened.

### Product State
- Migration Steps 3A through 3E are complete and manually validated.
- All six V1 categories now have conservative extraction support.
- 高德 integration has not started.
- Step 13 has not started.
- No route rename has started.
- No table rename has started.
- No module rename has started.
- No TypeScript type rename has started.
- No database column rename has started.
- The current table remains `restaurants`.
- The current route namespace remains `/restaurants`.
- The subtype storage column remains `cuisine`.

## Completed In Step 1
- Initialized the repository with Git version control.
- Created a single Next.js app in the project root using the App Router.
- Added TypeScript project configuration.
- Added Tailwind CSS setup for styling.
- Added a simple placeholder home page for the product shell.
- Updated the placeholder so the default visible copy is Simplified Chinese.
- Kept the app name acceptable in both English and Chinese on the placeholder screen.
- Confirmed the app can build successfully as the current Step 1 shell.

## Completed In Step 2
- Added the official Supabase JavaScript client dependency.
- Added a committed `.env.example` file for the required public Supabase variables.
- Added lightweight Supabase environment parsing helpers.
- Added a minimal Supabase client factory for setup and connection checks.
- Added a Step 2 health-check utility that verifies whether the app can reach the configured Supabase project.
- Added a Chinese-first `/setup` page to show Supabase connection status and manual setup instructions.
- Linked the home page to the `/setup` page.
- Confirmed the current app shell can build and type-check with the Step 2 setup files in place.

## Completed In Step 3
- Added the official Supabase SSR helper dependency for cookie-based authentication.
- Added server-side Supabase auth client support for Next.js requests.
- Added a proxy layer to refresh auth cookies and protect authenticated routes.
- Added email/password sign-up and login server actions.
- Added logout support.
- Added Chinese-first auth pages for sign up and login.
- Added a protected `/dashboard` page that redirects signed-out users to login.
- Linked the home page to the auth entry points and protected page.
- Confirmed the Step 3 authentication layer can build and type-check successfully.

## Completed In Step 4
- Added a Supabase migration directory for database schema changes.
- Added the initial V1 `restaurants` table migration.
- Used `source_url` directly on the `restaurants` table as required by the product documents.
- Added the required V1 fields: `name`, `city`, `source_url`, and `privacy`.
- Added the optional V1 fields: `address`, `cuisine`, `note`, `latitude`, and `longitude`.
- Added supporting fields for maintainable storage: `id`, `user_id`, `created_at`, and `updated_at`.
- Added database constraints for non-blank required text fields, valid privacy values, and valid latitude and longitude ranges.
- Added indexes for `user_id` and `city`.
- Added an `updated_at` trigger so update timestamps are maintained automatically.
- Confirmed the migration was applied successfully in Supabase.
- Confirmed Supabase accepted both a complete restaurant record and a restaurant record without latitude and longitude.

## Completed In Step 5
- Added a dedicated Supabase migration to enable Row Level Security on `public.restaurants`.
- Granted restaurant table access only to authenticated users.
- Added owner-only `select` policy for restaurant records.
- Added owner-only `insert` policy so users can only create rows with their own `user_id`.
- Added owner-only `update` policy so users can only modify their own rows.
- Added owner-only `delete` policy so users can only remove their own rows.
- Kept `privacy` as a stored per-record flag only in V1.
- Kept `public` restaurants non-discoverable to other users in V1.
- Confirmed RLS is enabled on `public.restaurants`.
- Confirmed User A can insert their own restaurant.
- Confirmed User B cannot read User A's restaurant.
- Confirmed User B cannot update User A's restaurant.

## Completed In Step 6
- Added the main V1 page structure and navigation shell without starting restaurant CRUD work.
- Reworked the public pages into a shared mobile-first visual system.
- Added a protected application shell for signed-in pages.
- Added shared reusable UI components for brand display, surface cards, auth cards, placeholder cards, and navigation.
- Added a reusable server-side helper for reading the current authenticated user on protected pages.
- Added protected placeholder pages for the V1 add page, saved list page, and map page.
- Updated the protected dashboard into a signed-in overview page for the new navigation flow.
- Extended route protection so the new protected placeholder pages require login.
- Updated the global visual style toward the documented orange-accent, rounded-card, Chinese-first mobile UI direction.
- Kept visible UI copy in Simplified Chinese by default.
- Kept English as a future secondary option without adding unnecessary translation infrastructure.
- Confirmed the main Step 6 pages and navigation work in both mobile-sized and desktop browser windows.

## Completed In Step 7
- Added a signed-in manual restaurant creation flow at `/restaurants/new`.
- Added a server action that creates restaurant records in Supabase using the validated V1 schema and existing owner-only RLS rules.
- Added a mobile-first Chinese-first restaurant form component for the Step 7 create flow.
- Added support for saving a complete restaurant record with required and optional Step 7 form fields.
- Added support for saving a restaurant with only the required fields: `name`, `city`, `source_url`, and `privacy`.
- Kept latitude and longitude out of the user-facing form as required for Step 7.
- Added Chinese-friendly cuisine suggestions while still allowing free text input.
- Confirmed restaurant fields support Chinese text input.
- Added generic source URL extraction so the source input can accept either a direct URL or a longer block of sharing text.
- Added extraction of the first valid `http` or `https` URL from pasted 小红书, 抖音, Google Maps, and public web sharing text.
- Added validation that preserves the pasted form input when no valid URL can be extracted.
- Shortened the visible Simplified Chinese validation error copy for invalid source input.
- Added focused automated tests for direct URLs, 小红书 sharing text, 抖音 sharing text, no-URL text, and multiple-URL text.
- Added a minimal `/restaurants` confirmation page that shows the current user's saved restaurant cards and highlights the just-created record.
- Kept Step 7 intentionally smaller than Step 8 by not adding edit, delete, filters, or a full saved-list experience.

## Completed In Step 8
- Upgraded `/restaurants` from the Step 7 minimal confirmation screen into the full Step 8 saved restaurant list page.
- Kept the list scoped to the current signed-in user through the existing owner-only RLS rules.
- Added a reusable `restaurant-list.tsx` component to render saved-list summary metrics and the full list body.
- Added a reusable `restaurant-list-card.tsx` component to display each restaurant in the mobile-first card layout.
- Expanded the saved-list query so it now returns the current user's full restaurant list ordered by newest first, instead of the earlier limited confirmation view.
- Kept the successful-save confirmation message behavior after redirects from the Step 7 create flow.
- Kept the newly-created restaurant highlight behavior by using the `created` query parameter on `/restaurants`.
- Added clear fallback display for missing optional fields such as `address`, `cuisine`, and `note` using `暂未填写`.
- Kept core restaurant information easy to scan, including name, city, privacy, save date, and source link.
- Preserved the validated mobile-first, orange-accent, Simplified-Chinese visual direction while expanding the saved-list experience.
- Kept Step 8 intentionally focused on listing only, without starting edit, delete, map, geocoding, or extraction-review work.

## Completed In Step 9
- Added a protected restaurant edit route at `/restaurants/[id]/edit`.
- Added a reusable `restaurant-edit-form-card.tsx` component for the Step 9 edit flow.
- Added `updateRestaurantAction` to update saved restaurant records through the existing authenticated Supabase server client.
- Added `getCurrentUserRestaurantById` so the edit page can read exactly one user-owned restaurant record.
- Kept the editable-field scope intentionally narrow: only `cuisine`, `note`, and `privacy`.
- Kept `name`, `city`, `address`, and `source_url` visible as context on the edit page without making them editable in Step 9.
- Added edit entry points from the saved restaurant list.
- Preserved owner-only editing through the existing Supabase RLS model, so users can only edit their own restaurant records.
- Confirmed that clearing optional `cuisine` or `note` still works and persists correctly.
- Updated the final Step 9 UX so successful edits now redirect back to `/restaurants`.
- Added the short success message `餐厅信息已更新` on `/restaurants` after a successful update redirect.
- Kept validation and update errors on the edit page instead of redirecting away on failure.
- Kept Step 9 scoped to saved-record editing only without starting Step 10 URL intake, extraction, cuisine inference, geocoding, or maps.

## Completed In Step 10
- Added a new source intake flow on `/restaurants/new` while keeping the validated Step 7 manual-create form available on the same page.
- Added a dedicated Step 10 source-intake card so signed-in users can paste either a direct URL or a longer share message.
- Reused the existing generic first-`http` or first-`https` URL extraction logic instead of adding source-specific parsing.
- Confirmed the source intake flow accepts a direct URL and moves into the extraction-review starting point.
- Confirmed the source intake flow accepts full 小红书 sharing text and extracts only the first valid URL.
- Confirmed the source intake flow accepts full 抖音 sharing text and extracts only the first valid URL.
- Confirmed invalid text without any valid `http` or `https` URL shows a clear Simplified Chinese validation error and preserves the pasted input.
- Added a protected source-review route at `/restaurants/review`.
- Added a source review card that shows the normalized source URL, source host, and the V1 source-policy boundary.
- Added the handoff from source review back to the existing manual form so `source_url` is prefilled with the normalized URL.
- Kept Step 10 intentionally narrow: no page fetching, no restaurant-field extraction, no cuisine inference, no candidate generation, no geocoding, and no map work.

## Completed In Step 11
- Added the first simple server-side extraction service behind `/restaurants/review`.
- Upgraded the review flow so accepted sources now go beyond URL confirmation and attempt best-effort restaurant draft extraction before manual completion.
- Added page-type detection so directory pages, index pages, generic pages, and weak pages can fall back cleanly instead of producing garbage restaurant drafts.
- Added a structured-data-first extraction pipeline that prioritizes JSON-LD and related structured metadata before conservative fallback heuristics.
- Added strict field validation for restaurant `name`, `address`, `city`, and `cuisine` so weak, generic, or oversized values are rejected.
- Added field-level confidence and evidence tracking so extracted values are not treated as successful just because some text was found.
- Added candidate acceptance rules so a draft succeeds only when the page looks like a single-restaurant page and the extracted evidence clears the Step 11 threshold.
- Added partial-candidate support so genuine single-restaurant pages can return a reliable `name` plus any confident fields while leaving uncertain fields blank.
- Added bounded fetch behavior with timeout and response-size limits and kept all fetched source content treated as untrusted input.
- Added development-only extraction diagnostics that record the fetched URL, response metadata, page type, structured-data types, accepted evidence, rejected candidates, and final decision.
- Added a new extraction preview card on `/restaurants/review` so only accepted fields are shown and giant low-confidence text blocks are never rendered.
- Kept extracted candidates editable by handing accepted fields back into the existing manual form instead of saving anything automatically.
- Kept 小红书 and 抖音 as best-effort sources with graceful fallback behavior.
- Added focused Step 11 extraction regression tests and confirmed they pass `17/17`.
- Documented the China-first direction update alongside Step 11 planning: 高德地图 / Amap is the primary V1 map, POI, and geocoding provider; 高德 links and sharing text are officially supported V1 sources; 大众点评, 小红书, and 抖音 are best-effort sources; 百度地图 is secondary input only; Google Maps is optional overseas support.

## Completed In Step 12
- Added an explicit extraction confirmation section on `/restaurants/review` after the Step 11 extraction preview.
- Connected accepted extracted fields into an editable confirmation form before save.
- Reused the existing restaurant creation server action so Step 12 saves through the same validated create path as manual creation.
- Added reusable shared restaurant form fields so manual create and extraction confirmation use the same V1 field controls.
- Added a reusable cuisine picker and wired it into manual create, extraction confirmation, and saved-record edit forms.
- Kept accepted extracted fields editable before save, including inferred cuisine.
- Kept partial candidates usable by letting users manually complete missing required or optional fields before saving.
- Preserved user-entered values on validation errors when the confirmation form redirects back to `/restaurants/review`.
- Kept the explicit no-auto-save boundary: nothing is written to Supabase until the user confirms and submits the form.
- Kept successful saves redirecting to `/restaurants` with the success message and newly-created record highlight.
- Added focused Step 12 review-form tests for accepted-field prefills, user overrides, partial-candidate missing fields, and fallback-mode manual completion.
- Confirmed Step 12 is complete and validated before starting any Step 13 multi-candidate work.
- Paused product work before Step 13 so the app can be generalized from a restaurant-only collector into `存个地`.

## Completed In Step 3A
- Added the first small category-aware extraction expansion without weakening the existing restaurant path.
- Kept the current `美食` extraction pipeline and acceptance thresholds unchanged.
- Added conservative `住宿` extraction support on top of the existing shared fetch, parsing, diagnostics, validation, review, and confirmation flow.
- Added strong accommodation structured-data recognition for `Hotel`, `LodgingBusiness`, `Resort`, `Motel`, `Campground`, and reliable hostel equivalents.
- Kept generic `LocalBusiness` insufficient for accommodation acceptance.
- Added conservative accommodation subtype inference while still storing the value through the existing `cuisine` field.
- Allowed partial accommodation candidates when the page is a single place, the name is reliable, and strong accommodation evidence exists.
- Added fallback behavior for ambiguous restaurant-plus-hotel sources.
- Added fallback behavior for hotel directory and list pages.
- Updated the review flow so successful accommodation candidates default to category `住宿` without silently overriding user-selected categories.
- Kept all fields editable before explicit save and kept the existing redirect target `/restaurants`.
- Confirmed real-world timeout and `403` responses still fall back gracefully.
- Added focused Step 3A extraction and review-form coverage and confirmed the focused test set passes `35/35`.
- Validated manual hotel extraction, review, save, list, and edit flow end to end.

## Completed In Step 3B
- Added the second small category-aware extraction expansion without weakening the existing `美食` or `住宿` paths.
- Added conservative `景点` extraction support on top of the existing shared fetch, parsing, diagnostics, validation, review, and confirmation flow.
- Added strong attraction structured-data recognition for `TouristAttraction`, `Museum`, `Park`, `LandmarksOrHistoricalBuildings`, `Zoo`, and `Aquarium`.
- Kept generic `Place` and `LocalBusiness` insufficient for attraction acceptance.
- Added conservative attraction subtype inference while still storing the value through the existing `cuisine` field.
- Allowed partial `景点` candidates when the page is a single place, the name is reliable, and strong attraction evidence exists.
- Added fallback behavior for attraction directory pages, travel blogs, and mixed-category pages.
- Updated the review flow so successful attraction candidates default to category `景点` without silently overriding user-selected categories.
- Kept all fields editable before explicit save and kept the existing redirect target `/restaurants`.
- Added focused Step 3B extraction and review-form coverage and confirmed the focused test set passes `47/47`.
- Validated real-world single-attraction extraction, directory fallback, review, save, list, and edit flow end to end.

## Current App State
- The project is one Next.js codebase.
- The home page is still a lightweight placeholder shell.
- A Supabase setup check page now exists at `/setup`.
- Public Supabase environment-variable support has been added.
- A basic Supabase connection check has been added.
- Email/password authentication has been added.
- Protected page routing is in place for `/dashboard`, `/restaurants`, `/restaurants/new`, and `/map`.
- The initial Supabase restaurant data model has been added through a migration.
- Owner-only RLS protection is now in place for `public.restaurants`.
- A mobile-first public and protected page shell is now in place.
- Signed-in users can now manually create restaurant records at `/restaurants/new`.
- Signed-in users can now begin a source intake flow at `/restaurants/new` and continue to `/restaurants/review` before choosing manual completion.
- Signed-in users can now run a simple extraction-review flow at `/restaurants/review` that either returns an editable draft candidate or falls back cleanly to manual completion.
- Signed-in users can now explicitly confirm, edit, complete, and save extraction results from `/restaurants/review`.
- `/restaurants` now provides the full saved restaurant list experience for the current user's records.
- Signed-in users can now edit `cuisine`, `note`, and `privacy` for their own saved restaurant records.
- The reusable cuisine picker now works in create, review confirmation, and saved-record edit forms.
- The map page remains a protected placeholder.
- Step 11 page fetching, structured-data-first extraction, candidate review, and graceful fallback are now in place.
- Step 12 explicit confirmation, editable accepted fields, manual completion for partial candidates, validation-error value preservation, and confirm-before-save behavior are now in place.
- `public.restaurants` now also includes a validated `category` field with default `美食`, allowed-value enforcement, and existing-row backfill.
- The app now threads `category` through create, Step 12 review/confirmation, list, and edit while still keeping the `restaurants` table name unchanged.
- The existing `cuisine` column is temporarily reused as generic subtype storage during the first `存个地` migration step.
- Manual create now requires category selection before showing subtype.
- Step 12 extracted candidates still default category to `美食`.
- Saved records can now change category and keep the updated value after refresh.
- Category-specific subtype UX is now in place across manual create, review confirmation, and saved-record edit:
  - The selected category is shown first.
  - The matching subtype field appears directly below the selected category card.
  - Remaining categories appear after that subtype field.
  - Users can either choose a suggestion or type a custom subtype.
  - Incompatible subtype values are cleared when category changes.
- `privacy` remains a stored flag only and does not create cross-user visibility in V1.
- Product implementation is paused before Step 13 while the new `存个地` place-collection direction is planned.

## Step 1 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`

Validation outcome:
- The app shell is in place.
- The placeholder page loads as the current Step 1 entry screen.

## Step 2 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`

Validation outcome:
- The app can detect whether Supabase environment variables are present.
- The `/setup` page can report Supabase setup status.
- The Step 2 setup layer is in place without starting authentication.

## Step 3 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`

Validation outcome:
- A new user can register with email and password.
- A returning user can log in and log out.
- Signed-out users are redirected away from the protected page.
- Signed-in users can open the protected dashboard page.

## Step 4 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Supabase migration applied successfully
- Manual insert test with a complete restaurant record
- Manual insert test with a restaurant record without latitude and longitude

Validation outcome:
- The `restaurants` table exists in Supabase with the intended V1 schema.
- A restaurant can be saved with all supported V1 fields, including coordinates.
- A restaurant can also be saved without `latitude` and `longitude`.
- The Step 4 schema is in place without starting Step 5 access policies.

## Step 5 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Supabase RLS migration applied successfully
- Manual RLS validation with two user accounts

Validation outcome:
- RLS is enabled on `public.restaurants`.
- User A can insert their own restaurant record.
- User B cannot read User A's restaurant record.
- User B cannot update User A's restaurant record.
- V1 `privacy` remains a stored flag only and does not expose records across users.

## Step 6 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual UI validation in mobile-sized browser window
- Manual UI validation in desktop browser window

Validation outcome:
- The main Step 6 public and protected pages load successfully.
- The primary V1 navigation flow is now in place.
- The layouts feel mobile-first and remain usable on larger desktop widths.
- The visible UI defaults to Simplified Chinese.
- The add, list, and map pages exist as protected placeholders without starting Step 7 logic.

## Step 7 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual creation of a complete restaurant record
- Manual creation of a restaurant record with only required fields
- Manual validation of Chinese text input
- Manual validation of full 小红书 sharing text URL extraction
- Manual validation of full 抖音 sharing text URL extraction
- Manual validation of the no-URL error state
- Manual validation of the shortened source-input error copy

Validation outcome:
- A signed-in user can manually create restaurant records that respect the validated V1 schema.
- The create form supports both English and Chinese restaurant content, with Simplified Chinese as the default visible UI.
- The source input accepts either a direct URL or a longer sharing message and saves only the first valid `http` or `https` URL.
- Invalid sharing text without a URL is rejected with clear Simplified Chinese validation feedback while preserving the pasted input.
- After a successful save, `/restaurants` provides a minimal confirmation view without prematurely starting Step 8 list work.

## Step 8 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual validation with several saved restaurants
- Manual validation with records that omit optional fields
- Manual validation in mobile-sized browser window
- Manual validation in desktop browser window

Validation outcome:
- A signed-in user can open `/restaurants` and see their saved restaurant list in newest-first order.
- The list only shows records accessible to the current user through the existing RLS rules.
- The successful-save confirmation banner still appears after a create redirect.

## Step 9 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual validation of editable `cuisine`, `note`, and `privacy`
- Manual validation that optional `cuisine` and `note` can be cleared
- Manual validation of owner-only RLS behavior for editing
- Manual validation of successful update redirect to `/restaurants`
- Manual validation of the `餐厅信息已更新` success message
- Manual validation that update errors stay on the edit page

Validation outcome:
- A signed-in user can edit only `cuisine`, `note`, and `privacy` for their own restaurant records.
- Successful updates persist in Supabase and redirect back to `/restaurants`.
- The restaurant list reflects updated values after redirect.
- Validation and update failures stay on the edit page so the user can correct them.
- Owner-only RLS still prevents cross-user access during the edit flow.

## Step 10 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual validation of direct URL intake
- Manual validation of full 小红书 sharing-text intake
- Manual validation of full 抖音 sharing-text intake
- Manual validation of invalid text without a URL
- Manual validation of the handoff from source review back to the manual form

Validation outcome:
- A signed-in user can paste either a direct URL or a longer sharing message to start the Step 10 source flow.
- The app reuses the generic first-valid-URL extraction behavior and moves accepted input into `/restaurants/review`.
- Invalid text without a valid `http` or `https` URL is rejected with clear Simplified Chinese feedback while preserving the pasted text.
- The source review page can hand the normalized URL back into the existing manual form with `source_url` prefilled.
- Step 10 stops at URL intake and review only; it does not fetch pages or extract restaurant fields yet.

## Step 11 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Focused Step 11 extraction tests passing `17/17`
- Manual validation that directory/index pages such as the Din Tai Fung locations page fall back without garbage extraction
- Manual validation that genuine single-restaurant pages can produce partial candidates
- Manual validation that Eleven Madison Park produced a reliable name and city while uncertain fields stayed blank
- Manual validation that Sushi Nakazawa produced a reliable name and cuisine while uncertain fields stayed blank
- Manual validation that missing data is preferred over incorrect data
- Manual validation that no giant page-text blocks are accepted as restaurant fields
- Manual validation that extracted candidates are never automatically saved
- Manual validation that extracted fields remain editable through the manual completion flow
- Manual validation that 小红书 and 抖音 remain best-effort sources with graceful fallback behavior

Validation outcome:
- Directory and index pages now fall back cleanly instead of generating navigation text or large body-text blocks as restaurant data.
- Genuine single-restaurant pages can now return partial candidates when only some fields are reliable.
- The extraction flow now prefers missing data over incorrect data and keeps uncertain fields blank.
- Step 11 now includes page-type detection, structured-data-first extraction, field validation, field-level confidence and evidence tracking, candidate acceptance rules, bounded fetching, development-only diagnostics, and focused regression tests.
- Extracted values still require manual confirmation and are never automatically saved.

## Step 12 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Focused Step 12 review-form tests
- Manual validation that accepted extracted fields prefill the confirmation form
- Manual validation that accepted extracted fields remain editable before save
- Manual validation that partial candidates can be manually completed before save
- Manual validation that validation errors preserve user-entered values on `/restaurants/review`
- Manual validation that extraction results are not saved before explicit confirmation
- Manual validation that successful confirmation saves redirect to `/restaurants`
- Manual validation that the success message and newly-created record highlight appear after save
- Manual validation that the reusable cuisine picker works in create, review confirmation, and saved-record edit forms

Validation outcome:
- Step 12 extraction review and explicit confirmation flow is complete and validated.
- Accepted extracted fields can be edited before saving.
- Partial extraction candidates support manual completion.
- Validation errors preserve the user's entered values instead of reverting to extracted defaults.
- Nothing saves before the user explicitly confirms.
- Successful saves still use the existing `/restaurants` redirect, success message, and highlight behavior.
- The reusable cuisine picker is shared across create, review confirmation, and saved-record edit forms.
- Step 13 has not started.

## Docs-Only Product Direction Update
Documented but not yet implemented in UI:
- mobile-first product direction
- vibrant orange accent near `#FF5B00`
- Simplified Chinese as the default language
- English as a later secondary language option
- future extraction should attempt to infer cuisine when possible, keep it editable, and leave it blank when confidence is low
- China-first location-provider direction is now documented in the planning set: 高德地图 / Amap is primary for V1 map, POI, and geocoding; 高德 links/share text are official sources; 大众点评, 小红书, and 抖音 are best-effort; 百度地图 is secondary input only; Google Maps is optional overseas support
- the product is pausing before Step 13 to generalize from a restaurant-only collector into `存个地`, a Chinese-first personal place collection app

## Notes
- The current `npm run lint` command uses TypeScript static checks.
- The current build script uses `next build --webpack` for reliable local verification in this environment.
- The current UI direction is now partially implemented through the Step 6 page shell and navigation.
- The current Supabase setup now includes authentication and protected route handling.
- The initial restaurant schema is now in place in Supabase.
- Owner-only RLS policies are now in place for `public.restaurants`.
- Step 7 manual restaurant creation is now in place and validated.
- The source input now supports generic share-text URL extraction without starting restaurant-information extraction.
- Step 8 saved-list work is now in place and validated.
- Step 9 saved-record editing is now in place and validated.
- Step 10 source intake, Step 11 extraction preview, and Step 12 explicit confirmation are now in place and validated.
- Inferred cuisine remains editable and should stay blank when confidence is low.
- Step 13 multi-candidate work is paused until the `存个地` generalization direction is planned.
