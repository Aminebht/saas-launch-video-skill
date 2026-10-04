# Style system

## Two worlds

1. **Type cards.** Ink background (`brand.colors.ink`), white Poppins SemiBold, tracking −3 %, centred, sentence case. One idea per card, often one word. One keyword per card gets the gradient fill (`[brackets]` in the config).
2. **Product proof.** The real UI on the mesh gradient, tilted in 3D, never static.

## Type moves (cards)

| Move | Config | Use for |
| --- | --- | --- |
| T1 letter fade-on + tracking tighten + push-in | `logo-intro` | logo |
| T4 shrink-away with blur, next word slides in | `logo-intro.next` | "Brand **noun**" |
| T3 motion-blur whip (4 frames, directional blur) | `text.enter: whip-left/right` | big short claims ("**AI** writes it") |
| T2 typewriter with gradient caret | `text.enter: type` | the keyword of a claim ("Live in **one message**") |
| hard cut + slow push | `text.enter: cut` (default) | most cards |
| rise | `text.enter: rise` | gradient cards with a subline |
| T5 slot word swap every ~0.7 s | `tagline` | the end line |
| icon-chip tokens popping in | `tokens` | what the AI produces (copy / images / layout) |

Gradient shimmer (background-position drift) runs on every keyword automatically.

## Camera and UI moves (scenes)

- C1 floating window: 16 px radius, shadow `0 40px 80px rgba(0,0,0,.5)`.
- C2 tilt: perspective 1400 px, rotateX 8-15°, rotateY −10° to −20°. Wide shots get less tilt, close-ups more.
- C3 drift: the camera always moves (+6-10 % scale over a shot). If a shot feels long, add a move rather than cutting it.
- C4 punch-in: 2-3.5× toward the active element in 0.5-0.8 s, ease `cubic-bezier(0.16, 1, 0.3, 1)` (`FX.PUNCH`).
- C5 pull-back to reveal the result. C6 depth of field: a masked `backdrop-filter` on the far edge of close-ups only.
- C7 light leak: once, from the montage into the product (`leak` beat).
- Cursor: a pointing-hand cursor, about 64 px on screen. It appears only to click, glides on a curve (`FX.glide`), dips to 0.9 on click, and the button presses to 0.94.
- Typing: 20-27 chars/s in inputs (long prompts wrap), with a mention token in the brand accent.
- AI streaming text: 9-13 words/s, newest words lit in the accent and settling over 0.4 s (`FX.stream`).
- Lists and rows drop in one by one, with a thin gradient underline that draws left to right.

## Pacing

- Claim card (0.8-1.4 s) → UI proof (2-5 s) → claim card...
- About 22-25 beats in 50 s. Hard cuts. No crossfades except into the end card.
- Montage: 4 shots × 6 frames, the same product or URL in each.
- Cut on the music: whips and the montage on beats, the drop on the strongest visual (dashboard reveal, colour arc).

## Colour arc

The first ~75 % has ink cards and full gradient behind the UI. Then the gradient rises behind the cards from the bottom (plate `arc` segments with `rise: 1`), opens up fully for the pill wall, and warms up (`heat`) for the end card.

## Sound

Sound effects support the cut but never compete with the music. Use typing during typing, soft clicks on sends, a chime on success, impacts on the logo and the colour arc. Skip sparkle-type cues on edits (they read as cheesy). Keep SFX at about 0.7× under the music.
