const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin: copy the offline web build (`mobile/web`) into the native
 * Android assets so the WebView can load it from `file:///android_asset/web/`.
 *
 * Runs during `expo prebuild`. Re-run `npm run sync:web` first whenever the web
 * build changes, then `expo prebuild --clean` (or `expo run:android`).
 */

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.name === '.DS_Store') continue;
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

module.exports = function withWebAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const webSrc = path.join(projectRoot, 'web');
      const assetsDest = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets',
        'web'
      );

      if (!fs.existsSync(webSrc)) {
        throw new Error(
          `[withWebAssets] Missing web build at "${webSrc}".\n` +
            `Run the web build then "npm run sync:web" before prebuilding.`
        );
      }

      fs.rmSync(assetsDest, { recursive: true, force: true });
      copyDir(webSrc, assetsDest);
      // eslint-disable-next-line no-console
      console.log(`[withWebAssets] Copied web build -> ${assetsDest}`);
      return cfg;
    }
  ]);
};
