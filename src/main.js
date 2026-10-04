/* =========================================================================
   Dessy. — portfolio interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ========================================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------------------------------------------------------------- reveal */
  const revealTargets = $$('.reveal');
  // stagger siblings inside a grid/stack
  const groups = new Map();
  revealTargets.forEach(el => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, 0);
    const i = groups.get(parent);
    el.style.setProperty('--d', `${Math.min(i * 70, 420)}ms`);
    groups.set(parent, i + 1);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  revealTargets.forEach(el => io.observe(el));
  // hero title mask-reveal needs its own trigger (it is above the fold)
  requestAnimationFrame(() => {
    $$('.hero__title .line').forEach((line, i) => {
      line.style.setProperty('--d', `${180 + i * 120}ms`);
      setTimeout(() => line.classList.add('is-in'), 60);
    });
  });

  /* ------------------------------------------------------------- count-up */
  const counters = $$('.count');
  const countIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      obs.unobserve(target);
      const to     = parseFloat(target.dataset.to || '0');
      const suffix = target.dataset.suffix || '';
      if (reduceMotion) { target.textContent = to + suffix; return; }
      const dur = 1400;
      const t0  = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        target.textContent = Math.round(to * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => countIO.observe(c));

  /* ---------------------------------------------------------- skill bars */
  const bars = $$('.bar');
  const barIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      obs.unobserve(target);
      const fill = $('.bar__track i', target);
      const level = target.dataset.level || '0';
      setTimeout(() => { fill.style.width = level + '%'; }, reduceMotion ? 0 : 140);
    });
  }, { threshold: 0.35 });
  bars.forEach(b => barIO.observe(b));

  /* --------------------------------------------- timeline progress line */
  const timeline = $('#timeline');
  if (timeline) {
    const grow = () => {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.75 - rect.top) / rect.height;
      timeline.style.setProperty('--grow', `${Math.max(0, Math.min(progress, 1)) * 100}%`);
    };
    grow();
    window.addEventListener('scroll', grow, { passive: true });
    window.addEventListener('resize', grow);
  }

  /* ---------------------------------------------------------------- header */
  const header = $('#header');
  const scrollBar = $('#scrollBar');
  const toTop = $('#toTop');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-stuck', y > 24);
    if (scrollBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    }
    if (toTop) toTop.style.opacity = y > 700 ? '1' : '0';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----------------------------------------------------------- mobile menu */
  const burger = $('#burger');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('is-open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* --------------------------------------------------------------- scrollspy */
  const navLinks = $$('#navList a');
  const sections = navLinks
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  const spy = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* -------------------------------------------------------------- rotator */
  const rotator = $('#rotator');
  if (rotator) {
    const words = $$('span', rotator);
    let idx = 0;
    if (!reduceMotion) {
      setInterval(() => {
        const current = words[idx];
        idx = (idx + 1) % words.length;
        const next = words[idx];
        current.classList.remove('is-on');
        current.classList.add('is-out');
        next.classList.remove('is-out');
        next.classList.add('is-on');
        setTimeout(() => current.classList.remove('is-out'), 600);
      }, 2600);
    }
  }

  /* --------------------------------------------------------- cursor glow */
  const glow = $('#cursorGlow');
  if (glow && finePointer && !reduceMotion) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;
    window.addEventListener('pointermove', (e) => {
      gx = e.clientX; gy = e.clientY;
      glow.classList.add('is-on');
    }, { passive: true });
    const loop = () => {
      cx += (gx - cx) * 0.09; cy += (gy - cy) * 0.09;
      glow.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------- card spotlight */
  if (finePointer) {
    $$('[data-spotlight]').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ------------------------------------------------------------ magnetic */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${x * 9}px, ${y * 7 - 2}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------- tilt */
  const tilt = $('[data-tilt]');
  if (tilt && finePointer && !reduceMotion) {
    const stack = $('.photo-stack', tilt);
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      stack.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 6}deg) translateZ(0)`;
    });
    tilt.addEventListener('pointerleave', () => { stack.style.transform = ''; });
  }

  /* ------------------------------------------------------- project filters */
  const grid = $('#workGrid');
  const empty = $('#workEmpty');
  $$('.filter').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const cat = btn.dataset.filter;
      let shown = 0;
      const cards = $$('.project', grid);

      cards.forEach(card => {
        const match = cat === 'all' || (card.dataset.cat || '').split(' ').includes(cat);
        card.classList.add('is-filtering');
        setTimeout(() => {
          card.classList.toggle('is-hidden', !match);
          if (match) shown++;
          requestAnimationFrame(() => card.classList.remove('is-filtering'));
          if (empty) empty.hidden = shown !== 0;
        }, reduceMotion ? 0 : 180);
      });
    });
  });

  /* -------------------------------------------------------- project modal */
  const modal = $('#modal');
  const modalPanel = $('.modal__panel', modal);
  let lastFocused = null;

  const openModal = (card) => {
    const d = card.dataset;
    $('#modalKicker').textContent = d.kicker || '';
    $('#modalTitle').textContent  = d.title  || '';
    $('#modalBody').textContent   = d.body   || '';

    // reuse the card's own artwork (keeps the single-file build free of duplicates)
    const cardImg = $('.project__media img', card);
    const hero = $('#modalHero');
    hero.innerHTML = (d.image || cardImg?.currentSrc || cardImg?.src)
      ? `<img src="${d.image || cardImg.currentSrc || cardImg.src}" alt="" loading="lazy" decoding="async">`
      : `<span class="heatmap"></span>`;

    $('#modalMeta').innerHTML = [
      d.role  ? `<span>${d.role}</span>`  : '',
      d.stack ? `<span>${d.stack}</span>` : '',
    ].join('');

    $('#modalPoints').innerHTML = (d.highlights || '')
      .split('|').filter(Boolean).map(p => `<li>${p}</li>`).join('');

    const link = $('#modalLink');
    if (d.link) {
      link.href = d.link;
      link.textContent = d.linkLabel || 'Visit project';
      link.hidden = false;
    } else {
      link.hidden = true;
    }

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('is-open'));
    setTimeout(() => $('.modal__close', modal).focus(), 80);
  };

  const closeModal = () => {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    setTimeout(() => {
      modal.hidden = true;
      document.body.style.overflow = '';
      lastFocused?.focus?.();
    }, 320);
  };

  $$('.project').forEach(card => {
    // keyboard + screen-reader affordances for the case-study cards
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open case study: ${card.dataset.title || ''}`);
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });

  modal?.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab' && !modal.hidden) {
      const focusables = $$('a[href], button, input, textarea', modalPanel).filter(el => !el.hidden && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ----------------------------------------------------------- confetti FX */
  const canvas = $('#confetti');
  const ctx = canvas?.getContext('2d');
  let particles = [], rafId = null;

  const sizeCanvas = () => {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const burst = (x = window.innerWidth / 2, y = window.innerHeight / 3) => {
    if (!ctx || reduceMotion) return;
    const colors = ['#0c7a5f', '#2f9e7f', '#aadc3c', '#e0a33c', '#0f9d63', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 6 + Math.random() * 13;
      particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 4,
        w: 5 + Math.random() * 7,
        h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0],
        life: 1,
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter(p => {
      p.vy += 0.32; p.vx *= 0.995; p.x += p.vx; p.y += p.vy;
      p.rot += p.vr; p.life -= 0.0075;
      if (p.life <= 0 || p.y > window.innerHeight + 60) return false;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      return true;
    });
    if (particles.length) { rafId = requestAnimationFrame(tick); }
    else { ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); rafId = null; }
  };

  /* -------------------------------------------------- copy to clipboard */
  $$('[data-copy]').forEach(el => {
    el.addEventListener('click', async () => {
      const value = el.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const t = document.createElement('textarea');
        t.value = value; document.body.appendChild(t); t.select();
        document.execCommand('copy'); t.remove();
      }
      const hint = $('.ccard__hint', el);
      if (hint) hint.textContent = 'Copied!';
      el.classList.add('is-copied');
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      setTimeout(() => {
        el.classList.remove('is-copied');
        if (hint) hint.textContent = 'Copy';
      }, 2200);
    });
  });

  /* --------------------------------------------------------- contact form */
  const form = $('#contactForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('#formStatus');
    const btn = $('#submitBtn');
    const data = new FormData(form);

    // light client-side validation
    let ok = true;
    $$('.field', form).forEach(f => {
      const input = $('input,textarea', f);
      if (!input) return;
      const invalid = input.required && !input.value.trim();
      const badEmail = input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      const bad = invalid || badEmail;
      f.classList.toggle('has-error', bad);
      if (bad && ok) { input.focus(); ok = false; }
    });
    if (!ok) {
      status.textContent = 'Please check the highlighted fields.';
      status.className = 'form-status is-err';
      return;
    }

    btn.classList.add('is-loading');
    status.textContent = 'Sending…';
    status.className = 'form-status';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      $$('.field', form).forEach(f => f.classList.remove('has-error', 'is-filled'));
      status.textContent = 'Thanks! Your message is on its way — I usually reply within a day.';
      status.className = 'form-status is-ok';
      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    } catch {
      status.innerHTML = 'Something went wrong sending that. Email me instead at <a href="mailto:desmondantwi07@gmail.com">desmondantwi07@gmail.com</a>.';
      status.className = 'form-status is-err';
    } finally {
      btn.classList.remove('is-loading');
    }
  });

  // keep floating labels in sync after autofill
  $$('.field input, .field textarea').forEach(input => {
    input.addEventListener('input', () => input.parentElement.classList.toggle('is-filled', !!input.value));
  });

  /* ----------------------------------------------------------- clock & year */
  const clockOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Africa/Accra' };
  const paintClock = () => {
    const time = new Intl.DateTimeFormat('en-GB', clockOpts).format(new Date());
    const a = $('#clock'), b = $('#clock2');
    if (a) a.textContent = `GMT · ${time}`;
    if (b) b.textContent = time;
  };
  paintClock();
  setInterval(paintClock, 1000);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* -------------------------------------------------------------- back to top */
  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  if (toTop) toTop.style.transition = 'opacity .4s ease';

  /* ------------------------------------------------------------- CV links */
  /* the single-file build injects window.DESSY_CV so every download button
     still works when the .html is moved around on its own */
  if (window.DESSY_CV) {
    $$('a[download]').forEach(a => {
      a.href = window.DESSY_CV;
      a.setAttribute('download', 'DESMOND-Antwi-CV.pdf');
    });
  }
})();
