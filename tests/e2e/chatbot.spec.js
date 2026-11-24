import { test, expect } from '@playwright/test';

function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

function getBotReplies(page) {
  return page.locator('#chatMessages .vigan-chat-msg-bot:not(.vigan-chat-typing)');
}

async function askQuestion(page, text) {
  const input = page.locator('#chatInput');
  await input.fill(text);
  await input.press('Enter');
}

async function getFullScreenViewport(page) {
  return page.evaluate(() => {
    const docClientWidth = document.documentElement.clientWidth;
    const bodyClientWidth = document.body.clientWidth;
    const docRectWidth = Math.round(document.documentElement.getBoundingClientRect().width);
    return {
      width: Math.min(docClientWidth, bodyClientWidth, docRectWidth),
      height: window.innerHeight
    };
  });
}

async function assertFullScreenPanel(page, chatPanel, expectedHeight, minWidth, maxWidth) {
  const viewport = await getFullScreenViewport(page);
  const box = await chatPanel.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.y)).toBe(0);
  expect(Math.round(box.width)).toBe(viewport.width);
  expect(Math.round(box.height)).toBe(viewport.height);
  expect(box.width).toBeGreaterThanOrEqual(minWidth);
  expect(box.width).toBeLessThanOrEqual(maxWidth);
  expect(Math.round(box.height)).toBe(expectedHeight);
}

test.describe('Ask Vigan Chatbot E2E', () => {
  test('desktop floating card answers Vigan questions, runs explorer/plan actions, and keeps layout clean', async ({
    page
  }) => {
    const errors = trackPageErrors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);

    const chatFab = page.locator('#chatFab');
    const chatPanel = page.locator('#chatPanel');
    const chatInput = page.locator('#chatInput');
    const botReplies = getBotReplies(page);

    // Verify FAB is 52x52 in bottom-right, panel is hidden, and page layout stays clean
    await expect(chatFab).toBeVisible();
    await expect(chatPanel).toBeHidden();

    const fabBox = await chatFab.boundingBox();
    expect(fabBox).not.toBeNull();
    expect(Math.round(fabBox.width)).toBe(52);
    expect(Math.round(fabBox.height)).toBe(52);
    expect(fabBox.x).toBeGreaterThan(1300);
    expect(fabBox.y).toBeGreaterThan(800);
    expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(1440);
    expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(900);

    const initialLayout = await page.evaluate(() => {
      const footer = document.getElementById('siteFooter');
      const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
      return {
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        gapBelowFooter: Math.round(document.documentElement.scrollHeight - footerBottom)
      };
    });
    expect(initialLayout.horizontalOverflow).toBe(false);
    expect(initialLayout.gapBelowFooter).toBeLessThanOrEqual(1);

    // Open floating card: width <= 360, top edge >= 70, welcome + 4 chips visible, input focused
    await chatFab.click();
    await expect(chatPanel).toBeVisible();

    const panelBox = await chatPanel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox.width).toBeLessThanOrEqual(360);
    expect(panelBox.y).toBeGreaterThanOrEqual(70);

    await expect(botReplies).toHaveCount(1);
    await expect(botReplies.first()).toContainText(
      "Hi! Ask me anything about Vigan's landmarks, food, crafts, or planning your visit."
    );

    const starterChips = page.locator('#chatSuggestions [data-chat-suggestion]');
    await expect(starterChips).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      await expect(starterChips.nth(i)).toBeVisible();
    }
    await expect(chatInput).toBeFocused();

    // Ask about Bantay Bell Tower (auto-waits past 320ms simulated typing delay)
    await askQuestion(page, 'Tell me about Bantay Bell Tower');
    await expect(botReplies).toHaveCount(2);
    const bantayReply = botReplies.nth(1);
    await expect(bantayReply).toContainText('1591');
    await expect(bantayReply).toContainText('4:30 PM to 5:45 PM');
    await expect(bantayReply).toContainText('Voluntary donation');

    // Add Bantay Bell Tower to My Vigan Plan from chat action
    const addBantayBtn = bantayReply.locator(
      '[data-chat-action="add-place"][data-action-id="bantay-bell-tower"]'
    );
    await addBantayBtn.click();
    await expect(page.locator('#planTriggerBtn [data-plan-count]')).toHaveText('1');
    await expect(addBantayBtn).toBeDisabled();
    await expect(addBantayBtn).toHaveText('Saved in plan');

    // View in explorer updates spotlight while keeping desktop floating card open
    const viewBantayBtn = bantayReply.locator(
      '[data-chat-action="view-place"][data-action-id="bantay-bell-tower"]'
    );
    await viewBantayBtn.click();
    await expect(page.locator('#explorerSpotlight .spotlight-title')).toHaveText(
      'Bantay Bell Tower'
    );
    await expect(chatPanel).toBeVisible();

    // Partial out-of-scope response (unsupported hotel phone detail + supported site context)
    await askQuestion(page, 'What is the phone number of a hotel?');
    await expect(botReplies).toHaveCount(3);
    const hotelReply = botReplies.nth(2);
    await expect(hotelReply).toContainText(
      "This information is outside the website's information."
    );
    await expect(hotelReply).toContainText('Here is what the site says about');

    // Pure out-of-scope response (no unrelated site fallback)
    await askQuestion(page, 'What is the capital of France?');
    await expect(botReplies).toHaveCount(4);
    const franceReply = botReplies.nth(3);
    await expect(franceReply).toContainText(
      "This information is outside the website's information."
    );
    await expect(franceReply).not.toContainText('Here is what the site says about');

    // Live DOM extraction check from footer developer card via extractPageContext()
    await askQuestion(page, "What is the developer's email?");
    await expect(botReplies).toHaveCount(5);
    const developerReply = botReplies.nth(4);
    await expect(developerReply).toContainText('John Eduard Madriaga');
    await expect(developerReply).toContainText('educode597@gmail.com');
    await expect(developerReply).not.toContainText(
      "This information is outside the website's information."
    );

    // Click "Plan 1 day" chip -> preset action warns replacement -> click loads 5 stops & opens drawer
    await page.locator('#chatSuggestions [data-chat-suggestion="Plan 1 day"]').click();
    await expect(botReplies).toHaveCount(6);
    const presetReply = botReplies.nth(5);
    const loadPresetBtn = presetReply.locator(
      '[data-chat-action="load-preset"][data-action-id="one-day-classic"]'
    );
    await expect(loadPresetBtn).toHaveText('Load this plan (replaces saved stops)');

    // While desktop chat panel is open, opening #planDrawer lets Escape close the drawer while keeping chat open
    const planDrawer = page.locator('#planDrawer');
    await page.locator('#planTriggerBtn').click();
    await expect(planDrawer).toHaveAttribute('open', '');
    await expect(chatPanel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(planDrawer).not.toHaveAttribute('open', '');
    await expect(chatPanel).toBeVisible();

    await loadPresetBtn.click();
    await expect(chatPanel).toBeHidden();
    await expect(planDrawer).toHaveAttribute('open', '');
    await expect(page.locator('#planTriggerBtn [data-plan-count]')).toHaveText('5');

    // Close #planDrawer, reopen chat panel, and verify #chatCloseBtn closes #chatPanel
    await page.keyboard.press('Escape');
    await expect(planDrawer).not.toHaveAttribute('open', '');
    await chatFab.click();
    await expect(chatPanel).toBeVisible();
    await page.locator('#chatCloseBtn').click();
    await expect(chatPanel).toBeHidden();

    expect(errors).toEqual([]);
  });

  test('mobile portrait (390x844) and landscape (844x390) open full-screen, close on View in explorer, and restore focus on Escape', async ({
    page
  }) => {
    const errors = trackPageErrors(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);

    const chatFab = page.locator('#chatFab');
    const chatPanel = page.locator('#chatPanel');
    const chatInput = page.locator('#chatInput');
    const botReplies = getBotReplies(page);

    // Portrait mobile: full-screen panel (x=0, y=0) and FAB hidden while open
    await chatFab.click();
    await expect(chatPanel).toBeVisible();
    await expect(chatFab).toBeHidden();

    await assertFullScreenPanel(page, chatPanel, 844, 370, 390);

    // Click Entrance fees chip, then ask about Syquia Mansion and View in explorer
    await page.locator('#chatSuggestions [data-chat-suggestion="Entrance fees"]').click();
    await expect(botReplies).toHaveCount(2);
    await expect(botReplies.nth(1)).toContainText('Entrance fees');

    await askQuestion(page, 'Syquia Mansion');
    await expect(botReplies).toHaveCount(3);
    const syquiaReply = botReplies.nth(2);
    await expect(syquiaReply).toContainText('Syquia Mansion Museum');

    await syquiaReply
      .locator('[data-chat-action="view-place"][data-action-id="syquia-mansion"]')
      .click();
    await expect(chatPanel).toBeHidden();
    await expect(page.locator('#explorerSpotlight .spotlight-title')).toHaveText(
      'Syquia Mansion Museum'
    );

    // Landscape mobile (844x390): full-screen panel, Escape closes and restores focus to FAB
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(chatFab).toBeVisible();
    await chatFab.click();
    await expect(chatPanel).toBeVisible();
    await expect(chatFab).toBeHidden();
    await expect(chatInput).toBeFocused();

    await assertFullScreenPanel(page, chatPanel, 390, 824, 844);

    await page.keyboard.press('Escape');
    await expect(chatPanel).toBeHidden();
    await expect(chatFab).toBeVisible();
    await expect(chatFab).toBeFocused();

    expect(errors).toEqual([]);
  });

  test('dark mode theme toggle styles chat panel cleanly without contrast or console issues', async ({
    page
  }) => {
    const errors = trackPageErrors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('#explorerList [data-place-row]')).toHaveCount(11);

    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
    await page.locator('header [data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');

    const chatFab = page.locator('#chatFab');
    const chatPanel = page.locator('#chatPanel');
    const chatMessages = page.locator('#chatMessages');
    const welcomeBubble = getBotReplies(page).first();

    await chatFab.click();
    await expect(chatPanel).toBeVisible();
    await expect(chatPanel).toHaveCSS('background-color', 'rgb(23, 28, 34)');
    await expect(chatPanel).toHaveCSS('color', 'rgb(241, 244, 248)');
    await expect(chatMessages).toHaveCSS('background-color', 'rgb(16, 19, 23)');
    await expect(welcomeBubble).toHaveCSS('background-color', 'rgb(23, 28, 34)');
    await expect(welcomeBubble).toHaveCSS('color', 'rgb(241, 244, 248)');

    expect(errors).toEqual([]);
  });
});
