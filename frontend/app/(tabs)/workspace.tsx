import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import { Card } from '../../src/components/ui/Card';

export default function WorkspaceScreen() {
  const theme = Colors.dark;
  const { workspaceItems, togglePin, removeWorkspaceItem, conversations } = useAppStore();

  // Auto-populate workspace from conversations
  const items = workspaceItems.length > 0 ? workspaceItems : conversations.flatMap((c) =>
    c.messages.filter((m) => m.role === 'assistant' && m.content.length > 100).map((m) => ({
      id: m.id,
      title: c.title,
      content: m.content.substring(0, 200) + '...',
      type: 'answer' as const,
      pinned: false,
      tags: ['from-chat'],
      createdAt: m.timestamp,
    }))
  );

  const pinned = items.filter((i) => i.pinned);
  const recent = items.filter((i) => !i.pinned);

  const typeIcon = (t: string) => t === 'research' ? 'flask-outline' : t === 'task_output' ? 'document-text-outline' : t === 'note' ? 'create-outline' : 'chatbubble-outline';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="workspace-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Workspace</Text>
        <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
          <Text style={[styles.badgeText, { color: theme.accent }]}>{items.length} items</Text>
        </View>
      </View>

      <FlatList
        data={[...(pinned.length > 0 ? [{ id: 'pinned-header', isHeader: true, label: 'Pinned' }] : []), ...pinned.map((i) => ({ ...i, isHeader: false })), ...(recent.length > 0 ? [{ id: 'recent-header', isHeader: true, label: 'Recent' }] : []), ...recent.map((i) => ({ ...i, isHeader: false }))]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={theme.textFaint} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Workspace Empty</Text>
            <Text style={[styles.emptyDesc, { color: theme.textFaint }]}>Outputs from Ask and Task will appear here. Save important results for easy access.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if ((item as any).isHeader) {
            return (
              <Text style={[styles.sectionTitle, { color: theme.textFaint }]}>{(item as any).label}</Text>
            );
          }
          const w = item as any;
          return (
            <Card testID={`workspace-item-${w.id}`} style={{ marginBottom: Spacing.sm }}>
              <View style={styles.itemHeader}>
                <Ionicons name={typeIcon(w.type) as any} size={18} color={theme.accent} />
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>{w.title}</Text>
                <TouchableOpacity onPress={() => togglePin(w.id)}>
                  <Ionicons name={w.pinned ? 'bookmark' : 'bookmark-outline'} size={18} color={w.pinned ? theme.accent : theme.textFaint} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.itemContent, { color: theme.textSecondary }]} numberOfLines={3}>{w.content}</Text>
              {w.tags?.length > 0 && (
                <View style={styles.tags}>
                  {w.tags.map((t: string) => (
                    <View key={t} style={[styles.tag, { backgroundColor: theme.accentMuted }]}>
                      <Text style={[styles.tagText, { color: theme.accent }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1 },
  headerTitle: { ...Typography.sectionHeading },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  badgeText: { ...Typography.micro, fontWeight: '600' },
  list: { padding: Spacing.lg },
  empty: { alignItems: 'center', marginTop: Spacing['6xl'], gap: Spacing.md },
  emptyTitle: { ...Typography.subheading },
  emptyDesc: { ...Typography.body, textAlign: 'center', paddingHorizontal: Spacing['3xl'] },
  sectionTitle: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemTitle: { ...Typography.subheading, flex: 1 },
  itemContent: { ...Typography.caption, marginTop: Spacing.sm, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  tagText: { ...Typography.micro },
});
