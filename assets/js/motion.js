/* Summit Studios v3 motion layer, modelled on Shopify Editions Winter '26.
   Lenis smooth scroll; drafting lines that draw on load; the chapter list that docks
   from the hero box to the sidebar; paintings that fade as a chapter's content arrives;
   the header and sidebar switching between light and ink; the active chapter in the
   list; gentle fade-up reveals; the fanned cards; and the "Why Summit" fly-through
   kept from the earlier site. Everything respects prefers-reduced-motion. */
(() => {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  const d = document;
  const root = d.documentElement;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.clearScrollMemory('manual');
  if (!location.hash) scrollTo(0, 0);
  addEventListener('load', () => { if (!location.hash && scrollY) scrollTo(0, 0); ScrollTrigger.refresh(); });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = () => matchMedia('(min-width: 900px)').matches;
  const EXPO = 'expo.out';
  const headerH = () => (d.querySelector('.hdr') || { offsetHeight: 60 }).offsetHeight;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.072, wheelMultiplier: 0.88, touchMultiplier: 1.1, smoothWheel: true });   // a little heavier
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = target => {
    const offset = -(headerH() + 20);
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: 'smooth' });
  };
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const t = d.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    e.preventDefault();
    if (a.getAttribute('href') === '#top') { if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrollToEl(t);
  });

  /* ---------- Load a clip fully, then play it from memory ----------
     Seeking is instant and smooth, and it works on hosts without Range support. */
  function loadClip(video, onReady) {
    if (!video || !video.dataset.src) return;
    video.preload = 'auto';
    video.addEventListener('loadedmetadata', () => { video.dataset.ready = '1'; onReady && onReady(); }, { once: true });
    fetch(video.dataset.src)
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
      .then(b => { video.src = URL.createObjectURL(b); video.load(); })
      .catch(() => { video.src = video.dataset.src; video.load(); });
  }
  /* ---------- Text splitting (lines in masks) ---------- */
  const splitStore = new Map();
  function split(el) {
    if (!splitStore.has(el)) splitStore.set(el, el.innerHTML);
    el.innerHTML = splitStore.get(el);
    const frag = [];
    const pushWords = (text, cls) => text.split(/(\s+)/).forEach(t => {
      if (!t) return;
      if (/^\s+$/.test(t)) { frag.push(d.createTextNode(' ')); return; }
      const s = d.createElement('span');
      s.className = 'w' + (cls ? ' ' + cls : '');
      s.textContent = t;
      frag.push(s);
    });
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) pushWords(n.textContent, '');
      else if (n.nodeType === 1) pushWords(n.textContent, n.className);
    });
    el.innerHTML = '';
    frag.forEach(n => el.append(n));
    const words = [...el.querySelectorAll('.w')];
    const lines = [];
    let top = null, cur = null;
    words.forEach(w => {
      const t = w.offsetTop;
      if (t !== top) { top = t; cur = []; lines.push(cur); }
      cur.push(w);
    });
    el.innerHTML = '';
    return lines.map(ws => {
      const L = d.createElement('span'); L.className = 'line';
      const I = d.createElement('span'); I.className = 'line__in';
      ws.forEach((w, i) => { I.append(w); if (i < ws.length - 1) I.append(' '); });
      L.append(I); el.append(L);
      return I;
    });
  }

  /* ---------- Drafting lines draw on load, then the box docks to the sidebar ---------- */
  /* ---------- Footer: the chapter index steps aside while the footer is on screen ---------- */
  function footerSide() {
    const f = d.querySelector('[data-ftr]');
    if (f) ScrollTrigger.create({ trigger: f, start: 'top 80%', end: 'bottom top', onToggle: self => root.classList.toggle('at-ftr', self.isActive) });
  }

  /* ---------- Home index: the wide box's title and chapter names fly to the sidebar ----------
     Scrubbed by scroll, so it moves with the page and reverses cleanly. While it runs, each item
     is drawn by a clone on a fixed layer, placed between where its original sits in the box right
     now and where its twin sits in the docked sidebar. Desktop only; elsewhere the box just stays. */
  function idxScrub(idx) {
    const sb = d.querySelector('[data-sb]');
    const src = [idx.querySelector('.idx__mark'), ...idx.querySelectorAll('.idx__list li a')];
    const dst = sb ? [sb.querySelector('.sb__mark'), ...sb.querySelectorAll('.sb__list li a')] : [];
    if (!sb || reduced || !desktop() || src.length !== dst.length) {
      ScrollTrigger.create({ trigger: idx, start: 'top 20%', onToggle: self => root.classList.toggle('idx-on', self.progress > 0 || self.isActive) });
      return;
    }
    const KEYS = ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'color', 'display', 'alignItems', 'gap', 'whiteSpace'];
    const ease = gsap.parseEase('power2.inOut');
    let layer = null, ghosts = [], to = [], cTo = [], cFrom = [], fsFrom = [], fsTo = [], state = -1;
    const build = () => {
      layer = d.createElement('div'); layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:120;pointer-events:none';
      root.classList.add('idx-on');
      to = dst.map(el => el.getBoundingClientRect());
      const ct = dst.map(el => getComputedStyle(el)), cf = src.map(el => getComputedStyle(el));
      cFrom = cf.map(c => c.color); cTo = ct.map(c => c.color);
      fsFrom = cf.map(c => parseFloat(c.fontSize)); fsTo = ct.map(c => parseFloat(c.fontSize));
      ghosts = src.map((el, i) => {
        const g = el.cloneNode(true);
        KEYS.forEach(k => { g.style[k] = cf[i][k]; });
        Object.assign(g.style, { position: 'absolute', left: '0', top: '0', margin: '0', opacity: '1', transformOrigin: '0 0', willChange: 'transform' });
        layer.append(g); return g;
      });
      d.body.append(layer);
    };
    const show = (which) => {            // which: 0 box, 1 flying, 2 sidebar
      if (which === state) return; state = which;
      src.forEach(el => { el.style.opacity = which === 0 ? '' : '0'; });
      dst.forEach(el => { el.style.opacity = which === 2 ? '' : '0'; });
      if (which === 1) { if (!layer) build(); }
      else { if (layer) layer.remove(); layer = null; ghosts = []; }
      root.classList.toggle('idx-on', which !== 0);
    };
    // The box itself (frame and the subtitle left inside it) fades out as its contents leave,
    // and is gone by the time they land.
    const fade = p => { idx.style.opacity = p <= 0 ? '' : String(1 - gsap.utils.clamp(0, 1, p / .85)); };
    const update = p => {
      fade(p);
      if (p <= 0) { show(0); return; }
      if (p >= 1) { show(2); return; }
      show(1);
      ghosts.forEach((g, i) => {
        const k = ease(gsap.utils.clamp(0, 1, (p - i * .015) / (1 - (ghosts.length - 1) * .015)));
        const r = src[i].getBoundingClientRect();
        const x = r.left + (to[i].left - r.left) * k, y = r.top + (to[i].top - r.top) * k;
        const w = r.width + (to[i].width - r.width) * k;
        const s = (fsFrom[i] + (fsTo[i] - fsFrom[i]) * k) / fsFrom[i];
        g.style.width = (w / s) + 'px';
        g.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
        g.style.color = gsap.utils.interpolate(cFrom[i], getComputedStyle(dst[i]).color, k);   // live: the sidebar's colour follows the page theme
      });
    };
    ScrollTrigger.create({
      trigger: idx, start: 'top 45%', end: 'top 2%',
      onUpdate: self => update(self.progress),
      onRefresh: self => { if (layer) { layer.remove(); layer = null; state = -1; } update(self.progress); },
    });
  }

  function draftingBox() {
    const lines = [...d.querySelectorAll('.dv circle, .dv line, .dv rect, .dv path')];
    if (lines.length && !reduced) {
      gsap.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: .08, delay: .2 });
    } else if (lines.length) gsap.set(lines, { strokeDashoffset: 0 });
    const hero = d.querySelector('[data-hero]');
    if (!hero) { root.classList.add('docked'); return; }
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '30% top',
      onEnter: () => root.classList.add('docked'), onLeaveBack: () => root.classList.remove('docked'),
    });
    // Already scrolled (hash link, reload): dock at once
    if (scrollY > innerHeight * .3) root.classList.add('docked');
    // The docked index comes in (flown from the box) once the in-page index (.idx, top of
    // chapter I) has risen into the top third of the screen; before that the hero is left clean.
    const idx = d.querySelector('[data-idx]');
    if (idx) idxScrub(idx);
    else root.classList.add('idx-on');
    // It then stays through chapter I and tucks away behind the arrow on the left edge.
    const first = d.querySelector('[data-ch]');
    if (first && desktop()) {
      const hide = on => { root.classList.toggle('sb-hide', on); if (!on && window.__sbClose) window.__sbClose(); };
      ScrollTrigger.create({ trigger: first, start: 'bottom 75%', endTrigger: d.documentElement, end: 'bottom bottom', onToggle: self => hide(self.isActive) });
    }
  }

  /* ---------- Chapters: painting fades as the body arrives; UI theme follows; list marks the active one ---------- */
  function chapters() {
    const items = [...d.querySelectorAll('[data-ch-link]')];
    const setUI = light => root.setAttribute('data-ui', light ? 'light' : 'dark');
    let lightCount = 0;
    d.querySelectorAll('[data-ch]').forEach(sec => {
      const body = sec.querySelector('[data-ch-body]');
      const firstSub = body && body.querySelector('.sub');
      // With a corner reveal, the UI turns to ink once the new page has reached the header and sidebar
      const corner = root.classList.contains('has-corner') && sec.querySelector('[data-corner]');
      // Fade the painting once the first serif sub-heading nears the top of the screen
      const plain = sec.classList.contains('ch--plain');   // paper chapter: ink UI as soon as it reaches the header
      ScrollTrigger.create({
        trigger: plain ? sec : sec.classList.contains('ch--cut') ? body : (corner || firstSub || body),
        start: plain ? 'top top+=60' : sec.classList.contains('ch--cut') ? 'top top+=60' : corner ? () => 'top+=' + Math.round((corner.offsetHeight - innerHeight) * .8) + ' top' : 'top 72%',
        endTrigger: body || sec, end: 'bottom top+=60',   // ends as the body's last line passes the header
        onToggle: self => {
          sec.classList.toggle('is-faded', self.isActive);
          lightCount += self.isActive ? 1 : -1;
          setUI(lightCount > 0);
        },
      });
      // A cut-out on cream: ink header from the top of the chapter until its painting fades
      if (sec.classList.contains('ch--cut')) ScrollTrigger.create({
        trigger: sec, start: 'top top+=60', end: () => 'top+=' + Math.round(innerHeight * .42) + ' top',   // cream top of the painting is under the header
        onToggle: self => root.classList.toggle('ui-ink', self.isActive),
      });
      // Active chapter in the list
      ScrollTrigger.create({
        trigger: sec.querySelector('.ch__open') || sec, endTrigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: self => { if (self.isActive) items.forEach(a => a.parentElement.classList.toggle('is-active', a.dataset.chLink === sec.id)); },
      });
      // The giant word lifts a little faster than the painting
      const word = sec.querySelector('[data-word]');
      if (word && !reduced && !sec.classList.contains('ch--cut')) gsap.fromTo(word, { yPercent: 10, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: sec.querySelector('.ch__open') || sec, start: 'top 90%', end: 'top 20%', scrub: true } });
    });
    const hero = d.querySelector('[data-hero]');
    if (hero) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onToggle: self => { if (self.isActive) items.forEach(a => a.parentElement.classList.remove('is-active')); } });
    d.querySelectorAll('[data-ink]').forEach(sec => {
      ScrollTrigger.create({ trigger: sec, start: 'top top+=60', end: 'bottom top+=60',
        onToggle: self => {
          root.classList.toggle('ui-ink', self.isActive);
          if (self.isActive) items.forEach(a => a.parentElement.classList.toggle('is-active', a.dataset.chLink === sec.id));
        } });
    });
  }

  /* ---------- Reveals: a quiet fade-up ---------- */
  function reveals() {
    const blocks = [...d.querySelectorAll('[data-reveal]')];
    if (reduced) { gsap.set(blocks, { opacity: 1, y: 0 }); return; }
    gsap.set(blocks, { opacity: 0, y: 24 });
    ScrollTrigger.batch(blocks, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: EXPO, stagger: Math.min(.08, .5 / b.length) }) });
    // Fanned cards spread as they arrive
    d.querySelectorAll('[data-fan]').forEach(fan => {
      const cards = [...fan.querySelectorAll('.fan__card')];
      if (!desktop()) return;
      gsap.fromTo(cards, { y: 80, rotate: 0 }, { y: 0, rotate: (i, el) => parseFloat(getComputedStyle(el).getPropertyValue('--r')), duration: 1.2, ease: EXPO, stagger: .1, scrollTrigger: { trigger: fan, start: 'top 85%', once: true } });
      fanHover(fan, cards);
    });
  }

  /* ---------- Fanned cards: a heavy, physical hover ----------
     The card under the cursor lifts, straightens a little, grows and casts a deeper shadow,
     and tilts towards the pointer; its neighbours ease apart and settle back. Long, soft eases
     so it feels weighted rather than snappy. */
  function fanHover(fan, cards) {
    if (reduced || !matchMedia('(hover: hover)').matches) return;
    const base = cards.map(el => parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0);
    const browsers = cards.map(el => el.querySelector('.browser'));
    gsap.set(cards, { transformPerspective: 1400, transformOrigin: '50% 70%' });
    const rest = () => cards.forEach((c, k) => { c.style.zIndex = String(k + 1); });   // later cards on top, as laid out
    rest();
    const tilt = cards.map(el => ({ x: gsap.quickTo(el, 'rotationX', { duration: 1.1, ease: 'power3.out' }),
                                    y: gsap.quickTo(el, 'rotationY', { duration: 1.1, ease: 'power3.out' }) }));
    let active = -1, zTimer = 0;
    const layout = h => cards.forEach((el, i) => {
      const isH = i === h, dir = h < 0 ? 0 : Math.sign(i - h);
      gsap.to(el, { y: isH ? -30 : (h < 0 ? 0 : 8), x: dir * 38, rotation: isH ? base[i] * .35 : base[i] + dir * 1.6,
        scale: isH ? 1.05 : (h < 0 ? 1 : .975), duration: 1.15, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(browsers[i], { '--lift': isH ? 1 : 0, duration: 1.15, ease: 'power3.out', overwrite: 'auto' });
      if (!isH) { tilt[i].x(0); tilt[i].y(0); }
    });
    cards.forEach((el, i) => {
      el.addEventListener('mouseenter', () => {
        clearTimeout(zTimer); active = i;
        rest(); el.style.zIndex = String(cards.length + 2);
        layout(i);
      });
      el.addEventListener('mousemove', e => {
        if (active !== i) return;
        const r = el.getBoundingClientRect();
        tilt[i].y(((e.clientX - r.left) / r.width - .5) * 7);
        tilt[i].x(-((e.clientY - r.top) / r.height - .5) * 5);
      });
    });
    fan.addEventListener('mouseleave', () => {
      const was = active; active = -1; layout(-1);
      // keep the lifted card on top until it has settled back into the fan
      zTimer = setTimeout(() => { if (active < 0) rest(); }, 900);
    });
  }

  /* ---------- Pinned scroll scenes ("Our solutions", "Why choose us") ----------
     A full-screen clip is scrubbed by scroll position while the section is pinned.
     The scroll range is split into steps (data-stops: centre of each step, 0-1);
     the matching panel rises in and the matching indicator lights up.
     Markup contract: [data-scene] section, [data-scene-video] video, [data-panel] per
     step, optional [data-dot] indicators (clickable with data-go), [data-scene-idx]
     counter, [data-stills] fallback stills, data-length = pin length in %. */
  function pinnedScene(sec) {
    const video = sec.querySelector('[data-scene-video]');
    const still = sec.querySelector('[data-stills]');
    const panels = [...sec.querySelectorAll('[data-panel]')];
    const dots = [...sec.querySelectorAll('[data-dot]')];
    const idx = sec.querySelector('[data-scene-idx]');
    const stills = still && still.dataset.stills ? still.dataset.stills.split(',') : [];
    const n = panels.length;
    const centres = sec.dataset.stops
      ? sec.dataset.stops.split(',').map(Number)
      : panels.map((_, i) => (i + .5) / n);
    const bounds = centres.slice(1).map((c, i) => (centres[i] + c) / 2);
    const stepFor = p => bounds.reduce((s, b) => (p >= b ? s + 1 : s), 0);
    let active = 0;

    const setActive = i => {
      if (i === active) return;
      const out = panels[active], inn = panels[i];
      active = i;
      panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
      dots.forEach((dot, k) => { dot.classList.toggle('is-active', k === i); if (dot.hasAttribute('aria-current')) dot.setAttribute('aria-current', String(k === i)); });
      if (idx) idx.textContent = String(i + 1).padStart(2, '0');
      if (still && !sec.classList.contains('is-ready') && stills[i]) still.src = stills[i];
      if (reduced) return;
      // Panels with data-side slide in from their own side (left or right); the rest rise.
      const from = p => p.dataset.side === 'right' ? 1 : p.dataset.side === 'left' ? -1 : 0;
      if (out) gsap.to(out, { opacity: 0, x: 36 * from(out), y: from(out) ? 0 : -20, duration: .3, ease: 'power2.in', overwrite: true });
      if (inn) {
        gsap.set(inn, { opacity: 1, x: 0, y: 0, overwrite: true });
        gsap.fromTo(inn.children, { opacity: 0, x: 72 * from(inn), y: from(inn) ? 0 : 44 }, { opacity: 1, x: 0, y: 0, duration: .9, ease: EXPO, stagger: .07, delay: .1, overwrite: true });
      }
    };

    if (!desktop() || reduced) return;   // phones and reduced motion get the stacked version (CSS)

    let ready = false;
    let st = null;
    const sync = () => {
      if (!st) return;
      const p = st.progress;
      setActive(stepFor(p));
      if (ready && video.duration) target = p * (video.duration - .06);
    };
    // Seek the clip from the ticker, easing towards the scroll position, and only once the
    // previous seek has finished, so the decoder never queues up and the scroll stays fluid.
    let target = 0, shown = 0;
    if (video) gsap.ticker.add(() => {
      if (!ready || video.seeking || !video.duration) return;
      const diff = target - shown;
      if (Math.abs(diff) < .01) return;
      shown += Math.abs(diff) < .04 ? diff : diff * .35;
      video.currentTime = shown;
    });
    if (video) loadClip(video, () => { ready = true; sec.classList.add('is-ready'); sync(); });

    const built = sec.hasAttribute('data-dive') ? buildDive(sec) : null;
    st = ScrollTrigger.create({
      trigger: sec, start: 'top top', end: '+=' + (sec.dataset.length || 320) + '%',
      pin: true, scrub: 1, anticipatePin: 1,
      animation: built || undefined,
      onUpdate: sync,
    });

    // Indicators jump to their step
    dots.forEach((dot, i) => {
      if (!dot.matches('button, a')) return;
      dot.addEventListener('click', e => {
        e.preventDefault();
        const y = st.start + (st.end - st.start) * centres[i];
        if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });

    const stage = sec.querySelector('[data-scene-stage]');
    if (stage) gsap.from(stage, {
      clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: EXPO,
      scrollTrigger: { trigger: sec, start: 'top 70%', once: true },
    });
  }
  /* ---------- "Why Summit": fly through the layers a Summit site is made of ----------
     Eight sheets sit one behind the other in 3D (grid, structure, type, design, build,
     direct line, live, after launch). The returned 40-unit timeline moves the camera
     through them, turns it a little each time the text changes side, and draws each
     sheet as it approaches. pinnedScene() scrubs it and switches the panels at the
     quarter marks, so each reason owns two sheets. */
  function buildDive(sec) {
    const world = sec.querySelector('[data-dive-world]');
    const layers = [...sec.querySelectorAll('[data-layer]')];
    const readout = sec.querySelector('[data-dive-layer]');
    const lq = (i, s) => layers[i].querySelector(s);
    const lqa = (i, s) => [...layers[i].querySelectorAll(s)];
    const D = 820;                    // distance between sheets, px
    const N = layers.length, TOTAL = 40, START = .6;
    const zOf = i => (i + 1) * D;
    const camEnd = zOf(N - 1);
    const cam = { z: START * D, yaw: 0, pitch: 0 };
    const tAt = i => TOTAL * (zOf(i) - START * D) / (camEnd - START * D);   // when sheet i fills the screen
    const win = i => Math.max(0, tAt(i) - (solid ? 5.8 : 4.6));            // when it starts drawing itself (solid: while still hidden behind the one in front)
    let shown = -1;
    const solid = !!sec.closest('.ch--rip');   // home: thick opaque sheets

    layers.forEach((L, i) => { L.style.transform = 'translateZ(' + (-zOf(i)) + 'px)'; });

    const render = () => {
      let ahead = -1;
      layers.forEach((L, i) => {
        const d = zOf(i) - cam.z;     // distance in front of the camera
        let o;
        if (solid) {                                  // thick, opaque sheets: the one in front hides the rest
          if (d > 2.6 * D) o = 0;
          else if (d > 1.8 * D) o = (2.6 * D - d) / (.8 * D);
          else if (d > 0) o = 1;
          else o = Math.max(0, 1 + d / (.12 * D));     // passing through: gone quickly
        }
        else if (d > 2.4 * D) o = 0;
        else if (d > 1.5 * D) o = .35 * (2.4 * D - d) / (.9 * D);
        else if (d > 0) o = .35 + .65 * (1 - d / (1.5 * D));
        else o = Math.max(0, 1 + d / (.3 * D));       // passing through: fade out
        if (!solid && d > 0 && L.dataset.far) {       // dark sheets stay faint until they are close
          const far = +L.dataset.far, k = Math.min(1, Math.max(0, (d - .25 * D) / (.65 * D)));
          o *= 1 - (1 - far) * k;
        }
        L.style.opacity = o.toFixed(3);
        L.style.visibility = o > .004 ? 'visible' : 'hidden';
        if (ahead < 0 && d > -.12 * D) ahead = i;
      });
      world.style.transform = 'rotateX(' + cam.pitch.toFixed(2) + 'deg) rotateY(' + cam.yaw.toFixed(2) + 'deg) translateZ(' + cam.z.toFixed(1) + 'px)';
      if (readout && ahead >= 0 && ahead !== shown) { shown = ahead; readout.textContent = layers[ahead].dataset.layer || ''; }
    };

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' }, onUpdate: render });
    tl.to(cam, { z: camEnd, duration: TOTAL, ease: 'none' }, 0);
    // The camera turns a little as the text changes side.
    tl.to(cam, { yaw: 6, pitch: 1.5, duration: 8, ease: 'sine.inOut' }, 1)
      .to(cam, { yaw: -6, pitch: -1.5, duration: 9, ease: 'sine.inOut' }, 10)
      .to(cam, { yaw: 5, pitch: 1.5, duration: 9, ease: 'sine.inOut' }, 20)
      .to(cam, { yaw: 0, pitch: 0, duration: 9, ease: 'sine.inOut' }, 30);

    let t;
    // 01 Grid: columns, then rows, draw themselves.
    t = win(0);
    tl.fromTo(lqa(0, '[data-draw]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .05 }, t)
      .fromTo(lq(0, '[data-cell]'), { opacity: 0 }, { opacity: .75, duration: .6 }, t + 1.3)
      .fromTo(lq(0, '[data-note]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6 }, t + 1.6);

    // 02 Structure: the blocks drop into the grid.
    t = win(1);
    tl.fromTo(lqa(1, '[data-wf]'), { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: .55, stagger: .22 }, t);

    // 03 Type: the headline rises out of its line masks.
    t = win(2);
    tl.fromTo(lqa(2, '[data-line]'), { yPercent: 108 }, { yPercent: 0, duration: 1.1, ease: EXPO, stagger: .25 }, t)
      .fromTo(lq(2, '[data-spec]'), { opacity: 0 }, { opacity: 1, duration: .6 }, t + 1.2)
      .fromTo(lqa(2, '[data-chip]'), { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(1.8)', stagger: .1 }, t + 1.5);

    // 04 Design: the page assembles, the picture draws, the button lands.
    t = win(3);
    tl.fromTo(lqa(3, '[data-ui]'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, stagger: .2 }, t)
      .fromTo(lqa(3, '[data-draw]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power1.inOut', stagger: .15 }, t + .8)
      .fromTo(lq(3, '[data-cta]'), { scale: .5 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, t + 1.9)
      .fromTo(lq(3, '[data-tag]'), { opacity: 0 }, { opacity: 1, duration: .5 }, t + 2.2);

    // 05 Build: the markup types out while the week ruler fills to Launch.
    t = win(4);
    tl.fromTo(lqa(4, '[data-cl]'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .4, ease: 'none', stagger: .16 }, t)
      .fromTo(lq(4, '[data-rfill]'), { scaleX: 0 }, { scaleX: 1, duration: 2.6, ease: 'none' }, t + .6);
    lqa(4, '[data-tick]').forEach((el, i) => tl.set(el, { attr: { 'data-on': 1 } }, t + .7 + i * .85));
    tl.fromTo(lq(4, '[data-live]'), { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, t + 3.2);

    // 06 Direct line: you, then the people doing the work, joined with nothing in between.
    t = win(5);
    tl.fromTo(lqa(5, '[data-node]'), { scale: 0 }, { scale: 1, duration: .7, ease: 'back.out(1.7)', stagger: .3 }, t)
      .fromTo(lqa(5, '[data-wire]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: .15 }, t + .6)
      .fromTo(lq(5, '[data-am]'), { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(1.7)' }, t + 1.8)
      .fromTo(lq(5, '[data-strike]'), { scaleX: 0, rotation: -6 }, { scaleX: 1, rotation: -6, duration: .35, ease: 'power2.in' }, t + 2.5)
      .to(lq(5, '[data-am]'), { opacity: .3, duration: .4 }, t + 2.8)
      .fromTo(lq(5, '[data-note]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6 }, t + 3);

    // 07 Live: the site is up and watched.
    t = win(6);
    tl.fromTo(lq(6, '[data-frame]'), { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .8 }, t)
      .fromTo(lq(6, '[data-tag]'), { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, t + .7)
      .fromTo(lq(6, '[data-pulse]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'none' }, t + .9)
      .fromTo(lqa(6, '[data-stat]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5, stagger: .15 }, t + 1.4);

    // 08 After launch: the headline, then the months fill in.
    t = win(7);
    tl.fromTo(lqa(7, '[data-line]'), { yPercent: 108 }, { yPercent: 0, duration: 1.1, ease: EXPO, stagger: .25 }, t)
      .fromTo(lq(7, '[data-rfill]'), { scaleX: 0 }, { scaleX: 1, duration: 3, ease: 'none' }, t + .8);
    lqa(7, '[data-tick]').forEach((el, i) => tl.set(el, { attr: { 'data-on': 1 } }, t + .9 + i * .72));

    render();
    return tl;
  }

  /* ---------- Home hero: the spark at the fingertip opens into a portal ----------
     Scrolling through the pinned hero, a spark at the pointing hand grows into a ring of light,
     the painting outside it turns into glowing line work, the inside becomes a field of stars,
     and the first chapter's painting draws itself out of the dark. The last frame matches the
     chapter's own background exactly, so the handoff is invisible. WebGL1; without it (or with
     reduced motion) the hero stays a still painting. */
  function portal() {
    const hero = d.querySelector('[data-portal]');
    const next = hero && d.querySelector('[data-ch]');
    if (!hero || !next || reduced) return;
    const canvas = hero.querySelector('[data-portal-canvas]');
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return;
    const copy = hero.querySelector('[data-portal-copy]');
    const shade = hero.querySelector('.hero__shade');
    const imgA = hero.querySelector('.paint');
    const imgB = next.querySelector('.paint');
    const nextBg = next.querySelector('.ch__bg');
    imgB.loading = 'eager';   // it must be decoded before the handoff
    const [fu, fv] = (hero.dataset.portal || '.6146,.1955').split(',').map(Number); // spark, as a fraction of the painting
    root.classList.add('has-portal');
    next.classList.add('is-intro');

    const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
    const FS = `precision highp float;
uniform sampler2D uA, uB; uniform vec2 uRes, uKA, uKB, uC; uniform float uP, uT, uDpr, uRmax;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
float edge(sampler2D t, vec2 uv, vec2 px){
  float tl = lum(texture2D(t, uv + px * vec2(-1., 1.)).rgb), tc = lum(texture2D(t, uv + px * vec2(0., 1.)).rgb), tr = lum(texture2D(t, uv + px * vec2(1., 1.)).rgb);
  float ml = lum(texture2D(t, uv + px * vec2(-1., 0.)).rgb), mr = lum(texture2D(t, uv + px * vec2(1., 0.)).rgb);
  float bl = lum(texture2D(t, uv + px * vec2(-1., -1.)).rgb), bc = lum(texture2D(t, uv + px * vec2(0., -1.)).rgb), br = lum(texture2D(t, uv + px * vec2(1., -1.)).rgb);
  return length(vec2(tr + 2. * mr + br - tl - 2. * ml - bl, tl + 2. * tc + tr - bl - 2. * bc - br));
}
vec3 lines(sampler2D t, vec2 uv, vec2 px, vec3 base){
  float e = smoothstep(.11, .44, edge(t, uv, px));
  return base * .12 + vec3(.98, .95, .88) * e * .92;
}
vec3 stars(vec2 f){
  vec3 c = vec3(0.);
  float s1 = 38. * uDpr; vec2 k1 = floor(f / s1); float h1 = hash(k1);
  if (h1 > .78) { vec2 sp = (k1 + .2 + .6 * vec2(hash(k1 + 3.1), hash(k1 + 7.7))) * s1; float dd = length(f - sp) / uDpr;
    c += vec3(1., .97, .9) * (.55 + .45 * sin(uT * 2.3 + h1 * 60.)) * exp(-dd * .9) * 1.3; }
  float s2 = 150. * uDpr; vec2 k2 = floor(f / s2); float h2 = hash(k2 + 19.);
  if (h2 > .55) { vec2 sp = (k2 + .4 + .2 * vec2(hash(k2 + 1.3), hash(k2 + 5.9))) * s2; vec2 q = abs(f - sp) / uDpr;
    float tw = .6 + .4 * sin(uT * 1.7 + h2 * 40.);
    c += vec3(1., .93, .82) * tw * (exp(-length(q) * .35) * 1.4 + (exp(-q.y * 1.1) * exp(-q.x * .05) + exp(-q.x * 1.1) * exp(-q.y * .05)) * .75); }
  return c;
}
void main(){
  vec2 f = gl_FragCoord.xy, s = f / uRes;
  vec2 uvA = (s - .5) * uKA + .5, uvB = (s - .5) * uKB + .5;
  vec2 pxA = uKA / uRes * 1.2 * uDpr, pxB = uKB / uRes * 1.2 * uDpr;
  vec3 pa = texture2D(uA, uvA).rgb, pb = texture2D(uB, uvB).rgb;
  float H = uRes.y / uDpr;                         // viewport height in CSS px
  vec2 q = (f - uC) / uDpr; float dp = length(q);  // distance from the spark, CSS px
  float ang = atan(q.y, q.x);
  float grain = hash(floor(f / (1.5 * uDpr)) + floor(uT * 14.));

  // ring radius: slow start, then it races out past the corners
  float g = clamp((uP - .02) / .56, 0., 1.);
  float R = uRmax * 1.08 * H * pow(g, 1.7);
  R *= 1. + .045 * sin(ang * 3. + uT * .8) + .03 * sin(ang * 7. - uT * 1.3);
  float w = 9. + .05 * R;
  float rd = dp - R;
  float inside = 1. - smoothstep(-w * .6, w * .25, rd);

  // outside the ring: painting turning into line work, stars arriving
  float la = smoothstep(.12, .46, uP);
  vec3 st = stars(f);
  vec3 outC = mix(pa, lines(uA, uvA, pxA, pa) + st * .7, la);
  // inside: the next painting (chapter I) as glowing line work, with a few faint stars
  vec3 lineB = lines(uB, uvB, pxB, pb);
  vec3 inC = lineB + st * .5;
  vec3 col = mix(outC, inC, inside);

  // the ring itself: glittering, with a soft halo and sparks flung outwards
  float rI = 1. - smoothstep(.5, .62, uP);
  float ring = exp(-pow(rd / w, 2.)) * (.62 + .7 * step(.5, grain)) + exp(-abs(rd) / (w * 4.)) * .24;
  ring += step(.992, grain) * exp(-max(rd, 0.) / (w * 6.)) * step(0., rd) * 1.2;
  col += vec3(1., .98, .94) * ring * rI * smoothstep(0., .02, uP);

  // the spark at the fingertip (strongest before any scrolling)
  float sI = 1. - smoothstep(.04, .2, uP);
  float tw = .82 + .18 * sin(uT * 3.1) * sin(uT * 1.7);
  vec2 aq = abs(q);
  float spark = exp(-dp / 4.) * 1.3 + exp(-dp / 26.) * .38 + (exp(-aq.y * 1.4) * exp(-aq.x * .045) + exp(-aq.x * 1.4) * exp(-aq.y * .07)) * .55;
  spark += step(.9, grain) * exp(-dp / 30.) * 1.1;
  col += vec3(1., .97, .9) * spark * tw * sI;

  // once the ring has passed the corners, chapter I fills with colour
  float ty = 1. - s.y;
  float ov = ty < .3 ? mix(.25, 0., ty / .3) : mix(0., .35, (ty - .3) / .7);   // the chapter's own gradient
  vec3 fin = mix(pb, vec3(41., 41., 25.) / 255., ov);
  float cb = smoothstep(.88, .995, uP);
  // keep the sidebar legible over the line work
  col *= 1. - .5 * (1. - smoothstep(.0, .24, s.x)) * max(la, inside) * (1. - cb);
  col = mix(col, fin, cb);
  gl_FragColor = vec4(col, 1.);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { root.classList.remove('has-portal'); next.classList.remove('is-intro'); console.warn('portal:', e.message); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uA', 'uB', 'uRes', 'uKA', 'uKB', 'uC', 'uP', 'uT', 'uDpr', 'uRmax'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);

    const sizes = [[1344, 752], [1344, 752]];
    const texture = (unit, src, i) => new Promise((res, rej) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => {
        sizes[i] = [im.naturalWidth, im.naturalHeight];
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        res();
      };
      im.onerror = rej; im.src = src;
    });

    let W = 0, Hh = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; Hh = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const k = ([iw, ih]) => { const sc = Math.max(W / iw, Hh / ih); return [W / (iw * sc), Hh / (ih * sc)]; };
      const kA = k(sizes[0]), kB = k(sizes[1]);
      gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform2f(U.uKA, kA[0], kA[1]); gl.uniform2f(U.uKB, kB[0], kB[1]); gl.uniform1f(U.uDpr, dpr);
      // spark position on screen (object-fit: cover, centred), in device px with y up
      const sc = Math.max(W / sizes[0][0], Hh / sizes[0][1]);
      const cx = (W - sizes[0][0] * sc) / 2 + fu * sizes[0][0] * sc, cy = (Hh - sizes[0][1] * sc) / 2 + fv * sizes[0][1] * sc;
      gl.uniform2f(U.uC, cx * dpr, (Hh - cy) * dpr);
      const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, Hh - cy), Math.hypot(W - cx, Hh - cy));
      gl.uniform1f(U.uRmax, far / Hh);
    };

    let target = 0, p = 0, raf = 0, ready = false, done = false;
    const t0 = performance.now();
    const apply = () => {
      const end = p > .999;
      if (end !== done) {
        done = end;
        if (end) {
          // Show chapter I's own painting at full strength first (no fade, or the page colour
          // flashes through), and only then hide the canvas, one frame later.
          nextBg.style.transition = 'none';
          next.classList.remove('is-intro');
          void nextBg.offsetHeight;
          requestAnimationFrame(() => { if (done) canvas.style.visibility = 'hidden'; nextBg.style.transition = ''; });
        } else { canvas.style.visibility = ''; next.classList.add('is-intro'); }
      }
      const c = 1 - gsap.utils.clamp(0, 1, p / .12);
      if (copy) { copy.style.opacity = c; copy.style.transform = `translate3d(0, ${(1 - c) * -24}px, 0)`; }
      if (shade) shade.style.opacity = c;
    };
    const frame = () => {
      raf = 0;
      p += (target - p) * .2; if (Math.abs(target - p) < .0005) p = target;
      apply();
      if (!done) {
        gl.uniform1f(U.uP, p); gl.uniform1f(U.uT, (performance.now() - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (!done && !d.hidden) raf = requestAnimationFrame(frame);   // keep twinkling while visible
    };
    const kick = () => { if (ready && !raf) raf = requestAnimationFrame(frame); };

    ScrollTrigger.create({
      trigger: hero, start: 'top top', endTrigger: next, end: 'top top',
      onUpdate: self => { target = self.progress; if (target < 1 && done) { done = false; canvas.style.visibility = ''; next.classList.add('is-intro'); } kick(); },
      onLeave: () => { target = 1; kick(); },
      onRefresh: self => { target = self.progress; kick(); },
    });
    addEventListener('resize', () => { if (ready) { size(); kick(); } });
    d.addEventListener('visibilitychange', kick);

    Promise.all([texture(0, imgA.currentSrc || imgA.src, 0), texture(1, imgB.src, 1)]).then(() => {
      size(); ready = true; p = target; canvas.classList.add('is-ready'); kick();
    }).catch(() => { root.classList.remove('has-portal'); next.classList.remove('is-intro'); ScrollTrigger.refresh(); });
  }

  /* ---------- Corner reveal: the next page grows out of the bottom-right corner ----------
     The stage is pinned (CSS sticky) over the painting; scrolling opens a rectangle anchored to
     the very corner of the screen until it fills it, with a soft rounded leading corner. The
     page inside settles in from the corner, and the example call's lines arrive one by one. */
  function corners() {
    if (reduced) return;
    const all = [...d.querySelectorAll('[data-corner]')];
    if (!all.length) return;
    root.classList.add('has-corner');
    all.forEach(c => {
      const stage = c.querySelector('.corner__stage');
      const page = c.querySelector('.corner__page');
      const lines = [...c.querySelectorAll('[data-call-line]')];
      const set = t => {
        const k = ((1 - t) * 100).toFixed(3);
        const r = Math.round(44 * (1 - t));
        stage.style.clipPath = t >= 1 ? 'none' : `inset(${k}% 0% 0% ${k}% round ${r}px 0 0 0)`;
        const m = 1 - t;
        page.style.transform = m > 0 ? `translate3d(${(m * 6).toFixed(3)}vw, ${(m * 6).toFixed(3)}vh, 0) scale(${(1 + m * .08).toFixed(4)})` : 'none';
        lines.forEach((l, i) => {
          const a = gsap.utils.clamp(0, 1, (t - .5 - i * .09) / .12);
          l.style.opacity = a; l.style.transform = `translate3d(0, ${((1 - a) * 14).toFixed(2)}px, 0)`;
        });
      };
      const st = { t: 0 }; set(0);
      gsap.to(st, { t: 1, ease: 'power2.inOut', onUpdate: () => set(st.t),
        scrollTrigger: { trigger: c, start: 'top top', end: 'bottom bottom', scrub: 1.1 } });
    });
  }

  /* ---------- Process: the clip stays put while the steps slide left ----------
     The stage is sticky; the section is made exactly as tall as the sideways travel needs,
     so a step moves one card-width for each stretch of scroll. The clip pauses off screen. */
  function process() {
    const sec = d.querySelector('[data-process]');
    if (!sec) return;
    const video = sec.querySelector('video');
    if (video) {
      video.muted = true;
      new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause(); }); }, { rootMargin: '200px 0px' }).observe(sec);
    }
    if (reduced) return;
    root.classList.add('has-process');
    const track = sec.querySelector('[data-process-track]');
    const now = sec.querySelector('[data-process-now]');
    const steps = [...track.children];
    const travel = () => Math.max(0, track.scrollWidth - innerWidth);
    // a paper chapter straight after tears up over the pinned clip, so leave one extra screen for it
    const tail = sec.nextElementSibling && sec.nextElementSibling.classList.contains('ch--plain') ? 1 : 0;
    if (tail) root.classList.add('proc-tail');
    const glide = () => innerHeight * .36;
    const fit = () => { sec.style.height = `calc(${100 + tail * 100}svh + ${Math.round(travel() * 1.6 + glide())}px)`; };
    fit();
    // A soft landing: when the stage locks, its heading and steps don't stop dead. They arrive
    // half a glide low and ease up into place over the next third of a screen (their speed at
    // the lock matches the scroll), while the clip settles from a slight zoom.
    const settle = { trigger: sec, start: 'top top', end: () => '+=' + Math.round(glide()), scrub: .5, invalidateOnRefresh: true };
    gsap.fromTo([sec.querySelector('.proc__head'), sec.querySelector('.proc__rail')].filter(Boolean),
      { y: () => glide() / 2 }, { y: 0, ease: 'power2.out', scrollTrigger: settle });
    if (video) gsap.fromTo(video, { scale: 1.08 }, { scale: 1, ease: 'power2.out', scrollTrigger: { ...settle } });
    let shown = 1;
    gsap.to(track, {
      x: () => -travel(), ease: 'none',
      onUpdate: () => {   // runs with the smoothed motion, so the count matches what is on screen
        if (!now) return;
        const col = steps[0].offsetLeft, x = gsap.getProperty(track, 'x');
        let k = 0; steps.forEach((el, i) => { if (el.offsetLeft - col + x < el.offsetWidth * .5) k = i; });
        if (k + 1 !== shown) { shown = k + 1; now.textContent = shown; }
      },
      // the steps start sliding once the soft landing has settled
      scrollTrigger: { trigger: sec, start: () => 'top top-=' + Math.round(glide()), end: () => '+=' + Math.round(travel() * 1.6), scrub: 1.2, invalidateOnRefresh: true, onRefreshInit: fit },
    });
  }

  /* ---------- Bar-chart steps: bars grow with the scroll, one after another ---------- */
  function chartSteps() {
    d.querySelectorAll('[data-chart]').forEach(ch => {
      const bars = [...ch.querySelectorAll('[data-bar]')];
      if (reduced) return;
      const labels = [...ch.querySelectorAll('.bar__x, .bar__n')];
      gsap.set(bars, { '--g': 0 });
      gsap.set(labels, { opacity: .2 });
      // desktop: the chart holds still while the bars grow; phones: they grow as the list passes
      const st = desktop()
        ? { trigger: ch.closest('[data-chart-wrap]') || ch, start: 'top 8%', end: '+=95%', pin: true, pinSpacing: true, scrub: 1.2, anticipatePin: 1 }
        : { trigger: ch, start: 'top 80%', end: 'bottom 60%', scrub: 1.2 };
      const tl = gsap.timeline({ scrollTrigger: st });
      bars.forEach((b, i) => {
        const li = b.closest('.bar');
        tl.to(b, { '--g': 1, duration: 1, ease: 'power2.out' }, i * .45)
          .to(li.querySelectorAll('.bar__x, .bar__n'), { opacity: 1, duration: .5, ease: 'none' }, i * .45 + .3);
      });
    });
  }

  /* ---------- Birds: the flock rises up and to the right as you scroll ---------- */
  function birds() {
    if (reduced) return;
    d.querySelectorAll('.flock').forEach(f => {
      const sec = f.closest('section');
      f.querySelectorAll('[data-bird]').forEach(b => {
        const v = parseFloat(b.dataset.bird) || 1;
        gsap.fromTo(b, { y: 120 * v, x: -60 * v }, { y: -360 * v, x: 140 * v, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
      });
    });
  }

  /* ---------- Crossing the desktop breakpoint rebuilds the page ---------- */  /* ---------- Crossing the desktop breakpoint rebuilds the page ---------- */  /* ---------- Crossing the desktop breakpoint rebuilds the page ---------- */  /* ---------- Crossing the desktop breakpoint rebuilds the page ---------- */
  matchMedia('(min-width: 900px)').addEventListener('change', () => location.reload());

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { splitStore.forEach((_, el) => { const lines = split(el); gsap.set(lines, { yPercent: 0 }); }); ScrollTrigger.refresh(); }, 150); });

  /* ---------- Boot ---------- */
  // ScrollTriggers are created in page order, so each one is measured after the pins above it
  portal();
  process();
  birds();
  chartSteps();
  corners();
  d.querySelectorAll('[data-scene]').forEach(pinnedScene);
  draftingBox();
  footerSide();
  chapters();
  reveals();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => ScrollTrigger.refresh());
  if (location.hash) { const t = d.querySelector(location.hash); if (t) gsap.delayedCall(.5, () => { ScrollTrigger.refresh(); scrollToEl(t); }); }
  window.__summit = { lenis, ScrollTrigger };
})();
