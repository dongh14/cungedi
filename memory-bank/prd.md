# Product Requirements Document

## Product Name
Restaurant Information Collector

## Product Vision
Help travelers save restaurants they discover online so they can easily find and revisit them later when they travel.

The product starts as a simple web app where users paste links from social media or the web, review extracted restaurant details, save the places they care about, and browse them later in a personal list and on a world map.

The app is Chinese-user-first and should support Chinese UI options from the beginning.
The product should feel closer to a mobile web app or PWA than a desktop-first web tool.

## Primary User
A Chinese user who enjoys traveling and frequently discovers restaurants through social media and web content, especially Xiaohongshu (RedNote), Douyin, Google Maps, and ordinary public web pages.

## Core User Problem
Users often see restaurants they want to visit in the future, but those discoveries are scattered across social platforms, hard to organize, and easy to forget by the time they actually travel.

## V1 Goal
Let a user sign up, paste a source URL, review and edit extracted restaurant information, save one or more restaurants to their account, and browse saved restaurants in a list and on a map.

## Success Criteria For V1
- A user can create an account and sign in with email and password.
- A user can paste a URL from a supported public source and start a save flow.
- The app extracts restaurant candidates from the URL and asks the user to confirm or edit them before saving.
- A user can save restaurants even if exact map coordinates are not found.
- A user can browse saved restaurants in a personal list and on a simple map.
- A user can explore saved places by zooming the map and viewing restaurants by city.

## Non-Goals For V1
- No fully automated, high-accuracy extraction across every platform.
- No rich AI-generated restaurant summaries.
- No spreadsheet export requirement.
- No desktop app.
- No advanced social features, ranking systems, or community feeds.
- No fine-grained neighborhood map experience beyond a simple useful map.

## Key Use Cases

### 1. Save a restaurant from a social post
A user pastes a 小红书, 抖音, Google Maps, or public web page link. The app extracts possible restaurant entries and shows them in an editable confirmation step before save.

### 2. Save multiple restaurants from one source
If a source references multiple restaurants, such as a 抖音 or 小红书 post listing five places, the app shows multiple restaurant candidates. The user can select one, several, or all of them and edit them together before saving.

### 3. Keep a future travel list
A user returns later and browses their saved places by list or map so they can remember where they wanted to go.

### 4. Add personal context
A user can add an optional note, such as why they saved the place or what they want to try.

### 5. Control visibility
A user can decide whether a saved restaurant is private or public.

## V1 Features

### Accounts
- Email and password sign-up and login.
- Each user has their own saved restaurant collection.

### URL Intake
- User can paste a source URL into the app.
- App attempts to extract restaurant information from the URL or its public page metadata.
- Extraction should never silently auto-save.
- V1 officially supports ordinary public web pages and Google Maps links.
- 小红书 and 抖音 links are accepted on a best-effort basis only.
- TikTok and Instagram are future or best-effort sources, not part of the main V1 promise.

### Confirmation And Editing
- After extraction, the user reviews each restaurant candidate before saving.
- User can edit restaurant fields manually.
- The extraction flow should attempt to infer cuisine from the pasted source content when possible.
- Any inferred cuisine must remain editable by the user before saving.
- If cuisine cannot be inferred confidently, the system should leave it blank rather than guessing.
- Manual cuisine entry must always remain available.
- User can bulk-select and save multiple restaurant candidates from a single source.
- User can save incomplete entries if map location data is unavailable.

### Restaurant Record
Each restaurant record in V1 should support:
- Name
- City
- Address
- Cuisine type
- Source URL
- Optional personal note
- Privacy setting: private or public

Restaurant fields must support Chinese text input in V1.

### Language And Localization
- Default UI language in V1 should be Simplified Chinese.
- English should be available as a secondary language option.
- Restaurant fields should support Chinese text input.
- Cuisine options should include Chinese-friendly categories.
- Source examples in the UI and product copy should use 小红书, 抖音, Google Maps, and public web pages.
- Do not build full translation infrastructure yet unless it is part of the current implementation step.
- Future UI should avoid hardcoding copy in a way that makes English support difficult later.

### Visual And UI Direction
- The product should be mobile-first, closer to a mobile web app or PWA than a desktop-first experience.
- Future UI work should prioritize iPhone usability.
- The visual style should be clean, modern, vibrant, and card-based.
- The main accent color should be a vibrant orange close to `#FF5B00`, not purple.
- The attached meal planner reference image is design direction only, not a screen to copy exactly.
- Future screens should borrow the reference's strengths: clean mobile layouts, rounded cards, clear spacing, and a vibrant accent style.

### Browse Experience
- Saved restaurants appear in an in-app list view.
- Saved restaurants also appear on a simple world map.
- Map supports zooming in and out.
- Users can inspect restaurants by city from the map experience.

### Location Handling
- If the app can determine location, it should place the restaurant on the map.
- If the exact location cannot be determined, the restaurant can still be saved and shown in the list.
- City is a required field even when precise coordinates are missing.

## User Flow
1. User signs up or logs in.
2. User pastes a source URL.
3. App extracts one or more restaurant candidates.
4. User reviews, edits, and selects which restaurants to save.
5. User optionally adds notes and chooses private or public visibility.
6. User saves the restaurant entries.
7. User browses saved restaurants later in list and map views.

## Functional Requirements
- The system must support user authentication with email and password.
- The system must default the V1 interface to Simplified Chinese.
- The system should make English available later as a secondary language option.
- The system must support Chinese text input for restaurant fields.
- The system should use cuisine categories that are understandable and natural for Chinese users.
- The system should be designed mobile-first with strong iPhone usability.
- The system must allow a user to paste a URL as the starting point for creating restaurant records.
- The system must show an editable confirmation step before any restaurant is saved.
- The system must support one-to-many extraction from a single source URL.
- The system must allow users to save multiple restaurants from a single source flow.
- The system must allow manual edits to extracted restaurant details.
- The system should attempt to infer cuisine from source content during extraction when confidence is reasonable.
- The system must let the user edit or replace any inferred cuisine value before saving.
- The system should leave cuisine blank when it cannot infer it confidently.
- The system must continue to allow manual cuisine entry even when extraction is used.
- The system must allow saving a restaurant without confirmed map coordinates.
- The system must store the original source URL for each restaurant.
- The system must support optional personal notes.
- The system must support a per-record privacy setting.
- The system must show saved restaurants in both list and map views.
- The system should support at least 50 saved restaurants reliably in V1.

## UX Principles
- Keep the first version simple and lightweight.
- Make the default experience feel natural for Simplified Chinese users.
- Prefer mobile-first layouts and interactions over desktop-first composition.
- Use a clean, vibrant, card-based visual system with strong spacing and rounded surfaces.
- Prefer a vibrant orange accent near `#FF5B00` rather than purple.
- Prefer review-and-confirm over aggressive automation.
- Make manual correction easy because extraction quality will vary by source.
- Preserve the user's original discovery source.
- Help users feel confident they will not forget places they want to visit.

## Risks And Unknowns
- Extraction quality will vary significantly across 小红书, 抖音, Google Maps, and arbitrary web pages.
- Some sources may contain multiple restaurants with incomplete or ambiguous details.
- Geocoding and map placement may fail for partial addresses or international locations.
- 小红书 and 抖音 may expose limited public metadata or page text, so extraction can fail or return incomplete drafts more often than ordinary web pages or Google Maps.
- Public vs private sharing may need clearer rules later if public discovery features expand.

## Future Direction

### V2+
- Better AI extraction from URLs.
- Richer restaurant introductions and summaries.
- More reliable multi-platform parsing.
- Social login such as Google and WeChat.
- Deeper map zoom and more precise place clustering.
- Larger-scale collections in the thousands.
- Desktop app experience.

## Open Product Decisions
- Whether public restaurants are discoverable by other users in V1, or only marked shareable for later use.
- How much bulk editing V1 should support in the multi-restaurant confirmation flow.
