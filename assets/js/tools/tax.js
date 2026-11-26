(function () {
  'use strict';
  /* Individuals below 60, resident. FY 2025-26 (AY 2026-27). Verify against the Income Tax Department before relying on it. */
  var NEW = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
  var OLD = [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]];
  function slab(t, tbl) { var tax = 0, lo = 0; for (var i = 0; i < tbl.length; i++) { if (t > lo) tax += (Math.min(t, tbl[i][0]) - lo) * tbl[i][1]; lo = tbl[i][0]; } return tax; }
  function newRegime(income, salaried) {
    var std = salaried ? 75000 : 0, taxable = Math.max(0, income - std), tax = slab(taxable, NEW);
    if (taxable <= 1200000) tax = Math.max(0, tax - 60000); else tax = Math.min(tax, taxable - 1200000);
    var cess = tax * .04; return { taxable: taxable, std: std, tax: tax, cess: cess, total: tax + cess };
  }
  function oldRegime(income, salaried, ded) {
    var std = salaried ? 50000 : 0, taxable = Math.max(0, income - std - ded), tax = slab(taxable, OLD);
    if (taxable <= 500000) tax = Math.max(0, tax - 12500);
    var cess = tax * .04; return { taxable: taxable, std: std, tax: tax, cess: cess, total: tax + cess };
  }
  function compute(o) {
    var inc = o.income, ded = o.deductions || 0;
    if (!(inc >= 0)) return { error: 'Enter your annual income (0 or more).' };
    if (!(ded >= 0)) return { error: 'Deductions must be 0 or more.' };
    if (inc > 1e9) return { error: 'Income is too large.' };
    if (inc - ded > 5000000) return { error: 'This calculator supports taxable income up to ₹50 lakh. Above that, surcharge and marginal relief apply and are not included.' };
    var n = newRegime(inc, !!o.salaried), d = oldRegime(inc, !!o.salaried, ded);
    return { newRegime: n, oldRegime: d, better: n.total <= d.total ? 'new' : 'old', saving: Math.abs(n.total - d.total) };
  }
  var api = { compute: compute, newRegime: newRegime, oldRegime: oldRegime };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  window.ST_TAX = api;
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'); if (!f || !f.income) return; var S = window.ST;
    S.bindCalculator(f, function () {
      var r = compute({ income: S.parseNumber(f.income.value), deductions: f.ded.value ? S.parseNumber(f.ded.value) : 0, salaried: f.salaried.checked });
      if (r.error) return r;
      function col(t, n) { return '<div><h3>' + t + '</h3><dl class="stats">' + S.stat('Taxable income', S.fmtINR(n.taxable, 0)) + S.stat('Tax after rebate', S.fmtINR(n.tax, 0)) + S.stat('Cess (4%)', S.fmtINR(n.cess, 0)) + S.stat('Total tax', S.fmtINR(n.total, 0), true) + '</dl></div>'; }
      var best = r.better === 'new' ? 'New regime' : 'Old regime';
      return { html: '<div class="row">' + col('New regime', r.newRegime) + col('Old regime', r.oldRegime) + '</div><p><strong>' + best + ' gives the lower tax by ' + S.fmtINR(r.saving, 0) + '</strong> under these inputs.</p>',
        copy: 'New regime tax: ' + S.fmtINR(r.newRegime.total, 0) + '\nOld regime tax: ' + S.fmtINR(r.oldRegime.total, 0) };
    });
  });
})();
