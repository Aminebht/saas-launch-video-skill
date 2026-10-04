# Pitch: 3 directions (checkpoint)

Before any script or build, pitch three clearly different directions and let the user pick (or mix).

## Rules for the three

- Use **at least 2 different families** (DIRECTIONS.md) across the three.
- The three must also differ in **narrative** (NARRATIVES.md) or **signature move**: no two pitches with the same structure and the same look.
- One **safe** (closest to the brand's existing site and tone), one **bold** (a stretch that could stand out), one **wild card** (the most unexpected fit for this product).
- Each must be buildable with what exists: the real UI, the brand kit, and images the user can generate. No stock footage, no invented features.
- If an earlier video exists in this workspace (look for other projects with a `direction.md`), don't pitch its look and narrative again.

**With a reference video** (REFERENCE.md): A is the reference at the asked fidelity, B and C follow REFERENCE.md §3, and the family rule above applies only to C.

## Each pitch card

```
### A: <evocative name>           (safe / bold / wild card)
Look: <family + look, e.g. B1 Poster blocks>   Narrative: <e.g. Feature cascade>
Concept: one sentence, the idea a viewer remembers.
Beats: 5-7 lines, timecoded, what is on screen.
Palette & type: how the brand variables are deployed (e.g. "paper background, ink type, primary accents only").
Signature move: the one move people will remember.
Transitions: 2-3 names (registry or hand-built).
Music: genre + BPM range + where the drop lands.
Why it fits <product>: one line. Risk: one line.
```

## Still frames (one per direction)

Show, don't describe. For each direction build **one key frame**: the most characteristic moment, with the real brand and an approximation of the real UI.

```bash
# from the project folder
mkdir -p pitch/A pitch/B pitch/C
# each pitch/<X>/ is a tiny HyperFrames project: copy index.html + lib/ + assets/ (brand already injected),
# add compositions/frame.html (one static-ish scene), mount it at 0 s with a 2 s duration
cd pitch/A && npx hyperframes@0.8.115 snapshot --at 1.5 --no-end -o snapshots
# side-by-side sheet to show the user
ffmpeg -i pitch/A/snapshots/frame-00-at-1.5s.png -i pitch/B/snapshots/frame-00-at-1.5s.png -i pitch/C/snapshots/frame-00-at-1.5s.png -filter_complex "[0][1][2]hstack=3,scale=2880:-1" pitch/directions.png
```

Keep frames rough but honest: real colours and fonts, the real logo, a recognisable product shape. 15-30 minutes total, not a full build.

## Presenting

Show `pitch/directions.png` plus the three cards. Ask: "Which one, or which parts of each?". Then write the choice to `direction.md` (look, narrative, signature move, transitions, music, plus anything the user mixed in). Every later step reads `direction.md`.
