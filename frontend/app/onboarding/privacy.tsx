import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import Button from '../../src/components/ui/Button';

export default function PrivacyOnboarding() {
  const router = useRouter();
  const theme = Colors.dark;

  const items = [
    { icon: 'lock-closed', title: 'No Cloud Processing', desc: 'All AI inference runs on your iPhone. Your data never leaves your device.' },
    { icon: 'eye-off', title: 'No Data Collection', desc: 'FahmIQ collects zero analytics, zero telemetry, zero usage data.' },
    { icon: 'server', title: 'No External APIs', desc: 'No OpenAI, no Anthropic, no Google. Only on-device models and optional web search.' },
    { icon: 'trash', title: 'You Own Your Data', desc: 'All conversations, tasks, and outputs are stored locally. Delete anytime.' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="privacy-onboarding">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}>
          <Ionicons name="shield-checkmark" size={40} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Privacy First</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>FahmIQ is built for people who take privacy seriously.</Text>

        {items.map((item, i) => (
          <View key={i} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <Ionicons name={item.icon as any} size={24} color={theme.accent} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button testID="privacy-continue-btn" title="I Understand — Continue" onPress={() => router.push('/onboarding/download-models')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing['2xl'], paddingTop: Spacing['4xl'], alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.heroTitle, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing['2xl'] },
  card: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, width: '100%', marginBottom: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { ...Typography.subheading, marginBottom: 4 },
  cardDesc: { ...Typography.caption, lineHeight: 18 },
  footer: { padding: Spacing['2xl'] },
});
