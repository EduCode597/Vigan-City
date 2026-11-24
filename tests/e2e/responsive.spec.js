import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  [280, 653],
  [320, 568],
  [360, 740],
  [375, 667],
  [390, 844],
  [430, 932],
  [540, 720],
  [600, 900],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [667, 375],
  [844, 390],
  [932, 430],
  [1024, 600],
  [1440, 900]
];

const TOUCH_SELECTORS = [
  '.site-brand',
  '.mobile-menu-btn',
  '.plan-trigger-btn',
  '.vigan-hero .btn-vigan-primary',
  '.vigan-hero .btn-vigan-secondary',
  '.explorer-chip',
  '.explorer-search-input',
  '.explorer-save-btn',
  '.spotlight-view-toggle',
  '.spotlight-actions button',
  '.footer-brand-link',
  '.footer-nav a',
  '.footer-portfolio-btn',
  '.footer-social-link'
];

for (const [w, h] of VIEWPORTS) {
  test.describe(`responsive ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, hasTouch: w < 992 });

    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);
    });

    test('no horizontal overflow and header controls stay on screen', async ({ page }) => {
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        for (const sel of ['.site-brand', '.header-actions', '.header-actions button']) {
          for (const el of document.querySelectorAll(sel)) {
            const b = el.getBoundingClientRect();
            if (b.width && (b.right > vw + 0.5 || b.left < -0.5)) out.push(`${sel} ${Math.round(b.left)}-${Math.round(b.right)} (vw ${vw})`);
          }
        }
        const footer = document.querySelectorAll('.footer-social-link, .footer-dev-card');
        for (const el of footer) {
          const b = el.getBoundingClientRect();
          if (b.right > vw + 0.5) out.push(`footer ${el.className} right ${Math.round(b.right)}`);
        }
        return { overflow: document.documentElement.scrollWidth - vw, out };
      });
      expect(m.out).toEqual([]);
      expect(m.overflow).toBeLessThanOrEqual(0);
    });

    test('photo viewer fits entirely inside the viewport', async ({ page }) => {
      await page.locator('#archiveGrid [data-gallery-index="0"]').scrollIntoViewIfNeeded();
      await page.locator('#archiveGrid [data-gallery-index="0"]').click();
      await expect(page.locator('#galleryLightbox')).toHaveAttribute('open', '');
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => {
        const vh = window.innerHeight;
        const dlg = document.getElementById('galleryLightbox').getBoundingClientRect();
        const next = document.querySelector('[data-lightbox-next]').getBoundingClientRect();
        const prev = document.querySelector('[data-lightbox-prev]').getBoundingClientRect();
        const close = document.querySelector('[data-lightbox-close]').getBoundingClientRect();
        return { vh, dlgTop: dlg.top, dlgBottom: dlg.bottom, nextBottom: next.bottom, prevBottom: prev.bottom, closeTop: close.top };
      });
      expect(r.dlgTop).toBeGreaterThanOrEqual(0);
      expect(r.dlgBottom).toBeLessThanOrEqual(r.vh + 1);
      expect(r.nextBottom).toBeLessThanOrEqual(r.dlgBottom + 1);
      expect(r.prevBottom).toBeLessThanOrEqual(r.dlgBottom + 1);
      expect(r.closeTop).toBeGreaterThanOrEqual(0);
    });

    test('plan drawer actions stay visible and usable', async ({ page }) => {
      await page.evaluate(() => document.getElementById('planDrawer').showModal());
      await page.locator('#planList [data-preset-id="one-day-classic"]').click();
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const vh = window.innerHeight;
        const body = document.querySelector('.plan-drawer-body');
        return {
          vh,
          copyBottom: document.getElementById('copyPlanBtn').getBoundingClientRect().bottom,
          clearBottom: document.getElementById('clearPlanBtn').getBoundingClientRect().bottom,
          bodyH: body.clientHeight
        };
      });
      expect(r.copyBottom).toBeLessThanOrEqual(r.vh + 1);
      expect(r.clearBottom).toBeLessThanOrEqual(r.vh + 1);
      // list area must keep a usable height (landscape phones used to leave ~158px)
      expect(r.bodyH).toBeGreaterThanOrEqual(Math.min(200, r.vh * 0.45));
    });

    if (w < 992) {
      test('touch targets are at least 44px', async ({ page }) => {
        const small = await page.evaluate((sels) => {
          const bad = [];
          for (const sel of sels) {
            for (const el of document.querySelectorAll(sel)) {
              const cs = getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              const b = el.getBoundingClientRect();
              if (!b.width) continue;
              if (b.height < 43.5 || b.width < 43.5) bad.push(`${sel} ${Math.round(b.width)}x${Math.round(b.height)}`);
            }
          }
          return [...new Set(bad)];
        }, TOUCH_SELECTORS);
        expect(small).toEqual([]);
      });
    }

    if (w >= 992 && h >= 700) {
      test('desktop header and buttons are unchanged', async ({ page }) => {
        const d = await page.evaluate(() => {
          const r = (s) => document.querySelector(s).getBoundingClientRect();
          return {
            nav: getComputedStyle(document.querySelector('.site-nav')).display,
            menuBtn: getComputedStyle(document.querySelector('.mobile-menu-btn')).display,
            planH: Math.round(r('.plan-trigger-btn').height),
            heroBtnH: Math.round(r('.vigan-hero .btn-vigan-primary').height),
            chipH: Math.round(r('.explorer-chip').height),
            planText: document.querySelector('.plan-trigger-btn').innerText.trim()
          };
        });
        expect(d.nav).toBe('flex');
        expect(d.menuBtn).toBe('none');
        expect(d.planH).toBe(37);
        expect(d.heroBtnH).toBe(42);
        expect(d.chipH).toBe(38);
        expect(d.planText).toBe('My Vigan Plan (0)');
      });
    }
  });
}
