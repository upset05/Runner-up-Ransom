# LockIn

> Your phone, held hostage. Complete your goal. Earn it back.

LockIn blocks all non-essential apps on your Android phone until you complete
a goal you set — a walk, a focus session, or a checklist. No goal, no phone.

---

## Stack

- React Native (bare workflow, TypeScript)
- Kotlin — Accessibility Service + Native Module bridge
- React Navigation
- AsyncStorage — goal history
- react-native-svg — progress ring
- react-native-geolocation — GPS distance tracking

---

## Prerequisites

- Node 18+
- JDK 17
- Android Studio (for SDK & emulator, but use a real device for testing)
- A physical Android device (API 26+ recommended) with USB debugging enabled
- React Native CLI: `npm install -g react-native-cli`

---

## Setup from scratch

### 1. Init the project

```bash
npx react-native init LockIn --template react-native-template-typescript
cd LockIn
```

### 2. Run the setup script

Extract the downloaded LockIn files somewhere, then:

```bash
bash setup.sh /path/to/downloaded/LockIn-files
```

This copies all Kotlin and TypeScript files to the right locations,
installs npm dependencies, and replaces AndroidManifest.xml.

### 3. Add drawable XML files (manual)

Open `android/res/drawable/DRAWABLES.xml` and create 5 separate files
in `android/app/src/main/res/drawable/`:

| Filename               | What it styles                    |
|------------------------|-----------------------------------|
| `bg_lock_icon.xml`     | Dark red rounded square behind 🔒 |
| `bg_goal_card.xml`     | Goal info card on lock screen     |
| `bg_progress_track.xml`| Progress bar track background     |
| `bg_btn_unlock.xml`    | "Open LockIn App" button border   |
| `ic_lock.xml`          | Lock padlock vector icon          |

Each block in `DRAWABLES.xml` is labelled with its filename.

### 4. Add IBM Plex Mono font

1. Download from [fonts.google.com/specimen/IBM+Plex+Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
2. Copy these two files:
   - `IBMPlexMono-Regular.ttf`
   - `IBMPlexMono-Bold.ttf`
3. Place them in: `android/app/src/main/assets/fonts/`
4. Run: `npx react-native-asset`

### 5. Connect device and run

```bash
# Make sure your device is connected with USB debugging on
adb devices   # should list your device

npx react-native run-android
```

---

## First launch flow

1. **Onboarding** — 3-step walkthrough
2. **Accessibility permission** — Settings > Accessibility > LockIn > Enable
3. **Overlay permission** — Settings > Apps > LockIn > Display over other apps > Enable
4. **Home screen** — set your first goal

---

## Project structure

```
LockIn/
├── App.tsx                              ← Root navigator + first-launch logic
├── setup.sh                             ← Automated file placement script
├── react-native.config.js              ← Font asset linking
│
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx        ← Permission walkthrough
│   │   ├── HomeScreen.tsx              ← Goal history + new goal CTA
│   │   ├── CreateGoalScreen.tsx        ← Goal type, target, deadline
│   │   └── ActiveGoalScreen.tsx        ← Live progress ring
│   ├── services/
│   │   ├── BlockerService.ts           ← JS bridge to Kotlin
│   │   ├── GPSService.ts               ← Real-time distance tracking
│   │   └── FocusTimerService.ts        ← Focus session timer
│   ├── store/
│   │   └── GoalStore.ts                ← AsyncStorage goal persistence
│   └── types/
│       └── index.ts                    ← Types, templates, formatters
│
└── android/app/src/main/java/com/lockin/
    ├── MainApplication.kt              ← Registers BlockerPackage
    ├── BootReceiver.kt                 ← Restores goal state after reboot
    ├── accessibility/
    │   └── LockInAccessibilityService.kt  ← THE BLOCKER
    ├── modules/
    │   ├── BlockerModule.kt            ← RN bridge (startGoal, updateProgress...)
    │   └── BlockerPackage.kt           ← Registers module with RN
    └── store/
        └── GoalStateManager.kt         ← Shared state (JS thread ↔ Service)
```

---

## How the blocker works

```
User opens Instagram
       ↓
LockInAccessibilityService fires (TYPE_WINDOW_STATE_CHANGED)
       ↓
Checks GoalStateManager.getActiveGoal()
       ↓
Goal active + not complete?
       ↓
Shows overlay_lock_screen.xml on top (TYPE_ACCESSIBILITY_OVERLAY)
       ↓
User sees lock screen — can only open LockIn
       ↓
User completes goal → BlockerService.updateProgress() → COMPLETED
       ↓
GoalStateManager.clearActiveGoal() → overlay dismissed
```

---

## How goal state survives everything

| Event              | How state persists                                        |
|--------------------|-----------------------------------------------------------|
| App goes background| GoalStateManager writes to SharedPreferences on every update |
| Phone reboots      | BootReceiver fires → loadFromPrefs() warms the cache      |
| RN JS thread crash | Kotlin native layer reads directly from SharedPreferences |
| User force-kills app| SharedPreferences survive, Accessibility Service still runs|

---

## Goal types

| Type         | Unit     | Native unit   | Tracking method           |
|--------------|----------|---------------|---------------------------|
| `DISTANCE`   | km       | metres        | GPS (Haversine formula)   |
| `FOCUS_TIME` | minutes  | seconds       | JS interval → native sync |
| `CHECKLIST`  | tasks    | task count    | Manual tap confirmation   |

---

## Known limitations

- iOS not supported — Apple's sandboxing prevents true app blocking
- GPS accuracy depends on device hardware and environment
- Accessibility Service can be disabled from Settings (no true bypass prevention — this is by design; Android doesn't allow full kiosk without MDM)
- Background GPS drains battery — expected for distance goals

---

## License

MIT
