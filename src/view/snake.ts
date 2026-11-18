import * as THREE from 'three';
import type { Cell, Dir } from '../game/types';
import { cellToWorld } from './coords';

const SIZE = 0.84;

const ROTATION: Record<Dir, number> = {
  right: 0,
  left: Math.PI,
  down: -Math.PI / 2,
  up: Math.PI / 2,
};

export interface SnakePalette {
  hueStart: number;
  hueEnd: number;
  saturation: number;
  lightStart: number;
  lightEnd: number;
  headGlow: number;
}

export class SnakeView {
  readonly group = new THREE.Group();

  private readonly geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  private readonly segments: THREE.Mesh[] = [];
  private readonly materials: THREE.MeshStandardMaterial[] = [];
  private readonly tmp = new THREE.Vector3();

  // Shared, created once: resetting the game must not leak these.
  private readonly eyeGeometry = new THREE.SphereGeometry(0.095, 12, 12);
  private readonly pupilGeometry = new THREE.SphereGeometry(0.048, 8, 8);
  private readonly eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  private readonly pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x04101a,
    roughness: 0.35,
  });

  constructor(private readonly palette: SnakePalette) {}

  private createEyes(): THREE.Group {
    const eyes = new THREE.Group();

    for (const z of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(this.eyeGeometry, this.eyeMaterial);
      eye.position.set(SIZE / 2 - 0.02, 0.14, z);

      const pupil = new THREE.Mesh(this.pupilGeometry, this.pupilMaterial);
      pupil.position.set(0.075, 0, 0);
      eye.add(pupil);

      eyes.add(eye);
    }

    return eyes;
  }

  private addSegment(index: number): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.32,
      metalness: 0.35,
      emissive: 0xffffff,
      emissiveIntensity: 0.18,
    });

    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (index === 0) mesh.add(this.createEyes());

    this.materials.push(material);
    this.segments.push(mesh);
    this.group.add(mesh);
  }

  /**
   * @param cells current cells (head first)
   * @param prev  cells from the previous visual step, same indexing
   * @param alpha 0..1 through the current step, for smooth motion
   */
  sync(cells: Cell[], prev: Cell[], alpha: number, dir: Dir): void {
    while (this.segments.length < cells.length) {
      this.addSegment(this.segments.length);
    }
    while (this.segments.length > cells.length) {
      const mesh = this.segments.pop();
      if (mesh) this.group.remove(mesh);
      this.materials.pop()?.dispose();
    }

    const n = cells.length;
    const lastPrev = prev[prev.length - 1];

    for (let i = 0; i < n; i += 1) {
      const to = cells[i];
      const from = prev[i] ?? lastPrev ?? to;

      const x = from.x + (to.x - from.x) * alpha;
      const y = from.y + (to.y - from.y) * alpha;

      cellToWorld(x, y, this.tmp);

      const mesh = this.segments[i];
      const t = n > 1 ? i / (n - 1) : 0;
      const scale = i === 0 ? 1.04 : Math.max(0.62, 1 - t * 0.32);

      mesh.position.set(this.tmp.x, (SIZE * scale) / 2 + 0.004, this.tmp.z);
      mesh.scale.setScalar(scale);

      const material = this.materials[i];
      material.color.setHSL(
        THREE.MathUtils.lerp(this.palette.hueStart, this.palette.hueEnd, t),
        this.palette.saturation,
        THREE.MathUtils.lerp(this.palette.lightStart, this.palette.lightEnd, t),
      );
      material.emissive.copy(material.color);
      material.emissiveIntensity = i === 0 ? this.palette.headGlow : 0.16;
    }

    if (this.segments[0]) this.segments[0].rotation.y = ROTATION[dir];
  }

  clear(): void {
    for (const mesh of this.segments) this.group.remove(mesh);
    for (const material of this.materials) material.dispose();
    this.segments.length = 0;
    this.materials.length = 0;
  }
}
