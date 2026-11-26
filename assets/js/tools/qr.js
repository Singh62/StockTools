(function () {
  'use strict';
  var lib = typeof module === 'object' && module.exports ? require('../vendor/qrcode.js') : window.qrcode;
  lib.stringToBytes = lib.stringToBytesFuncs['UTF-8'];
  function matrix(text, ecc) {
    if (!text) return { error: 'Enter some text or a URL first.' };
    try {
      var q = lib(0, ecc || 'M'); q.addData(text, 'Byte'); q.make();
      var n = q.getModuleCount(), rows = [];
      for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < n; c++) row.push(q.isDark(r, c)); rows.push(row); }
      return { rows: rows, size: n };
    } catch (e) { return { error: 'This text is too long for a QR code at this error-correction level. Shorten it or choose a lower level.' }; }
  }
  function lum(hex) {
    var v = [1, 3, 5].map(function (i) { var c = parseInt(hex.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  var api = { matrix: matrix, contrast: contrast };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), cv = document.getElementById('qr-canvas'), box = document.getElementById('result'), ok = false, t;
    var copyImg = document.getElementById('copy-btn'), dl = document.getElementById('download-btn');
    if (!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)) copyImg.remove();
    function draw() {
      var m = matrix(f.text.value.trim(), f.ecc.value);
      if (m.error) { S.showError(m.error); box.hidden = true; ok = false; return false; }
      if (contrast(f.fg.value, f.bg.value) < 3) { S.showError('Low contrast between the two colours: the code may not scan. Use a dark foreground on a light background.'); box.hidden = true; ok = false; return false; }
      S.showError('');
      var quiet = 4, total = m.size + quiet * 2, scale = Math.max(1, Math.floor(Number(f.size.value) / total)), px = total * scale;
      cv.width = cv.height = px;
      var g = cv.getContext('2d'); g.fillStyle = f.bg.value; g.fillRect(0, 0, px, px); g.fillStyle = f.fg.value;
      for (var r = 0; r < m.size; r++) for (var c = 0; c < m.size; c++) if (m.rows[r][c]) g.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      box.hidden = false; ok = true; return true;
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); S.trackUse(); if (draw()) S.track('tool_result', S.toolInfo()); });
    f.addEventListener('input', function () { S.trackUse(); if (ok) { clearTimeout(t); t = setTimeout(draw, 250); } });
    f.addEventListener('reset', function () { setTimeout(function () { ok = false; box.hidden = true; S.showError(''); }, 0); });
    dl.addEventListener('click', function () { var a = document.createElement('a'); a.download = 'qr-code.png'; a.href = cv.toDataURL('image/png'); a.click(); S.track('tool_download', S.toolInfo()); });
    if (copyImg.isConnected) copyImg.addEventListener('click', function () {
      var b = this; cv.toBlob(function (blob) { navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () { b.textContent = 'Copied ✓'; S.track('copy_result', S.toolInfo()); setTimeout(function () { b.textContent = 'Copy image'; }, 1500); }, function () { S.showError('Your browser blocked copying the image. Use Download instead.'); }); });
    });
  });
})();
