import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useThemeStore } from '../../../../store/themeStore';
import { GroupMember, GroupRole } from '../../../../lib/types';
import { Card } from '../../../../components/Card';
import { StatusChip } from '../../../../components/StatusChip';
import { EmptyState } from '../../../../components/EmptyState';
import { typography, spacing } from '../../../../lib/theme';
import { formatRelative } from '../../../../lib/utils';

const ROLE_LABELS: Record<GroupRole, string> = {
  owner: 'Dono',
  admin: 'Admin',
  member: 'Membro',
  viewer: 'Visualizador',
};

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const router = useRouter();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (id) fetchMembers(); }, [id]);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase
      .from('group_members')
      .select('*, user_profiles(display_name, avatar_url, last_active_at, xp, level)')
      .eq('group_id', id)
      .order('joined_at', { ascending: true });
    setMembers((data as GroupMember[]) || []);
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Membros ({members.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, members.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="Nenhum membro" subtitle="Convide pessoas com o código do grupo" />
        }
        renderItem={({ item }) => {
          const profile = item.user_profiles;
          const isOwner = item.role === 'owner';
          return (
            <Card style={styles.memberCard}>
              <View style={styles.memberRow}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                      {profile?.display_name || 'Usuário'}
                    </Text>
                    {isOwner && (
                      <Ionicons name="star" size={14} color={colors.warning} />
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <StatusChip
                      label={ROLE_LABELS[item.role]}
                      variant={isOwner ? 'today' : 'default'}
                    />
                    {profile?.last_active_at && (
                      <Text style={[styles.lastActive, { color: colors.textSecondary }]}>
                        ativo {formatRelative(profile.last_active_at)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={[styles.xp, { color: colors.primary }]}>{profile?.xp ?? 0} XP</Text>
                  <Text style={[styles.level, { color: colors.textSecondary }]}>Nível {profile?.level ?? 1}</Text>
                </View>
              </View>
            </Card>
          );
        }}
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
  list: { padding: spacing.md, gap: spacing.sm },
  memberCard: {},
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  memberName: { ...typography.body, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  lastActive: { ...typography.caption },
  xp: { fontWeight: '700', fontSize: 13 },
  level: { ...typography.caption },
});
