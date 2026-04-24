import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface Props {
  value: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, showLabel = false, color, height = 8 }: Props) {
  const { colors } = useThemeStore();
  const pct = Math.min(100, Math.max(0, value));
  const barColor = color || colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, backgroundColor: colors.border, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: barColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{Math.round(pct)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, overflow: 'hidden' },
  fill: {},
  label: { fontSize: 12, fontWeight: '600', minWidth: 36, textAlign: 'right' },
});
