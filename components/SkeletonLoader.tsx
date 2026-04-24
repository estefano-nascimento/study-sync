import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const { colors, isDark } = useThemeStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });
  const bg = isDark ? '#334155' : '#E5E7EB';

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: bg, opacity }, style]}
    />
  );
}

export function CardSkeleton() {
  const { colors, isDark } = useThemeStore();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 },
      ]}
    >
      <Skeleton height={20} width="60%" />
      <View style={{ height: 8 }} />
      <Skeleton height={14} width="80%" />
      <View style={{ height: 8 }} />
      <Skeleton height={14} width="40%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
