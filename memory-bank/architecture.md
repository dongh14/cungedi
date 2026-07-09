# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 3 only.

It does not include Step 4 or later architecture yet.

## Current Structure

### Root
- `app/`: Next.js App Router application files
- `public/`: static public assets generated with the base app
- `memory-bank/`: product and planning documents
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
- No database schema yet.

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
- There are no restaurant records yet.
- There is no saved restaurant flow.
- There is no extraction logic.
- There is no map integration.
- There is no multilingual switching yet, only Chinese-first copy with future English support planned.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
- No database schema has been created yet.
