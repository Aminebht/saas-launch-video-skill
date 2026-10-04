#!/usr/bin/env node
// Link mode: capture a product's public website and pre-fill the project from it.
//
//   node from-link.mjs <url> <project-dir> [--refresh]
//
// 1. Runs `npx hyperframes capture <url>` into <project>/capture (skipped if present, unless --refresh).
// 2. Picks brand roles from the captured colours (dark ink, accent, secondary, light tint).
// 3. Copies the brand mark, logo candidates and the share image into assets/.
// 4. Installs the site's font from @fontsource when it is a Google Font (else keeps Poppins).
// 5. Patches video.config.json (brand, colours, plate, montage text) and writes brand-kit.md:
//    a summary for the agent plus the list of in-app screens still needed from the user.
// A public link never shows the logged-in product. That part still needs screenshots, a screen
// recording or a session the user logs into themselves.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const [url, projectArg] = args.filter((a) => !a.startsWith("--"));
if (!url || !projectArg) {
  console.error("usage: node from-link.mjs <url> <project-dir> [--refresh]");
  process.exit(1);
}
const project = path.resolve(projectArg);
const cap = path.join(project, "capture");
const shell = process.platform === "win32";
const rel = (p) => path.relative(project, p).split(path.sep).join("/");

// ---------- 1. capture ----------
if (refresh || !fs.existsSync(path.join(cap, "extracted", "tokens.json"))) {
  console.log(`capturing ${url} (1-3 min)...`);
  fs.rmSync(cap, { recursive: true, force: true });
  const r = spawnSync("npx", ["-y", "hyperframes@0.8.115", "capture", url, "-o", cap, "--json"], { cwd: project, shell, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (!fs.existsSync(path.join(cap, "extracted", "tokens.json"))) {
    console.error("capture failed:\n" + (r.stderr || r.stdout || "").split("\n").slice(-20).join("\n"));
    process.exit(1);
  }
}
const read = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(cap, f), "utf8"));
  } catch {
    return fallback;
  }
};
const tokens = read("extracted/tokens.json", {});
const styles = read("extracted/design-styles.json", {});
const icons = read("extracted/icons-manifest.json", {});
const text = fs.existsSync(path.join(cap, "extracted", "visible-text.txt")) ? fs.readFileSync(path.join(cap, "extracted", "visible-text.txt"), "utf8") : "";

// ---------- 2. colours ----------
const hexToRgb = (h) => {
  const m = h.replace("#", "").match(/^([0-9a-f]{6})/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, k) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * k));
const lum = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const hsl = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hh * 60 + 360) % 360, s, l];
};
const fromHsl = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
};
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
// colours used fewer than 3 times are widgets (chat bubbles, badges), not brand colours
const stats = (tokens.colorStats || []).filter((c) => hexToRgb(c.hex) && (c.count || 0) >= 3);
const score = (c) => (c.interactiveBg || 0) * 5 + (c.bgCount || 0) * 2 + (c.textCount || 0) * 0.5 + Math.log10((c.maxArea || 0) + 1);

const accentC = stats.filter((c) => hsl(c.hex)[1] > 0.35 && lum(c.hex) > 0.04 && lum(c.hex) < 0.75).sort((a, b) => score(b) - score(a))[0];
const accent = accentC ? accentC.hex : "#7049c3";
const accentHue = hsl(accent)[0];
// a real second brand hue if the site uses one; otherwise a soft companion tint ~40deg round the wheel
const secondC = stats.filter((c) => c.hex !== accent && hsl(c.hex)[1] > 0.3 && lum(c.hex) > 0.04 && hueDist(hsl(c.hex)[0], accentHue) >= 25).sort((a, b) => score(b) - score(a))[0];
const secondary = secondC ? secondC.hex : fromHsl((accentHue + 40) % 360, 0.65, 0.84);
const inkC = stats.filter((c) => lum(c.hex) < 0.03 && ((c.bgCount || 0) > 0 || (c.areaBg || 0) > 0)).sort((a, b) => (b.maxArea || 0) - (a.maxArea || 0))[0];
// the card background must be near-black; tint it with the accent when the site has no dark surface
const ink = inkC ? inkC.hex : mix("#05030a", accent, 0.08);
const lightC = stats.filter((c) => lum(c.hex) > 0.7 && hsl(c.hex)[1] > 0.15).sort((a, b) => score(b) - score(a))[0];
const light = lightC ? lightC.hex : mix(accent, "#ffffff", 0.85);
const roles = {
  ink,
  accent,
  secondary,
  light,
  keywordFrom: mix(accent, "#ffffff", 0.25),
  keywordTo: lum(secondary) > 0.3 ? secondary : mix(secondary, "#ffffff", 0.45),
};

// ---------- 3. brand assets ----------
const brandDir = path.join(project, "assets", "brand");
const imgDir = path.join(project, "assets", "images");
fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(imgDir, { recursive: true });
const title = tokens.title || "";
const name = (title.split(/\s[-|–—:]\s|\s\|\s/)[0] || new URL(url).hostname.split(".")[0]).trim();
const assetsDir = path.join(cap, "assets");
const list = (d) => (fs.existsSync(d) ? fs.readdirSync(d).map((f) => path.join(d, f)).filter((f) => fs.statSync(f).isFile()) : []);
const assetFiles = [...list(assetsDir), ...list(path.join(assetsDir, "svgs"))].filter((f) => !/contact-sheet/.test(f));
const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
const logoCands = assetFiles.filter((f) => /logo/i.test(path.basename(f)) || (slugName && path.basename(f).toLowerCase().replace(/[^a-z0-9]/g, "").includes(slugName)));
const copyAs = (src, destBase) => {
  const dest = path.join(brandDir, destBase + path.extname(src).toLowerCase());
  fs.copyFileSync(src, dest);
  return rel(dest);
};
let mark = null;
const headline = icons.headline?.file ? path.join(cap, icons.headline.file) : null;
if (headline && fs.existsSync(headline)) mark = copyAs(headline, "mark");
const logos = logoCands.map((f, i) => copyAs(f, `logo-candidate-${i + 1}`));
const og = assetFiles.find((f) => /og[-_]?image|og\./i.test(path.basename(f)));
let ogRel = null;
if (og) {
  const dest = path.join(imgDir, "site-share" + path.extname(og).toLowerCase());
  fs.copyFileSync(og, dest);
  ogRel = rel(dest);
}

// ---------- 4. font ----------
const family = (styles.typography || []).find((t) => /heading/.test(t.role))?.fontFamily || tokens.fonts?.[0]?.family || null;
let fontUsed = "Poppins";
let fontNote = family ? `the site uses ${family}` : "kept Poppins (no site font detected)";
if (family && family.toLowerCase() === "poppins") fontNote = "the site uses Poppins (already bundled)";
if (family && family.toLowerCase() !== "poppins") {
  const slug = family.toLowerCase().replace(/\s+/g, "-");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fontsource-"));
  const pack = spawnSync("npm", ["pack", `@fontsource/${slug}`, "--silent"], { cwd: tmp, shell, encoding: "utf8" });
  const tgz = list(tmp).find((f) => f.endsWith(".tgz"));
  if (pack.status === 0 && tgz) {
    spawnSync("tar", ["-xzf", tgz], { cwd: tmp });
    const files = path.join(tmp, "package", "files");
    const got = [400, 500, 600, 700, 800].filter((w) => {
      const f = path.join(files, `${slug}-latin-${w}-normal.woff2`);
      if (!fs.existsSync(f)) return false;
      fs.copyFileSync(f, path.join(project, "assets", "fonts", path.basename(f)));
      return true;
    });
    const lic = list(path.join(tmp, "package")).find((f) => /LICENSE/i.test(path.basename(f)));
    if (lic) fs.copyFileSync(lic, path.join(project, "assets", "fonts", `LICENSE-${slug}.txt`));
    if (got.length) {
      fontUsed = family;
      fontNote = `installed ${family} (${got.join(", ")}) from @fontsource`;
    }
  } else fontNote = `"${family}" is not on @fontsource (likely a custom/paid font): kept Poppins; ask the user for .woff2 files named ${slug}-latin-<weight>-normal.woff2`;
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- 5. patch config ----------
const cfgPath = path.join(project, "video.config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const host = new URL(url).hostname.replace(/^www\./, "");
const desc = (tokens.description || "").replace(/\s+/g, " ").trim();
const firstSentence = desc.split(/(?<=[.!?])\s/)[0] || desc;
Object.assign(cfg.brand, {
  name,
  wordmark: name.toUpperCase(),
  url: host,
  font: fontUsed,
  ...(mark ? { mark } : {}),
  ...(logos[0] ? { logo: logos[0] } : {}),
});
Object.assign(cfg.brand.colors, {
  ink: roles.ink,
  keywordFrom: roles.keywordFrom,
  keywordTo: roles.keywordTo,
  caretFrom: mix(accent, "#ffffff", 0.35),
  caretTo: accent,
  chipBorder: mix(accent, "#ffffff", 0.35),
});
cfg.plate.colors = {
  ink: roles.ink,
  deep: mix(roles.ink, accent, 0.18),
  a: accent,
  b: fromHsl((accentHue + 345) % 360, Math.min(0.85, hsl(accent)[1] + 0.1), Math.max(0.45, hsl(accent)[2])),
  c: roles.keywordTo,
  d: roles.light,
};
if (cfg.montage) {
  Object.assign(cfg.montage, {
    handle: slugName || cfg.montage.handle,
    url: host,
    caption: firstSentence.slice(0, 110),
    previewTitle: name,
    previewDesc: desc.slice(0, 70),
  });
  if (ogRel) Object.assign(cfg.montage.images, { ad: ogRel, chat: ogRel });
}
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");

// ---------- 6. brand kit report ----------
const shots = list(path.join(cap, "screenshots")).filter((f) => !/contact-sheet/.test(f)).map(rel);
const headings = (tokens.headings || []).map((h) => `- h${h.level}: ${h.text}`).slice(0, 20);
const ctas = (tokens.ctas || []).map((c) => c.text).filter(Boolean);
const lines = text.split("\n").map((l) => l.replace(/^\[\w+\]\s*/, "").trim()).filter((l) => l.length > 18).slice(0, 60);
const report = `# Brand kit from ${url}

Generated by from-link.mjs. **Verify before building**: open the logo candidates and the screenshots.

## Identity
- Name: **${name}**, wordmark ${name.toUpperCase()}, URL ${host}
- Title: ${title}
- Description: ${desc}
- Font: ${fontNote}
- Brand mark (icon): ${mark || "none found: ask the user"}
- Logo candidates (the end lockup needs one that reads on a dark background; brand.logo = the first one):
${logos.length ? logos.map((l) => `  - ${l}`).join("\n") : "  - none found: ask the user for a light-on-dark logo"}
- Share image: ${ogRel || "none"} (used for the montage ad + chat preview)

## Colours (written to video.config.json)
| Role | Hex |
| --- | --- |
| ink (card background) | ${roles.ink}${inkC ? "" : " (derived: the site has no dark surface)"} |
| accent | ${roles.accent} |
| secondary | ${roles.secondary}${secondC ? "" : " (derived companion tint: the site uses one hue)"} |
| light tint | ${roles.light} |
| gradient keyword | ${roles.keywordFrom} → ${roles.keywordTo} |

## Copy material (headings, calls to action, visible text)
${headings.join("\n")}
- CTAs: ${ctas.join(" · ")}

<details><summary>Visible text (first lines)</summary>

${lines.map((l) => `- ${l}`).join("\n")}

</details>

## Public screenshots
${shots.map((s) => `- ${s}`).join("\n")}

## Still needed from the user: the in-app screens
A public link never shows the logged-in product. List the exact screens the approved script needs, for example:
1. the main workspace in its empty / starting state
2. the input or action where the user starts (prompt box, editor, upload)
3. the result while it is being created, and once done
4. each screen used by an edit beat (settings, integrations, publish)
5. where results land (dashboard, inbox, analytics), with realistic demo data
6. a success state (toast, confirmation card)

Ask for ONE of:
- **Screenshots** (PNG, full window, 1440 px wide or more, no personal data), or
- **A screen recording** (1-2 min walking through those screens). Extract frames with \`ffmpeg -i rec.mp4 -vf fps=2 capture/rec/%04d.png\`, or
- **A logged-in browser session**: the user signs in themselves in the agent's browser (never type their password); then navigate and screenshot each state.
`;
fs.writeFileSync(path.join(project, "brand-kit.md"), report);

console.log(`brand kit -> ${path.join(project, "brand-kit.md")}`);
console.log(`  ${name} · accent ${roles.accent} · secondary ${roles.secondary} · ink ${roles.ink} · ${fontNote}`);
console.log(`  mark: ${mark || "missing"} · logo candidates: ${logos.length} · share image: ${ogRel || "none"} · screenshots: ${shots.length}`);
console.log("next: verify the brand kit, rebuild (build.mjs), then ask the user for the in-app screens listed in brand-kit.md");
