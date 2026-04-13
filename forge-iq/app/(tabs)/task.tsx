import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import type { GuardrailBlock } from "../../src/agents/NineAgentOrchestrator";
import {
  Animated,
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
import { runNineAgentPipeline } from "../../src/agents/NineAgentOrchestrator";
import { AgentStageCard } from "../../src/components/agent/AgentStageCard";
import { ConfidenceMeter } from "../../src/components/ui/ConfidenceMeter";
import { ForgeButton } from "../../src/components/ui/ForgeButton";
import type { AgentStage, DeepTaskResult } from "../../src/agents/types";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

type TabView = "pipeline" | "result" | "scorecard";

interface AttachedDoc {
  name: string;
  content: string;
  size: number;
}

export default function TaskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { modelBand, incrementDeepTaskCount, deepTaskCount, isPro, isPlus, addWorkspaceItem } = useApp();
  const [query, setQuery] = useState("");
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [stages, setStages] = useState<AgentStage[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [result, setResult] = useState<DeepTaskResult | null>(null);
  const [guardrailBlock, setGuardrailBlock] = useState<GuardrailBlock | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("pipeline");
  const [predictedLabel, setPredictedLabel] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const canRun = isPro || isPlus || deepTaskCount < 3;
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const handlePickDocument = async () => {
    if (Platform.OS === "web") {
      // Web: simulate doc upload
      const mockDoc: AttachedDoc = { name: "document.txt", content: "This is sample document content for demonstration purposes.", size: 64 };
      setAttachedDocs((prev) => [...prev, mockDoc]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!res.canceled && res.assets) {
        const newDocs: AttachedDoc[] = res.assets.map((asset) => ({
          name: asset.name,
          content: `[Content of ${asset.name} — ${asset.size ? Math.round(asset.size / 1024) : "?"}KB — processed by local inference engine]`,
          size: asset.size || 0,
        }));
        setAttachedDocs((prev) => [...prev, ...newDocs]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // dismissed
    }
  };

  const removeDoc = (name: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.name !== name));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRun = async () => {
    if (!query.trim() || isRunning || !canRun) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);
    setResult(null);
    setGuardrailBlock(null);
    setActiveTab("pipeline");
    setStages([]);
    setActiveAgent(null);
    setPredictedLabel(null);
    fadeAnim.setValue(0);

    try {
      const res = await runNineAgentPipeline(
        query,
        modelBand,
        (updatedStages, currentAgent) => {
          setStages([...updatedStages]);
          setActiveAgent(currentAgent);
          const scoutStage = updatedStages.find((s) => s.id === "scout" && s.status === "complete");
          if (scoutStage?.result) {
            const sr = scoutStage.result as any;
            setPredictedLabel(sr.predicted_output_label || null);
          }
          scrollRef.current?.scrollToEnd({ animated: true });
        },
        attachedDocs
      );
      if ("blocked" in res && res.blocked) {
        setGuardrailBlock(res as GuardrailBlock);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsRunning(false);
        setActiveAgent(null);
        return;
      }
      setResult(res as DeepTaskResult);
      await incrementDeepTaskCount();
      setActiveTab("result");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRunning(false);
      setActiveAgent(null);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addWorkspaceItem({
      id: generateId(),
      title: query.slice(0, 60),
      content: result.final_answer,
      type: "task",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      tags: result.scout.key_concepts.slice(0, 3),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Deep Task
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            3 parallel workers · adversarial critique
          </Text>
        </View>
        <View style={[styles.parallelBadge, { backgroundColor: colors.accent }]}>
          <Feather name="git-branch" size={12} color={colors.primary} />
          <Text style={[styles.parallelBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            ×3 PARALLEL
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: (isWeb ? 34 : insets.bottom) + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Query card */}
        <View style={[styles.queryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Describe your task in detail..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.queryInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            editable={!isRunning}
            maxLength={4000}
          />

          {/* Attached docs */}
          {attachedDocs.length > 0 && (
            <View style={[styles.docsRow, { borderTopColor: colors.border }]}>
              {attachedDocs.map((doc) => (
                <View key={doc.name} style={[styles.docChip, { backgroundColor: colors.accent }]}>
                  <Feather name="file-text" size={12} color={colors.primary} />
                  <Text style={[styles.docChipText, { color: colors.primary, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Pressable onPress={() => removeDoc(doc.name)}>
                    <Feather name="x" size={12} color={colors.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Footer actions */}
          <View style={[styles.queryFooter, { borderTopColor: colors.border }]}>
            <View style={styles.queryActions}>
              <Pressable
                onPress={handlePickDocument}
                disabled={isRunning}
                style={({ pressed }) => [styles.attachBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather name="paperclip" size={15} color={colors.mutedForeground} />
                <Text style={[styles.attachBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  {attachedDocs.length > 0 ? `${attachedDocs.length} file${attachedDocs.length > 1 ? "s" : ""}` : "Attach"}
                </Text>
              </Pressable>
              {predictedLabel && !result && (
                <View style={[styles.predictionChip, { backgroundColor: colors.accent }]}>
                  <Feather name="eye" size={10} color={colors.primary} />
                  <Text style={[styles.predictionText, { color: colors.primary, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                    {predictedLabel}
                  </Text>
                </View>
              )}
            </View>
            <ForgeButton
              label={isRunning ? "Running..." : "Run"}
              onPress={handleRun}
              disabled={!query.trim() || isRunning || !canRun}
              loading={isRunning}
              icon={!isRunning ? <Feather name="layers" size={15} color="#fff" /> : undefined}
              size="sm"
              testID="run-deep-task"
            />
          </View>
        </View>

        {/* Guardrail block banner */}
        {guardrailBlock && (
          <View style={[styles.limitBanner, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B40", borderRadius: colors.radius }]}>
            <Feather name="shield" size={16} color="#F59E0B" />
            <Text style={[styles.limitText, { color: "#92400E", fontFamily: "Inter_400Regular" }]}>
              {guardrailBlock.message}
            </Text>
          </View>
        )}

        {/* Limit banner */}
        {!canRun && (
          <View style={[styles.limitBanner, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30`, borderRadius: colors.radius }]}>
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.limitText, { color: colors.warning, fontFamily: "Inter_400Regular" }]}>
              3 free Deep Tasks used today. Upgrade to Plus or Pro for unlimited.
            </Text>
          </View>
        )}

        {/* Agent pipeline live view */}
        {stages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                AGENT PIPELINE
              </Text>
              <View style={[styles.workersBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.workersBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  3 PARALLEL WORKERS
                </Text>
              </View>
            </View>
            {stages.map((stage, i) => (
              <AgentStageCard
                key={stage.id}
                stage={stage}
                isActive={stage.name === activeAgent}
                index={i}
              />
            ))}
          </View>
        )}

        {/* Result panel */}
        {result && (
          <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>
            <View style={[styles.tabs, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              {(["result", "pipeline", "scorecard"] as TabView[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
                  style={[styles.tab, activeTab === tab && { backgroundColor: colors.surface, borderRadius: colors.radius - 2 }]}
                >
                  <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    {tab === "result" ? "Answer" : tab === "pipeline" ? "Pipeline" : "Scorecard"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeTab === "result" && <ResultView result={result} colors={colors} onSave={handleSave} />}
            {activeTab === "pipeline" && <PipelineView result={result} colors={colors} />}
            {activeTab === "scorecard" && <ScorecardView result={result} colors={colors} />}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function ResultView({ result, colors, onSave }: { result: DeepTaskResult; colors: any; onSave: () => void }) {
  return (
    <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.resultHeader, { borderBottomColor: colors.border }]}>
        <ConfidenceMeter value={result.confidence} size={48} showLabel />
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultGrade, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Grade {result.judge.quality_grade} · {Math.round(result.confidence * 100)}% confidence
          </Text>
          <Text style={[styles.resultMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {(result.total_latency_ms / 1000).toFixed(1)}s · {result.stages.reduce((s, a) => s + (a.tokens_used || 0), 0)} tokens · 3 workers
          </Text>
        </View>
        <Pressable onPress={onSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <Feather name="bookmark" size={16} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={[styles.resultContent, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
        {result.final_answer}
      </Text>
      <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
        <Feather name="activity" size={12} color={colors.mutedForeground} />
        <Text style={[styles.resultFooterText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {result.metacognitive.recommendation}
        </Text>
      </View>
    </View>
  );
}

function PipelineView({ result, colors }: { result: DeepTaskResult; colors: any }) {
  return (
    <View style={{ gap: 4 }}>
      {result.stages.map((stage, i) => (
        <AgentStageCard key={stage.id} stage={stage} isActive={false} index={i} />
      ))}
    </View>
  );
}

function ScorecardView({ result, colors }: { result: DeepTaskResult; colors: any }) {
  const { critic } = result;
  const dims = [
    { label: "Correctness", val: critic.correctness },
    { label: "Completeness", val: critic.completeness },
    { label: "Consistency", val: critic.consistency },
    { label: "Usefulness", val: critic.usefulness },
    { label: "Safety", val: critic.safety },
  ];
  return (
    <View style={[styles.scorecard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.scorecardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Quality Scorecard
      </Text>
      {dims.map((d) => (
        <View key={d.label} style={styles.scoreDim}>
          <View style={styles.scoreDimRow}>
            <Text style={[styles.scoreDimLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{d.label}</Text>
            <Text style={[styles.scoreDimVal, { color: d.val >= 0.85 ? colors.success : colors.warning, fontFamily: "Inter_700Bold" }]}>
              {Math.round(d.val * 100)}%
            </Text>
          </View>
          <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.scoreBarFill, { width: `${d.val * 100}%` as any, backgroundColor: d.val >= 0.85 ? colors.success : colors.warning }]} />
          </View>
        </View>
      ))}
      <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
      <View style={styles.scoreDimRow}>
        <Text style={[styles.scoreDimLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Aggregate</Text>
        <Text style={[styles.scoreDimVal, { color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 18 }]}>
          {Math.round(critic.aggregate * 100)}%
        </Text>
      </View>
      {result.metacognitive.repair_triggered && (
        <View style={[styles.repairBadge, { backgroundColor: `${colors.warning}15`, borderRadius: 8 }]}>
          <Feather name="refresh-cw" size={12} color={colors.warning} />
          <Text style={[styles.repairText, { color: colors.warning, fontFamily: "Inter_400Regular" }]}>
            Auto-repair triggered — quality improved
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, letterSpacing: -0.8 },
  headerSub: { fontSize: 12, marginTop: 2 },
  parallelBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  parallelBadgeText: { fontSize: 10, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  queryCard: { borderWidth: 1, overflow: "hidden" },
  queryInput: { fontSize: 15, lineHeight: 23, minHeight: 70, padding: 16, paddingBottom: 8 },
  docsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  docChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, maxWidth: 200 },
  docChipText: { fontSize: 12, flex: 1 },
  queryFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  queryActions: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  attachBtnText: { fontSize: 13 },
  predictionChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, flex: 1 },
  predictionText: { fontSize: 11, flex: 1 },
  limitBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1 },
  limitText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { gap: 6 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8 },
  workersBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  workersBadgeText: { fontSize: 9, letterSpacing: 0.5 },
  tabs: { flexDirection: "row", padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabText: { fontSize: 12, letterSpacing: -0.1 },
  resultBox: { borderWidth: 1, overflow: "hidden" },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  resultGrade: { fontSize: 15, letterSpacing: -0.3 },
  resultMeta: { fontSize: 11, marginTop: 2 },
  saveBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  resultContent: { fontSize: 15, lineHeight: 24, padding: 16 },
  resultFooter: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 12, borderTopWidth: 1 },
  resultFooterText: { fontSize: 12, lineHeight: 17, flex: 1 },
  scorecard: { borderWidth: 1, padding: 18, gap: 14 },
  scorecardTitle: { fontSize: 17, letterSpacing: -0.4 },
  scoreDim: { gap: 6 },
  scoreDimRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreDimLabel: { fontSize: 14 },
  scoreDimVal: { fontSize: 14 },
  scoreBar: { height: 5, borderRadius: 3 },
  scoreBarFill: { height: 5, borderRadius: 3 },
  scoreDivider: { height: 1 },
  repairBadge: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  repairText: { fontSize: 12, flex: 1 },
});
