import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../design/tokens';

interface Props {
  content: string;
  role: 'user' | 'assistant';
  confidence?: number;
  dark?: boolean;
}

export default function ChatBubble({ content, role, confidence, dark = true }: Props) {
  const theme = dark ? Colors.dark : Colors.light;
  const isUser = role === 'user';

  return (
    <View testID={`chat-bubble-${role}`} style={[styles.container, isUser ? styles.userAlign : styles.assistantAlign]}>
      <View style={[
        styles.bubble,
        {
          backgroundColor: isUser ? theme.accent : theme.surfaceCard,
          borderColor: isUser ? 'transparent' : theme.border,
          borderWidth: isUser ? 0 : 1,
        },
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}>
        <Text style={[styles.text, { color: isUser ? '#FFFFFF' : theme.textPrimary }]}>{content}</Text>
        {confidence !== undefined && !isUser && (
          <View style={styles.confRow}>
            <View style={[styles.confDot, {
              backgroundColor: confidence >= 80 ? theme.success : confidence >= 60 ? theme.warning : theme.error,
            }]} />
            <Text style={[styles.confText, { color: theme.textFaint }]}>Confidence: {confidence}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  userAlign: { alignItems: 'flex-end' },
  assistantAlign: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: Radius.lg, padding: Spacing.md },
  userBubble: { borderBottomRightRadius: Radius.xs },
  assistantBubble: { borderBottomLeftRadius: Radius.xs },
  text: { ...Typography.body, lineHeight: 22 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  confDot: { width: 6, height: 6, borderRadius: 3 },
  confText: { ...Typography.micro },
});
