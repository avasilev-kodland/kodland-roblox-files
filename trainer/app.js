// Мастерская Бита — тренажёр Roblox Studio для урока М1У1.
// Те же задания, что в уроке: мост (Anchor) → мастерская → собрать одну вещь своего уровня (Move, Rotate, Scale, Group, Anchor) → сохранение.
// Потом по желанию ⭐ Звёздная тропа.
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { T, LANGS } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const r2 = (v) => Math.round(v * 100) / 100;

// ---------- язык и прогресс ----------
const params = new URLSearchParams(location.search);
const navLang = (navigator.language || "").slice(0, 2).toLowerCase();
let lang = LANGS.includes(params.get("lang")) ? params.get("lang") : LANGS.includes(navLang) ? navLang : "en";
let L = T(lang);

const KEY = "bitWorkshop.v3"; // v1, v2 — прежние квесты, их прогресс не подходит
let store = { done: [], stage: 0 };
try { Object.assign(store, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* без хранилища тоже работает */ }
function saveStore() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* приватное окно */ } }

// ---------- сцена ----------
const view = $("view");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  $("err").style.display = "grid";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
view.prepend(renderer.domElement);
renderer.domElement.tabIndex = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ec5ee);
scene.fog = new THREE.Fog(0x8ec5ee, 170, 460);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1200);
scene.add(new THREE.HemisphereLight(0xe3f2ff, 0x5d6b48, 1.15));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(60, 110, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, far: 320 });
sun.shadow.bias = -0.0005;
scene.add(sun);

function resize() {
  const r = view.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);

// ---------- материалы ----------
function canvasTex(draw, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const grey = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;
const TEX = {
  WoodPlanks: canvasTex((g, s) => {
    for (let i = 0; i < 4; i++) {
      const y = (i * s) / 4;
      g.fillStyle = grey(rnd(185, 225));
      g.fillRect(0, y, s, s / 4);
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(90,90,90,${rnd(0.08, 0.2)})`;
        g.beginPath();
        const yy = y + rnd(2, s / 4 - 2);
        g.moveTo(0, yy);
        g.bezierCurveTo(s / 3, yy + rnd(-3, 3), (2 * s) / 3, yy + rnd(-3, 3), s, yy);
        g.stroke();
      }
      g.fillStyle = "rgba(40,40,40,.55)";
      g.fillRect(0, y, s, 2);
      g.fillRect(((i * 37) % s) | 0, y, 2, s / 4);
    }
  }),
  Basalt: canvasTex((g, s) => {
    g.fillStyle = grey(150);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { g.fillStyle = grey(rnd(90, 200)); g.fillRect(rnd(0, s), rnd(0, s), rnd(2, 7), rnd(2, 7)); }
  }),
  Grass: canvasTex((g, s) => {
    g.fillStyle = grey(205);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 700; i++) { g.fillStyle = grey(rnd(150, 255)); g.fillRect(rnd(0, s), rnd(0, s), 1.5, rnd(2, 5)); }
  }),
  Ice: canvasTex((g, s) => {
    g.fillStyle = grey(245);
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(150,150,150,.5)";
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(rnd(0, s), rnd(0, s)); g.lineTo(rnd(0, s), rnd(0, s)); g.stroke(); }
  }),
  CrackedLava: canvasTex((g, s) => {
    g.fillStyle = grey(55);
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "#fff";
    g.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      let x = rnd(0, s), y = rnd(0, s);
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += rnd(-22, 22); y += rnd(-22, 22); g.lineTo(x, y); }
      g.stroke();
    }
  }),
};
const MATS = ["Plastic", "WoodPlanks", "Basalt", "Grass", "Ice", "Glass", "Neon", "CrackedLava"];
const MAT_SWATCH = {
  Plastic: "radial-gradient(circle at 35% 35%, #eee, #9a9a9a)",
  WoodPlanks: "repeating-linear-gradient(0deg, #b47b45 0 6px, #8d5a2c 6px 8px)",
  Basalt: "radial-gradient(circle at 35% 35%, #6a6a70, #2c2c30)",
  Grass: "radial-gradient(circle at 35% 35%, #8fd16a, #3f7f2a)",
  Ice: "radial-gradient(circle at 35% 35%, #ffffff, #a9d8ff)",
  Glass: "radial-gradient(circle at 35% 35%, rgba(255,255,255,.9), rgba(140,200,255,.35))",
  Neon: "radial-gradient(circle at 50% 50%, #fff, #ff4fd8 55%, #b0008e)",
  CrackedLava: "radial-gradient(circle at 35% 35%, #ff9b3d, #3a2a26 60%)",
};
function makeMat(p) {
  const col = new THREE.Color(p.color);
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0 });
  const base = TEX[p.material];
  if (base) {
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.max(p.size[0], p.size[2]) / 5), Math.max(1, p.size[1] / 5));
    m.map = t;
  }
  let opacity = 1;
  if (p.material === "Neon") { m.color = col.clone().multiplyScalar(0.6); m.emissive = col.clone(); m.emissiveIntensity = 1; m.roughness = 1; m.toneMapped = false; }
  if (p.material === "Glass") { opacity = 0.45; m.roughness = 0.05; m.metalness = 0.25; }
  if (p.material === "Ice") { opacity = 0.82; m.roughness = 0.08; }
  if (p.material === "CrackedLava") { m.emissive = new THREE.Color(0xff5a00); m.emissiveMap = m.map; m.emissiveIntensity = 1.3; }
  if (p.material === "Basalt") m.roughness = 0.95;
  if (p.material === "Grass") m.roughness = 1;
  if (p.material === "WoodPlanks") m.roughness = 0.8;
  opacity *= 1 - (p.transparency || 0);
  if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = opacity > 0.5; }
  return m;
}
const sm = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });

// ---------- геометрия деталей ----------
const GEO = {};
function geo(shape) {
  if (GEO[shape]) return GEO[shape];
  let g;
  const c = [-0.5, 0.5];
  if (shape === "Block") g = new THREE.BoxGeometry(1, 1, 1);
  else if (shape === "Sphere") g = new THREE.SphereGeometry(0.5, 28, 18);
  else if (shape === "Cylinder") { g = new THREE.CylinderGeometry(0.5, 0.5, 1, 28); g.rotateZ(Math.PI / 2); }
  else if (shape === "Wedge") {
    const pts = [];
    for (const x of c) pts.push(V(x, -0.5, -0.5), V(x, -0.5, 0.5), V(x, 0.5, 0.5));
    g = new ConvexGeometry(pts);
  } else if (shape === "CornerWedge") {
    g = new ConvexGeometry([V(-0.5, -0.5, -0.5), V(0.5, -0.5, -0.5), V(-0.5, -0.5, 0.5), V(0.5, -0.5, 0.5), V(0.5, 0.5, -0.5)]);
  } else if (shape === "Star") {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.22 : 0.5;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 2 });
    g.center();
  }
  g.computeBoundingBox();
  return (GEO[shape] = g);
}
const EDGE_GEO = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

// ---------- детали ----------
let parts = [], statics = [], decor = [], animators = [], selected = [], hovered = null, undoStack = [];
let nextId = 1;
let world = { kind: 0, spawn: V(0, 0, 20) };

function addPart(d) {
  const p = Object.assign({ id: nextId++, name: "Part", shape: "Block", size: [4, 1, 2], pos: [0, 0.5, 0], rot: [0, 0, 0], color: "#a3a2a5", material: "Plastic", anchored: false, transparency: 0, model: null, user: false, locked: false, tag: "" }, d);
  if (d.id && d.id >= nextId) nextId = d.id + 1;
  const mesh = new THREE.Mesh(geo(p.shape), makeMat(p));
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.part = p;
  const edges = new THREE.LineSegments(EDGE_GEO, new THREE.LineBasicMaterial({ color: 0x2f9bff, depthTest: false, transparent: true }));
  edges.scale.setScalar(1.02);
  edges.renderOrder = 10;
  edges.visible = false;
  mesh.add(edges);
  p.mesh = mesh;
  p.edges = edges;
  syncMesh(p);
  scene.add(mesh);
  parts.push(p);
  return p;
}
function syncMesh(p) {
  p.mesh.position.fromArray(p.pos);
  p.mesh.rotation.set(p.rot[0] * DEG, p.rot[1] * DEG, p.rot[2] * DEG);
  p.mesh.scale.fromArray(p.size);
  p.mesh.updateMatrixWorld(true);
}
function fromMesh(p) {
  const m = p.mesh;
  p.pos = m.position.toArray().map(r2);
  p.rot = [m.rotation.x, m.rotation.y, m.rotation.z].map((v) => r2(v / DEG));
  p.size = m.scale.toArray().map((v) => Math.max(0.2, r2(Math.abs(v))));
  m.scale.fromArray(p.size);
}
function restyle(p) { p.mesh.material.dispose(); p.mesh.material = makeMat(p); }
function removePart(p) {
  scene.remove(p.mesh);
  p.mesh.material.dispose();
  parts = parts.filter((x) => x !== p);
  selected = selected.filter((x) => x !== p);
}
function ser(p) { const { mesh, edges, ...d } = p; return JSON.parse(JSON.stringify(d)); }
const byTag = (tag) => parts.find((p) => p.tag === tag);
const partBox = (p, out = new THREE.Box3()) => out.copy(p.mesh.geometry.boundingBox).applyMatrix4(p.mesh.matrixWorld);

function addStatic(mesh, solid = true) {
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.updateMatrixWorld(true);
  scene.add(mesh);
  (solid ? statics : decor).push(mesh);
  return mesh;
}
function clearWorld() {
  for (const p of [...parts]) removePart(p);
  for (const m of [...statics, ...decor]) scene.remove(m);
  statics = []; decor = []; animators = []; selected = []; undoStack = []; hovered = null;
  tc.detach();
}

// ---------- окружение ----------
function island(x, z, w, d, grassColor = "#5fa83c") {
  const grassMat = new THREE.MeshStandardMaterial({ color: grassColor, roughness: 1, map: TEX.Grass.clone() });
  grassMat.map.needsUpdate = true;
  grassMat.map.repeat.set(w / 8, d / 8);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), grassMat);
  top.position.set(x, -1, z);
  addStatic(top);
  const earth = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 7, d - 1), sm("#7a5236"));
  earth.position.set(x, -5.5, z);
  addStatic(earth);
  const rock = new THREE.Mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.48, 26, 7), sm("#6d6a66", { flatShading: true }));
  rock.rotation.x = Math.PI;
  rock.position.set(x, -22, z);
  addStatic(rock, false);
}
function tree(x, z, h = 7) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, h * 0.45, 8), sm("#7b4f2c"));
  trunk.position.y = h * 0.22;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.36, 0), sm("#3f8f3a", { flatShading: true }));
  crown.position.y = h * 0.62;
  for (const m of [trunk, crown]) { m.castShadow = true; g.add(m); }
  g.position.set(x, 0, z);
  addStatic(g, false);
}
function farIsland(x, y, z, s) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(s, s * 0.3, s * 0.9, 7), sm("#7f9a6a", { flatShading: true }));
  m.position.set(x, y, z);
  addStatic(m, false);
  animators.push((t) => { m.position.y = y + Math.sin(t * 0.4 + x) * 1.5; });
}
function makeBit() {
  const g = new THREE.Group();
  const white = sm("#f4f6fa", { roughness: 0.35 }), blue = sm("#2f6fe0", { roughness: 0.4 });
  const glow = new THREE.MeshStandardMaterial({ color: "#5ff3ff", emissive: "#3fe0ff", emissiveIntensity: 1.6 });
  const add = (geom, mat, x, y, z, f) => { const m = new THREE.Mesh(geom, mat); m.position.set(x, y, z); m.castShadow = true; if (f) f(m); g.add(m); return m; };
  add(new THREE.SphereGeometry(1.1, 24, 16), white, 0, 1.2, 0, (m) => m.scale.set(1, 0.95, 1));
  add(new THREE.TorusGeometry(1.06, 0.16, 8, 32), blue, 0, 0.95, 0, (m) => (m.rotation.x = Math.PI / 2));
  add(new THREE.SphereGeometry(0.3, 16, 12), glow, 0, 1.35, 1.0);
  add(new THREE.TorusGeometry(0.72, 0.22, 8, 24), sm("#e53935"), 0, 2.15, 0, (m) => (m.rotation.x = Math.PI / 2));
  add(new THREE.BoxGeometry(2.3, 1.8, 1.6), white, 0, 3.2, 0);
  add(new THREE.BoxGeometry(1.9, 1.35, 0.1), sm("#1d2330", { roughness: 0.3 }), 0, 3.2, 0.79);
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.45, 0.16, 0.05), glow, s * 0.45, 3.35, 0.86);
    add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 20), blue, s * 1.27, 3.2, 0, (m) => (m.rotation.z = Math.PI / 2));
    add(new THREE.SphereGeometry(0.38, 16, 12), blue, s * 1.45, 1.5, 0.3);
  }
  add(new THREE.TorusGeometry(0.28, 0.05, 6, 16, Math.PI), glow, 0, 2.98, 0.86, (m) => (m.rotation.z = Math.PI));
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), sm("#333"), 0, 4.4, 0);
  add(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: "#ffd84a", emissive: "#ffcc00", emissiveIntensity: 1.2 }), 0, 4.75, 0);
  g.scale.setScalar(1.35);
  return g;
}
function placeBit(x, z, rotY = 0) {
  const b = makeBit();
  b.position.set(x, 0, z);
  b.rotation.y = rotY;
  addStatic(b, false);
  animators.push((t) => { b.position.y = 0.6 + Math.sin(t * 2) * 0.35; b.rotation.z = Math.sin(t * 1.3) * 0.05; });
  return b;
}
const calm = { bridge: false, lamp: false, sign: false, bench: false, portal: false };
function glitchPixels(cx, cy, cz, n = 10, spread = 2.5, key = "holes") {
  const mat = new THREE.MeshStandardMaterial({ color: "#a020ff", emissive: "#8a00ff", emissiveIntensity: 1.4 });
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
    const base = V(cx + rnd(-spread, spread) * 0.4, cy + rnd(-0.5, 1.5), cz + rnd(-spread, spread));
    m.position.copy(base);
    addStatic(m, false);
    const ph = rnd(0, 6);
    animators.push((t) => { m.visible = !calm[key] && Math.sin(t * 7 + ph) > -0.6; m.position.y = base.y + Math.sin(t * 3 + ph) * 0.3; });
  }
}

// ---------- мир: Хаб, мост и мастерская Бита ----------
// Как в уроке: мост без Anchored, в мастерской три разобранные вещи разного уровня
// (🟢 фонарь и 🟡 скамейка — со светящимся контуром, 🔴 указатель — по образцу рядом) и ⭐ Звёздная тропа к островку со звездой.
// Детали — {name, size, pos, rot} собранного вида и start — где лежат сейчас. locked — стоит на месте.
const OBJS = {
  lamp: { level: 1, pad: [22, -12], ghost: true, parts: [
    { name: "Base", size: [3, 1, 3], pos: [22, 0.5, -12], color: "#3b3b40", material: "Basalt", locked: true },
    { name: "Post", size: [1, 7, 1], pos: [22, 4.5, -12], color: "#3b3b40", material: "Basalt", start: { pos: [26, 0.5, -7], rot: [0, 0, 90] } },
    { name: "Lamp", shape: "Sphere", size: [2.4, 2.4, 2.4], pos: [22, 9.2, -12], color: "#ffd84a", material: "Neon", start: { pos: [17, 1.2, -8] } },
  ] },
  bench: { level: 2, pad: [36, -12], ghost: true, parts: [
    { name: "Leg", size: [0.8, 1.6, 1.8], pos: [33.8, 0.8, -12], color: "#5a3a22", material: "WoodPlanks", locked: true },
    { name: "Leg", size: [0.8, 1.6, 1.8], pos: [38.2, 0.8, -12], color: "#5a3a22", material: "WoodPlanks", start: { pos: [40, 0.4, -6], rot: [0, 0, 90] } },
    { name: "Seat", size: [6, 1, 2], pos: [36, 2.1, -12], color: "#b07a44", material: "WoodPlanks", start: { pos: [32, 0.5, -6], size: [2, 1, 1] } },
  ] },
  sign: { level: 3, pad: [50, -12], ghost: false, parts: [
    { name: "Post", size: [0.8, 6, 0.8], pos: [50, 3, -12], color: "#7b4f2c", material: "WoodPlanks", start: { pos: [54, 0.4, -6], rot: [0, 0, 90] } },
    { name: "Sign", size: [4, 1.6, 0.4], pos: [50, 5, -11.4], color: "#d9b26a", material: "WoodPlanks", start: { pos: [47, 0.2, -6], rot: [90, 0, 0] } },
    { name: "Top", shape: "Sphere", size: [1.2, 1.2, 1.2], pos: [50, 6.6, -12], color: "#5ff3ff", material: "Neon", start: { pos: [51, 0.6, -4] } },
  ] },
};
const PATH = { stones: [[40, 0.5, 25], [40, 1.5, 30], [40, 2.5, 35], [40, 3.5, 40]],
  start: [{ pos: [34, 0.5, 15], rot: [0, 30, 0] }, { pos: [41, 2, 16], rot: [0, 0, 90] }, { pos: [46, 0.5, 14], size: [2, 1, 2] }, { pos: [37, 0.5, 19] }] };
let portalMat, portalLight;
function ghost(shape, size, pos, rot = [0, 0, 0]) {
  const g = new THREE.Group();
  const fill = new THREE.Mesh(geo(shape), new THREE.MeshBasicMaterial({ color: 0x2fd9ff, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }));
  g.add(fill);
  const wire = shape === "Sphere" ? new THREE.WireframeGeometry(new THREE.SphereGeometry(0.5, 10, 6)) : EDGE_GEO;
  g.add(new THREE.LineSegments(wire, new THREE.LineBasicMaterial({ color: 0x0a7fc4, transparent: true, opacity: 0.85 })));
  g.position.fromArray(pos);
  g.rotation.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG);
  g.scale.fromArray(size);
  addStatic(g, false);
  animators.push((t) => { fill.material.opacity = 0.34 + Math.sin(t * 3) * 0.1; });
  return g;
}
const LEVEL_COLOR = { 1: "#5fcf7a", 2: "#f2c94c", 3: "#ef6a5a" };
function pad(x, z, level) {
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.1, 40), sm(LEVEL_COLOR[level], { roughness: 0.9 }));
  ring.position.set(x, 0.05, z);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.14, 40), sm("#8d939b", { roughness: 0.9 }));
  m.position.set(x, 0.07, z);
  for (const o of [ring, m]) { o.receiveShadow = true; addStatic(o, false); }
}
// образец 🔴 указателя: маленькая собранная копия на подставке рядом с площадкой
function miniSample(o) {
  const k = 0.35, [px, pz] = o.pad, base = V(px + 6.5, 1.6, pz + 3);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), sm("#6d6a66"));
  stand.position.set(base.x, 0.8, base.z);
  addStatic(stand);
  const g = new THREE.Group();
  g.position.copy(base);
  for (const d of o.parts) {
    const m = new THREE.Mesh(geo(d.shape || "Block"), makeMat({ ...d, transparency: 0 }));
    m.scale.fromArray(d.size.map((v) => v * k));
    m.position.set((d.pos[0] - px) * k, d.pos[1] * k, (d.pos[2] - pz) * k);
    m.castShadow = true;
    g.add(m);
  }
  addStatic(g, false);
  animators.push((t) => { g.rotation.y = Math.sin(t * 0.6) * 0.5; });
}
// stage — номер этапа: всё, что чинили раньше, уже починено
function buildWorld(stage) {
  clearWorld();
  world = { kind: 2, spawn: V(-24, 0, 0) };
  island(-40, 0, 60, 44);
  island(40, 0, 60, 44, "#67b34a");
  for (const s of [-1, 1]) for (const z of [-3.6, 3.6]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.5, 0.8), sm("#6b4426"));
    post.position.set(s * 10.6, 1.75, z);
    addStatic(post);
  }
  // арка портала на острове Хаба
  const stone = sm("#9aa0a8", { flatShading: true });
  for (const z of [-6, 6]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(2, 11, 2), stone); pl.position.set(-52, 5.5, z); addStatic(pl); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 14), stone);
  beam.position.set(-52, 12, 0);
  addStatic(beam);
  portalMat = new THREE.MeshStandardMaterial({ color: "#241a3a", emissive: "#2a0a55", emissiveIntensity: 0.4, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), portalMat);
  portal.position.set(-52, 5.5, 0);
  portal.rotation.y = Math.PI / 2;
  addStatic(portal, false);
  portalLight = new THREE.PointLight(0x8a5cff, 0, 40);
  portalLight.position.set(-49, 6, 0);
  scene.add(portalLight);
  decor.push(portalLight);
  // островок со звездой за мастерской
  const top = new THREE.Mesh(new THREE.BoxGeometry(11, 2, 11), new THREE.MeshStandardMaterial({ color: "#5fa83c", roughness: 1, map: TEX.Grass.clone() }));
  top.material.map.needsUpdate = true;
  top.position.set(40, 4, 48.5);
  addStatic(top);
  const rockS = new THREE.Mesh(new THREE.ConeGeometry(5.2, 12, 7), sm("#6d6a66", { flatShading: true }));
  rockS.rotation.x = Math.PI;
  rockS.position.set(40, -3, 48.5);
  addStatic(rockS, false);
  const star = new THREE.Mesh(geo("Star"), new THREE.MeshStandardMaterial({ color: "#ffd84a", emissive: "#ffcc00", emissiveIntensity: 1.3 }));
  star.scale.setScalar(3.4);
  star.position.set(40, 8, 49);
  addStatic(star, false);
  animators.push((t) => { star.rotation.y = t * 1.5; star.position.y = 8 + Math.sin(t * 2) * 0.3; });
  placeBit(26, 6, -Math.PI / 2);
  for (const [x, z, h] of [[-58, -16, 9], [-50, 15, 8], [-20, -17, 7], [64, 17, 8], [16, 18, 7], [67, -19, 8], [14, -19, 7]]) tree(x, z, h);
  farIsland(-150, 25, -180, 24); farIsland(170, 15, -140, 18); farIsland(30, 50, -250, 30); farIsland(-60, -10, 190, 18);
  // мост
  for (let i = 0; i < 10; i++) addPart({ name: "Plank", model: "Bridge", size: [1.9, 0.6, 6], pos: [-9 + i * 2, -0.3, 0], color: "#9c6a3c", material: "WoodPlanks", anchored: stage > 1 });
  // вещи мастерской; после этапа сборки фонарь уже собран (как у ученика после урока)
  for (const [key, o] of Object.entries(OBJS)) {
    pad(o.pad[0], o.pad[1], o.level);
    const done = stage > 3 && key === "lamp";
    for (const d of o.parts) {
      const s = !done && d.start ? d.start : {};
      addPart({ folder: "Workshop", obj: key, name: d.name, shape: d.shape || "Block", color: d.color, material: d.material,
        size: s.size || d.size, pos: s.pos || d.pos, rot: s.rot || [0, 0, 0], anchored: !!d.locked || done, locked: !!d.locked, model: done ? "Model" : null });
      if (o.ghost) ghost(d.shape || "Block", d.size, d.pos);
    }
    if (!o.ghost) miniSample(o);
  }
  // ⭐ камни тропы лежат в мастерской
  PATH.stones.forEach((pos, i) => {
    const s = PATH.start[i];
    addPart({ folder: "Star path", obj: "path", name: "Stone", size: s.size || [4, 1, 4], pos: s.pos, rot: s.rot || [0, 0, 0], color: "#9aa0a8", material: "Basalt" });
    ghost("Block", [4, 1, 4], pos);
  });
  glitchPixels(0, 0.4, 0, 9, 4, "bridge");
  for (const [key, o] of Object.entries(OBJS)) glitchPixels(o.pad[0], 2, o.pad[1], 6, 2, key);
  glitchPixels(40, 1.5, 32, 7, 3, "path");
  updateCalm();
}
// деталь на месте: её габариты совпадают с собранным видом (так проверяются и Move, и Rotate, и Scale)
const tmpB = new THREE.Box3(), tgtV = V(), sizeV = V();
function placed(p, d) {
  partBox(p, tmpB);
  const c = tmpB.getCenter(tgtV), s = tmpB.getSize(sizeV);
  return Math.abs(c.x - d.pos[0]) <= 1.1 && Math.abs(c.y - d.pos[1]) <= 1.1 && Math.abs(c.z - d.pos[2]) <= 1.1 &&
    Math.abs(s.x - d.size[0]) <= 0.7 && Math.abs(s.y - d.size[1]) <= 0.7 && Math.abs(s.z - d.size[2]) <= 0.7;
}
const objParts = (key) => parts.filter((p) => p.obj === key);
function objState(key) {
  const list = objParts(key);
  const targets = key === "path" ? PATH.stones.map((pos) => ({ pos, size: [4, 1, 4] })) : OBJS[key].parts;
  // камни тропы одинаковые — подходит любой камень на любой контур
  const used = new Set();
  let ok = 0;
  for (const d of targets) { const p = list.find((x) => !used.has(x) && placed(x, d)); if (p) { used.add(p); ok++; } }
  const grouped = list.length > 0 && list.every((p) => p.model) && new Set(list.map((p) => p.model)).size === 1;
  return { ok, n: targets.length, grouped, anchored: list.every((p) => p.anchored) };
}
const fixedAll = (st) => st.ok === st.n && st.grouped && st.anchored;
const fixed = { bridge: () => parts.some((p) => p.model === "Bridge") && parts.filter((p) => p.model === "Bridge").every((p) => p.anchored) };
function updateCalm() {
  calm.bridge = fixed.bridge();
  for (const k of [...Object.keys(OBJS), "path"]) calm[k] = objState(k).ok === objState(k).n;
}
function lightPortal() {
  calm.portal = true;
  portalMat.emissive.set("#5ff3ff");
  portalMat.color.set("#2a6f80");
  portalMat.emissiveIntensity = 1.4;
  portalLight.color.set("#5ff3ff");
  portalLight.intensity = 60;
  animators.push((t) => { portalMat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.3; });
}

// ---------- камера в режиме редактора ----------
let yaw = 0, pitch = -0.3, fly = null;
const keys = {};
const camDir = () => V(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
function setLook(from, to) {
  camera.position.copy(from);
  const d = to.clone().sub(from).normalize();
  pitch = Math.asin(d.y);
  yaw = Math.atan2(-d.x, -d.z);
  applyLook();
}
function applyLook() { camera.lookAt(camera.position.clone().add(camDir())); }
function stepEditCam(dt) {
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / 0.35);
    const k = 1 - Math.pow(1 - fly.t, 3);
    camera.position.lerpVectors(fly.from, fly.to, k);
    applyLook();
    if (fly.t >= 1) fly = null;
    return;
  }
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || "");
  if (typing) return;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 70 : 30) * dt;
  const f = camDir(), right = V().crossVectors(f, V(0, 1, 0)).normalize();
  if (keys.KeyW) camera.position.addScaledVector(f, sp);
  if (keys.KeyS) camera.position.addScaledVector(f, -sp);
  if (keys.KeyD) camera.position.addScaledVector(right, sp);
  if (keys.KeyA) camera.position.addScaledVector(right, -sp);
  if (keys.KeyE) camera.position.y += sp;
  if (keys.KeyQ) camera.position.y -= sp;
  if (keys.ArrowLeft) yaw += 1.6 * dt;
  if (keys.ArrowRight) yaw -= 1.6 * dt;
  if (keys.ArrowUp) pitch = Math.min(1.5, pitch + 1.2 * dt);
  if (keys.ArrowDown) pitch = Math.max(-1.5, pitch - 1.2 * dt);
  applyLook();
}
function focusSelected() {
  if (!selected.length || playing) return;
  const box = new THREE.Box3();
  for (const p of selected) box.union(partBox(p, new THREE.Box3()));
  const c = box.getCenter(V()), size = box.getSize(V()).length();
  fly = { t: 0, from: camera.position.clone(), to: c.clone().addScaledVector(camDir(), -(size * 1.6 + 6)) };
  emit("focus");
}

// ---------- инструменты ----------
const tc = new TransformControls(camera, renderer.domElement);
tc.setTranslationSnap(1);
tc.setRotationSnap(15 * DEG);
tc.setScaleSnap(1);
tc.setSize(0.95);
scene.add(tc);
let tool = "select", dragging = false;
tc.addEventListener("dragging-changed", (e) => {
  dragging = e.value;
  const p = selected[0];
  if (e.value) { pushHistory(); return; }
  if (p) { fromMesh(p); restyle(p); onChange(); }
});
tc.addEventListener("objectChange", () => {
  const p = selected[0];
  if (!p) return;
  if (tc.mode === "scale") { const s = p.mesh.scale; s.set(Math.max(1, Math.abs(s.x)), Math.max(1, Math.abs(s.y)), Math.max(1, Math.abs(s.z))); }
  fromMesh(p);
  renderProps();
});
function updateGizmo() {
  const p = selected.length === 1 ? selected[0] : null;
  if (!playing && p && !p.locked && ["move", "scale", "rotate"].includes(tool)) {
    tc.attach(p.mesh);
    tc.setMode({ move: "translate", scale: "scale", rotate: "rotate" }[tool]);
    tc.setSpace(tool === "move" ? "world" : "local");
  } else tc.detach();
}
function setTool(t) { tool = t; updateGizmo(); renderRibbonState(); }

// ---------- выделение ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...parts.map((p) => p.mesh), ...statics], false);
  return hits.length ? hits[0].object.userData.part || null : null;
}
function select(p, ev = {}) {
  const multi = ev.ctrlKey || ev.metaKey || ev.shiftKey;
  if (!p) { if (!multi) selected = []; }
  else {
    const group = p.model && !ev.altKey ? parts.filter((x) => x.model === p.model) : [p];
    if (multi) {
      const all = group.every((g) => selected.includes(g));
      selected = all ? selected.filter((x) => !group.includes(x)) : [...new Set([...selected, ...group])];
    } else selected = group;
  }
  refreshSel();
  emit("select");
}
function refreshSel() {
  for (const p of parts) {
    const on = selected.includes(p);
    p.edges.visible = on || p === hovered;
    p.edges.material.color.set(on ? 0x2f9bff : 0xa8d4ff);
  }
  updateGizmo();
  renderExplorer();
  renderProps();
  renderRibbonState();
}

// ---------- правки ----------
function pushHistory() { undoStack.push(parts.map(ser)); if (undoStack.length > 50) undoStack.shift(); }
function restoreParts(list) {
  for (const p of [...parts]) removePart(p);
  for (const d of list) addPart(d);
  selected = [];
  refreshSel();
}
function undo() { if (playing || !undoStack.length) return; restoreParts(undoStack.pop()); onChange(); }
const DEFAULT_SIZE = { Block: [4, 1, 2], Sphere: [2, 2, 2], Cylinder: [2, 2, 2], Wedge: [4, 1, 2], CornerWedge: [2, 2, 2] };
function insert(shape) {
  if (playing) return;
  closePops();
  pushHistory();
  const dir = camDir();
  ray.set(camera.position, dir);
  const hits = ray.intersectObjects([...statics, ...parts.map((p) => p.mesh)], false);
  let pt = hits.length && hits[0].distance < 40 ? hits[0].point : null;
  if (!pt) {
    const near = camera.position.clone().addScaledVector(dir, 22);
    ray.set(near.clone().setY(near.y + 60), V(0, -1, 0));
    const down = ray.intersectObjects([...statics, ...parts.map((p) => p.mesh)], false);
    pt = down.length ? down[0].point : near;
  }
  const size = [...DEFAULT_SIZE[shape]];
  const p = addPart({ shape, size, pos: [Math.round(pt.x), r2(pt.y + size[1] / 2), Math.round(pt.z)], user: true });
  selected = [p];
  if (tool === "select") tool = "move";
  refreshSel();
  onChange();
  emit("insert");
}
function editSel(fn) {
  const list = selected.filter((p) => !p.locked || fn.allowLocked);
  if (!list.length || playing) return;
  pushHistory();
  for (const p of list) { fn(p); restyle(p); syncMesh(p); }
  onChange();
}
const applyColor = (c) => { curColor = c; editSel((p) => (p.color = c)); renderRibbonState(); };
const applyMaterial = (m) => { curMat = m; editSel((p) => (p.material = m)); };
function toggleAnchor() {
  if (!selected.length || playing) return;
  const to = !selected.every((p) => p.anchored);
  editSel((p) => (p.anchored = to));
}
function deleteSel() {
  const list = selected.filter((p) => !p.locked);
  if (!list.length || playing) return;
  pushHistory();
  for (const p of list) removePart(p);
  selected = [];
  refreshSel();
  onChange();
}
function duplicateSel() {
  const list = selected.filter((p) => !p.locked);
  if (!list.length || playing) return;
  pushHistory();
  selected = list.map((p) => { const d = ser(p); delete d.id; d.user = true; d.model = null; d.tag = ""; return addPart(d); });
  refreshSel();
  onChange();
}
let modelN = 0;
function groupSel() {
  if (playing) return;
  if (selected.length < 2) { toast(L.q.groupNeed); return; }
  pushHistory();
  const used = new Set(parts.map((p) => p.model));
  let m = "Model";
  while (used.has(m)) m = "Model" + ++modelN;
  const folder = selected.find((p) => p.folder)?.folder || null;
  for (const p of selected) { p.model = m; p.folder = folder; }
  refreshSel();
  onChange();
}
let saveTimer = 0;
function onChange() {
  renderExplorer();
  renderProps();
  renderRibbonState();
  updateCalm();
  emit("change");
}

// ---------- Play ----------
let playing = false, snapshot = null, char = null, camYaw = 0, camDist = 16, lastFell = 0;
const GRAV = 95;
function play() {
  if (playing) return;
  closePops();
  snapshot = parts.map(ser);
  playing = true;
  selected = [];
  hovered = null;
  refreshSel();
  for (const p of parts) p.vy = 0;
  spawnChar();
  $("btnPlay").classList.remove("pulse");
  renderStatus();
  emit("play");
}
function stop() {
  if (!playing) return;
  lastFell = parts.filter((p) => p.model === "Bridge" && p.mesh.position.y < -6).length;
  playing = false;
  scene.remove(char.group);
  char = null;
  restoreParts(snapshot);
  setLook(camera.position.clone(), camera.position.clone().add(V(-Math.sin(camYaw), -0.35, -Math.cos(camYaw))));
  renderStatus();
  emit("stop");
}
function overlapXZ(a, b) { return a.min.x < b.max.x - 0.05 && a.max.x > b.min.x + 0.05 && a.min.z < b.max.z - 0.05 && a.max.z > b.min.z + 0.05; }
function supportTop(box, boxes, tol) {
  let top = -Infinity;
  for (const b of boxes) if (b !== box && overlapXZ(box, b) && b.max.y <= box.min.y + tol && b.max.y > top) top = b.max.y;
  return top;
}
function spawnChar() {
  const g = new THREE.Group();
  const add = (w, h, d, c, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sm(c, { roughness: 0.5 })); m.position.set(x, y, 0); m.castShadow = true; g.add(m); return m; };
  const legL = add(0.95, 2, 1, "#2f3a55", -0.5, 1), legR = add(0.95, 2, 1, "#2f3a55", 0.5, 1);
  add(2, 2, 1, "#2f86e8", 0, 3);
  const armL = add(0.9, 2, 0.9, "#f3c58a", -1.45, 3), armR = add(0.9, 2, 0.9, "#f3c58a", 1.45, 3);
  add(1.2, 1.2, 1.2, "#f3c58a", 0, 4.6);
  for (const m of [legL, legR, armL, armR]) m.geometry.translate(0, -0.9, 0), (m.position.y += 0.9);
  g.position.copy(world.spawn);
  scene.add(g);
  camYaw = -Math.PI / 2;
  g.rotation.y = camYaw + Math.PI;
  char = { group: g, vy: 0, grounded: false, legs: [legL, legR], arms: [armL, armR], walk: 0, reached: false };
}
const tmpBox = new THREE.Box3();
function stepPlay(dt) {
  const sBoxes = statics.map((m) => new THREE.Box3().setFromObject(m));
  const pBoxes = new Map(parts.map((p) => [p, partBox(p, new THREE.Box3())]));
  // детали без Anchored падают
  for (const p of parts) {
    if (p.anchored || p.mesh.position.y < -160) continue;
    p.vy -= GRAV * dt;
    let dy = p.vy * dt;
    const box = pBoxes.get(p);
    const top = supportTop(box, [...sBoxes, ...pBoxes.values()], 0.6);
    if (top > -Infinity && box.min.y + dy <= top) { dy = top - box.min.y; p.vy = 0; }
    p.mesh.position.y += dy;
    p.mesh.updateMatrixWorld(true);
    partBox(p, box);
  }
  // персонаж
  const c = char, g = c.group;
  const fwd = V(-Math.sin(camYaw), 0, -Math.cos(camYaw)), right = V(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const mv = V();
  if (keys.KeyW || keys.ArrowUp) mv.add(fwd);
  if (keys.KeyS || keys.ArrowDown) mv.sub(fwd);
  if (keys.KeyD || keys.ArrowRight) mv.add(right);
  if (keys.KeyA || keys.ArrowLeft) mv.sub(right);
  if (mv.lengthSq()) {
    mv.normalize();
    g.position.addScaledVector(mv, 16 * dt);
    g.rotation.y = Math.atan2(-mv.x, -mv.z) + Math.PI;
    c.walk += dt * 10;
  } else c.walk *= 0.8;
  const sw = Math.sin(c.walk) * 0.7;
  c.legs[0].rotation.x = sw; c.legs[1].rotation.x = -sw; c.arms[0].rotation.x = -sw; c.arms[1].rotation.x = sw;
  if (keys.Space && c.grounded) { c.vy = 32; c.grounded = false; }
  c.vy -= 100 * dt;
  let dy = c.vy * dt;
  tmpBox.min.set(g.position.x - 0.6, g.position.y, g.position.z - 0.5);
  tmpBox.max.set(g.position.x + 0.6, g.position.y + 5, g.position.z + 0.5);
  const top = supportTop(tmpBox, [...sBoxes, ...pBoxes.values()], 1.3);
  c.grounded = false;
  if (top > -Infinity && g.position.y + dy <= top) { dy = top - g.position.y; c.vy = 0; c.grounded = true; }
  g.position.y += dy;
  if (g.position.y < -90) { g.position.copy(world.spawn); c.vy = 0; }
  if (c.grounded && g.position.x > 13 && !c.reached) { c.reached = true; emit("reach"); }
  if (c.grounded && g.position.z > 43 && g.position.y > 4 && !c.star) { c.star = true; emit("star"); }
  // камера за спиной
  const target = g.position.clone().add(V(0, 4, 0));
  const back = V(Math.sin(camYaw) * Math.cos(0.38), Math.sin(0.38), Math.cos(camYaw) * Math.cos(0.38));
  camera.position.copy(target).addScaledVector(back, camDist);
  camera.lookAt(target);
}

// ---------- ввод ----------
const cv = renderer.domElement;
let rmb = false, down = null, lastX = 0, lastY = 0, hoverT = 0;
cv.addEventListener("contextmenu", (e) => e.preventDefault());
cv.addEventListener("pointerdown", (e) => {
  cv.focus();
  closePops();
  if (e.button === 2) { rmb = true; lastX = e.clientX; lastY = e.clientY; cv.setPointerCapture(e.pointerId); }
  if (e.button === 0) down = { x: e.clientX, y: e.clientY };
});
window.addEventListener("pointerup", (e) => {
  if (e.button === 2) rmb = false;
  if (e.button === 0 && down && e.target === cv) {
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 5 && !dragging && !tc.axis && !playing) select(pick(e), e);
  }
  down = null;
});
cv.addEventListener("pointermove", (e) => {
  if (rmb) {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (playing) camYaw -= dx * 0.006;
    else { yaw -= dx * 0.004; pitch = Math.max(-1.5, Math.min(1.5, pitch - dy * 0.004)); fly = null; applyLook(); }
    return;
  }
  if (playing || dragging || performance.now() - hoverT < 50) return;
  hoverT = performance.now();
  const h = tc.axis ? null : pick(e);
  if (h !== hovered) { hovered = h; for (const p of parts) { p.edges.visible = selected.includes(p) || p === hovered; if (!selected.includes(p)) p.edges.material.color.set(0xa8d4ff); } }
});
cv.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (playing) camDist = Math.max(8, Math.min(45, camDist + e.deltaY * 0.03));
  else { fly = null; camera.position.addScaledVector(camDir(), -Math.sign(e.deltaY) * Math.min(12, Math.abs(e.deltaY) * 0.06)); }
}, { passive: false });
window.addEventListener("keydown", (e) => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || "");
  if (typing) return;
  keys[e.code] = true;
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.code === "KeyZ") { e.preventDefault(); undo(); }
  else if (mod && e.code === "KeyD") { e.preventDefault(); duplicateSel(); }
  else if (mod && e.code === "KeyG") { e.preventDefault(); groupSel(); }
  else if (!mod && e.code === "KeyF") focusSelected();
  else if (e.code === "Delete" || e.code === "Backspace") deleteSel();
  else if (e.code === "Escape") closePops();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; rmb = false; });

// ---------- лента ----------
const ICON = {
  select: '<path d="M6 3l12 7-5.5 1.6L10 17z"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  scale: '<rect x="4" y="10" width="10" height="10" rx="1"/><path d="M12 4h8v8M20 4l-8 8"/>',
  rotate: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 3v4.5h-4.5"/>',
  transform: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M3 3l3 3M21 3l-3 3M3 21l3-3M21 21l-3-3"/>',
  part: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  material: '<circle cx="12" cy="12" r="8"/><path d="M5.5 9.5c4 2.5 9 2.5 13 0M8 18c1-3 7-3 8 0"/>',
  color: '<path d="M12 3a9 9 0 1 0 0 18c1.6 0 2.2-1.2 1.6-2.3-.6-1.2.2-2.4 1.6-2.4H18a3 3 0 0 0 3-3C21 7.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  group: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h4v6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M5 13a7 7 0 0 0 14 0M8.5 10h7"/>',
  explorer: '<rect x="3" y="4" width="6" height="4"/><path d="M6 8v9h5M6 12h5"/><rect x="11" y="10" width="9" height="4"/><rect x="11" y="15" width="9" height="4"/>',
  properties: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  toolbox: '<rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M9 8V5h6v3M3 13h18"/>',
};
const RIBBON = [
  ["select", "tool"], ["move", "tool"], ["scale", "tool"], ["rotate", "tool"], ["transform", "off"], "|",
  ["part", "dd"], "|", ["material", "dd"], ["color", "dd"], ["group", "btn"], ["lock", "off"], ["anchor", "btn"], "|",
  ["explorer", "pane"], ["properties", "pane"], ["toolbox", "off"],
];
let curColor = "#a3a2a5", curMat = "Plastic";
function buildRibbon() {
  const rb = $("ribbon");
  rb.innerHTML = "";
  for (const it of RIBBON) {
    if (it === "|") { rb.insertAdjacentHTML("beforeend", '<div class="sep"></div>'); continue; }
    const [id, kind] = it;
    const b = document.createElement("button");
    b.className = "rb" + (kind === "off" ? " off" : "");
    b.id = "rb_" + id;
    b.innerHTML = `<svg viewBox="0 0 24 24">${ICON[id]}</svg><span>${L.ui[id]}</span>` + (kind === "dd" ? '<i class="dd">▾</i>' : "");
    b.addEventListener("click", (e) => {
      if (kind === "pane") return togglePane(id);
      if (playing) return;
      const dd = e.target.closest(".dd");
      if (kind === "tool") setTool(id);
      if (id === "part") dd ? showPop("partPop", b) : insert("Block");
      if (id === "color") dd ? showPop("colorPop", b) : applyColor(curColor);
      if (id === "material") dd ? showPop("matPop", b) : applyMaterial(curMat);
      if (id === "anchor") toggleAnchor();
      if (id === "group") groupSel();
    });
    rb.appendChild(b);
  }
  renderRibbonState();
}
// ---------- окна и узкий экран ----------
const panes = { explorer: true, properties: true };
function applyPanes() {
  document.body.classList.toggle("noExp", !panes.explorer);
  document.body.classList.toggle("noProps", !panes.properties);
  $("rb_explorer")?.classList.toggle("on", panes.explorer);
  $("rb_properties")?.classList.toggle("on", panes.properties);
}
function togglePane(id) {
  panes[id] = !panes[id];
  applyPanes();
}
// Интерфейс ничего не прячет: на маленьком экране он немного уменьшается, а дальше переставляет окна.
// Вид Studio не перестраиваем: окно немного уменьшается (не сильнее 85 %, чтобы текст читался),
// сцена сжимается, лента прокручивается. Если места совсем нет — предлагаем развернуть мастерскую.
const DESIGN_W = 980, DESIGN_H = 600, MIN_K = 0.85, MIN_W = 760, MIN_H = 470;
let smallDismissed = false;
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  let k = Math.max(MIN_K, Math.min(1, w / DESIGN_W, h / DESIGN_H));
  const tooSmall = w / k < MIN_W || h / k < MIN_H;
  if (tooSmall) k = Math.min(w / MIN_W, h / MIN_H); // за заставкой всё равно видна целая Studio
  const app = $("app");
  app.style.width = w / k + "px";
  app.style.height = h / k + "px";
  app.style.transform = k < 1 ? `scale(${k})` : "";
  $("small").style.display = tooSmall && !smallDismissed && !document.fullscreenElement ? "grid" : "none";
}
window.addEventListener("resize", fit);
fit();

function renderRibbonState() {
  for (const t of ["select", "move", "scale", "rotate"]) $("rb_" + t)?.classList.toggle("on", tool === t);
  applyPanes();
  $("rb_anchor")?.classList.toggle("on", selected.length > 0 && selected.every((p) => p.anchored));
  const ci = $("rb_color")?.querySelector("svg");
  if (ci) ci.style.stroke = curColor;
}
const PALETTE = ["#F2F3F3", "#E5E4DF", "#A3A2A5", "#635F62", "#1B2A35", "#000000", "#FFC9C9", "#FF66CC", "#FF0000", "#C4281C", "#D5733D", "#FF9900", "#DA8541", "#F5CD30", "#FFFF00", "#A4BD47", "#00FF00", "#4B974B", "#27462D", "#12EED4", "#04AFEC", "#80BBDB", "#B4D2E4", "#0D69AC", "#0000FF", "#6225D1", "#9F00FF", "#AA00AA", "#7C5C46", "#694028", "#958A73", "#CC8E69"];
let popEl = null;
function closePops() { popEl?.remove(); popEl = null; $("fileMenu")?.remove(); }
function showPop(kind, anchor) {
  const was = popEl?.id === kind;
  closePops();
  if (was) return;
  const el = document.createElement("div");
  el.className = "pop";
  el.id = kind;
  if (kind === "partPop") {
    for (const s of ["Block", "Sphere", "Wedge", "CornerWedge", "Cylinder"]) {
      const it = document.createElement("div");
      it.className = "item";
      it.textContent = L.ui[s];
      it.onclick = () => insert(s);
      el.appendChild(it);
    }
  } else if (kind === "colorPop") {
    for (const c of PALETTE) {
      const i = document.createElement("i");
      i.style.background = c;
      i.title = c;
      i.onclick = () => { applyColor(c); closePops(); };
      el.appendChild(i);
    }
  } else if (kind === "matPop") {
    for (const m of MATS) {
      const it = document.createElement("div");
      it.className = "m";
      it.innerHTML = `<b style="background:${MAT_SWATCH[m]}${m === "Neon" ? ";box-shadow:0 0 10px #ff4fd8" : ""}"></b>${m}`;
      it.onclick = () => { applyMaterial(m); closePops(); };
      el.appendChild(it);
    }
  }
  const r = anchor.getBoundingClientRect();
  el.style.left = Math.min(r.left, innerWidth - 300) + "px";
  el.style.top = r.bottom + 4 + "px";
  document.body.appendChild(el);
  popEl = el;
}
document.addEventListener("pointerdown", (e) => {
  if (popEl && !popEl.contains(e.target) && !e.target.closest(".rb")) closePops();
  if ($("fileMenu") && !e.target.closest("#fileMenu") && e.target.id !== "btnFile") $("fileMenu").remove();
});

// ---------- меню File ----------
const fileFlags = { file: false, roblox: false };
$("btnFile").addEventListener("click", () => {
  if ($("fileMenu")) return $("fileMenu").remove();
  closePops();
  const m = document.createElement("div");
  m.id = "fileMenu";
  m.innerHTML = `<div class="off">${L.ui.openFile}</div><div class="off">${L.ui.autosaves}</div><hr><div data-a="file">${L.ui.saveFile}</div><div data-a="roblox">${L.ui.saveRoblox}</div><hr><div data-a="publish">${L.ui.publish}</div>`;
  m.addEventListener("click", (e) => {
    const a = e.target.dataset.a;
    if (!a) return;
    m.remove();
    if (a === "publish") { toast(L.q.noPublish); setBitImg("alarm"); return; }
    fileFlags[a] = true;
    toast(a === "file" ? L.q.savedFile : L.q.savedRoblox);
    emit("file");
  });
  const r = $("btnFile").getBoundingClientRect();
  m.style.left = r.left + "px";
  m.style.top = r.bottom + 2 + "px";
  document.body.appendChild(m);
});
$("btnPlay").addEventListener("click", play);
$("btnStop").addEventListener("click", stop);

// ---------- Explorer и Properties ----------
const SERVICES = ["Players", "Lighting", "MaterialService", "ReplicatedFirst", "ReplicatedStorage", "ServerScriptService", "ServerStorage", "StarterGui", "StarterPack", "StarterPlayer", "Teams", "SoundService", "TextChatService"];
const open = { Bridge: false, Workshop: true };
const modelLabel = (m) => (m.startsWith("Model") ? "Model" : m);
function renderExplorer() {
  const el = $("explorer");
  const row = (txt, cls, ic, pad, data = "") => `<div class="ex ${cls}" style="padding-left:${pad}px" ${data}><i class="ic" style="background:${ic}"></i>${txt}</div>`;
  const tree = (list, pad) => {
    let h = "";
    for (const m of [...new Set(list.filter((p) => p.model).map((p) => p.model))]) {
      const kids = list.filter((p) => p.model === m);
      const on = kids.every((k) => selected.includes(k));
      h += row(`<span data-tog="${m}">${open[m] ? "▾" : "▸"}</span> ${modelLabel(m)}`, on ? "on" : "", "#c08a3e", pad, `data-model="${m}"`);
      if (open[m]) for (const k of kids) h += row(k.name, selected.includes(k) && !on ? "on" : "", "#9aa", pad + 20, `data-id="${k.id}"`);
    }
    for (const p of list.filter((p) => !p.model)) h += row(p.name, selected.includes(p) ? "on" : "", "#9aa", pad, `data-id="${p.id}"`);
    return h;
  };
  let h = row("Workspace", "svc", "#4f8dff", 8) + row("Camera", "svc", "#777", 24) + row("Terrain", "svc", "#5fa83c", 24);
  h += tree(parts.filter((p) => !p.folder), 24);
  for (const f of [...new Set(parts.filter((p) => p.folder).map((p) => p.folder))]) {
    h += row(`<span data-tog="${f}">${open[f] ? "▾" : "▸"}</span> ${f}`, "", "#e0b33a", 24);
    if (open[f]) h += tree(parts.filter((p) => p.folder === f), 44);
  }
  for (const s of SERVICES) h += row(s, "svc", "#555", 8);
  el.innerHTML = h;
}
$("explorer").addEventListener("click", (e) => {
  if (playing) return;
  const tog = e.target.closest("[data-tog]");
  if (tog) { open[tog.dataset.tog] = !open[tog.dataset.tog]; return renderExplorer(); }
  const r = e.target.closest(".ex");
  if (!r) return;
  if (r.dataset.model) select(parts.find((p) => p.model === r.dataset.model), e);
  else if (r.dataset.id) select(parts.find((p) => p.id === +r.dataset.id), { ...e, altKey: true, ctrlKey: e.ctrlKey, metaKey: e.metaKey });
});
function renderProps() {
  const el = $("props");
  if (!selected.length || playing) { el.innerHTML = ""; return; }
  const one = selected.length === 1 ? selected[0] : null, p0 = selected[0];
  const dis = selected.every((p) => p.locked) ? "disabled" : "";
  const same = (k) => selected.every((p) => JSON.stringify(p[k]) === JSON.stringify(p0[k]));
  let h = "";
  h += `<div class="pr"><label>Name</label>${one ? `<input type="text" data-k="name" value="${one.name}" ${dis}>` : `<span style="color:var(--dim)">${selected.length} × Part</span>`}</div>`;
  h += `<div class="pr" id="pr_anch"><label>Anchored</label><input type="checkbox" data-k="anchored" ${same("anchored") && p0.anchored ? "checked" : ""} ${dis}></div>`;
  h += `<div class="pr"><label>Color</label><span>${same("color") ? `<i class="sw" style="background:${p0.color}"></i>${p0.color}` : ""}</span></div>`;
  h += `<div class="pr"><label>Material</label><select data-k="material" ${dis}>${same("material") ? "" : "<option></option>"}${MATS.map((m) => `<option ${same("material") && p0.material === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>`;
  h += `<div class="pr"><label>Transparency</label><input type="number" min="0" max="1" step="0.1" data-k="transparency" value="${same("transparency") ? p0.transparency : ""}" ${dis}></div>`;
  if (one) {
    h += `<div class="pr"><label>Size</label><div class="three">${one.size.map((v, i) => `<input type="number" step="1" min="0.2" data-k="size" data-i="${i}" value="${v}" ${dis}>`).join("")}</div></div>`;
    h += `<div class="pr"><label>Position</label><div class="three">${one.pos.map((v, i) => `<input type="number" step="1" data-k="pos" data-i="${i}" value="${v}" ${dis}>`).join("")}</div></div>`;
    h += `<div class="pr"><label>Orientation</label><div class="three">${one.rot.map((v, i) => `<input type="number" step="15" data-k="rot" data-i="${i}" value="${v}" ${dis}>`).join("")}</div></div>`;
  }
  el.innerHTML = h;
}
$("props").addEventListener("change", (e) => {
  const k = e.target.dataset.k;
  if (!k) return;
  const i = e.target.dataset.i;
  const v = e.target.type === "checkbox" ? e.target.checked : e.target.type === "number" ? parseFloat(e.target.value) : e.target.value;
  if (typeof v === "number" && isNaN(v)) return renderProps();
  editSel((p) => {
    if (i !== undefined) p[k][+i] = k === "size" ? Math.max(0.2, v) : v;
    else if (k === "transparency") p[k] = Math.max(0, Math.min(1, v));
    else if (v !== "") p[k] = v;
  });
});
// ---------- квест: те же задания, что в уроке ----------
// 0 мост падает → 1 Anchor и пройти по мосту → 2 долететь до мастерской → 3 собрать одну вещь своего уровня 🏁 → 4 сохранение.
// 5 — ⭐ Звёздная тропа (по желанию). Любой этап можно открыть с карты: мир собирается так, будто прошлые этапы пройдены.
const mark = (b) => (b ? "✅" : "⬜");
function bestObj() {
  let best = null;
  for (const key of Object.keys(OBJS)) {
    const st = objState(key), score = st.ok / st.n + (st.grouped ? 0.5 : 0) + (st.anchored ? 0.25 : 0);
    if (!best || score > best.score) best = { key, st, score };
  }
  return best;
}
const objProgress = (key, st) => `${key === "path" ? "" : L.q.obj[key] + ": "}${fmt(L.q.parts)} ${st.ok}/${st.n} · ${mark(st.grouped)} ${L.ui.group} · ${mark(st.grouped && st.anchored)} ${L.ui.anchor}`;
const STAGES = [
  { img: "alarm", look: [V(-30, 15, 26), V(0, 0, 0)], setup() { $("btnPlay").classList.add("pulse"); }, check: (ev) => ev === "stop" && lastFell > 0 },
  { img: "think", glow: ["anchor"], look: [V(-30, 15, 26), V(0, 0, 0)], check: (ev) => ev === "reach" && fixed.bridge() },
  { img: "hello", look: [V(-34, 12, 20), V(-10, 2, 0)], check: (ev) => ev === "focus" && selected.some((p) => p.folder === "Workshop") },
  { img: "think", glow: ["move", "rotate", "scale", "group", "anchor"], look: [V(36, 15, 10), V(36, 1, -12)],
    progress() { const b = bestObj(); return objProgress(b.key, b.st); },
    check: (ev) => ev === "play" && Object.keys(OBJS).some((k) => fixedAll(objState(k))) },
  { img: "think", look: [V(0, 26, 34), V(36, 0, -6)], setup() { fileFlags.file = fileFlags.roblox = false; },
    progress: () => `${mark(fileFlags.file)} ${L.ui.saveFile}   ${mark(fileFlags.roblox)} ${L.ui.saveRoblox}`,
    check: () => fileFlags.file && fileFlags.roblox },
  { img: "hello", glow: ["move", "rotate", "scale", "group", "anchor"], look: [V(74, 20, 28), V(36, 1, 34)],
    progress: () => objProgress("path", objState("path")),
    check: (ev) => ev === "star" && fixedAll(objState("path")) },
];
const MAIN = 5; // этапы 0–4 — основной путь, 5 — ⭐
let cur = 0, stageDone = false, hintN = 0;
const fmt = (s) => s.replace(/\{(\w+)\}/g, (m, k) => L.ui[k] ?? m);

function startStage(i) {
  if (playing) { playing = false; scene.remove(char.group); char = null; restoreParts(snapshot); renderStatus(); }
  cur = i; stageDone = false; hintN = 0;
  store.stage = i; saveStore();
  $("btnPlay").classList.remove("pulse");
  $("final").style.display = "none";
  buildWorld(i);
  STAGES[i].setup?.();
  setLook(...STAGES[i].look.map((v) => v.clone()));
  tool = "select";
  refreshSel();
  renderQuest();
  renderStatus();
}
function emit(ev) {
  if (stageDone || !STAGES[cur]) return;
  if (STAGES[cur].check(ev)) complete();
  else renderProgress();
}
function complete() {
  stageDone = true;
  if (!store.done.includes(cur)) store.done.push(cur);
  saveStore();
  renderQuest();
  if (cur === MAIN - 1) {
    lightPortal();
    $("finalTitle").textContent = L.q.finalTitle;
    $("finalText").textContent = L.q.final;
    setTimeout(() => ($("final").style.display = "grid"), 900);
  }
}
function setBitImg(n) { $("qImg").src = `img/bit_${n}.jpg`; }
function renderProgress() {
  const s = STAGES[cur], el = $("qProg");
  const t = s.progress ? s.progress() : "";
  el.textContent = t;
  el.style.display = t && !stageDone ? "block" : "none";
}
const stepLabel = (i) => (i >= MAIN ? L.q.bonus : L.q.stageOf.replace("{n}", i + 1).replace("{m}", MAIN));
function renderQuest() {
  const s = STAGES[cur], q = L.q, st = q.stages[cur];
  $("qChapter").textContent = q.title;
  $("qStep").textContent = stepLabel(cur);
  $("qTitle").textContent = fmt(st.t);
  $("qText").textContent = fmt(st.task);
  setBitImg(stageDone ? (cur >= MAIN - 1 ? "proud" : "hello") : s.img);
  $("qHint").style.display = hintN ? "block" : "none";
  $("qHint").textContent = hintN ? st.hints.slice(0, hintN).map(fmt).join(" ") : "";
  $("qDone").style.display = stageDone ? "block" : "none";
  $("qDone").textContent = stageDone ? "✅ " + fmt(st.done) : "";
  $("qBack").textContent = q.back;
  $("qPillText").textContent = `${stepLabel(cur)} · ${fmt(st.t)}`;
  $("hintBtn").textContent = q.hint;
  $("hintBtn").style.display = stageDone || hintN >= st.hints.length ? "none" : "";
  $("mapBtn").textContent = q.map;
  $("restartBtn").textContent = q.restart;
  $("nextBtn").style.display = stageDone && cur < MAIN ? "" : "none";
  $("nextBtn").textContent = cur === MAIN - 1 ? fmt(q.stages[MAIN].t) + " →" : `${q.next} →`;
  for (const b of document.querySelectorAll(".rb.glow")) b.classList.remove("glow");
  if (hintN >= 2 && !stageDone) for (const g of s.glow || []) $("rb_" + g)?.classList.add("glow");
  if (hintN >= 1 && !stageDone && (cur === 1 || cur === 2)) $("btnPlay").classList.add("pulse");
  renderProgress();
}
function renderStatus() { $("status").textContent = playing ? L.q.helpPlay : L.q.help; }
$("hintBtn").onclick = () => { hintN++; renderQuest(); };
$("nextBtn").onclick = () => startStage(cur + 1);
$("restartBtn").onclick = () => startStage(cur);

// карта: все этапы открыты, пройденные отмечены звёздочкой
function renderMap() {
  const q = L.q;
  $("mapTitle").textContent = q.title;
  $("mapCh1").textContent = q.mapHint;
  $("mapCh2").style.display = "none";
  $("isles2").style.display = "none";
  $("mapClose").textContent = q.close;
  $("resetBtn").textContent = resetArmed ? q.resetSure : q.resetAll;
  $("isles1").innerHTML = STAGES.map((s, i) => {
    const done = store.done.includes(i);
    return `<div class="isle ${done ? "done" : ""} ${i === cur ? "cur" : ""}" data-i="${i}"><b>${done ? "★" : i >= MAIN ? "+" : i + 1}</b>${fmt(q.stages[i].t)}</div>`;
  }).join("");
}
$("mapBtn").onclick = () => { renderMap(); $("map").style.display = "grid"; };
$("mapClose").onclick = () => ($("map").style.display = "none");
$("map").addEventListener("click", (e) => {
  const it = e.target.closest(".isle");
  if (!it) return;
  $("map").style.display = "none";
  startStage(+it.dataset.i);
});
$("finalClose").onclick = () => ($("final").style.display = "none");
$("qMin").onclick = () => document.body.classList.add("qmin");
$("qPill").onclick = () => document.body.classList.remove("qmin");
let resetArmed = false, resetT = 0;
$("resetBtn").onclick = () => {
  if (!resetArmed) { resetArmed = true; renderMap(); clearTimeout(resetT); resetT = setTimeout(() => { resetArmed = false; renderMap(); }, 4000); return; }
  try { localStorage.removeItem(KEY); } catch (e) { /* нет хранилища */ }
  store = { done: [], stage: 0 };
  resetArmed = false;
  $("map").style.display = "none";
  startStage(0);
};
$("smallFull").onclick = () => { const el = document.documentElement; (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => window.open(location.href, "_blank")); };
$("smallTab").onclick = () => window.open(location.href, "_blank");
$("smallAnyway").onclick = () => { smallDismissed = true; fit(); };
document.addEventListener("fullscreenchange", fit);

let toastT = 0;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toastT);
  toastT = setTimeout(() => (el.style.display = "none"), 3200);
}

// ---------- язык ----------
function applyLang() {
  L = T(lang);
  document.documentElement.lang = lang;
  document.title = L.q.title;
  $("lang").value = lang;
  for (const el of document.querySelectorAll("[data-t]")) { const [a, b] = el.dataset.t.split("."); el.textContent = L[a === "ui" ? "ui" : "q"][b]; }
  buildRibbon();
  renderQuest();
  renderStatus();
  renderExplorer();
  $("smallText").textContent = L.q.tooSmall;
  $("smallFull").textContent = L.q.fullscreen;
  $("smallTab").textContent = L.q.newTab;
  $("smallAnyway").textContent = L.q.anyway;
}
$("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const u = new URL(location.href);
  u.searchParams.set("lang", lang);
  window.history.replaceState(null, "", u);
  closePops();
  applyLang();
});

// ---------- запуск ----------
const clock = new THREE.Clock();
let time = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  time += dt;
  requestAnimationFrame(frame);
  if (view.clientWidth < 2 || view.clientHeight < 2) return; // свёрнутый тоггл: не рисуем
  if (playing) stepPlay(dt);
  else stepEditCam(dt);
  for (const a of animators) a(time, dt);
  renderer.render(scene, camera);
}
resize();
applyLang();
let startAt = Number.isInteger(store.stage) && STAGES[store.stage] ? store.stage : 0;
if (store.done.includes(startAt) && startAt < MAIN - 1) startAt = STAGES.findIndex((s, i) => i > startAt && !store.done.includes(i));
if (startAt < 0) startAt = MAIN - 1;
startStage(startAt);
frame();
window.__wb = { camera, tick(n) { for (let i = 0; i < n; i++) if (playing) stepPlay(1 / 60); }, keys, get charPos() { return char && char.group.position.toArray().map(r2); }, parts, get state() { return { cur, stageDone, parts: parts.length, playing, done: store.done }; }, startStage, emit, select, insert, play, stop, partsRef: () => parts, setTool, toggleAnchor, groupSel, byTag, syncMesh, fixed, objState, objParts, get char() { return char; }, setYaw(v) { camYaw = v; } };
