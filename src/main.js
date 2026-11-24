import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import "./style.css";
import { rng } from "./lib.js";
import { buildJoglo } from "./joglo.js";
import { buildEnvironment } from "./environment.js";
import { CameraRig, PRESETS } from "./camera.js";

const $ = (id) => document.getElementById(id);

// ---------- renderer, scene, kamera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("app").prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color();
scene.fog = new THREE.Fog(0xffffff, 60, 190);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 400);

// ---------- cahaya ----------
const hemi = new THREE.HemisphereLight(0xdfefff, 0x6b8a4a, 1.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
sun.position.set(35, 60, 31);
sun.target.position.set(0, 0, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 180 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// ---------- model ----------
const house = buildJoglo();
const env = buildEnvironment(rng(2026));
scene.add(house.group, env.group);

// kumpulkan AABB dari semua mesh "solid" untuk tabrakan mode jalan
scene.updateMatrixWorld(true);
const colliders = [];
scene.traverse((o) => {
  if (o.isMesh && o.userData.solid) colliders.push(new THREE.Box3().setFromObject(o));
});

// ---------- siang / malam ----------
const TIME = {
  day: { sky: 0xa9d4f0, hemiSky: 0xdfefff, hemi: 1.6, sun: 2.6, sunColor: 0xfff1d6, lamp: 1.5 },
  night: { sky: 0x0d1530, hemiSky: 0x5a6a9a, hemi: 0.35, sun: 0.3, sunColor: 0x9fb4ff, lamp: 14 },
};
let night = false;
function applyTime() {
  const t = night ? TIME.night : TIME.day;
  scene.background.setHex(t.sky);
  scene.fog.color.setHex(t.sky);
  hemi.color.setHex(t.hemiSky);
  hemi.intensity = t.hemi;
  sun.intensity = t.sun;
  sun.color.setHex(t.sunColor);
  for (const l of house.lights) l.intensity = t.lamp;
  $("night").textContent = night ? "Siang" : "Malam";
}
applyTime();

// ---------- kamera + HUD ----------
const HELP = {
  orbit: "Drag kiri: putar · Drag kanan: geser · Scroll: zoom · WASD: geser.<br>Saat sudah dekat/di dalam: drag = menoleh, scroll = maju/mundur.",
  walk: "Klik layar lalu WASD: jalan · Shift: lari · Mouse: menoleh · Esc: lepas mouse.",
  tour: "Tur otomatis berjalan. Klik tombol tur atau pilih preset untuk berhenti.",
};

const rig = new CameraRig(camera, renderer.domElement, colliders, updateHud);

PRESETS.forEach((p, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = `${i + 1}. ${p.label}`;
  b.onclick = () => rig.goTo(p.key);
  $("presets").append(b);
});

function updateHud() {
  const walking = rig.mode === "walk";
  $("mode").textContent = walking ? "Mode: Jalan" : "Mode: Orbit";
  $("mode").classList.toggle("active", walking);
  $("tour").textContent = rig.tour ? "Hentikan tur" : "Tur otomatis";
  $("tour").classList.toggle("active", !!rig.tour);
  $("help").innerHTML = rig.tour ? HELP.tour : HELP[rig.mode];
  $("crosshair").style.display = walking && rig.locked ? "block" : "none";
  $("lock-hint").style.display = walking && !rig.locked ? "block" : "none";
}

const toggleMode = () => rig.setMode(rig.mode === "orbit" ? "walk" : "orbit");
const toggleTour = () => (rig.tour ? rig.stopTour() : rig.startTour());
const toggleDoor = () => ($("door").textContent = house.toggleDoors() ? "Tutup pintu" : "Buka pintu");
const toggleNight = () => {
  night = !night;
  applyTime();
};

// ---------- HUD, FPS, screenshot ----------
const toggleHud = () => $("hud").classList.toggle("hidden");

const stats = new Stats();
stats.dom.id = "stats";
stats.dom.style.display = "none";
$("app").append(stats.dom);
// Koordinat kamera (meter) dan arah pandang; tampil bersama panel FPS.
const coords = document.createElement("div");
coords.id = "coords";
coords.style.display = "none";
$("app").append(coords);
const toggleStats = () => {
  const show = stats.dom.style.display === "none";
  stats.dom.style.display = show ? "block" : "none";
  coords.style.display = show ? "block" : "none";
};
const dirVec = new THREE.Vector3();
const COMPASS = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"]; // utara = -z (belakang rumah)
function updateCoords() {
  if (coords.style.display === "none") return;
  const p = camera.position;
  camera.getWorldDirection(dirVec);
  const yaw = (THREE.MathUtils.radToDeg(Math.atan2(dirVec.x, -dirVec.z)) + 360) % 360;
  coords.textContent =
    `X ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  Z ${p.z.toFixed(2)}\n` +
    `Arah ${yaw.toFixed(0)}° ${COMPASS[Math.round(yaw / 45) % 8]}`;
}

// Diambil tepat setelah render di frame yang sama, karena isi drawing buffer
// WebGL tidak dijamin tersedia lagi setelah frame selesai.
let screenshotRequested = false;
function saveScreenshot() {
  renderer.domElement.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `joglo-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

$("mode").onclick = toggleMode;
$("tour").onclick = toggleTour;
$("door").onclick = toggleDoor;
$("night").onclick = toggleNight;
for (const b of document.querySelectorAll("#hud button")) b.addEventListener("click", () => b.blur());

addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= PRESETS.length) rig.goTo(PRESETS[n - 1].key);
  else if (e.code === "KeyF") toggleMode();
  else if (e.code === "KeyT") toggleTour();
  else if (e.code === "KeyP") toggleDoor();
  else if (e.code === "KeyN") toggleNight();
  else if (e.code === "KeyH") toggleHud();
  else if (e.code === "KeyG") toggleStats();
  else if (e.code === "KeyC") screenshotRequested = true;
});

addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loop ----------
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  rig.update(dt);
  house.update(dt);
  renderer.render(scene, camera);
  if (screenshotRequested) {
    screenshotRequested = false;
    saveScreenshot();
  }
  stats.update();
  updateCoords();
});

// ?view=pendopo (atau nama preset lain) untuk langsung membuka sudut tertentu
const params = new URLSearchParams(location.search);
if (params.has("view")) rig.goTo(params.get("view"), true);
if (params.has("night")) toggleNight();

updateHud();
window.__joglo = { scene, camera, rig, renderer }; // untuk debugging di console
