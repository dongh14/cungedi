# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 11 only.

It does not include Step 12 or later architecture yet.

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
- `.env.example`: sample public Supabase environment variables
- `README.md`: current project overview and available scripts

### App Router Files
- `app/layout.tsx`: root HTML layout, shared metadata, and global document setup
- `app/page.tsx`: Step 6 public home page in the new shared shell
- `app/sign-up/page.tsx`: Step 6 sign-up page using the shared auth presentation
- `app/login/page.tsx`: Step 6 login page using the shared auth presentation
- `app/dashboard/page.tsx`: Step 6 protected overview page inside the signed-in app shell
- `app/setup/page.tsx`: Step 6 Supabase setup page in the shared public shell
- `app/restaurants/new/page.tsx`: Step 7 protected manual-create page
- `app/restaurants/review/page.tsx`: Step 11 protected source review and extraction page
- `app/restaurants/page.tsx`: Step 8 protected full saved-list page
- `app/restaurants/[id]/edit/page.tsx`: Step 9 protected restaurant edit page
- `app/restaurants/actions.ts`: Step 7, Step 9, and Step 10 server actions for create, update, and source-intake flow control
- `app/map/page.tsx`: Step 6 protected map placeholder page
- `app/auth/actions.ts`: Step 3 server actions for auth flows
- `app/globals.css`: global styles and Tailwind import
- `app/favicon.ico`: site icon

### Shared UI Components
- `components/app-shell.tsx`: protected application shell with desktop and mobile navigation
- `components/auth-card.tsx`: shared card for sign-up and login forms
- `components/navigation.ts`: shared navigation definitions and active-route helpers
- `components/placeholder-card.tsx`: reusable content card for Step 6 placeholder pages
- `components/public-shell.tsx`: public-page shell for home, auth, and setup pages
- `components/restaurant-form-card.tsx`: Step 7 reusable restaurant create form card
- `components/restaurant-list.tsx`: Step 8 reusable saved-list summary and list wrapper
- `components/restaurant-list-card.tsx`: Step 8 reusable saved-restaurant card
- `components/restaurant-edit-form-card.tsx`: Step 9 reusable restaurant edit form card
- `components/extraction-preview-card.tsx`: Step 11 reusable extraction-result card for accepted fields, fallback messaging, and manual-form handoff
- `components/source-intake-card.tsx`: Step 10 reusable source intake card for `/restaurants/new`
- `components/source-review-card.tsx`: Step 11 reusable source review card for `/restaurants/review`
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

### Restaurant Utilities
- `lib/restaurants/constants.ts`: Step 7 cuisine and privacy option definitions for the restaurant form
- `lib/restaurants/types.ts`: shared TypeScript types for restaurant inserts and minimal list items
- `lib/restaurants/queries.ts`: Step 8 and Step 9 user-scoped restaurant read helpers for the full saved list and edit route
- `lib/restaurants/source-url.ts`: generic Step 7 source URL extraction utility for direct links and sharing text
- `lib/restaurants/source-url.test.ts`: focused automated tests for URL extraction behavior
- `lib/restaurants/extraction-types.ts`: Step 11 shared extraction result, candidate, page-type, field-evidence, diagnostics, and fetch-result types
- `lib/restaurants/source-classification.ts`: Step 11 source-kind classification and support-level rules
- `lib/restaurants/source-fetch.ts`: Step 11 bounded source fetching with timeout, response-size, and content-type limits
- `lib/restaurants/source-html.ts`: Step 11 metadata, visible-text-segment, and structured-data parsing helpers
- `lib/restaurants/page-type.ts`: Step 11 page-type classification for single-restaurant, directory/list, generic, and unknown pages
- `lib/restaurants/field-validation.ts`: Step 11 strict restaurant-field validation and structured-address formatting helpers
- `lib/restaurants/cuisine-inference.ts`: Step 11 conservative cuisine inference helper with low-confidence blank behavior
- `lib/restaurants/source-extraction.ts`: Step 11 orchestration for fetching, parsing, validation, candidate acceptance, diagnostics, and fallback decisions
- `lib/restaurants/source-extraction.test.ts`: focused Step 11 regression tests for extraction behavior

### Supabase Database Files
- `supabase/migrations/20260709120000_create_restaurants_table.sql`: Step 4 migration that creates the initial V1 `restaurants` table, indexes, and `updated_at` trigger
- `supabase/migrations/20260709130000_enable_restaurants_rls.sql`: Step 5 migration that enables RLS and adds owner-only access policies for restaurant records

### Request Protection
- `proxy.ts`: request-time auth cookie refresh and protected-route handling

### Public Assets
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

These are starter static assets from the base app scaffold. They are not product-specific yet.

## What The Current Files Do

### `package.json`
- Defines the project name and npm scripts.
- `dev` starts the local Next.js development server.
- `build` creates a production build with Webpack.
- `start` runs the production server.
- `lint` runs TypeScript static checks with `tsc --noEmit`.
- Includes the `@supabase/supabase-js` dependency for the current Step 2 setup layer.
- Includes the `@supabase/ssr` dependency for the current Step 3 authentication layer.

### `.env.example`
- Documents the two public Supabase variables the app currently expects.
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

### `app/restaurants/review/page.tsx`
- Provides the protected Step 11 source review and extraction page after accepted URL intake.
- Reads the normalized `source_url` from the query string and rejects missing or malformed values by redirecting back to `/restaurants/new`.
- Calls the Step 11 extraction service for the normalized source URL.
- Uses the shared signed-in shell together with the source review card and extraction preview card.
- Keeps the Step 11 boundary explicit by showing draft extraction results without auto-saving anything.

### `app/restaurants/page.tsx`
- Provides the protected Step 8 full saved restaurant list page.
- Reads the current user's restaurant records through the shared query helper and existing owner-only RLS protection.
- Keeps the successful-save confirmation banner through the shared `AppShell` message area.
- Highlights the just-created restaurant when a `created` query parameter is present after a successful redirect from the create flow.
- Also displays the Step 9 short success message `餐厅信息已更新` after a successful edit redirect.
- Continues to stop short of Step 12 and later work by omitting extracted-candidate editing, multi-candidate confirmation, geocoding, and map integration.

### `app/restaurants/[id]/edit/page.tsx`
- Provides the protected Step 9 edit page for one saved restaurant.
- Loads exactly one current-user restaurant record through the shared query helper and owner-only RLS protection.
- Uses `notFound()` when the route id is invalid or the current user cannot access the requested restaurant.
- Keeps the route focused on editing saved records only and does not start any Step 10+ page fetching or extraction behavior.

### `app/restaurants/actions.ts`
- Contains the Step 7 server action that validates and creates restaurant records.
- Normalizes required and optional form fields before writing to Supabase.
- Uses the existing server Supabase client and authenticated user session.
- Extracts the first valid `http` or `https` URL from the pasted source input before saving `source_url`.
- Preserves form input in the redirect URL when validation fails.
- Redirects successful saves to `/restaurants` with a simple confirmation message and created record id.
- Also contains the Step 9 `updateRestaurantAction` server action for editing existing restaurant records.
- Keeps the editable-field boundary limited to `cuisine`, `note`, and `privacy`.
- Preserves validation and update errors on the edit page.
- Redirects successful updates back to `/restaurants` with the short success message `餐厅信息已更新`.
- Also contains the Step 10 `startSourceIntakeAction` server action for the new source intake flow.
- Reuses the existing generic first-`http` or first-`https` extraction logic instead of adding source-specific parsing.
- Accepts direct URLs, 高德 share text, 小红书 share text, 抖音 share text, Google Maps share text, and ordinary public-web share text as long as a valid URL can be extracted.
- Redirects accepted source input into `/restaurants/review` with the normalized URL.
- Redirects invalid source input back to `/restaurants/new` with Simplified Chinese validation feedback while preserving the pasted input.

### `app/map/page.tsx`
- Provides the protected placeholder page for the future map flow.
- Establishes the map page location in the signed-in navigation.
- Shows layout-only placeholder content rather than a real map integration.

### `app/auth/actions.ts`
- Contains the Step 3 server actions for sign up, login, and logout.
- Validates basic form input before calling Supabase Auth.
- Redirects users to the next screen with success or error state encoded in the URL.

### `app/globals.css`
- Imports Tailwind CSS.
- Defines the Step 6 visual tokens for the orange-accent, rounded-card UI.
- Sets the mobile-first background treatment, colors, and typography stack.
- Applies site-wide base styles for the new shell layout.

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
- Supports Chinese text input, Chinese-friendly cuisine suggestions, and free-text optional fields.
- Accepts either a direct URL or a longer 小红书, 抖音, Google Maps, or public-web sharing message in the source input.
- Preserves the pasted source text and the rest of the form values when validation fails.
- Receives the Step 10 handoff from `/restaurants/review` by accepting a prefilled `source_url` value through `source_input`.
- Intentionally excludes latitude and longitude inputs in Step 7.

### `components/restaurant-list.tsx`
- Provides the main Step 8 saved-list presentation wrapper.
- Renders high-level summary metrics such as total records, covered cities, and records with notes.
- Maps the current user's saved restaurants into reusable restaurant cards.
- Receives the created restaurant id so the list can keep the new-record highlight behavior after a save redirect.

### `components/restaurant-list-card.tsx`
- Provides the reusable Step 8 card UI for one saved restaurant.
- Shows the core restaurant details clearly: name, city, privacy, save date, and source link.
- Handles missing optional fields with explicit `暂未填写` fallback copy for `cuisine`, `address`, and `note`.
- Displays the newly-created highlight state and `刚刚保存` badge when requested by the parent list.
- Extracts a lightweight source host label from `source_url` for easier scanning without changing the saved source URL itself.
- Provides the Step 9 edit entry point from the saved restaurant list.

### `components/restaurant-edit-form-card.tsx`
- Provides the main Step 9 edit UI inside a reusable card.
- Shows the non-editable restaurant context fields `name`, `city`, `address`, and `source_url`.
- Limits editable fields to `cuisine`, `note`, and `privacy`.
- Supports clearing optional `cuisine` and `note` values back to blank.
- Keeps validation and update errors on the edit page so the user can correct and resubmit.

### `components/extraction-preview-card.tsx`
- Provides the main Step 11 extraction-result UI on `/restaurants/review`.
- Shows only accepted extracted fields plus explicit missing-field fallbacks such as `需要手动补全`.
- Avoids rendering giant low-confidence page-text blocks by never displaying rejected or unaccepted field candidates.
- Explains whether the current result is an accepted draft candidate or a fallback to manual completion.
- Hands accepted fields back into `/restaurants/new` so the existing manual form opens with prefilled values and remains the final save path.

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

### `lib/restaurants/source-extraction.ts`
- Orchestrates the full Step 11 extraction flow from source classification through fetch, parse, validation, and final candidate or fallback decision.
- Prioritizes structured data first, then conservative metadata and labeled-section heuristics, while avoiding broad body-text extraction.
- Supports partial candidates so genuine single-restaurant pages can return a reliable subset of fields when address, city, or cuisine are uncertain.
- Adds candidate-acceptance thresholds so successful drafts require a valid restaurant name plus sufficient single-restaurant evidence.
- Records development-only diagnostics for final fetched URL, page type, structured-data coverage, accepted field evidence, rejected field candidates, and the final acceptance or fallback reason.

### `lib/restaurants/source-extraction.test.ts`
- Covers the focused Step 11 extraction regression cases with automated tests.
- Verifies success and fallback behavior for structured-data restaurant pages, directory pages, generic pages, malformed JSON-LD, partial candidates, metadata-based address extraction, low-confidence cuisine, and limited-fetch Google Maps fallback.
- Locks in the validated Step 11 requirement that weak pages should fall back cleanly and that missing data is preferred over incorrect data.

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
- Step 11 never auto-saves extracted results and always routes accepted fields back through the existing manual completion flow.
- The planning documents now define a China-first direction where 高德地图 / Amap is the primary future V1 map, POI, and geocoding provider.
- The planning documents now define the source stance as: 高德 links and share text are official V1 sources; 大众点评, 小红书, and 抖音 are best-effort; 百度地图 is secondary input only; Google Maps is optional overseas support.
- A future extraction step may expand candidate editing and multi-candidate confirmation, but inferred cuisine must remain editable and should stay blank when confidence is low.

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
- `/restaurants/review` is now the Step 11 source review and extraction page
- `/restaurants` is now the real Step 8 saved restaurant list page
- `/restaurants/[id]/edit` is now the real Step 9 saved-record edit page
- `/map` is the placeholder for the future Amap-based map page
- These pages are navigable now, with source intake, extraction review, manual creation, the saved list, and saved-record editing in place while Step 12+ confirmation editing, geocoding, and map integration remain for later steps

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
- Step 11 extraction exists, but there is still no Step 12 extracted-candidate editing screen or Step 13 multi-candidate extraction flow yet.
- There is no map integration yet.
- There is no 高德地图 / Amap integration yet; the China-first provider decision is documented, but map, POI, and geocoding implementation still belongs to later steps.
- There is no geocoding or coordinate input in the user-facing create flow yet.
- There is no multilingual switching yet, only Chinese-first copy with future English support planned.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
- The current extraction path remains intentionally conservative: unsupported or weak pages fall back instead of forcing questionable field values.
