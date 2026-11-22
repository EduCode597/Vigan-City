export function initLightbox({ items = [], gridEl, dialogEl } = {}) {
  let currentIndex = 0;

  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `archive-card ${item.spanClass || 'archive-span-std'}`;
      btn.dataset.galleryIndex = String(index);
      btn.setAttribute('aria-label', `Inspect photo: ${item.title}`);

      const figure = document.createElement('figure');
      figure.className = 'archive-figure';

      const media = document.createElement('div');
      media.className = 'archive-media';

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);

      const caption = document.createElement('figcaption');
      caption.className = 'archive-figcaption';

      const title = document.createElement('strong');
      title.textContent = item.title;

      const summary = document.createElement('span');
      summary.textContent = item.caption;

      caption.append(title, summary);
      figure.append(media, caption);
      btn.appendChild(figure);
      gridEl.appendChild(btn);
    });
  }

  function renderDialogContent() {
    if (!dialogEl || items.length === 0) return;
    const item = items[currentIndex];
    const titleEl = dialogEl.querySelector('[data-lightbox-title]');
    const locEl = dialogEl.querySelector('[data-lightbox-location]');
    const counterEl = dialogEl.querySelector('[data-lightbox-counter]');
    const imgEl = dialogEl.querySelector('[data-lightbox-image]');
    const captionEl = dialogEl.querySelector('[data-lightbox-caption]');

    if (titleEl) titleEl.textContent = item.title;
    if (locEl) locEl.textContent = item.location;
    if (counterEl) counterEl.textContent = `${currentIndex + 1} of ${items.length}`;
    if (imgEl) {
      imgEl.src = item.image;
      imgEl.alt = item.alt;
    }
    if (captionEl) captionEl.textContent = item.caption;
  }

  function openAt(index) {
    if (!items.length || !dialogEl) return;
    currentIndex = ((index % items.length) + items.length) % items.length;
    renderDialogContent();
    if (!dialogEl.open && typeof dialogEl.showModal === 'function') {
      dialogEl.showModal();
    }
  }

  function close() {
    if (dialogEl && dialogEl.open && typeof dialogEl.close === 'function') {
      dialogEl.close();
    }
  }

  function next() {
    if (!items.length) return;
    currentIndex = (currentIndex + 1) % items.length;
    renderDialogContent();
  }

  function prev() {
    if (!items.length) return;
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    renderDialogContent();
  }

  if (gridEl) {
    gridEl.addEventListener('click', (event) => {
      const card = event.target.closest('[data-gallery-index]');
      if (!card) return;
      openAt(Number(card.dataset.galleryIndex));
    });
  }

  if (dialogEl) {
    const prevBtn = dialogEl.querySelector('[data-lightbox-prev]');
    const nextBtn = dialogEl.querySelector('[data-lightbox-next]');
    const closeBtn = dialogEl.querySelector('[data-lightbox-close]');

    if (prevBtn) prevBtn.addEventListener('click', () => prev());
    if (nextBtn) nextBtn.addEventListener('click', () => next());
    if (closeBtn) closeBtn.addEventListener('click', () => close());

    dialogEl.addEventListener('click', (event) => {
      if (event.target === dialogEl) {
        close();
      }
    });

    dialogEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      }
    });
  }

  renderGrid();

  return {
    openAt,
    close,
    next,
    prev,
    getCurrentIndex: () => currentIndex
  };
}
