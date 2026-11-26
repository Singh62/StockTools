(function () {
  'use strict';
  var clean = function (x) { return +x.toFixed(10); };
  function compute(o) {
    var a = o.a, b = o.b;
    if (!isFinite(a) || !isFinite(b)) return { error: 'Enter valid numbers in both fields.' };
    switch (o.mode) {
      case 'of': return { value: clean(a * b / 100), unit: '', formula: a + '% of ' + b + ' = (' + a + ' × ' + b + ') ÷ 100' };
      case 'is': if (b === 0) return { error: 'The second number cannot be 0.' };
        return { value: clean(a / b * 100), unit: '%', formula: a + ' ÷ ' + b + ' × 100' };
      case 'change': if (a === 0) return { error: 'The starting value cannot be 0 (percentage change is undefined).' };
        var c = clean((b - a) / Math.abs(a) * 100);
        return { value: c, unit: '%', formula: '(' + b + ' − ' + a + ') ÷ |' + a + '| × 100', note: c > 0 ? 'increase' : c < 0 ? 'decrease' : 'no change' };
      case 'whole': if (a === 0) return { error: 'The percentage cannot be 0.' };
        return { value: clean(b / a * 100), unit: '', formula: b + ' ÷ ' + a + ' × 100' };
    }
    return { error: 'Choose a calculation type.' };
  }
  var api = { compute: compute };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  var LABELS = {
    of: ['Percentage (%)', 'Number'],
    is: ['Number (X)', 'Total (Y)'],
    change: ['Old value', 'New value'],
    whole: ['Percentage (%)', 'Part (the number)']
  };
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    function sync() { var l = LABELS[f.mode.value]; document.getElementById('lbl-a').textContent = l[0]; document.getElementById('lbl-b').textContent = l[1]; }
    f.mode.addEventListener('change', sync); sync(); S.onReset = sync;
    S.bindCalculator(f, function () {
      var r = compute({ mode: f.mode.value, a: S.parseNumber(f.a.value), b: S.parseNumber(f.b.value) });
      if (r.error) return r;
      var v = S.fmtNum(r.value, 6) + r.unit + (r.note ? ' (' + r.note + ')' : '');
      return { html: '<dl class="stats">' + S.stat('Result', v, true) + '</dl><p class="muted">Formula: ' + S.esc(r.formula) + '</p>', copy: v };
    });
  });
})();
