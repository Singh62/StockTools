(function () {
  'use strict';
  function toBinary(bytes) { var s = '', i; for (i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return s; }
  function encode(text, urlSafe) {
    var b64 = btoa(toBinary(new TextEncoder().encode(text)));
    return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
  }
  function decode(input) {
    var s = String(input).replace(/\s+/g, '');
    if (!s) return { error: 'Enter a Base64 string to decode.' };
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) return { error: 'This is not valid Base64 (unexpected characters or length).' };
    while (s.length % 4) s += '=';
    var bin;
    try { bin = atob(s); } catch (e) { return { error: 'This is not valid Base64.' }; }
    var bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    try { return { output: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }; }
    catch (e) { return { error: 'Decoded data is not valid UTF-8 text (it may be a binary file such as an image).' }; }
  }
  var api = { encode: encode, decode: decode };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, inp = document.getElementById('input'), out = document.getElementById('output'), us = document.getElementById('urlsafe');
    function done() { S.showError(''); S.track('tool_result', S.toolInfo()); }
    document.getElementById('btn-encode').addEventListener('click', function () {
      S.trackUse(); if (!inp.value) { S.showError('Enter some text to encode.'); return; }
      out.value = encode(inp.value, us.checked); done();
    });
    document.getElementById('btn-decode').addEventListener('click', function () {
      S.trackUse(); var r = decode(inp.value);
      if (r.error) { S.showError(r.error); out.value = ''; return; } out.value = r.output; done();
    });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(out.value, this); });
    document.getElementById('btn-reset').addEventListener('click', function () { inp.value = ''; out.value = ''; S.showError(''); inp.focus(); });
  });
})();
