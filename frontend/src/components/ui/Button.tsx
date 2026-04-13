import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../design/tokens';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  dark?: boolean;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle, testID, dark = true,
}: Props) {
  const theme = dark ? Colors.dark : Colors.light;
  const isDisabled = disabled || loading;

  const bgColor = variant === 'primary' ? theme.accent
    : variant === 'destructive' ? 'transparent'
    : 'transparent';

  const borderColor = variant === 'secondary' ? theme.accent : 'transparent';
  const txtColor = variant === 'primary' ? '#FFFFFF'
    : variant === 'destructive' ? theme.error
    : theme.accent;

  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          height,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
});
