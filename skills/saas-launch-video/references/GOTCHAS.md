# Gotchas (each one cost a render on a real project)

## HyperFrames contract

- Sub-compositions put `<style>` and `<script>` **inside** `<template>`. The host `data-composition-id`, the inner root id and the `window.__timelines["id"]` key must match.
- Asset paths in sub-compositions are **root-relative** (`assets/...`), never `../assets/...`.
- Every `<audio>` needs an `id`. Lint reads commented-out tags too, so don't leave a commented `<audio>` pointing at a missing file.
- A composition driven only by Three.js and no GSAP timeline needs `data-no-timeline` on its root, or render waits 45 s for a timeline.
- `npx hyperframes render --format png-sequence` gives RGBA frames, which is handy to bake a Three.js render into a transparent PNG asset.

## Lint errors with a known fix

- `gsap_non_transform_motion`: no `letterSpacing`, `width` or `top` tweens for motion. Do tracking as per-letter `x` offsets.
- `gsap_relative_value_second_writer`: no `"+=0.1"` on a property another tween also writes (render workers seek cold). Always tween to absolute values.
- `gsap_cold_seek_hidden_fromto_missing_reveal`: a `fromTo` that starts hidden must put `opacity: 1` in the **to** vars.
- `missing_timeline_registry`: the `window.__timelines[...]` registration must be visible inside the file itself, not only in an external script.
- Layout `content_overlap` errors from intentional layering (a before/after wipe, a card over a running scene, tilted rows): add `data-layout-allow-overlap` on the container. These are not render errors.

## Measuring layout

- Offsets read at build time are 0 for anything `display: none`. Lay out each state (each prompt, each chat-thread length), measure it, store it, then hide it. Pass `pos` to `FX.typewriter`.
- `offsetLeft`/`offsetTop` ignore transforms, so measure in window space and move the camera, not the content.
- Camera = two nested layers: tilt (rotation about the frame centre) wrapping move (`x`, `y`, `scale` toward the target). The target then stays centred whatever the tilt.

## Text rendering

- Char-split typing uses one `<span>` per character. In inputs set `.ch { white-space: pre-wrap }` or long prompts never wrap (a horizontal overflow "layout shift").
- `background-clip: text` (gradient keywords) only paints inside the element box. A block with `line-height: 1` clips descenders (p, g, y), so use line-height ≥ 1.15.
- `display: inline` chars keep gradient-clipped text intact. Use `inline-block` only for letters that need transforms (the logo wordmark).
- Recolour a whole generated page with a CSS variable (`--brand`) and tween it: `tl.fromTo(el, {"--brand": a}, {"--brand": b})`.

## Scripts and 3D

- Never write a closing `script` tag inside a JS comment in a file the page loads (`lib/*.js`). HyperFrames inlines scripts, the tag ends the script early, and the rest of the file is drawn on screen as text.
- `hf-seek` (Three.js) carries **root** time, even inside a sub-composition. `three-stage.js` subtracts the scene start automatically by summing `data-start` up its ancestors. Hand-written Three.js scenes must do the same, or the camera freezes on its last key.
- Put the `three` importmap in the root `index.html` `<head>` (the skeleton has it); importmaps inside sub-composition templates load too late.

## Overlays and effects

- Overlays (light leaks, fades) work best as plain elements animated by the root timeline, not as timed `.clip`s.
- `mix-blend-mode: screen` washes out over saturated colour; for a visible flash use normal blending with a bright radial gradient.
- Depth of field: an unmasked `backdrop-filter: blur()` blurs the whole frame. Mask it to the far edge.
- Directional (motion) blur: SVG `<feGaussianBlur stdDeviation="44 0">` animated through `attr`, applied with `filter: url(#id)`.

## Windows / tooling

- PowerShell 5 `Get-Content`/`Set-Content` round-trips UTF-8 as ANSI and mangles `·`, `★`, `–`. Edit files with an editor tool or `[IO.File]::ReadAllText(path, UTF8)`.
- On Windows, `curl` in PowerShell is `Invoke-WebRequest`; type `curl.exe`.
- If FFmpeg is missing: `winget install ffmpeg`, or npm `ffmpeg-static` + `ffprobe-static` and set `FFMPEG`/`FFPROBE`.
