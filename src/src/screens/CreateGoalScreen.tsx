import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, ScrollView, Alert, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BlockerService, { GoalType } from '../services/BlockerService';
import { GOAL_TEMPLATES } from '../types';
import GoalStore from '../store/GoalStore';
import { v4 as uuid } from 'uuid'; // npm install uuid @types/uuid

const DEADLINE_OPTIONS = [
  { label: '6 AM',  value: 6 },
  { label: '8 AM',  value: 8 },
  { label: '12 PM', value: 12 },
  { label: '3 PM',  value: 15 },
  { label: '9 PM',  value: 21 },
];

const TYPE_OPTIONS: { type: GoalType; icon: string; label: string }[] = [
  { type: 'DISTANCE',   icon: '🚶', label: 'DISTANCE' },
  { type: 'FOCUS_TIME', icon: '🧠', label: 'FOCUS' },
  { type: 'CHECKLIST',  icon: '✅', label: 'TASKS' },
];

export default function CreateGoalScreen() {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<GoalType>('DISTANCE');
  const [targetInput, setTargetInput] = useState('2');
  const [deadlineHour, setDeadlineHour] = useState(6);
  const [goalName, setGoalName] = useState('');

  const getUnit = () => {
    switch (selectedType) {
      case 'DISTANCE':   return 'km';
      case 'FOCUS_TIME': return 'min';
      case 'CHECKLIST':  return 'tasks';
    }
  };

  // Convert target to native units (metres or seconds)
  const getNativeTarget = (): number => {
    const val = parseFloat(targetInput) || 1;
    switch (selectedType) {
      case 'DISTANCE':   return val * 1000;         // km → metres
      case 'FOCUS_TIME': return val * 60;            // min → seconds
      case 'CHECKLIST':  return Math.floor(val);
    }
  };

  const getDeadlineTimestamp = (): number => {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(deadlineHour, 0, 0, 0);
    if (deadline <= now) deadline.setDate(deadline.getDate() + 1);
    return deadline.getTime();
  };

  const getDefaultName = (): string => {
    const template = GOAL_TEMPLATES.find(t => t.type === selectedType);
    return template?.label ?? 'Goal';
  };

  const handleStart = async () => {
    const perms = await BlockerService.checkPermissions();

    if (!perms.accessibility) {
      Alert.alert(
        'Enable Accessibility Service',
        'LockIn needs Accessibility permission to block apps. Tap OK to open Settings, then enable LockIn under Accessibility.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => BlockerService.openAccessibilitySettings() },
        ]
      );
      return;
    }

    if (!perms.overlay) {
      Alert.alert(
        'Allow Display Over Other Apps',
        'LockIn needs permission to show the lock screen on top of other apps.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => BlockerService.openOverlaySettings() },
        ]
      );
      return;
    }

    const name = goalName.trim() || getDefaultName();
    const goal = {
      id: uuid(),
      name,
      type: selectedType,
      targetValue: getNativeTarget(),
      currentValue: 0,
      deadline: getDeadlineTimestamp(),
      tasksTotal: selectedType === 'CHECKLIST' ? Math.floor(parseFloat(targetInput)) : 0,
      tasksCompleted: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };

    await GoalStore.save(goal);
    await BlockerService.startGoal(goal);
    navigation.replace('ActiveGoal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.tag}>NEW GOAL</Text>
          <Text style={styles.headerTitle}>What will you{'\n'}<Text style={styles.accent}>commit to?</Text></Text>
        </View>

        {/* Goal Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOAL NAME (OPTIONAL)</Text>
          <TextInput
            style={styles.nameInput}
            placeholder={getDefaultName()}
            placeholderTextColor="#333"
            value={goalName}
            onChangeText={setGoalName}
            maxLength={40}
          />
        </View>

        {/* Goal Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOAL TYPE</Text>
          <View style={styles.typeGrid}>
            {TYPE_OPTIONS.map(({ type, icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, selectedType === type && styles.typeBtnSelected]}
                onPress={() => {
                  setSelectedType(type);
                  // Reset to default target for this type
                  const tpl = GOAL_TEMPLATES.find(t => t.type === type);
                  if (tpl) {
                    if (type === 'DISTANCE')   setTargetInput('2');
                    if (type === 'FOCUS_TIME') setTargetInput('25');
                    if (type === 'CHECKLIST')  setTargetInput('3');
                  }
                }}
              >
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[styles.typeLabel, selectedType === type && styles.typeLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Value */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TARGET</Text>
          <View style={styles.targetRow}>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={targetInput}
              onChangeText={setTargetInput}
            />
            <Text style={styles.unitLabel}>{getUnit()}</Text>
          </View>
          {selectedType === 'DISTANCE' && (
            <Text style={styles.hint}>
              {`${((parseFloat(targetInput) || 0) * 1000).toFixed(0)}m  ·  ~${Math.round((parseFloat(targetInput) || 0) * 12)} min walk`}
            </Text>
          )}
          {selectedType === 'FOCUS_TIME' && (
            <Text style={styles.hint}>
              {`${Math.floor((parseFloat(targetInput) || 0) / 60)}h ${(parseFloat(targetInput) || 0) % 60}m of focused work`}
            </Text>
          )}
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCK STARTS AT</Text>
          <View style={styles.timeGrid}>
            {DEADLINE_OPTIONS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[styles.timeBtn, deadlineHour === value && styles.timeBtnSelected]}
                onPress={() => setDeadlineHour(value)}
              >
                <Text style={[styles.timeBtnText, deadlineHour === value && styles.timeBtnTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            Your phone locks at this time tomorrow if the goal is not completed.
          </Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>START + LOCK PHONE</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  scroll: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 24 },
  backBtn: { fontSize: 11, color: '#555', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 1, marginBottom: 20 },
  tag: { fontSize: 10, letterSpacing: 4, color: '#444', fontFamily: 'IBMPlexMono-Regular', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold', lineHeight: 34 },
  accent: { color: '#CAFF00' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: '#555', fontFamily: 'IBMPlexMono-Regular', marginBottom: 10 },
  nameInput: {
    backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    color: '#F0F0F0', fontFamily: 'IBMPlexMono-Regular',
    fontSize: 15, padding: 14,
  },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, backgroundColor: '#161616', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
    padding: 14, alignItems: 'center',
  },
  typeBtnSelected: { borderColor: '#CAFF00', backgroundColor: '#1A2200' },
  typeIcon: { fontSize: 20, marginBottom: 6 },
  typeLabel: { fontSize: 9, color: '#666', fontFamily: 'IBMPlexMono-Regular', letterSpacing: 1 },
  typeLabelSelected: { color: '#CAFF00' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  targetInput: {
    flex: 1, backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold',
    fontSize: 28, padding: 14, textAlign: 'center',
  },
  unitLabel: { fontSize: 14, color: '#555', fontFamily: 'IBMPlexMono-Regular', minWidth: 32 },
  hint: { fontSize: 10, color: '#444', fontFamily: 'IBMPlexMono-Regular', marginTop: 8, letterSpacing: 0.5 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#161616', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  timeBtnSelected: { borderColor: '#CAFF00', backgroundColor: '#1A2200' },
  timeBtnText: { fontSize: 11, color: '#666', fontFamily: 'IBMPlexMono-Regular' },
  timeBtnTextSelected: { color: '#CAFF00' },
  startBtn: { backgroundColor: '#CAFF00', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: '#0C0C0C', fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'IBMPlexMono-Bold' },
});
