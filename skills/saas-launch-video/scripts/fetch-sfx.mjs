#!/usr/bin/env node
// Copy the HyperFrames media-use sound-effect pack (Pixabay licence: free to use in videos)
// into <project>/assets/sfx. The pack ships with the HyperFrames skills
// (`npx hyperframes init` installs them under ~/.agents/skills or ~/.claude/skills).
//
//   node fetch-sfx.mjs <project-dir> [--from <sfx-dir>]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const project = path.resolve(args[0] || ".");
const fromIdx = args.indexOf("--from");
const candidates = fromIdx > -1 ? [path.resolve(args[fromIdx + 1])] : [
  path.join(os.homedir(), ".agents", "skills", "media-use", "audio", "assets", "sfx"),
  path.join(os.homedir(), ".claude", "skills", "media-use", "audio", "assets", "sfx"),
];
const src = candidates.find((d) => fs.existsSync(d));
if (!src) {
  console.error("Sound-effect pack not found. Install the HyperFrames skills (`npx hyperframes init <any-dir>`),");
  console.error("or pass --from <folder-with-mp3s>. Searched:\n  " + candidates.join("\n  "));
  process.exit(1);
}
const dest = path.join(project, "assets", "sfx");
fs.mkdirSync(dest, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(src)) {
  if (f.endsWith(".mp3") || f === "CREDITS.md") {
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
    n++;
  }
}
console.log(`copied ${n} files from ${src} -> ${dest}. Rebuild with build.mjs so the audio clips are included.`);
