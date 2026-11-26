/* Tiny SVG/CSS charts (no library): donut, line/area, stacked bars, signed h-bars. Animated, hoverable, theme-aware. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', reg = [], tip, rt;
  var still = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var inr = function (n) { return (window.ST ? window.ST.fmtINR(n, 0) : n); };
  function ax(n) { var a = Math.abs(n); return (n < 0 ? '-' : '') + '₹' + (a >= 1e7 ? +(a / 1e7).toFixed(2) + 'Cr' : a >= 1e5 ? +(a / 1e5).toFixed(1) + 'L' : a >= 1e3 ? +(a / 1e3).toFixed(1) + 'K' : Math.round(a)); }
  function mk(tag, at, par) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (par) par.appendChild(n); return n; }
  function showTip(html, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'ctip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.innerHTML = html; tip.style.display = 'block';
    var w = tip.offsetWidth, h = tip.offsetHeight, L = x + 14; if (L + w > innerWidth - 6) L = x - w - 14;
    tip.style.left = Math.max(6, L) + 'px'; tip.style.top = Math.max(6, Math.min(y - h / 2, innerHeight - h - 6)) + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function register(el, draw) { reg = reg.filter(function (r) { return document.contains(r.el) && r.el !== el; }); reg.push({ el: el, draw: draw }); }
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { reg = reg.filter(function (r) { return document.contains(r.el); }); reg.forEach(function (r) { r.draw(false); }); }, 150); });

  /* ---- donut: slices [{label,value,c}], o {center:[big,small], animate} ---- */
  function donut(el, slices, o) {
    function draw(anim) {
      o = o || {}; el.innerHTML = ''; var total = slices.reduce(function (s, x) { return s + Math.max(0, x.value); }, 0); if (!(total > 0)) return;
      var wrap = document.createElement('div'); wrap.className = 'donut'; el.appendChild(wrap);
      var svg = mk('svg', { viewBox: '0 0 120 120', role: 'img', 'aria-label': slices.map(function (s) { return s.label + ' ' + Math.round(s.value / total * 100) + '%'; }).join(', ') }, wrap);
      var R = 46, C = 2 * Math.PI * R, off = 0, circles = [];
      slices.forEach(function (s, i) {
        var len = Math.max(0, s.value) / total * C, c = mk('circle', { cx: 60, cy: 60, r: R, fill: 'none', 'stroke-width': 15, transform: 'rotate(-90 60 60)', 'stroke-dashoffset': -off, 'stroke-dasharray': (anim && !still() ? '0 ' + C : len + ' ' + (C - len)) }, svg);
        c.style.stroke = 'var(--c' + ((i % 6) + 1) + ')'; c.style.transition = 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1) ' + (i * .12) + 's, stroke-width .15s';
        if (anim && !still()) requestAnimationFrame(function () { requestAnimationFrame(function () { c.setAttribute('stroke-dasharray', len + ' ' + (C - len)); }); });
        function on(e) { c.setAttribute('stroke-width', 18); showTip('<b>' + esc(s.label) + '</b><br>' + (s.fmt ? s.fmt(s.value) : inr(s.value)) + ' · ' + (s.value / total * 100).toFixed(1) + '%', e.clientX, e.clientY); }
        c.addEventListener('pointermove', on); c.addEventListener('pointerleave', function () { c.setAttribute('stroke-width', 15); hideTip(); });
        off += len; circles.push(c);
      });
      if (o.center) { var t = mk('text', { x: 60, y: 59, 'text-anchor': 'middle', class: 'dn-big' }, svg); t.textContent = o.center[0]; var u = mk('text', { x: 60, y: 73, 'text-anchor': 'middle', class: 'dn-sub' }, svg); u.textContent = o.center[1] || ''; }
      var lg = document.createElement('ul'); lg.className = 'legend';
      slices.forEach(function (s, i) { var li = document.createElement('li'); li.innerHTML = '<i style="background:var(--c' + ((i % 6) + 1) + ')"></i>' + esc(s.label) + ' <b>' + (s.fmt ? s.fmt(s.value) : inr(s.value)) + '</b>'; li.addEventListener('pointerenter', function () { circles[i].setAttribute('stroke-width', 18); }); li.addEventListener('pointerleave', function () { circles[i].setAttribute('stroke-width', 15); }); lg.appendChild(li); });
      wrap.appendChild(lg);
    }
    draw(!(o && o.animate === false)); register(el, draw);
  }

  /* ---- line/area: series [{name,c,pts:[[x,y],..],area}], o {xfmt, yfmt, xlabel, animate} ---- */
  function line(el, series, o) {
    o = o || {};
    function draw(anim) {
      el.innerHTML = ''; var W = Math.max(260, el.clientWidth || 560), H = 230, m = { l: 52, r: 12, t: 12, b: 26 };
      var xs = series[0].pts.map(function (p) { return p[0]; }), x0 = xs[0], x1 = xs[xs.length - 1] || 1, ymax = 0;
      series.forEach(function (s) { s.pts.forEach(function (p) { if (p[1] > ymax) ymax = p[1]; }); }); if (!(ymax > 0)) ymax = 1;
      var step = Math.pow(10, Math.floor(Math.log10(ymax))), nice = [1, 2, 4, 8, 10].map(function (k) { return k * step; }).filter(function (v) { return v >= ymax / 1 && v / 4 >= 0; })[0] || ymax; ymax = nice;
      var X = function (x) { return m.l + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (W - m.l - m.r); }, Y = function (y) { return H - m.b - y / ymax * (H - m.t - m.b); };
      var lg = document.createElement('ul'); lg.className = 'legend'; lg.innerHTML = series.map(function (s, i) { return '<li><i style="background:var(--c' + (s.ci || i + 1) + ')"></i>' + esc(s.name) + '</li>'; }).join(''); el.appendChild(lg);
      var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': o.label || 'Chart' }, el); svg.style.display = 'block';
      for (var g = 0; g <= 4; g++) { var yv = ymax * g / 4; mk('line', { x1: m.l, x2: W - m.r, y1: Y(yv), y2: Y(yv), class: 'gl' }, svg); var tl = mk('text', { x: m.l - 6, y: Y(yv) + 3, 'text-anchor': 'end', class: 'tk' }, svg); tl.textContent = (o.yfmt || ax)(yv); }
      var nt = Math.min(6, xs.length); for (var k = 0; k < nt; k++) { var xv = x0 + (x1 - x0) * k / Math.max(1, nt - 1), tx = mk('text', { x: X(xv), y: H - 8, 'text-anchor': k === 0 ? 'start' : k === nt - 1 ? 'end' : 'middle', class: 'tk' }, svg); tx.textContent = (o.xfmt || function (v) { return Math.round(v * 10) / 10; })(xv); }
      series.forEach(function (s, i) {
        var d = s.pts.map(function (p, j) { return (j ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
        if (s.area) { var a = mk('path', { d: d + 'L' + X(x1) + ' ' + Y(0) + 'L' + X(x0) + ' ' + Y(0) + 'Z', class: 'area' }, svg); a.style.fill = 'var(--c' + (s.ci || i + 1) + ')'; if (anim && !still()) { a.style.opacity = 0; a.style.transition = 'opacity 1s .4s'; requestAnimationFrame(function () { requestAnimationFrame(function () { a.style.opacity = .16; }); }); } }
        var p = mk('path', { d: d, class: 'ln', pathLength: 1 }, svg); p.style.stroke = 'var(--c' + (s.ci || i + 1) + ')';
        if (anim && !still()) { p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; p.style.transition = 'stroke-dashoffset 1.1s ease-out ' + (i * .15) + 's'; requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.strokeDashoffset = 0; }); }); }
      });
      var cur = mk('line', { y1: m.t, y2: H - m.b, class: 'cur' }, svg); cur.style.display = 'none'; var dots = series.map(function (s, i) { var c = mk('circle', { r: 4, class: 'pt' }, svg); c.style.stroke = 'var(--c' + (s.ci || i + 1) + ')'; c.style.display = 'none'; return c; });
      var hit = mk('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' }, svg);
      function move(e) {
        var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width), best = 0, bd = 1e18;
        xs.forEach(function (x, i) { var d = Math.abs(X(x) - px); if (d < bd) { bd = d; best = i; } });
        var cx = X(xs[best]); cur.setAttribute('x1', cx); cur.setAttribute('x2', cx); cur.style.display = '';
        series.forEach(function (s, i) { dots[i].setAttribute('cx', cx); dots[i].setAttribute('cy', Y(s.pts[best][1])); dots[i].style.display = ''; });
        showTip('<b>' + esc((o.xlabel || 'Year') + ' ' + (o.xfmt ? o.xfmt(xs[best]) : Math.round(xs[best] * 10) / 10)) + '</b>' + series.map(function (s, i) { return '<br><i class="tdot" style="background:var(--c' + (s.ci || i + 1) + ')"></i>' + esc(s.name) + ': <b>' + (o.tfmt || inr)(s.pts[best][1]) + '</b>'; }).join(''), e.clientX, e.clientY);
      }
      hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
      hit.addEventListener('pointerleave', function () { cur.style.display = 'none'; dots.forEach(function (d) { d.style.display = 'none'; }); hideTip(); });
    }
    draw(o.animate !== false); register(el, draw);
  }

  /* ---- stacked bars: rows [{label, parts:[{name,v,ci}], note}] ---- */
  function bars(el, rows, o) {
    o = o || {};
    function draw(anim) {
      el.innerHTML = ''; var W = Math.max(260, el.clientWidth || 560), H = 220, m = { l: 52, r: 8, t: 10, b: 24 }, ymax = 0;
      rows.forEach(function (r) { var s = r.parts.reduce(function (a, p) { return a + p.v; }, 0); if (s > ymax) ymax = s; }); if (!(ymax > 0)) return;
      var st = Math.pow(10, Math.floor(Math.log10(ymax))); ymax = [1, 2, 4, 8, 10].map(function (k) { return k * st; }).filter(function (v) { return v >= ymax; })[0];
      var lg = document.createElement('ul'); lg.className = 'legend'; lg.innerHTML = rows[0].parts.map(function (p) { return '<li><i style="background:var(--c' + p.ci + ')"></i>' + esc(p.name) + '</li>'; }).join(''); el.appendChild(lg);
      var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': o.label || 'Bar chart' }, el); svg.style.display = 'block';
      var Y = function (v) { return H - m.b - v / ymax * (H - m.t - m.b); };
      for (var g = 0; g <= 4; g++) { var yv = ymax * g / 4; mk('line', { x1: m.l, x2: W - m.r, y1: Y(yv), y2: Y(yv), class: 'gl' }, svg); var tl = mk('text', { x: m.l - 6, y: Y(yv) + 3, 'text-anchor': 'end', class: 'tk' }, svg); tl.textContent = ax(yv); }
      var bw = (W - m.l - m.r) / rows.length, w = Math.min(34, bw * .68), every = Math.ceil(rows.length / 12);
      rows.forEach(function (r, i) {
        var g2 = mk('g', {}, svg), x = m.l + bw * i + (bw - w) / 2, acc = 0;
        r.parts.forEach(function (p, j) { var y1 = Y(acc + p.v), y0 = Y(acc), rc = mk('rect', { x: x, y: y1, width: w, height: Math.max(0, y0 - y1), rx: 2 }, g2); rc.style.fill = 'var(--c' + p.ci + ')'; acc += p.v;
          if (anim && !still()) { rc.style.transformBox = 'fill-box'; rc.style.transformOrigin = 'bottom'; rc.style.transform = 'scaleY(0)'; rc.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1) ' + (i * .04) + 's'; requestAnimationFrame(function () { requestAnimationFrame(function () { rc.style.transform = 'scaleY(1)'; }); }); } });
        if (i % every === 0) { var t = mk('text', { x: x + w / 2, y: H - 8, 'text-anchor': 'middle', class: 'tk' }, svg); t.textContent = r.label; }
        var hz = mk('rect', { x: m.l + bw * i, y: m.t, width: bw, height: H - m.t - m.b, fill: 'transparent' }, svg);
        hz.addEventListener('pointermove', function (e) { g2.classList.add('hot'); showTip('<b>' + esc(r.label) + '</b>' + r.parts.map(function (p) { return '<br><i class="tdot" style="background:var(--c' + p.ci + ')"></i>' + esc(p.name) + ': <b>' + inr(p.v) + '</b>'; }).join('') + (r.note ? '<br>' + r.note : ''), e.clientX, e.clientY); });
        hz.addEventListener('pointerleave', function () { g2.classList.remove('hot'); hideTip(); });
      });
    }
    draw(o.animate !== false); register(el, draw);
  }

  /* ---- signed horizontal bars: items [{label,value,fmt}] (negative = red) ---- */
  function hbars(el, items, o) {
    var max = Math.max.apply(null, items.map(function (x) { return Math.abs(x.value); })) || 1, anim = !(o && o.animate === false) && !still();
    el.innerHTML = '<div class="hb">' + items.map(function (x, i) { var neg = x.value < 0, w = Math.abs(x.value) / max * 100; return '<div class="hbr"><span>' + esc(x.label) + '</span><div class="hbt"><i class="' + (x.cls || (neg ? 'neg' : 'pos')) + '" style="width:' + (anim ? 0 : w) + '%;transition-delay:' + i * .08 + 's" data-w="' + w + '"></i></div><b>' + (x.fmt ? x.fmt(x.value) : inr(x.value)) + '</b></div>'; }).join('') + '</div>';
    if (anim) requestAnimationFrame(function () { requestAnimationFrame(function () { el.querySelectorAll('i[data-w]').forEach(function (b) { b.style.width = b.dataset.w + '%'; }); }); });
  }

  window.ST_CHART = { donut: donut, line: line, bars: bars, hbars: hbars, ax: ax };
})();
