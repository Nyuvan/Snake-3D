export type Cell = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
export type Phase = 'menu' | 'playing' | 'paused' | 'dead';

export interface EnemySnake {
  /** Head is index 0. Empty while the enemy is down. */
  cells: Cell[];
  dir: Dir;
  alive: boolean;
  /** Player ticks left until respawn while dead. */
  respawnIn: number;
  /** Player ticks since the enemy last moved. */
  counter: number;
  /** Player ticks per enemy move. */
  moveEvery: number;
}

export type GameEvent =
  | { type: 'enemy-smash'; cell: Cell }
  | { type: 'enemy-respawn'; cell: Cell };

export interface GameState {
  phase: Phase;
  /** Head is index 0. */
  snake: Cell[];
  dir: Dir;
  food: Cell;
  score: number;
  /** Current milliseconds per tick. */
  tickMs: number;
  /** Seeded RNG state, so runs are reproducible. */
  rng: number;
  won: boolean;
  enemy: EnemySnake;
  /** Produced by the last step, consumed by the view. */
  events: GameEvent[];
}
