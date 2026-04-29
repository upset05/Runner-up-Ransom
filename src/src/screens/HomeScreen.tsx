import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BlockerService from '../services/BlockerService';
import { Goal, formatProgress, getProgressPercent } from '../types';
import GoalStore from '../store/GoalStore';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [permissionsOk, setPermissionsOk] = useState(false);

  useEffect(() => {
    checkSetup();
    loadGoals();
  }, []);

  const checkSetup = async () => {
    const perms = await BlockerService.checkPermissions();
    setPermissionsOk(perms.allGranted);
    if (!perms.allGranted) {
      navigation.navigate('Onboarding');
    }
  };

  const loadGoals = async () => {
    const all = await GoalStore.getAll();
    setGoals(all.reverse());
    const active = await BlockerService.getActiveGoal();
    setActiveGoal(active);
  };

  const handleNewGoal = () => {
    navigation.navigate('CreateGoal');
  };

  const handleResumeGoal = () => {
    navigation.navigate('ActiveGoal');
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const pct = getProgressPercent(item);
    const isCompleted = item.isCompleted;
    const isMissed = !isCompleted && Date.now() > item.deadline;

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalMeta}>{formatProgress(item)}</Text>
          </View>
          <View style={[
            styles.badge,
            isCompleted ? styles.badgeDone : isMissed ? styles.badgeFail : styles.badgeActive
          ]}>
            <Text style={[
              styles.badgeText,
              isCompleted ? styles.badgeTextDone : isMissed ? styles.badgeTextFail : styles.badgeTextActive
            ]}>
              {isCompleted ? 'DONE' : isMissed ? 'MISSED' : 'ACTIVE'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBar, {
            width: `${Math.round(pct * 100)}%` as any,
            backgroundColor: isCompleted ? '#CAFF00' : isMissed ? '#FF4444' : '#CAFF00',
          }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      <View style={styles.header}>
        <Text style={styles.appTag}>LOCKIN</Text>
        <Text style={styles.headerTitle}>Your{'\n'}<Text style={styles.accent}>Goals</Text></Text>
      </View>

      {activeGoal && !activeGoal.isCompleted && (
        <TouchableOpacity style={styles.activeGoalBanner} onPress={handleResumeGoal}>
          <View>
            <Text style={styles.activeBannerTag}>ACTIVE GOAL</Text>
            <Text style={styles.activeBannerName}>{activeGoal.name}</Text>
            <Text style={styles.activeBannerProgress}>{formatProgress(activeGoal)}</Text>
          </View>
          <Text style={styles.activeBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalCard}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet.</Text>
            <Text style={styles.emptySubText}>Set one and lock your phone until you earn it back.</Text>
          </View>
        }
      />

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabBtn} onPress={handleNewGoal}>
          <Text style={styles.fabText}>+ SET NEW GOAL</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  appTag: { fontSize: 10, letterSpacing: 4, color: '#444', fontFamily: 'IBMPlexMono-Regular', marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold', lineHeight: 40 },
  accent: { color: '#CAFF00' },
  activeGoalBanner: {
    marginHorizontal: 24, marginBottom: 16,
    backgroundColor: '#1A2200', borderRadius: 16,
    borderWidth: 1, borderColor: '#2A3800',
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  activeBannerTag: { fontSize: 9, letterSpacing: 3, color: '#CAFF00', fontFamily: 'IBMPlexMono-Regular', marginBottom: 4 },
  activeBannerName: { fontSize: 14, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold' },
  activeBannerProgress: { fontSize: 11, color: '#6A8800', fontFamily: 'IBMPlexMono-Regular', marginTop: 2 },
  activeBannerArrow: { fontSize: 20, color: '#CAFF00' },
  list: { flex: 1, paddingHorizontal: 24 },
  goalCard: {
    backgroundColor: '#161616', borderRadius: 16,
    borderWidth: 1, borderColor: '#222',
    padding: 16, marginBottom: 10,
  },
  goalCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  goalName: { fontSize: 13, fontWeight: '700', color: '#F0F0F0', fontFamily: 'IBMPlexMono-Bold' },
  goalMeta: { fontSize: 10, color: '#555', fontFamily: 'IBMPlexMono-Regular', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeDone: { backgroundColor: '#1A2A00' },
  badgeFail: { backgroundColor: '#2A1010' },
  badgeActive: { backgroundColor: '#1A1A00' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, fontFamily: 'IBMPlexMono-Bold' },
  badgeTextDone: { color: '#CAFF00' },
  badgeTextFail: { color: '#FF4444' },
  badgeTextActive: { color: '#FFAA00' },
  progressBarWrap: { marginTop: 12, backgroundColor: '#222', borderRadius: 3, height: 3 },
  progressBar: { height: 3, borderRadius: 3 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#444', fontFamily: 'IBMPlexMono-Bold' },
  emptySubText: { fontSize: 11, color: '#333', fontFamily: 'IBMPlexMono-Regular', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  fab: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  fabBtn: { backgroundColor: '#CAFF00', borderRadius: 16, padding: 16, alignItems: 'center' },
  fabText: { color: '#0C0C0C', fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'IBMPlexMono-Bold' },
});
