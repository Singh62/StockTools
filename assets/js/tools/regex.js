(function () {
  'use strict';
  function run(pattern, flags, text) {
    if (!pattern) return { error: 'Enter a regular expression.' };
    if (!/^[gimsuy]*$/.test(flags) || new Set(flags).size !== flags.length) return { error: 'Flags may contain each of g, i, m, s, u, y at most once.' };
    if (text.length > 200000) return { error: 'Test text is too long (limit 200,000 characters).' };
    var re; try { re = new RegExp(pattern, flags); } catch (e) { return { error: 'Invalid pattern: ' + e.message }; }
    var out = [], m, global = flags.indexOf('g') > -1 || flags.indexOf('y') > -1;
    while ((m = re.exec(text)) !== null) {
      out.push({ index: m.index, text: m[0], groups: Array.prototype.slice.call(m, 1), named: m.groups ? Object.assign({}, m.groups) : null });
      if (!global || out.length >= 1000) break;
      if (m[0] === '') re.lastIndex++;
    }
    return { matches: out, truncated: out.length >= 1000 };
  }
  var api = { run: run };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), out = document.getElementById('result'), copy = '';
    f.addEventListener('submit', function (e) {
      e.preventDefault(); S.trackUse();
      var r = run(f.pattern.value, f.flags.value.trim(), f.text.value);
      if (r.error) { S.showError(r.error); out.hidden = true; return; } S.showError('');
      var rows = r.matches.map(function (m, i) { return '<tr><td>' + (i + 1) + '</td><td>' + m.index + '</td><td><code>' + S.esc(m.text === '' ? '(empty)' : m.text) + '</code></td><td>' + S.esc(m.groups.map(function (g, j) { return (j + 1) + ': ' + (g === undefined ? '—' : g); }).join(' | ') + (m.named ? ' ' + JSON.stringify(m.named) : '')) + '</td></tr>'; }).join('');
      out.hidden = false; out.innerHTML = '<p class="status">' + r.matches.length + (r.truncated ? '+' : '') + ' match' + (r.matches.length === 1 ? '' : 'es') + '</p>' + (r.matches.length ? '<div class="table-wrap"><table><thead><tr><th>#</th><th>Index</th><th>Match</th><th>Groups</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">No matches.</p>');
      copy = r.matches.map(function (m) { return m.text; }).join('\n'); document.getElementById('copy-btn').hidden = !r.matches.length; S.track('tool_result', S.toolInfo());
    });
    f.addEventListener('reset', function () { setTimeout(function () { out.hidden = true; S.showError(''); document.getElementById('copy-btn').hidden = true; }, 0); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(copy, this); });
  });
})();
