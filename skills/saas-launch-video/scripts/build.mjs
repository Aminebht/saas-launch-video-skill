#!/usr/bin/env node
// Build a launch-video project's root composition from video.config.json.
//
//   node build.mjs <project-dir>
//
// Writes <project>/index.html (cards, filters, scene slots, overlays, audio) and renders
// scene-templates/*.tpl.html into compositions/*.html with config values. Card motion lives in
// lib/cards.js, the gradient plate in lib/plate.js, shared helpers in lib/fx.js.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || ".");
const cfgPath = path.join(dir, "video.config.json");
if (!fs.existsSync(cfgPath)) {
  console.error(`No video.config.json in ${dir}`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const warnings = [];
const exists = (rel) => rel && fs.existsSync(path.join(dir, rel));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// "[word]" -> gradient keyword. Only one per card (style rule), so warn on more.
const keyword = (text, id) => {
  const n = (text.match(/\[/g) || []).length;
  if (n > 1) warnings.push(`${id}: ${n} gradient keywords; the style allows one per card`);
  return esc(text).replace(/\[([^\]]+)\]/g, '<span class="g">$1</span>');
};

// ---------------- validation ----------------
const ids = new Set();
for (const b of cfg.beats) {
  if (b.id) {
    if (ids.has(b.id)) throw new Error(`Duplicate beat id ${b.id}`);
    ids.add(b.id);
  }
  if (b.start + (b.duration || 0) > cfg.duration + 1e-6) warnings.push(`${b.id || b.type} ends past duration ${cfg.duration}s`);
  if (b.type === "text" && b.duration < 0.5) warnings.push(`${b.id}: cards need at least 0.5 s on screen`);
  if (b.type === "scene" && !exists(b.src) && !exists(b.src.replace(/^compositions\//, "scene-templates/").replace(/\.html$/, ".tpl.html"))) warnings.push(`${b.id}: missing ${b.src}`);
}

// ---------------- icons for token chips ----------------
const ICON = {
  sparkle: '<path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z" />',
  image: '<rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" />',
  layout: '<rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />',
  clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
  send: '<path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />',
  globe: '<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />',
  chart: '<path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" />',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z" />',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />',
  users: '<circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6" />',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />',
  check: '<circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" />',
  card: '<rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" />',
};
const icon = (name) => {
  if (!ICON[name]) warnings.push(`unknown icon "${name}" (known: ${Object.keys(ICON).join(", ")})`);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="url(#chip-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ICON.sparkle}</svg>`;
};

// ---------------- markup per beat ----------------
const C = cfg.brand.colors;
const filters = [];
const whip = (id) => filters.push(`<filter id="${id}" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur id="${id}-blur" stdDeviation="0 0" /></filter>`);
const slots = [];
const cards = [];
let track = 2;

for (const b of cfg.beats) {
  const timing = `data-start="${b.start}" data-duration="${b.duration}"`;
  const bgClass = b.bg === "gradient" ? " on-gradient" : "";
  if (b.type === "scene") {
    slots.push(`      <div id="el-${b.id}" class="scene-slot" data-composition-id="${b.id}" data-composition-src="${b.src}"\n        ${timing} data-track-index="1" data-width="${cfg.width}" data-height="${cfg.height}"></div>`);
  } else if (b.type === "logo-intro") {
    whip(`${b.id}-whip1`);
    whip(`${b.id}-whip2`);
    const mark = b.mark || cfg.brand.mark;
    if (!exists(mark)) warnings.push(`logo mark not found: ${mark}`);
    cards.push(`      <section id="${b.id}" class="card clip" ${timing} data-track-index="${track}">
        <div id="${b.id}-stage" class="intro-stage">
          <div id="${b.id}-logo" class="intro-logo">
            <img id="${b.id}-mark" class="intro-mark" src="${esc(mark)}" alt="" />
            <div id="${b.id}-word" class="intro-word">${esc(b.wordmark || cfg.brand.wordmark)}</div>
          </div>
          ${b.next ? `<div id="${b.id}-next" class="intro-next g">${esc(b.next)}</div>` : ""}
        </div>
      </section>`);
  } else if (b.type === "text") {
    if (b.enter === "whip-left" || b.enter === "whip-right") whip(`${b.id}-whip`);
    const caret = b.enter === "type" ? `<span id="${b.id}-caret" class="caret"></span>` : "";
    cards.push(`      <section id="${b.id}" class="card${bgClass} clip" ${timing} data-track-index="${track}">
        <div class="card-inner">
          <div id="${b.id}-line" class="line${b.size === "hero" ? " hero" : ""}">${keyword(b.text, b.id)}${caret}</div>${b.sub ? `\n          <div class="sub">${esc(b.sub)}</div>` : ""}
        </div>
      </section>`);
  } else if (b.type === "tokens") {
    const toks = b.items.map((t) => `<span class="tok"><span class="chip">${icon(t.icon)}</span>${esc(t.label)}</span>`).join("\n            ");
    cards.push(`      <section id="${b.id}" class="card${bgClass} clip" ${timing} data-track-index="${track}">
        <div class="card-inner">
          <div id="${b.id}-row" class="tok-row">
            ${toks}
          </div>
        </div>
      </section>`);
  } else if (b.type === "tagline") {
    const words = b.words.map((w, i) => `<span id="${b.id}-w${i}" class="slot-word g">${esc(w)}</span>`).join("\n              ");
    const logo = b.lockup ? (b.lockup.logo || cfg.brand.logo) : null;
    if (logo && !exists(logo)) warnings.push(`lockup logo not found: ${logo}`);
    cards.push(`      <section id="${b.id}" class="card${bgClass} clip" ${timing} data-track-index="${track}">
        <div class="card-inner">
          <div id="${b.id}-line" class="tag-line">
            <span>${esc(b.prefix)}</span>
            <span id="${b.id}-slot" class="tag-slot">
              ${words}
            </span>
          </div>${b.lockup ? `
          <div class="tag-lockup">
            <img id="${b.id}-logo" class="tag-logo" src="${esc(logo)}" alt="${esc(cfg.brand.name)}" />
            <div id="${b.id}-url" class="tag-url">${esc(b.lockup.url || cfg.brand.url)}</div>
          </div>` : ""}
        </div>
      </section>`);
  } else if (b.type !== "leak") {
    throw new Error(`Unknown beat type ${b.type}`);
  }
}

// ---------------- audio ----------------
const audio = [];
let at = 10;
const addAudio = (a, id) => {
  if (!exists(a.src)) {
    warnings.push(`audio skipped, file not found: ${a.src} (run scripts/fetch-sfx.mjs or add the file)`);
    return;
  }
  audio.push(`      <audio id="${id}" src="${esc(a.src)}" data-start="${a.start}" data-duration="${a.duration}" data-track-index="${at++}" data-volume="${a.volume ?? 1}"></audio>`);
};
(cfg.audio?.sfx || []).forEach((a, i) => addAudio(a, `sfx-${i + 1}`));
if (cfg.audio?.music) addAudio(cfg.audio.music, "music");

// ---------------- fonts ----------------
const font = cfg.brand.font || "Poppins";
// font files follow the @fontsource naming: <slug>-latin-<weight>-normal.woff2 ("Open Sans" -> open-sans)
const fontSlug = font.toLowerCase().replace(/\s+/g, "-");
const fontFaces = [400, 500, 600, 700, 800]
  .map((w) => `assets/fonts/${fontSlug}-latin-${w}-normal.woff2`)
  .filter((f) => exists(f))
  .map((f) => `      @font-face { font-family: "${font}"; font-weight: ${f.match(/-(\d{3})-/)[1]}; src: url("${f}") format("woff2"); }`)
  .join("\n");
if (!fontFaces) warnings.push(`no font files for ${font} in assets/fonts (expected ${fontSlug}-latin-<weight>-normal.woff2)`);

// ---------------- index.html ----------------
const runtime = { width: cfg.width, height: cfg.height, plate: cfg.plate, beats: cfg.beats };
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${cfg.width}, height=${cfg.height}" />
    <!-- GENERATED by scripts/build.mjs from video.config.json. Edit the config, not this file. -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${fontFaces}
      :root {
        --ink: ${C.ink};
        --text: ${C.text};
        --kw-from: ${C.keywordFrom};
        --kw-to: ${C.keywordTo};
        --caret-from: ${C.caretFrom};
        --caret-to: ${C.caretTo};
        --chip-border: ${C.chipBorder};
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: var(--ink); }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "${font}", sans-serif; color: var(--text); background: var(--ink); }
      #bg-plate { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0; }
      .scene-slot { position: absolute; inset: 0; z-index: 2; }

      /* type cards */
      .card { position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; justify-content: center; background: var(--ink); }
      .card.on-gradient { background: transparent; }
      .card-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
      .line { position: relative; font-weight: 600; font-size: 120px; line-height: 1.1; letter-spacing: -0.03em; white-space: nowrap; text-align: center; }
      .line.hero { font-size: 212px; letter-spacing: -0.035em; line-height: 1.15; }
      .sub { margin-top: 26px; font-weight: 500; font-size: 36px; letter-spacing: -0.01em; color: rgba(255, 255, 255, 0.62); }
      /* gradient keyword; line-height > 1 on its box so descenders (p, g, y) are painted */
      .g {
        background-image: linear-gradient(90deg, var(--kw-from) 0%, var(--kw-to) 50%, var(--kw-from) 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        padding: 0 0.04em;
      }
      .ch { display: inline; white-space: pre; }
      .caret { position: absolute; left: 0; top: 0; width: 0.08em; height: 1.02em; border-radius: 0.04em; background: linear-gradient(180deg, var(--caret-from), var(--caret-to)); opacity: 0; }

      /* logo intro */
      .intro-stage { position: relative; display: grid; place-items: center; width: 100%; height: 100%; }
      .intro-logo, .intro-next { grid-area: 1 / 1; }
      .intro-logo { display: flex; align-items: center; gap: 34px; }
      .intro-mark { height: 151px; width: auto; display: block; }
      .intro-word { font-weight: 800; font-size: 136px; line-height: 1; }
      .intro-next { font-weight: 600; font-size: 150px; letter-spacing: -0.03em; line-height: 1.3; }

      /* token chips */
      .tok-row { display: flex; align-items: center; justify-content: center; gap: 34px; }
      .tok { display: flex; align-items: center; gap: 26px; height: 150px; padding: 0 46px 0 22px; border-radius: 999px; background: rgba(26, 11, 46, 0.9); border: 1px solid color-mix(in srgb, var(--chip-border) 40%, transparent); box-shadow: 0 0 60px color-mix(in srgb, var(--chip-border) 25%, transparent); font-weight: 600; font-size: 84px; letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }
      .chip { display: flex; align-items: center; justify-content: center; width: 108px; height: 108px; flex: none; border-radius: 26%; background: #12062a; border: 1px solid color-mix(in srgb, var(--chip-border) 60%, transparent); }
      .chip svg { width: 56%; height: 56%; display: block; }

      /* tagline */
      .tag-line { display: flex; align-items: center; justify-content: center; gap: 0.26em; font-weight: 600; font-size: 92px; letter-spacing: -0.03em; white-space: nowrap; }
      .tag-slot { position: relative; display: block; height: 1.25em; }
      .slot-word { display: block; line-height: 1.25; }
      .tag-lockup { display: flex; flex-direction: column; align-items: center; gap: 22px; margin-top: 56px; }
      .tag-logo { height: 76px; width: auto; display: block; }
      .tag-url { font-weight: 500; font-size: 34px; color: rgba(255, 255, 255, 0.78); }

      /* overlays */
      #leak { position: absolute; inset: -20% -40%; z-index: 8; pointer-events: none; opacity: 0;
        background: radial-gradient(34% 70% at 50% 50%, rgba(255, 250, 252, 1), rgba(255, 224, 240, 0.85) 38%, rgba(242, 192, 221, 0) 74%),
          radial-gradient(30% 50% at 30% 60%, rgba(254, 247, 205, 0.6), rgba(254, 247, 205, 0) 70%); }
      #fade-black { position: absolute; inset: 0; z-index: 9; background: #000; opacity: 0; pointer-events: none; }
      #vignette { position: absolute; inset: 0; z-index: 10; pointer-events: none; background: radial-gradient(120% 120% at 50% 45%, rgba(0, 0, 0, 0) 55%, rgba(5, 0, 12, 0.45) 100%); }
    </style>
    <script src="lib/fx.js"></script>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-width="${cfg.width}" data-height="${cfg.height}" data-duration="${cfg.duration}" data-fps="${cfg.fps}">
      <canvas id="bg-plate"></canvas>
      <svg width="0" height="0" style="position: absolute" aria-hidden="true">
        <defs>
          ${filters.join("\n          ")}
          <linearGradient id="chip-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.caretFrom}" /><stop offset="1" stop-color="${C.keywordTo}" /></linearGradient>
        </defs>
      </svg>

      <!-- scenes (sub-compositions) -->
${slots.join("\n")}

      <!-- type cards -->
${cards.join("\n\n")}

      <!-- overlays -->
      <div id="leak"></div>
      <div id="fade-black"></div>
      <div id="vignette"></div>

      <!-- audio -->
${audio.join("\n")}
    </div>

    <script>
      window.VIDEO = ${JSON.stringify(runtime)};
    </script>
    <script>
      // inlined from lib/cards.js (HyperFrames lint expects the window.__timelines registration in this file)
${fs.readFileSync(path.join(dir, "lib", "cards.js"), "utf8").replace(/^/gm, "      ").trimEnd()}
    </script>
    <script type="importmap">
      { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js" } }
    </script>
    <script type="module" src="lib/plate.js"></script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, "index.html"), html);

// ---------------- templated compositions ----------------
const fill = (tpl) =>
  tpl.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    if (key.startsWith("img.")) {
      // images are optional: fall back to a soft gradient placeholder
      const rel = cfg.montage?.images?.[key.slice(4)];
      if (exists(rel)) return `<img src="${esc(rel)}" alt="" />`;
      warnings.push(`montage image missing (${key}): using a placeholder`);
      return `<div class="m-ph"></div>`;
    }
    if (key === "pills") return JSON.stringify(cfg.pills || []);
    if (key === "pillsHighlight") return JSON.stringify(cfg.pillsHighlight || []);
    const v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), { brand: cfg.brand, montage: cfg.montage, cfg });
    if (v == null) {
      warnings.push(`template value missing: {{${key}}}`);
      return "";
    }
    return esc(v);
  });
// scene-templates/*.tpl.html -> compositions/*.html (templates live outside compositions/ so
// HyperFrames lint never sees the raw {{placeholders}})
const tplDir = path.join(dir, "scene-templates");
const compDir = path.join(dir, "compositions");
fs.mkdirSync(compDir, { recursive: true });
if (fs.existsSync(tplDir)) {
  for (const f of fs.readdirSync(tplDir).filter((f) => f.endsWith(".tpl.html"))) {
    fs.writeFileSync(path.join(compDir, f.replace(".tpl.html", ".html")), fill(fs.readFileSync(path.join(tplDir, f), "utf8")));
  }
}

console.log(`built ${path.join(dir, "index.html")}: ${cfg.beats.length} beats, ${slots.length} scenes, ${audio.length} audio clips, ${cfg.duration}s`);
for (const w of warnings) console.log("  warn:", w);
