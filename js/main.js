/* =========================================================
   dwsy. — portfolio script
   ---------------------------------------------------------
   Edit WORKS to change videos, numbers or titles, and
   PROFILE for the account totals. Everything else on the
   page (totals, averages, index list) is computed from these.

     views / likes  exact display strings ("4.4M", "712K")
     motif          rings | bars | wave | grid | orbit | slash
                    (abstract cover shown until the real
                    TikTok thumbnail loads)
   ========================================================= */

const PROFILE = { handle: 'dwsy.ae', followers: '89K', likes: '13M' };

const WORKS = [
  { id: '7586310218464709905', views: '4.4M', likes: '712K', title: 'Cipher',                        motif: 'orbit' },
  { id: '7640469041202646279', views: '2.8M', likes: '397K', title: 'Yao Guang',                     motif: 'rings' },
  { id: '7642281532786281746', views: '2.6M', likes: '358K', title: 'Yao Guang',                     motif: 'slash' },
  { id: '7559975497275313429', views: '2.2M', likes: '284K', title: 'Columbina',                     motif: 'wave' },
  { id: '7564440841075510549', views: '2.1M', likes: '245K', title: 'Yuzuha & Alice',                motif: 'bars' },
  { id: '7591881806903823617', views: '1.7M', likes: '228K', title: 'Columbina & Sandrone',          motif: 'grid' },
  { id: '7609362121301724417', views: '1.9M', likes: '215K', title: 'Sparkle / Yao Guang / Sparxie', motif: 'wave' },
  { id: '7569651622855347477', views: '1.6M', likes: '186K', title: 'Burnice',                       motif: 'orbit' },
];

/* vertical rhythm of the row (in % of card media height) and base tilt */
const OFFSETS = [-6, 7, -3, 9, -8, 4, -5, 6];
const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.6, -0.7, 1];

const videoUrl = (id) => `https://www.tiktok.com/@${PROFILE.handle}/video/${id}`;
const embedUrl = (id) => `https://www.tiktok.com/embed/v2/${id}?lang=en-US`;

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const pad = (n) => String(n).padStart(2, '0');
/* "4.4M" → 4400000, "712K" → 712000 */
const toNum = (s) => (s ? parseFloat(s) * ({ K: 1e3, M: 1e6 }[s.slice(-1).toUpperCase()] || 1) : 0);
const fmt = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);

const mqMobile = matchMedia('(max-width: 760px)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');

function seeded(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const TOTAL_VIEWS = WORKS.reduce((sum, w) => sum + toNum(w.views), 0);
const TOTAL_LIKES = WORKS.reduce((sum, w) => sum + toNum(w.likes), 0);
const TOP = WORKS.reduce((a, b) => (toNum(b.views) > toNum(a.views) ? b : a));
const share = (w) => (toNum(w.views) / toNum(TOP.views)).toFixed(3);

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
      fill="none" stroke="currentColor" stroke-width="0.3">
      <style>.fill{fill:currentColor;stroke:none}.fill-accent{fill:var(--accent);stroke:none}.fill-bg{fill:var(--card-bg);stroke:currentColor}</style>
      ${body}
    </svg>`;
}

/* =========================================================
   Render
   ========================================================= */
const cardsEl = $('[data-works]');
const indexList = $('[data-index-list]');

function renderCards() {
  cardsEl.innerHTML = WORKS.map((w, i) => `
    <button class="card" type="button" data-index="${i}" style="--share:${share(w)}"
      aria-label="Play ${w.title}, ${w.views} views, ${w.likes} likes">
      <span class="card__inner">
        <span class="card__media">
          <img class="card__thumb" alt="" decoding="async">
          ${motifSVG(w, i)}
          <span class="card__top">
            <span class="mono">${pad(i + 1)}</span>
            <span class="card__play" aria-hidden="true">▶</span>
          </span>
        </span>
        <span class="card__meta">
          <span class="card__views"><span data-count-to="${parseFloat(w.views)}">0.0</span>M<small>views</small></span>
          <span class="card__likes">${w.likes}<small>likes</small></span>
          <span class="card__title"><span>${w.title}</span><span class="mono">TikTok</span></span>
          <span class="card__bar"></span>
        </span>
      </span>
    </button>`).join('');
}

function renderIndex() {
  indexList.innerHTML = WORKS.map((w, i) => `
    <li>
      <button class="works__row" type="button" data-index="${i}" style="--share:${share(w)}">
        <span class="mono muted">${pad(i + 1)}</span>
        <span class="works__row-title">${w.title}</span>
        <span class="works__row-views">${w.views}</span>
        <span class="works__row-likes">${w.likes}</span>
        <span class="works__row-share"></span>
      </button>
    </li>`).join('');

  $('[data-summary]').innerHTML = [
    `Views <b>${fmt(TOTAL_VIEWS)}</b>`,
    `Likes <b>${fmt(TOTAL_LIKES)}</b>`,
    `Average <b>${fmt(TOTAL_VIEWS / WORKS.length)}</b>`,
    `Top <b>${TOP.views} — ${TOP.title}</b>`,
  ].map((s) => `<span>${s}</span>`).join('');
}

function renderMarquee() {
  const words = ['Motion', 'Music', 'Edits', 'Mood', `${PROFILE.followers} followers`, `${PROFILE.likes} likes`, `@${PROFILE.handle}`];
  const set = words.map((w) => `<span class="marquee__item">${w}<i class="marquee__sep"></i></span>`).join('');
  $('[data-marquee]').innerHTML = set.repeat(3);
}

function fillTotals() {
  const set = (sel, v) => $$(sel).forEach((el) => (el.textContent = v));
  set('[data-total-views]', fmt(TOTAL_VIEWS));
  set('[data-total-likes]', fmt(TOTAL_LIKES));
  set('[data-top-views]', TOP.views);
  set('[data-work-count]', pad(WORKS.length));
  set('[data-followers]', PROFILE.followers);
  set('[data-profile-likes]', PROFILE.likes);
  set('[data-year]', new Date().getFullYear());
}

/* Real thumbnails via TikTok oEmbed. Each card's media box takes the
   thumbnail's exact aspect ratio, so the preview is never cropped. */
function loadThumbnails() {
  WORKS.forEach((work, i) => {
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl(work.id))}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!data.thumbnail_url) return;
        const card = $(`.card[data-index="${i}"]`, cardsEl);
        const img = $('.card__thumb', card);
        img.onload = () => {
          work.ar = img.naturalWidth / img.naturalHeight;
          const media = $('.card__media', card);
          media.style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);
          media.style.setProperty('--arn', work.ar.toFixed(4));
          img.classList.add('is-loaded');
          scheduleLayout();
        };
        img.src = data.thumbnail_url;
        work.thumb = data.thumbnail_url;
      })
      .catch(() => {});
  });
}

/* =========================================================
   Horizontal works scroller
   ---------------------------------------------------------
   The section is made as tall as the track is wide. While the
   page scrolls through it the stage stays pinned (CSS sticky)
   and the vertical progress moves the track horizontally.
   All layout is measured once (on resize / image load); the
   per-frame work is transforms only.
   ========================================================= */
const scroller = $('[data-scroller]');
const track = $('[data-track]');
const bgword = $('[data-bgword]');
const worksProgress = $('[data-works-progress]');
const currentEl = $('[data-current]');

const hx = { on: false, top: 0, dist: 0, x: 0, vel: 0, cards: [], current: -1, mediaH: 0 };

function layout() {
  hx.on = !mqMobile.matches;
  const cards = $$('.card', cardsEl);
  if (!hx.on) {
    scroller.style.height = '';
    track.style.transform = '';
    cards.forEach((c) => (c.style.transform = ''));
    hx.cards = [];
  } else {
    hx.dist = Math.max(0, track.scrollWidth - innerWidth);
    scroller.style.height = `${hx.dist + innerHeight}px`;
    hx.top = scroller.getBoundingClientRect().top + scrollY;
    hx.mediaH = cards[0] ? $('.card__media', cards[0]).offsetHeight : 0;
    hx.cards = cards.map((el, i) => ({
      el,
      center: el.offsetLeft + el.offsetWidth / 2,
      oy: (OFFSETS[i % OFFSETS.length] / 100) * hx.mediaH,
      tilt: TILTS[i % TILTS.length],
      phase: i * 1.3,
    }));
  }
  state.docH = document.documentElement.scrollHeight - innerHeight;
}

let layoutQueued = false;
function scheduleLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layout(); });
}

function updateWorks(t) {
  if (!hx.on) return;
  const vw = innerWidth;
  const local = scrollY - hx.top;
  if (local < -innerHeight || local > hx.dist + innerHeight) return; // off-screen

  const target = clamp(local, 0, hx.dist);
  const prev = hx.x;
  hx.x = Math.abs(target - hx.x) < 0.1 ? target : lerp(hx.x, target, 0.12);
  hx.vel = lerp(hx.vel, hx.x - prev, 0.25);
  const reduced = mqReduced.matches;
  const v = reduced ? 0 : clamp(hx.vel, -60, 60);

  track.style.transform = `translate3d(${(-hx.x).toFixed(2)}px,0,0)`;
  bgword.style.transform = `translate3d(${(vw * 0.1 - hx.x * 0.35).toFixed(2)}px,0,0)`;
  worksProgress.style.transform = `scaleX(${(hx.dist ? hx.x / hx.dist : 0).toFixed(4)})`;

  let best = 0, bestD = Infinity;
  for (let i = 0; i < hx.cards.length; i++) {
    const c = hx.cards[i];
    const sx = c.center - hx.x;
    const d = Math.abs(sx - vw / 2);
    if (d < bestD) { bestD = d; best = i; }
    if (sx < -vw * 0.5 || sx > vw * 1.5) continue;          // outside view: skip

    const rel = (sx - vw / 2) / vw;                          // -0.5 … 0.5 on screen
    const float = reduced ? 0 : Math.sin(t * 0.0009 + c.phase) * 5;
    const ty = c.oy + rel * rel * 70 + float + state.mouse.y * 8;
    const rz = c.tilt + rel * 5 + v * 0.06;
    const sk = clamp(-v * 0.1, -6, 6);
    c.el.style.transform =
      `translate3d(${(state.mouse.x * 10).toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${rz.toFixed(2)}deg) skewX(${sk.toFixed(2)}deg)`;
  }
  if (best !== hx.current) {
    hx.current = best;
    currentEl.textContent = pad(best + 1);
  }
}

/* trackpads: a sideways swipe over the stage scrolls the page too */
function bindWorksInput() {
  $('.works__pin').addEventListener('wheel', (e) => {
    if (!hx.on || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const local = scrollY - hx.top;
    if (local < 0 || local > hx.dist) return;
    e.preventDefault();
    scrollBy(0, e.deltaX);
  }, { passive: false });

  /* keyboard: bring a focused card into view */
  cardsEl.addEventListener('focusin', (e) => {
    const card = e.target.closest('.card');
    if (!card || !hx.on) return;
    const c = hx.cards[+card.dataset.index];
    scrollTo({ top: hx.top + clamp(c.center - innerWidth / 2, 0, hx.dist), behavior: 'auto' });
  });
}

/* =========================================================
   Global motion loop (hero, marquee, cursor, progress)
   ========================================================= */
const state = {
  mouse: { x: 0, y: 0, tx: 0, ty: 0 },
  scroll: { last: scrollY, vel: 0 },
  marqueeX: 0,
  marqueeDir: 1,
  start: performance.now(),
  docH: 1,
};

const heroMasks = $$('.hero__mask');
const orbits = $('.hero__orbits');
const marquee = $('[data-marquee]');
const progressBar = $('.progress__bar');
const timecodeEl = $('[data-timecode]');

function tick(t) {
  const { mouse, scroll } = state;
  const y = scrollY;
  const vh = innerHeight;
  const reduced = mqReduced.matches;
  const amp = reduced ? 0 : mqMobile.matches ? 0.5 : 1;

  mouse.x = lerp(mouse.x, mouse.tx, 0.08);
  mouse.y = lerp(mouse.y, mouse.ty, 0.08);
  scroll.vel = lerp(scroll.vel, y - scroll.last, 0.15);
  scroll.last = y;
  const vel = clamp(scroll.vel, -80, 80);

  /* hero: letters drift at different depths */
  if (y < vh * 1.1) {
    heroMasks.forEach((m, i) => {
      const depth = (i - 2) * 0.6 + 1;
      m.style.transform =
        `translate3d(${(mouse.x * depth * 14 * amp).toFixed(2)}px,${(mouse.y * depth * 8 * amp - y * 0.06 * i * amp).toFixed(2)}px,0)`;
    });
    orbits.style.translate = `${(-mouse.x * 24 * amp).toFixed(1)}px ${(-mouse.y * 24 * amp + y * 0.25).toFixed(1)}px`;
    const f = Math.floor((t - state.start) / (1000 / 24));
    const s = Math.floor(f / 24);
    timecodeEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 24)}`;
  }

  /* marquee: drift + scroll velocity, only while near the viewport */
  if (!reduced && y < vh * 2.2) {
    const half = marquee.scrollWidth / 3;
    if (vel > 0.5) state.marqueeDir = 1;
    else if (vel < -0.5) state.marqueeDir = -1;
    state.marqueeX -= (0.6 + Math.abs(vel) * 0.3) * state.marqueeDir;
    if (state.marqueeX <= -half) state.marqueeX += half;
    if (state.marqueeX > 0) state.marqueeX -= half;
    marquee.style.transform = `translate3d(${state.marqueeX.toFixed(2)}px,0,0)`;
  }

  updateWorks(t);
  progressBar.style.transform = `scaleY(${clamp(y / state.docH, 0, 1).toFixed(4)})`;
  updateCursor();
  updatePreview();
  requestAnimationFrame(tick);
}

addEventListener('pointermove', (e) => {
  state.mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  state.mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  cursor.tx = e.clientX;
  cursor.ty = e.clientY;
}, { passive: true });

/* =========================================================
   Cards: focus mode, click, entrances
   ========================================================= */
function bindCards() {
  $$('.card', cardsEl).forEach((card) => {
    card.addEventListener('pointerenter', () => cardsEl.classList.add('has-focus'));
    card.addEventListener('pointerleave', () => cardsEl.classList.remove('has-focus'));
    card.addEventListener('click', () => openModal(+card.dataset.index, card));
  });
  $$('.works__row', indexList).forEach((row) => {
    row.addEventListener('click', () => openModal(+row.dataset.index, row));
    row.addEventListener('pointerenter', () => (preview.work = WORKS[row.dataset.index]));
    row.addEventListener('pointerleave', () => (preview.work = null));
  });
}

function countUp(el, to, dur = 1400) {
  const start = performance.now();
  const step = (now) => {
    const p = clamp((now - start) / dur, 0, 1);
    el.textContent = (to * (1 - Math.pow(1 - p, 4))).toFixed(1);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function observeEntrances() {
  const reveal = (el) => {
    el.classList.add('is-in');
    $$('[data-count-to]', el).forEach((n) =>
      mqReduced.matches ? (n.textContent = (+n.dataset.countTo).toFixed(1)) : countUp(n, +n.dataset.countTo));
  };
  if (!('IntersectionObserver' in window)) return $$('.card', cardsEl).forEach(reveal);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      reveal(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px -4% 0px -4%', threshold: 0.15 });
  $$('.card', cardsEl).forEach((c) => io.observe(c));
}

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

function startClock() {
  const el = $('[data-local-time]');
  const show = () => (el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  show();
  setInterval(show, 15000);
}

/* About: words light up as they cross the lower part of the screen
   (IntersectionObserver — no per-frame layout reads) */
function revealWords() {
  const statement = $('[data-reveal-words]');
  statement.innerHTML = statement.textContent.trim().split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`).join(' ');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-lit', e.isIntersecting || e.boundingClientRect.top < 0));
  }, { rootMargin: '0px 0px -22% 0px' });
  $$('.w', statement).forEach((w) => io.observe(w));
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
  cursor.x = lerp(cursor.x, cursor.tx, 0.25);
  cursor.y = lerp(cursor.y, cursor.ty, 0.25);
  cursorEl.style.transform = `translate3d(${cursor.x.toFixed(1)}px,${cursor.y.toFixed(1)}px,0)`;
}

const previewEl = $('.index-preview');
const previewImg = $('img', previewEl);
const preview = { work: null, x: 0, y: 0, shown: false };
function updatePreview() {
  const on = !!(preview.work && preview.work.thumb && cursor.on);
  if (on !== preview.shown) { previewEl.classList.toggle('is-on', on); preview.shown = on; }
  if (!on) return;
  if (previewImg.getAttribute('src') !== preview.work.thumb) previewImg.src = preview.work.thumb;
  preview.x = lerp(preview.x, cursor.tx + 40, 0.15);
  preview.y = lerp(preview.y, cursor.ty - 120, 0.15);
  previewEl.style.transform = `translate3d(${preview.x.toFixed(1)}px,${preview.y.toFixed(1)}px,0)`;
}

/* =========================================================
   Modal with TikTok embed/v2 player
   ---------------------------------------------------------
   embed/v2 renders the video at its own aspect ratio plus a
   caption footer. The iframe gets that full height (from the
   video aspect, refined by the height TikTok reports through
   postMessage) and is scaled down to fit — never cropped.
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

addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !/(^|\.)tiktok\.com$/.test(e.origin.replace(/^https?:\/\//, ''))) return;
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
  $('.modal__views-value', modal).textContent = w.views;
  $('.modal__likes', modal).textContent = `${w.likes} likes`;
  $('.modal__cta', modal).href = videoUrl(w.id);
  embedH = Math.round(EMBED_W / (w.ar || 9 / 16) + EMBED_FOOTER);
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
revealWords();
bindCards();
bindWorksInput();
observeEntrances();
observeSections();
startClock();
initCursor();
bindModal();
bindTheme();
layout();
loadThumbnails();

addEventListener('resize', scheduleLayout);
addEventListener('load', scheduleLayout);
if (document.fonts) document.fonts.ready.then(scheduleLayout);
requestAnimationFrame(tick);
