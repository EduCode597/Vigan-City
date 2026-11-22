import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
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
} from '../js/data/vigan-data.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

function collectStrings(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

describe('Vigan data & content integrity', () => {
  it('defines all 11 physical Vigan places with unique IDs and complete visitor metadata', () => {
    expect(PLACES).toHaveLength(11);
    const ids = new Set(PLACES.map((p) => p.id));
    expect(ids.size).toBe(11);

    const requiredIds = [
      'calle-crisologo',
      'bantay-bell-tower',
      'syquia-mansion',
      'plaza-salcedo',
      'st-paul-cathedral',
      'padre-burgos-house',
      'pagburnayan',
      'plaza-burgos',
      'hidden-garden',
      'crisologo-museum',
      'baluarte'
    ];
    for (const id of requiredIds) {
      expect(ids.has(id)).toBe(true);
    }

    for (const place of PLACES) {
      expect(place.name.length).toBeGreaterThan(2);
      expect(place.shortIntro.length).toBeGreaterThan(12);
      expect(place.story.length).toBeGreaterThan(80);
      expect(place.bestTime.length).toBeGreaterThan(3);
      expect(place.durationMinutes).toBeGreaterThan(0);
      expect(place.durationLabel.length).toBeGreaterThan(3);
      expect(place.highlight.length).toBeGreaterThan(5);
      expect(place.entryFee.length).toBeGreaterThan(2);
      expect([1, 2, 3, 4]).toContain(place.timeSlot);
      expect(['Morning', 'Midday', 'Afternoon', 'Evening']).toContain(place.timeSlotLabel);
      expect(place.alt.length).toBeGreaterThan(8);

      // Ensure Afternoon/Evening slots do not contradict themselves with AM-only bestTime
      if (place.timeSlotLabel === 'Afternoon' || place.timeSlotLabel === 'Evening') {
        expect(place.bestTime, `Time slot mismatch on ${place.name}`).toMatch(/PM/i);
      }
    }
  });

  it('includes ONLY the 11 physical places in HERO_PLACES (strictly excluding foods and crafts)', () => {
    expect(HERO_PLACES).toHaveLength(11);
    const placeIds = PLACES.map((p) => p.id);
    expect(HERO_PLACES.map((p) => p.id)).toEqual(placeIds);

    const forbiddenPatterns = [
      /empanada/i,
      /bagnet/i,
      /longganisa/i,
      /abelweaving/i,
      /vigan pottery/i,
      /images\/cuisine\//i
    ];
    for (const slide of HERO_PLACES) {
      for (const rx of forbiddenPatterns) {
        expect(slide.name).not.toMatch(rx);
        expect(slide.image).not.toMatch(rx);
      }
    }
  });

  it('verifies every referenced image path exists on disk and never uses watermarked car2.jpg', () => {
    const imagePaths = [
      ...PLACES.map((p) => p.image),
      ...PLACES.filter((p) => p.nightImage).map((p) => p.nightImage),
      ...HERO_PLACES.map((p) => p.image),
      ...CULTURE_ITEMS.map((c) => c.image),
      ...GALLERY_ITEMS.map((g) => g.image)
    ];

    expect(imagePaths.length).toBeGreaterThanOrEqual(22);
    for (const relPath of imagePaths) {
      expect(relPath).not.toMatch(/car2\.jpg/i);
      const absPath = path.join(ROOT_DIR, relPath);
      expect(fs.existsSync(absPath), `Missing image on disk: ${relPath}`).toBe(true);
    }
  });

  it('contains valid categories, heritage facts, culture items, gallery captions, presets, travel essentials, and FAQs', () => {
    expect(PLACE_CATEGORIES.map((c) => c.id)).toEqual(['all', 'core', 'museum', 'craft-place', 'outskirts']);
    expect(HERITAGE_FACTS).toHaveLength(3);
    expect(CULTURE_ITEMS).toHaveLength(5);
    expect(CULTURE_ITEMS.filter((c) => c.featured)).toHaveLength(1);
    expect(GALLERY_ITEMS).toHaveLength(6);
    for (const g of GALLERY_ITEMS) {
      expect(g.title.length).toBeGreaterThan(4);
      expect(g.caption.length).toBeGreaterThan(25);
    }

    const validPlaceIds = new Set(PLACES.map((p) => p.id));
    expect(TRIP_PRESETS).toHaveLength(2);
    for (const preset of TRIP_PRESETS) {
      expect(preset.stopIds.length).toBeGreaterThanOrEqual(4);
      for (const id of preset.stopIds) {
        expect(validPlaceIds.has(id)).toBe(true);
      }
    }

    expect(TRAVEL_ESSENTIALS).toHaveLength(3);
    expect(FAQ_ITEMS).toHaveLength(4);
  });

  it('contains zero em-dashes, zero en-dashes, and zero emojis across all data copy', () => {
    const allStrings = collectStrings({
      PLACES,
      HERO_PLACES,
      PLACE_CATEGORIES,
      HERITAGE_FACTS,
      CULTURE_ITEMS,
      GALLERY_ITEMS,
      TRIP_PRESETS,
      TRAVEL_ESSENTIALS,
      FAQ_ITEMS
    });

    const emojiRegex = /\p{Extended_Pictographic}/u;
    for (const text of allStrings) {
      expect(text, `Found em-dash in: ${text}`).not.toContain('\u2014');
      expect(text, `Found en-dash in: ${text}`).not.toContain('\u2013');
      expect(text, `Found emoji in: ${text}`).not.toMatch(emojiRegex);
    }
  });
});
