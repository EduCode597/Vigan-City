import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  applyTheme,
  initTheme
} from '../js/modules/theme.js';

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
      throw new DOMException('Storage blocked', 'SecurityError');
    },
    setItem() {
      throw new DOMException('Storage blocked', 'SecurityError');
    }
  };
}

function mockMatchMedia(prefersDark) {
  return (query) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false
  });
}

describe('theme module', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-bs-theme');
    document.body.innerHTML = '';
  });

  it('uses saved valid theme preference over OS setting', () => {
    const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'dark' });
    expect(resolveInitialTheme({ storage, matchMedia: mockMatchMedia(false) })).toBe('dark');
  });

  it('falls back to OS dark preference when storage is empty', () => {
    const storage = createMemoryStorage();
    expect(resolveInitialTheme({ storage, matchMedia: mockMatchMedia(true) })).toBe('dark');
    expect(resolveInitialTheme({ storage, matchMedia: mockMatchMedia(false) })).toBe('light');
  });

  it('sanitizes corrupted or invalid storage values safely', () => {
    const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'sepia-broken' });
    expect(resolveInitialTheme({ storage, matchMedia: mockMatchMedia(true) })).toBe('dark');
    expect(resolveInitialTheme({ storage, matchMedia: mockMatchMedia(false) })).toBe('light');
  });

  it('survives localStorage SecurityError during init and toggle', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const api = initTheme({
      root: document.documentElement,
      toggleButtons: [btn],
      storage: createThrowingStorage(),
      matchMedia: mockMatchMedia(false)
    });

    expect(api.getTheme()).toBe('light');
    expect(document.documentElement.dataset.bsTheme).toBe('light');

    expect(() => btn.click()).not.toThrow();
    expect(api.getTheme()).toBe('dark');
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
  });

  it('applies data-bs-theme and syncs button labels, aria-pressed, and persistence on toggle', () => {
    const storage = createMemoryStorage();
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="ph ph-moon" aria-hidden="true"></i><span data-theme-label>Dark Mode</span>';
    document.body.appendChild(btn);

    const api = initTheme({
      root: document.documentElement,
      toggleButtons: [btn],
      storage,
      matchMedia: mockMatchMedia(false)
    });

    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.querySelector('[data-theme-label]').textContent).toBe('Dark Mode');

    api.toggleTheme();
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.querySelector('[data-theme-label]').textContent).toBe('Light Mode');

    const applied = applyTheme('invalid-value', { root: document.documentElement, toggleButtons: [btn] });
    expect(applied).toBe('light');
    expect(document.documentElement.dataset.bsTheme).toBe('light');
  });
});
