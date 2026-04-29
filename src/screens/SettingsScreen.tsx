import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Switch, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoalStore from '../store/GoalStore';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [vibration, setVibration] = useState(true);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Goal History',
      'This will delete all completed and missed goals. Active goals are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const active = await GoalStore.getActive();
            await GoalStore.clear();
            if (active) await GoalStore.save(active);
            Alert.alert('Done', 'Goal history cleared.');
          }
        }
      ]
    );
  };

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem('ransom_onboarding_done');
    navigation.replace('Onboarding');
  };

  const handleForceUnlock = () => {
    Alert.alert(
      'Force Unlock',
      'This will cancel your active goal and unlock your phone. This is the emergency exit.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Goal',
          style: 'destructive',
          onPress: async () => {
            const active = await GoalStore.getActive();
            if (active) {
              await GoalStore.save({ ...active, isCompleted: false });
              await GoalStore.setActive(null);
            }
            navigation.replace('Home');
          }
        }
      ]
    );
  };

  const Row = ({ label, value, onPress, danger = false }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {!value && <Text style={styles.rowArrow}>→</Text>}
    </TouchableOpacity>
  );

  const SwitchRow = ({ label, value, onValueChange }: any) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#222', true: '#3A5500' }}
        thumbColor={value ? '#CAFF00' : '#444'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>

        <Text style={styles.tag}>SETTINGS</Text>
        <Text style={styles.title}>Runner Up{'\n'}<Text style={styles.accent}>Ransom</Text></Text>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <SwitchRow
            label="Vibrate on lock"
            value={vibration}
            onValueChange={setVibration}
          />
        </View>

        {/* Data */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <Row label="Clear goal history" onPress={handleClearHistory} />
          <View style={styles.divider} />
          <Row label="Replay onboarding" onPress={handleResetOnboarding} />
        </View>

        {/* Emergency */}
        <Text style={styles.sectionLabel}>EMERGENCY</Text>
        <View style={styles.card}>
          <Row
            label="Cancel active goal (force unlock)"
            onPress={handleForceUnlock}
            danger
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App</Text>
            <Text style={styles.rowValue}>Runner Up Ransom</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Set a goal. Earn your phone.{'\n'}No shortcuts.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  scroll: { padding: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 11, color: '#555', letterSpacing: 1 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '700', color: '#F0F0F0', lineHeight: 36, marginBottom: 32 },
  accent: { color: '#CAFF00' },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: '#444', marginBottom: 8, marginTop: 20 },
  card: {
    backgroundColor: '#161616', borderRadius: 16,
    borderWidth: 1, borderColor: '#222', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { fontSize: 13, color: '#D0D0D0' },
  rowLabelDanger: { color: '#FF4444' },
  rowValue: { fontSize: 12, color: '#555' },
  rowArrow: { fontSize: 14, color: '#444' },
  divider: { height: 1, backgroundColor: '#1E1E1E', marginHorizontal: 16 },
  footer: {
    marginTop: 40, fontSize: 11, color: '#333',
    textAlign: 'center', lineHeight: 18, letterSpacing: 1,
  },
});
