import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLACES, TRIP_PRESETS } from '../js/data/vigan-data.js';
import {
  PLAN_STORAGE_KEY,
  sortPlacesForDay,
  formatDuration,
  formatItineraryText,
  createItineraryStore,
  initItineraryDrawer
} from '../js/modules/itinerary.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

function createThrowingStorage() {
  return {
    getItem() {
      throw new DOMException('Blocked', 'SecurityError');
    },
    setItem() {
      throw new DOMException('Blocked', 'SecurityError');
    }
  };
}

function createDrawerDom() {
  document.body.innerHTML = `
    <span data-plan-count>0</span>
    <dialog id="planDrawer" class="drawer drawer-end">
      <div id="planSummary"></div>
      <div id="planList"></div>
      <div id="planStatus" role="status" aria-live="polite"></div>
      <button type="button" id="copyPlanBtn">Copy itinerary</button>
      <button type="button" id="clearPlanBtn">Clear plan</button>
    </dialog>
  `;
  const drawerEl = document.getElementById('planDrawer');
  drawerEl.showModal = vi.fn(() => {
    drawerEl.open = true;
  });
  drawerEl.close = vi.fn(() => {
    drawerEl.open = false;
  });

  return {
    drawerEl,
    summaryEl: document.getElementById('planSummary'),
    listEl: document.getElementById('planList'),
    statusEl: document.getElementById('planStatus'),
    copyBtn: document.getElementById('copyPlanBtn'),
    clearBtn: document.getElementById('clearPlanBtn'),
    countEls: document.querySelectorAll('[data-plan-count]')
  };
}

describe('itinerary store and drawer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('starts empty, toggles stops, sorts chronologically by timeSlot, and calculates duration', () => {
    const storage = createMemoryStorage();
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage });

    expect(store.getSavedIds()).toEqual([]);

    // Add Evening first, then Afternoon, then Morning
    store.toggleStop('plaza-salcedo');
    store.toggleStop('bantay-bell-tower');
    store.toggleStop('calle-crisologo');

    expect(store.hasStop('calle-crisologo')).toBe(true);
    const ordered = store.getSavedPlaces();
    expect(ordered.map((p) => p.id)).toEqual([
      'calle-crisologo',
      'bantay-bell-tower',
      'plaza-salcedo'
    ]);

    const sorted = sortPlacesForDay(ordered.slice().reverse());
    expect(sorted[0].timeSlot).toBeLessThanOrEqual(sorted[1].timeSlot);
    expect(formatDuration(155)).toBe('2h 35m');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2h');

    // Toggle removes existing stop
    store.toggleStop('bantay-bell-tower');
    expect(store.hasStop('bantay-bell-tower')).toBe(false);
    expect(store.getSavedIds()).toHaveLength(2);
  });

  it('sanitizes corrupted JSON and unknown place IDs from localStorage without throwing', () => {
    const badJsonStorage = createMemoryStorage({ [PLAN_STORAGE_KEY]: '{broken-json' });
    const store1 = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: badJsonStorage });
    expect(store1.getSavedIds()).toEqual([]);

    const staleIdsStorage = createMemoryStorage({
      [PLAN_STORAGE_KEY]: JSON.stringify(['calle-crisologo', 'nonexistent-place', 'calle-crisologo', 42])
    });
    const store2 = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: staleIdsStorage });
    expect(store2.getSavedIds()).toEqual(['calle-crisologo']);
  });

  it('survives localStorage SecurityError during init, toggle, preset load, and clear', () => {
    const store = createItineraryStore({
      places: PLACES,
      presets: TRIP_PRESETS,
      storage: createThrowingStorage()
    });

    expect(() => store.toggleStop('calle-crisologo')).not.toThrow();
    expect(store.getSavedIds()).toEqual(['calle-crisologo']);
    expect(() => store.applyPreset('one-day-classic')).not.toThrow();
    expect(store.getSavedIds()).toHaveLength(5);
    expect(() => store.clearPlan()).not.toThrow();
    expect(store.getSavedIds()).toEqual([]);
  });

  it('survives window.localStorage getter throwing SecurityError when default storage param is used', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage getter blocked', 'SecurityError');
      }
    });

    try {
      let store;
      expect(() => {
        store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS });
      }).not.toThrow();
      expect(store.getSavedIds()).toEqual([]);
      expect(() => store.toggleStop('calle-crisologo')).not.toThrow();
      expect(store.getSavedIds()).toEqual(['calle-crisologo']);
    } finally {
      if (descriptor) {
        Object.defineProperty(window, 'localStorage', descriptor);
      }
    }
  });

  it('restores keyboard focus cleanly inside the drawer when removing a stop', () => {
    const storage = createMemoryStorage();
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage });
    store.applyPreset('one-day-classic');
    const dom = createDrawerDom();

    initItineraryDrawer({ store, presets: TRIP_PRESETS, ...dom });

    const firstRemove = dom.listEl.querySelector('[data-remove-stop]');
    firstRemove.focus();
    expect(document.activeElement).toBe(firstRemove);
    firstRemove.click();

    // Focus must stay inside #planList on the next remove button instead of falling to document.body
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement.hasAttribute('data-remove-stop')).toBe(true);
  });

  it('renders empty state with one-click preset buttons and updates when presets or removals run', () => {
    const storage = createMemoryStorage();
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage });
    const dom = createDrawerDom();

    initItineraryDrawer({ store, presets: TRIP_PRESETS, ...dom });

    expect(dom.countEls[0].textContent).toBe('0');
    expect(dom.listEl.textContent).toContain('No stops saved yet');
    const presetBtns = dom.listEl.querySelectorAll('[data-preset-id]');
    expect(presetBtns).toHaveLength(2);

    // Load 1-Day Classic preset
    presetBtns[0].click();
    expect(store.getSavedIds()).toHaveLength(5);
    expect(dom.countEls[0].textContent).toBe('5');
    expect(dom.listEl.querySelectorAll('[data-remove-stop]')).toHaveLength(5);
    expect(dom.summaryEl.textContent).toContain('5 stops');

    // Remove one stop inline
    dom.listEl.querySelector('[data-remove-stop="calle-crisologo"]').click();
    expect(store.getSavedIds()).toHaveLength(4);
    expect(dom.countEls[0].textContent).toBe('4');

    // Clear plan
    dom.clearBtn.click();
    expect(store.getSavedIds()).toHaveLength(0);
    expect(dom.listEl.textContent).toContain('No stops saved yet');
  });

  it('formats clean itinerary text without em-dashes and handles clipboard success and rejection gracefully', async () => {
    const storage = createMemoryStorage();
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage });
    store.applyPreset('one-day-classic');

    const text = formatItineraryText(store.getSavedPlaces());
    expect(text).toContain('Calle Crisologo');
    expect(text).toContain('Morning');
    expect(text).not.toContain('\u2014');
    expect(text).not.toContain('\u2013');

    const dom = createDrawerDom();
    const okClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const drawerApi = initItineraryDrawer({
      store,
      presets: TRIP_PRESETS,
      ...dom,
      clipboard: okClipboard
    });

    await drawerApi.copyItinerary();
    expect(okClipboard.writeText).toHaveBeenCalledWith(text);
    expect(dom.statusEl.textContent).toContain('Copied');

    const failClipboard = { writeText: vi.fn().mockRejectedValue(new Error('Denied')) };
    const drawerApiFail = initItineraryDrawer({
      store,
      presets: TRIP_PRESETS,
      ...dom,
      clipboard: failClipboard
    });

    await drawerApiFail.copyItinerary();
    expect(dom.statusEl.textContent).toContain('Could not copy');
  });
});
