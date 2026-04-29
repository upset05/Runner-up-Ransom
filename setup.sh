#!/bin/bash
# =============================================================
#  LockIn — Project Setup Script
#  Run this from the ROOT of your React Native project after:
#    npx react-native init LockIn --template react-native-template-typescript
#  
#  Usage:
#    cd LockIn
#    bash setup.sh /path/to/downloaded/LockIn-files
# =============================================================

set -e  # stop on any error

SOURCE="${1:-.}"   # first arg = where you extracted the downloaded files
                   # defaults to current dir if not provided

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo "=============================="
echo "  LockIn Setup"
echo "=============================="
echo ""

# ── Verify we're inside a React Native project ──────────────
[ -f "package.json" ] || fail "Run this from inside your LockIn RN project root."
[ -d "android" ]      || fail "No android/ folder found. Run npx react-native init first."

PKG="com/lockin"
JAVA_ROOT="android/app/src/main/java/$PKG"

# ── Create Kotlin directory structure ────────────────────────
echo "Creating Kotlin directories..."
mkdir -p "$JAVA_ROOT/accessibility"
mkdir -p "$JAVA_ROOT/modules"
mkdir -p "$JAVA_ROOT/store"
log "Kotlin directories created"

# ── Copy Kotlin source files ─────────────────────────────────
echo ""
echo "Copying Kotlin files..."

cp "$SOURCE/android/LockInAccessibilityService.kt" \
   "$JAVA_ROOT/accessibility/LockInAccessibilityService.kt"
log "LockInAccessibilityService.kt → accessibility/"

cp "$SOURCE/android/BlockerModule.kt"   "$JAVA_ROOT/modules/BlockerModule.kt"
cp "$SOURCE/android/BlockerPackage.kt"  "$JAVA_ROOT/modules/BlockerPackage.kt"
log "BlockerModule.kt + BlockerPackage.kt → modules/"

cp "$SOURCE/android/GoalStateManager.kt" "$JAVA_ROOT/store/GoalStateManager.kt"
log "GoalStateManager.kt → store/"

cp "$SOURCE/android/BootReceiver.kt"    "$JAVA_ROOT/BootReceiver.kt"
cp "$SOURCE/android/MainApplication.kt" "$JAVA_ROOT/MainApplication.kt"
log "BootReceiver.kt + MainApplication.kt → $PKG/"

# ── Android resource files ───────────────────────────────────
echo ""
echo "Copying Android resources..."

RES="android/app/src/main/res"
XML_DIR="$RES/xml"
LAYOUT_DIR="$RES/layout"
DRAWABLE_DIR="$RES/drawable"
VALUES_DIR="$RES/values"

mkdir -p "$XML_DIR" "$LAYOUT_DIR" "$DRAWABLE_DIR" "$VALUES_DIR"

cp "$SOURCE/android/accessibility_service_config.xml" \
   "$XML_DIR/accessibility_service_config.xml"
log "accessibility_service_config.xml → res/xml/"

cp "$SOURCE/android/res/layout/overlay_lock_screen.xml" \
   "$LAYOUT_DIR/overlay_lock_screen.xml"
log "overlay_lock_screen.xml → res/layout/"

cp "$SOURCE/android/res/values/strings.xml" \
   "$VALUES_DIR/strings.xml"
log "strings.xml → res/values/"

# Drawables — split DRAWABLES.xml into individual files
echo ""
warn "Drawable files need to be created manually from android/res/drawable/DRAWABLES.xml"
warn "Create these 5 files in android/app/src/main/res/drawable/:"
warn "  bg_lock_icon.xml"
warn "  bg_goal_card.xml"
warn "  bg_progress_track.xml"
warn "  bg_btn_unlock.xml"
warn "  ic_lock.xml"
warn "Each block in DRAWABLES.xml is labelled with its filename."

# ── Manifest ─────────────────────────────────────────────────
echo ""
echo "Backing up and replacing AndroidManifest.xml..."
MANIFEST="android/app/src/main/AndroidManifest.xml"
cp "$MANIFEST" "${MANIFEST}.backup"
cp "$SOURCE/android/AndroidManifest.xml" "$MANIFEST"
log "AndroidManifest.xml replaced (backup saved as .backup)"

# ── TypeScript source files ──────────────────────────────────
echo ""
echo "Copying TypeScript source files..."

mkdir -p src/screens src/services src/store src/types

cp "$SOURCE/src/screens/HomeScreen.tsx"       src/screens/HomeScreen.tsx
cp "$SOURCE/src/screens/CreateGoalScreen.tsx" src/screens/CreateGoalScreen.tsx
cp "$SOURCE/src/screens/ActiveGoalScreen.tsx" src/screens/ActiveGoalScreen.tsx
cp "$SOURCE/src/screens/OnboardingScreen.tsx" src/screens/OnboardingScreen.tsx
log "4 screens copied → src/screens/"

cp "$SOURCE/src/services/BlockerService.ts"   src/services/BlockerService.ts
cp "$SOURCE/src/services/GPSService.ts"       src/services/GPSService.ts
cp "$SOURCE/src/services/FocusTimerService.ts" src/services/FocusTimerService.ts
log "3 services copied → src/services/"

cp "$SOURCE/src/store/GoalStore.ts"           src/store/GoalStore.ts
log "GoalStore.ts → src/store/"

cp "$SOURCE/src/types/index.ts"               src/types/index.ts
log "types/index.ts → src/types/"

cp "$SOURCE/App.tsx" App.tsx
log "App.tsx replaced"

# ── Install npm dependencies ─────────────────────────────────
echo ""
echo "Installing npm dependencies..."
npm install \
  @react-native-community/geolocation \
  @react-native-async-storage/async-storage \
  react-native-mmkv \
  @react-navigation/native \
  @react-navigation/stack \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-svg \
  date-fns \
  uuid \
  @types/uuid
log "npm packages installed"

# ── Font setup reminder ──────────────────────────────────────
echo ""
warn "FONT — IBM Plex Mono (manual step):"
warn "  1. Download from fonts.google.com/specimen/IBM+Plex+Mono"
warn "  2. Copy IBMPlexMono-Regular.ttf and IBMPlexMono-Bold.ttf"
warn "     to android/app/src/main/assets/fonts/"
warn "  3. Add to react-native.config.js:"
warn '     module.exports = { assets: ["./assets/fonts/"] };'
warn "  4. Run: npx react-native-asset"

# ── Pod install reminder ─────────────────────────────────────
echo ""
warn "If targeting iOS (optional): cd ios && pod install && cd .."

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "=============================="
echo -e "${GREEN}  Setup complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "  1. Manually create the 5 drawable XML files (see warning above)"
echo "  2. Add the IBM Plex Mono font files"
echo "  3. Connect a real Android device (USB debugging on)"
echo "  4. Run: npx react-native run-android"
echo ""
echo "First launch will show the Onboarding screen."
echo "Enable Accessibility + Overlay permissions and you're live."
echo ""
