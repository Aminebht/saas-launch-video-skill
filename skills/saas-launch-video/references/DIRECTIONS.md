# Style library: 4 families × 3 looks

A **direction** = one look (below) + one narrative (NARRATIVES.md) + one signature transition + a music genre. Looks are starting points with clear rules, not templates. Bend them to the product and brand.

Every look uses only the brand variables (`--brand-primary`, `--brand-ink`, `--brand-paper`, `--font-display`… see BRAND.md). "Palette treatment" says how to deploy them.

HyperFrames references (load the skills `hyperframes-creative` and `hyperframes-animation`; refresh with `npx hyperframes skills update` if missing):
- **Visual styles** (`hyperframes-creative/references/visual-styles.md`): Swiss Pulse, Velvet Standard, Deconstructed, Maximalist Type, Data Drift, Soft Signal, Folk Frequency, Shadow Cut.
- **Frame presets** (`hyperframes-creative/frame-presets/<name>/FRAME.md`): biennale-yellow, blockframe, blue-professional, bold-poster, broadside, capsule, cartesian, cobalt-grid, code-editorial, coral, creative-mode, daisy-days, editorial-forest.
- **Blueprints** (`hyperframes-animation/blueprints/<id>.md`): time-coded shot shapes from 178 launch films.
- **Registry blocks/transitions**: `npx hyperframes@0.8.115 catalog <words> --json` to search, `npx hyperframes@0.8.115 add <name>` to install. All 49 transitions: `catalog --tag transition` (also whip-pan, match-cut, type-match-cut, parallax-device-dive, morph-swap, halftone-dissolve...).

Technique demos for each family are in `examples/` (see SKILL.md). Study them, never copy them.

---

## A. Clean & editorial (premium B2B, finance, productivity, design tools)

### A1. Swiss grid
- **Concept:** the product presented as precise information design. Calm, exact, confident.
- **Palette:** `paper` background, `ink` type, `primary` only for one accent per frame; thin `line` rules.
- **Type:** big flush-left grotesk (`--font-display`, weight 600, tracking −4 %), mono labels for section numbers ("01 / Invoicing").
- **Layout:** a visible 12-column grid; UI cards snap to columns; generous margins; asymmetric.
- **Camera:** almost still (scale +3 % per shot). Product UI flat, never tilted.
- **Signature move:** grid lines draw on, then lines of text rise out of masks, then a UI card slides along a grid line, then an annotation line draws to the detail.
- **Transitions:** hard cut, colour-panel mask wipe, `sdf-iris` for the final reveal.
- **HyperFrames:** Swiss Pulse · presets `cartesian`, `cobalt-grid`, `blue-professional` · blueprints `kinetic-type-beats`, `grid-card-assemble`, `panel-edit-live-sync`.
- **Music:** minimal electronic or piano pulse, 100-115 BPM.

### A2. Soft studio
- **Concept:** the product as a beautiful object on a soft-lit set. Warm and premium.
- **Palette:** `paper` with a large soft radial tint of `primary-soft`; soft drop shadows; no hard lines.
- **Type:** medium weight, centred, short lines; lots of air.
- **Layout:** 2-4 UI cards floating in shallow depth (parallax layers, different blur), product centred.
- **Camera:** slow dolly + gentle parallax; light depth of field on background cards.
- **Signature move:** zoom-out workspace reveal: start on one UI detail, pull back to reveal the whole floating composition.
- **Transitions:** soft blur dissolve (`transitions-blur`), `cross-warp-morph` used sparingly. Crossfades are allowed here.
- **HyperFrames:** Velvet Standard / Soft Signal · presets `capsule`, `editorial-forest` · blueprints `zoom-out-workspace-reveal`, `device-surface-showcase` (flat window).
- **Music:** warm ambient pop, soft keys, 90-105 BPM.

### A3. Magazine
- **Concept:** a feature article about the customer and the product. Human, editorial.
- **Palette:** `paper` (or a warm off-white tint), `ink` serif headlines, `primary` for folios and pull-quote marks.
- **Type:** a serif display for headlines (set `fonts.display` to a serif only if the brand allows; otherwise use the brand display at a light weight), sans for body.
- **Layout:** split spreads (photo or UI one side, headline + deck the other), folios, captions, pull quotes.
- **Camera:** lateral pans across spreads (`spatial-pan-stations`), page-turn feel.
- **Signature move:** a pull quote types in while the photo crops reframe beside it.
- **Transitions:** `transitions-cover` (page over page), `editorial-flash-overlay`.
- **HyperFrames:** Velvet Standard · presets `broadside`, `editorial-forest` · blueprints `spatial-pan-stations`, `typewriter-reveal`.
- **Music:** acoustic/jazz-hop, 85-95 BPM.

---

## B. Bold & graphic (consumer apps, creator tools, marketing, launches with attitude)

### B1. Poster blocks
- **Concept:** a shouted poster campaign. Every beat is a slogan.
- **Palette:** full-bleed `primary` and `secondary` blocks; `ink` and `paper` type; maximum contrast.
- **Type:** huge display weight 800, tight tracking, uppercase allowed; one or two words per frame.
- **Layout:** centred type slams; UI framed in thick `ink` outlines with a hard offset shadow, slightly rotated.
- **Camera:** none; the motion is the type (scale slams, hard swaps on the beat).
- **Signature move:** word slam (scale 2.4 to 1, back-out), then hard word swaps on beats, then a colour-block wipe into the product.
- **Transitions:** hard cuts on beats, colour-block wipes, `beat-freeze-cut`, `ridged-burn` once.
- **HyperFrames:** Maximalist Type · presets `bold-poster`, `biennale-yellow`, `blockframe` · blueprints `kinetic-type-beats`, `cta-morph-press`.
- **Music:** punchy electro-pop, 120-128 BPM.

### B2. Kinetic collage
- **Concept:** a zine made of the product: cut-outs, stickers, scribbles. Playful, human.
- **Palette:** `paper` with a grain or texture, brand colours as paper scraps; `ink` scribbles.
- **Type:** mixed sizes, rotated labels, a hand-drawn underline (SVG path draw).
- **Layout:** UI fragments as cut-outs (not whole windows), stickers, arrows, tape.
- **Camera:** small jitter and stepped motion (stop-motion: `steps(8)` easing on positions).
- **Signature move:** fragments fly in and stick with a spring, a scribble circles the key detail, a sticker pops.
- **Transitions:** `hw-scribble-transition`, `mk-clone-wall-transition`, a light `glitch`.
- **HyperFrames:** Deconstructed / Folk Frequency · presets `daisy-days`, `creative-mode`, `coral` · blueprints `overwhelm-surround`, `grid-card-assemble`.
- **Music:** indie hip-hop or breakbeat, 90-100 BPM, with a scratch or two on cuts.

### B3. Pop bento
- **Concept:** everything the product does, as a satisfying bento box.
- **Palette:** `paper` or `ink` base with tiles in `primary`, `secondary`, `primary-soft`; rounded corners.
- **Type:** bold numbers and short labels inside tiles.
- **Layout:** a bento grid of rounded tiles (icon, metric, mini-UI, photo); one tile expands into a full product shot.
- **Camera:** the grid assembles, the camera pushes into one tile, it expands, then pulls back.
- **Signature move:** staggered tile assembly with spring, then one tile morphs full-screen (FLIP-style scale).
- **Transitions:** `transitions-scale`, `sdf-iris`.
- **HyperFrames:** Swiss Pulse / Folk Frequency · presets `capsule`, `coral` · blueprints `grid-card-assemble`, `constellation-hub`, `dataviz-countup`.
- **Music:** upbeat future-funk or house, 110-122 BPM.

---

## C. Cinematic 3D (hero launches, hardware-feel products, AI)

### C1. Device stage
- **Concept:** the product as a hero object under studio lights.
- **Palette:** `ink` stage with a `primary-deep` radial glow; `secondary` for highlights and titles.
- **Type:** few words, large, held long; titles share the frame with the device (device on one third).
- **Layout:** one device (laptop/phone via `lib/three-stage.js`) showing the real UI frozen to PNG; title in negative space.
- **Camera:** slow orbit + push, rack-focus feel; screen states cut on beats.
- **Signature move:** orbit + push while the screen cuts from the empty state to the result, then a light sweep across the device.
- **Transitions:** `light-leak`, `organic-light-leak-overlay`, `cinematic-zoom`.
- **HyperFrames:** Shadow Cut / Velvet Standard · blueprints `device-surface-showcase`, `logo-assemble-lockup` · `hyperframes-animation/adapters/three.md`.
- **Music:** cinematic hybrid (pulses + hits), slow build, 80-100 BPM.

### C2. Canvas flight
- **Concept:** a journey through the product's world. UI panels float in space and the camera flies between them.
- **Palette:** `ink` with fog tinted `primary-deep`; panel edges in `primary`.
- **Type:** labels anchored to panels (HTML overlays timed to the camera).
- **Layout:** `three-stage.js` mode `panels`: 5-9 UI panels placed in depth along a path.
- **Camera:** a multi-leg journey (dive, stop on a panel, travel to the consequence, land).
- **Signature move:** fly-through between panels with depth of field; land on the result panel.
- **Transitions:** none inside the flight (one continuous world); `gravitational-lens` or `domain-warp-dissolve` in and out.
- **HyperFrames:** Data Drift · blueprints `camera-journey`, `zoom-out-workspace-reveal` · rules `3d-camera-flight`, `depth-of-field-blur`.
- **Music:** atmospheric electronic, 100-120 BPM.

### C3. Object metaphor
- **Concept:** one 3D object embodies the value (blocks stacking = organisation, glass orb = clarity, ribbons = flow) and becomes the logo.
- **Palette:** brand colours as materials (glass, metal, matte) on an `ink` or `paper` set.
- **Type:** promise lines over the object; UI appears as projections or cards orbiting it.
- **Layout:** the object centred and large; UI secondary.
- **Camera:** macro → wide; slow rotation.
- **Signature move:** the object transforms (stacks, splits, flows) on the beat and resolves into the logo mark.
- **Transitions:** `swirl-vortex`, `cross-warp-morph`.
- **HyperFrames:** Data Drift · blueprints `logo-assemble-lockup`, `constellation-hub` · Three.js adapter.
- **Music:** ambient with percussion, 90-110 BPM.

---

## D. Technical / dev (developer tools, APIs, infra, data, security)

### D1. Terminal story
- **Concept:** the product shown the way developers use it: a command, logs, a result.
- **Palette:** `ink` background with a faint dot grid; `primary` prompt; `secondary` success ticks.
- **Type:** `--font-mono` everywhere except one display line per scene.
- **Layout:** a terminal or editor window (registry: `terminal-simulator`, `code-terminal-run`, `code-snippet-*`), then the live result.
- **Camera:** pans and pushes along the output; hard cuts on command completion.
- **Signature move:** a typed command, then streamed logs with ticks, then a cut to the live result.
- **Transitions:** `code-slice-hero`, hard cuts, a subtle `glitch`.
- **HyperFrames:** Deconstructed / Swiss Pulse · preset `code-editorial` · blueprints `prompt-type-submit-generate`, `agent-progress-theater`, `typewriter-reveal`.
- **Music:** minimal techno, 120-128 BPM.

### D2. Diagram in motion
- **Concept:** how it works, drawn live: architecture as a moving diagram.
- **Palette:** `ink` or `paper` base; boxes in `line`; wires in `primary`; packets in `secondary`.
- **Type:** mono labels, one display line per scene.
- **Layout:** nodes and wires on one large canvas (stations); zoom between levels of detail.
- **Camera:** spatial pans between stations; push into a node to reveal its internals (UI).
- **Signature move:** boxes draw on, then wires draw, then packets travel (`FX.alongPath`), then a latency or throughput counter ticks.
- **Transitions:** zoom-through into a node, `sdf-iris`.
- **HyperFrames:** Swiss Pulse · blueprints `spatial-pan-stations`, `constellation-hub` · rules `svg-path-draw`, `counting-dynamic-scale`.
- **Music:** precise electronic, 110-124 BPM.

### D3. Live data
- **Concept:** the product proves itself with numbers: dashboards, charts, metrics moving.
- **Palette:** `ink` or `paper`; charts in `primary` and `secondary`; one hero metric per frame.
- **Type:** huge tabular numbers (count-ups), small labels.
- **Layout:** real dashboard panels rebuilt from the UI; one chart at a time goes hero.
- **Camera:** pushes into the chart that matters; scrubs along a series.
- **Signature move:** a hero number counts up while the chart draws, then a readout follows the cursor along the line.
- **Transitions:** `transitions-push`, hard cuts on metric changes.
- **HyperFrames:** Swiss Pulse / Data Drift · blueprints `dataviz-countup`, `video-text-pivot` · rules `chart-scrub-readout`, `stat-bars-and-fills`.
- **Music:** driving electronic, 118-126 BPM.

---

## Never-the-same rules

- Pick **one** signature move and **2-3 transitions** per video, and use them consistently. More reads as a demo reel.
- Don't default to: dark background + gradient + tilted window + type cards. That is one possible combination, not the house style.
- Vary the opening: logo first, problem first, product first, number first, or question first.
- Vary the ending: logo lockup, live URL, a final product state, a customer quote, or a call to action.
- Within a family, the three looks must feel different; across the 3 pitches, use at least 2 different families.
