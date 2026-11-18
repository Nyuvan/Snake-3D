import { CONFIG } from '../config';
import { nextRandom } from '../core/rng';
import { DIR_LIST, VECTORS, insideGrid } from './directions';
import type { Cell, Dir, GameState } from './types';

export interface Spawn {
  food: Cell;
  rng: number;
  full: boolean;
}

/** Pick a random free cell. Builds the free list once instead of retry-looping. */
export function spawnFood(snake: Cell[], seed: number, blocked: Cell[] = []): Spawn {
  const { width, height } = CONFIG.grid;
  const occupied = new Set<number>();
  for (const c of snake) occupied.add(c.y * width + c.x);
  for (const c of blocked) occupied.add(c.y * width + c.x);

  const free: Cell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!occupied.has(y * width + x)) free.push({ x, y });
    }
  }

  if (free.length === 0) return { food: { x: 0, y: 0 }, rng: seed, full: true };

  const r = nextRandom(seed);
  const food = free[Math.floor(r.value * free.length)];
  return { food, rng: r.seed, full: false };
}

export interface EnemySpawn {
  cells: Cell[];
  dir: Dir;
  rng: number;
}

/**
 * Place the enemy head at least `minSpawnDistance` from the player's head,
 * with a body that fits on free cells. Returns an empty body if the board
 * is too crowded (it will retry on a later tick).
 */
export function spawnEnemy(player: Cell[], seed: number): EnemySpawn {
  const { width, height } = CONFIG.grid;
  const occupied = new Set<number>();
  for (const c of player) occupied.add(c.y * width + c.x);

  const playerHead = player[0];
  const free: Cell[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (occupied.has(y * width + x)) continue;
      const distance = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
      if (distance >= CONFIG.enemy.minSpawnDistance) free.push({ x, y });
    }
  }

  // Crowded board: fall back to anywhere free.
  if (free.length === 0) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!occupied.has(y * width + x)) free.push({ x, y });
      }
    }
  }

  let rng = seed;

  for (let attempt = 0; attempt < 80 && free.length > 0; attempt += 1) {
    const pick = nextRandom(rng);
    rng = pick.seed;
    const index = Math.floor(pick.value * free.length);
    const candidate = free[index];

    const spin = nextRandom(rng);
    rng = spin.seed;
    const offset = Math.floor(spin.value * DIR_LIST.length);

    for (let k = 0; k < DIR_LIST.length; k += 1) {
      const dir = DIR_LIST[(offset + k) % DIR_LIST.length];
      const v = VECTORS[dir];
      const cells: Cell[] = [candidate];
      let fits = true;

      for (let i = 1; i < CONFIG.enemy.length; i += 1) {
        const cell = { x: candidate.x - v.x * i, y: candidate.y - v.y * i };
        if (!insideGrid(cell) || occupied.has(cell.y * width + cell.x)) {
          fits = false;
          break;
        }
        cells.push(cell);
      }

      if (fits) return { cells, dir, rng };
    }

    free.splice(index, 1);
  }

  return { cells: [], dir: 'left', rng };
}

export function createState(seed = (Math.random() * 0xffffffff) | 0): GameState {
  const { width, height } = CONFIG.grid;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  const snake: Cell[] = [];
  for (let i = 0; i < CONFIG.startLength; i += 1) {
    snake.push({ x: cx - i, y: cy });
  }

  const enemySpawn = spawnEnemy(snake, seed);
  const enemy = {
    cells: enemySpawn.cells,
    dir: enemySpawn.dir,
    alive: enemySpawn.cells.length > 0,
    respawnIn: enemySpawn.cells.length > 0 ? 0 : CONFIG.enemy.respawnTicks,
    counter: 0,
    moveEvery: CONFIG.enemy.moveEvery,
  };

  const spawn = spawnFood(snake, enemySpawn.rng, enemy.cells);

  return {
    phase: 'menu',
    snake,
    dir: 'right',
    food: spawn.food,
    score: 0,
    tickMs: CONFIG.tickMs,
    rng: spawn.rng,
    won: false,
    enemy,
    events: [],
  };
}
