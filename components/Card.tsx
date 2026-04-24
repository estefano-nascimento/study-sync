import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { radii, spacing, shadows } from '../lib/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = spacing.md }: Props) {
  const { colors, isDark } = useThemeStore();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        !isDark && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
