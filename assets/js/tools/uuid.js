(function () {
  'use strict';
  function randomBytes(n) { var a = new Uint8Array(n); (globalThis.crypto || window.crypto).getRandomValues(a); return a; }
  function v4(rng) {
    var b = (rng || randomBytes)(16);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 0x100).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function generate(count, o, rng) {
    o = o || {};
    if (!Number.isInteger(count) || count < 1 || count > 1000) return { error: 'Enter a whole number of UUIDs between 1 and 1000.' };
    var list = [];
    for (var i = 0; i < count; i++) {
      var u = v4(rng);
      if (o.noHyphens) u = u.replace(/-/g, '');
      if (o.uppercase) u = u.toUpperCase();
      list.push(u);
    }
    return { list: list };
  }
  var api = { v4: v4, generate: generate };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), out = document.getElementById('output');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); S.trackUse();
      var r = generate(S.parseNumber(f.count.value), { uppercase: f.upper.checked, noHyphens: f.nohyphen.checked });
      if (r.error) { S.showError(r.error); out.value = ''; return; }
      S.showError(''); out.value = r.list.join('\n'); S.track('tool_result', S.toolInfo());
    });
    f.addEventListener('reset', function () { out.value = ''; S.showError(''); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(out.value, this); });
    out.value = generate(1).list[0]; // show one UUID immediately (not counted as usage)
  });
})();
