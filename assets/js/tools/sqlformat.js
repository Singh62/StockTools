(function () {
  'use strict';
  /* Basic, dialect-agnostic formatter: uppercases keywords, breaks lines at major clauses. Not a SQL parser. */
  var CLAUSE = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN', 'WITH', 'RETURNING'];
  var KW = ['AS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'EXISTS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'ALL', 'ANY', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  var TOK = /('(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_][A-Za-z0-9_$.]*|\d+(?:\.\d+)?|<=|>=|<>|!=|\|\||[(),;]|\S)/g;
  function format(sql, o) {
    o = o || {}; var ind = o.indent === 'tab' ? '\t' : ' '.repeat(o.indent || 2), up = o.upper !== false;
    if (!sql.trim()) return { error: 'Paste some SQL first.' };
    if (sql.length > 500000) return { error: 'SQL is too long (limit 500,000 characters).' };
    var t = sql.match(TOK) || [], out = '', depth = 0, i, line = '';
    function nl(d) { out += line.replace(/\s+$/, '') + '\n'; line = ind.repeat(Math.max(d, 0)); }
    for (i = 0; i < t.length; i++) {
      var tk = t[i], U = tk.toUpperCase(), two = i + 1 < t.length ? U + ' ' + t[i + 1].toUpperCase() : '', three = i + 2 < t.length ? two + ' ' + t[i + 2].toUpperCase() : '', hit = null;
      if (/^[A-Za-z_]/.test(tk)) { [three, two, U].some(function (c) { if (c && CLAUSE.indexOf(c) > -1) { hit = c; return true; } return false; }); }
      if (hit) { i += hit.split(' ').length - 1; if (line.trim()) nl(depth); else line = ind.repeat(depth); line += (up ? hit : tk) + ' '; continue; }
      if (tk === '(') { line = line.replace(/\s+$/, (/[A-Za-z0-9_]$/.test(line.trim()) && !/\b(IN|AS|ON|AND|OR|VALUES)$/i.test(line.trim()) ? '' : ' ')) + '('; depth++; continue; }
      if (tk === ')') { depth = Math.max(0, depth - 1); line = line.replace(/\s+$/, '') + ') '; continue; }
      if (tk === ',') { line = line.replace(/\s+$/, '') + ','; if (depth === 0) nl(1); else line += ' '; continue; }
      if (tk === ';') { line = line.replace(/\s+$/, '') + ';'; nl(0); out += '\n'; line = ''; continue; }
      if ((U === 'AND' || U === 'OR') && depth === 0) { nl(1); line += (up ? U : tk) + ' '; continue; }
      if (/^--/.test(tk)) { line += tk; nl(depth); continue; }
      line += (up && KW.indexOf(U) > -1 ? U : tk) + (tk === '.' ? '' : ' ');
    }
    out += line; return { output: out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() };
  }
  var api = { format: format };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, i = document.getElementById('input'), o = document.getElementById('output'), ind = document.getElementById('indent'), up = document.getElementById('upper');
    document.getElementById('btn-format').addEventListener('click', function () { S.trackUse(); var r = format(i.value, { indent: ind.value === 'tab' ? 'tab' : Number(ind.value), upper: up.checked }); if (r.error) { S.showError(r.error); o.value = ''; return; } S.showError(''); o.value = r.output; S.track('tool_result', S.toolInfo()); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(o.value, this); });
    document.getElementById('btn-reset').addEventListener('click', function () { i.value = ''; o.value = ''; S.showError(''); });
  });
})();
