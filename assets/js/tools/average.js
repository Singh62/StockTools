(function () {
  'use strict';
  function stats(text) {
    var parts = []; text.split(/[\s;]+/).filter(Boolean).forEach(function (t) { if (/^[+-]?\d{1,3}(,\d{2,3})+(\.\d+)?$/.test(t)) parts.push(t.replace(/,/g, '')); else t.split(',').forEach(function (x) { if (x) parts.push(x); }); }); 
    /* 1,00,000 is one number; 1,2,3 is three */
    if (!parts.length) return { error: 'Enter some numbers separated by commas, spaces or new lines.' };
    var nums = [], bad = [];
    parts.forEach(function (p) { var s = p; if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) nums.push(Number(s)); else bad.push(p); });
    if (bad.length) return { error: 'Not a number: "' + bad[0] + '"' + (bad.length > 1 ? ' (and ' + (bad.length - 1) + ' more)' : '') + '.' };
    if (nums.length > 100000) return { error: 'Too many numbers (limit 100,000).' };
    var sum = nums.reduce(function (a, b) { return a + b; }, 0), s = nums.slice().sort(function (a, b) { return a - b; }), n = s.length;
    var median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, cnt = {}, best = 0;
    nums.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; if (cnt[x] > best) best = cnt[x]; });
    var mode = best > 1 ? Object.keys(cnt).filter(function (k) { return cnt[k] === best; }).map(Number).sort(function (a, b) { return a - b; }) : [];
    return { count: n, sum: sum, mean: sum / n, median: median, mode: mode, min: s[0], max: s[n - 1], range: s[n - 1] - s[0] };
  }
  var api = { stats: stats };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, i = document.getElementById('input'), out = document.getElementById('result'), copy = '';
    document.getElementById('btn-calc').addEventListener('click', function () {
      S.trackUse(); var r = stats(i.value); if (r.error) { S.showError(r.error); out.hidden = true; return; } S.showError('');
      var f = function (x) { return S.fmtNum(S.round(x, 8), 8); };
      out.hidden = false; out.innerHTML = '<dl class="stats">' + S.stat('Average (mean)', f(r.mean), true) + S.stat('Count', S.fmtNum(r.count, 0)) + S.stat('Sum', f(r.sum)) + S.stat('Median', f(r.median)) + S.stat('Mode', r.mode.length ? r.mode.map(f).join(', ') : 'No repeated value') + S.stat('Minimum', f(r.min)) + S.stat('Maximum', f(r.max)) + S.stat('Range', f(r.range)) + '</dl>';
      copy = 'Mean: ' + f(r.mean) + '\nMedian: ' + f(r.median) + '\nCount: ' + r.count + '\nSum: ' + f(r.sum); document.getElementById('copy-btn').hidden = false; S.track('tool_result', S.toolInfo());
    });
    document.getElementById('btn-reset').addEventListener('click', function () { i.value = ''; out.hidden = true; S.showError(''); document.getElementById('copy-btn').hidden = true; });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(copy, this); });
  });
})();
