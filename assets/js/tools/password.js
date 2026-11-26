(function () {
  'use strict';
  var SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?' };
  var AMBIG = /[Il1O0o]/g;
  function rnd(n, rng) { var lim = Math.floor(4294967296 / n) * n, a = new Uint32Array(1), x; do { (rng || function (b) { (globalThis.crypto).getRandomValues(b); })(a); x = a[0]; } while (x >= lim); return x % n; }
  function generate(o, rng) {
    var len = o.length; if (!Number.isInteger(len) || len < 4 || len > 128) return { error: 'Length must be a whole number from 4 to 128.' };
    var pools = Object.keys(SETS).filter(function (k) { return o[k]; }).map(function (k) { return o.noAmbiguous ? SETS[k].replace(AMBIG, '') : SETS[k]; });
    if (!pools.length) return { error: 'Choose at least one character type.' };
    if (len < pools.length) return { error: 'Length is shorter than the number of selected character types.' };
    var all = pools.join(''), chars = pools.map(function (p) { return p[rnd(p.length, rng)]; });
    while (chars.length < len) chars.push(all[rnd(all.length, rng)]);
    for (var i = chars.length - 1; i > 0; i--) { var j = rnd(i + 1, rng), t = chars[i]; chars[i] = chars[j]; chars[j] = t; }
    var bits = len * Math.log2(all.length);
    return { password: chars.join(''), bits: Math.round(bits), strength: bits < 40 ? 'Weak' : bits < 60 ? 'Fair' : bits < 80 ? 'Strong' : 'Very strong' };
  }
  var api = { generate: generate };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), out = document.getElementById('output'), info = document.getElementById('strength');
    function run(manual) {
      var r = generate({ length: S.parseNumber(f.length.value), lower: f.lower.checked, upper: f.upper.checked, digits: f.digits.checked, symbols: f.symbols.checked, noAmbiguous: f.noamb.checked });
      if (r.error) { S.showError(r.error); out.value = ''; info.textContent = ''; return; }
      S.showError(''); out.value = r.password; info.textContent = r.strength + ' (about ' + r.bits + ' bits of randomness)'; if (manual) S.track('tool_result', S.toolInfo());
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); S.trackUse(); run(true); });
    f.addEventListener('reset', function () { setTimeout(function () { run(false); }, 0); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(out.value, this); });
    run(false);
  });
})();
