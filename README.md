# Restaurant Information Collector

Step 1 sets up the base Next.js app for the V1 product described in `memory-bank/`.

## Available Scripts

- `npm run dev`: start the local development server
- `npm run build`: create a production build
- `npm run start`: run the production build locally
- `npm run lint`: run TypeScript static checks

## Local PMTiles Basemap Setup

- Place your self-hosted PMTiles basemap file at `public/maps/base.pmtiles`.
- If you want a different same-origin public path, set `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH` in `.env.local`, for example `/maps/your-basemap.pmtiles`.
- Preview and production require `NEXT_PUBLIC_PMTILES_URL` pointing to a public HTTPS PMTiles archive, such as a versioned Vercel Blob URL.
- Do not commit large production PMTiles archives to the repository by default.
- If the file is missing or the path is invalid, `/map` will stay on the local fallback background and show a Simplified Chinese setup message instead of crashing.

## Current Scope

This repository currently includes:

- a single Next.js App Router app
- TypeScript configuration
- Tailwind CSS setup
- a simple Step 1 placeholder home page
- a Step 2 Supabase setup check page at `/setup`
- Step 3 email/password auth pages at `/sign-up`, `/login`, and `/dashboard`

Supabase setup, authentication, and restaurant features begin in later implementation steps.
