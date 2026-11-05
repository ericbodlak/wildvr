import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// ============================================================================
// 1. PROCEDURAL TEXTURE, BUMP MAP & SHADER RAMP SYNTHESIZER (Zero External Deps)
// ============================================================================
function makeCanvasTex(size, drawFn, repeat = [2, 2], nearest = false) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  if (nearest) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
  }
  return tex;
}

function makeToonGradientMap(steps = 4) {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = Math.round(65 + (190 * i) / (steps - 1));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const PROC_TEXTURES = {
  toonRamp4: makeToonGradientMap(4),
  furWeave: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const x = (i * 73) % s;
      const y = (i * 41) % s;
      const shade = 120 + (i % 115);
      ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 3, y + 8, x - 3, y + 15, x + 1, y + 22);
      ctx.stroke();
    }
  }, [4, 4]),
  smilodonSpots: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1400; i++) {
      const x = (i * 89) % s;
      const y = (i * 53) % s;
      ctx.fillStyle = i % 2 === 0 ? '#e8e8e8' : '#bcbcbc';
      ctx.fillRect(x, y, 2, 10);
    }
    ctx.fillStyle = '#787878';
    for (let r = 0; r < 64; r++) {
      const rx = (r * 97 + 19) % (s - 16) + 8;
      const ry = (r * 61 + 11) % (s - 16) + 8;
      ctx.beginPath();
      ctx.arc(rx, ry, 5 + (r % 5), 0, Math.PI * 2);
      ctx.fill();
    }
  }, [3, 3]),
  barkFurrow: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#a8a8a8';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 6) {
      const v = 90 + ((x * 29) % 130);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 5, s);
      ctx.fillStyle = '#484848';
      ctx.fillRect(x, 0, 1.5, s);
    }
    for (let i = 0; i < 420; i++) {
      const kx = (i * 67) % s;
      const ky = (i * 113) % s;
      ctx.fillStyle = i % 2 === 0 ? '#d8d8d8' : '#666666';
      ctx.fillRect(kx, ky, 4, 24);
    }
  }, [3, 5]),
  rockStrata: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#b5b5b5';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) {
      const v = 110 + ((y * 37) % 115);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, s, 8);
    }
    for (let i = 0; i < 1200; i++) {
      const rx = (i * 59) % s;
      const ry = (i * 83) % s;
      const g = 85 + (i % 140);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(rx, ry, 6 + (i % 9), 3 + (i % 4));
    }
  }, [4, 4]),
  meadowGrass: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#c2c2c2';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i++) {
      const gx = (i * 47) % s;
      const gy = (i * 79) % s;
      const v = 135 + (i % 95);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(gx, gy, 2, 7);
    }
  }, [10, 10]),
  crossHatchInk: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#f2efe9';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 1.1;
    for (let i = -s; i < s * 2; i += 9) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();
      if (i % 18 === 0) {
        ctx.beginPath();
        ctx.moveTo(i + s, 0);
        ctx.lineTo(i, s);
        ctx.stroke();
      }
    }
  }, [6, 6]),
  clayRake: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? '#dcdcdc' : '#adadad';
      ctx.fillRect(0, y, s, 2);
    }
  }, [6, 6]),
  voxelPixel: makeCanvasTex(16, (ctx, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = 155 + (((x * 17 + y * 31) % 7) - 3) * 18;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [8, 8], true),
  paperGrain: makeCanvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3000; i++) {
      const px = (i * 53) % s;
      const py = (i * 97) % s;
      const v = 185 + (i % 55);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(px, py, 3, 2);
    }
  }, [5, 5])
};

// ============================================================================
// 2. GEOMETRIC LOD TIERS & 10 SHADER / RENDERING ARCHITECTURES
// ============================================================================
const LOD_TIERS = [
  { id: 0, key: '0', label: 'LOD 0: Low-Poly Blockout (~1.5k tris)', short: 'LOD 0 (Low-Poly)', segMul: 0.35, furShells: 0, antlerTines: 2, foliageClusters: 4, displace: 0.0 },
  { id: 1, key: '1', label: 'LOD 1: Sculpted Mid-Poly (~12k tris)', short: 'LOD 1 (Mid-Poly)', segMul: 1.0, furShells: 6, antlerTines: 7, foliageClusters: 11, displace: 0.35 },
  { id: 2, key: '2', label: 'LOD 2: High-Poly Organic + Fur/Bark (~48k tris)', short: 'LOD 2 (High-Poly)', segMul: 1.85, furShells: 18, antlerTines: 14, foliageClusters: 22, displace: 1.0 },
  { id: 3, key: '3', label: 'LOD 3: Ultra-Dense Hero Spec (~115k tris)', short: 'LOD 3 (Ultra Hero)', segMul: 2.8, furShells: 34, antlerTines: 22, foliageClusters: 36, displace: 1.35 }
];

const STYLES = [
  {
    name: "1/10: Textured Organic PBR (Fur, Bark & Strata Bump)",
    pipeline: "textured_pbr", flat: false, outlines: false, wireframe: false, bumpScale: 0.14, fogDensity: 0.006,
    sky: "#bfe8ff", sunColor: "#fff6cc", sunIntensity: 2.0, hemiSky: "#90e0ef", hemiGround: "#3a5a40",
    terrain: "#4c956c", cliff: "#7f8c8d", trail: "#c69769", water: "#0077b6", waterRough: 0.12,
    trunk: "#6f4e37", foliage1: "#2d6a4f", foliage2: "#40916c", rock: "#6c757d",
    mammothFur: "#6f4518", tusk: "#f8f5e6", elkCoat: "#8d5b3c", smilodonCoat: "#ddb867",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.62, metalness: 0.04
  },
  {
    name: "2/10: Wet Photorealistic Nature (Micro-Bump & Clearcoat)",
    pipeline: "wet_realism", flat: false, outlines: false, wireframe: false, bumpScale: 0.24, fogDensity: 0.009,
    sky: "#cfe2f3", sunColor: "#ffe8a3", sunIntensity: 2.35, hemiSky: "#a2d2ff", hemiGround: "#1b4332",
    terrain: "#386641", cliff: "#525e6c", trail: "#8c6d53", water: "#023e8a", waterRough: 0.03,
    trunk: "#433228", foliage1: "#1b4332", foliage2: "#2d6a4f", rock: "#495057",
    mammothFur: "#542e12", tusk: "#fefae0", elkCoat: "#774926", smilodonCoat: "#c99b52",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.36, metalness: 0.12
  },
  {
    name: "3/10: Cel-Shaded Anime / Ghibli (4-Band Toon + Ink Lines)",
    pipeline: "toon_cel", flat: false, outlines: true, outlineColor: 0x111827, wireframe: false, bumpScale: 0.0, fogDensity: 0.004,
    sky: "#98f5e1", sunColor: "#ffffff", sunIntensity: 1.85, hemiSky: "#caf0f8", hemiGround: "#52b788",
    terrain: "#52b788", cliff: "#94a3b8", trail: "#f4a261", water: "#00b4d8", waterRough: 0.2,
    trunk: "#7f5539", foliage1: "#2a9d8f", foliage2: "#74c69d", rock: "#8d99ae",
    mammothFur: "#8a5a44", tusk: "#ffffff", elkCoat: "#b07d62", smilodonCoat: "#ffb703",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.85, metalness: 0.0
  },
  {
    name: "4/10: Pen, Ink & Cross-Hatch Botanical Illustration",
    pipeline: "ink_hatch", flat: false, outlines: true, outlineColor: 0x1e1b18, wireframe: false, bumpScale: 0.08, fogDensity: 0.005,
    sky: "#f4f1de", sunColor: "#fffdf7", sunIntensity: 1.65, hemiSky: "#f4f1de", hemiGround: "#a3b18a",
    terrain: "#a3b18a", cliff: "#b7b7a4", trail: "#e6ccb2", water: "#72a0c1", waterRough: 0.45,
    trunk: "#7f5539", foliage1: "#588157", foliage2: "#84a98c", rock: "#a5a58d",
    mammothFur: "#9c6644", tusk: "#faf9f6", elkCoat: "#b08968", smilodonCoat: "#e9c46a",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.92, metalness: 0.0
  },
  {
    name: "5/10: Sculptor's Clay & Terracotta Maquette (ZBrush Study)",
    pipeline: "clay_sculpt", flat: false, outlines: false, wireframe: false, bumpScale: 0.16, fogDensity: 0.005,
    sky: "#2b2d42", sunColor: "#ffd6a5", sunIntensity: 2.2, hemiSky: "#8d99ae", hemiGround: "#3d2c2e",
    terrain: "#b5836d", cliff: "#9e6b55", trail: "#c99b84", water: "#6c757d", waterRough: 0.35,
    trunk: "#a87660", foliage1: "#c28f79", foliage2: "#b07d67", rock: "#8f5e49",
    mammothFur: "#c88d74", tusk: "#eddcd2", elkCoat: "#c88d74", smilodonCoat: "#d49b82",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.58, metalness: 0.06
  },
  {
    name: "6/10: Golden Hour Velvet & Rim-Lit Subsurface Sheen",
    pipeline: "golden_velvet", flat: false, outlines: false, wireframe: false, bumpScale: 0.15, fogDensity: 0.011,
    sky: "#f4a261", sunColor: "#ff7b00", sunIntensity: 2.45, hemiSky: "#e76f51", hemiGround: "#2b2d42",
    terrain: "#9c6644", cliff: "#6d597a", trail: "#e07a5f", water: "#2a9d8f", waterRough: 0.1,
    trunk: "#4a3531", foliage1: "#264653", foliage2: "#e76f51", rock: "#5a4e69",
    mammothFur: "#5c2c16", tusk: "#ffe8d6", elkCoat: "#8d5524", smilodonCoat: "#f4a261",
    emissiveFlora: "#3d1e10", emissiveFauna: "#4a2010", emissiveStrength: 0.22, roughness: 0.48, metalness: 0.05
  },
  {
    name: "7/10: Retro Voxel / Pixel-Craft (16x16 Nearest Block Tex)",
    pipeline: "voxel_craft", flat: true, outlines: false, wireframe: false, bumpScale: 0.04, fogDensity: 0.007,
    sky: "#7ec8ff", sunColor: "#ffffff", sunIntensity: 1.8, hemiSky: "#a8dadc", hemiGround: "#457b9d",
    terrain: "#57cc99", cliff: "#8d99ae", trail: "#d4a373", water: "#0096c7", waterRough: 0.3,
    trunk: "#7f5539", foliage1: "#38a3a5", foliage2: "#57cc99", rock: "#6c757d",
    mammothFur: "#7f4f24", tusk: "#ffffff", elkCoat: "#9c6644", smilodonCoat: "#ffbe0b",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.88, metalness: 0.0
  },
  {
    name: "8/10: Folded Origami & Cardstock Papercraft (Faceted Grain)",
    pipeline: "papercraft", flat: true, outlines: true, outlineColor: 0xffffff, wireframe: false, bumpScale: 0.11, fogDensity: 0.006,
    sky: "#e0fbfc", sunColor: "#fff1e6", sunIntensity: 1.85, hemiSky: "#98c1d9", hemiGround: "#3d5a80",
    terrain: "#81b29a", cliff: "#98c1d9", trail: "#f2cc8f", water: "#3d5a80", waterRough: 0.5,
    trunk: "#e07a5f", foliage1: "#3d5a80", foliage2: "#81b29a", rock: "#adb5bd",
    mammothFur: "#e07a5f", tusk: "#ffffff", elkCoat: "#f4a261", smilodonCoat: "#f2cc8f",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.9, metalness: 0.0
  },
  {
    name: "9/10: Tech-Art Topology & Wireframe Mesh Inspector",
    pipeline: "wireframe_inspector", flat: false, outlines: false, wireframe: true, bumpScale: 0.05, fogDensity: 0.004,
    sky: "#0b132b", sunColor: "#e0fbfc", sunIntensity: 1.9, hemiSky: "#3a506b", hemiGround: "#1c2541",
    terrain: "#1c2541", cliff: "#253256", trail: "#3a506b", water: "#0077b6", waterRough: 0.2,
    trunk: "#2b3a67", foliage1: "#1b4332", foliage2: "#2d6a4f", rock: "#334155",
    mammothFur: "#3a506b", tusk: "#5bc0be", elkCoat: "#3a506b", smilodonCoat: "#4ea8de",
    emissiveFlora: "#000000", emissiveFauna: "#000000", emissiveStrength: 0.0, roughness: 0.5, metalness: 0.15
  },
  {
    name: "10/10: Bioluminescent Twilight Shader (Glow Veins & Aurora)",
    pipeline: "biolum_shader", flat: false, outlines: true, outlineColor: 0x00f5d4, wireframe: false, bumpScale: 0.18, fogDensity: 0.012,
    sky: "#090418", sunColor: "#c77dff", sunIntensity: 1.35, hemiSky: "#7b2cbf", hemiGround: "#10002b",
    terrain: "#1b0638", cliff: "#2d0b59", trail: "#481487", water: "#00f5d4", waterRough: 0.05,
    trunk: "#15042c", foliage1: "#00bbf9", foliage2: "#f15bb5", rock: "#3c096c",
    mammothFur: "#5a189a", tusk: "#00f5d4", elkCoat: "#9b5de5", smilodonCoat: "#fee440",
    emissiveFlora: "#00f5d4", emissiveFauna: "#ff4d6d", emissiveStrength: 0.55, roughness: 0.32, metalness: 0.22
  }
];

// ============================================================================
// 3. SCENE, RENDERER, LIGHTS & MULTI-PIPELINE SHADER/MATERIAL ENGINE
// ============================================================================
let currentStyleIdx = 0;
let currentLodIdx = 2; // Default to LOD 2: High-Poly Sculpted Organic + Fur/Bark Detail!
let comparisonMode = 'none'; // 'none' | 'compare_lods' | 'compare_styles'
let forceFlyMode = false;
let isDollhouse = false;
let desktopThumbsUp = false;
let desktopFlyHoldSec = 0.0;
let desktopSkyFlightLatched = false;
let activeSceneTriangles = 0;

const FLY_LAUNCH_DELAY_SEC = 1.8;
const FLY_PITCH_THRESHOLD_DEG = 55.0;
const FLY_SPEED = 6.2;
const TELEPORT_SPEED = 9.5;
const GRAVITY = 9.81;

let yaw = 0;
let pitch = -0.06;
const eyeHeight = 1.68;
const keys = {};
let isDraggingLook = false;
let isAimingTeleport = false;
let lastMouseX = 0;
let lastMouseY = 0;
let validTeleportTarget = null;

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

const xrOrigin = new THREE.Group();
xrOrigin.position.set(0, 0, 10.5);
scene.add(xrOrigin);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.08, 320);
camera.position.set(0, eyeHeight, 0);
xrOrigin.add(camera);

const hemiLight = new THREE.HemisphereLight(0x90e0ef, 0x3a5a40, 0.95);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff6cc, 2.0);
sunLight.position.set(18, 28, 14);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0004;
const d = 28;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x90e0ef, 0.65);
rimLight.position.set(-16, 14, -18);
scene.add(rimLight);

const materials = {
  terrain: new THREE.MeshStandardMaterial({ roughness: 0.75 }),
  cliff: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
  trail: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
  water: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.88, roughness: 0.1 }),
  trunk: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
  foliage1: new THREE.MeshStandardMaterial({ roughness: 0.65 }),
  foliage2: new THREE.MeshStandardMaterial({ roughness: 0.65 }),
  rock: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
  mammothFur: new THREE.MeshStandardMaterial({ roughness: 0.68 }),
  tusk: new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.08 }),
  elkCoat: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  smilodonCoat: new THREE.MeshStandardMaterial({ roughness: 0.58 }),
  eyeGloss: new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.08, metalness: 0.2 }),
  handSkin: new THREE.MeshStandardMaterial({ color: 0xe6ccb2, roughness: 0.65 }),
  wristRing: new THREE.MeshBasicMaterial({ color: 0x52b788 })
};

let outlineMeshes = [];
let wireframeMeshes = [];
const outlineMat = new THREE.LineBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.82 });
const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.58 });

function getTexturesForPipeline(pipeline, key) {
  if (pipeline === 'toon_cel' || pipeline === 'wireframe_inspector') {
    return { map: null, bump: null };
  }
  if (pipeline === 'ink_hatch') {
    return { map: PROC_TEXTURES.crossHatchInk, bump: PROC_TEXTURES.crossHatchInk };
  }
  if (pipeline === 'clay_sculpt') {
    return { map: PROC_TEXTURES.clayRake, bump: PROC_TEXTURES.clayRake };
  }
  if (pipeline === 'voxel_craft') {
    return { map: PROC_TEXTURES.voxelPixel, bump: PROC_TEXTURES.voxelPixel };
  }
  if (pipeline === 'papercraft') {
    return { map: PROC_TEXTURES.paperGrain, bump: PROC_TEXTURES.paperGrain };
  }
  // Default organic textured pipelines ('textured_pbr', 'wet_realism', 'golden_velvet', 'biolum_shader')
  if (key === 'mammothFur' || key === 'elkCoat') return { map: PROC_TEXTURES.furWeave, bump: PROC_TEXTURES.furWeave };
  if (key === 'smilodonCoat') return { map: PROC_TEXTURES.smilodonSpots, bump: PROC_TEXTURES.furWeave };
  if (key === 'trunk') return { map: PROC_TEXTURES.barkFurrow, bump: PROC_TEXTURES.barkFurrow };
  if (key === 'cliff' || key === 'rock') return { map: PROC_TEXTURES.rockStrata, bump: PROC_TEXTURES.rockStrata };
  if (key === 'terrain' || key === 'foliage1' || key === 'foliage2') return { map: PROC_TEXTURES.meadowGrass, bump: PROC_TEXTURES.meadowGrass };
  if (key === 'trail') return { map: PROC_TEXTURES.paperGrain, bump: PROC_TEXTURES.paperGrain };
  if (key === 'water') return { map: null, bump: PROC_TEXTURES.furWeave };
  return { map: null, bump: null };
}

function applyStyle(idx) {
  currentStyleIdx = (idx + STYLES.length) % STYLES.length;
  const s = STYLES[currentStyleIdx];

  const keysToSet = ['terrain', 'cliff', 'trail', 'water', 'trunk', 'foliage1', 'foliage2', 'rock', 'mammothFur', 'tusk', 'elkCoat', 'smilodonCoat'];
  keysToSet.forEach((k) => {
    const m = materials[k];
    const texPair = getTexturesForPipeline(s.pipeline, k);
    m.color.set(s[k]);
    m.map = texPair.map;
    m.bumpMap = texPair.bump;
    m.bumpScale = k === 'tusk' ? s.bumpScale * 0.25 : s.bumpScale;
    m.flatShading = Boolean(s.flat);
    m.roughness = k === 'water' ? s.waterRough : (k === 'tusk' ? Math.min(0.25, s.roughness) : s.roughness);
    m.metalness = s.metalness;
    if (k === 'foliage1' || k === 'foliage2') {
      m.emissive.set(s.emissiveFlora);
      m.emissiveIntensity = s.emissiveStrength;
    } else if (k === 'mammothFur' || k === 'elkCoat' || k === 'smilodonCoat') {
      m.emissive.set(s.emissiveFauna);
      m.emissiveIntensity = s.emissiveStrength;
    } else {
      m.emissive.set('#000000');
      m.emissiveIntensity = 0;
    }
    m.needsUpdate = true;
  });

  outlineMat.color.setHex(s.outlineColor !== undefined ? s.outlineColor : 0x111827);
  outlineMeshes.forEach((line) => { line.visible = Boolean(s.outlines); });
  wireframeMeshes.forEach((wf) => { wf.visible = Boolean(s.wireframe); });

  scene.background = new THREE.Color(s.sky);
  scene.fog = new THREE.FogExp2(s.sky, s.fogDensity);
  sunLight.color.set(s.sunColor);
  sunLight.intensity = s.sunIntensity;
  hemiLight.color.set(s.hemiSky);
  hemiLight.groundColor.set(s.hemiGround);
  rimLight.intensity = s.pipeline === 'golden_velvet' || s.pipeline === 'clay_sculpt' ? 1.25 : 0.65;

  const styleBadge = document.getElementById('style-badge');
  if (styleBadge) styleBadge.textContent = `Style ${s.name}`;
  const selectStyle = document.getElementById('select-style');
  if (selectStyle) selectStyle.value = String(currentStyleIdx);
}

// ============================================================================
// 4. ARTICULATED 3D HAND, QUEST 3 RIG & ORGANIC GEOMETRY DISPLACEMENT HELPERS
// ============================================================================
const handGroup = new THREE.Group();
const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.026, 0.085), materials.handSkin);
handGroup.add(palmMesh);

const wristRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.032, 24), materials.wristRing);
wristRingMesh.rotation.x = -Math.PI / 2;
wristRingMesh.position.set(0, 0.016, 0.02);
handGroup.add(wristRingMesh);

const fingerThumbPivot = new THREE.Group();
fingerThumbPivot.position.set(-0.042, 0.005, -0.015);
const thumbBone = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.058, 0.018), materials.handSkin);
thumbBone.position.set(0, 0.028, 0);
fingerThumbPivot.add(thumbBone);
handGroup.add(fingerThumbPivot);

function mkFinger(xOffset, len) {
  const pivot = new THREE.Group();
  pivot.position.set(xOffset, 0, -0.042);
  const bone = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, len), materials.handSkin);
  bone.position.set(0, 0, -len * 0.5);
  pivot.add(bone);
  handGroup.add(pivot);
  return pivot;
}
const fingerIndex = mkFinger(-0.024, 0.068);
const fingerMiddle = mkFinger(-0.008, 0.072);
const fingerRing = mkFinger(0.008, 0.064);
const fingerPinky = mkFinger(0.024, 0.052);

const xrControllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
let activeController = xrControllers[0];
let vrWasAimingTeleport = false;
let vrSkyFlightLatched = false;
let vrFlyHoldSec = 0.0;
let vrThumbsUpActive = false;
let prevThumbsUpState = false;
let snapTurnCooldown = 0.0;
let prevBtnA = false;
let prevBtnB = false;
const tempQuat = new THREE.Quaternion();

xrControllers.forEach((ctrl, idx) => {
  xrOrigin.add(ctrl);
  ctrl.addEventListener('connected', (e) => {
    ctrl.userData.handedness = (e.data && e.data.handedness) || (idx === 0 ? 'right' : 'left');
    ctrl.userData.inputSource = e.data;
    activeController = ctrl;
    fingerThumbPivot.position.x = ctrl.userData.handedness === 'left' ? 0.042 : -0.042;
    ctrl.add(handGroup);
  });
  ctrl.addEventListener('squeezestart', () => { ctrl.userData.squeezeHeld = true; });
  ctrl.addEventListener('squeezeend', () => { ctrl.userData.squeezeHeld = false; });
});

function pulseHaptics(inputSource, intensity = 0.85, durationMs = 160) {
  if (!inputSource || !inputSource.gamepad) return;
  const actuators = inputSource.gamepad.hapticActuators;
  if (actuators && actuators.length > 0 && typeof actuators[0].pulse === 'function') {
    actuators[0].pulse(intensity, durationMs).catch(() => {});
  }
}

let teleportableMeshes = [];
let inspectableMeshes = [];
const worldGroup = new THREE.Group();
scene.add(worldGroup);

function displaceGeometryOrganic(geom, amp = 0.06, freq = 3.2, seed = 1.0) {
  if (amp <= 0.0001) return geom;
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n1 = Math.sin(x * freq + seed) * Math.cos(y * freq * 1.1 - seed) * Math.sin(z * freq * 0.9 + seed * 0.7);
    const n2 = 0.5 * Math.sin(x * freq * 2.3 - seed) * Math.cos(z * freq * 2.1 + y * freq);
    const d = (n1 + n2) * amp;
    if (norm) {
      pos.setXYZ(i, x + norm.getX(i) * d, y + norm.getY(i) * d, z + norm.getZ(i) * d);
    } else {
      pos.setY(i, y + d);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function countGeomTriangles(geom) {
  if (!geom) return 0;
  if (geom.index) return Math.round(geom.index.count / 3);
  if (geom.attributes && geom.attributes.position) return Math.round(geom.attributes.position.count / 3);
  return 0;
}

function tagAsset(obj, assetId, assetLabel) {
  obj.userData.assetId = assetId;
  obj.userData.assetLabel = assetLabel;
  obj.traverse((child) => {
    child.userData.assetId = assetId;
    child.userData.assetLabel = assetLabel;
    if (child.isMesh && !child.userData.isHelperOverlay) inspectableMeshes.push(child);
  });
}

function addMeshWithOutline(geom, mat, parent = worldGroup, teleportable = false) {
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (teleportable) teleportableMeshes.push(mesh);
  activeSceneTriangles += countGeomTriangles(geom);

  const s = STYLES[currentStyleIdx];
  const edges = new THREE.EdgesGeometry(geom, 24);
  const line = new THREE.LineSegments(edges, outlineMat);
  line.visible = Boolean(s && s.outlines);
  line.userData.isHelperOverlay = true;
  mesh.add(line);
  outlineMeshes.push(line);

  const wf = new THREE.Mesh(geom, wireframeMat);
  wf.visible = Boolean(s && s.wireframe);
  wf.userData.isHelperOverlay = true;
  mesh.add(wf);
  wireframeMeshes.push(wf);
  return mesh;
}

function make3DLabelSprite(titleText, subText, borderHex = '#52b788') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(13, 21, 28, 0.90)';
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 128, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleText, 256, 62);
  ctx.fillStyle = '#ffd166';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText(subText, 256, 104);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(2.5, 0.7, 1);
  return sprite;
}

// ============================================================================
// 5. CONTINUOUS ANATOMICAL LOFTING, SKELETAL IK RIGS & PRE-RIGGED .GLB MORPHER
// ============================================================================
let activeTrunkPivots = [];
let activeVultureFlocks = [];
let activeAnimatedCreatures = [];
let activeSwayFoliage = [];
let activeGLBMixers = [];
const gltfLoader = new GLTFLoader();
const glbHeroCache = {};

/**
 * Generates a single continuous, watertight anatomical skin mesh lofted across
 * spine cross-sections [x, y, z, rx, ry, dorsalRidge, ventralFlattening] with zero seams.
 */
function buildLoftedAnatomicalBody(slices, radialSegs = 16, lengthSegs = 24, dispAmp = 0.02, seed = 1.0) {
  const rSeg = Math.max(6, radialSegs);
  const lSeg = Math.max(slices.length, lengthSegs);
  const centerPts = slices.map((s) => new THREE.Vector3(s[0], s[1], s[2]));
  const radiusPts = slices.map((s) => new THREE.Vector3(s[3], s[4], s[5] || 0.0));
  const ventralPts = slices.map((s) => new THREE.Vector3(s[6] || 0.0, 0, 0));

  const spineCurve = new THREE.CatmullRomCurve3(centerPts);
  const radiusCurve = new THREE.CatmullRomCurve3(radiusPts);
  const ventralCurve = new THREE.CatmullRomCurve3(ventralPts);

  const positions = [];
  const uvs = [];
  const indices = [];
  const ringStride = rSeg + 1;

  for (let i = 0; i <= lSeg; i++) {
    const u = i / lSeg;
    const c = spineCurve.getPointAt(u);
    const tangent = spineCurve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    const orthoUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

    const rSpec = radiusCurve.getPointAt(u);
    const endTaper = u < 0.06 ? Math.sin((u / 0.06) * (Math.PI / 2)) : (u > 0.94 ? Math.sin(((1.0 - u) / 0.06) * (Math.PI / 2)) : 1.0);
    const rx = Math.max(0.015, rSpec.x * endTaper);
    const ry = Math.max(0.015, rSpec.y * endTaper);
    const dorsal = rSpec.z * endTaper;
    const ventral = ventralCurve.getPointAt(u).x * endTaper;

    for (let j = 0; j <= rSeg; j++) {
      const v = j / rSeg;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let localX = cosT * rx * (1.0 + 0.08 * Math.sin(theta * 2.0));
      let localY = sinT * ry;
      if (sinT > 0) {
        localY += dorsal * Math.pow(sinT, 3);
      } else {
        localY *= (1.0 - ventral * 0.28 * Math.abs(sinT));
      }

      const n1 = Math.sin(u * 14.0 + theta * 2.0 + seed) * Math.cos(u * 9.0 - theta + seed);
      const disp = n1 * dispAmp * endTaper;
      localX += cosT * disp;
      localY += sinT * disp;

      const wx = c.x + right.x * localX + orthoUp.x * localY;
      const wy = c.y + right.y * localX + orthoUp.y * localY;
      const wz = c.z + right.z * localX + orthoUp.z * localY;
      positions.push(wx, wy, wz);
      uvs.push(u * 2.5, v);
    }
  }

  for (let i = 0; i < lSeg; i++) {
    for (let j = 0; j < rSeg; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds an articulated 3-joint quadruped limb (Hip/Shoulder -> Knee/Elbow -> Ankle/Fetlock -> Foot/Hoof/Paw)
 * with continuous lofted muscle bellies so leg swings never show cylinder gaps.
 */
function buildArticulatedQuadrupedLimb(cfg, rUpper, rKnee, rAnkle, upperLen, lowerLen, footSpec, mCoat, mNail, seed = 1.0) {
  const segR = cfg.id === 0 ? 6 : Math.max(8, Math.round(11 * cfg.segMul));
  const segL = cfg.id === 0 ? 5 : Math.max(7, Math.round(9 * cfg.segMul));
  const disp = 0.015 * cfg.displace;

  const hipPivot = new THREE.Group();
  const upperSlices = [
    [0, 0.14, 0, rUpper * 1.22, rUpper * 1.18, 0.02, 0.0],
    [0, -upperLen * 0.45, 0.02, rUpper * 0.96, rUpper * 1.06, 0.01, 0.0],
    [0, -upperLen * 0.92, 0, rKnee * 1.04, rKnee * 1.04, 0.0, 0.0],
    [0, -upperLen * 1.05, 0, rKnee * 0.85, rKnee * 0.85, 0.0, 0.0]
  ];
  const upperGeom = buildLoftedAnatomicalBody(upperSlices, segR, segL, disp, seed);
  addMeshWithOutline(upperGeom, mCoat, hipPivot);

  const kneePivot = new THREE.Group();
  kneePivot.position.set(0, -upperLen, 0);
  hipPivot.add(kneePivot);

  const lowerSlices = [
    [0, 0.06, 0, rKnee * 0.98, rKnee * 1.02, 0.01, 0.0],
    [0, -lowerLen * 0.5, -0.01, rAnkle * 1.05, rAnkle * 1.08, 0.0, 0.0],
    [0, -lowerLen * 0.95, 0.01, rAnkle * 0.96, rAnkle * 0.96, 0.0, 0.0],
    [0, -lowerLen * 1.06, 0.02, rAnkle * 0.82, rAnkle * 0.82, 0.0, 0.0]
  ];
  const lowerGeom = buildLoftedAnatomicalBody(lowerSlices, segR, segL, disp * 0.7, seed + 3.1);
  addMeshWithOutline(lowerGeom, mCoat, kneePivot);

  const anklePivot = new THREE.Group();
  anklePivot.position.set(0, -lowerLen, 0);
  kneePivot.add(anklePivot);

  if (footSpec.kind === 'pillar_toes') {
    const padG = new THREE.CylinderGeometry(rAnkle * 1.05, rAnkle * 1.18, 0.22, segR);
    const pad = addMeshWithOutline(padG, mCoat, anklePivot);
    pad.position.set(0, -0.08, 0.02);
    if (cfg.id >= 1) {
      for (let toe = -1.5; toe <= 1.5; toe += 1.0) {
        const nail = addMeshWithOutline(new THREE.SphereGeometry(rAnkle * 0.24, 7, 6), mNail, anklePivot);
        nail.scale.set(0.85, 0.65, 1.25);
        nail.position.set(toe * rAnkle * 0.3, -0.14, rAnkle * 0.98);
      }
    }
  } else if (footSpec.kind === 'cloven_hoof') {
    const hoofG = new THREE.CylinderGeometry(rAnkle * 0.88, rAnkle * 1.15, 0.16, Math.max(6, segR));
    const hoof = addMeshWithOutline(hoofG, mNail, anklePivot);
    hoof.position.set(0, -0.07, 0.03);
  } else if (footSpec.kind === 'clawed_paw') {
    const pawG = new THREE.SphereGeometry(rAnkle * 1.25, Math.max(7, segR), 7);
    pawG.scale(1.05, 0.55, 1.42);
    const paw = addMeshWithOutline(pawG, mCoat, anklePivot);
    paw.position.set(0, -0.05, 0.07);
    if (cfg.id >= 1) {
      for (let c = -1.5; c <= 1.5; c += 1.0) {
        const claw = addMeshWithOutline(new THREE.ConeGeometry(0.018, 0.065, 5), mNail, anklePivot);
        claw.rotation.x = Math.PI * 0.62;
        claw.position.set(c * 0.032, -0.06, 0.19);
      }
    }
  }

  return { root: hipPivot, knee: kneePivot, ankle: anklePivot };
}

/**
 * Loads, clones, and morphs a pre-rigged .glb base animal (via SkeletonUtils + bone scaling + Head bone grafts).
 */
function instantiatePreRiggedGLBIfCached(assetId, lodIdx, customMats = null, graftBuilderFn = null) {
  const entry = glbHeroCache[assetId];
  if (!entry || !entry.scene) return null;
  const cloned = SkeletonUtils.clone(entry.scene);
  const mPrimary = (customMats && customMats[entry.matKey]) || materials[entry.matKey] || materials.mammothFur;

  cloned.traverse((node) => {
    if (node.isBone && entry.boneScales && entry.boneScales[node.name]) {
      const s = entry.boneScales[node.name];
      node.scale.set(s[0], s[1], s[2]);
    }
    if (node.isMesh || node.isSkinnedMesh) {
      node.material = mPrimary;
      node.castShadow = true;
      node.receiveShadow = true;
      activeSceneTriangles += countGeomTriangles(node.geometry);
    }
    if (node.isBone && graftBuilderFn && /head|skull/i.test(node.name) && !node.userData.grafted) {
      node.userData.grafted = true;
      graftBuilderFn(node);
    }
  });

  if (entry.animations && entry.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(cloned);
    mixer.clipAction(entry.animations[0]).play();
    activeGLBMixers.push(mixer);
  }
  return cloned;
}

function buildMammothAtLOD(lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mFur = (customMats && customMats.mammothFur) || materials.mammothFur;
  const mTusk = (customMats && customMats.tusk) || materials.tusk;
  const group = new THREE.Group();

  const glbClone = instantiatePreRiggedGLBIfCached('woolly_mammoth', lodIdx, customMats);
  if (glbClone) {
    group.add(glbClone);
    tagAsset(group, 'woolly_mammoth', `Woolly Mammoth (${cfg.short})`);
    return group;
  }

  const segR = cfg.id === 0 ? 8 : Math.round(16 * cfg.segMul);
  const segL = cfg.id === 0 ? 10 : Math.round(24 * cfg.segMul);
  const disp = 0.042 * cfg.displace;

  const spineRoot = new THREE.Group();
  group.add(spineRoot);

  // Continuous watertight lofted Pleistocene torso (Sloped hindquarters -> deep barrel abdomen -> towering shoulder hump -> neck base)
  const torsoSlices = [
    [0, 1.92, -1.92, 0.42, 0.46, 0.05, 0.15],
    [0, 2.08, -1.35, 0.96, 1.05, 0.14, 0.18],
    [0, 2.26, -0.35, 1.18, 1.28, 0.22, 0.22],
    [0, 2.48, 0.78, 1.28, 1.42, 0.56, 0.18],
    [0, 2.68, 1.48, 1.08, 1.24, 0.48, 0.12],
    [0, 2.75, 1.88, 0.72, 0.82, 0.18, 0.08]
  ];
  const torsoGeom = buildLoftedAnatomicalBody(torsoSlices, segR, segL, disp, 1.1);
  addMeshWithOutline(torsoGeom, mFur, spineRoot);

  // Articulated Neck & High-Domed Cranium Group (Drives Head-Look IK & Breathing Pitch)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.82, 1.78);
  spineRoot.add(headPivot);

  const headSlices = [
    [0, -0.08, -0.18, 0.68, 0.78, 0.15, 0.1],
    [0, 0.22, 0.28, 0.82, 0.98, 0.38, 0.08],
    [0, -0.05, 0.68, 0.64, 0.68, 0.12, 0.15],
    [0, -0.22, 0.96, 0.44, 0.46, 0.04, 0.1]
  ];
  const headGeom = buildLoftedAnatomicalBody(headSlices, Math.max(7, Math.round(segR * 0.85)), Math.max(8, Math.round(segL * 0.6)), disp * 0.75, 5.5);
  addMeshWithOutline(headGeom, mFur, headPivot);

  const earPivots = [];
  [-1, 1].forEach((side) => {
    const earPiv = new THREE.Group();
    earPiv.position.set(side * 0.76, 0.18, 0.12);
    const earG = displaceGeometryOrganic(new THREE.SphereGeometry(0.26, Math.max(6, Math.round(8 * cfg.segMul)), 8), disp * 0.5, 4.0, side + 8);
    earG.scale(0.32, 1.15, 0.78);
    const ear = addMeshWithOutline(earG, mFur, earPiv);
    ear.position.set(side * 0.08, -0.06, 0);
    earPiv.rotation.y = side * 0.38;
    headPivot.add(earPiv);
    earPivots.push(earPiv);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), materials.eyeGloss);
    eye.position.set(side * 0.62, 0.18, 0.62);
    headPivot.add(eye);
  });

  // Articulated S-Curve Prehensile Trunk attached to Head Pivot
  const trunkPiv = new THREE.Group();
  trunkPiv.position.set(0, -0.18, 0.86);
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.06, 0.0),
    new THREE.Vector3(0, -0.52, 0.28),
    new THREE.Vector3(0, -1.15, 0.22),
    new THREE.Vector3(0, -1.65, 0.04),
    new THREE.Vector3(0, -1.82, 0.28)
  ]);
  const trunkSegs = cfg.id === 0 ? 8 : Math.round(18 * cfg.segMul);
  const trunkRadSegs = cfg.id === 0 ? 6 : Math.round(10 * cfg.segMul);
  const trunkTube = displaceGeometryOrganic(
    new THREE.TubeGeometry(trunkCurve, trunkSegs, 0.20, trunkRadSegs, false),
    disp * 0.45, 7.5, 9.1
  );
  addMeshWithOutline(trunkTube, mFur, trunkPiv);
  headPivot.add(trunkPiv);
  activeTrunkPivots.push(trunkPiv);

  // Doubly-Curved 3D Helical Ivory Tusks parented to Head Pivot
  [-1, 1].forEach((side) => {
    const tuskCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.38, -0.32, 0.74),
      new THREE.Vector3(side * 0.70, -0.88, 1.42),
      new THREE.Vector3(side * 1.10, -1.22, 2.12),
      new THREE.Vector3(side * 1.16, -0.92, 2.82),
      new THREE.Vector3(side * 0.76, -0.16, 3.10),
      new THREE.Vector3(side * 0.34, 0.32, 2.90)
    ]);
    const tuskGeom = new THREE.TubeGeometry(tuskCurve, cfg.id === 0 ? 9 : Math.round(22 * cfg.segMul), 0.115, cfg.id === 0 ? 6 : Math.round(10 * cfg.segMul), false);
    const pos = tuskGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const zVal = pos.getZ(i);
      if (zVal > 2.5) {
        const shrink = Math.max(0.25, 1.0 - (zVal - 2.5) * 0.9);
        pos.setY(i, pos.getY(i) + (1.0 - shrink) * 0.05);
      }
    }
    tuskGeom.computeVertexNormals();
    addMeshWithOutline(tuskGeom, mTusk, headPivot);
  });

  // 4 Articulated 3-Joint Quadruped Limbs (Hip/Shoulder -> Knee -> Ankle -> Foot with Ivory Toenails)
  const limbSpecs = [
    [-0.68, 2.05, 1.02, 0.40, 0.33, 0.31, 1.05, 0.88, 0.0],
    [0.68, 2.05, 1.02, 0.40, 0.33, 0.31, 1.05, 0.88, Math.PI],
    [-0.60, 1.88, -1.22, 0.37, 0.30, 0.28, 0.96, 0.80, Math.PI * 0.5],
    [0.60, 1.88, -1.22, 0.37, 0.30, 0.28, 0.96, 0.80, Math.PI * 1.5]
  ];
  const limbs = limbSpecs.map(([lx, ly, lz, rU, rK, rA, uLen, lLen, phase], idx) => {
    const limb = buildArticulatedQuadrupedLimb(cfg, rU, rK, rA, uLen, lLen, { kind: 'pillar_toes' }, mFur, mTusk, idx + 12);
    limb.root.position.set(lx, ly, lz);
    spineRoot.add(limb.root);
    return { ...limb, phase };
  });

  // Shaggy Layered Fur Mantle & Belly Fringe Shells (Scales with LOD 1 -> 2 -> 3!)
  for (let f = 0; f < cfg.furShells; f++) {
    const ang = (f / cfg.furShells) * Math.PI * 2;
    const isMantle = f % 2 === 0;
    const fx = Math.sin(ang) * (isMantle ? 1.15 : 1.08);
    const fz = Math.cos(ang) * 1.48 - 0.12;
    const fy = isMantle ? 2.12 + Math.cos(ang * 2) * 0.22 : 1.35;
    const tuftGeom = displaceGeometryOrganic(
      new THREE.ConeGeometry(0.34, isMantle ? 1.12 : 0.92, Math.max(6, Math.round(7 * cfg.segMul))),
      disp * 0.7, 5.0, f * 1.7
    );
    const tuft = addMeshWithOutline(tuftGeom, mFur, spineRoot);
    tuft.position.set(fx, fy, fz);
    tuft.rotation.x = Math.PI + (fz > 0 ? 0.18 : -0.15);
    tuft.rotation.z = -fx * 0.22;
  }

  activeAnimatedCreatures.push({
    kind: 'graviportal_amble',
    group,
    spineRoot,
    headPivot,
    trunkPiv,
    earPivots,
    limbs,
    speed: 1.85,
    strideAmp: 0.24,
    seed: 0.4
  });

  tagAsset(group, 'woolly_mammoth', `Woolly Mammoth (${cfg.short})`);
  return group;
}

function buildMegalocerosAtLOD(lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mCoat = (customMats && customMats.elkCoat) || materials.elkCoat;
  const mTusk = (customMats && customMats.tusk) || materials.tusk;
  const group = new THREE.Group();

  const glbClone = instantiatePreRiggedGLBIfCached('megaloceros', lodIdx, customMats);
  if (glbClone) {
    group.add(glbClone);
    tagAsset(group, 'megaloceros', `Giant Irish Elk (${cfg.short})`);
    return group;
  }

  const segR = cfg.id === 0 ? 8 : Math.round(14 * cfg.segMul);
  const segL = cfg.id === 0 ? 9 : Math.round(20 * cfg.segMul);
  const disp = 0.028 * cfg.displace;

  const spineRoot = new THREE.Group();
  group.add(spineRoot);

  // Continuous Cervine Torso (Muscular haunches -> lean flank -> deep stag barrel chest & prominent withers hump)
  const torsoSlices = [
    [0, 1.72, -1.08, 0.24, 0.28, 0.04, 0.1],
    [0, 1.76, -0.78, 0.50, 0.60, 0.12, 0.15],
    [0, 1.70, -0.12, 0.46, 0.54, 0.08, 0.28],
    [0, 1.78, 0.56, 0.55, 0.68, 0.36, 0.14],
    [0, 1.92, 0.88, 0.36, 0.44, 0.16, 0.10]
  ];
  const torsoGeom = buildLoftedAnatomicalBody(torsoSlices, segR, segL, disp, 2.2);
  addMeshWithOutline(torsoGeom, mCoat, spineRoot);

  // Articulated Neck & Stag Head Group (Drives Grazing Dip & Alert Antler Turn)
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 1.88, 0.74);
  spineRoot.add(neckPivot);

  const neckSlices = [
    [0, -0.04, -0.05, 0.32, 0.38, 0.06, 0.12],
    [0, 0.42, 0.24, 0.26, 0.32, 0.04, 0.18],
    [0, 0.88, 0.42, 0.21, 0.24, 0.02, 0.08]
  ];
  const neckGeom = buildLoftedAnatomicalBody(neckSlices, Math.max(7, segR), Math.max(7, Math.round(segL * 0.55)), disp * 0.8, 6.1);
  addMeshWithOutline(neckGeom, mCoat, neckPivot);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.92, 0.46);
  neckPivot.add(headPivot);

  const headSlices = [
    [0, -0.02, -0.12, 0.21, 0.22, 0.04, 0.05],
    [0, 0.04, 0.12, 0.24, 0.23, 0.06, 0.08],
    [0, -0.04, 0.38, 0.15, 0.15, 0.02, 0.12],
    [0, -0.09, 0.62, 0.10, 0.11, 0.0, 0.1]
  ];
  const skullGeom = buildLoftedAnatomicalBody(headSlices, Math.max(7, segR), Math.max(7, Math.round(segL * 0.5)), disp * 0.4, 7.2);
  addMeshWithOutline(skullGeom, mCoat, headPivot);

  [-1, 1].forEach((side) => {
    const ear = addMeshWithOutline(new THREE.ConeGeometry(0.085, 0.34, 8), mCoat, headPivot);
    ear.position.set(side * 0.26, 0.16, -0.02);
    ear.rotation.z = -side * 0.85;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), materials.eyeGloss);
    eye.position.set(side * 0.20, 0.08, 0.18);
    headPivot.add(eye);

    // 3D Branching Palmate Antler Beams (3.65m Span) + Radiating Bone Tines parented to Head Pivot!
    const beamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.12, 0.16, 0.04),
      new THREE.Vector3(side * 0.65, 0.34, -0.08),
      new THREE.Vector3(side * 1.25, 0.58, -0.25),
      new THREE.Vector3(side * 1.72, 0.84, -0.38)
    ]);
    const beamG = new THREE.TubeGeometry(beamCurve, cfg.id === 0 ? 7 : Math.round(16 * cfg.segMul), 0.065, Math.max(6, Math.round(8 * cfg.segMul)), false);
    addMeshWithOutline(beamG, mTusk, headPivot);

    const palmG = displaceGeometryOrganic(new THREE.SphereGeometry(0.58, Math.max(6, segR), Math.max(6, Math.round(8 * cfg.segMul))), disp * 0.4, 4.0, side + 9);
    palmG.scale(1.38, 0.13, 0.68);
    const palm = addMeshWithOutline(palmG, mTusk, headPivot);
    palm.position.set(side * 1.28, 0.64, -0.26);
    palm.rotation.z = side * 0.32;
    palm.rotation.y = -side * 0.18;

    const tinesPerSide = Math.max(2, Math.round(cfg.antlerTines / 2));
    for (let t = 0; t < tinesPerSide; t++) {
      const frac = t / Math.max(1, tinesPerSide - 1);
      const tx = side * (0.50 + frac * 1.22);
      const ty = 0.38 + frac * 0.48;
      const tz = -0.08 - frac * 0.28 + Math.sin(frac * Math.PI) * 0.22;
      const tineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(tx, ty, tz),
        new THREE.Vector3(tx + side * 0.08, ty + 0.22, tz + (t === 0 ? 0.28 : 0.14)),
        new THREE.Vector3(tx + side * 0.12, ty + 0.44, tz + (t === 0 ? 0.38 : 0.06))
      ]);
      const tineG = new THREE.TubeGeometry(tineCurve, 6, 0.025, 6, false);
      addMeshWithOutline(tineG, mTusk, headPivot);
    }
  });

  // 4 Articulated 3-Joint Cervine Legs with Fetlocks & Cloven Hooves
  const limbSpecs = [
    [-0.31, 1.56, 0.66, 0.15, 0.10, 0.075, 0.78, 0.70, 0.0],
    [0.31, 1.56, 0.66, 0.15, 0.10, 0.075, 0.78, 0.70, Math.PI],
    [-0.29, 1.58, -0.78, 0.17, 0.11, 0.075, 0.80, 0.70, Math.PI],
    [0.29, 1.58, -0.78, 0.17, 0.11, 0.075, 0.80, 0.70, 0.0]
  ];
  const limbs = limbSpecs.map(([lx, ly, lz, rU, rK, rA, uLen, lLen, phase], idx) => {
    const limb = buildArticulatedQuadrupedLimb(cfg, rU, rK, rA, uLen, lLen, { kind: 'cloven_hoof' }, mCoat, materials.rock, idx + 24);
    limb.root.position.set(lx, ly, lz);
    spineRoot.add(limb.root);
    return { ...limb, phase };
  });

  activeAnimatedCreatures.push({
    kind: 'cervid_trot',
    group,
    spineRoot,
    neckPivot,
    headPivot,
    limbs,
    speed: 2.35,
    strideAmp: 0.28,
    seed: 1.9
  });

  tagAsset(group, 'megaloceros', `Giant Irish Elk (${cfg.short})`);
  return group;
}

function buildSmilodonAtLOD(lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mCoat = (customMats && customMats.smilodonCoat) || materials.smilodonCoat;
  const mTusk = (customMats && customMats.tusk) || materials.tusk;
  const group = new THREE.Group();

  const glbClone = instantiatePreRiggedGLBIfCached('smilodon', lodIdx, customMats);
  if (glbClone) {
    group.add(glbClone);
    tagAsset(group, 'smilodon', `Saber-Toothed Cat (${cfg.short})`);
    return group;
  }

  const segR = cfg.id === 0 ? 8 : Math.round(14 * cfg.segMul);
  const segL = cfg.id === 0 ? 9 : Math.round(20 * cfg.segMul);
  const disp = 0.020 * cfg.displace;

  const spineRoot = new THREE.Group();
  group.add(spineRoot);

  // Continuous Feline Torso (Muscular haunches -> tucked abdomen -> hypertrophied bear-like scapula & ribcage)
  const torsoSlices = [
    [0, 0.85, -0.78, 0.18, 0.21, 0.03, 0.10],
    [0, 0.88, -0.52, 0.36, 0.41, 0.09, 0.14],
    [0, 0.84, -0.06, 0.33, 0.37, 0.05, 0.28],
    [0, 0.92, 0.44, 0.43, 0.48, 0.18, 0.12],
    [0, 1.02, 0.72, 0.33, 0.36, 0.10, 0.08]
  ];
  const torsoGeom = buildLoftedAnatomicalBody(torsoSlices, segR, segL, disp, 1.5);
  addMeshWithOutline(torsoGeom, mCoat, spineRoot);

  // Articulated Feline Neck, Skull & Snarling Lower Jaw Pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.06, 0.74);
  spineRoot.add(headPivot);

  const headSlices = [
    [0, -0.02, -0.08, 0.27, 0.28, 0.05, 0.06],
    [0, 0.08, 0.18, 0.29, 0.28, 0.06, 0.08],
    [0, 0.04, 0.40, 0.21, 0.19, 0.02, 0.12],
    [0, 0.02, 0.54, 0.14, 0.13, 0.0, 0.15]
  ];
  const headGeom = buildLoftedAnatomicalBody(headSlices, Math.max(7, segR), Math.max(7, Math.round(segL * 0.5)), disp * 0.5, 6.4);
  addMeshWithOutline(headGeom, mCoat, headPivot);

  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.06, 0.16);
  const jawGeom = new THREE.BoxGeometry(0.22, 0.09, 0.34);
  const jawMesh = addMeshWithOutline(jawGeom, mCoat, jawPivot);
  jawMesh.position.set(0, -0.03, 0.15);
  headPivot.add(jawPivot);

  // Curved 24cm Maxillary Saber Canines, Rounded Ears & Predator Eyes on Head Pivot
  [-1, 1].forEach((side) => {
    const saberCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.115, 0.01, 0.46),
      new THREE.Vector3(side * 0.118, -0.16, 0.50),
      new THREE.Vector3(side * 0.108, -0.33, 0.44)
    ]);
    const saberG = new THREE.TubeGeometry(saberCurve, cfg.id === 0 ? 6 : Math.round(10 * cfg.segMul), 0.027, 8, false);
    saberG.scale(0.62, 1.0, 1.25);
    addMeshWithOutline(saberG, mTusk, headPivot);

    const ear = addMeshWithOutline(new THREE.SphereGeometry(0.082, 8, 8), mCoat, headPivot);
    ear.scale.set(0.8, 1.1, 0.5);
    ear.position.set(side * 0.21, 0.28, 0.12);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), materials.eyeGloss);
    eye.position.set(side * 0.135, 0.12, 0.38);
    headPivot.add(eye);
  });

  // Articulated Bobbed Lynx-like Tail
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.90, -0.76);
  const tail = addMeshWithOutline(new THREE.CylinderGeometry(0.042, 0.058, 0.36, 8), mCoat, tailPivot);
  tail.position.set(0, -0.12, -0.10);
  tail.rotation.x = -0.68;
  spineRoot.add(tailPivot);

  // 4 Articulated 3-Joint Muscular Limbs with Clawed Paws
  const limbSpecs = [
    [-0.25, 0.78, 0.46, 0.14, 0.105, 0.088, 0.38, 0.34, 0.0],
    [0.25, 0.78, 0.46, 0.14, 0.105, 0.088, 0.38, 0.34, Math.PI],
    [-0.22, 0.78, -0.52, 0.135, 0.098, 0.082, 0.38, 0.34, Math.PI * 0.5],
    [0.22, 0.78, -0.52, 0.135, 0.098, 0.082, 0.38, 0.34, Math.PI * 1.5]
  ];
  const limbs = limbSpecs.map(([lx, ly, lz, rU, rK, rA, uLen, lLen, phase], idx) => {
    const limb = buildArticulatedQuadrupedLimb(cfg, rU, rK, rA, uLen, lLen, { kind: 'clawed_paw' }, mCoat, mTusk, idx + 36);
    limb.root.position.set(lx, ly, lz);
    spineRoot.add(limb.root);
    return { ...limb, phase };
  });

  activeAnimatedCreatures.push({
    kind: 'predator_prowl',
    group,
    spineRoot,
    headPivot,
    jawPivot,
    tailPivot,
    limbs,
    speed: 2.15,
    strideAmp: 0.26,
    seed: 3.1
  });

  tagAsset(group, 'smilodon', `Saber-Toothed Cat (${cfg.short})`);
  return group;
}

// ============================================================================
// 6. MULTI-LOD TERATORN, MEGAFLORA, CLIFF WATERFALL & FULL VALLEY COMPILER
// ============================================================================
function buildTeratornAtLOD(lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mFeather = (customMats && customMats.cliff) || materials.cliff;
  const mBeak = (customMats && customMats.tusk) || materials.tusk;
  const group = new THREE.Group();

  const glbClone = instantiatePreRiggedGLBIfCached('teratorn_vulture', lodIdx, customMats);
  if (glbClone) {
    group.add(glbClone);
    tagAsset(group, 'teratorn_vulture', `Teratorn Giant Vulture (${cfg.short})`);
    return group;
  }

  const segR = cfg.id === 0 ? 6 : Math.max(8, Math.round(10 * cfg.segMul));
  const segL = cfg.id === 0 ? 7 : Math.max(10, Math.round(14 * cfg.segMul));
  const disp = 0.015 * cfg.displace;

  // Continuous Lofted Avian Fuselage -> Neck Ruff -> Raptorial Cranium
  const bodySlices = [
    [0, 0.02, -0.58, 0.14, 0.11, 0.01, 0.05],
    [0, 0.0, -0.12, 0.29, 0.24, 0.04, 0.12],
    [0, 0.02, 0.34, 0.26, 0.22, 0.03, 0.08],
    [0, 0.08, 0.66, 0.15, 0.15, 0.02, 0.04],
    [0, 0.07, 0.82, 0.09, 0.09, 0.0, 0.05]
  ];
  const bodyGeom = buildLoftedAnatomicalBody(bodySlices, segR, segL, disp, 4.4);
  addMeshWithOutline(bodyGeom, mFeather, group);

  const beak = addMeshWithOutline(new THREE.ConeGeometry(0.065, 0.28, 7), mBeak, group);
  beak.rotation.x = Math.PI / 2 + 0.25;
  beak.position.set(0, 0.04, 0.94);

  const wingRigs = [];
  [-1, 1].forEach((side) => {
    const innerPivot = new THREE.Group();
    innerPivot.position.set(side * 0.22, 0.04, 0.08);
    group.add(innerPivot);

    const innerSlices = [
      [0, 0, 0.04, 0.26, 0.055, 0.01, 0.0],
      [side * 0.48, 0.02, 0.02, 0.24, 0.048, 0.01, 0.0],
      [side * 0.96, 0.04, -0.02, 0.20, 0.038, 0.0, 0.0]
    ];
    const innerG = buildLoftedAnatomicalBody(innerSlices, Math.max(6, segR), 6, disp * 0.5, side + 5.1);
    addMeshWithOutline(innerG, mFeather, innerPivot);

    const outerPivot = new THREE.Group();
    outerPivot.position.set(side * 0.92, 0.04, -0.02);
    innerPivot.add(outerPivot);

    const outerSlices = [
      [0, 0, 0.0, 0.20, 0.038, 0.0, 0.0],
      [side * 0.45, 0.02, -0.05, 0.16, 0.028, 0.0, 0.0],
      [side * 0.88, 0.03, -0.10, 0.08, 0.018, 0.0, 0.0]
    ];
    const outerG = buildLoftedAnatomicalBody(outerSlices, Math.max(6, segR), 6, disp * 0.4, side + 7.2);
    addMeshWithOutline(outerG, mFeather, outerPivot);

    const primaries = cfg.id === 0 ? 3 : Math.max(5, Math.round(6 * cfg.segMul));
    for (let p = 0; p < primaries; p++) {
      const feather = addMeshWithOutline(new THREE.ConeGeometry(0.048, 0.56, 5), mFeather, outerPivot);
      feather.rotation.z = -side * (Math.PI / 2 - 0.10 + p * 0.075);
      feather.rotation.y = -side * (0.08 + p * 0.085);
      feather.position.set(side * (0.78 + p * 0.055), 0.03, -0.04 - p * 0.075);
    }
    wingRigs.push({ side, innerPivot, outerPivot });
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.02, -0.54);
  const tailFan = addMeshWithOutline(new THREE.ConeGeometry(0.38, 0.65, 6), mFeather, tailPivot);
  tailFan.rotation.x = -Math.PI / 2;
  tailFan.scale.set(1.25, 1.0, 0.16);
  tailFan.position.set(0, 0, -0.26);
  group.add(tailPivot);

  activeAnimatedCreatures.push({
    kind: 'avian_soar',
    group,
    wingRigs,
    tailPivot,
    speed: 2.6,
    seed: Math.random() * 6.28
  });

  tagAsset(group, 'teratorn_vulture', `Teratorn Giant Vulture (${cfg.short})`);
  return group;
}

function buildTreeAtLOD(isSequoia = true, s = 1.5, lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mTrunk = (customMats && customMats.trunk) || materials.trunk;
  const mFol1 = (customMats && customMats.foliage1) || materials.foliage1;
  const mFol2 = (customMats && customMats.foliage2) || materials.foliage2;
  const tree = new THREE.Group();

  const rSeg = cfg.id === 0 ? 7 : Math.max(8, Math.round(12 * cfg.segMul));
  const disp = 0.035 * cfg.displace * s;
  const trunkH = (isSequoia ? 3.9 : 3.3) * s;

  // Continuous Lofted Buttress Trunk with Natural Taper & Organic Bark Furrows
  const trunkSlices = [
    [0, 0.0, 0, 0.48 * s, 0.48 * s, 0.04 * s, 0.0],
    [0, trunkH * 0.18, 0.02 * s, 0.34 * s, 0.34 * s, 0.02 * s, 0.0],
    [0, trunkH * 0.52, -0.02 * s, 0.24 * s, 0.24 * s, 0.01 * s, 0.0],
    [0, trunkH * 0.85, 0.01 * s, 0.15 * s, 0.15 * s, 0.0, 0.0],
    [0, trunkH * 1.02, 0, 0.06 * s, 0.06 * s, 0.0, 0.0]
  ];
  const trunkG = buildLoftedAnatomicalBody(trunkSlices, rSeg, cfg.id === 0 ? 6 : Math.max(8, Math.round(10 * cfg.segMul)), disp, isSequoia ? 1.3 : 2.7);
  addMeshWithOutline(trunkG, mTrunk, tree);

  // Sprawling Root Buttresses (At LOD 1+)
  if (cfg.id >= 1) {
    const rootCount = cfg.id >= 2 ? 6 : 4;
    for (let r = 0; r < rootCount; r++) {
      const ang = (r / rootCount) * Math.PI * 2;
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(ang) * 0.18 * s, 0.65 * s, Math.sin(ang) * 0.18 * s),
        new THREE.Vector3(Math.cos(ang) * 0.38 * s, 0.26 * s, Math.sin(ang) * 0.38 * s),
        new THREE.Vector3(Math.cos(ang) * 0.58 * s, 0.02 * s, Math.sin(ang) * 0.58 * s)
      ]);
      const rootG = new THREE.TubeGeometry(rootCurve, 5, 0.095 * s, 6, false);
      addMeshWithOutline(rootG, mTrunk, tree);
    }
  }

  // EZ-Tree Style Curved Branching Boughs & Layered Wind-Swaying Foliage Pads
  const canopyPivot = new THREE.Group();
  tree.add(canopyPivot);

  const clusters = cfg.id === 0 ? 5 : cfg.foliageClusters;
  for (let c = 0; c < clusters; c++) {
    const frac = c / Math.max(1, clusters - 1);
    const ang = c * 2.39996; // Golden angle botanical phyllotaxis
    const yBase = (1.35 + frac * (isSequoia ? 2.45 : 1.95)) * s;
    const radOut = (isSequoia ? (1.25 * (1.0 - frac * 0.58)) : (1.35 * (0.45 + 0.55 * Math.sin(frac * Math.PI * 0.85)))) * s;
    const bx = Math.cos(ang) * radOut;
    const bz = Math.sin(ang) * radOut;
    const archLift = (isSequoia ? 0.14 : 0.38) * s;

    if (cfg.id >= 1 && c < Math.min(clusters, 14)) {
      const boughCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, yBase - 0.14 * s, 0),
        new THREE.Vector3(bx * 0.48, yBase + archLift * 0.4, bz * 0.48),
        new THREE.Vector3(bx * 0.86, yBase + archLift, bz * 0.86)
      ]);
      const boughG = new THREE.TubeGeometry(boughCurve, 6, Math.max(0.025, (0.068 - frac * 0.032)) * s, 6, false);
      addMeshWithOutline(boughG, mTrunk, canopyPivot);
    }

    const cloudR = (0.64 - frac * 0.22) * s;
    const cloudG = displaceGeometryOrganic(
      new THREE.IcosahedronGeometry(cloudR, cfg.id === 0 ? 0 : (cfg.id >= 3 ? 2 : 1)),
      disp * 1.05, 4.2, c * 1.9
    );
    cloudG.scale(1.42, isSequoia ? 0.52 : 0.36, 1.42);
    const cloud = addMeshWithOutline(cloudG, c % 2 === 0 ? mFol1 : mFol2, canopyPivot);
    cloud.position.set(bx * 0.84, yBase + archLift, bz * 0.84);
  }

  activeSwayFoliage.push({ pivot: canopyPivot, phase: (isSequoia ? 0.7 : 2.1) + s });

  tagAsset(
    tree,
    isSequoia ? 'giant_sequoia' : 'araucaria_conifer',
    `${isSequoia ? 'Prehistoric Giant Sequoia' : 'Araucaria Conifer'} (${cfg.short})`
  );
  return tree;
}

function buildCliffWaterfallAtLOD(lodIdx = 2, customMats = null) {
  const cfg = LOD_TIERS[Math.max(0, Math.min(3, lodIdx))];
  const mCliff = (customMats && customMats.cliff) || materials.cliff;
  const mTerrain = (customMats && customMats.terrain) || materials.terrain;
  const mWater = (customMats && customMats.water) || materials.water;
  const group = new THREE.Group();

  const seg = cfg.id === 0 ? 10 : Math.round(18 * cfg.segMul);
  const disp = 0.22 * cfg.displace;

  const t1G = displaceGeometryOrganic(new THREE.CylinderGeometry(7.5, 9.5, 2.8, seg, Math.max(1, cfg.id * 2)), disp, 0.45, 1.1);
  const cliffTier1 = addMeshWithOutline(t1G, mCliff, group, true);
  cliffTier1.position.set(-14.5, 1.4, -7.5);

  const t2G = displaceGeometryOrganic(new THREE.CylinderGeometry(5.2, 6.8, 5.4, seg, Math.max(1, cfg.id * 3)), disp, 0.45, 2.3);
  const cliffTier2 = addMeshWithOutline(t2G, mCliff, group, true);
  cliffTier2.position.set(-17.0, 2.7, -10.5);

  const deckG = displaceGeometryOrganic(new THREE.CylinderGeometry(5.0, 5.2, 0.35, seg), disp * 0.25, 0.6, 3.4);
  const cliffDeck = addMeshWithOutline(deckG, mTerrain, group, true);
  cliffDeck.position.set(-17.0, 5.45, -10.5);

  const wfSegs = Math.max(1, cfg.id * 4);
  const waterfallG = displaceGeometryOrganic(new THREE.BoxGeometry(2.4, 5.5, 0.35, wfSegs, wfSegs * 2, 2), disp * 0.3, 1.8, 4.2);
  const waterfallMesh = addMeshWithOutline(waterfallG, mWater, group, false);
  waterfallMesh.position.set(-13.2, 2.6, -8.8);
  waterfallMesh.rotation.z = -0.18;

  if (cfg.id >= 2) {
    for (let m = 0; m < 6 * cfg.id; m++) {
      const mist = addMeshWithOutline(new THREE.SphereGeometry(0.28 + (m % 3) * 0.14, 8, 8), materials.tusk, group, false);
      mist.position.set(-12.5 + Math.sin(m * 1.7) * 1.1, 0.18 + (m % 3) * 0.15, -8.6 + Math.cos(m * 2.1) * 0.9);
    }
  }

  tagAsset(group, 'waterfall_cliff', `Cascading Waterfall & Cliff (${cfg.short})`);
  return group;
}

// ============================================================================
// 7. DYNAMIC VALLEY SCENE REBUILDER & SIDE-BY-SIDE 4-PEDESTAL COMPARISON ARENA
// ============================================================================
const vultureFlock = new THREE.Group();
scene.add(vultureFlock);

function clearGroupChildren(grp) {
  while (grp.children.length > 0) {
    grp.remove(grp.children[0]);
  }
}

function updateTriangleTelemetryBadge() {
  const lodCfg = LOD_TIERS[currentLodIdx] || LOD_TIERS[2];
  const lodBadge = document.getElementById('lod-badge');
  if (lodBadge) {
    if (comparisonMode === 'compare_lods') {
      lodBadge.textContent = `Compare: All 4 LODs Side-by-Side (${activeSceneTriangles.toLocaleString()} tris)`;
    } else if (comparisonMode === 'compare_styles') {
      lodBadge.textContent = `Compare: 4 Shader Styles Side-by-Side (${activeSceneTriangles.toLocaleString()} tris)`;
    } else {
      lodBadge.textContent = `${lodCfg.short} (${activeSceneTriangles.toLocaleString()} tris)`;
    }
  }
  const selectLod = document.getElementById('select-lod');
  if (selectLod) {
    selectLod.value = comparisonMode === 'compare_lods' ? 'compare_lods' : (comparisonMode === 'compare_styles' ? 'compare_styles' : String(currentLodIdx));
  }
}

function rebuildFullValleyScene(lodIdx = currentLodIdx) {
  currentLodIdx = Math.max(0, Math.min(3, lodIdx));
  const cfg = LOD_TIERS[currentLodIdx];

  clearGroupChildren(worldGroup);
  clearGroupChildren(vultureFlock);
  teleportableMeshes = [];
  inspectableMeshes = [];
  outlineMeshes = [];
  wireframeMeshes = [];
  activeTrunkPivots = [];
  activeAnimatedCreatures = [];
  activeSwayFoliage = [];
  activeGLBMixers = [];
  activeSceneTriangles = 0;

  // 1. Mountain Lake, Displaced Valley Meadows & Stepped Cliff Waterfall
  const lakeSeg = cfg.id === 0 ? 28 : Math.round(36 * cfg.segMul);
  const lakeMesh = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 0.35, lakeSeg), materials.water);
  lakeMesh.position.set(0, -0.22, 0);
  lakeMesh.receiveShadow = true;
  worldGroup.add(lakeMesh);
  activeSceneTriangles += countGeomTriangles(lakeMesh.geometry);

  const meadowSeg = cfg.id === 0 ? 20 : Math.round(28 * cfg.segMul);
  const meadowG = displaceGeometryOrganic(
    new THREE.CylinderGeometry(22.5, 25.0, 0.75, meadowSeg, Math.max(1, cfg.id * 2)),
    0.06 * cfg.displace, 0.35, 1.5
  );
  const mainMeadow = addMeshWithOutline(meadowG, materials.terrain, worldGroup, true);
  mainMeadow.position.set(0, -0.1, 4.5);

  const northG = displaceGeometryOrganic(
    new THREE.CylinderGeometry(16.0, 18.5, 0.9, meadowSeg, Math.max(1, cfg.id * 2)),
    0.08 * cfg.displace, 0.4, 2.9
  );
  const northBank = addMeshWithOutline(northG, materials.terrain, worldGroup, true);
  northBank.position.set(-5.0, 0.0, -18.5);

  const cliffWaterfallGroup = buildCliffWaterfallAtLOD(currentLodIdx);
  worldGroup.add(cliffWaterfallGroup);

  // Winding Natural Hiking Trail & Timber Footbridge
  [
    [0, 0.26, 11.0, 2.2, 3.2, 0.05],
    [-0.8, 0.26, 8.0, 2.1, 3.2, -0.2],
    [-2.2, 0.26, 5.0, 2.0, 3.2, -0.35],
    [-3.8, 0.26, 2.0, 2.0, 3.2, -0.25],
    [-4.5, 0.26, -1.2, 2.0, 3.2, 0.0]
  ].forEach(([tx, ty, tz, w, len, rotY]) => {
    const tread = addMeshWithOutline(new THREE.BoxGeometry(w, 0.08, len), materials.trail, worldGroup, true);
    tread.position.set(tx, ty, tz);
    tread.rotation.y = rotY;
  });

  const bridgeDeck = addMeshWithOutline(new THREE.BoxGeometry(2.4, 0.18, 6.5), materials.trunk, worldGroup, true);
  bridgeDeck.position.set(-4.6, 0.38, -5.8);

  // 2. Prehistoric Megaflora (11 Giant Sequoias & Araucaria Conifers)
  const treeSpecs = [
    [-10.5, 0.25, 7.5, 1.55], [-12.5, 0.25, 1.2, 1.35], [-8.5, 0.25, 12.5, 1.4],
    [9.5, 0.25, 9.0, 1.65], [13.5, 0.25, 3.5, 1.5], [11.0, 0.25, -2.5, 1.3],
    [7.0, 0.25, 14.5, 1.45], [-2.5, 0.45, -16.5, 1.6], [-9.5, 0.45, -19.0, 1.75],
    [2.5, 0.45, -19.5, 1.5], [-19.5, 5.55, -12.0, 1.25]
  ];
  treeSpecs.forEach(([tx, ty, tz, s], idx) => {
    const tree = buildTreeAtLOD(idx % 2 === 0, s, currentLodIdx);
    tree.position.set(tx, ty, tz);
    worldGroup.add(tree);
  });

  // Craggy Displaced Boulders & Prehistoric Fern Rosettes (at LOD 1+)
  [
    [-7.2, 0.25, 4.5, 1.15], [6.8, 0.25, 2.2, 1.3], [-11.5, 0.25, -2.0, 1.45],
    [12.0, 0.25, 8.5, 1.1], [-1.5, 0.45, -13.5, 1.25], [8.5, 0.25, -5.5, 1.35]
  ].forEach(([rx, ry, rz, rs], bIdx) => {
    const rockSub = cfg.id === 0 ? 0 : cfg.id;
    const rockG = displaceGeometryOrganic(new THREE.DodecahedronGeometry(0.75 * rs, rockSub), 0.08 * cfg.displace, 3.2, bIdx + 5);
    const rock = addMeshWithOutline(rockG, materials.rock, worldGroup, true);
    rock.position.set(rx, ry + 0.2 * rs, rz);
    rock.scale.set(1.25, 0.72, 1.05);
  });

  if (cfg.id >= 2) {
    const fernCount = cfg.id === 3 ? 28 : 14;
    for (let f = 0; f < fernCount; f++) {
      const ang = (f / fernCount) * Math.PI * 2;
      const dist = 5.5 + (f % 5) * 2.6;
      const fern = addMeshWithOutline(new THREE.ConeGeometry(0.42, 0.55, 6), f % 2 === 0 ? materials.foliage1 : materials.foliage2, worldGroup, false);
      fern.position.set(Math.cos(ang) * dist, 0.45, 4.5 + Math.sin(ang) * dist * 0.7);
    }
  }

  // 3. Prehistoric Megafauna at 1:1 Scale
  const mammothGroup = buildMammothAtLOD(currentLodIdx);
  mammothGroup.position.set(5.2, 0.25, 3.8);
  mammothGroup.rotation.y = -0.55;
  worldGroup.add(mammothGroup);

  const elkGroup = buildMegalocerosAtLOD(currentLodIdx);
  elkGroup.position.set(-4.5, 0.45, -13.5);
  elkGroup.rotation.y = 0.4;
  worldGroup.add(elkGroup);

  const smilodonGroup = buildSmilodonAtLOD(currentLodIdx);
  smilodonGroup.position.set(-15.5, 5.6, -9.2);
  smilodonGroup.rotation.y = 0.78;
  worldGroup.add(smilodonGroup);

  for (let v = 0; v < 3; v++) {
    const bird = buildTeratornAtLOD(currentLodIdx);
    const angle = (v * Math.PI * 2) / 3;
    bird.position.set(Math.cos(angle) * 11, 22 + v * 1.5, Math.sin(angle) * 11);
    bird.rotation.y = -angle;
    vultureFlock.add(bird);
  }

  applyStyle(currentStyleIdx);
  updateTriangleTelemetryBadge();
}

// ============================================================================
// 8. ISOLATED TURNTABLE & 4-PEDESTAL SIDE-BY-SIDE LOD / STYLE COMPARISON ARENA
// ============================================================================
let isolatedAssetId = 'all';
let approveHoldSec = 0.0;
const approvedAssets = JSON.parse(localStorage.getItem('wildvr_approved_assets') || '{}');

const turntableGroup = new THREE.Group();
turntableGroup.position.set(0, 0.25, 5.2);
turntableGroup.visible = false;
scene.add(turntableGroup);

const pedestalBase = new THREE.Mesh(
  new THREE.CylinderGeometry(3.4, 3.8, 0.24, 32),
  new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
);
pedestalBase.position.y = -0.12;
pedestalBase.receiveShadow = true;
turntableGroup.add(pedestalBase);

const pedestalRingMat = new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide });
const pedestalRing = new THREE.Mesh(new THREE.RingGeometry(3.42, 3.62, 36), pedestalRingMat);
pedestalRing.rotation.x = -Math.PI / 2;
pedestalRing.position.y = 0.02;
turntableGroup.add(pedestalRing);

const scaleRefPost = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.06, 1.75, 12),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
);
scaleRefPost.position.set(-3.1, 0.875, 0.8);
turntableGroup.add(scaleRefPost);

const turntableSpecimenSlot = new THREE.Group();
turntableGroup.add(turntableSpecimenSlot);

const comparisonArenaGroup = new THREE.Group();
comparisonArenaGroup.visible = false;
scene.add(comparisonArenaGroup);
let rotatingPedestalSlots = [];

const ASSET_META = {
  woolly_mammoth: { label: 'Woolly Mammoth (3.8m)', scale: 1.0, offset: [0, 0, 0], placardY: 4.35 },
  megaloceros: { label: 'Giant Irish Elk (3.1m)', scale: 1.0, offset: [0, 0, 0], placardY: 4.15 },
  smilodon: { label: 'Saber-Toothed Cat (1.2m)', scale: 1.0, offset: [0, 0, 0], placardY: 2.35 },
  teratorn_vulture: { label: 'Teratorn Giant Vulture (3.5m)', scale: 1.0, offset: [0, 1.6, 0], placardY: 3.1 },
  giant_sequoia: { label: 'Prehistoric Giant Sequoia (11.5m)', scale: 0.72, offset: [0, 0, 0], placardY: 4.8 },
  araucaria_conifer: { label: 'Monkey-Puzzle Conifer (7.2m)', scale: 0.82, offset: [0, 0, 0], placardY: 4.4 },
  waterfall_cliff: { label: 'Cascading Waterfall & Cliff', scale: 0.36, offset: [5.4, 0, 3.2], placardY: 3.6 }
};

function buildSpecimenById(assetId, lodIdx = currentLodIdx, customMats = null) {
  if (assetId === 'megaloceros') return buildMegalocerosAtLOD(lodIdx, customMats);
  if (assetId === 'smilodon') return buildSmilodonAtLOD(lodIdx, customMats);
  if (assetId === 'teratorn_vulture') return buildTeratornAtLOD(lodIdx, customMats);
  if (assetId === 'giant_sequoia') return buildTreeAtLOD(true, 1.4, lodIdx, customMats);
  if (assetId === 'araucaria_conifer') return buildTreeAtLOD(false, 1.35, lodIdx, customMats);
  if (assetId === 'waterfall_cliff') return buildCliffWaterfallAtLOD(lodIdx, customMats);
  return buildMammothAtLOD(lodIdx, customMats);
}

function makeDedicatedStyleMatSet(styleIdx) {
  const s = STYLES[styleIdx];
  const set = {};
  ['terrain', 'cliff', 'trail', 'water', 'trunk', 'foliage1', 'foliage2', 'rock', 'mammothFur', 'tusk', 'elkCoat', 'smilodonCoat'].forEach((k) => {
    const texPair = getTexturesForPipeline(s.pipeline, k);
    set[k] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(s[k]),
      map: texPair.map,
      bumpMap: texPair.bump,
      bumpScale: k === 'tusk' ? s.bumpScale * 0.25 : s.bumpScale,
      flatShading: Boolean(s.flat),
      roughness: k === 'tusk' ? Math.min(0.25, s.roughness) : s.roughness,
      metalness: s.metalness
    });
  });
  return set;
}

function enterComparisonLineup(mode = 'compare_lods') {
  comparisonMode = mode;
  const targetId = isolatedAssetId === 'all' ? 'woolly_mammoth' : isolatedAssetId;
  const meta = ASSET_META[targetId] || ASSET_META.woolly_mammoth;

  worldGroup.visible = false;
  vultureFlock.visible = false;
  turntableGroup.visible = false;
  comparisonArenaGroup.visible = true;
  clearGroupChildren(comparisonArenaGroup);
  rotatingPedestalSlots = [];
  activeAnimatedCreatures = [];
  activeSwayFoliage = [];
  activeGLBMixers = [];
  activeSceneTriangles = 0;

  // Walkable Studio Floor for teleporting right up to any of the 4 pedestals!
  const floorG = new THREE.CylinderGeometry(18, 18, 0.3, 36);
  const floorM = new THREE.Mesh(floorG, materials.terrain);
  floorM.position.set(0, -0.15, 4.0);
  floorM.receiveShadow = true;
  comparisonArenaGroup.add(floorM);
  teleportableMeshes.push(floorM);

  const xPositions = [-6.0, -2.0, 2.0, 6.0];
  const zPositions = [3.6, 2.4, 2.4, 3.6];
  const stylePresetIndices = [7, 2, 4, 0]; // 0: Papercraft Low-Poly, 1: Cel-Toon, 2: Clay Sculpt, 3: Textured Organic PBR

  for (let i = 0; i < 4; i++) {
    const pedGroup = new THREE.Group();
    pedGroup.position.set(xPositions[i], 0.25, zPositions[i]);
    comparisonArenaGroup.add(pedGroup);

    const pBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.95, 0.22, 28),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
    );
    pBase.position.y = -0.11;
    pBase.receiveShadow = true;
    pedGroup.add(pBase);

    const ringColors = [0x94a3b8, 0x38bdf8, 0x52b788, 0xffb703];
    const pRing = new THREE.Mesh(
      new THREE.RingGeometry(1.76, 1.90, 32),
      new THREE.MeshBasicMaterial({ color: ringColors[i], side: THREE.DoubleSide })
    );
    pRing.rotation.x = -Math.PI / 2;
    pRing.position.y = 0.02;
    pedGroup.add(pRing);

    const slot = new THREE.Group();
    pedGroup.add(slot);
    rotatingPedestalSlots.push(slot);

    const beforeTris = activeSceneTriangles;
    let specimen = null;
    let titleText = '';
    let subText = '';

    if (mode === 'compare_lods') {
      specimen = buildSpecimenById(targetId, i, null);
      const specTris = Math.max(12, activeSceneTriangles - beforeTris);
      titleText = LOD_TIERS[i].short;
      subText = `${specTris.toLocaleString()} Triangles`;
    } else {
      const stIdx = stylePresetIndices[i];
      const lodForStyle = i === 0 ? 0 : (i === 3 ? 3 : 2);
      const customMats = makeDedicatedStyleMatSet(stIdx);
      specimen = buildSpecimenById(targetId, lodForStyle, customMats);
      const specTris = Math.max(12, activeSceneTriangles - beforeTris);
      titleText = STYLES[stIdx].name.replace(/^\d+\/10:\s*/, '').slice(0, 26);
      subText = `${LOD_TIERS[lodForStyle].short} • ${specTris.toLocaleString()} tris`;
    }

    specimen.position.set(meta.offset[0] * 0.65, meta.offset[1] * 0.65, meta.offset[2] * 0.65);
    specimen.scale.setScalar(meta.scale * 0.68);
    slot.add(specimen);

    const hexStr = '#' + ringColors[i].toString(16).padStart(6, '0');
    const placard = make3DLabelSprite(titleText, subText, hexStr);
    placard.position.set(0, meta.placardY * 0.72, 0);
    pedGroup.add(placard);
  }

  xrOrigin.position.set(0, 0.25, 10.8);
  yaw = 0;
  pitch = -0.02;
  const assetBadge = document.getElementById('asset-badge');
  if (assetBadge) {
    assetBadge.textContent = mode === 'compare_lods'
      ? `4-LOD Lineup: ${meta.label}`
      : `4-Style Lineup: ${meta.label}`;
  }
  updateTriangleTelemetryBadge();
}

function isolateAsset(assetId, keepComparison = false) {
  isolatedAssetId = assetId || 'all';
  const selectAsset = document.getElementById('select-asset');
  if (selectAsset) selectAsset.value = isolatedAssetId;

  if (!keepComparison) comparisonMode = 'none';
  if (comparisonMode !== 'none' && isolatedAssetId !== 'all') {
    enterComparisonLineup(comparisonMode);
    return;
  }

  comparisonArenaGroup.visible = false;
  clearGroupChildren(turntableSpecimenSlot);

  const badge = document.getElementById('asset-badge');
  const approveBtn = document.getElementById('btn-approve-asset');

  if (isolatedAssetId === 'all' || !ASSET_META[isolatedAssetId]) {
    comparisonMode = 'none';
    worldGroup.visible = true;
    vultureFlock.visible = true;
    turntableGroup.visible = false;
    rebuildFullValleyScene(currentLodIdx);
    if (badge) badge.textContent = 'Scene: Full Prehistoric Valley';
    if (approveBtn) {
      approveBtn.classList.remove('active');
      approveBtn.textContent = '👍 Approve';
    }
    return;
  }

  const meta = ASSET_META[isolatedAssetId];
  worldGroup.visible = false;
  vultureFlock.visible = false;
  turntableGroup.visible = true;
  xrOrigin.position.set(0, 0.25, 10.5);
  yaw = 0;
  pitch = -0.04;

  activeAnimatedCreatures = [];
  activeSwayFoliage = [];
  activeGLBMixers = [];
  activeSceneTriangles = 0;
  const specimen = buildSpecimenById(isolatedAssetId, currentLodIdx, null);
  specimen.position.set(meta.offset[0], meta.offset[1], meta.offset[2]);
  specimen.rotation.set(0, 0, 0);
  specimen.scale.setScalar(meta.scale);
  turntableSpecimenSlot.add(specimen);
  applyStyle(currentStyleIdx);
  updateTriangleTelemetryBadge();

  const isLocked = Boolean(approvedAssets[isolatedAssetId]);
  pedestalRingMat.color.setHex(isLocked ? 0x10b981 : 0xffb703);
  if (badge) {
    badge.textContent = `Turntable: ${meta.label} • ${LOD_TIERS[currentLodIdx].short} ${isLocked ? '[APPROVED 🔒]' : ''}`;
  }
  if (approveBtn) {
    approveBtn.classList.toggle('active', isLocked);
    approveBtn.textContent = isLocked ? '🔒 Approved!' : '👍 Approve';
  }
}

function setActiveLODOrMode(val) {
  if (val === 'compare_lods' || val === 'compare_styles') {
    enterComparisonLineup(val);
    return;
  }
  comparisonMode = 'none';
  currentLodIdx = Math.max(0, Math.min(3, Number(val) || 0));
  if (isolatedAssetId !== 'all') {
    isolateAsset(isolatedAssetId, false);
  } else {
    comparisonArenaGroup.visible = false;
    turntableGroup.visible = false;
    worldGroup.visible = true;
    vultureFlock.visible = true;
    rebuildFullValleyScene(currentLodIdx);
  }
}

function cycleLODMode() {
  const sequence = ['0', '1', '2', '3', 'compare_lods', 'compare_styles'];
  const currKey = comparisonMode !== 'none' ? comparisonMode : String(currentLodIdx);
  const nextIdx = (sequence.indexOf(currKey) + 1) % sequence.length;
  setActiveLODOrMode(sequence[nextIdx]);
}

function approveCurrentAsset(targetId = null) {
  const idToApprove = targetId || (isolatedAssetId !== 'all' ? isolatedAssetId : getSpatialAndTargetContext().targeted_asset_id);
  if (!idToApprove || idToApprove === 'all' || idToApprove === 'terrain_or_sky') return;
  approvedAssets[idToApprove] = {
    approved: true,
    locked: true,
    lodIdx: currentLodIdx,
    styleIdx: currentStyleIdx,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('wildvr_approved_assets', JSON.stringify(approvedAssets));
  pedestalRingMat.color.setHex(0x10b981);
  const meta = ASSET_META[idToApprove];
  const badge = document.getElementById('asset-badge');
  if (badge) badge.textContent = `Approved & Locked: ${meta ? meta.label : idToApprove} (${LOD_TIERS[currentLodIdx].short}) 🔒`;
  const approveBtn = document.getElementById('btn-approve-asset');
  if (approveBtn) {
    approveBtn.classList.add('active');
    approveBtn.textContent = '🔒 Approved!';
  }

  ['https://192.168.86.226:8443/api/vr-approve', 'http://localhost:8765/api/vr-approve'].forEach((endpoint) => {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: idToApprove,
        approved: true,
        lod_tier: LOD_TIERS[currentLodIdx].short,
        notes: `Approved at ${LOD_TIERS[currentLodIdx].short} in ${STYLES[currentStyleIdx].name}`
      })
    }).catch(() => {});
  });
}

// --- In-Headset Microphone Push-to-Talk + 3D Spatial & Action Context Bridge ---
const targetRaycaster = new THREE.Raycaster();
let btnAHoldSec = 0.0;
let btnAVoiceTriggered = false;

function getSpatialAndTargetContext() {
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3(0, 0, -1);
  const headPos = new THREE.Vector3();
  const headDir = new THREE.Vector3();
  camera.getWorldPosition(headPos);
  camera.getWorldDirection(headDir);

  if (renderer.xr.isPresenting && activeController) {
    activeController.getWorldPosition(origin);
    dir.applyQuaternion(activeController.getWorldQuaternion(tempQuat)).normalize();
  } else {
    origin.copy(headPos);
    dir.copy(headDir);
  }

  targetRaycaster.set(origin, dir);
  targetRaycaster.far = 85.0;
  const hits = targetRaycaster.intersectObjects(inspectableMeshes, true);
  let targetId = isolatedAssetId !== 'all' ? isolatedAssetId : 'terrain_or_sky';
  let targetLabel = isolatedAssetId !== 'all' && ASSET_META[isolatedAssetId]
    ? ASSET_META[isolatedAssetId].label
    : 'Valley Terrain / Sky';
  let hitPt = [
    Number((origin.x + dir.x * 5).toFixed(2)),
    Number((origin.y + dir.y * 5).toFixed(2)),
    Number((origin.z + dir.z * 5).toFixed(2))
  ];

  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.userData.assetId && obj.parent) obj = obj.parent;
    if (obj && obj.userData.assetId) {
      targetId = obj.userData.assetId;
      targetLabel = obj.userData.assetLabel || targetId;
    }
    hitPt = [
      Number(hits[0].point.x.toFixed(2)),
      Number(hits[0].point.y.toFixed(2)),
      Number(hits[0].point.z.toFixed(2))
    ];
  }

  return {
    player_position: [Number(xrOrigin.position.x.toFixed(2)), Number((xrOrigin.position.y + eyeHeight).toFixed(2)), Number(xrOrigin.position.z.toFixed(2))],
    head_direction: [Number(headDir.x.toFixed(3)), Number(headDir.y.toFixed(3)), Number(headDir.z.toFixed(3))],
    controller_direction: [Number(dir.x.toFixed(3)), Number(dir.y.toFixed(3)), Number(dir.z.toFixed(3))],
    targeted_asset_id: targetId,
    targeted_asset_label: targetLabel,
    targeted_hit_point: hitPt,
    active_lod_index: currentLodIdx,
    active_lod_label: LOD_TIERS[currentLodIdx].label,
    comparison_mode: comparisonMode,
    active_style_index: currentStyleIdx,
    active_style: STYLES[currentStyleIdx].name,
    scene_triangles: activeSceneTriangles,
    isolated_asset_id: isolatedAssetId,
    locomotion_mode: vrSkyFlightLatched || desktopSkyFlightLatched ? 'sky_flight' : (comparisonMode !== 'none' ? comparisonMode : (isolatedAssetId !== 'all' ? 'asset_turntable' : 'ground_explore'))
  };
}

function sendVrSpatialRequest(transcriptText) {
  if (!transcriptText || !transcriptText.trim()) return;
  const ctx = getSpatialAndTargetContext();
  const payload = { ...ctx, transcript: transcriptText.trim(), timestamp: new Date().toISOString() };

  const history = JSON.parse(localStorage.getItem('wildvr_voice_requests') || '[]');
  history.push(payload);
  localStorage.setItem('wildvr_voice_requests', JSON.stringify(history));

  const micBadge = document.getElementById('mic-badge');
  if (micBadge) micBadge.textContent = `Sent (${ctx.targeted_asset_id}): "${transcriptText.slice(0, 28)}..."`;

  ['https://192.168.86.226:8443/api/vr-request', 'http://localhost:8765/api/vr-request'].forEach((endpoint) => {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  });
}

function triggerVoiceRequest(activeInputSrc = null) {
  const ctx = getSpatialAndTargetContext();
  const micBadge = document.getElementById('mic-badge');
  pulseHaptics(activeInputSrc, 0.8, 120);

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    try {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      if (micBadge) micBadge.textContent = `🎤 Listening (Target: ${ctx.targeted_asset_id})...`;
      rec.onresult = (ev) => {
        const spoken = ev.results[0][0].transcript;
        sendVrSpatialRequest(spoken);
        pulseHaptics(activeInputSrc, 0.9, 160);
      };
      rec.onerror = () => {
        const fallback = window.prompt(`Voice Request for [${ctx.targeted_asset_label}] (${ctx.active_lod_label}):`, '');
        if (fallback) sendVrSpatialRequest(fallback);
        else if (micBadge) micBadge.textContent = 'Mic: Ready [Hold A / M]';
      };
      rec.start();
      return;
    } catch (e) {
      console.warn('SpeechRecognition fallback:', e);
    }
  }
  const typed = window.prompt(`Speak/Type Request for [${ctx.targeted_asset_label}] (${ctx.active_lod_label}):`, '');
  if (typed) sendVrSpatialRequest(typed);
}

// ============================================================================
// 9. PARABOLIC TELEPORT, DESKTOP CONTROLS & UI EVENT BINDINGS
// ============================================================================
const arcMaxPoints = 24;
const arcGeometry = new THREE.BufferGeometry().setFromPoints(
  Array.from({ length: arcMaxPoints }, () => new THREE.Vector3())
);
const arcLine = new THREE.Line(arcGeometry, new THREE.LineBasicMaterial({ color: 0xffb703, linewidth: 3 }));
arcLine.visible = false;
scene.add(arcLine);

const teleportRing = new THREE.Mesh(
  new THREE.RingGeometry(0.28, 0.44, 24),
  new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })
);
teleportRing.rotation.x = -Math.PI / 2;
teleportRing.visible = false;
scene.add(teleportRing);

const raycaster = new THREE.Raycaster();
function updateParabolicTeleport(customOrigin = null, customDir = null) {
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  if (customOrigin && customDir) {
    origin.copy(customOrigin);
    dir.copy(customDir).normalize();
  } else {
    camera.getWorldPosition(origin);
    camera.getWorldDirection(dir);
    origin.addScaledVector(dir, 0.35);
  }

  const vel = dir.clone().multiplyScalar(TELEPORT_SPEED);
  const totalT = 1.75;
  const pts = [];
  let hitPoint = null;

  for (let i = 0; i < arcMaxPoints; i++) {
    const t0 = (totalT * i) / (arcMaxPoints - 1);
    const t1 = (totalT * (i + 1)) / (arcMaxPoints - 1);
    const p0 = new THREE.Vector3(origin.x + vel.x * t0, origin.y + vel.y * t0 - 0.5 * GRAVITY * t0 * t0, origin.z + vel.z * t0);
    pts.push(p0);
    const p1 = new THREE.Vector3(origin.x + vel.x * t1, origin.y + vel.y * t1 - 0.5 * GRAVITY * t1 * t1, origin.z + vel.z * t1);
    const seg = p1.clone().sub(p0);
    const len = seg.length();
    if (len > 0.001 && !hitPoint) {
      raycaster.set(p0, seg.clone().normalize());
      raycaster.far = len;
      const hits = raycaster.intersectObjects(teleportableMeshes, false);
      if (hits.length > 0 && hits[0].face && hits[0].face.normal.y > 0.7) {
        hitPoint = hits[0].point.clone();
      }
    }
  }

  arcGeometry.setFromPoints(pts);
  arcLine.visible = true;
  if (hitPoint) {
    teleportRing.position.set(hitPoint.x, hitPoint.y + 0.04, hitPoint.z);
    teleportRing.visible = true;
    validTeleportTarget = hitPoint;
  } else {
    teleportRing.visible = false;
    validTeleportTarget = null;
  }
}

function executeTeleport() {
  if (validTeleportTarget) {
    xrOrigin.position.set(validTeleportTarget.x, validTeleportTarget.y, validTeleportTarget.z);
  }
  arcLine.visible = false;
  teleportRing.visible = false;
  validTeleportTarget = null;
}

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyT') isAimingTeleport = true;
  if (e.code === 'KeyG') desktopThumbsUp = true;
  if (e.code === 'KeyB') applyStyle(currentStyleIdx + 1);
  if (e.code === 'KeyN') applyStyle(currentStyleIdx - 1);
  if (e.code === 'KeyL') cycleLODMode();
  if (e.code === 'KeyM') triggerVoiceRequest();
  if (e.code === 'Tab') {
    e.preventDefault();
    document.getElementById('style-panel').classList.toggle('minimized');
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'KeyG') desktopThumbsUp = false;
  if (e.code === 'KeyT') {
    if (!desktopSkyFlightLatched) executeTeleport();
    isAimingTeleport = false;
    desktopSkyFlightLatched = false;
    desktopFlyHoldSec = 0.0;
    arcLine.visible = false;
    teleportRing.visible = false;
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDraggingLook = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  } else if (e.button === 2) {
    isAimingTeleport = true;
  }
});

window.addEventListener('mousemove', (e) => {
  if (isDraggingLook) {
    yaw -= (e.clientX - lastMouseX) * 0.0045;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastMouseY) * 0.0045, -Math.PI / 2.1, Math.PI / 2.1);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) isDraggingLook = false;
  if (e.button === 2) {
    if (!desktopSkyFlightLatched) executeTeleport();
    isAimingTeleport = false;
    desktopSkyFlightLatched = false;
    desktopFlyHoldSec = 0.0;
    arcLine.visible = false;
    teleportRing.visible = false;
  }
});
window.addEventListener('contextmenu', (e) => e.preventDefault());

document.getElementById('watch-header-toggle').addEventListener('click', () => {
  document.getElementById('style-panel').classList.toggle('minimized');
});
document.getElementById('select-style').addEventListener('change', (e) => applyStyle(Number(e.target.value)));
document.getElementById('select-lod').addEventListener('change', (e) => setActiveLODOrMode(e.target.value));
document.getElementById('btn-next-style').addEventListener('click', () => applyStyle(currentStyleIdx + 1));
document.getElementById('btn-next-lod').addEventListener('click', () => cycleLODMode());
document.getElementById('btn-compare-lods').addEventListener('click', () => enterComparisonLineup('compare_lods'));
document.getElementById('btn-compare-styles').addEventListener('click', () => enterComparisonLineup('compare_styles'));
document.getElementById('select-asset').addEventListener('change', (e) => isolateAsset(e.target.value, true));
document.getElementById('btn-approve-asset').addEventListener('click', () => approveCurrentAsset());
document.getElementById('btn-voice-req').addEventListener('click', () => triggerVoiceRequest());

document.getElementById('btn-tp-meadow').addEventListener('click', () => {
  isolateAsset('all', false);
  isDollhouse = false; xrOrigin.scale.set(1, 1, 1); xrOrigin.position.set(0, 0.25, 10.5); yaw = 0; pitch = -0.05;
  document.getElementById('asset-badge').textContent = 'Scene: Valley Meadow (1:1)';
});
document.getElementById('btn-tp-overlook').addEventListener('click', () => {
  isolateAsset('all', false);
  isDollhouse = false; xrOrigin.scale.set(1, 1, 1); xrOrigin.position.set(-16.8, 5.6, -11.5); yaw = -0.75; pitch = -0.22;
  document.getElementById('asset-badge').textContent = 'Scene: Smilodon Cliff Overlook (1:1)';
});
document.getElementById('btn-tp-mammoth').addEventListener('click', () => {
  isolateAsset('all', false);
  isDollhouse = false; xrOrigin.scale.set(1, 1, 1); xrOrigin.position.set(1.8, 0.25, 7.2); yaw = -0.45; pitch = 0.08;
  document.getElementById('asset-badge').textContent = 'Scene: By the Woolly Mammoth (1:1)';
});
document.getElementById('btn-dollhouse').addEventListener('click', (e) => {
  isolateAsset('all', false);
  isDollhouse = !isDollhouse;
  e.target.classList.toggle('active', isDollhouse);
  const s = isDollhouse ? 14.0 : 1.0;
  xrOrigin.scale.set(s, s, s);
  xrOrigin.position.set(0, 0.25, isDollhouse ? 16.0 : 10.5);
  document.getElementById('asset-badge').textContent = isDollhouse ? 'Scale: 1:14 Giant Overview' : 'Scene: Full Prehistoric Valley';
});

document.getElementById('btn-enter-vr').addEventListener('click', async () => {
  if (navigator.xr) {
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (supported) {
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
        });
        renderer.xr.setSession(session);
        document.getElementById('mode-badge').textContent = 'Mode: Wild VR (Quest 3)';
        return;
      }
    } catch (err) {
      console.warn('WebXR fallback:', err);
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================================
// 10. QUEST 3 SINGLE-CONTROLLER POLLING & MAIN ANIMATION LOOP
// ============================================================================
function pollXRControllers(dt, camFwd) {
  const session = renderer.xr.getSession();
  if (!session) return false;
  snapTurnCooldown = Math.max(0, snapTurnCooldown - dt);

  let aimingNow = false;
  let flyingNow = false;
  let pointingUpWithStick = false;
  let activeOrigin = new THREE.Vector3();
  let activeDir = new THREE.Vector3();
  let activeInputSrc = null;
  let anyBtnA = false;
  let anyBtnB = false;
  let anyGripThumbsUp = false;

  session.inputSources.forEach((src, idx) => {
    const gp = src.gamepad;
    const ctrl = xrControllers[idx] || activeController;
    if (!gp || !ctrl) return;
    if (handGroup.parent !== ctrl) ctrl.add(handGroup);

    const stickX = gp.axes.length >= 4 ? gp.axes[2] : (gp.axes[0] || 0);
    const stickY = gp.axes.length >= 4 ? gp.axes[3] : (gp.axes[1] || 0);
    const triggerHeld = Boolean(gp.buttons[0] && gp.buttons[0].pressed);
    const gripHeld = Boolean((gp.buttons[1] && gp.buttons[1].pressed) || ctrl.userData.squeezeHeld);

    if (gripHeld) {
      anyGripThumbsUp = true;
      activeInputSrc = src;
    }

    if (gp.buttons[4] && gp.buttons[4].pressed) { anyBtnA = true; activeInputSrc = src; }
    if (gp.buttons[5] && gp.buttons[5].pressed) { anyBtnB = true; activeInputSrc = src; }

    if (Math.abs(stickX) > 0.65 && snapTurnCooldown <= 0) {
      xrOrigin.rotation.y -= Math.sign(stickX) * (Math.PI / 6);
      snapTurnCooldown = 0.28;
    }

    const cOrigin = new THREE.Vector3();
    const cDir = new THREE.Vector3(0, 0, -1);
    ctrl.getWorldPosition(cOrigin);
    cDir.applyQuaternion(ctrl.getWorldQuaternion(tempQuat)).normalize();
    const ctrlPitchDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(cDir.y, -1, 1)));

    if (!triggerHeld && stickY < -0.45) {
      activeInputSrc = src;
      if (vrSkyFlightLatched) {
        flyingNow = true;
        const throttle = Math.max(0.55, Math.abs(stickY));
        xrOrigin.position.addScaledVector(cDir, FLY_SPEED * throttle * dt);
        xrOrigin.position.y = Math.max(0.0, xrOrigin.position.y);
      } else if (ctrlPitchDeg >= FLY_PITCH_THRESHOLD_DEG) {
        pointingUpWithStick = true;
        vrFlyHoldSec += dt;
        if (vrFlyHoldSec >= FLY_LAUNCH_DELAY_SEC) {
          vrSkyFlightLatched = true;
          flyingNow = true;
          pulseHaptics(src, 0.95, 220);
        }
      } else {
        vrFlyHoldSec = 0.0;
        aimingNow = true;
        activeOrigin.copy(cOrigin);
        activeDir.copy(cDir);
      }
    } else if (triggerHeld && Math.abs(stickY) > 0.2) {
      if (vrSkyFlightLatched) {
        flyingNow = true;
        xrOrigin.position.addScaledVector(camFwd, -stickY * FLY_SPEED * dt);
      } else {
        const walkDir = new THREE.Vector3(cDir.x, 0, cDir.z).normalize();
        xrOrigin.position.addScaledVector(walkDir, -stickY * 3.0 * dt);
      }
    }
  });

  if (!pointingUpWithStick && !flyingNow) vrFlyHoldSec = 0.0;

  if (anyGripThumbsUp && !prevThumbsUpState) pulseHaptics(activeInputSrc, 0.45, 70);
  if (anyGripThumbsUp) {
    approveHoldSec += dt;
    if (approveHoldSec >= 1.0 && approveHoldSec - dt < 1.0) {
      approveCurrentAsset();
      pulseHaptics(activeInputSrc, 0.95, 200);
    }
  } else {
    approveHoldSec = 0.0;
  }
  prevThumbsUpState = anyGripThumbsUp;
  vrThumbsUpActive = anyGripThumbsUp;

  // B Button -> Cycle 10 Shader/Rendering Styles; A Button Tap (<0.75s) -> Cycle LOD Tier & 4-Pedestal Lineups, Hold (>=0.75s) -> Voice Request!
  if (anyBtnB && !prevBtnB) { applyStyle(currentStyleIdx + 1); pulseHaptics(activeInputSrc, 0.55, 60); }
  if (anyBtnA) {
    btnAHoldSec += dt;
    if (btnAHoldSec >= 0.75 && !btnAVoiceTriggered) {
      btnAVoiceTriggered = true;
      triggerVoiceRequest(activeInputSrc);
    }
  } else {
    if (prevBtnA && !btnAVoiceTriggered) {
      cycleLODMode();
      pulseHaptics(activeInputSrc, 0.55, 60);
    }
    btnAHoldSec = 0.0;
    btnAVoiceTriggered = false;
  }
  prevBtnA = anyBtnA;
  prevBtnB = anyBtnB;

  if (flyingNow || pointingUpWithStick) {
    arcLine.visible = false;
    teleportRing.visible = false;
  } else if (aimingNow) {
    updateParabolicTeleport(activeOrigin, activeDir);
  } else if (vrWasAimingTeleport && !vrSkyFlightLatched) {
    executeTeleport();
    pulseHaptics(activeInputSrc, 0.35, 45);
  }

  if (!aimingNow && !flyingNow && !pointingUpWithStick) {
    vrSkyFlightLatched = false;
    if (!isAimingTeleport) {
      arcLine.visible = false;
      teleportRing.visible = false;
    }
  }
  vrWasAimingTeleport = aimingNow;
  return flyingNow;
}

function updateHandPose(dt) {
  const thumbsUp = vrThumbsUpActive || desktopThumbsUp;
  const tpActive = isAimingTeleport || vrWasAimingTeleport;
  const chargeRatio = Math.min(1.0, Math.max(vrFlyHoldSec, desktopFlyHoldSec) / FLY_LAUNCH_DELAY_SEC);

  if (thumbsUp) {
    fingerIndex.rotation.x = -1.45;
    fingerMiddle.rotation.x = -1.45;
    fingerRing.rotation.x = -1.45;
    fingerPinky.rotation.x = -1.45;
    fingerThumbPivot.rotation.set(0, 0, 0);
    palmMesh.rotation.z = 0.35;
    materials.wristRing.color.setHex(0x52b788);
    wristRingMesh.scale.setScalar(1.35);
  } else {
    palmMesh.rotation.z = 0.0;
    fingerThumbPivot.rotation.set(0.55, 0, -0.65);
    fingerIndex.rotation.x = tpActive ? 0.0 : -0.4;
    fingerMiddle.rotation.x = tpActive ? 0.0 : -0.48;
    fingerRing.rotation.x = tpActive ? -1.35 : -0.55;
    fingerPinky.rotation.x = tpActive ? -1.35 : -0.62;
    if (chargeRatio > 0.02) {
      materials.wristRing.color.setHex(0xffb703);
      wristRingMesh.scale.setScalar(0.8 + chargeRatio * 0.9);
    } else {
      materials.wristRing.color.setHex(0x52b788);
      wristRingMesh.scale.setScalar(1.0);
    }
  }
}

// Drag-and-Drop Pre-Rigged .GLB / .GLTF Hero Model Override Support
window.addEventListener('dragover', (e) => { e.preventDefault(); });
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file || !/\.(glb|gltf)$/i.test(file.name)) return;
  const targetId = isolatedAssetId !== 'all' ? isolatedAssetId : 'woolly_mammoth';
  const url = URL.createObjectURL(file);
  gltfLoader.load(url, (gltf) => {
    const matMap = { woolly_mammoth: 'mammothFur', megaloceros: 'elkCoat', smilodon: 'smilodonCoat', teratorn_vulture: 'cliff' };
    glbHeroCache[targetId] = {
      scene: gltf.scene,
      animations: gltf.animations || [],
      matKey: matMap[targetId] || 'mammothFur',
      boneScales: { Spine1: [1.08, 1.16, 1.08], Neck: [1.05, 1.12, 1.05] }
    };
    setActiveLODOrMode(comparisonMode !== 'none' ? comparisonMode : String(currentLodIdx));
    URL.revokeObjectURL(url);
  });
});

function updateBiomechanicalAnimations(dt, t) {
  activeGLBMixers.forEach((mixer) => mixer.update(dt));

  activeSwayFoliage.forEach((item) => {
    item.pivot.rotation.z = Math.sin(t * 1.15 + item.phase) * 0.022;
    item.pivot.rotation.x = Math.cos(t * 0.85 + item.phase) * 0.016;
  });

  activeAnimatedCreatures.forEach((c) => {
    if (c.kind === 'avian_soar') {
      const flapPhase = t * c.speed + c.seed;
      c.wingRigs.forEach((w) => {
        w.innerPivot.rotation.z = w.side * (0.08 + Math.sin(flapPhase) * 0.34);
        w.outerPivot.rotation.z = w.side * Math.sin(flapPhase - 0.65) * 0.42;
      });
      if (c.tailPivot) c.tailPivot.rotation.x = Math.cos(flapPhase) * 0.12;
      return;
    }

    // 4-Limb 3-Joint Quadruped Gait (Hip/Shoulder Swing + Knee Lift Flexion + Fetlock/Ankle Strike)
    if (c.limbs) {
      c.limbs.forEach((limb) => {
        const p = t * c.speed + limb.phase + c.seed;
        const swing = Math.sin(p);
        const lift = Math.max(0, Math.cos(p));
        limb.root.rotation.x = swing * c.strideAmp;
        limb.knee.rotation.x = -lift * c.strideAmp * 1.65;
        limb.ankle.rotation.x = lift * c.strideAmp * 0.95 - swing * 0.14;
      });
    }

    if (c.spineRoot) {
      c.spineRoot.position.y = Math.abs(Math.sin(t * c.speed + c.seed)) * 0.036;
      c.spineRoot.rotation.z = Math.sin(t * c.speed + c.seed) * 0.026;
      c.spineRoot.rotation.x = Math.cos(t * c.speed * 2.0 + c.seed) * 0.016;
    }

    if (c.kind === 'graviportal_amble') {
      if (c.headPivot) {
        c.headPivot.rotation.y = Math.sin(t * 0.55 + c.seed) * 0.16;
        c.headPivot.rotation.x = Math.sin(t * 1.1 + c.seed) * 0.065;
      }
      if (c.earPivots) {
        c.earPivots.forEach((ep, idx) => {
          const side = idx === 0 ? -1 : 1;
          ep.rotation.y = side * (0.38 + Math.sin(t * 2.2 + idx) * 0.14);
        });
      }
    } else if (c.kind === 'cervid_trot') {
      if (c.neckPivot) c.neckPivot.rotation.x = Math.sin(t * 0.65 + c.seed) * 0.16;
      if (c.headPivot) {
        c.headPivot.rotation.y = Math.sin(t * 0.82 + c.seed) * 0.24;
        c.headPivot.rotation.z = Math.cos(t * 0.54 + c.seed) * 0.06;
      }
    } else if (c.kind === 'predator_prowl') {
      if (c.headPivot) {
        c.headPivot.rotation.y = Math.sin(t * 0.75 + c.seed) * 0.22;
        c.headPivot.rotation.x = Math.cos(t * 0.95 + c.seed) * 0.08;
      }
      if (c.jawPivot) {
        c.jawPivot.rotation.x = Math.max(0, Math.sin(t * 1.55 + c.seed) - 0.15) * 0.48;
      }
      if (c.tailPivot) {
        c.tailPivot.rotation.z = Math.sin(t * 3.1 + c.seed) * 0.22;
      }
    }
  });
}

// Initialize at LOD 2 (High-Poly Sculpted Organic) + Style 1 (Textured Organic PBR)
rebuildFullValleyScene(2);
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  updateBiomechanicalAnimations(dt, t);
  activeTrunkPivots.forEach((piv) => {
    piv.rotation.z = Math.sin(t * 1.4) * 0.14;
    piv.rotation.x = Math.cos(t * 0.9) * 0.08;
  });
  vultureFlock.rotation.y = t * 0.18;
  if (turntableGroup.visible) {
    turntableSpecimenSlot.rotation.y = t * 0.36;
  }
  if (comparisonArenaGroup.visible) {
    rotatingPedestalSlots.forEach((slot) => {
      slot.rotation.y = t * 0.34;
    });
  }

  if (!renderer.xr.isPresenting) {
    if (keys['ArrowLeft']) yaw += 1.6 * dt;
    if (keys['ArrowRight']) yaw -= 1.6 * dt;
    if (keys['ArrowUp']) pitch = Math.min(Math.PI / 2.1, pitch + 1.2 * dt);
    if (keys['ArrowDown']) pitch = Math.max(-Math.PI / 2.1, pitch - 1.2 * dt);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  const camFwd = new THREE.Vector3();
  camera.getWorldDirection(camFwd);
  const pitchDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(camFwd.y, -1, 1)));

  const isVrFlying = renderer.xr.isPresenting ? pollXRControllers(dt, camFwd) : false;

  if (isAimingTeleport) {
    if (desktopSkyFlightLatched) {
      arcLine.visible = false; teleportRing.visible = false;
      xrOrigin.position.addScaledVector(camFwd, FLY_SPEED * dt);
    } else if (pitchDeg >= FLY_PITCH_THRESHOLD_DEG) {
      arcLine.visible = false; teleportRing.visible = false;
      desktopFlyHoldSec += dt;
      if (desktopFlyHoldSec >= FLY_LAUNCH_DELAY_SEC) desktopSkyFlightLatched = true;
    } else {
      desktopFlyHoldSec = 0.0;
      updateParabolicTeleport();
    }
  }

  updateHandPose(dt);

  const isFlyingNow = forceFlyMode || desktopSkyFlightLatched || isVrFlying;
  const moveSpeed = (isFlyingNow ? FLY_SPEED : 3.8) * dt;
  const fwdFlat = new THREE.Vector3(camFwd.x, 0, camFwd.z).normalize();
  const rightFlat = new THREE.Vector3().crossVectors(fwdFlat, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys['KeyW']) xrOrigin.position.addScaledVector(isFlyingNow ? camFwd : fwdFlat, moveSpeed);
  if (keys['KeyS']) xrOrigin.position.addScaledVector(isFlyingNow ? camFwd : fwdFlat, -moveSpeed);
  if (keys['KeyA']) xrOrigin.position.addScaledVector(rightFlat, -moveSpeed);
  if (keys['KeyD']) xrOrigin.position.addScaledVector(rightFlat, moveSpeed);

  if (!isFlyingNow && !renderer.xr.isPresenting && xrOrigin.position.y > 0.25 && xrOrigin.position.x > -10) {
    xrOrigin.position.y = Math.max(0.25, xrOrigin.position.y - 3.5 * dt);
  }

  const modeBadge = document.getElementById('mode-badge');
  if (!renderer.xr.isPresenting && modeBadge) {
    if (desktopThumbsUp) modeBadge.textContent = 'Mode: Thumbs-Up Gesture!';
    else if (desktopSkyFlightLatched) modeBadge.textContent = 'Mode: Sky Flight Launched!';
    else if (desktopFlyHoldSec > 0.05) modeBadge.textContent = `Charging Flight (${desktopFlyHoldSec.toFixed(1)}/1.8s)...`;
    else modeBadge.textContent = 'Mode: Desktop Wild VR';
  }
  const telemetry = document.getElementById('telemetry-readout');
  if (telemetry) {
    telemetry.innerHTML = `Pos: (${xrOrigin.position.x.toFixed(1)}, ${(xrOrigin.position.y + eyeHeight).toFixed(1)}, ${xrOrigin.position.z.toFixed(1)}) | ${LOD_TIERS[currentLodIdx].short} (${activeSceneTriangles.toLocaleString()} tris) | [B] Style [L/A] LOD`;
  }

  renderer.render(scene, camera);
});
