/* ==========================================================
   LUMPEN LEFT — TELEFON DAVRANIŞLARI
   ----------------------------------------------------------
   İki iş yapıyor, ikisi de yalnızca dokunmatik / dar ekranda:

   1) ALT BÖLÜM ÇUBUĞU
      Sayfalar arası tek gezinme yolu, ekranın iki yanındaki
      dikey şeritlerdi. Telefonda o şeritler metnin üstüne
      bindiği için mobile.css onları gizliyor — ama gizlemek
      gezinmeyi de yok ederdi. Bu yüzden çubuk, sayfada ZATEN
      VAR OLAN bağlantılardan kuruluyor; hiçbir hedef elle
      yazılmıyor, dolayısıyla sayfa değişirse çubuk da uyar.

   2) DOKUNARAK AÇMA
      Maraş'taki sansür blokları ve Kanlı Mayıs'taki müzik
      künyesi üstüne gelince açılan etkileşimlerdi. Silmek
      yerine dokunmayla açılır hale getiriliyor.
   ========================================================== */
(function () {
    'use strict';

    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var isNarrow = window.matchMedia('(max-width: 900px)').matches;

    /* Şerit metinleri aynı ibareyi defalarca tekrarlıyor
       ("Bloody MayBloody MayBloody May", "ARCHIVE: 16 MARCH ///
       ARCHIVE: 16 MARCH ///..."). Önce ayraçtan bölüyoruz, sonra
       kalan metinde en kısa tekrar birimini bulup onu alıyoruz. */
    function clean(text, href) {
        var s = (text || '').replace(/\s+/g, ' ').trim();

        // 1) Belirgin ayraçlar
        s = s.split(/\s*(?:\/\/\/|[-–—]\s)\s*/)[0].trim();

        // 2) Tekrar birimi: "ABABAB" veya "ABAB AB" -> "AB"
        //    Birimler arasında boşluk olabiliyor (şeritler ayrı
        //    <span>/<div>'lere bölünmüş), o yüzden atlanıyor.
        //    Son tekrar yarım kalabilir, ona da izin veriliyor.
        for (var k = 3; k <= s.length / 2; k++) {
            var unit = s.slice(0, k);
            var i = k, ok = true;
            while (i < s.length) {
                while (s.charAt(i) === ' ') i++;
                if (i >= s.length) break;
                var seg = s.substr(i, k);
                if (unit.indexOf(seg) !== 0) { ok = false; break; }
                i += seg.length;
            }
            if (ok) { s = unit; break; }
        }

        s = s.replace(/[\s\-–—:/]+$/, '').trim();
        if (s.length > 24) s = s.slice(0, 22).trim() + '…';
        return s || href.replace(/\.html?$/, '');
    }

    /* ---------- 1. Alt bölüm çubuğu ---------- */
    function buildNav() {
        if (!isNarrow) return;
        if (document.querySelector('.ll-mobile-nav')) return;

        var here = location.pathname.split('/').pop() || 'index.html';
        var sources = document.querySelectorAll(
            'a.side-strip, .side-link a, .heading-wrapper a[href], .heading-wrapper-2 a[href]'
        );

        var seen = {};
        var items = [];

        Array.prototype.forEach.call(sources, function (a) {
            var href = a.getAttribute('href');
            if (!href) return;
            if (href.charAt(0) === '#' || /^(https?:|mailto:)/.test(href)) return;
            if (href.indexOf('..') === 0) return;          // portfolyo dönüşü ayrı duruyor
            if (href === here) return;                      // aynı sayfa
            if (seen[href]) return;
            seen[href] = true;

            var label = clean(a.textContent, href);

            items.push({ href: href, label: label });
        });

        if (!items.length) return;

        var nav = document.createElement('nav');
        nav.className = 'll-mobile-nav';
        nav.setAttribute('aria-label', 'Chapters');

        // Portfolyo dönüşü çubuğun ilk hücresi oluyor; mobilde
        // yüzen bir çip olarak metnin üstüne binmesin diye.
        var back = document.querySelector('.pf-back');
        if (back) {
            var b = document.createElement('a');
            b.href = back.getAttribute('href');
            b.className = 'nav-back';
            b.textContent = '← Portfolio';
            nav.appendChild(b);
        }

        items.slice(0, 2).forEach(function (it) {
            var a = document.createElement('a');
            a.href = it.href;
            a.textContent = it.label;
            nav.appendChild(a);
        });
        document.body.appendChild(nav);
    }

    /* ---------- 2. Dokunarak açma ---------- */
    function bindTapReveals() {
        if (!isTouch) return;

        Array.prototype.forEach.call(
            document.querySelectorAll('.censor-block, .music-info-container'),
            function (el) {
                el.addEventListener('click', function (e) {
                    // İçindeki gerçek bir bağlantıya basıldıysa karışma
                    if (e.target.closest && e.target.closest('a')) return;
                    el.classList.toggle('tap-open');
                });
            }
        );
    }

    function init() {
        try { buildNav(); } catch (e) { /* çubuk kurulamazsa sayfa yine çalışsın */ }
        try { bindTapReveals(); } catch (e) { /* aynı şekilde */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
