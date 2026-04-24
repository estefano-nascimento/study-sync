import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { typography, spacing, radii } from '../../lib/theme';

const SLIDES = [
  {
    id: '1',
    icon: 'calendar' as const,
    title: 'Organize suas tarefas',
    desc: 'Gerencie prazos, prioridades e disciplinas em um só lugar. Nunca perca uma entrega importante.',
  },
  {
    id: '2',
    icon: 'timer' as const,
    title: 'Mantenha o foco',
    desc: 'Use o método Pomodoro para sessões de foco profundo. Acompanhe seu progresso em tempo real.',
  },
  {
    id: '3',
    icon: 'git-network' as const,
    title: 'Sincronize com seu grupo',
    desc: 'Veja o progresso de todos os membros, coordene horários e mantenha o projeto no prazo.',
  },
];

const POMODORO_OPTIONS = [15, 25, 45, 60];
const GOAL_OPTIONS = [30, 60, 120, 180, 240, 360];

export default function OnboardingScreen() {
  const { colors } = useThemeStore();
  const { setMode } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPrefs, setShowPrefs] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pomodoro, setPomodoro] = useState(25);
  const [goalMinutes, setGoalMinutes] = useState(120);
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    setSaving(true);
    setMode(darkMode ? 'dark' : 'light');
    if (user) {
      await supabase.from('user_profiles').update({
        study_goal_minutes: goalMinutes,
        pomodoro_duration: pomodoro,
        theme: darkMode ? 'dark' : 'light',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).eq('id', user.id);
    }
    setSaving(false);
    router.replace('/(app)/dashboard');
  }

  if (showPrefs) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.prefsContainer}>
          <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>Suas preferências</Text>
          <Text style={[styles.prefSubtitle, { color: colors.textSecondary }]}>
            Personalize sua experiência de estudo
          </Text>

          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>Tema</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setDarkMode(false)}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border, backgroundColor: !darkMode ? colors.primary : colors.surface },
                ]}
              >
                <Ionicons name="sunny" size={20} color={!darkMode ? '#fff' : colors.textSecondary} />
                <Text style={{ color: !darkMode ? '#fff' : colors.textSecondary, fontWeight: '600' }}>Claro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDarkMode(true)}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border, backgroundColor: darkMode ? colors.primary : colors.surface },
                ]}
              >
                <Ionicons name="moon" size={20} color={darkMode ? '#fff' : colors.textSecondary} />
                <Text style={{ color: darkMode ? '#fff' : colors.textSecondary, fontWeight: '600' }}>Escuro</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>
              Duração do Pomodoro: <Text style={{ color: colors.primary }}>{pomodoro} min</Text>
            </Text>
            <View style={styles.optionsRow}>
              {POMODORO_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setPomodoro(opt)}
                  style={[
                    styles.optionChip,
                    {
                      borderColor: pomodoro === opt ? colors.primary : colors.border,
                      backgroundColor: pomodoro === opt ? colors.primary + '1A' : colors.surface,
                    },
                  ]}
                >
                  <Text style={{ color: pomodoro === opt ? colors.primary : colors.textSecondary, fontWeight: '600' }}>
                    {opt}min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>
              Meta diária: <Text style={{ color: colors.primary }}>{goalMinutes >= 60 ? `${goalMinutes / 60}h` : `${goalMinutes}min`}</Text>
            </Text>
            <View style={styles.optionsRow}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setGoalMinutes(opt)}
                  style={[
                    styles.optionChip,
                    {
                      borderColor: goalMinutes === opt ? colors.primary : colors.border,
                      backgroundColor: goalMinutes === opt ? colors.primary + '1A' : colors.surface,
                    },
                  ]}
                >
                  <Text style={{ color: goalMinutes === opt ? colors.primary : colors.textSecondary, fontWeight: '600' }}>
                    {opt >= 60 ? `${opt / 60}h` : `${opt}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button label="Começar" onPress={handleStart} loading={saving} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name={item.icon} size={80} color={colors.primary} />
            </View>
            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentSlide ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
        <Button
          label={currentSlide === SLIDES.length - 1 ? 'Configurar preferências' : 'Próximo'}
          onPress={() => {
            if (currentSlide === SLIDES.length - 1) {
              setShowPrefs(true);
            } else {
              flatRef.current?.scrollToIndex({ index: currentSlide + 1, animated: true });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: { ...typography.h1, textAlign: 'center' },
  slideDesc: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  footer: { padding: spacing.lg, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  prefsContainer: { padding: spacing.lg, gap: spacing.lg },
  prefTitle: { ...typography.h1 },
  prefSubtitle: { ...typography.body },
  prefSection: { gap: spacing.sm },
  prefLabel: { ...typography.body, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
