(function () {
  'use strict';
  var dim = function (y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  var utc = function (d) { return Date.UTC(d.y, d.m - 1, d.d); };
  var days = function (a, b) { return Math.round((utc(b) - utc(a)) / 86400000); };
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; var d = { y: +m[1], m: +m[2], d: +m[3] }; return d.m >= 1 && d.m <= 12 && d.d >= 1 && d.d <= dim(d.y, d.m) ? d : null; }
  function anchor(a, tm) { var idx = a.m - 1 + tm, y = a.y + Math.floor(idx / 12), m = idx % 12 + 1; return { y: y, m: m, d: Math.min(a.d, dim(y, m)) }; }
  function diff(s1, s2, inclusive) {
    var a = parse(s1), b = parse(s2);
    if (!a || !b) return { error: 'Enter two valid dates.' };
    if (a.y < 1 || b.y > 9999) return { error: 'Dates must be between years 1 and 9999.' };
    var swapped = utc(a) > utc(b); if (swapped) { var t = a; a = b; b = t; }
    var tm = (b.y - a.y) * 12 + (b.m - a.m); if (utc(anchor(a, tm)) > utc(b)) tm--;
    var total = days(a, b) + (inclusive ? 1 : 0), wd = 0, start = utc(a), n = days(a, b) + (inclusive ? 1 : 0);
    var full = Math.floor(n / 7), rem = n % 7, dow = new Date(start).getUTCDay(); wd = full * 5; for (var i = 0; i < rem; i++) { var x = (dow + i) % 7; if (x !== 0 && x !== 6) wd++; }
    return { years: Math.floor(tm / 12), months: tm % 12, days: days(anchor(a, tm), b) + (inclusive ? 1 : 0), totalDays: total, weeks: Math.floor(total / 7), weekRemDays: total % 7, weekdays: wd, swapped: swapped };
  }
  var api = { diff: diff };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    S.bindCalculator(f, function () {
      var r = diff(f.d1.value, f.d2.value, f.incl.checked); if (r.error) return r;
      var main = r.years + ' years, ' + r.months + ' months, ' + r.days + ' days';
      return { html: '<dl class="stats">' + S.stat('Difference', main, true) + S.stat('Total days', S.fmtNum(r.totalDays, 0)) + S.stat('Weeks', r.weeks + ' weeks ' + r.weekRemDays + ' days') + S.stat('Weekdays (Mon–Fri)', S.fmtNum(r.weekdays, 0)) + '</dl>' + (r.swapped ? '<p class="muted">The start date was after the end date, so the dates were swapped.</p>' : '') + '<p class="muted">Weekdays exclude Saturdays and Sundays only; public holidays are not considered.</p>', copy: main + '\nTotal days: ' + r.totalDays };
    });
  });
})();
