#!/usr/bin/env node
// Deliverables from a finished render: loudness-normalised master + an upload copy under a size cap.
//
//   node finalize.mjs <render.mp4> [--max-mb 100] [--lufs -14]
//
// Writes <name>-final.mp4 (video copied, audio two-pass normalised) and, when the master is
// over the cap, <name>-final-upload.mp4 (two-pass x264 sized to ~93% of the cap).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { requireFfmpeg, duration, loudnormFilter, loudness, run } from "./_media.mjs";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : Number(argv[i + 1]);
};
const src = argv[0];
if (!src || !fs.existsSync(src)) {
  console.error("usage: node finalize.mjs <render.mp4> [--max-mb 100] [--lufs -14]");
  process.exit(1);
}
requireFfmpeg();
const maxMb = opt("--max-mb", 100);
const lufs = opt("--lufs", -14);
const dir = path.dirname(src);
const base = path.basename(src, path.extname(src)).replace(/-raw$/, "");
const master = path.join(dir, `${base}-final.mp4`);

const ln = loudnormFilter([src], null, { I: lufs, TP: -1.0, LRA: 11 });
run(["-i", src, "-af", ln, "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", master]);
const mb = (f) => fs.statSync(f).size / 1048576;
let l = loudness(master);
console.log(`master: ${master}  ${mb(master).toFixed(1)} MB  ${l.lufs} LUFS  peak ${l.peak} dBFS`);
if (l.lufs < lufs - 1) console.log("  note: below target because true-peak limiting won; that's expected for dynamic mixes");

if (mb(master) > maxMb) {
  const dur = duration(master);
  const audioK = 192;
  const videoK = Math.floor((maxMb * 0.93 * 8 * 1024) / dur - audioK);
  const upload = path.join(dir, `${base}-final-upload.mp4`);
  const log = path.join(os.tmpdir(), `x264-${process.pid}`);
  run(["-i", master, "-c:v", "libx264", "-preset", "slow", "-b:v", `${videoK}k`, "-pass", "1", "-passlogfile", log, "-an", "-f", "mp4", os.platform() === "win32" ? "NUL" : "/dev/null"]);
  run(["-i", master, "-c:v", "libx264", "-preset", "slow", "-b:v", `${videoK}k`, "-maxrate", `${Math.round(videoK * 1.3)}k`, "-bufsize", `${videoK * 2}k`, "-pass", "2", "-passlogfile", log, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", `${audioK}k`, "-movflags", "+faststart", upload]);
  for (const f of fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(path.basename(log)))) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
  console.log(`upload: ${upload}  ${mb(upload).toFixed(1)} MB  (${videoK} kbps video)`);
}
