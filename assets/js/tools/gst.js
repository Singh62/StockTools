(function () {
  'use strict';
  function compute(o) {
    var a = o.amount, rate = o.rate;
    if (!(a >= 0)) return { error: 'Enter an amount of 0 or more.' };
    if (a > 1e13) return { error: 'Amount is too large.' };
    if (!(rate >= 0) || rate > 100) return { error: 'GST rate must be between 0 and 100%.' };
    var base, gst, total;
    if (o.mode === 'inclusive') { total = a; base = a * 100 / (100 + rate); gst = a - base; }
    else { base = a; gst = a * rate / 100; total = a + gst; }
    return { base: base, gst: gst, cgst: gst / 2, sgst: gst / 2, igst: gst, total: total, rate: rate };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST, sel = f.preset, custom = document.getElementById('custom-rate-wrap');
    function sync() { custom.hidden = sel.value !== 'custom'; }
    sel.addEventListener('change', sync); sync();
    S.onReset = sync;
    S.bindCalculator(f, function () {
      var rate = sel.value === 'custom' ? S.parseNumber(f.custom.value) : Number(sel.value);
      var r = compute({ amount: S.parseNumber(f.amount.value), rate: rate, mode: f.mode.value });
      if (r.error) return r;
      return {
        html: '<dl class="stats">' + S.stat('Net amount (before GST)', S.fmtINR(r.base), false) + S.stat('Total GST @ ' + S.fmtNum(r.rate, 3) + '%', S.fmtINR(r.gst), false) + S.stat('Total amount', S.fmtINR(r.total), true) + '</dl>' +
          '<p class="muted">Within one state: CGST ' + S.fmtINR(r.cgst) + ' + SGST ' + S.fmtINR(r.sgst) + '. Between states: IGST ' + S.fmtINR(r.igst) + '.</p>',
        copy: 'Net: ' + S.fmtINR(r.base) + '\nGST (' + S.fmtNum(r.rate, 3) + '%): ' + S.fmtINR(r.gst) + '\nTotal: ' + S.fmtINR(r.total)
      };
    });
  });
})();
