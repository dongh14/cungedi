# Current Architecture

## Scope
This document describes the repository as it exists after validated Step 1 only.

It does not include Step 2 or later architecture yet.

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
- `README.md`: current project overview and available scripts

### App Router Files
- `app/layout.tsx`: root HTML layout, shared page wrapper, and metadata
- `app/page.tsx`: Step 1 placeholder home page
- `app/globals.css`: global styles and Tailwind import
- `app/favicon.ico`: site icon

### Public Assets
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

These are starter static assets from the base app scaffold. They are not product-specific yet.

## What The Step 1 Files Do

### `package.json`
- Defines the project name and npm scripts.
- `dev` starts the local Next.js development server.
- `build` creates a production build with Webpack.
- `start` runs the production server.
- `lint` runs TypeScript static checks with `tsc --noEmit`.

### `app/layout.tsx`
- Defines the root document shell for the app.
- Sets page metadata such as the title and description.
- Sets the document language to `zh-CN` to match the current Chinese-first placeholder.

### `app/page.tsx`
- Renders the Step 1 placeholder screen.
- Shows the current product shell only.
- Uses Simplified Chinese as the default visible UI copy.
- Communicates the product direction without implementing features yet.

### `app/globals.css`
- Imports Tailwind CSS.
- Defines the global color variables and font settings used by the placeholder.
- Applies site-wide base styles.

### `next.config.ts`
- Holds the current Next.js project configuration.
- This is minimal in Step 1.

### `tsconfig.json`
- Configures TypeScript for the Next.js app.
- Supports the current app-router setup and static type checking.

### `postcss.config.mjs`
- Connects PostCSS processing for Tailwind CSS.

### `README.md`
- Documents the current Step 1 scope and the available project scripts.

## Current Architectural Decisions
- One app and one codebase.
- Next.js App Router for both UI structure and future server logic.
- TypeScript as the default language.
- Tailwind CSS for styling.
- No backend service integration yet.
- No Supabase setup yet.
- No authentication architecture yet.
- No database schema yet.

## Current Limitations
- The app is only a shell and placeholder screen.
- There is no login flow.
- There is no saved restaurant flow.
- There is no extraction logic.
- There is no map integration.
- There is no multilingual switching yet, only Chinese-first placeholder copy.
