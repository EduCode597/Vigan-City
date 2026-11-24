export const OUT_OF_SCOPE_MESSAGE = "This information is outside the website's information.";

export const WELCOME_MESSAGE =
  "Hi! Ask me anything about Vigan's landmarks, food, crafts, or planning your visit.";

export const STARTER_SUGGESTIONS = [
  'Entrance fees',
  'What to eat',
  'Plan 1 day',
  'How to get there'
];

export const CHATBOT_KNOWLEDGE = {
  placeAliases: {
    'calle-crisologo': [
      'calle crisologo',
      'crisologo',
      'calle',
      'crisologo street',
      'mestizo district',
      'cobblestone street',
      'cobblestones',
      'bahay na bato',
      'capiz windows'
    ],
    'bantay-bell-tower': [
      'bantay bell tower',
      'bantay',
      'bell tower',
      'belfry',
      'watchtower',
      'st augustine',
      'abra river'
    ],
    'syquia-mansion': [
      'syquia mansion museum',
      'syquia mansion',
      'syquia',
      'quirino',
      'elpidio quirino',
      'alicia syquia',
      'quirino boulevard'
    ],
    'plaza-salcedo': [
      'plaza salcedo',
      'salcedo',
      'dancing fountain',
      'fountain show',
      'fountain',
      'obelisk',
      'juan de salcedo',
      'lagoon'
    ],
    'st-paul-cathedral': [
      'st paul metropolitan cathedral',
      'st paul cathedral',
      'vigan cathedral',
      'st paul',
      'cathedral',
      'church',
      'earthquake baroque',
      'pagoda belfry'
    ],
    'padre-burgos-house': [
      'padre burgos house',
      'padre burgos',
      'national museum',
      'jose burgos',
      'basi revolt',
      'villanueva'
    ],
    pagburnayan: [
      'pagburnayan jar factory',
      'pagburnayan',
      'jar factory',
      'pottery',
      'burnay kiln',
      'dragon kiln',
      'potters wheel',
      "potter's wheel",
      'clay jars'
    ],
    'plaza-burgos': [
      'plaza burgos',
      'street food plaza',
      'empanada stalls',
      'sinanglao',
      'okoy'
    ],
    'hidden-garden': [
      'hidden garden',
      'barangay bulala',
      'bulala',
      'botanical',
      'garden',
      'poqui poqui',
      'pinakbet',
      'plant nursery'
    ],
    'crisologo-museum': [
      'crisologo museum',
      'floro crisologo',
      'machuca',
      'vintage cars',
      'family archive'
    ],
    baluarte: [
      'baluarte resort safari',
      'baluarte',
      'safari',
      'zoo',
      'dinosaur',
      'wildlife',
      'salindeg'
    ]
  },

  cultureAliases: {
    'abel-weaving': [
      'abel iloko handloom weaving',
      'abel iloko',
      'abel weaving',
      'abel',
      'inabel',
      'binakul',
      'handloom',
      'weaving',
      'weavers',
      'camangaan'
    ],
    'vigan-empanada': [
      'vigan empanada',
      'empanada',
      'empanadas',
      'annatto',
      'rice flour dough'
    ],
    'ilocano-bagnet': [
      'crispy ilocano bagnet',
      'ilocano bagnet',
      'bagnet',
      'pork belly',
      'kbl',
      'bagoong',
      'crackling'
    ],
    'vigan-longganisa': [
      'vigan longganisa',
      'longganisa',
      'sausage',
      'sausages',
      'garlic sausage'
    ],
    'burnay-pottery': [
      'burnay stoneware craft',
      'burnay pottery',
      'burnay',
      'stoneware',
      'basi',
      'sukang iloko'
    ]
  },

  categoryAliases: {
    core: ['heritage core', 'core landmarks', 'downtown heritage'],
    museum: ['ancestral museums', 'museums', 'museum', 'ancestral houses'],
    'craft-place': ['crafts and gardens', 'craft places', 'gardens and pottery'],
    outskirts: ['hills and parks', 'outskirts', 'hilltop parks'],
    plazas: ['vigan plazas', 'plazas', 'plaza', 'public squares'],
    fees: [
      'entrance fees',
      'entry fees',
      'admission fees',
      'whats free',
      "what's free",
      'what is free',
      'free places',
      'free attractions',
      'free landmarks',
      'free entry',
      'free to visit',
      'fees'
    ],
    food: [
      'what to eat',
      'ilocano food',
      'ilocano cuisine',
      'local food',
      'street food',
      'dishes',
      'eat',
      'food',
      'cuisine',
      'delicacy',
      'delicacies'
    ],
    crafts: ['living crafts', 'local crafts', 'crafts', 'handicrafts', 'artisans'],
    'why-vigan': [
      'why vigan',
      'why is vigan famous',
      'what is vigan',
      'famous for'
    ],
    presets: [
      'plan a trip',
      'trip presets',
      'itineraries',
      'itinerary',
      'suggested routes',
      'day plans'
    ],
    gallery: ['photo archive', 'gallery', 'photos', 'pictures', 'scenes'],
    landmarks: [
      'all places',
      'all landmarks',
      'landmarks',
      'must visit',
      'places to visit',
      'attractions',
      'tourist spots'
    ]
  },

  intentKeywords: {
    history: {
      phrases: [
        'when was',
        'when did',
        'built in',
        'founded in',
        'named after',
        'history of',
        'story of',
        'who lived',
        'who built',
        'who founded',
        'who was',
        'origin of'
      ],
      tokens: [
        'built',
        'founded',
        'history',
        'story',
        'inscribed',
        'origin',
        'century',
        'historical',
        'martyr',
        'president',
        'year'
      ]
    },
    fee: {
      phrases: [
        'how much',
        'entrance fee',
        'entry fee',
        'admission fee',
        'ticket price',
        'cost to enter'
      ],
      tokens: [
        'fee',
        'fees',
        'price',
        'prices',
        'cost',
        'costs',
        'entrance',
        'entry',
        'admission',
        'free',
        'pay',
        'ticket',
        'tickets',
        'donation'
      ]
    },
    bestTime: {
      phrases: [
        'best time',
        'what time',
        'good time',
        'when to visit',
        'when to go',
        'when should',
        'when is best'
      ],
      tokens: [
        'sunset',
        'sunrise',
        'morning',
        'afternoon',
        'evening',
        'night',
        'dusk',
        'dawn',
        'golden'
      ]
    },
    duration: {
      phrases: [
        'how long',
        'how many minutes',
        'how much time',
        'typical stay'
      ],
      tokens: ['duration', 'stay', 'minutes', 'mins', 'long', 'spend']
    },
    location: {
      phrases: [
        'how far',
        'how close',
        'distance from',
        'from the plaza',
        'how to get to'
      ],
      tokens: [
        'where',
        'distance',
        'far',
        'near',
        'zone',
        'location',
        'located',
        'walk',
        'ride',
        'directions',
        'area'
      ]
    },
    highlight: {
      phrases: ['must see', 'dont miss', "don't miss", 'known for', 'famous for', 'what to see'],
      tokens: ['highlight', 'highlights', 'feature', 'features', 'special']
    }
  },

  unsupportedDetailPhrases: [
    'phone number',
    'contact number',
    'mobile number',
    'room rate',
    'room rates',
    'hotel name',
    'hotel names',
    'name a hotel',
    'specific hotel',
    'which hotel',
    'recommend a hotel',
    'best hotel',
    'best hotels',
    'book online',
    'booking link',
    'book a room',
    'reserve a room',
    'opening hours',
    'closing hours',
    'closing time',
    'operating hours',
    'business hours',
    'store hours',
    'museum hours',
    'open hours',
    'menu price',
    'menu prices',
    'food price',
    'ticket booking',
    'bus fare',
    'flight price',
    'kalesa fare',
    'kalesa rate',
    'tricycle fare',
    'weather forecast',
    'weather tomorrow',
    'weather today',
    'live weather',
    'will it rain',
    'is it raining',
    'right now',
    'this week'
  ],

  unsupportedDetailTokens: [
    'phone',
    'telephone',
    'hotline',
    'email',
    'contact',
    'booking',
    'book',
    'reserve',
    'reservation',
    'rate',
    'rates',
    'open',
    'opens',
    'opening',
    'close',
    'closes',
    'closing',
    'forecast',
    'tomorrow',
    'today',
    'temperature',
    'humidity',
    'website',
    'link',
    'url',
    'github',
    'linkedin',
    'portfolio',
    'menu',
    'fare',
    'fares',
    'airfare',
    'address',
    'wifi',
    'parking'
  ],

  smallTalkEntries: [
    {
      id: 'smalltalk-greeting',
      phrases: [
        'hi',
        'hello',
        'hey',
        'good morning',
        'good afternoon',
        'good evening',
        'kumusta',
        'greetings'
      ],
      tokens: [],
      reply: {
        paragraphs: [
          "Hello! Ask me anything about Vigan's 11 landmarks, Ilocano food and crafts, travel essentials, or building a trip plan."
        ],
        suggestions: STARTER_SUGGESTIONS
      }
    },
    {
      id: 'smalltalk-thanks',
      phrases: ['thanks', 'thank you', 'thank u', 'ty', 'salamat', 'appreciate it'],
      tokens: [],
      reply: {
        paragraphs: [
          "You're welcome! Feel free to ask about another Vigan landmark, local food, or itinerary preset."
        ],
        suggestions: STARTER_SUGGESTIONS
      }
    },
    {
      id: 'smalltalk-bye',
      phrases: ['bye', 'goodbye', 'see you', 'farewell'],
      tokens: [],
      reply: {
        paragraphs: [
          'Enjoy exploring Vigan City! Reopen Ask Vigan anytime while browsing the guide.'
        ],
        suggestions: STARTER_SUGGESTIONS
      }
    },
    {
      id: 'smalltalk-help',
      phrases: [
        'what can i ask',
        'what can you do',
        'what do you know',
        'how can you help',
        'help me',
        'who are you',
        'topics'
      ],
      tokens: ['help'],
      reply: {
        paragraphs: [
          "You can ask me about Vigan's 11 landmarks (stories, entry fees, best time to visit, typical stay, highlights, and distance from the plaza), Ilocano food and living crafts, 1-day or 2-day trip presets, travel essentials, FAQs, or how to use this site."
        ],
        suggestions: STARTER_SUGGESTIONS
      }
    }
  ],

  siteHelpEntries: [
    {
      id: 'site-explorer',
      title: 'Landmarks Explorer',
      phrases: [
        'how to use explorer',
        'use the explorer',
        'filter landmarks',
        'search places',
        'view in explorer'
      ],
      tokens: ['explorer', 'spotlight', 'filter', 'filters'],
      text: 'Use the Landmarks Explorer section to filter the 11 places by category (Heritage Core, Ancestral Museums, Crafts & Gardens, Hills & Parks) or search by name. Select any place to inspect its story, best time to visit, typical stay, and entry fee in the spotlight panel.',
      suggestions: ['Ancestral museums', 'Tell me about Calle Crisologo', 'Plan 1 day']
    },
    {
      id: 'site-plan',
      title: 'My Vigan Plan',
      phrases: [
        'my vigan plan',
        'use my vigan plan',
        'trip planner',
        'save stops',
        'add to my plan',
        'copy itinerary',
        'clear plan'
      ],
      tokens: ['planner', 'drawer', 'saved', 'clipboard'],
      text: 'Click + Add to my plan on any landmark to save it in My Vigan Plan. Open My Vigan Plan from the header to sort stops by time of day, load the 1-Day Classic Highlights or 2-Day Heritage Weekend preset, copy your itinerary, or clear your plan.',
      suggestions: ['Plan 1 day', 'Plan 2 days', 'Entrance fees']
    },
    {
      id: 'site-theme',
      title: 'Dark Mode & Theme',
      phrases: [
        'dark mode',
        'light mode',
        'theme toggle',
        'change theme',
        'night mode'
      ],
      tokens: ['theme'],
      text: 'Use the Dark Mode button in the site header (or inside the mobile navigation menu) to switch between light and dark themes.',
      suggestions: ['How to use the explorer', 'My Vigan Plan', 'Entrance fees']
    },
    {
      id: 'site-archive',
      title: 'Photo Archive & Lightbox',
      phrases: [
        'photo archive',
        'open the photo archive',
        'gallery lightbox',
        'photo viewer',
        'view photos'
      ],
      tokens: ['lightbox', 'archive'],
      text: 'Scroll to the Scenes across the heritage city archive and click any photograph to open the photo viewer with Previous and Next navigation.',
      suggestions: ['Calle Crisologo by Lantern Light', 'Festival Arches After Dark', 'What to eat']
    }
  ],

  stopwords: [
    'a',
    'about',
    'all',
    'an',
    'and',
    'any',
    'are',
    'as',
    'at',
    'be',
    'by',
    'can',
    'city',
    'could',
    'did',
    'do',
    'does',
    'for',
    'from',
    'get',
    'guide',
    'had',
    'has',
    'have',
    'here',
    'how',
    'i',
    'if',
    'in',
    'info',
    'information',
    'into',
    'is',
    'it',
    'its',
    'just',
    'know',
    'like',
    'many',
    'me',
    'more',
    'much',
    'my',
    'near',
    'need',
    'no',
    'not',
    'of',
    'on',
    'or',
    'our',
    'out',
    'page',
    'place',
    'places',
    'please',
    's',
    'say',
    'says',
    'see',
    'should',
    'site',
    'so',
    'some',
    't',
    'tell',
    'than',
    'that',
    'the',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'this',
    'those',
    'to',
    'too',
    'town',
    'up',
    'us',
    'use',
    'very',
    'vigan',
    'want',
    'was',
    'we',
    'website',
    'were',
    'what',
    'when',
    'where',
    'which',
    'who',
    'why',
    'will',
    'with',
    'would',
    'you',
    'your'
  ]
};
