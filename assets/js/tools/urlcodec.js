(function () {
  'use strict';
  function encode(s, full) { return full ? encodeURI(s) : encodeURIComponent(s); }
  function decode(s, full) {
    try { return { output: full ? decodeURI(s) : decodeURIComponent(s) }; }
    catch (e) { return { error: 'Invalid percent-encoding (a % is not followed by valid hex, or the bytes are not valid UTF-8).' }; }
  }
  var api = { encode: encode, decode: decode };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, i = document.getElementById('input'), o = document.getElementById('output'), full = document.getElementById('fullurl');
    document.getElementById('btn-encode').addEventListener('click', function () { S.trackUse(); if (!i.value) { S.showError('Enter some text first.'); return; } S.showError(''); o.value = encode(i.value, full.checked); S.track('tool_result', S.toolInfo()); });
    document.getElementById('btn-decode').addEventListener('click', function () { S.trackUse(); var r = decode(i.value, full.checked); if (r.error) { S.showError(r.error); o.value = ''; return; } S.showError(''); o.value = r.output; S.track('tool_result', S.toolInfo()); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(o.value, this); });
    document.getElementById('btn-reset').addEventListener('click', function () { i.value = ''; o.value = ''; S.showError(''); });
  });
})();
