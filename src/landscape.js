import * as THREE from "three";
import { MAT, ball, box, cyl, place, rng } from "./lib.js";

export const POND_RADIUS = 3.2;
const GRASS_PER_CLUMP = 6;
const FLOWER_COLORS = [0xe0403a, 0xf2c230, 0xf5f0e6, 0xe57bb0, 0xf08a2c];
const ROCK_COLORS = [0x9d9a90, 0x85837a, 0xaaa69a, 0x77756d];
const GRASS_COLORS = [0x4f8a2f, 0x5f9e3a, 0x77b048, 0x3f7a28];

const range = (rand, min, max) => min + (max - min) * rand();
const pick = (rand, values) => values[Math.floor(rand() * values.length)];

function horizontalSurface(geometry, material) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

export function createGround(width = 10, depth = 10) {
  return horizontalSurface(new THREE.PlaneGeometry(width, depth), MAT.grass);
}

export function createYard() {
  return horizontalSurface(new THREE.PlaneGeometry(27, 37), MAT.yard);
}

export function createSteppingStone() {
  const group = new THREE.Group();
  cyl(group, 0.42, 0.46, 0.08, MAT.stone, 0, 0.04, 0, 7, { cast: false });
  return group;
}

export function createStonePath(rand = rng(2026), length = 20.1) {
  const group = new THREE.Group();
  for (let distance = 0; distance < length; distance += 0.72) {
    const x = range(rand, -0.12, 0.12);
    place(group, createSteppingStone(), x, 0, distance - length / 2, rand() * 3);
  }
  return group;
}

export function createRoundTree() {
  const tree = new THREE.Group();
  cyl(tree, 0.18, 0.28, 2.6, MAT.trunk, 0, 1.3, 0, 7, { solid: true });
  ball(tree, 1.6, MAT.leaf, 0, 3.4, 0);
  ball(tree, 1.1, MAT.leafDark, 0.9, 3.0, 0.3);
  ball(tree, 1.0, MAT.leafLight, -0.7, 3.9, -0.4);
  return tree;
}

export function createPineTree() {
  const tree = new THREE.Group();
  cyl(tree, 0.14, 0.2, 1.6, MAT.trunk, 0, 0.8, 0, 6, { solid: true });
  const tiers = [[1.5, 2.2, 1.9], [1.15, 1.9, 3.0], [0.8, 1.6, 4.0]];
  tiers.forEach(([radius, height, y], i) => {
    const crown = cyl(tree, 0, radius, height, i === 1 ? MAT.leafDark : MAT.leaf, 0, y, 0, 7);
    crown.rotation.y = i;
  });
  return tree;
}

export function createCoconutTree(lean = 0.085) {
  const tree = new THREE.Group();
  let px = 0;
  let py = 0;
  for (let i = 0; i < 7; i++) {
    const dx = lean * (i + 1) * 0.5;
    const segment = cyl(tree, 0.13, 0.16, 0.95, MAT.palm, px + dx / 2, py + 0.45, 0, 7, { solid: i === 0 });
    segment.rotation.z = -Math.atan2(dx, 0.9);
    px += dx;
    py += 0.9;
  }
  const crown = place(tree, new THREE.Group(), px, py);
  for (let i = 0; i < 9; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(0, (i / 9) * Math.PI * 2, -0.45 + (i % 2) * 0.2);
    crown.add(pivot);
    box(pivot, 2.6, 0.04, 0.5, i % 2 ? MAT.leaf : MAT.leafLight, 1.3, 0, 0);
  }
  for (let i = 0; i < 3; i++) ball(crown, 0.16, MAT.trunk, Math.cos(i * 2.1) * 0.25, -0.2, Math.sin(i * 2.1) * 0.25);
  return tree;
}

export function createShrub(size = 1, material = MAT.leaf) {
  const group = new THREE.Group();
  const leaves = ball(group, 0.6 * size, material, 0, 0.35 * size, 0);
  leaves.scale.y = 0.7;
  return group;
}

export function createFlowers(positions = [[0, 0]], rand = rng(2026)) {
  const group = new THREE.Group();
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 3).translate(0, 0.18, 0), MAT.leafDark, positions.length);
  const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), MAT.instanceFlat, positions.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  positions.forEach(([x, z], i) => {
    const height = range(rand, 0.8, 1.3);
    dummy.position.set(x, 0, z);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.36 * height;
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, color.setHex(pick(rand, FLOWER_COLORS)));
  });
  group.add(stems, heads);
  return group;
}

export function createWater(radius = POND_RADIUS) {
  return horizontalSurface(new THREE.CircleGeometry(radius, 28), MAT.water);
}

export function createLotus(bloom = true) {
  const group = new THREE.Group();
  cyl(group, 0.35, 0.35, 0.02, MAT.leafLight, 0, 0.01, 0, 10, { cast: false });
  if (bloom) ball(group, 0.12, MAT.lotus, 0.1, 0.1, 0);
  return group;
}

export function createPond(rand = rng(2026), radius = POND_RADIUS) {
  const group = new THREE.Group();
  place(group, createWater(radius), 0, 0.03);
  for (let i = 0; i < 6; i++) {
    const angle = range(rand, 0, Math.PI * 2);
    const distance = range(rand, 0.4, radius - 0.6);
    place(group, createLotus(i % 2 === 0), Math.cos(angle) * distance, 0.04, Math.sin(angle) * distance);
  }
  return group;
}

export function createRocks(rocks = [{ x: 0, z: 0, s: 1, flatness: 0.6 }], rand = rng(2026)) {
  const mesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MAT.instanceFlat, rocks.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  rocks.forEach(({ x, z, s, flatness }, i) => {
    dummy.position.set(x, s * flatness * 0.35, z);
    dummy.rotation.set(rand() * 3, rand() * 6, rand() * 3);
    dummy.scale.set(s * range(rand, 0.8, 1.3), s * flatness, s * range(rand, 0.8, 1.2));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.setHex(pick(rand, ROCK_COLORS)));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createGrass(count = GRASS_PER_CLUMP, rand = rng(2026), sampleCenter = () => [0, 0]) {
  const blade = new THREE.ConeGeometry(0.05, 0.45, 3).translate(0, 0.225, 0);
  const mesh = new THREE.InstancedMesh(blade, MAT.instance, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < count; ) {
    const [x, z] = sampleCenter();
    for (let k = 0; k < GRASS_PER_CLUMP && i < count; k++, i++) {
      dummy.position.set(x + range(rand, -0.3, 0.3), 0, z + range(rand, -0.3, 0.3));
      dummy.rotation.set(range(rand, -0.3, 0.3), range(rand, 0, 6.3), range(rand, -0.3, 0.3));
      dummy.scale.set(1, range(rand, 0.6, 1.5), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setHex(pick(rand, GRASS_COLORS)));
    }
  }
  mesh.receiveShadow = true;
  return mesh;
}
