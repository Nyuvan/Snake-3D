import { CONFIG } from '../config';
import { DIR_LIST, OPPOSITE, VECTORS, insideGrid, sameCell } from './directions';
import { spawnEnemy, spawnFood } from './state';
import type { Cell, Dir, EnemySnake, GameEvent, GameState } from './types';

/**
 * A cell the enemy may not enter. Its own tail is excluded because it moves
 * away this tick. The player's body blocks, but the head is the target.
 */
function blockedForEnemy(cell: Cell, enemyCells: Cell[], playerCells: Cell[]): boolean {
  if (!insideGrid(cell)) return true;

  for (let i = 0; i < enemyCells.length - 1; i += 1) {
    if (sameCell(enemyCells[i], cell)) return true;
  }

  for (let i = 1; i < playerCells.length; i += 1) {
    if (sameCell(playerCells[i], cell)) return true;
  }

  return false;
}

/** First step of the shortest path to the player's head, or null. */
function pathStep(enemyCells: Cell[], playerCells: Cell[]): Dir | null {
  const start = enemyCells[0];
  const goal = playerCells[0];
  const width = CONFIG.grid.width;
  const key = (cell: Cell): number => cell.y * width + cell.x;

  const firstStep = new Map<number, Dir>();
  const seen = new Set<number>([key(start)]);
  const queue: Cell[] = [start];
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    const currentKey = key(current);

    for (const dir of DIR_LIST) {
      const v = VECTORS[dir];
      const next = { x: current.x + v.x, y: current.y + v.y };
      if (blockedForEnemy(next, enemyCells, playerCells)) continue;

      const nextKey = key(next);
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);

      const step = currentKey === key(start) ? dir : firstStep.get(currentKey);
      if (!step) continue;
      firstStep.set(nextKey, step);

      if (sameCell(next, goal)) return step;
      queue.push(next);
    }
  }

  return null;
}

/** Fallback: move that gets closest to the player's head. */
function greedyStep(enemyCells: Cell[], playerCells: Cell[]): Dir | null {
  const start = enemyCells[0];
  const goal = playerCells[0];
  let best: Dir | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const dir of DIR_LIST) {
    const v = VECTORS[dir];
    const next = { x: start.x + v.x, y: start.y + v.y };
    if (blockedForEnemy(next, enemyCells, playerCells)) continue;

    const distance = Math.abs(next.x - goal.x) + Math.abs(next.y - goal.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = dir;
    }
  }

  return best;
}

function smashEnemy(enemy: EnemySnake, events: GameEvent[]): EnemySnake {
  events.push({ type: 'enemy-smash', cell: enemy.cells[0] });
  return {
    ...enemy,
    cells: [],
    alive: false,
    respawnIn: CONFIG.enemy.respawnTicks,
    counter: 0,
  };
}

function advanceEnemy(state: GameState, events: GameEvent[]): GameState {
  const enemy = state.enemy;

  if (!enemy.alive) {
    const respawnIn = enemy.respawnIn - 1;
    if (respawnIn > 0) {
      return { ...state, enemy: { ...enemy, respawnIn } };
    }

    const spawn = spawnEnemy(state.snake, state.rng);
    if (spawn.cells.length === 0) {
      return { ...state, rng: spawn.rng, enemy: { ...enemy, respawnIn: 4 } };
    }

    events.push({ type: 'enemy-respawn', cell: spawn.cells[0] });
    return {
      ...state,
      rng: spawn.rng,
      enemy: {
        ...enemy,
        cells: spawn.cells,
        dir: spawn.dir,
        alive: true,
        respawnIn: 0,
        counter: 0,
      },
    };
  }

  const counter = enemy.counter + 1;
  if (counter < enemy.moveEvery) {
    return { ...state, enemy: { ...enemy, counter } };
  }

  const move = pathStep(enemy.cells, state.snake) ?? greedyStep(enemy.cells, state.snake);

  // Nowhere left to go: it smashes itself and respawns later.
  if (!move) {
    return { ...state, enemy: smashEnemy(enemy, events) };
  }

  const head = enemy.cells[0];
  const v = VECTORS[move];
  const nextHead = { x: head.x + v.x, y: head.y + v.y };

  const cells = [nextHead, ...enemy.cells];
  cells.pop();

  const nextEnemy: EnemySnake = { ...enemy, cells, dir: move, counter: 0 };

  // Head-to-head is the only way the rival can kill the player.
  if (sameCell(nextHead, state.snake[0])) {
    return { ...state, phase: 'dead', enemy: nextEnemy };
  }

  return { ...state, enemy: nextEnemy };
}

/**
 * One simulation tick. Pure: takes a state, returns a new one.
 * `turn` is an optional direction from the input queue.
 */
export function step(state: GameState, turn: Dir | null): GameState {
  if (state.phase !== 'playing') return state;

  const events: GameEvent[] = [];

  // --- player ---
  const dir = turn && turn !== OPPOSITE[state.dir] ? turn : state.dir;
  const head = state.snake[0];
  const v = VECTORS[dir];
  const nextHead = { x: head.x + v.x, y: head.y + v.y };

  if (!insideGrid(nextHead)) {
    return { ...state, dir, phase: 'dead', events };
  }

  const eating = sameCell(nextHead, state.food);

  // The tail cell is free this tick unless we are growing into it.
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((cell) => sameCell(cell, nextHead))) {
    return { ...state, dir, phase: 'dead', events };
  }

  const snake = [nextHead, ...state.snake];
  if (!eating) snake.pop();

  let food = state.food;
  let score = state.score;
  let tickMs = state.tickMs;
  let rng = state.rng;
  let won = state.won;

  if (eating) {
    score += 1;
    tickMs = Math.max(CONFIG.minTickMs, tickMs - CONFIG.speedUpPerFood);
    const spawn = spawnFood(snake, rng, state.enemy.cells);
    food = spawn.food;
    rng = spawn.rng;
    won = spawn.full;
  }

  const next: GameState = {
    ...state,
    dir,
    snake,
    food,
    score,
    tickMs,
    rng,
    won,
    events,
  };

  // The player ran head-first into the rival's head.
  if (state.enemy.alive && sameCell(nextHead, state.enemy.cells[0])) {
    return { ...next, phase: 'dead' };
  }

  if (won) return { ...next, phase: 'dead' };

  return advanceEnemy(next, events);
}
