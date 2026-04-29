import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, ScrollView, Alert, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GoalStore from '../store/GoalStore';
import { GoalType, GOAL_TEMPLATES } from '../types';

const TYPE_OPTIONS: { type: GoalType; icon: string; label: string }[] = [
  { type: 'DISTANCE',   icon: '🚶', label: 'DISTANCE' },
  { type: 'FOCUS_TIME', icon: '🧠', label: 'FOCUS' },
  { type: 'CHECKLIST',  icon: '✅', label: 'TASKS' },
];

const DEADLINE_OPTIONS = [
  { label: '6 AM',  value: 6 },
  { label: '8 AM',  value: 8 },
  { label: '12 PM', value: 12 },
  { label: '3 PM',  value: 15 },
  { label: '9 PM',  value: 21 },
];

export default function CreateGoalScreen() {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<GoalType>('DISTANCE');
  const [targetInput, setTargetInput] = useState('2');
  const [deadlineHour, setDeadlineHour] = useState(8);
  const [goalName, setGoalName] = useState('');

  const getUnit = () => {
    switch (selectedType) {
      case 'DISTANCE':   return 'km';
      case 'FOCUS_TIME': return 'min';
      case 'CHECKLIST':  return 'tasks';
    }
  };

  const getNativeTarget = (): number => {
    const val = parseFloat(targetInput) || 1;
    switch (selectedType) {
      case 'DISTANCE':   return val * 1000;
      case 'FOCUS_TIME': return val * 60;
      case 'CHECKLIST':  return Math.floor(val);
    }
  };

  const getDeadlineTimestamp = (): number => {
    const deadline = new Date();
    deadline.setHours(deadlineHour, 0, 0, 0);
    if (deadline <= new Date()) deadline.setDate(deadline.getDate() + 1);
    return deadline.getTime();
  };

  const handleStart = async () => {
    const val = parseFloat(targetInput);
    if (!val || val <= 0) {
      Alert.alert('Invalid target', 'Please enter a valid target value.');
      return;
    }

    const template = GOAL_TEMPLATES.find(t => t.type === selectedType);
    const name = goalName.trim() || template?.label || 'Goal';

    const goal = {
      id: Date.now().toString(),
      name,
      type: selectedType,
      targetValue: getNativeTarget(),
      currentValue: 0,
      deadline: getDeadlineTimestamp(),
      tasksTotal: selectedType === 'CHECKLIST' ? Math.floor(val) : 0,
      tasksCompleted: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };

    await GoalStore.save(goal);
    await GoalStore.setActive(goal);
    navigation.replace('ActiveGoal');
  };

  const handleTypeSelect = (type: GoalType) => {
    setSelectedType(type);
    if (type === 'DISTANCE')   setTargetInput('2');
    if (type === 'FOCUS_TIME') setTargetInput('25');
    if (type === 'CHECKLIST')  setTargetInput('3');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>

        <Text style={styles.tag}>NEW GOAL</Text>
        <Text style={styles.title}>What will you{'\n'}<Text style={styles.accent}>commit to?</Text></Text>

        {/* Goal name */}
        <View style={styles.section}>
          <Text style={styles.label}>GOAL NAME (OPTIONAL)</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Morning Walk"
            placeholderTextColor="#333"
            value={goalName}
            onChangeText={setGoalName}
            maxLength={40}
          />
        </View>

        {/* Goal type */}
        <View style={styles.section}>
          <Text style={styles.label}>GOAL TYPE</Text>
          <View style={styles.typeGrid}>
            {TYPE_OPTIONS.map(({ type, icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, selectedType === type && styles.typeBtnSel]}
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[styles.typeLabel, selectedType === type && styles.typeLabelSel]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target */}
        <View style={styles.section}>
          <Text style={styles.label}>TARGET</Text>
          <View style={styles.targetRow}>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={targetInput}
              onChangeText={setTargetInput}
            />
            <Text style={styles.unitLabel}>{getUnit()}</Text>
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.label}>LOCK STARTS AT</Text>
          <View style={styles.timeGrid}>
            {DEADLINE_OPTIONS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[styles.timeBtn, deadlineHour === value && styles.timeBtnSel]}
                onPress={() => setDeadlineHour(value)}
              >
                <Text style={[styles.timeBtnText, deadlineHour === value && styles.timeBtnTextSel]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Phone locks at this time if goal is not completed.</Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>START GOAL →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  scroll: { padding: 24, paddingBottom: 48 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 11, color: '#555', letterSpacing: 1 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#F0F0F0', lineHeight: 34, marginBottom: 28 },
  accent: { color: '#CAFF00' },
  section: { marginBottom: 24 },
  label: { fontSize: 9, letterSpacing: 3, color: '#555', marginBottom: 10 },
  nameInput: {
    backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    color: '#F0F0F0', fontSize: 15, padding: 14,
  },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, backgroundColor: '#161616', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
    padding: 14, alignItems: 'center',
  },
  typeBtnSel: { borderColor: '#CAFF00', backgroundColor: '#1A2200' },
  typeIcon: { fontSize: 20, marginBottom: 6 },
  typeLabel: { fontSize: 9, color: '#666', letterSpacing: 1 },
  typeLabelSel: { color: '#CAFF00' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  targetInput: {
    flex: 1, backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    color: '#F0F0F0', fontSize: 28, fontWeight: '700',
    padding: 14, textAlign: 'center',
  },
  unitLabel: { fontSize: 14, color: '#555', minWidth: 36 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#161616', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  timeBtnSel: { borderColor: '#CAFF00', backgroundColor: '#1A2200' },
  timeBtnText: { fontSize: 11, color: '#666' },
  timeBtnTextSel: { color: '#CAFF00' },
  hint: { fontSize: 10, color: '#444', marginTop: 8 },
  startBtn: { backgroundColor: '#CAFF00', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: '#0C0C0C', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
