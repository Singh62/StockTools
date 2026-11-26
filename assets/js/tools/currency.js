(function () {
  'use strict';
  /* Manual-rate converter: no rates are bundled or fetched, so nothing here can be a fabricated "live" rate. */
  function compute(o) {
    if (!(o.amount >= 0)) return { error: 'Enter an amount of 0 or more.' };
    if (!(o.rate > 0)) return { error: 'Enter the exchange rate (greater than 0).' };
    if (o.amount > 1e15 || o.rate > 1e9) return { error: 'Value is too large.' };
    return { converted: o.amount * o.rate, inverse: 1 / o.rate };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var a = (f.from.value.trim() || 'FROM').toUpperCase().slice(0, 6), b = (f.to.value.trim() || 'TO').toUpperCase().slice(0, 6);
      var r = compute({ amount: S.parseNumber(f.amount.value), rate: S.parseNumber(f.rate.value) }); if (r.error) return r;
      var n = function (x) { return S.fmtNum(x, 4); };
      return { html: '<dl class="stats">' + S.stat(n(S.parseNumber(f.amount.value)) + ' ' + a + ' =', n(r.converted) + ' ' + b, true) + S.stat('Reverse rate', '1 ' + b + ' = ' + S.fmtNum(r.inverse, 6) + ' ' + a) + '</dl><p class="muted">Uses the rate you entered. Check it against your bank or a live source before transacting.</p>', copy: n(S.parseNumber(f.amount.value)) + ' ' + a + ' = ' + n(r.converted) + ' ' + b + ' (rate ' + f.rate.value + ')' };
    });
  });
})();
