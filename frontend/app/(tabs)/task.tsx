import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore, generateId, DeepTask, TaskStep } from '../../src/store/appStore';
import { Card } from '../../src/components/ui/Card';

export default function TaskScreen() {
  const theme = Colors.dark;
  const { tasks, addTask, updateTask, updateTaskStep } = useAppStore();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const createTask = () => {
    if (!title.trim()) return;
    const steps: TaskStep[] = [
      { id: generateId(), description: 'Research and gather information', status: 'pending' },
      { id: generateId(), description: 'Analyze findings', status: 'pending' },
      { id: generateId(), description: 'Generate comprehensive report', status: 'pending' },
      { id: generateId(), description: 'Review and validate', status: 'pending' },
    ];
    addTask({
      id: generateId(),
      title: title.trim(),
      description: desc.trim(),
      status: 'pending',
      steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setTitle('');
    setDesc('');
    setShowNew(false);
  };

  const runTask = async (task: DeepTask) => {
    updateTask(task.id, { status: 'running' });
    for (const step of task.steps) {
      updateTaskStep(task.id, step.id, { status: 'running', agent: 'Worker' });
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      updateTaskStep(task.id, step.id, {
        status: 'complete',
        output: `Completed: ${step.description}`,
      });
    }
    updateTask(task.id, {
      status: 'complete',
      result: `Task "${task.title}" completed successfully with ${task.steps.length} steps.`,
    });
  };

  const statusColor = (s: string) => s === 'complete' ? theme.success : s === 'running' ? theme.warning : s === 'error' ? theme.error : theme.textFaint;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="task-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Deep Tasks</Text>
        <TouchableOpacity testID="new-task-btn" onPress={() => setShowNew(!showNew)} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
          <Ionicons name={showNew ? 'close' : 'add'} size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={[styles.newTask, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <TextInput testID="task-title-input" style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={theme.textFaint} />
          <TextInput testID="task-desc-input" style={[styles.input, styles.multiInput, { color: theme.textPrimary, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} value={desc} onChangeText={setDesc} placeholder="Describe what you need researched..." placeholderTextColor={theme.textFaint} multiline />
          <TouchableOpacity testID="create-task-btn" onPress={createTask} style={[styles.createBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.createBtnText}>Create Deep Task</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={48} color={theme.textFaint} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No Deep Tasks Yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textFaint }]}>Create multi-step research tasks that run autonomously through the agent pipeline.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card testID={`task-card-${item.id}`} style={{ marginBottom: Spacing.md }}>
            <View style={styles.taskHeader}>
              <View style={styles.taskTitleRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              </View>
              {item.status === 'pending' && (
                <TouchableOpacity testID={`run-task-${item.id}`} onPress={() => runTask(item)} style={[styles.runBtn, { backgroundColor: theme.accentMuted }]}>
                  <Ionicons name="play" size={14} color={theme.accent} />
                  <Text style={[styles.runBtnText, { color: theme.accent }]}>Run</Text>
                </TouchableOpacity>
              )}
            </View>
            {item.description ? <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>{item.description}</Text> : null}
            <View style={styles.steps}>
              {item.steps.map((step, idx) => (
                <View key={step.id} style={styles.stepRow}>
                  <View style={[styles.stepDot, { backgroundColor: statusColor(step.status) }]} />
                  <Text style={[styles.stepText, { color: step.status === 'complete' ? theme.textPrimary : theme.textFaint }]}>{step.description}</Text>
                </View>
              ))}
            </View>
            {item.result && <Text style={[styles.result, { color: theme.success }]}>{item.result}</Text>}
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
  newTask: { margin: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.md },
  input: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: 15 },
  multiInput: { height: 80, textAlignVertical: 'top' },
  createBtn: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  list: { padding: Spacing.lg },
  empty: { alignItems: 'center', marginTop: Spacing['6xl'], gap: Spacing.md },
  emptyTitle: { ...Typography.subheading },
  emptyDesc: { ...Typography.body, textAlign: 'center', paddingHorizontal: Spacing['3xl'] },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  taskTitle: { ...Typography.subheading, flex: 1 },
  taskDesc: { ...Typography.caption, marginTop: Spacing.sm },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  runBtnText: { ...Typography.micro, fontWeight: '600' },
  steps: { marginTop: Spacing.md, gap: Spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  stepText: { ...Typography.caption },
  result: { ...Typography.caption, marginTop: Spacing.md, fontWeight: '500' },
});
