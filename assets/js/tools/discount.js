(function () {
  'use strict';
  function compute(o) {
    var p = o.price, d1 = o.d1, d2 = o.d2 || 0;
    if (!(p >= 0)) return { error: 'Enter the original price (0 or more).' };
    if (!(d1 >= 0) || d1 > 100 || !(d2 >= 0) || d2 > 100) return { error: 'Discounts must be between 0 and 100%.' };
    if (p > 1e12) return { error: 'Price is too large.' };
    var after1 = p * (1 - d1 / 100), final = after1 * (1 - d2 / 100), save = p - final;
    return { price: p, final: final, saved: save, effective: p > 0 ? save / p * 100 : 0 };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var r = compute({ price: S.parseNumber(f.price.value), d1: S.parseNumber(f.d1.value), d2: f.d2.value ? S.parseNumber(f.d2.value) : 0 });
      if (r.error) return r;
      return { html: '<dl class="stats">' + S.stat('Final price', S.fmtINR(r.final), true) + S.stat('You save', S.fmtINR(r.saved)) + S.stat('Effective discount', S.fmtNum(r.effective, 2) + '%') + '</dl>', copy: 'Final price: ' + S.fmtINR(r.final) + '\nYou save: ' + S.fmtINR(r.saved) };
    });
  });
})();
