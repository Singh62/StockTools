(function () {
  'use strict';
  /* EMI = P*r*(1+r)^n / ((1+r)^n - 1), r = annual rate / 12 / 100, n = months. */
  function compute(o) {
    var P = o.principal, rate = o.annualRate, months = o.unit === 'years' ? o.tenure * 12 : o.tenure;
    if (!(P > 0)) return { error: 'Loan amount must be greater than 0.' };
    if (P > 1e12) return { error: 'Loan amount is too large (maximum ₹1,00,000 crore).' };
    if (!(rate >= 0) || rate > 100) return { error: 'Interest rate must be between 0 and 100% per year.' };
    if (!(months >= 1)) return { error: 'Tenure must be at least 1 month.' };
    if (Math.abs(months - Math.round(months)) > 1e-9) return { error: 'Tenure must work out to a whole number of months.' };
    months = Math.round(months);
    if (months > 600) return { error: 'Tenure cannot exceed 50 years (600 months).' };
    var r = rate / 1200, emi;
    if (r === 0) emi = P / months;
    else { var g = Math.pow(1 + r, months); emi = P * r * g / (g - 1); }
    var total = emi * months, bal = P, rows = [], yp = 0, yi = 0;
    for (var m = 1; m <= months; m++) {
      var i = bal * r, p = emi - i; bal -= p; yp += p; yi += i;
      if (m % 12 === 0 || m === months) { rows.push({ year: Math.ceil(m / 12), principal: yp, interest: yi, balance: Math.max(bal, 0) < 1e-6 ? 0 : bal }); yp = 0; yi = 0; }
    }
    return { emi: emi, totalPayment: total, totalInterest: total - P, principal: P, months: months, schedule: rows };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var r = compute({ principal: S.parseNumber(f.principal.value), annualRate: S.parseNumber(f.rate.value), tenure: S.parseNumber(f.tenure.value), unit: f.unit.value });
      if (r.error) return r;
      var rows = r.schedule.map(function (x) { return '<tr><td>' + x.year + '</td><td>' + S.fmtINR(x.principal, 0) + '</td><td>' + S.fmtINR(x.interest, 0) + '</td><td>' + S.fmtINR(x.balance, 0) + '</td></tr>'; }).join('');
      return {
        html: '<dl class="stats">' + S.stat('Monthly EMI', S.fmtINR(r.emi), true) + S.stat('Total interest', S.fmtINR(r.totalInterest)) + S.stat('Total payment', S.fmtINR(r.totalPayment)) + '</dl>' +
          '<div class="charts"><div id="ch1"></div><div id="ch2"></div></div><details class="opt"><summary>Year-wise table</summary><div class="table-wrap"><table><thead><tr><th>Year</th><th>Principal paid</th><th>Interest paid</th><th>Balance</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>',
        copy: 'EMI: ' + S.fmtINR(r.emi) + '\nTotal interest: ' + S.fmtINR(r.totalInterest) + '\nTotal payment: ' + S.fmtINR(r.totalPayment),
        after: function (out, anim) {
          var C = window.ST_CHART; if (!C) return;
          C.donut(out.querySelector('#ch1'), [{ label: 'Principal', value: r.principal }, { label: 'Interest', value: r.totalInterest }], { center: [S.fmtINR(r.emi, 0), 'per month'], animate: anim });
          C.bars(out.querySelector('#ch2'), r.schedule.map(function (x) { return { label: 'Y' + x.year, parts: [{ name: 'Principal', v: x.principal, ci: 1 }, { name: 'Interest', v: x.interest, ci: 2 }], note: 'Balance: ' + S.fmtINR(x.balance, 0) }; }), { animate: anim, label: 'Principal and interest paid each year' });
        }
      };
    });
  });
})();
