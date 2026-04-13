import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Palette ──────────────────────────────────────────────────────────────────
const N = {
  navy:    "#1E3A5F",
  chalk:   "#5B9BD5",
  surface: "#F4F8FE",
  white:   "#FFFFFF",
  border:  "#C5D9F0",
  text:    "#1A2B40",
  textSec: "#5B7FA0",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  purple:  "#8B5CF6",
};

type AutoStatus = "running" | "paused" | "idle";

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  status: AutoStatus;
  trigger: string;
  action: string;
  lastRun: string;
  workers: number;
  enabled: boolean;
}

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: "1",
    name: "Bank Balance Monitor",
    description: "Alert when balance drops below threshold",
    icon: "dollar-sign",
    iconColor: N.green,
    status: "running",
    trigger: "Balance < £500",
    action: "Push notification + daily digest",
    lastRun: "2 hours ago",
    workers: 3,
    enabled: true,
  },
  {
    id: "2",
    name: "Market Intelligence",
    description: "Track stocks, crypto and macro signals",
    icon: "trending-up",
    iconColor: N.amber,
    status: "running",
    trigger: "Every 15 min market hours",
    action: "Summarise moves + flag anomalies",
    lastRun: "12 min ago",
    workers: 5,
    enabled: true,
  },
  {
    id: "3",
    name: "Code Task Agent",
    description: "Autonomously complete coding pipelines",
    icon: "code",
    iconColor: N.purple,
    status: "idle",
    trigger: "On new task assigned",
    action: "Write → test → validate → report",
    lastRun: "Yesterday",
    workers: 7,
    enabled: false,
  },
  {
    id: "4",
    name: "Research Digest",
    description: "Daily research brief on your chosen topics",
    icon: "book-open",
    iconColor: N.chalk,
    status: "paused",
    trigger: "Daily at 08:00",
    action: "Compile + synthesise + summarise",
    lastRun: "3 days ago",
    workers: 4,
    enabled: false,
  },
];

const PIPELINE_TEMPLATES = [
  { icon: "dollar-sign", label: "Check bank balance and notify me when below threshold", color: N.green },
  { icon: "trending-up", label: "Monitor stocks / crypto and alert on price movements", color: N.amber },
  { icon: "code",        label: "Complete code task — write, test, validate, deploy", color: N.purple },
  { icon: "search",      label: "Research topic daily and deliver executive brief", color: N.chalk },
  { icon: "mail",        label: "Triage my inbox and surface what needs action today", color: "#E11D48" },
  { icon: "cpu",         label: "Watch system metrics and scale resources automatically", color: N.navy },
];

function StatusDot({ status }: { status: AutoStatus }) {
  const color = status === "running" ? N.green : status === "paused" ? N.amber : N.textSec;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: "600", color, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {status}
      </Text>
    </View>
  );
}

function WorkerBar({ count, max = 9 }: { count: number; max?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <View key={i} style={{
          width: 6, height: 6, borderRadius: 1.5,
          backgroundColor: i < count ? N.chalk : N.border,
        }} />
      ))}
      <Text style={{ fontSize: 10, color: N.textSec, marginLeft: 3 }}>{count} workers</Text>
    </View>
  );
}

function AutomationCard({
  item,
  onToggle,
  onWorkerChange,
}: {
  item: Automation;
  onToggle: (id: string) => void;
  onWorkerChange: (id: string, w: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable style={st.card} onPress={() => setExpanded(!expanded)}>
      {/* Header */}
      <View style={st.cardHead}>
        <View style={[st.cardIcon, { backgroundColor: item.iconColor + "18" }]}>
          <Feather name={item.icon as any} size={18} color={item.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.cardName}>{item.name}</Text>
          <Text style={st.cardDesc}>{item.description}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => onToggle(item.id)}
          trackColor={{ false: N.border, true: N.chalk + "80" }}
          thumbColor={item.enabled ? N.chalk : "#ccc"}
          ios_backgroundColor={N.border}
        />
      </View>

      {/* Status bar */}
      <View style={st.cardMeta}>
        <StatusDot status={item.enabled ? item.status : "idle"} />
        <Text style={st.metaText}>Last run: {item.lastRun}</Text>
        <WorkerBar count={item.workers} />
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={st.expanded}>
          <View style={st.expandRow}>
            <Feather name="zap" size={12} color={N.amber} />
            <Text style={st.expandLabel}>Trigger</Text>
            <Text style={st.expandValue}>{item.trigger}</Text>
          </View>
          <View style={st.expandRow}>
            <Feather name="play" size={12} color={N.green} />
            <Text style={st.expandLabel}>Action</Text>
            <Text style={st.expandValue}>{item.action}</Text>
          </View>
          {/* Worker count control */}
          <View style={[st.expandRow, { marginTop: 10 }]}>
            <Feather name="cpu" size={12} color={N.chalk} />
            <Text style={st.expandLabel}>Horsepower</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {[3, 4, 5, 6, 7].map((w) => (
                <Pressable
                  key={w}
                  style={[st.workerBtn, item.workers === w && st.workerBtnActive]}
                  onPress={() => onWorkerChange(item.id, w)}
                >
                  <Text style={[st.workerBtnTxt, item.workers === w && { color: N.white }]}>
                    {w}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function AutomateScreen() {
  const insets = useSafeAreaInsets();
  const TAB_H = Platform.OS === "web" ? 84 : 49;
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderText, setBuilderText] = useState("");

  const toggle = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled, status: !a.enabled ? "running" : "idle" } : a
      )
    );
  };

  const changeWorkers = (id: string, w: number) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, workers: w } : a));
  };

  const running = automations.filter((a) => a.enabled && a.status === "running").length;

  return (
    <SafeAreaView style={st.safe}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Automate</Text>
          <Text style={st.headerSub}>{running} active · on-device agents</Text>
        </View>
        <Pressable style={st.newBtn} onPress={() => setShowBuilder(!showBuilder)}>
          <Feather name="plus" size={16} color={N.white} />
          <Text style={st.newBtnTxt}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: TAB_H + 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pipeline Builder */}
        {showBuilder && (
          <View style={st.builder}>
            <Text style={st.builderTitle}>
              <Feather name="cpu" size={13} color={N.chalk} />{"  "}Describe your automation
            </Text>
            <TextInput
              style={st.builderInput}
              value={builderText}
              onChangeText={setBuilderText}
              placeholder='e.g. "Check my Monzo balance every hour and notify me below £200"'
              placeholderTextColor={N.textSec}
              multiline
              numberOfLines={3}
            />
            {/* Templates */}
            {builderText.length === 0 && (
              <View style={{ gap: 7, marginTop: 6 }}>
                {PIPELINE_TEMPLATES.map((t) => (
                  <Pressable
                    key={t.label}
                    style={st.pipelineChip}
                    onPress={() => setBuilderText(t.label)}
                  >
                    <Feather name={t.icon as any} size={13} color={t.color} />
                    <Text style={st.pipelineChipTxt} numberOfLines={1}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {builderText.length > 0 && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable style={st.deployBtn} onPress={() => {
                  const newAuto: Automation = {
                    id: Date.now().toString(),
                    name: builderText.slice(0, 32) + (builderText.length > 32 ? "…" : ""),
                    description: "Custom automation",
                    icon: "cpu",
                    iconColor: N.chalk,
                    status: "running",
                    trigger: "As configured",
                    action: builderText,
                    lastRun: "Never",
                    workers: 3,
                    enabled: true,
                  };
                  setAutomations((prev) => [newAuto, ...prev]);
                  setBuilderText("");
                  setShowBuilder(false);
                }}>
                  <Feather name="play" size={13} color={N.white} />
                  <Text style={st.deployBtnTxt}>Deploy Automation</Text>
                </Pressable>
                <Pressable style={st.cancelBtn} onPress={() => setBuilderText("")}>
                  <Text style={st.cancelBtnTxt}>Clear</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Active section */}
        {automations.filter((a) => a.enabled).length > 0 && (
          <>
            <Text style={st.sectionLabel}>Active</Text>
            {automations.filter((a) => a.enabled).map((a) => (
              <AutomationCard
                key={a.id}
                item={a}
                onToggle={toggle}
                onWorkerChange={changeWorkers}
              />
            ))}
          </>
        )}

        {/* Inactive section */}
        {automations.filter((a) => !a.enabled).length > 0 && (
          <>
            <Text style={[st.sectionLabel, { marginTop: 6 }]}>Paused</Text>
            {automations.filter((a) => !a.enabled).map((a) => (
              <AutomationCard
                key={a.id}
                item={a}
                onToggle={toggle}
                onWorkerChange={changeWorkers}
              />
            ))}
          </>
        )}

        {/* Info note */}
        <View style={st.infoCard}>
          <Feather name="lock" size={12} color={N.textSec} />
          <Text style={st.infoTxt}>
            All automations run on-device. No pipeline data leaves your phone.
            Worker nodes scale 3–9 per task — more workers = higher accuracy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.surface },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: N.white,
    borderBottomWidth: 1, borderBottomColor: N.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: N.navy },
  headerSub: { fontSize: 11, color: N.textSec, marginTop: 2 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: N.navy, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  newBtnTxt: { color: N.white, fontSize: 13, fontWeight: "600" },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: N.textSec,
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 4,
  },

  card: {
    backgroundColor: N.white,
    borderRadius: 14, borderWidth: 1, borderColor: N.border,
    padding: 14,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 14, fontWeight: "700", color: N.text },
  cardDesc: { fontSize: 12, color: N.textSec, marginTop: 2 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaText: { fontSize: 11, color: N.textSec, flex: 1 },

  expanded: {
    borderTopWidth: 1, borderTopColor: N.border,
    paddingTop: 10, gap: 6,
  },
  expandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  expandLabel: { fontSize: 11, fontWeight: "600", color: N.textSec, width: 52 },
  expandValue: { flex: 1, fontSize: 12, color: N.text },

  workerBtn: {
    width: 26, height: 26, borderRadius: 6,
    borderWidth: 1, borderColor: N.border,
    backgroundColor: N.surface,
    alignItems: "center", justifyContent: "center",
  },
  workerBtnActive: { backgroundColor: N.chalk, borderColor: N.chalk },
  workerBtnTxt: { fontSize: 12, fontWeight: "600", color: N.textSec },

  builder: {
    backgroundColor: N.white,
    borderRadius: 14, borderWidth: 1, borderColor: N.chalk + "55",
    padding: 14, gap: 8,
  },
  builderTitle: { fontSize: 13, fontWeight: "700", color: N.navy },
  builderInput: {
    backgroundColor: N.surface,
    borderRadius: 10, borderWidth: 1, borderColor: N.border,
    padding: 12, fontSize: 14, color: N.text,
    minHeight: 70, textAlignVertical: "top",
  },
  pipelineChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: N.surface, borderRadius: 10,
    borderWidth: 1, borderColor: N.border,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  pipelineChipTxt: { flex: 1, fontSize: 13, color: N.text },
  deployBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: N.navy, borderRadius: 10, padding: 10,
  },
  deployBtnTxt: { color: N.white, fontWeight: "600", fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: N.border,
  },
  cancelBtnTxt: { color: N.textSec, fontSize: 13 },

  infoCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: N.white, borderRadius: 10,
    borderWidth: 1, borderColor: N.border,
    padding: 12, marginTop: 4,
  },
  infoTxt: { flex: 1, fontSize: 11, color: N.textSec, lineHeight: 17 },
});
