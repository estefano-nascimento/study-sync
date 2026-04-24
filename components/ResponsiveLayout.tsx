import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface Props {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function ResponsiveLayout({ sidebar, children }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useThemeStore();
  const isWide = width >= 768;

  if (!isWide) return <>{children}</>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        {sidebar}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 240, borderRightWidth: 1 },
  content: { flex: 1 },
});
