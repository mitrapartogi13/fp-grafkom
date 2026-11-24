import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class ComponentPreview {
  constructor(section) {
    this.viewport = section.querySelector("#component-viewport");
    this.title = section.querySelector("#component-title");
    this.instanceSelect = section.querySelector("#component-instance");
    this.visibility = section.querySelector("#component-visible");
    this.fields = section.querySelectorAll("[data-transform]");
    this.models = new Map();
    this.model = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x242522);
    this.scene.add(new THREE.HemisphereLight(0xffedda, 0x969dae, 1.55));
    const key = new THREE.DirectionalLight(0xffe6c6, 2.1);
    key.position.set(5, 7, 6);
    const rim = new THREE.DirectionalLight(0xcad9ff, 1.3);
    rim.position.set(-4, 2, -5);
    this.scene.add(key, rim);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 200);
    this.camera.position.set(1, 0.65, 1.6);
    this.controls = new OrbitControls(this.camera, this.viewport);
    this.controls.enableDamping = true;

    this.instanceSelect.addEventListener("change", () => {
      this.model.selectedIndex = this.instanceSelect.selectedIndex;
      this.syncFields();
    });
    this.visibility.addEventListener("change", () => {
      this.selected.visible = this.visibility.checked;
    });
    for (const input of this.fields) {
      input.addEventListener("input", () => this.updateTransform(input));
      input.addEventListener("change", () => this.syncFields());
    }
    section.querySelector("#duplicate-component").addEventListener("click", () => this.duplicate());
    section.querySelector("#frame-components").addEventListener("click", () => this.frame());
  }

  get selected() {
    return this.model.group.children[this.model.selectedIndex];
  }

  show(component) {
    let model = this.models.get(component.id);
    if (!model) {
      const group = new THREE.Group();
      group.add(component.create());
      model = { group, selectedIndex: 0 };
      this.models.set(component.id, model);
    }
    if (this.model !== model) {
      this.model?.group.removeFromParent();
      this.model = model;
      this.scene.add(model.group);
      this.title.textContent = component.label;
      this.syncInstances();
    }
    this.frame();
  }

  syncInstances() {
    const options = this.model.group.children.map((_, index) =>
      new Option(index === 0 ? "Asli" : `Salinan ${index}`, String(index)),
    );
    this.instanceSelect.replaceChildren(...options);
    this.instanceSelect.selectedIndex = this.model.selectedIndex;
    this.syncFields();
  }

  syncFields() {
    this.visibility.checked = this.selected.visible;
    for (const input of this.fields) {
      const { transform, axis } = input.dataset;
      let value = this.selected[transform][axis];
      if (transform === "rotation") value = THREE.MathUtils.radToDeg(value);
      input.value = Number(value.toFixed(3));
    }
  }

  updateTransform(input) {
    const value = input.valueAsNumber;
    if (!Number.isFinite(value) || !input.validity.valid) return;
    const { transform, axis } = input.dataset;
    if (transform === "scale") this.selected.scale.setScalar(value);
    else if (transform === "rotation") this.selected.rotation[axis] = THREE.MathUtils.degToRad(value);
    else this.selected.position[axis] = value;
  }

  duplicate() {
    const { group } = this.model;
    const source = this.selected;
    const copy = source.clone();

    // Pisahkan duplikat dari batas geometri semua instance yang sudah ada.
    const all = new THREE.Box3().setFromObject(group, true);
    const bounds = new THREE.Box3().setFromObject(source, true);
    const gap = bounds.getSize(new THREE.Vector3()).length() * 0.12;
    copy.position.x += all.max.x - bounds.min.x + gap;
    group.add(copy);
    this.model.selectedIndex = group.children.length - 1;
    this.syncInstances();
    this.frame();
  }

  frame() {
    const box = new THREE.Box3();
    for (const object of this.model.group.children) {
      if (object.visible) box.expandByObject(object, true);
    }
    if (box.isEmpty()) box.setFromObject(this.selected, true);
    const { center, radius } = box.getBoundingSphere(new THREE.Sphere());

    // Pakai sudut pandang yang lebih sempit agar model juga muat di layar potret.
    const vertical = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * this.camera.aspect);
    const distance = radius * 1.13 / Math.sin(Math.min(vertical, horizontal));
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();

    this.camera.near = Math.max(0.001, radius / 150);
    this.camera.far = Math.max(100, distance * 8 + radius);
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = Math.max(this.camera.near * 2, radius * 0.08);
    this.controls.maxDistance = distance * 8;
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.controls.update();
  }
}
