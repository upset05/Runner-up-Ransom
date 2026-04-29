export type GoalType = 'DISTANCE' | 'FOCUS_TIME' | 'CHECKLIST';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;      // metres | seconds | task count
  currentValue: number;
  deadline: number;         // Unix timestamp ms
  tasksTotal: number;
  tasksCompleted: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface GoalTemplate {
  label: string;
  type: GoalType;
  icon: string;
  defaultTarget: number;
  unit: string;
  description: string;
}

// Pre-built goal templates shown in the creation screen
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    label: 'Walk',
    type: 'DISTANCE',
    icon: '🚶',
    defaultTarget: 2000,    // 2km in metres
    unit: 'km',
    description: 'Walk a distance before your phone unlocks',
  },
  {
    label: 'Run',
    type: 'DISTANCE',
    icon: '🏃',
    defaultTarget: 5000,    // 5km
    unit: 'km',
    description: 'Run a distance to earn your screen time',
  },
  {
    label: 'Focus Session',
    type: 'FOCUS_TIME',
    icon: '🧠',
    defaultTarget: 25 * 60, // 25 min Pomodoro
    unit: 'min',
    description: 'Stay off your phone for a focused work block',
  },
  {
    label: 'Deep Work',
    type: 'FOCUS_TIME',
    icon: '💻',
    defaultTarget: 90 * 60, // 90 min
    unit: 'min',
    description: 'Lock in for a deep work session',
  },
  {
    label: 'Study',
    type: 'FOCUS_TIME',
    icon: '📚',
    defaultTarget: 60 * 60, // 1 hour
    unit: 'min',
    description: 'Study uninterrupted for a set time',
  },
  {
    label: 'Checklist',
    type: 'CHECKLIST',
    icon: '✅',
    defaultTarget: 3,
    unit: 'tasks',
    description: 'Complete a list of tasks to unlock your phone',
  },
];

export const formatProgress = (goal: Goal): string => {
  switch (goal.type) {
    case 'DISTANCE':
      const km = goal.currentValue / 1000;
      const targetKm = goal.targetValue / 1000;
      return `${km.toFixed(2)} / ${targetKm.toFixed(1)} km`;
    case 'FOCUS_TIME':
      const elapsed = Math.floor(goal.currentValue);
      const target = Math.floor(goal.targetValue);
      const eMin = Math.floor(elapsed / 60);
      const eSec = elapsed % 60;
      const tMin = Math.floor(target / 60);
      return `${eMin}:${String(eSec).padStart(2, '0')} / ${tMin}:00`;
    case 'CHECKLIST':
      return `${goal.tasksCompleted} / ${goal.tasksTotal} tasks`;
    default:
      return '';
  }
};

export const getProgressPercent = (goal: Goal): number => {
  if (goal.targetValue === 0) return 0;
  return Math.min(1, goal.currentValue / goal.targetValue);
};
