(function () {
  'use strict';
  function parse(h, m, s) {
    if (![h, m, s].every(function (x) { return Number.isInteger(x) && x >= 0; })) return { error: 'Enter whole numbers (0 or more) for hours, minutes and seconds.' };
    if (m > 59 || s > 59) return { error: 'Minutes and seconds must be 59 or less.' };
    if (h > 99) return { error: 'Hours cannot exceed 99.' };
    var ms = ((h * 60 + m) * 60 + s) * 1000; return ms > 0 ? { ms: ms } : { error: 'Set a time greater than zero.' };
  }
  var api = { parse: parse };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, T = window.ST_TIMER, f = document.getElementById('tool-form'), disp = document.getElementById('display'), msg = document.getElementById('done-msg'), bs = document.getElementById('btn-start');
    var end = 0, left = 0, stop = null, total = 0, title = document.title;
    function tick() { left = end - Date.now(); if (left <= 0) { finish(); return; } disp.textContent = T.clock(Math.ceil(left / 1000) * 1000); document.title = disp.textContent + ' – ' + title; }
    function finish() { if (stop) stop(); stop = null; left = 0; disp.textContent = '00:00'; document.title = title; msg.hidden = false; bs.textContent = 'Start'; if (f.sound.checked) T.beep(); S.track('tool_result', S.toolInfo()); }
    function num(n) { var v = f[n].value.trim(); return v === '' ? 0 : S.parseNumber(v); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); S.trackUse(); msg.hidden = true;
      if (stop) { left = end - Date.now(); stop(); stop = null; bs.textContent = 'Resume'; return; }
      if (left <= 0) { var p = parse(num('h'), num('m'), num('s')); if (p.error) { S.showError(p.error); return; } left = total = p.ms; }
      S.showError(''); end = Date.now() + left; bs.textContent = 'Pause'; tick(); stop = T.ticker(tick, 250);
    });
    f.addEventListener('reset', function () { setTimeout(function () { if (stop) stop(); stop = null; left = 0; msg.hidden = true; bs.textContent = 'Start'; disp.textContent = '00:00'; document.title = title; S.showError(''); }, 0); });
  });
})();
