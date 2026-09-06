/* ============================================================
   SHARED UI  —  Melih G. Kutsal
   Her sayfada, sayfanın kendi <script>'inden ÖNCE yüklenir.

   Yaptıkları:
   1. Mobil menüyü mevcut nav linklerinden otomatik üretir
      (böylece yeni sayfa eklerken tek yerde nav güncellemek yeter)
   2. Sayfa geçiş animasyonunu mobilde/hareket azaltmada kısaltır
   3. Lightbox'a klavye (ESC / ok tuşları) ve kaydırma desteği ekler
   4. Dokunmatik cihazlarda hover'a bağlı davranışları tıklamaya çevirir
   ============================================================ */
(function () {
    'use strict';

    var isTouch = window.matchMedia('(hover: none)').matches;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. MOBİL MENÜ ---------- */
    function buildMobileMenu() {
        var nav = document.querySelector('.wireframe-nav');
        if (!nav || document.querySelector('.m-menu')) return;

        var group = nav.querySelector('.nav-group');
        var brand = nav.querySelector('.brand');
        if (!group) return;

        var btn = document.createElement('button');
        btn.className = 'm-menu-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<span></span><span></span><span></span>';
        nav.appendChild(btn);

        var menu = document.createElement('nav');
        menu.className = 'm-menu';
        menu.setAttribute('aria-hidden', 'true');

        var here = location.pathname.split('/').pop() || 'index.html';
        var links = [];

        // Nav grubundaki linkleri sırayla al
        Array.prototype.forEach.call(group.querySelectorAll('a'), function (a) {
            links.push({ href: a.getAttribute('href'),
                         text: a.textContent.trim(),
                         blank: a.getAttribute('target') === '_blank' });
        });

        // Marka linki sona eklenir. CV sayfasındayken marka
        // ana sayfaya gidiyor ve etiketi [INDEX] oluyor — o
        // durumda "Home" diye yazılsın.
        if (brand) {
            var bhref = brand.getAttribute('href');
            var bt = brand.querySelector('.nav-sub');
            var btext = bt ? bt.textContent.replace(/[\[\]]/g, '').trim() : 'CV';
            if (bhref === 'index.html' || /^index$/i.test(btext)) btext = 'Home';
            links.push({ href: bhref, text: btext, blank: false });
        }
        // Ana sayfa her zaman erişilebilir olsun
        if (here !== 'index.html') {
            links.push({ href: 'index.html', text: 'Home', blank: false });
        }

        // Aynı hedefi iki kez listeleme (CV sayfasında marka da
        // ana sayfaya gidiyordu, "Home" iki satır çıkıyordu).
        var seenHref = {};
        links = links.filter(function (l) {
            if (!l.href || seenHref[l.href]) return false;
            seenHref[l.href] = true;
            return true;
        });

        var html = '';
        links.forEach(function (l, i) {
            var num = ('0' + (i + 1)).slice(-2);
            var cur = (l.href === here) ? ' aria-current="page"' : '';
            var tgt = l.blank ? ' target="_blank" rel="noopener"' : '';
            html += '<a href="' + l.href + '"' + cur + tgt + '>' +
                    '<span class="m-idx">' + num + '</span>' +
                    '<span>' + l.text + '</span></a>';
        });
        html += '<div class="m-menu-foot">MELIH G. KUTSAL — SYS.ONLINE</div>';
        menu.innerHTML = html;
        document.body.appendChild(menu);

        function setOpen(open) {
            menu.classList.toggle('open', open);
            menu.setAttribute('aria-hidden', open ? 'false' : 'true');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.classList.toggle('m-menu-open', open);
        }

        btn.addEventListener('click', function () {
            setOpen(btn.getAttribute('aria-expanded') !== 'true');
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setOpen(false);
        });

        // Menü linkine basınca menü kapansın (geçiş animasyonu devralır)
        menu.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false);
        });
    }

    /* ---------- 2. GEÇİŞ SÜRESİ ----------
       Sayfa geçiş animasyonu masaüstünde 600ms. Mobilde bu, her
       dokunuşta hissedilen bir gecikme yaratıyor. Orada kısaltıyoruz. */
    window.__transitionDelay = function () {
        if (reduceMotion) return 0;
        if (window.innerWidth <= 900) return 260;
        return 600;
    };

    /* ---------- 3. LIGHTBOX ---------- */
    function enhanceLightbox() {
        var lightbox = document.getElementById('lightbox');
        var content = document.getElementById('lightbox-content');
        if (!lightbox || !content) return;

        var imgs = Array.prototype.slice.call(document.querySelectorAll('.zoomable'));
        var idx = -1;

        if (!lightbox.querySelector('.lightbox-hint') && imgs.length > 1) {
            var hint = document.createElement('div');
            hint.className = 'lightbox-hint';
            hint.textContent = '← → gezin · ESC kapat';
            lightbox.appendChild(hint);
        }

        function show(i) {
            if (i < 0 || i >= imgs.length) return;
            idx = i;
            content.src = imgs[i].currentSrc || imgs[i].src;
            content.alt = imgs[i].alt || '';
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        imgs.forEach(function (img, i) {
            img.addEventListener('click', function () { show(i); });
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') show((idx + 1) % imgs.length);
            else if (e.key === 'ArrowLeft') show((idx - 1 + imgs.length) % imgs.length);
        });

        // Mobilde yatay kaydırma ile gezinme
        var x0 = null;
        lightbox.addEventListener('touchstart', function (e) {
            x0 = e.changedTouches[0].clientX;
        }, { passive: true });
        lightbox.addEventListener('touchend', function (e) {
            if (x0 === null) return;
            var dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 60) {
                show(dx < 0 ? (idx + 1) % imgs.length
                            : (idx - 1 + imgs.length) % imgs.length);
            }
            x0 = null;
        }, { passive: true });

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) close();
        });
        var closeBtn = document.getElementById('lightbox-close');
        if (closeBtn) closeBtn.addEventListener('click', close);
    }

    /* ---------- 4. GÖRSELLERİ TEMBEL YÜKLE ----------
       İlk ekrandaki görseller hariç hepsi ekrana yaklaşınca yüklenir. */
    function lazifyImages() {
        var imgs = document.querySelectorAll('main img, .hero-img-box img');
        Array.prototype.forEach.call(imgs, function (img, i) {
            if (img.hasAttribute('loading')) return;
            if (i > 1) img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
        });
        var vids = document.querySelectorAll('video');
        Array.prototype.forEach.call(vids, function (v) {
            if (!v.hasAttribute('preload')) v.setAttribute('preload', 'metadata');
            v.setAttribute('playsinline', '');
        });
    }

    /* ---------- 5. OKUMA İLERLEME ÇUBUĞU ----------
       Uzun proje sayfalarında ne kadar kaldığını gösterir. */
    function readProgress() {
        if (!document.querySelector('.project-layout, .thesis-layout')) return;

        var bar = document.createElement('div');
        bar.className = 'read-progress';
        document.body.appendChild(bar);

        var ticking = false;
        function update() {
            var h = document.documentElement.scrollHeight - window.innerHeight;
            var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
            bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    /* ---------- 6. BAŞLAT ---------- */
    function init() {
        buildMobileMenu();
        enhanceLightbox();
        lazifyImages();
        readProgress();
        if (isTouch) document.documentElement.classList.add('is-touch');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
