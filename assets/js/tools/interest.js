(function () {
  'use strict';
  /* Shared by Simple Interest, Compound Interest and FD pages (data-mode on <body>). */
  function simple(o) {
    var P = o.principal, r = o.rate, t = o.years;
    if (!(P > 0)) return { error: 'Principal must be greater than 0.' };
    if (!(r >= 0) || r > 100) return { error: 'Rate must be between 0 and 100% per year.' };
    if (!(t > 0) || t > 100) return { error: 'Time must be greater than 0 and at most 100 years.' };
    var I = P * r * t / 100; return { interest: I, total: P + I, principal: P };
  }
  function compound(o) {
    var P = o.principal, r = o.rate, t = o.years, n = o.freq;
    if (!(P > 0)) return { error: 'Principal must be greater than 0.' };
    if (!(r >= 0) || r > 100) return { error: 'Rate must be between 0 and 100% per year.' };
    if (!(t > 0) || t > 100) return { error: 'Time must be greater than 0 and at most 100 years.' };
    if (![1, 2, 4, 12, 365].includes(n)) return { error: 'Choose a compounding frequency.' };
    var A = P * Math.pow(1 + r / 100 / n, n * t);
    return { total: A, interest: A - P, principal: P, effectiveRate: (Math.pow(1 + r / 100 / n, n) - 1) * 100 };
  }
  function fd(o) {
    var months = o.years * 12 + o.months;
    if (!(o.years >= 0) || !(o.months >= 0)) return { error: 'Enter the tenure in years and/or months (0 or more).' };
    if (!(months >= 1)) return { error: 'Tenure must be at least 1 month.' };
    if (months > 1200) return { error: 'Tenure is too long (maximum 100 years).' };
    if (o.freq === 0) { var s = simple({ principal: o.principal, rate: o.rate, years: months / 12 }); return s.error ? s : Object.assign(s, { months: months }); }
    var c = compound({ principal: o.principal, rate: o.rate, years: months / 12, freq: o.freq }); return c.error ? c : Object.assign(c, { months: months });
  }
  function growth(P, rate, freq, years) { // yearly points [year, amount]; freq 0 = simple
    var pts = [], y, at = function (t) { return freq === 0 ? P * (1 + rate / 100 * t) : P * Math.pow(1 + rate / 100 / freq, freq * t); };
    for (y = 0; y < years; y++) pts.push([y, at(y)]); pts.push([years, at(years)]); return pts;
  }
  var api = { simple: simple, compound: compound, fd: fd, growth: growth };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST, mode = document.body.dataset.mode;
    S.bindCalculator(f, function () {
      var P = S.parseNumber(f.principal.value), r = S.parseNumber(f.rate.value), x, yrs, fr;
      if (mode === 'simple') { yrs = S.parseNumber(f.years.value); fr = 0; x = simple({ principal: P, rate: r, years: yrs }); }
      else if (mode === 'compound') { yrs = S.parseNumber(f.years.value); fr = Number(f.freq.value); x = compound({ principal: P, rate: r, years: yrs, freq: fr }); }
      else { var yv = f.years.value ? S.parseNumber(f.years.value) : 0, mv = f.months.value ? S.parseNumber(f.months.value) : 0; fr = Number(f.freq.value); x = fd({ principal: P, rate: r, years: yv, months: mv, freq: fr }); yrs = x.months / 12; }
      if (x.error) return x;
      var lbl = mode === 'fd' ? 'Maturity amount' : 'Total amount';
      return { html: '<dl class="stats">' + S.stat(lbl, S.fmtINR(x.total), true) + S.stat('Interest earned', S.fmtINR(x.interest)) + S.stat('Principal', S.fmtINR(x.principal)) + (x.effectiveRate !== undefined ? S.stat('Effective annual rate', S.fmtNum(x.effectiveRate, 3) + '%') : '') + '</dl><div class="charts"><div id="ch1"></div><div id="ch2"></div></div>',
        copy: lbl + ': ' + S.fmtINR(x.total) + '\nInterest: ' + S.fmtINR(x.interest),
        after: function (out, anim) {
          var C = window.ST_CHART; if (!C) return;
          C.donut(out.querySelector('#ch1'), [{ label: 'Principal', value: x.principal }, { label: 'Interest', value: x.interest }], { center: [S.fmtINR(x.total, 0), 'total'], animate: anim });
          var g = growth(P, r, fr, yrs);
          C.line(out.querySelector('#ch2'), [{ name: 'Principal', ci: 3, pts: g.map(function (p) { return [p[0], P]; }) }, { name: 'Amount', ci: 1, area: true, pts: g }], { animate: anim, label: 'Growth over time' });
        } };
    });
  });
})();
