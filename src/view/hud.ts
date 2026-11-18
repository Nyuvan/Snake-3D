import { CONFIG } from '../config';
import type { GameState } from '../game/types';

function must(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

export class Hud {
  private readonly scoreEl = must('score');
  private readonly lengthEl = must('length');
  private readonly bestEl = must('best');
  private readonly rivalEl = must('rival');
  private readonly overlay = must('overlay');
  private readonly titleEl = must('overlay-title');
  private readonly textEl = must('overlay-text');
  private readonly hintEl = must('overlay-hint');

  private bestValue = Number(localStorage.getItem(CONFIG.bestKey) ?? 0) || 0;

  constructor() {
    this.bestEl.textContent = String(this.bestValue);
  }

  recordBest(score: number): void {
    if (score <= this.bestValue) return;
    this.bestValue = score;
    localStorage.setItem(CONFIG.bestKey, String(score));
    this.bestEl.textContent = String(score);
  }

  sync(state: GameState): void {
    this.scoreEl.textContent = String(state.score);
    this.lengthEl.textContent = String(state.snake.length);
    this.rivalEl.textContent = state.enemy.alive ? 'Hunting' : 'Down';
    this.rivalEl.style.color = state.enemy.alive ? '#ff8a6b' : '#7f9dc9';

    if (state.phase === 'playing') {
      this.overlay.classList.add('hidden');
      return;
    }

    this.overlay.classList.remove('hidden');

    if (state.phase === 'menu') {
      this.titleEl.textContent = 'SNAKE 3D';
      this.textEl.textContent = "Arrows / WASD — don't let the red snake hit your head";
      this.hintEl.textContent = 'Press Enter to start';
    } else if (state.phase === 'paused') {
      this.titleEl.textContent = 'PAUSED';
      this.textEl.textContent = 'Take a breath';
      this.hintEl.textContent = 'Press Space to resume';
    } else {
      this.titleEl.textContent = state.won ? 'YOU WIN' : 'GAME OVER';
      this.textEl.textContent = `Score ${state.score} · Length ${state.snake.length}`;
      this.hintEl.textContent = 'Press R or Enter to play again';
    }
  }
}
