import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import inferenceEngine from '../../src/agents/InferenceEngine';
import FahmIQLogoAnimated from '../../src/components/FahmIQLogoAnimated';

export default function SettingsIndex() {
  const router = useRouter();
  const theme = Colors.dark;
  const { theme: appTheme, setTheme, subscriptionTier } = useAppStore();
  const isDark = appTheme === 'dark' || appTheme === 'system';

  const sections = [
    {
      title: 'AI Engine',
      items: [
        { icon: 'hardware-chip-outline', label: 'Model Bands', desc: 'Configure on-device models', route: '/settings/model-bands' },
        { icon: 'speedometer-outline', label: 'Inference Provider', desc: `Active: ${inferenceEngine.getProviderType() === 'local' ? 'On-Device MLC' : 'Development'}`, disabled: true },
      ],
    },
    {
      title: 'Subscription',
      items: [
        { icon: 'diamond-outline', label: 'Plan', desc: `Current: ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}`, route: '/settings/subscription' },
        { icon: 'receipt-outline', label: 'Restore Purchases', desc: 'Recover existing subscriptions', action: 'restore' },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        { icon: 'shield-checkmark-outline', label: 'Privacy', desc: 'All data stays on your device', disabled: true },
        { icon: 'trash-outline', label: 'Clear All Data', desc: 'Delete conversations, tasks, workspace', action: 'clear', destructive: true },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'Version', desc: '1.0.1 (Build 2)', disabled: true },
        { icon: 'code-outline', label: 'Bundle ID', desc: 'com.seekconsultingltd.fahmiq', disabled: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="settings-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <FahmIQLogoAnimated size={48} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>FahmIQ</Text>
            <Text style={[styles.profileDesc, { color: theme.textSecondary }]}>Think clearly. Stay private.</Text>
          </View>
        </View>

        <View style={[styles.themeRow, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Ionicons name="moon-outline" size={20} color={theme.accent} />
          <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
          <Switch
            testID="theme-toggle"
            value={isDark}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
            trackColor={{ false: theme.border, true: theme.accentMuted }}
            thumbColor={isDark ? theme.accent : theme.textFaint}
          />
        </View>

        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textFaint }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  testID={`settings-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  style={[styles.settingRow, ii < section.items.length - 1 && { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}
                  onPress={() => item.route ? router.push(item.route as any) : null}
                  disabled={item.disabled}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.destructive ? theme.error : theme.accent} />
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, { color: item.destructive ? theme.error : theme.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.settingDesc, { color: theme.textFaint }]}>{item.desc}</Text>
                  </View>
                  {item.route && <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.sectionHeading },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['6xl'] },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing['2xl'] },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.sectionHeading },
  profileDesc: { ...Typography.caption, marginTop: 2 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing['2xl'] },
  themeLabel: { ...Typography.body, flex: 1 },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  sectionCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  settingContent: { flex: 1 },
  settingLabel: { ...Typography.body, fontWeight: '500' },
  settingDesc: { ...Typography.micro, marginTop: 2 },
});
