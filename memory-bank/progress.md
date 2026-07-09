# Progress

## Current Status
Step 1 is complete and has been validated.

Step 2 is complete and has been validated.

Step 3 is complete and has been validated.

Step 4 is complete and has been validated.

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

## Current App State
- The project is one Next.js codebase.
- The home page is still a lightweight placeholder shell.
- A Supabase setup check page now exists at `/setup`.
- Public Supabase environment-variable support has been added.
- A basic Supabase connection check has been added.
- Email/password authentication has been added.
- Protected page routing is in place for `/dashboard`.
- The initial Supabase restaurant data model has been added through a migration.
- No restaurant create, edit, list, or map UI has been added yet.
- Step 5 security policies have not been started yet.

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

## Docs-Only Product Direction Update
Documented but not yet implemented in UI:
- mobile-first product direction
- vibrant orange accent near `#FF5B00`
- Simplified Chinese as the default language
- English as a later secondary language option

## Notes
- The current `npm run lint` command uses TypeScript static checks.
- The current build script uses `next build --webpack` for reliable local verification in this environment.
- The current UI direction is documented as mobile-first, card-based, and iPhone-friendly, but not fully implemented yet.
- The current Supabase setup now includes authentication and protected route handling.
- The initial restaurant schema is now in place in Supabase.
- RLS and per-user database access policies still remain for Step 5.
