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

    // Zero window.addEventListener('scroll') anywhere in production code
    const jsFiles = [
      'js/main.js',
      'js/data/vigan-data.js',
      'js/modules/theme.js',
      'js/modules/marquee.js',
      'js/modules/itinerary.js',
      'js/modules/explorer.js',
      'js/modules/lightbox.js',
      'js/modules/reveal.js'
    ];
    for (const rel of jsFiles) {
      const src = readText(rel);
      expect(src, `Found forbidden scroll listener in ${rel}`).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    }

    // Eyebrow cap: max 2 eyebrows across the 6 sections
    const eyebrowMatches = html.match(/class="[^"]*\bvigan-eyebrow\b[^"]*"/g) || [];
    expect(eyebrowMatches.length).toBeLessThanOrEqual(2);

    // Single marquee only
    const marqueeMatches = html.match(/class="[^"]*\bmarquee-viewport\b[^"]*"/g) || [];
    expect(marqueeMatches.length).toBe(1);

    // CSS uses @layer custom for Bootstrap 6 layer interoperability
    expect(css).toContain('@layer custom');
    expect(css).toContain('[data-bs-theme="dark"]');
    expect(css).toContain('prefers-reduced-motion');
    expect(mainJs.length).toBeGreaterThan(100);
  });
});
