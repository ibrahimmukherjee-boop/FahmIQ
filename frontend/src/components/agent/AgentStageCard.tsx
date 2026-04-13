import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '../../design/tokens';

interface Props {
  agent: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  summary?: string;
  confidence?: number;
  dark?: boolean;
}

const AGENT_ICONS: Record<string, string> = {
  Scout: 'search-outline',
  Planner: 'map-outline',
  Researcher: 'globe-outline',
  Worker: 'hammer-outline',
  Critic: 'shield-checkmark-outline',
  Validator: 'checkmark-done-outline',
  Synthesizer: 'layers-outline',
  Judge: 'ribbon-outline',
};

const AGENT_COLORS: Record<string, string> = {
  Scout: '#60A5FA',
  Planner: '#A78BFA',
  Researcher: '#34D399',
  Worker: '#FBBF24',
  Critic: '#F87171',
  Validator: '#2DD4BF',
  Synthesizer: '#818CF8',
  Judge: '#FB923C',
};

export default function AgentStageCard({ agent, status, summary, confidence, dark = true }: Props) {
  const theme = dark ? Colors.dark : Colors.light;
  const icon = AGENT_ICONS[agent] || 'cube-outline';
  const color = AGENT_COLORS[agent] || theme.accent;

  return (
    <View testID={`agent-stage-${agent.toLowerCase()}`} style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: status === 'running' ? color : theme.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
        {status === 'running' ? (
          <View style={[styles.pulse, { backgroundColor: color }]} />
        ) : (
          <Ionicons name={icon as any} size={18} color={color} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.agentName, { color: theme.textPrimary }]}>{agent}</Text>
          <View style={[styles.statusDot, {
            backgroundColor: status === 'complete' ? theme.success
              : status === 'running' ? theme.warning
              : status === 'error' ? theme.error
              : theme.textFaint,
          }]} />
        </View>
        {summary ? (
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>{summary}</Text>
        ) : status === 'running' ? (
          <Text style={[styles.summary, { color: theme.textFaint }]}>Processing...</Text>
        ) : null}
        {confidence !== undefined && status === 'complete' && (
          <View style={styles.confRow}>
            <View style={[styles.confTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.confFill, {
                width: `${confidence}%`,
                backgroundColor: confidence >= 80 ? theme.success : confidence >= 60 ? theme.warning : theme.error,
              }]} />
            </View>
            <Text style={[styles.confText, { color: theme.textFaint }]}>{confidence}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.8,
  },
  content: { flex: 1, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agentName: { ...Typography.subheading },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  summary: { ...Typography.caption },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  confTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 2 },
  confText: { ...Typography.micro, width: 32 },
});
