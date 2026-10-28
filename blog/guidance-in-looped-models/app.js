(function () {
  'use strict';

  // Exact enumeration of the four possible answers in the article's toy model.
  function compute(strength, difference, initialB = 0.5) {
    if (!Number.isFinite(strength) || strength < 0 || !Number.isFinite(difference) || difference < 0 || difference >= 0.5) {
      throw new RangeError('Use nonnegative guidance and a probability difference in [0, 0.5).');
    }
    if (!Number.isFinite(initialB) || initialB <= 0 || initialB >= 1) {
      throw new RangeError('Use an initial probability of B strictly between 0 and 1.');
    }
    const a = (1 - initialB) / 2;
    const strong = [a, a, initialB * (0.5 + difference), initialB * (0.5 - difference)];
    const reference = [a, a, initialB / 2, initialB / 2];
    const scores = strong.map((p, i) => Math.pow(p, 1 + strength) / Math.pow(reference[i], strength));
    const z = scores.reduce((a, b) => a + b, 0);
    const joint = scores.map(p => p / z);
    const local = [a, a, initialB * scores[2] / (scores[2] + scores[3]), initialB * scores[3] / (scores[2] + scores[3])];
    const cB = Math.pow(0.5 + difference, 1 + strength) / Math.pow(0.5, strength)
      + Math.pow(0.5 - difference, 1 + strength) / Math.pow(0.5, strength);
    const tv = 0.5 * local.reduce((s, p, i) => s + Math.abs(p - joint[i]), 0);
    return { strong, reference, local, joint, cB, z, tv, localB: local[2] + local[3], jointB: joint[2] + joint[3] };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { compute };
  if (typeof document === 'undefined') return;

  function initToy(root) {
    const toy = root.querySelector('#guidance-toy');
    if (!toy) return;
    const initialB = toy.querySelector('#toy-initial-b');
    const strength = toy.querySelector('#toy-strength');
    const difference = toy.querySelector('#toy-difference');
    const tree = root.querySelector('#two-token-tree');
    function update() {
      const p = Number(initialB.value), w = Number(strength.value), d = Number(difference.value);
      const result = compute(w, d, p);
      toy.querySelector('#initial-b-value').textContent = (100 * p).toFixed(0) + '%';
      toy.querySelector('#strength-value').textContent = w.toFixed(2);
      toy.querySelector('#difference-value').textContent = d.toFixed(2);
      if (tree) {
        tree.querySelector('#tree-a-value').textContent = (100 * (1 - p)).toFixed(0) + '%';
        tree.querySelector('#tree-b-value').textContent = (100 * p).toFixed(0) + '%';
        tree.querySelector('.token-tree-diagram').setAttribute('aria-label',
          `The stronger predictor starts with A: ${(100 * (1 - p)).toFixed(0)}%, B: ${(100 * p).toFixed(0)}%. ` +
          `After A, it assigns 50% to each next token. After B, it assigns ` +
          `${(100 * (0.5 + d)).toFixed(0)}% to 1 and ${(100 * (0.5 - d)).toFixed(0)}% to 2. ` +
          'These are probabilities before guidance. The complete sequences are A1, A2, B1, and B2.');
      }
      toy.querySelector('#local-b-value').textContent = (100 * result.localB).toFixed(1) + '%';
      toy.querySelector('#local-b-bar').style.width = (100 * result.localB) + '%';
      toy.querySelector('#joint-b-value').textContent = (100 * result.jointB).toFixed(1) + '%';
      toy.querySelector('#joint-b-bar').style.width = (100 * result.jointB) + '%';
      const agree = w === 0 || d === 0;
      const gap = 100 * Math.abs(result.jointB - result.localB);
      toy.querySelector('#toy-gap-value').textContent = agree ? 'No' : (gap < 0.05 ? '<0.1' : gap.toFixed(1));
      toy.querySelector('#toy-gap-label').textContent = agree ? 'gap.' : 'percentage-point gap.';
      toy.querySelector('#toy-gap-explanation').textContent = agree
        ? 'The two distributions agree.'
        : 'Under this guidance setting, token-level and sequence-level guidance differ even in their first-token probabilities.';
      toy.classList.toggle('toy-agree', agree);
    }
    for (const slider of [initialB, strength, difference]) slider.addEventListener('input', update);
    update();
  }

  function initCommunitySwitch() {
    const switcher = document.querySelector('.community-switch');
    const article = document.querySelector('article.essay');
    if (!switcher || !article) return;
    const links = [...switcher.querySelectorAll('a')];
    const pageKey = url => url.origin + url.pathname + url.search;
    const paths = new Set(links.map(link => new URL(link.href).pathname));
    const metaSelector = 'link[rel="canonical"],meta[name="description"],meta[name="author"],meta[property^="og:"],meta[name^="twitter:"]';
    function readPage(doc) {
      const essay = doc.querySelector('article.essay');
      const community = doc.querySelector('.community-switch')?.dataset.community;
      if (!essay || !community) throw new Error('Missing community article');
      return { markup: essay.innerHTML, community, title: doc.title,
        meta: [...doc.head.querySelectorAll(metaSelector)].map(node => node.cloneNode(true)) };
    }
    // Capture source before MathJax runs, so identical versions keep their live DOM.
    let current = readPage(document);
    const cache = new Map([[pageKey(new URL(window.location.href)), Promise.resolve(current)]]);
    let request = 0;
    let renderQueue = new Promise(resolve => {
      const ready = () => resolve(window.MathJax?.startup?.promise);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
      else ready();
    });
    function loadPage(url) {
      const key = pageKey(url);
      if (!cache.has(key)) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 8000);
        const pending = fetch(key, { signal: controller.signal }).then(async response => {
          if (!response.ok) throw new Error('Article request failed');
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          const selected = doc.querySelector('.community-switch [aria-current="page"]');
          if (!selected || new URL(selected.getAttribute('href'), url).pathname !== url.pathname) {
            throw new Error('Unexpected community page');
          }
          return readPage(doc);
        }).catch(error => { cache.delete(key); throw error; }).finally(() => window.clearTimeout(timer));
        cache.set(key, pending);
      }
      return cache.get(key);
    }
    function syncLinks() {
      links.forEach(link => {
        link.hash = window.location.hash;
        if (new URL(link.href).pathname === window.location.pathname) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      switcher.dataset.community = current.community;
    }
    function navigate(url, push) {
      const token = ++request;
      const position = { top: window.scrollY, left: window.scrollX, behavior: 'instant' };
      const pending = loadPage(url);
      pending.catch(() => {});
      const task = renderQueue.then(async () => {
        const page = await pending;
        if (token !== request) return;
        const changed = current.markup !== page.markup;
        async function apply() {
          if (changed) {
            window.MathJax?.typesetClear?.([article]);
            window.MathJax?.texReset?.();
            article.innerHTML = page.markup;
            initToy(article);
            await window.MathJax?.typesetPromise?.([article]);
          }
          current = page;
          document.title = page.title;
          document.head.querySelectorAll(metaSelector).forEach(node => node.remove());
          page.meta.forEach(node => document.head.append(node.cloneNode(true)));
          if (push && url.href !== window.location.href) window.history.pushState(null, '', url);
          syncLinks();
          if (push) window.scrollTo(position);
        }
        if (changed && document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          await document.startViewTransition(apply).finished;
        } else await apply();
      });
      renderQueue = task.catch(() => {});
      task.catch(() => { if (token === request) window.location.assign(url.href); });
    }
    links.forEach(link => {
      const prefetch = () => { loadPage(new URL(link.href)).catch(() => {}); };
      link.addEventListener('pointerenter', prefetch);
      link.addEventListener('focus', prefetch);
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(new URL(link.href), true);
      });
      prefetch();
    });
    window.addEventListener('popstate', () => {
      const url = new URL(window.location.href);
      if (paths.has(url.pathname)) navigate(url, false);
    });
    window.addEventListener('hashchange', syncLinks);
    syncLinks();
  }

  initCommunitySwitch();
  initToy(document);
})();
