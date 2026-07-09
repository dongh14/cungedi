# V1 Implementation Plan

## Plan Goal
Build only the V1 web app described in the PRD:
- email and password login
- save restaurants from a pasted URL
- confirm and edit extracted restaurant details before saving
- support multiple restaurant candidates from one source
- save restaurants even without map coordinates
- browse saved restaurants in a list and on a simple map

This plan is intentionally small and does not include V2 or V3 ideas.

Product direction note:
- The main V1 audience is Chinese users.
- The default V1 UI language should be Simplified Chinese.
- English should be available later as a secondary language option.
- Restaurant fields must support Chinese text input.
- Cuisine choices should include Chinese-friendly categories.
- The main discovery sources and examples are 小红书, 抖音, Google Maps, and ordinary public web pages.
- Keep extraction realistic for 小红书 and 抖音 and best-effort only in V1.
- The product should be mobile-first, closer to a mobile web app or PWA than a desktop-first tool.
- Future UI should prioritize iPhone usability.
- The visual direction should be clean, modern, vibrant, and card-based.
- The main accent color should be vibrant orange close to `#FF5B00`, not purple.
- Use the attached meal planner reference only as design direction for rounded cards, clear spacing, and strong mobile presentation.

## Working Rules
- Keep one app and one codebase
- Prefer the simplest solution that satisfies the PRD
- Do not add advanced AI extraction in V1
- Do not add social login in V1
- Do not add public discovery features in V1 unless needed for basic privacy settings
- Do not build custom scraping infrastructure for 小红书 or 抖音 in V1
- Do not build full translation infrastructure unless the current step specifically requires it
- Finish and test one small step before starting the next

## Step 1: Project setup
Goal:
- Create the base Next.js app with TypeScript and Tailwind CSS
- Connect the project to version control if not already connected
- Add a simple home page placeholder

Why this step matters:
- It creates the minimal working shell for the product

Done when:
- The app starts locally
- The home page loads without errors

Test you can run:
- Start the local app
- Open the home page in the browser
- Confirm the page loads and shows a basic placeholder screen

## Step 2: Supabase project setup
Goal:
- Create the Supabase project
- Add project environment variables to the app
- Confirm the app can talk to Supabase

Why this step matters:
- Auth and data storage depend on this foundation

Done when:
- The app can connect to the Supabase project successfully

Test you can run:
- Start the app with environment variables set
- Open a simple health-check or setup screen
- Confirm it reports that Supabase connection is working

## Step 3: Authentication
Goal:
- Add email and password sign-up
- Add email and password login
- Add logout
- Protect app pages so saved restaurants are user-specific

Why this step matters:
- V1 needs personal accounts and private collections

Done when:
- A new user can create an account
- A returning user can log in and log out
- Signed-out users cannot access saved restaurant pages

Test you can run:
- Create a test account
- Log out
- Log back in with the same account
- Try opening a protected page while signed out and confirm access is blocked

## Step 4: Database schema for V1 restaurants
Goal:
- Create the minimal restaurant data model
- Include required fields from the PRD
- Support optional map coordinates
- Add privacy field
- Use `source_url` directly on the `restaurants` table
- Do not create a separate `restaurant_sources` table in V1

Why this step matters:
- The app needs a stable structure for restaurant records before UI work continues

Required fields for V1 save:
- name
- city
- source_url
- privacy

Optional fields for V1 save:
- address
- cuisine
- note
- latitude
- longitude

Done when:
- The database can store a restaurant with required fields
- The database also accepts a restaurant without latitude and longitude

Test you can run:
- Insert one complete test restaurant
- Insert one test restaurant without map coordinates
- Confirm both records are saved correctly

## Step 5: Data security rules
Goal:
- Add access rules so users can only manage their own restaurant records by default
- Keep private records private
- Store `public` and `private` as a per-record flag only
- Do not allow users to browse other users' restaurants in V1

Why this step matters:
- V1 must avoid exposing one user’s saved places to another user

Done when:
- User A cannot read or edit User B’s private restaurants

Test you can run:
- Create two test accounts
- Save a restaurant under Account A
- Log into Account B and confirm Account A’s private restaurant does not appear

## Step 6: Basic app layout and navigation
Goal:
- Add the main pages for V1
- Suggested pages: home, login, sign up, add restaurant, saved list, map
- Add simple navigation between them
- Default the visible UI copy to Simplified Chinese
- Keep layouts mobile-first and comfortable on iPhone screens
- Start shaping the visual system toward rounded cards, clean spacing, and vibrant orange accents

Why this step matters:
- Users need a clear, stable path through the product before feature detail work

Done when:
- A signed-in user can move between the main V1 pages without dead ends

Test you can run:
- Sign in
- Visit each main page from the navigation
- Confirm every page loads and the navigation flow feels complete
- Confirm the main layouts feel natural on an iPhone-sized viewport

## Step 7: Manual restaurant creation
Goal:
- Allow a signed-in user to create a restaurant entry manually
- Include name, city, address, cuisine, source URL, note, and privacy
- Ensure all fields accept Chinese text input
- Include cuisine choices that feel natural for Chinese users
- Avoid hardcoding copy in a way that would make future English support unnecessarily difficult

Why this step matters:
- This is the fallback flow that keeps the product usable even before extraction is polished

Done when:
- A user can save a restaurant without using extraction

Test you can run:
- Sign in
- Create a restaurant by filling out the form manually
- Confirm it appears in the saved list

## Step 8: Saved restaurant list
Goal:
- Show the signed-in user’s restaurants in a clean list
- Show core fields clearly
- Make it easy to confirm records were saved

Why this step matters:
- The list view is the simplest way for users to review their saved places

Done when:
- A user can open the list and see their saved restaurants

Test you can run:
- Save two or three restaurants
- Open the saved list page
- Confirm the records appear with the expected details

## Step 9: Edit existing restaurant records
Goal:
- Allow a user to edit a previously saved restaurant
- Allow updates to note and privacy

Why this step matters:
- The PRD depends on users being able to correct incomplete or imperfect information

Done when:
- A user can open a saved record, edit it, and save changes successfully

Test you can run:
- Open a saved restaurant
- Change the cuisine or note
- Save the record
- Refresh the page and confirm the updated values persist

## Step 10: URL intake form
Goal:
- Add a page or form where a user pastes a source URL
- Validate that the input looks like a URL
- Start the extraction flow from there

V1 source policy:
- Officially support ordinary public web pages and Google Maps
- Accept 小红书 and 抖音 on a best-effort basis
- Do not promise reliable extraction for 小红书 or 抖音 in V1
- TikTok and Instagram are not part of the main V1 promise
- Use 小红书, 抖音, Google Maps, and public web pages in source examples and placeholder text

Why this step matters:
- URL-based save flow is the main product behavior in V1

Done when:
- The app accepts a valid URL and moves into an extraction review flow

Test you can run:
- Paste a valid URL and confirm the app accepts it
- Paste invalid text and confirm the app shows a clear validation error

## Step 11: Simple extraction service
Goal:
- Fetch public page metadata and visible text from a pasted URL
- Return draft restaurant candidates
- Keep the logic simple and best-effort only

Why this step matters:
- It provides the V1 convenience feature without overbuilding scraping or AI systems

Implementation rule:
- Use simple server-side URL fetch plus metadata and visible text parsing
- Do not add browser automation, login-required access, or source-specific scraping systems
- Expect stronger results from ordinary public web pages and Google Maps than from 小红书 or 抖音

Done when:
- A pasted URL returns at least one draft candidate for a straightforward page
- Extraction failures or weak results can fall back to manual entry with `source_url` prefilled

Test you can run:
- Paste a simple public restaurant-related URL
- Confirm the app returns at least one draft restaurant candidate
- Confirm extraction failure shows a graceful fallback instead of crashing
- Paste a 小红书 or 抖音 URL and confirm the app handles weak extraction gracefully without blocking manual save

## Step 12: Confirmation and edit step after extraction
Goal:
- Show extracted restaurant candidates in editable form
- Let the user review before saving
- Never auto-save

Why this step matters:
- This is a core product rule from the PRD

Done when:
- A user can edit extracted values before saving any restaurant

Test you can run:
- Paste a URL that returns a candidate
- Change one extracted field
- Save it
- Confirm the saved record uses the edited value, not the original extracted value

## Step 13: Multiple restaurant candidate flow
Goal:
- Support one source URL returning multiple restaurant candidates
- Let the user select one, several, or all of them

Why this step matters:
- This supports list-style sources without requiring separate flows

Done when:
- The user can save multiple restaurants from one source submission

Test you can run:
- Use a test case that returns multiple candidates
- Select two candidates
- Save both
- Confirm both appear in the saved list

## Step 14: Simple bulk editing in confirmation flow
Goal:
- Allow the user to quickly review and edit several extracted candidates in one pass
- Keep the interaction simple

V1 interaction rule:
- Show all extracted candidates as editable cards or rows on one review screen
- Let the user select which candidates to save
- Do not add advanced apply-to-all bulk editing

Why this step matters:
- The PRD calls for editing multiple restaurants from one source

Done when:
- A user can update multiple candidate rows before saving

Test you can run:
- Use a multi-candidate source
- Edit fields on at least two candidates
- Save them
- Confirm both saved records contain the edited values

## Step 15: Geocoding for saved restaurants
Goal:
- Convert address or city information into coordinates when possible
- Keep coordinates optional

Why this step matters:
- The map needs location data, but the PRD also requires saving without coordinates

Implementation rule:
- Save the restaurant first
- Attempt geocoding immediately after save
- If geocoding fails, keep the restaurant without coordinates

Done when:
- Restaurants with enough location data get coordinates
- Restaurants without enough location data still save successfully

Test you can run:
- Save one restaurant with a usable address or city and confirm coordinates are added
- Save one restaurant with incomplete location info and confirm it still saves

## Step 16: Map view
Goal:
- Show saved restaurants on a simple world map
- Support basic zoom in and out
- Let the user inspect restaurants by city

V1 map rule:
- Show restaurant pins for records with coordinates
- Provide a simple city filter or city list
- Do not build advanced clustering

Why this step matters:
- The map is one of the main user-facing reasons this app exists

Done when:
- A user can open the map and see saved restaurants with coordinates

Test you can run:
- Save several restaurants in at least two cities
- Open the map
- Confirm pins appear
- Zoom and confirm the map remains usable

## Step 17: Basic polish for incomplete location cases
Goal:
- Make sure restaurants without map coordinates still appear clearly in the list
- Show a simple status or fallback behavior instead of treating them like broken records

Why this step matters:
- This is an explicit V1 requirement and will happen often in real usage

Done when:
- Coordinate-free restaurants remain usable and understandable in the app

Test you can run:
- Save a restaurant without coordinates
- Confirm it still appears in the list
- Confirm the app does not show a broken map state for that record

## Step 18: V1 acceptance pass
Goal:
- Verify the full V1 flow from signup to save to browse
- Check the app against the PRD success criteria

Why this step matters:
- This is the moment to confirm the product is truly V1 complete instead of feature-complete only in pieces

Done when:
- The full V1 user journey works end to end

Test you can run:
1. Sign up with a new account
2. Paste a source URL
3. Review and edit extracted candidate data
4. Save one or more restaurants
5. Add a note and set privacy
6. Open the saved list and confirm the records appear
7. Open the map and confirm mappable records show there
8. Confirm a non-mappable record still appears in the list

## Out Of Scope For This Plan
- AI-generated restaurant descriptions
- Google login or WeChat login
- Desktop app
- Advanced public sharing and discovery
- Perfect extraction across all social platforms
- Neighborhood-level map experience
- Advanced analytics, recommendations, or ranking

## Suggested Build Order Summary
1. Project setup
2. Supabase setup
3. Authentication
4. Database schema
5. Security rules
6. App layout
7. Manual create
8. Saved list
9. Edit records
10. URL intake
11. Basic extraction
12. Confirmation flow
13. Multiple candidates
14. Bulk editing
15. Geocoding
16. Map view
17. Incomplete location polish
18. V1 acceptance pass
