# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 4 only.

It does not include Step 5 or later architecture yet.

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
- `app/layout.tsx`: root HTML layout, shared page wrapper, and metadata
- `app/page.tsx`: Step 1 placeholder home page
- `app/sign-up/page.tsx`: Step 3 sign-up page
- `app/login/page.tsx`: Step 3 login page
- `app/dashboard/page.tsx`: Step 3 protected authenticated page
- `app/setup/page.tsx`: Step 2 Supabase setup and health-check page
- `app/auth/actions.ts`: Step 3 server actions for auth flows
- `app/globals.css`: global styles and Tailwind import
- `app/favicon.ico`: site icon

### Supabase Setup Files
- `lib/supabase/env.ts`: reads and validates public Supabase environment variables
- `lib/supabase/client.ts`: creates a minimal Supabase client instance for setup checks
- `lib/supabase/health.ts`: performs the Step 2 Supabase connection status check
- `lib/supabase/server.ts`: creates a cookie-aware server Supabase client for auth flows

### Supabase Database Files
- `supabase/migrations/20260709120000_create_restaurants_table.sql`: Step 4 migration that creates the initial V1 `restaurants` table, indexes, and `updated_at` trigger

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
- Sets page metadata such as the title and description.
- Sets the document language to `zh-CN` to match the current Chinese-first placeholder.

### `app/page.tsx`
- Renders the Step 1 placeholder screen.
- Shows the current product shell only.
- Uses Simplified Chinese as the default visible UI copy.
- Communicates the product direction without implementing features yet.
- Links users to the Supabase setup check page introduced in Step 2.
- Links users to the Step 3 auth entry points and protected page.

### `app/sign-up/page.tsx`
- Renders the Step 3 email/password sign-up screen.
- Submits to a server action rather than handling auth in the browser directly.
- Shows success or error messages through URL query parameters.

### `app/login/page.tsx`
- Renders the Step 3 email/password login screen.
- Submits to a server action for password sign-in.
- Shows auth success and error feedback in a Chinese-first UI.

### `app/dashboard/page.tsx`
- Serves as the current protected page example.
- Confirms that authenticated users can reach protected content.
- Reads the current user identity from Supabase on the server.
- Provides the logout action entry point.

### `app/setup/page.tsx`
- Renders the Step 2 Supabase setup screen.
- Shows whether the required environment variables are present.
- Shows the configured Supabase URL, detected project ref, and connection result.
- Gives manual setup instructions without starting any authentication flow.

### `app/auth/actions.ts`
- Contains the Step 3 server actions for sign up, login, and logout.
- Validates basic form input before calling Supabase Auth.
- Redirects users to the next screen with success or error state encoded in the URL.

### `app/globals.css`
- Imports Tailwind CSS.
- Defines the global color variables and font settings used by the placeholder.
- Applies site-wide base styles.

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

### `proxy.ts`
- Runs on incoming app requests.
- Refreshes and synchronizes auth cookies with Supabase SSR helpers.
- Redirects signed-out users away from protected routes.
- Redirects signed-in users away from guest-only auth screens.

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
- The V1 restaurant schema is intentionally small and centered on one `restaurants` table.
- `source_url` lives directly on the `restaurants` table in V1.
- Coordinates are optional by design so restaurants can still be saved without map placement.
- Access-control policies are intentionally deferred to Step 5.

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

## Documented UI Direction
These are documented product directions, not fully implemented UI work yet:
- mobile-first layouts, closer to a mobile web app or PWA
- strong iPhone usability
- clean, modern, vibrant, card-based screens
- orange accent color near `#FF5B00`, not purple
- Simplified Chinese as the default language
- English as a later secondary option

## Current Limitations
- The app is still mostly a shell plus setup and auth screens.
- The restaurant schema exists, but there is no restaurant create, edit, list, or map UI yet.
- There is no saved restaurant flow.
- There is no extraction logic.
- There is no map integration.
- There is no multilingual switching yet, only Chinese-first copy with future English support planned.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
- Step 5 RLS and security policies have not been added yet.
