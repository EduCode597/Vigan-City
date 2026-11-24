import {
  PLACES,
  HERO_PLACES,
  PLACE_CATEGORIES,
  HERITAGE_FACTS,
  CULTURE_ITEMS,
  GALLERY_ITEMS,
  TRIP_PRESETS,
  TRAVEL_ESSENTIALS,
  FAQ_ITEMS
} from './data/vigan-data.js';
import {
  CHATBOT_KNOWLEDGE,
  WELCOME_MESSAGE,
  STARTER_SUGGESTIONS
} from './data/chatbot-knowledge.js';
import { initTheme } from './modules/theme.js';
import { initMarquee } from './modules/marquee.js';
import { createItineraryStore, initItineraryDrawer } from './modules/itinerary.js';
import { initExplorer } from './modules/explorer.js';
import { initLightbox } from './modules/lightbox.js';
import { initReveal, initNavSpy } from './modules/reveal.js';
import { buildKnowledgeBase, createConversation } from './modules/chatbot-engine.js';
import { initChatbot } from './modules/chatbot.js';

function renderHeritageFacts(container) {
  if (!container) return;
  container.innerHTML = '';
  for (const fact of HERITAGE_FACTS) {
    const card = document.createElement('div');
    card.className = 'heritage-pillar';

    const metric = document.createElement('div');
    metric.className = 'heritage-metric';
    metric.textContent = fact.metric;

    const title = document.createElement('h3');
    title.textContent = fact.title;

    const detail = document.createElement('p');
    detail.textContent = fact.detail;

    card.append(metric, title, detail);
    container.appendChild(card);
  }
}

function renderCultureSection(container) {
  if (!container) return;
  container.innerHTML = '';

  const featured = CULTURE_ITEMS.find((item) => item.featured) || CULTURE_ITEMS[0];
  const rest = CULTURE_ITEMS.filter((item) => item !== featured);

  const featureCard = document.createElement('article');
  featureCard.className = 'culture-feature';

  const featureImg = document.createElement('img');
  featureImg.src = featured.image;
  featureImg.alt = featured.alt;
  featureImg.loading = 'lazy';
  featureImg.decoding = 'async';

  const featureBody = document.createElement('div');
  featureBody.className = 'culture-feature-body';

  const featureKicker = document.createElement('span');
  featureKicker.className = 'culture-kicker';
  featureKicker.textContent = `${featured.kind} - ${featured.location}`;

  const featureTitle = document.createElement('h3');
  featureTitle.textContent = featured.name;

  const featureSummary = document.createElement('p');
  featureSummary.textContent = featured.summary;

  const featureTip = document.createElement('p');
  featureTip.className = 'culture-tip';
  featureTip.textContent = featured.tip;

  featureBody.append(featureKicker, featureTitle, featureSummary, featureTip);
  featureCard.append(featureImg, featureBody);

  const stack = document.createElement('div');
  stack.className = 'culture-stack';

  for (const item of rest) {
    const row = document.createElement('article');
    row.className = 'culture-row';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.alt;
    img.loading = 'lazy';
    img.decoding = 'async';

    const body = document.createElement('div');

    const kicker = document.createElement('span');
    kicker.className = 'culture-kicker';
    kicker.textContent = `${item.kind} - ${item.location}`;

    const title = document.createElement('h3');
    title.textContent = item.name;

    const summary = document.createElement('p');
    summary.textContent = item.summary;

    body.append(kicker, title, summary);
    row.append(img, body);
    stack.appendChild(row);
  }

  container.append(featureCard, stack);
}

function renderTravelEssentials(container) {
  if (!container) return;
  container.innerHTML = '';

  for (const item of TRAVEL_ESSENTIALS) {
    const block = document.createElement('article');
    block.className = 'essential-block';

    const head = document.createElement('div');
    head.className = 'essential-head';

    const icon = document.createElement('i');
    icon.className = `ph ${item.icon}`;
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h3');
    title.textContent = item.title;

    head.append(icon, title);

    const summary = document.createElement('p');
    summary.className = 'essential-summary';
    summary.textContent = item.summary;

    const ul = document.createElement('ul');
    ul.className = 'essential-list';
    for (const bullet of item.bullets) {
      const li = document.createElement('li');
      li.textContent = bullet;
      ul.appendChild(li);
    }

    block.append(head, summary, ul);
    container.appendChild(block);
  }
}

function renderFaqAccordion(container) {
  if (!container) return;
  container.innerHTML = '';

  for (const faq of FAQ_ITEMS) {
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.setAttribute('name', 'visitFaq');
    if (faq.defaultOpen) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'accordion-header focus-ring';

    const qText = document.createElement('span');
    qText.textContent = faq.question;

    const icon = document.createElement('i');
    icon.className = 'ph ph-plus accordion-toggle-icon';
    icon.setAttribute('aria-hidden', 'true');

    summary.append(qText, icon);

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.textContent = faq.answer;

    details.append(summary, body);
    container.appendChild(details);
  }
}

function wireNativeDrawers(planDrawerApi) {
  const planTriggerBtn = document.getElementById('planTriggerBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileOpenPlanBtn = document.getElementById('mobileOpenPlanBtn');

  if (planTriggerBtn) {
    planTriggerBtn.addEventListener('click', () => planDrawerApi.openDrawer());
  }

  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      if (!mobileNavDrawer.open && typeof mobileNavDrawer.showModal === 'function') {
        mobileNavDrawer.showModal();
      }
    });
    mobileNavDrawer.addEventListener('click', (event) => {
      if (event.target === mobileNavDrawer && typeof mobileNavDrawer.close === 'function') {
        mobileNavDrawer.close();
      }
    });
  }

  if (mobileOpenPlanBtn && mobileNavDrawer) {
    mobileOpenPlanBtn.addEventListener('click', () => {
      if (mobileNavDrawer.open && typeof mobileNavDrawer.close === 'function') {
        mobileNavDrawer.close();
      }
      planDrawerApi.openDrawer();
    });
  }

  document.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', () => {
      const targetId = el.getAttribute('data-close-drawer');
      const dialog = document.getElementById(targetId);
      if (dialog && dialog.open && typeof dialog.close === 'function') {
        dialog.close();
      }
    });
  });
}

export function extractPageContext(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) {
    return {
      whyIntro: '',
      developer: {
        name: '',
        handle: '',
        portfolioUrl: '',
        githubUrl: '',
        linkedinUrl: '',
        email: ''
      }
    };
  }

  const whyIntroEl = doc.querySelector('#why-vigan .why-intro p');
  const whyIntro = whyIntroEl?.textContent?.replace(/\s+/g, ' ').trim() || '';

  const devCard = doc.querySelector('.footer-dev-card');
  const name = devCard?.querySelector('.footer-dev-name')?.textContent?.trim() || '';
  const handle = devCard?.querySelector('.footer-dev-handle')?.textContent?.trim() || '';

  const portfolioAnchor =
    devCard?.querySelector('.footer-portfolio-btn[href]') ||
    Array.from(devCard?.querySelectorAll('a[href]') || []).find((anchor) => {
      const href = anchor.getAttribute('href') || '';
      return (
        href.startsWith('http') &&
        !href.includes('github.com') &&
        !href.includes('linkedin.com')
      );
    });
  const portfolioUrl = portfolioAnchor?.getAttribute('href')?.trim() || '';

  const githubUrl =
    devCard?.querySelector('a[href*="github.com"]')?.getAttribute('href')?.trim() || '';
  const linkedinUrl =
    devCard?.querySelector('a[href*="linkedin.com"]')?.getAttribute('href')?.trim() || '';
  const emailHref =
    devCard?.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.trim() || '';
  const email = emailHref.replace(/^mailto:/i, '').trim();

  return {
    whyIntro,
    developer: {
      name,
      handle,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      email
    }
  };
}

function bootstrapApp() {
  initTheme({
    root: document.documentElement,
    toggleButtons: document.querySelectorAll('[data-theme-toggle]')
  });

  renderHeritageFacts(document.getElementById('heritageFactsGrid'));
  renderCultureSection(document.getElementById('cultureGrid'));
  renderTravelEssentials(document.getElementById('travelEssentialsList'));
  renderFaqAccordion(document.getElementById('visitFaqList'));

  const itineraryStore = createItineraryStore({
    places: PLACES,
    presets: TRIP_PRESETS
  });

  const planDrawerApi = initItineraryDrawer({
    store: itineraryStore,
    presets: TRIP_PRESETS,
    drawerEl: document.getElementById('planDrawer'),
    listEl: document.getElementById('planList'),
    summaryEl: document.getElementById('planSummary'),
    countEls: document.querySelectorAll('[data-plan-count]'),
    copyBtn: document.getElementById('copyPlanBtn'),
    clearBtn: document.getElementById('clearPlanBtn'),
    statusEl: document.getElementById('planStatus')
  });

  const explorerApi = initExplorer({
    places: PLACES,
    categories: PLACE_CATEGORIES,
    store: itineraryStore,
    sectionEl: document.getElementById('landmarks'),
    filtersEl: document.getElementById('explorerFilters'),
    searchInput: document.getElementById('explorerSearch'),
    listEl: document.getElementById('explorerList'),
    spotlightEl: document.getElementById('explorerSpotlight'),
    statusEl: document.getElementById('explorerStatus'),
    onOpenPlan: () => planDrawerApi.openDrawer()
  });

  initMarquee({
    viewport: document.getElementById('marqueeViewport'),
    track: document.getElementById('marqueeTrack'),
    places: HERO_PLACES,
    onSelectPlace: (placeId) => explorerApi.selectAndFocusPlace(placeId)
  });

  initLightbox({
    items: GALLERY_ITEMS,
    gridEl: document.getElementById('archiveGrid'),
    dialogEl: document.getElementById('galleryLightbox')
  });

  wireNativeDrawers(planDrawerApi);

  initReveal({
    elements: document.querySelectorAll('.reveal')
  });

  initNavSpy({
    links: document.querySelectorAll('.site-nav-link'),
    sections: document.querySelectorAll('main section[id]')
  });

  try {
    const kb = buildKnowledgeBase(
      {
        places: PLACES,
        categories: PLACE_CATEGORIES,
        heritageFacts: HERITAGE_FACTS,
        cultureItems: CULTURE_ITEMS,
        galleryItems: GALLERY_ITEMS,
        presets: TRIP_PRESETS,
        travelEssentials: TRAVEL_ESSENTIALS,
        faqItems: FAQ_ITEMS,
        pageContext: extractPageContext(document)
      },
      CHATBOT_KNOWLEDGE
    );
    const conversation = createConversation(kb);
    const chatApi = initChatbot({
      conversation,
      fabEl: document.getElementById('chatFab'),
      panelEl: document.getElementById('chatPanel'),
      closeBtn: document.getElementById('chatCloseBtn'),
      messagesEl: document.getElementById('chatMessages'),
      suggestionsEl: document.getElementById('chatSuggestions'),
      formEl: document.getElementById('chatForm'),
      inputEl: document.getElementById('chatInput'),
      welcomeMessage: WELCOME_MESSAGE,
      starterSuggestions: STARTER_SUGGESTIONS,
      onViewPlace: (id) => explorerApi.selectAndFocusPlace(id),
      onAddPlace: (id) => {
        if (!itineraryStore.hasStop(id)) itineraryStore.toggleStop(id);
      },
      onLoadPreset: (id) => {
        itineraryStore.applyPreset(id);
        planDrawerApi.openDrawer();
      },
      isPlaceSaved: (id) => itineraryStore.hasStop(id),
      hasAnySavedStops: () => itineraryStore.getSavedIds().length > 0
    });

    itineraryStore.subscribe(() => chatApi.syncActionStates());
  } catch (err) {
    console.error('Ask Vigan chatbot failed to initialize:', err);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
}
