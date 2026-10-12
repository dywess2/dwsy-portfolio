# dwsy. — portfolio

One-page portfolio for TikTok creator **dwsy** ([@dwsy.ae](https://www.tiktok.com/@dwsy.ae)).
Dark, cinematic "floating gallery": video cards drift, tilt and react to scroll and cursor;
clicking a card opens the TikTok player in a modal.

Plain HTML + CSS + vanilla JS, no build step.

```
index.html      structure (hero, works, about, links, footer, modal)
css/styles.css  tokens/themes at the top, then one block per section
js/main.js      WORKS data, card rendering, motion loop, modal, theme toggle
```

## Run locally

Open `index.html` directly, or serve the folder (recommended so the TikTok thumbnail fetch works):

```
python3 -m http.server 8000
```

## Editing

- **Videos / views / titles / card positions** — edit the `WORKS` array at the top of `js/main.js`.
  `x`/`y` are percentages inside the gallery field, `w` is card width, `depth` (0.5–1.5) controls
  parallax strength and stacking, `rot` is base rotation, `motif` picks the abstract cover
  (`rings`, `bars`, `wave`, `grid`, `orbit`, `slash`). A card with `views: null` shows "New".
- **Colours** — CSS variables in `:root` (dark) and `:root[data-theme="light"]`.
- **Player** — the modal embeds `https://www.tiktok.com/embed/v2/VIDEO_ID` in an iframe (`embedUrl` in `js/main.js`).
- **Thumbnails** — fetched from TikTok oEmbed when the browser allows it; otherwise the generative
  motif is shown.

On screens ≤ 760px the free composition becomes a staggered two-column layout with gentler motion.
`prefers-reduced-motion` disables floating and parallax.
