const COMPACT_VIEWPORT_QUERY = '(max-width: 575.98px), (max-height: 500px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function matchesMedia(matchMediaFn, query) {
  if (typeof matchMediaFn !== 'function') return false;
  try {
    return Boolean(matchMediaFn(query)?.matches);
  } catch {
    return false;
  }
}

function focusElement(el) {
  if (!el || typeof el.focus !== 'function') return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

function createUserMessageElement(text) {
  const bubble = document.createElement('div');
  bubble.className = 'vigan-chat-msg vigan-chat-msg-user';

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  bubble.appendChild(paragraph);
  return bubble;
}

function createTypingElement() {
  const bubble = document.createElement('div');
  bubble.className = 'vigan-chat-msg vigan-chat-msg-bot vigan-chat-typing';
  bubble.dataset.chatTyping = 'true';

  const dots = document.createElement('span');
  dots.className = 'vigan-chat-typing-dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.textContent = '...';

  bubble.appendChild(dots);
  return bubble;
}

function createActionButton(action) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'vigan-chat-action focus-ring';
  btn.dataset.chatAction = action.type;
  btn.dataset.actionId = action.id;
  btn.textContent = action.label || '';
  return btn;
}

function createActionsRow(actions) {
  const wrap = document.createElement('div');
  wrap.className = 'vigan-chat-actions';
  for (const action of actions) {
    if (!action || !action.type || !action.id) continue;
    wrap.appendChild(createActionButton(action));
  }
  return wrap;
}

function createBotReplyElement(reply) {
  const bubble = document.createElement('div');
  bubble.className = 'vigan-chat-msg vigan-chat-msg-bot';

  if (typeof reply?.title === 'string' && reply.title.trim().length > 0) {
    const titleEl = document.createElement('strong');
    titleEl.className = 'vigan-chat-reply-title';
    titleEl.textContent = reply.title;
    bubble.appendChild(titleEl);
  }

  if (Array.isArray(reply?.paragraphs)) {
    for (const text of reply.paragraphs) {
      if (typeof text !== 'string' || text.length === 0) continue;
      const p = document.createElement('p');
      p.textContent = text;
      bubble.appendChild(p);
    }
  }

  if (Array.isArray(reply?.items) && reply.items.length > 0) {
    const list = document.createElement('ul');
    list.className = 'vigan-chat-list';

    for (const item of reply.items) {
      if (!item) continue;
      const li = document.createElement('li');

      if (typeof item.title === 'string' && item.title.length > 0) {
        const strong = document.createElement('strong');
        strong.textContent = item.title;
        li.appendChild(strong);
      }

      if (typeof item.text === 'string' && item.text.length > 0) {
        const span = document.createElement('span');
        span.textContent = item.text;
        li.appendChild(span);
      }

      if (Array.isArray(item.actions) && item.actions.length > 0) {
        li.appendChild(createActionsRow(item.actions));
      }

      list.appendChild(li);
    }

    bubble.appendChild(list);
  }

  if (Array.isArray(reply?.actions) && reply.actions.length > 0) {
    bubble.appendChild(createActionsRow(reply.actions));
  }

  return bubble;
}

/**
 * Initializes the floating "Ask Vigan" non-modal chat card UI and binds DOM events.
 * @param {object} options
 */
export function initChatbot({
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
  matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null
} = {}) {
  const doc =
    panelEl?.ownerDocument ||
    fabEl?.ownerDocument ||
    (typeof document !== 'undefined' ? document : null);

  let openState = false;
  let isDestroyed = false;
  let pendingTimerId = null;
  let pendingReply = null;
  let pendingTypingEl = null;

  function scrollMessagesToBottom() {
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function syncFabState() {
    if (!fabEl) return;
    fabEl.classList.toggle('is-open', openState);
    fabEl.setAttribute('aria-expanded', String(openState));

    const iconEl =
      fabEl.querySelector('[data-chat-fab-icon]') || fabEl.querySelector('i');
    if (iconEl) {
      iconEl.classList.toggle('ph-x', openState);
      iconEl.classList.toggle('ph-chat-circle-text', !openState);
    }
  }

  function renderSuggestions(suggestions) {
    if (!suggestionsEl) return;
    suggestionsEl.replaceChildren();
    if (!Array.isArray(suggestions)) return;

    for (const raw of suggestions) {
      if (typeof raw !== 'string') continue;
      const text = raw.trim();
      if (!text) continue;

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'vigan-chat-chip focus-ring';
      chip.dataset.chatSuggestion = text;
      chip.textContent = text;
      suggestionsEl.appendChild(chip);
    }
  }

  function syncActionStates() {
    if (!messagesEl) return;

    const addButtons = messagesEl.querySelectorAll('[data-chat-action="add-place"]');
    for (const btn of addButtons) {
      const id = btn.dataset.actionId || '';
      const saved = Boolean(isPlaceSaved(id));
      btn.disabled = saved;
      btn.classList.toggle('is-saved', saved);
      btn.textContent = saved ? 'Saved in plan' : '+ Add to my plan';
    }

    const hasStops = Boolean(hasAnySavedStops());
    const presetButtons = messagesEl.querySelectorAll('[data-chat-action="load-preset"]');
    for (const btn of presetButtons) {
      btn.textContent = hasStops
        ? 'Load this plan (replaces saved stops)'
        : 'Load this plan';
    }
  }

  function clearPendingTimer() {
    if (pendingTimerId !== null) {
      clearTimeout(pendingTimerId);
      pendingTimerId = null;
    }
  }

  function commitReply(reply, typingEl = null) {
    if (isDestroyed) return;
    const botBubble = createBotReplyElement(reply);
    if (typingEl && typingEl.parentNode === messagesEl) {
      typingEl.replaceWith(botBubble);
    } else if (messagesEl) {
      messagesEl.appendChild(botBubble);
    }

    renderSuggestions(Array.isArray(reply?.suggestions) ? reply.suggestions : []);
    syncActionStates();
    scrollMessagesToBottom();
  }

  function flushPendingReply() {
    clearPendingTimer();
    if (!pendingTypingEl && !pendingReply) return;
    const reply = pendingReply;
    const typingEl = pendingTypingEl;
    pendingReply = null;
    pendingTypingEl = null;

    if (reply) {
      commitReply(reply, typingEl);
    } else {
      typingEl?.remove();
    }
  }

  function open() {
    if (isDestroyed) return;
    openState = true;
    if (panelEl) panelEl.hidden = false;
    syncFabState();
    scrollMessagesToBottom();
    focusElement(inputEl);
  }

  function close({ restoreFocus = true } = {}) {
    if (isDestroyed) return;
    const wasOpen = openState;
    openState = false;
    if (panelEl) panelEl.hidden = true;
    syncFabState();

    if (wasOpen && restoreFocus) {
      focusElement(fabEl);
    }
  }

  function toggle() {
    if (isDestroyed) return;
    if (openState) {
      close({ restoreFocus: true });
    } else {
      open();
    }
  }

  function resolveReply(question) {
    try {
      if (conversation && typeof conversation.ask === 'function') {
        const reply = conversation.ask(question);
        if (reply && typeof reply === 'object') return reply;
      }
    } catch {
      // Fallback below if conversation throws.
    }
    return {
      kind: 'out-of-scope',
      paragraphs: ["This information is outside the website's information."],
      actions: [],
      suggestions: starterSuggestions
    };
  }

  function sendQuestion(text) {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed || isDestroyed) return;

    flushPendingReply();

    if (messagesEl) {
      messagesEl.appendChild(createUserMessageElement(trimmed));
      scrollMessagesToBottom();
    }

    const reply = resolveReply(trimmed);
    const reducedMotion = matchesMedia(matchMedia, REDUCED_MOTION_QUERY);
    const delay = reducedMotion ? 0 : Math.max(0, Number(replyDelayMs) || 0);

    if (delay === 0) {
      commitReply(reply);
      return;
    }

    const typingEl = createTypingElement();
    pendingReply = reply;
    pendingTypingEl = typingEl;

    if (messagesEl) {
      messagesEl.appendChild(typingEl);
      scrollMessagesToBottom();
    }

    pendingTimerId = setTimeout(() => {
      pendingTimerId = null;
      if (isDestroyed) return;
      const readyReply = pendingReply;
      const readyTyping = pendingTypingEl;
      pendingReply = null;
      pendingTypingEl = null;
      if (readyReply) {
        commitReply(readyReply, readyTyping);
      }
    }, delay);
  }

  function handleFabClick() {
    toggle();
  }

  function handleCloseClick() {
    close({ restoreFocus: true });
  }

  function handleDocumentKeydown(event) {
    if (isDestroyed || !openState || event.key !== 'Escape') return;
    if (doc && doc.querySelector('dialog[open]')) return;
    event.preventDefault();
    close({ restoreFocus: true });
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (isDestroyed || !inputEl) return;
    const raw = inputEl.value;
    if (!raw || !raw.trim()) return;
    inputEl.value = '';
    sendQuestion(raw);
  }

  function handleSuggestionsClick(event) {
    if (isDestroyed) return;
    const chip = event.target?.closest?.('[data-chat-suggestion]');
    if (!chip) return;
    const text = chip.dataset.chatSuggestion;
    if (!text || !text.trim()) return;
    sendQuestion(text);
    if (openState) {
      focusElement(inputEl);
    }
  }

  function handleMessagesClick(event) {
    if (isDestroyed) return;
    const actionBtn = event.target?.closest?.('[data-chat-action]');
    if (!actionBtn) return;

    const actionType = actionBtn.dataset.chatAction;
    const actionId = actionBtn.dataset.actionId;
    if (!actionType || !actionId) return;

    if (actionType === 'view-place') {
      if (matchesMedia(matchMedia, COMPACT_VIEWPORT_QUERY)) {
        close({ restoreFocus: false });
      }
      onViewPlace(actionId);
      return;
    }

    if (actionType === 'add-place') {
      if (actionBtn.disabled) return;
      onAddPlace(actionId);
      syncActionStates();
      return;
    }

    if (actionType === 'load-preset') {
      close({ restoreFocus: false });
      onLoadPreset(actionId);
    }
  }

  function destroy() {
    if (isDestroyed) return;
    isDestroyed = true;
    clearPendingTimer();
    pendingTypingEl?.remove();
    pendingTypingEl = null;
    pendingReply = null;

    fabEl?.removeEventListener('click', handleFabClick);
    closeBtn?.removeEventListener('click', handleCloseClick);
    doc?.removeEventListener('keydown', handleDocumentKeydown);
    formEl?.removeEventListener('submit', handleFormSubmit);
    suggestionsEl?.removeEventListener('click', handleSuggestionsClick);
    messagesEl?.removeEventListener('click', handleMessagesClick);
  }

  if (panelEl) panelEl.hidden = true;
  syncFabState();

  if (messagesEl) {
    messagesEl.replaceChildren();
    if (typeof welcomeMessage === 'string' && welcomeMessage.trim().length > 0) {
      messagesEl.appendChild(createBotReplyElement({ paragraphs: [welcomeMessage] }));
    }
  }
  renderSuggestions(starterSuggestions);

  fabEl?.addEventListener('click', handleFabClick);
  closeBtn?.addEventListener('click', handleCloseClick);
  doc?.addEventListener('keydown', handleDocumentKeydown);
  formEl?.addEventListener('submit', handleFormSubmit);
  suggestionsEl?.addEventListener('click', handleSuggestionsClick);
  messagesEl?.addEventListener('click', handleMessagesClick);

  return {
    open,
    close,
    toggle,
    isOpen: () => openState,
    sendQuestion,
    syncActionStates,
    destroy
  };
}
