window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    tags: 'all',
    tagSide: 'right',
    tagIndent: '0em'
  },
  svg: { fontCache: 'global' }
};

document.addEventListener('DOMContentLoaded', () => {
  const tocLinks = [...document.querySelectorAll('.article-contents a')];
  const sections = tocLinks.map(link => document.querySelector(link.getAttribute('href')));
  const updateToc = () => {
    let active = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= 140) active = index;
    });
    tocLinks.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { updateToc(); pending = false; });
  }, { passive: true });
  updateToc();

  const slider = document.getElementById('guidance-weight');
  if (!slider) return;
  const renderToy = () => {
    const w = Number(slider.value);
    const rB = [0.9 * 1.8 ** w, 0.1 * 0.2 ** w];
    const cB = rB[0] + rB[1];
    const local = [0.25, 0.25, 0.5 * rB[0] / cB, 0.5 * rB[1] / cB];
    const target = [0.5, 0.5, rB[0], rB[1]].map(value => value / (1 + cB));
    document.getElementById('guidance-weight-value').value = w.toFixed(2);
    document.querySelectorAll('[data-local-probability]').forEach(cell => {
      cell.textContent = local[Number(cell.dataset.localProbability)].toFixed(3);
    });
    document.querySelectorAll('[data-target-probability]').forEach(cell => {
      cell.textContent = target[Number(cell.dataset.targetProbability)].toFixed(3);
    });
    const probabilityB = cB / (1 + cB);
    document.getElementById('global-b-bar').style.width = `${probabilityB * 100}%`;
    document.getElementById('global-b-value').textContent = `${(probabilityB * 100).toFixed(1)}%`;
    document.getElementById('normalizer-b').textContent = cB.toFixed(3);
  };
  slider.addEventListener('input', renderToy);
  renderToy();
});
