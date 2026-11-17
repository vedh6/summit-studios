/* Summit Studios v3: behaviour that works without the motion layer.
   Menu, local clock, forms, booking embed, project filters. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  root.classList.add('js');

  /* ---------- Google Analytics: the cookie choice and what counts as engagement ----------
     The tag in <head> waits for a yes from visitors in the EEA, UK and Switzerland and counts everyone
     else; ad cookies are never set. The bar asks once, only where the device clock says Europe; the
     footer's 'Cookie choices' opens it again for anyone. */
  const ga = (...a) => { try { if (window.gtag) window.gtag(...a); } catch (e) {} };
  const CK = 'ga-consent';
  const askConsent = () => {
    if (d.querySelector('.ck')) return;
    const bar = d.createElement('div');
    bar.className = 'ck'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie choice');
    bar.innerHTML = '<p class="ck__t">We use Google Analytics to see how people find and use this site. No ads, and nothing is sold.</p>'
      + '<div class="ck__b"><button type="button" class="ck__no">Decline</button><button type="button" class="ck__yes">Allow</button></div>';
    const pick = yes => {
      try { localStorage.setItem(CK, yes ? 'granted' : 'denied'); } catch (e) {}
      ga('consent', 'update', { analytics_storage: yes ? 'granted' : 'denied' });
      if (!yes) d.cookie.split(';').forEach(c => {   // a change of mind: clear the Analytics cookies already set
        const n = c.split('=')[0].trim();
        if (/^_ga/.test(n)) ['', location.hostname, '.' + location.hostname.replace(/^www\./, '')].forEach(dm => { d.cookie = n + '=; Max-Age=0; path=/' + (dm ? '; domain=' + dm : ''); });
      });
      bar.classList.remove('is-in'); setTimeout(() => bar.remove(), 450);
    };
    bar.querySelector('.ck__yes').addEventListener('click', () => pick(true));
    bar.querySelector('.ck__no').addEventListener('click', () => pick(false));
    d.body.append(bar);
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('is-in')));
  };
  let ckSaved = null, tz = '';
  try { ckSaved = localStorage.getItem(CK); } catch (e) {}
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  if (!ckSaved && /^(Europe|Arctic)\/|^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz)) setTimeout(askConsent, 1200);
  d.querySelectorAll('[data-consent-open]').forEach(b => b.addEventListener('click', askConsent));

  // engagement: a click towards Contact / Get started, a client's site opened, an email link
  d.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const box = a.closest('section[id], footer, header'), section = box ? (box.id || box.tagName.toLowerCase()) : '';
    const text = ((a.querySelector('.ihb__t') || a).textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) || a.getAttribute('aria-label') || '';
    if (a.protocol === 'mailto:') ga('event', 'email_click', { section });
    else if (a.host === location.host && /^\/(contact|get-started)(\.html)?$/.test(a.pathname)) ga('event', 'start_conversation', { link_text: text, section });
    else if (a.target === '_blank' && a.host && a.host !== location.host) ga('event', 'visit_client_site', { site: a.hostname.replace(/^www\./, ''), section });
  }, true);

  /* ---------- Mobile menu ---------- */
  const menuBtn = d.querySelector('[data-menu]');
  const closeMenu = () => { root.classList.remove('nav-open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => { const open = root.classList.toggle('nav-open'); menuBtn.setAttribute('aria-expanded', String(open)); });
    d.querySelectorAll('.hdr__nav a').forEach(a => a.addEventListener('click', closeMenu));
    d.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Chapter index: the arrow pops it out once it has tucked away ---------- */
  const sbToggle = d.querySelector('[data-sb-toggle]');
  if (sbToggle) {
    const sb = d.querySelector('[data-sb]');
    const setOpen = open => {
      root.classList.toggle('sb-open', open);
      sbToggle.setAttribute('aria-expanded', String(open));
      sbToggle.querySelector('.sr').textContent = open ? 'Hide the chapter index' : 'Show the chapter index';
    };
    sbToggle.addEventListener('click', e => { e.stopPropagation(); setOpen(!root.classList.contains('sb-open')); });
    d.addEventListener('click', e => { if (root.classList.contains('sb-open') && !sb.contains(e.target)) setOpen(false); });
    sb.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('sb-open')) { setOpen(false); sbToggle.focus(); } });
    window.__sbClose = () => setOpen(false);
  }

  /* ---------- Local clock ---------- */
  const clocks = d.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    const tick = () => { const t = fmt.format(new Date()); clocks.forEach(c => { c.textContent = t; }); };
    tick(); setInterval(tick, 15000);
  }

  /* ---------- Forms: sent by email through FormSubmit ----------
     Without JS the form posts normally (FormSubmit shows its own thank-you page). With JS it
     posts to the AJAX endpoint and shows the inline Sent / Not sent state. */
  d.querySelectorAll('form[data-send]').forEach(f => {
    const btn = f.querySelector('[type=submit]');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      f.classList.remove('is-error');
      const lab = btn.querySelector('[data-label]') || btn, label = lab.textContent; btn.disabled = true; lab.textContent = 'Sending…';
      const data = {};   // a field ticked more than once (the help chips) goes as one comma-separated line
      for (const [k, v] of new FormData(f)) data[k] = k in data ? data[k] + ', ' + v : v;
      // FormSubmit identifies a form by the page address in _url, and a new address (another page, a query
      // string, the preview or the vercel.app host) can count as a new form that needs activating again.
      // Every form reports one fixed address; the page it was really sent from goes in an ordinary field.
      data._url = 'https://www.summitxstudio.com/contact';
      data['Sent from'] = location.host + location.pathname;
      // sent as an ordinary form post (not JSON), so the browser needn't ask FormSubmit's permission
      // first (that round trip alone took 10-15 s); given up on after 30 s so it never hangs
      // FormSubmit can take a while (the first message to a new address triggers its activation email),
      // so after 8 s the button says so, and it waits a full minute before giving up
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 60000), slow = setTimeout(() => { lab.textContent = 'Still sending…'; }, 8000);
      let why = '';
      try {
        const r = await fetch(f.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(data), signal: ctl.signal });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) !== 'true') { why = j.message || ''; throw new Error(why || r.status); }
        f.classList.add('is-sent');
        ga('event', 'generate_lead', { form: /review/i.test(f.dataset.subject || '') ? 'free_review' : 'enquiry' });
      } catch (err) {
        if (err.name === 'AbortError') why = 'The form service took too long to answer, so it may still arrive. If you do not hear from us within a working day, please email us.';
        const box = f.querySelector('.form__err');
        let p = box && box.querySelector('.form__why');
        if (box && !p) { p = d.createElement('p'); p.className = 'form__why'; box.append(p); }
        if (p) p.textContent = why;   // e.g. FormSubmit's "This form needs Activation..." while it's being set up
        f.classList.add('is-error');
      } finally { clearTimeout(timer); clearTimeout(slow); btn.disabled = false; lab.textContent = label; }
    });
  });

  /* ---------- Things that grow into place when they come into view ---------- */
  const growers = d.querySelectorAll('[data-grow]');
  if (growers.length) {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) growers.forEach(g => g.classList.add('is-in'));
    else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .3 }); growers.forEach(g => io.observe(g)); }
  }

  /* ---------- Studio's first screen: a living gradient on the parchment. Simplex noise drifts light
     tints of the site's gold, sage and clay (after the 'Velaris' WebGL component the user sent; ported,
     no React). Its neutral is white and the canvas is multiplied onto the paper, so the paper's grain
     shows through; it is one screen tall and sticky, so it drifts behind the whole page. Runs only while on screen; with
     reduced motion it draws one still frame; without WebGL the paper is simply plain. ---------- */
  d.querySelectorAll('[data-vel]').forEach(sec => {
    const canvas = sec.tagName === 'CANVAS' ? sec : sec.querySelector('canvas'), gl = canvas && canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const VS = 'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
    const FS = `precision highp float;varying vec2 vUv;uniform vec2 u_resolution;uniform float u_time;uniform float u_grain;uniform vec3 u_colors[4];uniform vec3 u_bg;uniform float u_end;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
void main(){vec2 uv=vUv;float ratio=u_resolution.x/u_resolution.y;vec2 p=uv-0.5;p.x*=ratio;float t=u_time*0.1;
float n1=snoise(p*0.4+vec2(t*0.2,-t*0.3));float n2=snoise(p*0.55+vec2(-t*0.15,t*0.25)+n1*0.25);float n3=snoise(p*0.75+vec2(t*0.1,-t*0.2)+n2*0.2);
vec3 col=u_bg;float dist=length(p)*1.5;float vignette=1.0-smoothstep(0.3,1.2,dist);
col=mix(col,u_colors[0],smoothstep(-0.2,0.5,n1)*0.85);col=mix(col,u_colors[1],smoothstep(-0.1,0.6,n2)*0.7);
col=mix(col,u_colors[2],smoothstep(-0.3,0.4,n3)*0.6);col=mix(col,u_colors[3],smoothstep(0.0,0.7,n1*n2)*0.5);
col=mix(col,u_colors[1],smoothstep(0.8,0.0,dist)*0.25);col=mix(u_bg,col,mix(0.55,1.0,vignette));col=mix(u_bg,col,smoothstep(u_end,u_end+0.38,uv.y));
float grain=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time);col+=(grain-0.5)*u_grain*0.1;gl_FragColor=vec4(col,1.0);}`;
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n), rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    gl.uniform3f(U('u_bg'), ...rgb(sec.dataset.velBg || '#FFFFFF'));
    gl.uniform3fv(U('u_colors'), new Float32Array((sec.dataset.velColors || '').split(',').slice(0, 4).flatMap(rgb)));
    gl.uniform1f(U('u_grain'), .2);
    const uRes = U('u_resolution'), uTime = U('u_time'), uEnd = U('u_end'), SPEED = 1.4;
    // where the sheet ends, measured up the canvas from its foot (0 = foot, 1 = top): the gradient fades into plain
    // paper just above it, so it meets the footer's torn paper edge without a line
    const sheet = canvas.closest('.st') || canvas.parentElement;
    const end = () => { const c = canvas.getBoundingClientRect(), r = sheet.getBoundingClientRect(); return (c.bottom - r.bottom) / (c.height || 1); };
    const size = () => { const r = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(canvas.clientWidth * r); canvas.height = Math.round(canvas.clientHeight * r); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height); };
    const frame = t => { gl.uniform1f(uTime, t * .001 * SPEED); gl.uniform1f(uEnd, end()); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    size();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, on = false;
    const loop = t => { frame(t); raf = on ? requestAnimationFrame(loop) : 0; };
    new ResizeObserver(() => { size(); if (still || !on) frame(9000); }).observe(sec);
    if (still) { frame(9000); addEventListener('scroll', () => frame(9000), { passive: true }); return; }
    new IntersectionObserver(es => es.forEach(e => { on = e.isIntersecting; if (on && !raf) raf = requestAnimationFrame(loop); })).observe(sec);
  });

  /* ---------- Highlighted capabilities (Studio): + opens a card's details; arrows step the row ---------- */
  d.querySelectorAll('[data-hc]').forEach(sec => {
    const row = sec.querySelector('[data-hc-row]'), go = [...sec.querySelectorAll('[data-hc-go]')];
    row.querySelectorAll('.hc__btn').forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('.hc__card'), panel = d.getElementById(btn.getAttribute('aria-controls')), open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; card.classList.toggle('is-open', open);
      btn.setAttribute('aria-label', (open ? 'Close ' : 'More about ') + card.querySelector('.hc__t').textContent);
    }));
    const ends = () => { const max = row.scrollWidth - row.clientWidth - 2; go[0].disabled = row.scrollLeft <= 2; go[1].disabled = row.scrollLeft >= max; };
    go.forEach(b => b.addEventListener('click', () => {
      const card = row.querySelector('.hc__card'), step = card.offsetWidth + parseFloat(getComputedStyle(row).columnGap || 0);
      row.scrollBy({ left: step * +b.dataset.hcGo, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
    row.addEventListener('scroll', ends, { passive: true }); addEventListener('resize', ends); ends();
  });

  /* ---------- 'Give me another' (Studio): shuffle to another live client, circle the new name ---------- */
  d.querySelectorAll('[data-spin]').forEach(box => {
    const items = JSON.parse(box.querySelector('[data-spin-data]').textContent);
    const q = s => box.querySelector(s), name = q('[data-spin-name]'), say = q('[data-spin-say]'), link = q('[data-spin-link]'), loop = q('.ink__mark path');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0, busy = false;
    q('[data-spin-next]').addEventListener('click', () => {
      if (busy || items.length < 2) return;
      let next = cur; while (next === cur) next = Math.floor(Math.random() * items.length);
      cur = next; const it = items[cur];
      const swap = () => { name.innerHTML = it.name; say.innerHTML = it.say; link.href = it.url; };   // build-time copy from content.py
      if (still) { swap(); return; }
      busy = true; box.classList.add('is-swap');
      setTimeout(() => {
        swap(); box.classList.remove('is-swap');
        loop.style.animation = 'none'; loop.getBoundingClientRect(); loop.style.animation = '';   // the loop draws round the new name
        busy = false;
      }, 300);
    });
  });

  /* ---------- The enquiry scroll unrolls as soon as its top is on screen: on Contact, as the page
     opens. It waits (at most 1.5 s) for its paper and roller photos so it never opens blank, then
     holds rolled up for a beat before the lower roller rolls down. ---------- */
  const scrolls = d.querySelectorAll('[data-unroll]');
  if (scrolls.length) {
    const open = f => f.classList.add('is-in');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) scrolls.forEach(open);
    else {
      const f0 = scrolls[0], sheet = f0.querySelector('.tf__sheet'), rod = f0.querySelector('.tf__rod');
      const css = (sheet ? getComputedStyle(sheet, '::after').backgroundImage : '') + (rod ? getComputedStyle(rod).borderImageSource : '');
      const urls = [...css.matchAll(/url\("?([^")]+)"?\)/g)].map(m => m[1]);
      const ready = Promise.race([Promise.all(urls.map(u => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); })), new Promise(r => setTimeout(r, 1500))]);
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target); ready.then(() => setTimeout(() => open(e.target), 450));
      }), { rootMargin: '0px 0px -10% 0px' });
      scrolls.forEach(f => io.observe(f));
    }
  }

  /* ---------- "Calls, answered": the handset cord, drawn to fit the layout ----------
     From the handset's cord stub it falls, loops once, then runs left beneath the text
     and the call card to the screen's edge. Recomputed on resize. */
  d.querySelectorAll('[data-calls]').forEach(c => {
    const svg = c.querySelector('.calls__cord'), path = svg && svg.querySelector('path');
    const hand = c.querySelector('.calls__hand img'), text = c.querySelector('.calls__text'), card = c.querySelector('.calls__card');
    if (!path || !hand) return;
    const draw = () => {
      const o = svg.getBoundingClientRect(), h = hand.getBoundingClientRect();
      if (!h.width || getComputedStyle(svg).display === 'none') return;
      const sx = h.left - o.left + h.width * .455, sy = h.top - o.top + h.height * .925;   // the cord stub
      const low = Math.max(text.getBoundingClientRect().bottom, card.getBoundingClientRect().bottom) - o.top + 48;
      const lx = sx - h.width * .55, ly = Math.max(sy + 140, low - 40);              // the loop
      const r = 16;
      svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
      path.setAttribute('d', [
        `M${sx} ${sy}`,
        `C ${sx} ${sy + (ly - sy) * .6}, ${lx + 80} ${ly - 10}, ${lx + r} ${ly}`,
        `C ${lx + r + 18} ${ly + 14}, ${lx - r} ${ly + 22}, ${lx - r} ${ly + 4}`,
        `C ${lx - r} ${ly - 16}, ${lx + r} ${ly - 8}, ${lx} ${ly + 12}`,
        `C ${lx - 60} ${low + 10}, ${o.width * .45} ${low + 24}, -20 ${low + 30}`,
      ].join(' '));
    };
    if (hand.complete) draw(); else hand.addEventListener('load', draw, { once: true });
    addEventListener('resize', draw);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(draw);
  });

  /* ---------- Rip: the cards' paper tears away to reveal the next painting ----------
     The painting sits behind the cards section. As its bottom comes up the screen, the
     paper's torn edge climbs faster than the page, and each stretch of it climbs at its own
     rate, so peaks open up on one side while the other lags behind. One fixed torn shape,
     driven only by the scroll. The painting shows as a dark etching first, then in colour. */
  d.querySelectorAll('[data-rip]').forEach(box => {
    const svg = box.querySelector('svg'), sec = box.closest('section');
    const paper = svg.querySelector('[data-wave="paper"]'), foam = svg.querySelector('[data-wave="fibre"]');
    const nextSec = sec.nextElementSibling, bg = nextSec && nextSec.querySelector('.ch__bg'), img = bg && bg.querySelector('.paint');
    const cards = [...sec.querySelectorAll('.duo__card > *')];
    // zoom-out: the painting starts close on the view through the window and pulls back
    const zoomAt = img && img.dataset.zoom ? img.dataset.zoom.split(',').map(Number) : null;
    const Z = 2.7;
    const zoomOrigin = () => {
      if (!zoomAt || !img.naturalWidth) return;
      const w = bg.clientWidth, h = bg.clientHeight, c = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * c, dh2 = img.naturalHeight * c;
      const pos = getComputedStyle(img).objectPosition.split(' ').map(v => (v.endsWith('%') ? parseFloat(v) / 100 : .5));   // where cover crops the picture
      const o = `${((w - dw) * pos[0] + zoomAt[0] * dw).toFixed(1)}px ${((h - dh2) * pos[1] + zoomAt[1] * dh2).toFixed(1)}px`;
      [img, etch].forEach(el => { if (el) { el.style.transformOrigin = o; el.style.willChange = 'transform'; } });
    };   // the parts, not the card (its reveal tween owns the card's opacity)
    let etch = null;
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const N = 260, jit = Array.from({ length: N + 1 }, () => rnd() - .5);
    const raw = Array.from({ length: N + 1 }, () => rnd()), fz = raw.map((_, i) => (raw[Math.max(0, i - 1)] + raw[i] * 2 + raw[Math.min(N, i + 1)]) / 4);
    let W = 0, H = 0;
    const size = () => { W = box.clientWidth; H = box.clientHeight; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); };
    const draw = () => {
      const vh = innerHeight, r = sec.getBoundingClientRect(), dh = sec.offsetHeight;
      const prog = (vh - r.bottom) / vh;                      // 0 when the cards' bottom reaches the screen's bottom, 1 at its top
      const lift = Math.max(0, prog - .12) * vh * .6;         // tears once the paper's edge is near the bottom of the screen
      const A = Math.min(.075 * vh, 70), sc = Math.max(W / 1440, .5);
      let p = 'M0 0 L', f = 'M0 0 L', minY = 1e9;
      for (let i = 0; i <= N; i++) {
        const x = i / N * W, u = x / sc;
        const ridge = A * (.6 * Math.sin(u / 240) + .28 * Math.sin(u / 115 + 1.3) + .12 * Math.sin(u / 47)) + jit[i] * 3;
        const rate = 1 + .5 * Math.sin(u / 360 + .7) + .25 * Math.sin(u / 150 + 2.2);   // how fast this stretch tears
        const y = Math.max(-20, dh + A + 24 + ridge - lift * rate);
        if (y < minY) minY = y;
        p += `${x.toFixed(1)} ${y.toFixed(1)} `;
        f += `${x.toFixed(1)} ${(y + 5 + fz[i] * 16).toFixed(1)} `;
      }
      paper.setAttribute('d', p + `L${W} 0 Z`);
      foam.setAttribute('d', f + `L${W} 0 Z`);
      if (etch) etch.style.opacity = (1 - Math.max(0, Math.min(1, (prog - .75) / .4))).toFixed(3);
      if (zoomAt) {
        const t = Math.max(0, Math.min(1, (prog - .12) / .95)), e = t * t * (3 - 2 * t);
        const z = `scale(${(1 + (Z - 1) * (1 - e)).toFixed(4)})`;
        img.style.transform = z; if (etch) etch.style.transform = z;
      }
      const fade = (1 - Math.max(0, Math.min(1, (prog - .45) / .45))).toFixed(3);
      cards.forEach(c => { c.style.opacity = fade; });
      root.classList.toggle('ui-over-paint', !root.classList.contains('has-orbit') && r.top + minY < 70 && r.bottom > -vh * .2);   // framed walk: parchment under the header
    };
    size(); zoomOrigin(); draw();
    if (img && !img.complete) img.addEventListener('load', () => { zoomOrigin(); draw(); }, { once: true });
    let raf = 0; const kick = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', () => { size(); zoomOrigin(); draw(); });
    const hook = () => { if (window.__summit && window.__summit.lenis) window.__summit.lenis.on('scroll', kick); };
    if (window.__summit) hook(); else addEventListener('load', hook);
  });

  /* ---------- Phones: the header wordmark steps aside while you scroll down ----------
     It has no background, so on a phone it sat on top of the content. It comes back as soon as you
     scroll up, or near the top of the page. The Contact and menu buttons are solid and always stay. */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (innerWidth >= 900 || y < innerHeight * .4) root.classList.remove('hdr-tuck');
    else if (y > lastY + 4) root.classList.add('hdr-tuck');
    else if (y < lastY - 4) root.classList.remove('hdr-tuck');
    lastY = y;
  }, { passive: true });

  /* ---------- Projects index: filter by sector (every project shows under "All") ---------- */
  const work = d.querySelector('[data-work]');
  if (work) {
    const rows = [...work.querySelectorAll('.row')];
    let f = 'all';
    const apply = () => {
      rows.forEach(r => { r.hidden = f !== 'all' && r.dataset.sector !== f; });
      if (window.__summit && window.__summit.ScrollTrigger) window.__summit.ScrollTrigger.refresh();
    };
    d.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
      d.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      f = b.dataset.filter; apply();
    }));
    apply();
  }
})();
