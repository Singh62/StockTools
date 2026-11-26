(function () {
  'use strict';
  var U = {
    length: { m: ['Metre (m)', 1], km: ['Kilometre (km)', 1000], cm: ['Centimetre (cm)', .01], mm: ['Millimetre (mm)', .001], mi: ['Mile', 1609.344], yd: ['Yard', .9144], ft: ['Foot', .3048], in: ['Inch', .0254] },
    mass: { kg: ['Kilogram (kg)', 1], g: ['Gram (g)', .001], mg: ['Milligram (mg)', 1e-6], q: ['Quintal (100 kg)', 100], t: ['Tonne', 1000], lb: ['Pound (lb)', .45359237], oz: ['Ounce (oz)', .028349523125] },
    area: { sqm: ['Square metre', 1], sqkm: ['Square kilometre', 1e6], sqft: ['Square foot', .09290304], sqyd: ['Square yard', .83612736], acre: ['Acre', 4046.8564224], ha: ['Hectare', 10000] },
    volume: { l: ['Litre (L)', 1], ml: ['Millilitre (mL)', .001], m3: ['Cubic metre', 1000], gal: ['US gallon', 3.785411784], floz: ['US fluid ounce', .0295735295625], cup: ['US cup', .2365882365], tbsp: ['US tablespoon', .01478676478125], tsp: ['US teaspoon', .00492892159375] },
    speed: { ms: ['Metre/second', 1], kmh: ['Kilometre/hour', 1 / 3.6], mph: ['Mile/hour', .44704], kn: ['Knot', 1852 / 3600] },
    data: { b: ['Byte (B)', 1], kb: ['Kilobyte (KB, 1000)', 1e3], mb: ['Megabyte (MB)', 1e6], gb: ['Gigabyte (GB)', 1e9], tb: ['Terabyte (TB)', 1e12], kib: ['Kibibyte (KiB, 1024)', 1024], mib: ['Mebibyte (MiB)', 1048576], gib: ['Gibibyte (GiB)', 1073741824] },
    temperature: { c: ['Celsius (°C)'], f: ['Fahrenheit (°F)'], k: ['Kelvin (K)'] }
  };
  function convert(cat, v, from, to) {
    if (!U[cat] || !U[cat][from] || !U[cat][to]) return { error: 'Choose valid units.' };
    if (!Number.isFinite(v)) return { error: 'Enter a valid number.' };
    if (cat === 'temperature') {
      var c = from === 'c' ? v : from === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
      if (c < -273.15 - 1e-9) return { error: 'That is below absolute zero.' };
      return { value: +(to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15).toFixed(10) };
    }
    return { value: +(v * U[cat][from][1] / U[cat][to][1]).toPrecision(12) };
  }
  var api = { convert: convert, units: U };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), out = document.getElementById('result'), copy = '';
    function fill() { var u = U[f.cat.value], opts = Object.keys(u).map(function (k) { return '<option value="' + k + '">' + S.esc(u[k][0]) + '</option>'; }).join(''); f.from.innerHTML = opts; f.to.innerHTML = opts; f.to.selectedIndex = Math.min(1, f.to.options.length - 1); }
    function calc(manual) {
      var r = convert(f.cat.value, S.parseNumber(f.value.value), f.from.value, f.to.value);
      if (r.error) { if (manual || f.value.value) S.showError(r.error); out.hidden = true; return; }
      S.showError(''); var txt = S.fmtNum(r.value, 8) + ' ' + f.to.options[f.to.selectedIndex].text; out.hidden = false; out.innerHTML = '<dl class="stats">' + S.stat(S.fmtNum(S.parseNumber(f.value.value), 8) + ' ' + f.from.options[f.from.selectedIndex].text + ' =', txt, true) + '</dl>'; copy = txt; document.getElementById('copy-btn').hidden = false; if (manual) S.track('tool_result', S.toolInfo());
    }
    fill();
    f.cat.addEventListener('change', function () { fill(); calc(false); });
    f.addEventListener('submit', function (e) { e.preventDefault(); S.trackUse(); calc(true); });
    f.addEventListener('input', function () { S.trackUse(); if (f.value.value) calc(false); });
    document.getElementById('swap').addEventListener('click', function () { var t = f.from.value; f.from.value = f.to.value; f.to.value = t; calc(false); });
    f.addEventListener('reset', function () { setTimeout(function () { fill(); out.hidden = true; S.showError(''); document.getElementById('copy-btn').hidden = true; }, 0); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(copy, this); });
  });
})();
