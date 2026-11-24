// Model rumah Joglo dari geometri dasar.
// Tata ruang (sumbu +z = depan):
//   pendopo (terbuka, z = 1.4..14.6) -> pringgitan (z = -1..1.4) -> dalem (z = -11..-1)
//   senthong = tiga kamar di belakang dalem.
import * as THREE from "three";
import { MAT, box, cyl, ball, beam, ring } from "./lib.js";

export const FLOOR_Y = 0.6; // tinggi lantai (bebatur)
export const PENDOPO_Z = 8;
export const DALEM_Z = -6;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = THREE.MathUtils.lerp;

// ---------------------------------------------------------------------------
// Atap: limas terpotong (frustum) yang dibuat langsung dari BufferGeometry.
// b = alas (bx, bz, by), t = puncak (tx, tz, ty). tz ~ 0 menghasilkan bubungan.
// ---------------------------------------------------------------------------
function frustumGeometry({ bx, bz, by, tx, tz, ty }) {
  const B = [[-bx, by, bz], [bx, by, bz], [bx, by, -bz], [-bx, by, -bz]];
  const T = [[-tx, ty, tz], [tx, ty, tz], [tx, ty, -tz], [-tx, ty, -tz]];
  const pos = [];
  const uv = [];
  const k = 1 / 1.2; // 1 ulangan tekstur genteng = 1.2 m
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const face = [B[i], B[j], T[j], B[i], T[j], T[i]].map((p) => V(...p));
    // UV: u searah tepi atap (horizontal), v naik searah kemiringan atap
    const o = face[0];
    const e = face[1].clone().sub(o).normalize();
    const n = face[1].clone().sub(o).cross(face[2].clone().sub(o)).normalize();
    const s = n.clone().cross(e);
    if (s.y < 0) s.negate();
    for (const p of face) {
      pos.push(p.x, p.y, p.z);
      const d = p.clone().sub(o);
      uv.push(d.dot(e) * k, d.dot(s) * k);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

function roofTier(parent, P) {
  const mesh = new THREE.Mesh(frustumGeometry(P), MAT.roof);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  // lisplang di tepi atap
  ring(parent, P.bx, P.bz, 0.1, 0.22, P.by - 0.06, MAT.woodDark, { cast: false });
  // usuk (rafter) di bawah permukaan atap, terlihat dari dalam
  const rafter = (a, b) => beam(parent, a, b, 0.07, MAT.woodDark, { cast: false });
  const dy = 0.09;
  for (const s of [1, -1]) {
    const nx = Math.round((2 * P.bx) / 0.6);
    for (let i = 0; i <= nx; i++) {
      const k = i / nx;
      rafter(V(lerp(-P.tx, P.tx, k), P.ty - dy, s * P.tz), V(lerp(-P.bx, P.bx, k), P.by - dy, s * P.bz));
    }
    const nz = Math.round((2 * P.bz) / 0.6);
    for (let i = 1; i < nz; i++) {
      const k = i / nz;
      rafter(V(s * P.tx, P.ty - dy, lerp(-P.tz, P.tz, k)), V(s * P.bx, P.by - dy, lerp(-P.bz, P.bz, k)));
    }
  }
}

// Umpak (alas batu, limas terpotong 4 sisi) + tiang kayu.
function pillar(parent, x, z, topY, t, mat) {
  const umpak = cyl(parent, 0.22, 0.32, 0.35, MAT.umpak, x, FLOOR_Y + 0.175, z, 4, { solid: true });
  umpak.rotation.y = Math.PI / 4;
  const h = topY - (FLOOR_Y + 0.35);
  box(parent, t, h, t, mat, x, FLOOR_Y + 0.35 + h / 2, z, { solid: true });
}

// Rangka Joglo: 4 soko guru, 12 soko pengarak, tumpang sari, dan atap dua tingkat.
// hx, hz = setengah jarak tiang luar; gx, gz = setengah jarak soko guru.
function jogloFrame(g, { hx, hz, gx = 2, gz = 2, ov = 1.5 }) {
  const F = FLOOR_Y;
  const low = { bx: hx + ov, bz: hz + ov, by: F + 2.7, tx: gx + 1.2, tz: gz + 1.2, ty: F + 4.8 }; // penanggap
  const top = { bx: gx + 1.6, bz: gz + 1.6, by: F + 4.45, tx: gx - 0.6, tz: 0.02, ty: F + 8.2 }; // brunjung
  const yOnLow = (h, b, t) => low.by + ((b - h) / (b - t)) * (low.ty - low.by);
  const pengarakTop = Math.min(yOnLow(hx, low.bx, low.tx), yOnLow(hz, low.bz, low.tz)) - 0.25;
  const guruTop = F + 4.3;

  // soko guru
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pillar(g, sx * gx, sz * gz, guruTop, 0.34, MAT.wood);
  // soko pengarak
  const outer = [];
  for (const x of [-hx, -gx, gx, hx]) outer.push([x, -hz], [x, hz]);
  for (const z of [-gz, gz]) outer.push([-hx, z], [hx, z]);
  for (const [x, z] of outer) pillar(g, x, z, pengarakTop, 0.26, MAT.woodLight);

  // blandar (balok keliling di atas soko pengarak)
  ring(g, hx, hz, 0.24, 0.24, pengarakTop + 0.12, MAT.woodDark);

  // tumpang sari: bingkai bertumpuk yang makin lebar ke atas
  for (let i = 0; i < 5; i++) {
    ring(g, gx + i * 0.18, gz + i * 0.18, 0.22, 0.16, guruTop + 0.08 + i * 0.16, i % 2 ? MAT.woodDark : MAT.wood);
  }
  box(g, 2 * gx + 0.8, 0.24, 0.22, MAT.woodDark, 0, guruTop + 0.95, 0); // dhadha peksi

  // sunduk (balok penghubung) dan dudur (balok sudut miring)
  const pT = pengarakTop + 0.12;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      beam(g, V(sx * gx, pT, sz * gz), V(sx * hx, pT, sz * gz), 0.16, MAT.woodDark);
      beam(g, V(sx * gx, pT, sz * gz), V(sx * gx, pT, sz * hz), 0.16, MAT.woodDark);
      beam(g, V(sx * gx, guruTop, sz * gz), V(sx * hx, pT, sz * hz), 0.16, MAT.woodDark);
    }
  }

  roofTier(g, low);
  roofTier(g, top);
  // bubungan + mustaka di kedua ujung
  box(g, 2 * top.tx + 0.5, 0.18, 0.26, MAT.roofDark, 0, top.ty + 0.06, 0);
  for (const s of [-1, 1]) cyl(g, 0, 0.16, 0.6, MAT.roofDark, s * (top.tx + 0.25), top.ty + 0.45, 0, 6);

  return { guruTop, pengarakTop };
}

// ---------------------------------------------------------------------------
// Dinding dengan lubang pintu/jendela. Dinding dibuat di sumbu x lokal,
// lalu grupnya diputar (rotY) untuk dinding samping.
// ---------------------------------------------------------------------------
function panelStrips(g, a, b, H, T) {
  const n = Math.max(1, Math.round((b - a) / 0.7));
  for (const s of [-1, 1]) {
    const z = s * (T / 2 + 0.015);
    for (let i = 0; i <= n; i++) box(g, 0.06, H, 0.03, MAT.woodDark, a + ((b - a) * i) / n, H / 2, z, { cast: false });
    for (const y of [0.9, H - 0.45]) box(g, b - a, 0.06, 0.03, MAT.woodDark, (a + b) / 2, y, z, { cast: false });
  }
}

function addDoor(g, o, doors) {
  const w = (o.x1 - o.x0) / 2;
  const h = o.y1 - o.y0;
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); // engsel pintu
    pivot.position.set(s < 0 ? o.x0 : o.x1, 0, 0);
    g.add(pivot);
    const cx = (-s * w) / 2;
    box(pivot, w - 0.03, h - 0.04, 0.06, MAT.gebyok, cx, h / 2, 0);
    for (const y of [0.3, 0.7]) box(pivot, w - 0.3, h * 0.28, 0.09, MAT.woodDark, cx, h * y, 0, { cast: false });
    box(pivot, 0.05, 0.12, 0.12, MAT.brass, -s * (w - 0.12), h * 0.5, 0, { cast: false });
    const openAngle = -s * 1.6; // membuka ke arah dalam
    pivot.rotation.y = openAngle;
    doors.push({ pivot, openAngle });
  }
}

function wall(parent, { L, H, T = 0.14, mat, x = 0, z = 0, rotY = 0, openings = [], panels = false, doors }) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  parent.add(g);
  const solid = { solid: true };
  const seg = (a, b) => {
    if (b - a < 0.01) return;
    box(g, b - a, H, T, mat, (a + b) / 2, H / 2, 0, solid);
    if (panels) panelStrips(g, a, b, H, T);
  };
  let cur = -L / 2;
  for (const o of [...openings].sort((p, q) => p.x0 - q.x0)) {
    seg(cur, o.x0);
    const w = o.x1 - o.x0;
    const cx = (o.x0 + o.x1) / 2;
    if (o.y0 > 0) box(g, w, o.y0, T, mat, cx, o.y0 / 2, 0, solid);
    if (o.y1 < H) box(g, w, H - o.y1, T, mat, cx, (o.y1 + H) / 2, 0, solid);
    // kusen
    const ft = T + 0.06;
    box(g, w + 0.16, 0.08, ft, MAT.woodDark, cx, o.y1 + 0.04, 0);
    box(g, 0.08, o.y1 - o.y0, ft, MAT.woodDark, o.x0 - 0.04, (o.y0 + o.y1) / 2, 0);
    box(g, 0.08, o.y1 - o.y0, ft, MAT.woodDark, o.x1 + 0.04, (o.y0 + o.y1) / 2, 0);
    if (o.y0 > 0) box(g, w + 0.16, 0.06, ft + 0.04, MAT.woodDark, cx, o.y0 - 0.03, 0);
    // jeruji jendela
    for (let i = 1; i <= (o.bars || 0); i++) {
      box(g, 0.04, o.y1 - o.y0, 0.04, MAT.woodDark, o.x0 + (w * i) / (o.bars + 1), (o.y0 + o.y1) / 2, 0, { cast: false });
    }
    if (o.door && doors) addDoor(g, o, doors);
    cur = o.x1;
  }
  seg(cur, L / 2);
  return g;
}

// ---------------------------------------------------------------------------
// Perabot. Setiap perabot adalah Group dengan titik asal di lantai.
// ---------------------------------------------------------------------------
function item(parent, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

function table(parent, x, z, w, d, h = 0.75) {
  const g = item(parent, x, z);
  box(g, w, 0.06, d, MAT.wood, 0, h - 0.03, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.07, h - 0.06, 0.07, MAT.woodDark, sx * (w / 2 - 0.08), (h - 0.06) / 2, sz * (d / 2 - 0.08));
  }
}

function chair(parent, x, z, rotY) {
  const g = item(parent, x, z, rotY);
  box(g, 0.46, 0.05, 0.46, MAT.wood, 0, 0.45, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.43, 0.05, MAT.woodDark, sx * 0.19, 0.215, sz * 0.19);
  box(g, 0.46, 0.5, 0.05, MAT.wood, 0, 0.73, -0.2);
}

function diningSet(parent, x, z) {
  table(parent, x, z, 1.6, 0.9);
  for (const sx of [-0.4, 0.4]) {
    chair(parent, x + sx, z + 0.75, Math.PI);
    chair(parent, x + sx, z - 0.75, 0);
  }
}

function bed(parent, x, z, w, d, canopy = false) {
  const g = item(parent, x, z);
  box(g, w, 0.4, d, MAT.wood, 0, 0.2, 0);
  box(g, w - 0.1, 0.14, d - 0.1, MAT.white, 0, 0.47, 0);
  box(g, 0.35, 0.1, d * 0.6, MAT.white, -w / 2 + 0.3, 0.59, 0);
  if (!canopy) return;
  const H = 2.1;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.07, H, 0.07, MAT.woodDark, sx * (w / 2 - 0.03), H / 2, sz * (d / 2 - 0.03));
  ring(g, w / 2 - 0.03, d / 2 - 0.03, 0.08, 0.12, H, MAT.woodDark);
  box(g, w - 0.1, H - 0.5, 0.02, MAT.cloth, 0, H / 2 + 0.2, -d / 2 + 0.04);
  box(g, w, 0.3, 0.03, MAT.cloth, 0, H - 0.2, d / 2);
  for (const sx of [-1, 1]) box(g, 0.03, H - 0.3, 0.3, MAT.cloth, sx * (w / 2 - 0.03), H / 2 + 0.1, d / 2 - 0.2);
}

function cupboard(parent, x, z, rotY) {
  const g = item(parent, x, z, rotY);
  box(g, 1.2, 2.0, 0.55, MAT.woodDark, 0, 1.0, 0, { solid: true });
  box(g, 1.28, 0.08, 0.6, MAT.wood, 0, 2.04, 0);
  box(g, 0.02, 1.8, 0.02, MAT.black, 0, 1.0, 0.285, { cast: false });
  for (const s of [-1, 1]) box(g, 0.05, 0.12, 0.04, MAT.brass, s * 0.08, 1.05, 0.29, { cast: false });
}

function bench(parent, x, z, len, rotY) {
  const g = item(parent, x, z, rotY);
  box(g, len, 0.06, 0.55, MAT.woodLight, 0, 0.45, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, 0.42, 0.06, MAT.woodDark, sx * (len / 2 - 0.1), 0.21, sz * 0.2);
}

// Duduk lesehan: tikar, meja pendek, bantal, dan poci teh.
function lesehan(parent, x, z) {
  const g = item(parent, x, z);
  box(g, 2.8, 0.02, 3.2, MAT.mat, 0, 0.01, 0, { cast: false });
  box(g, 1.2, 0.05, 0.8, MAT.wood, 0, 0.38, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, 0.36, 0.06, MAT.woodDark, sx * 0.5, 0.18, sz * 0.3);
  for (const [cx, cz] of [[0, 0.85], [0, -0.85], [0.95, 0], [-0.95, 0]]) box(g, 0.5, 0.08, 0.5, MAT.cloth, cx, 0.06, cz);
  cyl(g, 0.07, 0.09, 0.16, MAT.white, -0.2, 0.49, 0, 10);
  for (const cx of [0.1, 0.3]) cyl(g, 0.04, 0.035, 0.07, MAT.white, cx, 0.445, 0.1, 8);
}

// Seperangkat gamelan sederhana: rancak gong, saron, dan kendang.
function gamelan(parent, x, z) {
  const g = item(parent, x, z);
  box(g, 0.5, 0.1, 2.3, MAT.woodDark, -1.1, 0.05, 0);
  for (const s of [-1, 1]) box(g, 0.12, 1.9, 0.12, MAT.cloth, -1.1, 0.95, s * 1.05);
  box(g, 0.16, 0.16, 2.3, MAT.cloth, -1.1, 1.9, 0);
  for (const s of [-1, 1]) {
    const r = s > 0 ? 0.38 : 0.46;
    const gong = cyl(g, r, r, 0.1, MAT.brass, -1.1, 1.18, s * 0.5, 20);
    gong.rotation.z = Math.PI / 2;
    ball(g, 0.09, MAT.brass, -1.02, 1.18, s * 0.5, { detail: 1 });
    cyl(g, 0.01, 0.01, 0.3, MAT.black, -1.1, 1.75, s * 0.5, 4, { cast: false });
  }
  for (const sx of [-0.2, 0.55]) {
    for (const sz of [-0.65, 0.65]) {
      box(g, 0.42, 0.28, 1.0, MAT.cloth, sx, 0.14, sz);
      for (let i = 0; i < 7; i++) box(g, 0.3, 0.03, 0.09, MAT.brass, sx, 0.3, sz - 0.4 + i * 0.133, { cast: false });
    }
  }
  box(g, 0.3, 0.15, 0.5, MAT.woodDark, 1.15, 0.075, 0);
  const kendang = cyl(g, 0.17, 0.22, 0.65, MAT.woodLight, 1.15, 0.36, 0, 12);
  kendang.rotation.x = Math.PI / 2;
}

// Patung loro blonyo (sepasang pengantin) di depan senthong tengah.
function statue(parent, x, z, cloth) {
  const g = item(parent, x, z);
  box(g, 0.4, 0.1, 0.35, MAT.woodDark, 0, 0.05, 0);
  cyl(g, 0.12, 0.17, 0.45, cloth, 0, 0.32, 0, 10);
  ball(g, 0.09, MAT.skin, 0, 0.63, 0, { detail: 1 });
}

// Kelir wayang kulit di pringgitan.
function kelir(parent, x, z, rotY) {
  const g = item(parent, x, z, rotY);
  box(g, 2.0, 1.2, 0.03, MAT.white, 0, 1.25, 0);
  box(g, 2.2, 0.08, 0.08, MAT.woodDark, 0, 1.9, 0);
  for (const s of [-1, 1]) box(g, 0.08, 1.9, 0.08, MAT.woodDark, s * 1.05, 0.95, 0);
  const gedebog = cyl(g, 0.13, 0.13, 2.1, MAT.banana, 0, 0.2, 0.15, 10);
  gedebog.rotation.z = Math.PI / 2;
  for (const [wx, h] of [[-0.6, 0.8], [0.6, 0.75], [0, 0.55]]) {
    box(g, 0.24, h, 0.02, MAT.woodDark, wx, 0.65 + h / 2, 0.06);
    box(g, 0.02, 0.5, 0.02, MAT.black, wx, 0.4, 0.12, { cast: false });
  }
}

// Lampu gantung + PointLight.
function lamp(parent, x, topY, z, len) {
  cyl(parent, 0.015, 0.015, len, MAT.black, x, topY - len / 2, z, 4, { cast: false });
  const y = topY - len;
  cyl(parent, 0.1, 0.22, 0.12, MAT.brass, x, y - 0.06, z, 8);
  cyl(parent, 0.16, 0.16, 0.32, MAT.bulb, x, y - 0.28, z, 8, { cast: false });
  cyl(parent, 0.2, 0.08, 0.08, MAT.brass, x, y - 0.48, z, 8);
  const light = new THREE.PointLight(0xffc977, 0, 16, 2);
  light.position.set(x, y - 0.3, z);
  parent.add(light);
  return light;
}

// ---------------------------------------------------------------------------
// Bebatur (lantai yang ditinggikan) dan anak tangga, dalam koordinat dunia.
// ---------------------------------------------------------------------------
const PLATFORM_MAT = [MAT.plinth, MAT.plinth, MAT.floor, MAT.plinth, MAT.plinth, MAT.plinth];

function platform(g, x0, x1, z0, z1) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, FLOOR_Y, z1 - z0), PLATFORM_MAT);
  m.position.set((x0 + x1) / 2, FLOOR_Y / 2, (z0 + z1) / 2);
  m.receiveShadow = true;
  m.castShadow = true;
  m.userData.solid = true;
  g.add(m);
}

function steps(g, x, z, axis, sign, width) {
  for (let k = 1; k <= 2; k++) {
    const top = FLOOR_Y - 0.2 * k;
    const off = 0.36 * (k - 0.5);
    if (axis === "z") box(g, width, top, 0.36, MAT.plinth, x, top / 2, z + sign * off, { solid: true });
    else box(g, 0.36, top, width, MAT.plinth, x + sign * off, top / 2, z, { solid: true });
  }
}

// ---------------------------------------------------------------------------
export function buildJoglo() {
  const group = new THREE.Group();
  group.name = "joglo";
  const lights = [];
  const doors = [];
  const F = FLOOR_Y;

  // bebatur: pendopo + (pringgitan & dalem)
  platform(group, -6.6, 6.6, 1.4, 14.6);
  platform(group, -7.4, 7.4, -11.9, 1.4);
  steps(group, 0, 14.6, "z", 1, 4);
  steps(group, 7.4, 0.2, "x", 1, 2);

  // ---- PENDOPO (terbuka) ----
  const pendopo = new THREE.Group();
  pendopo.name = "pendopo";
  pendopo.position.z = PENDOPO_Z;
  group.add(pendopo);
  const pi = jogloFrame(pendopo, { hx: 5.5, hz: 5.5 });
  gamelan(pendopo, -3.5, 0);
  lesehan(pendopo, 3.4, 0);
  lights.push(lamp(pendopo, 0, pi.guruTop + 0.85, 0, 1.2));

  // ---- DALEM (tertutup dinding) ----
  const dalem = new THREE.Group();
  dalem.name = "dalem";
  dalem.position.z = DALEM_Z;
  group.add(dalem);
  const hx = 6.5;
  const hz = 5;
  const di = jogloFrame(dalem, { hx, hz });
  const H = di.pengarakTop - F;

  // dinding depan dari gebyok kayu: pintu ganda + 2 jendela
  wall(dalem, {
    L: 2 * hx, H, mat: MAT.gebyok, z: hz, panels: true, doors,
    openings: [
      { x0: -1.1, x1: 1.1, y0: 0, y1: 2.5, door: true },
      { x0: -4.6, x1: -3.2, y0: 1.0, y1: 2.1, bars: 5 },
      { x0: 3.2, x1: 4.6, y0: 1.0, y1: 2.1, bars: 5 },
    ],
  });
  wall(dalem, { L: 2 * hx, H, mat: MAT.wall, z: -hz });
  for (const s of [-1, 1]) {
    wall(dalem, {
      L: 2 * hz, H, mat: MAT.wall, x: s * hx, rotY: Math.PI / 2,
      openings: [{ x0: -0.7, x1: 0.7, y0: 1.0, y1: 2.1, bars: 4 }],
    });
  }

  // ruang utama dalem
  diningSet(dalem, 0, 0.6);
  cupboard(dalem, -5.9, 1.2, Math.PI / 2);
  bench(dalem, 5.85, 1.2, 1.8, Math.PI / 2);
  lights.push(lamp(dalem, 0, di.guruTop + 0.85, 0, 1.2));

  // ---- SENTHONG: tiga kamar di belakang ----
  const sz = -hz + 2.6;
  wall(dalem, {
    L: 2 * hx, H: 2.9, T: 0.12, mat: MAT.gebyok, z: sz, panels: true,
    openings: [
      { x0: -4.85, x1: -3.85, y0: 0, y1: 2.2 },
      { x0: -0.75, x1: 0.75, y0: 0, y1: 2.3 },
      { x0: 3.85, x1: 4.85, y0: 0, y1: 2.2 },
    ],
  });
  for (const s of [-1, 1]) wall(dalem, { L: 2.6, H: 2.9, T: 0.12, mat: MAT.gebyok, x: s * 2.2, z: (-hz + sz) / 2, rotY: Math.PI / 2 });
  for (const s of [-1, 1]) box(dalem, 0.4, 2.3, 0.04, MAT.cloth, s * 0.6, F + 1.15, sz + 0.1, { cast: false }); // tirai
  box(dalem, 2 * hx, 0.12, 0.12, MAT.woodDark, 0, F + 2.96, -3.7);
  bed(dalem, 0, -4.15, 1.8, 1.3, true); // senthong tengah (krobongan)
  bed(dalem, -4.35, -4.2, 1.9, 1.3); // senthong kiwa
  cupboard(dalem, 4.0, -4.65, 0); // senthong tengen
  box(dalem, 0.9, 0.5, 0.5, MAT.wood, 5.6, F + 0.25, -4.4);
  statue(dalem, -0.95, sz + 0.5, MAT.cloth);
  statue(dalem, 0.95, sz + 0.5, MAT.mat);
  lights.push(lamp(dalem, 0, F + 2.9, -3.7, 0.35));

  // ---- PRINGGITAN (antara pendopo dan dalem) ----
  box(group, 14.4, 0.06, 1.0, MAT.roofDark, 0, F + 2.62, 0.75); // talang penghubung atap
  kelir(group, -6.0, 0.25, Math.PI / 2);
  lights.push(lamp(group, -3.0, F + 2.59, 0.75, 0.3));

  // pintu buka/tutup dengan animasi
  let open = true;
  return {
    group,
    lights,
    toggleDoors() {
      open = !open;
      return open;
    },
    update(dt) {
      const k = Math.min(1, dt * 3);
      for (const d of doors) {
        const target = open ? d.openAngle : 0;
        d.pivot.rotation.y += (target - d.pivot.rotation.y) * k;
      }
    },
  };
}
