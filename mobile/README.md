# Dodge Rush — Android app (Expo + WebView)

Phase 2 of the roadmap: ship the existing Phaser web game as a native Android
app, **offline**, with zero gameplay rewrite.

## How it works

```
dodge-rush/            ← the Phaser + Vite web game (the actual game)
└─ mobile/             ← this Expo app: a native shell around the web build
   ├─ App.tsx          ← full-screen WebView, portrait lock, back→pause, keep-awake
   ├─ plugins/withWebAssets.js   ← copies ./web into android assets at prebuild
   ├─ scripts/sync-web.mjs       ← copies ../dist → ./web
   └─ web/             ← (generated) the synced web build, bundled into the APK
```

The game is loaded from `file:///android_asset/web/index.html`. The build uses
relative paths (`base: './'` in `vite.config.ts`), so every JS chunk and asset
resolves correctly with no server and **no internet**. `localStorage` (coins,
skins, daily streak, high score) persists in the WebView's app storage.

## Prerequisites (on your machine — NOT this sandbox)

- **Node 18+** and npm (the sandbox here is Node 10/16 — too old; run locally).
- **JDK 17** + **Android Studio** (SDK + an emulator or a USB device) for local runs.
- An **Expo account** (`npx expo login`) for cloud builds (EAS). No Mac needed for Android.

## First-time setup

```bash
# 1) Web game deps + build (in the repo root)
cd dodge-rush
npm install
npm run build            # -> dist/  (relative-path, offline-ready bundle)

# 2) Mobile app deps
cd mobile
npm install
npx expo install         # aligns native module versions to the Expo SDK

# 3) App icons: add assets/icon.png, adaptive-icon.png, splash.png (see assets/README.md)
```

## Build → APK (one-liner para testing en device)

**Siempre usá este comando completo desde la raíz del repo.** Saltearte cualquier paso es la causa #1 de tener una versión vieja en el device.

```bash
# Desde dodge-rush/ (raíz del proyecto)
source ~/.nvm/nvm.sh && nvm use 22.9.0 && \
  npm run build && \
  cd mobile && npm run sync:web && \
  export ANDROID_HOME=~/Library/Android/sdk && \
  cd android && ./gradlew assembleRelease && \
  cp app/build/outputs/apk/release/app-release.apk ~/Desktop/dodge-rush.apk && \
  echo "✓ APK listo en ~/Desktop/dodge-rush.apk"
```

### Por qué cada paso importa

| Paso | Qué hace | Qué pasa si lo salteás |
|------|----------|------------------------|
| `npm run build` | Compila TypeScript + Vite → `dist/` | El APK trae el juego viejo |
| `npm run sync:web` | Copia `dist/` → `mobile/web/` y `android/assets/web/` | Idem — Gradle no sabe que cambió |
| `./gradlew assembleRelease` | Empaqueta todo en el APK | — |
| `cp ... ~/Desktop` | Deja el APK accesible | Tener que buscarlo en `build/outputs/...` |

> ⚠️ **Gotcha (learned the hard way):** la web build se copia a los assets nativos
> **únicamente** a través de `sync:web` o de `expo prebuild`. Un `gradlew assembleRelease`
> solo **NO** re-sincroniza el juego — empaqueta lo que haya en `android/assets/web/`
> en ese momento. Si no corriste `sync:web` primero, el device va a tener una versión vieja.

> ⚠️ **Debug APKs no corren standalone:** los debug builds esperan el servidor Metro.
> Para un APK sideloadable y offline usá siempre **release** (`assembleRelease`).

## Cómo verificar qué versión tiene el device

La versión está impresa en la esquina inferior derecha del menú principal (`v1.0.0 build N`).
Si no coincide con lo que está en `package.json` → `version`, el device tiene una versión vieja.

```bash
# Ver versión actual del código fuente
grep '"version"' package.json              # semver humano
grep 'BUILD_NUMBER' src/config/Constants.ts  # build number mostrado en el juego

# Confirmar que dist/ es reciente (fecha del index.html)
ls -lh dist/index.html
```

## Build → run loop (local device/emulator)

## Store build (Google Play)

```bash
cd mobile
npm run sync:web                    # ensure web/ is current
eas build -p android --profile production   # cloud build -> .aab (App Bundle)
eas submit -p android                       # upload to Play Console
```

Play Console steps: create the app → **Internal testing** track first →
**Closed** → **Open** → **Production** (Google requires a testing phase before
production). Fill the **Data safety** form and **content rating** questionnaire.

## ⚠️ Target = kids / families — compliance (do before any ads, Phase 4)

This shapes Play Console config and the (future) ad integration. Verify against
the **official Google Play Families policy** — do not treat this list as final:

- Join **Designed for Families**; set the target age group accordingly.
- Ads must be **non-personalized / contextual only**, via a **Families-certified
  ads SDK**, with the format/placement limits the policy requires.
- **Parental gate** in front of any purchase / external link.
- **Data safety**: collect the minimum; declare it honestly.
- The app currently requests **no permissions** (`android.permissions: []`) and
  needs no network when offline — keep it that way for the cleanest review.
- `com.valtech.dodgerush` is a placeholder package id — confirm the real org id.

## Known limitations / follow-ups

- **Music** plays via HTML5 `<audio>` (not Web Audio): the Android WebView can't
  decode MP3 through `decodeAudioData`, so `SoundManager` uses `<audio>` for the
  two tracks (SFX stay on Web Audio). Tradeoff: the loop uses `audio.loop` (a
  tiny seam at the loop point) instead of the old buffer cross-dissolve. To
  restore seamless looping, alternate two `<audio>` elements with a volume fade.
- **Fonts**: the web build links Google Fonts (Press Start 2P / VT323). Offline
  they fall back to monospace — playable but less crisp. To fix: self-host the
  two `woff2` files and add a local `@font-face` in `index.html` (no CDN).
- **Haptics**: easiest path is web-side `navigator.vibrate(...)` on crash/combo
  (works in Android WebView) — no native bridge needed. Add in the game, not here.
- **iOS**: this scaffold targets Android. iOS needs the build copied into the
  bundle resources and `source` pointed there; revisit when iOS is in scope.
- **Rewarded ads** (`Rewarded.ts` in the web game) are still a stub. Wire a
  Families-certified network in Phase 4 behind that same interface.

## Version bump protocol (GME-016)

The in-game version stamp (bottom-right of the main menu) reads `vX.Y.Z (build N)`.
**Before every QA or release build, bump all three in lockstep so QA always knows
exactly what they're testing:**

1. **`package.json`** → `version` (semver, e.g. `1.0.0` → `1.0.1`). This is what
   the web build shows (injected via `vite.config.ts` `define` →
   `import.meta.env.VITE_APP_VERSION`).
2. **`mobile/app.json`** → `expo.android.versionCode` (integer, **always
   increasing**: `1` → `2`). Google Play rejects a re-used versionCode.
3. **`src/config/Constants.ts`** → `BUILD_NUMBER` (the `(build N)` shown in-game).
   Keep it equal to the `versionCode` above.

Keep `version` in `package.json` and `mobile/app.json` in sync too (both are the
human-readable semver). After bumping, rebuild the web bundle and re-sync before
packaging the APK.

## Verification status

Authored as a scaffold; **not built/run in the dev sandbox** (Node too old, and
EAS builds in the cloud with your credentials). The web build is confirmed
offline-ready (relative paths in `dist/index.html`, assets load by relative
path). Run the steps above locally to produce and test the APK.
