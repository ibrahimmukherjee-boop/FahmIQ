import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore, generateId } from '../../src/store/appStore';
import { Card } from '../../src/components/ui/Card';

export default function AutomateScreen() {
  const theme = Colors.dark;
  const { automations, addAutomation, toggleAutomation, removeAutomation } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');

  const createRule = () => {
    if (!name.trim() || !trigger.trim() || !action.trim()) return;
    addAutomation({
      id: generateId(),
      name: name.trim(),
      trigger: trigger.trim(),
      action: action.trim(),
      enabled: true,
      runs: 0,
    });
    setName('');
    setTrigger('');
    setAction('');
    setShowNew(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="automate-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Automate</Text>
        <TouchableOpacity testID="new-automation-btn" onPress={() => setShowNew(!showNew)} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
          <Ionicons name={showNew ? 'close' : 'add'} size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={[styles.newRule, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <TextInput testID="automation-name-input" style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} value={name} onChangeText={setName} placeholder="Rule name" placeholderTextColor={theme.textFaint} />
          <TextInput testID="automation-trigger-input" style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} value={trigger} onChangeText={setTrigger} placeholder="Trigger (e.g., 'Every morning at 9am')" placeholderTextColor={theme.textFaint} />
          <TextInput testID="automation-action-input" style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} value={action} onChangeText={setAction} placeholder="Action (e.g., 'Summarize my inbox')" placeholderTextColor={theme.textFaint} />
          <TouchableOpacity testID="create-automation-btn" onPress={createRule} style={[styles.createBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.createBtnText}>Create Automation</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={automations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flash-outline" size={48} color={theme.textFaint} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No Automations</Text>
            <Text style={[styles.emptyDesc, { color: theme.textFaint }]}>Create rules to automate repetitive AI tasks. Set triggers and let FahmIQ work independently.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card testID={`automation-card-${item.id}`} style={{ marginBottom: Spacing.md }}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleTitleRow}>
                <Ionicons name="flash" size={18} color={item.enabled ? theme.accent : theme.textFaint} />
                <Text style={[styles.ruleName, { color: theme.textPrimary }]}>{item.name}</Text>
              </View>
              <Switch
                testID={`toggle-automation-${item.id}`}
                value={item.enabled}
                onValueChange={() => toggleAutomation(item.id)}
                trackColor={{ false: theme.border, true: theme.accentMuted }}
                thumbColor={item.enabled ? theme.accent : theme.textFaint}
              />
            </View>
            <View style={styles.ruleDetails}>
              <View style={styles.ruleRow}>
                <Text style={[styles.ruleLabel, { color: theme.textFaint }]}>Trigger:</Text>
                <Text style={[styles.ruleValue, { color: theme.textSecondary }]}>{item.trigger}</Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={[styles.ruleLabel, { color: theme.textFaint }]}>Action:</Text>
                <Text style={[styles.ruleValue, { color: theme.textSecondary }]}>{item.action}</Text>
              </View>
            </View>
            <View style={styles.ruleFooter}>
              <Text style={[styles.runs, { color: theme.textFaint }]}>{item.runs} runs</Text>
              <TouchableOpacity onPress={() => removeAutomation(item.id)}>
                <Text style={[styles.deleteText, { color: theme.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1 },
  headerTitle: { ...Typography.sectionHeading },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  newRule: { margin: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.md },
  input: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: 15 },
  createBtn: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  list: { padding: Spacing.lg },
  empty: { alignItems: 'center', marginTop: Spacing['6xl'], gap: Spacing.md },
  emptyTitle: { ...Typography.subheading },
  emptyDesc: { ...Typography.body, textAlign: 'center', paddingHorizontal: Spacing['3xl'] },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ruleName: { ...Typography.subheading },
  ruleDetails: { marginTop: Spacing.md, gap: Spacing.sm },
  ruleRow: { flexDirection: 'row', gap: Spacing.sm },
  ruleLabel: { ...Typography.caption, width: 60 },
  ruleValue: { ...Typography.caption, flex: 1 },
  ruleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  runs: { ...Typography.micro },
  deleteText: { ...Typography.caption, fontWeight: '500' },
});
