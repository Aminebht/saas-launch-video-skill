# Workflow in detail

## 0. Setup
```bash
node <skill>/scripts/new-project.mjs ./<product>-launch      # skeleton + toolkit + brand.json
node <skill>/scripts/fetch-sfx.mjs ./<product>-launch        # optional sound effects
```
Make sure the HyperFrames skills are present (`hyperframes-creative`, `hyperframes-animation`, `hyperframes-registry`); if not, run `npx hyperframes@0.8.115 skills update`.

## 1. Learn the product
- **Code:** read the app shell, the screen where the value happens, success states, theme tokens and copy. Write `brand.json` by hand (BRAND.md), then run `brand.mjs`.
- **Link (link mode):** `node <skill>/scripts/from-link.mjs <url> <project>` captures the site, writes `brand.json` + `brand-kit.md` and injects the brand. Open the logo candidates, set `logo.onDark` / `logo.onLight`, check the colours against `capture/screenshots/`.
- **Screens only:** ask for the logo, colours and 3-6 key screens.
- **Reference video:** if the user sent one, run `node <skill>/scripts/analyze-reference.mjs <video> <project>`, read the sheets, zoom into the transitions and write `reference.md` (REFERENCE.md) before pitching.
- List the features that ship today and the audience. Note the brand's tone (serious, playful, technical, premium); it steers the pitch.

## 2. Pitch 3 directions (checkpoint) → PITCH.md
Three different directions (DIRECTIONS.md looks + NARRATIVES.md shapes), each with a card and a rendered key frame. With a reference, A is the reference (REFERENCE.md §3). The user picks or mixes. Save the decision to `direction.md`.

## 3. Script (checkpoint)
For the chosen direction, a beat table: time, scene, what is on screen, copy, motion, transition into the next beat, sound. Plus the exact UI actions (what is typed or clicked, what changes) and the in-app screens you still need. Wait for approval, then ask for those screens (UI-REBUILD.md).

## 4. Images (checkpoint, only if the direction needs any) → IMAGES.md

## 5. Build
- One sub-composition per scene in `compositions/`, mounted from `index.html` (`.scene-slot` divs; see the skeleton comment). Root timeline only for cross-scene overlays.
- For each scene:
  1. Read the matching blueprint (`hyperframes-animation/blueprints/<id>.md`) and rules.
  2. Search the registry for blocks and transitions before hand-building (`npx hyperframes@0.8.115 catalog <words> --json`, then `add`).
  3. Build product scenes from `reference/ui-rig.html`; use `lib/fx.js` helpers and `lib/three-stage.js` for 3D.
- Loop: `npx hyperframes@0.8.115 lint` (0 errors), `snapshot --at <every beat midpoint>`, read the contact sheets, fix. Then a draft render (`render -q draft`) to judge motion. With a reference, run `analyze-reference.mjs <video> <project> --compare renders/draft.mp4` and fix timing and look gaps.
- Hold yourself to the direction: same palette treatment, the one signature move, the 2-3 transitions. Remove anything generic that crept in.

## 6. Music (checkpoint) → MUSIC.md
Write `music-plan.json` from the approved beat table, run `music-plan.mjs`, hand the prompt to the user (ElevenLabs), receive takes, mix variations, the user picks.

## 7. Deliver
1. Mount the chosen track as `<audio id="music">` at its offset (pre-trim and fade with ffmpeg); SFX at about 0.7× under it.
2. `npx hyperframes@0.8.115 render -q delivery --video-bitrate 16M -o renders/<name>-raw.mp4`
3. `node <skill>/scripts/finalize.mjs renders/<name>-raw.mp4` produces `-final.mp4` (−14 LUFS) and `-final-upload.mp4` (< 100 MB).
4. Optional 1:1 or 9:16 cut: re-frame scenes (set `data-width`/`data-height`), don't just crop.
