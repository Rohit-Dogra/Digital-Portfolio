/* ==========================================================================
   Rohit Dogra — Portfolio interactions
   Vanilla ES2019+. No framework, no jQuery. All motion respects
   prefers-reduced-motion and everything degrades to a working static page.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* rAF-throttled scroll dispatcher — one listener, many subscribers. */
  var subs = [], ticking = false;
  function onScroll(fn) { subs.push(fn); }
  function tick() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    for (var i = 0; i < subs.length; i++) subs[i](y);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }, { passive: true });

  /* ── Entrance ───────────────────────────────────────────────────────── */
  requestAnimationFrame(function () { document.documentElement.classList.add('is-loaded'); });

  /* ── Theme ──────────────────────────────────────────────────────────── */
  /* The stored preference is applied by an inline head script before first
     paint; this only handles switching and keeps the control's label honest. */
  (function () {
    var root   = document.documentElement;
    var toggle = $('#themeToggle');
    var system = window.matchMedia('(prefers-color-scheme: light)');

    function current() {
      var set = root.getAttribute('data-theme');
      if (set === 'light' || set === 'dark') return set;
      return system.matches ? 'light' : 'dark';
    }

    function label() {
      if (!toggle) return;
      var next = current() === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      toggle.setAttribute('title', 'Switch to ' + next + ' theme');
    }

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) { /* private mode */ }
      label();
    }

    label();

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (!reduced.matches) {
          root.classList.add('theme-shifting');
          window.setTimeout(function () { root.classList.remove('theme-shifting'); }, 360);
        }
        apply(current() === 'dark' ? 'light' : 'dark');
      });
    }

    // Follow the OS only while the visitor has not chosen for themselves.
    var onSystem = function () { if (!root.getAttribute('data-theme')) label(); };
    if (system.addEventListener) system.addEventListener('change', onSystem);
    else if (system.addListener) system.addListener(onSystem);
  })();

  /* ── Footer year ────────────────────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── Scroll progress ────────────────────────────────────────────────── */
  var bar = $('#progress');
  if (bar) {
    onScroll(function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    });
  }

  /* ── Nav: stuck state, sliding pill, scroll spy ─────────────────────── */
  var nav      = $('#nav');
  var navList  = $('#navLinks');
  var pill     = navList ? $('.nav__pill', navList) : null;
  var navAs    = navList ? $$('a', navList) : [];
  var sections = navAs
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function movePill(a) {
    if (!pill || !a) return;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    pill.classList.add('is-on');
  }

  var activeId = '';
  function spy(y) {
    if (nav) nav.classList.toggle('is-stuck', y > 24);

    // The last section whose top has crossed the line 38% down the viewport
    // wins. Above the first section — i.e. in the hero — nothing is active.
    var line = y + window.innerHeight * 0.38, current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= line) current = sections[i];
    }
    // Near the very bottom, always credit the last section.
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    var id = current ? current.id : '';
    if (id === activeId) return;
    activeId = id;

    var match = null;
    navAs.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + activeId;
      a.classList.toggle('is-active', on);
      if (on) match = a;
    });
    if (match) movePill(match); else if (pill) pill.classList.remove('is-on');
  }
  if (sections.length) { onScroll(spy); spy(window.scrollY || 0); }

  // Hovering previews the pill; leaving returns it to the active link.
  if (navList && fine.matches) {
    navAs.forEach(function (a) {
      a.addEventListener('mouseenter', function () { movePill(a); });
    });
    navList.addEventListener('mouseleave', function () {
      movePill($('a.is-active', navList));
    });
  }
  window.addEventListener('resize', function () {
    movePill(navList ? $('a.is-active', navList) : null);
  });

  /* ── Mobile sheet ───────────────────────────────────────────────────── */
  var burger = $('#burger');
  var sheet  = $('#navSheet');
  if (burger && sheet) {
    var inertables = [$('#main'), $('footer')].filter(Boolean);

    function setSheet(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      sheet.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      if (open) sheet.removeAttribute('inert'); else sheet.setAttribute('inert', '');
      inertables.forEach(function (el) {
        if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
      // Stagger the links in, then hand focus to the first one.
      $$('.nav__sheet-links a', sheet).forEach(function (a, i) {
        a.style.transitionDelay = open ? (120 + i * 55) + 'ms' : '0ms';
      });
      if (open) {
        var first = $('.nav__sheet-links a', sheet);
        if (first) setTimeout(function () { first.focus(); }, reduced.matches ? 0 : 420);
      } else {
        burger.focus();
      }
    }

    burger.addEventListener('click', function () {
      setSheet(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', sheet).forEach(function (a) {
      a.addEventListener('click', function () { setSheet(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setSheet(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 940 && burger.getAttribute('aria-expanded') === 'true') setSheet(false);
    });
  }

  /* ── Reveal on scroll ───────────────────────────────────────────────── */
  var revealables = $$('[data-reveal]');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
    $$('.frame').forEach(function (el) { el.classList.add('is-seen'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });

    // Mockups animate their charts once, when the frame is genuinely on screen.
    var frameIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-seen');
        frameIo.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    $$('.frame').forEach(function (el) { frameIo.observe(el); });
  }

  /* ── Magnetic "Visit" badge inside project frames ───────────────────── */
  if (fine.matches && !reduced.matches) {
    $$('.frame').forEach(function (frame) {
      var badge = $('.frame__badge', frame);
      if (!badge) return;
      var pending = false, mx = 0, my = 0;

      frame.addEventListener('pointerenter', function () { frame.classList.add('is-tracking'); });
      frame.addEventListener('pointerleave', function () { frame.classList.remove('is-tracking'); });
      frame.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          badge.style.transform = 'translate(calc(-50% + ' + mx + 'px), calc(-50% + ' + my + 'px)) scale(1)';
        });
      });
    });
  }

  /* ── Case study drawers ─────────────────────────────────────────────── */
  $$('.case-toggle').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var wrap  = panel.closest('.case-wrap');
    var label = $('.case-toggle__label', btn);
    var title = $('.proj__title', btn.closest('.proj'));

    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Case study' + (title ? ' — ' + title.textContent.trim() : ''));

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      wrap.classList.toggle('is-open', !open);
      if (label) label.textContent = open ? 'Case study' : 'Close case study';
    });
  });

  /* ── Expertise tabs ─────────────────────────────────────────────────── */
  var tabs = $$('.tab');
  var grid = $('#skillGrid');
  if (tabs.length && grid) {
    var cols = $$('.skillcol', grid);

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      var cat = tab.dataset.cat;
      grid.classList.toggle('is-filtered', cat !== 'all');
      cols.forEach(function (c) { c.classList.toggle('is-on', c.dataset.cat === cat); });
    }

    tabs.forEach(function (tab, i) {
      tab.setAttribute('tabindex', tab.getAttribute('aria-selected') === 'true' ? '0' : '-1');
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
  }

  /* ── Back to top ────────────────────────────────────────────────────── */
  var toTop = $('#toTop');
  if (toTop) onScroll(function (y) { toTop.classList.toggle('is-on', y > 700); });

  /* ── Contact form ───────────────────────────────────────────────────── */
  var form = $('#contactForm');
  if (form) {
    var statusEl = $('#formStatus');
    var submit   = $('#formSubmit');
    var EMAILJS  = { user: 'user_TTDmetQLYgWCLzHTDgqxm', service: 'contact_service', template: 'template_contact' };

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var wrap = fieldOf(input);
      if (!wrap) return true;
      var val = input.value.trim();
      var ok  = input.required
        ? (val !== '' && input.checkValidity())
        : (val === '' || input.checkValidity());
      wrap.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }

    // Validate on blur, never on keystroke. Clear the error as soon as it's fixed.
    $$('input, textarea', form).forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('has-error')) validate(input);
      });
    });

    function say(msg, state) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      if (state) statusEl.setAttribute('data-state', state);
      else statusEl.removeAttribute('data-state');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var inputs  = $$('input, textarea', form);
      var invalid = inputs.filter(function (i) { return !validate(i); });
      if (invalid.length) {
        say(invalid.length + ' field' + (invalid.length > 1 ? 's need' : ' needs') + ' attention.', 'err');
        invalid[0].focus();
        return;
      }

      if (typeof window.emailjs === 'undefined') {
        say('Mail service unavailable — email me directly at dogra.rohit2002@gmail.com.', 'err');
        return;
      }

      submit.setAttribute('data-loading', 'true');
      submit.setAttribute('aria-busy', 'true');
      say('Sending…');

      try { window.emailjs.init(EMAILJS.user); } catch (err) { /* already initialised */ }

      window.emailjs.sendForm(EMAILJS.service, EMAILJS.template, form)
        .then(function () {
          form.reset();
          say('Thanks — message sent. I usually reply within a day.', 'ok');
        })
        .catch(function () {
          say('That didn’t send. Email me directly at dogra.rohit2002@gmail.com.', 'err');
        })
        .then(function () {
          submit.removeAttribute('data-loading');
          submit.removeAttribute('aria-busy');
        });
    });
  }
})();
