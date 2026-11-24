import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as viganData from '../js/data/vigan-data.js';
import {
  OUT_OF_SCOPE_MESSAGE,
  WELCOME_MESSAGE,
  STARTER_SUGGESTIONS,
  CHATBOT_KNOWLEDGE
} from '../js/data/chatbot-knowledge.js';
import {
  normalizeQuestion,
  buildKnowledgeBase,
  createConversation
} from '../js/modules/chatbot-engine.js';

const SAMPLE_PAGE_CONTEXT = {
  whyIntro:
    'While most Spanish-era urban centers in the archipelago were flattened during World War II, Vigan survived intact.',
  developer: {
    name: 'John Eduard Madriaga',
    handle: '@EduCode597',
    portfolioUrl: 'https://educode597.github.io/',
    githubUrl: 'https://github.com/EduCode597',
    linkedinUrl: 'https://www.linkedin.com/in/john-eduard-madriaga-710198396/',
    email: 'educode597@gmail.com'
  }
};

function createTestKb() {
  return buildKnowledgeBase({
    places: viganData.PLACES,
    categories: viganData.PLACE_CATEGORIES,
    heritageFacts: viganData.HERITAGE_FACTS,
    cultureItems: viganData.CULTURE_ITEMS,
    galleryItems: viganData.GALLERY_ITEMS,
    presets: viganData.TRIP_PRESETS,
    travelEssentials: viganData.TRAVEL_ESSENTIALS,
    faqItems: viganData.FAQ_ITEMS,
    pageContext: SAMPLE_PAGE_CONTEXT
  });
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      collectStrings(value[key], out);
    }
  }
  return out;
}

function getReplyBodyText(reply) {
  const parts = [...(reply.paragraphs || [])];
  if (Array.isArray(reply.items)) {
    for (const item of reply.items) {
      if (item.title) parts.push(item.title);
      if (item.text) parts.push(item.text);
    }
  }
  return parts.join('\n');
}

function getAllReplyText(reply) {
  const parts = [];
  if (reply.title) parts.push(reply.title);
  parts.push(getReplyBodyText(reply));
  for (const action of reply.actions || []) {
    if (action.label) parts.push(action.label);
  }
  for (const item of reply.items || []) {
    for (const action of item.actions || []) {
      if (action.label) parts.push(action.label);
    }
  }
  parts.push(...(reply.suggestions || []));
  return parts.join('\n');
}

const SOURCE_CORPUS = [
  ...collectStrings(viganData),
  ...collectStrings(SAMPLE_PAGE_CONTEXT),
  ...collectStrings(CHATBOT_KNOWLEDGE)
].join('\n');

const FACTUAL_KINDS = new Set(['answer', 'list', 'partial-out-of-scope']);

function assertReplyGuardrails(reply) {
  const fullText = getAllReplyText(reply);
  expect(fullText).not.toContain('\u2014');
  expect(fullText).not.toContain('\u2013');
  expect(fullText).not.toMatch(/\p{Extended_Pictographic}/u);

  expect(Array.isArray(reply.paragraphs)).toBe(true);
  expect(reply.paragraphs.length).toBeGreaterThan(0);
  expect(Array.isArray(reply.actions)).toBe(true);
  expect(Array.isArray(reply.suggestions)).toBe(true);

  if (FACTUAL_KINDS.has(reply.kind)) {
    const bodyText = getReplyBodyText(reply);
    expect(Array.isArray(reply.sourceSnippets)).toBe(true);
    expect(reply.sourceSnippets.length).toBeGreaterThan(0);
    for (const snippet of reply.sourceSnippets) {
      expect(typeof snippet).toBe('string');
      expect(snippet.trim().length).toBeGreaterThan(0);
      expect(SOURCE_CORPUS).toContain(snippet);
      expect(bodyText).toContain(snippet);
    }
  }
}

describe('chatbot engine and knowledge base', () => {
  it('normalizes questions by lowercasing, stripping punctuation and diacritics, collapsing spaces, and capping at 300 chars', () => {
    const basic = normalizeQuestion("  Fariñas   Empanada?!  Café \u2014 Vigan's Best!! ");
    expect(basic.normalized).toBe('farinas empanada cafe vigan s best');
    expect(basic.tokens).toEqual(['farinas', 'empanada', 'cafe', 'vigan', 's', 'best']);

    const longInput = 'a'.repeat(350);
    const truncated = normalizeQuestion(longInput);
    expect(truncated.normalized.length).toBe(300);
    expect(truncated.tokens).toEqual(['a'.repeat(300)]);
  });

  it('handles small talk greetings, thanks, and capability help with suggestions', () => {
    const conv = createConversation(createTestKb());
    for (const q of ['hello', 'thanks', 'what can I ask?']) {
      const reply = conv.ask(q);
      assertReplyGuardrails(reply);
      expect(reply.kind).toBe('smalltalk');
      expect(reply.suggestions.length).toBeGreaterThan(0);
    }
  });

  it('answers general and specific landmark intents accurately without inventing details', () => {
    const conv = createConversation(createTestKb());

    const bantay = conv.ask('Tell me about Bantay Bell Tower');
    assertReplyGuardrails(bantay);
    expect(bantay.kind).toBe('answer');
    const bantayText = getReplyBodyText(bantay);
    expect(bantayText).toContain('Bantay Bell Tower');
    expect(bantayText).toContain('1591');
    expect(bantayText).toContain('4:30 PM to 5:45 PM');
    expect(bantayText).toContain('Voluntary donation');
    expect(bantay.actions).toEqual([
      { type: 'view-place', id: 'bantay-bell-tower', label: 'View in explorer' },
      { type: 'add-place', id: 'bantay-bell-tower', label: '+ Add to my plan' }
    ]);

    const syquiaFee = conv.ask('How much is Syquia Mansion entrance fee?');
    assertReplyGuardrails(syquiaFee);
    expect(syquiaFee.kind).toBe('answer');
    expect(getReplyBodyText(syquiaFee)).toContain('PHP 30 entrance');

    const salcedoTime = conv.ask('Best time to visit Plaza Salcedo?');
    assertReplyGuardrails(salcedoTime);
    expect(salcedoTime.kind).toBe('answer');
    expect(getReplyBodyText(salcedoTime)).toContain('7:30 PM fountain show');

    const hiddenStay = conv.ask('How long to stay at Hidden Garden?');
    assertReplyGuardrails(hiddenStay);
    expect(hiddenStay.kind).toBe('answer');
    expect(getReplyBodyText(hiddenStay)).toContain('60 to 90 min');

    const pagburnayanLoc = conv.ask('Where is Pagburnayan and how far from the plaza?');
    assertReplyGuardrails(pagburnayanLoc);
    expect(pagburnayanLoc.kind).toBe('answer');
    const pagLocText = getReplyBodyText(pagburnayanLoc);
    expect(pagLocText).toContain('Liberation Boulevard');
    expect(pagLocText).toContain('8 min ride');

    const burgosHighlight = conv.ask('What is the highlight of Padre Burgos House?');
    assertReplyGuardrails(burgosHighlight);
    expect(burgosHighlight.kind).toBe('answer');
    expect(getReplyBodyText(burgosHighlight)).toContain('1821 Basi Revolt painting gallery');
  });

  it('gives history intent precedence over bestTime on "when was / when did" questions (Review Focus #1)', () => {
    const conv = createConversation(createTestKb());

    const syquiaHistory = conv.ask('When was Syquia Mansion built?');
    assertReplyGuardrails(syquiaHistory);
    expect(syquiaHistory.kind).toBe('answer');
    const historyText = getReplyBodyText(syquiaHistory);
    expect(historyText).toContain('1830');
    expect(historyText).toContain('Elpidio Quirino');
    expect(historyText).not.toBe('Best time to visit: 9:00 AM to 11:30 AM');
    expect(historyText).not.toContain('9:00 AM to 11:30 AM');

    const unescoHistory = conv.ask('When did Vigan become UNESCO?');
    assertReplyGuardrails(unescoHistory);
    expect(unescoHistory.kind).toBe('answer');
    expect(getReplyBodyText(unescoHistory)).toContain('World Heritage List');
  });

  it('supports 1-edit typo tolerance on tokens >= 5 chars without false-matching short words (Review Focus #3)', () => {
    const conv = createConversation(createTestKb());

    const typoMatch = conv.ask('Tell me about Calle Crisolgo');
    assertReplyGuardrails(typoMatch);
    expect(typoMatch.kind).toBe('answer');
    expect(getReplyBodyText(typoMatch)).toContain('Calle Crisologo');
    expect(typoMatch.actions.some((a) => a.type === 'view-place' && a.id === 'calle-crisologo')).toBe(true);

    const shortWordNoMatch = conv.ask('Where can I rent a car in Tokyo?');
    assertReplyGuardrails(shortWordNoMatch);
    expect(shortWordNoMatch.kind).toBe('out-of-scope');
    expect(shortWordNoMatch.paragraphs).toEqual([OUT_OF_SCOPE_MESSAGE]);
  });

  it('returns multi-match lists for plazas, museums, and entrance fees', () => {
    const conv = createConversation(createTestKb());

    const plazas = conv.ask('Tell me about Vigan plazas');
    assertReplyGuardrails(plazas);
    expect(plazas.kind).toBe('list');
    const plazasText = getReplyBodyText(plazas);
    expect(plazasText).toContain('Plaza Salcedo');
    expect(plazasText).toContain('Plaza Burgos');
    expect(plazas.items).toHaveLength(2);
    expect(plazas.items.every((item) => item.actions.length === 2)).toBe(true);

    const museums = conv.ask('Ancestral museums');
    assertReplyGuardrails(museums);
    expect(museums.kind).toBe('list');
    const museumsText = getReplyBodyText(museums);
    expect(museumsText).toContain('Syquia Mansion Museum');
    expect(museumsText).toContain('Padre Burgos House');
    expect(museumsText).toContain('Crisologo Museum');
    expect(museums.items).toHaveLength(3);

    const fees = conv.ask('Entrance fees');
    assertReplyGuardrails(fees);
    expect(fees.kind).toBe('list');
    const feesText = getReplyBodyText(fees);
    const faqFees = viganData.FAQ_ITEMS.find((f) => f.id === 'faq-fees');
    expect(feesText).toContain(faqFees.answer);
    for (const place of viganData.PLACES) {
      expect(feesText).toContain(place.entryFee);
    }
  });

  it('remembers the last landmark for conversational follow-ups and switches or resets context cleanly', () => {
    const conv = createConversation(createTestKb());

    const first = conv.ask('Tell me about Syquia Mansion');
    assertReplyGuardrails(first);
    expect(first.kind).toBe('answer');
    expect(getReplyBodyText(first)).toContain('Syquia Mansion Museum');

    const followUpFee = conv.ask('How much is it?');
    assertReplyGuardrails(followUpFee);
    expect(followUpFee.kind).toBe('answer');
    expect(getReplyBodyText(followUpFee)).toContain('PHP 30 entrance');
    expect(followUpFee.actions.some((a) => a.id === 'syquia-mansion')).toBe(true);

    const followUpDist = conv.ask('How far is it?');
    assertReplyGuardrails(followUpDist);
    expect(followUpDist.kind).toBe('answer');
    expect(getReplyBodyText(followUpDist)).toContain('4 min walk');
    expect(followUpDist.actions.some((a) => a.id === 'syquia-mansion')).toBe(true);

    const switched = conv.ask('What about Bantay Bell Tower?');
    assertReplyGuardrails(switched);
    expect(switched.kind).toBe('answer');
    expect(getReplyBodyText(switched)).toContain('Bantay Bell Tower');

    const bantayFee = conv.ask('How much is it?');
    assertReplyGuardrails(bantayFee);
    expect(bantayFee.kind).toBe('answer');
    expect(getReplyBodyText(bantayFee)).toContain('Voluntary donation');
    expect(bantayFee.actions.some((a) => a.id === 'bantay-bell-tower')).toBe(true);

    conv.resetContext();
    const afterReset = conv.ask('How much is it?');
    assertReplyGuardrails(afterReset);
    expect(afterReset.kind).toBe('out-of-scope');
    expect(afterReset.paragraphs).toEqual([OUT_OF_SCOPE_MESSAGE]);

    // Unrelated question without pronoun does not leak prior landmark context
    conv.ask('Tell me about Syquia Mansion');
    const unrelatedLoc = conv.ask('How far is Paris?');
    assertReplyGuardrails(unrelatedLoc);
    expect(unrelatedLoc.kind).toBe('out-of-scope');

    // Pronoun + unsupported detail triggers partial out-of-scope for remembered landmark
    const followUpOpen = conv.ask('What time does it open?');
    assertReplyGuardrails(followUpOpen);
    expect(followUpOpen.kind).toBe('partial-out-of-scope');
    expect(followUpOpen.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(followUpOpen.paragraphs[1]).toContain('Syquia Mansion Museum');
    expect(followUpOpen.actions.some((a) => a.id === 'syquia-mansion')).toBe(true);
  });

  it('distinguishes Option 2 partial out-of-scope, developer contact answers (Review Focus #2), and pure out-of-scope', () => {
    const conv = createConversation(createTestKb());

    const hotelPhone = conv.ask('What is the phone number of a hotel in Vigan?');
    assertReplyGuardrails(hotelPhone);
    expect(hotelPhone.kind).toBe('partial-out-of-scope');
    expect(hotelPhone.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(hotelPhone.paragraphs[1].startsWith('Here is what the site says about ')).toBe(true);
    expect(hotelPhone.paragraphs[1]).toContain(
      'Restored ancestral inns right on or one block off Calle Crisologo'
    );

    const syquiaOpen = conv.ask('What time does Syquia Mansion open?');
    assertReplyGuardrails(syquiaOpen);
    expect(syquiaOpen.kind).toBe('partial-out-of-scope');
    expect(syquiaOpen.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(syquiaOpen.paragraphs[1].startsWith('Here is what the site says about ')).toBe(true);
    expect(syquiaOpen.paragraphs[1]).toContain('9:00 AM to 11:30 AM');
    expect(syquiaOpen.paragraphs[1].toLowerCase()).toContain('best time to visit');
    expect(syquiaOpen.paragraphs[1].toLowerCase()).not.toContain('opens at');
    expect(syquiaOpen.paragraphs[1].toLowerCase()).not.toContain('opening hours');
    expect(syquiaOpen.actions.some((a) => a.id === 'syquia-mansion')).toBe(true);

    const bagnetPrice = conv.ask('How much does bagnet cost?');
    assertReplyGuardrails(bagnetPrice);
    expect(bagnetPrice.kind).toBe('partial-out-of-scope');
    expect(bagnetPrice.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(bagnetPrice.paragraphs[1].startsWith('Here is what the site says about ')).toBe(true);
    const bagnetItem = viganData.CULTURE_ITEMS.find((c) => c.id === 'ilocano-bagnet');
    expect(bagnetPrice.paragraphs[1]).toContain(bagnetItem.summary);

    const devEmail = conv.ask("What is the developer's email?");
    assertReplyGuardrails(devEmail);
    expect(devEmail.kind).toBe('answer');
    const devText = getReplyBodyText(devEmail);
    expect(devText).toContain('John Eduard Madriaga');
    expect(devText).toContain('educode597@gmail.com');

    const devGithub = conv.ask("What is the developer's GitHub?");
    assertReplyGuardrails(devGithub);
    expect(devGithub.kind).toBe('answer');
    expect(getReplyBodyText(devGithub)).toContain('https://github.com/EduCode597');

    const devPhone = conv.ask("What is the developer's phone number?");
    assertReplyGuardrails(devPhone);
    expect(devPhone.kind).toBe('partial-out-of-scope');
    expect(devPhone.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(devPhone.paragraphs[1]).toContain('educode597@gmail.com');

    const weatherTomorrow = conv.ask('What is the weather tomorrow in Vigan?');
    assertReplyGuardrails(weatherTomorrow);
    expect(weatherTomorrow.kind).toBe('partial-out-of-scope');
    expect(weatherTomorrow.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(weatherTomorrow.paragraphs[1]).toContain('Mild northern weather');

    const museumHours = conv.ask('What time do ancestral museums open?');
    assertReplyGuardrails(museumHours);
    expect(museumHours.kind).toBe('partial-out-of-scope');
    expect(museumHours.paragraphs[0]).toBe(OUT_OF_SCOPE_MESSAGE);
    expect(museumHours.paragraphs[1]).toContain('Syquia Mansion Museum');

    const busHours = conv.ask('How many hours from Manila to Vigan?');
    assertReplyGuardrails(busHours);
    expect(busHours.kind).toBe('answer');
    expect(getReplyBodyText(busHours)).toContain('7 to 8 hours');

    for (const oos of [
      'What is the capital of France?',
      'Where can I buy Bitcoin in Vigan?',
      'asdfghjkl',
      '<script>alert(1)</script>'
    ]) {
      const reply = conv.ask(oos);
      assertReplyGuardrails(reply);
      expect(reply.kind).toBe('out-of-scope');
      expect(reply.paragraphs).toEqual([OUT_OF_SCOPE_MESSAGE]);
    }
  });

  it('reaches every item across PLACES, HERITAGE_FACTS, CULTURE_ITEMS, GALLERY_ITEMS, TRIP_PRESETS, TRAVEL_ESSENTIALS, and FAQ_ITEMS', () => {
    const kb = createTestKb();

    for (const place of viganData.PLACES) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${place.name}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      const text = getReplyBodyText(reply);
      expect(text).toContain(place.name);
      expect(text).toContain(place.shortIntro);
      expect(reply.actions.some((a) => a.type === 'view-place' && a.id === place.id)).toBe(true);
      expect(reply.actions.some((a) => a.type === 'add-place' && a.id === place.id)).toBe(true);
    }

    for (const fact of viganData.HERITAGE_FACTS) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${fact.metric} ${fact.title}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(fact.detail);
    }

    for (const item of viganData.CULTURE_ITEMS) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${item.name}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(item.summary);
    }

    for (const item of viganData.GALLERY_ITEMS) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${item.title}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(item.caption);
    }

    for (const preset of viganData.TRIP_PRESETS) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${preset.name}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(preset.subtitle);
      expect(reply.actions).toEqual([
        { type: 'load-preset', id: preset.id, label: 'Load this plan' }
      ]);
    }

    for (const essential of viganData.TRAVEL_ESSENTIALS) {
      const conv = createConversation(kb);
      const reply = conv.ask(`Tell me about ${essential.title}`);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(essential.summary);
    }

    for (const faq of viganData.FAQ_ITEMS) {
      const conv = createConversation(kb);
      const reply = conv.ask(faq.question);
      assertReplyGuardrails(reply);
      expect(['answer', 'list']).toContain(reply.kind);
      expect(getReplyBodyText(reply)).toContain(faq.answer);
    }

    const helpConv = createConversation(kb);
    const planHelp = helpConv.ask('How do I use My Vigan Plan?');
    assertReplyGuardrails(planHelp);
    expect(planHelp.kind).toBe('answer');

    const darkHelp = helpConv.ask('Does this site have dark mode?');
    assertReplyGuardrails(darkHelp);
    expect(darkHelp.kind).toBe('answer');

    const whyReply = helpConv.ask('Why is Vigan famous?');
    assertReplyGuardrails(whyReply);
    expect(['answer', 'list']).toContain(whyReply.kind);
    expect(getReplyBodyText(whyReply)).toContain(SAMPLE_PAGE_CONTEXT.whyIntro);

    const eatChip = helpConv.ask('What to eat');
    assertReplyGuardrails(eatChip);
    expect(eatChip.kind).toBe('list');
    expect(getReplyBodyText(eatChip)).toContain('Vigan Empanada');

    const plan1Chip = helpConv.ask('Plan 1 day');
    assertReplyGuardrails(plan1Chip);
    expect(plan1Chip.kind).toBe('answer');
    expect(plan1Chip.actions).toEqual([
      { type: 'load-preset', id: 'one-day-classic', label: 'Load this plan' }
    ]);

    const getThereChip = helpConv.ask('How to get there');
    assertReplyGuardrails(getThereChip);
    expect(getThereChip.kind).toBe('answer');
    expect(getReplyBodyText(getThereChip)).toContain('Cubao or Pasay');
  });

  it('enforces zero em-dashes, zero en-dashes, and zero emojis across chatbot knowledge exports', () => {
    const exportedText = collectStrings({
      OUT_OF_SCOPE_MESSAGE,
      WELCOME_MESSAGE,
      STARTER_SUGGESTIONS,
      CHATBOT_KNOWLEDGE
    }).join('\n');

    expect(exportedText).not.toContain('\u2014');
    expect(exportedText).not.toContain('\u2013');
    expect(exportedText).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(OUT_OF_SCOPE_MESSAGE).toBe("This information is outside the website's information.");
    expect(WELCOME_MESSAGE).toBe(
      "Hi! Ask me anything about Vigan's landmarks, food, crafts, or planning your visit."
    );
    expect(STARTER_SUGGESTIONS).toEqual([
      'Entrance fees',
      'What to eat',
      'Plan 1 day',
      'How to get there'
    ]);

    const rootDir = path.resolve(import.meta.dirname, '..');
    for (const rel of [
      'js/data/chatbot-knowledge.js',
      'js/modules/chatbot-engine.js'
    ]) {
      const src = fs.readFileSync(path.join(rootDir, rel), 'utf8');
      expect(src).not.toContain('\u2014');
      expect(src).not.toContain('\u2013');
      expect(src).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(src).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    }
  });
});
