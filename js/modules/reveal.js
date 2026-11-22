export function initReveal({
  elements = [],
  matchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null,
  IntersectionObserverCtor = typeof IntersectionObserver !== 'undefined'
    ? IntersectionObserver
    : null
} = {}) {
  const list = Array.from(elements).filter(Boolean);
  if (list.length === 0) return;

  let reducedMotion = false;
  if (matchMedia) {
    try {
      reducedMotion = Boolean(matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      reducedMotion = false;
    }
  }

  if (reducedMotion || !IntersectionObserverCtor) {
    for (const el of list) {
      el.classList.add('is-visible');
    }
    return;
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.add('has-reveal');
  }

  const observer = new IntersectionObserverCtor(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (typeof obs?.unobserve === 'function') {
            obs.unobserve(entry.target);
          }
        }
      }
    },
    { threshold: 0.01, rootMargin: '0px' }
  );

  for (const el of list) {
    observer.observe(el);
  }
}

export function initNavSpy({
  links = [],
  sections = [],
  IntersectionObserverCtor = typeof IntersectionObserver !== 'undefined'
    ? IntersectionObserver
    : null
} = {}) {
  const navLinks = Array.from(links).filter(Boolean);
  const sectionList = Array.from(sections).filter(Boolean);
  if (navLinks.length === 0 || sectionList.length === 0 || !IntersectionObserverCtor) return;

  const linkByHash = new Map();
  for (const link of navLinks) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      linkByHash.set(href.slice(1), link);
    }
  }

  function setActive(sectionId) {
    for (const [id, link] of linkByHash.entries()) {
      if (id === sectionId) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  const observer = new IntersectionObserverCtor(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.id && linkByHash.has(entry.target.id)) {
          setActive(entry.target.id);
        }
      }
    },
    { rootMargin: '-25% 0px -55% 0px', threshold: 0 }
  );

  for (const section of sectionList) {
    if (section.id) observer.observe(section);
  }
}
