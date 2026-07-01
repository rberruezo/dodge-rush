#!/bin/bash
set -e

# android-emulator.sh: Build web, sync to mobile, build APK, and launch in emulator
#
# Requires:
#   - ANDROID_HOME/ANDROID_SDK_ROOT set
#   - AVD named 'dr_arm64' (or edit AVD_NAME below)
#   - Android SDK tools installed
#
# Usage:  npm run android-emulator
#         ./scripts/android-emulator.sh (from project root)

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"
AVD_NAME="${AVD_NAME:-dr_arm64}"
APP_PACKAGE="com.valtech.dodgerush"
APP_ACTIVITY="$APP_PACKAGE/.MainActivity"

# Setup Android environment
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 1. Build web
log_step "Building web app..."
cd "$PROJECT_ROOT"
npm run build
log_success "Web build complete"

# 2. Sync to mobile
log_step "Syncing web build to mobile..."
cd "$MOBILE_DIR"
npm run sync:web
log_success "Web synced"

# 3. Check if emulator is running
log_step "Checking emulator status..."
RUNNING_DEVICES=$(adb devices 2>/dev/null | tail -n +2 | grep -v "^$" | wc -l)

if [ "$RUNNING_DEVICES" -eq 0 ]; then
  log_step "No emulator running. Starting $AVD_NAME..."
  
  # Check if emulator binary exists
  if [ ! -f "$ANDROID_HOME/emulator/emulator" ]; then
    log_error "emulator binary not found at $ANDROID_HOME/emulator/emulator"
    exit 1
  fi
  
  nohup "$ANDROID_HOME/emulator/emulator" -avd "$AVD_NAME" -no-snapshot > /tmp/emulator.log 2>&1 &
  EMULATOR_PID=$!
  log_step "Emulator PID: $EMULATOR_PID"
  
  # Wait for emulator to boot
  log_step "Waiting for emulator to boot (this may take 30-60 seconds)..."
  sleep 10
  
  # Poll for boot completion (max 120 seconds)
  BOOT_TIMEOUT=120
  ELAPSED=0
  while [ $ELAPSED -lt $BOOT_TIMEOUT ]; do
    BOOT_COMPLETE=$(adb shell getprop sys.boot_completed 2>/dev/null || echo "0")
    if [ "$BOOT_COMPLETE" = "1" ]; then
      log_success "Emulator booted"
      break
    fi
    echo -ne "."
    sleep 3
    ELAPSED=$((ELAPSED + 3))
  done
  
  if [ $ELAPSED -ge $BOOT_TIMEOUT ]; then
    log_error "Emulator boot timeout. Check /tmp/emulator.log"
    tail -20 /tmp/emulator.log
    exit 1
  fi
else
  log_success "Emulator already running ($RUNNING_DEVICES device(s))"
fi

# 4. Install and launch using Expo directly
log_step "Setting up Expo environment..."
cd "$MOBILE_DIR"

# Ensure prebuild
if [ ! -d "$MOBILE_DIR/android" ] || [ ! -f "$MOBILE_DIR/android/build.gradle" ]; then
  log_step "Running expo prebuild (first-time setup)..."
  npx expo prebuild --platform android --clean --no-install 2>&1 | grep -vE '(Deprecation|punycode)' || true
fi

log_step "Running Expo build and install..."
echo ""
echo "The app will compile and launch on your emulator."
echo "If you see Metro commands (Press a | open Android), press 'a' to install."
echo ""

# Run expo interactively - will prompt for device selection  
npx expo run:android

if [ $? -eq 0 ]; then
  log_success "App launched successfully!"
else
  log_error "Build/launch failed"
  exit 1
fi

echo ""
log_success "Android emulator setup complete!"
echo -e "${BLUE}Tips:${NC}"
echo "  - View logs:        npm run logcat (in mobile/)"
echo "  - Re-sync web only: cd mobile && npm run sync:web && npx expo run:android --device"
echo "  - Kill emulator:    adb emu kill"
echo "  - Full clean:       rm -rf mobile/android mobile/node_modules && npm run android-emulator"
