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

The map search interaction polish checkpoint is now complete and has been validated with selection-driven map focus and popup behavior, without changing the map data pipeline.

The map clustering checkpoint is now complete and has been validated with map-only cluster rendering on top of the existing marker data flow.

The map place-detail interaction checkpoint is now complete and has been validated with richer popup preview cards and existing-route detail navigation, without changing map data behavior.

The user collections checkpoint is now complete and has been validated with minimal user-scoped collections and join-table memberships, without changing the map system.

The V1 add-place flow checkpoint is now complete and has been validated with a local-only intake and review-before-save flow, without changing the map system or saved-place schema.

The V1 extraction architecture checkpoint is now complete and has been validated with local source detection, placeholder extractor selection, normalized results, and review-flow availability status.

The Google Maps extractor V2 checkpoint is now complete and has been validated with deterministic URL-only parsing, coordinate validation, and extraction-quality metadata.

## Validated Google Maps Extractor V2 Checkpoint

### Google Maps Parsing Scope
- The Google Maps extractor now performs URL-only deterministic parsing without scraping, Google APIs, external APIs, or AI extraction.
- It supports `q` parameter parsing.
- It supports `query` parameter parsing.
- It supports `/maps/search/` parsing.
- It supports `/maps/place/` parsing.
- It extracts explicit `@latitude,longitude` coordinates when present in the URL.
- It extracts an explicit `address` parameter when available.
- Coordinate range validation prevents invalid latitude and longitude values from entering the normalized result.

### Safety Boundaries
- The extractor does not guess category, city, ratings, or reviews.
- Fields that are not explicitly available in the URL remain empty.

### Extraction Architecture Behavior
- The source detector remains unchanged.
- The extractor interface remains unchanged.
- The normalized extraction result now carries `extractionStatus`, `confidence`, and `extractedFields` metadata.
- The review flow displays extracted information and fields that still need manual input.

### Unchanged Behavior
- The Supabase schema remains unchanged.
- Saved place flow remains unchanged.
- The collections system remains unchanged.
- Map rendering remains unchanged.
- Marker clustering remains unchanged.
- Map search remains unchanged.
- City filtering remains unchanged.
- City normalization remains unchanged.
- The coordinate resolver remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Extraction tests passed (`19` tests).

## Validated V1 Server-Side Website Fetching Checkpoint

### Website Fetching Scope
- A website URL fetching layer was added for the existing extraction architecture.
- The server-side fetch flow is connected to the existing source detection, Website Extractor, review, and save boundaries.
- Website extraction now supports URL validation, bounded HTML fetching, metadata parsing, and JSON-LD extraction.
- Fetching remains limited to the submitted URL: it does not crawl links, execute scripts, call external APIs, use AI extraction, or store raw HTML.

### Extraction Flow
- The validated flow is: URL → source detection → fetcher → extractor → review → save.
- Fetch failures remain visible in the review UI as extraction status and a manual-review message.
- Extracted fields continue to enter the existing editable review form before any save.

### Unchanged Behavior
- The Supabase schema remains unchanged.
- Saved place creation flow remains unchanged.
- Google Maps extractor behavior remains unchanged.
- Map rendering remains unchanged.
- Marker clustering remains unchanged.
- Map search remains unchanged.
- City filtering remains unchanged.
- City normalization remains unchanged.
- The location resolver remains unchanged.
- The collections system remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Extraction tests passed (`29` tests).

## Validated V1 Source-Merging Checkpoint

### Merge Scope
- A pure place-draft merge layer was added.
- Multiple extraction results can now enrich one review draft before saving.
- Field-level source attribution records which source supplied each merged value.
- The merge layer preserves missing fields as empty and does not invent data.
- Manual edits remain supported and are applied as explicit review overrides.

### Review Scope
- A multi-source review UI was added so another source can be merged into the current draft.
- The review form now uses merged name, city, address, category, and notes values while keeping them editable.
- The review UI shows source attribution for combined fields and lists fields that still need manual review.

### Unchanged Behavior
- The Supabase schema remains unchanged.
- Saved-place creation behavior remains unchanged.
- The map system remains unchanged.
- The collections system remains unchanged.
- Existing extractor interfaces remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused extraction tests passed (`37` tests).

## Validated AI Enrichment Architecture Checkpoint

### AI Enrichment Scope
- A provider-independent AI enrichment interface was added for merged drafts, extracted source data, source URLs, and missing fields.
- AI enrichment is suggestion-only and remains separate from deterministic extraction and source merging.
- A placeholder provider was added; it makes no network calls and reports that AI enrichment is unavailable.
- Explicit AI states are supported: `unavailable`, `no_changes`, `suggestions_available`, and `failed`.

### Safety Boundaries
- AI suggestions never apply automatically.
- Manual values always take priority.
- Accepted AI fields retain `ai_suggestion` source attribution.
- AI output never writes directly to Supabase.
- No external AI API integration or API keys were added.

### Unchanged Behavior
- The extraction architecture remains unchanged.
- The Google Maps extractor remains unchanged.
- The Website Extractor remains unchanged.
- Source merging remains the deterministic primary data source.
- The saved place schema remains unchanged.
- The map system remains unchanged.
- The collections system remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused enrichment/extraction tests passed (`42` tests).

## Validated V1 Final Review And Save Experience Checkpoint

### Final Review Scope
- A final review preview card was added before saving.
- The preview displays confirmed information including name, category, city, address, phone, and notes.
- Source badges and field-level attribution display Google Maps, Website, Manual input, and future AI suggestion sources when present.
- Conflicting values from different sources are surfaced for manual confirmation.
- Missing optional information is clearly shown without blocking save.
- Manual edits remain the highest-priority values in the final review.

### Collection Save Scope
- Users can select one or more existing collections before saving.
- Inline collection creation is supported from the review page.
- Selected collection memberships are created after place creation through the existing `restaurant_collections` join-table architecture.
- Optional fields do not block saving; users can save anyway or continue editing.

### Unchanged Behavior
- The extraction architecture remains unchanged.
- Source merging remains unchanged.
- The AI enrichment architecture remains unchanged.
- The Supabase place schema remains unchanged.
- The map system remains unchanged.
- The collections data model remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`42` tests).

## Validated V1 Place Discovery Checkpoint

### Discovery Scope
- A reusable `PlaceCard` component was added for consumer-facing place browsing.
- The authenticated `/dashboard` now provides a simple discovery view with recently saved places.
- Recent places are displayed in save-time order without recommendation algorithms or extra ranking.
- Existing collection highlights are displayed alongside the recent place cards.
- RLS-scoped discovery queries load saved places, collection memberships, and collection counts through the existing data model.

### Card Scope
- Place cards display place name, city, category, source host, and collection badges when available.
- Optional image URLs are supported with a clean placeholder state when no image is available.
- Cards link to the existing place detail/edit route.
- No favorite ranking was added because the saved-place data has no favorite field.

### Unchanged Behavior
- The extraction architecture remains unchanged.
- The Google Maps extractor remains unchanged.
- The Website Extractor remains unchanged.
- Source merging remains unchanged.
- The AI enrichment architecture remains unchanged.
- The Supabase schema remains unchanged.
- The collections data model remains unchanged.
- The map system remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`14` tests).

## Validated V1 Extraction Architecture Checkpoint

### Architecture Scope
- A source detection layer now identifies `unknown`, `website`, `google_maps`, `xiaohongshu`, `douyin`, `instagram`, and `tiktok` source types.
- A shared extractor interface now defines `sourceType`, `canHandle()`, and `extract()`.
- An extractor registry architecture now selects the registered extractor for a detected source type.
- Placeholder extractors were added for Google Maps, Website, Xiaohongshu, and Douyin.
- Placeholder extractors return an explicit not-implemented result without inventing extracted fields.
- A normalized extraction result type now defines name, category, city, address, latitude, longitude, source URL, notes, confidence, and extraction status.

### Review Flow Scope
- The current review flow now displays the detected source and extraction availability status.
- Manual entry remains supported and continues through the existing review-before-save flow.
- The extraction architecture remains a local boundary for future source implementations; it does not fetch or scrape source content.

### Unchanged Behavior
- The Supabase schema remains unchanged.
- Saved place creation behavior remains unchanged.
- Map rendering remains unchanged.
- Marker clustering remains unchanged.
- Map search remains unchanged.
- City filtering remains unchanged.
- City normalization remains unchanged.
- Location resolver remains unchanged.
- The collections system remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused extraction/source-intake tests passed.

## Validated V1 Add-Place Flow Checkpoint

### Flow Scope
- `/restaurants/new` and `/restaurants/review` now support the improved save flow.
- Source URL is now the primary entry point.
- Source intake, review draft shaping, and saved-place creation are now separated layers.
- Manual entry now also goes through review before saving.
- Source recognition is local-only.

### Boundaries
- No external APIs were added.
- No AI extraction was added.
- No scraping was added.
- No map changes were made.

### Unchanged Behavior
- The Supabase saved-place schema remains unchanged.
- Marker rendering remains unchanged.
- Clustering remains unchanged.
- Map search remains unchanged.
- City filtering remains unchanged.
- City normalization remains unchanged.
- Location resolver behavior remains unchanged.
- Coordinate handling remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run build` passed.
- `npm run lint` passed.
- Focused add-place tests passed.

## Validated User Collections Checkpoint

### Collections Scope
- A user-scoped collections feature was added.
- A `collections` table was added.
- A `restaurant_collections` join table was added.
- RLS ownership rules were added for collections and collection memberships.
- A saved place can now belong to multiple collections.
- Removing a collection membership does not delete the saved place.

### UI Scope
- A `/collections` page was added.
- The place edit page now supports adding and removing collection memberships.

### Unchanged Behavior
- Map rendering remains unchanged.
- Marker clustering remains unchanged.
- Map search remains unchanged.
- City filtering remains unchanged.
- City normalization remains unchanged.
- Location resolver behavior remains unchanged.
- Coordinate handling remains unchanged.
- The saved place schema remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Collection focused tests passed.

## Validated Map Place-Detail Interaction Checkpoint

### Popup And Navigation Scope
- The marker popup was upgraded into a clearer place preview card.
- The popup now displays the place name, city, category when available, address when available, and exact or approximate location state.
- A touch-friendly `查看详情` action now navigates to the existing place detail or edit route.
- Search selection still focuses and opens the correct marker popup.

### Preserved Map Behavior
- Marker clustering behavior remains unchanged.
- City filtering remains unchanged.
- Search behavior remains unchanged.
- Location normalization remains unchanged.
- The coordinate resolver remains unchanged.
- Supabase schema and saved data remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `node --test lib/map/*.test.js` passed (`47` tests).

## Validated Map Clustering Checkpoint

### Clustering Scope
- Marker clustering was added on top of the existing map marker data flow.
- Clustering is map-only and does not affect the Supabase schema or saved place data.
- Clusters group nearby markers at lower zoom levels and expand back into individual markers as zoom increases.
- Clicking or tapping a cluster zooms into that area to reveal more markers.

### Preserved Marker Behavior
- Exact and approximate marker behavior remains unchanged after cluster expansion.
- Normal marker popup behavior remains unchanged.
- Search selection continues to focus and open the correct marker popup.
- Existing Supabase queries, saved records, and local map filtering inputs remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `node --test lib/map/*.test.js` passed (`44` tests).

## Validated Map Search Interaction Polish Checkpoint

### Search Interaction Scope
- `/map` search results can now be selected directly from the local search UI.
- Selecting a search result moves the map to the selected place through client-side map focus behavior.
- The selected place now shows an active marker state on the map.
- Selecting a search result now opens that place popup automatically.
- The search UI now includes a clear-search action.

### Unchanged Map Data Flow
- Supabase place queries remain unchanged.
- The database schema remains unchanged.
- City filtering behavior remains unchanged.
- The coordinate resolver remains unchanged.
- The marker generation pipeline remains unchanged.
- This checkpoint adds interaction polish on top of the existing filtered marker set rather than introducing a new map data source.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `node --test lib/map/*.test.js` passed (`36` tests).

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

## Validated AI Review-Form Integration Checkpoint

### Review Form Integration
- Accepted AI suggestions now populate the normal editable review form instead of remaining in an AI-only draft.
- Persistable AI fields include `category`, `cuisine` as the temporary subcategory field, and the accepted summary mapped into `notes`.
- The editable form values are the final source of truth for saving.
- Manual edits remain the highest-priority values after AI suggestions are applied.
- Applied AI values survive page refresh through the existing URL-backed review draft state.
- Collection-creation redirects preserve the editable draft values.

### URL State And Preview Boundaries
- URL-backed AI state restores group-specific accepted selections.
- Preview-only tags and place type remain marked `暂不保存`.
- Preview-only suggestions cannot be accepted and are excluded from the save payload.
- Repeated application of already-applied suggestions is disabled.

### Manual Validation
- The `teamLab` manual validation passed: category became `景点`.
- The subcategory became `Art Gallery`.
- A manual change to `Digital Art Museum` survived refresh.
- No place was saved during validation.

### Unchanged Behavior
- The Supabase schema remains unchanged.
- The map system remains unchanged.
- The collections architecture remains unchanged.
- The extraction architecture remains unchanged.
- DeepSeek provider behavior remains unchanged.
- Preview-only tags/place-type persistence remains unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused tests passed (`36` tests).

## Validated Step 2 Durable DeepSeek Cache Checkpoint

### Durable Cache
- Added an owner-scoped `public.ai_enrichment_cache` Supabase table with provider, model, prompt version, source metadata, evidence hash, normalized response JSON, creation time, and expiry time.
- Added a unique `(user_id, cache_key)` constraint, lookup-supporting indexes, and authenticated owner-only RLS policies for cache CRUD.
- Cache entries use a 30-day TTL and store only validated normalized AI results; raw HTML and full pasted evidence are never persisted.

### Cache And Provider Flow
- AI review state lookup priority is now: URL-backed review state, durable Supabase cache, then the DeepSeek provider.
- Cache keys are deterministic and include provider, model, prompt version, source type, normalized source URL, compact extraction evidence hash, missing-field set, and thinking mode.
- Concurrent requests for the same owner and cache key are coalesced through an in-flight request map.
- Valid `suggestions_available` and `no_changes` results may be cached; failures, invalid responses, and timeouts are never cached.
- Cache read, write, and invalid-entry cleanup failures are non-blocking and fall back to the provider safely.
- Manual `重新分析` bypasses a valid cache entry once and warns that it will call AI again.
- Manual approval remains required, and AI suggestions never write directly to Supabase.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused cache, DeepSeek, AI review-state, enrichment, and migration tests passed (`42` tests).
- Automated validation completed without creating or saving a place record.

## Validated Step 3 Production Logging And AI Privacy Checkpoint

### Safe Diagnostics
- Replaced default raw DeepSeek response logging with concise structured diagnostics.
- Development logs cover cache hit/miss/bypass/read/write failures, provider calls/successes/failures, validation outcomes, finish reasons, HTTP status, model, prompt version, request duration, and cache operation duration.
- Production suppresses successful provider and cache events and emits only sanitized actionable failures or warnings.
- Cache diagnostics use short cache-key prefixes only; full cache keys, user IDs, evidence hashes, suggestions, response objects, and source URLs are omitted.

### Privacy Controls
- `DEEPSEEK_DEBUG_RAW_RESPONSE=true` is required for raw response logging and is honored only in development; raw responses are never logged in production.
- Source context is reduced to hostnames with paths, queries, fragments, usernames, and passwords removed.
- Safe error serialization keeps only operation, error name, safe message, provider code, HTTP status, and retryable state; credentials, tokens, cookies, bodies, stacks, and connection details are excluded.
- User-pasted evidence is not logged, not stored in the AI cache, and is not written to Supabase before final place save.
- Added optional server-only variables `DEEPSEEK_DEBUG_LOGS` and `DEEPSEEK_DEBUG_RAW_RESPONSE` to `.env.example`.

### Validation
- Development miss/hit diagnostics were regression-tested without raw content, evidence, credentials, user IDs, or full cache keys.
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused logging, privacy, DeepSeek, cache, review-state, enrichment, and migration tests passed (`50` tests).

## Validated Step 4 Read-Only Place Details Checkpoint

### Details Route
- Added the authenticated read-only `/restaurants/[id]` details route.
- The route uses the existing server Supabase client and owner-scoped RLS query path; inaccessible or missing places use the existing not-found behavior.
- `/restaurants/[id]/edit` remains the explicit editing route. Details actions link to `编辑地点` without adding delete controls.
- The details view shows available name, generalized category, existing `cuisine` as subcategory, city, address, notes, privacy, creation date, assigned collections, and a safe source hostname with an external link.
- Empty optional fields are hidden. Phone is omitted because it is not persisted by the current saved-place model. Missing images use the existing no-image visual treatment.
- Legacy `玩乐` category values remain display-compatible and saved place data is not rewritten.

### Navigation And Collections
- Dashboard `PlaceCard`, saved-place list names, map popup details links, and collection place cards now target `/restaurants/[id]`.
- Explicit edit links continue to target `/restaurants/[id]/edit`.
- Collection place previews are loaded through the existing RLS-scoped Supabase queries and link to the read-only details page.
- Assigned collection badges on the details page link back to the existing `/collections` page anchors; no collection schema or membership behavior changed.

### Location And Unchanged Boundaries
- The details location section reuses the existing MapLibre component, marker generation pipeline, coordinate resolver, exact marker behavior, and approximate city fallback behavior.
- No second map architecture was introduced, and no map rendering, clustering, search, city filtering, city normalization, extraction, AI, or saved-place schema behavior changed.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed and recognized `/restaurants/[id]`.
- Focused details, collection-card, saved-place-card, map-popup, location, and collection-membership tests passed (`25` tests).
- Interactive authenticated 390x844 manual validation was not run in this environment; no place was created or modified during validation.

## Validated Step 5 Homepage Experience Checkpoint

### Homepage Hierarchy
- The authenticated `/dashboard` homepage is now centered on `存个地` with the hierarchy: identity, prominent `添加地点`, `最近收藏`, `收藏夹`, `按分类浏览`, and `查看地图` / map search access.
- Recent places use the existing `PlaceCard`, are newest-first, limited to a compact preview, and link to `/restaurants/[id]`. The empty state is `还没有收藏地点` with a direct first-place action.
- Collection summaries link to the existing `/collections` page and collection anchors, with an empty state when no collections exist.
- Homepage category shortcuts use only `美食`, `景点`, `住宿`, `购物`, `娱乐`, and `其他`, show counts, and route through the existing `/restaurants?category=...` list filter.
- Legacy `玩乐` records are grouped and displayed under `娱乐` without changing saved values.

### Data And Boundaries
- Dashboard data is loaded through the existing authenticated owner-scoped discovery query; recent ordering and category counts are derived locally without duplicate homepage queries.
- Homepage errors use safe generic messaging and do not expose Supabase error details.
- Map access reuses `/map`, including the existing local search, city filtering, marker, and clustering experience. No homepage map or second search backend was added.
- No recommendation algorithms, social content, favorite ranking, schema changes, collection architecture changes, extraction changes, AI changes, or authentication changes were introduced.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused homepage, navigation, category, place-card, collection-card, and collection-membership tests passed (`14` tests).
- Interactive authenticated 390x844 manual validation was not run in this environment; automated validation did not create or modify a place.

## Validated Step 6 Generalized Place Categories Checkpoint

### Canonical Category Layer
- Centralized generalized place-category behavior in `lib/restaurants/constants.ts` with the canonical order `美食`, `景点`, `住宿`, `购物`, `娱乐`, `其他`.
- Added shared normalization, labels, descriptions, subtype metadata, and evidence terms so forms, AI mapping, manual evidence, filters, counts, search, and display use one category vocabulary.
- Legacy `玩乐` remains accepted as an internal compatibility value and normalizes to `娱乐` for display and comparison. New review, insert, and update boundaries write canonical `娱乐`; invalid category values are rejected rather than silently accepted.
- User-facing landing, form, list, card, details, popup, review, collection, and dashboard displays no longer expose a separate `玩乐` option or bucket.

### Behavior And Boundaries
- Existing saved values are not rewritten and no schema migration is needed: the current category constraint already permits all six canonical values plus legacy `玩乐`.
- Category filters and homepage counts combine `娱乐` and `玩乐`; malformed filter values do not create a query value. Local map search now covers canonical category, legacy category, subcategory, city, address, and notes.
- AI category understanding reuses the canonical mapping: restaurant/cafe/bar/bakery map to `美食`, attraction/museum/art gallery/landmark to `景点`, hotel/resort/hostel to `住宿`, store/shopping mall/market to `购物`, and supported entertainment terms to `娱乐`. Unsupported categories remain unaccepted.
- Supabase schema and saved rows, map rendering and marker pipeline, clustering, coordinate resolution, collections architecture, extraction architecture, and DeepSeek behavior remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused category, save-boundary, review-form, home-discovery, map-filter, marker, popup, card, details, collection, and manual-evidence tests passed (`58` tests).
- Interactive browser validation was not run in this environment; automated validation created or saved no place.

## Validated Step 14 Personal-Only Product Mode Checkpoint

### Personal Ownership
- 存个地 V1 is now explicitly personal-only. New places and edited places always persist with `privacy = private`, including when stale public values arrive through old URLs or crafted form submissions.
- The existing `privacy` database column and `public` compatibility value remain in the data model; no migration was added and existing rows were not rewritten.
- All place and collection routes remain authenticated and owner-scoped through `requireAuthenticatedUser`, Supabase RLS, and existing owner-based queries. Public rows are not exposed through a public route.

### Simplified Experience
- Removed the privacy selector from manual entry, review confirmation, and edit forms.
- Removed public/private badges from normal place list and details pages.
- Collections remain personal organization only, with no public sharing, collaboration, profiles, followers, sharing links, or social discovery behavior.
- Source URLs continue to be stored only as external references; they are not sharing links.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused personal-only, save-boundary, review-form, details, collection, map, category, and RLS migration tests passed (`57` tests).
- A broader Node sweep reached `205/207` passing; the two failures are existing direct-Node module-resolution issues in `source-extraction.test.ts` and `source-url.test.ts`, unrelated to this change.

## Validated Step 7 Real-Place Workflow Validation Checkpoint

### Validation Phase
- Added `memory-bank/v1-real-place-test-plan.md` with 20 realistic import cases: 5 food places, 3 cafes/bars, 3 attractions, 3 hotels, 3 shops, and 3 entertainment places.
- Added `memory-bank/v1-real-place-validation-report.md` with per-case result fields, summary metrics, safety checks, and the Step 8 UI findings structure.
- The manual 20-case run is deliberately pending. Automated validation saved no place and did not create a test record.
- Step 8 is reserved for the major visual redesign; Step 7 only validates the current workflow and captures actionable findings.

### Workflow Diagnostics
- Added concise server-only development diagnostics for intake started, source detected, extraction completed, AI completed, review ready, and suggestion applied.
- Diagnostics log only safe event metadata, source hostnames, source type, statuses, durations, and suggestion counts. They omit raw evidence, form contents, response bodies, user IDs, credentials, and full URLs.
- Existing DeepSeek cache hit/miss/bypass diagnostics remain the source of AI cache events. `WORKFLOW_DEBUG_LOGS=false` disables the new workflow events; production emits none.

### Test-Runner Findings
- Standardized the broad sweep as `npm test` with a TypeScript-aware ESM loader that resolves extensionless TypeScript imports and the Next `@/` alias.
- The previously failing `source-extraction.test.ts` and `source-url.test.ts` now execute their assertions successfully. No assertions were weakened and no tests were removed.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `285/285` tests.
- Focused personal-only, workflow-diagnostics, save-boundary, review-form, details, collection, map, category, and RLS migration tests passed (`59` tests).

## Validated Final Mobile UI Refinement Checkpoint

### Dashboard And Navigation
- `/dashboard` is now map-first and limited to the primary map, compact recent places, collection shortcuts, and six category shortcuts. Large metric cards, large counts, duplicated map teasers, and secondary dashboard modules were removed.
- The dashboard map reuses the existing MapLibre marker, coordinate, approximate-location, popup, and clustering pipeline. `查看完整地图` continues to expose `/map`, while an empty map keeps its container and offers `添加地点`.
- Recent places are limited to the three newest compact cards. Collection previews are limited to three shortcuts. Category shortcuts route directly to `/restaurants?category=...` and retain legacy `玩乐 -> 娱乐` compatibility.
- Bottom navigation is now 首页、地点、添加、收藏、我的. The map tab was removed; the full map remains reachable from the dashboard and existing map links. A minimal authenticated `/account` destination supports 我的 and logout.

### Interaction And Readability
- Added a shared accessible bottom-sheet primitive with dialog semantics, Escape/close handling, focus restoration, safe-area spacing, keyboard-safe scrolling, and a focused collection-creation sheet.
- Normal application text now targets 17px, with 15px reserved for genuinely secondary metadata. Bottom-navigation items use 48px minimum height and a 72px maximum slot while fitting narrow mobile widths.
- Dashboard cards progressively disclose only image/placeholder, name, category/subcategory, and location. Map marker selection continues to use the existing compact popup preview and `查看详情` action.
- The one-screen-one-job hierarchy is preserved: dashboard discovers, list browses, details views, forms edit, map browses geographically, and sheets handle one short selection or creation task.

### Preserved Boundaries
- Authentication, owner-scoped RLS, private-only behavior, Supabase schema, extraction, DeepSeek, AI cache/review persistence, category normalization, collections data model, details/edit routes, map rendering, clustering, search, and filters remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `293/293` tests.
- Interactive authenticated viewport validation at 375px, 390px, and 430px was not run in this environment; automated validation created or saved no place.

## Validated Step 9 Location Hierarchy UI Checkpoint

### Country-City-Places Flow
- Added a shared local location hierarchy layer for country identity, city identity, display labels, country/city options, filtering, URL state serialization, and location search terms.
- The map now filters in the order country -> city -> places. Country aliases use the existing conservative normalization layer, and city aliases continue to collapse only where already known.
- Map location filtering is a compact bottom-sheet flow: select a country, then select a city. Country search appears when the saved dataset is large. Country-only records remain selectable even when no city option exists.
- The existing MapLibre marker generation, exact/approximate coordinate behavior, popup selection, clustering, and search-before-marker-rendering pipeline remain unchanged.

### Saved Places And Compatibility
- `/restaurants` now exposes country-first location browsing with nested city links and place counts. The selected country/city narrows the existing owner-scoped place list without changing the saved-place schema or query ownership boundary.
- Search matches country, city, and country-plus-city terms such as `Japan`, `Osaka`, `Japan Osaka`, `中国`, and `中国 上海` before map marker resolution.
- Records with `country = null` remain in an explicit `未标注国家` group and continue to display their saved city text alone. Existing saved country/city values are not rewritten.
- Place list cards, collection cards, details, map popups, and dashboard cards now use country-first labels when both values exist, while falling back to city-only when country is unavailable.
- Map country/city state is preserved in URL query parameters and restored on refresh. No schema, migration, coordinate, extraction, AI, or collection-model changes were introduced.

### Validation
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `299/299` tests, including country filtering, nested city filtering, same-city cross-country separation, Japan/Osaka and China/Shanghai search, country-only records, legacy null-country records, and filter-state persistence.
- Automated validation created or saved no place.

## Validated Add Flow Simplification Checkpoint

### Progressive Disclosure
- `/restaurants/new` is now a focused landing screen with only two choices: `手动添加` and `粘贴链接`. It no longer renders a URL input, manual fields, extraction explanation, AI explanation, or multiple add-method cards at once.
- Selecting `手动添加` navigates to `/restaurants/new/manual`, which presents only the existing manual form and continues into the existing review/save flow.
- Selecting `粘贴链接` opens one focused source-selection bottom sheet with `小红书`, `官方网站`, and `其他网页`. Selecting a source navigates to `/restaurants/new/source?source_type=...` before any URL input is shown.
- The source step presents only the source-specific URL intake and `开始分析` action. Invalid-link errors stay on that source step; they do not appear on the Add landing page.
- Returning from a source step preserves the selected source in the URL and reopens the source-choice sheet. Invalid or refreshed source types safely fall back to `其他网页`.

### Preserved Boundaries
- Existing source parsing, extraction, Website/Google Maps behavior, DeepSeek enrichment, review state, collection selection, save actions, database schema, authentication, and collection behavior remain unchanged.
- The change is presentation and routing only: manual and URL flows are separated, while both still converge on the existing review/save architecture.
- The guided flow follows `添加地点 -> 选择方式 -> 手动填写或选择来源 -> 输入链接 -> Extraction/AI Review -> Edit -> Save`.

### Validation
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `303/303` tests, including Add landing, source selection, focused route, invalid-state, and back-navigation coverage.
- `git diff --check` passed.

## Validated 全部地点 Browsing Filter Checkpoint

### Personal Place Library
- `/restaurants` is now the simple personal place library. It defaults to showing all owner-scoped saved places, with no statistics cards or required filter mode.
- A compact search and filter bar sits above the place list. Search remains local and can match saved place names, locations, and categories.
- The city filter uses a focused bottom sheet with a country -> city hierarchy. Only cities represented by saved places appear; country-only records remain in the dataset without becoming empty city options.
- The category filter uses canonical user-facing groups: `美食`, `景点`, `住宿`, `购物`, `娱乐`, and `其他`. Legacy `玩乐` records continue to display and match as `娱乐` without rewriting saved values.

### Filter Behavior
- City and category are optional refinements. When both are selected, they combine with search using AND logic, such as Shanghai + 美食 + `coffee`.
- Active location/category chips support individual removal. `清除筛选` appears only when a search or filter is active, and the no-match state offers a clear-filter action.
- Filter state is represented in `/restaurants?q=...&country=...&city=...&category=...`. Opening a place from a filtered list preserves the return path so the same library view can be restored.

### Unchanged Boundaries
- Existing owner-scoped queries, authentication, private-only behavior, saved-place schema, save flow, extraction, AI enrichment, collections, map architecture, marker rendering, clustering, coordinates, and location normalization remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `310/310` tests, including library filtering, country/city grouping, international locations, legacy category compatibility, combined search, URL state, and clear-state coverage.

## Validated Step 9 Location Simplification And Area-Based Map Model Checkpoint

### Area-First Location Model
- Added the nullable `restaurants.district` field through the additive migration `20260719100000_add_restaurant_district.sql`; no existing rows are rewritten and no saved city values are changed.
- The effective location structure is now `country -> city -> district -> address`, with latitude/longitude retained as optional rendering coordinates. Exact street-level data remains optional for place memory.
- Added a shared conservative resolver for known city-country aliases, district aliases, and explicit manual corrections. Osaka, Tokyo, Shanghai, Paris, and New York resolve to their known countries; unknown cities remain unchanged and unresolved.
- District evidence is accepted from Google Maps URL address data, supported structured website address data, pasted visible text, and accepted AI factual suggestions. No unsupported district or country is guessed.

### Map And Display Behavior
- Map resolution keeps exact stored coordinates first, then uses known district centers, then known city centers. Unknown areas do not fall back to an unrelated location.
- Exact marker behavior is unchanged. Approximate markers now preserve `district` precision and are labeled `区域位置`; city fallback remains labeled `大概位置`.
- Place cards, read-only details, collection previews, list rows, search results, and map popups display non-empty `country · city · district` labels without duplicating values. Empty country/district fields remain hidden.
- Map and saved-place filters now support country -> city -> district selection with URL-backed state. Existing city/category/search behavior, clustering, marker generation, and filtering-before-rendering remain unchanged.
- Forms keep city as the user-entered location, add optional district, and present country as automatically identified with manual correction available when needed.

### Preserved Boundaries
- Supabase schema is unchanged except for the additive nullable district migration. Authentication, owner-scoped RLS, private-only behavior, saved place creation, collections, extraction, AI enrichment, and the existing coordinate pipeline remain intact.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `317/317` tests, including city-country resolution, district extraction, district fallback, approximate labels, unknown-location safety, hierarchy filters, and legacy records without district.

## Validated V1 UX Refinements Checkpoint

### Paste Flow
- `/restaurants/new` now offers `手动添加` or `粘贴链接` only. Selecting `粘贴链接` opens `/restaurants/new/source` immediately; the user is no longer asked to choose 小红书、官方网站 or other web first.
- The paste page uses the single prompt `粘贴链接` / `请粘贴地点链接`. Existing source detection still classifies submitted URLs internally, including 小红书、抖音、官方网站映射和普通网页 fallback, and the review page may show the detected source as information.
- Existing extraction, review, AI, save, collection, authentication, and privacy behavior remains unchanged.

### Location And Display
- Country is no longer presented as a required standalone form field. Forms show a compact `国家/地区 · 自动识别` row, keep the resolver-provided value in the save payload, and expose correction input only when the user requests it.
- City and optional district remain the normal user-entered location fields. Manual country correction remains supported without making country part of the primary task.
- Details now show one compact `国家 · 城市 · 区域` location field. Place cards, collection cards, map popups, and search results continue using the shared hierarchy formatter and hide empty parts.

### Dashboard Categories
- 首页 `按类型浏览` now uses a 3-column by 2-row grid with larger icons, 76px minimum tiles, 17px labels, 44px touch targets, and an orange focus/hover accent.
- All six canonical categories keep direct navigation to `/restaurants?category=...`; no counts, backend queries, category logic, or recommendation behavior changed.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `319/319` tests, including paste-flow source classification, compact location labels, auto-country correction behavior, and category grid navigation/layout contracts.

## Validated Navigation Simplification Checkpoint

### Compact App Navigation
- Removed the persistent bottom navigation bar from the authenticated application shell. The dashboard now stays focused on discovery and no longer reserves screen space for repeated `首页 / 地点 / 添加 / 收藏 / 我的` navigation.
- Added a compact top app bar with the `存个地` brand trigger on the left and an always-visible orange add button on the right. The add action continues directly to `/restaurants/new` and preserves the simplified add flow.
- Tapping the brand trigger opens one focused navigation sheet containing only `地点` -> `/restaurants`, `收藏` -> `/collections`, `地图` -> `/map`, and `我的` -> `/account`. `首页` is intentionally omitted because the user is already in the app discovery surface.
- The menu and add action retain at least 44px touch targets, 17px navigation labels, safe-area-aware top spacing, and mobile-friendly sheet behavior.

### Unchanged Boundaries
- Routes, authentication, owner-scoped data loading, saved-place and collection models, map behavior, AI, extraction, save flow, category grid, and private-only behavior remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `320/320` tests, including top-menu destinations, add-button routing, touch-target, and typography contracts.

## Validated Auto-Filled Review Flow Checkpoint

### Automatic Review Draft
- URL review now follows `粘贴链接 -> 自动整理 -> 快速确认 -> 保存`. Deterministic extraction is merged first, then eligible validated AI results are applied into the same editable draft before the review screen is shown.
- Automatic AI application is limited to persistable fields with non-low confidence. It fills empty fields only; deterministic values remain authoritative, unsupported factual suggestions are not applied, preview-only tags/place type remain absent from the saved draft, and manual URL/form edits always win.
- `category`, `cuisine` as the temporary subcategory, `city`, `country`, `district`, explicit `address`, explicit `phone`, and `notes` remain attributable as `ai_suggestion` when applied. The editable form remains the final source of truth and saving still requires an explicit user action.
- Per-field confidence is preserved in URL-backed AI snapshots so refresh, cache restoration, reanalysis, and collection-creation redirects do not promote low-confidence suggestions or require acceptance again.

### Focused Review UI
- The normal review page is now one compact flow: source status, editable place form, optional `更多地点信息`, collection selection, and one prominent `保存地点` action.
- Large extraction, AI suggestion, duplicate preview, and acceptance panels were removed from the primary flow. `重新分析` remains available only under secondary `更多操作`.
- Source status is concise, for example `已从 teamlab.art 自动整理` or `部分信息需补充`. Missing required fields are emphasized; optional fields do not block saving. Manual website-evidence recovery remains available when a source is blocked or has no usable metadata.
- Location remains area-first: city and district are primary, country is shown as automatically resolved with correction available, and address/source details are collapsed under `更多地点信息`.
- Collection creation synchronizes the current URL-backed draft and selected collection ids before redirecting back to review, preserving automatic values and manual edits.

### Preserved Boundaries
- Supabase schema, authentication, owner-scoped RLS, private-only saves, DeepSeek provider, durable cache, extraction architecture, canonical categories, collections architecture, map behavior, and save confirmation boundaries remain unchanged. AI never writes directly to Supabase.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `322/322` tests.
- Automated validation created no place records. Interactive 390x844 manual validation was not run in this environment.

## Validated Dedicated Navigation Subpage Checkpoint

### Navigation Route
- The `存个地` brand/logo in the shared top app bar now links to the dedicated authenticated `/menu` navigation page instead of opening a dropdown or BottomSheet overlay.
- `/menu` uses normal document flow with a back button, the four existing destinations, full-row navigation targets, concise subtitles, icons, and chevrons. The destinations remain `/restaurants`, `/collections`, `/map`, and `/account`.
- The back action uses browser history when available and falls back to `/dashboard`. The orange top-right quick add action remains globally available at `/restaurants/new`.

### Scroll And Boundaries
- Navigation no longer uses a backdrop, menu portal, fixed oversized sheet, stale modal state, or navigation-specific body scroll locking. Shared BottomSheet behavior remains available for unrelated collection and map filter interactions.
- The menu page keeps safe-area-aware app-shell spacing and naturally scrolls at 375x812, 390x844, and 430x932. All navigation rows remained fully visible in the mobile validation pass.
- Routes, authentication, saved data, collections, map behavior, AI, extraction, category behavior, and save flow remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `324/324` tests.
- Browser validation confirmed normal body scrolling and complete menu rows at 375x812, 390x844, and 430x932; the temporary preview tab was closed without creating or modifying a place.

## Validated Dashboard Discovery Restoration Checkpoint

### Dashboard Responsibility
- `/dashboard` remains the authenticated discovery homepage, not the navigation menu. It now presents the shared `存个地` navigation trigger and quick add action, followed by the live map preview, `按类型寻找` category grid, `最近添加`, and `我的收藏集` preview.
- The six category shortcuts remain a touch-friendly 3-column by 2-row grid and link to the existing filtered place list. Recent place cards, collection previews, and map markers are derived from the same owner-scoped data flow; no recommendation or duplicate navigation system was added.
- `/menu` remains the dedicated route-based navigation page for `地点`, `收藏`, `地图`, and `我的`; persistent bottom navigation and overlay navigation remain removed.

### Query Compatibility And Data Flow
- Added a narrow compatibility layer for the additive `country` and `district` projections. When an older remote `restaurants` schema explicitly reports one of those optional columns as missing, list, details, map, dashboard, and collection-preview reads retry the legacy projection and normalize only those fields to `null`.
- Other query, permission, RLS, and network errors are not converted into empty data. Development diagnostics identify the legacy projection fallback, while successful dashboard data is rendered normally instead of being mistaken for an empty account.
- Existing saved place rows, collections, marker generation, clustering, coordinate resolution, category logic, search, extraction, AI, authentication, and private-only behavior remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests, including query compatibility and the existing map, collection, navigation, extraction, AI, privacy, and save-boundary suites.
- Browser validation at 390x844 confirmed the map canvas, 2 saved places, category grid, recent-place cards, collection preview, normal scrolling, and `/menu` destination links. No place was created or modified.

## Validated Dashboard Regression Fix Checkpoint

### Dashboard And Navigation
- Restored `/dashboard` as the discovery homepage with the map, `按类型寻找`, `最近添加`, and `我的收藏集` sections. The dashboard remains separate from `/menu`.
- The top navigation menu now contains only `地点`, `收藏`, and `我的`. `地图` remains available inside 首页 and through its existing internal `/map` route, but is no longer a primary menu destination.
- Restored the six shared category icons with larger 28px SVGs, 17px labels, the 3-column by 2-row grid, and direct category-filter links.

### Location Projection Migration
- The remote database was verified to have `country` but not `district`; the existing additive district migration was applied without rewriting restaurant rows. `public.restaurants.district` is nullable and indexed.
- Restaurant reads now use one migrated projection containing `country`, `city`, `district`, `address`, `latitude`, and `longitude`. The legacy projection fallback and its development warning were removed, so schema drift is no longer hidden by a compatibility retry.
- Dashboard, place list, collection previews, and map reads now load through the same formal location shape. Existing map rendering, marker resolution, clustering, search, filtering, saved data, and RLS remain unchanged.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests.
- Browser validation at 390x844 confirmed six category icons, 8 map markers, recent places, collection preview, working `/restaurants`, working MapLibre `/map`, and a three-item `/menu`. No place was created or modified.

## Validated Final One-Screen Dashboard Restoration Checkpoint

### 首页 Discovery Surface
- `/dashboard` is now a focused one-screen discovery homepage: the shared top app bar, the saved-place map, `按类型寻找`, and compact `地点`/`收藏` shortcuts are the complete primary flow.
- Recent-place previews, collection previews, large statistics, counts, and feed-like management sections were removed from 首页. Recent places remain available from `/restaurants`, and collections remain available from `/collections`.
- The map remains the primary feature and uses the existing MapLibre marker, clustering, coordinate, and location behavior. The dashboard loads only the owner-scoped map-place query and does not load recent-place or collection-preview data.
- When no places are available, the map uses the compact empty state `还没有地点` and `添加地点后会显示在地图上` rather than exposing technical query errors.

### Fast Entry Points
- `按类型寻找` is a 3-column by 2-row grid for `美食`, `景点`, `住宿`, `购物`, `娱乐`, and `其他`, with larger icons, 17px labels, touch-friendly cards, and direct `/restaurants?category=...` navigation.
- The two compact shortcut cards are `地点` -> `/restaurants` and `收藏` -> `/collections`. They contain no large counts or statistics and keep the homepage focused on quick entry.
- The existing top-left `存个地` route trigger -> `/menu`, top-right quick add action, dedicated navigation page, authentication, private-only behavior, extraction, AI, collections, and map architecture remain unchanged.

### Mobile Layout
- The dashboard source layout targets a 390x844 viewport with safe-area-aware top navigation, a 280px map surface, a 3x2 category grid, and two compact shortcuts without horizontal overflow.
- The homepage intentionally avoids information overload: it answers where saved places are, provides direct category discovery, and routes deeper browsing to dedicated pages.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `325/325` tests, including dashboard structure, category grid, query compatibility, map, navigation, extraction, AI, privacy, and save-boundary coverage.
- Browser validation at 390x844 confirmed the restored dashboard structure, six category icons, two quick-navigation cards, no recent or collection preview sections, and no horizontal overflow. No place was created or modified.

## Validated V1 Email-Only Login UI Checkpoint

### Authentication Surface
- `/login` now uses a centered, mobile-first 存个地 visual system with the existing star-and-dot brand, `收藏你喜欢的地方`, a single rounded login card, and concise Chinese copy.
- The card presents `欢迎回来`, `登录账号，继续收藏地点`, visible 邮箱 and 密码 labels, 17px inputs, 52px controls, the existing `/sign-up` route as `还没有账号？立即注册`, and one orange `登录` action.
- Password visibility is an accessible interactive control with `显示密码` / `隐藏密码` labels. Submit state uses the existing server action with `登录中…` and duplicate-submit protection.
- Login provider errors are sanitized in the UI to concise copy; local validation messages remain readable. No raw Supabase error details are exposed on the login page.

### Explicitly Omitted
- V1 authentication remains email/password only. Google login, Apple login, OAuth controls, social dividers, third-party placeholders, password reset links, and unsupported legal links are intentionally absent.
- Supabase authentication logic, login server action, session handling, protected routes, redirect behavior, sign-up architecture, and password validation remain unchanged.
- Successful login continues to redirect to `/dashboard?login_success=1`; the existing one-time `你已成功登录` toast consumes and removes the signal, then dismisses without a permanent dashboard banner.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `332/332` tests, including login UI, error-sanitization, password-control, and redirect contracts.
- Automated checks confirmed the login source contains the branded email-only form and no Google/Apple/social controls. Interactive login-page validation was limited because the available browser session was already authenticated and redirected `/login` to `/dashboard`; no authentication state was changed.

## Validated Step 9A Data Loading And Location Integrity Checkpoint

### Route And Authentication QA
- Audited the public and protected entry routes: `/`, `/login`, `/sign-up`, `/dashboard`, `/menu`, `/restaurants`, `/restaurants/[id]`, `/restaurants/[id]/edit`, `/collections`, `/map`, `/settings`, and the manual/source/review add routes.
- Root and authentication-page redirects remain server-side and loop-free: logged-out users enter `/login`, authenticated users enter `/dashboard`, and protected place, collection, map, settings, and add routes use the shared authenticated-user guard.
- The obsolete setup/marketing surface is not linked from normal authentication or app navigation.

### Query And Error-State QA
- All restaurant reads continue through the single migrated projection containing `country`, `city`, `district`, `address`, `latitude`, and `longitude`; no legacy city-only fallback was reintroduced.
- Added sanitized restaurant query diagnostics for projection, collection, membership, map, list, dashboard, detail, and collection-preview failures. Diagnostics keep operation, safe error identity, bounded message, and safe code/details/hint fields without exposing raw credentials, URLs, or sensitive payloads.
- Dashboard and map now distinguish a failed data query from an empty saved-place state. Collection and review surfaces likewise avoid presenting a query failure as an empty collection list.
- The collection detail query now explicitly selects `created_at` before ordering by it, keeping the read contract internally consistent.

### Remote Schema And RLS Verification
- Read-only remote verification confirmed `public.restaurants`, `public.collections`, `public.restaurant_collections`, and `public.ai_enrichment_cache` exist with the expected additive location/cache/collection fields, RLS enabled, authenticated owner-scoped policies, and expected indexes/constraints.
- Existing restaurant data fingerprint remains unchanged: 10 rows, IDs `[1, 2, 4, 5, 6, 7, 8, 9, 10, 11]`, ID sum `63`.
- The district definitions were confirmed equivalent: local `20260719100000_add_restaurant_district.sql` adds only nullable `text` column `district` and `restaurants_district_idx`, matching the remote catalog. The stale remote history entry `20260719072843` was repaired to `reverted`, and the canonical local version `20260719100000` was repaired to `applied`; the remote schema and data were not changed.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `351/351` tests.
- Focused query-diagnostics and map-state tests passed (`10/10`).
- Remote migration listing completed read-only; no migration was applied during this QA checkpoint.

## Resolved District Migration History Checkpoint

- The remote district migration timestamp discrepancy was resolved through the supported Supabase migration repair workflow, without `db push`, `db reset`, ad hoc history SQL, schema changes, RLS changes, or data changes.
- The repository retains one canonical district migration: `20260719100000_add_restaurant_district.sql`. Final migration listing shows local and remote versions aligned, with no duplicate district migration pending.
- Remote verification still shows `public.restaurants.district` as nullable `text` with no default, no district constraint/comment/trigger, and the existing `restaurants_district_idx` index.
- Restaurant fingerprint remains unchanged: 10 rows, IDs `[1, 2, 4, 5, 6, 7, 8, 9, 10, 11]`, ID sum `63`.

## Validated Step 9B Mobile, PWA, And Production Hardening Checkpoint

### Mobile And Keyboard Reliability
- Added shared safe-area handling for the app shell, sticky top bar, authentication surface, bottom sheets, toast, and sticky review save action using the iOS inset environment variables.
- Added keyboard-friendly `enterKeyHint` sequencing and scroll margins for form controls so focused fields and primary actions remain reachable without custom viewport locking or persistent body position hacks.
- Bottom sheets now use bounded, independently scrolling mobile surfaces with touch scrolling, Escape support, focus trapping, correct trigger restoration, and cleanup of the body scroll-lock marker when closed or unmounted.

### PWA And Runtime Boundaries
- The generated manifest is installable in standalone mode with the approved `/icon.svg` star-and-dot icon, root scope, and auth-aware `/` start URL. Root routing continues to send logged-out users to `/login` and authenticated users to `/dashboard`.
- No service worker or complex offline cache was added. The V1 PWA remains online-first so authenticated Supabase responses are not cached across users.
- Added shared route-level recovery UI for dashboard, places/details/review, collections, map, and app-level failures. It exposes only retry and safe navigation actions; error details are logged only during development.

### Performance, Privacy, And Release Safety
- MapLibre cluster refreshes now happen on the map's zoom lifecycle without React zoom state re-renders, while resize and visual viewport changes call `map.resize()` and unmount cleanup removes the map/listeners.
- Authentication provider errors are sanitized before redirect URLs. Existing session, RLS, private-only save, DeepSeek diagnostic redaction, cache behavior, and extraction behavior remain unchanged.
- `.env.example` documents the optional `NEXT_PUBLIC_APP_URL` alongside the existing public Supabase/PMTiles variables and server-only DeepSeek variables. No credentials were added.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with `359/359` tests, including the new PWA, safe-area, keyboard, sheet, route-error, auth-sanitization, and map-lifecycle contracts.
- `npx --yes supabase@latest migration list` passed read-only; all eight local and remote migration versions align, and no migration was applied.
- Interactive iPhone viewport and standalone-install QA could not be completed from this session because the available in-app browser could not connect to the local development server. No authentication state or saved data was changed.

## Validated Saved-Place Edit And Location Editing Checkpoint

- `/restaurants/[id]/edit` now uses a compact mobile edit form with a normal back header, `编辑地点` title, secondary delete action, continuous sections for basic information, category/subcategory, notes, location, and source, plus sticky `取消` / `保存更改` actions.
- The old `STEP 9 编辑记录` developer-stage copy, duplicated read-only cards, automatic-recognition controls, oversized source URL, and implementation explanations were removed from the user-facing edit flow.
- Name, city, district, country, address, latitude, longitude, category, subcategory, and notes are all editable. Known country/district aliases retain canonical storage behavior while unknown/manual values remain available; blank country, district, and coordinates remain valid.
- Local-only location search uses the existing conservative city and district datasets. Selecting a candidate explicitly updates available area fields and coordinates; map taps and draggable-marker changes update coordinates without silently overwriting manually corrected text. No geocoding, external API, or map marker-pipeline change was added.
- Update payloads now include the full editable location set and return successfully to the existing read-only place detail route. Delete requires an explicit confirmation and uses the existing authenticated owner-scoped RLS boundary.
- Query failures now show `暂时无法读取地点，请稍后再试`; missing records show `找不到这个地点`; save failures are sanitized to `保存失败，请重试`.
- Collections remain on the existing join-table architecture and are shown below the edit form without changing collection behavior.

### Validation
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused edit, location-search, payload, and compatibility tests passed (`17` tests).
- Full `npm test` passed with `365/365` tests.
- No database migration, `db push`, `db reset`, or destructive data operation was run.

## Step 10A Vercel Production Deployment Preparation

### Release Configuration
- Audited Vercel environment usage. Required public variables are `NEXT_PUBLIC_SUPABASE_URL`, the repository's actual `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_PMTILES_URL` for Preview/Production; `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH` remains the local-development fallback and `NEXT_PUBLIC_APP_URL` remains an optional deployment hint.
- Server-only DeepSeek variables remain outside the browser bundle: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_DEBUG_LOGS`, `DEEPSEEK_DEBUG_RAW_RESPONSE`, and `WORKFLOW_DEBUG_LOGS`. `.env.example` contains safe placeholders only, and diagnostics remain disabled in production with raw response logging explicitly opt-in.
- `next.config.ts` now fails a production build with missing required Supabase or `NEXT_PUBLIC_PMTILES_URL` configuration instead of allowing a late runtime failure.
- `next.config.ts` retains `allowedDevOrigins: ["192.168.66.180"]` only as the current development LAN setting; no production CORS policy was added.

### Production Boundaries
- `/setup` is now development-only and is not linked from normal authentication or app navigation. Existing `/dev-fixtures/*` routes remain unavailable in production.
- Auth routing remains server-side and loop-free: logged-out `/` and protected routes go to `/login`, authenticated `/` goes to `/dashboard`, and authenticated users opening `/login` or `/sign-up` go to `/dashboard`. Logout continues to return to `/login`.
- PMTiles integration remains MapLibre-compatible and uses the shared resolver, MapLibre style, and bounded preflight; PWA manifest/icon, owner-scoped Supabase queries, private-only saves, DeepSeek redaction, extraction, collections, and schema remain unchanged.

### PMTiles Asset Strategy
- Preview and production now require `NEXT_PUBLIC_PMTILES_URL`, a public HTTPS URL for an immutable Vercel Blob archive such as `maps/base-v1.pmtiles`. Local development keeps the ignored `/maps/base.pmtiles` fallback.
- The deployment checklist records public Blob store creation, versioned upload, `vercel blob put`, Preview/Production environment configuration, bounded Range verification, and provider-side CORS verification. No archive was uploaded and no Blob token was added to the app.

### Validation
- `git diff --check`, `npm run lint`, `npm run build`, and `npm test` passed.
- Read-only `npx supabase migration list` was included in the release gate; no `db push`, `db reset`, or destructive database command was run.

## V1.1 Milestone 2 Short-Link Resolution Checkpoint

- Added bounded server-side resolution for Xiaohongshu `xhslink.com` and Douyin `v.douyin.com` short links. Full platform URLs and generic web URLs are not fetched automatically.
- Resolution uses manual redirects, a five-second total timeout, a four-redirect limit, strict approved-host checks, SSRF protections, HEAD-first with bounded GET fallback, and no response-body download.
- Original pasted URLs remain unchanged for review/save compatibility. Resolved URLs and failure status are temporary review metadata; failed links remain editable and continue to review.
- No migrations, source-post persistence, scraping, HTML extraction, screenshots, OCR, AI extraction, video handling, image fetching, or native sharing were added.
