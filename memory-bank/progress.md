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
- `/restaurants` now provides the full saved restaurant list experience for the current user's records.
- Signed-in users can now edit `cuisine`, `note`, and `privacy` for their own saved restaurant records.
- The map page remains a protected placeholder.
- No edit, delete, geocoding, extraction review, or map rendering logic has been added yet.
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
- The newly-created restaurant is still visually highlighted after save.
- Missing optional fields are handled cleanly without breaking the card layout.
- The saved-list page remains mobile-first and usable on larger desktop widths.

## Step 9 Validation
Validated checks completed:
- `npm run build`
- `npm run lint`
- Manual validation of editing `cuisine`, `note`, and `privacy`
- Manual validation that changes persist in Supabase
- Manual validation that clearing optional `cuisine` or `note` works
- Manual validation that owner-only RLS prevents cross-user edit access
- Manual validation of successful-update redirect back to `/restaurants`
- Manual validation that the list shows updated values after redirect
- Manual validation that `餐厅信息已更新` appears after redirect
- Manual validation that validation and update errors remain on the edit page

Validation outcome:
- A signed-in user can open a saved restaurant record and update `cuisine`, `note`, and `privacy`.
- Updated values persist correctly in Supabase and appear on the saved restaurant list.
- Optional `cuisine` and `note` fields can be cleared back to blank successfully.
- Owner-only RLS continues to block cross-user edit access.
- Successful updates now redirect back to `/restaurants` and show the short success message `餐厅信息已更新`.
- Validation and update errors still stay on the edit page so the user can correct and resubmit.

## Docs-Only Product Direction Update
Documented but not yet implemented in UI:
- mobile-first product direction
- vibrant orange accent near `#FF5B00`
- Simplified Chinese as the default language
- English as a later secondary language option
- future extraction should attempt to infer cuisine when possible, keep it editable, and leave it blank when confidence is low

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
- A future extraction step should try to infer cuisine from source content, but it must remain editable and should stay blank when confidence is low.
