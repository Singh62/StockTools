(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, T = window.ST_TIMER, disp = document.getElementById('display'), laps = document.getElementById('laps'), b = {};
    ['start', 'lap', 'reset'].forEach(function (k) { b[k] = document.getElementById('btn-' + k); });
    var base = 0, startedAt = 0, stop = null, lapList = [], lastLap = 0;
    var elapsed = function () { return base + (startedAt ? performance.now() - startedAt : 0); };
    function paint() { disp.textContent = T.clock(elapsed(), true); }
    function text() { return lapList.map(function (l, i) { return 'Lap ' + (i + 1) + ': ' + T.clock(l.split, true) + ' (total ' + T.clock(l.total, true) + ')'; }).join('\n') || disp.textContent; }
    b.start.addEventListener('click', function () {
      S.trackUse();
      if (startedAt) { base = elapsed(); startedAt = 0; stop(); stop = null; b.start.textContent = 'Resume'; b.lap.disabled = true; paint(); S.track('tool_result', S.toolInfo()); }
      else { startedAt = performance.now(); stop = T.ticker(paint, 33); b.start.textContent = 'Stop'; b.lap.disabled = false; }
    });
    b.lap.addEventListener('click', function () { var t = elapsed(); lapList.unshift({ split: t - lastLap, total: t }); lastLap = t; render(); });
    function render() { laps.innerHTML = lapList.map(function (l, i) { return '<tr><td>' + (lapList.length - i) + '</td><td>' + T.clock(l.split, true) + '</td><td>' + T.clock(l.total, true) + '</td></tr>'; }).join(''); document.getElementById('laps-wrap').hidden = !lapList.length; }
    b.reset.addEventListener('click', function () { if (stop) stop(); stop = null; base = 0; startedAt = 0; lastLap = 0; lapList = []; b.start.textContent = 'Start'; b.lap.disabled = true; paint(); render(); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText(text(), this); });
    paint(); render();
  });
})();
