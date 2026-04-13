import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import { MODEL_SIZES } from '../../src/agents/providers/LocalMLCProvider';
import Button from '../../src/components/ui/Button';

const BANDS = [
  { key: 'fast', name: 'Fast', model: 'Qwen 0.5B', desc: 'Quick analysis & classification', required: true },
  { key: 'balanced', name: 'Balanced', model: 'Qwen 1.5B', desc: 'Main reasoning & generation', required: true },
  { key: 'precision', name: 'Precision', model: 'Qwen 3B', desc: 'High-accuracy deep analysis', required: false },
];

export default function DownloadModels() {
  const router = useRouter();
  const theme = Colors.dark;
  const { modelsDownloaded, setModelDownloaded } = useAppStore();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const downloadModel = async (band: string) => {
    setDownloading(band);
    // Simulate download progress (real download happens via MLC engine on device)
    for (let p = 0; p <= 100; p += Math.random() * 15 + 5) {
      setProgress((prev) => ({ ...prev, [band]: Math.min(p, 100) }));
      await new Promise((r) => setTimeout(r, 200));
    }
    setProgress((prev) => ({ ...prev, [band]: 100 }));
    setModelDownloaded(band, true);
    setDownloading(null);
  };

  const requiredDone = BANDS.filter((b) => b.required).every((b) => modelsDownloaded[b.key]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="download-models-screen">
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}>
          <Ionicons name="cloud-download" size={40} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Download Models</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Download AI models to your device for fully private, offline inference. Models only need to be downloaded once.
        </Text>

        <View style={styles.models}>
          {BANDS.map((band) => {
            const done = modelsDownloaded[band.key];
            const isDownloading = downloading === band.key;
            const prog = progress[band.key] || 0;

            return (
              <TouchableOpacity
                key={band.key}
                testID={`download-${band.key}`}
                style={[styles.modelCard, { backgroundColor: theme.surfaceCard, borderColor: done ? theme.success : theme.border }]}
                onPress={() => !done && !isDownloading && downloadModel(band.key)}
                disabled={done || isDownloading}
              >
                <View style={styles.modelHeader}>
                  <View>
                    <View style={styles.modelNameRow}>
                      <Text style={[styles.modelName, { color: theme.textPrimary }]}>{band.name}</Text>
                      {band.required && (
                        <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
                          <Text style={[styles.requiredText, { color: theme.error }]}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.modelId, { color: theme.textFaint }]}>{band.model} • {MODEL_SIZES[band.key]}</Text>
                  </View>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                  ) : isDownloading ? (
                    <ActivityIndicator color={theme.accent} />
                  ) : (
                    <Ionicons name="download-outline" size={24} color={theme.accent} />
                  )}
                </View>
                <Text style={[styles.modelDesc, { color: theme.textSecondary }]}>{band.desc}</Text>
                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                      <View style={[styles.progressFill, { width: `${prog}%`, backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textFaint }]}>{Math.round(prog)}%</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          testID="models-continue-btn"
          title={requiredDone ? 'Continue' : 'Download Required Models First'}
          onPress={() => requiredDone ? router.push('/onboarding/guardrails') : downloadModel(BANDS.find((b) => b.required && !modelsDownloaded[b.key])?.key || 'fast')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing['2xl'], paddingTop: Spacing['4xl'], alignItems: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.heroTitle, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing['2xl'], lineHeight: 22 },
  models: { width: '100%', gap: Spacing.md },
  modelCard: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
  modelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modelName: { ...Typography.subheading },
  requiredBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  requiredText: { ...Typography.micro },
  modelId: { ...Typography.caption, marginTop: 2 },
  modelDesc: { ...Typography.caption, marginTop: Spacing.sm },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { ...Typography.micro, width: 36, textAlign: 'right' },
  footer: { padding: Spacing['2xl'] },
});
