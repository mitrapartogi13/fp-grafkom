// Material dan fungsi bantu untuk membuat geometri dasar.
import * as THREE from "three";
import { woodTexture, roofTexture, applyWoodUV, rng } from "./textures.js";

export { rng };

const lambert = (color, extra = {}) =>
  new THREE.MeshLambertMaterial({ color, ...extra });

// Material kayu: tekstur serat dikalikan warna; UV diatur ulang per balok (lihat box()).
const WOOD_TEX = woodTexture();
const WOOD_UV_SCALE = 1 / 1.5; // 1 ulangan tekstur = 1.5 m
const wood = (color) => {
  const m = lambert(color, { map: WOOD_TEX });
  m.userData.woodUV = WOOD_UV_SCALE;
  return m;
};

export const MAT = {
  // kayu dan bangunan
  wood: wood(0x9a6538),
  woodDark: wood(0x6a4425),
  woodLight: wood(0xb98049),
  gebyok: wood(0x8a552d),
  umpak: lambert(0x77756f),
  plinth: lambert(0x8f8c82),
  floor: lambert(0xb4694a),
  wall: lambert(0xece1c6),
  roof: lambert(0xffffff, { map: roofTexture(), side: THREE.DoubleSide }), // genteng
  roofDark: lambert(0x6e2c1f),
  // perabot
  cloth: lambert(0xb3302a),
  white: lambert(0xf1ece0),
  mat: lambert(0xd6bf7a),
  brass: lambert(0xc9a03c),
  black: lambert(0x2a2622),
  skin: lambert(0xc99a66),
  bulb: new THREE.MeshBasicMaterial({ color: 0xffe7a3 }),
  // lingkungan
  grass: lambert(0x6aa443),
  yard: lambert(0xcdb88d),
  banana: lambert(0x9bb35a),
  stone: lambert(0x9d9a90),
  stoneDark: lambert(0x75736b),
  brick: lambert(0xa4553a),
  trunk: lambert(0x5d4027),
  palm: lambert(0x8a7458),
  leaf: lambert(0x3f8030, { flatShading: true }),
  leafDark: lambert(0x2e6524, { flatShading: true }),
  leafLight: lambert(0x5a9a38, { flatShading: true }),
  water: lambert(0x4f8fb5),
  lotus: lambert(0xe58fb0),
  // warna per-instance (InstancedMesh) dikalikan dengan putih
  instance: lambert(0xffffff),
  instanceFlat: lambert(0xffffff, { flatShading: true }),
};

function finish(mesh, parent, x, y, z, opt) {
  mesh.position.set(x, y, z);
  mesh.castShadow = opt.cast ?? true;
  mesh.receiveShadow = true;
  // "solid" = dipakai untuk tabrakan saat mode jalan
  if (opt.solid) mesh.userData.solid = true;
  parent.add(mesh);
  return mesh;
}

export function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, opt = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (mat.userData?.woodUV) applyWoodUV(geo, mat.userData.woodUV);
  return finish(new THREE.Mesh(geo, mat), parent, x, y, z, opt);
}

export function cyl(parent, rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 12, opt = {}) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  return finish(new THREE.Mesh(geo, mat), parent, x, y, z, opt);
}

export function ball(parent, r, mat, x = 0, y = 0, z = 0, opt = {}) {
  const geo = new THREE.IcosahedronGeometry(r, opt.detail ?? 0);
  return finish(new THREE.Mesh(geo, mat), parent, x, y, z, opt);
}

// Balok dari titik a ke titik b (koordinat lokal parent).
const Z_AXIS = new THREE.Vector3(0, 0, 1);
export function beam(parent, a, b, t, mat, opt = {}) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = box(parent, t, t, dir.length(), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, opt);
  m.quaternion.setFromUnitVectors(Z_AXIS, dir.normalize());
  return m;
}

// Bingkai persegi dari 4 balok, berpusat di (0, y, 0).
export function ring(parent, hx, hz, t, h, y, mat, opt = {}) {
  box(parent, 2 * hx + t, h, t, mat, 0, y, hz, opt);
  box(parent, 2 * hx + t, h, t, mat, 0, y, -hz, opt);
  box(parent, t, h, 2 * hz - t, mat, hx, y, 0, opt);
  box(parent, t, h, 2 * hz - t, mat, -hx, y, 0, opt);
}
