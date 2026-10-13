'use strict';
// height-estimate: two textbook ways to estimate a child's adult height.
//   1. midParental()           – Tanner mid-parental (target) height from the parents' heights
//   2. projectFromPercentile() – keep the child's current CDC stature-for-age z-score and read it off at age 20
// Plus heightPercentile(), the CDC LMS lookup both of the above are built on.
// Estimates only, not medical advice. See README.md for sources and limits.

const DATA = require('./cdc-stature-lms.json');

const SEX_DIFF_CM = 13;   // average adult male-female height difference used by Tanner
const MPH_RANGE_CM = 8.5; // roughly +/- 2 SD around the target height
const ADULT_AGE_MONTHS = 240;

function checkSex(sex) {
  if (sex !== 'male' && sex !== 'female') throw new TypeError("sex must be 'male' or 'female'");
}
function checkCm(name, v) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new RangeError(name + ' must be a positive number in cm');
}

/**
 * Mid-parental (target) height, Tanner method.
 * boys: (father + mother + 13) / 2, girls: (father + mother - 13) / 2, range +/- 8.5 cm.
 */
function midParental(fatherCm, motherCm, sex) {
  checkCm('fatherCm', fatherCm);
  checkCm('motherCm', motherCm);
  checkSex(sex);
  const shift = sex === 'male' ? SEX_DIFF_CM : -SEX_DIFF_CM;
  const estimate = (fatherCm + motherCm + shift) / 2;
  return { estimate, low: estimate - MPH_RANGE_CM, high: estimate + MPH_RANGE_CM };
}

// Linear interpolation of L, M, S between the table rows around ageMonths.
function lmsAt(ageMonths, sex) {
  const rows = DATA[sex];
  const first = rows[0][0];
  const last = rows[rows.length - 1][0];
  if (!(ageMonths >= first && ageMonths <= last)) {
    throw new RangeError('age must be between 2 and 20 years (CDC 2-20 chart range)');
  }
  let i = 0;
  while (i < rows.length - 2 && rows[i + 1][0] < ageMonths) i++;
  const [a0, L0, M0, S0] = rows[i];
  const [a1, L1, M1, S1] = rows[i + 1];
  const t = (ageMonths - a0) / (a1 - a0);
  return { L: L0 + t * (L1 - L0), M: M0 + t * (M1 - M0), S: S0 + t * (S1 - S0) };
}

function zFromLms(x, { L, M, S }) {
  return L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
}
function xFromLms(z, { L, M, S }) {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

// Standard normal CDF (Abramowitz & Stegun 7.1.26, abs error < 1.5e-7).
function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * Where a height sits on the CDC 2000 stature-for-age chart.
 * Returns { z, percentile } with percentile in 0-100.
 */
function heightPercentile(ageYears, heightCm, sex) {
  checkSex(sex);
  checkCm('heightCm', heightCm);
  const z = zFromLms(heightCm, lmsAt(ageYears * 12, sex));
  return { z, percentile: normalCdf(z) * 100 };
}

/**
 * Adult height if the child stays on the same CDC percentile until age 20.
 * Returns { z, percentile, adultCm }.
 */
function projectFromPercentile(ageYears, heightCm, sex) {
  const { z, percentile } = heightPercentile(ageYears, heightCm, sex);
  const adultCm = xFromLms(z, lmsAt(ADULT_AGE_MONTHS, sex));
  return { z, percentile, adultCm };
}

module.exports = { midParental, heightPercentile, projectFromPercentile };
