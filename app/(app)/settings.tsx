import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Card } from '../../components/Card';
import { typography, spacing, radii } from '../../lib/theme';
import { formatMinutes } from '../../lib/utils';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const POMODORO_OPTIONS = [15, 25, 45, 60];
const GOAL_OPTIONS = [30, 60, 120, 180, 240, 360];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useThemeStore();
  const { profile, signOut, fetchProfile } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();

  const [notifTypes, setNotifTypes] = useState({
    focus: true,
    overdue: true,
    group: true,
    reschedule: true,
  });

  async function savePomodoro(val: number) {
    if (!profile?.id) return;
    await supabase.from('user_profiles').update({ pomodoro_duration: val }).eq('id', profile.id);
    await fetchProfile();
  }

  async function saveGoal(val: number) {
    if (!profile?.id) return;
    await supabase.from('user_profiles').update({ study_goal_minutes: val }).eq('id', profile.id);
    await fetchProfile();
  }

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="settings" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Configurações</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/notifications')}
          style={styles.bellBtn}
          accessibilityLabel={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        >
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={22}
            color={unreadCount > 0 ? colors.primary : colors.textSecondary}
          />
          {unreadCount > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: colors.danger }]}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Perfil */}
        <SectionTitle icon="person-circle-outline" label="Perfil" color={colors.textSecondary} />
        <TouchableOpacity onPress={() => router.push('/(app)/profile')} activeOpacity={0.8}>
          <Card style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {profile?.display_name || 'Usuário'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {profile?.email || ''}
              </Text>
              {profile?.course && (
                <Text style={[styles.profileCourse, { color: colors.textSecondary }]}>
                  {profile.course}{profile.semester ? ` · ${profile.semester}º período` : ''}
                </Text>
              )}
            </View>
            <View style={[styles.xpBadge, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={[styles.xpText, { color: colors.primary }]}>
                {profile?.xp ?? 0} XP
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Aparência */}
        <SectionTitle icon="color-palette-outline" label="Aparência" color={colors.textSecondary} />
        <Card>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Tema</Text>
          <View style={styles.themeRow}>
            {([
              { key: 'light', label: 'Claro', icon: 'sunny-outline' as IoniconsName },
              { key: 'dark', label: 'Escuro', icon: 'moon-outline' as IoniconsName },
              { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' as IoniconsName },
            ] as const).map((m) => {
              const active = mode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Tema ${m.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={m.icon} size={15} color={active ? '#fff' : colors.textSecondary} />
                  <Text style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Foco */}
        <SectionTitle icon="timer-outline" label="Foco" color={colors.textSecondary} />
        <Card style={{ gap: spacing.md }}>
          <View style={styles.settingBlock}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Pomodoro{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {profile?.pomodoro_duration ?? 25} min
              </Text>
            </Text>
            <View style={styles.chipRow}>
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
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      {opt}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingBlock}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Meta diária{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {formatMinutes(profile?.study_goal_minutes ?? 120)}
              </Text>
            </Text>
            <View style={styles.chipRow}>
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
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      {opt >= 60 ? `${opt / 60}h` : `${opt}m`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Notificações */}
        <SectionTitle icon="notifications-outline" label="Notificações" color={colors.textSecondary} />
        <Card style={{ gap: 0 }}>
          {([
            ['focus', 'Lembretes de foco', 'timer-outline'],
            ['overdue', 'Alertas de atraso', 'warning-outline'],
            ['group', 'Progresso do grupo', 'people-outline'],
            ['reschedule', 'Sugestões de reagendamento', 'calendar-outline'],
          ] as const).map(([key, label, icon], idx, arr) => (
            <View
              key={key}
              style={[
                styles.toggleRow,
                idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Ionicons name={icon as IoniconsName} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
              <Switch
                value={notifTypes[key]}
                onValueChange={(v) => setNotifTypes((prev) => ({ ...prev, [key]: v }))}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </Card>

        {/* Conta */}
        <SectionTitle icon="shield-outline" label="Conta" color={colors.textSecondary} />
        <Card style={{ gap: 0 }}>
          <SettingsRow
            icon="person-outline"
            label="Ver perfil completo"
            iconColor={colors.primary}
            textColor={colors.textPrimary}
            borderColor={colors.border}
            onPress={() => router.push('/(app)/profile')}
            showChevron
          />
          <SettingsRow
            icon="notifications-outline"
            label="Central de notificações"
            iconColor={colors.accent}
            textColor={colors.textPrimary}
            borderColor={colors.border}
            badge={unreadCount > 0 ? unreadCount : undefined}
            onPress={() => router.push('/(app)/notifications')}
            showChevron
          />
          <SettingsRow
            icon="log-out-outline"
            label="Sair da conta"
            iconColor={colors.danger}
            textColor={colors.danger}
            borderColor="transparent"
            onPress={handleSignOut}
          />
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, label, color }: { icon: IoniconsName; label: string; color: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.sectionTitleText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  iconColor,
  textColor,
  borderColor,
  badge,
  onPress,
  showChevron,
}: {
  icon: IoniconsName;
  label: string;
  iconColor: string;
  textColor: string;
  borderColor: string;
  badge?: number;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingsRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.settingsRowText, { color: textColor }]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
      {showChevron && <Ionicons name="chevron-forward" size={16} color={iconColor} />}
    </TouchableOpacity>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconWrap: { width: 30, height: 30, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { ...typography.h3 },
  bellBtn: { position: 'relative', padding: 6 },
  bellBadge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  container: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs, marginBottom: 2 },
  sectionTitleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  // Profile card
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  profileName: { ...typography.body, fontWeight: '600' },
  profileEmail: { ...typography.caption },
  profileCourse: { ...typography.caption },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  xpText: { fontSize: 11, fontWeight: '700' },
  // Theme
  themeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: spacing.xs + 2, borderRadius: radii.md, borderWidth: 1,
  },
  // Settings blocks
  settingBlock: { gap: spacing.xs },
  settingLabel: { ...typography.body, fontWeight: '500' },
  divider: { height: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  optChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1 },
  // Notifications
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  toggleLabel: { ...typography.body, flex: 1 },
  // Settings rows
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2 },
  settingsRowText: { ...typography.body, flex: 1 },
  rowBadge: { backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  rowBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
