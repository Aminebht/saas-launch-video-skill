#!/usr/bin/env node
// Turn video.config.json "musicPlan" into a music prompt the user pastes into ElevenLabs
// (elevenlabs.io → Music, or Video to Music with an upload copy of the render).
// Section times come from the cut points, so the musical changes land on the cuts.
//
//   node music-plan.mjs <project-dir>
//
// Writes assets/music/music-prompt.txt (full prompt with timestamps) and prints it, plus a
// short version for tools with a small prompt box. The user generates the tracks themselves.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || ".");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "video.config.json"), "utf8"));
const plan = cfg.musicPlan;
if (!plan?.sections?.length) {
  console.error('video.config.json has no "musicPlan.sections"; see references/MUSIC.md');
  process.exit(1);
}
const secs = [...plan.sections].sort((a, b) => a.start - b.start);
if (secs[0].start !== 0) {
  console.error("musicPlan: the first section must start at 0");
  process.exit(1);
}

const ts = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}${t % 1 ? String((t % 1).toFixed(1)).slice(1) : ""}`;
const head = `Instrumental ${[plan.genre, plan.bpm && `${plan.bpm} BPM`, plan.key && `key of ${plan.key}`, ...(plan.styles || [])].filter(Boolean).join(", ")}, no vocals, about ${Math.round(cfg.duration)} seconds long.`;
const avoid = `Avoid: ${["vocals", "lyrics", ...(plan.negative || [])].join(", ")}.`;
const body = secs.map((s, i) => {
  const end = i + 1 < secs.length ? secs[i + 1].start : cfg.duration;
  return `${ts(s.start)} to ${ts(end)}: ${[...(s.styles || []), ...(s.cues || [])].join(", ")}.`;
});
const full = [head, ...body, avoid].join("\n");
const short = [head, avoid].join("\n");

const outDir = path.join(dir, "assets", "music");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "music-prompt.txt"), full + "\n\n--- short version ---\n" + short + "\n");

console.log("Music prompt (saved to assets/music/music-prompt.txt):\n\n" + full);
console.log("\nShort version (for a small prompt box):\n\n" + short);
console.log(`
Next, for the user: generate 2-4 takes in ElevenLabs (elevenlabs.io → Music, or Video to Music
with an upload copy of the render under 100 MB), download them as MP3 into assets/music/, then
run analyze-track.py + mix-variations.mjs to compare them on the video.`);
