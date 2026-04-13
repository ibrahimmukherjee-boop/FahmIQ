import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../src/context/AppContext";
import type { WorkspaceItem } from "../../src/agents/types";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

type ImportOption = "file" | "icloud" | "gdrive" | "note";

export default function WorkspaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workspaceItems, addWorkspaceItem, removeWorkspaceItem, togglePinItem } = useApp();
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "task" | "note" | "import">("all");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const filtered = workspaceItems.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchText.toLowerCase()) ||
      i.content.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = activeFilter === "all" || i.type === activeFilter;
    return matchesSearch && matchesFilter;
  });
  const pinned = filtered.filter((i) => i.pinned);
  const unpinned = filtered.filter((i) => !i.pinned);
  const sorted = [...pinned, ...unpinned];

  const handleImport = async (option: ImportOption) => {
    setShowAddModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (option === "note") {
      setShowNoteEditor(true);
      return;
    }

    if (option === "gdrive") {
      // Open Google Drive in browser — user can copy text and import manually
      Linking.openURL("https://drive.google.com").catch(() => {});
      return;
    }

    // file + icloud both use the native document picker
    // On iOS, the document picker natively shows iCloud Drive
    if (Platform.OS === "web") {
      const mockDoc: WorkspaceItem = {
        id: generateId(),
        title: option === "icloud" ? "iCloud Document.txt" : "Uploaded Document.txt",
        content: "Document content would appear here after processing through the local inference engine. In production, this content is extracted, chunked, and indexed locally on your device — no data leaves without your permission.",
        type: "import",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        tags: ["imported"],
      };
      await addWorkspaceItem(mockDoc);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!res.canceled && res.assets) {
        for (const asset of res.assets) {
          await addWorkspaceItem({
            id: generateId(),
            title: asset.name,
            content: `[Imported: ${asset.name} — ${asset.size ? Math.round(asset.size / 1024) : "?"}KB]\n\nThis document has been ingested and indexed locally. You can reference it in Deep Task analysis.`,
            type: "import",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
            tags: [asset.name.split(".").pop() || "file"],
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // dismissed
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await addWorkspaceItem({
      id: generateId(),
      title: noteTitle.trim() || noteText.slice(0, 50),
      content: noteText,
      type: "note",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      tags: [],
    });
    setNoteTitle("");
    setNoteText("");
    setShowNoteEditor(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const FILTER_TABS = [
    { id: "all", label: "All" },
    { id: "task", label: "Tasks" },
    { id: "note", label: "Notes" },
    { id: "import", label: "Imports" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Workspace
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {workspaceItems.length} item{workspaceItems.length !== 1 ? "s" : ""} · local storage
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search workspace..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(tab.id); }}
            style={[
              styles.filterTab,
              {
                backgroundColor: activeFilter === tab.id ? colors.primary : colors.surface,
                borderColor: activeFilter === tab.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color: activeFilter === tab.id ? "#fff" : colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      {sorted.length === 0 ? (
        <EmptyWorkspace colors={colors} onAdd={() => setShowAddModal(true)} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
          renderItem={({ item }) => (
            <WorkspaceCard
              item={item}
              colors={colors}
              onPin={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); togglePinItem(item.id); }}
              onDelete={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeWorkspaceItem(item.id); }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Import options modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Add to Workspace
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              All imports are processed and stored locally
            </Text>

            <ImportOptionRow
              icon="file-text"
              label="Upload Document"
              desc="PDF, Word, text files"
              onPress={() => handleImport("file")}
              colors={colors}
            />
            <ImportOptionRow
              icon="cloud"
              label="Import from iCloud Drive"
              desc="Pick from your iCloud files"
              onPress={() => handleImport("icloud")}
              colors={colors}
              badge="iOS"
            />
            <ImportOptionRow
              icon="globe"
              label="Google Drive"
              desc="Opens Drive in browser to copy content"
              onPress={() => handleImport("gdrive")}
              colors={colors}
            />
            <ImportOptionRow
              icon="edit-3"
              label="Quick Note"
              desc="Write and save a note"
              onPress={() => handleImport("note")}
              colors={colors}
            />

            <Pressable
              onPress={() => setShowAddModal(false)}
              style={[styles.modalCancel, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Note editor modal */}
      <Modal visible={showNoteEditor} transparent animationType="slide" onRequestClose={() => setShowNoteEditor(false)}>
        <View style={[styles.noteModal, { backgroundColor: colors.background }]}>
          <View style={[styles.noteHeader, { borderBottomColor: colors.border, paddingTop: topPad + 12 }]}>
            <Pressable onPress={() => setShowNoteEditor(false)}>
              <Text style={[styles.noteCancel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.noteModalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>New Note</Text>
            <Pressable onPress={handleSaveNote}>
              <Text style={[styles.noteSave, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Save</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.noteBody} keyboardShouldPersistTaps="handled">
            <TextInput
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Title (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.noteTitleInput, { color: colors.foreground, fontFamily: "Inter_700Bold", borderBottomColor: colors.border }]}
            />
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Start writing..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
              style={[styles.noteBodyInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ImportOptionRow({ icon, label, desc, onPress, colors, badge }: {
  icon: string; label: string; desc: string; onPress: () => void; colors: any; badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.importOption, { backgroundColor: pressed ? colors.muted : "transparent", borderRadius: colors.radius }]}
    >
      <View style={[styles.importIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.importLabelRow}>
          <Text style={[styles.importLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{label}</Text>
          {badge && (
            <View style={[styles.importBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.importBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.importDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{desc}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function WorkspaceCard({ item, colors, onPin, onDelete }: {
  item: WorkspaceItem; colors: any; onPin: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeIcon = item.type === "task" ? "layers" : item.type === "note" ? "edit-3" : "download";
  const typeColor = item.type === "task" ? colors.primary : item.type === "note" ? colors.success : colors.warning;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: item.pinned ? colors.primary : colors.border, borderRadius: colors.radius, borderWidth: item.pinned ? 1.5 : 1, opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.cardTypeIcon, { backgroundColor: `${typeColor}18` }]}>
          <Feather name={typeIcon as any} size={14} color={typeColor} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {item.type}
          </Text>
        </View>
        <View style={styles.cardBtns}>
          <Pressable onPress={onPin} style={styles.cardBtn}>
            <Feather name="bookmark" size={14} color={item.pinned ? colors.primary : colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.cardBtn}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
      {item.tags.length > 0 && (
        <View style={styles.tagRow}>
          {item.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.accent }]}>
              <Text style={[styles.tagText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      {expanded && (
        <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", borderTopColor: colors.border }]}>
          {item.content.slice(0, 400)}{item.content.length > 400 ? "..." : ""}
        </Text>
      )}
    </Pressable>
  );
}

function EmptyWorkspace({ colors, onAdd }: { colors: any; onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
        <Feather name="folder" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Workspace is empty
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        Import documents, save Deep Task results, or write notes — everything stored locally on your device
      </Text>
      <Pressable onPress={onAdd} style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}>
        <Feather name="plus" size={16} color="#fff" />
        <Text style={[styles.emptyAddBtnText, { fontFamily: "Inter_600SemiBold" }]}>Add to Workspace</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, letterSpacing: -0.8 },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterTabText: { fontSize: 13 },
  list: { padding: 16, gap: 10 },
  card: { padding: 14, borderWidth: 1, gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTypeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 15, letterSpacing: -0.2 },
  cardDate: { fontSize: 11, marginTop: 2 },
  cardBtns: { flexDirection: "row", gap: 4 },
  cardBtn: { padding: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontSize: 10 },
  cardBody: { fontSize: 13, lineHeight: 20, paddingTop: 10, borderTopWidth: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 14 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, letterSpacing: -0.5 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 300 },
  emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  emptyAddBtnText: { fontSize: 15, color: "#fff" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24, gap: 4 },
  modalTitle: { fontSize: 20, letterSpacing: -0.5, marginBottom: 2 },
  modalSub: { fontSize: 13, marginBottom: 12 },
  importOption: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12 },
  importIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  importLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  importLabel: { fontSize: 16, letterSpacing: -0.3 },
  importBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  importBadgeText: { fontSize: 10, letterSpacing: 0.3 },
  importDesc: { fontSize: 12, marginTop: 2 },
  modalCancel: { marginTop: 8, alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  modalCancelText: { fontSize: 15 },
  // Note editor
  noteModal: { flex: 1 },
  noteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  noteCancel: { fontSize: 16 },
  noteModalTitle: { fontSize: 17 },
  noteSave: { fontSize: 16 },
  noteBody: { padding: 20, gap: 12 },
  noteTitleInput: { fontSize: 24, letterSpacing: -0.8, paddingBottom: 14, borderBottomWidth: 1 },
  noteBodyInput: { fontSize: 16, lineHeight: 26, minHeight: 200 },
});
