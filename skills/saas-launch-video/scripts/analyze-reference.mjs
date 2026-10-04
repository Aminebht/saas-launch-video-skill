#!/usr/bin/env node
// Break a reference video down so it can be replicated in style, structure and rhythm.
//
//   node analyze-reference.mjs <reference.mp4> <project> [--sensitivity 1] [--compare <render.mp4>]
//   node analyze-reference.mjs <reference.mp4> <project> --zoom 5.2-6.1[,24.6-25.4]
//
// Writes <project>/ref/:
//   analysis.md     facts: format, pace, shot table (time, length, beats, motion, background), palette, music
//   shots.json      the same as data
//   sheets/*.png    contact sheets: one row per shot (start / middle / end frame), labelled S01, S02, ...
//   palette.png     dominant colours, largest first
//   music.txt       analyze-track.py --detail on the reference audio (needs Python + librosa)
// --compare <render> adds ref/compare/: reference vs render frame pairs at every reference shot,
// plus a boundary timing table, to check a build against the reference.
// --zoom only writes ref/zoom/zoom-<a>-<b>.png: 12 frames across each span, to study a transition
// or a fast montage frame by frame.
// --sensitivity > 1 finds more cuts (busy motion-graphics edits), < 1 fewer.
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FFMPEG, FFPROBE, requireFfmpeg, run } from "./_media.mjs";

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const sens = Number(opt("--sensitivity") ?? 1);
const compareWith = opt("--compare");
const zoom = opt("--zoom");
const [video, project] = argv;
if (!video || !project) {
  console.error("usage: node analyze-reference.mjs <reference.mp4> <project> [--sensitivity 1] [--compare <render.mp4>]");
  process.exit(1);
}
if (!fs.existsSync(video)) {
  console.error(`not found: ${video}`);
  process.exit(1);
}
requireFfmpeg();
const out = path.join(path.resolve(project), "ref");
const here = path.dirname(fileURLToPath(import.meta.url));

// ---------- probing + decoding ----------
function probe(file) {
  const j = JSON.parse(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", file], { encoding: "utf8" }));
  const v = j.streams.find((s) => s.codec_type === "video");
  const [n, d] = v.r_frame_rate.split("/").map(Number);
  return { width: v.width, height: v.height, fps: n / (d || 1), duration: parseFloat(j.format.duration), audio: j.streams.some((s) => s.codec_type === "audio") };
}

// Tiny RGB frames for the measurements (64 px on the long side).
function decode(file, meta) {
  const F = Math.min(30, Math.round(meta.fps) || 30);
  const land = meta.width >= meta.height;
  const W = land ? 64 : Math.max(2, Math.round((64 * meta.width) / meta.height / 2) * 2);
  const H = land ? Math.max(2, Math.round((64 * meta.height) / meta.width / 2) * 2) : 64;
  const r = spawnSync(FFMPEG, ["-v", "error", "-i", file, "-an", "-vf", `fps=${F},scale=${W}:${H}:flags=area,format=rgb24`, "-f", "rawvideo", "-"], { maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0) throw new Error("decode failed: " + String(r.stderr));
  const size = W * H * 3;
  const frames = [];
  for (let o = 0; o + size <= r.stdout.length; o += size) frames.push(r.stdout.subarray(o, o + size));
  return { F, W, H, frames };
}

const diff = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length / 255;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Hard cuts: a frame-to-frame jump far above its neighbourhood.
// Soft transitions (dissolve, wipe, whip, push): calm -> a burst of change -> calm, with the
// frames on either side clearly different. Both become shot boundaries; soft ones are marked.
function detect({ F, frames }) {
  const n = frames.length;
  const d1 = new Array(n).fill(0);
  for (let i = 1; i < n; i++) d1[i] = diff(frames[i], frames[i - 1]);
  const hard = [];
  for (let i = 1; i < n; i++) {
    const nb = [];
    for (let j = i - 6; j <= i + 6; j++) if (j > 0 && j < n && Math.abs(j - i) > 1) nb.push(d1[j]);
    if (d1[i] >= 0.05 / sens && d1[i] >= (3.5 / sens) * median(nb) + 0.02 / sens) hard.push({ i, score: d1[i], kind: "cut" });
  }
  const K = Math.max(2, Math.round(0.25 * F));
  const C = Math.max(2, Math.round(0.3 * F));
  const cand = [];
  for (let i = K + C; i < n - K - C; i++) {
    const dK = diff(frames[i - K], frames[i + K]);
    if (dK < 0.08 / sens) continue;
    const inside = mean(d1.slice(i - K + 1, i + K + 1));
    const before = mean(d1.slice(i - K - C + 1, i - K + 1));
    const after = mean(d1.slice(i + K + 1, i + K + C + 1));
    if (inside > (2 / sens) * Math.max(before, after) + 0.003) cand.push({ i, score: dK, kind: "soft" });
  }
  const soft = cand.filter((c) => cand.every((o) => Math.abs(o.i - c.i) > K || o.score <= c.score) && hard.every((h) => Math.abs(h.i - c.i) > 0.3 * F));
  // merge boundaries closer than 0.15 s (flash frames, double hits): keep the strongest
  const all = [...hard, ...soft].sort((a, b) => a.i - b.i);
  const merged = [];
  for (const b of all) {
    const last = merged[merged.length - 1];
    if (last && b.i - last.i < 0.15 * F) {
      if (b.score > last.score) merged[merged.length - 1] = b;
    } else merged.push(b);
  }
  // hits: small but sudden in-place changes inside a shot (a word or logo swapped on the same
  // background, a UI state change). Not boundaries; they show the edit's beat inside holds.
  const hits = [];
  for (let i = 2; i < n; i++) {
    if (merged.some((b) => Math.abs(b.i - i) < 0.2 * F)) continue;
    const nb = [];
    for (let j = i - 8; j <= i + 8; j++) if (j > 0 && j < n && Math.abs(j - i) > 1) nb.push(d1[j]);
    if (d1[i] < 0.012 / sens || d1[i] < (6 / sens) * median(nb) + 0.004 / sens) continue;
    const last = hits[hits.length - 1];
    if (last && i - last.i < 0.2 * F) { if (d1[i] > last.score) hits[hits.length - 1] = { i, score: d1[i] }; }
    else hits.push({ i, score: d1[i] });
  }
  return { d1, bounds: merged, hits };
}

function shotsOf(dec, meta, det) {
  const { F, W, H, frames } = dec;
  const edge = 0.15 * F;
  det.bounds = det.bounds.filter((b) => b.i >= edge && b.i <= frames.length - edge);
  const cuts = [{ i: 0, kind: "start" }, ...det.bounds, { i: frames.length, kind: "end" }];
  const shots = [];
  for (let k = 0; k < cuts.length - 1; k++) {
    const a = cuts[k].i, b = cuts[k + 1].i;
    const inner = det.d1.slice(a + 2, Math.max(a + 3, b - 1));
    const motion = mean(inner);
    const mid = frames[Math.min(frames.length - 1, Math.floor((a + b) / 2))];
    shots.push({
      n: k + 1,
      start: +(a / F).toFixed(2),
      end: +(Math.min(b / F, meta.duration)).toFixed(2),
      len: +((Math.min(b / F, meta.duration)) - a / F).toFixed(2),
      in: cuts[k].kind,
      motion: motion < 0.003 ? "hold" : motion < 0.012 ? "drift" : motion < 0.035 ? "moving" : "busy",
      motionScore: +motion.toFixed(4),
      hits: det.hits.filter((h) => h.i > a + 0.1 * F && h.i < b - 0.1 * F).map((h) => +(h.i / F).toFixed(2)),
      background: edgeColour(mid, W, H),
      brightness: +lum(mid).toFixed(2),
    });
  }
  return shots;
}

function edgeColour(px, W, H) {
  const rs = [], gs = [], bs = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) {
        const o = (y * W + x) * 3;
        rs.push(px[o]); gs.push(px[o + 1]); bs.push(px[o + 2]);
      }
  return hex([median(rs), median(gs), median(bs)]);
}
function lum(px) {
  let s = 0;
  for (let o = 0; o < px.length; o += 3) s += 0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2];
  return s / (px.length / 3) / 255;
}
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// k-means palette over frames sampled every 0.5 s
function palette({ F, frames }) {
  const px = [];
  for (let f = 0; f < frames.length; f += Math.max(1, Math.round(F / 2)))
    for (let o = 0; o < frames[f].length; o += 6) px.push([frames[f][o], frames[f][o + 1], frames[f][o + 2]]);
  const k = 8;
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const cs = [px[0]];
  while (cs.length < k) {
    let best = null, bd = -1;
    for (let i = 0; i < px.length; i += 7) {
      const d = Math.min(...cs.map((c) => d2(c, px[i])));
      if (d > bd) { bd = d; best = px[i]; }
    }
    cs.push(best);
  }
  let counts = [];
  for (let it = 0; it < 12; it++) {
    const sum = cs.map(() => [0, 0, 0]);
    counts = cs.map(() => 0);
    for (const p of px) {
      let bi = 0, bd = Infinity;
      cs.forEach((c, j) => { const d = d2(c, p); if (d < bd) { bd = d; bi = j; } });
      sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2]; counts[bi]++;
    }
    cs.forEach((c, j) => { if (counts[j]) cs[j] = sum[j].map((v) => v / counts[j]); });
  }
  const res = cs.map((c, j) => ({ hex: hex(c), share: counts[j] / px.length, sat: satOf(c) }))
    .filter((c) => c.share >= 0.01)
    .sort((a, b) => b.share - a.share);
  return res;
}
function satOf([r, g, b]) {
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2;
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
}

// ---------- frames + sheets ----------
const FONT = [
  "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf",
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
].find((f) => fs.existsSync(f));
let labels = !!FONT;

function grab(file, t, dest, H, label) {
  const scale = `scale=-2:${H}`;
  if (labels) {
    const ff = FONT.replace(/:/g, "\\:");
    const dt = `drawtext=fontfile='${ff}':text='${label}':x=10:y=10:fontsize=${Math.round(H / 11)}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6`;
    const r = spawnSync(FFMPEG, ["-y", "-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", `${scale},${dt}`, "-q:v", "3", dest]);
    if (r.status === 0 && fs.existsSync(dest)) return;
    labels = false; // no drawtext in this ffmpeg build: carry on without labels
  }
  run(["-ss", String(t), "-i", file, "-frames:v", "1", "-vf", scale, "-q:v", "3", dest]);
}

function sheet(rows, dest) {
  const inputs = rows.flat();
  const args = [];
  inputs.forEach((f) => args.push("-i", f));
  const cols = rows[0].length;
  const parts = rows.map((r, ri) => `${r.map((_, ci) => `[${ri * cols + ci}]`).join("")}hstack=${cols}[r${ri}]`);
  const fc = rows.length > 1 ? `${parts.join(";")};${rows.map((_, ri) => `[r${ri}]`).join("")}vstack=${rows.length}[o]` : parts[0].replace("[r0]", "[o]");
  run([...args, "-filter_complex", fc, "-map", "[o]", dest]);
}

const fmt = (s) => s.toFixed(2).padStart(6);

// ---------- zoom: 12 frames across a short span (a transition, a fast montage) ----------
if (zoom) {
  const meta = probe(video);
  const FHz = meta.height > meta.width ? 400 : 270;
  const zdir = path.join(out, "zoom");
  fs.mkdirSync(path.join(zdir, "frames"), { recursive: true });
  for (const range of zoom.split(",")) {
    const [a, b] = range.split("-").map(Number);
    if (!(b > a)) { console.error(`bad --zoom range: ${range} (use start-end in seconds, e.g. 5.2-6.1)`); process.exit(1); }
    const ts = Array.from({ length: 12 }, (_, i) => a + ((b - a) * i) / 11);
    const files = ts.map((t, i) => {
      const f = path.join(zdir, "frames", `${a}-${b}-${String(i).padStart(2, "0")}.jpg`);
      grab(video, Math.min(t, meta.duration - 0.05).toFixed(3), f, FHz, `${t.toFixed(2)}s`);
      return f;
    });
    const dest = path.join(zdir, `zoom-${a}-${b}.png`);
    sheet([files.slice(0, 4), files.slice(4, 8), files.slice(8, 12)], dest);
    console.log(`-> ${dest}`);
  }
  process.exit(0);
}

// ---------- main ----------
fs.rmSync(path.join(out, "frames"), { recursive: true, force: true });
fs.rmSync(path.join(out, "sheets"), { recursive: true, force: true });
fs.mkdirSync(path.join(out, "frames"), { recursive: true });
fs.mkdirSync(path.join(out, "sheets"), { recursive: true });

const meta = probe(video);
console.log(`reference: ${meta.width}x${meta.height} ${meta.fps.toFixed(2)} fps ${meta.duration.toFixed(2)} s${meta.audio ? " + audio" : ""}`);
const dec = decode(video, meta);
const det = detect(dec);
const shots = shotsOf(dec, meta, det);
const pal = palette(dec);
const portrait = meta.height > meta.width;
const FH = portrait ? 400 : 270;

// music
let music = null;
if (meta.audio) {
  const py = [process.env.PYTHON, "python", "python3", "py"].filter(Boolean).find((p) => spawnSync(p, ["-c", "import librosa"]).status === 0);
  if (py) {
    const r = spawnSync(py, [path.join(here, "analyze-track.py"), video, "--detail"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 0) {
      fs.writeFileSync(path.join(out, "music.txt"), r.stdout);
      const m = r.stdout.match(/tempo ~([\d.]+) BPM\s+first beat ([\d.]+)s/);
      if (m) music = { bpm: Number(m[1]), first: Number(m[2]) };
    }
  }
}
if (music) {
  const beat = 60 / music.bpm;
  for (const s of shots) {
    s.beats = +(s.len / beat).toFixed(1);
    const ph = (s.start - music.first) / beat;
    s.offBeat = +((ph - Math.round(ph)) * beat).toFixed(2);
  }
}

// frames + sheets (6 shots per sheet, 3 frames per shot)
const per = portrait ? 4 : 6;
shots.forEach((s) => {
  const pad = Math.min(0.12, s.len * 0.2);
  const ts = [s.start + pad, (s.start + s.end) / 2, Math.max(s.start, s.end - pad - 0.04)];
  s.frames = ts.map((t, j) => {
    const f = path.join(out, "frames", `s${String(s.n).padStart(2, "0")}-${"abc"[j]}.jpg`);
    grab(video, t.toFixed(3), f, FH, `S${String(s.n).padStart(2, "0")}  ${t.toFixed(1)}s`);
    return f;
  });
});
for (let i = 0; i < shots.length; i += per) {
  const group = shots.slice(i, i + per);
  const name = `sheet-${String(i / per + 1).padStart(2, "0")}.png`;
  sheet(group.map((s) => s.frames), path.join(out, "sheets", name));
  group.forEach((s) => (s.sheet = name));
}
// palette strip
{
  const args = [];
  pal.forEach((c) => args.push("-f", "lavfi", "-i", `color=c=0x${c.hex.slice(1)}:s=${Math.max(40, Math.round(1200 * c.share))}x120:d=1`));
  const fc = pal.length > 1 ? `${pal.map((_, i) => `[${i}]`).join("")}hstack=${pal.length}[o]` : "[0]null[o]";
  run([...args, "-filter_complex", fc, "-map", "[o]", "-frames:v", "1", path.join(out, "palette.png")]);
}

// stats
const lens = shots.map((s) => s.len);
const rhythm = [];
for (let sec = 0; sec < Math.ceil(meta.duration); sec++) rhythm.push(det.bounds.filter((b) => b.i / dec.F >= sec && b.i / dec.F < sec + 1).length);
const avgLum = mean(shots.map((s) => s.brightness * s.len)) * shots.length / meta.duration;
const onBeat = music ? shots.slice(1).filter((s) => Math.abs(s.offBeat) <= 0.08).length : 0;
const accent = pal.filter((c) => c.sat > 0.45 && c.share < 0.35).sort((a, b) => b.sat * Math.sqrt(b.share) - a.sat * Math.sqrt(a.share))[0];

const md = [];
md.push(`# Reference analysis: ${path.basename(video)}`, "");
md.push(`Machine facts. Read them with the contact sheets in \`sheets/\` and write the breakdown (\`reference.md\`, see references/REFERENCE.md).`, "");
md.push("## Format", "");
md.push(`- ${meta.width}x${meta.height} (${portrait ? "vertical" : meta.width === meta.height ? "square" : "horizontal"}), ${meta.fps.toFixed(2)} fps, ${meta.duration.toFixed(2)} s, ${meta.audio ? "has audio" : "no audio"}`);
md.push(`- overall ${avgLum < 0.35 ? "dark" : avgLum > 0.65 ? "light" : "mid-tone"} (mean luminance ${avgLum.toFixed(2)})`, "");
md.push("## Pace", "");
md.push(`- ${shots.length} shot${shots.length === 1 ? "" : "s"} (${det.bounds.filter((b) => b.kind === "cut").length} hard cuts, ${det.bounds.filter((b) => b.kind === "soft").length} soft transitions)`);
md.push(`- shot length: average ${mean(lens).toFixed(2)} s, median ${median(lens).toFixed(2)} s, shortest ${Math.min(...lens).toFixed(2)} s, longest ${Math.max(...lens).toFixed(2)} s`);
if (music) md.push(`- music ~${music.bpm.toFixed(0)} BPM (beat ${(60 / music.bpm).toFixed(3)} s); ${onBeat}/${shots.length - 1} boundaries land within 80 ms of a beat${onBeat / Math.max(1, shots.length - 1) > 0.6 ? " (cut to the beat)" : ""}`);
md.push("- boundaries per second:", "", "```", "cuts: " + rhythm.map((c) => (c ? String(Math.min(9, c)) : ".")).join(""), "sec : " + rhythm.map((_, i) => String(i % 10)).join(""), "```", "");
md.push("## Shots", "");
md.push("Boundary `cut` = hard cut, `soft` = dissolve / wipe / whip / push or a fast move between holds (check the frames). Motion: hold < drift < moving < busy. Hits = sudden in-place changes inside the shot (word or logo swaps, UI state changes, typing bursts), at these times.", "");
md.push(`| # | start | end | len${music ? " | beats | off-beat" : ""} | in | motion | hits | background | sheet |`);
md.push(`| --- | --- | --- | ---${music ? " | --- | ---" : ""} | --- | --- | --- | --- | --- |`);
const hitsCell = (h) => (h.length ? h.slice(0, 8).map((t) => t.toFixed(1)).join(" ") + (h.length > 8 ? ` +${h.length - 8}` : "") : "");
for (const s of shots) md.push(`| S${String(s.n).padStart(2, "0")} | ${fmt(s.start)} | ${fmt(s.end)} | ${s.len.toFixed(2)}${music ? ` | ${s.beats} | ${s.n > 1 ? s.offBeat.toFixed(2) : ""}` : ""} | ${s.in} | ${s.motion} | ${hitsCell(s.hits)} | ${s.background} | ${s.sheet} |`);
md.push("", "## Palette", "");
md.push("`palette.png` shows these, widths proportional to share.", "");
for (const c of pal) md.push(`- ${c.hex}  ${(c.share * 100).toFixed(1)}%  ${c.sat > 0.45 ? "saturated" : c.sat < 0.12 ? "neutral" : "muted"}`);
if (accent) md.push("", `Likely accent: ${accent.hex}. Map the reference's colour roles onto the brand (background → ink or paper, accent → primary), never its exact hexes.`);
md.push("", "## Music", "");
md.push(music ? "`music.txt` has the full profile (tempo, key, loudness strip, rises, ending). Use it for `music-plan.json`." : meta.audio ? "Python + librosa not found: run `python <skill>/scripts/analyze-track.py <reference> --detail` to profile the audio (set PYTHON to the interpreter)." : "No audio track.");
fs.writeFileSync(path.join(out, "analysis.md"), md.join("\n") + "\n");
fs.writeFileSync(path.join(out, "shots.json"), JSON.stringify({ source: path.basename(video), meta, music, palette: pal, shots: shots.map(({ frames, ...s }) => s) }, null, 2));

console.log(`${shots.length} shot${shots.length === 1 ? "" : "s"}, median ${median(lens).toFixed(2)} s${music ? `, ~${music.bpm.toFixed(0)} BPM` : ""}; ${Math.ceil(shots.length / per)} contact sheet(s)${labels ? "" : " (unlabelled: no drawtext font)"}`);
console.log(`-> ${path.join(out, "analysis.md")}`);

// ---------- compare ----------
if (compareWith) {
  const cdir = path.join(out, "compare");
  fs.rmSync(cdir, { recursive: true, force: true });
  fs.mkdirSync(path.join(cdir, "frames"), { recursive: true });
  const rm = probe(compareWith);
  const rd = decode(compareWith, rm);
  const rdet = detect(rd);
  const rb = rdet.bounds.map((b) => b.i / rd.F);
  const rows = [];
  const lines = ["# Reference vs render", "", `Reference ${meta.duration.toFixed(2)} s, ${shots.length} shots · render ${rm.duration.toFixed(2)} s, ${rb.length + 1} shots.`, "", "| ref boundary | nearest render boundary | delta |", "| --- | --- | --- |"];
  for (const s of shots.slice(1)) {
    const near = rb.length ? rb.reduce((a, b) => (Math.abs(b - s.start) < Math.abs(a - s.start) ? b : a)) : null;
    lines.push(`| S${String(s.n).padStart(2, "0")} ${s.start.toFixed(2)} | ${near === null ? "-" : near.toFixed(2)} | ${near === null ? "-" : (near - s.start >= 0 ? "+" : "") + (near - s.start).toFixed(2)} |`);
  }
  shots.forEach((s) => {
    const t = (s.start + s.end) / 2;
    if (t >= rm.duration) return;
    const a = path.join(cdir, "frames", `s${String(s.n).padStart(2, "0")}-ref.jpg`);
    const b = path.join(cdir, "frames", `s${String(s.n).padStart(2, "0")}-render.jpg`);
    grab(video, t.toFixed(3), a, FH, `REF S${String(s.n).padStart(2, "0")}  ${t.toFixed(1)}s`);
    grab(compareWith, t.toFixed(3), b, FH, `RENDER  ${t.toFixed(1)}s`);
    rows.push([a, b]);
  });
  for (let i = 0; i < rows.length; i += per) sheet(rows.slice(i, i + per), path.join(cdir, `compare-${String(i / per + 1).padStart(2, "0")}.png`));
  fs.writeFileSync(path.join(cdir, "compare.md"), lines.join("\n") + "\n");
  console.log(`compare: ${rows.length} frame pairs -> ${cdir}`);
}
