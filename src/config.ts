export const CONFIG = {
  grid: { width: 20, height: 20 },
  startLength: 4,
  /** Milliseconds per game tick at the start. */
  tickMs: 135,
  /** Fastest the snake can get. */
  minTickMs: 72,
  /** How much faster each food makes the snake. */
  speedUpPerFood: 3,
  bestKey: 'snake3d.best',
  camera: {
    /** Orthographic height in world units. */
    viewSize: 22.5,
    position: { x: 0, y: 30, z: 30 },
  },
  enemy: {
    length: 4,
    /** Player ticks per enemy move. 2 = half speed. */
    moveEvery: 2,
    /** Player ticks the enemy stays down after being cornered. */
    respawnTicks: 12,
    /** Minimum Manhattan distance from the player's head when spawning. */
    minSpawnDistance: 7,
  },
} as const;

export const COLORS = {
  bodyStart: 0x35d6ff,
  bodyEnd: 0x2b6bff,
  food: 0xffb347,
  wall: 0x16233d,
  wallGlow: 0x2f6bff,
} as const;

export const SNAKE_PALETTES = {
  player: {
    hueStart: 0.48,
    hueEnd: 0.62,
    saturation: 0.85,
    lightStart: 0.66,
    lightEnd: 0.44,
    headGlow: 0.5,
  },
  enemy: {
    hueStart: 0.01,
    hueEnd: 0.09,
    saturation: 0.92,
    lightStart: 0.58,
    lightEnd: 0.36,
    headGlow: 0.85,
  },
} as const;
