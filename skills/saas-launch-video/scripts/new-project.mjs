#!/usr/bin/env node
// Scaffold an empty launch-video project: HyperFrames skeleton + toolkit + brand.json.
// The look, structure and scenes are NOT templated: they come from the approved direction.
//
//   node new-project.mjs <target-dir> [--examples]
//
// --examples also mounts the UI rig and the four technique demos (one per style family) so you
// can render and study them: npx hyperframes@0.8.115 render -q draft -o renders/examples.mp4
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.join(here, "..");
const args = process.argv.slice(2);
const withExamples = args.includes("--examples");
const targetArg = args.find((a) => !a.startsWith("--"));
if (!targetArg) {
  console.error("usage: node new-project.mjs <target-dir> [--examples]");
  process.exit(1);
}
const target = path.resolve(targetArg);
if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
  console.error(`${target} exists and is not empty; pick a new folder`);
  process.exit(1);
}
const w = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(target, rel)), { recursive: true });
  fs.writeFileSync(path.join(target, rel), text);
};
const cp = (src, rel) => {
  fs.mkdirSync(path.dirname(path.join(target, rel)), { recursive: true });
  fs.cpSync(src, path.join(target, rel), { recursive: true });
};

// ---------- skeleton ----------
cp(path.join(skill, "toolkit", "skeleton", "index.html"), "index.html");
cp(path.join(skill, "toolkit", "fx.js"), "lib/fx.js");
cp(path.join(skill, "toolkit", "three-stage.js"), "lib/three-stage.js");
cp(path.join(skill, "toolkit", "ui-rig.html"), "reference/ui-rig.html");
for (const d of ["compositions", "assets/brand", "assets/fonts", "assets/images", "assets/ui", "assets/music", "assets/sfx"]) fs.mkdirSync(path.join(target, d), { recursive: true });
w("hyperframes.json", JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true } }, null, 2) + "\n");
w("package.json", JSON.stringify({ name: path.basename(target).toLowerCase().replace(/[^a-z0-9-]/g, "-"), private: true, type: "module", scripts: { dev: "npx --yes hyperframes@0.8.115 preview", check: "npx --yes hyperframes@0.8.115 check", render: "npx --yes hyperframes@0.8.115 render" } }, null, 2) + "\n");
w("meta.json", JSON.stringify({ id: path.basename(target), name: path.basename(target) }, null, 2) + "\n");
w(".gitignore", "renders/\nsnapshots/\ncapture/\npitch/*/snapshots/\n.hyperframes/\nassets/sfx/*.mp3\n");
// placeholder brand: replaced by from-link.mjs or by hand (see references/BRAND.md)
w("brand.json", JSON.stringify({
  name: "Lumen",
  url: "lumen.app",
  logo: { mark: "assets/brand/mark.svg", onDark: "assets/brand/logo-on-dark.svg", onLight: "assets/brand/logo-on-light.svg" },
  fonts: { display: "Inter", text: "Inter", mono: "JetBrains Mono" },
  colors: { primary: "#3b5bfd", secondary: "#ff7a59", ink: "#0b0c14", paper: "#ffffff" },
}, null, 2) + "\n");
const svgMark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" fill="none" stroke="#3b5bfd" stroke-width="16"/><circle cx="60" cy="60" r="14" fill="#ff7a59"/></svg>\n';
w("assets/brand/mark.svg", svgMark);
w("assets/brand/logo-on-dark.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120"><circle cx="60" cy="60" r="40" fill="none" stroke="#3b5bfd" stroke-width="14"/><circle cx="60" cy="60" r="12" fill="#ff7a59"/><text x="130" y="82" font-family="Arial, sans-serif" font-weight="800" font-size="64" fill="#ffffff">LUMEN</text></svg>\n');
w("assets/brand/logo-on-light.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120"><circle cx="60" cy="60" r="40" fill="none" stroke="#3b5bfd" stroke-width="14"/><circle cx="60" cy="60" r="12" fill="#ff7a59"/><text x="130" y="82" font-family="Arial, sans-serif" font-weight="800" font-size="64" fill="#0b0c14">LUMEN</text></svg>\n');

// ---------- examples (study material) ----------
if (withExamples) {
  const ex = path.join(skill, "examples");
  const demos = [["ui-rig", path.join(skill, "toolkit", "ui-rig.html"), 5.4], ["ex-editorial", path.join(ex, "ex-editorial.html"), 6], ["ex-bold", path.join(ex, "ex-bold.html"), 6], ["ex-cinematic", path.join(ex, "ex-cinematic.html"), 6], ["ex-dev", path.join(ex, "ex-dev.html"), 6]];
  cp(path.join(ex, "assets"), "assets/examples");
  let t = 0;
  const slots = demos.map(([id, src, d]) => {
    cp(src, `compositions/${id}.html`);
    const slot = `      <div id="el-${id}" class="scene-slot" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${t}" data-duration="${d}" data-track-index="1" data-width="1920" data-height="1080"></div>`;
    t += d;
    return slot;
  });
  let html = fs.readFileSync(path.join(target, "index.html"), "utf8");
  html = html.replace('data-duration="30" data-fps="30">\n    </div>', `data-duration="${t}" data-fps="30">\n${slots.join("\n")}\n    </div>`);
  fs.writeFileSync(path.join(target, "index.html"), html);
}

execFileSync(process.execPath, [path.join(here, "brand.mjs"), target], { stdio: "inherit" });
console.log(`\nnew project: ${target}${withExamples ? " (with examples mounted)" : ""}
next (see SKILL.md): learn the product (code / from-link.mjs / screens; analyze-reference.mjs for a reference video) -> pitch 3 directions -> script -> images -> build -> music -> deliver`);
