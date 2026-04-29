import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import GoalStore from '../store/GoalStore';
import { Goal, formatProgress, getProgressPercent } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const loadGoals = async () => {
    const all = await GoalStore.getAll();
    setGoals([...all].reverse());
    const active = await GoalStore.getActive();
    setActiveGoal(active);
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const pct = getProgressPercent(item);
    const isMissed = !item.isCompleted && Date.now() > item.deadline;

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalMeta}>{formatProgress(item)}</Text>
          </View>
          <View style={[
            styles.badge,
            item.isCompleted ? styles.badgeDone : isMissed ? styles.badgeFail : styles.badgeActive
          ]}>
            <Text style={[
              styles.badgeText,
              item.isCompleted ? styles.badgeTextDone : isMissed ? styles.badgeTextFail : styles.badgeTextActive
            ]}>
              {item.isCompleted ? 'DONE' : isMissed ? 'MISSED' : 'ACTIVE'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBar, {
            width: `${Math.round(pct * 100)}%` as any,
            backgroundColor: item.isCompleted ? '#CAFF00' : isMissed ? '#FF4444' : '#CAFF00',
          }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      <View style={styles.header}>
        <Text style={styles.appTag}>RUNNER UP RANSOM</Text>
        <Text style={styles.headerTitle}>Your{'\n'}<Text style={styles.accent}>Goals</Text></Text>
      </View>

      {activeGoal && !activeGoal.isCompleted && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('ActiveGoal')}
        >
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
        keyExtractor={item => item.id}
        renderItem={renderGoalCard}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet.</Text>
            <Text style={styles.emptySubText}>Set one and lock your phone{'\n'}until you earn it back.</Text>
          </View>
        }
      />

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabBtn} onPress={() => navigation.navigate('CreateGoal')}>
          <Text style={styles.fabText}>+ SET NEW GOAL</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  appTag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '700', color: '#F0F0F0', lineHeight: 40 },
  accent: { color: '#CAFF00' },
  activeBanner: {
    marginHorizontal: 24, marginBottom: 16,
    backgroundColor: '#1A2200', borderRadius: 16,
    borderWidth: 1, borderColor: '#2A3800',
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  activeBannerTag: { fontSize: 9, letterSpacing: 3, color: '#CAFF00', marginBottom: 4 },
  activeBannerName: { fontSize: 14, fontWeight: '700', color: '#F0F0F0' },
  activeBannerProgress: { fontSize: 11, color: '#6A8800', marginTop: 2 },
  activeBannerArrow: { fontSize: 20, color: '#CAFF00' },
  list: { flex: 1, paddingHorizontal: 24 },
  goalCard: {
    backgroundColor: '#161616', borderRadius: 16,
    borderWidth: 1, borderColor: '#222',
    padding: 16, marginBottom: 10,
  },
  goalCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  goalName: { fontSize: 13, fontWeight: '700', color: '#F0F0F0' },
  goalMeta: { fontSize: 10, color: '#555', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeDone: { backgroundColor: '#1A2A00' },
  badgeFail: { backgroundColor: '#2A1010' },
  badgeActive: { backgroundColor: '#1A1A00' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  badgeTextDone: { color: '#CAFF00' },
  badgeTextFail: { color: '#FF4444' },
  badgeTextActive: { color: '#FFAA00' },
  progressBarWrap: { marginTop: 12, backgroundColor: '#222', borderRadius: 3, height: 3 },
  progressBar: { height: 3, borderRadius: 3 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#444', fontWeight: '700' },
  emptySubText: { fontSize: 11, color: '#333', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  fab: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  fabBtn: { backgroundColor: '#CAFF00', borderRadius: 16, padding: 16, alignItems: 'center' },
  fabText: { color: '#0C0C0C', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
