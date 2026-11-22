import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLACES, PLACE_CATEGORIES, TRIP_PRESETS } from '../js/data/vigan-data.js';
import { createItineraryStore } from '../js/modules/itinerary.js';
import { initExplorer } from '../js/modules/explorer.js';

function createExplorerDom() {
  document.body.innerHTML = `
    <section id="landmarks">
      <div id="explorerFilters"></div>
      <input id="explorerSearch" type="search" />
      <div id="explorerList"></div>
      <article id="explorerSpotlight"></article>
    </section>
  `;
  const section = document.getElementById('landmarks');
  section.scrollIntoView = vi.fn();
  return {
    sectionEl: section,
    filtersEl: document.getElementById('explorerFilters'),
    searchInput: document.getElementById('explorerSearch'),
    listEl: document.getElementById('explorerList'),
    spotlightEl: document.getElementById('explorerSpotlight')
  };
}

describe('split-screen landmark explorer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all 11 places, activates Calle Crisologo with Day/Night photo toggle, and filters by category', () => {
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: null });
    const dom = createExplorerDom();

    const api = initExplorer({
      places: PLACES,
      categories: PLACE_CATEGORIES,
      store,
      ...dom,
      onOpenPlan: vi.fn()
    });

    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(11);
    expect(api.getActivePlaceId()).toBe('calle-crisologo');
    expect(dom.spotlightEl.textContent).toContain('Calle Crisologo');

    // Day/Night toggle on Calle Crisologo
    const photo = dom.spotlightEl.querySelector('[data-spotlight-image]');
    expect(photo.getAttribute('src')).toBe('images/Landmarks/Thumbnail.jpg');
    const nightToggle = dom.spotlightEl.querySelector('[data-night-toggle]');
    expect(nightToggle).not.toBeNull();
    nightToggle.click();
    expect(dom.spotlightEl.querySelector('[data-spotlight-image]').getAttribute('src')).toBe(
      'images/attractions/CalleCrisologo.jpg'
    );

    // Filter to Ancestral Museums (3 places)
    dom.filtersEl.querySelector('[data-category="museum"]').click();
    const rows = dom.listEl.querySelectorAll('[data-place-row]');
    expect(rows).toHaveLength(3);
    expect(api.getActivePlaceId()).toBe('syquia-mansion');
    expect(dom.spotlightEl.textContent).toContain('Syquia Mansion Museum');
  });

  it('filters by search query, renders composed empty state, and resets filters cleanly', () => {
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: null });
    const dom = createExplorerDom();

    initExplorer({
      places: PLACES,
      categories: PLACE_CATEGORIES,
      store,
      ...dom,
      onOpenPlan: vi.fn()
    });

    dom.searchInput.value = 'basi revolt';
    dom.searchInput.dispatchEvent(new Event('input'));
    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(1);
    expect(dom.listEl.textContent).toContain('Padre Burgos House');

    // Zero matches -> composed empty state + reset button
    dom.searchInput.value = 'zzzz-not-a-place';
    dom.searchInput.dispatchEvent(new Event('input'));
    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(0);
    expect(dom.listEl.textContent).toContain('No Vigan places match');

    const resetBtn = dom.listEl.querySelector('[data-reset-filters]');
    expect(resetBtn).not.toBeNull();
    resetBtn.click();
    expect(dom.searchInput.value).toBe('');
    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(11);
  });

  it('clears restrictive filters when selectAndFocusPlace is invoked from the hero marquee', () => {
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: null });
    const dom = createExplorerDom();

    const api = initExplorer({
      places: PLACES,
      categories: PLACE_CATEGORIES,
      store,
      ...dom,
      onOpenPlan: vi.fn()
    });

    // Restrict to museums + search term that hides Bantay Bell Tower
    dom.filtersEl.querySelector('[data-category="museum"]').click();
    dom.searchInput.value = 'syquia';
    dom.searchInput.dispatchEvent(new Event('input'));
    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(1);

    // Jump from hero marquee to Bantay Bell Tower
    api.selectAndFocusPlace('bantay-bell-tower');

    expect(dom.searchInput.value).toBe('');
    expect(dom.listEl.querySelectorAll('[data-place-row]')).toHaveLength(11);
    expect(api.getActivePlaceId()).toBe('bantay-bell-tower');
    expect(dom.spotlightEl.textContent).toContain('Bantay Bell Tower');
    expect(dom.sectionEl.scrollIntoView).toHaveBeenCalled();
  });

  it('keeps row save buttons and spotlight save button synced with itinerary store', () => {
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: null });
    const dom = createExplorerDom();
    const onOpenPlan = vi.fn();

    initExplorer({
      places: PLACES,
      categories: PLACE_CATEGORIES,
      store,
      ...dom,
      onOpenPlan
    });

    const rowSave = dom.listEl.querySelector('[data-save-place="calle-crisologo"]');
    rowSave.click();
    expect(store.hasStop('calle-crisologo')).toBe(true);
    expect(dom.listEl.querySelector('[data-save-place="calle-crisologo"]').textContent.trim()).toBe('Saved');
    expect(dom.spotlightEl.querySelector('[data-spotlight-save]').textContent).toContain('Saved');

    // Open plan button inside spotlight
    dom.spotlightEl.querySelector('[data-open-plan]').click();
    expect(onOpenPlan).toHaveBeenCalled();
  });

  it('preserves keyboard focus across category clicks, row saves, Day/Night toggles, and spotlight saves', () => {
    const store = createItineraryStore({ places: PLACES, presets: TRIP_PRESETS, storage: null });
    const dom = createExplorerDom();

    initExplorer({
      places: PLACES,
      categories: PLACE_CATEGORIES,
      store,
      ...dom,
      onOpenPlan: vi.fn()
    });

    // Focus and click row save button
    const rowSave = dom.listEl.querySelector('[data-save-place="calle-crisologo"]');
    rowSave.focus();
    rowSave.click();
    expect(document.activeElement.getAttribute('data-save-place')).toBe('calle-crisologo');

    // Focus and click Day/Night toggle in spotlight
    const nightBtn = dom.spotlightEl.querySelector('[data-night-toggle]');
    nightBtn.focus();
    nightBtn.click();
    expect(document.activeElement.hasAttribute('data-night-toggle')).toBe(true);

    // Focus and click spotlight save button
    const spotSave = dom.spotlightEl.querySelector('[data-spotlight-save]');
    spotSave.focus();
    spotSave.click();
    expect(document.activeElement.getAttribute('data-spotlight-save')).toBe('calle-crisologo');

    // Focus and click museum filter chip
    const museumChip = dom.filtersEl.querySelector('[data-category="museum"]');
    museumChip.focus();
    museumChip.click();
    expect(document.activeElement.getAttribute('data-category')).toBe('museum');
  });
});
