import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, StatusBar, AppState
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import GoalStore from '../store/GoalStore';
import { Goal, formatProgress, getProgressPercent } from '../types';
import LockOverlay from '../components/LockOverlay';
import {
  startLocationTracking, stopLocationTracking,
  startAppStateWatcher, stopAppStateWatcher,
  registerBackgroundFetch
} from '../services/BackgroundService';

const RING_R = 68;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function ActiveGoalScreen() {
  const navigation = useNavigation<any>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoord = useRef<{ lat: number; lon: number } | null>(null);
  const totalMetres = useRef(0);

  useEffect(() => {
    loadGoal();
    registerBackgroundFetch();
    startAppStateWatcher((isBackground) => {
      if (isBackground) setShowLock(true);
    });
    return () => {
      cleanup();
      stopAppStateWatcher();
    };
  }, []);

  const loadGoal = async () => {
    const active = await GoalStore.getActive();
    if (!active) { navigation.replace('Home'); return; }
    setGoal(active);
    totalMetres.current = active.currentValue;
    if (active.type === 'FOCUS_TIME') startTimer(active);
    if (active.type === 'DISTANCE') startGPS(active);
  };

  const startTimer = (g: Goal) => {
    intervalRef.current = setInterval(async () => {
      setElapsed(e => e + 1);
      setGoal(prev => {
        if (!prev) return prev;
        const newVal = prev.currentValue + 1;
        const updated = { ...prev, currentValue: newVal };
        if (newVal >= prev.targetValue) {
          handleComplete(updated);
          return { ...updated, isCompleted: true };
        }
        if (Math.floor(newVal) % 5 === 0) GoalStore.setActive(updated);
        return updated;
      });
    }, 1000);
  };

  const startGPS = async (g: Goal) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'Please enable location to track your distance goal.');
      return;
    }

    await startLocationTracking();

    // Watch position for real-time UI updates
    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        if (lastCoord.current) {
          const delta = haversine(lastCoord.current.lat, lastCoord.current.lon, latitude, longitude);
          if (delta < 100) {
            totalMetres.current += delta;
            setElapsed(e => e + 1);
            setGoal(prev => {
              if (!prev) return prev;
              const updated = { ...prev, currentValue: totalMetres.current };
              if (totalMetres.current >= prev.targetValue) {
                handleComplete(updated);
                return { ...updated, isCompleted: true };
              }
              return updated;
            });
          }
        }
        lastCoord.current = { lat: latitude, lon: longitude };
      }
    );
  };

  const handleComplete = async (g: Goal) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await stopLocationTracking();
    setCompleted(true);
    setShowLock(false);
    const finished = { ...g, isCompleted: true, currentValue: g.targetValue };
    await GoalStore.save(finished);
    await GoalStore.setActive(null);
    setTimeout(() => navigation.replace('Home'), 2500);
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
      'Your goal stays active. The lock screen will appear whenever you leave this app.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Go Home', onPress: () => { cleanup(); navigation.replace('Home'); } }
      ]
    );
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopLocationTracking();
  };

  if (!goal) return null;

  const pct = getProgressPercent(goal);
  const strokeOffset = CIRCUMFERENCE * (1 - pct);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);
  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const ringValue = () => {
    switch (goal.type) {
      case 'DISTANCE':   return (goal.currentValue / 1000).toFixed(2);
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

  const remainingLabel = () => {
    switch (goal.type) {
      case 'DISTANCE':   return `${(remaining / 1000).toFixed(2)} km`;
      case 'FOCUS_TIME': return `${Math.floor(remaining / 60)}m ${Math.floor(remaining) % 60}s`;
      case 'CHECKLIST':  return `${goal.tasksTotal - goal.tasksCompleted} tasks`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      {/* Lock overlay - appears when user leaves app */}
      {goal && (
        <LockOverlay
          visible={showLock && !completed}
          goal={goal}
          onDismiss={() => setShowLock(false)}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.tag}>ACTIVE GOAL</Text>
        <View style={styles.titleRow}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <View style={styles.typePill}><Text style={styles.typePillText}>{goal.type}</Text></View>
        </View>
      </View>

      {/* Progress Ring */}
      <View style={styles.ringWrap}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={RING_R} fill="none" stroke="#1A1A1A" strokeWidth={14} />
          <Circle
            cx={100} cy={100} r={RING_R} fill="none"
            stroke={completed ? '#CAFF00' : '#CAFF00'}
            strokeWidth={14}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={[styles.ringValue, completed && { color: '#CAFF00' }]}>{ringValue()}</Text>
          <Text style={styles.ringUnit}>{ringUnit()}</Text>
        </View>
      </View>

      {completed ? (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>✓ GOAL COMPLETE</Text>
          <Text style={styles.completedSub}>Phone unlocked. Well done.</Text>
        </View>
      ) : (
        <>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: '#CAFF00' }]}>{Math.round(pct * 100)}%</Text>
              <Text style={styles.statLbl}>DONE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{remainingLabel()}</Text>
              <Text style={styles.statLbl}>LEFT</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatElapsed(elapsed)}</Text>
              <Text style={styles.statLbl}>ELAPSED</Text>
            </View>
          </View>

          <View style={styles.lockWarning}>
            <Text style={styles.lockWarningText}>🔒 LEAVE THIS APP AND YOU GET LOCKED OUT</Text>
          </View>

          {goal.type === 'CHECKLIST' && (
            <TouchableOpacity style={styles.taskBtn} onPress={handleChecklistTask}>
              <Text style={styles.taskBtnText}>✓ MARK TASK COMPLETE ({goal.tasksCompleted}/{goal.tasksTotal})</Text>
            </TouchableOpacity>
          )}

          {goal.type === 'DISTANCE' && (
            <View style={styles.gpsNote}>
              <Text style={styles.gpsNoteText}>📍 GPS tracking active in background</Text>
            </View>
          )}
        </>
      )}

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
          <Text style={styles.giveUpText}>GIVE UP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalName: { fontSize: 22, fontWeight: '700', color: '#F0F0F0', flex: 1 },
  typePill: { backgroundColor: '#1A2200', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 9, color: '#CAFF00', letterSpacing: 2 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 16, position: 'relative' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: 28, fontWeight: '700', color: '#F0F0F0' },
  ringUnit: { fontSize: 9, color: '#555', letterSpacing: 2, marginTop: 4 },
  completedBanner: { alignItems: 'center', marginVertical: 20 },
  completedText: { fontSize: 20, fontWeight: '700', color: '#CAFF00', letterSpacing: 3 },
  completedSub: { fontSize: 12, color: '#6A8800', marginTop: 8 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 24,
    backgroundColor: '#161616', borderRadius: 16,
    borderWidth: 1, borderColor: '#222', padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '700', color: '#F0F0F0' },
  statLbl: { fontSize: 9, color: '#555', letterSpacing: 1, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222', marginVertical: 4 },
  lockWarning: {
    marginHorizontal: 24, marginTop: 14,
    backgroundColor: '#1A0A00', borderRadius: 10,
    borderWidth: 1, borderColor: '#3A1500',
    padding: 10, alignItems: 'center',
  },
  lockWarningText: { fontSize: 9, color: '#FF6600', letterSpacing: 2 },
  taskBtn: {
    marginHorizontal: 24, marginTop: 14,
    backgroundColor: '#1A2200', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A3800',
    padding: 16, alignItems: 'center',
  },
  taskBtnText: { color: '#CAFF00', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  gpsNote: {
    marginHorizontal: 24, marginTop: 14,
    backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#222', padding: 12,
  },
  gpsNoteText: { color: '#555', fontSize: 11, textAlign: 'center' },
  bottom: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  giveUpBtn: { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 14, padding: 14, alignItems: 'center' },
  giveUpText: { color: '#444', fontSize: 10, letterSpacing: 1 },
});
