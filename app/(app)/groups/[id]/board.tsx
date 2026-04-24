import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useThemeStore } from '../../../../store/themeStore';
import { useAuthStore } from '../../../../store/authStore';
import { Task, TaskStatus } from '../../../../lib/types';
import { Card } from '../../../../components/Card';
import { StatusChip } from '../../../../components/StatusChip';
import { EmptyState } from '../../../../components/EmptyState';
import { typography, spacing } from '../../../../lib/theme';
import { formatDate } from '../../../../lib/utils';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'A fazer' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'review', label: 'Revisão' },
  { key: 'done', label: 'Concluída' },
];

export default function BoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCol, setActiveCol] = useState<TaskStatus>('todo');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { if (id) fetchTasks(); }, [id]);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*, subjects(name, color), task_progress(percentage), task_assignments(user_id, user_profiles(display_name))')
      .eq('group_id', id)
      .order('criticality_score', { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const renderCard = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      onPress={() => router.push(`/(app)/tasks/${task.id}` as any)}
      accessibilityLabel={`Tarefa ${task.title}`}
    >
      <Card style={styles.taskCard}>
        <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          {task.subjects && <StatusChip label={task.subjects.name} color={task.subjects.color} />}
          {task.priority === 'critical' && <StatusChip label="Crítica" variant="critical" />}
        </View>
        {task.due_date && (
          <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
            {formatDate(task.due_date)}
          </Text>
        )}
        {/* Move buttons */}
        <View style={styles.moveRow}>
          {COLUMNS.filter((c) => c.key !== task.status).map((col) => (
            <TouchableOpacity
              key={col.key}
              onPress={() => moveTask(task.id, col.key)}
              style={[styles.moveBtn, { borderColor: colors.border }]}
              accessibilityLabel={`Mover para ${col.label}`}
            >
              <Text style={[styles.moveBtnText, { color: colors.textSecondary }]} numberOfLines={1}>
                → {col.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isWide) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Quadro Kanban</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/tasks/new')}
            accessibilityLabel="Nova tarefa"
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.board} showsHorizontalScrollIndicator={false}>
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.key);
            return (
              <View key={col.key} style={[styles.column, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.colHeader}>
                  <Text style={[styles.colTitle, { color: colors.textPrimary }]}>{col.label}</Text>
                  <View style={[styles.colBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.colBadgeText, { color: colors.primary }]}>{colTasks.length}</Text>
                  </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {colTasks.length === 0 ? (
                    <Text style={[styles.emptyCol, { color: colors.textSecondary }]}>Vazio</Text>
                  ) : (
                    colTasks.map(renderCard)
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mobile: one column at a time
  const colTasks = tasksByStatus(activeCol);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Quadro</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/tasks/new')} accessibilityLabel="Nova tarefa">
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, padding: spacing.sm }}>
          {COLUMNS.map((col) => (
            <TouchableOpacity
              key={col.key}
              onPress={() => setActiveCol(col.key)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: activeCol === col.key ? colors.primary : colors.surface,
                  borderColor: activeCol === col.key ? colors.primary : colors.border,
                },
              ]}
              accessibilityLabel={`Coluna ${col.label}`}
            >
              <Text style={{ color: activeCol === col.key ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {col.label} ({tasksByStatus(col.key).length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={colTasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => renderCard(item)}
        contentContainerStyle={[styles.list, colTasks.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="clipboard-outline" title="Nenhuma tarefa" subtitle="Adicione tarefas a este grupo" />
        }
      />
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
  title: { ...typography.h3 },
  board: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, alignItems: 'flex-start' },
  column: {
    width: 280,
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    maxHeight: '90%',
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  colTitle: { ...typography.h3 },
  colBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colBadgeText: { fontSize: 12, fontWeight: '700' },
  emptyCol: { ...typography.caption, textAlign: 'center', padding: spacing.md },
  tabBar: {},
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  list: { padding: spacing.md, gap: spacing.sm },
  taskCard: { marginBottom: spacing.sm, gap: spacing.xs },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dueDate: { ...typography.caption },
  moveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  moveBtn: { paddingHorizontal: spacing.xs + 4, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  moveBtnText: { fontSize: 11 },
});
