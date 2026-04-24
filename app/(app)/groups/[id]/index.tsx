import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useThemeStore } from '../../../../store/themeStore';
import { Group, Task, GroupMember } from '../../../../lib/types';
import { Card } from '../../../../components/Card';
import { StatusChip } from '../../../../components/StatusChip';
import { ProgressBar } from '../../../../components/ProgressBar';
import { CardSkeleton } from '../../../../components/SkeletonLoader';
import { Button } from '../../../../components/Button';
import { typography, spacing } from '../../../../lib/theme';
import { formatDate } from '../../../../lib/utils';

const TABS = ['Visão geral', 'Quadro', 'Saúde', 'Membros'];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (id) fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [grpRes, taskRes, memberRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*, subjects(name, color), task_progress(percentage)').eq('group_id', id).order('criticality_score', { ascending: false }),
      supabase.from('group_members').select('*, user_profiles(display_name, avatar_url, last_active_at)').eq('group_id', id),
    ]);
    setGroup(grpRes.data as Group);
    setTasks((taskRes.data as Task[]) || []);
    setMembers((memberRes.data as GroupMember[]) || []);
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const criticalTasks = tasks.filter((t) => t.priority === 'critical' && t.status !== 'done');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {group?.name || 'Grupo'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, padding: spacing.sm }}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                if (tab === 'Quadro') router.push(`/(app)/groups/${id}/board` as any);
                else if (tab === 'Saúde') router.push(`/(app)/groups/${id}/health` as any);
                else if (tab === 'Membros') router.push(`/(app)/groups/${id}/members` as any);
                else setActiveTab(i);
              }}
              style={[
                styles.tabChip,
                {
                  backgroundColor: activeTab === i ? colors.primary : colors.surface,
                  borderColor: activeTab === i ? colors.primary : colors.border,
                },
              ]}
              accessibilityLabel={`Aba ${tab}`}
            >
              <Text style={{ color: activeTab === i ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Overview Card */}
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Progresso geral</Text>
              <ProgressBar value={progress} showLabel height={12} />
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalTasks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.success }]}>{doneTasks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Concluídas</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.danger }]}>{criticalTasks.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Críticas</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{members.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Membros</Text>
                </View>
              </View>
            </Card>

            {/* Code */}
            {group?.invite_code && (
              <Card>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Código de convite</Text>
                <Text style={[styles.inviteCode, { color: colors.primary }]}>{group.invite_code}</Text>
                <Text style={[styles.inviteHint, { color: colors.textSecondary }]}>
                  Compartilhe este código para que outros entrem no grupo
                </Text>
              </Card>
            )}

            {/* Critical tasks */}
            {criticalTasks.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tarefas críticas</Text>
                {criticalTasks.slice(0, 3).map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => router.push(`/(app)/tasks/${task.id}` as any)}
                    accessibilityLabel={`Tarefa ${task.title}`}
                  >
                    <Card style={styles.taskCard}>
                      <View style={styles.taskRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {task.title}
                          </Text>
                          {task.due_date && (
                            <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                              Prazo: {formatDate(task.due_date)}
                            </Text>
                          )}
                        </View>
                        <StatusChip label="Crítica" variant="critical" />
                      </View>
                      {task.task_progress?.[0] && (
                        <ProgressBar value={task.task_progress[0].percentage} />
                      )}
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Quick actions */}
            <View style={styles.actions}>
              <Button
                label="Ver quadro"
                onPress={() => router.push(`/(app)/groups/${id}/board` as any)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                label="Saúde do projeto"
                onPress={() => router.push(`/(app)/groups/${id}/health` as any)}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ScrollView>
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
  headerTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
  tabBar: { borderBottomWidth: 0 },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  container: { padding: spacing.md, gap: spacing.md },
  sectionLabel: { ...typography.caption, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.xs },
  sectionTitle: { ...typography.h3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...typography.h2, fontWeight: '700' },
  statLabel: { ...typography.caption },
  inviteCode: { fontSize: 28, fontWeight: '800', letterSpacing: 4, textAlign: 'center', paddingVertical: spacing.sm },
  inviteHint: { ...typography.caption, textAlign: 'center' },
  taskCard: { gap: spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  taskTitle: { ...typography.body, fontWeight: '600' },
  dueDate: { ...typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
