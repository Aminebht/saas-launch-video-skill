# Workflow in detail

## 1. Learn the product

- With a codebase: find the main app shell (toolbar, sidebar), the screen where the "magic" happens (prompt box, editor, dashboard), success states (toasts, cards), and the theme tokens (colours, fonts, radius). Copy class values, labels and copy strings exactly. The video should look like the product, not like a generic SaaS.
- List the features that are live in production. Check the code (API tools, routes, feature flags) before claiming one. Unreleased branches don't count.
- **Link mode** (the user gives a URL): `node <skill>/scripts/from-link.mjs <url> <project>`. It runs `hyperframes capture` into `capture/` and writes brand roles, the mark, logo candidates, the font (from @fontsource when it is a Google Font), the share image and the montage text into the config, plus `brand-kit.md`.
  - Open the logo candidates and pick the one that reads on dark for `brand.logo`.
  - Check the colours against the site screenshots in `capture/screenshots/`.
  - Use `capture/extracted/visible-text.txt` and the headings for card copy and the feature list (confirm the features are live).
- **In-app screens** (always needed unless you have the code): after the script is approved, ask for exactly the screens it uses (the list at the end of `brand-kit.md`). Accept screenshots, a screen recording (`ffmpeg -i rec.mp4 -vf fps=2 capture/rec/%04d.png`, then pick frames), or a browser session the user logs into themselves. Never type their password.
- Without code or link: ask for 3-6 screenshots of the key screens, plus the logo (SVG or large PNG) and brand colours.

## 2. Script (checkpoint)

Present this as a short table and wait for approval or edits:

1. **Demo scenario.** One concrete customer (a local garage, an agency, a clinic...). Concrete beats generic. Local or small businesses read well.
2. **Beat sheet.** Time, beat type, copy, motion. A good 50 s shape:

| Time | Beat |
| --- | --- |
| 0-2.5 | logo intro, logo shrinks and the product noun slides in ("Brand **pages**") |
| 2.5-4.3 | promise card + the keyword alone as a hero card |
| 4.3-6.4 | montage: where the output shows up (URL typed, 4 social shots, 6 frames each) + light leak |
| 6.4-11 | product: wide shot, punch into the input, type the first prompt, click |
| 11-13.6 | "**AI** writes it" (whip) + token chips (what it generates) |
| 13.6-17.5 | the result builds itself (streaming text, images blur in, camera dollies) |
| 17.5-34 | claim card → 3-5 short edits, each in the product's own interaction model (chat edits, settings, integrations, publish) |
| 34-41 | outcome card + the place results land (dashboard, inbox, analytics) |
| 41-46 | gradient card (tech claim) + feature pill wall |
| 46-53 | tagline with a slot word swapping through customer types, then the logo lockup and fade |

3. **Each product shot.** The exact text typed, what is clicked, and what changes on screen.
4. **Pill labels** (only live features) and **tagline** (benefit + slot words, for example "More customers for your [garage/clinic/law firm/business]").

Ask before showing third-party UI. Use stylised look-alikes with no real logos by default.

## 3. Images (checkpoint)

See IMAGES.md. Hand over all prompts in one message, with the target file names, and wait.

## 4. Build loop

```bash
node <skill>/scripts/build.mjs .          # after every video.config.json change
npx hyperframes@0.8.115 lint              # must be 0 errors
npx hyperframes@0.8.115 snapshot --at 1.2,3,5.5,...   # midpoint of every beat
```

- Product scenes: copy `compositions/app.html` per scene, rebuild the real UI inside `#a-win`, and add a `scene` beat for each.
- Cards can sit over a running scene (higher z-index). The scene keeps its state across the cut, so do resets (scroll, camera preset) while a card covers it.
- Read the contact sheets yourself. Fix clipped text, empty frames, wrong framing and overlap before showing anything.
- A draft render (`-q draft`) takes about 1 min per 30 s. Use it to check motion.

## 5. Music (checkpoint): see MUSIC.md

## 6. Deliver

1. `audio.music = { "src": "assets/music/track.mp3", "start": <offset>, "duration": <video - offset>, "volume": 0.9 }`. Pre-trim and fade the track with ffmpeg if needed (fade in 0.12 s, fade out over the last 1.4 s).
2. Multiply every SFX `volume` by about 0.7 so they sit under the music. Drop SFX that fight the track's own hits.
3. `npx hyperframes@0.8.115 render -q delivery --video-bitrate 16M -o renders/<name>-raw.mp4`
4. `node <skill>/scripts/finalize.mjs renders/<name>-raw.mp4` produces `-final.mp4` (−14 LUFS) and `-final-upload.mp4` (< 100 MB).
