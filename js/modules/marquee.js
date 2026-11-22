function createSlideButton(place, isClone) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'place-slide';
  btn.dataset.placeId = place.id;
  if (isClone) {
    btn.setAttribute('tabindex', '-1');
  }

  const img = document.createElement('img');
  img.src = place.image;
  img.alt = isClone ? '' : place.alt || place.name;
  img.loading = 'eager';
  img.decoding = 'async';

  const title = document.createElement('strong');
  title.textContent = place.name;

  const intro = document.createElement('span');
  intro.textContent = place.shortIntro;

  btn.append(img, title, intro);
  return btn;
}

function buildGroup(places, isClone) {
  const group = document.createElement('div');
  group.className = 'marquee-group';
  if (isClone) {
    group.setAttribute('aria-hidden', 'true');
  }
  for (const place of places) {
    group.appendChild(createSlideButton(place, isClone));
  }
  return group;
}

export function initMarquee({
  viewport,
  track,
  toggleBtn,
  places = [],
  onSelectPlace = () => {},
  matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null
} = {}) {
  if (!viewport || !track) {
    return {
      isPaused: () => true,
      setPaused: () => {},
      togglePaused: () => {}
    };
  }

  track.innerHTML = '';
  track.append(buildGroup(places, false), buildGroup(places, true));

  let prefersReduced = false;
  if (matchMedia) {
    try {
      prefersReduced = Boolean(matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      prefersReduced = false;
    }
  }

  let paused = prefersReduced;

  function syncUi() {
    viewport.classList.toggle('is-paused', paused);
    viewport.classList.toggle('force-motion', prefersReduced && !paused);

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(paused));
      const labelEl = toggleBtn.querySelector('[data-marquee-label]');
      const labelText = paused ? 'Play loop' : 'Pause loop';
      if (labelEl) {
        labelEl.textContent = labelText;
      } else {
        toggleBtn.textContent = labelText;
      }

      const iconEl = toggleBtn.querySelector('[data-marquee-icon]');
      if (iconEl) {
        iconEl.classList.toggle('ph-play', paused);
        iconEl.classList.toggle('ph-pause', !paused);
      }
    }
  }

  function setPaused(nextPaused) {
    paused = Boolean(nextPaused);
    syncUi();
  }

  function togglePaused() {
    setPaused(!paused);
  }

  track.addEventListener('click', (event) => {
    const slide = event.target.closest('.place-slide');
    if (!slide || !slide.dataset.placeId) return;
    onSelectPlace(slide.dataset.placeId);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => togglePaused());
  }

  syncUi();

  return {
    isPaused: () => paused,
    setPaused,
    togglePaused
  };
}
