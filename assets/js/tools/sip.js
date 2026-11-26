(function () {
  'use strict';
  /* FV = P * (((1+i)^n - 1) / i) * (1+i); i = annual rate / 12 / 100; payments at start of each month. */
  function compute(o) {
    var P = o.monthly, rate = o.annualRate, n = o.years * 12;
    if (!(P > 0)) return { error: 'Monthly investment must be greater than 0.' };
    if (P > 1e10) return { error: 'Monthly investment is too large.' };
    if (!(rate >= 0) || rate > 100) return { error: 'Expected return must be between 0 and 100% per year.' };
    if (!(n >= 0.99)) return { error: 'Period must be at least 1 month (0.0834 years).' };
    if (Math.abs(n - Math.round(n)) > 0.01) return { error: 'Period must be a whole number of months (e.g. 2.5 years is fine).' };
    n = Math.round(n);
    if (n > 720) return { error: 'Period cannot exceed 60 years.' };
    var i = rate / 1200, fv = i === 0 ? P * n : P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    var invested = P * n;
    return { futureValue: fv, invested: invested, returns: fv - invested, months: n };
  }
  function series(o) { // yearly points of [year, invested] and [year, value]
    var r = compute(o); if (r.error) return r;
    var i = o.annualRate / 1200, n = r.months, at = function (m) { return i === 0 ? o.monthly * m : o.monthly * ((Math.pow(1 + i, m) - 1) / i) * (1 + i); }, inv = [], val = [], y;
    for (y = 0; y * 12 < n; y++) { inv.push([y, o.monthly * 12 * y]); val.push([y, at(12 * y)]); }
    inv.push([n / 12, o.monthly * n]); val.push([n / 12, at(n)]); return { invested: inv, value: val };
  }
  var api = { compute: compute, series: series };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var o = { monthly: S.parseNumber(f.monthly.value), annualRate: S.parseNumber(f.rate.value), years: S.parseNumber(f.years.value) }, r = compute(o);
      if (r.error) return r;
      return {
        html: '<dl class="stats">' + S.stat('Estimated maturity value', S.fmtINR(r.futureValue, 0), true) + S.stat('Amount invested', S.fmtINR(r.invested, 0)) + S.stat('Estimated returns', S.fmtINR(r.returns, 0)) + '</dl><div class="charts"><div id="ch1"></div><div id="ch2"></div></div>',
        copy: 'Invested: ' + S.fmtINR(r.invested, 0) + '\nEstimated returns: ' + S.fmtINR(r.returns, 0) + '\nMaturity value: ' + S.fmtINR(r.futureValue, 0),
        after: function (out, anim) {
          var C = window.ST_CHART, sr = series(o); if (!C) return;
          C.donut(out.querySelector('#ch1'), [{ label: 'Invested', value: r.invested }, { label: 'Returns', value: r.returns }], { center: [S.fmtINR(r.futureValue, 0), 'maturity'], animate: anim });
          C.line(out.querySelector('#ch2'), [{ name: 'Invested', ci: 3, pts: sr.invested }, { name: 'Value', ci: 1, area: true, pts: sr.value }], { animate: anim, label: 'Growth of SIP over time' });
        }
      };
    });
  });
})();
