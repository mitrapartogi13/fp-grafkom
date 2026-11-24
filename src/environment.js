import * as THREE from "three";
import { MAT, box, cyl, ball, place } from "./lib.js";

const FENCE_X = 22;
const FENCE_BACK = -22;
const FENCE_FRONT = 36;
const GATE_HALF_WIDTH = 3.2;
const POND = { x: -13, z: 29, r: 3.2 };
const WELL = { x: 17, z: -8 };

function flat(parent, w, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

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
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const insideFence = (x, z, pad = 0) => Math.abs(x) < FENCE_X + pad && z > FENCE_BACK - pad && z < FENCE_FRONT + pad;
  const nearFence = (x, z) => insideFence(x, z, 1) && !insideFence(x, z, -1);
  // area yang tidak boleh ditumbuhi rumput/batu/pohon
  const keepOut = (x, z, pad = 0) =>
    (Math.abs(x) < 13.5 + pad && z > -15.5 - pad && z < 21.5 + pad) || // rumah + halaman
    (Math.abs(x) < 2 + pad && z > 20) || // jalan setapak
    Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.6 + pad ||
    Math.hypot(x - WELL.x, z - WELL.z) < 1.6 + pad ||
    nearFence(x, z);

  flat(g, 600, 600, MAT.grass, 0, 0, 0);
  flat(g, 27, 37, MAT.yard, 0, 0.015, 3);

  for (let z = 15.7; z < 35.8; z += 0.72) {
    const s = cyl(g, 0.42, 0.46, 0.08, MAT.stone, r(-0.12, 0.12), 0.04, z, 7, { cast: false });
    s.rotation.y = rand() * 3;
  }

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

  const treeRound = (x, z, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = rand() * Math.PI * 2;
    cyl(t, 0.18, 0.28, 2.6, MAT.trunk, 0, 1.3, 0, 7, { solid: true });
    ball(t, 1.6, MAT.leaf, 0, 3.4, 0);
    ball(t, 1.1, MAT.leafDark, 0.9, 3.0, 0.3);
    ball(t, 1.0, MAT.leafLight, -0.7, 3.9, -0.4);
    g.add(t);
  };
  const treePine = (x, z, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    cyl(t, 0.14, 0.2, 1.6, MAT.trunk, 0, 0.8, 0, 6, { solid: true });
    [[1.5, 2.2, 1.9], [1.15, 1.9, 3.0], [0.8, 1.6, 4.0]].forEach(([rad, h, y], i) => {
      const c = cyl(t, 0, rad, h, i === 1 ? MAT.leafDark : MAT.leaf, 0, y, 0, 7);
      c.rotation.y = i;
    });
    g.add(t);
  };
  const treeCoconut = (x, z, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = rand() * Math.PI * 2;
    const lean = r(0.05, 0.12);
    let px = 0;
    let py = 0;
    for (let i = 0; i < 7; i++) {
      const dx = lean * (i + 1) * 0.5;
      const seg = cyl(t, 0.13, 0.16, 0.95, MAT.palm, px + dx / 2, py + 0.45, 0, 7, { solid: i === 0 });
      seg.rotation.z = -Math.atan2(dx, 0.9);
      px += dx;
      py += 0.9;
    }
    const crown = new THREE.Group();
    crown.position.set(px, py, 0);
    t.add(crown);
    for (let k = 0; k < 9; k++) {
      const pivot = new THREE.Group();
      pivot.rotation.set(0, (k / 9) * Math.PI * 2, -0.45 + (k % 2) * 0.2);
      crown.add(pivot);
      box(pivot, 2.6, 0.04, 0.5, k % 2 ? MAT.leaf : MAT.leafLight, 1.3, 0, 0);
    }
    for (let k = 0; k < 3; k++) ball(crown, 0.16, MAT.trunk, Math.cos(k * 2.1) * 0.25, -0.2, Math.sin(k * 2.1) * 0.25);
    g.add(t);
  };
  const bush = (x, z, s = 1) => {
    const b = ball(g, 0.6 * s, pick([MAT.leaf, MAT.leafDark, MAT.leafLight]), x, 0.35 * s, z);
    b.scale.y = 0.7;
    b.rotation.y = rand() * 3;
  };
  const plant = { round: treeRound, pine: treePine, coco: treeCoconut };

  [
    [-18, -18, "round", 1.2], [-9, -19, "pine", 1], [0, -19.5, "round", 1.1], [9, -19, "pine", 1.1],
    [18, -17.5, "round", 1.2], [-18.5, -4, "coco", 1], [-18, 6, "round", 1], [18.5, 4, "coco", 1.05],
    [18, 13, "round", 1.1], [-17.5, 14.5, "coco", 0.95], [-7.5, 31.5, "round", 0.9], [9, 30, "coco", 1],
    [17, 22, "round", 1], [19, 32, "pine", 0.9], [-19, 33, "pine", 1], [-19.5, 23, "round", 0.8],
  ].forEach(([x, z, type, s]) => plant[type](x, z, s));

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
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 3).translate(0, 0.18, 0), MAT.leafDark, flowers.length);
  const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), MAT.instanceFlat, flowers.length);
  const FLOWER_COLORS = [0xe0403a, 0xf2c230, 0xf5f0e6, 0xe57bb0, 0xf08a2c];
  flowers.forEach(([x, z], i) => {
    const h = r(0.8, 1.3);
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, h, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.36 * h;
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, color.setHex(pick(FLOWER_COLORS)));
  });
  g.add(stems, heads);

  const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 28), MAT.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(POND.x, 0.03, POND.z);
  water.receiveShadow = true;
  g.add(water);
  for (let i = 0; i < 6; i++) {
    const a = r(0, Math.PI * 2);
    const d = r(0.4, POND.r - 0.6);
    const x = POND.x + Math.cos(a) * d;
    const z = POND.z + Math.sin(a) * d;
    cyl(g, 0.35, 0.35, 0.02, MAT.leafLight, x, 0.05, z, 10, { cast: false });
    if (i % 2 === 0) ball(g, 0.12, MAT.lotus, x + 0.1, 0.14, z);
  }

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
  const ROCK_COLORS = [0x9d9a90, 0x85837a, 0xaaa69a, 0x77756d];
  const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MAT.instanceFlat, rocks.length);
  rocks.forEach((k, i) => {
    dummy.position.set(k.x, k.s * k.flatness * 0.35, k.z);
    dummy.rotation.set(rand() * 3, rand() * 6, rand() * 3);
    dummy.scale.set(k.s * r(0.8, 1.3), k.s * k.flatness, k.s * r(0.8, 1.2));
    dummy.updateMatrix();
    rockMesh.setMatrixAt(i, dummy.matrix);
    rockMesh.setColorAt(i, color.setHex(pick(ROCK_COLORS)));
  });
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  g.add(rockMesh);

  const GRASS_COLORS = [0x4f8a2f, 0x5f9e3a, 0x77b048, 0x3f7a28];
  const blade = new THREE.ConeGeometry(0.05, 0.45, 3).translate(0, 0.225, 0);
  const N = 14000;
  const grass = new THREE.InstancedMesh(blade, MAT.instance, N);
  for (let i = 0; i < N; ) {
    const cx = r(-21.5, 21.5);
    const cz = r(-21.5, 35.5);
    if (keepOut(cx, cz)) continue;
    for (let k = 0; k < 6 && i < N; k++, i++) {
      dummy.position.set(cx + r(-0.3, 0.3), 0, cz + r(-0.3, 0.3));
      dummy.rotation.set(r(-0.3, 0.3), r(0, 6.3), r(-0.3, 0.3));
      dummy.scale.set(1, r(0.6, 1.5), 1);
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
      grass.setColorAt(i, color.setHex(pick(GRASS_COLORS)));
    }
  }
  grass.receiveShadow = true;
  g.add(grass);

  return { group: g };
}
