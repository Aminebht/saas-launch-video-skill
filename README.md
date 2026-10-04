# saas-launch-video

An agent skill (Claude Code and compatible agents) that acts as a **creative director for SaaS product launch videos**. It renders with [HyperFrames](https://hyperframes.heygen.com) (HTML → MP4) and Three.js.

It is a director plus a toolkit, not a template, so no two videos come out the same:

- **Three directions, your pick.** The agent studies your product and pitches three creative directions. Each has its own concept, story shape, look, signature move and transitions, and comes with a rendered still frame. You pick one or mix them.
- **Twelve looks to draw from**, in four families:
  - clean and editorial
  - bold and graphic
  - cinematic 3D
  - technical / dev
- **Or replicate a video you like.** Send a reference video and the agent copies its grammar (structure, shot rhythm, transitions, type, colour roles, music energy) with your product. It never copies the reference's footage, logos or copy. It finds every cut, makes contact sheets, writes a shot-by-shot breakdown, and checks the draft against the reference.
- **Your real product.** The agent rebuilds your actual UI in HTML and animates it: typing, clicks, streaming results. It can also put the UI on a Three.js device or floating panels.
- **Music and delivery.** It writes a music prompt that follows the cuts; you generate the tracks in ElevenLabs. It then mixes your candidate tracks onto the video so you can choose, and delivers a loudness-normalised master plus an upload copy under 100 MB.

**New here? Read [GUIDE.md](GUIDE.md):** what to install, what to prepare, what to say to your agent and what you do at each step.

## What's inside

```
skills/saas-launch-video/
  SKILL.md          entry point the agent reads
  references/       DIRECTIONS (4 families x 3 looks), NARRATIVES (story shapes), PITCH,
                    REFERENCE (replicate a video), UI-REBUILD, BRAND, WORKFLOW, IMAGES, MUSIC, GOTCHAS
  toolkit/          fx.js (motion helpers), three-stage.js (3D device/panel stage),
                    ui-rig.html (UI-rebuild rig), skeleton/ (empty project root)
  examples/         one technique demo per family (study, never copy)
  scripts/          new-project, from-link (link mode), analyze-reference (reference mode),
                    brand, fetch-sfx, music-plan,
                    analyze-track.py, mix-variations, finalize
```

## Install

Copy or symlink `skills/saas-launch-video` into your agent's skills folder:

```bash
# Claude Code (user-level)
cp -r skills/saas-launch-video ~/.claude/skills/
# or keep it updatable with git pull:
ln -s "$(pwd)/skills/saas-launch-video" ~/.claude/skills/saas-launch-video
```

Then ask your agent: *"Make a launch video for our product"*.

## Requirements

- Node 18+, FFmpeg on PATH
- `npx hyperframes@0.8.115` (downloads Chrome on first run)
- The HyperFrames skills: run `npx hyperframes@0.8.115 init <any-folder>` once, and refresh them later with `npx hyperframes@0.8.115 skills update`. They hold the style, animation and registry guides the director builds on, plus the sound-effect pack.
- Optional: Python with `pip install librosa` for music analysis

## See the toolkit in motion

```bash
node skills/saas-launch-video/scripts/new-project.mjs ./demo --examples
cd demo && npx hyperframes@0.8.115 render -q draft -o renders/examples.mp4
```

You get about 30 s of technique demos for a fictional invoicing app: the UI-rebuild rig, then one demo per family. They show what the toolkit can do; real videos are built fresh for each product.

## The workflow

The skill pauses for you four times:

1. **Pitch:** three directions with still frames (with a reference video, the first one is the reference). You pick or mix.
2. **Script:** a beat table for the chosen direction (scenes, copy, motion, transitions, sound). It then lists the in-app screens it needs.
3. **Images** (only if the direction needs any): it hands you generation prompts and waits for the files.
4. **Music:** it writes a timestamped music prompt. You generate 2-4 takes in ElevenLabs (elevenlabs.io → Music) and send the MP3s. It mixes each one onto the video for you to pick from.

## Licences

- Code: MIT (see LICENSE).
- Fonts are installed per project from [Fontsource](https://fontsource.org) with their own licence files (mostly SIL OFL).
- Sound effects are **not** redistributed. `fetch-sfx.mjs` copies the Pixabay-licensed pack that ships with the HyperFrames skills into your project.
