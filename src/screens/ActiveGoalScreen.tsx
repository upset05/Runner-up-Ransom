import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, StatusBar
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import GoalStore from '../store/GoalStore';
import { Goal, formatProgress, getProgressPercent } from '../types';

const RING_R = 68;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function ActiveGoalScreen() {
  const navigation = useNavigation<any>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadGoal();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const loadGoal = async () => {
    const active = await GoalStore.getActive();
    if (!active) { navigation.replace('Home'); return; }
    setGoal(active);
    if (active.type === 'FOCUS_TIME') startTimer(active);
  };

  const startTimer = (g: Goal) => {
    intervalRef.current = setInterval(async () => {
      setGoal(prev => {
        if (!prev) return prev;
        const newVal = prev.currentValue + 1;
        const updated = { ...prev, currentValue: newVal };
        if (newVal >= prev.targetValue) {
          handleComplete(updated);
          return { ...updated, isCompleted: true };
        }
        // Save every 5s
        if (Math.floor(newVal) % 5 === 0) GoalStore.setActive(updated);
        return updated;
      });
      setElapsed(e => e + 1);
    }, 1000);
  };

  const handleComplete = async (g: Goal) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCompleted(true);
    const finished = { ...g, isCompleted: true, currentValue: g.targetValue };
    await GoalStore.save(finished);
    await GoalStore.setActive(null);
    setTimeout(() => navigation.replace('Home'), 2000);
  };

  const handleChecklistTask = async () => {
    if (!goal) return;
    const newCount = goal.tasksCompleted + 1;
    const updated = { ...goal, tasksCompleted: newCount, currentValue: newCount };
    setGoal(updated);
    await GoalStore.setActive(updated);
    if (newCount >= goal.tasksTotal) handleComplete(updated);
  };

  const handleGiveUp = () => {
    Alert.alert(
      'Give Up?',
      'Your goal stays active. Come back when you\'re ready.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Go Back', onPress: () => navigation.replace('Home') }
      ]
    );
  };

  if (!goal) return null;

  const pct = getProgressPercent(goal);
  const strokeOffset = CIRCUMFERENCE * (1 - pct);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);

  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const formatRemaining = () => {
    switch (goal.type) {
      case 'DISTANCE':   return `${(remaining / 1000).toFixed(2)} km left`;
      case 'FOCUS_TIME': return `${Math.floor(remaining / 60)}m left`;
      case 'CHECKLIST':  return `${goal.tasksTotal - goal.tasksCompleted} tasks left`;
    }
  };

  const ringValue = () => {
    switch (goal.type) {
      case 'DISTANCE':   return `${(goal.currentValue / 1000).toFixed(2)}`;
      case 'FOCUS_TIME': return `${Math.floor(goal.currentValue / 60)}:${String(Math.floor(goal.currentValue) % 60).padStart(2, '0')}`;
      case 'CHECKLIST':  return `${goal.tasksCompleted}`;
    }
  };

  const ringUnit = () => {
    switch (goal.type) {
      case 'DISTANCE':   return `OF ${(goal.targetValue / 1000).toFixed(1)} KM`;
      case 'FOCUS_TIME': return `OF ${Math.floor(goal.targetValue / 60)} MIN`;
      case 'CHECKLIST':  return `OF ${goal.tasksTotal} TASKS`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      <View style={styles.header}>
        <Text style={styles.tag}>ACTIVE GOAL</Text>
        <View style={styles.titleRow}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <View style={styles.typePill}><Text style={styles.typePillText}>{goal.type}</Text></View>
        </View>
      </View>

      {/* Progress Ring */}
      <View style={styles.ringWrap}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Circle cx={90} cy={90} r={RING_R} fill="none" stroke="#1A1A1A" strokeWidth={12} />
          <Circle
            cx={90} cy={90} r={RING_R} fill="none"
            stroke="#CAFF00" strokeWidth={12}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={[styles.ringValue, completed && { color: '#CAFF00' }]}>{ringValue()}</Text>
          <Text style={styles.ringUnit}>{ringUnit()}</Text>
        </View>
      </View>

      {completed && <Text style={styles.completedText}>✓ GOAL COMPLETE · UNLOCKING...</Text>}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: '#CAFF00' }]}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.statLbl}>DONE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{formatRemaining()}</Text>
          <Text style={styles.statLbl}>REMAINING</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.statLbl}>ELAPSED</Text>
        </View>
      </View>

      <Text style={styles.lockNotice}>
        LOCKS AT {new Date(goal.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {goal.type === 'CHECKLIST' && !completed && (
        <TouchableOpacity style={styles.taskBtn} onPress={handleChecklistTask}>
          <Text style={styles.taskBtnText}>✓ MARK TASK COMPLETE ({goal.tasksCompleted}/{goal.tasksTotal})</Text>
        </TouchableOpacity>
      )}

      {goal.type === 'DISTANCE' && !completed && (
        <View style={styles.gpsNote}>
          <Text style={styles.gpsNoteText}>📍 GPS tracking active — keep this screen open while walking/running</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
          <Text style={styles.giveUpText}>GIVE UP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalName: { fontSize: 22, fontWeight: '700', color: '#F0F0F0', flex: 1 },
  typePill: { backgroundColor: '#1A2200', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 9, color: '#CAFF00', letterSpacing: 2 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, position: 'relative' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: 26, fontWeight: '700', color: '#F0F0F0' },
  ringUnit: { fontSize: 9, color: '#555', letterSpacing: 2, marginTop: 4 },
  completedText: { textAlign: 'center', fontSize: 11, color: '#CAFF00', fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 24,
    backgroundColor: '#161616', borderRadius: 16,
    borderWidth: 1, borderColor: '#222', padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '700', color: '#F0F0F0' },
  statLbl: { fontSize: 9, color: '#555', letterSpacing: 1, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222', marginVertical: 4 },
  lockNotice: { textAlign: 'center', fontSize: 10, color: '#444', letterSpacing: 2, marginTop: 14 },
  taskBtn: {
    marginHorizontal: 24, marginTop: 16,
    backgroundColor: '#1A2200', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A3800',
    padding: 16, alignItems: 'center',
  },
  taskBtnText: { color: '#CAFF00', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  gpsNote: {
    marginHorizontal: 24, marginTop: 16,
    backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#222', padding: 12,
  },
  gpsNoteText: { color: '#555', fontSize: 11, textAlign: 'center', lineHeight: 18 },
  bottom: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  giveUpBtn: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 14, padding: 14, alignItems: 'center' },
  giveUpText: { color: '#444', fontSize: 10, letterSpacing: 1 },
});
