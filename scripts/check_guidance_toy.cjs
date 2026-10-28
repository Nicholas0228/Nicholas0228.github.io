const assert = require('node:assert/strict');
const { compute } = require('../blog/guidance-in-looped-models/app.js');

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
}

let cases = 0;
for (const p of [0.01, 0.1, 0.3, 0.5, 0.9, 0.99]) {
  for (const w of [0, 0.05, 1, 2.5, 3]) {
    for (const d of [0, 0.01, 0.2, 0.4]) {
      const result = compute(w, d, p);
      const cB = ((0.5 + d) ** (1 + w) + (0.5 - d) ** (1 + w)) / 0.5 ** w;
      for (const distribution of [result.strong, result.reference, result.local, result.joint]) {
        assert.ok(distribution.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
        close(distribution.reduce((sum, value) => sum + value, 0), 1);
      }
      close(result.strong[2] + result.strong[3], p);
      close(result.reference[2] + result.reference[3], p);
      close(result.localB, p);
      close(result.cB, cB);
      close(result.z, 1 - p + p * cB);
      close(result.jointB, p * cB / (1 - p + p * cB));
      close(result.tv, Math.abs(result.jointB - p));
      close(result.local[0], (1 - p) / 2);
      close(result.local[1], (1 - p) / 2);
      if (w === 0 || d === 0) result.local.forEach((value, i) => close(value, result.joint[i]));
      else assert.ok(result.jointB > result.localB);
      cases++;
    }
  }
}

assert.deepEqual(compute(1, 0.4), compute(1, 0.4, 0.5));
close(compute(1, 0.4).jointB, 0.6212121212121212);
close(compute(2.5, 0.4, 0.1).jointB, 0.3030826490785972);
for (const p of [0, 1, -0.1, 1.1, NaN, Infinity, null, '0.5']) {
  assert.throws(() => compute(1, 0.4, p), RangeError);
}
for (const [w, d] of [[-1, 0.4], [NaN, 0.4], [Infinity, 0.4], [1, -0.1], [1, 0.5], [1, NaN]]) {
  assert.throws(() => compute(w, d, 0.1), RangeError);
}
console.log(`PASS: ${cases} toy distributions, analytic marginals, default compatibility, equality cases and invalid inputs.`);
