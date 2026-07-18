# V1 Real-Place Workflow Validation Report

## Status

This report is the Step 7 collection format and execution record for the 20-case validation plan. The Step 7 run reached the authenticated review page for all 18 concrete URLs in the plan. No place or collection was saved. C03 and E03 remain manual-only because the plan requires short links copied from Google Maps. The automated test runner is standardized and passing.

## Summary

| Metric | Result |
|---|---|
| Cases planned | 20 |
| Cases manually completed | 18/20 reached review; 2 require short links |
| Extraction success rate | 18/18 review pages loaded; field completeness varied |
| AI usefulness rate | Suggestions visible in several cases; one acceptance flow validated |
| Category accuracy | Not fully checked; E01 accepted as 娱乐 and remained editable |
| Cache-hit behavior | Repeat review navigation produced hits for two Google Maps sources |
| Blocked-source rate | 3/18 visibly reported blocked during this pass |
| Average completion time | Not measured reliably; external fetch latency varied |
| Most common missing fields | City, address, phone, category, notes |
| Most common user friction | Slow external fetches, manual completion, occasional invalid AI JSON |
| Critical defects | None confirmed; invalid AI JSON failed safely |
| Step 8 non-blocking UI issues | Significant friction: long review pages and noisy AI failure state |

## Case Results

| ID | Fetch | AI | Cache | Category | Accuracy | Refresh | Collection redirect | Coordinates | Result |
|---|---|---|---|---|---|---|---|---|---|
| F01 | Google Maps: name | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| F02 | Website: name, description | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| F03 | Website: name, description, category | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| F04 | Google Maps: name, exact coordinates | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | exact | partial: review loaded |
| F05 | Website: name, description | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| C01 | Google Maps: name | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| C02 | Website: blocked; no usable fields | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: recovery UI loaded |
| C03 | Manual short link not provided | not run | not_applicable | not checked | not checked | not checked | not checked | not_checked | manual verification required |
| A01 | Website: name, description | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| A02 | Google Maps: name, exact coordinates | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | exact | partial: review loaded |
| A03 | Website: name | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| H01 | Website: blocked; no usable fields | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: recovery UI loaded |
| H02 | Website: name, address, phone, description, category | failed safely | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| H03 | Google Maps: name | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| S01 | Website: blocked; no usable fields | unavailable | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: recovery UI loaded |
| S02 | Google Maps: name, exact coordinates | failed safely | not individually checked | not checked | not checked | not checked | not checked | exact | partial: review loaded |
| S03 | Website: name, description | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| E01 | Website: name, description | suggestions accepted in representative flow | repeat not checked | 娱乐 accepted; Theme Park then manually changed | yes | not checked | not checked | unavailable | partial: refresh preserved manual edit |
| E02 | Google Maps: name | suggestions visible | not individually checked | not checked | not checked | not checked | not checked | unavailable | partial: review loaded |
| E03 | Manual short link not provided | not run | not_applicable | not checked | not checked | not checked | not checked | not_checked | manual verification required |

## Detailed Notes

Use the per-case record in `memory-bank/v1-real-place-test-plan.md`. Store only concise outcomes: extracted field names, suggestion field names, cache state, category/subcategory outcome, timing, and friction. Never store raw AI evidence, full pasted text, credentials, or complete source URLs with sensitive query parameters.

Browser validation observations:

- The authenticated `/restaurants/new`, `/restaurants/review`, and `/restaurants` routes loaded successfully. The post-run saved-place list contained no `V1-STEP7-` validation prefix.
- All 18 concrete URLs reached a review state after retrying six slow navigations. No save button was clicked and no collection was created.
- F04, A02, and S02 displayed exact Google Maps coordinates from explicit URL coordinates. F01, C01, H03, and E02 displayed URL-derived names without guessed coordinates.
- C02, H01, and S01 visibly showed the blocked-website recovery state. The recovery UI remained available for manual completion.
- E01 acceptance validation selected category, subcategory, and summary. The editable form received 娱乐, Theme Park, and the summary; a subsequent manual change to `Digital Art Museum` survived refresh. Tags and place type remained marked `暂不保存`.
- Two repeated Google Maps review navigations returned the AI suggestions state from cache. Development log counters after the run showed safe aggregate events only: `cache_hit=6`, `cache_miss=20`, `provider_call=20`, `provider_success=8`, `provider_failure=12`; these totals are not attributed to individual cases.
- `.env.local` contained the expected Supabase and DeepSeek variable names; values were not printed. The authenticated browser session confirmed Supabase-backed route access. Remote cache-row content and two-account RLS isolation still require a dedicated read-only/manual check.
- A screenshot of the refreshed E01 editable form is at `validation/step7/ai-review-teamlab.png`.

## Step 8 UI Findings

| Area | Severity | Observation | Evidence IDs | Redesign implication |
|---|---|---|---|---|
| Navigation | cosmetic | Core authenticated links were visible and review routes loaded | F01-F05 | No blocker observed; test mobile navigation separately |
| Add flow | significant friction | External fetch latency caused several navigation waits | F02, F04, H01 | Show progress/retry state more clearly |
| Extraction feedback | significant friction | Partial, blocked, and missing-field states were visible; completeness still needs manual interpretation | C02, H01, S01 | Keep found versus needs-review distinction prominent |
| AI review | significant friction | Suggestions worked in the representative acceptance flow; invalid JSON remained a noisy failure state | E01 and aggregate logs | Keep safe failure but improve recovery copy |
| Editable form | pass for representative flow | Accepted fields entered the normal form and a manual edit survived refresh | E01 | Extend refresh testing to other field combinations |
| Collection assignment | not checked | No collection was created or changed during the no-save run | none | Requires a dedicated temporary collection test |
| Details page | not checked | No place was saved, so details navigation was not exercised | none | Requires an explicitly approved temporary record |
| Map | not checked | No place was saved or changed | none | Existing focused map tests remain passing |
| Empty states | not checked | Not exercised in this run | none | Validate with a dedicated empty account |
| Mobile keyboard/layout | not checked | Screenshot was captured, but keyboard behavior was not tested | E01 screenshot | Run on an iPhone-sized viewport |
| Terminology | cosmetic | Personal-only copy was visible; some legacy extraction copy remains verbose | F01, E01 | Simplify after Step 8 redesign |
| Visual hierarchy | significant friction | Long review page mixes source, preview, form, collections, and AI sections | E01 screenshot | Consider progressive sections in Step 8 |

## Defects And Safety Checks

- Unconfirmed place writes: none during browser validation; no save action was clicked.
- Unauthorized data exposure: no route or RLS regression found by focused contract tests; manual two-account verification TBD.
- AI privacy: workflow diagnostics omit evidence, response bodies, user IDs, and full URLs; manual cache-row verification TBD.
- Private save boundary: insert and update payload builders force `private`.
- Manual-only checks remaining: provide real Google Maps short links for C03/E03, test collection-redirect persistence without saving a place, verify two-account RLS isolation, inspect cache-row contents read-only, and complete mobile keyboard/layout review.

## Automated Test-Runner Resolution

The previous direct Node sweep failed before assertions in two files because plain Node could not resolve extensionless TypeScript imports or the Next `@/` alias. `scripts/test-loader.mjs` now uses the existing TypeScript dependency for transpilation and resolves both patterns; `scripts/register-test-loader.mjs` registers it through Node's modern `--import` API.

The standardized command is `npm test`. Both previously failing files now execute their assertions and the full suite passes `285/285`. No assertions were weakened or deleted.
