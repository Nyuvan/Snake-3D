import * as THREE from 'three';
import { COLORS } from '../config';
import type { Cell } from '../game/types';
import { cellToWorld } from './coords';

export class FoodView {
  readonly group = new THREE.Group();

  private readonly mesh: THREE.Mesh;
  private readonly light: THREE.PointLight;
  private readonly target = new THREE.Vector3();
  private time = 0;

  constructor() {
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.food,
      emissive: COLORS.food,
      emissiveIntensity: 1.5,
      roughness: 0.25,
      metalness: 0.35,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), material);
    this.mesh.castShadow = true;
    this.mesh.position.y = 0.55;
    this.group.add(this.mesh);

    this.light = new THREE.PointLight(COLORS.food, 9, 6, 2);
    this.light.position.y = 0.7;
    this.group.add(this.light);
  }

  setCell(cell: Cell): void {
    cellToWorld(cell.x, cell.y, this.target);
    this.group.position.copy(this.target);
  }

  update(dtMs: number): void {
    this.time += dtMs / 1000;
    this.mesh.rotation.y += dtMs * 0.0016;
    this.mesh.rotation.x += dtMs * 0.0007;
    this.mesh.position.y = 0.55 + Math.sin(this.time * 3) * 0.08;
    this.light.intensity = 8 + Math.sin(this.time * 4) * 2;
  }
}
