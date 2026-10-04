---
name: saas-launch-video
description: Creative director for SaaS product launch videos made with HyperFrames (HTML to MP4) and Three.js. Pitches 3 distinct creative directions (clean editorial, bold graphic, cinematic 3D, technical/dev looks, each with a narrative shape and signature move) with rendered still frames, then builds the chosen one around the product's real UI. Works from the product's code, its website link (link mode extracts the brand) or screenshots, and can replicate a reference video's style, structure and rhythm (reference mode: shot detection, contact sheets, render-vs-reference comparison); includes a UI-rebuild rig, a Three.js device/panel stage, music prompting and variation mixing, and final delivery. Use when the user wants a launch video, product promo, feature announcement or social media video for a software product, sends a video to replicate, or mentions HyperFrames launch videos.
---

# SaaS launch video: creative director

Every video should feel made for its product: its own concept, structure, look and transitions. This skill is a **director + toolkit**, not a template. Never fall back to one house style.

## Requirements
Node 18+, FFmpeg on PATH, `npx hyperframes@0.8.115`. The HyperFrames skills `hyperframes-creative`, `hyperframes-animation` and `hyperframes-registry` (install: `npx hyperframes@0.8.115 init <any-dir>`; refresh: `npx hyperframes@0.8.115 skills update`). Python + `pip install librosa` only for music analysis.

**Reference video?** If the user sends a video to replicate ("like this"), follow [references/REFERENCE.md](references/REFERENCE.md): run `scripts/analyze-reference.mjs` and write `reference.md` right after step 1. It then shapes the pitch, script, build checks and music.

## Workflow (4 checkpoints need the user)

1. **Set up and learn the product.** Run `node <skill>/scripts/new-project.mjs <dir>`. Then learn the product from the best source available:
   - **Code:** read the components, routes, theme and copy; write `brand.json` (references/BRAND.md) and run `scripts/brand.mjs`.
   - **Link:** `node <skill>/scripts/from-link.mjs <url> <dir>` writes `brand.json` and `brand-kit.md`; verify the logos and colours.
   - **Screens:** ask for the logo, colours and key screens.

   List the live features, the audience and the tone.
2. **CHECKPOINT: pitch 3 directions.** Use [references/PITCH.md](references/PITCH.md). Combine looks from [references/DIRECTIONS.md](references/DIRECTIONS.md) (4 families × 3 looks) with shapes from [references/NARRATIVES.md](references/NARRATIVES.md). The three must differ (at least 2 families) and each gets a rendered key frame. The user picks or mixes; save the decision to `direction.md`. With a reference, direction A is the reference at the asked fidelity, and each still is shown beside the reference frame it answers.
3. **CHECKPOINT: script.** A beat table for the chosen direction (scene, on-screen content, copy, motion, transition, sound), plus the exact UI actions. After approval, ask for the in-app screens it needs ([references/UI-REBUILD.md](references/UI-REBUILD.md)).
4. **CHECKPOINT: images** (only if the direction needs them). Write prompts and wait for the files; never generate or fake them yourself ([references/IMAGES.md](references/IMAGES.md)).
5. **Build.**
   - One sub-composition per scene.
   - For each scene, read its HyperFrames blueprint and search the registry (`npx hyperframes@0.8.115 catalog <words> --json`) before hand-building.
   - Product scenes start from `reference/ui-rig.html`. Use `lib/fx.js` for motion and `lib/three-stage.js` for 3D.
   - Loop lint → snapshot → fix until every frame reads well, then make a draft render ([references/WORKFLOW.md](references/WORKFLOW.md)). With a reference, check the draft with `analyze-reference.mjs --compare`.
6. **CHECKPOINT: music.** Write `music-plan.json`, run `scripts/music-plan.mjs`, and tell the user to generate 2-4 takes in ElevenLabs. Align them with `analyze-track.py --drop`, mix them with `mix-variations.mjs`, and let the user pick ([references/MUSIC.md](references/MUSIC.md)).
7. **Deliver.** Mount the track, render with `-q delivery`, then run `scripts/finalize.mjs` (−14 LUFS master + an upload copy under 100 MB).

## Rules
- **Only real features, real UI, demo data.** Never invent screens; ask for them.
- **One signature move and 2-3 transitions per video** (or the reference's own set), used consistently. Hold every line of text long enough to read it.
- **Brand variables only** in scenes (`var(--brand-primary)`, `var(--font-display)`); never hard-code a brand hex or font family.
- **A reference is grammar, not content.** Copy its rhythm, transitions, type and colour roles; never its footage, logos, names, copy or music.
- **No default look.** If a draft starts drifting toward a generic "dark gradient + tilted window + type cards", stop and re-read `direction.md`.
- Read [references/GOTCHAS.md](references/GOTCHAS.md) before building. It lists the HyperFrames traps that cost renders.

## Files
| Path | What it is |
| --- | --- |
| `toolkit/fx.js` | motion helpers: typing, streaming text, whip, mask reveal, cursor, count-up, path draw/follow |
| `toolkit/three-stage.js` | Three.js laptop / phone / floating-panels stage with keyframed camera and screen swaps |
| `toolkit/ui-rig.html` | UI-rebuild rig (flat / tilt / front camera), copied to `reference/` in every project |
| `toolkit/skeleton/` | empty root `index.html` (brand markers, importmap, fx) |
| `examples/` | technique demos, one per family: `new-project.mjs <dir> --examples` mounts them. Study, never copy. |
| `scripts/` | `new-project`, `from-link`, `brand`, `analyze-reference`, `fetch-sfx`, `music-plan`, `analyze-track.py`, `mix-variations`, `finalize` |
