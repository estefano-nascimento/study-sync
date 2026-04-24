import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { radii, typography } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  const { colors } = useThemeStore();
  const height = Platform.OS === 'web' ? 44 : 48;

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.border,
    danger: colors.danger,
    ghost: 'transparent',
  };
  const textMap: Record<Variant, string> = {
    primary: '#fff',
    secondary: colors.textPrimary,
    danger: '#fff',
    ghost: colors.primary,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      style={[
        styles.btn,
        { backgroundColor: bgMap[variant], height, borderRadius: radii.md, opacity: disabled ? 0.5 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} />
      ) : (
        <Text style={[styles.label, { color: textMap[variant] }, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
});
