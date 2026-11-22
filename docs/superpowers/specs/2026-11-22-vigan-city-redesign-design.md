# Vigan City Website Redesign Design Spec

**Date:** 2026-11-22
**Repository:** `c:\Users\PROVIDENCE\OneDrive\Desktop\Vigan-City`
**Live Deployment Target:** GitHub Pages (`https://educode597.github.io/Vigan-City/`)

---

## 1. Intent and Why

The current site (`Vigan Heritage Escape`) is a single-page Bootstrap 5.3 brochure that undersells Vigan City. Only three landmarks receive brief one-sentence cards, the "About" carousel repeats three unlabeled shots of Calle Crisologo (including one watermarked image), the gallery shows six photos with no titles or introductions while pointing to a nonexistent `#lightboxModal`, and major Philippine landmarks around Vigan are missing entirely.

The redesigned site transforms the repository into a minimalist editorial travel explorer built to spark genuine curiosity and an urge to visit Vigan. It prioritizes the real places travelers across the Philippines flock to, explains why Vigan holds a singular historical status nationwide, introduces every single photograph clearly so visitors always know what they are seeing, and turns passive browsing into active trip planning.

### Design Read & Skill Alignment

> **Design Read:** Reading this as a destination editorial and interactive travel explorer for curious Philippine and international travelers, with a minimalist editorial language, leaning toward Bootstrap 6 custom token layers, a Cool Slate and Kiln Terracotta dual light/dark palette, and `Playfair Display` + `Plus Jakarta Sans` + `JetBrains Mono` typography.

- **Applied Skills:** `design-taste-frontend`, `minimalist-ui`, `redesign-existing-projects`, and the Bootstrap 6 skill suite (`bootstrap-v6-install`, `bootstrap-color-system`, `bootstrap-component`, `bootstrap-v5-v6-migration`).
- **Redesign Mode:** Redesign - Overhaul (rebuilding the visual language, layout concept, and content depth on top of the existing repository and expanded local photography while keeping direct root-level GitHub Pages hosting).
- **Taste Dials:**
  - `DESIGN_VARIANCE: 6` (asymmetric editorial pairings, split-screen explorer, varied section rhythms, zero 3-equal-card rows)
  - `MOTION_INTENSITY: 5` (one purposeful hero places loop, `IntersectionObserver` scroll-entry fades, crisp tactile `:active` feedback, full `prefers-reduced-motion` degradation, zero `window.addEventListener('scroll')`)
  - `VISUAL_DENSITY: 3` (generous whitespace, crisp `1px` hairlines, zero heavy drop shadows)

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Swell real Vigan content:** Showcase all **11 physical places** available in the repository alongside a clear narrative of why Vigan is famous across the Philippines (UNESCO World Heritage Site 1999, New7Wonders City 2015, intact survival through WWII, 233 preserved *bahay na bato* ancestral homes, and living Ilocano craft and food traditions).
2. **Introduce every visual:** Every photograph across the hero loop, landmark explorer, cuisine/craft section, and photo archive has a visible place title and meaningful introduction directly below or beside the image (never overlaid on top of the photo).
3. **Auto-sliding Hero Places Loop:** Convert the hero preview strip into a smooth, seamless right-to-left auto-sliding loop displaying all **11 Vigan places** in the repository (strictly places only; zero foods and zero craft-only items).
4. **Interactive Exploration & Trip Building:** Deliver a filterable Split-Screen Landmark Explorer paired with a live "My Vigan Plan" itinerary builder inside a Bootstrap 6 native `<dialog class="drawer">`, plus a working keyboard-accessible Bootstrap 6 `<dialog>` Photo Archive Lightbox.
5. **Fresh Minimalist Light & Dark Modes:** Move off the old warm cream-and-brown look to Cool Slate + Kiln Terracotta with full Light and Dark mode parity.
6. **Verified Quality:** Ship clean, accessible, responsive code backed by automated unit/DOM tests and real-browser verification.

### Non-Goals
- No backend API, database, user accounts, or booking/payment checkout.
- No third-party map SDKs or live weather APIs requiring API keys.
- No framework rewrite to React, Next.js, or Tailwind.

### Anti-Goals (Failure Conditions)
- Plain one-line brochure filler or any photograph lacking an introduction.
- Food dishes or craft-only photos appearing inside the hero auto-sliding places loop.
- Returning to the generic cream-and-brass palette or repeating identical 3-column equal-card rows.
- Any em-dash (`—`) or en-dash (`–`) anywhere in visible UI copy, headings, labels, captions, or alt text (use hyphens `-`, commas, colons, or periods only).
- Any emojis anywhere in markup or visible copy.
- Text pills or badges overlaid on photographs, section-numbering eyebrows (`01 / ...`), scroll cues (`Scroll ↓`), or `window.addEventListener('scroll')` handlers.
- Breaking root-level GitHub Pages deployment or leaving broken image links (e.g., referencing the moved `Thumbnail.jpg` at the old root path or rendering watermarked `car2.jpg`).

---

## 3. Decisions Made by the User

1. **Concept & Layout Direction:** Concept B's layout and interactive explorer architecture (hero + place strip, "Why Vigan Is Famous" band, filterable split-screen landmark explorer, live "My Vigan Plan" trip builder drawer, dedicated food/craft showcase, captioned gallery archive, and practical visit FAQ).
2. **Typography & Color System:** Concept A's visual language applied to Concept B's layout:
   - Fonts: `Playfair Display` (editorial display headings), `Plus Jakarta Sans` (body and UI), `JetBrains Mono` (metadata, walk times, counts, years).
   - Palette: Cool Slate neutrals with a single Kiln Terracotta accent, supporting both Light Mode and Dark Mode.
3. **Hero Auto-Sliding Places Loop:** The hero's place strip moves continuously from right to left in an auto-sliding loop demonstrating all physical places in the repository (**places only, no foods and no crafts**).
4. **Local Real Photography:** Use the real Vigan photos already curated in `images/`, including the 7 newly added landmarks in `images/Landmarks/`.

---

## 4. Visual System & Bootstrap 6 Token Architecture

### Color Tokens (Single Accent Lock + Page Theme Lock)
One theme applies across the entire page per mode (no inverted black sections dropped inside light mode, including the footer). Tokens are scoped via Bootstrap 6's `[data-bs-theme="light"]` / `[data-bs-theme="dark"]` attributes and `light-dark()` / CSS custom properties inside `@layer custom`:

| Token | Light Mode | Dark Mode | Role |
|---|---|---|---|
| `--vigan-bg` | `#f6f7f9` | `#101317` | Page canvas |
| `--vigan-surface` | `#ffffff` | `#171c22` | Primary elevated section / panel |
| `--vigan-surface-alt` | `#edf0f4` | `#1f262f` | Subtle hover & secondary fill |
| `--vigan-ink` | `#15191e` | `#f1f4f8` | Primary headings & body text |
| `--vigan-muted` | `#56606e` | `#98a4b5` | Secondary descriptions & captions |
| `--vigan-border` | `#dfe4ec` | `#27303c` | Structural `1px` hairlines |
| `--vigan-accent` | `#b84a32` | `#df674b` | Single Kiln Terracotta accent |
| `--vigan-accent-hover` | `#993b27` | `#eb7c63` | Primary button hover |
| `--vigan-accent-soft` | `#f9ebe7` | `#2b1d1a` | Soft active tint & plan badge fill |
| `--vigan-accent-contrast` | `#ffffff` | `#101317` | Accessible label text on accent (WCAG AA >= 4.5:1) |

- **Theme Detection & Persistence (Our Call):** Respect `prefers-color-scheme` on first load if no preference is saved; clicking the navbar Light/Dark button toggles `<html data-bs-theme="light|dark">` and persists to `localStorage` under key `vigan-theme`. A tiny inline `<head>` bootstrap script prevents flash-of-wrong-theme on reload.

### Typography & Shape Consistency Lock
- **Headings:** `Playfair Display` (weights 500, 600, 700), tight negative tracking (`-0.025em`), `line-height: 1.1` (with `padding-bottom: 0.1em` clearance on italic display spans so descenders never clip).
- **Body & UI:** `Plus Jakarta Sans` (weights 400, 500, 600, 700), `line-height: 1.6`, paragraph measure capped at `65ch`, `text-wrap: pretty` on paragraphs and `text-wrap: balance` on headings.
- **Meta & Numbers:** `JetBrains Mono` (weights 400, 500, 600) with `font-variant-numeric: tabular-nums`.
- **Radii:** `--vigan-radius: 8px` for cards, media frames, buttons, inputs, dialogs; `--vigan-radius-sm: 4px` for small chips and itinerary tags. No pill primary buttons.
- **Borders & Elevation:** Crisp `1px solid var(--vigan-border)` defines surfaces; subtle slate-tinted shadow only on hover/dialogs (`rgba(21, 25, 30, 0.06)` light, `rgba(0, 0, 0, 0.28)` dark).
- **Icons (Our Call):** Phosphor Icons (`@phosphor-icons/web` regular weight via jsDelivr CDN, consistent stroke weight, zero emojis, zero hand-rolled icon paths).
- **Eyebrow Restraint:** At most 2 uppercase mono eyebrows across the entire 6-section page (1 in the Hero; 0 or 1 across the rest).

---

## 5. Complete Asset Inventory & Content Mapping

All paths are relative to the repository root (`index.html`). Every active asset path below has been verified on disk:

### A. The 11 Physical Vigan Places (Used in Hero Auto-Sliding Loop AND Landmark Explorer)

| # | ID | Place Name | Category | Image Path | Time Slot (for Itinerary Sort) |
|---|---|---|---|---|---|
| 1 | `calle-crisologo` | Calle Crisologo | `core` (Heritage Core) | `images/Landmarks/Thumbnail.jpg` (Explorer alt night view: `images/attractions/CalleCrisologo.jpg`) | Morning (1) |
| 2 | `bantay-bell-tower` | Bantay Bell Tower | `outskirts` (Hills & Parks) | `images/Landmarks/Bantay-Bell-tower.jpg` | Afternoon (3) |
| 3 | `syquia-mansion` | Syquia Mansion Museum | `museum` (Ancestral Museums) | `images/Landmarks/Syquia-Mansion.jpg` | Morning (1) |
| 4 | `plaza-salcedo` | Plaza Salcedo | `core` (Heritage Core) | `images/attractions/PlazaSalcedo.jpg` | Evening (4) |
| 5 | `st-paul-cathedral` | St. Paul Metropolitan Cathedral | `core` (Heritage Core) | `images/attractions/ViganCathedral.jpg` | Morning (1) |
| 6 | `padre-burgos-house` | Padre Burgos House (National Museum) | `museum` (Ancestral Museums) | `images/Landmarks/padre-burgos-house.jpg` | Midday (2) |
| 7 | `pagburnayan` | Pagburnayan Jar Factory | `craft-place` (Craft & Gardens) | `images/Landmarks/pagburnayan.jpg` | Afternoon (3) |
| 8 | `plaza-burgos` | Plaza Burgos | `core` (Heritage Core) | `images/gallery/Plaza_Burgos.jpg` | Evening (4) |
| 9 | `hidden-garden` | Hidden Garden | `craft-place` (Craft & Gardens) | `images/Landmarks/hidden-garden.jpg` | Midday (2) |
| 10 | `crisologo-museum` | Crisologo Museum | `museum` (Ancestral Museums) | `images/Landmarks/crisologo-museum.jpg` | Midday (2) |
| 11 | `baluarte` | Baluarte Resort & Safari | `outskirts` (Hills & Parks) | `images/Landmarks/baluarte.jpg` | Afternoon (3) |

*Note:* The Hero Auto-Sliding Loop renders **only these 11 physical places**. It excludes all dishes and craft-only imagery. Note that `Pagburnayan Jar Factory` is a major physical destination in `images/Landmarks/pagburnayan.jpg` (included as a place), whereas `images/gallery/Vigan Pottery.jpg` and `images/gallery/AbelWeaving.jpg` belong in the Food & Living Crafts section.

### B. Food & Living Crafts (Dedicated Section Only - Excluded from Hero Place Loop)
- **Abel Iloko Handloom Weaving** - `images/gallery/AbelWeaving.jpg`
- **Burnay Earthenware Craft** - `images/gallery/Vigan Pottery.jpg`
- **Vigan Empanada** - `images/cuisine/ViganEmpanada.jpg`
- **Crispy Ilocano Bagnet** - `images/cuisine/Bagnet 4 Ways Recipe.jpeg`
- **Vigan Longganisa** - `images/cuisine/Longganisa.jpeg`

### C. Captioned Photo Archive / Lightbox Gallery
Showcases atmospheric Vigan photography not duplicated directly as Explorer primary frames, each with a title, location tag, and story caption:
- `images/attractions/CalleCrisologo.jpg` - Calle Crisologo by Lantern Light
- `images/gallery/ViganNightMode.jpg` - Festival Arches on Calle Crisologo
- `images/gallery/calesa.jpg` - Kalesa Carriage on Wet Cobblestones
- `images/carousel/car1.jpeg` - Afternoon Kalesa Traffic Along the Heritage Core
- `images/carousel/car3.jpeg` - Quiet Morning Cobblestones and Bahay na Bato Facades
- `images/gallery/Vigan Longganisa.jpg` - Market-Fresh Vigan Longganisa Links

*Retired Asset:* `images/carousel/car2.jpg` carries a visible third-party `wallpaper.si` watermark in the corner and is intentionally excluded from active rendering (the file remains untouched in git unless cleanup is requested).

---

## 6. Page Structure, Layout Families & Interactive Behavior

Every section uses a distinct layout family (no repeated 3-equal-card grids, no consecutive zigzag splits).

### Header & Navigation
- Sticky single-line `<header>` / `<nav>` (`height: 70px` desktop, `backdrop-filter` with solid fallback under `prefers-reduced-transparency`).
- Hidden-until-focused **Skip to main content** link (`#main-content`).
- Left: `Vigan City` serif brand link. Center: 4 single-line links (`Why Vigan`, `Landmarks`, `Food & Craft`, `Plan Visit`) with active state updated via `IntersectionObserver` (never scroll listeners). Right: Theme toggle button (`Light Mode` / `Dark Mode`), `"My Vigan Plan (N)"` button triggering the Bootstrap 6 `<dialog class="drawer drawer-end">`, and mobile menu button (`< 992px`) opening a Bootstrap 6 `<dialog class="drawer drawer-start">`.

### Section 1: Hero + Auto-Sliding 11-Place Loop (`#hero`)
- **Top Copy Block:** Left-aligned eyebrow (`UNESCO WORLD HERITAGE CITY - ILOCOS SUR`), 2-line `<h1>` (`Walk four centuries of cobblestone, intact.`), <= 20-word subtext, primary CTA (`Explore Landmarks` -> `#landmarks`), secondary link (`Why Vigan Is Famous` -> `#why-vigan`), plus an unobtrusive `Pause loop` / `Resume loop` control on the right.
- **Auto-Sliding Right-to-Left Places Loop:**
  - Full-width masked horizontal track inside the hero showcasing all **11 physical places** moving smoothly from right to left (`@keyframes viganMarquee` translating `0` to `-50%` over ~52s linear infinite using GPU `transform`).
  - Contains two identical `.marquee-group` DOM containers for a seamless seam; the duplicate group has `aria-hidden="true"` and `tabindex="-1"` on interactive elements so screen readers and keyboard users traverse the 11 places once.
  - Each card (`276px` desktop, `236px` mobile) is an interactive `<button>` displaying the `16:10` photo, place name, and concise 1-line intro cleanly beneath the image.
  - **Pause & Accessibility:** Pauses automatically on `:hover` (not sticky after clicking a card) or when toggled via `Pause loop` / `Play loop` (`aria-pressed`). Under `@media (prefers-reduced-motion: reduce)`, the animation starts paused by default (turning the strip into a clean horizontal snap-scroll carousel), and the user can explicitly click `Play loop` to enable the glide at any time.
  - **Cross-Navigation:** Clicking any place card in the loop scrolls smoothly to `#landmarks`, switches the category filter to `All` if needed, activates that landmark in the Split-Screen Explorer, and moves keyboard focus to the spotlight heading.
  - **Marquee Budget:** This is the sole marquee on the entire page.

### Section 2: Why Vigan Is Famous Across the Philippines (`#why-vigan`)
- **Layout Family:** Asymmetric 2-column editorial overview (left sticky-capable title + concise context paragraph; right 3 top-accented heritage fact columns: `UNESCO 1999`, `New7Wonders`, `233 Ancestral Homes`, followed by a concise 3-point architectural breakdown explaining WWII preservation, *bahay na bato* construction, and Filipino-Chinese-Spanish trade heritage).

### Section 3: Interactive Split-Screen Landmark Explorer (`#landmarks`)
- **Layout Family:** Filter/search toolbar + 2-column split (left scrollable landmark index, right sticky spotlight dossier).
- **Filtering & Search:**
  - Category filter chips: `All Places (11)`, `Heritage Core`, `Ancestral Museums`, `Craft & Gardens`, `Hills & Parks`.
  - Clean minimalist search input (label above/accessible `sr-only` with clear visible label, WCAG AA contrast) filtering by place name, highlight, or description.
  - Composed **Empty State** if search yields zero matches ("No Vigan places match that search." + one-click `Reset filters` button).
- **Left Index:** Displays matching places as crisp `1px`-separated rows with active Kiln Terracotta left-bar indicator, place name, zone/timing note, and inline `+ Save` / `Saved` button (`aria-pressed`).
- **Right Spotlight Panel:** Updates immediately on selection (with subtle opacity/transform swap respecting reduced motion), displaying:
  - Full `16:10` photo (`loading="lazy"`, descriptive `alt`).
  - Metadata line (Zone, Entry note, Era/Highlight).
  - Place title (`<h3>`) and rich 2-3 sentence story answering what it is and why travelers visit.
  - Structured 3-column visitor facts (`Best Time`, `Typical Stay`, `Don't Miss`).
  - Action row: `Save to My Vigan Plan` / `Saved in My Plan` button + `Open My Plan Drawer` button (and on Calle Crisologo, an optional Day/Night photo toggle using `Thumbnail.jpg` and `CalleCrisologo.jpg`!).
- **Mobile Layout (`< 992px`):** Spotlight renders cleanly above a compact horizontally scrollable or stacked place selector so visitors see immediate feedback without scrolling past 11 rows.

### Interactive Component: "My Vigan Plan" Drawer (`<dialog id="planDrawer" class="drawer drawer-end">`)
- Uses Bootstrap 6 native `<dialog class="drawer drawer-end">` (with native `::backdrop`, focus trap, Escape dismiss, and empty `<button class="btn-close">`).
- **Features:**
  - Pre-seeded or empty? **Our Call:** Start cleanly with 0 saved stops OR a helpful starter state? Better: start with **empty state** featuring two prominent one-click starter routes (`Load 1-Day Classic Highlights` [5 stops] and `Load 2-Day Heritage Weekend` [8 stops]) so visitors aren't surprised by unrequested pre-saved items while still getting instant inspiration in one click!
  - Automatically groups saved stops by recommended time of day (`Morning`, `Midday`, `Afternoon`, `Evening`) and displays total estimated sightseeing duration (`tabular-nums`).
  - Individual `Remove` button per stop, `Clear plan` button, and `Copy itinerary` button that writes a clean plain-text schedule to clipboard with inline status text (`Copied to clipboard` / fallback error message; never `window.alert()`).
  - Persists saved IDs in `localStorage` (`vigan-trip-plan`) with safe `try/catch` handling.

### Section 4: Ilocano Cuisine & Living Crafts (`#culture`)
- **Layout Family:** Asymmetric editorial feature (large left anchor story for **Abel Iloko Handloom Weaving**, right vertical stack of horizontal media cards for **Vigan Empanada**, **Crispy Bagnet**, **Vigan Longganisa**, and **Burnay Pottery Craft**).
- Every item explains *what it is*, *how it is made*, and *where in Vigan visitors go to try or see it*.

### Section 5: Captioned Photo Archive & Working Lightbox (`#gallery`)
- **Layout Family:** Asymmetric editorial mosaic grid (6 curated Vigan photographs with varied desktop column spans, collapsing cleanly to 2-col on tablet and 1-col on small mobile).
- Every tile is a `<figure>` inside a `<button>` with a visible `<figcaption>` **below** the image (title + 1-line story).
- Clicking any tile opens a native **Bootstrap 6 `<dialog id="galleryLightbox" class="dialog dialog-lg">`** displaying:
  - Full-resolution photograph.
  - Place/scene title, location tag, full 2-sentence introduction, and photo index (`1 of 6`).
  - `Previous` and `Next` buttons + keyboard `ArrowLeft`, `ArrowRight`, and `Escape` support.
  - Empty `.btn-close` button inheriting `currentcolor` (Bootstrap 6 convention).

### Section 6: Plan Your Visit & FAQ (`#plan`)
- **Layout Family:** 2-column practical guide:
  - Left column: Clean border-separated travel essentials (`Getting There` from Manila/Laoag, `Best Season & Festivals` covering Nov-Feb cool weather, January Longganisa Festival, and May Viva Vigan Binatbatan Festival, `Getting Around & Where to Stay` covering walkable core, kalesa, tricycles, and heritage inns).
  - Right column: Bootstrap 6 native `<details class="accordion-item" name="visitFaq">` / `<summary class="accordion-header">` Accordion (no Collapse JS, clean `+`/`-` or chevron indicator) answering practical first-timer questions (budget/fees, ideal trip length, dress/footwear tips for cobblestones, best pasalubong to bring home).

### Footer (`<footer id="siteFooter">`)
- Semantic `<footer>` in the same page theme surface (`var(--vigan-surface)` + `1px solid var(--vigan-border)` top border) keeping Page Theme Lock intact.
- Contains concise attribution (`© 2026 Vigan City Guide | Originally created by John Eduard Madriaga`), external portfolio link, quick anchor links, and `Back to top` link.

---

## 7. Technical Implementation & Verification Plan

### File Structure (Zero-Build GitHub Pages Ready)
```text
Vigan-City/
├── index.html                  # Semantic HTML5 + Bootstrap 6.0.0-alpha.1 CDN (with exact SRI) + Phosphor Icons CDN
├── css/
│   └── styles.css              # Bootstrap 6 @layer custom tokens, light/dark palette, layout families, marquee, reduced-motion
├── js/
│   ├── data/
│   │   └── vigan-data.js       # Structured single source of truth for 11 places, crafts/foods, gallery items, presets, FAQs
│   ├── modules/
│   │   ├── theme.js            # Light/Dark [data-bs-theme] state + localStorage + OS preference
│   │   ├── marquee.js          # Hero 11-place auto-sliding loop renderer, pause/resume toggle, jump-to-explorer handler
│   │   ├── explorer.js         # Split-Screen Landmark Explorer filtering, search, selection, Day/Night toggle
│   │   ├── itinerary.js        # My Vigan Plan state, time-of-day sorting, presets, duration calc, clipboard copy, Drawer sync
│   │   ├── lightbox.js         # Captioned Photo Archive renderer + Bootstrap 6 <dialog> lightbox & keyboard nav
│   │   └── reveal.js           # IntersectionObserver gentle scroll-entry animations + active nav spy (zero scroll listeners)
│   └── main.js                 # ESM entry point wiring all modules cleanly
├── tests/
│   ├── data-and-content.test.js # Verifies 11 places, zero foods/crafts in hero loop, every image exists on disk, zero em-dashes/emojis
│   ├── ui-modules.test.js       # Vitest + jsdom tests for theme, marquee, explorer filter/search/jump, itinerary presets/sort/storage, lightbox nav
│   └── e2e/
│       └── site.spec.js         # Playwright headless Chromium tests: Light/Dark modes, marquee motion/pause/click, drawer, lightbox, mobile overflow, zero console errors
├── package.json                # Dev-only test scripts (vitest, jsdom, playwright) - runtime stays 100% static
├── .gitignore                  # Ignores node_modules/, .superpowers/, test-results/
├── images/                     # Existing curated Vigan photography (preserved as-is)
└── README.md                   # Updated project documentation
```

*Note on Legacy Root Files:* Remove unused root `style.css` (moving clean styles to `css/styles.css` as documented in the repo's original `README.md` structure!).

### What Is Left to the Builder
- Exact responsive spacing values, micro-animation cubic-bezier easing, and mobile drawer styling details within the locked `8px`/`4px` radius and Cool Slate + Kiln Terracotta palette.
- Exact Bootstrap 6 utility class composition (`.md:d-flex`, `.btn-solid`, `.dialog`, `.drawer`, `.accordion-item`) following `bootstrap-v5-v6-migration` and `bootstrap-component` rules.
- Writing comprehensive, passing Vitest unit/DOM tests and Playwright Chromium end-to-end tests before declaring completion.
