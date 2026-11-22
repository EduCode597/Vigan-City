export function initExplorer({
  places = [],
  categories = [],
  store,
  sectionEl,
  filtersEl,
  searchInput,
  listEl,
  spotlightEl,
  statusEl = null,
  onOpenPlan = () => {}
} = {}) {
  let activeCategory = 'all';
  let searchQuery = '';
  let activePlaceId = places[0]?.id || null;
  let nightModePhoto = false;

  function announce(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function captureExplorerFocus() {
    const active = document.activeElement;
    if (!active) return null;
    if (filtersEl && filtersEl.contains(active) && active.dataset.category) {
      return { root: filtersEl, selector: `[data-category="${active.dataset.category}"]` };
    }
    if (listEl && listEl.contains(active)) {
      if (active.dataset.savePlace) {
        return { root: listEl, selector: `[data-save-place="${active.dataset.savePlace}"]` };
      }
      if (active.dataset.selectPlace) {
        return { root: listEl, selector: `[data-select-place="${active.dataset.selectPlace}"]` };
      }
    }
    if (spotlightEl && spotlightEl.contains(active)) {
      if (active.hasAttribute('data-night-toggle')) {
        return { root: spotlightEl, selector: '[data-night-toggle]' };
      }
      if (active.dataset.spotlightSave) {
        return { root: spotlightEl, selector: `[data-spotlight-save="${active.dataset.spotlightSave}"]` };
      }
      if (active.hasAttribute('data-open-plan')) {
        return { root: spotlightEl, selector: '[data-open-plan]' };
      }
    }
    return null;
  }

  function restoreExplorerFocus(token) {
    if (!token || !token.root) return;
    const match = token.root.querySelector(token.selector);
    if (match && typeof match.focus === 'function') {
      match.focus({ preventScroll: true });
    }
  }

  function matchesFilters(place) {
    if (activeCategory !== 'all' && place.category !== activeCategory) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      place.name,
      place.zone,
      place.categoryLabel,
      place.shortIntro,
      place.story,
      place.highlight
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function getFilteredPlaces() {
    return places.filter(matchesFilters);
  }

  function renderFilters() {
    if (!filtersEl) return;
    filtersEl.innerHTML = '';
    for (const cat of categories) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `explorer-chip${cat.id === activeCategory ? ' is-active' : ''}`;
      btn.dataset.category = cat.id;
      btn.setAttribute('aria-pressed', String(cat.id === activeCategory));
      btn.textContent = cat.label;
      filtersEl.appendChild(btn);
    }
  }

  function renderList(filtered) {
    if (!listEl) return;
    listEl.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'explorer-empty';

      const msg = document.createElement('p');
      msg.textContent = 'No Vigan places match that search. Try a landmark name, plaza, or craft.';

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn-vigan-secondary';
      resetBtn.dataset.resetFilters = 'true';
      resetBtn.textContent = 'Reset filters';

      empty.append(msg, resetBtn);
      listEl.appendChild(empty);
      return;
    }

    for (const place of filtered) {
      const isActive = place.id === activePlaceId;
      const isSaved = store ? store.hasStop(place.id) : false;

      const row = document.createElement('div');
      row.className = `explorer-row${isActive ? ' is-active' : ''}`;
      row.dataset.placeRow = place.id;

      const selectBtn = document.createElement('button');
      selectBtn.type = 'button';
      selectBtn.className = 'explorer-row-main';
      selectBtn.dataset.selectPlace = place.id;
      selectBtn.setAttribute('aria-current', isActive ? 'true' : 'false');

      const title = document.createElement('span');
      title.className = 'explorer-row-title';
      title.textContent = place.name;

      const sub = document.createElement('span');
      sub.className = 'explorer-row-sub';
      sub.textContent = `${place.zone} - ${place.distanceFromPlaza}`;

      selectBtn.append(title, sub);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = `explorer-save-btn${isSaved ? ' is-saved' : ''}`;
      saveBtn.dataset.savePlace = place.id;
      saveBtn.setAttribute('aria-pressed', String(isSaved));
      saveBtn.textContent = isSaved ? 'Saved' : '+ Save';

      row.append(selectBtn, saveBtn);
      listEl.appendChild(row);
    }
  }

  function renderSpotlight() {
    if (!spotlightEl) return;
    const place = places.find((p) => p.id === activePlaceId) || places[0];
    if (!place) {
      spotlightEl.innerHTML = '';
      return;
    }

    const isSaved = store ? store.hasStop(place.id) : false;
    const useNight = Boolean(place.nightImage && nightModePhoto);
    const imgSrc = useNight ? place.nightImage : place.image;
    const imgAlt = useNight ? place.nightAlt || place.alt : place.alt;

    spotlightEl.innerHTML = '';

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'spotlight-media';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = imgAlt;
    img.dataset.spotlightImage = 'true';
    img.decoding = 'async';
    mediaWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'spotlight-body';

    const topMeta = document.createElement('div');
    topMeta.className = 'spotlight-meta-row';

    const meta = document.createElement('span');
    meta.className = 'spotlight-meta';
    meta.textContent = `${place.categoryLabel} - ${place.entryFee} - ${place.distanceFromPlaza}`;
    topMeta.appendChild(meta);

    if (place.nightImage) {
      const nightBtn = document.createElement('button');
      nightBtn.type = 'button';
      nightBtn.className = 'spotlight-view-toggle';
      nightBtn.dataset.nightToggle = 'true';
      nightBtn.setAttribute('aria-pressed', String(useNight));
      nightBtn.textContent = useNight ? 'View Daylight' : 'View Night Lights';
      topMeta.appendChild(nightBtn);
    }

    const heading = document.createElement('h3');
    heading.className = 'spotlight-title';
    heading.tabIndex = -1;
    heading.textContent = place.name;

    const lead = document.createElement('p');
    lead.className = 'spotlight-lead';
    lead.textContent = place.shortIntro;

    const story = document.createElement('p');
    story.className = 'spotlight-story';
    story.textContent = place.story;

    const facts = document.createElement('dl');
    facts.className = 'spotlight-facts';

    const factEntries = [
      ['Best Time', place.bestTime],
      ['Typical Stay', place.durationLabel],
      ['Do Not Miss', place.highlight]
    ];

    for (const [label, value] of factEntries) {
      const box = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      box.append(dt, dd);
      facts.appendChild(box);
    }

    const actions = document.createElement('div');
    actions.className = 'spotlight-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = `btn-vigan-primary${isSaved ? ' is-saved' : ''}`;
    saveBtn.dataset.spotlightSave = place.id;
    saveBtn.setAttribute('aria-pressed', String(isSaved));
    saveBtn.textContent = isSaved ? 'Saved in My Vigan Plan' : 'Save to My Vigan Plan';

    const openPlanBtn = document.createElement('button');
    openPlanBtn.type = 'button';
    openPlanBtn.className = 'btn-vigan-secondary';
    openPlanBtn.dataset.openPlan = 'true';
    const savedCount = store ? store.getSavedIds().length : 0;
    openPlanBtn.textContent = `View My Plan (${savedCount})`;

    actions.append(saveBtn, openPlanBtn);
    body.append(topMeta, heading, lead, story, facts, actions);
    spotlightEl.append(mediaWrap, body);
  }

  function renderAll({ preserveFocus = true } = {}) {
    const focusToken = preserveFocus ? captureExplorerFocus() : null;
    const filtered = getFilteredPlaces();
    if (filtered.length > 0 && !filtered.some((p) => p.id === activePlaceId)) {
      activePlaceId = filtered[0].id;
      nightModePhoto = false;
    }
    renderFilters();
    renderList(filtered);
    renderSpotlight();
    if (focusToken) restoreExplorerFocus(focusToken);
  }

  function selectPlace(placeId) {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;
    if (activePlaceId !== placeId) {
      activePlaceId = placeId;
      nightModePhoto = false;
      announce(`Showing ${place.name}`);
    }
    renderAll();
  }

  function resetFilters() {
    activeCategory = 'all';
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    announce('Showing all 11 places');
    renderAll({ preserveFocus: false });
  }

  function selectAndFocusPlace(placeId) {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;
    // Always ensure the clicked landmark from the hero loop is visible in the explorer.
    const currentlyVisible = getFilteredPlaces().some((p) => p.id === placeId);
    if (!currentlyVisible) {
      activeCategory = 'all';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
    }
    activePlaceId = placeId;
    nightModePhoto = false;
    announce(`Showing ${place.name}`);
    renderAll({ preserveFocus: false });

    if (sectionEl && typeof sectionEl.scrollIntoView === 'function') {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const heading = spotlightEl?.querySelector('.spotlight-title');
    if (heading && typeof heading.focus === 'function') {
      heading.focus({ preventScroll: true });
    }
  }

  if (filtersEl) {
    filtersEl.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-category]');
      if (!chip) return;
      activeCategory = chip.dataset.category;
      renderAll();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      searchQuery = event.target.value;
      renderAll();
    });
  }

  if (listEl) {
    listEl.addEventListener('click', (event) => {
      const resetBtn = event.target.closest('[data-reset-filters]');
      if (resetBtn) {
        resetFilters();
        return;
      }

      const saveBtn = event.target.closest('[data-save-place]');
      if (saveBtn) {
        store?.toggleStop(saveBtn.dataset.savePlace);
        return;
      }

      const selectBtn = event.target.closest('[data-select-place]');
      if (selectBtn) {
        selectPlace(selectBtn.dataset.selectPlace);
      }
    });
  }

  if (spotlightEl) {
    spotlightEl.addEventListener('click', (event) => {
      const nightBtn = event.target.closest('[data-night-toggle]');
      if (nightBtn) {
        const focusToken = captureExplorerFocus();
        nightModePhoto = !nightModePhoto;
        renderSpotlight();
        restoreExplorerFocus(focusToken);
        return;
      }

      const saveBtn = event.target.closest('[data-spotlight-save]');
      if (saveBtn) {
        store?.toggleStop(saveBtn.dataset.spotlightSave);
        return;
      }

      const openBtn = event.target.closest('[data-open-plan]');
      if (openBtn) {
        onOpenPlan();
      }
    });
  }

  if (store) {
    store.subscribe(() => renderAll());
  }

  renderAll();

  return {
    selectPlace,
    selectAndFocusPlace,
    resetFilters,
    getActivePlaceId: () => activePlaceId
  };
}
