(function () {
  'use strict';
  var MAX = 10000000;
  function locate(text, msg) {
    var m = /line (\d+) column (\d+)/i.exec(msg);
    if (m) return { line: +m[1], column: +m[2] };
    m = /position (\d+)/i.exec(msg);
    if (m) {
      var pos = Math.min(+m[1], text.length), before = text.slice(0, pos).split('\n');
      return { line: before.length, column: before[before.length - 1].length + 1 };
    }
    return null;
  }
  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).sort().forEach(function (k) { o[k] = sortDeep(v[k]); }); return o; }
    return v;
  }
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) return { error: { message: 'Paste or type some JSON first.' } };
    if (text.length > MAX) return { error: { message: 'Input is too large for in-browser processing (limit 10 million characters).' } };
    try { return { value: JSON.parse(text) }; }
    catch (e) { var loc = locate(text, e.message); return { error: { message: e.message, line: loc && loc.line, column: loc && loc.column } }; }
  }
  /* indent: number of spaces or '\t' */
  function format(text, opts) {
    opts = opts || {};
    var p = parse(text); if (p.error) return p;
    var v = opts.sortKeys ? sortDeep(p.value) : p.value;
    return { output: JSON.stringify(v, null, opts.indent === undefined ? 2 : opts.indent), value: v };
  }
  function minify(text) {
    var p = parse(text); if (p.error) return p;
    return { output: JSON.stringify(p.value), value: p.value };
  }
  function describe(v) {
    if (Array.isArray(v)) return 'array with ' + v.length + ' item' + (v.length === 1 ? '' : 's');
    if (v && typeof v === 'object') { var n = Object.keys(v).length; return 'object with ' + n + ' key' + (n === 1 ? '' : 's'); }
    return v === null ? 'null' : typeof v;
  }
  var api = { format: format, minify: minify, parse: parse, describe: describe };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, $ = function (id) { return document.getElementById(id); };
    var L = $('input'), R = $('output'), gl = $('gut-l'), gr = $('gut-r'), ls = $('lstatus'), rs = $('rstatus'), tree = $('tree'), tb = $('tree-body'), edr = $('ed-r');
    var treeOn = false, t1, t2;
    function gutter(ta, g, errLine) { var n = ta.value.split('\n').length, h = '', i; for (i = 1; i <= n; i++) h += (i === errLine ? '<div class="e">' : '<div>') + i + '</div>'; g.innerHTML = h; g.scrollTop = ta.scrollTop; }
    function size(t) { var b = new Blob([t]).size; return b < 1024 ? b + ' B' : (b / 1024).toFixed(1) + ' KB'; }
    function check(ta, g, st) {
      var t = ta.value; if (!t.trim()) { st.textContent = ''; st.className = 'pf'; gutter(ta, g); return null; }
      var p = parse(t);
      if (p.error) { st.textContent = '✗ ' + (p.error.line ? 'Line ' + p.error.line + ', column ' + p.error.column + ': ' : '') + p.error.message.replace(/ in JSON at position.*$/, ''); st.className = 'pf bad'; gutter(ta, g, p.error.line); return p; }
      st.textContent = '✓ Valid JSON · ' + describe(p.value) + ' · ' + size(t); st.className = 'pf ok'; gutter(ta, g); return p;
    }
    function sync(ta, g) { ta.addEventListener('scroll', function () { g.scrollTop = ta.scrollTop; }); }
    sync(L, gl); sync(R, gr);
    /* tree view */
    function count(v, cap) { var n = 1, k; if (v && typeof v === 'object') for (k in v) { n += count(v[k], cap); if (n > cap) return n; } return n; }
    function node(key, v, open) {
      var d, el, row;
      if (v && typeof v === 'object') {
        var arr = Array.isArray(v), keys = Object.keys(v);
        el = document.createElement('details'); if (open) el.open = true; row = document.createElement('summary');
        row.innerHTML = (key !== null ? '<span class="k"></span>: ' : '') + '<span class="b"></span>';
        if (key !== null) row.firstChild.textContent = typeof key === 'number' ? key : '"' + key + '"';
        row.lastChild.textContent = arr ? '[' + keys.length + ']' : '{' + keys.length + '}'; el.appendChild(row);
        d = document.createElement('div'); d.className = 'ch'; keys.forEach(function (k) { d.appendChild(node(arr ? Number(k) : k, v[k], false)); }); el.appendChild(d); return el;
      }
      el = document.createElement('div'); el.className = 'lf';
      el.innerHTML = (key !== null ? '<span class="k"></span>: ' : '') + '<span class="v ' + (v === null ? 'n' : typeof v) + '"></span>';
      if (key !== null) el.firstChild.textContent = typeof key === 'number' ? key : '"' + key + '"';
      el.lastChild.textContent = typeof v === 'string' ? JSON.stringify(v) : String(v); return el;
    }
    function drawTree() {
      tb.textContent = ''; var t = R.value; if (!t.trim()) { tb.textContent = 'Nothing to show yet. Format something first.'; return; }
      var p = parse(t); if (p.error) { tb.textContent = 'Cannot build a tree: the output is not valid JSON.'; return; }
      if (count(p.value, 20000) > 20000) { tb.textContent = 'This document is too large for the tree view. Use the text view.'; return; }
      tb.appendChild(node(null, p.value, true));
    }
    function view(on) { treeOn = on; edr.hidden = on; tree.hidden = !on; $('v-text').setAttribute('aria-pressed', !on); $('v-tree').setAttribute('aria-pressed', on); if (on) drawTree(); }
    $('v-text').addEventListener('click', function () { view(false); }); $('v-tree').addEventListener('click', function () { S.trackUse(); view(true); });
    $('t-open').addEventListener('click', function () { tb.querySelectorAll('details').forEach(function (d) { d.open = true; }); });
    $('t-close').addEventListener('click', function () { tb.querySelectorAll('details').forEach(function (d, i) { d.open = i === 0; }); });
    /* actions */
    function out(r) {
      if (r.error) { var m = r.error.message.replace(/ in JSON at position.*$/, ''); S.showError('Invalid JSON: ' + m + (r.error.line ? ' (line ' + r.error.line + ', column ' + r.error.column + ')' : '')); check(L, gl, ls); return; }
      S.showError(''); R.value = r.output; check(R, gr, rs); check(L, gl, ls); if (treeOn) drawTree(); S.track('tool_result', S.toolInfo());
    }
    function fmt() { S.trackUse(); out(format(L.value, { indent: $('indent').value === 'tab' ? '\t' : Number($('indent').value), sortKeys: $('sortkeys').checked })); }
    $('btn-format').addEventListener('click', fmt);
    $('btn-minify').addEventListener('click', function () { S.trackUse(); out(minify(L.value)); });
    $('btn-back').addEventListener('click', function () { S.trackUse(); L.value = R.value; check(L, gl, ls); L.focus(); });
    $('copy-btn').addEventListener('click', function () { S.copyText(R.value, this); });
    $('btn-dl').addEventListener('click', function () { if (!R.value) { S.showError('Nothing to download yet.'); return; } var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([R.value], { type: 'application/json' })); a.download = 'data.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); S.track('tool_download', S.toolInfo()); });
    $('btn-reset').addEventListener('click', function () { L.value = ''; R.value = ''; S.showError(''); check(L, gl, ls); check(R, gr, rs); if (treeOn) drawTree(); L.focus(); });
    $('btn-example').addEventListener('click', function () { L.value = '{"name":"Asha","active":true,"skills":["js","css"],"address":{"city":"Pune","pin":"411001"},"score":9.5,"note":null}'; S.trackUse(); check(L, gl, ls); });
    L.addEventListener('input', function () { S.trackUse(); clearTimeout(t1); t1 = setTimeout(function () { check(L, gl, ls); }, 250); });
    R.addEventListener('input', function () { clearTimeout(t2); t2 = setTimeout(function () { check(R, gr, rs); if (treeOn) drawTree(); }, 250); });
    L.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); fmt(); } });
    check(L, gl, ls); check(R, gr, rs);
  });
})();
