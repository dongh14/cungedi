# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 2 only.

It does not include Step 3 or later architecture yet.

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
- `app/setup/page.tsx`: Step 2 Supabase setup and health-check page
- `app/globals.css`: global styles and Tailwind import
- `app/favicon.ico`: site icon

### Supabase Setup Files
- `lib/supabase/env.ts`: reads and validates public Supabase environment variables
- `lib/supabase/client.ts`: creates a minimal Supabase client instance for setup checks
- `lib/supabase/health.ts`: performs the Step 2 Supabase connection status check

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

### `app/setup/page.tsx`
- Renders the Step 2 Supabase setup screen.
- Shows whether the required environment variables are present.
- Shows the configured Supabase URL, detected project ref, and connection result.
- Gives manual setup instructions without starting any authentication flow.

### `app/globals.css`
- Imports Tailwind CSS.
- Defines the global color variables and font settings used by the placeholder.
- Applies site-wide base styles.

### `lib/supabase/env.ts`
- Reads the public Supabase environment variables from the runtime.
- Returns `null` when the app is not configured yet.
- Extracts the Supabase project ref from the configured URL for display in the setup screen.

### `lib/supabase/client.ts`
- Creates a minimal Supabase client using the current public environment values.
- Disables session persistence and token refresh because Step 2 is only about connection setup, not auth behavior.

### `lib/supabase/health.ts`
- Performs the current Step 2 connection test.
- Calls the Supabase Auth settings endpoint using the configured public key.
- Returns a structured status object for the `/setup` page to render.
- Separates setup-state checking from UI code.

### `next.config.ts`
- Holds the current Next.js project configuration.
- This is minimal in Step 1.

### `tsconfig.json`
- Configures TypeScript for the Next.js app.
- Supports the current app-router setup and static type checking.

### `postcss.config.mjs`
- Connects PostCSS processing for Tailwind CSS.

### `README.md`
- Documents the current Step 1 and Step 2 scope and the available project scripts.

## Current Architectural Decisions
- One app and one codebase.
- Next.js App Router for both UI structure and future server logic.
- TypeScript as the default language.
- Tailwind CSS for styling.
- Supabase is the selected backend platform for V1.
- Public Supabase project configuration is handled through environment variables.
- Step 2 uses a lightweight server-side connection check before any auth flow is added.
- No authentication architecture yet.
- No database schema yet.

## Current Limitations
- The app is still mostly a shell plus setup screens.
- There is no login flow.
- There is no sign-up flow.
- There is no session management flow.
- There is no saved restaurant flow.
- There is no extraction logic.
- There is no map integration.
- There is no multilingual switching yet, only Chinese-first placeholder and setup copy.
- Supabase setup depends on the user manually creating a Supabase project and filling `.env.local`.
