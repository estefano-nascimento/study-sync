import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTaskStore } from '../../store/taskStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Task, Group } from '../../lib/types';
import { Card } from '../../components/Card';
import { KpiCard } from '../../components/KpiCard';
import { StatusChip } from '../../components/StatusChip';
import { ProgressBar } from '../../components/ProgressBar';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { typography, spacing } from '../../lib/theme';
import { greetingByHour, formatDate, priorityLabel } from '../../lib/utils';

interface WeeklyData {
  dia: string;
  total: number;
}

interface GroupWithProgress extends Group {
  progress: number;
  memberCount: number;
}

export default function DashboardScreen() {
  const { colors } = useThemeStore();
  const { profile } = useAuthStore();
  const { todayTasks, fetchTodayTasks } = useTaskStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [criticalTask, setCriticalTask] = useState<Task | null>(null);
  const [kpis, setKpis] = useState({ today: 0, critical: 0, focusToday: 0, attention: 0 });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [groups, setGroups] = useState<GroupWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchTodayTasks(),
      fetchCriticalTask(),
      fetchKpis(),
      fetchWeeklyFocus(),
      fetchGroups(),
    ]);
    setLoading(false);
  }, []);

  async function fetchCriticalTask() {
    const { data } = await supabase
      .from('tasks')
      .select('*, subjects(name, color)')
      .neq('status', 'done')
      .order('criticality_score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setCriticalTask(data as Task);
  }

  async function fetchKpis() {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    const [todayRes, critRes, focusRes, attentionRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .gte('due_date', todayStart)
        .lte('due_date', todayEnd)
        .neq('status', 'done'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'critical')
        .neq('status', 'done'),
      supabase
        .from('study_sessions')
        .select('duration_minutes')
        .gte('started_at', todayStart)
        .not('duration_minutes', 'is', null),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'high')
        .neq('status', 'done'),
    ]);

    const focusSum = (focusRes.data || []).reduce(
      (a, s) => a + (s.duration_minutes || 0),
      0
    );

    setKpis({
      today: todayRes.count || 0,
      critical: critRes.count || 0,
      focusToday: focusSum,
      attention: attentionRes.count || 0,
    });
  }

  async function fetchWeeklyFocus() {
    const since = subDays(new Date(), 7).toISOString();
    const { data } = await supabase
      .from('study_sessions')
      .select('started_at, duration_minutes')
      .gte('started_at', since)
      .not('duration_minutes', 'is', null);

    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      byDay[format(d, 'yyyy-MM-dd')] = 0;
    }
    (data || []).forEach((s) => {
      const day = s.started_at.split('T')[0];
      if (day in byDay) byDay[day] += s.duration_minutes || 0;
    });
    setWeeklyData(
      Object.entries(byDay).map(([dia, total]) => ({
        dia: format(new Date(dia + 'T12:00:00'), 'EEE', { locale: ptBR }),
        total,
      }))
    );
  }

  async function fetchGroups() {
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, cover_image)')
      .limit(10);
    if (!memberData) return;

    const validGroups = (memberData as any[])
      .filter((m) => m.groups)
      .map((m) => m.groups);

    if (validGroups.length === 0) return;

    // Buscar tarefas de todos os grupos de uma vez
    const groupIds = validGroups.map((g: { id: string }) => g.id);
    const { data: taskData } = await supabase
      .from('tasks')
      .select('status, group_id')
      .in('group_id', groupIds);

    // Calcular progresso real por grupo
    const progressByGroup: Record<string, { total: number; done: number }> = {};
    (taskData || []).forEach((t) => {
      if (!progressByGroup[t.group_id]) {
        progressByGroup[t.group_id] = { total: 0, done: 0 };
      }
      progressByGroup[t.group_id].total++;
      if (t.status === 'done') progressByGroup[t.group_id].done++;
    });

    const groupList: GroupWithProgress[] = validGroups.map((g: { id: string; name: string }) => {
      const stats = progressByGroup[g.id] || { total: 0, done: 0 };
      return {
        ...g,
        progress: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
        memberCount: 3,
      };
    });
    setGroups(groupList);
  }

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = greetingByHour();
  const focusHours = Math.floor(kpis.focusToday / 60);
  const focusMinutes = kpis.focusToday % 60;
  const focusLabel = focusHours > 0
    ? `${focusHours}h${focusMinutes > 0 ? ` ${focusMinutes}m` : ''}`
    : `${focusMinutes}m`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, isWide && styles.containerWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho com saudação e sino de notificações */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting},</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {profile?.display_name?.split(' ')[0] || 'Estudante'}
            </Text>
            {criticalTask && (
              <Text style={[styles.focusHint, { color: colors.textSecondary }]}>
                Foco principal:{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {criticalTask.title}
                </Text>
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/notifications')}
            style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
          >
            <Ionicons
              name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
              size={22}
              color={unreadCount > 0 ? colors.primary : colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Grade de KPIs */}
        {loading ? (
          <View style={[styles.kpiGrid, isWide && styles.kpiGridWide]}>
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </View>
        ) : (
          <View style={[styles.kpiGrid, isWide && styles.kpiGridWide]}>
            <KpiCard title="Para hoje" value={kpis.today} icon="today-outline" color={colors.primary} />
            <KpiCard title="Críticas" value={kpis.critical} icon="warning-outline" color={colors.danger} />
            <KpiCard title="Foco hoje" value={focusLabel} icon="time-outline" color={colors.success} />
            <KpiCard title="Alta prioridade" value={kpis.attention} icon="alert-circle-outline" color={colors.warning} />
          </View>
        )}

        {/* Gráfico de foco semanal */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Foco nos últimos 7 dias
          </Text>
          <WeeklyBarChart data={weeklyData} barColor={colors.primary} labelColor={colors.textSecondary} borderColor={colors.border} />
        </Card>

        {/* Tarefas de hoje */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tarefas de hoje</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/tasks')} accessibilityLabel="Ver todas as tarefas">
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : todayTasks.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="Nenhuma tarefa para hoje"
            subtitle="Aproveite o dia ou adicione novas tarefas"
            actionLabel="Nova tarefa"
            onAction={() => router.push('/(app)/tasks/new')}
          />
        ) : (
          todayTasks.slice(0, 5).map((task) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => router.push(`/(app)/tasks/${task.id}` as any)}
              accessibilityLabel={`Tarefa ${task.title}`}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.taskRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={[styles.taskTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      {task.subjects && (
                        <StatusChip label={task.subjects.name} color={task.subjects.color} />
                      )}
                      {task.priority === 'critical' && (
                        <StatusChip label="Crítica" variant="critical" />
                      )}
                      {task.due_date && (
                        <Text style={[styles.dueText, { color: colors.textSecondary }]}>
                          {formatDate(task.due_date)}
                        </Text>
                      )}
                    </View>
                    {task.task_progress?.[0] && (
                      <ProgressBar value={task.task_progress[0].percentage} />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/focus/${task.id}` as any)}
                    style={[styles.focusBtn, { backgroundColor: colors.primary }]}
                    accessibilityLabel="Iniciar foco"
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Grupos ativos */}
        {groups.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Grupos ativos</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/groups')} accessibilityLabel="Ver todos os grupos">
                <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={groups}
              keyExtractor={(g) => g.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/groups/${item.id}` as any)}
                  accessibilityLabel={`Grupo ${item.name}`}
                >
                  <Card style={styles.groupCard}>
                    <View style={[styles.groupAvatar, { backgroundColor: colors.primary + '22' }]}>
                      <Ionicons name="people" size={28} color={colors.primary} />
                    </View>
                    <Text
                      style={[styles.groupName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <ProgressBar value={item.progress} showLabel />
                    {item.progress === 0 && (
                      <Text style={[{ color: colors.textSecondary, fontSize: 11 }]}>
                        Sem tarefas concluídas
                      </Text>
                    )}
                  </Card>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Gráfico de barras semanal (sem dependência externa) ────────────────────

function WeeklyBarChart({
  data,
  barColor,
  labelColor,
  borderColor,
}: {
  data: WeeklyData[];
  barColor: string;
  labelColor: string;
  borderColor: string;
}) {
  const CHART_H = 130;
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  function fmtMin(min: number) {
    if (min === 0) return '';
    return min >= 60 ? `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}m` : ''}` : `${min}m`;
  }

  if (data.length === 0) {
    return (
      <Text style={{ color: labelColor, ...typography.caption, textAlign: 'center', paddingVertical: spacing.lg }}>
        Nenhuma sessão de foco registrada esta semana
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H + 32, gap: 4, paddingTop: 20 }}>
      {data.map((item, i) => {
        const barH = item.total > 0 ? Math.max((item.total / maxVal) * CHART_H, 6) : 2;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            {item.total > 0 && (
              <Text style={{ fontSize: 9, color: labelColor, fontWeight: '600' }}>
                {fmtMin(item.total)}
              </Text>
            )}
            <View
              style={{
                width: '72%',
                height: barH,
                backgroundColor: item.total > 0 ? barColor : borderColor,
                borderRadius: 4,
              }}
            />
            <Text style={{ fontSize: 10, color: labelColor, fontWeight: '500' }}>{item.dia}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.sm },
  containerWide: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  greeting: { ...typography.body },
  name: { ...typography.h1, fontWeight: '800' },
  focusHint: { ...typography.caption, marginTop: 4 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    marginTop: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  kpiGridWide: { flexWrap: 'nowrap' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h3 },
  seeAll: { ...typography.caption, fontWeight: '600' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  dueText: { ...typography.caption },
  focusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: { width: 180, gap: spacing.xs },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { ...typography.body, fontWeight: '600' },
});
