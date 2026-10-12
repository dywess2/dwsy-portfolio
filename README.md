# dwsy. — portfolio

One-page portfolio for TikTok creator **dwsy** ([@dwsy.ae](https://www.tiktok.com/@dwsy.ae)).
Dark, minimal, cinematic. The Selected Works section is a pinned horizontal scroller: the mouse wheel
(or trackpad) moves the row of video cards sideways; clicking a card opens the TikTok player in a modal.

Plain HTML + CSS + vanilla JS, no build step.

```
index.html      structure (hero, marquee, works, about, links, footer, modal)
css/styles.css  tokens/themes at the top, then one block per section
js/main.js      PROFILE + WORKS data, rendering, horizontal scroller, modal, theme toggle
```

## Run locally

```
python3 -m http.server 8000
```

## Editing

- **Videos / numbers** — the `WORKS` array at the top of `js/main.js` (`views`, `likes`, `title`, `motif`).
  Totals, averages and the index list are computed from it.
- **Profile numbers** — `PROFILE` in `js/main.js` (followers, likes).
- **Row rhythm** — `OFFSETS` (vertical offset per card) and `TILTS` (base rotation) in `js/main.js`.
- **Card size** — `--mh` on `.card` in `css/styles.css` (media height; width follows each video's aspect).
- **Colours** — CSS variables in `:root` (dark) and `:root[data-theme="light"]`.

## How it works

- **Horizontal scroll** — `.works__scroller` is made as tall as the track is wide; `.works__pin` is
  `position: sticky`, and the vertical scroll progress is turned into a `translate3d` of the track
  (smoothed for a little inertia, with velocity-based tilt/skew). Layout is measured only on resize and
  image load; each frame only writes transforms. On phones (≤ 760px) it is a native swipe row with snap.
- **Thumbnails** — fetched from TikTok oEmbed; each card's media box takes the thumbnail's own aspect
  ratio with `object-fit: contain`, so nothing is cropped.
- **Player** — `https://www.tiktok.com/embed/v2/VIDEO_ID` in an iframe sized to the embed's full height
  (video aspect + caption footer, refined by the height TikTok reports) and scaled to fit the screen.
- `prefers-reduced-motion` disables floating, skew and marquee motion.
