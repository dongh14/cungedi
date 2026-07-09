# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 6 only.

It does not include Step 7 or later architecture yet.

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
- `app/restaurants/new/page.tsx`: Step 6 protected add-restaurant placeholder page
- `app/restaurants/page.tsx`: Step 6 protected saved-list placeholder page
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
 - Provides the logout action entry point through the shared app shell.

### `app/setup/page.tsx`
 - Renders the Supabase setup screen inside the shared public shell.
 - Shows whether the required environment variables are present.
 - Shows the configured Supabase URL, detected project ref, and connection result.
 - Gives manual setup instructions without starting any authentication flow.

### `app/restaurants/new/page.tsx`
- Provides the protected placeholder page for the future manual-create flow.
- Establishes where Step 7 will attach the real form.
- Keeps the page navigable without adding restaurant creation logic yet.

### `app/restaurants/page.tsx`
- Provides the protected placeholder page for the future saved-list flow.
- Establishes the list page location in the signed-in navigation.
- Shows an intentional empty-state structure rather than real data.

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
- Exposes a helper for determining the active route.

### `components/placeholder-card.tsx`
- Provides a reusable content card used throughout the Step 6 placeholder pages.
- Keeps future page placeholders visually consistent while functionality is still pending.

### `components/public-shell.tsx`
- Provides the shared public-page shell used by home, login, sign-up, and setup.
- Combines brand presentation, hero copy, and a secondary aside area in one reusable layout.

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
- Protects the Step 6 signed-in routes for dashboard, add placeholder, list placeholder, and map placeholder.

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
- The V1 restaurant schema is intentionally small and centered on one `restaurants` table.
- `source_url` lives directly on the `restaurants` table in V1.
- Coordinates are optional by design so restaurants can still be saved without map placement.
- V1 access control is enforced with owner-only RLS policies on `public.restaurants`.
- The `privacy` field is stored for later product behavior but does not create cross-user visibility in V1.
- The app now has separate public and signed-in layout patterns built from reusable components.
- Step 6 keeps the app mobile-first and iPhone-friendly without introducing unnecessary translation infrastructure.
- Step 6 establishes the add, list, and map routes as placeholders only, so later steps can attach feature logic without reworking navigation.

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
- `/restaurants/new` is the placeholder for the future manual-create page
- `/restaurants` is the placeholder for the future saved-list page
- `/map` is the placeholder for the future map page
- These pages are navigable now but intentionally do not contain restaurant creation or CRUD logic

### Visual Direction Now In Use
- mobile-first layouts, closer to a mobile web app than a desktop-first site
- strong iPhone usability and tap-friendly spacing
- clean, modern, vibrant, card-based screens
- orange accent color near `#FF5B00`
- Simplified Chinese as the default visible language
- English remains a later secondary option

## Current Limitations
- The app is still mostly a shell plus setup and auth screens.
- The restaurant schema exists, but the Step 6 pages for add, list, and map are still placeholders only.
- There is no restaurant creation logic yet.
- There is no saved restaurant data rendering yet.
- There is no extraction logic.
- There is no map integration.
- There is no multilingual switching yet, only Chinese-first copy with future English support planned.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
- Step 7 restaurant creation work has not been added yet.
