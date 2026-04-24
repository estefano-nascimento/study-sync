import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStore } from '../store/notificationStore';
import { typography, spacing, radii } from '../lib/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const NAV_ITEMS: { label: string; icon: IoniconsName; activeIcon: IoniconsName; href: string }[] = [
  { label: 'Início',        icon: 'home-outline',      activeIcon: 'home',        href: '/(app)/dashboard' },
  { label: 'Tarefas',       icon: 'clipboard-outline', activeIcon: 'clipboard',   href: '/(app)/tasks' },
  { label: 'Grupos',        icon: 'people-outline',    activeIcon: 'people',      href: '/(app)/groups' },
  { label: 'Agenda',        icon: 'calendar-outline',  activeIcon: 'calendar',    href: '/(app)/calendar' },
  { label: 'Configurações', icon: 'settings-outline',  activeIcon: 'settings',    href: '/(app)/settings' },
];

export function SidebarNav() {
  const { colors } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={styles.content}
    >
      {/* Brand */}
      <View style={styles.brandRow}>
        <View style={[styles.brandIcon, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="school" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.brand, { color: colors.primary }]}>Study-Sync</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Nav items */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href.replace('/(app)', ''));
          const showBadge = item.href.includes('settings') && unreadCount > 0;
          return (
            <TouchableOpacity
              key={item.href}
              onPress={() => router.push(item.href as any)}
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={[
                styles.item,
                { borderRadius: radii.md },
                active && { backgroundColor: colors.primary + '1A' },
              ]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.primary : colors.textSecondary },
                  active && { fontWeight: '700' },
                ]}
              >
                {item.label}
              </Text>
              {showBadge && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
              {active && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, gap: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.sm },
  brandIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brand: { ...typography.h2 },
  divider: { height: 1, marginVertical: spacing.xs },
  nav: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  label: { ...typography.body, flex: 1 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeIndicator: {
    position: 'absolute', right: 0, top: '20%', bottom: '20%',
    width: 3, borderRadius: 2,
  },
});
