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

## Build → run loop (local device/emulator)

```bash
cd dodge-rush && npm run build      # rebuild the game whenever web code changes
cd mobile && npm run sync:web       # copy dist -> mobile/web
npm run android                     # expo prebuild (copies web into assets) + run
```

> Re-run all three after any change to the web game. The `withWebAssets` plugin
> re-copies `web/` into the native assets on every `prebuild`.

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

- **Fonts**: the web build links Google Fonts (Press Start 2P / VT323). Offline
  they fall back to monospace — playable but less crisp. To fix: self-host the
  two `woff2` files and add a local `@font-face` in `index.html` (no CDN).
- **Haptics**: easiest path is web-side `navigator.vibrate(...)` on crash/combo
  (works in Android WebView) — no native bridge needed. Add in the game, not here.
- **iOS**: this scaffold targets Android. iOS needs the build copied into the
  bundle resources and `source` pointed there; revisit when iOS is in scope.
- **Rewarded ads** (`Rewarded.ts` in the web game) are still a stub. Wire a
  Families-certified network in Phase 4 behind that same interface.

## Verification status

Authored as a scaffold; **not built/run in the dev sandbox** (Node too old, and
EAS builds in the cloud with your credentials). The web build is confirmed
offline-ready (relative paths in `dist/index.html`, assets load by relative
path). Run the steps above locally to produce and test the APK.
