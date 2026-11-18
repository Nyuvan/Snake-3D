import type { Dir } from '../game/types';

export type Action = 'pause' | 'restart' | 'confirm';

export interface InputHandlers {
  turn(dir: Dir): void;
  action(action: Action): void;
}

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export function createInput(handlers: InputHandlers): () => void {
  let sx = 0;
  let sy = 0;
  let tracking = false;

  function onKey(e: KeyboardEvent): void {
    const dir = KEYS[e.key];
    if (dir) {
      e.preventDefault();
      handlers.turn(dir);
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      handlers.action('pause');
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      handlers.action('restart');
      return;
    }
    if (e.key === 'Enter') {
      handlers.action('confirm');
    }
  }

  function onPointerDown(e: PointerEvent): void {
    tracking = true;
    sx = e.clientX;
    sy = e.clientY;
  }

  function onPointerUp(e: PointerEvent): void {
    if (!tracking) return;
    tracking = false;

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;

    // Tap = confirm (start / restart / resume).
    if (Math.hypot(dx, dy) < 24) {
      handlers.action('confirm');
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      handlers.turn(dx > 0 ? 'right' : 'left');
    } else {
      handlers.turn(dy > 0 ? 'down' : 'up');
    }
  }

  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
  };
}
