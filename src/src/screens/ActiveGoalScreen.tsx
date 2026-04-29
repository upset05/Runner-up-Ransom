import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Animated, StatusBar, Easing
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import BlockerService from '../services/BlockerService';
import GPSService from '../services/GPSService';
import FocusTimerService from '../services/FocusTimerService';
import GoalStore from '../store/GoalStore';
import { Goal, formatProgress, getProgressPercent } from '../types';

const RING_RADIUS = 68;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ActiveGoalScreen() {
  const navigation = useNavigation<any>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAndStart();
    return () => cleanup();
  }, []);

  const loadAndStart = async () => {
    const active = await BlockerService.getActiveGoal();
    if (!active) { navigation.replace('Home'); return; }
    setGoal(active as Goal);
    startTracking(active as Goal);
  };

  const startTracking = (g: Goal) => {
    if (g.type === 'DISTANCE') {
      GPSService.start(
        (metres) => handleProgress(g, metres),
        () => handleComplete(g)
      );
    } else if (g.type === 'FOCUS_TIME') {
      FocusTimerService.start(
        g.targetValue,
        (elapsedSecs) => handleProgress(g, elapsedSecs),
        () => handleComplete(g)
      );
    }
    // CHECKLIST is managed via completeTask() calls from the UI
  };

  const handleProgress = (g: Goal, value: number) => {
    const pct = Math.min(1, value / g.targetValue);
    setGoal(prev => prev ? { ...prev, currentValue: value } : prev);
    animateRing(pct);
  };

  const animateRing = (toValue: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleComplete = async (g: Goal) => {
    setCompleted(true);
    animateRing(1);
    const updated = { ...g, isCompleted: true, currentValue: g.targetValue };
    setGoal(updated);
    await GoalStore.save(updated);
    // Slight delay then go home to celebrate
    setTimeout(() => navigation.replace('Home'), 2000);
  };

  const handleChecklistTask = async () => {
    if (!goal) return;
    const result = await BlockerService.completeTask();
    const newCount = goal.tasksCompleted + 1;
    const updated = { ...goal, tasksCompleted: newCount, currentValue: newCount };
    setGoal(updated);
    animateRing(getProgressPercent(updated));
    if (result === 'COMPLETED') handleComplete(updated);
  };

  const handleGiveUp = () => {
    Alert.alert(
      'Give Up?',
      'Your phone stays locked until the goal is completed. If you give up now, your phone stays locked.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Give Up (Stay Locked)',
          style: 'destructive',
          onPress: async () => {
            cleanup();
            navigation.replace('Home');
          }
        }
      ]
    );
  };

  const cleanup = () => {
    GPSService.stop();
    FocusTimerService.stop();
  };

  const formatElapsed = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!goal) return null;

  const pct = getProgressPercent(goal);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      <View style={styles.header}>
        <Text style={styles.tag}>ACTIVE GOAL</Text>
        <View style={styles.titleRow}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{goal.type}</Text>
          </View>
        </View>
      </View>

      {/* Progress Ring */}
      <View style={styles.ringWrap}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          {/* Track */}
          <Circle cx={90} cy={90} r={RING_RADIUS} fill="none" stroke="#1A1A1A" strokeWidth={12} />
          {/* Progress */}
          <Circle
            cx={90} cy={90} r={RING_RADIUS}
            fill="none"
            stroke={completed ? '#CAFF00' : '#CAFF00'}
            strokeWidth={12}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={[styles.ringValue, completed && { color: '#CAFF00' }]}>
            {goal.type === 'DISTANCE'
              ? `${(goal.currentValue / 1000).toFixed(2)}`
              : goal.type === 'FOCUS_TIME'
              ? `${Math.floor(goal.currentValue / 60)}:${String(Math.floor(goal.currentValue) % 60).padStart(2, '0')}`
              : `${goal.tasksCompleted}`
            }
          </Text>
          <Text style={styles.ringUnit}>
            {goal.type === 'DISTANCE'
              ? `OF ${(goal.targetValue / 1000).toFixed(1)} KM`
              : goal.type === 'FOCUS_TIME'
              ? `OF ${Math.floor(goal.targetValue / 60)} MIN`
              : `OF ${goal.tasksTotal} TASKS`
            }
          </Text>
        </View>
      </View>

      {completed && (
        <Text style={styles.completedText}>GOAL COMPLETE · UNLOCKING...</Text>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: '#CAFF00' }]}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.statLbl}>DONE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>
            {goal.type === 'DISTANCE'
              ? `${(remaining / 1000).toFixed(2)}`
              : goal.type === 'FOCUS_TIME'
              ? `${Math.floor(remaining / 60)}m`
              : `${goal.tasksTotal - goal.tasksCompleted}`
            }
          </Text>
          <Text style={styles.statLbl}>
            {goal.type === 'CHECKLIST' ? 'REMAINING' : goal.type === 'DISTANCE' ? 'KM LEFT' : 'MINS LEFT'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.statLbl}>ELAPSED</Text>
        </View>
      </View>

      <View style={styles.separator} />
      <Text style={styles.lockNotice}>
        PHONE LOCKS AT {new Date(goal.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {/* Checklist task button */}
      {goal.type === 'CHECKLIST' && !completed && (
        <TouchableOpacity style={styles.taskBtn} onPress={handleChecklistTask}>
          <Text style={styles.taskBtnText}>✓ MARK TASK COMPLETE ({goal.tasksCompleted}/{goal.tasksTotal})</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
          <Text style={styles.giveUpText}>GIVE UP (STAY LOCKED)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', fontFamily: 'IBMPlexMono-Regular', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalName: { fontSize: 24, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold', flex: 1 },
  typePill: { backgroundColor: '#1A2200', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 9, color: '#CAFF00', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 2 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 24, position: 'relative' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: 28, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold' },
  ringUnit: { fontSize: 9, color: '#555', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 2, marginTop: 4 },
  completedText: { textAlign: 'center', fontSize: 11, color: '#CAFF00', fontFamily: 'IBMPlexMono-Bold', letterSpacing: 2, marginBottom: 8 },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: '#161616', borderRadius: 16, borderWidth: 1, borderColor: '#222', padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold' },
  statLbl: { fontSize: 9, color: '#555', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 2, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222', marginVertical: 4 },
  separator: { height: 1, backgroundColor: '#1A1A1A', marginHorizontal: 24, marginVertical: 16 },
  lockNotice: { textAlign: 'center', fontSize: 10, color: '#444', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 2 },
  taskBtn: {
    marginHorizontal: 24, marginTop: 16,
    backgroundColor: '#1A2200', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A3800',
    padding: 16, alignItems: 'center',
  },
  taskBtnText: { color: '#CAFF00', fontSize: 11, fontFamily: 'IBMPlexMono-Bold', letterSpacing: 1 },
  bottom: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  giveUpBtn: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 14, padding: 14, alignItems: 'center' },
  giveUpText: { color: '#444', fontSize: 10, fontFamily: 'IBMPlexMono-Regular', letterSpacing: 1 },
});
