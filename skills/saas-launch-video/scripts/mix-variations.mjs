#!/usr/bin/env node
// Mix several candidate tracks under the same render so the user can pick one.
// The picture is copied untouched; only the audio changes. The render's own audio (SFX)
// stays on top at --sfx-gain; each mix is normalised to -14 LUFS (two-pass, peak-limited).
//
//   node mix-variations.mjs <render.mp4> <out-dir> <track.mp3@offset> [<track.mp3@offset> ...]
//        [--sfx-gain 0.7] [--music-gain 0.9] [--fade-out 1.4]
//
// offset = video time (s) where the track starts (from analyze-track.py --drop).
// Outputs <out-dir>/<render-name>-A.mp4, -B.mp4, ...
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { FFPROBE, requireFfmpeg, duration, loudnormFilter, loudness, run } from "./_media.mjs";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  const v = Number(argv[i + 1]);
  argv.splice(i, 2);
  return v;
};
const sfxGain = opt("--sfx-gain", 0.7);
const musicGain = opt("--music-gain", 0.9);
const fadeOut = opt("--fade-out", 1.4);
const [video, outDir, ...tracks] = argv;
if (!video || !outDir || tracks.length === 0) {
  console.error("usage: node mix-variations.mjs <render.mp4> <out-dir> <track.mp3@offset> [...]");
  process.exit(1);
}
requireFfmpeg();
fs.mkdirSync(outDir, { recursive: true });
const dur = duration(video);
const hasAudio = spawnSync(FFPROBE, ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout.trim() !== "";
const base = path.basename(video, path.extname(video));

tracks.forEach((spec, i) => {
  const at = spec.lastIndexOf("@");
  const file = at > -1 ? spec.slice(0, at) : spec;
  const offset = at > -1 ? Number(spec.slice(at + 1)) : 0;
  const ms = Math.round(Math.max(0, offset) * 1000);
  const trimHead = offset < 0 ? `atrim=start=${-offset},asetpts=PTS-STARTPTS,` : "";
  const music = `[1:a]${trimHead}aresample=48000,afade=t=in:d=0.12,adelay=${ms}|${ms},atrim=0:${dur},afade=t=out:st=${Math.max(0, dur - fadeOut)}:d=${fadeOut},volume=${musicGain}[m]`;
  const sfx = hasAudio ? `[0:a]aresample=48000,volume=${sfxGain}[s];[m][s]amix=inputs=2:normalize=0:duration=first` : `[m]anull`;
  const pre = `${music};${sfx}`;
  const ln = loudnormFilter([video, file], pre);
  const letter = String.fromCharCode(65 + i);
  const out = path.join(outDir, `${base}-${letter}.mp4`);
  run(["-i", video, "-i", file, "-filter_complex", `${pre},${ln}[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", String(dur), "-movflags", "+faststart", out]);
  const l = loudness(out);
  console.log(`${letter}: ${path.basename(file)} @ ${offset}s -> ${out}  (${l.lufs} LUFS, peak ${l.peak} dBFS)`);
});
