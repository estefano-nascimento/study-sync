import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { useThemeStore } from '../store/themeStore';
import { typography, spacing } from '../lib/theme';

interface Props {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
}

export function KpiCard({ title, value, icon, color, subtitle }: Props) {
  const { colors } = useThemeStore();
  const iconColor = color || colors.primary;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '1A' }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, gap: spacing.xs },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: { ...typography.h2, fontWeight: '700' },
  title: { ...typography.caption },
  subtitle: { fontSize: 11 },
});
