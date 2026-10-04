# saas-launch-video

An agent skill (Claude Code and compatible agents) for producing **SaaS product launch videos** in the modern "type cards + tilted product UI + animated gradient" style. It renders with [HyperFrames](https://hyperframes.heygen.com) (HTML → MP4) and Three.js.

The agent rebuilds your real product UI in HTML, films it with a moving 3D camera, and cuts it against bold type cards. It writes a music prompt that follows the cuts (you generate the tracks in ElevenLabs), mixes your candidate tracks onto the video so you can pick one, and delivers a loudness-normalised master plus an under-100 MB upload copy.

**New here? Read [GUIDE.md](GUIDE.md):** what to install, what to prepare, what to say to your agent and what you do at each step.

## What's inside

```
skills/saas-launch-video/
  SKILL.md                  entry point the agent reads
  references/               workflow, style system, config schema, image + music guides, gotchas
  template/                 HyperFrames project: config-driven cards, Three.js gradient plate,
                            example product scene, montage + pill-wall scene templates
  scripts/                  new-project, from-link (link mode), build, fetch-sfx, music-plan,
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
- Optional: Python with `pip install librosa` for music analysis
- Optional: the HyperFrames skills (`npx hyperframes init <dir>`) for the bundled sound-effect pack (`scripts/fetch-sfx.mjs`)

## Try the example

```bash
node skills/saas-launch-video/scripts/new-project.mjs ./demo
node skills/saas-launch-video/scripts/fetch-sfx.mjs ./demo
cd demo && npx hyperframes@0.8.115 render -q draft -o renders/demo.mp4
```

You get a 26 s film for a fictional invoicing app ("Lumen").

## The workflow

The skill pauses for you three times:
1. **Script:** the demo scenario, card copy, product shots and tagline.
2. **Images:** it hands you generation prompts and waits for the files.
3. **Music:** it writes a timestamped music prompt. You generate 2-4 takes in ElevenLabs (elevenlabs.io → Music) and send the MP3s, and it mixes each one onto the video for you to pick from.

## Licences

- Code: MIT (see LICENSE).
- Poppins font: SIL Open Font License (`template/assets/fonts/OFL-Poppins.txt`).
- Sound effects are **not** redistributed. `fetch-sfx.mjs` copies the Pixabay-licensed pack that ships with the HyperFrames skills into your project.
