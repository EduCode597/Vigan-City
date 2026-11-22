# Vigan City Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Vigan City static website into a minimalist, Bootstrap 6 editorial travel explorer with a Cool Slate & Kiln Terracotta light/dark palette, an auto-sliding right-to-left loop of all 11 physical Vigan places in the hero, a filterable Split-Screen Landmark Explorer, a live "My Vigan Plan" trip drawer, dedicated Food & Living Crafts stories, a captioned `<dialog>` Photo Archive Lightbox, and full Vitest + Playwright verification.

**Architecture:** Zero-build static deployment at the repository root (`index.html`, `css/styles.css`, ES modules under `js/data/` and `js/modules/`) using Bootstrap `6.0.0-alpha.1` via official CDN with SRI hashes and `@layer custom` CSS tokens, paired with dev-only Vitest + jsdom unit/DOM tests and Playwright Chromium E2E tests.

**Tech Stack:** Semantic HTML5, Bootstrap `6.0.0-alpha.1` (CDN, native `<dialog>` Dialog/Drawer, native `<details>` Accordion, `[data-bs-theme]`), `@phosphor-icons/web`, Google Fonts (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`), Vanilla ES Modules, Vitest 5, jsdom, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-22-vigan-city-redesign-design.md`

## Global Constraints

- Zero em-dashes (`—`) and zero en-dashes (`–`) anywhere in visible copy, headings, labels, captions, itinerary text, or alt attributes (use `-`, commas, colons, or periods).
- Zero emojis anywhere in code, markup, or visible text; use Phosphor Icons with consistent stroke weight.
- Zero `window.addEventListener('scroll')` handlers; use `IntersectionObserver` only.
- Page Theme Lock: Cool Slate (`#f6f7f9` light / `#101317` dark) + single Kiln Terracotta accent (`#b84a32` light / `#df674b` dark) across the entire page including footer.
- Shape Consistency Lock: `8px` (`--vigan-radius`) for cards, buttons, media frames, inputs, dialogs; `4px` (`--vigan-radius-sm`) for inner chips/tags. No pill primary buttons.
- Eyebrow cap: max 2 uppercase mono eyebrows across the entire 6-section page.
- Single marquee on the page (Hero 11-Place Loop), strictly physical places only (zero foods, zero craft-only photos), no pills overlaid on photos, every photo visibly captioned outside the image.
- Exclude watermarked `images/carousel/car2.jpg`; use verified `images/Landmarks/Thumbnail.jpg` path; wire `Icon.svg` as favicon.
- Zero-build root deployment compatible with GitHub Pages (`index.html` at repo root).

## Review Focus

1. Corrupted or unknown `vigan-theme` value in `localStorage` must safely fall back to OS preference / `light` without throwing or leaving an invalid `data-bs-theme` attribute. (Pinned in Task 2.)
2. `localStorage` throwing `SecurityError` (blocked storage / private browsing) must never crash theme toggling or trip-plan persistence. (Pinned in Tasks 2 and 4.)
3. Corrupted JSON or stale/unknown place IDs in `localStorage['vigan-trip-plan']` must be sanitized silently so the itinerary drawer never renders `undefined` rows. (Pinned in Task 4.)
4. Clipboard API unavailable or rejecting in `copyItinerary()` must surface a clear inline status fallback without throwing or calling `window.alert()`. (Pinned in Task 4.)
5. Clicking a hero marquee card while a restrictive category filter or search query is active in the Landmark Explorer must reset/broaden the filter cleanly so the clicked landmark is always visible and selected. (Pinned in Task 5.)

---

### Task 1: Repository Scaffolding, Test Harness & Verified Vigan Data Layer

**Files:**
- Create: `.gitignore`, `package.json`, `vitest.config.js`, `js/data/vigan-data.js`
- Test: `tests/data-and-content.test.js`

**Interfaces:**
- Produces in `js/data/vigan-data.js`:
  - `PLACES`: Array of 11 physical place objects `{ id, name, category, categoryLabel, zone, shortIntro, story, image, nightImage?, alt, bestTime, durationMinutes, durationLabel, highlight, entryFee, timeSlot, timeSlotLabel, distanceFromPlaza }`
  - `HERO_PLACES`: Readonly projection of all 11 physical places for the hero right-to-left loop (`PLACES.map(...)`, zero food/craft items)
  - `PLACE_CATEGORIES`: Array of `{ id, label }` (`all`, `core`, `museum`, `craft-place`, `outskirts`)
  - `HERITAGE_FACTS`: Array of 3 pillar objects `{ metric, title, detail }`
  - `CULTURE_ITEMS`: Array of 5 items (1 featured craft + 4 food/craft items) `{ id, kind, featured, name, location, image, alt, summary, tip }`
  - `GALLERY_ITEMS`: Array of 6 captioned archive photo objects `{ id, title, location, image, alt, caption, spanClass }`
  - `TRIP_PRESETS`: Array of 2 curated routes `{ id, name, subtitle, stopIds }`
  - `TRAVEL_ESSENTIALS`: Array of 3 practical visit blocks `{ id, title, icon, summary, bullets }`
  - `FAQ_ITEMS`: Array of 4 practical Q&A items `{ id, question, answer, defaultOpen }`

- [ ] **Step 1:** Create `.gitignore`, `package.json`, `vitest.config.js`, and write failing tests in `tests/data-and-content.test.js` asserting all 11 places, hero places purity, disk asset existence, exclusion of `car2.jpg`, preset ID integrity, and zero em-dashes/en-dashes/emojis across every copy field.
- [ ] **Step 2:** Run `npx vitest run tests/data-and-content.test.js` and confirm FAIL (missing `js/data/vigan-data.js`).
- [ ] **Step 3:** Implement `js/data/vigan-data.js` with rich, authentic Vigan copy for all 11 places, heritage facts, food & crafts, gallery archive, presets, travel essentials, and FAQs.
- [ ] **Step 4:** Run `npx vitest run tests/data-and-content.test.js` and confirm PASS.
- [ ] **Step 5:** Commit spec, plan, scaffolding, new landmark images, favicon, and `js/data/vigan-data.js`.

---

### Task 2: Dual Light/Dark Theme Module

**Files:**
- Create: `js/modules/theme.js`
- Test: `tests/theme.test.js`

**Interfaces:**
- Produces in `js/modules/theme.js`:
  - `THEME_STORAGE_KEY = 'vigan-theme'`
  - `resolveInitialTheme({ storage, matchMedia }): 'light' | 'dark'`
  - `applyTheme(theme, { root, toggleButtons }): 'light' | 'dark'`
  - `initTheme({ root, toggleButtons, storage, matchMedia }): { getTheme, setTheme, toggleTheme }`

- [ ] **Step 1:** Write failing tests in `tests/theme.test.js` covering saved preference, OS dark preference fallback, corrupted storage value fallback, throwing `localStorage` resilience, and toggle button DOM/ARIA updates.
- [ ] **Step 2:** Run `npx vitest run tests/theme.test.js` and confirm FAIL.
- [ ] **Step 3:** Implement `js/modules/theme.js`.
- [ ] **Step 4:** Run `npx vitest run tests/theme.test.js` and confirm PASS.
- [ ] **Step 5:** Commit `js/modules/theme.js` and `tests/theme.test.js`.

---

### Task 3: Hero Auto-Sliding 11-Place Loop Module

**Files:**
- Create: `js/modules/marquee.js`
- Test: `tests/marquee.test.js`

**Interfaces:**
- Consumes: `HERO_PLACES` shape from Task 1.
- Produces in `js/modules/marquee.js`:
  - `initMarquee({ viewport, track, toggleBtn, places, onSelectPlace, matchMedia }): { isPaused, setPaused, togglePaused }`

- [ ] **Step 1:** Write failing tests in `tests/marquee.test.js` verifying 11 primary place cards + 11 `aria-hidden="true"` / `tabindex="-1"` duplicate cards, click delegation from both groups calling `onSelectPlace(id)`, pause/resume button state, and `prefers-reduced-motion: reduce` starting paused with explicit `.force-motion` Play opt-in.
- [ ] **Step 2:** Run `npx vitest run tests/marquee.test.js` and confirm FAIL.
- [ ] **Step 3:** Implement `js/modules/marquee.js`.
- [ ] **Step 4:** Run `npx vitest run tests/marquee.test.js` and confirm PASS.
- [ ] **Step 5:** Commit `js/modules/marquee.js` and `tests/marquee.test.js`.

---

### Task 4: "My Vigan Plan" Itinerary State & Bootstrap 6 Drawer Module

**Files:**
- Create: `js/modules/itinerary.js`
- Test: `tests/itinerary.test.js`

**Interfaces:**
- Consumes: `PLACES`, `TRIP_PRESETS` from Task 1.
- Produces in `js/modules/itinerary.js`:
  - `PLAN_STORAGE_KEY = 'vigan-trip-plan'`
  - `sortPlacesForDay(places): Place[]`
  - `formatDuration(totalMinutes): string`
  - `formatItineraryText(places): string`
  - `createItineraryStore({ places, presets, storage }): { getSavedIds, getSavedPlaces, hasStop, toggleStop, removeStop, applyPreset, clearPlan, subscribe }`
  - `initItineraryDrawer({ store, presets, drawerEl, listEl, summaryEl, countEls, copyBtn, clearBtn, statusEl, clipboard }): { render, openDrawer, closeDrawer, copyItinerary }`

- [ ] **Step 1:** Write failing tests in `tests/itinerary.test.js` covering empty state + presets, toggle/remove/clear, chronological Morning-to-Evening sorting, total duration math, corrupted/stale `localStorage` sanitization, throwing `localStorage` resilience, clipboard success + rejection inline status, and drawer DOM rendering.
- [ ] **Step 2:** Run `npx vitest run tests/itinerary.test.js` and confirm FAIL.
- [ ] **Step 3:** Implement `js/modules/itinerary.js`.
- [ ] **Step 4:** Run `npx vitest run tests/itinerary.test.js` and confirm PASS.
- [ ] **Step 5:** Commit `js/modules/itinerary.js` and `tests/itinerary.test.js`.

---

### Task 5: Split-Screen Landmark Explorer Module

**Files:**
- Create: `js/modules/explorer.js`
- Test: `tests/explorer.test.js`

**Interfaces:**
- Consumes: `PLACES`, `PLACE_CATEGORIES` from Task 1; `store` from Task 4.
- Produces in `js/modules/explorer.js`:
  - `initExplorer({ places, categories, store, filtersEl, searchInput, listEl, spotlightEl, onOpenPlan }): { selectPlace, selectAndFocusPlace, resetFilters, getActivePlaceId }`

- [ ] **Step 1:** Write failing tests in `tests/explorer.test.js` covering initial 11-place render, category filtering, case-insensitive search + empty state with `Reset filters` button, Calle Crisologo Day/Night photo toggle, `+ Save` / `Saved` sync with itinerary store, and `selectAndFocusPlace(id)` clearing restrictive filters/search before activating the target place.
- [ ] **Step 2:** Run `npx vitest run tests/explorer.test.js` and confirm FAIL.
- [ ] **Step 3:** Implement `js/modules/explorer.js`.
- [ ] **Step 4:** Run `npx vitest run tests/explorer.test.js` and confirm PASS.
- [ ] **Step 5:** Commit `js/modules/explorer.js` and `tests/explorer.test.js`.

---

### Task 6: Captioned Photo Archive Lightbox & IntersectionObserver Reveal/Nav Spy

**Files:**
- Create: `js/modules/lightbox.js`, `js/modules/reveal.js`
- Test: `tests/lightbox-and-reveal.test.js`

**Interfaces:**
- Consumes: `GALLERY_ITEMS` from Task 1.
- Produces:
  - `js/modules/lightbox.js`: `initLightbox({ items, gridEl, dialogEl }): { openAt, close, next, prev, getCurrentIndex }`
  - `js/modules/reveal.js`: `initReveal({ elements, matchMedia, IntersectionObserverCtor }): void`, `initNavSpy({ links, sections, IntersectionObserverCtor }): void`

- [ ] **Step 1:** Write failing tests in `tests/lightbox-and-reveal.test.js` covering 6 captioned gallery plates, opening `<dialog>`, wrapping Next/Prev + `ArrowRight`/`ArrowLeft` keyboard nav, `IntersectionObserver` scroll reveals (plus immediate reveal under reduced motion), and `aria-current="location"` nav spy without any scroll event listeners.
- [ ] **Step 2:** Run `npx vitest run tests/lightbox-and-reveal.test.js` and confirm FAIL.
- [ ] **Step 3:** Implement `js/modules/lightbox.js` and `js/modules/reveal.js`.
- [ ] **Step 4:** Run `npx vitest run tests/lightbox-and-reveal.test.js` and confirm PASS.
- [ ] **Step 5:** Commit `js/modules/lightbox.js`, `js/modules/reveal.js`, and `tests/lightbox-and-reveal.test.js`.

---

### Task 7: Semantic HTML, Bootstrap 6 Layered CSS, Main Entry, Pre-Flight Audit, E2E Playwright Suite & Docs

**Files:**
- Modify: `index.html`, `README.md`
- Create: `css/styles.css`, `js/main.js`, `tests/preflight-audit.test.js`, `playwright.config.js`, `tests/e2e/site.spec.js`
- Delete: `style.css` (replaced by `css/styles.css`)

**Interfaces:**
- Consumes: All data exports from `js/data/vigan-data.js` and all module initializers from Tasks 2-6.
- Produces: Complete production static site wired through `js/main.js` and verified by Vitest + Playwright Chromium E2E tests.

- [ ] **Step 1:** Write failing static pre-flight audit tests in `tests/preflight-audit.test.js` checking `index.html` and `css/styles.css` for: Bootstrap `6.0.0-alpha.1` CDN + SRI, `Icon.svg` favicon, zero legacy v5 classes (`modal`, `offcanvas`, `data-bs-ride`), zero em-dashes/en-dashes/emojis, zero `window.addEventListener('scroll')`, eyebrow count <= 2, single marquee, semantic `<main>`/`<nav>`/`<footer>`/`<dialog>`/`<details>` landmarks, and zero broken relative `src`/`href` assets.
- [ ] **Step 2:** Run `npx vitest run tests/preflight-audit.test.js` and confirm FAIL against old `index.html`.
- [ ] **Step 3:** Write `index.html`, `css/styles.css`, `js/main.js`, remove obsolete root `style.css`, and update `README.md`.
- [ ] **Step 4:** Run full Vitest suite (`npm test`) and confirm 100% PASS.
- [ ] **Step 5:** Write `playwright.config.js` and `tests/e2e/site.spec.js` (testing real browser rendering, Light/Dark modes, marquee animation + pause/resume + jump-to-explorer, explorer filtering/search/saving, Plan Drawer open/presets/copy/close, Photo Lightbox open/arrows/close, FAQ `<details>`, desktop & mobile zero horizontal overflow, zero broken images, zero console/page errors) and run `npm run test:e2e`.
- [ ] **Step 6:** Commit all Task 7 changes.
