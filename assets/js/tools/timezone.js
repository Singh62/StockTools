(function () {
  'use strict';
  var ZONES = [['Asia/Kolkata', 'India (IST)'], ['UTC', 'UTC'], ['Europe/London', 'London'], ['Europe/Berlin', 'Berlin / Paris'], ['Asia/Dubai', 'Dubai'], ['Asia/Singapore', 'Singapore'], ['Asia/Tokyo', 'Tokyo'], ['Australia/Sydney', 'Sydney'], ['America/New_York', 'New York'], ['America/Chicago', 'Chicago'], ['America/Los_Angeles', 'Los Angeles'], ['Pacific/Auckland', 'Auckland']];
  function offset(ms, zone) { // minutes east of UTC at instant ms
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = +x.value; });
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000;
  }
  function toUtc(str, zone) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(str || ''); if (!m) return { error: 'Pick a valid date and time.' };
    var guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), o1 = offset(guess, zone), utc = guess - o1 * 60000, o2 = offset(utc, zone);
    if (o2 !== o1) utc = guess - o2 * 60000; return { ms: utc };
  }
  function fmt(ms, zone) { return new Intl.DateTimeFormat('en-IN', { timeZone: zone, dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(ms)); }
  function convert(str, from, to) { var r = toUtc(str, from); return r.error ? r : { ms: r.ms, text: fmt(r.ms, to) }; }
  var api = { convert: convert, offset: offset, toUtc: toUtc, ZONES: ZONES };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST, opts = ZONES.map(function (z) { return '<option value="' + z[0] + '">' + z[1] + '</option>'; }).join('');
    f.from.innerHTML = opts; f.to.innerHTML = opts; f.to.value = 'UTC';
    function setNow() { var n = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; f.dt.value = n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()) + 'T' + p(n.getHours()) + ':' + p(n.getMinutes()); f.from.value = 'Asia/Kolkata'; }
    setNow(); S.onReset = function () { f.to.value = 'UTC'; setNow(); };
    S.bindCalculator(f, function () {
      var r = convert(f.dt.value, f.from.value, f.to.value); if (r.error) return r;
      var all = ZONES.map(function (z) { return '<tr><td>' + z[1] + '</td><td>' + S.esc(fmt(r.ms, z[0])) + '</td></tr>'; }).join('');
      return { html: '<dl class="stats">' + S.stat(f.to.options[f.to.selectedIndex].text, r.text, true) + '</dl><h3>Same moment elsewhere</h3><div class="table-wrap"><table><tbody>' + all + '</tbody></table></div>', copy: r.text };
    });
  });
})();
