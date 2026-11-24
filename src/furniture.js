import * as THREE from "three";
import { MAT, box, cyl, ball, ring, place } from "./lib.js";

export function createTable(w = 1.6, d = 0.9, h = 0.75) {
  const g = new THREE.Group();
  box(g, w, 0.06, d, MAT.wood, 0, h - 0.03, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.07, h - 0.06, 0.07, MAT.woodDark, sx * (w / 2 - 0.08), (h - 0.06) / 2, sz * (d / 2 - 0.08));
  }
  return g;
}

export function createChair() {
  const g = new THREE.Group();
  box(g, 0.46, 0.05, 0.46, MAT.wood, 0, 0.45, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.43, 0.05, MAT.woodDark, sx * 0.19, 0.215, sz * 0.19);
  box(g, 0.46, 0.5, 0.05, MAT.wood, 0, 0.73, -0.2);
  return g;
}

export function createDiningSet() {
  const g = new THREE.Group();
  g.add(createTable());
  for (const x of [-0.4, 0.4]) {
    place(g, createChair(), x, 0, 0.75, Math.PI);
    place(g, createChair(), x, 0, -0.75);
  }
  return g;
}

export function createBed(w = 1.9, d = 1.3, canopy = false) {
  const g = new THREE.Group();
  box(g, w, 0.4, d, MAT.wood, 0, 0.2, 0);
  box(g, w - 0.1, 0.14, d - 0.1, MAT.white, 0, 0.47, 0);
  box(g, 0.35, 0.1, d * 0.6, MAT.white, -w / 2 + 0.3, 0.59, 0);
  if (!canopy) return g;
  const H = 2.1;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.07, H, 0.07, MAT.woodDark, sx * (w / 2 - 0.03), H / 2, sz * (d / 2 - 0.03));
  ring(g, w / 2 - 0.03, d / 2 - 0.03, 0.08, 0.12, H, MAT.woodDark);
  box(g, w - 0.1, H - 0.5, 0.02, MAT.cloth, 0, H / 2 + 0.2, -d / 2 + 0.04);
  box(g, w, 0.3, 0.03, MAT.cloth, 0, H - 0.2, d / 2);
  for (const sx of [-1, 1]) box(g, 0.03, H - 0.3, 0.3, MAT.cloth, sx * (w / 2 - 0.03), H / 2 + 0.1, d / 2 - 0.2);
  return g;
}

export function createCupboard() {
  const g = new THREE.Group();
  box(g, 1.2, 2.0, 0.55, MAT.woodDark, 0, 1.0, 0, { solid: true });
  box(g, 1.28, 0.08, 0.6, MAT.wood, 0, 2.04, 0);
  box(g, 0.02, 1.8, 0.02, MAT.black, 0, 1.0, 0.285, { cast: false });
  for (const s of [-1, 1]) box(g, 0.05, 0.12, 0.04, MAT.brass, s * 0.08, 1.05, 0.29, { cast: false });
  return g;
}

export function createBench(len = 1.8) {
  const g = new THREE.Group();
  box(g, len, 0.06, 0.55, MAT.woodLight, 0, 0.45, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, 0.42, 0.06, MAT.woodDark, sx * (len / 2 - 0.1), 0.21, sz * 0.2);
  return g;
}

export function createLesehan() {
  const g = new THREE.Group();
  box(g, 2.8, 0.02, 3.2, MAT.mat, 0, 0.01, 0, { cast: false });
  box(g, 1.2, 0.05, 0.8, MAT.wood, 0, 0.38, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, 0.36, 0.06, MAT.woodDark, sx * 0.5, 0.18, sz * 0.3);
  for (const [cx, cz] of [[0, 0.85], [0, -0.85], [0.95, 0], [-0.95, 0]]) box(g, 0.5, 0.08, 0.5, MAT.cloth, cx, 0.06, cz);
  cyl(g, 0.07, 0.09, 0.16, MAT.white, -0.2, 0.49, 0, 10);
  for (const cx of [0.1, 0.3]) cyl(g, 0.04, 0.035, 0.07, MAT.white, cx, 0.445, 0.1, 8);
  return g;
}

export function createGamelan() {
  const g = new THREE.Group();
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
  return g;
}

export function createStatue(cloth = MAT.cloth) {
  const g = new THREE.Group();
  box(g, 0.4, 0.1, 0.35, MAT.woodDark, 0, 0.05, 0);
  cyl(g, 0.12, 0.17, 0.45, cloth, 0, 0.32, 0, 10);
  ball(g, 0.09, MAT.skin, 0, 0.63, 0, { detail: 1 });
  return g;
}

export function createKelir() {
  const g = new THREE.Group();
  box(g, 2.0, 1.2, 0.03, MAT.white, 0, 1.25, 0);
  box(g, 2.2, 0.08, 0.08, MAT.woodDark, 0, 1.9, 0);
  for (const s of [-1, 1]) box(g, 0.08, 1.9, 0.08, MAT.woodDark, s * 1.05, 0.95, 0);
  const gedebog = cyl(g, 0.13, 0.13, 2.1, MAT.banana, 0, 0.2, 0.15, 10);
  gedebog.rotation.z = Math.PI / 2;
  for (const [wx, h] of [[-0.6, 0.8], [0.6, 0.75], [0, 0.55]]) {
    box(g, 0.24, h, 0.02, MAT.woodDark, wx, 0.65 + h / 2, 0.06);
    box(g, 0.02, 0.5, 0.02, MAT.black, wx, 0.4, 0.12, { cast: false });
  }
  return g;
}
