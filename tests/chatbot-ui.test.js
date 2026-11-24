import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as viganData from '../js/data/vigan-data.js';
import { WELCOME_MESSAGE, STARTER_SUGGESTIONS } from '../js/data/chatbot-knowledge.js';
import { buildKnowledgeBase, createConversation } from '../js/modules/chatbot-engine.js';
import { initChatbot } from '../js/modules/chatbot.js';

function createRealConversation() {
  const kb = buildKnowledgeBase({
    places: viganData.PLACES,
    categories: viganData.PLACE_CATEGORIES,
    heritageFacts: viganData.HERITAGE_FACTS,
    cultureItems: viganData.CULTURE_ITEMS,
    galleryItems: viganData.GALLERY_ITEMS,
    presets: viganData.TRIP_PRESETS,
    travelEssentials: viganData.TRAVEL_ESSENTIALS,
    faqItems: viganData.FAQ_ITEMS,
    pageContext: {
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
    }
  });
  return createConversation(kb);
}

function createChatDom() {
  document.body.innerHTML = `
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
  `;

  return {
    fabEl: document.getElementById('chatFab'),
    panelEl: document.getElementById('chatPanel'),
    closeBtn: document.getElementById('chatCloseBtn'),
    messagesEl: document.getElementById('chatMessages'),
    suggestionsEl: document.getElementById('chatSuggestions'),
    formEl: document.getElementById('chatForm'),
    inputEl: document.getElementById('chatInput')
  };
}

function submitQuestion(dom, text) {
  dom.inputEl.value = text;
  dom.formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Ask Vigan floating chat card UI module', () => {
  let activeApi = null;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    activeApi?.destroy();
    activeApi = null;
    vi.useRealTimers();
  });

  it('starts closed with aria-expanded="false", welcome message, and starter suggestions inside panelEl', () => {
    const dom = createChatDom();
    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      replyDelayMs: 0
    });

    expect(activeApi.isOpen()).toBe(false);
    expect(dom.panelEl.hidden).toBe(true);
    expect(dom.fabEl.getAttribute('aria-expanded')).toBe('false');
    expect(dom.fabEl.classList.contains('is-open')).toBe(false);

    const icon = dom.fabEl.querySelector('[data-chat-fab-icon]');
    expect(icon.classList.contains('ph-chat-circle-text')).toBe(true);
    expect(icon.classList.contains('ph-x')).toBe(false);

    expect(dom.panelEl.textContent).toContain(WELCOME_MESSAGE);
    const chips = Array.from(dom.panelEl.querySelectorAll('[data-chat-suggestion]'));
    expect(chips.map((c) => c.dataset.chatSuggestion)).toEqual(STARTER_SUGGESTIONS);
    expect(chips.map((c) => c.textContent)).toEqual(STARTER_SUGGESTIONS);
    expect(chips.every((c) => c.classList.contains('vigan-chat-chip') && c.classList.contains('focus-ring'))).toBe(
      true
    );
  });

  it('opens on FAB click, swaps icon to ph-x, focuses inputEl, and restores focus to FAB on closeBtn or Escape', () => {
    const dom = createChatDom();
    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      replyDelayMs: 0
    });

    const icon = dom.fabEl.querySelector('[data-chat-fab-icon]');

    dom.fabEl.click();
    expect(activeApi.isOpen()).toBe(true);
    expect(dom.panelEl.hidden).toBe(false);
    expect(dom.fabEl.classList.contains('is-open')).toBe(true);
    expect(dom.fabEl.getAttribute('aria-expanded')).toBe('true');
    expect(icon.classList.contains('ph-x')).toBe(true);
    expect(icon.classList.contains('ph-chat-circle-text')).toBe(false);
    expect(document.activeElement).toBe(dom.inputEl);

    dom.closeBtn.click();
    expect(activeApi.isOpen()).toBe(false);
    expect(dom.panelEl.hidden).toBe(true);
    expect(dom.fabEl.classList.contains('is-open')).toBe(false);
    expect(dom.fabEl.getAttribute('aria-expanded')).toBe('false');
    expect(icon.classList.contains('ph-chat-circle-text')).toBe(true);
    expect(icon.classList.contains('ph-x')).toBe(false);
    expect(document.activeElement).toBe(dom.fabEl);

    dom.fabEl.click();
    expect(activeApi.isOpen()).toBe(true);
    expect(document.activeElement).toBe(dom.inputEl);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(activeApi.isOpen()).toBe(false);
    expect(dom.panelEl.hidden).toBe(true);
    expect(document.activeElement).toBe(dom.fabEl);
  });

  it('does not close on Escape while a native <dialog open> is active, and closes once dialog closes (Review Focus #4)', () => {
    const dom = createChatDom();
    const dialog = document.createElement('dialog');
    dialog.id = 'planDrawer';
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);

    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      replyDelayMs: 0
    });

    activeApi.open();
    expect(activeApi.isOpen()).toBe(true);
    expect(document.activeElement).toBe(dom.inputEl);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(activeApi.isOpen()).toBe(true);
    expect(dom.panelEl.hidden).toBe(false);
    expect(document.activeElement).toBe(dom.inputEl);

    dialog.removeAttribute('open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(activeApi.isOpen()).toBe(false);
    expect(dom.panelEl.hidden).toBe(true);
    expect(document.activeElement).toBe(dom.fabEl);
  });

  it('ignores blank submits, appends user/bot bubbles, clears input, updates suggestion chips, and renders title/list/actions', () => {
    const dom = createChatDom();
    const conversation = createRealConversation();
    const askSpy = vi.spyOn(conversation, 'ask');

    activeApi = initChatbot({
      conversation,
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      replyDelayMs: 0
    });

    activeApi.open();

    submitQuestion(dom, '');
    submitQuestion(dom, '   ');
    expect(askSpy).not.toHaveBeenCalled();
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-user')).toHaveLength(0);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')).toHaveLength(1);

    submitQuestion(dom, 'Tell me about Syquia Mansion');
    expect(dom.inputEl.value).toBe('');
    expect(askSpy).toHaveBeenCalledWith('Tell me about Syquia Mansion');

    const userBubbles = dom.messagesEl.querySelectorAll('.vigan-chat-msg-user');
    const botBubbles = dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot');
    expect(userBubbles).toHaveLength(1);
    expect(userBubbles[0].textContent).toBe('Tell me about Syquia Mansion');
    expect(botBubbles).toHaveLength(2);

    const latestBot = botBubbles[1];
    const replyTitle = latestBot.querySelector('.vigan-chat-reply-title');
    expect(replyTitle?.tagName).toBe('STRONG');
    expect(replyTitle?.textContent).toBe('Syquia Mansion Museum');
    expect(latestBot.querySelectorAll('p').length).toBeGreaterThan(0);

    const actionsWrap = latestBot.querySelector('.vigan-chat-actions');
    expect(actionsWrap).not.toBeNull();
    const viewBtn = actionsWrap.querySelector('[data-chat-action="view-place"][data-action-id="syquia-mansion"]');
    const addBtn = actionsWrap.querySelector('[data-chat-action="add-place"][data-action-id="syquia-mansion"]');
    expect(viewBtn?.classList.contains('vigan-chat-action')).toBe(true);
    expect(viewBtn?.classList.contains('focus-ring')).toBe(true);
    expect(addBtn?.classList.contains('vigan-chat-action')).toBe(true);
    expect(addBtn?.classList.contains('focus-ring')).toBe(true);

    const updatedChips = Array.from(dom.suggestionsEl.querySelectorAll('[data-chat-suggestion]')).map(
      (btn) => btn.dataset.chatSuggestion
    );
    expect(updatedChips).toContain('How much is Syquia Mansion Museum?');
    expect(updatedChips).not.toEqual(STARTER_SUGGESTIONS);

    // Clicking a suggestion chip asks that question and keeps focus inside chat
    dom.suggestionsEl.querySelector('[data-chat-suggestion="How much is Syquia Mansion Museum?"]').click();
    const feeBot = dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')[2];
    expect(feeBot.textContent).toContain('PHP 30 entrance');

    // Multi-item list reply via question
    submitQuestion(dom, 'Ancestral museums');
    const listBot = dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')[3];
    const listEl = listBot.querySelector('ul.vigan-chat-list');
    expect(listEl).not.toBeNull();
    const listItems = listEl.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(listItems[0].querySelector('strong')?.textContent).toBe('Syquia Mansion Museum');
    expect(listItems[0].querySelector('span')?.textContent).toContain('PHP 30 entrance');
    expect(listItems[0].querySelector('[data-chat-action="view-place"]')).not.toBeNull();
    expect(listItems[0].querySelector('[data-chat-action="add-place"]')).not.toBeNull();

    // Smalltalk without Reply.title omits .vigan-chat-reply-title
    submitQuestion(dom, 'hello');
    const smallTalkBot = dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')[4];
    expect(smallTalkBot.querySelector('.vigan-chat-reply-title')).toBeNull();
  });

  it('renders user input and reply text safely with textContent (XSS protection)', () => {
    const dom = createChatDom();
    const xssPayload = '<img src=x onerror=alert(1)>';
    const xssConversation = {
      ask: vi.fn(() => ({
        kind: 'out-of-scope',
        title: '',
        paragraphs: [`Echo: ${xssPayload}`],
        actions: [],
        suggestions: [xssPayload]
      }))
    };

    activeApi = initChatbot({
      conversation: xssConversation,
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      replyDelayMs: 0
    });

    activeApi.open();
    submitQuestion(dom, xssPayload);

    expect(dom.messagesEl.textContent).toContain(xssPayload);
    expect(dom.messagesEl.querySelectorAll('img')).toHaveLength(0);
    expect(dom.messagesEl.querySelectorAll('script')).toHaveLength(0);
    expect(dom.suggestionsEl.querySelectorAll('img')).toHaveLength(0);
  });

  it('syncs "+ Add to my plan" buttons via isPlaceSaved and prevents duplicate clicks (Review Focus #5)', () => {
    const dom = createChatDom();
    const saved = new Set();
    const onAddPlace = vi.fn((id) => saved.add(id));

    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      onAddPlace,
      isPlaceSaved: (id) => saved.has(id),
      replyDelayMs: 0
    });

    activeApi.open();
    submitQuestion(dom, 'Tell me about Syquia Mansion');

    const addBtn = dom.messagesEl.querySelector(
      '[data-chat-action="add-place"][data-action-id="syquia-mansion"]'
    );
    expect(addBtn.disabled).toBe(false);
    expect(addBtn.classList.contains('is-saved')).toBe(false);
    expect(addBtn.textContent).toBe('+ Add to my plan');

    addBtn.click();
    expect(onAddPlace).toHaveBeenCalledTimes(1);
    expect(onAddPlace).toHaveBeenCalledWith('syquia-mansion');

    activeApi.syncActionStates();
    expect(addBtn.textContent).toBe('Saved in plan');
    expect(addBtn.classList.contains('is-saved')).toBe(true);
    expect(addBtn.disabled).toBe(true);

    addBtn.click();
    addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onAddPlace).toHaveBeenCalledTimes(1);

    // Reverting saved state restores button
    saved.delete('syquia-mansion');
    activeApi.syncActionStates();
    expect(addBtn.disabled).toBe(false);
    expect(addBtn.classList.contains('is-saved')).toBe(false);
    expect(addBtn.textContent).toBe('+ Add to my plan');
  });

  it('updates preset button label based on hasAnySavedStops() and closes panel before calling onLoadPreset', () => {
    const dom = createChatDom();
    let anySaved = false;
    const events = [];
    const onLoadPreset = vi.fn((id) => {
      events.push({ id, openAtCall: activeApi.isOpen() });
    });

    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      onLoadPreset,
      hasAnySavedStops: () => anySaved,
      replyDelayMs: 0
    });

    activeApi.open();
    submitQuestion(dom, 'Plan 1 day');

    const presetBtn = dom.messagesEl.querySelector(
      '[data-chat-action="load-preset"][data-action-id="one-day-classic"]'
    );
    expect(presetBtn).not.toBeNull();
    expect(presetBtn.textContent).toBe('Load this plan');

    anySaved = true;
    activeApi.syncActionStates();
    expect(presetBtn.textContent).toBe('Load this plan (replaces saved stops)');

    // Newly rendered preset reply also starts with replacement label when stops already exist
    submitQuestion(dom, 'Plan 2 days');
    const twoDayBtn = dom.messagesEl.querySelector(
      '[data-chat-action="load-preset"][data-action-id="two-day-heritage"]'
    );
    expect(twoDayBtn.textContent).toBe('Load this plan (replaces saved stops)');

    presetBtn.click();
    expect(activeApi.isOpen()).toBe(false);
    expect(dom.panelEl.hidden).toBe(true);
    expect(document.activeElement).not.toBe(dom.fabEl);
    expect(onLoadPreset).toHaveBeenCalledTimes(1);
    expect(onLoadPreset).toHaveBeenCalledWith('one-day-classic');
    expect(events).toEqual([{ id: 'one-day-classic', openAtCall: false }]);
  });

  it('keeps chat open on desktop View in explorer, and closes first on compact viewports', () => {
    // Desktop (matches: false)
    const desktopDom = createChatDom();
    const desktopCalls = [];
    const desktopApi = initChatbot({
      conversation: createRealConversation(),
      ...desktopDom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      matchMedia: () => ({ matches: false }),
      onViewPlace: (id) => desktopCalls.push({ id, openAtCall: desktopApi.isOpen() }),
      replyDelayMs: 0
    });
    activeApi = desktopApi;

    desktopApi.open();
    submitQuestion(desktopDom, 'Tell me about Syquia Mansion');
    desktopDom.messagesEl
      .querySelector('[data-chat-action="view-place"][data-action-id="syquia-mansion"]')
      .click();

    expect(desktopApi.isOpen()).toBe(true);
    expect(desktopCalls).toEqual([{ id: 'syquia-mansion', openAtCall: true }]);
    desktopApi.destroy();

    // Compact viewport (max-width: 575.98px / max-height: 500px matches: true)
    const mobileDom = createChatDom();
    const mobileCalls = [];
    const mobileMatchMedia = vi.fn((query) => ({
      matches: query === '(max-width: 575.98px), (max-height: 500px)'
    }));
    const mobileApi = initChatbot({
      conversation: createRealConversation(),
      ...mobileDom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      matchMedia: mobileMatchMedia,
      onViewPlace: (id) => mobileCalls.push({ id, openAtCall: mobileApi.isOpen() }),
      replyDelayMs: 0
    });
    activeApi = mobileApi;

    mobileApi.open();
    submitQuestion(mobileDom, 'Tell me about Syquia Mansion');
    mobileDom.messagesEl
      .querySelector('[data-chat-action="view-place"][data-action-id="syquia-mansion"]')
      .click();

    expect(mobileApi.isOpen()).toBe(false);
    expect(mobileDom.panelEl.hidden).toBe(true);
    expect(document.activeElement).not.toBe(mobileDom.fabEl);
    expect(mobileCalls).toEqual([{ id: 'syquia-mansion', openAtCall: false }]);
  });

  it('shows typing indicator for replyDelayMs, renders synchronously for reduced motion, and cleans up timers on rapid messages & destroy()', () => {
    vi.useFakeTimers();

    // 1. Standard typing delay (250ms)
    const dom = createChatDom();
    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...dom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      matchMedia: () => ({ matches: false }),
      replyDelayMs: 250
    });

    activeApi.open();
    submitQuestion(dom, 'Tell me about Syquia Mansion');

    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(1);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot:not([data-chat-typing])')).toHaveLength(1);

    vi.advanceTimersByTime(249);
    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(1);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot:not([data-chat-typing])')).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(0);
    const botAfterDelay = dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot');
    expect(botAfterDelay).toHaveLength(2);
    expect(botAfterDelay[1].textContent).toContain('Syquia Mansion Museum');

    // 2. Rapid messages keep at most one typing indicator and clean up old timer
    submitQuestion(dom, 'Entrance fees');
    vi.advanceTimersByTime(100);
    submitQuestion(dom, 'What to eat');

    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(1);
    vi.advanceTimersByTime(250);
    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(0);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')).toHaveLength(4);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')[3].textContent).toContain(
      'Ilocano Food in Vigan'
    );

    // 3. destroy() cancels pending timer, removes typing indicator, and detaches listeners
    submitQuestion(dom, 'Plan 1 day');
    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(1);
    activeApi.destroy();
    vi.advanceTimersByTime(500);
    expect(dom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(0);
    expect(dom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')).toHaveLength(4);

    // Listeners detached after destroy
    dom.closeBtn.click();
    expect(activeApi.isOpen()).toBe(true);

    // 4. Reduced motion renders synchronously (0ms) even when replyDelayMs is 250
    const reducedDom = createChatDom();
    activeApi = initChatbot({
      conversation: createRealConversation(),
      ...reducedDom,
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      matchMedia: (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' }),
      replyDelayMs: 250
    });

    activeApi.open();
    submitQuestion(reducedDom, 'Tell me about Syquia Mansion');
    expect(reducedDom.messagesEl.querySelectorAll('[data-chat-typing]')).toHaveLength(0);
    expect(reducedDom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')).toHaveLength(2);
    expect(reducedDom.messagesEl.querySelectorAll('.vigan-chat-msg-bot')[1].textContent).toContain(
      'Syquia Mansion Museum'
    );
  });
});
