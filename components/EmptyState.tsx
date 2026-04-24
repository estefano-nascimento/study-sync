import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { Button } from './Button';
import { typography, spacing } from '../lib/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'folder-open-outline', title, subtitle, actionLabel, onAction }: Props) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.border} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...typography.h3, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
});
