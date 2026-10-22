(function () {
  'use strict';

  // Exact enumeration of the four possible answers in the article's toy model.
  function compute(strength, difference) {
    if (!Number.isFinite(strength) || strength < 0 || !Number.isFinite(difference) || difference < 0 || difference >= 0.5) {
      throw new RangeError('Use nonnegative guidance and a probability difference in [0, 0.5).');
    }
    const strong = [0.25, 0.25, 0.5 * (0.5 + difference), 0.5 * (0.5 - difference)];
    const reference = [0.25, 0.25, 0.25, 0.25];
    const scores = strong.map((p, i) => Math.pow(p, 1 + strength) / Math.pow(reference[i], strength));
    const z = scores.reduce((a, b) => a + b, 0);
    const joint = scores.map(p => p / z);
    const local = [0.25, 0.25, 0.5 * scores[2] / (scores[2] + scores[3]), 0.5 * scores[3] / (scores[2] + scores[3])];
    const cB = Math.pow(0.5 + difference, 1 + strength) / Math.pow(0.5, strength)
      + Math.pow(0.5 - difference, 1 + strength) / Math.pow(0.5, strength);
    const tv = 0.5 * local.reduce((s, p, i) => s + Math.abs(p - joint[i]), 0);
    return { strong, reference, local, joint, cB, z, tv, jointB: joint[2] + joint[3] };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { compute };
  if (typeof document === 'undefined') return;
  const toy = document.getElementById('guidance-toy');
  if (!toy) return;
  const strength = document.getElementById('toy-strength');
  const difference = document.getElementById('toy-difference');
  function update() {
    const w = Number(strength.value), d = Number(difference.value), result = compute(w, d);
    document.getElementById('strength-value').textContent = w.toFixed(2);
    document.getElementById('difference-value').textContent = d.toFixed(2);
    document.getElementById('strong-b1').textContent = (0.5 + d).toFixed(2);
    document.getElementById('strong-b2').textContent = (0.5 - d).toFixed(2);
    document.getElementById('joint-b-value').textContent = (100 * result.jointB).toFixed(1) + '%';
    document.getElementById('joint-b-bar').style.width = (100 * result.jointB) + '%';
    const agree = w === 0 || d === 0;
    const gap = 100 * (result.jointB - 0.5);
    document.getElementById('toy-gap-value').textContent = agree ? 'No' : (gap < 0.05 ? '<0.1' : gap.toFixed(1));
    document.getElementById('toy-gap-label').textContent = agree ? 'gap.' : 'percentage-point gap.';
    document.getElementById('toy-gap-explanation').textContent = agree
      ? 'The two distributions agree.'
      : 'Even the first-token probabilities differ.';
    toy.classList.toggle('toy-agree', agree);
    document.getElementById('cb-value').textContent = result.cB.toFixed(3);
    document.getElementById('tv-value').textContent = (100 * result.tv).toFixed(2) + '%';
    for (const name of ['strong', 'reference', 'local', 'joint']) {
      result[name].forEach((value, index) => {
        document.getElementById(`toy-${name}-${index}`).textContent = value > 0 && value < 0.0005 ? '<0.001' : value.toFixed(3);
      });
    }
  }
  strength.addEventListener('input', update);
  difference.addEventListener('input', update);
  update();
})();
