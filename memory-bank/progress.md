# Progress

## Current Status
Step 1 is complete and has been validated.

Step 2 is complete and has been validated.

Step 3 is complete and has been validated.

Step 4 is complete and has been validated.

Step 5 is complete and has been validated.

Step 6 is complete and has been validated.

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
- Protected placeholder pages now exist for add, list, and map flows.
- No restaurant creation logic or real restaurant CRUD UI has been added yet.
- `privacy` remains a stored flag only and does not create cross-user visibility in V1.

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

## Docs-Only Product Direction Update
Documented but not yet implemented in UI:
- mobile-first product direction
- vibrant orange accent near `#FF5B00`
- Simplified Chinese as the default language
- English as a later secondary language option

## Notes
- The current `npm run lint` command uses TypeScript static checks.
- The current build script uses `next build --webpack` for reliable local verification in this environment.
- The current UI direction is now partially implemented through the Step 6 page shell and navigation.
- The current Supabase setup now includes authentication and protected route handling.
- The initial restaurant schema is now in place in Supabase.
- Owner-only RLS policies are now in place for `public.restaurants`.
- Step 7 restaurant creation logic still remains for later.
