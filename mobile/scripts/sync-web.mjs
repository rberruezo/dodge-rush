// Copy the Phaser web build (../dist) into ./web so it ships in the APK.
//
// IMPORTANT: the web build is bundled into Android assets in two ways:
//   1. `expo prebuild` runs the withWebAssets plugin, which copies ./web into
//      android/app/src/main/assets/web (used on a clean prebuild).
//   2. For iterative rebuilds WITHOUT re-running prebuild, this script also
//      copies straight into android/app/src/main/assets/web when that native
//      project already exists — otherwise `gradlew assembleRelease` would keep
//      packaging a STALE web bundle (the cause of the "fixes never took effect"
//      bug: only prebuild copied, so plain rebuilds shipped the old game).
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
const androidAssetsWeb = join(mobileRoot, 'android', 'app', 'src', 'main', 'assets', 'web');

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

// Keep the native assets in lockstep so a plain `assembleRelease` ships the
// current build (no full `expo prebuild` needed for web-only changes).
if (existsSync(join(mobileRoot, 'android'))) {
  rmSync(androidAssetsWeb, { recursive: true, force: true });
  cpSync(distDir, androidAssetsWeb, { recursive: true });
  console.log(`  -> ${androidAssetsWeb}`);
}
console.log(`Next:  npm run android   (or)   eas build -p android`);
