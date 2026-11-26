(function () {
  'use strict';
  function clock(ms, cs) {
    ms = Math.max(0, Math.floor(ms)); var h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, p = function (x, n) { return String(x).padStart(n || 2, '0'); };
    return (h ? p(h) + ':' : '') + p(m) + ':' + p(s) + (cs ? '.' + p(Math.floor(ms % 1000 / 10)) : '');
  }
  function beep() { try { var C = window.AudioContext || window.webkitAudioContext, c = new C(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); g.gain.value = .08; o.frequency.value = 880; o.start(); setTimeout(function () { o.stop(); c.close(); }, 450); } catch (e) { /* audio unavailable */ } }
  /* Interval that is always cleared on page hide/unload. */
  function ticker(fn, ms) { var id = setInterval(fn, ms); function stop() { clearInterval(id); window.removeEventListener('pagehide', stop); } window.addEventListener('pagehide', stop); return stop; }
  var api = { clock: clock, beep: beep, ticker: ticker };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  window.ST_TIMER = api;
})();
