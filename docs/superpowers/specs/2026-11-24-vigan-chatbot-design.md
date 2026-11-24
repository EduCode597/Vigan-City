# "Ask Vigan" Chatbot: Design

Date: 2026-11-24
Status: Ready for owner review and approval

## 1. Intent

The Vigan City site is informative but mostly passive: visitors scroll and read. The owner wants a more interactive way in, where a visitor can simply ask a question about Vigan at any time and get an accurate answer.

Accuracy matters more than breadth. The site exists to showcase Vigan, so the bot must never invent facts. It answers **only from what the website already contains**. When a question falls outside that, it says so plainly.

## 2. Goals

1. A minimal floating chat button, always available, that opens a small chat card (mockup option **A**: round icon plus floating card, chosen by the owner).
2. The bot answers questions about everything on the site:
   - the 11 landmarks and each one's story, best time to visit, entry fee, typical stay, highlight, area or zone, distance from the plaza, and time of day,
   - landmark categories (Heritage Core, Ancestral Museums, Crafts and Gardens, Hills and Parks),
   - the "Why Vigan" content (UNESCO 1999, New7Wonders 2015, 233 houses, and surviving World War II),
   - food and living crafts (abel weaving, empanada, bagnet, longganisa, burnay),
   - photo archive captions (festivals, kalesa, night lights, market),
   - the 1-day and 2-day trip presets,
   - travel essentials (getting there, best season and festivals, getting around, where to stay),
   - the 4 first-timer FAQs,
   - how to use the site itself (explorer, saving stops, My Vigan Plan, dark mode, photo archive),
   - who made the site (the footer developer card).
3. When an answer is about a landmark or trip preset, it offers action buttons. Nothing happens until the visitor clicks one:
   - **View in explorer**: selects that landmark in the explorer and scrolls to it.
   - **+ Add to my plan**: saves the landmark to My Vigan Plan.
   - **Load this plan**: applies a trip preset and opens the My Vigan Plan drawer.
4. Runs entirely in the browser: no API key, no server, no cost. GitHub Pages hosting is unchanged.
5. The bot's knowledge comes from `js/data/vigan-data.js`, the same file that renders the site, so content edits update the bot automatically.

## 3. Non-goals

- No external AI service (Gemini, OpenAI, and so on) and no network calls.
- No answers from general world knowledge: no hotels by name, weather, live prices, opening hours, or phone numbers unless the site states them.
- No chat history saved across page reloads.
- No voice input and no languages other than English.

## 4. Anti-goals (failure even if it "works")

- The bot states anything that is not on the site, or rewords a fact so it changes meaning. For example, calling "best time to visit" the "opening hours" is a failure.
- Any existing feature changes behavior: marquee, explorer, plan drawer, lightbox, theme toggle, nav spy, reveal animations, mobile drawer.
- Any existing unit or E2E test fails or has to be weakened.
- The button or panel causes horizontal scroll, covers the header, or adds whitespace below the footer (an existing E2E check).
- The bot changes the page without the visitor clicking an action button.

## 5. Constraints

- Vanilla ES modules, no build step, no new runtime dependencies. Matches the current stack: Bootstrap 6 alpha CDN, Phosphor icons, `css/styles.css` inside `@layer custom`.
- Copy rules already enforced by `tests/preflight-audit.test.js` apply to all new HTML, CSS, JS and bot text: no em dashes or en dashes, no emojis, no `window.addEventListener('scroll')`. Use " - " as the site already does.
- The out-of-scope reply is the owner's wording: **"This information is outside the website's information."** (Capitalizing the first letter is my call.)
- New JS modules must be added to the preflight audit's `jsFiles` list so the same guardrails cover them.
- Must work in light and dark themes through the existing `--vigan-*` CSS variables, and respect `prefers-reduced-motion`.
- No markup inside the chat may use the class names `modal` or `offcanvas` (forbidden by preflight).

## 6. How it works (decided)

### 6.1 Architecture

Three new files, plus small wiring edits:

| File | Responsibility |
|---|---|
| `js/data/chatbot-knowledge.js` | Bot-only data: aliases and synonyms for landmarks and topics, intent keyword lists, small-talk replies, site-help entries, and the starter suggestion chips. (The "Why Vigan" intro and developer info are read from the page at startup, see section 9.) |
| `js/modules/chatbot-engine.js` | Pure logic with no DOM. Builds a knowledge base from site data plus `chatbot-knowledge.js`, then turns a question into a structured reply. Fully unit-testable. |
| `js/modules/chatbot.js` | The UI: floating button, chat card, message rendering, action buttons, keyboard and focus handling. It knows nothing about Vigan and gets callbacks for actions. |
| `index.html` | Add the button and panel markup before the closing `</body>` scripts. No other markup changes. |
| `css/styles.css` | Append a "Chatbot" block inside `@layer custom`. Existing rules untouched. |
| `js/main.js` | Build the knowledge base and call `initChatbot(...)` at the **end** of `bootstrapApp()`, inside its own `try/catch`. If the bot fails, every existing feature still runs. |

### 6.2 Answering engine (no AI, deterministic)

1. **Normalize** the question: lowercase, strip punctuation and accents, collapse whitespace, cap at 300 characters.
2. **Small talk first**: greetings ("hi", "hello"), thanks, and "what can you ask / help" get fixed friendly replies plus suggestion chips.
3. **Find the subject.** Match landmark names and aliases (for example "bell tower", "bantay", "syquia", "quirino", "cathedral", "church", "fountain", "national museum", "burnay", "jar", "dinosaur"), food and craft names, preset names, categories, and topic keywords. Tolerate small typos: tokens of 5 or more letters match at an edit distance of 1 (so "crisologo" still matches "crisolgo").
4. **Find the intent** for landmarks from keyword lists:

   | Intent | Example words | Field used |
   |---|---|---|
   | fee | fee, price, cost, how much, entrance, free, pay | `entryFee` |
   | best time | when, best time, what time, sunset, morning | `bestTime`, `timeSlotLabel` |
   | duration | how long, duration, stay, minutes | `durationLabel` |
   | location | where, distance, far, near, zone | `zone`, `distanceFromPlaza` |
   | highlight | highlight, must see, don't miss | `highlight` |
   | general | tell me, what is, about, or no intent found | `shortIntro` + `story` + key facts |

5. **Score and pick.** Every knowledge entry (landmark, culture item, fact, essential, FAQ, caption, preset, site help) has weighted keywords. The best entry above a fixed confidence threshold wins. Below the threshold, the bot returns the out-of-scope reply.
6. **Several matches**, such as "plaza" (Plaza Salcedo and Plaza Burgos), "museums", or "what's free": the bot answers with a short list of up to 4 items, each with its own action buttons.
7. **Follow-ups**: the engine remembers the last landmark discussed, so "how much is it?" right after "tell me about Syquia Mansion" answers about Syquia. This memory lasts until another landmark is mentioned or the page reloads.
8. **Subject matched, detail missing (owner's Option 2 decision).** When a question matches a Vigan subject or topic covered by the site, but asks for a specific detail the site does not carry (for example hotel names, room rates, phone numbers, booking links, exact opening or closing hours rather than best time to visit, food prices, or live weather forecasts), the bot replies in two parts:
   - First paragraph: `"This information is outside the website's information."`
   - Second paragraph: `"Here is what the site says about <Subject>: ..."` using the verbatim site facts for that subject (plus the subject's normal action buttons if it is a landmark or trip preset).
   When no site subject matches at all, the bot replies with `"This information is outside the website's information."` alone. Developer contact links in the site footer (`educode597@gmail.com`, portfolio, GitHub, LinkedIn) ARE on the site and are answered directly when the question is about the developer or website.
9. **Wording is honest.** Answers are templates filled with data fields, worded the way the site words them. For example, "The site suggests visiting at 9:00 AM to 11:30 AM", never "It opens at 9".

Engine interface (pure, synchronous):

```js
buildKnowledgeBase(siteData, chatbotKnowledge) -> KnowledgeBase
createConversation(kb) -> { ask(question: string) -> Reply }

Reply = {
  kind: 'answer' | 'list' | 'smalltalk' | 'partial-out-of-scope' | 'out-of-scope',
  title?: string,
  paragraphs: string[],
  items?: Array<{ title: string, text: string, actions: Action[] }>,
  actions: Action[],
  suggestions: string[]
}
Action = { type: 'view-place' | 'add-place' | 'load-preset', id: string, label: string }
```

### 6.3 Look and behavior (option A)

- **Button**: a 52px terracotta circle, fixed 20px from the bottom-right (respecting safe-area insets), Phosphor `ph-chat-circle-text` icon, `aria-label="Ask about Vigan"`, `aria-expanded`, `aria-controls`. When the card is open, the icon swaps to `ph-x`.
- **Card**: about 360 by 520px, opening above the button. Contents: header "Ask Vigan" with the subtitle "Answers from this site's guide" and a close button, a scrolling message log (`role="log"`, `aria-live="polite"`), suggestion chips, and a text input with a send button. It's a non-modal `<section role="dialog" aria-modal="false" aria-labelledby=...>`, so the page stays usable behind it.
- **Welcome message**: "Hi! Ask me anything about Vigan's landmarks, food, crafts, or planning your visit." Starter chips: "Entrance fees", "What to eat", "Plan 1 day", "How to get there".
- **Bubbles**: visitor messages right-aligned in terracotta, bot messages left-aligned on `--vigan-surface-alt`. Action buttons are small outlined pills under the bot message.
- **Typing feel**: about a 350ms "typing" dot indicator before each reply, set to 0 under `prefers-reduced-motion` and in tests (`replyDelayMs` option).
- **Keyboard and focus**: opening focuses the input. Enter sends. Esc closes and returns focus to the button. Tab order stays inside the natural DOM order; there's no focus trap because the card isn't modal.
- **Phones (under 576px)**: the card goes full-screen with its own close button, and the floating button hides while it's open.
- **Layering**: the card sits below the native modal dialogs (plan drawer, lightbox, mobile nav), which use the browser top layer and cover it automatically.
- **Light and dark** through the existing variables. The open animation is a short fade and lift, disabled under reduced motion.

### 6.4 Action buttons

- **View in explorer**: calls the existing `explorerApi.selectAndFocusPlace(id)`, unchanged. On phones the card closes first so the explorer is visible. On desktop it stays open.
- **+ Add to my plan**: calls `itineraryStore.toggleStop(id)` **only if the stop isn't already saved** (toggling would remove it). If it's already saved, the button shows "Saved in plan", disabled. The header plan count updates through the store's existing subscribers.
- **Load this plan**: calls `itineraryStore.applyPreset(id)` and then `planDrawerApi.openDrawer()`. It closes the chat card first, because the drawer is modal. When the visitor already has saved stops, the label reads "Load this plan (replaces saved stops)", since presets replace stops, the same as the drawer's own preset buttons.
- All action wiring lives in `main.js`. The UI module only receives callbacks (`onViewPlace`, `onAddPlace`, `onLoadPreset`, `isPlaceSaved`).

### 6.5 Safety

- All user text and data text is inserted with `textContent`. `innerHTML` is never used with message content.
- Empty or whitespace-only input is ignored. Input is capped at 300 characters (`maxlength` plus the engine cap).

## 7. Testing (definition of done)

- **Baseline first**: run `npm test` and `npm run test:e2e` before any change and record the results.
- **New unit tests (Vitest, jsdom)**:
  - `tests/chatbot-engine.test.js`: a table of question to expected-answer cases. Each landmark by name and alias, each intent (fee, time, duration, location, highlight), typos, multi-match lists, follow-up "it", food and crafts, FAQs, essentials, presets, site help, developer, small talk, and out-of-scope questions ("weather tomorrow", "hotel phone number", gibberish) returning the exact owner sentence.
  - A coverage test: every place, culture item, FAQ, essential, and preset in `vigan-data.js` is reachable by at least one natural question. This catches content added later without aliases.
  - A no-invention test: every fact string in a reply appears verbatim in the site data or chatbot knowledge.
  - `tests/chatbot-ui.test.js`: open, close, Esc and focus return, sending a message, chips, action buttons calling callbacks, the "Saved in plan" state, the preset label change, and that user input is rendered as text (no HTML injection).
- **Updated test**: add the three new modules to the preflight `jsFiles` list.
- **New E2E** (`tests/e2e/chatbot.spec.js`, Playwright on Edge): the button is visible on desktop and mobile; open, ask, get an answer; View in explorer selects and scrolls to the landmark; Add to my plan increments the header count; Load this plan opens the drawer; full-screen on 390px; no console errors; no horizontal overflow; no gap below the footer.
- **Done** means all old and new unit and E2E tests pass, with no existing test modified except the preflight file list.

## 8. Left to the builder

- Exact alias and synonym lists, keyword weights, and the confidence threshold. These are tuned against the test table.
- Exact CSS values within the look above, and the icon choice for the send button.
- Internal helper structure inside the three modules.

## 9. Decisions from the reviewer check (my calls, owner may override)

- **History and story facts** ("when was Syquia built", "who lived there", "what is binakul", "who is Padre Burgos"): a *history* intent (built, history, year, founded, who, named after, when was) returns that landmark's or item's full `story` or `summary` paragraph, which contains the fact verbatim. "When" alone counts as *best time* only together with visit, go, or best. The bot never pulls a single number out of the prose.
- **"Why Vigan" intro and developer info** are read from the live page at startup: `main.js` takes the text of `#why-vigan .why-intro p` and the footer developer card and passes it to `buildKnowledgeBase`. No copy lives in `chatbot-knowledge.js`, so editing `index.html` updates the bot automatically.
- **Derived answers**: the bot never sorts or rephrases facts. "What's free / entrance fees" answers with the fees FAQ answer verbatim, then lists each landmark with its `entryFee` exactly as written. The no-invention test checks every data value shown in a reply (field values, FAQ answers, bullets, page text) appears verbatim in the source. Template connective words ("The site suggests visiting at") are exempt.
- **Small screens**: the closed button and the desktop card never cover the header (the card's max height is the viewport minus the header minus 96px). Full-screen mode applies when the width is under 576px **or** the height is under 500px, so landscape phones (844x390, 932x430, 667x375) get full-screen too. Full-screen covering the header is intended.

## 10. Owner-resolved decisions

- **Topic on site, specific detail missing (Option 2 chosen by owner):** Reply with `"This information is outside the website's information."` followed by `"Here is what the site says about <topic>: ..."` using the related content from the site.
- **Look and layout (Option A chosen by owner):** Minimal 52px round floating button in the bottom-right corner that opens a compact floating chat card above it (and expands full-screen on phones / short landscape screens).
- **Interactive actions (approved by owner):** Landmark answers include `View in explorer` and `+ Add to my plan`; trip-preset answers include `Load this plan`. Actions run only when clicked.
