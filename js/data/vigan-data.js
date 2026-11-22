export const PLACE_CATEGORIES = [
  { id: 'all', label: 'All Places (11)' },
  { id: 'core', label: 'Heritage Core' },
  { id: 'museum', label: 'Ancestral Museums' },
  { id: 'craft-place', label: 'Crafts & Gardens' },
  { id: 'outskirts', label: 'Hills & Parks' }
];

export const PLACES = [
  {
    id: 'calle-crisologo',
    name: 'Calle Crisologo',
    category: 'core',
    categoryLabel: 'Heritage Core',
    zone: 'Mestizo District',
    shortIntro: 'Car-free 16th-century merchant avenue lined with ancestral homes',
    story:
      'The centerpiece of Vigan\'s UNESCO heritage zone preserves five blocks of car-free cobblestones flanked by intact bahay na bato mansions. Ground-floor stone chambers once stored Chinese silk, beeswax, and clay jars from northern trade; today they house antique galleries, woven abel shops, and quiet cafes beneath antique iron streetlamps.',
    image: 'images/Landmarks/Thumbnail.jpg',
    nightImage: 'images/attractions/CalleCrisologo.jpg',
    alt: 'Calle Crisologo cobblestone street lined with ancestral Spanish-colonial bahay na bato houses in daylight',
    nightAlt: 'Calle Crisologo cobblestone street illuminated by warm amber streetlamps at night',
    bestTime: '6:30 AM or 7:00 PM',
    durationMinutes: 75,
    durationLabel: '60 to 90 min',
    highlight: 'Capiz shell windows and kalesa loop',
    entryFee: 'Free entry',
    timeSlot: 1,
    timeSlotLabel: 'Morning',
    distanceFromPlaza: '2 min walk'
  },
  {
    id: 'bantay-bell-tower',
    name: 'Bantay Bell Tower',
    category: 'outskirts',
    categoryLabel: 'Hills & Parks',
    zone: 'Bantay Hilltop',
    shortIntro: '1591 red-brick hilltop watchtower overlooking Vigan and the coast',
    story:
      'Rising atop a grassy mound beside St. Augustine Parish just north of Vigan, this weathered brick belfry guarded northern Ilocos against coastal raiders for centuries and served as a vantage point during World War II. Climb the narrow brick steps to the arched bell chamber near sunset as warm light sweeps over the Abra River valley.',
    image: 'images/Landmarks/Bantay-Bell-tower.jpg',
    alt: 'Bantay Bell Tower red-brick belfry glowing on its grassy hilltop during golden hour',
    bestTime: '4:30 PM to 5:45 PM',
    durationMinutes: 35,
    durationLabel: '30 to 40 min',
    highlight: 'Golden-hour brickwork and valley panorama',
    entryFee: 'Voluntary donation',
    timeSlot: 3,
    timeSlotLabel: 'Afternoon',
    distanceFromPlaza: '10 min ride'
  },
  {
    id: 'syquia-mansion',
    name: 'Syquia Mansion Museum',
    category: 'museum',
    categoryLabel: 'Ancestral Museums',
    zone: 'Quirino Boulevard',
    shortIntro: 'President Elpidio Quirino\'s grand 1830 ancestral bahay na bato',
    story:
      'Built in 1830 as a wedding gift for a prominent Vigan clan, Syquia Mansion later became the residence of Philippine President Elpidio Quirino and First Lady Alicia Syquia. Its arched carriage bays, shaded acacia lawn, wide narra floorboards, and formal reception hall reveal how affluent Ilocano families lived in the 19th century.',
    image: 'images/Landmarks/Syquia-Mansion.jpg',
    alt: 'Syquia Mansion red roof, stone ground-floor arches, and manicured green courtyard beneath acacia trees',
    bestTime: '9:00 AM to 11:30 AM',
    durationMinutes: 45,
    durationLabel: '45 min',
    highlight: 'Carriage arcade and Presidential memorabilia',
    entryFee: 'PHP 30 entrance',
    timeSlot: 1,
    timeSlotLabel: 'Morning',
    distanceFromPlaza: '4 min walk'
  },
  {
    id: 'plaza-salcedo',
    name: 'Plaza Salcedo',
    category: 'core',
    categoryLabel: 'Heritage Core',
    zone: 'City Center',
    shortIntro: 'Vigan\'s oldest public square and nightly dancing fountain lagoon',
    story:
      'Named for 16th-century founder Juan de Salcedo, this elliptical public square anchors Vigan\'s historic grid between the Cathedral and Provincial Capitol. By day it frames a quiet 17th-century obelisk; after dark its oval lagoon transforms into a choreographed show of illuminated water jets and music.',
    image: 'images/attractions/PlazaSalcedo.jpg',
    alt: 'Plaza Salcedo monument obelisk reflected across the illuminated fountain pool at night',
    bestTime: '7:30 PM fountain show',
    durationMinutes: 45,
    durationLabel: '45 min',
    highlight: 'Choreographed night water and light show',
    entryFee: 'Free entry',
    timeSlot: 4,
    timeSlotLabel: 'Evening',
    distanceFromPlaza: 'Central hub'
  },
  {
    id: 'st-paul-cathedral',
    name: 'St. Paul Metropolitan Cathedral',
    category: 'core',
    categoryLabel: 'Heritage Core',
    zone: 'Plaza Salcedo',
    shortIntro: '1800 Earthquake Baroque cathedral with detached pagoda belfry',
    story:
      'Completed in 1800, Vigan\'s cathedral is a textbook work of Philippine Earthquake Baroque, pairing thick stone lateral buttresses and Chinese-inspired carved lions with three wide arched portals. Its detached octagonal belfry stands yards away on purpose so seismic tremors never topple the bell tower onto the main nave.',
    image: 'images/attractions/ViganCathedral.jpg',
    alt: 'White and ochre facade of St. Paul Metropolitan Cathedral alongside its detached octagonal bell tower',
    bestTime: '8:00 AM to 10:30 AM',
    durationMinutes: 30,
    durationLabel: '30 min',
    highlight: 'Detached bell tower and silver-trimmed altar',
    entryFee: 'Free entry',
    timeSlot: 1,
    timeSlotLabel: 'Morning',
    distanceFromPlaza: '1 min walk'
  },
  {
    id: 'padre-burgos-house',
    name: 'Padre Burgos House',
    category: 'museum',
    categoryLabel: 'Ancestral Museums',
    zone: 'Burgos Street',
    shortIntro: 'National Museum Ilocos inside the 1788 birthplace of Fr. Jose Burgos',
    story:
      'The preserved 1788 stone-and-timber birthplace of Filipino martyr Fr. Jose Burgos now serves as the National Museum of the Philippines - Ilocos. Its upstairs galleries bring regional history into focus through Ilocano textiles, antique furnishings, and Esteban Villanueva\'s celebrated 14-panel 1821 Basi Revolt paintings.',
    image: 'images/Landmarks/padre-burgos-house.jpg',
    alt: 'Padre Burgos House ancestral bahay na bato exterior with rust-patina roof and capiz shell upper windows',
    bestTime: '9:00 AM to 4:00 PM',
    durationMinutes: 50,
    durationLabel: '45 to 60 min',
    highlight: '1821 Basi Revolt painting gallery',
    entryFee: 'Free entry',
    timeSlot: 2,
    timeSlotLabel: 'Midday',
    distanceFromPlaza: '3 min walk'
  },
  {
    id: 'pagburnayan',
    name: 'Pagburnayan Jar Factory',
    category: 'craft-place',
    categoryLabel: 'Crafts & Gardens',
    zone: 'Liberation Boulevard',
    shortIntro: 'Open-air pottery sheds and brick dragon kilns shaping burnay jars',
    story:
      'Under timber sheds stacked row upon row with sun-drying clay vessels, master potters spin dense stoneware burnay jars on heavy foot-turned wheels before firing them in wood-fed brick kilns. Vigan burnay jars are prized across the Philippines for aging basi sugarcane wine, bagoong fish paste, and sukang Iloko vinegar.',
    image: 'images/Landmarks/pagburnayan.jpg',
    alt: 'Wooden shelves stacked with handcrafted burnay clay jars drying beside the shaded Pagburnayan pottery shed',
    bestTime: '2:00 PM to 4:30 PM',
    durationMinutes: 40,
    durationLabel: '35 to 45 min',
    highlight: 'Live foot-turned potter\'s wheel demo',
    entryFee: 'Free (tips welcome)',
    timeSlot: 3,
    timeSlotLabel: 'Afternoon',
    distanceFromPlaza: '8 min ride'
  },
  {
    id: 'plaza-burgos',
    name: 'Plaza Burgos',
    category: 'core',
    categoryLabel: 'Heritage Core',
    zone: 'Beside St. Paul Cathedral',
    shortIntro: 'Historic monument plaza and Vigan\'s dusk street-food gathering hub',
    story:
      'Directly beside St. Paul Cathedral, Plaza Burgos honors Vigan-born patriot Fr. Jose Burgos beneath a carved limestone monument and shade trees. As afternoon cools into dusk, food stalls around the perimeter light their griddles and draw locals and travelers alike for crisp Vigan empanadas, okoy, and steaming sinanglao.',
    image: 'images/gallery/Plaza_Burgos.jpg',
    alt: 'Carved limestone monument to Dr. Padre Jose Burgos standing in the center of Plaza Burgos',
    bestTime: '5:30 PM to 8:30 PM',
    durationMinutes: 40,
    durationLabel: '35 to 45 min',
    highlight: 'Freshly fried empanadas at dusk',
    entryFee: 'Free entry',
    timeSlot: 4,
    timeSlotLabel: 'Evening',
    distanceFromPlaza: '1 min walk'
  },
  {
    id: 'hidden-garden',
    name: 'Hidden Garden',
    category: 'craft-place',
    categoryLabel: 'Crafts & Gardens',
    zone: 'Barangay Bulala',
    shortIntro: 'Botanical courtyard sanctuary famous for shaded Ilocano lunches',
    story:
      'Started as a private ornamental plant nursery on Vigan\'s quiet edge, Hidden Garden has grown into a lush stone-paved sanctuary of native palms, hanging ferns, and flowering orchids. Travelers step away from the midday glare here to eat crisp bagnet, smoky eggplant poqui-poqui, and pinakbet under a cool leafy canopy.',
    image: 'images/Landmarks/hidden-garden.jpg',
    alt: 'Flagstone garden path winding past dense tropical palms, orchids, and wooden bench at Hidden Garden',
    bestTime: '11:30 AM to 2:00 PM',
    durationMinutes: 75,
    durationLabel: '60 to 90 min',
    highlight: 'Shaded courtyard lunch with Ilocano classics',
    entryFee: 'Free garden entry',
    timeSlot: 2,
    timeSlotLabel: 'Midday',
    distanceFromPlaza: '10 min ride'
  },
  {
    id: 'crisologo-museum',
    name: 'Crisologo Museum',
    category: 'museum',
    categoryLabel: 'Ancestral Museums',
    zone: 'Liberation Boulevard',
    shortIntro: 'Intact ancestral house preserving family archives and vintage cars',
    story:
      'Maintained much as the family of Ilocos statesman Floro Crisologo left it, this two-story residence pairs vivid geometric machuca floor tiles with wood-and-glass gallery cases holding mid-century newspapers, diplomatic robes, and political history. Downstairs, preserved vintage vehicles sit right inside the stone carriage hall.',
    image: 'images/Landmarks/crisologo-museum.jpg',
    alt: 'Crisologo Museum gallery room with patterned machuca floor tiles and illuminated wooden display cases',
    bestTime: '10:00 AM to 3:00 PM',
    durationMinutes: 35,
    durationLabel: '30 to 40 min',
    highlight: 'Patterned machuca tiles and family archive',
    entryFee: 'Voluntary donation',
    timeSlot: 2,
    timeSlotLabel: 'Midday',
    distanceFromPlaza: '5 min walk'
  },
  {
    id: 'baluarte',
    name: 'Baluarte Resort & Safari',
    category: 'outskirts',
    categoryLabel: 'Hills & Parks',
    zone: 'Barangay Salindeg',
    shortIntro: 'Open-air hilltop wildlife park and family lookout south of town',
    story:
      'Spread across rolling coastal hills ten minutes south of the heritage core, Baluarte is Vigan\'s most popular family-friendly stop. Open grassy paddocks, wildlife encounters, life-sized Dinosaur Park sculptures, and breezy hillside viewing decks make it an easy contrast to the quiet museums downtown.',
    image: 'images/Landmarks/baluarte.jpg',
    alt: 'Open grassy grounds and hilltop stone terraces behind the Baluarte sign and dinosaur sculpture',
    bestTime: '8:30 AM to 11:00 AM',
    durationMinutes: 90,
    durationLabel: '60 to 90 min',
    highlight: 'Hillside safari shuttle and family lawns',
    entryFee: 'Free general entry',
    timeSlot: 3,
    timeSlotLabel: 'Afternoon',
    distanceFromPlaza: '12 min ride'
  }
];

// Hero loop displays ONLY the 11 physical places (strictly no food dishes or craft-only items).
export const HERO_PLACES = PLACES.map(({ id, name, shortIntro, image, alt }) => ({
  id,
  name,
  shortIntro,
  image,
  alt
}));

export const HERITAGE_FACTS = [
  {
    metric: 'UNESCO 1999',
    title: 'Asia\'s best-preserved colonial town plan',
    detail:
      'Inscribed on the World Heritage List for keeping its 16th-century interlocking plazas, merchant street grid, and traditional craftsmanship remarkably intact.'
  },
  {
    metric: 'New7Wonders',
    title: 'A living neighborhood, not a frozen set',
    detail:
      'Voted one of the New7Wonders Cities of the World in 2015 because Vigan\'s ancestral streets remain busy with weavers, potters, family kitchens, and evening festivals.'
  },
  {
    metric: '233 Houses',
    title: 'Built to outlast earthquakes and typhoons',
    detail:
      'Spared from World War II bombing, Vigan preserves thick brick-and-lime ground floors topped with flexible narra wood frames and sliding capiz shell windows.'
  }
];

export const CULTURE_ITEMS = [
  {
    id: 'abel-weaving',
    kind: 'Living Craft',
    featured: true,
    name: 'Abel Iloko Handloom Weaving',
    location: 'Barangay Camangaan & Heritage Shops',
    image: 'images/gallery/AbelWeaving.jpg',
    alt: 'Ilocano artisan spinning yarn and weaving cotton abel fabric on a traditional wooden handloom',
    summary:
      'Long before Spanish ships arrived in Ilocos, local weavers produced tough cotton abel textiles on foot-pedal hardwood looms. Look closely at binakul blankets, whose geometric whirlpool motifs were designed to confuse evil spirits and last for decades of everyday use.',
    tip: 'Ask local weavers along Camangaan or Calle Crisologo about binakul and inabel weave patterns.'
  },
  {
    id: 'vigan-empanada',
    kind: 'Street Food',
    featured: false,
    name: 'Vigan Empanada',
    location: 'Plaza Burgos Stalls',
    image: 'images/cuisine/ViganEmpanada.jpg',
    alt: 'Golden-orange crisp Vigan empanada folded around longganisa, egg, and shredded green papaya',
    summary:
      'Pressed from thin annatto-colored rice flour dough and fried to order around shredded green papaya, mung beans, egg, and garlicky longganisa, always splashed with sharp sukang Iloko.',
    tip: 'Best eaten piping hot at Plaza Burgos right after 5:30 PM.'
  },
  {
    id: 'ilocano-bagnet',
    kind: 'Signature Dish',
    featured: false,
    name: 'Crispy Ilocano Bagnet',
    location: 'Hidden Garden & Local Eateries',
    image: 'images/cuisine/Bagnet 4 Ways Recipe.jpeg',
    alt: 'Chopped double-fried Ilocano bagnet pork belly with blistered golden crackling',
    summary:
      'Pork belly simmered with garlic, peppercorns, and bay leaf, air-dried, and deep-fried twice until the rind shatters beside KBL (kamatis, bagoong, and lasuna shallots).',
    tip: 'Pair it with pinakbet or eggplant poqui-poqui for a classic Ilocano lunch.'
  },
  {
    id: 'vigan-longganisa',
    kind: 'Local Delicacy',
    featured: false,
    name: 'Vigan Longganisa',
    location: 'Vigan Public Market & Morning Kitchens',
    image: 'images/cuisine/Longganisa.jpeg',
    alt: 'Plump garlicky Vigan longganisa pork sausages browned in a pan',
    summary:
      'Short, plump native sausages seasoned with crushed Ilocos garlic, black pepper, and cane vinegar instead of sugar, delivering a bold savory tang unlike sweet Luzon variants.',
    tip: 'Buy vacuum-packed links at the public market on your final morning.'
  },
  {
    id: 'burnay-pottery',
    kind: 'Living Craft',
    featured: false,
    name: 'Burnay Stoneware Craft',
    location: 'Pagburnayan District',
    image: 'images/gallery/Vigan Pottery.jpg',
    alt: 'Handcrafted Vigan earthen clay jar stamped with VIGAN beside terracotta vessels',
    summary:
      'Shaped from grade-A local clay tempered with fine river sand and fired in high-heat brick kilns, authentic burnay jars stay cool and non-porous for fermenting vinegar and basi wine.',
    tip: 'Visit Pagburnayan workshops to watch potters shape raw clay by hand and foot.'
  }
];

export const GALLERY_ITEMS = [
  {
    id: 'lantern-street',
    title: 'Calle Crisologo by Lantern Light',
    location: 'Mestizo District',
    image: 'images/attractions/CalleCrisologo.jpg',
    alt: 'Warm golden streetlamps lighting the cobblestone length of Calle Crisologo at night',
    caption:
      'After sunset, iron brackets along the ancestral stone walls cast a warm glow across the flagstones, turning the five-block heritage avenue into Vigan\'s favorite evening walk.',
    spanClass: 'archive-span-wide'
  },
  {
    id: 'festival-arches',
    title: 'Festival Arches After Dark',
    location: 'Calle Crisologo',
    image: 'images/gallery/ViganNightMode.jpg',
    alt: 'Colorful floral lantern arches glowing overhead along Calle Crisologo at night',
    caption:
      'During the January Longganisa Festival and May Viva Vigan celebration, floral arches and glowing lanterns span the cobblestones for parades and cultural performances.',
    spanClass: 'archive-span-std'
  },
  {
    id: 'dusk-calesa',
    title: 'Kalesa Waiting at Dusk',
    location: 'Heritage Core',
    image: 'images/gallery/calesa.jpg',
    alt: 'Horse-drawn kalesa carriage paused on rain-slicked cobblestones beside weathered stone facades at twilight',
    caption:
      'Horse-drawn kalesas remain an active piece of daily life in Vigan. A one-hour coached circuit connects the core plazas, ancestral museums, and Pagburnayan pottery sheds.',
    spanClass: 'archive-span-std'
  },
  {
    id: 'afternoon-kalesas',
    title: 'Afternoon Kalesas Along the Shops',
    location: 'Calle Crisologo',
    image: 'images/carousel/car1.jpeg',
    alt: 'Two horse-drawn kalesas passing shop signs and heritage inns along sunlit Calle Crisologo',
    caption:
      'Mid-afternoon brings steady foot traffic past woodcarving studios, weaving stalls, and boutique heritage inns tucked behind centuries-old timber doorways.',
    spanClass: 'archive-span-wide'
  },
  {
    id: 'morning-facades',
    title: 'Quiet Morning Cobblestones',
    location: 'Mestizo District',
    image: 'images/carousel/car3.jpeg',
    alt: 'Quiet sunlit cobblestones lined with whitewashed lime-and-brick ancestral houses and parked kalesas',
    caption:
      'Step out before 8:00 AM to notice architectural details easily missed in crowds: coral-stone bases, carved wooden eaves, and lime mortar showing red brick beneath.',
    spanClass: 'archive-span-std'
  },
  {
    id: 'market-longganisa',
    title: 'Fresh Vigan Longganisa Links',
    location: 'Vigan Public Market',
    image: 'images/gallery/Vigan Longganisa.jpg',
    alt: 'Bundles of freshly tied Vigan longganisa sausages arranged in traditional links',
    caption:
      'Every morning, market vendors tie dozens of small garlicky pork links in natural casings, ready for breakfast silog plates or chilled pasalubong boxes bound for Manila.',
    spanClass: 'archive-span-std'
  }
];

export const TRIP_PRESETS = [
  {
    id: 'one-day-classic',
    name: '1-Day Classic Highlights',
    subtitle: '5 essential stops from morning cobblestones to the nightly fountain',
    stopIds: [
      'calle-crisologo',
      'st-paul-cathedral',
      'padre-burgos-house',
      'bantay-bell-tower',
      'plaza-salcedo'
    ]
  },
  {
    id: 'two-day-heritage',
    name: '2-Day Heritage Weekend',
    subtitle: '8 landmarks covering museums, pottery kilns, garden lunch, and plazas',
    stopIds: [
      'calle-crisologo',
      'st-paul-cathedral',
      'syquia-mansion',
      'padre-burgos-house',
      'hidden-garden',
      'pagburnayan',
      'bantay-bell-tower',
      'plaza-salcedo'
    ]
  }
];

export const TRAVEL_ESSENTIALS = [
  {
    id: 'getting-there',
    title: 'Getting There',
    icon: 'ph-bus',
    summary: 'Direct overnight buses from Metro Manila or a short flight to Laoag.',
    bullets: [
      'By bus: 7 to 8 hours via TPLEX from Cubao or Pasay on Partas, Farinas, or GV Florida coaches.',
      'By air: 1-hour flight from Manila to Laoag International Airport, then 1.5 to 2 hours south by van or bus.',
      'By private car: Scenic north drive along NLEX, SCTEX, TPLEX, and MacArthur Highway.'
    ]
  },
  {
    id: 'best-season',
    title: 'Best Season & Festivals',
    icon: 'ph-calendar-blank',
    summary: 'Cool dry breezes run from November through February, with major town fiestas in January and May.',
    bullets: [
      'Nov to Feb: Mild northern weather ideal for long daytime walks around the plazas.',
      'January (Longganisa Festival): Street parades and cook-offs celebrating Vigan\'s iconic sausage.',
      'First week of May (Viva Vigan Binatbatan): Cultural dances, abel cotton pounding, and heritage arts.'
    ]
  },
  {
    id: 'getting-around',
    title: 'Getting Around & Staying Over',
    icon: 'ph-compass',
    summary: 'Walk the core on foot; pair kalesas and tricycles for hilltop and garden stops.',
    bullets: [
      'Heritage Core: Calle Crisologo, St. Paul Cathedral, Plaza Salcedo, Plaza Burgos, and Syquia Mansion are all 1 to 5 minutes apart on foot.',
      'Outer Stops: Take a tricycle or kalesa tour to Pagburnayan, Hidden Garden, Bantay Bell Tower, and Baluarte.',
      'Where to stay: Restored ancestral inns right on or one block off Calle Crisologo let you catch 6:30 AM light.'
    ]
  }
];

export const FAQ_ITEMS = [
  {
    id: 'faq-days',
    question: 'How many days do I need to explore Vigan properly?',
    answer:
      'Two days and one night is the ideal pace. It gives you one quiet dawn walk on Calle Crisologo, unhurried visits to Syquia Mansion and the National Museum, an afternoon loop to Pagburnayan and Bantay Bell Tower, and time for both Plaza Burgos empanadas and the 7:30 PM Plaza Salcedo dancing fountain.',
    defaultOpen: true
  },
  {
    id: 'faq-fees',
    question: 'Do Vigan\'s main landmarks charge expensive entrance fees?',
    answer:
      'Most of Vigan\'s signature stops are free or ask only a modest preservation fee. Calle Crisologo, St. Paul Cathedral, Plaza Salcedo, Plaza Burgos, Padre Burgos House (National Museum), Hidden Garden, and Baluarte general grounds are free; Syquia Mansion charges PHP 30 and Bantay Bell Tower and Crisologo Museum welcome voluntary donations.',
    defaultOpen: false
  },
  {
    id: 'faq-footwear',
    question: 'What should I wear when walking around the heritage zone?',
    answer:
      'Wear cushioned flat walking shoes or sandals with grip because Vigan\'s centuries-old flagstones are uneven and get slick after rain. Pack breathable cotton clothing, sun protection for midday walks, and modest attire if stepping inside St. Paul Metropolitan Cathedral.',
    defaultOpen: false
  },
  {
    id: 'faq-pasalubong',
    question: 'What pasalubong is Vigan most famous for bringing home?',
    answer:
      'Travelers almost always leave with chilled Vigan longganisa links, crispy bagnet packs, sticky Royal Bibingka rice cakes, handwoven abel Iloko runners or blankets, miniature burnay clay vessels, and bottles of aged sukang Iloko sugarcane vinegar.',
    defaultOpen: false
  }
];
