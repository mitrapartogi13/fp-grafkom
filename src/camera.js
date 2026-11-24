// Kontrol kamera:
//  - Orbit : memutar kamera mengelilingi target (OrbitControls). Bila kamera
//            dekat target (< 1.6 m), drag = menoleh dan scroll = maju/mundur,
//            sehingga kamera bisa "terbang" masuk ke dalam rumah.
//  - Jalan : first-person (PointerLockControls) dengan WASD dan tabrakan
//            sederhana terhadap dinding, tiang, pagar, dan naik anak tangga.
//  - Preset ruangan dengan animasi transisi, dan tur otomatis (spline).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const EYE = 1.6; // tinggi mata
const RADIUS = 0.28; // radius badan untuk tabrakan
const STEP = 0.45; // tinggi maksimum yang bisa dinaiki
const NEAR = 1.6;
const V = (a) => new THREE.Vector3(...a);

export const PRESETS = [
  { key: "eksterior", label: "Eksterior", pos: [30, 16, 44], look: [0, 3, 2] },
  { key: "gerbang", label: "Gerbang", pos: [0, 1.7, 41], look: [0, 3, 10] },
  { key: "pendopo", label: "Pendopo", pos: [4.2, 2.3, 13.0], look: [-1, 3.2, 6], inside: true },
  { key: "pringgitan", label: "Pringgitan", pos: [5.6, 2.1, 0.4], look: [-6, 1.5, 0.2], inside: true },
  { key: "dalem", label: "Dalem", pos: [0.6, 2.2, -1.5], look: [-0.4, 1.4, -9], inside: true },
  { key: "senthong", label: "Senthong", pos: [0, 2.0, -5.6], look: [0, 1.2, -10.5], inside: true },
  { key: "atas", label: "Atas", pos: [0.01, 60, 8], look: [0, 0, 6] },
];

// Titik-titik tur: [posisi kamera, titik yang dilihat]
const TOUR = [
  [[34, 18, 48], [0, 3, 4]],
  [[12, 6, 44], [0, 3, 8]],
  [[0, 1.8, 42], [0, 3, 10]],
  [[0, 1.8, 30], [0, 3, 8]],
  [[0, 1.9, 19], [0, 3.5, 8]],
  [[0, 2.3, 13], [0, 4.5, 7]],
  [[0, 2.4, 9], [0, 6, 6.5]],
  [[0, 2.3, 4.5], [-3.5, 1.2, 8]],
  [[0, 2.2, 1.0], [0, 2, -3]],
  [[0, 2.2, -1.8], [0, 2.4, -6]],
  [[-1, 2.2, -4.8], [-5, 1.5, -5.5]],
  [[0, 2.0, -7.0], [0, 1.3, -10]],
  [[1, 2.2, -5], [5, 1.5, -4]],
  [[0, 2.3, -1.5], [0, 2.5, 3]],
  [[0, 2.3, 5], [0, 2.5, 14]],
  [[0, 2.2, 16], [-4, 1.5, 26]],
  [[-7, 3.5, 24], [-13, 0, 29]],
  [[26, 14, 36], [0, 3, 2]],
];
const TOUR_SECONDS = 65;

export class CameraRig {
  constructor(camera, dom, colliders, onChange = () => {}) {
    this.camera = camera;
    this.colliders = colliders;
    this.onChange = onChange;
    this.mode = "orbit";
    this.near = null;
    this.tween = null;
    this.tour = null;
    this.feetY = 0;
    this.keys = {};

    this.orbit = new OrbitControls(camera, dom);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.minDistance = 0.5;
    this.orbit.maxDistance = 80;

    this.walk = new PointerLockControls(camera, dom);
    this.walk.addEventListener("lock", () => this.onChange());
    this.walk.addEventListener("unlock", () => this.onChange());
    dom.addEventListener("click", () => {
      if (this.mode === "walk" && !this.walk.isLocked) this.walk.lock();
    });
    dom.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
    addEventListener("keydown", (e) => (this.keys[e.code] = true));
    addEventListener("keyup", (e) => (this.keys[e.code] = false));
    addEventListener("blur", () => (this.keys = {}));

    this.tourPos = new THREE.CatmullRomCurve3(TOUR.map(([p]) => V(p)));
    this.tourLook = new THREE.CatmullRomCurve3(TOUR.map(([, l]) => V(l)));

    this.goTo("eksterior", true);
  }

  get locked() {
    return this.walk.isLocked;
  }

  // ---------- tabrakan (AABB dari mesh yang ditandai "solid") ----------
  blocked(x, z, feet) {
    for (const b of this.colliders) {
      if (b.max.y <= feet + STEP || b.min.y >= feet + EYE + 0.15) continue;
      if (x + RADIUS > b.min.x && x - RADIUS < b.max.x && z + RADIUS > b.min.z && z - RADIUS < b.max.z) return true;
    }
    return false;
  }

  groundAt(x, z, feet) {
    let y = 0;
    for (const b of this.colliders) {
      if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue;
      if (b.max.y <= feet + STEP && b.max.y > y) y = b.max.y;
    }
    return y;
  }

  placeWalker(pos, look) {
    this.feetY = this.groundAt(pos.x, pos.z, pos.y - EYE + 0.3);
    this.camera.position.set(pos.x, this.feetY + EYE, pos.z);
    this.camera.lookAt(look);
  }

  // ---------- preset dan mode ----------
  goTo(key, instant = false) {
    const p = PRESETS.find((q) => q.key === key);
    if (!p) return;
    this.stopTour(false);
    const pos = V(p.pos);
    const look = V(p.look);
    if (this.mode === "walk") {
      const g = PRESETS[1];
      if (pos.y > 4.5) this.placeWalker(V(g.pos), V(g.look));
      else this.placeWalker(pos, look);
      return;
    }
    const target = p.inside ? pos.clone().add(look.clone().sub(pos).normalize()) : look;
    if (instant) {
      this.camera.position.copy(pos);
      this.orbit.target.copy(target);
      this.orbit.update();
    } else {
      this.tween = { p0: this.camera.position.clone(), p1: pos, t0: this.orbit.target.clone(), t1: target, k: 0 };
    }
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.stopTour(false);
    this.tween = null;
    this.mode = mode;
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    if (mode === "walk") {
      this.orbit.enabled = false;
      const p = this.camera.position.clone();
      const g = PRESETS[1];
      if (p.y > 4.5) this.placeWalker(V(g.pos), V(g.look));
      else this.placeWalker(p, p.clone().add(dir));
      this.walk.lock();
    } else {
      this.walk.unlock();
      this.orbit.enabled = true;
      this.orbit.target.copy(this.camera.position).add(dir);
      this.near = null;
    }
    this.onChange();
  }

  startTour() {
    this.tween = null;
    if (this.mode === "walk") {
      this.mode = "orbit";
      this.walk.unlock();
    }
    this.orbit.enabled = false;
    this.tour = { k: 0 };
    this.onChange();
  }

  stopTour(notify = true, finalLook = null) {
    if (!this.tour) return;
    this.tour = null;
    this.orbit.enabled = this.mode === "orbit";
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    this.orbit.target.copy(finalLook ?? this.camera.position.clone().add(dir));
    this.near = null;
    if (notify) this.onChange();
  }

  onWheel(e) {
    if (this.mode !== "orbit" || !this.near || this.tour) return;
    e.preventDefault();
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    const step = -Math.sign(e.deltaY) * 0.7;
    this.camera.position.addScaledVector(dir, step);
    this.orbit.target.addScaledVector(dir, step);
  }

  input() {
    const k = this.keys;
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    const run = k.ShiftLeft || k.ShiftRight;
    return { f, r, run };
  }

  // Vektor gerak horizontal menurut arah pandang kamera.
  moveVector(speed, dt) {
    const { f, r, run } = this.input();
    const fwd = this.camera.getWorldDirection(new THREE.Vector3());
    fwd.y = 0;
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, this.camera.up).normalize();
    const mv = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r);
    if (mv.lengthSq() > 0) mv.normalize().multiplyScalar(speed * (run ? 2.2 : 1) * dt);
    return mv;
  }

  // ---------- update per frame ----------
  update(dt) {
    if (this.tour) return this.updateTour(dt);
    if (this.mode === "walk") return this.updateWalk(dt);
    this.updateOrbit(dt);
  }

  updateTour(dt) {
    this.tour.k += dt / TOUR_SECONDS;
    if (this.tour.k >= 1) {
      this.stopTour(true, V(TOUR.at(-1)[1]));
      return;
    }
    this.camera.position.copy(this.tourPos.getPoint(this.tour.k));
    this.camera.lookAt(this.tourLook.getPoint(this.tour.k));
  }

  updateWalk(dt) {
    if (!this.walk.isLocked) return;
    const p = this.camera.position;
    const mv = this.moveVector(3, dt);
    const stuck = this.blocked(p.x, p.z, this.feetY);
    if (stuck || !this.blocked(p.x + mv.x, p.z, this.feetY)) p.x += mv.x;
    if (stuck || !this.blocked(p.x, p.z + mv.z, this.feetY)) p.z += mv.z;
    p.x = THREE.MathUtils.clamp(p.x, -60, 60);
    p.z = THREE.MathUtils.clamp(p.z, -60, 80);
    const ground = this.groundAt(p.x, p.z, this.feetY);
    this.feetY += (ground - this.feetY) * Math.min(1, dt * 14);
    p.y = this.feetY + EYE;
  }

  updateOrbit(dt) {
    const o = this.orbit;
    if (this.tween) {
      const tw = this.tween;
      tw.k = Math.min(1, tw.k + dt / 1.6);
      const e = tw.k < 0.5 ? 2 * tw.k * tw.k : 1 - (-2 * tw.k + 2) ** 2 / 2; // ease in-out
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      o.target.lerpVectors(tw.t0, tw.t1, e);
      if (tw.k >= 1) this.tween = null;
    } else {
      // WASD = geser kamera dan target bersama-sama
      const mv = this.moveVector(this.near ? 3 : 8, dt);
      this.camera.position.add(mv);
      o.target.add(mv);
    }

    const near = this.camera.position.distanceTo(o.target) < NEAR;
    if (near !== this.near) {
      this.near = near;
      o.rotateSpeed = near ? -0.35 : 0.7; // dekat: drag = menoleh
      o.maxPolarAngle = near ? Math.PI - 0.05 : Math.PI * 0.49;
      o.minPolarAngle = near ? 0.05 : 0;
      o.enableZoom = !near; // dekat: scroll ditangani onWheel (maju/mundur)
      if (near && !this.tween) {
        const dir = this.camera.getWorldDirection(new THREE.Vector3());
        o.target.copy(this.camera.position).add(dir);
      }
      this.onChange();
    }
    o.update();
    if (this.camera.position.y < 0.3) this.camera.position.y = 0.3;
  }
}
