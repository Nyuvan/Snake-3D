export interface Loop {
  start(): void;
  stop(): void;
}

export interface LoopOptions {
  /** Called a fixed number of times per second, independent of framerate. */
  tick: () => void;
  /** Called once per animation frame. `alpha` is 0..1 through the current tick. */
  render: (alpha: number, dtMs: number) => void;
  /** Read every frame so speed changes take effect immediately. */
  tickMs: () => number;
}

const MAX_DT = 250;

export function createLoop(opts: LoopOptions): Loop {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  function frame(now: number): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    if (last === 0) last = now;
    const dt = Math.min(now - last, MAX_DT);
    last = now;
    acc += dt;

    const stepMs = Math.max(16, opts.tickMs());

    // Cap catch-up so a background tab cannot spiral into hundreds of ticks.
    let guard = 0;
    while (acc >= stepMs && guard < 4) {
      opts.tick();
      acc -= stepMs;
      guard += 1;
    }
    if (acc > stepMs) acc = 0;

    opts.render(Math.min(acc / stepMs, 1), dt);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
