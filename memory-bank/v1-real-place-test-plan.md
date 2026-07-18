# V1 Real-Place Workflow Test Plan

## Purpose

Step 7 validates the current structured place-import workflow before the Step 8 final UI redesign. It is a validation and instrumentation phase, not a redesign phase. The product remains personal-only: every saved record is private and owner-scoped, no public or social behavior is tested, and no place is saved during the default run.

## Test Set

Use a fresh authenticated development/test account. Replace `MANUAL_SHORT_LINK_REQUIRED` with a short link copied from the relevant Google Maps share action immediately before running that case. Do not paste credentials, private URLs, or personal data into the report.

| ID | Place | Type | Source and URL | Language | Evidence profile |
|---|---|---|---|---|---|
| F01 | Din Tai Fung Taipei 101 | Food | Google Maps long: `https://www.google.com/maps/search/?api=1&query=Din+Tai+Fung+Taipei+101` | Chinese/English | URL name, weak address |
| F02 | Tsukiji Outer Market | Food | Official website: `https://www.tsukiji.or.jp/english/` | English | Website metadata, possible blocked/weak fetch |
| F03 | Ippudo | Food | Official website: `https://www.ippudous.com/` | English/Japanese | Website metadata, weak location |
| F04 | Narisawa | Food | Google Maps place URL: `https://www.google.com/maps/place/Narisawa/@35.6718,139.7288,17z` | English/Japanese | Name and explicit coordinates |
| F05 | Luke's Lobster Shibuya | Food | Official website: `https://lukeslobster.com/` | English | Strong metadata, no guessed branch address |
| C01 | Blue Bottle Coffee Shinjuku | Cafe | Google Maps long: `https://www.google.com/maps/search/?api=1&query=Blue+Bottle+Coffee+Shinjuku` | English | URL name, optional coordinates |
| C02 | % Arabica Kyoto | Cafe | Official website: `https://arabica.coffee/` | English/Japanese | Strong metadata, multiple-location ambiguity |
| C03 | Bar Benfiddich | Bar | Manual short link: `MANUAL_SHORT_LINK_REQUIRED` | English/Japanese | Short-link resolution and manual review |
| A01 | teamLab Borderless | Attraction | Official website: `https://www.teamlab.art/e/borderless-azabudai/` | English/Japanese | Strong metadata, understanding category |
| A02 | Tokyo Skytree | Attraction | Google Maps place URL: `https://www.google.com/maps/place/Tokyo+Skytree/@35.7101,139.8107,17z` | English/Japanese | Name and explicit coordinates |
| A03 | Shanghai Museum | Attraction | Official website: `https://www.shanghaimuseum.net/museum/frontend/` | Chinese/English | Chinese metadata, possible weak fetch |
| H01 | Park Hyatt Tokyo | Hotel | Official website: `https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo/tyoph` | English/Japanese | Strong metadata, city needs review |
| H02 | Hoshinoya Tokyo | Hotel | Official website: `https://hoshinoresorts.com/en/hotels/hoshinoyatokyo/` | English/Japanese | Strong metadata, address may be absent |
| H03 | Mandarin Oriental Shanghai | Hotel | Google Maps long: `https://www.google.com/maps/search/?api=1&query=Mandarin+Oriental+Shanghai` | Chinese/English | URL name, manual address review |
| S01 | MUJI Ginza | Shop | Official website: `https://www.muji.com/jp/shop/detail/046604` | Japanese/English | Structured/local-business metadata |
| S02 | Mitsukoshi Ginza | Shop | Google Maps place URL: `https://www.google.com/maps/place/Ginza+Mitsukoshi/@35.6717,139.7650,17z` | Japanese/English | Name and explicit coordinates |
| S03 | Daikanyama T-SITE | Shop | Official website: `https://store.tsite.jp/daikanyama/` | Japanese/English | Weak metadata, manual category review |
| E01 | Tokyo DisneySea | Entertainment | Official website: `https://www.tokyodisneyresort.jp/en/tds/` | English/Japanese | Strong metadata, attraction/entertainment conflict |
| E02 | TOHO Cinemas Shinjuku | Entertainment | Google Maps long: `https://www.google.com/maps/search/?api=1&query=TOHO+Cinemas+Shinjuku` | Japanese/English | URL name, category review |
| E03 | Karaoke Kan Shibuya | Entertainment | Manual short link: `MANUAL_SHORT_LINK_REQUIRED` | Japanese/English | Short-link resolution, weak metadata |

## Per-Case Record

Copy this block once per test ID into the validation report. Do not include raw pasted evidence, complete AI responses, credentials, or private source URLs.

```text
Test ID:
Place type:
Source type:
Source hostname:
Source language:
Fetch result: success | timeout | blocked | invalid_response | not_applicable
Deterministic fields extracted:
AI called: yes | no
AI cache: hit | miss | bypass | not_applicable
AI suggestions summary:
Category result:
Subcategory result:
Factual accuracy: accurate | mixed | inaccurate | not_checked
Hallucination observed: yes | no | not_checked
Acceptance worked: yes | no | not_applicable
Editable form updated: yes | no | not_checked
Refresh persistence worked: yes | no | not_checked
Collection redirect persistence worked: yes | no | not_checked
Coordinates available: exact | approximate | unavailable
Total time:
User friction notes:
Final result: pass | partial | fail
Detailed notes:
```

## Pass Criteria

A case is `pass` when the source is recognized, the review page opens without losing the URL, the name is available or easy to edit, the category is correct or correctable, accepted AI suggestions enter the editable form, manual edits remain authoritative, refresh preserves the draft, no unconfirmed Supabase write occurs, the eventual save payload is private, and there is no blocking error.

A `partial` result is allowed when extraction is incomplete but the user can finish manually without losing state. A `fail` means the flow crashes, loses the draft, prevents correction, exposes unauthorized data, writes before confirmation, or cannot reach a valid review state.

## Manual Execution

1. Start the local app with `npm run dev` and use a dedicated authenticated development account.
2. Open `/restaurants/new` and run F01 through F05, then C01 through E03.
3. For each case, use the listed source input and record only hostnames and concise field summaries.
4. If a site is blocked or times out, use the visible-text recovery flow. Do not paste raw evidence into the report.
5. If AI is eligible, record only whether it was called, cache state, accepted field names, and a short outcome summary.
6. Accept one useful suggestion, manually edit one accepted value, refresh, and verify the editable form still contains the manual value.
7. Create a temporary personal collection only when testing collection redirect persistence. Do not save the place during the default validation run.
8. If a place must be saved to validate details, map, or collection behavior, prefix the name with `V1-STEP7-`, verify it is private, and delete it immediately after the case.
9. After the run, verify Supabase for accidental restaurant rows and confirm AI cache rows contain no raw evidence or HTML.
10. Keep the report free of credentials, private data, raw evidence, full AI responses, and full query-bearing URLs.

## Step 8 Findings Categories

Record observations without fixing them in Step 7 under: navigation, add flow, extraction feedback, AI review, editable form, collection assignment, details page, map, empty states, mobile keyboard/layout, terminology, and visual hierarchy. Classify each as `blocker`, `significant friction`, or `cosmetic`.

