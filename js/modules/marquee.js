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
  places = [],
  onSelectPlace = () => {}
} = {}) {
  if (!viewport || !track) return;

  track.innerHTML = '';
  track.append(buildGroup(places, false), buildGroup(places, true));

  track.addEventListener('click', (event) => {
    const slide = event.target.closest('.place-slide');
    if (!slide || !slide.dataset.placeId) return;
    onSelectPlace(slide.dataset.placeId);
  });
}
