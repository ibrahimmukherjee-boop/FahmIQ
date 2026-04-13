import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { runAskPipeline } from "../../src/agents/DeepTaskOrchestrator";
import { HeroArt } from "../../src/components/ui/HeroArt";
import { PromptIQ } from "../../src/components/ui/PromptIQ";
import { runEthicalGuard } from "../../src/cognition/EthicalGuard";
import { checkClarification, formatClarifyMessage } from "../../src/cognition/ClarifyingQuestions";
import type { ChatMessage } from "../../src/agents/types";

// ─── Palette ──────────────────────────────────────────────────────────────────
const N = {
  navy:        "#1E3A5F",
  chalk:       "#6366F1",
  chalkLight:  "#A5B4FC",
  surface:     "#F4F8FE",
  white:       "#FFFFFF",
  border:      "#E0E4F0",
  textPri:     "#1A2B40",
  textSec:     "#6B7A99",
  placeholder: "#8A9ABB",
  guardBg:     "#FFFBEB",
  guardBorder: "#F59E0B55",
  guardText:   "#92400E",
  clarifyBg:   "#F0F4FF",
  clarifyBorder:"#6366F155",
  teal:        "#14B8A6",
  green:       "#22C55E",
};

// ─── 4-band Loader (Scout → Worker → Critic → Judge) ─────────────────────────
function PipelineLoader() {
  const stages = ["Scout", "Workers", "Critic", "Judge"];
  const vals = useRef(stages.map(() => new Animated.Value(0))).current;
  const tick = useRef(0);

  useEffect(() => {
    let active = true;
    function fire() {
      if (!active) return;
      const i = tick.current % stages.length;
      Animated.sequence([
        Animated.timing(vals[i], { toValue: 1, duration: 220, useNativeDriver: false }),
        Animated.timing(vals[i], { toValue: 0.2, duration: 220, useNativeDriver: false }),
      ]).start();
      tick.current++;
      setTimeout(fire, 340);
    }
    fire();
    return () => { active = false; };
  }, []);

  return (
    <View style={st.pipeRow}>
      {stages.map((label, i) => {
        const bg = vals[i].interpolate({
          inputRange: [0, 1],
          outputRange: [N.border, N.chalk],
        });
        return (
          <View key={label} style={st.pipeStage}>
            <Animated.View style={[st.pipeDot, { backgroundColor: bg }]} />
            <Animated.Text
              style={[
                st.pipeLbl,
                { opacity: vals[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ]}
            >
              {label}
            </Animated.Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Suggestion cards ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: "trending-up" as const, text: "Analyse market gaps in SaaS" },
  { icon: "target"      as const, text: "Build a competitive moat strategy" },
  { icon: "bar-chart-2" as const, text: "Forecast Q3 product priorities" },
  { icon: "cpu"         as const, text: "Architect a multi-agent workflow" },
];

function EmptyState({ onSuggest }: { onSuggest: (t: string) => void }) {
  return (
    <View style={st.emptyWrap}>
      <HeroArt height={260} />
      <View style={st.cardsWrap}>
        {SUGGESTIONS.map((sg) => (
          <Pressable key={sg.text} style={st.card} onPress={() => onSuggest(sg.text)}>
            <Feather name={sg.icon} size={14} color={N.chalk} />
            <Text style={st.cardTxt}>{sg.text}</Text>
            <Feather name="chevron-right" size={12} color={N.border} />
          </Pressable>
        ))}
      </View>
      <View style={st.privacyRow}>
        <Feather name="lock" size={10} color={N.textSec} />
        <Text style={st.privacyTxt}>Zero data leaves your device · On-device inference · No API</Text>
      </View>
    </View>
  );
}

// ─── Thinking bubble ──────────────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <View style={st.aiRow}>
      <View style={st.agentDot} />
      <View style={st.aiBubble}>
        <Text style={st.agentLabel}>4-band pipeline · local inference</Text>
        <PipelineLoader />
      </View>
    </View>
  );
}

// ─── Message type flags ───────────────────────────────────────────────────────
type MsgVariant = "user" | "ai" | "guard" | "clarify";

function getMsgVariant(msg: ChatMessage): MsgVariant {
  if (msg.role === "user") return "user";
  const c = msg.content;
  if (c.includes("FahmIQ is") && (c.includes("not a") || c.includes("cannot"))) return "guard";
  if (c.startsWith("To give you") && c.includes("quick question")) return "clarify";
  return "ai";
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const variant = getMsgVariant(msg);

  if (variant === "user") {
    return (
      <View style={st.userRow}>
        <View style={st.userBubble}>
          <Text style={st.userTxt}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  if (variant === "guard") {
    return (
      <View style={st.aiRow}>
        <View style={[st.agentDot, { backgroundColor: "#F59E0B" }]} />
        <View style={[st.aiBubble, st.guardBubble]}>
          <View style={st.guardHeader}>
            <Feather name="shield" size={11} color="#F59E0B" />
            <Text style={st.guardHeaderTxt}>Ethical Guardrail</Text>
          </View>
          <Text style={st.guardTxt}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  if (variant === "clarify") {
    return (
      <View style={st.aiRow}>
        <View style={[st.agentDot, { backgroundColor: N.chalk }]} />
        <View style={[st.aiBubble, st.clarifyBubble]}>
          <View style={st.guardHeader}>
            <Feather name="help-circle" size={11} color={N.chalk} />
            <Text style={[st.guardHeaderTxt, { color: N.chalk }]}>Clarification</Text>
          </View>
          <Text style={st.aiTxt}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.aiRow}>
      <View style={st.agentDot} />
      <View style={st.aiBubble}>
        {msg.isStreaming && !msg.content ? (
          <>
            <Text style={st.agentLabel}>4-band pipeline · local inference</Text>
            <PipelineLoader />
          </>
        ) : (
          <Text style={st.aiTxt}>
            {msg.content}
            {msg.isStreaming && <Text style={{ color: N.chalk }}> ▋</Text>}
          </Text>
        )}
        {!msg.isStreaming && msg.confidence != null && (
          <View style={st.confRow}>
            <View style={[st.confBar, { width: `${Math.round(msg.confidence * 100)}%` as any }]} />
            <Text style={st.confTxt}>{Math.round((msg.confidence || 0.85) * 100)}% confidence</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AskScreen() {
  const { messages, addMessage, updateMessage, clearMessages, modelBand, setModelBand } = useApp();
  const [isLoading, setIsLoading]     = useState(false);
  const [inputText, setInputText]     = useState("");
  const [promptIQOpen, setPromptIQOpen] = useState(false);
  const [pendingClarify, setPendingClarify] = useState<string | null>(null);
  const listRef  = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const insets   = useSafeAreaInsets();

  const askMsgs = messages.filter((m) => m.mode === "ask");
  const isIOS   = Platform.OS === "ios";
  const TAB_H   = Platform.OS === "web" ? 84 : 49;
  const bottomPad = TAB_H + 14;

  const scrollBot = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const handleSend = useCallback(async (text: string, skipClarify = false) => {
    const t = text.trim();
    if (!t || isLoading) return;
    setInputText("");
    setPromptIQOpen(false);
    setPendingClarify(null);
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: genId(), role: "user", content: t,
      timestamp: Date.now(), mode: "ask",
    };
    await addMessage(userMsg);
    scrollBot();

    // 2. Ethical guard check
    const guard = runEthicalGuard(t);
    if (!guard.allowed) {
      await addMessage({
        id: genId(), role: "assistant",
        content: guard.message || "This query cannot be processed.",
        timestamp: Date.now(), mode: "ask",
      });
      scrollBot();
      return;
    }

    // 3. Clarifying questions check (only for first run, not when user is answering a clarify)
    if (!skipClarify) {
      const clarify = checkClarification(t);
      if (clarify.needsClarification) {
        const msg = formatClarifyMessage(clarify);
        await addMessage({
          id: genId(), role: "assistant",
          content: msg,
          timestamp: Date.now(), mode: "ask",
        });
        setPendingClarify(t);
        scrollBot();
        return;
      }
    }

    // 4. Run pipeline
    const aiId = genId();
    await addMessage({
      id: aiId, role: "assistant", content: "",
      timestamp: Date.now(), mode: "ask", isStreaming: true,
    });
    setIsLoading(true);
    scrollBot();

    try {
      let acc = "";
      const res = await runAskPipeline(t, modelBand, (tok: string) => {
        acc += tok;
        updateMessage(aiId, { content: acc, isStreaming: true });
        scrollBot();
      });
      await updateMessage(aiId, {
        content: res.content,
        isStreaming: false,
        confidence: res.confidence,
      });
      if (isIOS)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await updateMessage(aiId, {
        content: "Analysis could not be completed. Please try again.",
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
      scrollBot();
    }
  }, [isLoading, modelBand, addMessage, updateMessage, isIOS, scrollBot]);

  // If user sends a message while clarification is pending, run with skip
  const handleSendWithContext = useCallback((text: string) => {
    if (pendingClarify) {
      // User is providing clarification — combine with original query
      const combinedQuery = pendingClarify + " [Context: " + text + "]";
      handleSend(combinedQuery, true);
    } else {
      handleSend(text, false);
    }
  }, [pendingClarify, handleSend]);

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        style={st.kav}
        behavior={isIOS ? "padding" : "height"}
      >
        {/* Header */}
        <View style={st.header}>
          <Text style={st.headerTitle}>FahmIQ</Text>
          <View style={st.headerRight}>
            <View style={st.bandBadge}>
              <View style={[st.bandDot, {
                backgroundColor:
                  modelBand === "fast" ? N.teal :
                  modelBand === "precision" ? "#A855F7" : N.chalk,
              }]} />
              <Text style={st.bandTxt}>{(modelBand || "balanced").toUpperCase()}</Text>
            </View>
            {askMsgs.length > 0 && (
              <Pressable onPress={clearMessages} style={st.clearBtn} hitSlop={10}>
                <Feather name="trash-2" size={13} color={N.textSec} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Messages */}
        <View style={st.msgArea}>
          {askMsgs.length === 0 && !isLoading ? (
            <EmptyState onSuggest={(t) => handleSend(t, false)} />
          ) : (
            <FlatList
              ref={listRef}
              data={askMsgs}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <Bubble msg={item} />}
              contentContainerStyle={st.listPad}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                isLoading && askMsgs[askMsgs.length - 1]?.role === "user"
                  ? <ThinkingBubble />
                  : null
              }
              onContentSizeChange={scrollBot}
              style={st.list}
            />
          )}
        </View>

        {/* PromptIQ */}
        <PromptIQ
          input={inputText}
          visible={promptIQOpen}
          onApplyTemplate={(t) => { setInputText(t); setPromptIQOpen(false); }}
          onEnhance={(t) => { setInputText(t); setPromptIQOpen(false); }}
        />

        {/* Clarification context banner */}
        {pendingClarify && (
          <View style={st.clarifyBanner}>
            <Feather name="message-circle" size={11} color={N.chalk} />
            <Text style={st.clarifyBannerTxt} numberOfLines={1}>
              Clarifying: {pendingClarify.slice(0, 40)}…
            </Text>
            <Pressable onPress={() => { setPendingClarify(null); handleSend(pendingClarify, true); }}>
              <Text style={st.clarifySkip}>Skip →</Text>
            </Pressable>
          </View>
        )}

        {/* Input bar */}
        <View style={[st.inputBar, { paddingBottom: bottomPad }]}>
          {/* Band pills + PromptIQ */}
          <View style={st.metaRow}>
            <View style={st.bandRow}>
              <Feather name="cpu" size={10} color={N.textSec} />
              {(["fast", "balanced", "precision"] as const).map((b) => (
                <Pressable
                  key={b}
                  style={[st.bandPill, modelBand === b && st.bandPillActive]}
                  onPress={() => setModelBand?.(b)}
                >
                  <Text style={[st.bandPillTxt, modelBand === b && st.bandPillTxtActive]}>
                    {b === "fast" ? "Fast" : b === "balanced" ? "Balanced" : "Precision"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[st.promptIQBtn, promptIQOpen && st.promptIQBtnActive]}
              onPress={() => setPromptIQOpen(!promptIQOpen)}
            >
              <Feather name="zap" size={11} color={promptIQOpen ? N.white : N.chalk} />
              <Text style={[st.promptIQTxt, promptIQOpen && { color: N.white }]}>PromptIQ</Text>
            </Pressable>
          </View>

          {/* Input pill */}
          <View style={st.inputPill}>
            <TextInput
              ref={inputRef}
              style={st.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={pendingClarify ? "Provide more context…" : "Ask anything…"}
              placeholderTextColor={N.placeholder}
              multiline
              maxLength={4000}
              editable={!isLoading}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS !== "web") handleSendWithContext(inputText);
              }}
            />
            <Pressable
              style={[st.sendBtn, (!inputText.trim() || isLoading) && st.sendDim]}
              onPress={() => handleSendWithContext(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Feather name="arrow-up" size={17} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.surface },
  kav:  { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: N.white,
    borderBottomWidth: 1, borderBottomColor: N.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: N.navy, letterSpacing: 0.2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  bandBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0F2FF", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  bandDot: { width: 6, height: 6, borderRadius: 3 },
  bandTxt: { fontSize: 10, fontWeight: "600", color: N.chalk, letterSpacing: 0.6 },
  clearBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F0F4F8", alignItems: "center", justifyContent: "center",
  },

  msgArea: { flex: 1, backgroundColor: N.surface },
  list:    { flex: 1 },
  listPad: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },

  userRow:   { alignItems: "flex-end", marginVertical: 5 },
  userBubble: {
    maxWidth: "82%", backgroundColor: N.navy,
    borderRadius: 20, borderBottomRightRadius: 4,
    paddingHorizontal: 15, paddingVertical: 10,
  },
  userTxt: { color: N.white, fontSize: 15, lineHeight: 22 },

  aiRow:    { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 5 },
  agentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: N.chalk, flexShrink: 0, marginBottom: 4 },
  aiBubble: {
    flex: 1, maxWidth: "88%", backgroundColor: N.white,
    borderWidth: 1, borderColor: N.border,
    borderRadius: 20, borderBottomLeftRadius: 4,
    paddingHorizontal: 15, paddingVertical: 12,
  },
  guardBubble: { backgroundColor: N.guardBg, borderColor: N.guardBorder },
  clarifyBubble: { backgroundColor: N.clarifyBg, borderColor: N.clarifyBorder },
  guardHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  guardHeaderTxt: { fontSize: 10, fontWeight: "700", color: "#F59E0B", textTransform: "uppercase", letterSpacing: 0.6 },
  guardTxt:  { color: N.guardText, fontSize: 14, lineHeight: 21 },
  aiTxt:     { color: N.textPri, fontSize: 15, lineHeight: 22 },
  agentLabel:{ fontSize: 10, fontWeight: "600", color: N.chalk, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },

  confRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  confBar: { height: 3, backgroundColor: N.chalk, borderRadius: 2, opacity: 0.5 },
  confTxt: { fontSize: 10, color: N.textSec, fontWeight: "600" },

  pipeRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 2 },
  pipeStage: { alignItems: "center", gap: 2 },
  pipeDot: { width: 8, height: 8, borderRadius: 4 },
  pipeLbl: { fontSize: 8, color: N.chalk, fontWeight: "600", letterSpacing: 0.3 },

  emptyWrap: { flex: 1 },
  cardsWrap: { padding: 14, gap: 8 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: N.white, borderRadius: 12,
    borderWidth: 1, borderColor: N.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  cardTxt: { color: N.textPri, fontSize: 14, flex: 1 },
  privacyRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingBottom: 8 },
  privacyTxt: { fontSize: 11, color: N.textSec },

  clarifyBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: N.clarifyBg,
    borderTopWidth: 1, borderTopColor: N.clarifyBorder,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  clarifyBannerTxt: { flex: 1, fontSize: 11, color: N.textSec },
  clarifySkip: { fontSize: 11, color: N.chalk, fontWeight: "600" },

  inputBar: {
    backgroundColor: N.white,
    borderTopWidth: 1, borderTopColor: N.border,
    paddingHorizontal: 12, paddingTop: 8,
    gap: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bandRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bandPill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: N.border,
    backgroundColor: N.surface,
  },
  bandPillActive: { backgroundColor: N.chalk, borderColor: N.chalk },
  bandPillTxt:    { fontSize: 10, fontWeight: "600", color: N.textSec },
  bandPillTxtActive: { color: N.white },
  promptIQBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: N.chalk,
    backgroundColor: N.surface,
  },
  promptIQBtnActive: { backgroundColor: N.chalk },
  promptIQTxt: { fontSize: 11, fontWeight: "600", color: N.chalk },

  inputPill: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: N.surface,
    borderRadius: 24, borderWidth: 1.5, borderColor: N.border,
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
  },
  input: {
    flex: 1, fontSize: 15, color: N.textPri,
    lineHeight: 22, maxHeight: 130,
    paddingTop: Platform.OS === "ios" ? 2 : 0,
    paddingBottom: 2,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: N.navy, alignItems: "center", justifyContent: "center",
  },
  sendDim: { opacity: 0.3 },

  white: { color: N.white },
});
