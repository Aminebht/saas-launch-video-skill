// Shared ffmpeg helpers for the music / finalize scripts.
import { execFileSync, spawnSync } from "node:child_process";

export const FFMPEG = process.env.FFMPEG || "ffmpeg";
export const FFPROBE = process.env.FFPROBE || "ffprobe";

export function requireFfmpeg() {
  const r = spawnSync(FFMPEG, ["-version"], { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    console.error("ffmpeg not found. Install it (winget install ffmpeg / brew install ffmpeg / apt install ffmpeg),");
    console.error("or point FFMPEG and FFPROBE at the binaries.");
    process.exit(1);
  }
}

export function duration(file) {
  return parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());
}

// ffmpeg writes its loudnorm / ebur128 reports to stderr
function stderrOf(args) {
  const r = spawnSync(FFMPEG, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr.split("\n").slice(-15).join("\n")}`);
  return r.stderr;
}

// Two-pass EBU R128 loudness normalisation. `pre` is a filter chain producing the mix
// (or null to normalise the input's own audio). Returns the second-pass audio filter.
export function loudnormFilter(inputs, pre, target = { I: -14, TP: -1.0, LRA: 11 }) {
  const ln = `loudnorm=I=${target.I}:TP=${target.TP}:LRA=${target.LRA}`;
  const args = ["-hide_banner"];
  inputs.forEach((i) => args.push("-i", i));
  args.push(pre ? "-filter_complex" : "-af", pre ? `${pre},${ln}:print_format=json` : `${ln}:print_format=json`, "-vn", "-f", "null", "-");
  const out = stderrOf(args);
  const m = JSON.parse(out.slice(out.lastIndexOf("{"), out.lastIndexOf("}") + 1));
  return `${ln}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
}

export function loudness(file) {
  const out = stderrOf(["-hide_banner", "-i", file, "-vn", "-af", "ebur128=framelog=quiet:peak=true", "-f", "null", "-"]);
  const I = out.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  const P = out.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  return { lufs: Number(I), peak: Number(P) };
}

export function run(args) {
  const r = spawnSync(FFMPEG, ["-y", "-v", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
}
