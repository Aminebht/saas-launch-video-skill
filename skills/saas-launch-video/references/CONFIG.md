# video.config.json

`scripts/build.mjs` turns it into `index.html` and fills `scene-templates/*.tpl.html` into `compositions/`. Times are seconds on the root timeline.

## Top level

| Key | Meaning |
| --- | --- |
| `width`, `height`, `fps`, `duration` | canvas and length (the root `data-duration`) |
| `brand` | `name`, `wordmark` (logo intro text), `mark` (icon image), `logo` (lockup image, light-on-dark), `url`, `font` (files in `assets/fonts/<font>-latin-<weight>-normal.woff2`), `colors` (`ink`, `text`, `keywordFrom`/`keywordTo`, `caretFrom`/`caretTo`, `chipBorder`) |
| `plate.colors` | gradient blobs: `ink` (card bg), `deep` (dark base), `a`, `b`, `c` (main colours, bottom-right pool), `d` (small highlight) |
| `plate.arc` | colour-arc segments `{start, end, rise, glow, heat, ease}`. Values or `[from, to]` pairs eased over `ease` seconds. `rise: 1` = ink with the gradient rising from the bottom (`glow` = height 0-1). Outside any segment: full gradient. |
| `beats` | ordered list, see below |
| `montage` | `handle`, `url`, `caption`, `chatName`, `chatMessage`, `previewTitle`, `previewDesc`, `images.{ad,story,video,chat}` (missing images become gradient placeholders) |
| `pills`, `pillsHighlight` | pill-wall rows; `"row:index"` entries get the highlight; the first is where the camera starts |
| `musicPlan` | input for `scripts/music-plan.mjs` (MUSIC.md) |
| `audio.sfx[]`, `audio.music` | `{src, start, duration, volume}`. Missing files are skipped with a warning. |

## Beat types

```jsonc
{ "type": "logo-intro", "id": "c-intro", "start": 0, "duration": 2.5, "next": "pages", "shrinkAt": 1.2 }
{ "type": "text", "id": "c-x", "start": 2.5, "duration": 0.8, "text": "are built to [sell]",
  "size": "line|hero", "enter": "cut|whip-left|whip-right|type|rise", "bg": "ink|gradient", "sub": "optional subline",
  "cps": 14, "typeDelay": 0.15 }
{ "type": "tokens", "id": "c-t", "start": 12.2, "duration": 1.4, "stagger": 0.3,
  "items": [{ "icon": "sparkle", "label": "copy" }, { "icon": "image", "label": "images" }] }
{ "type": "scene", "id": "app", "src": "compositions/app.html", "start": 6.35, "duration": 7.65 }
{ "type": "leak", "start": 5.95, "duration": 0.8 }
{ "type": "tagline", "id": "c-tag", "start": 45.8, "duration": 7.7, "prefix": "More customers for your",
  "words": ["garage", "clinic", "business"], "firstSwap": 0.7, "swapEvery": 0.7,
  "lockup": { "at": 2.7, "logo": "optional override", "url": "optional override" }, "fadeOut": 1.2, "bg": "gradient" }
```

- Token icons: sparkle, image, layout, clock, send, chat, globe, chart, bolt, lock, users, mail, calendar, check, card.
- A scene's `id` must equal the `data-composition-id` and timeline key inside its file.
- Cards may overlap a scene in time (they cover it). Scenes should not overlap each other, except the 0.05 s handoff under the light leak.
- The build warns about two gradient keywords on one card, cards under 0.5 s, beats past `duration`, and missing files.
