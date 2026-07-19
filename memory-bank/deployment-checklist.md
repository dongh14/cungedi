# Vercel V1 Deployment Checklist

## Current Readiness

- The application is a Next.js App Router deployment with server-side Supabase auth guards and owner-scoped queries.
- No production database mutation is part of this checklist. Run only the read-only migration listing during release preparation.
- Preview and production maps use the public PMTiles URL configured in `NEXT_PUBLIC_PMTILES_URL`; local development may continue using the ignored `public/maps/base.pmtiles` fallback.

## Before Deployment

### Vercel Environment Variables

Required public browser variables:

- `NEXT_PUBLIC_SUPABASE_URL`: existing Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: existing Supabase publishable/anon browser key. It is public by design; RLS remains the security boundary.
- `NEXT_PUBLIC_PMTILES_URL`: required for Preview and Production. Use the public HTTPS URL returned by Vercel Blob, such as `https://<store-id>.public.blob.vercel-storage.com/maps/base-v1.pmtiles`.

`next.config.ts` fails a production build with named errors if either required Supabase variable or `NEXT_PUBLIC_PMTILES_URL` is missing. The PMTiles resolver additionally rejects malformed URLs and non-HTTPS production URLs without making a network request.

Optional public variables:

- `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH`: local-development-only same-origin path. Defaults to `/maps/base.pmtiles` when `NEXT_PUBLIC_PMTILES_URL` is empty.
- `NEXT_PUBLIC_APP_URL`: optional explicit application origin for future deployment integrations. It is not required by the current email/password redirect actions.

Server-only variables:

- `DEEPSEEK_API_KEY`: optional. Leave unset to keep AI enrichment unavailable without breaking deterministic extraction and save review.
- `DEEPSEEK_MODEL`: optional; defaults to `deepseek-v4-flash`.
- `DEEPSEEK_DEBUG_LOGS`: optional development diagnostics flag. Keep unset or false in production.
- `DEEPSEEK_DEBUG_RAW_RESPONSE`: optional raw-response diagnostic flag. Keep false; raw model responses are never enabled by default.
- `WORKFLOW_DEBUG_LOGS`: optional development workflow diagnostics flag. Keep unset or false in production.

Never configure API keys, cookies, service-role keys, database passwords, or other credentials under `NEXT_PUBLIC_*`. `.env.example` contains names and safe placeholders only; `.env.local` remains ignored.

### Supabase Auth URL Configuration

After Vercel provides the real production hostname, update the linked Supabase project's Auth URL Configuration:

- Site URL: `https://<vercel-production-domain>/`
- Production redirect URL: `https://<vercel-production-domain>/**` or the exact routes required by the deployed email templates.
- Login redirect: `/login` is the current auth entry route; successful password login redirects to `/dashboard` through the server action.
- Email verification redirect: confirm the project's email template points to the deployed origin and the existing verification flow; do not use localhost.
- Password reset redirect: not implemented in V1, so do not add a dead reset URL.

Also retain local development URLs only where needed for local testing. Use exact production URLs rather than guessing the final Vercel hostname. Supabase redirect URLs must match the URLs used by the auth flow; update the Site URL because it is used for confirmation and reset links. See the [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

### Code And Asset Audit

- `next.config.ts` contains only the current LAN `allowedDevOrigins` entry. It is development-origin configuration and must not be treated as a production CORS policy.
- Map lifecycle diagnostics and workflow diagnostics are gated by `NODE_ENV`; raw DeepSeek response logging also requires the explicit opt-in flag and remains disabled in production.
- `/setup` is now development-only and is not linked from normal auth or app navigation. `/dev-fixtures/*` is already unavailable in production.
- PMTiles uses one resolver for the dashboard map, full map, edit-location map, MapLibre protocol source, and bounded preflight. Local development resolves `/maps/base.pmtiles` against the current origin; preview/production uses the configured public HTTPS URL directly.
- The MapLibre preflight sends `Range: bytes=0-126`, accepts `200`/`206` responses with nonzero bytes, and stops loading on timeout or invalid response. It never downloads the full archive during build or preflight.
- `public/icon.svg` is the manifest and app-shell icon. No service worker is registered by the application, so authenticated Supabase responses are not cached for offline use.
- No service-role key or server-only DeepSeek module is imported by client components. No runtime filesystem writes, long-running worker, or production database mutation is required by the app flow.

### Automated Gate

Run from a clean checkout/environment:

```text
git diff --check
rm -rf .next
npm run lint
npm run build
npm test
npx supabase migration list
git status
```

Review build warnings individually. Do not run `supabase db push`, `supabase db reset`, or `supabase db diff` as part of this preparation checkpoint.

### Public Blob Upload Workflow

Do this once per immutable basemap version; do not upload during every build:

1. Create a **Public** Vercel Blob store in the Vercel Storage tab or with `vercel blob create-store <store-name> --access public`.
2. Upload the local archive to the versioned pathname `maps/base-v1.pmtiles`:

   ```text
   vercel blob put ./public/maps/base.pmtiles --pathname maps/base-v1.pmtiles --access public --content-type application/octet-stream --cache-control-max-age 31536000
   ```

3. Copy the returned public Blob URL.
4. Set `NEXT_PUBLIC_PMTILES_URL=<public-blob-url>` for both Preview and Production in Vercel.
5. Redeploy after saving the environment variable.
6. Verify the public URL with a bounded byte-range request and confirm the response is `200`/`206`, has nonzero bytes, and exposes the cross-origin read needed by the browser:

   ```text
   curl -sS -D - -o /dev/null -H "Origin: https://<vercel-production-domain>" -H "Range: bytes=0-126" "<public-blob-url>"
   ```

7. Test `/dashboard` and `/map`, including markers, clusters, filters, and retry behavior.

The CLI reads `BLOB_READ_WRITE_TOKEN` only from the operator's CLI environment or its explicit `--rw-token` option. Never add that token to `.env.example`, `NEXT_PUBLIC_*`, browser code, or a repository. Public Blob URLs are intentionally browser-visible; no Route Handler or Vercel Function proxies the archive.

Vercel public Blob delivery must allow the deployed app origin to read the public object and its bounded `Range` response. If the byte-range browser test fails because the storage provider does not return the required cross-origin headers, configure the storage provider's narrowly scoped CORS policy for the deployed app origin and `GET`/`Range` access. Do not add broad application-wide CORS or an application proxy.

Treat `maps/base-v1.pmtiles` as immutable. To replace the archive, upload `maps/base-v2.pmtiles`, update `NEXT_PUBLIC_PMTILES_URL`, and redeploy. Do not overwrite a production pathname with incompatible tile data.

## During Deployment

1. Import the repository into Vercel without committing `.env.local` or ignored basemap files.
2. Configure the required Supabase public variables and any intentionally enabled server-only variables for the appropriate Vercel environment.
3. Deploy and capture the actual production URL.
4. Confirm `NEXT_PUBLIC_PMTILES_URL` is present in Preview and Production and points to the intended immutable public Blob pathname.

## After Deployment

- Set the Supabase Site URL and approved redirect URLs to the actual production origin.
- Verify logged-out `/` reaches `/login`; authenticated `/` reaches `/dashboard`; protected routes redirect to `/login` when logged out; `/login` and `/sign-up` redirect to `/dashboard` when already authenticated.
- Verify login, sign-up/email verification, logout, dashboard/map, add/review/save, edit, and collections with an authenticated test account.
- Verify the Blob URL's cross-origin range response, then verify PMTiles markers, clustering, filters, and map recovery on the deployed origin.
- Install the PWA and confirm standalone launch routes through auth without offline caching of private records.
- Confirm production logs do not contain API keys, auth tokens, source content, raw HTML, raw AI responses, full URLs, or complete cache keys.

## Rollback

- Promote the previous Vercel deployment using the platform rollback flow.
- Do not mutate Supabase schema or data during an application rollback unless a separately reviewed migration is explicitly planned.
- Preserve the current migration history; application rollback does not justify `db reset` or ad hoc migration repair.
