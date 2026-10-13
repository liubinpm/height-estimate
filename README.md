# height-estimate

Two textbook ways to estimate a child's adult height, in plain JavaScript with no dependencies:

1. **Mid-parental height** (Tanner method), from the parents' heights.
2. **CDC percentile projection**: find the child's current percentile on the CDC 2000 stature-for-age chart and read the same percentile off at age 20.

This is a small, readable reference implementation. It gives estimates, not diagnoses, and it is not medical advice.

## Install

Copy `index.js` and `cdc-stature-lms.json` into your project, or clone the repo. Node 14+ or any modern browser bundler.

```bash
git clone https://github.com/liubinpm/height-estimate
cd height-estimate
node test.js
```

## Usage

```js
const { midParental, heightPercentile, projectFromPercentile } = require('./index.js');

midParental(175, 162, 'male');
// { estimate: 175, low: 166.5, high: 183.5 }

heightPercentile(10, 140, 'male');
// { z: 0.21, percentile: 58.3 }   (approx.)

projectFromPercentile(10, 140, 'male');
// { z: 0.21, percentile: 58.3, adultCm: 178.3 }   (approx.)
```

All heights are in centimetres, ages in years (decimals allowed), `sex` is `'male'` or `'female'`. Bad input throws `TypeError` or `RangeError`.

## Formulas

### Mid-parental (target) height

| | Formula | Likely range |
|---|---|---|
| Boys | (father + mother + 13) / 2 | +/- 8.5 cm |
| Girls | (father + mother - 13) / 2 | +/- 8.5 cm |

13 cm is the average adult height difference between men and women. The +/- 8.5 cm band is about two standard deviations around the target (MSD Manual). The AAFP review below uses a wider rule of thumb: most children end up within 10 cm of mid-parental height.

### CDC LMS percentile

The CDC publishes, for every half month of age from 2 to 20 years, three numbers L, M and S. For a height X:

- z = ((X / M)^L - 1) / (L * S) (when L is not 0; z = ln(X / M) / S when L = 0)
- percentile = standard normal CDF of z
- height at a given z: X = M * (1 + L * S * z)^(1 / L)

`projectFromPercentile` computes z at the child's age, then applies the last formula with the L, M, S values for 240 months (age 20).

## Data

`cdc-stature-lms.json` is a subset of the CDC file `statage.csv` (stature-for-age, 2 to 20 years):

- Source: https://www.cdc.gov/growthcharts/data/zscore/statage.csv (listed on https://www.cdc.gov/growthcharts/cdc-data-files.htm )
- Downloaded 2026-09-20. CDC page last reviewed 2024-09-02.
- Kept rows: 24, 24.5, then every 6 months (30.5 ... 234.5), then 240 months. Only L, M, S. Values copied unchanged.
- Between rows, L, M and S are linearly interpolated. The tests check this against rows that are not in the subset.

## Limits

- **Ages 2 to 20 only.** CDC's 2-20 chart does not cover infants; the functions throw outside that range.
- **Percentile projection assumes the child stays on the same percentile.** Puberty timing breaks that assumption: a child who starts early can sit high on the chart for a while and then level off, and a late starter can look the opposite. Treat projections around puberty with extra caution.
- **Mid-parental height ignores the child.** It only knows the parents and assumes a typical sex difference.
- **The CDC charts are a US reference.** Other populations may sit higher or lower.
- When the two methods disagree by a lot, that gap is the useful signal, not either number.

## When to talk to a pediatrician

From the AAFP review (Barstow & Rerucha, 2015): after age 2, children usually track along a percentile, and variation should stay within two large bands on the growth chart. The review lists reasons for referral, including growth of less than 5 cm a year, no signs of puberty by 14 (boys) or 13 (girls), and a projected height more than 10 cm below mid-parental height.

## Try it without code

A free web calculator (ages 8-20) that blends the mid-parental estimate with a current-height projection and widens the range when they disagree: [howtallai.com](https://howtallai.com/?utm_source=github&utm_medium=readme&utm_campaign=backlink_trial_202610)

## References

1. Tanner JM, Goldstein H, Whitehouse RH. Standards for children's height at ages 2-9 years allowing for heights of parents. *Arch Dis Child*. 1970;45(244):755-62. https://pubmed.ncbi.nlm.nih.gov/5491878/
2. MSD Manual, Height Potential: A Child's Target Height Based on Midparental Height. https://www.msdmanuals.com/iframe/manual/medical-calculators/heightpotential.htm
3. Barstow C, Rerucha C. Evaluation of Short and Tall Stature in Children. *Am Fam Physician*. 2015;92(1):43-50. https://www.aafp.org/pubs/afp/issues/2015/0701/p43.html
4. CDC, Growth Charts: Data Table of Stature-for-age Charts / CDC data files. https://www.cdc.gov/growthcharts/cdc-data-files.htm

## License

MIT, see [LICENSE](LICENSE).
