import * as THREE from 'three';
import type { Cell } from '../game/types';
import { cellToWorld } from './coords';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const LIFE_MS = 650;

export class Effects {
  readonly group = new THREE.Group();

  private readonly geometry = new THREE.SphereGeometry(0.075, 8, 8);
  private readonly particles: Particle[] = [];
  private readonly tmp = new THREE.Vector3();

  burst(cell: Cell, color: number, count = 22): void {
    cellToWorld(cell.x, cell.y, this.tmp);

    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.position.set(this.tmp.x, 0.5, this.tmp.z);
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3.5;

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          2 + Math.random() * 3,
          Math.sin(angle) * speed,
        ),
        life: LIFE_MS,
        maxLife: LIFE_MS,
      });
    }
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dtMs;

      p.velocity.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      if (p.mesh.position.y < 0.06) {
        p.mesh.position.y = 0.06;
        p.velocity.y *= -0.4;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }

      const k = Math.max(p.life / p.maxLife, 0);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = k;
      p.mesh.scale.setScalar(0.4 + k * 0.9);

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.group.remove(p.mesh);
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.particles.length = 0;
  }
}
