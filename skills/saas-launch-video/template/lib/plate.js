// Three.js mesh-gradient plate: one full-frame shader quad behind everything.
// Colours and the colour arc come from window.VIDEO (written by scripts/build.mjs from
// video.config.json). Rendering is a pure function of HyperFrames time (hf-seek).
import * as THREE from "three";

const cfg = window.VIDEO.plate;
const W = window.VIDEO.width;
const H = window.VIDEO.height;

const canvas = document.getElementById("bg-plate");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const col = (hex) => new THREE.Color(hex);
const uniforms = {
  uTime: { value: 0 },
  uRes: { value: new THREE.Vector2(W, H) },
  uRise: { value: 0 },
  uGlow: { value: 1 },
  uHeat: { value: 0 },
  uInk: { value: col(cfg.colors.ink) },
  uDeep: { value: col(cfg.colors.deep) },
  uA: { value: col(cfg.colors.a) },
  uB: { value: col(cfg.colors.b) },
  uC: { value: col(cfg.colors.c) },
  uD: { value: col(cfg.colors.d) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime, uRise, uGlow, uHeat;
    uniform vec2 uRes;
    uniform vec3 uInk, uDeep, uA, uB, uC, uD;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    void blob(vec2 p, vec2 c, float r, vec3 col, float k, inout vec3 acc, inout float ws) {
      float d = length(p - c);
      float w = k * exp(-d * d / (r * r));
      acc += col * w;
      ws += w;
    }
    void main() {
      float t = uTime;
      vec2 uv = vUv;
      vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y);
      // soft domain warp so the blobs never read as circles
      p += 0.09 * vec2(noise(p * 1.4 + vec2(t * 0.05, 0.0)), noise(p * 1.4 + vec2(3.7, -t * 0.045))) - 0.045;
      // composition: top-left stays dark, colour pools bottom-right; blobs drift slowly
      vec3 acc = uDeep * 0.55;
      float ws = 0.55;
      blob(p, vec2(0.25 + 0.03 * sin(t * 0.11), 0.92), 0.62, uDeep, 1.6, acc, ws);
      blob(p, vec2(0.85 + 0.05 * cos(t * 0.13), 0.70), 0.42, uDeep, 0.9, acc, ws);
      blob(p, vec2(1.18 + 0.07 * sin(t * 0.21), 0.52 + 0.05 * cos(t * 0.17)), 0.46, uA, 1.0, acc, ws);
      blob(p, vec2(0.78 + 0.06 * cos(t * 0.19), 0.10 + 0.04 * sin(t * 0.23)), 0.42, uB, 1.0, acc, ws);
      blob(p, vec2(1.50 + 0.05 * sin(t * 0.15 + 1.0), 0.20 + 0.05 * cos(t * 0.20)), 0.36, uC, 1.0 + 0.4 * uHeat, acc, ws);
      blob(p, vec2(1.70 + 0.03 * cos(t * 0.25), 0.04 + 0.02 * sin(t * 0.3)), 0.17, uD, 0.9 + 0.5 * uHeat, acc, ws);
      vec3 c = acc / ws;
      // colour arc: ink cards with the gradient rising from the bottom like a glow
      float rise = 1.0 - smoothstep(uGlow * 0.15, max(uGlow, 0.0001), uv.y);
      c = mix(c, mix(uInk, c, rise), uRise);
      // fine grain, re-seeded per frame from time (deterministic)
      c += (hash(floor(uv * uRes) + floor(t * 30.0) * 17.0) - 0.5) * 0.028;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

// Colour arc: piecewise segments from the config, each easing rise/glow/heat between two values.
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const lerp = (pair, k) => (Array.isArray(pair) ? pair[0] + (pair[1] - pair[0]) * k : pair);
function arc(t) {
  for (const s of cfg.arc) {
    if (t >= s.start && t < s.end) {
      const k = smooth(s.start, s.start + (s.ease || s.end - s.start), t);
      return { rise: lerp(s.rise, k), glow: lerp(s.glow, k), heat: lerp(s.heat || 0, k) };
    }
  }
  return { rise: 0, glow: 1, heat: 0 };
}

function renderAt(time) {
  const a = arc(time);
  uniforms.uTime.value = time;
  uniforms.uRise.value = a.rise;
  uniforms.uGlow.value = a.glow;
  uniforms.uHeat.value = a.heat;
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
