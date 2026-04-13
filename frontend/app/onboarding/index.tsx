import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import FahmIQLogoAnimated from '../../src/components/FahmIQLogoAnimated';
import Button from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');
const ASTRO_IMAGE = 'https://images.unsplash.com/photo-1712512162273-2a622d8b0c74?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwzfHxhc3Ryb25hdXQlMjBsb29raW5nJTIwaW50byUyMHNwYWNlJTIwY29zbW9zfGVufDB8fHx8MTc3NjEwNzQwOHww&ixlib=rb-4.1.0&q=85';

export default function OnboardingIndex() {
  const router = useRouter();
  const theme = Colors.dark;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="onboarding-screen">
      <Image source={{ uri: ASTRO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <FahmIQLogoAnimated size={72} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>FahmIQ</Text>
        <Text style={[styles.tagline, { color: theme.accent }]}>Think clearly. Stay private.</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          A rigorous thinking tool for professionals. Multi-agent AI reasoning — running entirely on your device. No cloud. No data collection. No sycophancy.
        </Text>
        <View style={styles.features}>
          {[
            { icon: 'shield-checkmark', label: '100% On-Device AI' },
            { icon: 'layers', label: '7-Agent Pipeline' },
            { icon: 'eye-off', label: 'Zero Data Collection' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: theme.accentMuted }]}>
                <Text style={{ color: theme.accent, fontSize: 16 }}>
                  {f.icon === 'shield-checkmark' ? '🛡' : f.icon === 'layers' ? '🧠' : '👁'}
                </Text>
              </View>
              <Text style={[styles.featureText, { color: theme.textPrimary }]}>{f.label}</Text>
            </View>
          ))}
        </View>
        <Button testID="onboarding-continue-btn" title="Get Started" onPress={() => router.push('/onboarding/privacy')} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { position: 'absolute', top: 0, left: 0, width, height: '50%', opacity: 0.3 },
  overlay: { position: 'absolute', top: 0, left: 0, width, height: '50%', backgroundColor: 'rgba(12,12,16,0.6)' },
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: Spacing['3xl'], paddingBottom: Spacing['5xl'] },
  title: { ...Typography.heroTitle, fontSize: 36, marginTop: Spacing.lg },
  tagline: { ...Typography.subheading, marginTop: Spacing.xs },
  desc: { ...Typography.body, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 22 },
  features: { marginTop: Spacing['2xl'], width: '100%', gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  featureText: { ...Typography.body, fontWeight: '500' },
  btn: { marginTop: Spacing['3xl'], width: '100%' },
});
