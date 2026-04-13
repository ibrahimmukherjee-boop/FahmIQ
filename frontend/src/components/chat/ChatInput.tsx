import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../design/tokens';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  dark?: boolean;
}

export default function ChatInput({ onSend, disabled, placeholder = 'Ask anything...', dark = true }: Props) {
  const [text, setText] = useState('');
  const theme = dark ? Colors.dark : Colors.light;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View testID="chat-input-container" style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
      <View style={[styles.inputWrap, { backgroundColor: theme.surfaceElevated, borderColor: text ? 'rgba(91,110,245,0.5)' : theme.border }]}>
        <TextInput
          testID="chat-input"
          style={[styles.input, { color: theme.textPrimary }]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          multiline
          maxLength={4000}
          returnKeyType="default"
          editable={!disabled}
        />
        <TouchableOpacity
          testID="chat-send-btn"
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? theme.accent : theme.border }]}
        >
          <Ionicons name="arrow-up" size={20} color={text.trim() ? '#FFFFFF' : theme.textFaint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: '-apple-system',
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
