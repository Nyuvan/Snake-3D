import './style.css';

import { sfx } from './audio/sfx';
import { SNAKE_PALETTES } from './config';
import { createInput } from './core/input';
import { createLoop } from './core/loop';
import { OPPOSITE } from './game/directions';
import { createState } from './game/state';
import { step } from './game/step';
import type { Cell, Dir, GameState } from './game/types';
import { createBoard } from './view/board';
import { Effects } from './view/effects';
import { FoodView } from './view/food';
import { Hud } from './view/hud';
import { createScene } from './view/scene';
import { SnakeView } from './view/snake';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

const ctx = createScene(app);
ctx.scene.add(createBoard());

const playerView = new SnakeView(SNAKE_PALETTES.player);
const enemyView = new SnakeView(SNAKE_PALETTES.enemy);
const foodView = new FoodView();
const effects = new Effects();
const hud = new Hud();

ctx.scene.add(playerView.group, enemyView.group, foodView.group, effects.group);

let state: GameState = createState();
let prevSnake: Cell[] = state.snake.map((c) => ({ ...c }));
let turnQueue: Dir[] = [];

// The rival only moves every N player ticks, so its slide is interpolated
// across the whole gap instead of finishing in one tick.
let enemyFrom: Cell[] = [];
let enemyTo: Cell[] = state.enemy.cells;
let enemyProgress = 1;

foodView.setCell(state.food);
hud.sync(state);

function reset(phase: GameState['phase']): void {
  state = { ...createState(), phase };
  prevSnake = state.snake.map((c) => ({ ...c }));
  turnQueue = [];
  enemyFrom = [];
  enemyTo = state.enemy.cells;
  enemyProgress = 1;
  foodView.setCell(state.food);
  effects.clear();
  playerView.clear();
  enemyView.clear();
  hud.sync(state);
}

function start(): void {
  state = { ...state, phase: 'playing' };
  sfx.unlock();
  sfx.start();
  hud.sync(state);
}

function pause(): void {
  if (state.phase !== 'playing') return;
  state = { ...state, phase: 'paused' };
  prevSnake = state.snake.map((c) => ({ ...c }));
  enemyProgress = 1;
  hud.sync(state);
}

function pushTurn(dir: Dir): void {
  sfx.unlock();
  if (state.phase === 'menu') start();
  if (state.phase !== 'playing') return;

  const last = turnQueue.length > 0 ? turnQueue[turnQueue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return;
  if (turnQueue.length < 2) turnQueue.push(dir);
}

function onAction(action: 'pause' | 'restart' | 'confirm'): void {
  sfx.unlock();

  if (action === 'pause') {
    if (state.phase === 'playing') pause();
    else if (state.phase === 'paused') state = { ...state, phase: 'playing' };
  } else if (action === 'restart') {
    reset('playing');
    sfx.start();
  } else if (state.phase === 'menu') {
    start();
  } else if (state.phase === 'dead') {
    reset('playing');
    sfx.start();
  } else if (state.phase === 'paused') {
    state = { ...state, phase: 'playing' };
  }

  hud.sync(state);
}

function tick(): void {
  if (state.phase !== 'playing') return;

  prevSnake = state.snake.map((c) => ({ ...c }));
  const turn = turnQueue.shift() ?? null;
  const next = step(state, turn);

  if (next.enemy.cells !== state.enemy.cells) {
    enemyFrom = enemyTo;
    enemyTo = next.enemy.cells;
    enemyProgress = 0;
  }

  for (const event of next.events) {
    if (event.type === 'enemy-smash') {
      effects.burst(event.cell, 0xff4d3d, 26);
      ctx.shake(0.35, 160);
      sfx.enemyDown();
    } else {
      effects.burst(event.cell, 0xff9a3d, 16);
      sfx.enemySpawn();
    }
  }

  if (next.phase === 'dead') {
    effects.burst(state.snake[0], 0xff3b6b, 28);
    ctx.shake(0.6, 280);
    sfx.die();
    hud.recordBest(state.score);
  }

  if (next.score > state.score) {
    effects.burst(state.food, 0xffc447, 20);
    sfx.eat();
  }

  state = next;
  foodView.setCell(state.food);
  hud.sync(state);
}

const loop = createLoop({
  tick,
  tickMs: () => state.tickMs,
  render: (alpha, dt) => {
    // Only interpolate while the sim is running; otherwise freeze on the
    // current cell so pausing does not make the snakes jitter.
    const a = state.phase === 'playing' ? alpha : 1;
    playerView.sync(state.snake, prevSnake, a, state.dir);

    if (state.phase === 'playing') {
      const span = Math.max(1, state.enemy.moveEvery * state.tickMs);
      enemyProgress = Math.min(1, enemyProgress + dt / span);
    } else {
      enemyProgress = 1;
    }
    enemyView.sync(enemyTo, enemyFrom, enemyProgress, state.enemy.dir);

    foodView.update(dt);
    effects.update(dt);
    ctx.render(dt);
  },
});

createInput({ turn: pushTurn, action: onAction });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});

loop.start();
