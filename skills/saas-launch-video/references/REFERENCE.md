# Reference mode: replicate a video the user likes

Use this when the user sends a video and says "like this", "replicate this", or "same style". The goal is to rebuild the reference's **grammar** with the user's product:
- its structure and rhythm
- its transitions and camera language
- its type treatment, palette roles and texture
- its music energy

## What we copy and what we never copy

| Copy (grammar) | Never copy (content) |
| --- | --- |
| structure, beat order, shot lengths, cut-to-beat rhythm | its footage or frames, screenshots, images |
| transition types and how they move | logos, brand names, mascots, product names |
| camera moves (push-ins, tilts, macro crops, whips) | its exact copy lines and slogans |
| type treatment (category, weight, case, how words enter) | its music (describe the style; never ask for the same song) |
| colour **roles** (dark ground, one hot accent, gradient field) | its exact hexes (map the roles onto the brand) |
| texture (grain, glow, blur, chromatic edges) | a look-alike of a competitor's ad close enough to confuse viewers |

Third-party UI in the reference (search engines, chat apps, social posts, OS chrome) becomes a **neutral look-alike in the brand colours**, as everywhere in this skill.

## Getting the file

- Ask for the video file (MP4, MOV or WebM). For a link (YouTube, LinkedIn, X), ask the user to download it. If `yt-dlp` is installed and the user agrees, you may fetch it for analysis only.
- Ask which **fidelity** they want. If they don't say, pitch all three:
  - **Close remake:** same shot timing and structure, our story and product in every slot.
  - **Inspired:** same style, transitions and pacing, with a structure fitted to our story.
  - **Element:** only the parts they name ("the transitions", "the type", "the pacing").

## 1. Analyse

```bash
node <skill>/scripts/analyze-reference.mjs reference.mp4 <project>
```

This writes `ref/analysis.md`, `shots.json`, labelled contact sheets (`ref/sheets/`, one row per shot: start / middle / end frame), `palette.png` and `music.txt` (needs librosa).

- **Read every sheet.** The numbers find the cuts; only your eyes find the look.
- **Zoom** into every `soft` boundary, every shot under 0.7 s and every shot with hits. That's where the transitions and fast montages live:

  ```bash
  node <skill>/scripts/analyze-reference.mjs reference.mp4 <project> --zoom 5.2-6.1,24.6-25.4
  ```

  Each span gives 12 frames in `ref/zoom/`. Read them in order to see exactly how a whip, wipe, zoom or morph moves.
- **If cuts are missing** (a busy edit with similar shots), rerun with `--sensitivity 1.5`. If a camera move was split into many shots, use `0.7`.
- **The detector is approximate.** A `soft` boundary can be a fast camera move between two holds, and a long shot with hits can be a word-swap sequence. Trust the frames over the table.

## 2. Write `reference.md` (the breakdown)

Write this in the project before pitching. Every later step reads it.

```markdown
# Reference breakdown: <file>
Summary: <format>, <length>, <n> shots, median <x> s, ~<bpm> BPM, <cuts on beat?>, <overall look in one line>

## Grammar
- Structure: acts with times (e.g. 0-4 hook on black, 4-11 problem in macro UI, 11-25 product demo, ...); nearest shape in NARRATIVES.md
- Pacing: where it is fast or slow, how long holds last, what lands on the drop
- Type: category (geometric sans / grotesk / serif / mono), weight, case, size vs frame, placement, how words enter (fade, blur-in, scale, typewriter, word swap), highlight treatment
- Camera: 3D tilt? push-ins? macro crops of UI? depth of field? constant drift?
- UI treatment: dark or light, scale, crops, cursor or hand, typing, how results appear
- Transitions: each type, how many, an example (e.g. "whip pan with motion blur, S04→S05, 0.2 s")
- Colour roles: ground, text, accent, gradients and where they appear
- Texture: grain, glow, chromatic aberration, scanlines, blur
- Sound: genre, BPM, energy curve, SFX on cuts?
- Signature moves (1-3): the things people remember

## Shot list
| # | time | len | on screen | role in story | motion / camera | transition out | our version |

## Not copying
Logos, names, copy and footage seen in the reference, listed explicitly.
```

Fill the **our version** column with the product's equivalent for each slot (their problem → our problem, their UI moment → our UI moment). Only real features count; if a slot has no honest equivalent, merge or replace it and say so.

## 3. Pitch (checkpoint), as PITCH.md, with these changes

- **Direction A is the reference** at the fidelity the user asked for. B and C are either the other fidelity levels, or (if the user asked for close only) B = inspired and C = a contrasting direction from DIRECTIONS.md, so they can see an alternative.
- **Show each still frame next to the reference frame it answers:**

  ```bash
  ffmpeg -i ref/frames/s05-b.jpg -i pitch/A/snapshots/<frame>.png -filter_complex "[0]scale=-2:540[a];[1]scale=-2:540[b];[a][b]hstack" pitch/A-vs-ref.png
  ```
- `direction.md` records the fidelity level and links `reference.md`.

## 4. Script (checkpoint)

- **Close remake:** the beat table **is** the shot list, using the reference's times and the "our version" column.
- **Total length:** keep the reference's length unless the user asks otherwise. If the story needs more or fewer beats, add or remove whole bars at the reference tempo (60/BPM × 4 per bar), so the rhythm survives.
- **Vertical reference, horizontal target (or the reverse):** re-frame each shot for the target format; never crop.

## 5. Build and verify against the reference

- Build each transition from its zoom frames: registry first (`catalog`), hand-built when nothing matches.
- Match the type treatment with the brand fonts. If the brand font is far from the reference's category (serif vs geometric sans), say so at the pitch and suggest a matching secondary display font.
- After a draft render, compare:

  ```bash
  node <skill>/scripts/analyze-reference.mjs reference.mp4 <project> --compare renders/draft.mp4
  ```

  `ref/compare/compare.md` lists each reference boundary with the render's nearest boundary and the delta. `compare-*.png` pairs the reference and render frames at each reference shot.
- **Close remakes:** keep the deltas within ±0.1 s, especially for cuts on the beat. Fix the look where the frame pairs disagree in layout weight, scale, colour role or texture.

## 6. Music

`ref/music.txt` already profiles the reference audio: tempo, key, loudness strip, rises and the ending. Build `music-plan.json` from it (MUSIC.md):
- same BPM and energy curve
- a drop where the reference has it
- the same ending style

Describe the style; never ask for the same song. ElevenLabs Video to Music with our draft is a good second option.
