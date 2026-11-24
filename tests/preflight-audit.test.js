import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
}

describe('Pre-flight static HTML, CSS, and Bootstrap 6 audit', () => {
  it('loads Bootstrap 6.0.0-alpha.1 CDN with verified SRI, Icon.svg favicon, and css/styles.css', () => {
    const html = readText('index.html');
    expect(html).toContain('bootstrap@6.0.0-alpha.1/dist/css/bootstrap.min.css');
    expect(html).toContain('sha384-B/GM4XqrwHnWXNOWMbloTmrYXZg10cakYGmpfsR/bbzQ6JAJI4ihuyADKLnBgrCe');
    expect(html).toContain('href="Icon.svg"');
    expect(html).toContain('href="css/styles.css"');
    expect(html).toContain('src="js/main.js"');
    expect(fs.existsSync(path.join(ROOT_DIR, 'css/styles.css'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT_DIR, 'style.css'))).toBe(false);
  });

  it('uses Bootstrap 6 native dialog, drawer, and details patterns with zero legacy v5 patterns', () => {
    const html = readText('index.html');
    expect(html).toContain('<main');
    expect(html).toContain('<footer');
    expect(html).toContain('class="drawer');
    expect(html).toContain('class="dialog');
    expect(html).toContain('class="skip-link"');

    // Forbidden Bootstrap v5 patterns
    expect(html).not.toMatch(/class="[^"]*\bmodal\b/);
    expect(html).not.toMatch(/class="[^"]*\boffcanvas\b/);
    expect(html).not.toContain('data-bs-ride');
    expect(html).not.toContain('bootstrap@5');
  });

  it('enforces taste-skill copy and code guardrails across index.html, css/styles.css, and js/', () => {
    const html = readText('index.html');
    const css = readText('css/styles.css');
    const mainJs = readText('js/main.js');

    // Zero em-dashes or en-dashes in visible HTML
    expect(html).not.toContain('\u2014');
    expect(html).not.toContain('\u2013');

    // Zero emojis in HTML
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);

    // Zero window.addEventListener('scroll'), em-dashes, en-dashes, or emojis in production JS
    const jsFiles = [
      'js/main.js',
      'js/data/vigan-data.js',
      'js/data/chatbot-knowledge.js',
      'js/modules/theme.js',
      'js/modules/marquee.js',
      'js/modules/itinerary.js',
      'js/modules/explorer.js',
      'js/modules/lightbox.js',
      'js/modules/reveal.js',
      'js/modules/chatbot-engine.js',
      'js/modules/chatbot.js'
    ];
    for (const rel of jsFiles) {
      const src = readText(rel);
      expect(src, `Found forbidden scroll listener in ${rel}`).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
      expect(src, `Found em-dash in ${rel}`).not.toContain('\u2014');
      expect(src, `Found en-dash in ${rel}`).not.toContain('\u2013');
      expect(src, `Found emoji in ${rel}`).not.toMatch(/\p{Extended_Pictographic}/u);
    }

    // Eyebrow cap: max 2 eyebrows across the 6 sections
    const eyebrowMatches = html.match(/class="[^"]*\bvigan-eyebrow\b[^"]*"/g) || [];
    expect(eyebrowMatches.length).toBeLessThanOrEqual(2);

    // Single marquee only, with no play/pause toggle button (hover pauses sliding)
    const marqueeMatches = html.match(/class="[^"]*\bmarquee-viewport\b[^"]*"/g) || [];
    expect(marqueeMatches.length).toBe(1);
    expect(html).not.toContain('id="marqueeToggle"');
    expect(css).toContain('.marquee-viewport:hover .marquee-track');

    // CSS uses @layer custom for Bootstrap 6 layer interoperability
    expect(css).toContain('@layer custom');
    expect(css).toContain('[data-bs-theme="dark"]');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('--bs-drawer-inset: 0');
    expect(css).toContain('--vigan-error:');
    expect(css).toContain('html.has-reveal .reveal:not(.is-visible)');
    expect(css).toContain(':not([open])');
    expect(css).not.toMatch(/\.plan-status\.is-error\s*\{[^}]*#b42318/i);
    expect(html).not.toMatch(/id="explorerSpotlight"[^>]*aria-live="polite"/);
    expect(html).toContain('@EduCode597');
    expect(html).toContain('https://educode597.github.io/');
    expect(html).toContain('https://github.com/EduCode597');
    expect(html).toContain('mailto:educode597@gmail.com');
    expect(mainJs.length).toBeGreaterThan(100);
  });

  it('includes accessible non-modal Ask Vigan chatbot markup and hidden-state CSS without breaking v6 guardrails', () => {
    const html = readText('index.html');
    const css = readText('css/styles.css');
    const readme = readText('README.md');

    expect(css).not.toContain('\u2014');
    expect(css).not.toContain('\u2013');
    expect(css).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(readme).not.toContain('\u2014');
    expect(readme).not.toContain('\u2013');
    expect(readme).not.toMatch(/\p{Extended_Pictographic}/u);

    expect(html).toContain('id="chatFab"');
    expect(html).toContain('aria-label="Ask about Vigan"');
    expect(html).toContain('aria-controls="chatPanel"');
    expect(html).toContain('id="chatPanel"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="false"');
    expect(css).toContain('.vigan-chat-panel[hidden]');
  });
});
