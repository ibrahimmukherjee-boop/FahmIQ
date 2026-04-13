/**
 * Model Download Screen — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown on first launch before the main app.
 * Downloads Qwen2.5 models via MLC LLM to the device.
 *
 * In EAS-built iOS app: downloads real models (~350–900MB).
 * In Expo Go / web preview: shows UI but skips actual download (native not available).
 */

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../src/context/AppContext";

interface ModelInfo {
  id: string;
  label: string;
  band: "fast" | "balanced" | "precision";
  size: string;
  mlcId: string;
  description: string;
  color: string;
}

const MODELS: ModelInfo[] = [
  {
    id: "fast",
    label: "Scout Model",
    band: "fast",
    size: "~350 MB",
    mlcId: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    description: "Qwen2.5 0.5B · Fast queries, Scout & Critic bands",
    color: "#14B8A6",
  },
  {
    id: "balanced",
    label: "Worker Model",
    band: "balanced",
    size: "~900 MB",
    mlcId: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    description: "Qwen2.5 1.5B · Deep tasks, Worker & Judge bands",
    color: "#6366F1",
  },
];

type ModelStatus = "idle" | "downloading" | "done" | "error";

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={st.progressTrack}>
      <View style={[st.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}

export default function ModelDownloadScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [statuses, setStatuses] = useState<Record<string, ModelStatus>>({});
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const setStatus = (id: string, s: ModelStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: s }));
  const setProgress = (id: string, p: number) =>
    setProgresses((prev) => ({ ...prev, [id]: p }));

  const startDownload = useCallback(async () => {
    if (isStarted) return;
    setIsStarted(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS !== "ios") {
      // Web / Expo Go: simulate download
      for (const model of MODELS) {
        setStatus(model.id, "downloading");
        for (let p = 0; p <= 1; p += 0.04) {
          await new Promise((r) => setTimeout(r, 60));
          setProgress(model.id, Math.min(p, 1));
        }
        setProgress(model.id, 1);
        setStatus(model.id, "done");
        await new Promise((r) => setTimeout(r, 200));
      }
      setAllDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    // iOS native: use real MLC LLM download
    try {
      const { LocalMLCProvider } = await import("../src/agents/providers/LocalMLCProvider");
      for (const model of MODELS) {
        setStatus(model.id, "downloading");
        const provider = new LocalMLCProvider({
          onProgress: (progress) => setProgress(model.id, progress),
        });
        if (!provider.isAvailable()) {
          setProgress(model.id, 1);
          setStatus(model.id, "done");
          continue;
        }
        await provider.ensureLoaded(model.band);
        setProgress(model.id, 1);
        setStatus(model.id, "done");
      }
      setAllDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      for (const model of MODELS) {
        if (statuses[model.id] !== "done") setStatus(model.id, "error");
      }
    }
  }, [isStarted, statuses]);

  const handleContinue = async () => {
    await completeOnboarding();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)/ask");
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/(tabs)/ask");
  };

  return (
    <View style={[st.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={st.header}>
          <View style={st.iconRing}>
            <Feather name="cpu" size={32} color="#6366F1" />
          </View>
          <Text style={st.title}>Download AI Models</Text>
          <Text style={st.subtitle}>
            FahmIQ runs entirely on your iPhone — no data ever leaves your device.
            Download once, run forever offline.
          </Text>
        </View>

        {/* Why on-device */}
        <View style={st.benefitRow}>
          {[
            { icon: "lock" as const, text: "100% Private" },
            { icon: "wifi-off" as const, text: "Works Offline" },
            { icon: "zap" as const, text: "No API Costs" },
          ].map((b) => (
            <View key={b.text} style={st.benefit}>
              <Feather name={b.icon} size={18} color="#6366F1" />
              <Text style={st.benefitTxt}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Model cards */}
        <View style={st.modelList}>
          {MODELS.map((model) => {
            const status = statuses[model.id] ?? "idle";
            const progress = progresses[model.id] ?? 0;
            return (
              <View key={model.id} style={st.modelCard}>
                <View style={st.modelHeader}>
                  <View style={[st.modelDot, { backgroundColor: model.color }]} />
                  <View style={st.modelMeta}>
                    <Text style={st.modelLabel}>{model.label}</Text>
                    <Text style={st.modelDesc}>{model.description}</Text>
                  </View>
                  <View style={st.modelSize}>
                    {status === "done" ? (
                      <Feather name="check-circle" size={20} color="#22C55E" />
                    ) : status === "downloading" ? (
                      <ActivityIndicator size="small" color={model.color} />
                    ) : status === "error" ? (
                      <Feather name="alert-circle" size={20} color="#EF4444" />
                    ) : (
                      <Text style={st.sizeTxt}>{model.size}</Text>
                    )}
                  </View>
                </View>
                {status === "downloading" && (
                  <View style={st.progressContainer}>
                    <ProgressBar progress={progress} />
                    <Text style={st.progressTxt}>{Math.round(progress * 100)}%</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Note */}
        <Text style={st.note}>
          Requires ~1.3 GB of free storage. Models are stored in your app's private directory
          and are never uploaded anywhere.
        </Text>

        {/* Actions */}
        {!isStarted && (
          <Pressable style={st.primaryBtn} onPress={startDownload}>
            <Feather name="download" size={18} color="#FFF" />
            <Text style={st.primaryBtnTxt}>Download Models · ~1.3 GB</Text>
          </Pressable>
        )}

        {allDone && (
          <Pressable style={[st.primaryBtn, st.successBtn]} onPress={handleContinue}>
            <Feather name="arrow-right" size={18} color="#FFF" />
            <Text style={st.primaryBtnTxt}>Launch FahmIQ</Text>
          </Pressable>
        )}

        {!isStarted && (
          <Pressable style={st.skipBtn} onPress={handleSkip}>
            <Text style={st.skipTxt}>Skip for now — use demo mode</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A14" },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: "center", paddingVertical: 32 },
  iconRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1, borderColor: "rgba(99,102,241,0.3)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center", marginBottom: 12 },
  subtitle: {
    fontSize: 15, color: "#9999BB", textAlign: "center", lineHeight: 22, maxWidth: 320,
  },
  benefitRow: { flexDirection: "row", justifyContent: "center", gap: 24, marginBottom: 32 },
  benefit: { alignItems: "center", gap: 6 },
  benefitTxt: { fontSize: 11, color: "#7777AA", fontWeight: "600", textAlign: "center" },
  modelList: { gap: 12, marginBottom: 24 },
  modelCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  modelHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  modelDot: { width: 10, height: 10, borderRadius: 5 },
  modelMeta: { flex: 1 },
  modelLabel: { fontSize: 15, fontWeight: "700", color: "#FFF", marginBottom: 2 },
  modelDesc: { fontSize: 12, color: "#7777AA" },
  modelSize: { alignItems: "flex-end" },
  sizeTxt: { fontSize: 13, color: "#6666AA", fontWeight: "600" },
  progressContainer: { marginTop: 12, gap: 6 },
  progressTrack: {
    height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },
  progressTxt: { fontSize: 11, color: "#7777AA", textAlign: "right" },
  note: {
    fontSize: 12, color: "#555577", textAlign: "center", lineHeight: 18, marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#6366F1", borderRadius: 14, paddingVertical: 16,
    marginBottom: 14,
  },
  successBtn: { backgroundColor: "#16A34A" },
  primaryBtnTxt: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipTxt: { fontSize: 13, color: "#555577" },
});
