import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Task } from '../../../lib/types';
import { timerFormat } from '../../../lib/utils';
import { typography, spacing } from '../../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DARK_BG = '#0F172A';

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const { profile } = useAuthStore();
  const { colors } = useThemeStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const pomoDuration = (profile?.pomodoro_duration ?? 25) * 60;
  const timerSize = Math.min(width * 0.65, 400);
  const radius = timerSize / 2 - 16;
  const circumference = 2 * Math.PI * radius;

  const [task, setTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(pomoDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  const progress = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (taskId) {
      supabase.from('tasks').select('*, groups(id, name)').eq('id', taskId).single()
        .then(({ data }) => { if (data) setTask(data as Task); });
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [taskId]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  async function startSession() {
    const { data } = await supabase.from('study_sessions').insert({
      user_id: user?.id,
      task_id: taskId,
      session_type: 'pomodoro',
      started_at: new Date().toISOString(),
      distractions: 0,
    }).select().single();
    if (data) setSessionId(data.id);

    startTimeRef.current = new Date();
    setIsRunning(true);
    setIsPaused(false);
    tick();
  }

  function tick() {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        progress.value = withTiming(next / pomoDuration, { duration: 900 });
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setShowRating(true);
          return 0;
        }
        return next;
      });

      // Update progress every minute
      const elapsed = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000)
        : 0;
      if (elapsed > 0 && sessionId && taskId) {
        supabase.from('task_progress').upsert({
          task_id: taskId,
          user_id: user?.id,
          time_spent_minutes: elapsed,
        }, { onConflict: 'task_id,user_id' });
      }
    }, 1000);
  }

  function togglePause() {
    if (isPaused) {
      setIsPaused(false);
      tick();
    } else {
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }

  function markDistraction() {
    setDistractions((d) => d + 1);
  }

  async function finishSession() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setShowRating(true);
  }

  async function submitRating(score: number) {
    const elapsed = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000)
      : 0;
    if (sessionId) {
      await supabase.from('study_sessions').update({
        ended_at: new Date().toISOString(),
        duration_minutes: elapsed,
        focus_score: score,
        distractions,
      }).eq('id', sessionId);
    }
    setShowRating(false);
    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: DARK_BG }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Task name */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Sair">
            <Ionicons name="chevron-down" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.taskName} numberOfLines={1}>
            {task?.title || 'Carregando...'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Svg width={timerSize} height={timerSize}>
            {/* Background track */}
            <Circle
              cx={timerSize / 2}
              cy={timerSize / 2}
              r={radius}
              stroke="#1E293B"
              strokeWidth={12}
              fill="transparent"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={timerSize / 2}
              cy={timerSize / 2}
              r={radius}
              stroke="#5B8CFF"
              strokeWidth={12}
              fill="transparent"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${timerSize / 2}, ${timerSize / 2}`}
            />
          </Svg>
          <View style={[styles.timerCenter, { width: timerSize, height: timerSize }]}>
            <Text style={styles.timerText}>{timerFormat(secondsLeft)}</Text>
            <Text style={styles.timerLabel}>
              {isRunning ? (isPaused ? 'Pausado' : 'Focando') : 'Pronto'}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ciclo {cycle}/4</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Foco profundo</Text>
          </View>
          {distractions > 0 && (
            <View style={[styles.badge, { backgroundColor: '#EF444422' }]}>
              <Text style={[styles.badgeText, { color: '#F87171' }]}>{distractions} distrações</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={markDistraction}
            style={styles.iconBtn}
            accessibilityLabel="Marcar distração"
          >
            <Ionicons name="cellular" size={28} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isRunning ? togglePause : startSession}
            style={[styles.mainBtn, { backgroundColor: '#5B8CFF' }]}
            accessibilityLabel={isRunning ? (isPaused ? 'Retomar' : 'Pausar') : 'Iniciar'}
          >
            <Ionicons
              name={isRunning && !isPaused ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={finishSession}
            style={styles.iconBtn}
            accessibilityLabel="Concluir sessão"
            disabled={!isRunning}
          >
            <Ionicons name="stop-circle-outline" size={28} color={isRunning ? '#94A3B8' : '#334155'} />
          </TouchableOpacity>
        </View>

        {/* Group sync indicator */}
        {task?.group_id && (
          <Text style={styles.syncNote}>
            Seu foco está atualizando o progresso do projeto em tempo real
          </Text>
        )}
      </SafeAreaView>

      {/* Rating Modal */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: '#1E293B' }]}>
            <Text style={styles.modalTitle}>Como foi a sessão?</Text>
            <Text style={styles.modalSub}>Avalie seu nível de foco</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setRating(s)}
                  accessibilityLabel={`${s} estrelas`}
                >
                  <Ionicons
                    name={s <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color="#FBBF24"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#5B8CFF' }]}
              onPress={() => submitRating(rating)}
              accessibilityLabel="Confirmar avaliação"
            >
              <Text style={styles.submitText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  taskName: { color: '#94A3B8', fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'center' },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#E5E7EB',
    fontVariant: ['tabular-nums'] as any,
  },
  timerLabel: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  badges: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' },
  mainBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  syncNote: { color: '#475569', fontSize: 12, textAlign: 'center', paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  modalCard: { padding: spacing.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: spacing.md },
  modalTitle: { color: '#E5E7EB', ...typography.h2, textAlign: 'center' },
  modalSub: { color: '#94A3B8', textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  submitBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
