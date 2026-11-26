/* GA4 + consent. Nothing loads until (a) a real measurement ID is set and (b) the visitor accepts.
   Only non-sensitive event params are ever sent (tool name/category, counts). Never calculator inputs. */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var KEY = 'st_consent';
  var debug = /[?&]st_debug=1/.test(location.search);
  function valid(id, re) { return typeof id === 'string' && re.test(id) && !/^[A-Za-z]+-X+$/.test(id) && !/X{6,}/.test(id); }
  var gaOn = valid(cfg.GA_MEASUREMENT_ID, /^G-[A-Z0-9]{6,}$/);
  var adsOn = cfg.ADS_ENABLED === true && valid(cfg.ADSENSE_CLIENT_ID, /^ca-pub-\d{10,}$/);
  var loaded = false;
  window.__stEvents = window.__stEvents || [];

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: choice not remembered */ } }

  function loadGA() {
    if (loaded || !gaOn) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.GA_MEASUREMENT_ID);
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.GA_MEASUREMENT_ID);
    document.head.appendChild(s);
  }

  function track(name, params) {
    if (debug) { window.__stEvents.push({ name: name, params: params }); console.debug('[analytics]', name, params); }
    if (loaded && window.gtag) window.gtag('event', name, params);
  }

  function base() { var l = document.querySelector('link[rel=icon]'); return l ? (l.getAttribute('href') || '').replace('/assets/images/favicon.svg', '') : ''; }
  function banner() {
    if (document.getElementById('consent')) return;
    var d = document.createElement('div');
    d.id = 'consent'; d.className = 'consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<p>We use cookies for analytics' + (adsOn ? ' and advertising' : '') + '. Your calculator inputs are never sent. See our <a href="' + base() + '/privacy">Privacy Policy</a>.</p>' +
      '<div><button type="button" class="btn btn-secondary" data-c="denied">Decline</button> <button type="button" class="btn" data-c="granted">Accept</button></div>';
    d.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-c'); if (!v) return;
      set(v); d.remove(); apply(v);
    });
    document.body.appendChild(d);
  }
  function apply(v) {
    if (v === 'granted') { loadGA(); document.dispatchEvent(new Event('st:consent-granted')); }
  }

  function init() {
    if (!gaOn && !adsOn) return;               // nothing to consent to yet
    var c = get();
    if (c === 'granted') apply(c); else if (c !== 'denied') banner();
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-cookie-settings]')) { e.preventDefault(); try { localStorage.removeItem(KEY); } catch (x) { } banner(); }
    });
  }
  window.ST = window.ST || {};
  window.ST.analytics = { track: track, enabled: gaOn, adsEnabled: adsOn, consent: get };
  document.addEventListener('DOMContentLoaded', init);
})();
