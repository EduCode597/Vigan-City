import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GALLERY_ITEMS } from '../js/data/vigan-data.js';
import { initLightbox } from '../js/modules/lightbox.js';
import { initReveal, initNavSpy } from '../js/modules/reveal.js';

function createLightboxDom() {
  document.body.innerHTML = `
    <div id="archiveGrid"></div>
    <dialog id="galleryLightbox" class="dialog">
      <h3 data-lightbox-title></h3>
      <span data-lightbox-location></span>
      <span data-lightbox-counter></span>
      <img data-lightbox-image src="" alt="" />
      <p data-lightbox-caption></p>
      <button type="button" data-lightbox-prev>Previous</button>
      <button type="button" data-lightbox-next>Next</button>
      <button type="button" class="btn-close" data-lightbox-close aria-label="Close"></button>
    </dialog>
  `;
  const dialogEl = document.getElementById('galleryLightbox');
  dialogEl.showModal = vi.fn(() => {
    dialogEl.open = true;
  });
  dialogEl.close = vi.fn(() => {
    dialogEl.open = false;
  });
  return {
    gridEl: document.getElementById('archiveGrid'),
    dialogEl
  };
}

describe('captioned photo archive lightbox', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all 6 captioned plates with figcaption outside the image and opens native dialog with wrapping navigation', () => {
    const dom = createLightboxDom();
    const api = initLightbox({ items: GALLERY_ITEMS, ...dom });

    const tiles = dom.gridEl.querySelectorAll('[data-gallery-index]');
    expect(tiles).toHaveLength(6);
    for (const tile of tiles) {
      expect(tile.querySelector('figcaption strong').textContent.length).toBeGreaterThan(3);
      expect(tile.querySelector('figcaption span').textContent.length).toBeGreaterThan(15);
    }

    // Open first photo
    tiles[0].click();
    expect(dom.dialogEl.showModal).toHaveBeenCalled();
    expect(api.getCurrentIndex()).toBe(0);
    expect(dom.dialogEl.querySelector('[data-lightbox-counter]').textContent).toBe('1 of 6');
    expect(dom.dialogEl.querySelector('[data-lightbox-title]').textContent).toBe(GALLERY_ITEMS[0].title);

    // Wrap backward to last photo via ArrowLeft
    dom.dialogEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(api.getCurrentIndex()).toBe(5);
    expect(dom.dialogEl.querySelector('[data-lightbox-counter]').textContent).toBe('6 of 6');

    // Wrap forward to first photo via Next button
    dom.dialogEl.querySelector('[data-lightbox-next]').click();
    expect(api.getCurrentIndex()).toBe(0);

    // Close button
    dom.dialogEl.querySelector('[data-lightbox-close]').click();
    expect(dom.dialogEl.close).toHaveBeenCalled();
  });
});

describe('reveal and nav spy (IntersectionObserver only)', () => {
  it('reveals elements immediately under prefers-reduced-motion without creating observers', () => {
    document.body.innerHTML = '<div class="reveal"></div><div class="reveal"></div>';
    const elements = document.querySelectorAll('.reveal');
    const MockIO = vi.fn();

    initReveal({
      elements,
      matchMedia: () => ({ matches: true }),
      IntersectionObserverCtor: MockIO
    });

    expect(MockIO).not.toHaveBeenCalled();
    for (const el of elements) {
      expect(el.classList.contains('is-visible')).toBe(true);
    }
  });

  it('reveals elements when IntersectionObserver reports intersection and updates active nav link', () => {
    document.body.innerHTML = `
      <nav>
        <a href="#why-vigan">Why Vigan</a>
        <a href="#landmarks">Landmarks</a>
      </nav>
      <section id="why-vigan" class="reveal"></section>
      <section id="landmarks" class="reveal"></section>
    `;

    const callbacks = [];
    class FakeIO {
      constructor(cb) {
        callbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('nav a');

    initReveal({
      elements: sections,
      matchMedia: () => ({ matches: false }),
      IntersectionObserverCtor: FakeIO
    });
    initNavSpy({ links, sections, IntersectionObserverCtor: FakeIO });

    // Trigger reveal callback
    callbacks[0]([{ isIntersecting: true, target: sections[0] }]);
    expect(sections[0].classList.contains('is-visible')).toBe(true);

    // Trigger nav spy callback
    callbacks[1]([{ isIntersecting: true, target: sections[1] }]);
    expect(links[1].getAttribute('aria-current')).toBe('location');
    expect(links[0].hasAttribute('aria-current')).toBe(false);
  });
});
