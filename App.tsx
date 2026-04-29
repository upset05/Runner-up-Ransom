import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';
import ActiveGoalScreen from './src/screens/ActiveGoalScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GoalStore from './src/store/GoalStore';

const Stack = createStackNavigator();
const ONBOARDING_KEY = 'ransom_onboarding_done';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    determineInitialRoute();
  }, []);

  const determineInitialRoute = async () => {
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) { setInitialRoute('Onboarding'); return; }

      const active = await GoalStore.getActive();
      if (active && !active.isCompleted) { setInitialRoute('ActiveGoal'); return; }

      setInitialRoute('Home');
    } catch {
      setInitialRoute('Onboarding');
    }
  };

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, gestureEnabled: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
        <Stack.Screen name="ActiveGoal" component={ActiveGoalScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
