---
name: saas-launch-video
description: Produces a 30-60 s SaaS product launch video in the "type cards + tilted product UI + animated gradient" style with HyperFrames (HTML to MP4) and Three.js. Ships a config-driven template, a camera/cursor/typing rig for rebuilding the real product UI, and scripts for the music prompt, music variations and final delivery. Works from the product's code, its website link (link mode extracts the brand automatically) or screenshots. Use when the user wants a launch video, product promo, feature announcement or social media video for a software product, or mentions HyperFrames launch videos.
---

# SaaS launch video

Two alternating worlds, cut on the beat: **black type cards** (one idea, one gradient keyword) and
**product proof**: the real UI rebuilt in HTML, floating on a Three.js mesh gradient, filmed by a
camera that never stops. Every claim card is followed by UI that proves it.

## Requirements

Node 18+, FFmpeg on PATH, `npx hyperframes@0.8.115` (installs Chrome on first run). Python + `pip install librosa` only for track analysis.

## Quick start

```bash
node <skill>/scripts/new-project.mjs ./my-launch-video   # copy template + build
node <skill>/scripts/fetch-sfx.mjs ./my-launch-video     # optional sound effects
cd my-launch-video && npx hyperframes@0.8.115 snapshot --frames 8   # see the example (a fictional "Lumen")
```

`<skill>` is this folder. Edit `video.config.json` and `compositions/*.html`, run
`scripts/build.mjs <project>` after every config change, then `npx hyperframes@0.8.115 lint`.

## Workflow (follow in order; three checkpoints need the user)

1. **Learn the product.** Use whatever the user gives, best first:
   - **Codebase:** read the UI components, routes, theme and copy.
   - **Link (link mode):** run `node <skill>/scripts/from-link.mjs <url> <project>`. It captures the public site, pre-fills the brand, colours, logo, font and montage copy, and writes `brand-kit.md`. Check the kit, then ask for the **in-app screens** it lists (screenshots, a screen recording, or a browser session the user logs into themselves), because a public link never shows the logged-in product.
   - **Screenshots or recording only.**

   List the features that ship today. Only real features go on screen; never invent app screens.
2. **CHECKPOINT: script.** Propose the demo scenario (who uses it, for what), the beat sheet (card copy + times), each product shot (what is typed or clicked, what changes), the pill-wall labels and the tagline. Wait for approval. See [references/WORKFLOW.md](references/WORKFLOW.md).
3. **CHECKPOINT: images.** Write one generation prompt per image slot (file name, aspect ratio, no text). Hand them over and wait for the files. Never generate or fake them yourself. See [references/IMAGES.md](references/IMAGES.md).
4. **Build.** Fill `video.config.json` ([references/CONFIG.md](references/CONFIG.md)). Rebuild the product UI in `compositions/app.html` (one file per product scene) using the rig there. Build, lint, snapshot and fix in a loop until every frame reads well.
5. **CHECKPOINT: music.** Write the music prompt with `scripts/music-plan.mjs` and tell the user to generate 2-4 takes in ElevenLabs (elevenlabs.io → Music) and send the MP3s. You never generate music or call a music API. Align each take with `scripts/analyze-track.py --drop <t>`, render once without music, run `scripts/mix-variations.mjs` and let the user pick. See [references/MUSIC.md](references/MUSIC.md).
6. **Deliver.** Put the chosen track in `audio.music`, scale the SFX under it, build and render (`-q delivery --video-bitrate 16M`), then run `scripts/finalize.mjs` (−14 LUFS master + under-100 MB upload copy).

## Style rules (full list: [references/STYLE.md](references/STYLE.md))

- One gradient keyword per card, at most 2 lines. Hold every card ≥ 0.5 s + 0.25 s per extra word.
- UI never sits still: constant drift, punch-ins to the element that matters, pull-backs to show the result.
- Hard cuts and whips only. The single crossfade is into the end card.
- Tilt the window with `rotateY < 0` (it turns right); flip it only on purpose.
- From roughly 75 % in, the gradient rises behind the cards (the colour arc). The end is warmer and louder.
- Before the build, read [references/GOTCHAS.md](references/GOTCHAS.md). It lists every HyperFrames trap this template already works around.

## Files

| Path | What it is |
| --- | --- |
| `template/video.config.json` | brand, beats (cards/scenes/leak/tagline), colour arc, montage, pills, music plan, audio |
| `template/lib/` | `fx.js` motion helpers, `cards.js` card timeline (inlined by build), `plate.js` Three.js gradient |
| `template/compositions/app.html` | example product scene: camera rig, prompt typing, cursor click, streaming result |
| `template/scene-templates/` | montage + pill wall, filled from the config by build.mjs |
| `scripts/` | `new-project`, `from-link` (link mode), `build`, `fetch-sfx`, `music-plan`, `analyze-track.py`, `mix-variations`, `finalize` |
