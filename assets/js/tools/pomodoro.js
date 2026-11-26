(function () {
  'use strict';
  var PHASES = { work: 'Focus', short: 'Short break', long: 'Long break' };
  function next(phase, doneWork) { if (phase !== 'work') return 'work'; return doneWork % 4 === 0 ? 'long' : 'short'; }
  function minutes(v, def) { v = Number(v); return Number.isInteger(v) && v >= 1 && v <= 180 ? v : null; }
  var api = { next: next, minutes: minutes };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, T = window.ST_TIMER, f = document.getElementById('tool-form'), disp = document.getElementById('display'), lbl = document.getElementById('phase'), cnt = document.getElementById('count'), bs = document.getElementById('btn-start'), skip = document.getElementById('btn-skip');
    var phase = 'work', done = 0, end = 0, left = 0, stop = null, title = document.title;
    function len() { var m = minutes(f[phase].value); return m === null ? null : m * 60000; }
    function paint() { disp.textContent = T.clock(Math.ceil(left / 1000) * 1000); lbl.textContent = PHASES[phase]; cnt.textContent = done; document.title = disp.textContent + ' ' + PHASES[phase] + ' – ' + title; }
    function load() { var l = len(); if (l === null) { S.showError('Each length must be a whole number of minutes from 1 to 180.'); return false; } S.showError(''); left = l; return true; }
    function tick() { left = end - Date.now(); if (left <= 0) { complete(); return; } paint(); }
    function complete() { if (stop) stop(); stop = null; if (phase === 'work') { done++; S.track('tool_result', S.toolInfo()); } if (f.sound.checked) T.beep(); phase = next(phase, done); if (load()) { paint(); bs.textContent = 'Start'; } }
    bs.addEventListener('click', function () {
      S.trackUse();
      if (stop) { left = end - Date.now(); stop(); stop = null; bs.textContent = 'Resume'; return; }
      if (!(left > 0) && !load()) return;
      end = Date.now() + left; bs.textContent = 'Pause'; tick(); stop = T.ticker(tick, 250);
    });
    skip.addEventListener('click', function () { if (stop) stop(); stop = null; phase = next(phase, phase === 'work' ? done + 1 : done); if (load()) { paint(); bs.textContent = 'Start'; } });
    document.getElementById('btn-reset').addEventListener('click', function () { if (stop) stop(); stop = null; phase = 'work'; done = 0; left = 0; document.title = title; if (load()) { paint(); document.title = title; } bs.textContent = 'Start'; });
    ['work', 'short', 'long'].forEach(function (k) { f[k].addEventListener('change', function () { if (!stop && load()) paint(); }); });
    if (load()) { disp.textContent = T.clock(left); lbl.textContent = PHASES[phase]; }
  });
})();
