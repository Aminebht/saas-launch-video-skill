# How to make a launch video with this skill

This guide is for someone who has never used the skill. It covers what to install, what to prepare, what to say to your AI agent, and what you do at each step.

You get a 30-60 second, 1920×1080 launch video for your software product, with music and sound effects. **There is no fixed template.** The agent acts as a creative director:

- It studies your product.
- It proposes three different creative directions, each with a rendered still frame.
- It builds the one you choose around your real product UI.

Two products, or even two runs for the same product, should give two different films.

---

## 1. Install (once)

| Tool | Why | How |
| --- | --- | --- |
| An AI coding agent that supports skills (e.g. Claude Code) | runs the whole process | see its docs |
| Node.js 18+ | scripts + renderer | nodejs.org |
| FFmpeg | rendering, mixing, compression | Windows `winget install ffmpeg` · Mac `brew install ffmpeg` · Linux `apt install ffmpeg` |
| Python 3 + librosa (optional) | analyses music tracks to line them up with the cuts | `pip install librosa` |

The renderer runs with `npx hyperframes@0.8.115` and downloads its own headless browser the first time.

**Add the skill to your agent** (Claude Code example):

```bash
git clone <this-repo-url> saas-launch-video-skill
# Mac / Linux
ln -s "$(pwd)/saas-launch-video-skill/skills/saas-launch-video" ~/.claude/skills/saas-launch-video
# Windows (PowerShell)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\saas-launch-video" -Target "$PWD\saas-launch-video-skill\skills\saas-launch-video"
```

**Install the HyperFrames skills** once: `npx hyperframes@0.8.115 init any-folder`. The director relies on their style library, animation blueprints and transition registry, and they also bring the free sound-effect pack. Then restart the agent.

---

## 2. What to prepare before you start

The more of this you have ready, the closer the first pitch will be.

### The easiest start: your website link

Paste your public website URL and the agent extracts the brand on its own (**link mode**):
- name, logo and icon, brand colours, fonts
- headings, feature copy, the share image, page screenshots

It writes the project's brand file and a `brand-kit.md` for you to check.

**What a link can't show is your app behind the login**: the screens where users actually do things. That's the heart of most directions, so the agent will also ask for those screens. Choose how you provide them:

| You provide | Result |
| --- | --- |
| Link only | brand and copy are right; product shots are limited to what your public site shows (the agent won't invent app screens) |
| Link + **screenshots** of the screens it lists (PNG, full window, 1440 px wide or more, demo data only) | good |
| Link + a **1-2 minute screen recording** walking through those screens | good (the agent pulls frames from it) |
| Link + you **log in** in the agent's browser; it then clicks through and screenshots each state itself | very good (you type your password; the agent never does) |
| **Source code** of the app (path on disk) | best: exact labels, colours and states |

You don't need the code. Link + screenshots is the realistic minimum for a strong result.

### Must have

- **A way to see your product UI**: one of the options in the table above.
- **The message.**
  - Who it's for.
  - The one-sentence promise (e.g. "invoices that get paid").
  - **3-5 features to show.** These must be live today, not planned.

### Nice to have

- **Logo files**, if your site's logo is hard to extract: the icon on its own (SVG or transparent PNG), plus full logos for dark and light backgrounds.
- **Brand colours and fonts**, if the website doesn't reflect them.
- **Taste hints**: videos or brands you admire, and anything you hate ("no 3D", "nothing dark", "make it playful"). They steer the pitch.
- **A demo scenario**: one concrete customer story ("a local garage builds its website", "a freelancer bills a client"). If you don't have one, the agent proposes it.
- **A reference video** you'd like yours to feel like (an MP4 file). The agent can replicate its style, structure and rhythm with your product; see **Replicating a video you like** below. If you only like its music, say so and it describes that style for your music prompt.
- **Language, length and format**, if not English, about 45 s and 16:9.

### Accounts you'll use yourself

- **An image generator** (any one you like), only if the chosen direction needs images. The agent writes the prompts; you generate the images.
- **ElevenLabs** (elevenlabs.io) for the music. The agent writes the prompt; you generate the tracks there. Check that your plan allows commercial use before you publish.

---

## 3. Start the session

Open your agent in a folder where the video project can live and say something like this.

**With a link** (simplest):

> Use the saas-launch-video skill to make a ~45 s launch video for **https://lumen.app**. Promise: "invoices that get paid". Show: AI drafting an invoice from one sentence, automatic reminders, the payments dashboard. I'll send screenshots of the app screens you need.

**With code** (most faithful):

> Use the saas-launch-video skill to make a ~45 s launch video for **Lumen**, an AI invoicing app for freelancers. The app's code is in `../lumen-app`. Promise: "invoices that get paid". Show: AI drafting an invoice from one sentence, automatic reminders, the payments dashboard. I like calm, premium, editorial videos, and no dark backgrounds.

**With a reference video** (replicate a style):

> Use the saas-launch-video skill to make a launch video for **https://lumen.app** in the style of `./reference.mp4`: same pacing and transitions, our product and story. Promise: "invoices that get paid".

The agent sets up the project and studies your product. With a link, it captures your site (1-3 minutes) and shows you the brand kit it found; fix anything it got wrong, such as the logo or a colour. Then it stops four times for you.

### Replicating a video you like

Send the video **file** (MP4, MOV or WebM). For a YouTube, LinkedIn or X link, download it first. Say how close you want to be:

| Fidelity | What you get |
| --- | --- |
| **Close remake** | same shot timing and structure, with your story and product in every slot |
| **Inspired** | same style, transitions and pacing; the structure fits your story |
| **Element** | only what you name: "the transitions", "the type", "the pacing" |

If you don't choose, the pitch shows you the options. Before pitching, the agent:
- finds every cut and transition, measures the shot lengths and checks whether the cuts land on the beat
- makes labelled contact sheets of every shot, studies fast transitions frame by frame, and reads the palette and the music
- writes `reference.md`, a breakdown with one row per shot and your product's equivalent in each slot

After the draft it compares your video with the reference shot by shot and fixes timing and look gaps.

**What it never copies:** the reference's footage, logos, brand names, slogans or music. It copies the *grammar* (rhythm, transitions, type, colour roles, camera) and redraws any third-party apps as neutral look-alikes in your colours. That keeps the result yours and safe to publish.

---

## 4. The four checkpoints (what you do)

### Checkpoint 1: pick a direction

The agent shows you **three directions**, labelled A, B and C. They always come from at least two different style families:

| Family | Feels like |
| --- | --- |
| Clean & editorial | Swiss grids, soft studio light, magazine layouts; calm and premium |
| Bold & graphic | poster type, colour blocks, kinetic collage, bento tiles; loud and fun |
| Cinematic 3D | your UI on a 3D device, a camera flying across a canvas of screens, a 3D object metaphor |
| Technical / dev | terminal stories, animated architecture diagrams, live data |

Each direction comes with:
- a one-line concept and a story shape (e.g. problem → shift → proof, before/after, speed run)
- palette, type and camera treatment
- the signature move and the transitions
- the music mood
- a **rendered still frame** in your brand, so you see it rather than imagine it. All three are also combined side by side in one image.

With a reference video, **A is the reference** at your chosen fidelity, and each still is shown next to the reference frame it answers.

**You:** pick one, or mix ("A's look with C's story"). You can also ask for three new ones. The agent writes your choice to `direction.md` and sticks to it.

### Checkpoint 2: the script

The agent shows you a beat table for the chosen direction:
- the time of each beat
- what is on screen and the copy
- what moves and how
- the transition into the next beat
- the sound

It also lists the exact product actions: what is typed, what is clicked, what changes.

**You:** approve it or edit it. Things to check:
- Every feature shown is real and live.
- The copy sounds like your brand.
- The demo customer makes sense for your market.

Changing things here is cheap; changing them after the build costs a re-render. Right after approval the agent lists the app screens it still needs (if you didn't give code).

### Checkpoint 3: the images (only if the direction needs them)

Many directions need none. If yours does (for example a customer portrait or your product's own output, such as generated pages or posts), the agent gives you a numbered list of image prompts. Each one has a **file name** and an **aspect ratio** (e.g. `hero.webp`, 4:5). They're written to come out without text or logos, because image models garble text; the agent adds labels in HTML.

**You:**
1. Generate each image with your image tool.
2. Keep the file names, or just send the files; the agent matches them by content and size.
3. Drop them in the chat or a folder and tell the agent where they are.

The agent then builds the video. It checks frames itself, fixes problems, and shows you snapshots or a draft.

### Checkpoint 4: the music

The agent gives you a **music prompt** with timestamps. It describes the style chosen for your direction, the tempo, and what happens at each cut (for example a quiet intro, the groove on the first product shot, a drop on the big moment, a clean ending).

**You:**
1. Open ElevenLabs → **Music** and paste the prompt (there's also a short version for small prompt boxes).
2. Optionally use **Video to Music**: upload the small copy of the video the agent made for you (under 100 MB) and paste the same prompt.
3. Generate **2-4 takes** and download them as MP3.
4. Send the files to the agent.

The agent analyses each take, places it so its biggest moment lands on the strongest shot, and gives you **one video per track** (same picture, different music, equal loudness). **You pick one.**

---

## 5. What you get

In `renders/` of the project:

| File | Use |
| --- | --- |
| `<name>-final.mp4` | full-quality master, 1080p, about −14 LUFS |
| `<name>-final-upload.mp4` | the same, under 100 MB, for social upload limits |

The project folder stays editable: one HTML file per scene in `compositions/`, and the brand in `brand.json`. To change something later, ask the agent ("change the headline in the second scene to …", "make the outro longer"). It edits the scene and re-renders. A full render takes a few minutes.

---

## 6. Rules the skill follows (so you're not surprised)

- **Only real features are shown.** If you ask for something that isn't live, it will push back. It never invents app screens; it asks for them.
- **No house style.** Every video gets its own concept, one signature move and 2-3 transitions, used consistently.
- **No third-party UI or logos.** Social posts, chats and so on are drawn as neutral look-alikes in your colours.
- **Readable text.** Every line stays on screen long enough to read.
- **The agent never generates images or music itself, and never asks for API keys.** You stay in control of the paid tools and their licences.

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| The video doesn't feel like my reference | name the shots or moments that are off ("the whip at 0:06 is too slow"); the agent compares them frame by frame |
| Cuts were missed in my reference | ask the agent to rerun the analysis with a higher sensitivity |
| The three directions feel too similar | say so; ask for wilder options or name a family you want ("one must be Bold & graphic") |
| "ffmpeg not found" | install FFmpeg (section 1) and restart the terminal |
| Render stuck at "waiting for timelines" | ask the agent to run `npx hyperframes@0.8.115 lint` and fix the errors |
| Text cut off or overlapping in a frame | tell the agent the timestamp ("at 0:23 the button text is clipped") |
| Music feels off-beat in places | ask the agent to move the cuts onto the track's beats |
| No sound effects | run `npx hyperframes@0.8.115 init any-folder` once, then ask the agent to fetch them again |
