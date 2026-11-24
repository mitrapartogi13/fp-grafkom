import * as THREE from "three";

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Serat kayu memanjang searah sumbu v (vertikal di canvas). Dapat diulang (tileable).
export function woodTexture() {
  const W = 256;
  const H = 512;
  const [c, g] = makeCanvas(W, H);
  const rand = rng(11);
  g.fillStyle = "#f4f4f4";
  g.fillRect(0, 0, W, H);

  // serat: garis bergelombang; frekuensi kelipatan tinggi canvas agar tetap tileable
  for (let i = 0; i < 70; i++) {
    const x0 = rand() * W;
    const amp = 0.8 + rand() * 3;
    const k = 1 + Math.floor(rand() * 3);
    const phase = rand() * Math.PI * 2;
    const v = 70 + Math.floor(rand() * 90);
    g.strokeStyle = `rgba(${v},${v},${v},${0.06 + rand() * 0.16})`;
    g.lineWidth = 0.8 + rand() * 3;
    for (const dx of [-W, 0, W]) {
      g.beginPath();
      for (let y = 0; y <= H; y += 8) {
        const x = x0 + dx + Math.sin((y / H) * Math.PI * 2 * k + phase) * amp;
        if (y === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = 30 + rand() * (W - 60);
    const y = 40 + rand() * (H - 80);
    for (let r = 3; r < 16; r += 3) {
      g.strokeStyle = `rgba(90,90,90,${0.22 - r * 0.01})`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(x, y, r * 0.6, r * 1.8, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  for (let i = 0; i < 2500; i++) {
    const v = rand() < 0.5 ? 255 : 90;
    g.fillStyle = `rgba(${v},${v},${v},0.06)`;
    g.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 2 + rand() * 6);
  }
  return toTexture(c);
}

// Genteng: 4 kolom x 4 baris per tekstur (1 tekstur = 1.2 m x 1.2 m).
// Bagian bawah canvas = v kecil = arah tepi atap (cucuran).
export function roofTexture() {
  const S = 256;
  const n = 4;
  const t = S / n;
  const [c, g] = makeCanvas(S, S);
  const rand = rng(5);
  g.fillStyle = "#3b160d";
  g.fillRect(0, 0, S, S);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = col * t;
      const y = row * t;
      const k = 0.85 + rand() * 0.25;
      g.fillStyle = `rgb(${Math.round(168 * k)},${Math.round(74 * k)},${Math.round(50 * k)})`;
      g.fillRect(x + 1, y, t - 2, t - 3);
      g.fillStyle = "rgba(255,215,180,0.16)";
      g.fillRect(x + t * 0.22, y, t * 0.26, t - 3);
      g.fillStyle = "rgba(60,20,10,0.22)";
      g.fillRect(x + t * 0.68, y, t * 0.22, t - 3);
      g.fillStyle = "rgba(35,10,5,0.6)";
      g.fillRect(x, y + t - 9, t, 9);
      g.fillStyle = "rgba(255,210,170,0.18)";
      g.fillRect(x + 1, y + t - 12, t - 2, 3);
    }
  }
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = rand() < 0.5 ? "rgba(255,230,200,0.07)" : "rgba(30,10,5,0.1)";
    g.fillRect(rand() * S, rand() * S, 1 + rand() * 3, 1 + rand() * 3);
  }
  return toTexture(c);
}

// UV untuk balok kayu: koordinat dunia (meter) dikali skala, dan sumbu
// terpanjang balok selalu menjadi sumbu v supaya serat mengikuti panjang balok.
const AXES = ["x", "y", "z"];
export function applyWoodUV(geo, scale) {
  geo.computeBoundingBox();
  const size = new THREE.Vector3();
  geo.boundingBox.getSize(size);
  const long = AXES.reduce((a, b) => (size[b] > size[a] ? b : a));
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const off = Math.random() * 10; // agar potongan kayu tidak terlihat sama
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const na = AXES.reduce((a, b) => (Math.abs(n[b]) > Math.abs(n[a]) ? b : a));
    const plane = AXES.filter((a) => a !== na);
    let ua;
    let va;
    if (plane.includes(long)) {
      va = long;
      ua = plane.find((a) => a !== long);
    } else {
      [ua, va] = plane;
    }
    uv.setXY(i, p[ua] * scale + off, p[va] * scale + off);
  }
  uv.needsUpdate = true;
}
