(function () {
  'use strict';
  function fromNumber(n) {
    if (!Number.isFinite(n)) return { error: 'Enter a valid number.' };
    var unit = Math.abs(n) >= 1e11 ? 'milliseconds' : 'seconds', ms = unit === 'seconds' ? n * 1000 : n;
    var d = new Date(ms); if (isNaN(d.getTime())) return { error: 'That timestamp is outside the supported date range.' };
    return { unit: unit, ms: Math.round(ms), seconds: Math.floor(ms / 1000), iso: d.toISOString(), utc: d.toUTCString(),
      ist: new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d) + ' IST' };
  }
  function fromParts(str, zone) { // 'YYYY-MM-DDTHH:mm[:ss]'
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(str || ''); if (!m) return { error: 'Pick a valid date and time.' };
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)); if (zone === 'ist') ms -= 330 * 60000;
    var d = new Date(ms); if (isNaN(d.getTime())) return { error: 'Date is out of range.' };
    return { ms: ms, seconds: Math.floor(ms / 1000) };
  }
  var api = { fromNumber: fromNumber, fromParts: fromParts };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), a = document.getElementById('out-a'), b = document.getElementById('out-b');
    function now() { var n = Math.floor(Date.now() / 1000); f.ts.value = n; }
    document.getElementById('btn-now').addEventListener('click', function () { S.trackUse(); now(); show(); });
    function show() {
      var r = fromNumber(S.parseNumber(f.ts.value)); if (r.error) { S.showError(r.error); a.innerHTML = ''; return; } S.showError('');
      a.innerHTML = '<dl class="stats">' + S.stat('Detected unit', r.unit) + S.stat('UTC (ISO 8601)', r.iso, true) + S.stat('UTC', r.utc) + S.stat('India (IST)', r.ist) + S.stat('Your local time', new Date(r.ms).toString()) + '</dl>';
      S.track('tool_result', S.toolInfo());
    }
    function toTs() {
      var r = fromParts(f.dt.value, f.zone.value); if (r.error) { S.showError(r.error); b.innerHTML = ''; return; }
      if (f.zone.value === 'local') { var d = new Date(f.dt.value); r = { ms: d.getTime(), seconds: Math.floor(d.getTime() / 1000) }; }
      S.showError(''); b.innerHTML = '<dl class="stats">' + S.stat('Unix seconds', String(r.seconds), true) + S.stat('Unix milliseconds', String(r.ms)) + '</dl>'; S.track('tool_result', S.toolInfo());
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); S.trackUse(); show(); });
    document.getElementById('btn-todate').addEventListener('click', function () { S.trackUse(); toTs(); });
    f.addEventListener('reset', function () { setTimeout(function () { a.innerHTML = ''; b.innerHTML = ''; S.showError(''); }, 0); });
    document.getElementById('copy-btn').addEventListener('click', function () { S.copyText((a.innerText + '\n' + b.innerText).trim(), this); });
  });
})();
