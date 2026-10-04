// Cinematic 3D stage for HyperFrames: a device (laptop / phone) or a field of floating UI panels,
// filmed by a keyframed camera. Screens are images (PNG/WebP), typically the real UI rebuilt in
// HTML and frozen with `npx hyperframes render --format png-sequence` or snapshot. Rendering is a
// pure function of HyperFrames time (hf-seek), so it is deterministic.
//
// Usage (inside a composition, after an importmap that maps "three" and "three/addons/"):
//   import { createStage } from "./lib/three-stage.js";   // path relative to the project root
//   createStage({
//     canvas: document.getElementById("stage"),                   // keys are scene-local; the slot start is auto-detected
//     mode: "laptop",                                             // "laptop" | "phone" | "panels"
//     screens: [{ t: 0, src: "assets/ui/home.png" }, { t: 2.4, src: "assets/ui/result.png" }],
//     panels: [{ src: "assets/ui/a.png", pos: [-2, 0.4, -1], rot: [0, 0.3, 0], w: 3.2 }],   // mode "panels"
//     camera: [{ t: 0, pos: [0, 1.2, 7], look: [0, 0.6, 0], fov: 32 }, { t: 3, pos: [1.4, 1, 4.2], look: [0, 0.8, 0] }],
//     spin: [{ t: 0, y: -0.35 }, { t: 3, y: 0.1 }],                 // optional device rotation keys
//     colors: { body: "#c9ccd3", accent: "#3b5bfd" }, background: null,  // null = transparent canvas
//   });
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const smooth = (k) => k * k * (3 - 2 * k);

// Interpolate a list of {t, ...} keys at time t (smoothstep between neighbours).
function sample(keys, t, field, fallback) {
  const ks = keys.filter((k) => k[field] !== undefined);
  if (!ks.length) return fallback;
  if (t <= ks[0].t) return ks[0][field];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b.t) {
      const k = smooth((t - a.t) / (b.t - a.t));
      return Array.isArray(a[field]) ? a[field].map((v, j) => v + (b[field][j] - v) * k) : a[field] + (b[field] - a[field]) * k;
    }
  }
  return ks[ks.length - 1][field];
}

export function createStage(o) {
  const canvas = o.canvas;
  const W = o.width || 1920, H = o.height || 1080;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !o.background, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (o.background) renderer.setClearColor(o.background, 1);
  else renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 100);
  const loader = new THREE.TextureLoader(); // goes through DefaultLoadingManager, so render waits for it
  const tex = (src) => {
    const t = loader.load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const colors = Object.assign({ body: "#c9ccd3", bezel: "#0b0b0f", accent: "#3b5bfd" }, o.colors || {});
  const metal = new THREE.MeshPhysicalMaterial({ color: colors.body, metalness: 0.85, roughness: 0.35, clearcoat: 0.4 });
  const bezel = new THREE.MeshStandardMaterial({ color: colors.bezel, roughness: 0.6 });
  const rig = new THREE.Group();
  scene.add(rig);

  // ---- screens ----
  const screenKeys = (o.screens || []).map((s) => ({ t: s.t, map: tex(s.src) }));
  const screenMat = new THREE.MeshBasicMaterial({ map: screenKeys[0]?.map || null, toneMapped: false });

  if (o.mode === "laptop") {
    const base = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.12, 2.3, 4, 0.06), metal);
    base.position.set(0, 0.06, 0.9);
    const lid = new THREE.Group();
    lid.position.set(0, 0.12, -0.2);
    lid.rotation.x = -0.18;
    const shell = new THREE.Mesh(new RoundedBoxGeometry(3.4, 2.2, 0.08, 4, 0.05), metal);
    shell.position.set(0, 1.1, -0.04);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.1), bezel);
    face.position.set(0, 1.1, 0.002);
    // screen keeps the image aspect (default 1600x940, the UI rig window) so nothing stretches
    const aspect = o.screenAspect || 1600 / 940;
    const sw = Math.min(3.12, 1.95 * aspect), sh = sw / aspect;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), screenMat);
    screen.position.set(0, 1.12, 0.004);
    lid.add(shell, face, screen);
    rig.add(base, lid);
  } else if (o.mode === "phone") {
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.0, 2.05, 0.1, 6, 0.14), metal);
    const face = new THREE.Mesh(new RoundedBoxGeometry(0.96, 2.01, 0.02, 6, 0.12), bezel);
    face.position.z = 0.045;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.94), screenMat);
    screen.position.z = 0.058;
    rig.add(body, face, screen);
    rig.position.y = 1.0;
  } else if (o.mode === "panels") {
    // floating UI panels in depth: each a textured card with a soft accent edge
    for (const p of o.panels || []) {
      const map = tex(p.src);
      const w = p.w || 3, h = p.h || w * 0.625;
      const card = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.03, 4, 0.04), [
        new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 }),
        new THREE.MeshBasicMaterial({ map, toneMapped: false }),
        new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.6 }),
      ]);
      card.position.set(...(p.pos || [0, 0, 0]));
      card.rotation.set(...(p.rot || [0, 0, 0]));
      rig.add(card);
    }
  }

  const camKeys = o.camera || [{ t: 0, pos: [0, 1.2, 7], look: [0, 0.8, 0], fov: 32 }];
  const spinKeys = o.spin || [];
  // hf-seek carries ROOT time. Keys are scene-local, so subtract the start of every timed
  // ancestor (each data-start is relative to its parent, so they add up) unless o.start is given.
  let t0 = o.start;
  if (t0 === undefined) {
    t0 = 0;
    for (let el = canvas.parentElement; el; el = el.parentElement) {
      if (el.getAttribute && el.getAttribute("data-start") !== null) t0 += parseFloat(el.getAttribute("data-start")) || 0;
    }
  }
  if (o.debug) console.log("[three-stage] scene start", t0);
  function renderAt(time) {
    const t = time - t0;
    const pos = sample(camKeys, t, "pos", [0, 1, 7]);
    const look = sample(camKeys, t, "look", [0, 0.8, 0]);
    camera.fov = sample(camKeys, t, "fov", 32);
    camera.updateProjectionMatrix();
    camera.position.set(...pos);
    camera.lookAt(...look);
    rig.rotation.y = sample(spinKeys, t, "y", 0);
    rig.rotation.x = sample(spinKeys, t, "x", 0);
    // screen swaps are hard cuts at their key time
    for (let i = screenKeys.length - 1; i >= 0; i--) {
      if (t >= screenKeys[i].t) {
        screenMat.map = screenKeys[i].map;
        break;
      }
    }
    renderer.render(scene, camera);
  }
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  return { scene, camera, rig, renderAt };
}
