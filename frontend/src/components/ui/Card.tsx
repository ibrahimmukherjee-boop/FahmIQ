import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../design/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
  testID?: string;
}

export function Card({ children, style, dark = true, testID }: CardProps) {
  const theme = dark ? Colors.dark : Colors.light;
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

interface BadgeProps {
  label: string;
  color?: string;
  dark?: boolean;
}

export function Badge({ label, color, dark = true }: BadgeProps) {
  const theme = dark ? Colors.dark : Colors.light;
  const bg = color || theme.accentMuted;
  const txtColor = color ? '#FFFFFF' : theme.accent;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: txtColor }]}>{label}</Text>
    </View>
  );
}

interface ConfidenceMeterProps {
  value: number;
  dark?: boolean;
}

export function ConfidenceMeter({ value, dark = true }: ConfidenceMeterProps) {
  const theme = dark ? Colors.dark : Colors.light;
  const color = value >= 80 ? theme.success : value >= 60 ? theme.warning : theme.error;
  return (
    <View style={styles.meterContainer}>
      <View style={[styles.meterTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.meterFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.meterText, { color }]}>{value}%</Text>
    </View>
  );
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  dark?: boolean;
}

export function Skeleton({ width = '100%', height = 16, dark = true }: SkeletonProps) {
  const theme = dark ? Colors.dark : Colors.light;
  return <View style={[styles.skeleton, { width: width as any, height, backgroundColor: theme.surfaceElevated }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.micro,
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  meterTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  meterText: {
    ...Typography.micro,
    width: 36,
    textAlign: 'right',
  },
  skeleton: {
    borderRadius: Radius.sm,
    opacity: 0.5,
  },
});
