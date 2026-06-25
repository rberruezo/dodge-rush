// Copy the Phaser web build (../dist) into ./web so the Expo config plugin can
// bundle it into the Android APK as offline assets.
//
// Usage (from mobile/):  npm run sync:web
// Prereq: build the web app first in the parent project:  (cd .. && npm run build)
import { existsSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mobileRoot = join(here, '..');
const distDir = join(mobileRoot, '..', 'dist');
const webDir = join(mobileRoot, 'web');

if (!existsSync(distDir)) {
  console.error(
    `\n✗ No web build found at ${distDir}\n` +
      `  Build it first:  (cd .. && npm run build)\n`
  );
  process.exit(1);
}

rmSync(webDir, { recursive: true, force: true });
cpSync(distDir, webDir, { recursive: true });
console.log(`✓ Synced web build:\n  ${distDir}\n  -> ${webDir}`);
console.log(`Next:  npm run android   (or)   eas build -p android`);
