type Wave = OscillatorType;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(
  frequency: number,
  duration: number,
  type: Wave,
  gain = 0.06,
  slideTo?: number,
): void {
  const ac = getContext();
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const envelope = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(envelope).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export const sfx = {
  /** Call from a user gesture so the browser lets audio play. */
  unlock(): void {
    getContext();
  },
  start(): void {
    tone(440, 0.12, 'triangle', 0.05, 660);
  },
  eat(): void {
    tone(660, 0.09, 'square', 0.045, 990);
  },
  turn(): void {
    tone(320, 0.03, 'sine', 0.02);
  },
  die(): void {
    tone(220, 0.5, 'sawtooth', 0.07, 60);
  },
  enemyDown(): void {
    tone(300, 0.32, 'sawtooth', 0.06, 90);
  },
  enemySpawn(): void {
    tone(140, 0.18, 'triangle', 0.05, 280);
  },
};
