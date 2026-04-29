import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'ransom_onboarding_done';

const STEPS = [
  {
    icon: '🔒',
    tag: 'WELCOME',
    title: 'Your phone,\nheld ',
    accent: 'hostage.',
    body: 'Set a goal. Your phone locks until you complete it. Walk 2km. Focus for 90 minutes. Finish your checklist. No goal, no phone.',
  },
  {
    icon: '🎯',
    tag: 'HOW IT WORKS',
    title: 'Set a goal.\n',
    accent: 'Earn your phone.',
    body: 'Choose your goal type — distance, focus time, or a checklist. Set your target and when the lock kicks in. Start the goal and put your phone down.',
  },
  {
    icon: '💪',
    tag: 'READY',
    title: 'Stop scrolling.\n',
    accent: 'Start doing.',
    body: 'Every minute you spend on your phone is time you could spend on something real. Set your first goal and take back control.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      navigation.replace('Home');
    }
  };

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{current.icon}</Text>
        </View>

        <Text style={styles.tag}>{current.tag}</Text>
        <Text style={styles.title}>
          {current.title}<Text style={styles.accent}>{current.accent}</Text>
        </Text>
        <Text style={styles.body}>{current.body}</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {step < STEPS.length - 1 ? 'NEXT →' : 'SET MY FIRST GOAL →'}
          </Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#222' },
  dotActive: { width: 24, backgroundColor: '#CAFF00', borderRadius: 3 },
  dotDone: { backgroundColor: '#3A5500' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#161616', borderWidth: 1, borderColor: '#222',
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  icon: { fontSize: 34 },
  tag: { fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '700', color: '#F0F0F0', lineHeight: 40, marginBottom: 20 },
  accent: { color: '#CAFF00' },
  body: { fontSize: 15, color: '#666', lineHeight: 24 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40 },
  nextBtn: { backgroundColor: '#CAFF00', borderRadius: 16, padding: 18, alignItems: 'center' },
  nextBtnText: { color: '#0C0C0C', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  skipBtn: { marginTop: 14, padding: 10, alignItems: 'center' },
  skipText: { fontSize: 10, color: '#333', letterSpacing: 2 },
});
