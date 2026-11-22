import { test, expect } from '@playwright/test';

test.describe('Vigan City Editorial Explorer E2E', () => {
  test('loads cleanly with zero console/page errors, all images rendered, and zero horizontal overflow', async ({
    page
  }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Wait for modules and images to settle
    await expect(page.locator('#marqueeTrack .place-slide')).toHaveCount(22);
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);
    await expect(page.locator('#archiveGrid [data-gallery-index]')).toHaveCount(6);

    // Confirm all visible images loaded with naturalWidth > 0
    const brokenImages = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img')).filter(
        (img) => img.getAttribute('src') && !img.closest('dialog:not([open])')
      );
      await Promise.all(
        imgs.map((img) => {
          img.loading = 'eager';
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          });
        })
      );
      return imgs.filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute('src'));
    });

    expect(brokenImages).toEqual([]);

    // No horizontal overflow and zero whitespace gap below footer at desktop
    const desktopLayout = await page.evaluate(() => {
      const footer = document.getElementById('siteFooter');
      const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        gapBelowFooter: Math.round(document.documentElement.scrollHeight - footerBottom)
      };
    });
    expect(desktopLayout.horizontalOverflow).toBe(false);
    expect(desktopLayout.gapBelowFooter).toBeLessThanOrEqual(1);

    // No horizontal overflow and zero whitespace gap below footer at mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileLayout = await page.evaluate(() => {
      const footer = document.getElementById('siteFooter');
      const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        gapBelowFooter: Math.round(document.documentElement.scrollHeight - footerBottom)
      };
    });
    expect(mobileLayout.horizontalOverflow).toBe(false);
    expect(mobileLayout.gapBelowFooter).toBeLessThanOrEqual(1);

    expect(errors).toEqual([]);
  });

  test('toggles Light and Dark themes and persists preference across reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const themeBtn = page.locator('header [data-theme-toggle]');
    const initialTheme = await page.evaluate(() => document.documentElement.dataset.bsTheme);
    const expectedNext = initialTheme === 'dark' ? 'light' : 'dark';

    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', expectedNext);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', expectedNext);
  });

  test('auto-sliding hero marquee shows 11 places only, moves right-to-left, pauses on hover, and jumps to clicked landmark', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // No play/pause toggle button in hero
    await expect(page.locator('#marqueeToggle')).toHaveCount(0);

    const track = page.locator('#marqueeTrack');
    const animName = await track.evaluate((el) => getComputedStyle(el).animationName);
    expect(animName).toContain('viganPlacesSlide');

    // Prove the place cards visibly move from right to left (x strictly decreases)
    const bantayBtn = page.locator(
      '#marqueeTrack .marquee-group:first-child [data-place-id="bantay-bell-tower"]'
    );
    const boxBefore = await bantayBtn.boundingBox();
    await page.waitForTimeout(350);
    const boxAfter = await bantayBtn.boundingBox();
    expect(boxAfter.x).toBeLessThan(boxBefore.x);

    // Hovering over the marquee pauses the sliding animation
    await page.locator('#marqueeViewport').hover();
    const playStateOnHover = await track.evaluate((el) => getComputedStyle(el).animationPlayState);
    expect(playStateOnHover).toBe('paused');

    const pausedX1 = (await bantayBtn.boundingBox()).x;
    await page.waitForTimeout(250);
    const pausedX2 = (await bantayBtn.boundingBox()).x;
    expect(Math.abs(pausedX2 - pausedX1)).toBeLessThan(1);

    // Clicking Bantay Bell Tower while hovered selects it in Landmark Explorer
    await bantayBtn.click();
    await expect(page.locator('#explorerSpotlight .spotlight-title')).toHaveText('Bantay Bell Tower');

    // Also confirm cards continue sliding smoothly when OS sets prefers-reduced-motion: reduce
    // (common on Windows when system window-animation effects are disabled) and still pause on hover
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(10, 10);
    await page.evaluate(() => window.scrollTo(0, 0));
    const reducedX1 = (await bantayBtn.boundingBox()).x;
    await page.waitForTimeout(350);
    const reducedX2 = (await bantayBtn.boundingBox()).x;
    expect(reducedX2).toBeLessThan(reducedX1);

    await page.locator('#marqueeViewport').hover();
    const reducedHoverState = await track.evaluate((el) => getComputedStyle(el).animationPlayState);
    expect(reducedHoverState).toBe('paused');
  });

  test('supports Explorer filter/search, My Vigan Plan Drawer presets, Photo Lightbox keyboard nav, and native FAQ', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Filter to Ancestral Museums -> 3 places
    await page.locator('#explorerFilters [data-category="museum"]').click();
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(3);

    // Search zero results -> Reset filters
    await page.locator('#explorerSearch').fill('no-such-vigan-place');
    await expect(page.locator('#explorerList')).toContainText('No Vigan places match');
    await page.locator('#explorerList [data-reset-filters]').click();
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);

    // Open My Vigan Plan drawer -> load 1-Day preset -> verify drawer & footer fit completely inside viewport
    await page.locator('#planTriggerBtn').click();
    await expect(page.locator('#planDrawer')).toHaveAttribute('open', '');
    const drawerBox = await page.locator('#planDrawer').boundingBox();
    const copyBox = await page.locator('#copyPlanBtn').boundingBox();
    expect(drawerBox.y).toBe(0);
    expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(900);

    await page.locator('#planList [data-preset-id="one-day-classic"]').click();
    await expect(page.locator('#planTriggerBtn [data-plan-count]')).toHaveText('5');
    await page.locator('[data-close-drawer="planDrawer"]').click();
    await expect(page.locator('#planDrawer')).not.toHaveAttribute('open', '');

    // Verify mobile drawer bounds and mobile explorer horizontal strip keeps spotlight visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#mobileMenuBtn').click();
    await expect(page.locator('#mobileNavDrawer')).toHaveAttribute('open', '');
    await expect
      .poll(async () => Math.round((await page.locator('#mobileNavDrawer').boundingBox()).x))
      .toBe(0);
    const mobileDrawerBox = await page.locator('#mobileNavDrawer').boundingBox();
    expect(Math.round(mobileDrawerBox.y)).toBe(0);
    expect(mobileDrawerBox.width).toBeLessThanOrEqual(390);
    await page.locator('[data-close-drawer="mobileNavDrawer"]').first().click();
    await expect(page.locator('#mobileNavDrawer')).not.toHaveAttribute('open', '');

    await page.locator('#landmarks').scrollIntoViewIfNeeded();
    await page.locator('#explorerList [data-select-place="syquia-mansion"]').click();
    await expect(page.locator('#explorerSpotlight .spotlight-title')).toHaveText('Syquia Mansion Museum');
    const mobileOverflowAfter = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(mobileOverflowAfter).toBe(false);

    // Restore desktop viewport for lightbox & FAQ checks
    await page.setViewportSize({ width: 1440, height: 900 });

    // Open Photo Archive Lightbox -> arrow navigation -> close
    await page.locator('#archiveGrid [data-gallery-index="0"]').click();
    await expect(page.locator('#galleryLightbox')).toHaveAttribute('open', '');
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('1 of 6');
    await page.locator('[data-lightbox-next]').click();
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('2 of 6');
    await page.locator('[data-lightbox-close]').click();
    await expect(page.locator('#galleryLightbox')).not.toHaveAttribute('open', '');

    // Native <details> FAQ opens cleanly
    const secondFaq = page.locator('#visitFaqList details').nth(1);
    await secondFaq.locator('summary').click();
    await expect(secondFaq).toHaveAttribute('open', '');
  });
});
