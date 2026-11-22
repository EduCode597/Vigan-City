# Vigan City - Living Heritage & Travel Explorer

A minimalist, Bootstrap 6 editorial travel website showcasing Vigan City, Ilocos Sur: its 11 most-visited landmarks, UNESCO World Heritage history, Ilocano cuisine and living crafts, a captioned photo archive, and a personal Vigan day-plan builder.

Live site: <https://educode597.github.io/Vigan-City/>

## Highlights

- **Auto-Sliding 11-Place Hero Loop:** Seamless right-to-left showcase of all 11 physical landmarks around Vigan (pauses automatically when hovering over the cards, honors `prefers-reduced-motion` with a horizontal snap carousel, and jumps straight to the selected landmark on click).
- **Why Vigan Is Famous:** Concise breakdown of Vigan's UNESCO 1999 inscription, New7Wonders City recognition, and preserved 16th-century *bahay na bato* architecture.
- **Interactive Split-Screen Landmark Explorer:** Filter by area, search by keyword, toggle Calle Crisologo's Day and Night photography, and save stops directly to your trip.
- **My Vigan Plan Drawer:** Built on Bootstrap 6's native `<dialog class="drawer">`, sorting saved stops chronologically from Morning to Evening with estimated time, curated 1-day and 2-day presets, `localStorage` persistence, and clipboard itinerary copy.
- **Food & Living Crafts:** Dedicated stories for Abel Iloko handloom weaving, burnay stoneware pottery, Vigan empanada, crispy bagnet, and garlicky Vigan longganisa.
- **Captioned Photo Archive & Lightbox:** Every photo carries a visible caption below the frame and opens in a keyboard-accessible Bootstrap 6 `<dialog>` viewer.
- **Dual Light & Dark Mode:** Cool Slate neutrals with a single Kiln Terracotta accent powered by `[data-bs-theme]` and persisted in `localStorage`.

## Project Structure

```text
Vigan-City/
├── index.html
├── Icon.svg
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── data/
│   │   └── vigan-data.js
│   └── modules/
│       ├── theme.js
│       ├── marquee.js
│       ├── itinerary.js
│       ├── explorer.js
│       ├── lightbox.js
│       └── reveal.js
├── images/
│   ├── Landmarks/
│   ├── attractions/
│   ├── carousel/
│   ├── cuisine/
│   └── gallery/
└── tests/
    ├── data-and-content.test.js
    ├── theme.test.js
    ├── marquee.test.js
    ├── itinerary.test.js
    ├── explorer.test.js
    ├── lightbox-and-reveal.test.js
    ├── preflight-audit.test.js
    └── e2e/
        └── site.spec.js
```

## Local Development & Deployment

The site requires **no build step** for hosting or GitHub Pages. Serve the repository root with any static HTTP server (needed for ES modules):

```bash
npx vite --port 4173
```

Or deploy directly via GitHub Pages from the repository root (`/`).

## Automated Tests

```bash
# Unit, DOM, content integrity, and pre-flight audit tests
npm test

# End-to-end headless browser tests
npm run test:e2e
```

## Credits & License

- Originally created by **John Eduard Madriaga**
- Built with Bootstrap 6 (`6.0.0-alpha.1`) and Phosphor Icons
- Licensed under the MIT License
