# How to make a launch video with this skill

This guide is for someone who has never used the skill. It covers what to install, what to prepare, what to say to your AI agent, and what you do at each step.

You get a 30-60 second, 1920×1080 launch video for your software product: bold type cards cut against your real product UI, which floats in 3D on an animated gradient and is filmed by a camera that never stops moving. Music and sound effects are included.

---

## 1. Install (once)

| Tool | Why | How |
| --- | --- | --- |
| An AI coding agent that supports skills (e.g. Claude Code) | runs the whole process | see its docs |
| Node.js 18+ | build scripts + renderer | nodejs.org |
| FFmpeg | rendering, mixing, compression | Windows `winget install ffmpeg` · Mac `brew install ffmpeg` · Linux `apt install ffmpeg` |
| Python 3 + librosa (optional) | analyses music tracks to line them up with the cuts | `pip install librosa` |

The renderer runs with `npx hyperframes@0.8.115` and downloads its own headless browser the first time. Nothing else to install.

**Add the skill to your agent** (Claude Code example):

```bash
git clone <this-repo-url> saas-launch-video-skill
# Mac / Linux
ln -s "$(pwd)/saas-launch-video-skill/skills/saas-launch-video" ~/.claude/skills/saas-launch-video
# Windows (PowerShell)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\saas-launch-video" -Target "$PWD\saas-launch-video-skill\skills\saas-launch-video"
```

Restart the agent. **Optional sound effects:** run `npx hyperframes init any-folder` once. This installs a free effects pack that the skill copies into your project.

---

## 2. What to prepare before you start

The more of this you have ready, the closer the first draft will be.

### The easiest start: your website link

Paste your public website URL and the agent extracts the brand on its own (**link mode**):
- name, logo and icon, brand colours, font
- headings, feature copy, the share image, page screenshots

It pre-fills the video's settings and writes a `brand-kit.md` for you to check.

**What a link can't show is your app behind the login**: the screens where users actually do things. That's the heart of the video, so the agent will also ask for those screens. Choose how you provide them:

| You provide | Result |
| --- | --- |
| Link only | brand, cards and montage are right; product shots are limited to what your public site shows (the agent won't invent app screens) |
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

- **Logo files**, if your site's logo is hard to extract: the icon on its own (SVG or transparent PNG) and a full logo that reads on a dark background.
- **Brand colours and font**, if the website doesn't reflect them (the default font is Poppins).
- **A demo scenario**: one concrete customer story ("a local garage builds its website", "a freelancer bills a client"). If you don't have one, the agent proposes it.
- **A reference video** whose pacing or music you like (an MP4). The agent measures its tempo and structure, and describes that style for your music.
- **Tagline idea**: a benefit plus the customer types to cycle through ("More customers for your garage / clinic / business").
- **Language and length**, if not English and about 50 s.

### Accounts you'll use yourself

- **An image generator** (any one you like). The agent writes the prompts; you generate the images.
- **ElevenLabs** (elevenlabs.io) for the music. The agent writes the prompt; you generate the tracks there. Check that your plan allows commercial use before you publish.

---

## 3. Start the session

Open your agent in a folder where the video project can live and say something like this.

**With a link** (simplest):

> Use the saas-launch-video skill to make a ~50 s launch video for **https://lumen.app**. Promise: "invoices that get paid". Show: AI drafting an invoice from one sentence, automatic reminders, the payments dashboard. I'll send screenshots of the app screens you need.

**With code** (most faithful):

> Use the saas-launch-video skill to make a ~50 s launch video for **Lumen**, an AI invoicing app for freelancers. The app's code is in `../lumen-app`. Logo files are in `./brand/`. Promise: "invoices that get paid". Show: AI drafting an invoice from one sentence, automatic reminders, the payments dashboard. Here's a reference video I like: `./reference.mp4`.

The agent scaffolds the project and studies your product. With a link, it captures your site (1-3 minutes) and shows you the brand kit it found; fix anything it got wrong, such as the logo or a colour. Then it stops three times for you. Right after you approve the script, it lists the exact app screens it needs (if you didn't give code).

---

## 4. The three checkpoints (what you do)

### Checkpoint 1: the script

The agent shows you a table with:
- the demo scenario
- every card's text and timing
- what happens in each product shot (what is typed, what is clicked, what changes)
- the feature pills (the wall of feature names near the end)
- the tagline

**You:** approve it or edit it. Things to check:
- Every feature shown is real and live.
- The copy sounds like your brand.
- The demo customer makes sense for your market.

Changing things here is cheap; changing them after the build costs a re-render.

### Checkpoint 2: the images

The agent gives you a numbered list of image prompts, each with a **file name** and an **aspect ratio** (e.g. `hero.webp`, 4:5). They're written to come out without text or logos, because image models garble text; the agent adds labels in HTML.

**You:**
1. Generate each image with your image tool.
2. Keep the file names, or just send the files; the agent matches them by content and size.
3. Drop them in the chat or a folder and tell the agent where they are.

The agent then builds the video, checks frames itself and fixes problems, and shows you snapshots or a draft.

### Checkpoint 3: the music

The agent gives you a **music prompt** with timestamps. It describes the style, the tempo, and what happens at each cut (quiet intro, groove on the first product shot, a drop on the big moment, a clean ending).

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

The project folder stays editable. To change copy later, ask the agent ("change the second card to …"). It edits `video.config.json`, rebuilds and re-renders. A full render takes about 2-4 minutes.

---

## 6. Rules the skill follows (so you're not surprised)

- **Only real features are shown.** If you ask for something that isn't live, it will push back.
- **No third-party UI or logos.** Social posts, chats and so on are drawn as neutral look-alikes in your colours.
- **One highlighted (gradient) word per card**, and each card stays on screen long enough to read.
- **The agent never generates images or music itself, and never asks for API keys.** You stay in control of the paid tools and their licences.

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| "ffmpeg not found" | install FFmpeg (section 1) and restart the terminal |
| Render stuck at "waiting for timelines" | ask the agent to run `npx hyperframes@0.8.115 lint` and fix the errors |
| Text cut off or overlapping in a frame | tell the agent the timestamp ("at 0:23 the button text is clipped") |
| Music feels off-beat in places | ask the agent to move the cuts onto the track's beats |
| No sound effects | run `npx hyperframes init any-folder` once, then ask the agent to fetch them again |
