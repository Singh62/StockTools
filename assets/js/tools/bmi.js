(function () {
  'use strict';
  function category(b) { return b < 18.5 ? 'Underweight' : b < 25 ? 'Normal weight' : b < 30 ? 'Overweight' : 'Obese'; }
  function compute(o) {
    var h = o.heightCm, w = o.weightKg;
    if (!(h >= 50 && h <= 272)) return { error: 'Height must be between 50 cm and 272 cm.' };
    if (!(w >= 2 && w <= 650)) return { error: 'Weight must be between 2 kg and 650 kg.' };
    var m = h / 100, bmi = w / (m * m);
    return { bmi: bmi, category: category(bmi), healthyMin: 18.5 * m * m, healthyMax: 24.9 * m * m };
  }
  var api = { compute: compute, category: category };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST, mw = document.getElementById('metric'), iw = document.getElementById('imperial');
    function sync() { var m = f.units.value === 'metric'; mw.hidden = !m; iw.hidden = m; }
    f.units.addEventListener('change', sync); sync(); S.onReset = sync;
    S.bindCalculator(f, function () {
      var h, w, p = S.parseNumber;
      if (f.units.value === 'metric') { h = p(f.cm.value); w = p(f.kg.value); }
      else { h = (p(f.ft.value) * 12 + (f.inch.value ? p(f.inch.value) : 0)) * 2.54; w = p(f.lb.value) * 0.45359237; }
      var r = compute({ heightCm: h, weightKg: w }); if (r.error) return r;
      return { html: '<dl class="stats">' + S.stat('Your BMI', S.fmtNum(r.bmi, 1), true) + S.stat('Category (WHO)', r.category) + S.stat('Healthy weight range for your height', S.fmtNum(r.healthyMin, 1) + ' – ' + S.fmtNum(r.healthyMax, 1) + ' kg') + '</dl>', copy: 'BMI ' + S.fmtNum(r.bmi, 1) + ' (' + r.category + ')' };
    });
  });
})();
