import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Vibration, BackHandler
} from 'react-native';
import { Goal, formatProgress, getProgressPercent } from '../types';

interface Props {
  visible: boolean;
  goal: Goal;
  onDismiss: () => void;
}

export default function LockOverlay({ visible, goal, onDismiss }: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Vibrate when overlay appears
      Vibration.vibrate([0, 100, 50, 100]);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: true
      }).start();

      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Block hardware back button during overlay
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      Vibration.vibrate(50);
      return true; // block back
    });
    return () => handler.remove();
  }, [visible]);

  const pct = getProgressPercent(goal);
  const motivation = pct < 0.25
    ? "You set this goal.\nNow go earn your phone back."
    : pct < 0.5
    ? "Almost a quarter done.\nKeep moving."
    : pct < 0.75
    ? "More than halfway.\nDon't stop now."
    : "So close.\nFinish it.";

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnim }] }]}>

          {/* Lock icon */}
          <View style={styles.lockIconWrap}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          <Text style={styles.lockedTitle}>LOCKED</Text>
          <Text style={styles.lockedSub}>FINISH YOUR GOAL FIRST</Text>

          {/* Goal card */}
          <View style={styles.goalCard}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalProgress}>{formatProgress(goal)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
            </View>
          </View>

          <Text style={styles.motivation}>{motivation}</Text>

          <TouchableOpacity style={styles.backBtn} onPress={onDismiss}>
            <Text style={styles.backBtnText}>BACK TO GOAL →</Text>
          </TouchableOpacity>

          <Text style={styles.note}>Leave the app and this screen appears.</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#080000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: { width: '100%', alignItems: 'center' },
  lockIconWrap: {
    width: 80, height: 80,
    backgroundColor: '#1A0000',
    borderRadius: 20,
    borderWidth: 1, borderColor: '#3A0000',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  lockIcon: { fontSize: 36 },
  lockedTitle: {
    fontSize: 48, fontWeight: '700',
    color: '#FF4444', letterSpacing: 4, marginBottom: 4,
  },
  lockedSub: { fontSize: 10, color: '#5A2222', letterSpacing: 3, marginBottom: 32 },
  goalCard: {
    width: '100%',
    backgroundColor: '#140000',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#2A0000',
    padding: 18, marginBottom: 20,
  },
  goalName: { fontSize: 16, fontWeight: '700', color: '#FF8888', marginBottom: 6 },
  goalProgress: { fontSize: 12, color: '#5A2222', marginBottom: 14 },
  progressTrack: { backgroundColor: '#1A0000', borderRadius: 3, height: 4 },
  progressFill: { backgroundColor: '#FF4444', height: 4, borderRadius: 3 },
  motivation: {
    fontSize: 13, color: '#5A2222',
    textAlign: 'center', lineHeight: 22,
    letterSpacing: 0.5, marginBottom: 32,
  },
  backBtn: {
    width: '100%',
    borderWidth: 1, borderColor: '#3A0000',
    borderRadius: 16, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  backBtnText: { color: '#FF4444', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  note: { fontSize: 9, color: '#2A1010', letterSpacing: 2 },
});
