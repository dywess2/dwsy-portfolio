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
   ========================================================= */

const WORKS = [
  { id: '7586310218464709905', views: '4.4M', title: 'Cipher',               x: 6,  y: 1,  w: '24vw', depth: 1.25, rot: -4, motif: 'orbit' },
  { id: '7640469041202646279', views: '2.8M', title: 'Yao Guang',            x: 63, y: 4,  w: '18vw', depth: 0.8,  rot: 5,  motif: 'rings' },
  { id: '7559975497275313429', views: '2.2M', title: 'Columbina',            x: 38, y: 15, w: '15vw', depth: 1.45, rot: -2, motif: 'wave' },
  { id: '7564440841075510549', views: '2.1M', title: 'Yuzuha & Alice',       x: 74, y: 26, w: '19vw', depth: 1.0,  rot: 3,  motif: 'bars' },
  { id: '7642281532786281746', views: '2.6M', title: 'Yao Guang',            x: 12, y: 32, w: '17vw', depth: 0.7,  rot: 6,  motif: 'slash' },
  { id: '7591881806903823617', views: '1.7M', title: 'Columbina & Sandrone', x: 44, y: 43, w: '22vw', depth: 1.3,  rot: -5, motif: 'grid' },
  { id: '7609362121301724417', views: '1.6M', title: 'Sparkle / Yao Guang / Sparxie', short: 'Sparkle ×3',
                                                                             x: 5,  y: 58, w: '19vw', depth: 1.1,  rot: -3, motif: 'wave' },
  { id: '7643773142816541959', views: '1.4M', title: 'Sparxie',              x: 71, y: 56, w: '16vw', depth: 0.65, rot: 4,  motif: 'rings' },
  { id: '7684325993682570516', views: '1.2M', title: 'Yao Guang',            x: 30, y: 71, w: '16vw', depth: 1.4,  rot: 3,  motif: 'bars' },
  { id: '7686113100944166165', views: null,   title: 'Latest Edit',          x: 60, y: 80, w: '19vw', depth: 0.9,  rot: -4, motif: 'orbit' },
];

const HANDLE = 'dwsy.ae';
const videoUrl = (id) => `https://www.tiktok.com/@${HANDLE}/video/${id}`;
const playerUrl = (id) =>
  `https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=1&description=1&rel=0`;

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const pad = (n) => String(n).padStart(2, '0');

const mqMobile = matchMedia('(max-width: 760px)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');

/* deterministic pseudo-random per card so motifs stay stable */
function seeded(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* =========================================================
   Generative motifs (thin-line SVGs, use currentColor)
   ========================================================= */
const MOTIFS = {
  rings(r) {
    const cx = 40 + r() * 40, cy = 25 + r() * 35;
    let out = '';
    for (let i = 1; i <= 9; i++) {
      out += `<circle cx="${cx}" cy="${cy}" r="${i * 7}" ${i % 3 === 0 ? 'stroke-dasharray="1 2"' : ''}/>`;
    }
    return out + `<circle cx="${cx}" cy="${cy}" r="1.2" class="fill-accent"/>`;
  },
  bars(r) {
    let out = '';
    const n = 26;
    for (let i = 0; i < n; i++) {
      const h = 6 + Math.pow(r(), 1.6) * 46;
      const x = 8 + i * (84 / (n - 1));
      out += `<line x1="${x}" x2="${x}" y1="${52 - h / 2}" y2="${52 + h / 2}"/>`;
    }
    return out;
  },
  wave(r) {
    let out = '';
    const amp = 6 + r() * 6, freq = 0.08 + r() * 0.06;
    for (let k = 0; k < 9; k++) {
      let d = '';
      for (let x = -5; x <= 105; x += 2.5) {
        const y = 22 + k * 7 + Math.sin(x * freq + k * 0.5) * amp * (1 - k / 14);
        d += `${x === -5 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      out += `<path d="${d}"/>`;
    }
    return out;
  },
  grid(r) {
    let out = '';
    const fx = 20 + r() * 60, fy = 20 + r() * 50;
    for (let x = 6; x <= 96; x += 6) {
      for (let y = 6; y <= 100; y += 6) {
        const d = Math.hypot(x - fx, y - fy);
        const rad = clamp(1.6 - d / 40, 0.18, 1.6);
        out += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(2)}" class="fill"/>`;
      }
    }
    return out;
  },
  orbit(r) {
    const cx = 50, cy = 42, R = 30 + r() * 6, tilt = -30 + r() * 60;
    return `
      <circle cx="${cx}" cy="${cy}" r="${R}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${R + 14}" ry="${R / 3.2}" transform="rotate(${tilt} ${cx} ${cy})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${R / 2.6}" ry="${R + 8}" transform="rotate(${tilt / 2} ${cx} ${cy})" stroke-dasharray="1 2"/>
      <line x1="0" x2="100" y1="${cy}" y2="${cy}" stroke-dasharray="0.6 1.6"/>
      <line x1="${cx}" x2="${cx}" y1="0" y2="125" stroke-dasharray="0.6 1.6"/>
      <circle cx="${cx + R * Math.cos(tilt)}" cy="${cy + R * Math.sin(tilt)}" r="1.6" class="fill-accent"/>`;
  },
  slash(r) {
    let out = '';
    const gap = 4 + r() * 3;
    for (let i = -125; i < 125; i += gap) {
      out += `<line x1="${i}" y1="125" x2="${i + 125}" y2="0"/>`;
    }
    return out + `<rect x="${20 + r() * 40}" y="${20 + r() * 30}" width="22" height="22" class="fill-bg"/>`;
  },
};

function motifSVG(work, i) {
  const r = seeded(work.id + i);
  const body = (MOTIFS[work.motif] || MOTIFS.rings)(r);
  return `<svg class="card__motif" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      fill="none" stroke="currentColor" stroke-width="0.3" style="--motif-rot:${(r() * 6 - 3).toFixed(1)}deg">
      <style>.fill{fill:currentColor;stroke:none}.fill-accent{fill:var(--accent);stroke:none}.fill-bg{fill:var(--card-bg);stroke:currentColor}</style>
      ${body}
    </svg>`;
}

/* =========================================================
   Render cards
   ========================================================= */
const field = $('[data-works]');

function renderCards() {
  field.innerHTML = WORKS.map((w, i) => {
    const views = w.views
      ? `${w.views}<small>views</small>`
      : `New<small>drop</small>`;
    return `
      <button class="card" type="button" data-index="${i}"
        style="--x:${w.x};--y:${w.y};--w:${w.w};--z:${Math.round(w.depth * 10)};--dim:${(0.72 + 0.28 * Math.min(w.depth, 1)).toFixed(2)}"
        aria-label="Play ${w.title}${w.views ? `, ${w.views} views` : ''}">
        <span class="card__inner">
          <img class="card__thumb" alt="" loading="lazy" decoding="async">
          ${motifSVG(w, i)}
          <span class="card__top">
            <span class="mono">${pad(i + 1)}</span>
            <span class="card__play" aria-hidden="true">▶</span>
          </span>
          <span class="card__bottom">
            <span class="card__views">${views}</span>
            <span class="card__title"><span>${w.short || w.title}</span><span class="mono">TikTok</span></span>
          </span>
        </span>
      </button>`;
  }).join('');
}

/* Progressive enhancement: pull real thumbnails via TikTok oEmbed.
   If the request fails (offline, blocked, CORS) the abstract motif stays. */
function loadThumbnails() {
  $$('.card', field).forEach((card) => {
    const work = WORKS[card.dataset.index];
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl(work.id))}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data.thumbnail_url) return;
        const img = $('.card__thumb', card);
        img.onload = () => img.classList.add('is-loaded');
        img.src = data.thumbnail_url;
        work.thumb = data.thumbnail_url;
      })
      .catch(() => {});
  });
}

/* Sum of views → "20M+" */
function fillTotals() {
  const total = WORKS.reduce((sum, w) => sum + (w.views ? parseFloat(w.views) : 0), 0);
  $$('[data-total-views]').forEach((el) => (el.textContent = `${Math.floor(Math.round(total * 10) / 10)}M+`));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* =========================================================
   Motion engine — one rAF loop for everything
   ========================================================= */
const state = {
  mouse: { x: 0, y: 0, tx: 0, ty: 0 },        // normalised -1…1
  scroll: { y: scrollY, last: scrollY, vel: 0 },
  vh: innerHeight,
  cards: [],
};

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
}

function tick(t) {
  const { mouse, scroll, vh } = state;
  const mobile = mqMobile.matches;
  const reduced = mqReduced.matches;
  const amp = reduced ? 0 : mobile ? 0.35 : 1;

  // smooth mouse + scroll velocity
  mouse.x = lerp(mouse.x, mouse.tx, 0.06);
  mouse.y = lerp(mouse.y, mouse.ty, 0.06);
  scroll.y = scrollY;
  scroll.vel = lerp(scroll.vel, scroll.y - scroll.last, 0.1);
  scroll.last = scroll.y;
  const vel = clamp(scroll.vel, -60, 60);

  const viewCenter = scroll.y + vh / 2;

  for (const c of state.cards) {
    const rel = (c.center - viewCenter) / vh; // 0 when card is centred
    if (Math.abs(rel) > 1.6) continue;        // off-screen: skip work

    const d = c.depth;
    const time = t * 0.001 * c.speed + c.phase;

    const fx = Math.cos(time * 0.7) * 7 * amp;
    const fy = Math.sin(time) * 12 * amp;
    const px = mouse.x * d * 28 * amp;
    const py = mouse.y * d * 18 * amp;
    const ty = rel * (d - 1) * 260 * amp;     // depth parallax

    const rz = c.rot * (mobile ? 0.45 : 1) * (reduced ? 0.5 : 1)
             + Math.sin(time * 0.6) * 1.4 * amp
             + rel * 4 * c.dir * amp
             + vel * 0.05 * d * c.dir * amp;
    const ry = mouse.x * 9 * d * amp;
    const rx = -mouse.y * 7 * d * amp + vel * 0.08 * amp;

    c.el.style.transform =
      `translate3d(${(fx + px).toFixed(2)}px, ${(fy + py + ty).toFixed(2)}px, 0) ` +
      `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
  }

  updateAboutWords();
  updateCursor();
  requestAnimationFrame(tick);
}

addEventListener('pointermove', (e) => {
  state.mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  state.mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  cursor.tx = e.clientX;
  cursor.ty = e.clientY;
}, { passive: true });

/* Subtle 3D tilt on the hovered card itself */
function bindCardTilt() {
  $$('.card', field).forEach((card) => {
    const inner = $('.card__inner', card);
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      inner.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
      inner.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      inner.style.setProperty('--ry', '0deg');
      inner.style.setProperty('--rx', '0deg');
    });
    card.addEventListener('click', () => openModal(+card.dataset.index, card));
  });
}

/* Cards fade in as they enter the viewport */
function observeEntrances() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.card', field).forEach((c) => io.observe(c));
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
  const line = state.vh * 0.78;
  for (const w of words) {
    w.classList.toggle('is-lit', w.getBoundingClientRect().top < line);
  }
}

/* =========================================================
   Custom cursor
   ========================================================= */
const cursorEl = $('.cursor');
const cursor = { x: -100, y: -100, tx: -100, ty: -100, on: false };

function initCursor() {
  if (!mqFinePointer.matches) return;
  cursor.on = true;
  document.documentElement.classList.add('has-cursor');
  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest('.card');
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

/* =========================================================
   Modal with TikTok player
   ========================================================= */
const modal = $('.modal');
const frame = $('.modal__frame', modal);
const loader = $('.modal__loader', modal);
let current = -1;
let lastFocus = null;
let closeTimer = null;

function fillModal(i) {
  const w = WORKS[i];
  current = i;
  $('.modal__no', modal).textContent = `${pad(i + 1)} / ${pad(WORKS.length)}`;
  $('.modal__title', modal).textContent = w.title;
  $('.modal__views-value', modal).textContent = w.views || 'New';
  $('.modal__views .mono', modal).textContent = w.views ? 'views' : 'latest drop';
  $('.modal__cta', modal).href = videoUrl(w.id);
  loader.hidden = false;
  frame.src = playerUrl(w.id);
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
fillTotals();
splitWords();
bindCardTilt();
observeEntrances();
initCursor();
bindModal();
bindTheme();
measure();
loadThumbnails();

addEventListener('resize', measure);
addEventListener('load', measure);
if (document.fonts) document.fonts.ready.then(measure);
requestAnimationFrame(tick);
