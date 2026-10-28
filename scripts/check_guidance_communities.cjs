// Requires Playwright; BASE_URL and CHROMIUM_PATH may override the local defaults.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4000';
const llm = '/blog/2026/10/guidance-in-looped-models/';
const diffusion = llm + 'diffusion/';

async function settle(page) {
  await page.waitForFunction(() => window.MathJax?.startup?.document);
  await page.evaluate(async () => {
    await MathJax.startup.promise;
    await document.fonts.ready;
  });
}

async function select(page, label, path) {
  await page.getByRole('link', { name: label, exact: true }).click();
  await page.waitForURL(base + path);
  await page.waitForFunction(expected =>
    document.querySelector('.community-switch [aria-current]').textContent === expected, label);
}

async function checkToy(page) {
  assert.equal(await page.locator('#guidance-toy input[type="range"]').count(), 3);
  for (const test of [
    { p: 0.1, w: 1, d: 0.4, local: '10.0%', joint: '15.4%', gap: '5.4' },
    { p: 0.1, w: 2.5, d: 0.4, local: '10.0%', joint: '30.3%', gap: '20.3' },
    { p: 0.3, w: 2.5, d: 0.4, local: '30.0%', joint: '62.7%', gap: '32.7' },
    { p: 0.5, w: 1, d: 0.4, local: '50.0%', joint: '62.1%', gap: '12.1' },
    { p: 0.9, w: 0, d: 0.4, local: '90.0%', joint: '90.0%', gap: 'No' },
    { p: 0.1, w: 3, d: 0, local: '10.0%', joint: '10.0%', gap: 'No' },
  ]) {
    await page.locator('#guidance-toy').evaluate((toy, { p, w, d }) => {
      for (const [id, value] of [['toy-initial-b', p], ['toy-strength', w], ['toy-difference', d]]) {
        const input = toy.querySelector('#' + id);
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, test);
    assert.equal(await page.locator('#initial-b-value').innerText(), (100 * test.p).toFixed(0) + '%');
    assert.equal(await page.locator('#local-b-value').innerText(), test.local);
    assert.equal(await page.locator('#joint-b-value').innerText(), test.joint);
    assert.equal(await page.locator('#toy-gap-value').innerText(), test.gap);
    assert.ok(Math.abs(await page.locator('#local-b-bar').evaluate(el => parseFloat(el.style.width)) - 100 * test.p) < 1e-10);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator('mjx-merror').count(), 0);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--no-sandbox'],
  });
  const errors = [];
  try {
    // Keep the matching-body regression independent of edits to either version.
    const fixturePage = await browser.newPage();
    const diffusionHTML = await (await fixturePage.request.get(base + diffusion)).text();
    const llmHTML = await (await fixturePage.request.get(base + llm)).text();
    const matchingHTML = await fixturePage.evaluate(({ diffusionHTML, llmHTML }) => {
      const parser = new DOMParser();
      const source = parser.parseFromString(diffusionHTML, 'text/html');
      const target = parser.parseFromString(llmHTML, 'text/html');
      target.querySelector('article.essay').innerHTML = source.querySelector('article.essay').innerHTML;
      return '<!doctype html>' + target.documentElement.outerHTML;
    }, { diffusionHTML, llmHTML });
    await fixturePage.close();
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**' + llm, route => route.fulfill({ contentType: 'text/html', body: matchingHTML }));
      await page.goto(base + diffusion);
      await settle(page);
      assert.equal(await page.getByRole('group', { name: 'Written for:', exact: true }).count(), 1);
      await page.evaluate(() => {
        window.savedMath = document.querySelector('#loop-architecture mjx-container');
        document.querySelector('#proof-taylor').open = true;
        const slider = document.querySelector('#toy-strength');
        slider.value = '2';
        slider.dispatchEvent(new Event('input'));
        const initial = document.querySelector('#toy-initial-b');
        initial.value = '0.1';
        initial.dispatchEvent(new Event('input'));
        window.scrollTo({ top: 600, behavior: 'instant' });
      });
      await page.getByRole('link', { name: 'LLM readers', exact: true }).dispatchEvent('click');
      await page.waitForURL(base + llm);
      const state = await page.evaluate(() => ({
        sameMath: window.savedMath === document.querySelector('#loop-architecture mjx-container'),
        scroll: window.scrollY,
        slider: document.querySelector('#toy-strength').value,
        initialB: document.querySelector('#toy-initial-b').value,
        localB: document.querySelector('#local-b-value').textContent,
        proofOpen: document.querySelector('#proof-taylor').open,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.deepEqual(state, { sameMath: true, scroll: 600, slider: '2', initialB: '0.1', localB: '10.0%', proofOpen: true, overflow: false });
      await select(page, 'Diffusion readers', diffusion);
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.community-switch').dataset.community === 'llm');
      assert.equal(page.url(), base + llm);
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('.community-switch').dataset.community === 'diffusion');
      await page.evaluate(() => { location.hash = 'loops'; });
      await page.waitForFunction(() => [...document.querySelectorAll('.community-switch a')].every(link => link.hash === '#loops'));
      await select(page, 'LLM readers', llm + '#loops');
      await page.reload();
      await settle(page);
      assert.equal(await page.locator('.community-switch [aria-current]').innerText(), 'LLM readers');
      assert.equal(await page.locator('mjx-merror').count(), 0);
      await page.close();
    }

    // Exercise independently edited content, not just the identical starting copy.
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ reducedMotion });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**' + llm, async route => {
        const response = await route.fetch();
        const html = (await response.text()).replace('<p class="opening">',
          '<p id="llm-fixture">LLM variant: \\(a^2+b^2=c^2\\)</p><p class="opening">');
        await route.fulfill({ response, body: html });
      });
      await page.goto(base + diffusion);
      await settle(page);
      await page.evaluate(() => { window.pageMarker = true; });
      await select(page, 'LLM readers', llm);
      assert.equal(await page.evaluate(() => window.pageMarker), true);
      assert.equal(await page.locator('#llm-fixture mjx-container').count(), 1);
      assert.equal(await page.locator('mjx-merror').count(), 0);
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, llm);
      await page.locator('#toy-strength').fill('0');
      assert.equal(await page.locator('#joint-b-value').innerText(), '50.0%');
      await checkToy(page);
      await select(page, 'Diffusion readers', diffusion);
      assert.equal(await page.locator('#llm-fixture').count(), 0);
      assert.equal(await page.locator('mjx-merror').count(), 0);
      await checkToy(page);
      await page.evaluate(() => {
        const links = document.querySelectorAll('.community-switch a');
        links[0].click(); links[1].click(); links[0].click();
      });
      await page.waitForURL(base + llm);
      await page.waitForFunction(() => !!document.querySelector('#llm-fixture mjx-container'));
      assert.equal(await page.locator('mjx-merror').count(), 0);
      await page.close();
    }

    for (const path of [llm, diffusion]) {
      for (const width of [1440, 768, 600, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + path);
        await settle(page);
        await checkToy(page);
        await page.close();
      }
    }

    const plain = await browser.newPage({ javaScriptEnabled: false });
    await plain.goto(base + diffusion);
    assert.equal(await plain.locator('#local-b-value').innerText(), '50.0%');
    assert.equal(await plain.locator('#joint-b-value').innerText(), '62.1%');
    await select(plain, 'LLM readers', llm);
    assert.equal(await plain.locator('#local-b-value').innerText(), '50.0%');
    assert.equal(await plain.locator('#joint-b-value').innerText(), '62.1%');
    await plain.close();

    const fallback = await browser.newPage();
    await fallback.route('**' + llm, route =>
      route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
    await fallback.goto(base + diffusion);
    await settle(fallback);
    await fallback.evaluate(() => { window.pageMarker = true; });
    await select(fallback, 'LLM readers', llm);
    assert.equal(await fallback.evaluate(() => window.pageMarker), undefined);
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/mobile, three-slider toy in both versions, no reload or retypesetting for matching bodies, scroll/widgets, history, anchors, independent content, rapid switching, reduced motion, no-JS and network fallback.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
