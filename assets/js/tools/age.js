(function () {
  'use strict';
  var dim = function (y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }; // m is 1-12
  var utc = function (d) { return Date.UTC(d.y, d.m - 1, d.d); };
  var daysBetween = function (a, b) { return Math.round((utc(b) - utc(a)) / 86400000); };
  var cmp = function (a, b) { return utc(a) - utc(b); };
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null;
    var d = { y: +m[1], m: +m[2], d: +m[3] };
    return d.m >= 1 && d.m <= 12 && d.d >= 1 && d.d <= dim(d.y, d.m) ? d : null;
  }
  function anchor(dob, tm) { // dob + tm months, day clamped to month length
    var idx = dob.m - 1 + tm, y = dob.y + Math.floor(idx / 12), m = idx % 12 + 1;
    return { y: y, m: m, d: Math.min(dob.d, dim(y, m)) };
  }
  function age(dobStr, asOfStr) {
    var dob = parseISO(dobStr), asOf = parseISO(asOfStr);
    if (!dob) return { error: 'Enter a valid date of birth.' };
    if (!asOf) return { error: 'Enter a valid "age at" date.' };
    if (dob.y < 1900) return { error: 'Date of birth must be in 1900 or later.' };
    if (asOf.y > 2200) return { error: 'The "age at" date is too far in the future.' };
    if (cmp(dob, asOf) > 0) return { error: 'Date of birth cannot be after the "age at" date.' };
    var tm = (asOf.y - dob.y) * 12 + (asOf.m - dob.m);
    if (cmp(anchor(dob, tm), asOf) > 0) tm--;
    var a = anchor(dob, tm), next = { y: asOf.y, m: dob.m, d: Math.min(dob.d, dim(asOf.y, dob.m)) };
    if (cmp(next, asOf) < 0) next = { y: asOf.y + 1, m: dob.m, d: Math.min(dob.d, dim(asOf.y + 1, dob.m)) };
    var total = daysBetween(dob, asOf);
    return {
      years: Math.floor(tm / 12), months: tm % 12, days: daysBetween(a, asOf),
      totalMonths: tm, totalWeeks: Math.floor(total / 7), totalDays: total,
      daysToBirthday: daysBetween(asOf, next), nextBirthday: next,
      weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(utc(dob)).getUTCDay()]
    };
  }
  var api = { age: age, parseISO: parseISO };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('tool-form'), S = window.ST;
    function today() { var n = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()); }
    function setToday() { f.asof.value = today(); }
    setToday(); S.onReset = setToday;
    S.bindCalculator(f, function () {
      var r = age(f.dob.value, f.asof.value);
      if (r.error) return r;
      var nb = r.nextBirthday, ds = new Date(Date.UTC(nb.y, nb.m - 1, nb.d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      var main = r.years + ' years, ' + r.months + ' months, ' + r.days + ' days';
      return {
        html: '<dl class="stats">' + S.stat('Age', main, true) + S.stat('Total months', S.fmtNum(r.totalMonths, 0)) + S.stat('Total weeks', S.fmtNum(r.totalWeeks, 0)) + S.stat('Total days', S.fmtNum(r.totalDays, 0)) +
          S.stat('Next birthday', r.daysToBirthday === 0 ? 'Today 🎉' : ds + ' (in ' + r.daysToBirthday + ' days)') + S.stat('Born on a', r.weekday) + '</dl>',
        copy: 'Age: ' + main + '\nTotal days: ' + r.totalDays + '\nNext birthday: ' + ds
      };
    });
  });
})();
