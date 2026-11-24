import * as THREE from "three";
import { MAT, box, cyl, place } from "./lib.js";
import {
  createCoconutTree, createFlowers, createGrass, createGround, createPineTree,
  createPond, createRocks, createRoundTree, createShrub, createStonePath, createYard,
  POND_RADIUS,
} from "./landscape.js";

const FENCE_X = 22;
const FENCE_BACK = -22;
const FENCE_FRONT = 36;
const GATE_HALF_WIDTH = 3.2;
const POND = { x: -13, z: 29, r: POND_RADIUS };
const WELL = { x: 17, z: -8 };

export function createFenceSegment(length = FENCE_X - GATE_HALF_WIDTH) {
  const group = new THREE.Group();
  box(group, length, 1.1, 0.45, MAT.stone, 0, 0.55, 0, { solid: true });
  box(group, length, 0.12, 0.6, MAT.stoneDark, 0, 1.16, 0);
  const intervals = Math.max(1, Math.round(length / 6));
  for (let i = 0; i <= intervals; i++) {
    box(group, 0.7, 1.45, 0.7, MAT.brick, length * (i / intervals - 0.5), 0.725, 0);
  }
  return group;
}

export function createGate() {
  const group = new THREE.Group();
  const tiers = [
    [1.4, 1.4, 1.1], [1.25, 0.4, 1.0], [1.05, 0.6, 0.85],
    [0.85, 0.4, 0.7], [0.6, 0.5, 0.5], [0.3, 0.4, 0.3],
  ];
  for (const s of [-1, 1]) {
    let y = 0;
    tiers.forEach(([w, h, d], i) => {
      box(group, w, h, d, i % 2 ? MAT.stoneDark : MAT.brick, s * 2.5, y + h / 2, 0, { solid: i === 0 });
      y += h;
    });
  }
  return group;
}

export function createWell() {
  const group = new THREE.Group();
  cyl(group, 0.95, 1.0, 0.85, MAT.stone, 0, 0.425, 0, 16, { solid: true });
  cyl(group, 0.78, 0.78, 0.02, MAT.black, 0, 0.86, 0, 16, { cast: false });
  for (const s of [-1, 1]) box(group, 0.12, 2.2, 0.12, MAT.woodDark, s * 0.85, 1.1, 0);
  box(group, 1.9, 0.1, 0.1, MAT.wood, 0, 1.9, 0);
  for (const s of [-1, 1]) {
    const roof = box(group, 2.2, 0.05, 0.95, MAT.roofDark, 0, 2.33, s * 0.35);
    roof.rotation.x = s * 0.55;
  }
  cyl(group, 0.01, 0.01, 0.5, MAT.black, 0, 1.6, 0, 4, { cast: false });
  cyl(group, 0.14, 0.11, 0.22, MAT.woodLight, 0, 1.25, 0, 10);
  return group;
}

export function buildEnvironment(rand) {
  const g = new THREE.Group();
  g.name = "lingkungan";
  const r = (a, b) => a + (b - a) * rand();
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  const insideFence = (x, z, pad = 0) => Math.abs(x) < FENCE_X + pad && z > FENCE_BACK - pad && z < FENCE_FRONT + pad;
  const nearFence = (x, z) => insideFence(x, z, 1) && !insideFence(x, z, -1);
  // area yang tidak boleh ditumbuhi rumput/batu/pohon
  const keepOut = (x, z, pad = 0) =>
    (Math.abs(x) < 13.5 + pad && z > -15.5 - pad && z < 21.5 + pad) || // rumah + halaman
    (Math.abs(x) < 2 + pad && z > 20) || // jalan setapak
    Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.6 + pad ||
    Math.hypot(x - WELL.x, z - WELL.z) < 1.6 + pad ||
    nearFence(x, z);

  g.add(createGround(600, 600));
  place(g, createYard(), 0, 0.015, 3);

  const pathStart = 15.7;
  const pathEnd = 35.8;
  place(g, createStonePath(rand, pathEnd - pathStart), 0, 0, (pathStart + pathEnd) / 2);

  const placeFence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const yaw = -Math.atan2(z1 - z0, x1 - x0);
    place(g, createFenceSegment(len), (x0 + x1) / 2, 0, (z0 + z1) / 2, yaw);
  };
  placeFence(-FENCE_X, FENCE_BACK, FENCE_X, FENCE_BACK);
  placeFence(-FENCE_X, FENCE_BACK, -FENCE_X, FENCE_FRONT);
  placeFence(FENCE_X, FENCE_BACK, FENCE_X, FENCE_FRONT);
  placeFence(-FENCE_X, FENCE_FRONT, -GATE_HALF_WIDTH, FENCE_FRONT);
  placeFence(GATE_HALF_WIDTH, FENCE_FRONT, FENCE_X, FENCE_FRONT);
  place(g, createGate(), 0, 0, FENCE_FRONT);

  const trees = {
    round: createRoundTree,
    pine: createPineTree,
    coco: () => createCoconutTree(r(0.05, 0.12)),
  };
  [
    [-18, -18, "round", 1.2], [-9, -19, "pine", 1], [0, -19.5, "round", 1.1], [9, -19, "pine", 1.1],
    [18, -17.5, "round", 1.2], [-18.5, -4, "coco", 1], [-18, 6, "round", 1], [18.5, 4, "coco", 1.05],
    [18, 13, "round", 1.1], [-17.5, 14.5, "coco", 0.95], [-7.5, 31.5, "round", 0.9], [9, 30, "coco", 1],
    [17, 22, "round", 1], [19, 32, "pine", 0.9], [-19, 33, "pine", 1], [-19.5, 23, "round", 0.8],
  ].forEach(([x, z, type, scale]) => {
    const yaw = type === "pine" ? 0 : rand() * Math.PI * 2;
    const tree = trees[type]();
    tree.scale.setScalar(scale);
    place(g, tree, x, 0, z, yaw);
  });

  const bush = (x, z, size) => {
    const shrub = createShrub(size, pick([MAT.leaf, MAT.leafDark, MAT.leafLight]));
    place(g, shrub, x, 0, z, rand() * 3);
  };

  const nearSideSteps = (x, z) => x > 0 && Math.abs(z - 0.2) < 1.8;
  for (let z = -10; z <= 14; z += 2.4) {
    for (const s of [-1, 1]) if (!nearSideSteps(s, z)) bush(s * r(8.6, 9.4), z + r(-0.4, 0.4), r(0.8, 1.2));
  }
  for (let x = -20; x <= 20; x += 2.5) if (Math.abs(x) > 4) bush(x + r(-0.3, 0.3), FENCE_FRONT - 1.3, r(0.7, 1.1));
  for (let n = 0; n < 30; ) {
    const x = r(-21, 21);
    const z = r(-21, 35);
    if (keepOut(x, z, 0.8)) continue;
    bush(x, z, r(0.6, 1.3));
    n++;
  }

  const flowers = [];
  for (let z = 22; z < 34.5; z += 0.45) for (const s of [-1, 1]) flowers.push([s * r(2.3, 3.4), z + r(-0.15, 0.15)]);
  for (let i = 0; i < 40; i++) {
    const a = r(0, Math.PI * 2);
    const d = r(POND.r + 0.9, POND.r + 1.8);
    flowers.push([POND.x + Math.cos(a) * d, POND.z + Math.sin(a) * d]);
  }
  for (let i = 0; i < 60; i++) flowers.push([(rand() < 0.5 ? -1 : 1) * r(2.6, 6.4), r(15.6, 20.5)]);
  g.add(createFlowers(flowers, rand));

  place(g, createPond(rand, POND.r), POND.x, 0, POND.z);
  place(g, createWell(), WELL.x, 0, WELL.z);

  const rocks = [];
  const addRock = (x, z, s, flatness = 0.6) => rocks.push({ x, z, s, flatness });
  for (let z = 21; z < 35.5; z += 0.9) for (const s of [-1, 1]) addRock(s * r(1.4, 1.7), z + r(-0.2, 0.2), r(0.15, 0.28));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    addRock(POND.x + Math.cos(a) * (POND.r + 0.25), POND.z + Math.sin(a) * (POND.r + 0.25), r(0.3, 0.5), 0.7);
  }
  for (let z = -11; z <= 14; z += 1.3) for (const s of [-1, 1]) if (rand() < 0.6 && !nearSideSteps(s, z)) addRock(s * r(7.7, 8.2), z, r(0.15, 0.3));
  [[-18, 19, 1.2], [18, 26, 1.0], [-19, -13, 1.4], [15, 33, 0.9], [19.5, -20, 1.1], [-4, -20, 0.9], [11, 34, 0.7]].forEach(
    ([x, z, s]) => addRock(x, z, s, 0.75),
  );
  for (let n = 0; n < 110; ) {
    const x = r(-21, 21);
    const z = r(-21, 35);
    if (keepOut(x, z, 0.5)) continue;
    addRock(x, z, r(0.12, 0.7));
    n++;
  }
  g.add(createRocks(rocks, rand));

  g.add(createGrass(14000, rand, () => {
    let x;
    let z;
    do {
      x = r(-21.5, 21.5);
      z = r(-21.5, 35.5);
    } while (keepOut(x, z));
    return [x, z];
  }));

  return { group: g };
}
