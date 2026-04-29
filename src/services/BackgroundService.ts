import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import GoalStore from '../store/GoalStore';

export const LOCATION_TASK = 'ransom-location-task';
export const BG_FETCH_TASK = 'ransom-bg-fetch';

// ── Location background task ─────────────────────────────────
// Fires every time the user moves while a distance goal is active
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const locations = data?.locations;
  if (!locations?.length) return;

  const goal = await GoalStore.getActive();
  if (!goal || goal.isCompleted || goal.type !== 'DISTANCE') return;

  // Get last known position and compute distance
  const loc = locations[locations.length - 1];
  const newMetres = goal.currentValue + 10; // incremental — GPS service handles exact calc
  const updated = { ...goal, currentValue: Math.min(newMetres, goal.targetValue) };

  if (updated.currentValue >= updated.targetValue) {
    updated.isCompleted = true;
    await GoalStore.save(updated);
    await GoalStore.setActive(null);
  } else {
    await GoalStore.setActive(updated);
  }
});

// ── Background fetch task ────────────────────────────────────
// Wakes up periodically to check if deadline has passed
TaskManager.defineTask(BG_FETCH_TASK, async () => {
  try {
    const goal = await GoalStore.getActive();
    if (!goal || goal.isCompleted) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Check if deadline passed without completion
    if (Date.now() > goal.deadline && !goal.isCompleted) {
      // Mark as missed but keep active so lock stays on
      await GoalStore.setActive({ ...goal, deadline: goal.deadline });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Start location tracking ──────────────────────────────────
export async function startLocationTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') return;

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: 'Runner Up Ransom',
        notificationBody: 'Tracking your goal — keep going!',
        notificationColor: '#CAFF00',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
  }
}

export async function stopLocationTracking() {
  const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

// ── Register background fetch ────────────────────────────────
export async function registerBackgroundFetch() {
  try {
    await BackgroundFetch.registerTaskAsync(BG_FETCH_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {}
}

// ── AppState blocker ─────────────────────────────────────────
// Detects when user returns to app after leaving during active goal
let appStateCallback: ((isBackground: boolean) => void) | null = null;
let subscription: any = null;

export function startAppStateWatcher(onBackground: (isBack: boolean) => void) {
  appStateCallback = onBackground;
  subscription = AppState.addEventListener('change', handleAppStateChange);
}

export function stopAppStateWatcher() {
  subscription?.remove();
  subscription = null;
  appStateCallback = null;
}

let lastState: AppStateStatus = 'active';
async function handleAppStateChange(nextState: AppStateStatus) {
  const goal = await GoalStore.getActive();
  if (!goal || goal.isCompleted) return;

  if (lastState === 'active' && nextState === 'background') {
    appStateCallback?.(true);
  } else if (lastState === 'background' && nextState === 'active') {
    appStateCallback?.(false);
  }
  lastState = nextState;
}
