import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { Notification, NotificationType } from '../../lib/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/Button';
import { typography, spacing } from '../../lib/theme';
import { formatRelative } from '../../lib/utils';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<NotificationType, { icon: IoniconsName; color: string; label: string }> = {
  task_due: { icon: 'alarm-outline', color: '#2F5BFF', label: 'Lembrete' },
  task_overdue: { icon: 'warning-outline', color: '#F59E0B', label: 'Atraso' },
  reschedule_suggestion: { icon: 'calendar-outline', color: '#2F5BFF', label: 'Reagendamento' },
  group_progress: { icon: 'trending-up-outline', color: '#22C55E', label: 'Progresso' },
  member_focus: { icon: 'timer-outline', color: '#19C2C9', label: 'Foco de colega' },
  meeting_suggestion: { icon: 'people-outline', color: '#19C2C9', label: 'Reunião' },
  task_unlocked: { icon: 'lock-open-outline', color: '#22C55E', label: 'Tarefa liberada' },
};

export default function NotificationsScreen() {
  const { colors } = useThemeStore();
  const { notifications, loading, unreadCount, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const router = useRouter();

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = async () => { await fetchNotifications(); };

  function handleCta(notif: Notification) {
    markRead(notif.id);
    if (!notif.action_url) return;
    // Map action_url to router path
    if (notif.action_url.startsWith('/tasks/')) {
      router.push(`/(app)${notif.action_url}` as any);
    } else if (notif.action_url.startsWith('/reschedule/')) {
      router.push(`/(app)${notif.action_url}` as any);
    } else if (notif.action_url.includes('calendar')) {
      router.push('/(app)/calendar');
    }
  }

  function ctaLabel(type: NotificationType): string | null {
    switch (type) {
      case 'reschedule_suggestion': return 'Aprovar reagendamento';
      case 'task_due': return 'Iniciar foco agora';
      case 'task_overdue': return 'Ver tarefa';
      case 'meeting_suggestion': return 'Ver disponibilidade';
      case 'task_unlocked': return 'Ver tarefa';
      default: return null;
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Notificações {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} accessibilityLabel="Marcar todas como lidas">
            <Text style={[styles.markAll, { color: colors.primary }]}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Nenhuma notificação"
              subtitle="Você está em dia com tudo!"
            />
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] || { icon: 'information-circle-outline', color: colors.primary, label: 'Aviso' };
            const cta = ctaLabel(item.type);
            return (
              <TouchableOpacity
                onPress={() => { markRead(item.id); }}
                accessibilityLabel={item.title}
              >
                <Card
                  style={[
                    styles.notifCard,
                    !item.read && { borderLeftWidth: 3, borderLeftColor: cfg.color },
                  ]}
                >
                  <View style={styles.notifRow}>
                    <View style={[styles.iconWrap, { backgroundColor: cfg.color + '1A' }]}>
                      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: colors.textPrimary }, !item.read && { fontWeight: '700' }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                          {formatRelative(item.created_at)}
                        </Text>
                      </View>
                      <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.body}
                      </Text>
                      {cta && (
                        <TouchableOpacity
                          onPress={() => handleCta(item)}
                          style={[styles.ctaBtn, { borderColor: cfg.color }]}
                          accessibilityLabel={cta}
                        >
                          <Text style={[styles.ctaBtnText, { color: cfg.color }]}>{cta}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2 },
  markAll: { ...typography.caption, fontWeight: '600' },
  list: { padding: spacing.md, gap: spacing.sm },
  notifCard: { gap: spacing.xs },
  notifRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { ...typography.body, flex: 1 },
  notifTime: { ...typography.caption },
  notifBody: { ...typography.caption },
  ctaBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 12, fontWeight: '600' },
});
