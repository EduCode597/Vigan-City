# "Ask Vigan" Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal, zero-server "Ask Vigan" floating chatbot (Option A: 52px round trigger button + floating chat card) that answers visitor questions accurately and exclusively from the website's own Vigan content, handles missing details honestly while sharing related site context (Option 2), and provides visitor-triggered landmark and trip-plan actions without breaking any existing functionality.

**Architecture:** Three focused Vanilla ES modules - bot-only aliases/intents/help metadata (`js/data/chatbot-knowledge.js`), a pure deterministic retrieval and intent engine (`js/modules/chatbot-engine.js`) built directly from `js/data/vigan-data.js` plus live DOM context, and an accessible non-modal floating chat card controller (`js/modules/chatbot.js`) initialized at the end of `js/main.js` inside an isolated `try/catch` guard and styled inside `@layer custom` in `css/styles.css`.

**Tech Stack:** Semantic HTML5, Bootstrap `6.0.0-alpha.1` (`@layer custom`, `[data-bs-theme]`), `@phosphor-icons/web`, Vanilla ES Modules (zero build step, zero external APIs, zero new runtime dependencies), Vitest 5 + jsdom, Playwright (Microsoft Edge).

**Spec:** `docs/superpowers/specs/2026-11-24-vigan-chatbot-design.md`

## Global Constraints

- Exact out-of-scope sentence: `"This information is outside the website's information."`
- Partial out-of-scope rule (owner's Option 2): When a question matches a Vigan subject/topic on the site but asks for an unsupported detail (phone numbers, hotel names/room rates, booking links, exact opening/closing hours rather than best time to visit, food menu prices, live weather forecasts), return `"This information is outside the website's information."` as paragraph 1 and `"Here is what the site says about <Subject>: ..."` using verbatim site facts as paragraph 2 (plus normal actions if applicable). When no site subject matches, return `"This information is outside the website's information."` alone.
- Zero external AI services, zero network calls, zero API keys, zero new `package.json` dependencies, and zero build step (`index.html` static root deployment for GitHub Pages preserved).
- Zero em-dashes (`\u2014`) and zero en-dashes (`\u2013`) anywhere in HTML, CSS, JS, or chatbot knowledge/reply templates; use `" - "`, colons, commas, or periods.
- Zero emojis (`\p{Extended_Pictographic}`) anywhere; use Phosphor Icons only.
- Zero `window.addEventListener('scroll')` listeners anywhere; add all new JS modules to `tests/preflight-audit.test.js`.
- Zero forbidden Bootstrap v5 patterns (`modal`, `offcanvas`, `data-bs-ride`); eyebrow count across the page must remain `<= 2`; marquee count must remain `1`.
- Zero `innerHTML` for user questions or reply text; render all strings via `textContent`.
- Closed chat panel (`#chatPanel[hidden]`) must be `display: none` so `gapBelowFooter <= 1` and zero horizontal overflow hold across all 16 viewports in `tests/e2e/responsive.spec.js` (`280x653` through `1440x900`). Desktop card must never overlap `.site-header` (`70px`); viewports matching `(max-width: 575.98px), (max-height: 500px)` use full-screen chat mode.
- Test runner note on this Windows/OneDrive workspace: run Vitest with `npx vitest run --pool=threads --maxWorkers=1` to avoid multi-worker fork startup timeouts.

## Review Focus

1. **History vs. best-time collision on `"when"`:** Questions like `"When was Syquia Mansion built?"` or `"When did Vigan become UNESCO?"` contain `"when"` and would misreport `bestTime` (`"9:00 AM to 11:30 AM"`) as a historical date if `"when"` naively triggers `bestTime`. `history` keywords (`built`, `founded`, `year`, `history`, `inscribed`, `who`, `named`, `when was`, `when did`) must take precedence and return the full `story`/`detail`, while `"when"` only triggers `bestTime` alongside `visit`, `go`, or `best`. (Pinned in Task 1.)
2. **Developer contact vs. unsupported-detail collision:** `"What is the developer's email?"` or `"Who created this website and how can I contact them?"` uses words (`email`, `contact`) that are out-of-scope for hotels/landmarks, yet the site footer publishes `educode597@gmail.com`, portfolio, GitHub, and LinkedIn. Developer/creator matches must answer directly from live footer context without triggering partial out-of-scope. (Pinned in Task 1.)
3. **Fuzzy-typo false positives on short words:** Edit-distance-1 matching on short tokens (`<= 4` chars) falsely equates unrelated words like `"car"` and `"jar"` or `"bus"` and `"buy"`. Single-edit typo tolerance must apply strictly to non-stopword tokens of length `>= 5`. (Pinned in Task 1.)
4. **`Escape` key collision with open top-layer `<dialog>` modals:** When the non-modal desktop chat card is open and the visitor opens `#planDrawer`, `#galleryLightbox`, or `#mobileNavDrawer` (`.showModal()`), pressing `Escape` must close only the modal `<dialog>` and must not close the background chat card or steal focus to `#chatFab`. (Pinned in Task 2.)
5. **Toggle-removal trap on `+ Add to my plan`:** `itineraryStore.toggleStop(id)` removes an already-saved stop. Clicking `+ Add to my plan` in chat must only add (never remove), and `syncActionStates()` subscribed to `itineraryStore` must flip any rendered `+ Add to my plan` button for saved stops to disabled `"Saved in plan"` immediately. (Pinned in Tasks 2, 3, and 4.)

---

### Task 1: Chatbot Knowledge Supplement & Deterministic Answering Engine

**Files:**
- Create: `js/data/chatbot-knowledge.js`
- Create: `js/modules/chatbot-engine.js`
- Test: `tests/chatbot-engine.test.js`

**Interfaces:**
- Consumes from `js/data/vigan-data.js`:
  - `PLACES`, `PLACE_CATEGORIES`, `HERITAGE_FACTS`, `CULTURE_ITEMS`, `GALLERY_ITEMS`, `TRIP_PRESETS`, `TRAVEL_ESSENTIALS`, `FAQ_ITEMS`
- Produces in `js/data/chatbot-knowledge.js`:
  - `OUT_OF_SCOPE_MESSAGE = "This information is outside the website's information."`
  - `WELCOME_MESSAGE = "Hi! Ask me anything about Vigan's landmarks, food, crafts, or planning your visit."`
  - `STARTER_SUGGESTIONS = ['Entrance fees', 'What to eat', 'Plan 1 day', 'How to get there']`
  - `CHATBOT_KNOWLEDGE`: `{ placeAliases, cultureAliases, categoryAliases, intentKeywords, unsupportedDetailPhrases, unsupportedDetailTokens, smallTalkEntries, siteHelpEntries, stopwords }`
- Produces in `js/modules/chatbot-engine.js`:
  - `normalizeQuestion(raw: string): { normalized: string, tokens: string[] }`
  - `buildKnowledgeBase(siteData, knowledge = CHATBOT_KNOWLEDGE): KnowledgeBase`
    where `siteData = { places, categories, heritageFacts, cultureItems, galleryItems, presets, travelEssentials, faqItems, pageContext?: { whyIntro?: string, developer?: { name: string, handle: string, portfolioUrl?: string, githubUrl?: string, linkedinUrl?: string, email?: string } } }`
  - `createConversation(kb: KnowledgeBase): { ask(question: string): Reply, resetContext(): void }`
    where:
    ```js
    Reply = {
      kind: 'answer' | 'list' | 'smalltalk' | 'partial-out-of-scope' | 'out-of-scope',
      title?: string,
      paragraphs: string[],
      items?: Array<{ title: string, text: string, actions: Action[] }>,
      actions: Action[],
      suggestions: string[],
      sourceSnippets?: string[]
    }
    Action = { type: 'view-place' | 'add-place' | 'load-preset', id: string, label: string }
    ```

- [ ] **Step 1: Write failing unit tests in `tests/chatbot-engine.test.js`**

Write tests covering all 10 behavior groups against the real `vigan-data.js` exports plus a sample `pageContext`:

```js
import { describe, it, expect } from 'vitest';
import * as viganData from '../js/data/vigan-data.js';
import {
  OUT_OF_SCOPE_MESSAGE,
  WELCOME_MESSAGE,
  STARTER_SUGGESTIONS,
  CHATBOT_KNOWLEDGE
} from '../js/data/chatbot-knowledge.js';
import {
  normalizeQuestion,
  buildKnowledgeBase,
  createConversation
} from '../js/modules/chatbot-engine.js';

const SAMPLE_PAGE_CONTEXT = {
  whyIntro:
    'While most Spanish-era urban centers in the archipelago were flattened during World War II, Vigan survived intact.',
  developer: {
    name: 'John Eduard Madriaga',
    handle: '@EduCode597',
    portfolioUrl: 'https://educode597.github.io/',
    githubUrl: 'https://github.com/EduCode597',
    linkedinUrl: 'https://www.linkedin.com/in/john-eduard-madriaga-710198396/',
    email: 'educode597@gmail.com'
  }
};
```

Include explicit assertions in `tests/chatbot-engine.test.js` for:
1. `normalizeQuestion`: lowercases, strips punctuation and diacritics, collapses spaces, truncates inputs over 300 chars.
2. Small talk (`"hello"`, `"thanks"`, `"what can I ask?"`): `kind === 'smalltalk'`, non-empty `suggestions`.
3. Landmark general + specific intents on `syquia-mansion` and `bantay-bell-tower`:
   - `"Tell me about Bantay Bell Tower"` -> `kind === 'answer'`, mentions `1591`, `4:30 PM to 5:45 PM`, `Voluntary donation`, includes `view-place` and `add-place` actions for `'bantay-bell-tower'`.
   - `"How much is Syquia Mansion entrance fee?"` -> mentions `'PHP 30 entrance'`.
   - `"Best time to visit Plaza Salcedo?"` -> mentions `'7:30 PM fountain show'`.
   - `"How long to stay at Hidden Garden?"` -> mentions `'60 to 90 min'`.
   - `"Where is Pagburnayan and how far from the plaza?"` -> mentions `'Liberation Boulevard'` and `'8 min ride'`.
   - `"What is the highlight of Padre Burgos House?"` -> mentions `'1821 Basi Revolt painting gallery'`.
4. Review Focus #1 (`history` vs `bestTime`): `"When was Syquia Mansion built?"` returns `story` containing `'1830'` and `'Elpidio Quirino'`, and does NOT answer with `'9:00 AM to 11:30 AM'` alone.
5. Review Focus #3 (typo tolerance): `"Tell me about Calle Crisolgo"` (`>= 5` letters, 1 edit) matches `'calle-crisologo'`, whereas `"Where can I rent a car in Tokyo?"` does NOT fuzzy-match `"car"` to `"jar"` (`pagburnayan`) and returns pure `out-of-scope`.
6. Multi-match / category / fee lists: `"Tell me about Vigan plazas"` returns `kind === 'list'` including both `Plaza Salcedo` and `Plaza Burgos`; `"Ancestral museums"` lists the 3 museums; `"Entrance fees"` includes the `faq-fees` answer verbatim plus landmark `entryFee` values.
7. Conversational follow-ups: asking `"Tell me about Syquia Mansion"` followed by `"How much is it?"` and `"How far is it?"` answers for `syquia-mansion`, then asking `"What about Bantay Bell Tower?"` switches follow-up context to `bantay-bell-tower`.
8. Option 2 partial out-of-scope vs. pure out-of-scope + Review Focus #2:
   - `"What is the phone number of a hotel in Vigan?"` -> `kind === 'partial-out-of-scope'`, `paragraphs[0] === OUT_OF_SCOPE_MESSAGE`, `paragraphs[1]` starts with `'Here is what the site says about'` and includes `'Restored ancestral inns right on or one block off Calle Crisologo'`.
   - `"What time does Syquia Mansion open?"` -> `kind === 'partial-out-of-scope'`, `paragraphs[0] === OUT_OF_SCOPE_MESSAGE`, `paragraphs[1]` includes `'9:00 AM to 11:30 AM'` framed as best time to visit, never claiming opening hours.
   - `"How much does bagnet cost?"` -> `kind === 'partial-out-of-scope'`, `paragraphs[0] === OUT_OF_SCOPE_MESSAGE`, `paragraphs[1]` includes `Crispy Ilocano Bagnet` summary.
   - `"What is the developer's email?"` -> `kind === 'answer'` (NOT out-of-scope), includes `'John Eduard Madriaga'` and `'educode597@gmail.com'`.
   - `"What is the capital of France?"` and `"asdfghjkl"` and `"<script>alert(1)</script>"` -> `kind === 'out-of-scope'`, `paragraphs` equals `[OUT_OF_SCOPE_MESSAGE]`.
9. Full site-data reachability: loop over every item in `PLACES`, `HERITAGE_FACTS`, `CULTURE_ITEMS`, `GALLERY_ITEMS`, `TRIP_PRESETS`, `TRAVEL_ESSENTIALS`, and `FAQ_ITEMS`, ask a natural question derived from its title/name/question, and assert `reply.kind` is `'answer'` or `'list'` containing verbatim text from that item (and `load-preset` action for `TRIP_PRESETS`).
10. Copy & verbatim no-invention guardrails:
    - Assert zero `\u2014`, zero `\u2013`, and zero `\p{Extended_Pictographic}` across `WELCOME_MESSAGE`, `OUT_OF_SCOPE_MESSAGE`, `STARTER_SUGGESTIONS`, `CHATBOT_KNOWLEDGE`, and every generated reply in the test suite.
    - Flatten all string values from `viganData`, `SAMPLE_PAGE_CONTEXT`, and `CHATBOT_KNOWLEDGE` into a source corpus; for every `answer`, `list`, and `partial-out-of-scope` reply in the suite, assert each `sourceSnippets` entry on the reply is a non-empty verbatim substring of both the source corpus and the rendered reply text (guaranteeing every stated fact comes word-for-word from site data).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --pool=threads --maxWorkers=1 tests/chatbot-engine.test.js`
Expected: FAIL with `Cannot find module '../js/data/chatbot-knowledge.js'`.

- [ ] **Step 3: Implement `js/data/chatbot-knowledge.js` and `js/modules/chatbot-engine.js`**

Implementation rules where the signatures leave algorithmic choices:
- In `js/data/chatbot-knowledge.js`: define alias arrays for all 11 place IDs (e.g. `bantay-bell-tower`: `['bantay', 'bell tower', 'belfry', 'watchtower']`; `st-paul-cathedral`: `['cathedral', 'church', 'st paul', 'earthquake baroque']`; `padre-burgos-house`: `['national museum', 'padre burgos', 'basi revolt', 'jose burgos']`; `pagburnayan`: `['jar factory', 'pottery', 'burnay kiln', 'dragon kiln']`; `baluarte`: `['safari', 'zoo', 'dinosaur']`; `plaza-salcedo`: `['dancing fountain', 'fountain show', 'obelisk', 'juan de salcedo']`; `plaza-burgos`: `['street food plaza', 'empanada stalls', 'sinanglao', 'okoy']`), culture aliases (`abel`, `inabel`, `binakul`, `empanada`, `bagnet`, `kbl`, `longganisa`, `sausage`, `burnay`, `sukang iloko`, `basi`), category aliases, intent keywords (`history` checked before `bestTime`; bare `'when'` excluded from `bestTime` unless `'visit'`, `'go'`, or `'best'` is also present), unsupported-detail phrases/tokens, small-talk patterns, and site-help entries (`explorer`, `my vigan plan`, `dark mode`, `photo archive`).
- In `js/modules/chatbot-engine.js`:
  - Score entries deterministically using exact phrase hits (highest weight), exact token hits (medium weight), and 1-edit Levenshtein token hits restricted strictly to tokens with `token.length >= 5` and not in `stopwords` (low weight).
  - Resolve pronouns (`it`, `there`, `that place`, `this landmark`, `its`) against `lastPlaceId` when no new subject scores above threshold and a landmark intent (`fee`, `bestTime`, `duration`, `location`, `highlight`, `history`) is present.
  - Check unsupported-detail triggers AFTER identifying the best subject match: skip unsupported-detail downgrade when the winning entry is `developer` or `site-help`; also trigger partial out-of-scope when `intent === 'fee'` and the winning entry is a `culture` or `gallery` item (which carries no price data).
  - Format landmark replies with honest site labels (`"Best time to visit: ..."`, `"Typical stay: ..."`, `"Entry: ..."`, `"Location: ..."`), never `"Opening hours"`. Attach `[ { type: 'view-place', id, label: 'View in explorer' }, { type: 'add-place', id, label: '+ Add to my plan' } ]` to landmark answers/list items, and `[ { type: 'load-preset', id, label: 'Load this plan' } ]` to preset answers/list items.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --pool=threads --maxWorkers=1 tests/chatbot-engine.test.js`
Expected: PASS (all chatbot engine, reachability, typo, partial-out-of-scope, and guardrail assertions green).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-11-24-vigan-chatbot-design.md docs/superpowers/plans/2026-11-24-vigan-chatbot.md js/data/chatbot-knowledge.js js/modules/chatbot-engine.js tests/chatbot-engine.test.js
git commit -m "feat: add deterministic Vigan chatbot knowledge base and engine"
```

---

### Task 2: Floating Chat Card UI Module (Option A)

**Files:**
- Create: `js/modules/chatbot.js`
- Test: `tests/chatbot-ui.test.js`

**Interfaces:**
- Consumes:
  - `conversation`: `{ ask(question: string): Reply, resetContext?(): void }` from Task 1
  - `WELCOME_MESSAGE`, `STARTER_SUGGESTIONS` from Task 1
- Produces in `js/modules/chatbot.js`:
  - `initChatbot(options): ChatbotApi`
    ```js
    initChatbot({
      conversation,
      fabEl,
      panelEl,
      closeBtn,
      messagesEl,
      suggestionsEl,
      formEl,
      inputEl,
      welcomeMessage = '',
      starterSuggestions = [],
      onViewPlace = () => {},
      onAddPlace = () => {},
      onLoadPreset = () => {},
      isPlaceSaved = () => false,
      hasAnySavedStops = () => false,
      replyDelayMs = 320,
      matchMedia = typeof window !== 'undefined' ? window.matchMedia?.bind(window) : null
    }) -> {
      open(): void,
      close(options?: { restoreFocus?: boolean }): void,
      toggle(): void,
      isOpen(): boolean,
      sendQuestion(text: string): void,
      syncActionStates(): void,
      destroy(): void
    }
    ```

- [ ] **Step 1: Write failing DOM unit tests in `tests/chatbot-ui.test.js`**

Write jsdom tests verifying:
1. Initial closed state: `panelEl.hidden === true`, `fabEl.getAttribute('aria-expanded') === 'false'`, welcome message and `starterSuggestions` rendered inside `panelEl`.
2. Open / close / focus cycle: clicking `fabEl` sets `panelEl.hidden = false`, `fabEl.classList.contains('is-open') === true`, `aria-expanded="true"`, swaps icon class from `ph-chat-circle-text` to `ph-x`, and focuses `inputEl`; clicking `closeBtn` or pressing `Escape` closes the panel and restores focus to `fabEl`.
3. Review Focus #4 (`Escape` with open `<dialog>`): append `<dialog open id="planDrawer"></dialog>` to `document.body`; dispatch `keydown` `Escape` on `document` while chat is open; assert `api.isOpen()` remains `true` so native modal dialogs own `Escape` first. Remove `open` from `<dialog>`, press `Escape` again, and assert `api.isOpen()` becomes `false`.
4. Submitting a question (`replyDelayMs: 0`): ignores `""` and `"   "`; submitting `"Tell me about Syquia Mansion"` appends a `.vigan-chat-msg-user` bubble and a `.vigan-chat-msg-bot` bubble, clears `inputEl`, updates suggestion chips from `reply.suggestions`, and renders `view-place` and `add-place` buttons.
5. XSS safety: submitting `"<img src=x onerror=alert(1)>"` renders literal text in `messagesEl.textContent` with `messagesEl.querySelectorAll('img').length === 0`.
6. Review Focus #5 (`+ Add to my plan` & `syncActionStates()`): clicking `[data-chat-action="add-place"]` calls `onAddPlace('syquia-mansion')` once; when `isPlaceSaved('syquia-mansion')` returns `true` and `api.syncActionStates()` runs, the button text becomes `'Saved in plan'`, `disabled === true`, and clicking it again does NOT call `onAddPlace`.
7. Preset button label & modal handoff: when `hasAnySavedStops()` is `false`, `[data-chat-action="load-preset"]` reads `'Load this plan'`; when `hasAnySavedStops()` is `true` and `syncActionStates()` runs (or a new preset reply renders), it reads `'Load this plan (replaces saved stops)'`; clicking it closes the chat panel first and calls `onLoadPreset('one-day-classic')`.
8. Compact viewport behavior on `View in explorer`: when `matchMedia` reports `matches: false` (desktop), clicking `View in explorer` keeps `api.isOpen() === true` and calls `onViewPlace(id)`; when `matchMedia` reports `matches: true` for `(max-width: 575.98px), (max-height: 500px)`, clicking `View in explorer` closes the panel first (`api.isOpen() === false`) and calls `onViewPlace(id)`.
9. Typing delay + reduced motion: with `replyDelayMs: 250` and fake timers, a `[data-chat-typing]` indicator appears immediately and is replaced by the bot reply after `250ms`; when `matchMedia('(prefers-reduced-motion: reduce)')` matches, the reply renders synchronously (`0ms`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --pool=threads --maxWorkers=1 tests/chatbot-ui.test.js`
Expected: FAIL with `Cannot find module '../js/modules/chatbot.js'`.

- [ ] **Step 3: Implement `js/modules/chatbot.js`**

Key DOM contracts for `js/modules/chatbot.js` (consumed by CSS in Task 3 and E2E tests in Task 4):
- Message bubbles use `.vigan-chat-msg` with modifier `.vigan-chat-msg-user` or `.vigan-chat-msg-bot` (and `.vigan-chat-typing` with `[data-chat-typing]` while pending).
- Multi-item replies (`reply.items`) render a `<ul class="vigan-chat-list">` where each `<li>` shows `<strong>` (`item.title`), `<span>` (`item.text`), and any per-item action buttons.
- Action buttons use `button.vigan-chat-action.focus-ring` with `data-chat-action="view-place" | "add-place" | "load-preset"` and `data-action-id="<id>"`.
- Suggestion chips use `button.vigan-chat-chip.focus-ring` with `data-chat-suggestion="<text>"`.
- All DOM nodes are built with `document.createElement` and `textContent`; scroll `messagesEl.scrollTop = messagesEl.scrollHeight` when available.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --pool=threads --maxWorkers=1 tests/chatbot-ui.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/modules/chatbot.js tests/chatbot-ui.test.js
git commit -m "feat: add accessible Ask Vigan floating chat card UI module"
```

---

### Task 3: HTML Markup, `@layer custom` Styles, `main.js` Wiring & Preflight Audit

**Files:**
- Modify: `tests/preflight-audit.test.js:55-68`
- Modify: `index.html:569-582`
- Modify: `css/styles.css:1870-1871`
- Modify: `js/main.js:1-20,280-286`
- Modify: `README.md:10-52`

**Interfaces:**
- Consumes: `CHATBOT_KNOWLEDGE`, `WELCOME_MESSAGE`, `STARTER_SUGGESTIONS` from `js/data/chatbot-knowledge.js`; `buildKnowledgeBase`, `createConversation` from `js/modules/chatbot-engine.js`; `initChatbot` from `js/modules/chatbot.js`; existing `itineraryStore`, `planDrawerApi`, `explorerApi` in `js/main.js`.
- Produces: Live `#chatFab` and `#chatPanel` in `index.html`, `@layer custom` chatbot styling in `css/styles.css`, isolated initialization in `js/main.js`, updated `README.md`, and expanded static guardrails in `tests/preflight-audit.test.js`.

- [ ] **Step 1: Extend `tests/preflight-audit.test.js` with failing chatbot preflight assertions**

Add `'js/data/chatbot-knowledge.js'`, `'js/modules/chatbot-engine.js'`, and `'js/modules/chatbot.js'` to `jsFiles` in `tests/preflight-audit.test.js` (checking zero `addEventListener('scroll')`, zero `\u2014`/`\u2013`, zero emojis across all 3 files), and add a test asserting:
```js
it('includes accessible non-modal Ask Vigan chatbot markup and hidden-state CSS without breaking v6 guardrails', () => {
  const html = readText('index.html');
  const css = readText('css/styles.css');

  expect(html).toContain('id="chatFab"');
  expect(html).toContain('aria-label="Ask about Vigan"');
  expect(html).toContain('aria-controls="chatPanel"');
  expect(html).toContain('id="chatPanel"');
  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-modal="false"');
  expect(css).toContain('.vigan-chat-panel[hidden]');
});
```

- [ ] **Step 2: Run preflight audit to verify it fails**

Run: `npx vitest run --pool=threads --maxWorkers=1 tests/preflight-audit.test.js`
Expected: FAIL (`expect(html).toContain('id="chatFab"')`).

- [ ] **Step 3: Add chatbot markup to `index.html`, append `@layer custom` styles to `css/styles.css`, wire `js/main.js`, and update `README.md`**

- **`index.html`** (insert immediately after `</dialog>` of `#galleryLightbox` and before Bootstrap ESM `<script>`):
  ```html
    <!-- Ask Vigan Floating Chatbot (Option A: Round FAB + Non-Modal Floating Card) -->
    <button
      type="button"
      id="chatFab"
      class="vigan-chat-fab focus-ring"
      aria-label="Ask about Vigan"
      aria-haspopup="dialog"
      aria-controls="chatPanel"
      aria-expanded="false"
    >
      <i class="ph ph-chat-circle-text" data-chat-fab-icon aria-hidden="true"></i>
    </button>

    <section
      id="chatPanel"
      class="vigan-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="chatPanelTitle"
      hidden
    >
      <div class="vigan-chat-header">
        <div>
          <h2 class="vigan-chat-title" id="chatPanelTitle">Ask Vigan</h2>
          <p class="vigan-chat-subtitle">Answers from this site's guide</p>
        </div>
        <button
          type="button"
          id="chatCloseBtn"
          class="btn-close vigan-chat-close focus-ring"
          aria-label="Close Ask Vigan chat"
        ></button>
      </div>

      <div
        id="chatMessages"
        class="vigan-chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      ></div>

      <div
        id="chatSuggestions"
        class="vigan-chat-suggestions"
        aria-label="Suggested questions"
      ></div>

      <form id="chatForm" class="vigan-chat-form" novalidate>
        <input
          id="chatInput"
          type="text"
          class="vigan-chat-input focus-ring"
          placeholder="Ask about Vigan..."
          maxlength="300"
          autocomplete="off"
          aria-label="Ask a question about Vigan"
        />
        <button
          type="submit"
          class="vigan-chat-send focus-ring"
          aria-label="Send question"
        >
          <i class="ph ph-paper-plane-right" aria-hidden="true"></i>
        </button>
      </form>
    </section>
  ```
- **`css/styles.css`** (append inside `@layer custom` right before its closing `}`):
  - `.vigan-chat-panel[hidden] { display: none !important; }`
  - `.vigan-chat-fab`: `position: fixed; z-index: 95; width: 52px; height: 52px; border-radius: 50%; inset-inline-end: max(20px, env(safe-area-inset-right, 0px)); inset-block-end: max(20px, env(safe-area-inset-bottom, 0px)); background-color: var(--vigan-accent); color: var(--vigan-accent-contrast); border: 1px solid var(--vigan-accent); box-shadow: var(--vigan-shadow-hover);`
  - `.vigan-chat-panel`: `position: fixed; z-index: 95; inset-inline-end: max(20px, env(safe-area-inset-right, 0px)); inset-block-end: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 64px); width: min(360px, calc(100vw - 2.5rem)); height: min(520px, calc(100dvh - 166px)); max-height: calc(100dvh - 166px); background-color: var(--vigan-surface); color: var(--vigan-ink); border: 1px solid var(--vigan-border); border-radius: var(--vigan-radius); box-shadow: var(--vigan-shadow-hover); display: flex; flex-direction: column; overflow: hidden;` (`166px` reserves `70px` sticky header + `12px` top clearance + `64px` FAB offset + `20px` bottom inset so the desktop card never touches `.site-header`).
  - Full-screen small/landscape rule `@media (max-width: 575.98px), (max-height: 500px)`: `.vigan-chat-panel` expands to `inset: 0; width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; border: 0; z-index: 150;` with safe-area padding on header/form, and `.vigan-chat-fab.is-open { display: none; }`.
  - Touch target rule inside `@media (pointer: coarse), (max-width: 991.98px)`: `.vigan-chat-close`, `.vigan-chat-send`, `.vigan-chat-action`, `.vigan-chat-chip`, `.vigan-chat-input` have `min-height: 44px` (and `min-width: 44px` on icon buttons).
  - `@media (prefers-reduced-motion: reduce)`: disable chat open/hover transitions.
- **`js/main.js`**:
  - Write `extractPageContext(doc = document)` reading `#why-vigan .why-intro p` and `.footer-dev-card` (`name`, `handle`, `portfolioUrl`, `githubUrl`, `linkedinUrl`, `email`).
  - At the very end of `bootstrapApp()` (after `initNavSpy`), wrap chatbot setup in `try { ... } catch (err) { console.error('Ask Vigan chatbot failed to initialize:', err); }`: build `kb`, `conversation`, call `initChatbot(...)` with `onViewPlace: (id) => explorerApi.selectAndFocusPlace(id)`, `onAddPlace: (id) => { if (!itineraryStore.hasStop(id)) itineraryStore.toggleStop(id); }`, `onLoadPreset: (id) => { itineraryStore.applyPreset(id); planDrawerApi.openDrawer(); }`, `isPlaceSaved: (id) => itineraryStore.hasStop(id)`, `hasAnySavedStops: () => itineraryStore.getSavedIds().length > 0`, and subscribe `itineraryStore.subscribe(() => chatApi.syncActionStates())`.
- **`README.md`**: add a bullet under `## Highlights` for the Ask Vigan Guide Chatbot and list the 3 new JS files + new tests under `## Project Structure`.

- [ ] **Step 4: Run the full Vitest unit & preflight suite**

Run: `npx vitest run --pool=threads --maxWorkers=1`
Expected: PASS across all 9 test files (7 original + `chatbot-engine.test.js` + `chatbot-ui.test.js`).

- [ ] **Step 5: Commit**

```bash
git add index.html css/styles.css js/main.js README.md tests/preflight-audit.test.js
git commit -m "feat: wire Ask Vigan floating chatbot into page, styles, and preflight audit"
```

---

### Task 4: End-to-End Playwright Chatbot & Zero-Regression Verification

**Files:**
- Create: `tests/e2e/chatbot.spec.js`
- Test: `tests/e2e/chatbot.spec.js`, `tests/e2e/site.spec.js`, `tests/e2e/responsive.spec.js`

**Interfaces:**
- Consumes: Live served root site (`http://127.0.0.1:4173` via `playwright.config.js` Vite server) and DOM IDs/attributes from Tasks 2-3 (`#chatFab`, `#chatPanel`, `#chatCloseBtn`, `#chatMessages`, `#chatSuggestions`, `#chatInput`, `[data-chat-action]`, `[data-chat-suggestion]`).
- Produces: End-to-end browser proof across desktop, portrait phone, landscape phone, dark mode, and full regression suite.

- [ ] **Step 1: Write `tests/e2e/chatbot.spec.js`**

Include 3 focused Playwright tests:
1. **`desktop floating card answers Vigan questions, runs explorer/plan actions, and keeps layout clean`**:
   - Viewport `1440x900`, track `pageerror` and `console` errors (`expect(errors).toEqual([])`).
   - Verify `#chatFab` is `52x52`, visible in bottom-right, `#chatPanel` is hidden, `gapBelowFooter <= 1`, and `horizontalOverflow === false`.
   - Click `#chatFab` -> `#chatPanel` opens (`width <= 360`), top edge `>= 70` (never covers `.site-header`), welcome message and 4 starter chips visible, `#chatInput` focused.
   - Ask `"Tell me about Bantay Bell Tower"` -> bot reply contains `'1591'`, `'4:30 PM to 5:45 PM'`, and `'Voluntary donation'`.
   - Click `[data-chat-action="add-place"][data-action-id="bantay-bell-tower"]` -> `#planTriggerBtn [data-plan-count]` becomes `'1'`, button becomes disabled with text `'Saved in plan'`.
   - Click `[data-chat-action="view-place"][data-action-id="bantay-bell-tower"]` -> `#explorerSpotlight .spotlight-title` has text `'Bantay Bell Tower'` while `#chatPanel` stays open on desktop.
   - Ask `"What is the phone number of a hotel?"` -> reply contains both `"This information is outside the website's information."` and `"Here is what the site says about"`.
   - Ask `"What is the capital of France?"` -> reply contains `"This information is outside the website's information."` and does NOT contain `"Here is what the site says about"`.
   - Click chip or ask `"Plan 1 day"` -> preset button reads `'Load this plan (replaces saved stops)'` -> click it -> `#chatPanel` closes, `#planDrawer` opens (`[open]`), `#planTriggerBtn [data-plan-count]` reads `'5'`.
2. **`mobile portrait (390x844) and landscape (844x390) open full-screen, close on View in explorer, and restore focus on Escape`**:
   - At `390x844`: open `#chatFab`, assert `#chatPanel` bounding box matches `390x844` (`x === 0`, `y === 0`), `#chatFab` is hidden while open; click chip `'Entrance fees'`, then ask `"Syquia Mansion"` and click `View in explorer` -> `#chatPanel` closes automatically and `#explorerSpotlight .spotlight-title` shows `'Syquia Mansion Museum'`.
   - At `844x390`: open `#chatFab`, assert `#chatPanel` bounding box fills `844x390`; press `Escape` -> `#chatPanel` closes and `#chatFab` is focused.
3. **`dark mode theme toggle styles chat panel cleanly without contrast or console issues`**:
   - Toggle header `[data-theme-toggle]` to `dark`, open `#chatFab`, assert computed `backgroundColor` of `#chatPanel` matches dark surface (`rgb(23, 28, 34)`).

- [ ] **Step 2: Run full Playwright E2E suite (new chatbot spec + existing site and 16-viewport responsive suites)**

Run: `npx playwright test`
Expected: PASS across `tests/e2e/chatbot.spec.js`, `tests/e2e/site.spec.js`, and all 16 viewports in `tests/e2e/responsive.spec.js` (0 failures).

- [ ] **Step 3: Run full Vitest unit suite one final time if any edits were needed, otherwise verify clean git status**

Run: `npx vitest run --pool=threads --maxWorkers=1`
Expected: PASS (all 9 test files green).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/chatbot.spec.js
git commit -m "test: add Playwright E2E suite for Ask Vigan chatbot"
```
