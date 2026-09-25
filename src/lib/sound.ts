/**
 * Tiny WebAudio blips — no audio files, so nothing to load or license.
 * Every call is wrapped defensively: browsers can refuse AudioContext
 * before a user gesture, and some environments have no audio at all.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.08): void {
  const audioCtx = getContext();
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {
    // ignore — sound is a nice-to-have
  }
}

export function playCallSound(): void {
  blip(880, 140, 'triangle');
}

export function playWinSound(): void {
  blip(660, 120, 'square', 0.07);
  setTimeout(() => blip(880, 120, 'square', 0.07), 130);
  setTimeout(() => blip(1100, 220, 'square', 0.07), 260);
}

export function playClickSound(): void {
  blip(440, 60, 'sine', 0.05);
}
