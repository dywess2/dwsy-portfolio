/* =========================================================
   dwsy. — portfolio script
   ---------------------------------------------------------
   Edit the WORKS array to change videos, views, titles or
   the position of each card in the floating gallery.

   Layout fields (desktop only — mobile uses a 2-col flow):
     x, y   position inside the field, in % (left / top)
     w      card width (any CSS length)
     depth  0.5 … 1.5 — how "close" the card is. Higher =
            more parallax, more mouse reaction, sits on top.
     rot    base rotation in degrees
     motif  rings | bars | wave | grid | orbit | slash
            (abstract cover shown until the real thumbnail loads)
   ========================================================= */

const WORKS = [
  { id: '7586310218464709905', views: '4.4M', title: 'Cipher',         x: 5,  y: 1,  w: '17vw', depth: 1.25, rot: -4, motif: 'orbit' },
  { id: '7640469041202646279', views: '2.8M', title: 'Yao Guang',      x: 64, y: 4,  w: '14vw', depth: 0.8,  rot: 5,  motif: 'rings' },
  { id: '7559975497275313429', views: '2.2M', title: 'Columbina',      x: 36, y: 15, w: '13vw', depth: 1.45, rot: -2, motif: 'wave' },
  { id: '7564440841075510549', views: '2.1M', title: 'Yuzuha & Alice', x: 79, y: 29, w: '14vw', depth: 1.0,  rot: 3,  motif: 'bars' },
  { id: '7642281532786281746', views: '2.6M', title: 'Yao Guang',      x: 15, y: 39, w: '14vw', depth: 0.7,  rot: 6,  motif: 'slash' },
  { id: '7643773142816541959', views: '1.4M', title: 'Sparxie',        x: 50, y: 46, w: '15vw', depth: 1.3,  rot: -5, motif: 'grid' },
  { id: '7684325993682570516', views: '1.2M', title: 'Yao Guang',      x: 6,  y: 70, w: '13vw', depth: 1.1,  rot: -3, motif: 'wave' },
  { id: '7686113100944166165', views: null,   title: 'Latest Edit',    x: 67, y: 71, w: '15vw', depth: 0.9,  rot: -4, motif: 'orbit' },
];

const HANDLE = 'dwsy.ae';
const videoUrl = (id) => `https://www.tiktok.com/@${HANDLE}/video/${id}`;
const embedUrl = (id) => `https://www.tiktok.com/embed/v2/${id}?lang=en-US`;

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const pad = (n) => String(n).padStart(2, '0');
const num = (views) => (views ? parseFloat(views) : 0);

const mqMobile = matchMedia('(max-width: 760px)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');

/* deterministic pseudo-random per card so motifs stay stable */
function seeded(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const TOTAL = WORKS.reduce((sum, w) => sum + num(w.views), 0);
const TOP = WORKS.reduce((a, b) => (num(b.views) > num(a.views) ? b : a));

/* =========================================================
   Generative motifs (thin-line SVGs, use currentColor)
   viewBox is 100 × 178 (9:16)
   ========================================================= */
const MOTIFS = {
  rings(r) {
    const cx = 40 + r() * 30, cy = 50 + r() * 60;
    let out = '';
    for (let i = 1; i <= 11; i++) {
      out += `<circle cx="${cx}" cy="${cy}" r="${i * 8}" ${i % 3 === 0 ? 'stroke-dasharray="1 2"' : ''}/>`;
    }
    return out + `<circle cx="${cx}" cy="${cy}" r="1.4" class="fill-accent"/>`;
  },
  bars(r) {
    let out = '';
    const n = 24;
    for (let i = 0; i < n; i++) {
      const h = 10 + Math.pow(r(), 1.6) * 80;
      const x = 8 + i * (84 / (n - 1));
      out += `<line x1="${x}" x2="${x}" y1="${89 - h / 2}" y2="${89 + h / 2}"/>`;
    }
    return out;
  },
  wave(r) {
    let out = '';
    const amp = 6 + r() * 6, freq = 0.08 + r() * 0.06;
    for (let k = 0; k < 16; k++) {
      let d = '';
      for (let x = -5; x <= 105; x += 2.5) {
        const y = 22 + k * 9 + Math.sin(x * freq + k * 0.5) * amp * (1 - k / 24);
        d += `${x === -5 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      out += `<path d="${d}"/>`;
    }
    return out;
  },
  grid(r) {
    let out = '';
    const fx = 20 + r() * 60, fy = 40 + r() * 90;
    for (let x = 6; x <= 96; x += 6) {
      for (let y = 6; y <= 174; y += 6) {
        const d = Math.hypot(x - fx, y - fy);
        const rad = clamp(1.6 - d / 45, 0.18, 1.6);
        out += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(2)}" class="fill"/>`;
      }
    }
    return out;
  },
  orbit(r) {
    const cx = 50, cy = 80, R = 30 + r() * 6, tilt = -30 + r() * 60;
    return `
      <circle cx="${cx}" cy="${cy}" r="${R}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${R + 14}" ry="${R / 3.2}" transform="rotate(${tilt} ${cx} ${cy})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${R / 2.6}" ry="${R + 8}" transform="rotate(${tilt / 2} ${cx} ${cy})" stroke-dasharray="1 2"/>
      <line x1="0" x2="100" y1="${cy}" y2="${cy}" stroke-dasharray="0.6 1.6"/>
      <line x1="${cx}" x2="${cx}" y1="0" y2="178" stroke-dasharray="0.6 1.6"/>
      <circle cx="${cx + R * Math.cos(tilt)}" cy="${cy + R * Math.sin(tilt)}" r="1.6" class="fill-accent"/>`;
  },
  slash(r) {
    let out = '';
    const gap = 4 + r() * 3;
    for (let i = -178; i < 178; i += gap) {
      out += `<line x1="${i}" y1="178" x2="${i + 178}" y2="0"/>`;
    }
    return out + `<rect x="${20 + r() * 40}" y="${40 + r() * 60}" width="24" height="24" class="fill-bg"/>`;
  },
};

function motifSVG(work, i) {
  const r = seeded(work.id + i);
  const body = (MOTIFS[work.motif] || MOTIFS.rings)(r);
  return `<svg class="card__motif" viewBox="0 0 100 178" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      fill="none" stroke="currentColor" stroke-width="0.3" style="--motif-rot:${(r() * 6 - 3).toFixed(1)}deg">
      <style>.fill{fill:currentColor;stroke:none}.fill-accent{fill:var(--accent);stroke:none}.fill-bg{fill:var(--card-bg);stroke:currentColor}</style>
      ${body}
    </svg>`;
}

/* =========================================================
   Render cards, index list, marquee, totals
   ========================================================= */
const field = $('[data-works]');
const indexList = $('[data-index-list]');

function viewsHTML(w) {
  return w.views
    ? `<span data-count-to="${num(w.views)}">0.0</span>M<small>views</small>`
    : `New<small>drop</small>`;
}

function renderCards() {
  field.innerHTML = WORKS.map((w, i) => `
    <button class="card" type="button" data-index="${i}"
      style="--x:${w.x};--y:${w.y};--w:${w.w};--z:${Math.round(w.depth * 10)};--dim:${(0.72 + 0.28 * Math.min(w.depth, 1)).toFixed(2)};--share:${(num(w.views) / num(TOP.views)).toFixed(3)}"
      aria-label="Play ${w.title}${w.views ? `, ${w.views} views` : ''}">
      <span class="card__inner">
        <span class="card__media">
          <img class="card__thumb" alt="" decoding="async">
          ${motifSVG(w, i)}
          <span class="card__sweep"></span>
          <span class="card__top">
            <span class="mono">${pad(i + 1)}</span>
            <span class="card__play" aria-hidden="true">▶</span>
          </span>
        </span>
        <span class="card__meta">
          <span class="card__views">${viewsHTML(w)}</span>
          <span class="card__title"><span>${w.title}</span><span class="mono">TikTok</span></span>
          <span class="card__bar"></span>
        </span>
      </span>
    </button>`).join('');
}

function renderIndex() {
  indexList.innerHTML = WORKS.map((w, i) => `
    <li>
      <button class="works__row" type="button" data-index="${i}" style="--share:${(num(w.views) / num(TOP.views)).toFixed(3)}">
        <span class="mono muted">${pad(i + 1)}</span>
        <span class="works__row-title">${w.title}</span>
        <span class="works__row-views">${w.views || 'New'}</span>
        <span class="works__row-share"></span>
      </button>
    </li>`).join('');

  const viewed = WORKS.filter((w) => w.views);
  $('[data-summary]').innerHTML = [
    `Total <b>${TOTAL.toFixed(1)}M</b>`,
    `Average <b>${(TOTAL / viewed.length).toFixed(1)}M</b>`,
    `Top <b>${TOP.views} — ${TOP.title}</b>`,
    `Edits <b>${WORKS.length}</b>`,
  ].map((s) => `<span>${s}</span>`).join('');
}

function renderMarquee() {
  const words = ['Motion', 'Music', 'Edits', 'Mood', `${Math.floor(TOTAL)}M+ views`, '@dwsy.ae'];
  const set = words.map((w) => `<span class="marquee__item">${w}<i class="marquee__sep"></i></span>`).join('');
  $('[data-marquee]').innerHTML = set.repeat(4); // enough to loop seamlessly
}

function fillTotals() {
  $$('[data-total-views]').forEach((el) => (el.textContent = `${Math.floor(TOTAL)}M+`));
  $$('[data-top-views]').forEach((el) => (el.textContent = TOP.views));
  $$('[data-work-count]').forEach((el) => (el.textContent = WORKS.length));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* Progressive enhancement: real thumbnails via TikTok oEmbed.
   The card's media box adopts the thumbnail's exact aspect ratio,
   so the preview is shown whole (object-fit: contain, no crop). */
function loadThumbnails() {
  WORKS.forEach((work, i) => {
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl(work.id))}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data.thumbnail_url) return;
        const card = $(`.card[data-index="${i}"]`, field);
        const img = $('.card__thumb', card);
        img.onload = () => {
          work.ar = img.naturalWidth / img.naturalHeight;
          $('.card__media', card).style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);
          img.classList.add('is-loaded');
          measure();
        };
        img.src = data.thumbnail_url;
        work.thumb = data.thumbnail_url;
      })
      .catch(() => {});
  });
}

/* =========================================================
   Motion engine — one rAF loop for everything
   ========================================================= */
const state = {
  mouse: { x: 0, y: 0, tx: 0, ty: 0, px: innerWidth / 2, py: innerHeight / 2 },
  scroll: { y: scrollY, last: scrollY, vel: 0 },
  vh: innerHeight,
  cards: [],
  marqueeX: 0,
  start: performance.now(),
};

const heroMasks = $$('.hero__mask');
const heroEl = $('.hero');
const orbits = $('.hero__orbits');
const marquee = $('[data-marquee]');
const badge = $('[data-badge]');
const glow = $('.glow');
const progressBar = $('.progress__bar');
const timecodeEl = $('[data-timecode]');
const coordsEl = $('[data-coords]');

function measure() {
  state.vh = innerHeight;
  const fieldTop = field.getBoundingClientRect().top + scrollY;
  state.cards = $$('.card', field).map((el, i) => {
    const w = WORKS[i];
    return {
      el,
      center: fieldTop + el.offsetTop + el.offsetHeight / 2,
      depth: w.depth,
      rot: w.rot,
      phase: i * 1.7,
      speed: 0.8 + (i % 4) * 0.15,
      dir: i % 2 ? 1 : -1,
    };
  });
  state.docH = document.documentElement.scrollHeight - innerHeight;
}

function tick(t) {
  const { mouse, scroll, vh } = state;
  const mobile = mqMobile.matches;
  const reduced = mqReduced.matches;
  const amp = reduced ? 0 : mobile ? 0.4 : 1;

  // smooth mouse + scroll velocity
  mouse.x = lerp(mouse.x, mouse.tx, 0.07);
  mouse.y = lerp(mouse.y, mouse.ty, 0.07);
  scroll.y = scrollY;
  scroll.vel = lerp(scroll.vel, scroll.y - scroll.last, 0.12);
  scroll.last = scroll.y;
  const vel = clamp(scroll.vel, -80, 80);

  /* floating cards */
  const viewCenter = scroll.y + vh / 2;
  for (const c of state.cards) {
    const rel = (c.center - viewCenter) / vh;   // 0 when card is centred
    if (Math.abs(rel) > 1.7) continue;          // off-screen: skip work

    const d = c.depth;
    const time = t * 0.001 * c.speed + c.phase;

    const fx = Math.cos(time * 0.7) * 9 * amp;
    const fy = Math.sin(time) * 14 * amp;
    const px = mouse.x * d * 46 * amp;
    const py = mouse.y * d * 30 * amp;
    const ty = rel * (d - 1) * 320 * amp;      // depth parallax
    const sy = -vel * d * 0.9 * amp;            // lag behind fast scroll

    const rz = c.rot * (mobile ? 0.45 : 1) * (reduced ? 0.5 : 1)
             + Math.sin(time * 0.6) * 1.6 * amp
             + rel * 6 * c.dir * amp
             + vel * 0.07 * d * c.dir * amp;
    const ry = mouse.x * 14 * d * amp;
    const rx = -mouse.y * 10 * d * amp + vel * 0.12 * amp;
    const sc = 1 + (1 - Math.min(Math.abs(rel), 1)) * 0.03 * d * amp; // swell near centre

    c.el.style.transform =
      `translate3d(${(fx + px).toFixed(2)}px, ${(fy + py + ty + sy).toFixed(2)}px, 0) ` +
      `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
  }

  /* hero: letters drift at different depths, orbits counter-move */
  if (scroll.y < vh * 1.2) {
    const k = amp * (mobile ? 0.5 : 1);
    heroMasks.forEach((m, i) => {
      const depth = (i - 2) * 0.6 + 1;
      m.style.transform =
        `translate3d(${(mouse.x * depth * 14 * k).toFixed(2)}px, ${(mouse.y * depth * 8 * k - scroll.y * 0.08 * i * k).toFixed(2)}px, 0)`;
    });
    orbits.style.translate = `${(-mouse.x * 24 * k).toFixed(1)}px ${(-mouse.y * 24 * k + scroll.y * 0.25).toFixed(1)}px`;
    if (coordsEl) coordsEl.textContent = `X ${((mouse.tx + 1) / 2).toFixed(2)} / Y ${((mouse.ty + 1) / 2).toFixed(2)}`;
    if (timecodeEl) {
      const f = Math.floor((t - state.start) / (1000 / 24));
      const s = Math.floor(f / 24);
      timecodeEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 24)}`;
    }
  }

  /* marquee: base drift + scroll velocity, direction follows scroll */
  if (marquee && !reduced) {
    const half = marquee.scrollWidth / 2;
    state.marqueeDir = vel > 0.5 ? 1 : vel < -0.5 ? -1 : state.marqueeDir || 1;
    state.marqueeX -= (0.6 + Math.abs(vel) * 0.35) * state.marqueeDir;
    if (state.marqueeX <= -half) state.marqueeX += half;
    if (state.marqueeX > 0) state.marqueeX -= half;
    marquee.style.transform = `translate3d(${state.marqueeX.toFixed(2)}px,0,0) skewX(${clamp(-vel * 0.15, -12, 12).toFixed(2)}deg)`;
  }

  /* rotating badge */
  if (badge && !reduced) badge.style.transform = `rotate(${(scroll.y * 0.12 + t * 0.008).toFixed(2)}deg)`;

  /* ambient glow + progress */
  if (!reduced) glow.style.transform = `translate3d(${(lerp(innerWidth / 2, mouse.px, 0.6)).toFixed(1)}px, ${(lerp(innerHeight / 2, mouse.py, 0.6)).toFixed(1)}px, 0)`;
  progressBar.style.transform = `scaleY(${clamp(scroll.y / (state.docH || 1), 0, 1).toFixed(4)})`;

  updateAboutWords();
  updateCursor();
  updatePreview();
  requestAnimationFrame(tick);
}

addEventListener('pointermove', (e) => {
  state.mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  state.mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  state.mouse.px = lerp(state.mouse.px, e.clientX, 0.08);
  state.mouse.py = lerp(state.mouse.py, e.clientY, 0.08);
  cursor.tx = e.clientX;
  cursor.ty = e.clientY;
}, { passive: true });

/* Subtle 3D tilt on the hovered card, focus mode for the rest */
function bindCards() {
  $$('.card', field).forEach((card) => {
    const inner = $('.card__inner', card);
    card.addEventListener('pointerenter', () => field.classList.add('has-focus'));
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      inner.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
      inner.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      field.classList.remove('has-focus');
      inner.style.setProperty('--ry', '0deg');
      inner.style.setProperty('--rx', '0deg');
    });
    card.addEventListener('click', () => openModal(+card.dataset.index, card));
  });
  $$('.works__row', indexList).forEach((row) => {
    row.addEventListener('click', () => openModal(+row.dataset.index, row));
    row.addEventListener('pointerenter', () => (preview.work = WORKS[row.dataset.index]));
    row.addEventListener('pointerleave', () => (preview.work = null));
  });
}

/* Count a number up from 0 */
function countUp(el, to, dur = 1600) {
  const start = performance.now();
  const step = (now) => {
    const p = clamp((now - start) / dur, 0, 1);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = (to * e).toFixed(1);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Cards wipe in as they enter the viewport, numbers count up */
function observeEntrances() {
  const reveal = (el) => {
    el.classList.add('is-in');
    $$('[data-count-to]', el).forEach((n) =>
      mqReduced.matches ? (n.textContent = (+n.dataset.countTo).toFixed(1)) : countUp(n, +n.dataset.countTo));
  };
  if (!('IntersectionObserver' in window)) return $$('.card', field).forEach(reveal);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        setTimeout(() => reveal(e.target), 80 * (+e.target.dataset.index % 3));
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.card', field).forEach((c) => io.observe(c));
}

/* Nav: highlight the section in view */
function observeSections() {
  const links = $$('.nav__links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['works', 'about', 'links'].forEach((id) => io.observe(document.getElementById(id)));
}

/* Local time in the hero */
function startClock() {
  const el = $('[data-local-time]');
  const fmt = () => (el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  fmt();
  setInterval(fmt, 15000);
}

/* =========================================================
   About — words light up as you scroll
   ========================================================= */
const statement = $('[data-reveal-words]');
let words = [];
function splitWords() {
  statement.innerHTML = statement.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(' ');
  words = $$('.w', statement);
}
function updateAboutWords() {
  const r = statement.getBoundingClientRect();
  if (r.bottom < -200 || r.top > state.vh + 200) return;
  const line = state.vh * 0.8;
  for (const w of words) {
    w.classList.toggle('is-lit', w.getBoundingClientRect().top < line);
  }
}

/* =========================================================
   Custom cursor + index hover preview
   ========================================================= */
const cursorEl = $('.cursor');
const cursor = { x: -100, y: -100, tx: -100, ty: -100, on: false };

function initCursor() {
  if (!mqFinePointer.matches) return;
  cursor.on = true;
  document.documentElement.classList.add('has-cursor');
  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest('.card, .works__row');
    const link = e.target.closest('a, button');
    cursorEl.classList.toggle('is-play', !!card);
    cursorEl.classList.toggle('is-link', !card && !!link);
  });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cursorEl.style.opacity = '0'; });
  document.addEventListener('mouseover', () => (cursorEl.style.opacity = ''));
}
function updateCursor() {
  if (!cursor.on) return;
  cursor.x = lerp(cursor.x, cursor.tx, 0.22);
  cursor.y = lerp(cursor.y, cursor.ty, 0.22);
  cursorEl.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
}

const previewEl = $('.index-preview');
const previewImg = $('img', previewEl);
const preview = { work: null, x: 0, y: 0 };
function updatePreview() {
  const on = !!(preview.work && preview.work.thumb && cursor.on);
  previewEl.classList.toggle('is-on', on);
  if (!on) return;
  if (previewImg.src !== preview.work.thumb) previewImg.src = preview.work.thumb;
  preview.x = lerp(preview.x, cursor.tx + 40, 0.15);
  preview.y = lerp(preview.y, cursor.ty - 120, 0.15);
  previewEl.style.transform = `translate3d(${preview.x}px, ${preview.y}px, 0) rotate(${clamp(state.scroll.vel * 0.3 + (cursor.tx - preview.x + 40) * 0.05, -8, 8).toFixed(2)}deg)`;
}

/* =========================================================
   Modal with TikTok embed/v2 player
   ---------------------------------------------------------
   embed/v2 renders a TikTok card: the video at its own aspect
   ratio plus a caption footer. We give the iframe that card's
   full height (≈ width / aspect + footer, refined by the height
   TikTok reports via postMessage) and scale it to fit the
   screen, so nothing is cropped.
   ========================================================= */
const modal = $('.modal');
const player = $('.modal__player', modal);
const frame = $('.modal__frame', modal);
const loader = $('.modal__loader', modal);
const EMBED_W = 340;
const EMBED_FOOTER = 170;
let current = -1;
let lastFocus = null;
let closeTimer = null;
let embedH = 0;

function defaultEmbedHeight(work) {
  const ar = work.ar || 9 / 16;
  return Math.round(EMBED_W / ar + EMBED_FOOTER);
}

function fitPlayer() {
  const mobile = mqMobile.matches;
  const availH = mobile ? innerHeight * 0.66 : innerHeight * 0.88;
  const availW = mobile ? innerWidth - 32 : innerWidth * 0.5;
  const s = Math.min(1, availH / embedH, availW / EMBED_W);
  player.style.setProperty('--fw', `${EMBED_W}px`);
  player.style.setProperty('--fh', `${embedH}px`);
  player.style.setProperty('--fs', s.toFixed(4));
  player.style.setProperty('--pw', `${Math.round(EMBED_W * s)}px`);
  player.style.setProperty('--ph', `${Math.round(embedH * s)}px`);
}

/* TikTok's embed posts its rendered height; accept any message from
   the player frame that carries a sensible numeric height. */
addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !/tiktok\.com$/.test(new URL(e.origin).hostname)) return;
  let data = e.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
  const find = (o, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 3) return 0;
    if (typeof o.height === 'number') return o.height;
    for (const v of Object.values(o)) { const h = find(v, depth + 1); if (h) return h; }
    return 0;
  };
  const h = find(data);
  if (h > 300 && h < 2000 && Math.abs(h - embedH) > 4) { embedH = Math.ceil(h); fitPlayer(); }
});

function fillModal(i) {
  const w = WORKS[i];
  current = i;
  $('.modal__no', modal).textContent = `${pad(i + 1)} / ${pad(WORKS.length)}`;
  $('.modal__title', modal).textContent = w.title;
  $('.modal__views-value', modal).textContent = w.views || 'New';
  $('.modal__views .mono', modal).textContent = w.views ? 'views' : 'latest drop';
  $('.modal__cta', modal).href = videoUrl(w.id);
  embedH = defaultEmbedHeight(w);
  fitPlayer();
  loader.hidden = false;
  frame.src = embedUrl(w.id);
}

function openModal(i, origin) {
  clearTimeout(closeTimer);
  lastFocus = origin || document.activeElement;
  fillModal(i);
  modal.hidden = false;
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    $('.modal__close', modal).focus({ preventScroll: true });
  });
}

function closeModal() {
  if (modal.hidden) return;
  modal.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  closeTimer = setTimeout(() => {
    modal.hidden = true;
    frame.src = 'about:blank'; // stops playback
  }, 450);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

function step(dir) {
  fillModal((current + dir + WORKS.length) % WORKS.length);
}

function bindModal() {
  frame.addEventListener('load', () => (loader.hidden = true));
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
  $('[data-prev]', modal).addEventListener('click', () => step(-1));
  $('[data-next]', modal).addEventListener('click', () => step(1));
  addEventListener('resize', () => { if (!modal.hidden) fitPlayer(); });

  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'Tab') {
      // simple focus trap
      const f = $$('a[href], button, iframe', modal).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* =========================================================
   Theme toggle
   ========================================================= */
function bindTheme() {
  const root = document.documentElement;
  const meta = $('meta[name="theme-color"]');
  const sync = () => meta.setAttribute('content', root.dataset.theme === 'light' ? '#eeede9' : '#050505');
  sync();
  $('.theme-toggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('dwsy-theme', root.dataset.theme); } catch (e) {}
    sync();
  });
}

/* =========================================================
   Init
   ========================================================= */
renderCards();
renderIndex();
renderMarquee();
fillTotals();
splitWords();
bindCards();
observeEntrances();
observeSections();
startClock();
initCursor();
bindModal();
bindTheme();
measure();
loadThumbnails();

addEventListener('resize', measure);
addEventListener('load', measure);
if (document.fonts) document.fonts.ready.then(measure);
requestAnimationFrame(tick);
