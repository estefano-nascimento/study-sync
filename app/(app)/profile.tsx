import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { UserAchievement } from '../../lib/types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { typography, spacing, radii } from '../../lib/theme';
import { formatMinutes } from '../../lib/utils';

const POMODORO_OPTIONS = [15, 25, 45, 60];
const GOAL_OPTIONS = [30, 60, 120, 180, 240, 360];

export default function ProfileScreen() {
  const { colors, mode, setMode } = useThemeStore();
  const { profile, signOut, fetchProfile } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();

  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ hours: 0, completed: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifTypes, setNotifTypes] = useState({
    focus: true,
    overdue: true,
    group: true,
    reschedule: true,
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [achRes, allAchRes, sessRes, taskRes] = await Promise.all([
      supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', profile?.id || ''),
      supabase.from('achievements').select('*'),
      supabase
        .from('study_sessions')
        .select('duration_minutes')
        .gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .not('duration_minutes', 'is', null),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'done'),
    ]);
    setAchievements((achRes.data as UserAchievement[]) || []);
    setAllAchievements((allAchRes.data as any[]) || []);
    const totalMinutes = (sessRes.data || []).reduce(
      (a, s) => a + (s.duration_minutes || 0),
      0
    );
    setStats({
      hours: Math.floor(totalMinutes / 60),
      completed: taskRes.count || 0,
      streak: 0,
    });
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchProfile();
    setRefreshing(false);
  };

  async function handleSignOut() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function savePomodoro(val: number) {
    if (!profile?.id) return;
    await supabase
      .from('user_profiles')
      .update({ pomodoro_duration: val })
      .eq('id', profile.id);
    await fetchProfile();
  }

  async function saveGoal(val: number) {
    if (!profile?.id) return;
    await supabase
      .from('user_profiles')
      .update({ study_goal_minutes: val })
      .eq('id', profile.id);
    await fetchProfile();
  }

  const unlockedIds = new Set(achievements.map((a) => a.achievement_id));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Perfil</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/notifications')}
          style={styles.bellWrap}
          accessibilityLabel={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        >
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={24}
            color={unreadCount > 0 ? colors.primary : colors.textSecondary}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e info */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.displayName, { color: colors.textPrimary }]}>
                {profile?.display_name || 'Usuário'}
              </Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                {profile?.email || ''}
              </Text>
              {profile?.course && (
                <Text style={[styles.course, { color: colors.textSecondary }]}>
                  {profile.course}
                  {profile.semester ? ` · ${profile.semester}º período` : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.xpRow}>
            <View style={[styles.xpBadge, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={[styles.xpText, { color: colors.primary }]}>
                {profile?.xp ?? 0} XP · Nível {profile?.level ?? 1}
              </Text>
            </View>
          </View>
        </Card>

        {/* Estatísticas */}
        {loading ? (
          <CardSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.hours}h</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Foco esta semana</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.completed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Concluídas</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{stats.streak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak (dias)</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{achievements.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Conquistas</Text>
            </Card>
          </View>
        )}

        {/* Conquistas */}
        {allAchievements.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Conquistas</Text>
            <View style={styles.achievGrid}>
              {allAchievements.map((ach) => {
                const unlocked = unlockedIds.has(ach.id);
                return (
                  <View
                    key={ach.id}
                    style={[
                      styles.achievItem,
                      {
                        backgroundColor: unlocked
                          ? colors.primary + '1A'
                          : colors.surface,
                        borderColor: unlocked ? colors.primary + '44' : colors.border,
                        borderWidth: 1,
                        opacity: unlocked ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 26 }}>{ach.icon || '🏆'}</Text>
                    <Text
                      style={[
                        styles.achievName,
                        { color: unlocked ? colors.primary : colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {ach.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Preferências */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferências</Text>
        <Card style={styles.prefsCard}>
          {/* Tema */}
          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>Tema</Text>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: mode === m ? colors.primary : colors.background,
                      borderColor: mode === m ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Tema ${m}`}
                  accessibilityState={{ selected: mode === m }}
                >
                  <Ionicons
                    name={m === 'light' ? 'sunny-outline' : m === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                    size={14}
                    color={mode === m ? '#fff' : colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: mode === m ? '#fff' : colors.textSecondary,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {m === 'light' ? 'Claro' : m === 'dark' ? 'Escuro' : 'Sistema'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pomodoro */}
          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>
              Pomodoro:{' '}
              <Text style={{ color: colors.primary }}>
                {profile?.pomodoro_duration ?? 25} min
              </Text>
            </Text>
            <View style={styles.optRow}>
              {POMODORO_OPTIONS.map((opt) => {
                const active = profile?.pomodoro_duration === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => savePomodoro(opt)}
                    style={[
                      styles.optChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '1A' : colors.background,
                      },
                    ]}
                    accessibilityLabel={`Pomodoro ${opt} minutos`}
                  >
                    <Text
                      style={{
                        color: active ? colors.primary : colors.textSecondary,
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {opt}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Meta diária */}
          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>
              Meta diária:{' '}
              <Text style={{ color: colors.primary }}>
                {formatMinutes(profile?.study_goal_minutes ?? 120)}
              </Text>
            </Text>
            <View style={styles.optRow}>
              {GOAL_OPTIONS.map((opt) => {
                const active = profile?.study_goal_minutes === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => saveGoal(opt)}
                    style={[
                      styles.optChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '1A' : colors.background,
                      },
                    ]}
                    accessibilityLabel={`Meta ${opt} minutos`}
                  >
                    <Text
                      style={{
                        color: active ? colors.primary : colors.textSecondary,
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {opt >= 60 ? `${opt / 60}h` : `${opt}m`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notificações */}
          <View style={styles.prefSection}>
            <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>Notificações</Text>
            {(
              [
                ['focus', 'Lembretes de foco'],
                ['overdue', 'Alertas de atraso'],
                ['group', 'Progresso do grupo'],
                ['reschedule', 'Sugestões de reagendamento'],
              ] as const
            ).map(([key, label]) => (
              <View key={key} style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
                <Switch
                  value={notifTypes[key]}
                  onValueChange={(v) => setNotifTypes((prev) => ({ ...prev, [key]: v }))}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </Card>

        <Button
          label="Sair da conta"
          onPress={handleSignOut}
          variant="danger"
          style={{ marginBottom: spacing.xl }}
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
  title: { ...typography.h2 },
  bellWrap: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  container: { padding: spacing.md, gap: spacing.md },
  profileCard: { gap: spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700' },
  displayName: { ...typography.h2 },
  email: { ...typography.caption },
  course: { ...typography.caption },
  xpRow: { flexDirection: 'row' },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  xpText: { fontWeight: '700', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { width: '47%', alignItems: 'center', gap: 4 },
  statValue: { ...typography.h1, fontWeight: '800' },
  statLabel: { ...typography.caption, textAlign: 'center' },
  sectionTitle: { ...typography.h3 },
  achievGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achievItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 4,
  },
  achievName: { fontSize: 10, textAlign: 'center' },
  prefsCard: { gap: spacing.md },
  prefSection: { gap: spacing.xs },
  prefLabel: { ...typography.body, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: spacing.xs },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  optChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { ...typography.body },
});
