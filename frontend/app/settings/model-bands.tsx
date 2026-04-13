import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import { MODEL_SIZES } from '../../src/agents/providers/LocalMLCProvider';

const BANDS = [
  { key: 'fast', name: 'Fast', model: 'Qwen2.5-0.5B-Instruct', agents: 'Scout, Critic, Validator, PromptIQ', color: '#60A5FA' },
  { key: 'balanced', name: 'Balanced', model: 'Qwen2.5-1.5B-Instruct', agents: 'Worker, Planner, Synthesizer, Judge', color: '#A78BFA' },
  { key: 'precision', name: 'Precision', model: 'Qwen2.5-3B-Instruct', agents: 'Worker (precision), Autonomous Director', color: '#34D399' },
];

export default function ModelBands() {
  const router = useRouter();
  const theme = Colors.dark;
  const { modelsDownloaded } = useAppStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="model-bands-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Model Bands</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          FahmIQ uses three model bands for different tasks. All models run entirely on your device.
        </Text>

        {BANDS.map((band) => {
          const downloaded = modelsDownloaded[band.key];
          return (
            <View key={band.key} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.dot, { backgroundColor: band.color }]} />
                <Text style={[styles.bandName, { color: theme.textPrimary }]}>{band.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: downloaded ? theme.success + '20' : theme.error + '20' }]}>
                  <Text style={[styles.statusText, { color: downloaded ? theme.success : theme.error }]}>
                    {downloaded ? 'Downloaded' : 'Not Downloaded'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.modelId, { color: theme.textFaint }]}>{band.model}</Text>
              <Text style={[styles.modelSize, { color: theme.textFaint }]}>Size: {MODEL_SIZES[band.key]}</Text>
              <Text style={[styles.agents, { color: theme.textSecondary }]}>Agents: {band.agents}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.sectionHeading },
  scroll: { padding: Spacing.lg },
  desc: { ...Typography.body, marginBottom: Spacing['2xl'], lineHeight: 22 },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bandName: { ...Typography.subheading, flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  statusText: { ...Typography.micro },
  modelId: { ...Typography.caption, marginTop: Spacing.sm },
  modelSize: { ...Typography.caption, marginTop: 2 },
  agents: { ...Typography.caption, marginTop: Spacing.sm },
});
