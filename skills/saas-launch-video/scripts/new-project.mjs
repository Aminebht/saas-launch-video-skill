#!/usr/bin/env node
// Scaffold a launch-video project from the skill's template, then build it once.
//
//   node new-project.mjs <target-dir>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, "..", "template");
const target = path.resolve(process.argv[2] || "");
if (!process.argv[2]) {
  console.error("usage: node new-project.mjs <target-dir>");
  process.exit(1);
}
if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
  console.error(`${target} exists and is not empty; pick a new folder`);
  process.exit(1);
}
fs.cpSync(template, target, { recursive: true });
fs.writeFileSync(path.join(target, "meta.json"), JSON.stringify({ id: path.basename(target), name: path.basename(target) }, null, 2) + "\n");
execFileSync(process.execPath, [path.join(here, "build.mjs"), target], { stdio: "inherit" });
console.log(`\nnew project: ${target}
next:
  node ${path.join(here, "fetch-sfx.mjs")} "${target}"     # sound effects (optional)
  edit video.config.json + compositions/app.html, then rebuild with build.mjs
  cd "${target}" && npx hyperframes@0.8.115 check`);
