export type GoalType = 'DISTANCE' | 'FOCUS_TIME' | 'CHECKLIST';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  deadline: number;
  tasksTotal: number;
  tasksCompleted: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface GoalTemplate {
  label: string;
  type: GoalType;
  icon: string;
  unit: string;
  defaultTarget: number;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { label: 'Walk',         type: 'DISTANCE',   icon: '🚶', unit: 'km',    defaultTarget: 2 },
  { label: 'Run',          type: 'DISTANCE',   icon: '🏃', unit: 'km',    defaultTarget: 5 },
  { label: 'Focus',        type: 'FOCUS_TIME', icon: '🧠', unit: 'min',   defaultTarget: 25 },
  { label: 'Deep Work',    type: 'FOCUS_TIME', icon: '💻', unit: 'min',   defaultTarget: 90 },
  { label: 'Study',        type: 'FOCUS_TIME', icon: '📚', unit: 'min',   defaultTarget: 60 },
  { label: 'Checklist',    type: 'CHECKLIST',  icon: '✅', unit: 'tasks', defaultTarget: 3 },
];

export const formatProgress = (goal: Goal): string => {
  switch (goal.type) {
    case 'DISTANCE': {
      const km = (goal.currentValue / 1000).toFixed(2);
      const target = (goal.targetValue / 1000).toFixed(1);
      return `${km} / ${target} km`;
    }
    case 'FOCUS_TIME': {
      const elapsed = Math.floor(goal.currentValue);
      const target = Math.floor(goal.targetValue);
      const eMin = Math.floor(elapsed / 60);
      const eSec = elapsed % 60;
      const tMin = Math.floor(target / 60);
      return `${eMin}:${String(eSec).padStart(2, '0')} / ${tMin}:00`;
    }
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
