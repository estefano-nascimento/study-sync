import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isPast, parseISO } from 'date-fns';
import { useThemeStore } from '../../../store/themeStore';
import { useTaskStore } from '../../../store/taskStore';
import { Task } from '../../../lib/types';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { ProgressBar } from '../../../components/ProgressBar';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState';
import { typography, spacing } from '../../../lib/theme';
import { formatDate, priorityLabel, statusLabel } from '../../../lib/utils';

const STATUS_FILTERS = ['Todas', 'A fazer', 'Em andamento', 'Revisão', 'Concluída'];
const STATUS_MAP: Record<string, string> = {
  'A fazer': 'todo',
  'Em andamento': 'in_progress',
  'Revisão': 'review',
  'Concluída': 'done',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

export default function TasksScreen() {
  const { colors } = useThemeStore();
  const { tasks, loading, fetchTasks } = useTaskStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [filter, setFilter] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, []);

  const filtered = filter === 'Todas'
    ? tasks
    : tasks.filter((t) => t.status === STATUS_MAP[filter]);

  function isOverdue(task: Task): boolean {
    return !!task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
  }

  const renderTask = ({ item }: { item: Task }) => {
    const progress = item.task_progress?.[0]?.percentage ?? 0;
    const overdue = isOverdue(item);
    const priorityColor = PRIORITY_COLORS[item.priority] || colors.textSecondary;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/tasks/${item.id}` as any)}
        accessibilityLabel={`Tarefa ${item.title}`}
      >
        <Card style={[styles.taskCard, overdue && { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
          <View style={styles.taskHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.taskTitle, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              {overdue && (
                <View style={styles.overdueRow}>
                  <Ionicons name="warning" size={12} color={colors.danger} />
                  <Text style={[styles.overdueText, { color: colors.danger }]}>Atrasada</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/focus/${item.id}` as any)}
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              accessibilityLabel="Iniciar sessão de foco"
            >
              <Ionicons name="play" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.chips}>
            {item.subjects && (
              <StatusChip label={item.subjects.name} color={item.subjects.color} />
            )}
            <StatusChip
              label={priorityLabel(item.priority)}
              color={priorityColor}
            />
            <StatusChip
              label={statusLabel(item.status)}
              variant={
                item.status === 'done' ? 'done'
                  : item.status === 'in_progress' ? 'in_progress'
                  : item.status === 'review' ? 'today'
                  : 'default'
              }
            />
          </View>

          {item.due_date && (
            <View style={styles.dueDateRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={overdue ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  styles.dueDate,
                  { color: overdue ? colors.danger : colors.textSecondary },
                ]}
              >
                {formatDate(item.due_date)}
              </Text>
            </View>
          )}

          {progress > 0 && <ProgressBar value={progress} showLabel />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tarefas</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/tasks/new')}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel="Nova tarefa"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtros de status */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => {
          const active = filter === item;
          return (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              accessibilityLabel={`Filtrar por ${item}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  color: active ? '#fff' : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Lista de tarefas */}
      {loading ? (
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={renderTask}
          contentContainerStyle={[
            styles.list,
            isWide && styles.listWide,
            filtered.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              title={filter === 'Todas' ? 'Nenhuma tarefa encontrada' : `Sem tarefas "${filter}"`}
              subtitle="Crie sua primeira tarefa para começar"
              actionLabel="Nova tarefa"
              onAction={() => router.push('/(app)/tasks/new')}
            />
          }
          showsVerticalScrollIndicator={false}
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  list: { padding: spacing.md, gap: spacing.sm },
  listWide: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  taskCard: { gap: spacing.xs },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  taskTitle: { ...typography.body, fontWeight: '600' },
  overdueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  overdueText: { fontSize: 11, fontWeight: '600' },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDate: { ...typography.caption },
});
