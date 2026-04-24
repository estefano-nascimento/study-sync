import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Task } from '../../../lib/types';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import { ProgressBar } from '../../../components/ProgressBar';
import { Button } from '../../../components/Button';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { typography, spacing } from '../../../lib/theme';
import { formatDate, formatMinutes, formatRelative, priorityLabel, statusLabel } from '../../../lib/utils';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => { if (id) fetchTask(); }, [id]);

  async function fetchTask() {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        subjects(name, color),
        groups(id, name),
        task_progress(percentage, time_spent_minutes, notes),
        task_comments(id, content, created_at, user_profiles(display_name, avatar_url)),
        study_sessions(id, started_at, duration_minutes, focus_score)
      `)
      .eq('id', id)
      .single();
    setLoading(false);
    if (data) setTask(data as Task);
  }

  async function sendComment() {
    if (!comment.trim()) return;
    setSendingComment(true);
    await supabase.from('task_comments').insert({
      task_id: id,
      user_id: user?.id,
      content: comment.trim(),
    });
    setComment('');
    setSendingComment(false);
    fetchTask();
  }

  const progress = task?.task_progress?.[0]?.percentage ?? 0;
  const timeSpent = task?.task_progress?.[0]?.time_spent_minutes ?? 0;
  const hasSessions = (task?.study_sessions?.length ?? 0) > 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[styles.err, { color: colors.textSecondary }]}>Tarefa não encontrada</Text>
      </SafeAreaView>
    );
  }

  const chipVariant = task.priority === 'critical' ? 'critical' as const
    : task.status === 'done' ? 'done' as const
    : task.status === 'in_progress' ? 'in_progress' as const : 'default' as const;

  const mainContent = (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Title & chips */}
      <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>{task.title}</Text>
      <View style={styles.chips}>
        <StatusChip label={priorityLabel(task.priority)} variant={chipVariant} />
        <StatusChip label={statusLabel(task.status)} variant={chipVariant} />
        {task.subjects && <StatusChip label={task.subjects.name} color={task.subjects.color} />}
      </View>

      {/* Deadline & estimate */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Prazo e estimativa</Text>
        <View style={styles.row}>
          {task.due_date && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>{formatDate(task.due_date)}</Text>
            </View>
          )}
          {task.estimated_minutes && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>{formatMinutes(task.estimated_minutes)}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Description */}
      {task.description && (
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Descrição</Text>
          <Text style={[styles.desc, { color: colors.textPrimary }]}>{task.description}</Text>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Progresso</Text>
        <ProgressBar value={progress} showLabel />
        <Text style={[styles.timeSpent, { color: colors.textSecondary }]}>
          {formatMinutes(timeSpent)} investidos
        </Text>
      </Card>

      {/* Impact banner */}
      {task.group_id && task.priority === 'critical' && (
        <View style={[styles.banner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning }]}>
          <Ionicons name="warning-outline" size={18} color={colors.warning} />
          <Text style={[styles.bannerText, { color: colors.warning }]}>
            Esta tarefa desbloqueia a etapa de conclusão do grupo.
          </Text>
        </View>
      )}

      {/* Sessions */}
      {hasSessions && (
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Histórico de sessões</Text>
          {task.study_sessions!.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={[styles.sessionDate, { color: colors.textPrimary }]}>
                {formatRelative(s.started_at)}
              </Text>
              <Text style={[styles.sessionDur, { color: colors.textSecondary }]}>
                {s.duration_minutes ? formatMinutes(s.duration_minutes) : 'Em andamento'}
              </Text>
              {s.focus_score != null && (
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < s.focus_score! ? 'star' : 'star-outline'}
                      size={12}
                      color={colors.warning}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );

  const sideContent = (
    <ScrollView contentContainerStyle={styles.comments}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Comentários</Text>
      {task.task_comments?.map((c) => (
        <View key={c.id} style={[styles.commentItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.commentAuthor, { color: colors.primary }]}>
            {c.user_profiles?.display_name || 'Usuário'}
          </Text>
          <Text style={[styles.commentText, { color: colors.textPrimary }]}>{c.content}</Text>
          <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{formatRelative(c.created_at)}</Text>
        </View>
      ))}
      <View style={[styles.commentInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Adicionar comentário..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.inputText, { color: colors.textPrimary }]}
          multiline
        />
        <TouchableOpacity
          onPress={sendComment}
          disabled={sendingComment}
          accessibilityLabel="Enviar comentário"
        >
          <Ionicons name="send" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalhe</Text>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/reschedule/${id}` as any)}
          accessibilityLabel="Reagendar"
        >
          <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isWide ? (
        <View style={styles.twoCol}>
          <View style={{ flex: 3 }}>{mainContent}</View>
          <View style={[styles.sidePanel, { borderLeftColor: colors.border, flex: 2 }]}>{sideContent}</View>
        </View>
      ) : (
        mainContent
      )}

      {/* CTA */}
      <View style={[styles.cta, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          label={hasSessions ? 'Continuar sessão' : 'Iniciar foco'}
          onPress={() => router.push(`/(app)/focus/${id}` as any)}
          style={{ flex: 1 }}
        />
      </View>
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
  headerTitle: { ...typography.h3 },
  twoCol: { flex: 1, flexDirection: 'row' },
  sidePanel: { borderLeftWidth: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  taskTitle: { ...typography.h1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sectionLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { ...typography.body },
  desc: { ...typography.body, lineHeight: 22 },
  timeSpent: { ...typography.caption, marginTop: spacing.xs },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { ...typography.caption, flex: 1 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  sessionDate: { ...typography.caption, flex: 1 },
  sessionDur: { ...typography.caption },
  stars: { flexDirection: 'row' },
  comments: { padding: spacing.md, gap: spacing.sm },
  commentItem: { paddingBottom: spacing.sm, borderBottomWidth: 1, gap: 2 },
  commentAuthor: { ...typography.caption, fontWeight: '700' },
  commentText: { ...typography.body },
  commentDate: { ...typography.caption },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  inputText: { flex: 1, ...typography.body },
  err: { ...typography.body, textAlign: 'center', padding: spacing.xl },
  cta: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
