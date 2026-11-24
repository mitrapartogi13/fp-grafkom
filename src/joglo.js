// Tata ruang dari sumbu +z (depan): pendopo, pringgitan, dalem, lalu senthong.
import * as THREE from "three";
import { MAT, box, cyl, beam, ring, place } from "./lib.js";
import {
  createBed, createBench, createCupboard, createDiningSet, createGamelan,
  createKelir, createLesehan, createStatue,
} from "./furniture.js";

export const FLOOR_Y = 0.6;
export const PENDOPO_Z = 8;
export const DALEM_Z = -6;
export const PENDOPO_FRAME = { hx: 5.5, hz: 5.5 };
export const DALEM_FRAME = { hx: 6.5, hz: 5 };

const GURU_HEIGHT = 4.3;
const EAVE_HEIGHT = 2.7;
const ENTRY_WIDTH = 2.2;
const ENTRY_HEIGHT = 2.5;
const SENTHONG_DEPTH = 2.6;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = THREE.MathUtils.lerp;

// b = alas (bx, bz, by), t = puncak (tx, tz, ty). tz ~ 0 menghasilkan bubungan.
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
  ring(parent, P.bx, P.bz, 0.1, 0.22, P.by - 0.06, MAT.woodDark, { cast: false });
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

function lowerTier({ hx, hz, gx = 2, gz = 2, ov = 1.5 }) {
  return { bx: hx + ov, bz: hz + ov, by: 0, tx: gx + 1.2, tz: gz + 1.2, ty: 4.8 - EAVE_HEIGHT };
}

export function createRoof(dimensions = PENDOPO_FRAME) {
  const { gx = 2, gz = 2 } = dimensions;
  const g = new THREE.Group();
  const top = { bx: gx + 1.6, bz: gz + 1.6, by: 4.45 - EAVE_HEIGHT, tx: gx - 0.6, tz: 0.02, ty: 8.2 - EAVE_HEIGHT };
  roofTier(g, lowerTier(dimensions));
  roofTier(g, top);
  box(g, 2 * top.tx + 0.5, 0.18, 0.26, MAT.roofDark, 0, top.ty + 0.06, 0);
  for (const s of [-1, 1]) cyl(g, 0, 0.16, 0.6, MAT.roofDark, s * (top.tx + 0.25), top.ty + 0.45, 0, 6);
  return g;
}

export function createPillar(height = GURU_HEIGHT, width = 0.34, mat = MAT.wood) {
  const g = new THREE.Group();
  const umpak = cyl(g, 0.22, 0.32, 0.35, MAT.umpak, 0, 0.175, 0, 4, { solid: true });
  umpak.rotation.y = Math.PI / 4;
  const h = height - 0.35;
  box(g, width, h, width, mat, 0, 0.35 + h / 2, 0, { solid: true });
  return g;
}

export function createTumpangSari(gx = 2, gz = 2) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    ring(g, gx + i * 0.18, gz + i * 0.18, 0.22, 0.16, 0.08 + i * 0.16, i % 2 ? MAT.woodDark : MAT.wood);
  }
  box(g, 2 * gx + 0.8, 0.24, 0.22, MAT.woodDark, 0, 0.95, 0); // dhadha peksi
  return g;
}

function outerPillarHeight(dimensions) {
  const { hx, hz } = dimensions;
  const low = lowerTier(dimensions);
  const yOnLow = (h, b, t) => EAVE_HEIGHT + ((b - h) / (b - t)) * low.ty;
  return Math.min(yOnLow(hx, low.bx, low.tx), yOnLow(hz, low.bz, low.tz)) - 0.25;
}

export function createOuterPillar(dimensions = PENDOPO_FRAME) {
  return createPillar(outerPillarHeight(dimensions), 0.26, MAT.woodLight);
}

// hx, hz adalah setengah jarak antara tiang luar. gx, gz untuk soko guru.
function buildFrame(g, dimensions) {
  const { hx, hz, gx = 2, gz = 2 } = dimensions;
  const F = FLOOR_Y;
  const pengarakTop = F + outerPillarHeight(dimensions);
  const guruTop = F + GURU_HEIGHT;

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) place(g, createPillar(), sx * gx, F, sz * gz);
  }
  const outer = [];
  for (const x of [-hx, -gx, gx, hx]) outer.push([x, -hz], [x, hz]);
  for (const z of [-gz, gz]) outer.push([-hx, z], [hx, z]);
  for (const [x, z] of outer) place(g, createOuterPillar(dimensions), x, F, z);

  ring(g, hx, hz, 0.24, 0.24, pengarakTop + 0.12, MAT.woodDark); // blandar
  place(g, createTumpangSari(gx, gz), 0, guruTop);

  // Sunduk mengikat tiang, dudur menyangga sudut atap.
  const pT = pengarakTop + 0.12;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      beam(g, V(sx * gx, pT, sz * gz), V(sx * hx, pT, sz * gz), 0.16, MAT.woodDark);
      beam(g, V(sx * gx, pT, sz * gz), V(sx * gx, pT, sz * hz), 0.16, MAT.woodDark);
      beam(g, V(sx * gx, guruTop, sz * gz), V(sx * hx, pT, sz * hz), 0.16, MAT.woodDark);
    }
  }

  place(g, createRoof(dimensions), 0, F + EAVE_HEIGHT);
  return { guruTop, pengarakTop };
}

function panelStrips(g, a, b, H, T) {
  const n = Math.max(1, Math.round((b - a) / 0.7));
  for (const s of [-1, 1]) {
    const z = s * (T / 2 + 0.015);
    for (let i = 0; i <= n; i++) box(g, 0.06, H, 0.03, MAT.woodDark, a + ((b - a) * i) / n, H / 2, z, { cast: false });
    for (const y of [0.9, H - 0.45]) box(g, b - a, 0.06, 0.03, MAT.woodDark, (a + b) / 2, y, z, { cast: false });
  }
}

export function createDoor(width = ENTRY_WIDTH, h = ENTRY_HEIGHT, open = false) {
  const g = new THREE.Group();
  const w = width / 2;
  for (const s of [-1, 1]) {
    // Daun pintu dibangun relatif ke engsel di ujung luar.
    const hinge = new THREE.Group();
    hinge.position.x = s * w;
    hinge.userData.openAngle = -s * 1.6;
    hinge.rotation.y = open ? hinge.userData.openAngle : 0;
    g.add(hinge);

    const cx = (-s * w) / 2;
    box(hinge, w - 0.03, h - 0.04, 0.06, MAT.gebyok, cx, h / 2, 0);
    for (const y of [0.3, 0.7]) box(hinge, w - 0.3, h * 0.28, 0.09, MAT.woodDark, cx, h * y, 0, { cast: false });
    box(hinge, 0.05, 0.12, 0.12, MAT.brass, -s * (w - 0.12), h * 0.5, 0, { cast: false });
  }
  return g;
}

// Dinding memanjang di sumbu x lokal agar bisa diputar untuk sisi rumah.
function createWall({ L, H, T = 0.14, mat, openings = [], panels = false }) {
  const g = new THREE.Group();
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
    const ft = T + 0.06;
    box(g, w + 0.16, 0.08, ft, MAT.woodDark, cx, o.y1 + 0.04, 0);
    box(g, 0.08, o.y1 - o.y0, ft, MAT.woodDark, o.x0 - 0.04, (o.y0 + o.y1) / 2, 0);
    box(g, 0.08, o.y1 - o.y0, ft, MAT.woodDark, o.x1 + 0.04, (o.y0 + o.y1) / 2, 0);
    if (o.y0 > 0) box(g, w + 0.16, 0.06, ft + 0.04, MAT.woodDark, cx, o.y0 - 0.03, 0);
    for (let i = 1; i <= (o.bars || 0); i++) {
      box(g, 0.04, o.y1 - o.y0, 0.04, MAT.woodDark, o.x0 + (w * i) / (o.bars + 1), (o.y0 + o.y1) / 2, 0, { cast: false });
    }
    cur = o.x1;
  }
  seg(cur, L / 2);
  return g;
}


export function createDalemWall() {
  return createWall({
    L: 2 * DALEM_FRAME.hx, H: outerPillarHeight(DALEM_FRAME), mat: MAT.gebyok, panels: true,
    openings: [
      { x0: -ENTRY_WIDTH / 2, x1: ENTRY_WIDTH / 2, y0: 0, y1: ENTRY_HEIGHT },
      { x0: -4.6, x1: -3.2, y0: 1.0, y1: 2.1, bars: 5 },
      { x0: 3.2, x1: 4.6, y0: 1.0, y1: 2.1, bars: 5 },
    ],
  });
}

export function createDalemBackWall(height = outerPillarHeight(DALEM_FRAME)) {
  return createWall({ L: 2 * DALEM_FRAME.hx, H: height, mat: MAT.wall });
}

export function createDalemSideWall(height = outerPillarHeight(DALEM_FRAME)) {
  return createWall({
    L: 2 * DALEM_FRAME.hz, H: height, mat: MAT.wall,
    openings: [{ x0: -0.7, x1: 0.7, y0: 1.0, y1: 2.1, bars: 4 }],
  });
}

export function createSenthongPartition() {
  const group = new THREE.Group();
  const wall = { H: 2.9, T: 0.12, mat: MAT.gebyok };
  group.add(createWall({
    ...wall, L: 2 * DALEM_FRAME.hx, panels: true,
    openings: [
      { x0: -4.85, x1: -3.85, y0: 0, y1: 2.2 },
      { x0: -0.75, x1: 0.75, y0: 0, y1: 2.3 },
      { x0: 3.85, x1: 4.85, y0: 0, y1: 2.2 },
    ],
  }));
  for (const s of [-1, 1]) {
    place(group, createWall({ ...wall, L: SENTHONG_DEPTH }), s * 2.2, 0, -SENTHONG_DEPTH / 2, Math.PI / 2);
  }
  return group;
}

export function createSenthongCurtains() {
  const group = new THREE.Group();
  for (const s of [-1, 1]) {
    box(group, 0.4, 2.3, 0.04, MAT.cloth, s * 0.6, 1.15, 0, { cast: false });
  }
  return group;
}

export function createRoofGutter() {
  const group = new THREE.Group();
  box(group, 14.4, 0.06, 1.0, MAT.roofDark);
  return group;
}

export function createLamp(len = 1.2) {
  const g = new THREE.Group();
  cyl(g, 0.015, 0.015, len, MAT.black, 0, -len / 2, 0, 4, { cast: false });
  const y = -len;
  cyl(g, 0.1, 0.22, 0.12, MAT.brass, 0, y - 0.06, 0, 8);
  cyl(g, 0.16, 0.16, 0.32, MAT.bulb, 0, y - 0.28, 0, 8, { cast: false });
  cyl(g, 0.2, 0.08, 0.08, MAT.brass, 0, y - 0.48, 0, 8);
  place(g, new THREE.PointLight(0xffc977, 0, 16, 2), 0, y - 0.3);
  return g;
}

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


export function createFoundation() {
  const g = new THREE.Group();
  platform(g, -6.6, 6.6, 1.4, 14.6);
  platform(g, -7.4, 7.4, -11.9, 1.4);
  steps(g, 0, 14.6, "z", 1, 4);
  steps(g, 7.4, 0.2, "x", 1, 2);
  return g;
}

export function buildJoglo() {
  const group = new THREE.Group();
  group.name = "joglo";
  group.add(createFoundation());
  const F = FLOOR_Y;

  const pendopo = place(group, new THREE.Group(), 0, 0, PENDOPO_Z);
  pendopo.name = "pendopo";
  const pi = buildFrame(pendopo, PENDOPO_FRAME);
  place(pendopo, createGamelan(), -3.5, F);
  place(pendopo, createLesehan(), 3.4, F);
  place(pendopo, createLamp(), 0, pi.guruTop + 0.85);

  const dalem = place(group, new THREE.Group(), 0, 0, DALEM_Z);
  dalem.name = "dalem";
  const { hx, hz } = DALEM_FRAME;
  const di = buildFrame(dalem, DALEM_FRAME);
  const H = di.pengarakTop - F;

  const frontWall = place(dalem, createDalemWall(), 0, F, hz);
  const door = createDoor(ENTRY_WIDTH, ENTRY_HEIGHT, true);
  frontWall.add(door);
  place(dalem, createDalemBackWall(H), 0, F, -hz);
  for (const s of [-1, 1]) {
    place(dalem, createDalemSideWall(H), s * hx, F, 0, Math.PI / 2);
  }

  place(dalem, createDiningSet(), 0, F, 0.6);
  place(dalem, createCupboard(), -5.9, F, 1.2, Math.PI / 2);
  place(dalem, createBench(), 5.85, F, 1.2, Math.PI / 2);
  place(dalem, createLamp(), 0, di.guruTop + 0.85);

  const sz = -hz + SENTHONG_DEPTH;
  place(dalem, createSenthongPartition(), 0, F, sz);
  place(dalem, createSenthongCurtains(), 0, F, sz + 0.1);
  box(dalem, 2 * hx, 0.12, 0.12, MAT.woodDark, 0, F + 2.96, -3.7);
  place(dalem, createBed(1.8, 1.3, true), 0, F, -4.15); // senthong tengah (krobongan)
  place(dalem, createBed(), -4.35, F, -4.2); // senthong kiwa
  place(dalem, createCupboard(), 4.0, F, -4.65); // senthong tengen
  box(dalem, 0.9, 0.5, 0.5, MAT.wood, 5.6, F + 0.25, -4.4);
  place(dalem, createStatue(), -0.95, F, sz + 0.5);
  place(dalem, createStatue(MAT.mat), 0.95, F, sz + 0.5);
  place(dalem, createLamp(0.35), 0, F + 2.9, -3.7);

  place(group, createRoofGutter(), 0, F + 2.62, 0.75);
  place(group, createKelir(), -6.0, F, 0.25, Math.PI / 2);
  place(group, createLamp(0.3), -3.0, F + 2.59, 0.75);

  const lights = [];
  group.traverse((object) => {
    if (object.isPointLight) lights.push(object);
  });

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
      for (const hinge of door.children) {
        const target = open ? hinge.userData.openAngle : 0;
        hinge.rotation.y += (target - hinge.rotation.y) * k;
      }
    },
  };
}
