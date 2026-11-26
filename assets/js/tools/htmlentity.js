(function () {
  'use strict';
  var NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™', euro: '€', pound: '£', yen: '¥', cent: '¢', hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', divide: '÷', deg: '°', plusmn: '±', middot: '·', bull: '•' };
  function encode(s, nonAscii) {
    var out = s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    return nonAscii ? Array.from(out).map(function (ch) { var c = ch.codePointAt(0); return c > 126 ? '&#' + c + ';' : ch; }).join('') : out;
  }
  function decode(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, function (m, g) {
      if (g[0] === '#') { var c = g[1].toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10); return c > 0 && c <= 0x10ffff && !(c >= 0xd800 && c <= 0xdfff) ? String.fromCodePoint(c) : m; }
      return Object.prototype.hasOwnProperty.call(NAMED, g) ? NAMED[g] : m;
    });
  }
  var api = { encode: encode, decode: decode };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, i = document.getElementById('input'), o = document.getElementById('output'), na = document.getElementById('nonascii');
    document.getElementById('btn-encode').addEventListener('click', function () { S.trackUse(); if (!i.value) { S.showError('Enter some text first.'); return; } S.showError(''); o.value = encode(i.value, na.checked); S.track('tool_result', S.toolInfo()); });
    document.getElementById('btn-decode').addEventListener('click', function () { S.trackUse(); if (!i.value) { S.showError('Enter some text first.'); return; } S.showError(''); o.value = decode(i.value); S.track('tool_result', S.toolInfo()); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(o.value, this); });
    document.getElementById('btn-reset').addEventListener('click', function () { i.value = ''; o.value = ''; S.showError(''); });
  });
})();
