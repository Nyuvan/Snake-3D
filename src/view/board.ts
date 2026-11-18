import * as THREE from 'three';
import { COLORS, CONFIG } from '../config';

function checkerTexture(width: number, height: number): THREE.CanvasTexture {
  const px = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width * px;
  canvas.height = height * px;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#0b1425' : '#0e1a2e';
      ctx.fillRect(x * px, y * px, px, px);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createBoard(): THREE.Group {
  const group = new THREE.Group();
  const { width, height } = CONFIG.grid;

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1.4, 0.9, height + 1.4),
    new THREE.MeshStandardMaterial({ color: 0x081020, roughness: 0.85, metalness: 0.3 }),
  );
  slab.position.y = -0.47;
  slab.receiveShadow = true;
  group.add(slab);

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: checkerTexture(width, height),
      roughness: 0.92,
      metalness: 0.08,
    }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.005;
  top.receiveShadow = true;
  group.add(top);

  const wallHeight = 0.72;
  const wallThickness = 0.5;

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.wall,
    roughness: 0.35,
    metalness: 0.7,
    emissive: 0x0a1c3d,
    emissiveIntensity: 1,
  });

  const capMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.wallGlow,
    emissive: COLORS.wallGlow,
    emissiveIntensity: 1.6,
    roughness: 0.3,
    metalness: 0.2,
  });

  function wall(w: number, d: number, x: number, z: number): void {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, wallHeight, d),
      wallMaterial,
    );
    mesh.position.set(x, wallHeight / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), capMaterial);
    cap.position.set(x, wallHeight + 0.02, z);
    group.add(cap);
  }

  const halfW = width / 2;
  const halfH = height / 2;
  const offset = wallThickness / 2;

  wall(width + wallThickness * 2, wallThickness, 0, -(halfH + offset));
  wall(width + wallThickness * 2, wallThickness, 0, halfH + offset);
  wall(wallThickness, height + wallThickness * 2, -(halfW + offset), 0);
  wall(wallThickness, height + wallThickness * 2, halfW + offset, 0);

  return group;
}
