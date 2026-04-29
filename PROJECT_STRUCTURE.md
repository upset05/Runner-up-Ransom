# LockIn — Project Structure

## Init the project
```bash
npx react-native init LockIn --template react-native-template-typescript
cd LockIn
```

## Install dependencies
```bash
npm install @react-native-community/geolocation
npm install @react-native-async-storage/async-storage
npm install react-native-mmkv
npm install react-native-foreground-service
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler
npm install react-native-reanimated
npm install date-fns
```

## Folder Structure
```
LockIn/
├── android/
│   └── app/src/main/java/com/lockin/
│       ├── MainActivity.kt
│       ├── MainApplication.kt
│       ├── accessibility/
│       │   └── LockInAccessibilityService.kt       ← THE BLOCKER
│       ├── modules/
│       │   ├── BlockerModule.kt                    ← RN Bridge
│       │   └── BlockerPackage.kt
│       └── overlay/
│           └── OverlayManager.kt                   ← Lock screen overlay
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CreateGoalScreen.tsx
│   │   ├── ActiveGoalScreen.tsx
│   │   └── LockScreen.tsx
│   ├── components/
│   │   ├── GoalCard.tsx
│   │   ├── ProgressRing.tsx
│   │   └── GoalTypeSelector.tsx
│   ├── services/
│   │   ├── GoalTracker.ts
│   │   ├── GPSService.ts
│   │   └── BlockerService.ts                       ← JS side of bridge
│   ├── store/
│   │   └── GoalStore.ts                            ← MMKV state
│   └── types/
│       └── index.ts
```

## Required Android Permissions (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
    tools:ignore="ProtectedPermissions" />
```
