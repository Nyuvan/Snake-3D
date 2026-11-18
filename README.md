# Snake 3D

A 3D snake game built with **Three.js + TypeScript + Vite**.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). It opens automatically.

```bash
npm run build      # type-check + static build into dist/
npm run preview    # serve the production build
npm run typecheck  # types only
```

## Controls

| Input | Action |
| --- | --- |
| Arrows / WASD | Steer |
| Space | Pause / resume |
| R | Restart |
| Enter | Start / play again |
| Swipe | Steer (touch) |
| Tap | Start / play again |

## The rival snake

A second, red snake hunts you.

- It moves every `2` of your ticks (half your speed) and pathfinds toward your
  head with BFS, routing around walls and both bodies.
- **It can only kill you head-to-head.** Its body is harmless to you, and yours
  is harmless to it.
- **Corner it** so it has no legal move and it smashes itself, then respawns a
  few seconds later at least 7 cells away from your head. That is your window to
  eat safely.
- Cornering it with *your head* next to its head is a bad idea — that is still a
  head-on collision.

The HUD shows `Rival: Hunting` while it is on the board and `Down` while it is
respawning.

## Folder map

```
Snake-3D/                    <- project root
├─ index.html                # page shell + HUD markup
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ public/                   # served at "/", never imported
│  ├─ models/                # .glb / .gltf
│  ├─ textures/              # .png / .jpg / .ktx2
│  └─ audio/                 # .mp3 / .ogg
└─ src/
   ├─ main.ts                # wires everything together, owns app state
   ├─ style.css
   ├─ config.ts              # grid size, tick speed, camera, colours
   ├─ core/                  # engine plumbing, no game rules
   │  ├─ loop.ts             # fixed-timestep loop + render alpha
   │  ├─ input.ts            # keyboard / swipe -> turn + action events
   │  └─ rng.ts              # seeded mulberry32
   ├─ game/                  # PURE simulation. Never imports three.js.
   │  ├─ types.ts            # Cell, Dir, Phase, GameState, EnemySnake
   │  ├─ directions.ts       # vectors, opposites, grid helpers
   │  ├─ state.ts            # createState(), spawnFood(), spawnEnemy()
   │  └─ step.ts             # step(state, turn) -> next state (+ rival AI)
   ├─ view/                  # everything that touches Three.js
   │  ├─ scene.ts            # renderer, ortho camera, lights, resize, shake
   │  ├─ coords.ts           # grid cell -> world position
   │  ├─ board.ts            # slab, checker floor, glowing walls
   │  ├─ snake.ts            # segment meshes + interpolation + eyes
   │  ├─ food.ts             # bobbing icosahedron + point light
   │  ├─ effects.ts          # pooled particle bursts
   │  └─ hud.ts              # score / overlay (DOM, not WebGL)
   └─ audio/
      └─ sfx.ts              # WebAudio blips, no asset files needed
```

## The rule that keeps it flexible

```
game/  -> imports nothing
core/  -> imports nothing
view/  -> imports game/ + three
main   -> imports everything
```

`game/` is plain data and math. You can unit-test a collision without a browser,
replay a run from its seed, and swap the renderer later without touching the
rules. If `import * as THREE` ever appears in `game/`, something went wrong.

## How it works

- **Grid, not physics.** The snake is a list of `{x, y}` cells. 3D only affects
  how those cells are drawn (`x`, `y` -> `x`, `z`).
- **Fixed timestep.** `core/loop.ts` ticks the simulation at `state.tickMs`
  regardless of framerate; rendering interpolates between the previous and
  current cell with `alpha`, so movement looks smooth instead of teleporting.
- **Turn queue.** Turns are queued (max 2) and validated in `step`, so pressing
  two keys quickly cannot make the snake reverse into itself.
- **Rival AI.** `game/step.ts` runs a breadth-first search from the rival's head
  to yours, treating walls and both bodies as obstacles (its own tail is
  excluded since it moves away). If no path exists it falls back to the move
  that reduces distance; if no move exists at all it is cornered and smashes.
- **Orthographic camera** at 45 degrees. Arrow keys line up with the screen, and
  the grid stays readable while still showing 3D depth via lighting and shadows.

## Tweaking

Everything is in `src/config.ts`:

- `grid.width` / `grid.height` — board size
- `tickMs` / `minTickMs` / `speedUpPerFood` — difficulty curve
- `enemy.length` / `enemy.moveEvery` — rival size and speed (2 = half speed)
- `enemy.respawnTicks` / `enemy.minSpawnDistance` — respawn delay and distance
- `camera.viewSize` — zoom
- `COLORS` / `SNAKE_PALETTES` — snake, rival, food, walls

To change the snake's look, edit `src/view/snake.ts`. To change the rules, edit
`src/game/step.ts` only.
