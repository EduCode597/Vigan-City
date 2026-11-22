export const THEME_STORAGE_KEY = 'vigan-theme';

const VALID_THEMES = new Set(['light', 'dark']);

function getSafeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readSavedTheme(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(THEME_STORAGE_KEY);
    return VALID_THEMES.has(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeSavedTheme(storage, theme) {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be blocked in private browsing; state still works in memory.
  }
}

export function resolveInitialTheme({
  storage = getSafeLocalStorage(),
  matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null
} = {}) {
  const saved = readSavedTheme(storage);
  if (saved) return saved;

  if (matchMedia) {
    try {
      if (matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Ignore matchMedia failure in non-standard environments.
    }
  }
  return 'light';
}

export function applyTheme(
  theme,
  { root = document.documentElement, toggleButtons = [] } = {}
) {
  const normalized = VALID_THEMES.has(theme) ? theme : 'light';
  if (root) {
    root.dataset.bsTheme = normalized;
  }

  const isDark = normalized === 'dark';
  const nextLabel = isDark ? 'Light Mode' : 'Dark Mode';
  const nextAriaLabel = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  for (const btn of toggleButtons) {
    if (!btn) continue;
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', nextAriaLabel);

    const labelEl = btn.querySelector('[data-theme-label]');
    if (labelEl) {
      labelEl.textContent = nextLabel;
    } else {
      btn.textContent = nextLabel;
    }

    const iconEl = btn.querySelector('[data-theme-icon]');
    if (iconEl) {
      iconEl.classList.toggle('ph-sun', isDark);
      iconEl.classList.toggle('ph-moon', !isDark);
    }
  }

  return normalized;
}

export function initTheme({
  root = document.documentElement,
  toggleButtons = [],
  storage = getSafeLocalStorage(),
  matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null
} = {}) {
  const buttons = Array.from(toggleButtons).filter(Boolean);
  let currentTheme = applyTheme(resolveInitialTheme({ storage, matchMedia }), {
    root,
    toggleButtons: buttons
  });

  function setTheme(nextTheme) {
    currentTheme = applyTheme(nextTheme, { root, toggleButtons: buttons });
    writeSavedTheme(storage, currentTheme);
    return currentTheme;
  }

  function toggleTheme() {
    return setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => toggleTheme());
  }

  return {
    getTheme: () => currentTheme,
    setTheme,
    toggleTheme
  };
}
