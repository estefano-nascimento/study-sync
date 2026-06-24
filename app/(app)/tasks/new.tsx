import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { useTaskStore } from '../../../store/taskStore';
import { Subject, Group } from '../../../lib/types';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { typography, spacing, radii } from '../../../lib/theme';
import { crossAlert } from '../../../lib/utils';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PRIORITIES: { value: string; label: string; color: string; icon: IoniconsName }[] = [
  { value: 'low',      label: 'Baixa',   color: '#22C55E', icon: 'leaf-outline' },
  { value: 'medium',   label: 'Média',   color: '#F59E0B', icon: 'alert-circle-outline' },
  { value: 'high',     label: 'Alta',    color: '#F97316', icon: 'flame-outline' },
  { value: 'critical', label: 'Crítica', color: '#EF4444', icon: 'flash-outline' },
];

export default function NewTaskScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { fetchTasks } = useTaskStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [estimatedMin, setEstimatedMin] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id).limit(20),
      supabase.from('group_members').select('groups(id, name)').eq('user_id', user.id),
    ]).then(([subRes, grpRes]) => {
      setSubjects((subRes.data as Subject[]) || []);
      const grpList = ((grpRes.data || []) as any[]).map((m) => m.groups).filter(Boolean);
      setGroups(grpList as Group[]);
    });
  }, [user?.id]);

  function formatDisplayDate(iso: string): string {
    try {
      return format(parseISO(iso + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return iso;
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      crossAlert('Campo obrigatório', 'Informe o título da tarefa.');
      return;
    }
    if (!user?.id) {
      crossAlert('Erro de autenticação', 'Você precisa estar logado para criar tarefas.');
      return;
    }
    const estNum = estimatedMin ? parseInt(estimatedMin, 10) : null;
    if (estNum !== null && (isNaN(estNum) || estNum <= 0)) {
      crossAlert('Estimativa inválida', 'Informe um número inteiro positivo de minutos.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status: 'todo',
          due_date: dueDate || null,
          estimated_minutes: estNum,
          subject_id: selectedSubject,
          group_id: selectedGroup,
          creator_id: user.id,
        })
        .select()
        .single();

      if (error) {
        crossAlert('Erro ao criar tarefa', error.message);
        return;
      }

      if (data) {
        try { await supabase.rpc('calculate_criticality', { task_id: data.id }); } catch {}
      }

      await fetchTasks();
      router.back();
    } catch (e: any) {
      crossAlert('Erro inesperado', e?.message ?? 'Não foi possível criar a tarefa.');
    } finally {
      setSaving(false);
    }
  }

  const markedDates = dueDate
    ? { [dueDate]: { selected: true, selectedColor: colors.primary } }
    : {};

  const activePriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar" style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="add-circle" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Nova tarefa</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <View style={styles.fieldGroup}>
          <SectionLabel icon="create-outline" label="TÍTULO *" color={colors.textSecondary} />
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Trabalho de Cálculo II"
            autoFocus={Platform.OS !== 'web'}
            returnKeyType="next"
          />
        </View>

        {/* Descrição */}
        <View style={styles.fieldGroup}>
          <SectionLabel icon="document-text-outline" label="DESCRIÇÃO (OPCIONAL)" color={colors.textSecondary} />
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva o que precisa ser feito..."
            multiline
            numberOfLines={3}
            style={{ height: 88, paddingTop: spacing.sm, textAlignVertical: 'top' }}
          />
        </View>

        {/* Prioridade */}
        <View style={styles.fieldGroup}>
          <SectionLabel icon="flag-outline" label="PRIORIDADE" color={colors.textSecondary} />
          <View style={styles.priorityGrid}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityChip,
                    {
                      borderColor: active ? p.color : colors.border,
                      backgroundColor: active ? p.color + '1A' : colors.surface,
                    },
                  ]}
                  accessibilityLabel={`Prioridade ${p.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={p.icon} size={16} color={active ? p.color : colors.textSecondary} />
                  <Text style={[styles.priorityLabel, { color: active ? p.color : colors.textSecondary }]}>
                    {p.label}
                  </Text>
                  {active && (
                    <View style={styles.priorityCheck}>
                      <Ionicons name="checkmark-circle" size={14} color={p.color} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Data de prazo — seletor visual */}
        <View style={styles.fieldGroup}>
          <SectionLabel icon="calendar-outline" label="PRAZO" color={colors.textSecondary} />
          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={[
              styles.dateTrigger,
              {
                backgroundColor: colors.surface,
                borderColor: dueDate ? colors.primary : colors.border,
              },
            ]}
            accessibilityLabel="Selecionar data de prazo"
          >
            <View style={[styles.dateIconWrap, { backgroundColor: (dueDate ? colors.primary : colors.textSecondary) + '18' }]}>
              <Ionicons
                name="calendar"
                size={18}
                color={dueDate ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={[styles.dateTriggerText, { color: dueDate ? colors.textPrimary : colors.textSecondary }]}>
              {dueDate ? formatDisplayDate(dueDate) : 'Selecionar data...'}
            </Text>
            {dueDate ? (
              <TouchableOpacity
                onPress={() => setDueDate('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Remover data"
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Estimativa */}
        <View style={styles.fieldGroup}>
          <SectionLabel icon="timer-outline" label="ESTIMATIVA (MINUTOS)" color={colors.textSecondary} />
          <Input
            value={estimatedMin}
            onChangeText={setEstimatedMin}
            placeholder="Ex: 90"
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        {/* Disciplina */}
        {subjects.length > 0 && (
          <View style={styles.fieldGroup}>
            <SectionLabel icon="school-outline" label="DISCIPLINA" color={colors.textSecondary} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {subjects.map((s) => {
                  const active = selectedSubject === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSubject(active ? null : s.id)}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? s.color : colors.border,
                          backgroundColor: active ? s.color + '1A' : colors.surface,
                        },
                      ]}
                      accessibilityLabel={`Disciplina ${s.name}`}
                    >
                      {active && <Ionicons name="checkmark-circle" size={13} color={s.color} />}
                      <Text style={[styles.chipText, { color: active ? s.color : colors.textSecondary }]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Grupo */}
        {groups.length > 0 && (
          <View style={styles.fieldGroup}>
            <SectionLabel icon="people-outline" label="GRUPO (OPCIONAL)" color={colors.textSecondary} />
            <View style={styles.chipRow}>
              {groups.map((g) => {
                const active = selectedGroup === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setSelectedGroup(active ? null : g.id)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '1A' : colors.surface,
                      },
                    ]}
                    accessibilityLabel={`Grupo ${g.name}`}
                  >
                    {active && <Ionicons name="checkmark-circle" size={13} color={colors.primary} />}
                    <Text style={[styles.chipText, { color: active ? colors.primary : colors.textSecondary }]}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Button
          label="Criar tarefa"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>

      {/* Modal — Calendário */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCalendar(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Drag handle */}
            <View style={styles.dragHandle}>
              <View style={[styles.dragBar, { backgroundColor: colors.border }]} />
            </View>

            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Escolha o prazo</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={[styles.iconBtn, { backgroundColor: colors.background }]}
                accessibilityLabel="Fechar calendário"
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Calendar
              current={dueDate || todayStr}
              minDate={todayStr}
              markedDates={markedDates}
              onDayPress={(day) => {
                setDueDate(day.dateString);
                setShowCalendar(false);
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: colors.primary,
                todayBackgroundColor: colors.primary + '18',
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.border,
                arrowColor: colors.primary,
                monthTextColor: colors.textPrimary,
                indicatorColor: colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />

            {dueDate && (
              <TouchableOpacity
                onPress={() => { setDueDate(''); setShowCalendar(false); }}
                style={[styles.clearDateBtn, { borderColor: colors.danger + '50' }]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.clearDateText, { color: colors.danger }]}>Remover prazo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionLabel({ icon, label, color }: { icon: IoniconsName; label: string; color: string }) {
  return (
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { ...typography.h3 },
  container: { padding: spacing.md, gap: spacing.lg, paddingBottom: 48 },
  fieldGroup: { gap: spacing.xs + 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  priorityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 4,
    borderRadius: radii.md,
    borderWidth: 1.5,
    minWidth: '47%',
    flex: 1,
  },
  priorityLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  priorityCheck: { marginLeft: 'auto' as any },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  dateIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTriggerText: { flex: 1, fontSize: 15, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    borderTopLeftRadius: radii.lg + 4,
    borderTopRightRadius: radii.lg + 4,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  dragHandle: { alignItems: 'center', paddingTop: spacing.sm },
  dragBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { ...typography.h3 },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  clearDateText: { fontSize: 14, fontWeight: '600' },
});
