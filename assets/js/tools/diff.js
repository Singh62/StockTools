(function () {
  'use strict';
  var MAXL = 2000;
  function diffLines(a, b, o) {
    o = o || {};
    var A = a === '' ? [] : a.split(/\r?\n/), B = b === '' ? [] : b.split(/\r?\n/);
    if (A.length > MAXL || B.length > MAXL) return { error: 'Each text is limited to ' + MAXL + ' lines.' };
    var norm = function (s) { if (o.ignoreSpace) s = s.replace(/\s+/g, ' ').trim(); return o.ignoreCase ? s.toLowerCase() : s; };
    var na = A.map(norm), nb = B.map(norm), n = A.length, m = B.length, w = m + 1, L = new Uint16Array((n + 1) * w);
    for (var i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i * w + j] = na[i] === nb[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
    var ops = [], x = 0, y = 0;
    while (x < n && y < m) { if (na[x] === nb[y]) { ops.push({ t: '=', v: A[x] }); x++; y++; } else if (L[(x + 1) * w + y] >= L[x * w + y + 1]) ops.push({ t: '-', v: A[x++] }); else ops.push({ t: '+', v: B[y++] }); }
    while (x < n) ops.push({ t: '-', v: A[x++] }); while (y < m) ops.push({ t: '+', v: B[y++] });
    return { ops: ops, added: ops.filter(function (p) { return p.t === '+'; }).length, removed: ops.filter(function (p) { return p.t === '-'; }).length };
  }
  var api = { diffLines: diffLines };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), out = document.getElementById('result'), copy = '';
    f.addEventListener('submit', function (e) {
      e.preventDefault(); S.trackUse();
      var r = diffLines(f.a.value, f.b.value, { ignoreCase: f.ic.checked, ignoreSpace: f.is.checked });
      if (r.error) { S.showError(r.error); out.hidden = true; return; } S.showError('');
      out.hidden = false;
      out.innerHTML = '<p class="status">' + (r.added || r.removed ? r.added + ' added, ' + r.removed + ' removed' : 'The texts are identical.') + '</p><pre class="diff">' + r.ops.map(function (p) { return '<span class="d' + (p.t === '+' ? 'a' : p.t === '-' ? 'r' : 'n') + '">' + (p.t === '=' ? '  ' : p.t + ' ') + S.esc(p.v) + '</span>'; }).join('\n') + '</pre>';
      copy = r.ops.map(function (p) { return (p.t === '=' ? '  ' : p.t + ' ') + p.v; }).join('\n'); document.getElementById('copy-btn').hidden = false; S.track('tool_result', S.toolInfo());
    });
    f.addEventListener('reset', function () { setTimeout(function () { out.hidden = true; S.showError(''); document.getElementById('copy-btn').hidden = true; }, 0); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(copy, this); });
  });
})();
