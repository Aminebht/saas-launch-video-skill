# Music (checkpoint)

The music should follow the cut and the chosen direction: its genre and energy come from `direction.md`, its sections from the beat table (for example a quiet hook, the groove landing on the first product shot, a breakdown before the payoff, the drop on the strongest visual, a clean ending on the outro).

You don't generate the music. You write the prompt; the user generates the tracks in **ElevenLabs** (elevenlabs.io → Music) and sends you the files.

## 1. Prompt

Write `music-plan.json` in the project from the approved beat table. Each section starts on a cut (`duration` defaults to the root `data-duration`):

```json
{ "genre": "melodic tech house", "bpm": 123, "key": "E minor", "duration": 45,
  "styles": ["polished", "deep warm sub-bass"], "negative": ["dubstep wobble", "fade-out ending"],
  "sections": [ { "name": "Intro", "start": 0, "styles": ["airy", "no bass"], "cues": ["deep hit on the logo"] }, ... ] }
```

`node <skill>/scripts/music-plan.mjs <project>` prints the prompt and saves it to `assets/music/music-prompt.txt`. It writes a full version with timestamps and a short version for small prompt boxes.

If the project has a reference video (REFERENCE.md), `ref/music.txt` already holds this profile. For a reference **track** or a video given only for its music, profile it first and describe that instead:

```bash
python <skill>/scripts/analyze-track.py reference.mp4 --detail
```

Read off the tempo, key, where the bass enters, breakdowns, the drop, a full stop and the ending style. Build `music-plan.json` from those facts. Ask for the same style, never the same song.

## 2. Hand-off (tell the user exactly this)

1. Open ElevenLabs → **Music**, paste the prompt, and generate 2-4 takes. For **Video to Music**, upload an SFX-only render (make a copy under 100 MB with `finalize.mjs --max-mb 95`) and paste the same prompt as the description.
2. Download each take as MP3 and send the files (any folder; you'll move them to `assets/music/`).
3. Check their plan allows commercial use before publishing.

Wait for the files. Don't call any music API and don't ask for API keys.

## 3. Candidates → variations

```bash
python <skill>/scripts/analyze-track.py take-1.mp3 take-2.mp3 --drop 35.9   # suggested start offsets
npx hyperframes@0.8.115 render -q draft -o renders/sfx-only.mp4             # before mounting any music
node <skill>/scripts/mix-variations.mjs renders/sfx-only.mp4 renders/music-variations take-1.mp3@3.4 take-2.mp3@0
```

- Put each track's biggest rise on the strongest visual (`--drop`). A track that starts at full energy can enter on a hard cut. A track with no drop can align its fade-out with the video's end.
- Every mix is normalised to −14 LUFS, so the comparison is fair. Present a table: letter, file, character, placement. Let the user pick.

## 4. Final

Trim and fade the chosen take, mount it in `index.html` as `<audio id="music" src="assets/music/track.mp3" data-start="<offset>" data-duration="<length>" data-track-index="20" data-volume="0.9">`, scale the SFX volumes by 0.7, render, then `finalize.mjs`.
