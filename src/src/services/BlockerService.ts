import { NativeModules, NativeEventEmitter } from 'react-native';

const { BlockerModule } = NativeModules;

export type GoalType = 'DISTANCE' | 'FOCUS_TIME' | 'CHECKLIST';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;   // metres | seconds | task count
  currentValue?: number;
  deadline: number;      // Unix ms
  tasksTotal?: number;
  tasksCompleted?: number;
  isCompleted?: boolean;
}

export type ProgressResult = 'IN_PROGRESS' | 'COMPLETED';

/**
 * BlockerService
 * 
 * The TypeScript wrapper around the Kotlin BlockerModule.
 * Import this anywhere in your RN app — never call NativeModules directly.
 */
const BlockerService = {

  /**
   * Start a goal session — activates the blocker system-wide.
   * Call this when the user taps "Start Goal".
   */
  startGoal: async (goal: Goal): Promise<boolean> => {
    return BlockerModule.startGoal(goal);
  },

  /**
   * Push a progress update.
   * - For DISTANCE: pass metres covered so far
   * - For FOCUS_TIME: pass seconds elapsed so far
   * Call this on a polling interval from your tracker service.
   */
  updateProgress: async (value: number): Promise<ProgressResult> => {
    return BlockerModule.updateProgress(value);
  },

  /**
   * Mark one checklist task complete.
   * Returns COMPLETED when all tasks are done.
   */
  completeTask: async (): Promise<ProgressResult> => {
    return BlockerModule.completeTask();
  },

  /**
   * Force-end the goal (user gives up, or goal expired).
   */
  completeGoal: async (): Promise<boolean> => {
    return BlockerModule.completeGoal();
  },

  /**
   * Get the current active goal state.
   * Returns null if no goal is active.
   */
  getActiveGoal: async (): Promise<Goal | null> => {
    return BlockerModule.getActiveGoal();
  },

  /**
   * Check if the Accessibility Service is enabled.
   * If false, guide the user to enable it before starting any goal.
   */
  isAccessibilityEnabled: async (): Promise<boolean> => {
    return BlockerModule.isAccessibilityEnabled();
  },

  /**
   * Open Android Accessibility Settings.
   * The user has to manually toggle our service — Android requires this.
   */
  openAccessibilitySettings: async (): Promise<boolean> => {
    return BlockerModule.openAccessibilitySettings();
  },

  /**
   * Check SYSTEM_ALERT_WINDOW permission (needed to show the overlay).
   */
  canDrawOverlays: async (): Promise<boolean> => {
    return BlockerModule.canDrawOverlays();
  },

  /**
   * Open overlay permission screen.
   */
  openOverlaySettings: async (): Promise<boolean> => {
    return BlockerModule.openOverlaySettings();
  },

  /**
   * Full permission check — returns what's missing.
   * Run this on app launch and block goal creation until all clear.
   */
  checkPermissions: async (): Promise<{
    accessibility: boolean;
    overlay: boolean;
    allGranted: boolean;
  }> => {
    const [accessibility, overlay] = await Promise.all([
      BlockerService.isAccessibilityEnabled(),
      BlockerService.canDrawOverlays(),
    ]);
    return {
      accessibility,
      overlay,
      allGranted: accessibility && overlay,
    };
  },
};

export default BlockerService;
