import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types';

const KEY = 'lockin_goals';

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
      if (idx >= 0) {
        all[idx] = goal;
      } else {
        all.push(goal);
      }
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.error('GoalStore.save error:', e);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const all = await GoalStore.getAll();
      const filtered = all.filter(g => g.id !== id);
      await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('GoalStore.delete error:', e);
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },
};

export default GoalStore;
