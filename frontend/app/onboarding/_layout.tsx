import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="download-models" />
      <Stack.Screen name="guardrails" />
    </Stack>
  );
}
