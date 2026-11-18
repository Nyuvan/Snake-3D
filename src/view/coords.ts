import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * Grid cell -> world position on the board plane.
 * Grid y grows "down screen", which is +z in world space.
 */
export function cellToWorld(x: number, y: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(
    x - (CONFIG.grid.width - 1) / 2,
    0,
    y - (CONFIG.grid.height - 1) / 2,
  );
}
