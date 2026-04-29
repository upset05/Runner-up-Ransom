import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types';

const KEY = 'ransom_goals';

const GoalStore = {
  async getAll(): Promise<Goal[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async save(goal: Goal): Promise<void> {
    try {
      const all = await GoalStore.getAll();
      const idx = all.findIndex(g => g.id === goal.id);
      if (idx >= 0) all[idx] = goal;
      else all.push(goal);
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.error('GoalStore.save error:', e);
    }
  },

  async getActive(): Promise<Goal | null> {
    try {
      const raw = await AsyncStorage.getItem('ransom_active_goal');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setActive(goal: Goal | null): Promise<void> {
    try {
      if (goal) await AsyncStorage.setItem('ransom_active_goal', JSON.stringify(goal));
      else await AsyncStorage.removeItem('ransom_active_goal');
    } catch (e) {
      console.error('GoalStore.setActive error:', e);
    }
  },
};

export default GoalStore;
