import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import Button from '../../src/components/ui/Button';

export default function GuardrailsOnboarding() {
  const router = useRouter();
  const theme = Colors.dark;
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);

  const guardrails = [
    { icon: 'warning', title: 'Anti-Sycophancy', desc: 'FahmIQ will NOT tell you what you want to hear. It tells you what is true, even when uncomfortable.' },
    { icon: 'shield', title: 'Adversarial Review', desc: 'Every response passes through a Critic agent that actively tries to find errors and weak reasoning.' },
    { icon: 'analytics', title: 'Confidence Scoring', desc: 'All answers include honest confidence scores. "I don\'t know" is a valid answer.' },
    { icon: 'alert-circle', title: 'Responsibility', desc: 'FahmIQ adds appropriate disclaimers for medical, legal, and financial queries.' },
  ];

  const handleComplete = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)/ask');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="guardrails-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(248,113,113,0.12)' }]}>
          <Ionicons name="shield-half" size={40} color={theme.error} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Guardrails</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          FahmIQ is designed to be more honest than other AI assistants. Here's how:
        </Text>

        {guardrails.map((g, i) => (
          <View key={i} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <Ionicons name={g.icon as any} size={24} color={g.icon === 'warning' ? theme.warning : theme.accent} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{g.title}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{g.desc}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.quoteCard, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.quote, { color: theme.textSecondary }]}>
            "A wrong confident answer is worse than an honest 'I don't know.'"
          </Text>
          <Text style={[styles.quoteAttr, { color: theme.textFaint }]}>— FahmIQ Design Philosophy</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button testID="guardrails-complete-btn" title="Start Using FahmIQ" onPress={handleComplete} />
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
  quoteCard: { padding: Spacing.lg, borderRadius: Radius.lg, width: '100%', marginTop: Spacing.md },
  quote: { ...Typography.body, fontStyle: 'italic', textAlign: 'center' },
  quoteAttr: { ...Typography.micro, textAlign: 'center', marginTop: Spacing.sm },
  footer: { padding: Spacing['2xl'] },
});
