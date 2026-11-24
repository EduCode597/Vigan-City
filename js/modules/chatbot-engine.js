import {
  OUT_OF_SCOPE_MESSAGE,
  WELCOME_MESSAGE,
  STARTER_SUGGESTIONS,
  CHATBOT_KNOWLEDGE
} from '../data/chatbot-knowledge.js';

const SCORE_THRESHOLD = 5;

const GENERIC_TITLE_TOKENS = new Set([
  'house',
  'museum',
  'plaza',
  'garden',
  'park',
  'resort',
  'street',
  'boulevard',
  'barangay',
  'district',
  'center',
  'zone',
  'factory',
  'craft',
  'car',
  'cars',
  'free',
  'open',
  'air',
  'shops',
  'lights',
  'light',
  'dark',
  'night',
  'morning',
  'afternoon',
  'dusk',
  'fresh',
  'links',
  'living',
  'classic',
  'highlights',
  'heritage',
  'weekend',
  'getting',
  'staying',
  'over',
  'around',
  'best',
  'season',
  'visit',
  'time',
  'go',
  'travel',
  'ways',
  'built',
  'outlast',
  'set',
  'frozen',
  'neighborhood',
  'preserved',
  'plan',
  'hills',
  'parks',
  'crafts',
  'gardens',
  'outskirts',
  'buy',
  'bring',
  'home',
  'days',
  'needed',
  'charge',
  'expensive',
  'walking',
  'drive',
  'public',
  'squares',
  'local',
  'suggested',
  'routes',
  'must',
  'spots',
  'attractions',
  'tourist',
  'pictures',
  'photos',
  'scenes',
  'modest'
]);

const FOOTER_LINK_TOKENS = new Set([
  'email',
  'contact',
  'website',
  'link',
  'url',
  'github',
  'linkedin',
  'portfolio'
]);

const SITE_HELP_EXEMPT_TOKENS = new Set([
  ...FOOTER_LINK_TOKENS,
  'open',
  'opens',
  'close',
  'closes'
]);

const FOLLOWUP_PRONOUN_TOKENS = new Set(['it', 'its', 'there']);
const FOLLOWUP_PRONOUN_PHRASES = [
  'that place',
  'this place',
  'this landmark',
  'that landmark'
];

const PRICELESS_TYPES = new Set([
  'culture',
  'gallery',
  'travel-essential',
  'heritage-fact',
  'why-vigan',
  'preset',
  'site-help'
]);

/**
 * Normalizes a visitor question for deterministic matching.
 * Lowercases, strips diacritics and punctuation, collapses spaces, and caps raw length at 300 chars.
 * @param {string} raw
 * @returns {{ normalized: string, tokens: string[] }}
 */
export function normalizeQuestion(raw) {
  const capped = typeof raw === 'string' ? raw.slice(0, 300) : '';
  const normalized = capped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized ? normalized.split(' ') : [];
  return { normalized, tokens };
}

function normalizePhrase(text) {
  return normalizeQuestion(text).normalized;
}

function containsPhrase(normalizedHaystack, normalizedPhrase) {
  if (!normalizedHaystack || !normalizedPhrase) return false;
  return ` ${normalizedHaystack} `.includes(` ${normalizedPhrase} `);
}

function levenshteinDistance(a, b) {
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return 2;
  if (a === b) return 0;

  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j += 1) prev[j] = j;

  for (let i = 1; i <= lenA; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > 1) return 2;
    const swap = prev;
    prev = curr;
    curr = swap;
  }

  return prev[lenB];
}

function extractSignificantTokens(text, stopwords, allowGeneric = false) {
  const { tokens } = normalizeQuestion(text);
  return tokens.filter(
    (token) =>
      token.length > 1 &&
      !stopwords.has(token) &&
      (allowGeneric || !GENERIC_TITLE_TOKENS.has(token))
  );
}

function buildPhraseList(items, baseWeight, fixedWeight = null) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const text = normalizePhrase(raw);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const wordCount = text.split(' ').length;
    out.push({
      text,
      weight: fixedWeight !== null ? fixedWeight : baseWeight + wordCount * 6
    });
  }
  return out;
}

function makePlaceActions(place) {
  return [
    { type: 'view-place', id: place.id, label: 'View in explorer' },
    { type: 'add-place', id: place.id, label: '+ Add to my plan' }
  ];
}

function makePresetActions(preset) {
  return [{ type: 'load-preset', id: preset.id, label: 'Load this plan' }];
}

function getPlaceSuggestions(place) {
  return [
    `How much is ${place.name}?`,
    `Best time to visit ${place.name}?`,
    `Where is ${place.name}?`,
    'Plan 1 day'
  ];
}

function buildPlaceEntries(places, placeAliases, stopwords) {
  return places.map((place) => {
    const aliases = placeAliases[place.id] || [];
    const exactPhrases = [
      ...buildPhraseList([place.name], 24),
      ...buildPhraseList(aliases, 16)
    ];

    const keywords = new Set([
      ...extractSignificantTokens(place.name, stopwords, false),
      ...aliases.flatMap((alias) => extractSignificantTokens(alias, stopwords, false))
    ]);

    const bodyTokens = new Set([
      ...extractSignificantTokens(place.highlight, stopwords, false),
      ...extractSignificantTokens(place.zone, stopwords, false)
    ]);

    return {
      id: `place:${place.id}`,
      type: 'place',
      title: place.name,
      exactPhrases,
      keywords,
      bodyTokens,
      payload: place
    };
  });
}

function buildCultureEntries(cultureItems, cultureAliases, stopwords) {
  return cultureItems.map((item) => {
    const aliases = cultureAliases[item.id] || [];
    const exactPhrases = [
      ...buildPhraseList([item.name], 24),
      ...buildPhraseList(aliases, 16)
    ];
    const keywords = new Set([
      ...extractSignificantTokens(item.name, stopwords, false),
      ...aliases.flatMap((alias) => extractSignificantTokens(alias, stopwords, false))
    ]);
    const bodyTokens = new Set([
      ...extractSignificantTokens(item.kind, stopwords, false),
      ...extractSignificantTokens(item.location, stopwords, false)
    ]);

    return {
      id: `culture:${item.id}`,
      type: 'culture',
      title: item.name,
      exactPhrases,
      keywords,
      bodyTokens,
      payload: item
    };
  });
}

function buildCategoryEntries(categories, categoryAliases, stopwords) {
  const entries = [];

  for (const cat of categories) {
    if (cat.id === 'all') continue;
    const aliases = categoryAliases[cat.id] || [];
    const exactPhrases = [
      ...buildPhraseList([cat.label], 22),
      ...buildPhraseList(aliases, 16)
    ];
    const keywords = new Set([
      ...extractSignificantTokens(cat.label, stopwords, false),
      ...aliases.flatMap((a) => extractSignificantTokens(a, stopwords, false))
    ]);
    entries.push({
      id: `cat:${cat.id}`,
      type: 'category',
      title: cat.label,
      exactPhrases,
      keywords,
      bodyTokens: new Set(),
      payload: { kind: 'place-category', category: cat }
    });
  }

  const groupSpecs = [
    { key: 'plazas', title: 'Vigan Plazas', groupKind: 'plazas' },
    { key: 'fees', title: 'Entrance Fees', groupKind: 'fees' },
    { key: 'food', title: 'Ilocano Food', groupKind: 'food' },
    { key: 'crafts', title: 'Living Crafts', groupKind: 'crafts' },
    { key: 'why-vigan', title: 'Why Vigan Is Famous', groupKind: 'why-vigan' },
    { key: 'presets', title: 'Trip Presets', groupKind: 'presets' },
    { key: 'gallery', title: 'Photo Archive', groupKind: 'gallery' },
    { key: 'landmarks', title: 'Vigan Landmarks', groupKind: 'landmarks' }
  ];

  for (const spec of groupSpecs) {
    const aliases = categoryAliases[spec.key] || [];
    if (!aliases.length) continue;
    const exactPhrases = buildPhraseList(aliases, 16);
    const keywords = new Set(
      aliases.flatMap((a) => extractSignificantTokens(a, stopwords, false))
    );
    if (spec.key === 'fees') {
      keywords.add('free');
    }
    entries.push({
      id: `cat:${spec.key}`,
      type: 'category',
      title: spec.title,
      exactPhrases,
      keywords,
      bodyTokens: new Set(),
      payload: { kind: spec.groupKind }
    });
  }

  return entries;
}

function buildHeritageEntries(heritageFacts, stopwords) {
  return heritageFacts.map((fact, idx) => {
    const extraPhrases = containsPhrase(normalizePhrase(fact.detail), 'world war')
      ? ['world war', 'world war ii', 'world war 2', 'wwii', 'ww2']
      : [];
    const exactPhrases = [
      ...buildPhraseList([fact.title, fact.metric, `${fact.metric} ${fact.title}`], 24),
      ...buildPhraseList(extraPhrases, 18)
    ];
    const keywords = new Set([
      ...extractSignificantTokens(fact.metric, stopwords, true),
      ...extractSignificantTokens(fact.title, stopwords, false),
      ...extractSignificantTokens(fact.detail, stopwords, false).filter((t) =>
        ['unesco', 'new7wonders', 'earthquakes', 'typhoons', 'capiz', 'narra', 'colonial', '2015', '1999', '233'].includes(t)
      )
    ]);
    return {
      id: `heritage:${idx}`,
      type: 'heritage-fact',
      title: `${fact.metric} - ${fact.title}`,
      exactPhrases,
      keywords,
      bodyTokens: new Set(extractSignificantTokens(fact.detail, stopwords, false)),
      payload: fact
    };
  });
}

function buildGalleryEntries(galleryItems, stopwords) {
  return galleryItems.map((item) => {
    const exactPhrases = buildPhraseList([item.title], 26);
    const keywords = new Set(
      extractSignificantTokens(item.title, stopwords, false).filter(
        (t) => t !== 'vigan'
      )
    );
    const bodyTokens = new Set(
      extractSignificantTokens(`${item.location} ${item.caption}`, stopwords, false)
    );
    return {
      id: `gallery:${item.id}`,
      type: 'gallery',
      title: item.title,
      exactPhrases,
      keywords,
      bodyTokens,
      payload: item
    };
  });
}

function buildPresetEntries(presets, stopwords) {
  const presetAliasMap = {
    'one-day-classic': [
      'plan 1 day',
      'plan one day',
      'plan for 1 day',
      '1 day plan',
      '1 day itinerary',
      '1 day trip',
      '1 day in vigan',
      'one day plan',
      'one day itinerary',
      'one day trip',
      'one day in vigan',
      'one day classic',
      '1 day classic'
    ],
    'two-day-heritage': [
      'plan 2 days',
      'plan two days',
      'plan for 2 days',
      '2 day plan',
      '2 days plan',
      'two day plan',
      'two days plan',
      '2 day itinerary',
      '2 days itinerary',
      'two day itinerary',
      'two days itinerary',
      '2 day trip',
      '2 days trip',
      'two day trip',
      'two days trip',
      '2 days in vigan',
      'two days in vigan',
      '2 day heritage',
      'weekend plan',
      'weekend trip',
      'weekend itinerary'
    ]
  };
  const lowWeightFallbackMap = {
    'one-day-classic': ['1 day', 'one day'],
    'two-day-heritage': ['2 day', '2 days', 'two day', 'two days']
  };

  return presets.map((preset) => {
    const aliases = presetAliasMap[preset.id] || [];
    const fallbackPhrases = lowWeightFallbackMap[preset.id] || [];
    const exactPhrases = [
      ...buildPhraseList([preset.name], 26),
      ...buildPhraseList(aliases, 18),
      ...buildPhraseList(fallbackPhrases, 0, 12)
    ];
    const keywords = new Set([
      ...extractSignificantTokens(preset.name, stopwords, false),
      ...aliases.flatMap((a) => extractSignificantTokens(a, stopwords, false))
    ]);
    return {
      id: `preset:${preset.id}`,
      type: 'preset',
      title: preset.name,
      exactPhrases,
      keywords,
      bodyTokens: new Set(extractSignificantTokens(preset.subtitle, stopwords, false)),
      payload: preset
    };
  });
}

function buildTravelEssentialEntries(travelEssentials, stopwords) {
  const essentialAliasMap = {
    'getting-there': [
      'how to get there',
      'how to get to vigan',
      'how do i get to vigan',
      'how do i get there',
      'how can i get to vigan',
      'ways to get to vigan',
      'travel to vigan',
      'how to go to vigan',
      'getting to vigan',
      'bus from manila',
      'partas',
      'farinas',
      'gv florida',
      'tplex',
      'laoag airport',
      'flight to laoag',
      'drive to vigan',
      'directions to vigan'
    ],
    'best-season': [
      'best season',
      'best season and festivals',
      'best months to visit',
      'best month',
      'best months',
      'best time to visit',
      'best time to go',
      'when to visit',
      'when should i visit',
      'when is the best time',
      'what is the best time',
      'longganisa festival',
      'viva vigan',
      'binatbatan',
      'weather',
      'climate',
      'fiesta',
      'festivals'
    ],
    'getting-around': [
      'getting around',
      'getting around vigan',
      'how to get around',
      'how do i get around',
      'how can i get around',
      'getting around and staying over',
      'where to stay',
      'staying over',
      'hotel',
      'hotels',
      'ancestral inns',
      'tricycle',
      'kalesa tour'
    ]
  };
  // Keep landmark-ambiguous best-time phrases below specific place scores so landmark queries still win.
  const genericBestTimePhrases = new Set([
    'best time to visit',
    'best time to go',
    'when to visit',
    'when should i visit',
    'when is the best time',
    'what is the best time'
  ]);

  return travelEssentials.map((item) => {
    const aliases = essentialAliasMap[item.id] || [];
    const specificAliases =
      item.id === 'best-season'
        ? aliases.filter((a) => !genericBestTimePhrases.has(a))
        : aliases;
    const genericAliases =
      item.id === 'best-season'
        ? aliases.filter((a) => genericBestTimePhrases.has(a))
        : [];
    const exactPhrases = [
      ...buildPhraseList([item.title], 24),
      ...buildPhraseList(specificAliases, 16),
      ...buildPhraseList(genericAliases, 0, 12)
    ];
    const keywords = new Set([
      ...extractSignificantTokens(item.title, stopwords, false),
      ...aliases.flatMap((a) => extractSignificantTokens(a, stopwords, false))
    ]);
    const bodyTokens = new Set([
      ...extractSignificantTokens(item.summary, stopwords, false),
      ...item.bullets.flatMap((b) => extractSignificantTokens(b, stopwords, false))
    ]);
    return {
      id: `essential:${item.id}`,
      type: 'travel-essential',
      title: item.title,
      exactPhrases,
      keywords,
      bodyTokens,
      payload: item
    };
  });
}

function buildFaqEntries(faqItems, stopwords) {
  const faqAliasMap = {
    'faq-days': ['how many days', 'days needed', 'how long should i stay'],
    'faq-fees': ['charge expensive entrance fees'],
    'faq-footwear': [
      'what should i wear',
      'what to wear',
      'footwear',
      'walking shoes',
      'dress code',
      'modest attire'
    ],
    'faq-pasalubong': [
      'pasalubong',
      'what to buy',
      'souvenirs',
      'bring home',
      'royal bibingka',
      'bibingka'
    ]
  };

  return faqItems.map((faq) => {
    const aliases = faqAliasMap[faq.id] || [];
    const exactPhrases = [
      ...buildPhraseList([faq.question], 28),
      ...buildPhraseList(aliases, 18)
    ];
    const keywords = new Set(
      aliases.flatMap((a) => extractSignificantTokens(a, stopwords, false))
    );
    const bodyTokens = new Set(extractSignificantTokens(faq.question, stopwords, false));
    return {
      id: `faq:${faq.id}`,
      type: 'faq',
      title: faq.question,
      exactPhrases,
      keywords,
      bodyTokens,
      payload: faq
    };
  });
}

function buildDeveloperEntries(developer, stopwords) {
  if (!developer || !developer.name) return [];
  const phrases = [
    developer.name,
    developer.handle,
    'who made this website',
    'who built this website',
    'who created this website',
    'who made this site',
    'who created this site',
    'who built this site',
    'who made the site',
    'who made the website',
    'who created the site',
    'who created the website',
    'who built the site',
    'who built the website',
    'who developed',
    'site author',
    'website author',
    'author of this site',
    'author of this website',
    'about the developer',
    'developer email',
    'contact developer'
  ].filter(Boolean);

  const keywords = new Set([
    ...extractSignificantTokens(developer.name, stopwords, true),
    ...extractSignificantTokens(developer.handle || '', stopwords, true),
    'developer',
    'creator',
    'programmer',
    'educode',
    'educode597',
    'portfolio',
    'github',
    'linkedin'
  ]);

  return [
    {
      id: 'developer:card',
      type: 'developer',
      title: developer.name,
      exactPhrases: buildPhraseList(phrases, 22),
      keywords,
      bodyTokens: new Set(['email', 'contact']),
      payload: developer
    }
  ];
}

function buildSiteHelpEntries(siteHelpEntries, stopwords) {
  return siteHelpEntries.map((entry) => ({
    id: `help:${entry.id}`,
    type: 'site-help',
    title: entry.title,
    exactPhrases: [
      ...buildPhraseList([entry.title], 22),
      ...buildPhraseList(entry.phrases || [], 18)
    ],
    keywords: new Set([
      ...(entry.tokens || []).map((t) => normalizePhrase(t)).filter(Boolean),
      ...extractSignificantTokens(entry.title, stopwords, false)
    ]),
    bodyTokens: new Set(),
    payload: entry
  }));
}

/**
 * Builds the deterministic in-memory KnowledgeBase from live site data and bot metadata.
 * @param {object} siteData
 * @param {object} [knowledge]
 */
export function buildKnowledgeBase(siteData, knowledge = CHATBOT_KNOWLEDGE) {
  const mergedKnowledge = {
    ...CHATBOT_KNOWLEDGE,
    ...(knowledge || {})
  };
  const stopwords = new Set(
    (mergedKnowledge.stopwords || []).map((w) => normalizePhrase(w)).filter(Boolean)
  );

  const places = siteData?.places || [];
  const categories = siteData?.categories || [];
  const heritageFacts = siteData?.heritageFacts || [];
  const cultureItems = siteData?.cultureItems || [];
  const galleryItems = siteData?.galleryItems || [];
  const presets = siteData?.presets || [];
  const travelEssentials = siteData?.travelEssentials || [];
  const faqItems = siteData?.faqItems || [];
  const pageContext = siteData?.pageContext || {};

  const placesById = new Map(places.map((p) => [p.id, p]));

  const entries = [
    ...buildPlaceEntries(places, mergedKnowledge.placeAliases || {}, stopwords),
    ...buildCultureEntries(cultureItems, mergedKnowledge.cultureAliases || {}, stopwords),
    ...buildCategoryEntries(categories, mergedKnowledge.categoryAliases || {}, stopwords),
    ...buildHeritageEntries(heritageFacts, stopwords),
    ...buildGalleryEntries(galleryItems, stopwords),
    ...buildPresetEntries(presets, stopwords),
    ...buildTravelEssentialEntries(travelEssentials, stopwords),
    ...buildFaqEntries(faqItems, stopwords),
    ...buildDeveloperEntries(pageContext.developer, stopwords),
    ...buildSiteHelpEntries(mergedKnowledge.siteHelpEntries || [], stopwords)
  ];

  const normalizedUnsupportedPhrases = (mergedKnowledge.unsupportedDetailPhrases || [])
    .map(normalizePhrase)
    .filter(Boolean);
  const unsupportedTokenSet = new Set(
    (mergedKnowledge.unsupportedDetailTokens || []).map(normalizePhrase).filter(Boolean)
  );

  return {
    places,
    placesById,
    categories,
    heritageFacts,
    cultureItems,
    galleryItems,
    presets,
    travelEssentials,
    faqItems,
    pageContext,
    knowledge: mergedKnowledge,
    stopwords,
    entries,
    normalizedUnsupportedPhrases,
    unsupportedTokenSet
  };
}

function detectIntent(normalized, tokens, intentKeywords) {
  const tokenSet = new Set(tokens);
  const scores = {};

  for (const [intentName, config] of Object.entries(intentKeywords || {})) {
    let score = 0;
    for (const phrase of config.phrases || []) {
      const normalizedPhrase = normalizePhrase(phrase);
      if (intentName === 'fee' && normalizedPhrase === 'how much') {
        if (/\bhow much\b(?!\s+(?:more\s+|extra\s+)?time\b)/.test(normalized)) {
          score += 3;
        }
        continue;
      }
      if (containsPhrase(normalized, normalizedPhrase)) {
        score += normalizedPhrase.split(' ').length >= 3 ? 4 : 3;
      }
    }
    for (const token of config.tokens || []) {
      if (tokenSet.has(normalizePhrase(token))) {
        score += 2;
      }
    }
    scores[intentName] = score;
  }

  // Review Focus #1: bare "when" only contributes to bestTime when paired with visit/go/best.
  if (
    tokenSet.has('when') &&
    (tokenSet.has('visit') || tokenSet.has('go') || tokenSet.has('best'))
  ) {
    scores.bestTime = (scores.bestTime || 0) + 2;
  }

  if ((scores.history || 0) > 0 && (scores.history || 0) >= (scores.bestTime || 0)) {
    return 'history';
  }

  const orderedIntents = ['fee', 'bestTime', 'duration', 'location', 'highlight', 'history'];
  let bestIntent = 'general';
  let bestScore = 0;
  for (const name of orderedIntents) {
    if ((scores[name] || 0) > bestScore) {
      bestScore = scores[name];
      bestIntent = name;
    }
  }
  return bestIntent;
}

function findMatchedUnsupportedTriggers(normalized, tokens, kb) {
  const sanitizedNormalized = normalized
    .replace(/\bopen air\b/g, 'openair')
    .replace(/\bhow close\b/g, 'howclose')
    .replace(/\bclose to\b/g, 'closeto')
    .replace(/\bclose by\b/g, 'closeby');
  const sanitizedTokens = sanitizedNormalized ? sanitizedNormalized.split(' ') : [];
  const matchedPhrases = [];
  const matchedTokens = [];

  for (const phrase of kb.normalizedUnsupportedPhrases) {
    if (containsPhrase(sanitizedNormalized, phrase)) {
      matchedPhrases.push(phrase);
    }
  }
  for (const token of sanitizedTokens) {
    if (kb.unsupportedTokenSet.has(token)) {
      matchedTokens.push(token);
    }
  }
  return { matchedPhrases, matchedTokens };
}

function shouldDowngradeToPartial(winner, intent, triggers) {
  const { matchedPhrases, matchedTokens } = triggers;
  const hasAnyTrigger = matchedPhrases.length > 0 || matchedTokens.length > 0;

  if (winner.type === 'developer') {
    const hasEmailToken = matchedTokens.includes('email');
    const hasNonFooterPhrase = matchedPhrases.length > 0;
    const hasNonFooterToken = matchedTokens.some(
      (t) => !FOOTER_LINK_TOKENS.has(t) && !(t === 'address' && hasEmailToken)
    );
    return hasNonFooterPhrase || hasNonFooterToken || intent === 'fee';
  }

  if (winner.type === 'site-help') {
    const hasNonExemptPhrase = matchedPhrases.length > 0;
    const hasNonExemptToken = matchedTokens.some((t) => !SITE_HELP_EXEMPT_TOKENS.has(t));
    return hasNonExemptPhrase || hasNonExemptToken || intent === 'fee';
  }

  if (hasAnyTrigger) return true;

  if (intent === 'fee') {
    if (PRICELESS_TYPES.has(winner.type)) return true;
    if (winner.type === 'faq' && winner.payload?.id !== 'faq-fees') return true;
    if (
      winner.type === 'category' &&
      ['food', 'crafts', 'gallery', 'why-vigan', 'presets'].includes(winner.payload?.kind)
    ) {
      return true;
    }
  }

  return false;
}

function scoreEntry(entry, normalized, tokens, stopwords) {
  let maxPhraseScore = 0;
  let tokenScore = 0;
  let strongMatches = 0;
  const uniqueTokens = Array.from(new Set(tokens));

  for (const phrase of entry.exactPhrases) {
    if (containsPhrase(normalized, phrase.text)) {
      if (phrase.weight > maxPhraseScore) {
        maxPhraseScore = phrase.weight;
      }
      strongMatches += 1;
    }
  }

  for (const token of uniqueTokens) {
    if (stopwords.has(token)) continue;

    if (entry.keywords.has(token)) {
      tokenScore += 7;
      strongMatches += 1;
      continue;
    }

    if (entry.bodyTokens.has(token)) {
      tokenScore += 2;
      continue;
    }

    // Review Focus #3: 1-edit typo tolerance strictly for tokens >= 5 chars and non-stopwords.
    if (token.length >= 5) {
      let fuzzyMatched = false;
      for (const candidate of entry.keywords) {
        if (candidate.length >= 5 && !stopwords.has(candidate)) {
          if (levenshteinDistance(token, candidate) === 1) {
            tokenScore += 5;
            strongMatches += 1;
            fuzzyMatched = true;
            break;
          }
        }
      }
      if (fuzzyMatched) continue;
    }
  }

  return { entry, score: maxPhraseScore + tokenScore, strongMatches };
}

function findSmallTalkReply(normalized, tokens, kb) {
  const tokenSet = new Set(tokens);
  for (const entry of kb.knowledge.smallTalkEntries || []) {
    const phraseHit = (entry.phrases || []).some((p) =>
      containsPhrase(normalized, normalizePhrase(p))
    );
    const tokenHit = (entry.tokens || []).some((t) =>
      tokenSet.has(normalizePhrase(t))
    );
    if (phraseHit || tokenHit) {
      return {
        kind: 'smalltalk',
        paragraphs: [...entry.reply.paragraphs],
        actions: [],
        suggestions: [...(entry.reply.suggestions || STARTER_SUGGESTIONS)]
      };
    }
  }
  return null;
}

function hasFollowupReference(normalized, tokens) {
  if (tokens.some((t) => FOLLOWUP_PRONOUN_TOKENS.has(t))) return true;
  return FOLLOWUP_PRONOUN_PHRASES.some((p) => containsPhrase(normalized, p));
}

function buildPlaceDetailsText(place) {
  return `${place.shortIntro}. Best time to visit: ${place.bestTime} (${place.timeSlotLabel}). Typical stay: ${place.durationLabel}. Entry: ${place.entryFee}. Location: ${place.zone} (${place.distanceFromPlaza}).`;
}

function getPlaceDetailSnippets(place) {
  return [
    place.name,
    place.shortIntro,
    place.bestTime,
    place.timeSlotLabel,
    place.durationLabel,
    place.entryFee,
    place.zone,
    place.distanceFromPlaza
  ];
}

function getPresetDetails(preset, kb) {
  const stopNames = preset.stopIds
    .map((id) => kb.placesById.get(id)?.name)
    .filter(Boolean);
  return {
    stopNames,
    text: `${preset.subtitle}. Stops: ${stopNames.join(', ')}.`,
    actions: makePresetActions(preset),
    snippets: [preset.name, preset.subtitle, ...stopNames]
  };
}

function getDeveloperSnippets(dev) {
  return [
    dev.name,
    dev.handle,
    dev.email,
    dev.portfolioUrl,
    dev.githubUrl,
    dev.linkedinUrl
  ].filter(Boolean);
}

function formatPlaceAnswer(place, intent) {
  const actions = makePlaceActions(place);
  const suggestions = getPlaceSuggestions(place);

  if (intent === 'fee') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [
        `Entry for ${place.name}: ${place.entryFee}. (${place.zone} - ${place.distanceFromPlaza}).`
      ],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.entryFee, place.zone, place.distanceFromPlaza]
    };
  }

  if (intent === 'bestTime') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [
        `Best time to visit ${place.name}: ${place.bestTime} (${place.timeSlotLabel}). Typical stay: ${place.durationLabel}.`
      ],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.bestTime, place.timeSlotLabel, place.durationLabel]
    };
  }

  if (intent === 'duration') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [
        `Typical stay at ${place.name}: ${place.durationLabel}. Best time to visit: ${place.bestTime}.`
      ],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.durationLabel, place.bestTime]
    };
  }

  if (intent === 'location') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [
        `Location of ${place.name}: ${place.zone} (${place.distanceFromPlaza}). ${place.shortIntro}.`
      ],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.zone, place.distanceFromPlaza, place.shortIntro]
    };
  }

  if (intent === 'highlight') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [
        `${place.name} highlight: ${place.highlight}. ${place.shortIntro}.`
      ],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.highlight, place.shortIntro]
    };
  }

  if (intent === 'history') {
    return {
      kind: 'answer',
      title: place.name,
      paragraphs: [`${place.name} - ${place.shortIntro}.`, place.story],
      actions,
      suggestions,
      sourceSnippets: [place.name, place.shortIntro, place.story]
    };
  }

  return {
    kind: 'answer',
    title: place.name,
    paragraphs: [
      `${place.name} (${place.zone} - ${place.categoryLabel}): ${place.shortIntro}. ${place.story}`,
      `Best time to visit: ${place.bestTime} (${place.timeSlotLabel}). Typical stay: ${place.durationLabel}. Entry: ${place.entryFee}. Location: ${place.zone} (${place.distanceFromPlaza}). Highlight: ${place.highlight}.`
    ],
    actions,
    suggestions,
    sourceSnippets: [
      ...getPlaceDetailSnippets(place),
      place.categoryLabel,
      place.story,
      place.highlight
    ]
  };
}

function formatPlacesList(title, introText, places, extraSnippets = []) {
  const items = places.map((place) => ({
    title: place.name,
    text: `${place.shortIntro}. Best time to visit: ${place.bestTime}. Entry: ${place.entryFee}.`,
    actions: makePlaceActions(place)
  }));

  const snippets = [...extraSnippets];
  for (const place of places) {
    snippets.push(place.name, place.shortIntro, place.bestTime, place.entryFee);
  }

  return {
    kind: 'list',
    title,
    paragraphs: [introText],
    items,
    actions: [],
    suggestions: ['Entrance fees', 'Plan 1 day', 'What to eat'],
    sourceSnippets: snippets.filter(Boolean)
  };
}

function formatFeesReply(kb) {
  const faqFees = kb.faqItems.find((f) => f.id === 'faq-fees');
  const intro = faqFees
    ? faqFees.answer
    : 'Vigan landmark entry details from this guide:';
  const items = kb.places.map((place) => ({
    title: place.name,
    text: `${place.name}: ${place.entryFee} (${place.zone}).`,
    actions: makePlaceActions(place)
  }));

  const snippets = [];
  if (faqFees) snippets.push(faqFees.answer);
  for (const place of kb.places) {
    snippets.push(place.name, place.entryFee, place.zone);
  }

  return {
    kind: 'list',
    title: 'Entrance fees',
    paragraphs: [intro],
    items,
    actions: [],
    suggestions: ['Tell me about Syquia Mansion', 'What to eat', 'Plan 1 day'],
    sourceSnippets: snippets
  };
}

function formatCultureItemAnswer(item) {
  return {
    kind: 'answer',
    title: item.name,
    paragraphs: [
      `${item.name} (${item.kind} - ${item.location}): ${item.summary}`,
      item.tip
    ],
    actions: [],
    suggestions: ['What to eat', 'Living crafts', 'Where is Plaza Burgos?'],
    sourceSnippets: [item.name, item.kind, item.location, item.summary, item.tip]
  };
}

function formatCultureList(title, intro, items) {
  const listItems = items.map((item) => ({
    title: item.name,
    text: `${item.kind} (${item.location}): ${item.summary} ${item.tip}`,
    actions: []
  }));
  const snippets = items.flatMap((item) => [
    item.name,
    item.kind,
    item.location,
    item.summary,
    item.tip
  ]);
  return {
    kind: 'list',
    title,
    paragraphs: [intro],
    items: listItems,
    actions: [],
    suggestions: ['Tell me about Vigan Empanada', 'Entrance fees', 'Plan 1 day'],
    sourceSnippets: snippets
  };
}

function formatWhyViganReply(kb) {
  const whyIntro = kb.pageContext?.whyIntro || '';
  const items = kb.heritageFacts.map((fact) => ({
    title: `${fact.metric} - ${fact.title}`,
    text: fact.detail,
    actions: []
  }));
  const snippets = [];
  if (whyIntro) snippets.push(whyIntro);
  for (const fact of kb.heritageFacts) {
    snippets.push(fact.metric, fact.title, fact.detail);
  }
  const introParagraph =
    whyIntro ||
    `${kb.heritageFacts[0]?.metric || 'UNESCO 1999'} - ${kb.heritageFacts[0]?.title || 'Vigan'}`;

  return {
    kind: 'list',
    title: 'Why Vigan Is Famous',
    paragraphs: [introParagraph],
    items,
    actions: [],
    suggestions: ['Tell me about Calle Crisologo', 'Entrance fees', 'Plan 1 day'],
    sourceSnippets: snippets
  };
}

function formatPresetReply(preset, kb) {
  const details = getPresetDetails(preset, kb);
  return {
    kind: 'answer',
    title: preset.name,
    paragraphs: [`${preset.name}: ${details.text}`],
    actions: details.actions,
    suggestions: ['Entrance fees', 'How to get there', 'What to eat'],
    sourceSnippets: details.snippets
  };
}

function formatCategoryReply(entry, intent, kb) {
  const { kind, category } = entry.payload;

  if (kind === 'place-category') {
    const matchingPlaces = kb.places.filter((p) => p.category === category.id);
    const intro = `${category.label}: ${matchingPlaces.map((p) => p.name).join(', ')}.`;
    return formatPlacesList(category.label, intro, matchingPlaces, [category.label]);
  }

  if (kind === 'plazas') {
    const plazas = ['plaza-salcedo', 'plaza-burgos']
      .map((id) => kb.placesById.get(id))
      .filter(Boolean);
    return formatPlacesList(
      'Vigan Plazas',
      `Vigan plazas in this guide: ${plazas.map((p) => p.name).join(' and ')}.`,
      plazas
    );
  }

  if (kind === 'fees') {
    return formatFeesReply(kb);
  }

  if (kind === 'food') {
    const foods = kb.cultureItems.filter((c) => c.kind !== 'Living Craft');
    return formatCultureList(
      'Ilocano Food in Vigan',
      `Ilocano food highlights in this guide: ${foods.map((f) => f.name).join(', ')}.`,
      foods
    );
  }

  if (kind === 'crafts') {
    const crafts = kb.cultureItems.filter((c) => c.kind === 'Living Craft');
    return formatCultureList(
      'Living Crafts in Vigan',
      `Living crafts in this guide: ${crafts.map((c) => c.name).join(' and ')}.`,
      crafts
    );
  }

  if (kind === 'why-vigan') {
    return formatWhyViganReply(kb);
  }

  if (kind === 'presets') {
    const presetDetails = kb.presets.map((preset) => ({
      preset,
      ...getPresetDetails(preset, kb)
    }));
    const items = presetDetails.map(({ preset, text, actions }) => ({
      title: preset.name,
      text,
      actions
    }));
    const snippets = presetDetails.flatMap((d) => d.snippets);
    return {
      kind: 'list',
      title: 'Trip Presets',
      paragraphs: [
        `Suggested routes in My Vigan Plan: ${kb.presets.map((p) => p.name).join(' and ')}.`
      ],
      items,
      actions: [],
      suggestions: ['Plan 1 day', 'Plan 2 days', 'Entrance fees'],
      sourceSnippets: snippets
    };
  }

  if (kind === 'gallery') {
    const items = kb.galleryItems.slice(0, 4).map((item) => ({
      title: item.title,
      text: `${item.location}: ${item.caption}`,
      actions: []
    }));
    const snippets = kb.galleryItems
      .slice(0, 4)
      .flatMap((item) => [item.title, item.location, item.caption]);
    return {
      kind: 'list',
      title: 'Photo Archive Scenes',
      paragraphs: [
        `Scenes from the heritage photo archive: ${kb.galleryItems
          .slice(0, 4)
          .map((g) => g.title)
          .join(', ')}.`
      ],
      items,
      actions: [],
      suggestions: ['Calle Crisologo by Lantern Light', 'Festival Arches After Dark'],
      sourceSnippets: snippets
    };
  }

  const featuredPlaces = kb.places.slice(0, 4);
  if (intent === 'fee') return formatFeesReply(kb);
  return formatPlacesList(
    'Vigan Landmarks',
    `Highlighted landmarks from the 11 places in Vigan: ${featuredPlaces
      .map((p) => p.name)
      .join(', ')}.`,
    featuredPlaces
  );
}

function formatMatchReply(winner, intent, kb) {
  switch (winner.type) {
    case 'place':
      return formatPlaceAnswer(winner.payload, intent);

    case 'category':
      return formatCategoryReply(winner, intent, kb);

    case 'culture':
      return formatCultureItemAnswer(winner.payload);

    case 'heritage-fact': {
      const fact = winner.payload;
      return {
        kind: 'answer',
        title: `${fact.metric} - ${fact.title}`,
        paragraphs: [`${fact.metric} - ${fact.title}: ${fact.detail}`],
        actions: [],
        suggestions: ['Why is Vigan famous?', 'Tell me about Calle Crisologo'],
        sourceSnippets: [fact.metric, fact.title, fact.detail]
      };
    }

    case 'gallery': {
      const item = winner.payload;
      return {
        kind: 'answer',
        title: item.title,
        paragraphs: [`${item.title} (${item.location}): ${item.caption}`],
        actions: [],
        suggestions: ['Tell me about Calle Crisologo', 'Best season and festivals'],
        sourceSnippets: [item.title, item.location, item.caption]
      };
    }

    case 'preset':
      return formatPresetReply(winner.payload, kb);

    case 'travel-essential': {
      const item = winner.payload;
      return {
        kind: 'answer',
        title: item.title,
        paragraphs: [`${item.title}: ${item.summary}`, ...item.bullets],
        actions: [],
        suggestions: ['Entrance fees', 'Plan 1 day', 'What to eat'],
        sourceSnippets: [item.title, item.summary, ...item.bullets]
      };
    }

    case 'faq': {
      const faq = winner.payload;
      if (faq.id === 'faq-fees') {
        return formatFeesReply(kb);
      }
      return {
        kind: 'answer',
        title: faq.question,
        paragraphs: [`${faq.question} ${faq.answer}`],
        actions: [],
        suggestions: ['Entrance fees', 'Plan 2 days', 'How to get there'],
        sourceSnippets: [faq.question, faq.answer]
      };
    }

    case 'developer': {
      const dev = winner.payload;
      const parts = [`This guide was created by ${dev.name} (${dev.handle}).`];
      if (dev.email) parts.push(`Email: ${dev.email}`);
      if (dev.portfolioUrl) parts.push(`Portfolio: ${dev.portfolioUrl}`);
      if (dev.githubUrl) parts.push(`GitHub: ${dev.githubUrl}`);
      if (dev.linkedinUrl) parts.push(`LinkedIn: ${dev.linkedinUrl}`);
      return {
        kind: 'answer',
        title: dev.name,
        paragraphs: [parts.join(' ')],
        actions: [],
        suggestions: [...STARTER_SUGGESTIONS],
        sourceSnippets: getDeveloperSnippets(dev)
      };
    }

    case 'site-help': {
      const entry = winner.payload;
      return {
        kind: 'answer',
        title: entry.title,
        paragraphs: [`${entry.title}: ${entry.text}`],
        actions: [],
        suggestions: [...(entry.suggestions || STARTER_SUGGESTIONS)],
        sourceSnippets: [entry.title, entry.text]
      };
    }

    default:
      return {
        kind: 'out-of-scope',
        paragraphs: [OUT_OF_SCOPE_MESSAGE],
        actions: [],
        suggestions: [...STARTER_SUGGESTIONS]
      };
  }
}

function formatPartialOutOfScope(winner, kb) {
  let subjectName = winner.title;
  let contextText = '';
  let actions = [];
  let snippets = [];

  if (winner.type === 'place') {
    const p = winner.payload;
    subjectName = p.name;
    contextText = buildPlaceDetailsText(p);
    actions = makePlaceActions(p);
    snippets = getPlaceDetailSnippets(p);
  } else if (winner.type === 'culture') {
    const c = winner.payload;
    subjectName = c.name;
    contextText = `${c.kind} (${c.location}): ${c.summary} ${c.tip}`;
    snippets = [c.name, c.kind, c.location, c.summary, c.tip];
  } else if (winner.type === 'travel-essential') {
    const t = winner.payload;
    subjectName = t.title;
    contextText = `${t.summary} ${t.bullets.join(' ')}`;
    snippets = [t.title, t.summary, ...t.bullets];
  } else if (winner.type === 'gallery') {
    const g = winner.payload;
    subjectName = g.title;
    contextText = `${g.location}: ${g.caption}`;
    snippets = [g.title, g.location, g.caption];
  } else if (winner.type === 'preset') {
    const preset = winner.payload;
    const details = getPresetDetails(preset, kb);
    subjectName = preset.name;
    contextText = details.text;
    actions = details.actions;
    snippets = details.snippets;
  } else if (winner.type === 'developer') {
    const dev = winner.payload;
    subjectName = dev.name;
    const links = [dev.email, dev.portfolioUrl, dev.githubUrl, dev.linkedinUrl]
      .filter(Boolean)
      .join(', ');
    contextText = `${dev.name} (${dev.handle}) - ${links}`;
    snippets = getDeveloperSnippets(dev);
  } else if (winner.type === 'category' && winner.payload?.kind === 'food') {
    const foods = kb.cultureItems.filter((c) => c.kind !== 'Living Craft');
    subjectName = 'Ilocano Food';
    contextText = foods.map((f) => `${f.name}: ${f.summary}`).join(' ');
    snippets = foods.flatMap((f) => [f.name, f.summary]);
  } else if (winner.type === 'category' && winner.payload?.kind === 'crafts') {
    const crafts = kb.cultureItems.filter((c) => c.kind === 'Living Craft');
    subjectName = 'Living Crafts';
    contextText = crafts.map((c) => `${c.name}: ${c.summary}`).join(' ');
    snippets = crafts.flatMap((c) => [c.name, c.summary]);
  } else {
    const fallbackReply = formatMatchReply(winner, 'general', kb);
    const itemTexts = (fallbackReply.items || []).map(
      (item) => `${item.title}: ${item.text}`
    );
    contextText = [...fallbackReply.paragraphs, ...itemTexts].join(' ');
    actions = fallbackReply.actions || [];
    snippets = fallbackReply.sourceSnippets || [winner.title];
  }

  return {
    kind: 'partial-out-of-scope',
    title: subjectName,
    paragraphs: [
      OUT_OF_SCOPE_MESSAGE,
      `Here is what the site says about ${subjectName}: ${contextText}`
    ],
    actions,
    suggestions: [...STARTER_SUGGESTIONS],
    sourceSnippets: snippets.filter(Boolean)
  };
}

/**
 * Creates a stateful deterministic conversation session over a KnowledgeBase.
 * Tracks the last discussed landmark for pronoun follow-ups until reset or replaced.
 * @param {object} kb
 */
export function createConversation(kb) {
  let lastPlaceId = null;

  function resetContext() {
    lastPlaceId = null;
  }

  function ask(question) {
    const { normalized, tokens } = normalizeQuestion(question);

    if (!normalized) {
      return {
        kind: 'smalltalk',
        paragraphs: [WELCOME_MESSAGE],
        actions: [],
        suggestions: [...STARTER_SUGGESTIONS]
      };
    }

    const intent = detectIntent(normalized, tokens, kb.knowledge.intentKeywords);
    const triggers = findMatchedUnsupportedTriggers(normalized, tokens, kb);

    const scored = kb.entries
      .map((entry, index) => ({
        ...scoreEntry(entry, normalized, tokens, kb.stopwords),
        index
      }))
      .filter((item) => item.score >= SCORE_THRESHOLD && item.strongMatches > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.strongMatches !== a.strongMatches) return b.strongMatches - a.strongMatches;
        return a.index - b.index;
      });

    let winner = scored[0]?.entry || null;

    const hasExplicitPronounFollowup =
      tokens.includes('it') ||
      tokens.includes('its') ||
      FOLLOWUP_PRONOUN_PHRASES.some((p) => containsPhrase(normalized, p));

    if (
      lastPlaceId &&
      hasExplicitPronounFollowup &&
      ((winner?.id === 'cat:fees' && scored[0].score <= 7) ||
        (winner?.id === 'essential:best-season' && scored[0].score <= 12))
    ) {
      const placeEntry = kb.entries.find((e) => e.id === `place:${lastPlaceId}`);
      if (placeEntry) winner = placeEntry;
    }

    if (!winner) {
      if (
        normalized === 'tell me about vigan' ||
        normalized === 'about vigan' ||
        normalized === 'vigan' ||
        normalized === 'vigan city'
      ) {
        return formatWhyViganReply(kb);
      }

      const hasRawUnsupported =
        triggers.matchedPhrases.length > 0 || triggers.matchedTokens.length > 0;
      if (
        lastPlaceId &&
        hasFollowupReference(normalized, tokens) &&
        (intent !== 'general' || hasRawUnsupported)
      ) {
        const placeEntry = kb.entries.find((e) => e.id === `place:${lastPlaceId}`);
        if (placeEntry) winner = placeEntry;
      }
    }

    if (!winner) {
      const smallTalk = findSmallTalkReply(normalized, tokens, kb);
      if (smallTalk) return smallTalk;

      return {
        kind: 'out-of-scope',
        paragraphs: [OUT_OF_SCOPE_MESSAGE],
        actions: [],
        suggestions: [...STARTER_SUGGESTIONS]
      };
    }

    if (winner.type === 'place') {
      lastPlaceId = winner.payload.id;
    }

    if (shouldDowngradeToPartial(winner, intent, triggers)) {
      return formatPartialOutOfScope(winner, kb);
    }

    return formatMatchReply(winner, intent, kb);
  }

  return { ask, resetContext };
}
