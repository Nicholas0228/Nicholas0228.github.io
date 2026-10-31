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
  assert.equal(await page.locator('#toy-after-b-probabilities, #after-b-one-value, #after-b-two-value').count(), 0);
  assert.equal(await page.locator('#two-token-tree .token-tree-legend, #two-token-tree .token-tree-reference').count(), 0);
  assert.equal(await page.locator('.token-tree-prob-b1 output, .token-tree-prob-b2 output').count(), 0);
  assert.equal(await page.locator('#two-token-tree figcaption').evaluate(el =>
    el.getBoundingClientRect().height <= parseFloat(getComputedStyle(el).lineHeight) + 1), true);
  assert.equal(await page.locator('#guidance-toy .toy-marginals').evaluate(el =>
    el.scrollWidth <= el.clientWidth + 1), true);
  assert.deepEqual(await page.locator('#two-token-tree [data-sequence]').evaluateAll(nodes =>
    nodes.map(node => node.dataset.sequence)), ['A1', 'A2', 'B1', 'B2']);
  assert.equal(await page.locator('#two-token-tree').evaluate(tree =>
    tree.nextElementSibling?.id === 'toy-setup'), true);
  assert.equal(await page.locator('.token-tree-diagram').evaluate(tree =>
    [...tree.querySelectorAll('[data-sequence], .token-tree-probability')].every(node => {
      const bounds = node.getBoundingClientRect();
      const parent = tree.getBoundingClientRect();
      return bounds.left >= parent.left && bounds.right <= parent.right && bounds.top >= parent.top && bounds.bottom <= parent.bottom;
    })), true);
  assert.equal(await page.locator('.token-tree-probability').evaluateAll(nodes =>
    nodes.every((node, i) => nodes.slice(i + 1).every(other => {
      const a = node.getBoundingClientRect(), b = other.getBoundingClientRect();
      return a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
    }))), true);
  assert.equal(await page.locator('#guidance-toy input[type="range"]').count(), 3);
  for (const test of [
    { p: 0.3, w: 3, d: 0.4, local: '30.0%', joint: '69.2%', gap: '39.2' },
    { p: 0.5, w: 1, d: 0.2, local: '50.0%', joint: '53.7%', gap: '3.7' },
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
    assert.equal(await page.locator('#difference-value').innerText(), test.d.toFixed(2));
    assert.equal(await page.locator('#tree-a-value').innerText(), (100 * (1 - test.p)).toFixed(0) + '%');
    assert.equal(await page.locator('#tree-b-value').innerText(), (100 * test.p).toFixed(0) + '%');
    assert.equal(await page.locator('#local-b-value').innerText(), test.local);
    assert.equal(await page.locator('#joint-b-value').innerText(), test.joint);
    assert.equal(await page.locator('#toy-gap-value').innerText(), test.gap);
    assert.ok(Math.abs(await page.locator('#local-b-bar').evaluate(el => parseFloat(el.style.width)) - 100 * test.p) < 1e-10);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator('mjx-merror').count(), 0);
}

async function checkReferencesAndFigure(page) {
  const result = await page.evaluate(() => {
    const references = [...document.querySelectorAll('.references > li')];
    const citations = [...document.querySelectorAll('a[href^="#ref-"]')];
    const body = getComputedStyle(document.body);
    const caption = getComputedStyle(document.querySelector('#readout-comparison figcaption'));
    const img = document.querySelector('#readout-comparison img');
    return {
      references: references.map(item => item.id),
      firstUse: [...new Set(citations.map(link => link.hash.slice(1)))],
      correctNumbers: citations.every(link => {
        const number = references.findIndex(item => item.id === link.hash.slice(1)) + 1;
        return number > 0 && link.textContent === String(number) &&
          link.getAttribute('aria-label').startsWith(`Reference ${number}:`);
      }),
      citationPlacementIssues: [...document.querySelectorAll('sup.citation')].flatMap(citation => {
        let previous = citation.previousSibling;
        while (previous && (!previous.textContent.trim() ||
          (previous.nodeType === Node.ELEMENT_NODE && previous.matches('sup.citation')))) {
          previous = previous.previousSibling;
        }
        return /[.,;:!?]$/.test(previous?.textContent.trimEnd() || '') ? [] :
          [citation.id || citation.querySelector('a')?.id];
      }),
      correctBacklinks: references.every((item, index) =>
        [...item.querySelectorAll('a[role="doc-backlink"]')].every(link =>
          document.getElementById(link.hash.slice(1)) &&
          link.getAttribute('aria-label').endsWith(`of reference ${index + 1}`))),
      uniqueIds: document.querySelectorAll('[id]').length ===
        new Set([...document.querySelectorAll('[id]')].map(el => el.id)).size,
      captionMatchesBody: caption.fontFamily === body.fontFamily && caption.fontSize === body.fontSize,
      imageLoaded: img.complete && img.naturalWidth > 0,
      correctImageVariant: img.currentSrc.endsWith(innerWidth <= 600 ? '/logit-gaps-mobile.svg' : '/logit-gaps.svg'),
      desktopContentsFit: innerWidth < 820 || document.querySelector('.contents').scrollWidth <= document.querySelector('.contents').clientWidth,
      finalSection: [...document.querySelectorAll('.essay h2')].at(-1).id,
      nextLink: document.querySelector('.contents a[href="#whats-next"]')?.textContent.trim(),
    };
  });
  assert.deepEqual(result.firstUse, result.references);
  assert.deepEqual(result.citationPlacementIssues, [], 'Citations must follow punctuation');
  assert.equal(result.references[0], page.url().includes('/diffusion/') ? 'ref-cfg' : 'ref-cot');
  for (const key of ['correctNumbers', 'correctBacklinks', 'uniqueIds', 'captionMatchesBody', 'imageLoaded', 'correctImageVariant', 'desktopContentsFit']) {
    assert.equal(result[key], true, key);
  }
  assert.equal(result.finalSection, 'whats-next');
  assert.equal(result.nextLink, "06 What's next?");
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
      await page.getByRole('link', { name: 'LLM community', exact: true }).dispatchEvent('click');
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
      await select(page, 'Diffusion community', diffusion);
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.community-switch').dataset.community === 'llm');
      assert.equal(page.url(), base + llm);
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('.community-switch').dataset.community === 'diffusion');
      await page.evaluate(() => { location.hash = 'loops'; });
      await page.waitForFunction(() => [...document.querySelectorAll('.community-switch a')].every(link => link.hash === '#loops'));
      await select(page, 'LLM community', llm + '#loops');
      await page.reload();
      await settle(page);
      assert.equal(await page.locator('.community-switch [aria-current]').innerText(), 'LLM community');
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
      await select(page, 'LLM community', llm);
      assert.equal(await page.evaluate(() => window.pageMarker), true);
      assert.equal(await page.locator('#llm-fixture mjx-container').count(), 1);
      assert.equal(await page.locator('mjx-merror').count(), 0);
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, llm);
      await page.locator('#toy-strength').fill('0');
      assert.equal(await page.locator('#joint-b-value').innerText(), '30.0%');
      await checkToy(page);
      await select(page, 'Diffusion community', diffusion);
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
        assert.deepEqual(await page.locator('#guidance-toy input[type="range"]').evaluateAll(inputs =>
          inputs.map(input => input.value)), ['0.3', '3', '0.4']);
        assert.equal(await page.locator('#local-b-value').innerText(), '30.0%');
        assert.equal(await page.locator('#joint-b-value').innerText(), '69.2%');
        await checkToy(page);
        await checkReferencesAndFigure(page);
        await page.close();
      }
    }

    const plain = await browser.newPage({ javaScriptEnabled: false });
    await plain.goto(base + diffusion);
    assert.equal(await plain.locator('#local-b-value').innerText(), '30.0%');
    assert.equal(await plain.locator('#joint-b-value').innerText(), '69.2%');
    await select(plain, 'LLM community', llm);
    assert.equal(await plain.locator('#local-b-value').innerText(), '30.0%');
    assert.equal(await plain.locator('#joint-b-value').innerText(), '69.2%');
    await plain.close();

    const fallback = await browser.newPage();
    await fallback.route('**' + llm, route =>
      route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
    await fallback.goto(base + diffusion);
    await settle(fallback);
    await fallback.evaluate(() => { window.pageMarker = true; });
    await select(fallback, 'LLM community', llm);
    assert.equal(await fallback.evaluate(() => window.pageMarker), undefined);
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/mobile, ordered citations and backlinks, figure typography, closing section, three-slider toy in both versions, no reload or retypesetting for matching bodies, scroll/widgets, history, anchors, independent content, rapid switching, reduced motion, no-JS and network fallback.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
