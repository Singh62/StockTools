/* AdSense loader. Inert unless ADS_ENABLED=true, a valid client ID is set, and the visitor consented. */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  function start() {
    var a = window.ST && window.ST.analytics;
    if (!a || !a.adsEnabled || a.consent() !== 'granted') return;
    var slots = document.querySelectorAll('.ad-slot[data-slot-key]'), used = 0;
    slots.forEach(function (el) {
      var id = (cfg.ADSENSE_SLOTS || {})[el.dataset.slotKey];
      if (!id) return;
      el.innerHTML = '<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="' + cfg.ADSENSE_CLIENT_ID + '" data-ad-slot="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      el.classList.add('ad-on'); used++;
    });
    if (!used) return;
    var s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.ADSENSE_CLIENT_ID);
    s.onload = function () { document.querySelectorAll('.ad-on .adsbygoogle').forEach(function () { (window.adsbygoogle = window.adsbygoogle || []).push({}); }); };
    document.head.appendChild(s);
  }
  document.addEventListener('DOMContentLoaded', start);
  document.addEventListener('st:consent-granted', start);
})();
