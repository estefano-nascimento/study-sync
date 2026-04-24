import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDays, format, setHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Task } from '../../../lib/types';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { typography, spacing } from '../../../lib/theme';

interface TimeSlot {
  date: Date;
  label: string;
  duration: number;
}

function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const hours = [9, 14, 16, 19];
  for (let d = 1; d <= 7; d++) {
    const date = addDays(new Date(), d);
    const h = hours[d % hours.length];
    slots.push({
      date: setHours(date, h),
      label: format(setHours(date, h), "EEE, d MMM 'às' HH:mm", { locale: ptBR }),
      duration: 40,
    });
  }
  return slots;
}

export default function RescheduleScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [slots] = useState<TimeSlot[]>(generateSlots());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskId) {
      supabase.from('tasks').select('*, groups(id, name)').eq('id', taskId).single()
        .then(({ data }) => { if (data) setTask(data as Task); });
    }
  }, [taskId]);

  async function handleApprove() {
    if (!selectedSlot || !task) {
      Alert.alert('Selecione um horário', 'Escolha uma janela de tempo antes de aprovar.');
      return;
    }
    setSaving(true);
    const newDueDate = selectedSlot.date.toISOString();
    await Promise.all([
      supabase.from('smart_reschedule_logs').insert({
        task_id: taskId,
        user_id: user?.id,
        triggered_by: 'user',
        original_due_date: task.due_date,
        new_due_date: newDueDate,
        reason: 'Reagendamento manual via sugestão inteligente',
        accepted: true,
      }),
      supabase.from('tasks').update({ due_date: newDueDate }).eq('id', taskId),
    ]);
    setSaving(false);
    Alert.alert('Reagendado', 'A tarefa foi reagendada com sucesso.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  const suggestion = slots.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reagendar tarefa</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning }]}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
          <Text style={[styles.bannerText, { color: colors.warning }]}>
            Não conseguiu concluir{task ? ` "${task.title}"` : ''} até a data prevista
          </Text>
        </View>

        {/* Detected reason */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Motivo detectado</Text>
          <View style={styles.reasonItem}>
            <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.reasonText, { color: colors.textPrimary }]}>
              Você tem outras tarefas críticas no mesmo período
            </Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.reasonText, { color: colors.textPrimary }]}>
              Sua disponibilidade está limitada nos próximos 2 dias
            </Text>
          </View>
        </Card>

        {/* AI Suggestion */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Sugestão inteligente</Text>
          <Text style={[styles.suggText, { color: colors.textPrimary }]}>
            Redistribuir em 3 blocos de 40 minutos:
          </Text>
          {suggestion.map((slot, i) => (
            <View key={i} style={styles.suggSlot}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.suggSlotText, { color: colors.textPrimary }]}>{slot.label}</Text>
            </View>
          ))}
        </Card>

        {/* Free slots */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Janelas livres identificadas</Text>
        {slots.map((slot, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
            accessibilityLabel={`Horário ${slot.label}`}
          >
            <Card
              style={[
                styles.slotCard,
                selectedSlot === slot && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <View style={styles.slotRow}>
                <Ionicons
                  name={selectedSlot === slot ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedSlot === slot ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotLabel, { color: colors.textPrimary }]}>{slot.label}</Text>
                  <Text style={[styles.slotDur, { color: colors.textSecondary }]}>{slot.duration} minutos disponíveis</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Impact on group */}
        {task?.group_id && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Impacto no cronograma</Text>
            <Text style={[styles.impactText, { color: colors.warning }]}>
              Isso pode atrasar a próxima entrega do grupo em até 1 dia.
            </Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Aprovar reagendamento" onPress={handleApprove} loading={saving} style={{ flex: 1 }} />
        </View>
        <Button
          label="Descartar"
          onPress={() => router.back()}
          variant="ghost"
          style={{ marginBottom: spacing.md }}
        />
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
  title: { ...typography.h3 },
  container: { padding: spacing.md, gap: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { ...typography.body, flex: 1 },
  sectionLabel: { ...typography.caption, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.xs },
  sectionTitle: { ...typography.h3 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  reasonText: { ...typography.body, flex: 1 },
  suggText: { ...typography.body, marginBottom: spacing.xs },
  suggSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 2 },
  suggSlotText: { ...typography.caption },
  slotCard: { gap: spacing.xs },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  slotLabel: { ...typography.body, fontWeight: '500' },
  slotDur: { ...typography.caption },
  impactText: { ...typography.body },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
