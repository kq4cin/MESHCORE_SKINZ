import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('onboarding asks for ZIP and weather channel, then the bot answers on the Weather tab', async ({ page }) => {
  await page.goto('./?demo=1');

  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('ZIP code').fill('3030');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Enter a 5-digit US ZIP code.')).toBeVisible();
  await page.getByLabel('ZIP code').fill('30301');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Weather hashtag channel').fill('WX Atlanta');
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Online' })).toBeVisible();

  await page.getByRole('button', { name: 'Weather' }).click();
  await expect(page.getByText('#wxatlanta')).toBeVisible();
  await page.getByRole('button', { name: 'Get weather' }).click();
  await expect(page.locator('.hero-temp')).toHaveText(/°F/);
  await expect(page.locator('.hero-body')).toContainText('30301');

  // The bare ZIP is what was sent to the channel.
  await page.getByRole('button', { name: 'Messages' }).click();
  await page.getByRole('button', { name: /#wxatlanta/ }).click();
  await expect(page.locator('.bubble.out .bubble-text')).toHaveText('30301');

  // Settings persist across reloads.
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Weather' }).click();
  await expect(page.locator('.hero-temp')).toHaveText(/°F/);
});

test('channel and direct messaging work in demo mode', async ({ page }) => {
  await page.goto('./?demo=1');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await page.getByRole('button', { name: /Public/ }).click();
  await page.getByLabel('Message').fill('Hello mesh');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('.bubble.out').last()).toContainText('sent');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Network' }).click();
  await page.getByRole('button', { name: /Sam \(Mobile\)/ }).click();
  await page.getByLabel('Message').fill('Ping');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('.bubble.in').last()).toContainText('Copy that');
});

test('no horizontal overflow on small phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./?demo=1');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  for (const tab of ['Messages', 'Weather', 'Network', 'Settings']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, tab).toBeLessThanOrEqual(0);
  }
});
