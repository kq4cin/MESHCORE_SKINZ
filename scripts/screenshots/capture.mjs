// Regenerates docs/screenshots/*.png using a mock radio. Run with `npm run screenshots`.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const out = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
await mkdir(out, { recursive: true });

const server = await createServer({ configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)), server: { port: 5199, strictPort: true }, logLevel: 'warn' });
await server.listen();
const url = 'http://localhost:5199/';

const min = 60_000;
const seed = (onboarded) => {
  const t = Date.now();
  const sam = 'c3'.repeat(32);
  return {
    'mcc.settings.v1': { onboarded, zip: '30301', weatherChannel: '#weather', weatherTemplate: '{zip}', manualAdd: true },
    'mcc.messages.v1': {
      'ch:Public': [
        { id: 'p1', convo: 'ch:Public', from: 'Sam (Mobile)', text: 'Good morning mesh! Anyone copy?', ts: t - 12 * min, outgoing: false, hops: 1 },
        { id: 'p2', convo: 'ch:Public', from: 'Liberty Base', text: 'Loud and clear from Liberty Base 🦅', ts: t - 11 * min, outgoing: true, status: 'sent' },
        { id: 'p3', convo: 'ch:Public', from: 'Eagle Ridge RPT', text: 'Repeater back online after maintenance.', ts: t - 5 * min, outgoing: false, hops: 1 },
      ],
      'ch:#weather': [
        { id: 'w1', convo: 'ch:#weather', from: 'WX-Bot', text: '30301 52°F Light rain. Hi 58 Lo 47.', ts: t - 26 * 60 * min, outgoing: false, hops: 1 },
        { id: 'w2', convo: 'ch:#weather', from: 'Liberty Base', text: '30301', ts: t - 2 * min, outgoing: true, status: 'sent' },
        { id: 'w3', convo: 'ch:#weather', from: 'WX-Bot', text: '30301 59°F Partly Cloudy. Hi 65 Lo 50. Wind SW 8mph. Humidity 54%.', ts: t - min, outgoing: false, hops: 1 },
      ],
      [`dm:${sam}`]: [
        { id: 'd1', convo: `dm:${sam}`, from: 'Sam (Mobile)', text: 'Heading up to the ridge, will check the repeater.', ts: t - 30 * min, outgoing: false, hops: 2 },
      ],
    },
    'mcc.read.v1': { 'ch:Public': t, 'ch:#weather': t },
  };
};

const browser = await chromium.launch();
async function open({ width, height, mobile = true, onboarded = true, connect = true, fresh = false }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
  await context.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await context.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v));
  }, fresh ? { 'mcc.settings.v1': { onboarded: true, zip: '30301', weatherChannel: '#weather', weatherTemplate: '{zip}', manualAdd: true } } : seed(onboarded));
  const page = await context.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  if (connect) {
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.getByRole('button', { name: 'Connection: Online' }).waitFor();
  }
  return page;
}
const tab = (page, name) => page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name, exact: true }).click();
const shot = async (page, name) => {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}${name}.png` });
  console.log(`✓ ${name}.png`);
};

const phone = { width: 390, height: 844 };
try {
  let page = await open({ ...phone, onboarded: false, connect: false });
  await page.getByRole('button', { name: 'Get started' }).click();
  await shot(page, 'onboarding-location');
  await page.context().close();

  page = await open({ ...phone, connect: false, fresh: true });
  await shot(page, 'connect');
  await page.context().close();

  page = await open(phone);
  await page.getByRole('list').getByText('Public', { exact: true }).click();
  await shot(page, 'thread');
  await tab(page, 'Weather');
  await shot(page, 'weather');
  await tab(page, 'Contacts');
  await shot(page, 'contacts');
  await tab(page, 'Settings');
  await shot(page, 'settings');
  await page.context().close();

  page = await open({ width: 1280, height: 800, mobile: false });
  await page.getByRole('list').getByText('Public', { exact: true }).click();
  await shot(page, 'desktop');
  await page.context().close();
} finally {
  await browser.close();
  await server.close();
}
