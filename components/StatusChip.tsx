import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { radii, spacing } from '../lib/theme';

type ChipVariant = 'critical' | 'today' | 'overdue' | 'done' | 'in_progress' | 'default';

interface Props {
  label: string;
  variant?: ChipVariant;
  color?: string;
}

export function StatusChip({ label, variant = 'default', color }: Props) {
  const { colors } = useThemeStore();

  const variantMap: Record<ChipVariant, { bg: string; text: string }> = {
    critical: { bg: colors.danger + '1A', text: colors.danger },
    today: { bg: colors.primary + '1A', text: colors.primary },
    overdue: { bg: colors.warning + '1A', text: colors.warning },
    done: { bg: colors.success + '1A', text: colors.success },
    in_progress: { bg: colors.accent + '1A', text: colors.accent },
    default: { bg: colors.border, text: colors.textSecondary },
  };

  const { bg, text } = variantMap[variant];
  const bgColor = color ? color + '1A' : bg;
  const textColor = color || text;

  return (
    <View style={[styles.chip, { backgroundColor: bgColor, borderRadius: radii.pill }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
