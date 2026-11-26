(function () {
  'use strict';
  function compute(o) {
    var ctc = o.ctc, bp = o.basicPct, pt = o.ptMonthly === undefined ? 200 : o.ptMonthly;
    if (!(ctc > 0)) return { error: 'Annual CTC must be greater than 0.' };
    if (ctc > 1e9) return { error: 'CTC is too large.' };
    if (!(bp >= 10) || bp > 100) return { error: 'Basic salary must be between 10% and 100% of CTC.' };
    if (!(pt >= 0) || pt > 2500) return { error: 'Professional tax per month must be between 0 and 2,500.' };
    var basic = ctc * bp / 100, pfBase = o.pfCap ? Math.min(basic, 15000 * 12) : basic;
    var erPF = pfBase * .12, grat = basic * .0481, gross = ctc - erPF - grat;
    if (gross <= 0) return { error: 'Basic share is too high: employer contributions exceed CTC.' };
    var eePF = erPF, ptY = pt * 12, tax = 0;
    if (o.estimateTax) { var T = typeof module === 'object' ? require('./tax') : window.ST_TAX; var r = T.compute({ income: gross, salaried: true, deductions: 0 }); if (r.error) return r; tax = r.newRegime.total; }
    var net = gross - eePF - ptY - tax;
    if (net < 0) return { error: 'Deductions exceed gross salary.' };
    return { ctc: ctc, basic: basic, employerPF: erPF, gratuity: grat, gross: gross, employeePF: eePF, pt: ptY, tax: tax, netYear: net, netMonth: net / 12, grossMonth: gross / 12 };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var r = compute({ ctc: S.parseNumber(f.ctc.value), basicPct: S.parseNumber(f.basic.value), ptMonthly: S.parseNumber(f.pt.value), pfCap: f.pfcap.checked, estimateTax: f.tax.checked });
      if (r.error) return r;
      var m = function (x) { return S.fmtINR(x / 12, 0); }, y = function (x) { return S.fmtINR(x, 0); };
      var rows = [['Basic salary', r.basic], ['Employer PF (in CTC)', r.employerPF], ['Gratuity (in CTC)', r.gratuity], ['Gross salary (CTC − PF − gratuity)', r.gross], ['Employee PF', -r.employeePF], ['Professional tax', -r.pt]].concat(f.tax.checked ? [['Income tax (new regime, estimate)', -r.tax]] : []);
      return { html: '<dl class="stats">' + S.stat('Estimated monthly take-home', S.fmtINR(r.netMonth, 0), true) + S.stat('Annual take-home', y(r.netYear)) + '</dl><div id="ch1" class="charts"></div><div class="table-wrap"><table><thead><tr><th>Component</th><th>Monthly</th><th>Yearly</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + m(x[1]) + '</td><td>' + y(x[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>',
        copy: 'CTC ' + y(r.ctc) + ' → monthly take-home ≈ ' + S.fmtINR(r.netMonth, 0),
        after: function (out, anim) { var C = window.ST_CHART; if (!C) return; var d = out.querySelector('#ch1'); C.donut(d, [{ label: 'Take-home', value: r.netYear }, { label: 'Employee PF', value: r.employeePF }, { label: 'Income tax', value: r.tax }, { label: 'Professional tax', value: r.pt }, { label: 'Employer PF + gratuity', value: r.employerPF + r.gratuity }].filter(function (x) { return x.value > 0; }), { center: [S.fmtINR(r.netMonth, 0), 'per month'], animate: anim }); } };
    });
  });
})();
