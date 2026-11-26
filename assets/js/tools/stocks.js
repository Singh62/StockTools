(function () {
  'use strict';
  /* All stock calculators. Pure functions first (unit-tested), DOM wiring after; page picks one via <body data-mode>. */
  var pos = function (x) { return Number.isFinite(x) && x > 0; };

  function average(rows, opt) {
    var U = 0, C = 0, used = 0; opt = opt || {};
    for (var i = 0; i < rows.length; i++) {
      var u = rows[i].units, p = rows[i].price, blank = function (x) { return x === null || x === undefined || Number.isNaN(x); };
      if (blank(u) && blank(p)) continue;
      if (!pos(u) || !pos(p)) return { error: 'Purchase ' + (i + 1) + ': enter units and price greater than 0 (or clear both fields).' };
      U += u; C += u * p; used++;
    }
    if (!used) return { error: 'Enter at least one purchase.' };
    if (U > 1e12 || C > 1e15) return { error: 'Values are too large.' };
    var avg = C / U, r = { units: U, cost: C, avg: avg, purchases: used };
    if (pos(opt.currentPrice) && pos(opt.target)) {
      if (Math.abs(opt.target - avg) < 1e-9) r.plan = { already: true };
      else if (opt.target === opt.currentPrice) return { error: 'Target average cannot equal the current price (it would need infinite shares).' };
      else {
        var n = U * (avg - opt.target) / (opt.target - opt.currentPrice);
        if (!(n > 0)) return { error: 'Target must lie between your current average (' + avg.toFixed(2) + ') and the current price to be reachable.' };
        var q = Math.ceil(n - 1e-9); r.plan = { extraUnits: q, cost: q * opt.currentPrice, newAvg: (C + q * opt.currentPrice) / (U + q) };
      }
    }
    return r;
  }

  function profitLoss(o) {
    var b = o.buy, s = o.sell, q = o.qty, f = o.flatBrokerage || 0, p = o.chargesPct || 0;
    if (!pos(b) || !pos(s) || !pos(q)) return { error: 'Buy price, sell price and quantity must be greater than 0.' };
    if (!(f >= 0) || !(p >= 0) || p >= 50) return { error: 'Brokerage must be 0 or more and charges must be between 0% and 50%.' };
    var buyV = b * q, sellV = s * q, gross = sellV - buyV, brok = 2 * f, other = (buyV + sellV) * p / 100, net = gross - brok - other;
    return { invested: buyV, sellValue: sellV, gross: gross, brokerage: brok, otherCharges: other, charges: brok + other, net: net, returnPct: net / buyV * 100,
      breakeven: (b * q * (1 + p / 100) + 2 * f) / (q * (1 - p / 100)) };
  }

  function cagr(o) {
    if (!pos(o.start)) return { error: 'Starting value must be greater than 0.' };
    if (!(o.end >= 0)) return { error: 'Ending value must be 0 or more.' };
    if (!pos(o.years) || o.years > 100) return { error: 'Period must be greater than 0 and at most 100 years.' };
    var abs = (o.end / o.start - 1) * 100;
    return { cagr: (Math.pow(o.end / o.start, 1 / o.years) - 1) * 100, absolute: abs, gain: o.end - o.start };
  }

  function dividend(o) {
    if (!pos(o.price)) return { error: 'Share price must be greater than 0.' };
    if (!(o.dps >= 0)) return { error: 'Dividend per share must be 0 or more.' };
    var r = { yield: o.dps / o.price * 100 };
    if (pos(o.shares)) r.income = o.dps * o.shares;
    if (pos(o.avgBuy)) r.yieldOnCost = o.dps / o.avgBuy * 100;
    return r;
  }

  function positionSize(o) {
    if (!pos(o.capital) || !pos(o.entry) || !pos(o.stop)) return { error: 'Capital, entry and stop-loss must be greater than 0.' };
    if (!pos(o.riskPct) || o.riskPct > 100) return { error: 'Risk per trade must be between 0 and 100%.' };
    if (o.entry === o.stop) return { error: 'Entry and stop-loss cannot be the same price.' };
    var riskAmt = o.capital * o.riskPct / 100, per = Math.abs(o.entry - o.stop), qty = Math.floor(riskAmt / per + 1e-9);
    if (qty < 1) return { error: 'Your risk amount (' + riskAmt.toFixed(2) + ') is less than the loss on one share (' + per.toFixed(2) + '). Raise the risk %, widen capital or tighten the stop.' };
    var value = qty * o.entry;
    return { riskAmount: riskAmt, perShare: per, qty: qty, value: value, pctCapital: value / o.capital * 100, actualRisk: qty * per, side: o.stop < o.entry ? 'Long (buy)' : 'Short (sell)', exceedsCapital: value > o.capital };
  }

  function riskReward(o) {
    var e = o.entry, s = o.stop, t = o.target;
    if (!pos(e) || !pos(s) || !pos(t)) return { error: 'Entry, stop-loss and target must be greater than 0.' };
    var long = s < e && t > e, short = s > e && t < e;
    if (!long && !short) return { error: 'For a buy, stop-loss < entry < target. For a short sale, target < entry < stop-loss.' };
    var risk = Math.abs(e - s), reward = Math.abs(t - e), r = { side: long ? 'Long (buy)' : 'Short (sell)', risk: risk, reward: reward, ratio: reward / risk, breakEvenWin: risk / (risk + reward) * 100 };
    if (pos(o.qty)) { r.riskAmount = risk * o.qty; r.rewardAmount = reward * o.qty; }
    return r;
  }

  function pivots(o) {
    var h = o.high, l = o.low, c = o.close;
    if (!pos(h) || !pos(l) || !pos(c)) return { error: 'High, low and close must be greater than 0.' };
    if (h < l) return { error: 'High cannot be lower than low.' };
    if (c > h || c < l) return { error: 'Close must be between the low and the high.' };
    var p = (h + l + c) / 3, r = h - l;
    return { pivot: p, r1: 2 * p - l, r2: p + r, r3: h + 2 * (p - l), s1: 2 * p - h, s2: p - r, s3: l - 2 * (h - p) };
  }

  function margin(o) {
    if (!pos(o.price) || !pos(o.qty)) return { error: 'Price and quantity must be greater than 0.' };
    if (!pos(o.marginPct) || o.marginPct > 100) return { error: 'Margin must be between 0 and 100%.' };
    if (!Number.isFinite(o.movePct) || o.movePct < -100) return { error: 'Price move must be a number of -100% or more.' };
    var exp = o.price * o.qty, m = exp * o.marginPct / 100, lev = 100 / o.marginPct, pnl = exp * o.movePct / 100;
    return { exposure: exp, margin: m, leverage: lev, pnl: pnl, returnOnMargin: pnl / m * 100, wipeoutMove: -o.marginPct };
  }

  function splitBonus(o) {
    if (!pos(o.qty) || !pos(o.avg)) return { error: 'Quantity and average price must be greater than 0.' };
    if (!pos(o.a) || !pos(o.b)) return { error: 'Enter both parts of the ratio (greater than 0).' };
    var nq = o.type === 'split' ? o.qty * o.b / o.a : o.qty * (1 + o.a / o.b);
    var cost = o.qty * o.avg;
    return { newQty: nq, wholeShares: Math.floor(nq + 1e-9), newAvg: cost / nq, cost: cost };
  }

  function lumpsum(o) {
    if (!pos(o.amount)) return { error: 'Investment amount must be greater than 0.' };
    if (!(o.rate >= 0) || o.rate > 100) return { error: 'Expected return must be between 0 and 100% per year.' };
    if (!pos(o.years) || o.years > 100) return { error: 'Period must be greater than 0 and at most 100 years.' };
    var fv = o.amount * Math.pow(1 + o.rate / 100, o.years); if (!Number.isFinite(fv)) return { error: 'Result is too large.' };
    return { future: fv, gain: fv - o.amount };
  }
  function rule72(o) {
    var hasRate = Number.isFinite(o.rate) && o.rate !== 0, hasYears = pos(o.years);
    if (Number.isFinite(o.rate) && o.rate > 0) {
      if (o.rate > 1000) return { error: 'Rate is too large.' };
      return { kind: 'years', approx: 72 / o.rate, exact: Math.log(2) / Math.log(1 + o.rate / 100) };
    }
    if (hasYears) { if (o.years > 1000) return { error: 'Period is too large.' }; return { kind: 'rate', approx: 72 / o.years, exact: (Math.pow(2, 1 / o.years) - 1) * 100 }; }
    return { error: hasRate ? 'Rate must be greater than 0.' : 'Enter either a yearly return rate or the number of years.' };
  }
  function swp(o) {
    if (!pos(o.corpus)) return { error: 'Starting corpus must be greater than 0.' };
    if (!pos(o.withdrawal)) return { error: 'Monthly withdrawal must be greater than 0.' };
    if (!(o.rate >= 0) || o.rate > 100) return { error: 'Expected return must be between 0 and 100% per year.' };
    var n = Math.round(o.years * 12);
    if (!(o.years > 0) || n < 1 || n > 720 || Math.abs(o.years * 12 - n) > 0.01) return { error: 'Period must be a whole number of months, from 1 month up to 60 years.' };
    var i = o.rate / 1200, bal = o.corpus, paid = 0, m, path = [o.corpus];
    for (m = 1; m <= n; m++) { if (bal <= 0) break; var w = Math.min(o.withdrawal, bal); bal -= w; paid += w; bal *= 1 + i; path.push(bal > 0 ? bal : 0); }
    var lasted = bal > 0.005 ? n : m - 1;
    return { final: bal > 0.005 ? bal : 0, withdrawn: paid, monthsLasted: lasted, depleted: bal <= 0.005 && paid < o.withdrawal * n - 1e-6, returns: (bal > 0.005 ? bal : 0) + paid - o.corpus, path: path };
  }

  function curve(start, g, years) { var pts = [], y; for (y = 0; y < years; y++) pts.push([y, start * Math.pow(1 + g, y)]); pts.push([years, start * Math.pow(1 + g, years)]); return pts; }
  var api = { curve: curve, lumpsum: lumpsum, rule72: rule72, swp: swp, average: average, profitLoss: profitLoss, cagr: cagr, dividend: dividend, positionSize: positionSize, riskReward: riskReward, pivots: pivots, margin: margin, splitBonus: splitBonus };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  document.addEventListener('DOMContentLoaded', function () {
    var S = window.ST, f = document.getElementById('tool-form'), mode = document.body.dataset.mode, P = S.parseNumber;
    var n = function (name) { var v = f[name].value.trim(); return v === '' ? NaN : P(v); };
    var opt = function (name) { var v = f[name] && f[name].value.trim(); return v ? P(v) : 0; };
    var inr = function (x) { return S.fmtINR(x); }, num = function (x, d) { return S.fmtNum(S.round(x, 6), d === undefined ? 4 : d); };
    var pct = function (x) { return S.fmtNum(S.round(x, 2), 2) + '%'; };
    var st = S.stat, grid = function (arr) { return '<dl class="stats">' + arr.join('') + '</dl>'; };
    var H = {
      profit: function () { var r = profitLoss({ buy: n('buy'), sell: n('sell'), qty: n('qty'), flatBrokerage: opt('brok'), chargesPct: opt('chg') }); if (r.error) return r;
        return { html: grid([st(r.net >= 0 ? 'Net profit' : 'Net loss', inr(r.net), true), st('Return on investment', pct(r.returnPct)), st('Gross profit / loss', inr(r.gross)), st('Total charges', inr(r.charges)), st('Invested amount', inr(r.invested)), st('Break-even sell price', inr(r.breakeven))]) + '<div id="ch1" class="charts"></div>',
          copy: 'Net P/L: ' + inr(r.net) + ' (' + pct(r.returnPct) + '); charges ' + inr(r.charges) + '; break-even ' + inr(r.breakeven),
          after: function (out, a) { out.querySelector('#ch1') && window.ST_CHART.hbars(out.querySelector('#ch1'), [{ label: 'Gross P&L', value: r.gross }, { label: 'Brokerage', value: -r.brokerage }, { label: 'Other charges', value: -r.otherCharges }, { label: 'Net P&L', value: r.net, cls: r.net >= 0 ? 'pos strong' : 'neg strong' }], { animate: a }); } }; },
      cagr: function () { var r = cagr({ start: n('start'), end: n('end'), years: n('years') }); if (r.error) return r;
        var A = { start: n('start'), end: n('end'), years: n('years') };
        return { html: grid([st('CAGR', pct(r.cagr), true), st('Absolute return', pct(r.absolute)), st('Gain / loss', inr(r.gain))]) + '<div id="ch1" class="charts"></div>', copy: 'CAGR ' + pct(r.cagr) + ', absolute return ' + pct(r.absolute),
          after: function (out, a) { window.ST_CHART.line(out.querySelector('#ch1'), [{ name: 'Value at ' + pct(r.cagr) + ' a year', ci: 1, area: true, pts: curve(A.start, r.cagr / 100, A.years) }], { animate: a, label: 'Growth at constant CAGR' }); } }; },
      dividend: function () { var r = dividend({ dps: n('dps'), price: n('price'), shares: n('shares'), avgBuy: n('avgbuy') }); if (r.error) return r;
        return { html: grid([st('Dividend yield', pct(r.yield), true)].concat(r.income !== undefined ? [st('Annual dividend income', inr(r.income))] : [], r.yieldOnCost !== undefined ? [st('Yield on your cost', pct(r.yieldOnCost))] : [])), copy: 'Dividend yield ' + pct(r.yield) }; },
      position: function () { var r = positionSize({ capital: n('capital'), riskPct: n('risk'), entry: n('entry'), stop: n('stop') }); if (r.error) return r;
        return { html: grid([st('Quantity to trade', S.fmtNum(r.qty, 0), true), st('Position value', inr(r.value)), st('Share of capital', pct(r.pctCapital)), st('Risk amount allowed', inr(r.riskAmount)), st('Loss if stop hits', inr(r.actualRisk)), st('Side', r.side)]) + (r.exceedsCapital ? '<p class="notice">This position is larger than your capital, so it would need margin or leverage.</p>' : ''),
          copy: 'Qty ' + r.qty + ', value ' + inr(r.value) + ', risk ' + inr(r.actualRisk) }; },
      rr: function () { var r = riskReward({ entry: n('entry'), stop: n('stop'), target: n('tgt'), qty: n('qty') }); if (r.error) return r;
        return { html: grid([st('Risk : Reward', '1 : ' + S.fmtNum(S.round(r.ratio, 2), 2), true), st('Risk per share', inr(r.risk)), st('Reward per share', inr(r.reward)), st('Win rate needed to break even', pct(r.breakEvenWin)), st('Side', r.side)].concat(r.riskAmount !== undefined ? [st('Total risk', inr(r.riskAmount)), st('Total reward', inr(r.rewardAmount))] : [])) + '<div id="ch1" class="charts"></div>',
          copy: 'Risk:Reward 1:' + S.round(r.ratio, 2) + ', break-even win rate ' + pct(r.breakEvenWin),
          after: function (out, a) { window.ST_CHART.hbars(out.querySelector('#ch1'), [{ label: 'Risk', value: -r.risk, fmt: function (v) { return inr(-v) + '/share'; } }, { label: 'Reward', value: r.reward, fmt: function (v) { return inr(v) + '/share'; } }], { animate: a }); } }; },
      pivot: function () { var r = pivots({ high: n('high'), low: n('low'), close: n('close') }); if (r.error) return r;
        var row = function (k, v) { return '<tr><td>' + k + '</td><td>' + inr(v) + '</td></tr>'; };
        return { html: '<div class="table-wrap"><table><tbody>' + row('Resistance 3 (R3)', r.r3) + row('Resistance 2 (R2)', r.r2) + row('Resistance 1 (R1)', r.r1) + '<tr class="hl"><td>Pivot (P)</td><td>' + inr(r.pivot) + '</td></tr>' + row('Support 1 (S1)', r.s1) + row('Support 2 (S2)', r.s2) + row('Support 3 (S3)', r.s3) + '</tbody></table></div>',
          copy: ['R3 ' + r.r3, 'R2 ' + r.r2, 'R1 ' + r.r1, 'P ' + r.pivot, 'S1 ' + r.s1, 'S2 ' + r.s2, 'S3 ' + r.s3].map(function (x) { var p = x.split(' '); return p[0] + ' ' + S.round(+p[1], 2); }).join('\n') }; },
      margin: function () { var r = margin({ price: n('price'), qty: n('qty'), marginPct: n('margin'), movePct: f.move.value.trim() === '' ? 0 : P(f.move.value) }); if (r.error) return r;
        return { html: grid([st('Margin required', inr(r.margin), true), st('Total exposure', inr(r.exposure)), st('Leverage', S.fmtNum(S.round(r.leverage, 2), 2) + 'x'), st('Profit / loss at this move', inr(r.pnl)), st('Return on your margin', pct(r.returnOnMargin))]) + '<p class="muted">A ' + pct(Math.abs(r.wipeoutMove)) + ' adverse move would wipe out the margin (before charges).</p>', copy: 'Margin ' + inr(r.margin) + ', exposure ' + inr(r.exposure) + ', leverage ' + S.round(r.leverage, 2) + 'x' }; },
      lumpsum: function () { var r = lumpsum({ amount: n('amount'), rate: n('rate'), years: n('years') }); if (r.error) return r;
        return { html: grid([st('Future value', inr(r.future), true), st('Invested amount', inr(+f.amount.value.replace(/,/g, ''))), st('Estimated gain', inr(r.gain))]) + '<div class="charts"><div id="ch1"></div><div id="ch2"></div></div>', copy: 'Future value ' + inr(r.future) + ', gain ' + inr(r.gain),
          after: function (out, a) { var C = window.ST_CHART, P0 = n('amount'), y = n('years'); C.donut(out.querySelector('#ch1'), [{ label: 'Invested', value: P0 }, { label: 'Gain', value: r.gain }], { center: [inr(r.future), 'future value'], animate: a }); C.line(out.querySelector('#ch2'), [{ name: 'Invested', ci: 3, pts: [[0, P0], [y, P0]] }, { name: 'Value', ci: 1, area: true, pts: curve(P0, n('rate') / 100, y) }], { animate: a, label: 'Lumpsum growth' }); } }; },
      rule72: function () { var r = rule72({ rate: f.rate.value.trim() ? P(f.rate.value) : NaN, years: f.years.value.trim() ? P(f.years.value) : NaN }); if (r.error) return r;
        var a = S.fmtNum(S.round(r.approx, 2), 2), x = S.fmtNum(S.round(r.exact, 2), 2);
        return r.kind === 'years' ? { html: grid([st('Years to double (Rule of 72)', a + ' years', true), st('Exact', x + ' years')]), copy: 'Doubles in about ' + a + ' years (exact ' + x + ')' }
          : { html: grid([st('Return needed (Rule of 72)', a + '% a year', true), st('Exact', x + '% a year')]), copy: 'Needs about ' + a + '% a year (exact ' + x + '%)' }; },
      swp: function () { var r = swp({ corpus: n('corpus'), withdrawal: n('withdrawal'), rate: n('rate'), years: n('years') }); if (r.error) return r;
        return { html: grid([st(r.depleted ? 'Corpus lasts' : 'Balance at the end', r.depleted ? r.monthsLasted + ' months' : inr(r.final), true), st('Total withdrawn', inr(r.withdrawn)), st('Investment growth earned', inr(r.returns))]) + (r.depleted ? '<p class="notice">At this withdrawal the corpus runs out before the period ends.</p>' : '') + '<div id="ch1" class="charts"></div>', after: function (out, a) { var pts = [], m; for (m = 0; m < r.path.length; m += (r.path.length > 120 ? 12 : 1)) pts.push([m / 12, r.path[m]]); if ((r.path.length - 1) % (r.path.length > 120 ? 12 : 1)) pts.push([(r.path.length - 1) / 12, r.path[r.path.length - 1]]); window.ST_CHART.line(out.querySelector('#ch1'), [{ name: 'Remaining balance', ci: 1, area: true, pts: pts }], { animate: a, label: 'Corpus balance over time' }); }, copy: (r.depleted ? 'Corpus lasts ' + r.monthsLasted + ' months' : 'Final balance ' + inr(r.final)) + ', withdrawn ' + inr(r.withdrawn) }; },
      split: function () { var r = splitBonus({ type: f.type.value, qty: n('qty'), avg: n('avg'), a: n('a'), b: n('b') }); if (r.error) return r;
        return { html: grid([st('New quantity', num(r.newQty, 4), true), st('Adjusted average price', inr(r.newAvg)), st('Whole shares', S.fmtNum(r.wholeShares, 0)), st('Total cost (unchanged)', inr(r.cost))]), copy: 'New qty ' + num(r.newQty) + ', adjusted avg ' + inr(r.newAvg) }; }
    };
    if (mode === 'split') {
      var lab = document.getElementById('ratio-hint'), set = function () { var s = f.type.value === 'split'; document.getElementById('lbl-a').textContent = s ? 'Old shares' : 'Bonus shares'; document.getElementById('lbl-b').textContent = s ? 'New shares' : 'For every held'; lab.textContent = s ? 'Split 1 → 5 means 1 share becomes 5.' : 'Bonus 1:1 means 1 free share for every 1 held.'; };
      f.type.addEventListener('change', set); set(); S.onReset = set;
    }
    if (mode === 'average') return initAverage(f, S);
    S.bindCalculator(f, H[mode]);
  });

  function initAverage(f, S) {
    var wrap = document.getElementById('rows'), add = document.getElementById('add-row'), MAX = 20;
    var ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth'];
    function row(i) { var d = document.createElement('div'); d.className = 'pcol'; d.innerHTML = '<h3><span class="ttl"></span><button type="button" class="x" aria-label="Remove this purchase" title="Remove">×</button></h3><label>Units<input type="text" inputmode="decimal" autocomplete="off" data-k="u"></label><label>Price per share<input type="text" inputmode="decimal" autocomplete="off" data-k="p"></label>'; return d; }
    function relabel() { var kids = wrap.children; for (var i = 0; i < kids.length; i++) { kids[i].querySelector('.ttl').textContent = ORD[i] + ' Purchase'; kids[i].querySelector('.x').hidden = kids.length < 2; } add.hidden = kids.length >= MAX; }
    function build() { wrap.innerHTML = ''; wrap.appendChild(row(0)); wrap.appendChild(row(1)); relabel(); }
    add.addEventListener('click', function () { if (wrap.children.length < MAX) { wrap.appendChild(row(wrap.children.length)); relabel(); wrap.lastChild.querySelector('input').focus(); f.dispatchEvent(new Event('input')); } });
    wrap.addEventListener('click', function (e) { var x = e.target.closest('.x'); if (!x || wrap.children.length < 2) return; x.closest('.pcol').remove(); relabel(); f.dispatchEvent(new Event('input')); });
    build(); S.onReset = build;
    var val = function (el) { var v = el.value.trim(); return v === '' ? NaN : S.parseNumber(v); };
    S.bindCalculator(f, function () {
      var rows = [].map.call(wrap.children, function (d) { return { units: val(d.querySelector('[data-k=u]')), price: val(d.querySelector('[data-k=p]')) }; });
      var r = average(rows, { currentPrice: f.cur.value.trim() ? S.parseNumber(f.cur.value) : NaN, target: f.tgt.value.trim() ? S.parseNumber(f.tgt.value) : NaN });
      if (r.error) return r;
      var h = '<dl class="stats">' + S.stat('Average price per share', S.fmtINR(r.avg), true) + S.stat('Total units', S.fmtNum(r.units, 4)) + S.stat('Total invested', S.fmtINR(r.cost)) + '</dl>', c = 'Average price ' + S.fmtINR(r.avg) + ', units ' + S.fmtNum(r.units, 4) + ', invested ' + S.fmtINR(r.cost);
      if (r.plan) { if (r.plan.already) h += '<p class="muted">Your average already equals the target.</p>'; else { h += '<h3>To reach your target average</h3><dl class="stats">' + S.stat('Buy additional units', S.fmtNum(r.plan.extraUnits, 0), true) + S.stat('Cost at current price', S.fmtINR(r.plan.cost)) + S.stat('New average', S.fmtINR(r.plan.newAvg)) + '</dl>'; c += '; buy ' + r.plan.extraUnits + ' more for avg ' + S.fmtINR(r.plan.newAvg); } }
      h += '<div id="ch1" class="charts"></div>';
      return { html: h, copy: c, after: function (out, a) { var sl = []; rows.forEach(function (x, k) { if (x.units > 0 && x.price > 0) sl.push({ label: 'Purchase ' + (k + 1) + ' (' + S.fmtNum(x.units, 4) + ' @ ' + S.fmtINR(x.price) + ')', value: x.units * x.price }); }); window.ST_CHART.donut(out.querySelector('#ch1'), sl, { center: [S.fmtINR(r.avg), 'average'], animate: a }); } };
    });
  }
})();
