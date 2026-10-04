# Rebuilding the real product UI

The product shots are the proof. Rebuild the real UI in HTML (crisp at any zoom, fully animatable), from the best source available.

## Sources (best first)
1. **Code**: copy layout, class values, labels, icons and copy strings from the real components. Match spacing and radius.
2. **Logged-in browser session**: the user signs in themselves in the agent's browser (never type their password); navigate and screenshot every state you need.
3. **Screen recording**: `ffmpeg -i rec.mp4 -vf fps=2 capture/rec/%04d.png`, then pick the frames for each state.
4. **Screenshots**: ask for exactly the states the approved script needs (empty, input, working, result, each edit, success, dashboard with demo data).

Only features that ship today. Demo data only: first names + initials, no emails or phones, plausible numbers.

## The rig

Start from `reference/ui-rig.html` (copied into every project). It is a working scene with:
- `#u-stage` (perspective) > `#u-tilt` (rotation about the frame centre) > `#u-move` (x/y/scale toward a target) > `#u-win` (the app window, 1600×940);
- `CAMERA = "flat" | "tilt" | "front"`, chosen by the direction (editorial: flat; bold: front, often with a thick outline; cinematic: freeze to PNG and use `lib/three-stage.js`);
- a measure phase, a `cam()` helper, prompt typing with a wrapping caret, a cursor glide + click, streaming text and a count-up.

Copy it to `compositions/<scene>.html`, rename every id (`u-` → your scene prefix) and the composition id, and replace the window contents with the real UI.

## Freezing UI for 3D or for image swaps

Render the scene, snapshot the states, crop the window:

```bash
npx hyperframes@0.8.115 snapshot --at 0.9,5.3 --no-end -o snapshots/ui
ffmpeg -i snapshots/ui/frame-00-at-0.9s.png -vf "crop=1440:846:240:117,scale=1600:940" -c:v libwebp assets/ui/home.webp
```

(The crop above is the window at camera scale 0.9; measure yours from the snapshot.) `three-stage.js` uses these as `screens` (device) or `panels`.

## Motion vocabulary inside the UI
- **Cursor** only to click; glide on a curve (`FX.glide`), click dip (`FX.click`).
- **Typing** 20-50 chars/s; long inputs must wrap (`.ch { white-space: pre-wrap }`).
- **AI output** streams (`FX.stream`) or builds in pieces; numbers count (`FX.countUp`).
- **State changes** are the story: before, action, after. Keep the camera on the element that changes.
- **Reset** scroll, camera presets and hidden states while something else covers the scene (a card or a transition), never on screen.
