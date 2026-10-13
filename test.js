'use strict';
// Run with: node test.js
const assert = require('assert');
const { midParental, heightPercentile, projectFromPercentile } = require('./index.js');

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: got ${actual}, expected ${expected} +/- ${tol}`);

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

test('mid-parental: father 175, mother 162, boy -> 175 cm (range 166.5-183.5)', () => {
  assert.deepStrictEqual(midParental(175, 162, 'male'), { estimate: 175, low: 166.5, high: 183.5 });
});

test('mid-parental: father 175, mother 162, girl -> 162 cm', () => {
  assert.strictEqual(midParental(175, 162, 'female').estimate, 162);
});

// The CDC file lists smoothed percentiles next to L, M, S. Feeding those heights
// back in must return the same percentile, which checks the LMS math.
test('boy at the CDC median for 120.5 months -> 50th percentile, z = 0', () => {
  const r = heightPercentile(120.5 / 12, 138.8234114, 'male');
  near(r.z, 0, 1e-6, 'z');
  near(r.percentile, 50, 1e-4, 'percentile');
});

test('boy at the CDC P97 height for 120.5 months -> 97th percentile', () => {
  near(heightPercentile(120.5 / 12, 151.5294179, 'male').percentile, 97, 0.05, 'percentile');
});

test('girl at the CDC P3 height for 150.5 months -> 3rd percentile', () => {
  near(heightPercentile(150.5 / 12, 141.0884738, 'female').percentile, 3, 0.05, 'percentile');
});

test('interpolation: 119.5-month row (not in the bundled subset) still lands near P50', () => {
  near(heightPercentile(119.5 / 12, 138.4142703, 'male').percentile, 50, 0.5, 'percentile');
});

test('boy on the median at 10 stays on it -> CDC median at 240 months (176.85 cm)', () => {
  const r = projectFromPercentile(120.5 / 12, 138.8234114, 'male');
  near(r.adultCm, 176.8492322, 1e-3, 'adultCm');
});

test('girl on P90 at 12.5 -> adult height near the CDC P90 at 20 (171.61 cm)', () => {
  const r = projectFromPercentile(150.5 / 12, 163.8238923, 'female');
  near(r.adultCm, 171.6128653, 0.2, 'adultCm');
});

test('taller child at the same age projects taller', () => {
  const a = projectFromPercentile(9, 130, 'male').adultCm;
  const b = projectFromPercentile(9, 136, 'male').adultCm;
  assert.ok(b > a, `${b} should be > ${a}`);
});

test('bad input throws', () => {
  assert.throws(() => midParental(175, 162, 'boy'), TypeError);
  assert.throws(() => midParental(-1, 162, 'male'), RangeError);
  assert.throws(() => heightPercentile(1, 80, 'male'), RangeError);   // under 2: CDC 2-20 chart does not apply
  assert.throws(() => heightPercentile(21, 180, 'male'), RangeError);
  assert.throws(() => projectFromPercentile(10, NaN, 'female'), RangeError);
});

console.log(`\n${passed} tests passed`);
