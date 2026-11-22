export const PLAN_STORAGE_KEY = 'vigan-trip-plan';

export function sortPlacesForDay(places) {
  return [...places].sort((a, b) => {
    if (a.timeSlot !== b.timeSlot) return a.timeSlot - b.timeSlot;
    return a.name.localeCompare(b.name);
  });
}

export function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (mins === 0) return '0 min';
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 0) return `${rem} min`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}

export function formatItineraryText(places) {
  const ordered = sortPlacesForDay(places);
  if (ordered.length === 0) {
    return 'My Vigan City Plan (no stops saved yet)';
  }

  const totalMins = ordered.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);
  const lines = [
    `My Vigan City Plan (${ordered.length} ${ordered.length === 1 ? 'stop' : 'stops'}, est. ${formatDuration(totalMins)})`,
    ''
  ];

  let lastSlot = '';
  for (const place of ordered) {
    if (place.timeSlotLabel !== lastSlot) {
      if (lastSlot) lines.push('');
      lines.push(`[${place.timeSlotLabel}]`);
      lastSlot = place.timeSlotLabel;
    }
    lines.push(`- ${place.name} (${place.bestTime}, ${place.durationLabel}) - ${place.zone}`);
  }

  return lines.join('\n');
}

function readSavedIds(storage, validIds) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const cleaned = [];
    for (const id of parsed) {
      if (typeof id === 'string' && validIds.has(id) && !seen.has(id)) {
        seen.add(id);
        cleaned.push(id);
      }
    }
    return cleaned;
  } catch {
    return [];
  }
}

function writeSavedIds(storage, ids) {
  if (!storage) return;
  try {
    storage.setItem(PLAN_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota or SecurityError in private browsing.
  }
}

function getSafeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createItineraryStore({
  places = [],
  presets = [],
  storage = getSafeLocalStorage()
} = {}) {
  const placeMap = new Map(places.map((p) => [p.id, p]));
  const validIds = new Set(placeMap.keys());
  const listeners = new Set();

  let savedIds = readSavedIds(storage, validIds);

  function notify() {
    writeSavedIds(storage, savedIds);
    for (const fn of listeners) {
      fn(getSavedPlaces(), [...savedIds]);
    }
  }

  function getSavedIds() {
    return [...savedIds];
  }

  function getSavedPlaces() {
    const items = savedIds.map((id) => placeMap.get(id)).filter(Boolean);
    return sortPlacesForDay(items);
  }

  function hasStop(id) {
    return savedIds.includes(id);
  }

  function toggleStop(id) {
    if (!validIds.has(id)) return false;
    if (savedIds.includes(id)) {
      savedIds = savedIds.filter((item) => item !== id);
    } else {
      savedIds = [...savedIds, id];
    }
    notify();
    return savedIds.includes(id);
  }

  function removeStop(id) {
    if (!savedIds.includes(id)) return;
    savedIds = savedIds.filter((item) => item !== id);
    notify();
  }

  function applyPreset(presetId) {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const seen = new Set();
    savedIds = preset.stopIds.filter((id) => {
      if (!validIds.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    notify();
  }

  function clearPlan() {
    savedIds = [];
    notify();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    getSavedIds,
    getSavedPlaces,
    hasStop,
    toggleStop,
    removeStop,
    applyPreset,
    clearPlan,
    subscribe
  };
}

export function initItineraryDrawer({
  store,
  presets = [],
  drawerEl,
  listEl,
  summaryEl,
  countEls = [],
  copyBtn,
  clearBtn,
  statusEl,
  clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null
} = {}) {
  const counts = Array.from(countEls).filter(Boolean);

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', isError);
  }

  function captureListFocus() {
    const active = document.activeElement;
    if (!active || !listEl || !listEl.contains(active)) return null;
    if (active.hasAttribute('data-remove-stop')) {
      const buttons = Array.from(listEl.querySelectorAll('[data-remove-stop]'));
      return { kind: 'remove', index: buttons.indexOf(active) };
    }
    if (active.hasAttribute('data-preset-id')) {
      return { kind: 'preset', id: active.dataset.presetId };
    }
    return null;
  }

  function restoreListFocus(token) {
    if (!token || !listEl) return;
    if (token.kind === 'remove') {
      const remaining = Array.from(listEl.querySelectorAll('[data-remove-stop]'));
      if (remaining.length > 0) {
        const nextBtn = remaining[Math.min(token.index, remaining.length - 1)];
        nextBtn?.focus();
        return;
      }
      const firstPreset = listEl.querySelector('[data-preset-id]');
      if (firstPreset) {
        firstPreset.focus();
        return;
      }
      drawerEl?.querySelector('.btn-close')?.focus();
    } else if (token.kind === 'preset') {
      const nextTarget =
        listEl.querySelector('[data-remove-stop]') ||
        listEl.querySelector(`[data-preset-id="${token.id}"]`);
      nextTarget?.focus();
    }
  }

  function render() {
    const focusToken = captureListFocus();
    const savedPlaces = store.getSavedPlaces();
    const totalCount = savedPlaces.length;
    const totalMins = savedPlaces.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);

    for (const el of counts) {
      el.textContent = String(totalCount);
    }

    if (copyBtn) copyBtn.disabled = totalCount === 0;
    if (clearBtn) clearBtn.disabled = totalCount === 0;

    if (summaryEl) {
      summaryEl.textContent =
        totalCount === 0
          ? 'Build your route from any landmark or load a starter itinerary below.'
          : `${totalCount} ${totalCount === 1 ? 'stop' : 'stops'} sorted by time of day - Est. ${formatDuration(totalMins)}`;
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (totalCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'plan-empty';

      const heading = document.createElement('h3');
      heading.className = 'plan-empty-title';
      heading.textContent = 'No stops saved yet';

      const copy = document.createElement('p');
      copy.className = 'plan-empty-copy';
      copy.textContent =
        'Save any landmark in the explorer to organize your Vigan route automatically, or start with a curated schedule:';

      const presetWrap = document.createElement('div');
      presetWrap.className = 'plan-presets';

      for (const preset of presets) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'plan-preset-btn';
        btn.dataset.presetId = preset.id;

        const name = document.createElement('strong');
        name.textContent = preset.name;

        const sub = document.createElement('span');
        sub.textContent = preset.subtitle;

        btn.append(name, sub);
        presetWrap.appendChild(btn);
      }

      empty.append(heading, copy, presetWrap);
      listEl.appendChild(empty);
      restoreListFocus(focusToken);
      return;
    }

    let currentSlot = '';
    for (const place of savedPlaces) {
      if (place.timeSlotLabel !== currentSlot) {
        currentSlot = place.timeSlotLabel;
        const slotHeader = document.createElement('div');
        slotHeader.className = 'plan-slot-heading';
        slotHeader.textContent = currentSlot;
        listEl.appendChild(slotHeader);
      }

      const row = document.createElement('div');
      row.className = 'plan-stop-row';

      const thumb = document.createElement('img');
      thumb.src = place.image;
      thumb.alt = place.name;
      thumb.className = 'plan-stop-thumb';
      thumb.loading = 'lazy';

      const info = document.createElement('div');
      info.className = 'plan-stop-info';

      const title = document.createElement('strong');
      title.textContent = place.name;

      const meta = document.createElement('span');
      meta.textContent = `${place.bestTime} - ${place.durationLabel}`;

      info.append(title, meta);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'plan-remove-btn';
      removeBtn.dataset.removeStop = place.id;
      removeBtn.setAttribute('aria-label', `Remove ${place.name} from plan`);
      removeBtn.textContent = 'Remove';

      row.append(thumb, info, removeBtn);
      listEl.appendChild(row);
    }

    const switchWrap = document.createElement('div');
    switchWrap.className = 'plan-switch-presets';
    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plan-mini-preset';
      btn.dataset.presetId = preset.id;
      btn.textContent = `Load ${preset.name}`;
      switchWrap.appendChild(btn);
    }
    listEl.appendChild(switchWrap);
    restoreListFocus(focusToken);
  }

  function openDrawer() {
    if (!drawerEl) return;
    setStatus('');
    if (!drawerEl.open && typeof drawerEl.showModal === 'function') {
      drawerEl.showModal();
    }
  }

  function closeDrawer() {
    if (!drawerEl) return;
    if (drawerEl.open && typeof drawerEl.close === 'function') {
      drawerEl.close();
    }
  }

  async function copyItinerary() {
    const savedPlaces = store.getSavedPlaces();
    if (savedPlaces.length === 0) return false;
    const text = formatItineraryText(savedPlaces);

    if (!clipboard || typeof clipboard.writeText !== 'function') {
      setStatus('Could not copy automatically. Select your saved stops directly from the list.', true);
      return false;
    }

    try {
      await clipboard.writeText(text);
      setStatus('Copied your Vigan itinerary to clipboard.', false);
      return true;
    } catch {
      setStatus('Could not copy to clipboard. Check browser clipboard permissions.', true);
      return false;
    }
  }

  if (listEl) {
    listEl.addEventListener('click', (event) => {
      const presetBtn = event.target.closest('[data-preset-id]');
      if (presetBtn) {
        store.applyPreset(presetBtn.dataset.presetId);
        setStatus('Starter itinerary loaded.', false);
        return;
      }

      const removeBtn = event.target.closest('[data-remove-stop]');
      if (removeBtn) {
        store.removeStop(removeBtn.dataset.removeStop);
        setStatus('');
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyItinerary();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.clearPlan();
      setStatus('Cleared saved stops.', false);
    });
  }

  if (drawerEl) {
    drawerEl.addEventListener('click', (event) => {
      if (event.target === drawerEl) {
        closeDrawer();
      }
    });
  }

  store.subscribe(() => render());
  render();

  return {
    render,
    openDrawer,
    closeDrawer,
    copyItinerary
  };
}
