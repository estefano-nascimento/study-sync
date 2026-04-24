import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { CalendarEvent, EventType } from '../../lib/types';
import { Card } from '../../components/Card';
import { StatusChip } from '../../components/StatusChip';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { typography, spacing, radii } from '../../lib/theme';

const EVENT_COLORS: Record<EventType, string> = {
  class: '#2F5BFF',
  exam: '#EF4444',
  meeting: '#19C2C9',
  deadline: '#F59E0B',
};

const EVENT_LABELS: Record<EventType, string> = {
  class: 'Aula',
  exam: 'Prova',
  meeting: 'Reunião',
  deadline: 'Prazo',
};

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const EVENT_ICONS: Record<EventType, IoniconsName> = {
  class: 'book-outline',
  exam: 'document-text-outline',
  meeting: 'people-outline',
  deadline: 'alarm-outline',
};

export default function CalendarScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();

  const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('class');
  const [newDate, setNewDate] = useState(selected);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [titleError, setTitleError] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => { fetchEvents(); }, []);

  // Ao selecionar um dia, pré-preenche a data do formulário
  function handleDayPress(day: { dateString: string }) {
    setSelected(day.dateString);
    setNewDate(day.dateString);
  }

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .order('starts_at', { ascending: true });
    const evts = (data as CalendarEvent[]) || [];
    setEvents(evts);

    const marks: Record<string, any> = {};
    evts.forEach((e) => {
      const day = e.starts_at.split('T')[0];
      if (!marks[day]) marks[day] = { dots: [] };
      marks[day].dots.push({ color: EVENT_COLORS[e.event_type] || colors.primary });
    });
    if (!marks[selected]) marks[selected] = {};
    marks[selected].selected = true;
    marks[selected].selectedColor = colors.primary;
    setMarkedDates(marks);
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const dayEvents = events.filter((e) => e.starts_at.startsWith(selected));

  function validateTime(time: string): boolean {
    return /^\d{2}:\d{2}$/.test(time);
  }

  function openModal() {
    setNewTitle('');
    setNewType('class');
    setNewDate(selected);
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setTitleError('');
    setTimeError('');
    setShowModal(true);
  }

  async function createEvent() {
    let valid = true;

    if (!newTitle.trim()) {
      setTitleError('Informe o título do evento.');
      valid = false;
    } else {
      setTitleError('');
    }

    if (!validateTime(newStartTime) || !validateTime(newEndTime)) {
      setTimeError('Horários devem estar no formato HH:MM (ex: 09:30).');
      valid = false;
    } else if (newStartTime >= newEndTime) {
      setTimeError('O horário de início deve ser anterior ao fim.');
      valid = false;
    } else {
      setTimeError('');
    }

    if (!valid) return;

    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }

    setSaving(true);
    try {
      const starts_at = `${newDate}T${newStartTime}:00`;
      const ends_at = `${newDate}T${newEndTime}:00`;

      const { error } = await supabase.from('calendar_events').insert({
        title: newTitle.trim(),
        event_type: newType,
        starts_at,
        ends_at,
        created_by: user.id,
      });

      if (error) {
        Alert.alert('Erro ao criar evento', error.message);
        return;
      }

      setShowModal(false);
      await fetchEvents();
    } catch (e: any) {
      Alert.alert('Erro inesperado', e?.message ?? 'Não foi possível criar o evento.');
    } finally {
      setSaving(false);
    }
  }

  const calTheme = {
    backgroundColor: colors.background,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: '#fff',
    todayTextColor: colors.primary,
    dayTextColor: colors.textPrimary,
    textDisabledColor: colors.border,
    dotColor: colors.primary,
    arrowColor: colors.primary,
    monthTextColor: colors.textPrimary,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Calendário</Text>
        <TouchableOpacity
          onPress={openModal}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel="Criar evento"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Legenda de tipos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legend}
        >
          {Object.entries(EVENT_LABELS).map(([type, label]) => (
            <View key={type} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: EVENT_COLORS[type as EventType] }]}
              />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Calendário */}
        <Calendar
          current={selected}
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selected]: {
              ...markedDates[selected],
              selected: true,
              selectedColor: colors.primary,
            },
          }}
          markingType="multi-dot"
          theme={calTheme}
          style={styles.calendar}
        />

        {/* Eventos do dia selecionado */}
        <View style={styles.daySection}>
          <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>
            {format(new Date(selected + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </Text>

          {dayEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nenhum evento neste dia"
              subtitle="Toque em + para adicionar um evento"
            />
          ) : (
            dayEvents.map((evt) => {
              const evtColor = EVENT_COLORS[evt.event_type] || colors.primary;
              return (
                <Card key={evt.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View style={[styles.eventTypeBar, { backgroundColor: evtColor }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                        {evt.title}
                      </Text>
                      <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                        {format(new Date(evt.starts_at), 'HH:mm')} –{' '}
                        {format(new Date(evt.ends_at), 'HH:mm')}
                      </Text>
                    </View>
                    <StatusChip label={EVENT_LABELS[evt.event_type]} color={evtColor} />
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de criação de evento */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            {/* Cabeçalho do modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Novo evento</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                accessibilityLabel="Fechar"
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Título *"
              value={newTitle}
              onChangeText={(v) => { setNewTitle(v); if (v) setTitleError(''); }}
              placeholder="Ex: Prova de Cálculo II"
              error={titleError}
              autoFocus
            />

            {/* Tipo do evento */}
            <View>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>TIPO</Text>
              <View style={styles.typeRow}>
                {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([type, label]) => {
                  const active = newType === type;
                  const tColor = EVENT_COLORS[type];
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setNewType(type)}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: active ? tColor + '18' : colors.background,
                          borderColor: active ? tColor : colors.border,
                        },
                      ]}
                      accessibilityLabel={`Tipo ${label}`}
                    >
                      <Ionicons
                        name={EVENT_ICONS[type]}
                        size={14}
                        color={active ? tColor : colors.textSecondary}
                      />
                      <Text
                        style={{
                          color: active ? tColor : colors.textSecondary,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Data */}
            <Input
              label="Data (AAAA-MM-DD)"
              value={newDate}
              onChangeText={setNewDate}
              placeholder={selected}
              keyboardType="numeric"
            />

            {/* Horários */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Início (HH:MM)"
                  value={newStartTime}
                  onChangeText={(v) => { setNewStartTime(v); setTimeError(''); }}
                  placeholder="09:00"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.timeSep, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Fim (HH:MM)"
                  value={newEndTime}
                  onChangeText={(v) => { setNewEndTime(v); setTimeError(''); }}
                  placeholder="10:00"
                  keyboardType="numeric"
                />
              </View>
            </View>
            {timeError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{timeError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                label="Cancelar"
                onPress={() => setShowModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                label="Criar evento"
                onPress={createEvent}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  legend: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption },
  calendar: { borderRadius: 16, marginHorizontal: spacing.md, overflow: 'hidden' },
  daySection: { padding: spacing.md, gap: spacing.sm },
  dayTitle: { ...typography.h3, textTransform: 'capitalize', marginBottom: spacing.xs },
  eventCard: { padding: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eventTypeBar: { width: 4, height: 44, borderRadius: 2 },
  eventTitle: { ...typography.body, fontWeight: '600' },
  eventTime: { ...typography.caption },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalCard: {
    padding: spacing.lg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...typography.h2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeSep: { width: 1, height: 48, marginTop: 20 },
  errorText: { ...typography.caption, marginTop: -spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
});
