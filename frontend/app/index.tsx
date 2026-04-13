import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import FahmIQLogoAnimated from '../src/components/FahmIQLogoAnimated';
import { Colors } from '../src/design/tokens';

export default function Index() {
  const router = useRouter();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onboardingComplete) {
        router.replace('/(tabs)/ask');
      } else {
        router.replace('/onboarding');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [onboardingComplete]);

  return (
    <View style={styles.container} testID="splash-screen">
      <FahmIQLogoAnimated size={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
