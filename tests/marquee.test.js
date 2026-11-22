import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HERO_PLACES } from '../js/data/vigan-data.js';
import { initMarquee } from '../js/modules/marquee.js';

function createMarqueeDom() {
  document.body.innerHTML = `
    <div class="marquee-viewport" id="marqueeViewport">
      <div class="marquee-track" id="marqueeTrack"></div>
    </div>
  `;
  return {
    viewport: document.getElementById('marqueeViewport'),
    track: document.getElementById('marqueeTrack')
  };
}

describe('hero auto-sliding places marquee', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all 11 places in the primary track plus a seamless aria-hidden duplicate group', () => {
    const dom = createMarqueeDom();
    initMarquee({
      ...dom,
      places: HERO_PLACES,
      onSelectPlace: vi.fn()
    });

    const groups = dom.track.querySelectorAll('.marquee-group');
    expect(groups).toHaveLength(2);

    const primaryButtons = groups[0].querySelectorAll('.place-slide');
    const cloneButtons = groups[1].querySelectorAll('.place-slide');

    expect(primaryButtons).toHaveLength(11);
    expect(cloneButtons).toHaveLength(11);
    expect(groups[0].hasAttribute('aria-hidden')).toBe(false);
    expect(groups[1].getAttribute('aria-hidden')).toBe('true');

    for (const btn of cloneButtons) {
      expect(btn.getAttribute('tabindex')).toBe('-1');
      expect(btn.querySelector('img').getAttribute('alt')).toBe('');
    }
    for (const btn of primaryButtons) {
      expect(btn.querySelector('strong').textContent.length).toBeGreaterThan(2);
      expect(btn.querySelector('span').textContent.length).toBeGreaterThan(10);
    }
  });

  it('calls onSelectPlace with the clicked place ID from both primary and duplicate groups', () => {
    const dom = createMarqueeDom();
    const onSelectPlace = vi.fn();
    initMarquee({
      ...dom,
      places: HERO_PLACES,
      onSelectPlace
    });

    const primaryBantay = dom.track.querySelector('.marquee-group:first-child [data-place-id="bantay-bell-tower"]');
    const cloneSyquia = dom.track.querySelector('.marquee-group:last-child [data-place-id="syquia-mansion"]');

    primaryBantay.click();
    cloneSyquia.click();

    expect(onSelectPlace).toHaveBeenNthCalledWith(1, 'bantay-bell-tower');
    expect(onSelectPlace).toHaveBeenNthCalledWith(2, 'syquia-mansion');
  });
});
