import { describe, it, expect } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Loop-hygiene guard for the music assets. A looping track must not have edge
 * silence (gap on the seam) nor a fade-out (volume dip every loop). We decode
 * the real files with ffmpeg and measure. Skipped where ffmpeg is unavailable.
 */
const SR = 44100;
const SILENCE = 0.01;
const MAX_EDGE_SILENCE_MS = 30; // trimmed assets start/end on content
const MIN_FADE_RATIO = 0.6; // last-1s vs first-1s RMS; < this == a fade-out

const hasFfmpeg = (() => {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const assetsDir = fileURLToPath(new URL('../../public/assets/', import.meta.url));

function decodeMono(file: string): Float32Array {
  const buf = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', `${assetsDir}${file}`, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
    { maxBuffer: 256 * 1024 * 1024 }
  );
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
}

function rms(a: Float32Array, i: number, j: number): number {
  i = Math.max(0, i);
  j = Math.min(a.length, j);
  let s = 0;
  for (let k = i; k < j; k++) s += a[k] * a[k];
  return j > i ? Math.sqrt(s / (j - i)) : 0;
}
function leadingSilenceMs(a: Float32Array): number {
  for (let k = 0; k < a.length; k++) if (Math.abs(a[k]) > SILENCE) return (k / SR) * 1000;
  return (a.length / SR) * 1000;
}
function trailingSilenceMs(a: Float32Array): number {
  for (let k = a.length - 1; k >= 0; k--)
    if (Math.abs(a[k]) > SILENCE) return ((a.length - 1 - k) / SR) * 1000;
  return (a.length / SR) * 1000;
}

const TRACKS = ['menu', 'bgmusic'];
const FORMATS = ['ogg', 'mp3'];

describe.skipIf(!hasFfmpeg)('Music assets — loop hygiene', () => {
  for (const track of TRACKS) {
    for (const fmt of FORMATS) {
      const file = `${track}.${fmt}`;
      it(`${file}: no edge silence and no fade-out at the loop seam`, () => {
        const a = decodeMono(file);
        expect(a.length, `${file} decoded empty`).toBeGreaterThan(SR); // > 1s

        const lead = leadingSilenceMs(a);
        const trail = trailingSilenceMs(a);
        const fadeRatio = rms(a, a.length - SR, a.length) / (rms(a, 0, SR) || 1e-9);

        expect(lead, `${file} leading silence ${lead.toFixed(1)}ms`).toBeLessThan(MAX_EDGE_SILENCE_MS);
        expect(trail, `${file} trailing silence ${trail.toFixed(1)}ms`).toBeLessThan(
          MAX_EDGE_SILENCE_MS
        );
        expect(fadeRatio, `${file} fades out (ratio ${fadeRatio.toFixed(2)})`).toBeGreaterThanOrEqual(
          MIN_FADE_RATIO
        );
      });
    }
  }
});
