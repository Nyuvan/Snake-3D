import * as THREE from 'three';
import { CONFIG } from '../config';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  render(dtMs: number): void;
  shake(intensity: number, durationMs: number): void;
  dispose(): void;
}

export function createScene(container: HTMLElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b14);

  const { viewSize, position } = CONFIG.camera;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(0, 0, 0);
  const home = camera.position.clone();

  scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x120a22, 1.1));

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(14, 26, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -18;
  key.shadow.camera.right = 18;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 90;
  key.shadow.bias = -0.0006;
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x4d7bff, 1.3);
  rim.position.set(-16, 10, -14);
  scene.add(rim);

  function resize(): void {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const aspect = w / h;

    let halfH = viewSize / 2;
    let halfW = halfH * aspect;
    if (aspect < 1) {
      halfW = viewSize / 2;
      halfH = halfW / aspect;
    }

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let shakeLeft = 0;
  let shakeDuration = 1;
  let shakeMagnitude = 0;

  function shake(intensity: number, durationMs: number): void {
    shakeMagnitude = intensity;
    shakeDuration = durationMs;
    shakeLeft = durationMs;
  }

  function render(dtMs: number): void {
    if (shakeLeft > 0) {
      shakeLeft = Math.max(0, shakeLeft - dtMs);
      const k = shakeLeft / shakeDuration;
      const m = shakeMagnitude * k * k;
      camera.position.set(
        home.x + (Math.random() - 0.5) * m,
        home.y + (Math.random() - 0.5) * m,
        home.z + (Math.random() - 0.5) * m,
      );
    } else {
      camera.position.copy(home);
    }
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  return {
    renderer,
    scene,
    camera,
    render,
    shake,
    dispose() {
      observer.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
