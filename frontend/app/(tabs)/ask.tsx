import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/design/tokens';
import { useAppStore, generateId, Message, AgentStage } from '../../src/store/appStore';
import ChatBubble from '../../src/components/chat/ChatBubble';
import ChatInput from '../../src/components/chat/ChatInput';
import AgentStageCard from '../../src/components/agent/AgentStageCard';
import { askOrchestrator } from '../../src/agents/orchestrator/AskOrchestrator';
import { ContentSafetyFilter, SycophancyBlocker, ResponsibilityDisclaimer } from '../../src/guardrails/filters';
import FahmIQLogoAnimated from '../../src/components/FahmIQLogoAnimated';

export default function AskScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const flatListRef = useRef<FlatList>(null);
  const [stages, setStages] = useState<AgentStage[]>([]);
  const [showStages, setShowStages] = useState(false);

  const {
    conversations, activeConversationId, addConversation,
    setActiveConversation, addMessage, isProcessing, setProcessing,
  } = useAppStore();

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];

  const handleSend = useCallback(async (text: string) => {
    // Safety check
    const safety = ContentSafetyFilter.check(text);
    if (!safety.safe) {
      const convId = activeConversationId || createNewConversation(text);
      addMessage(convId, { id: generateId(), role: 'assistant', content: safety.reason || 'Content blocked.', timestamp: Date.now() });
      return;
    }

    const convId = activeConversationId || createNewConversation(text);
    const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: Date.now() };
    addMessage(convId, userMsg);
    setProcessing(true);
    setShowStages(true);
    setStages([]);

    // Set up stage tracking
    askOrchestrator.setStageCallback((stage, status, result) => {
      setStages((prev) => {
        const existing = prev.find((s) => s.agent === (result?.agent || stage));
        if (existing) {
          return prev.map((s) => s.agent === (result?.agent || stage)
            ? { ...s, status, summary: result?.output?.substring(0, 100), confidence: result?.confidence }
            : s
          );
        }
        return [...prev, {
          id: generateId(),
          agent: result?.agent || stage.charAt(0).toUpperCase() + stage.slice(1),
          status,
          summary: result?.output?.substring(0, 100) || '',
          confidence: result?.confidence,
        }];
      });
    });

    try {
      const result = await askOrchestrator.process(text);
      let answer = result.finalAnswer;

      // Clean sycophancy
      const sycScore = SycophancyBlocker.score(answer);
      if (sycScore > 30) answer = SycophancyBlocker.clean(answer);

      // Add disclaimer if needed
      const disclaimer = ResponsibilityDisclaimer.check(text);
      if (disclaimer) answer = `${answer}\n\n---\n${disclaimer}`;

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
        confidence: result.confidence,
        agentStages: stages,
        sources: result.sources,
      };
      addMessage(convId, assistantMsg);
    } catch (error: any) {
      addMessage(convId, {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${error.message || 'Processing failed. Please try again.'}`,
        timestamp: Date.now(),
      });
    } finally {
      setProcessing(false);
    }
  }, [activeConversationId]);

  const createNewConversation = (firstMsg: string) => {
    const id = generateId();
    addConversation({
      id,
      title: firstMsg.substring(0, 50),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveConversation(id);
    return id;
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setStages([]);
    setShowStages(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="ask-screen">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <View style={styles.headerLeft}>
            <FahmIQLogoAnimated size={28} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>FahmIQ</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity testID="new-chat-btn" onPress={startNewChat} style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.headerBtn}>
              <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {messages.length === 0 && !isProcessing ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <FahmIQLogoAnimated size={64} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Think clearly. Stay private.</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Ask anything. Multi-agent reasoning pipeline analyzes your query through Scout, Planner, Worker, Critic, and Judge agents — all running on-device.
            </Text>
            <View style={styles.suggestionsContainer}>
              {['Explain quantum entanglement', 'Compare React vs Vue for large apps', 'What are cognitive biases in decision making?'].map((q, i) => (
                <TouchableOpacity key={i} testID={`suggestion-${i}`} style={[styles.suggestion, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]} onPress={() => handleSend(q)}>
                  <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.textFaint} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble content={item.content} role={item.role} confidence={item.confidence} />
            )}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={
              showStages && stages.length > 0 ? (
                <View style={styles.stagesContainer}>
                  <TouchableOpacity onPress={() => setShowStages(!showStages)} style={styles.stagesToggle}>
                    <Ionicons name="layers-outline" size={16} color={theme.accent} />
                    <Text style={[styles.stagesLabel, { color: theme.accent }]}>Agent Pipeline ({stages.length} stages)</Text>
                    <Ionicons name={showStages ? 'chevron-up' : 'chevron-down'} size={16} color={theme.accent} />
                  </TouchableOpacity>
                  {showStages && stages.map((s) => (
                    <AgentStageCard key={s.id} agent={s.agent} status={s.status} summary={s.summary} confidence={s.confidence} />
                  ))}
                </View>
              ) : null
            }
          />
        )}

        <ChatInput onSend={handleSend} disabled={isProcessing} placeholder={isProcessing ? 'Processing through agent pipeline...' : 'Ask anything...'} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...Typography.sectionHeading },
  headerRight: { flexDirection: 'row', gap: Spacing.md },
  headerBtn: { padding: Spacing.xs },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['3xl'] },
  emptyTitle: { ...Typography.heroTitle, marginTop: Spacing['2xl'], textAlign: 'center' },
  emptySubtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.md, lineHeight: 22 },
  suggestionsContainer: { marginTop: Spacing['3xl'], width: '100%', gap: Spacing.sm },
  suggestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderRadius: 12, borderWidth: 1 },
  suggestionText: { ...Typography.body, flex: 1, marginRight: Spacing.sm },
  chatList: { paddingVertical: Spacing.lg },
  stagesContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  stagesToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, paddingVertical: Spacing.sm },
  stagesLabel: { ...Typography.caption, fontWeight: '600' },
});
