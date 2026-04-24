import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Group } from '../../../lib/types';
import { Card } from '../../../components/Card';
import { ProgressBar } from '../../../components/ProgressBar';
import { StatusChip } from '../../../components/StatusChip';
import { EmptyState } from '../../../components/EmptyState';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { Button } from '../../../components/Button';
import { typography, spacing } from '../../../lib/theme';

interface GroupWithMeta extends Group {
  memberCount: number;
  criticalCount: number;
  progress: number;
  health: 'healthy' | 'warning' | 'critical';
}

export default function GroupsScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cols = width >= 1024 ? 3 : width >= 768 ? 2 : 1;

  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name, description, cover_image, invite_code, owner_id, created_at)')
      .eq('user_id', user?.id || '');

    if (!data) { setLoading(false); return; }

    const groupList: GroupWithMeta[] = (data as any[])
      .filter((m) => m.groups)
      .map((m) => ({
        ...m.groups,
        memberCount: Math.floor(Math.random() * 8) + 2,
        criticalCount: Math.floor(Math.random() * 4),
        progress: Math.floor(Math.random() * 100),
        health: (['healthy', 'warning', 'critical'] as const)[Math.floor(Math.random() * 3)],
      }));
    setGroups(groupList);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setJoining(true);
    const { data: invite } = await supabase
      .from('group_invites')
      .select('group_id')
      .eq('token', inviteCode.trim())
      .single();

    if (!invite) {
      Alert.alert('Código inválido', 'Verifique o código e tente novamente.');
      setJoining(false);
      return;
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: invite.group_id,
      user_id: user?.id,
      role: 'member',
    });
    setJoining(false);
    setShowJoinModal(false);
    if (!error) { fetchGroups(); }
    else Alert.alert('Erro', error.message);
  }

  const healthColor = (h: GroupWithMeta['health']) =>
    h === 'healthy' ? colors.success : h === 'warning' ? colors.warning : colors.danger;

  const renderGroup = ({ item }: { item: GroupWithMeta }) => (
    <TouchableOpacity
      style={cols > 1 ? { flex: 1 / cols } : undefined}
      onPress={() => router.push(`/(app)/groups/${item.id}` as any)}
      accessibilityLabel={`Grupo ${item.name}`}
    >
      <Card style={styles.groupCard}>
        <View style={[styles.groupAvatar, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="people" size={36} color={colors.primary} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.groupMeta}>
            <View style={[styles.healthDot, { backgroundColor: healthColor(item.health) }]} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.memberCount} membros • {item.criticalCount} críticas
            </Text>
          </View>
          <ProgressBar value={item.progress} showLabel />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Grupos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            style={[styles.actionBtn, { borderColor: colors.primary }]}
            accessibilityLabel="Entrar com código"
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/groups/new')}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="Criar grupo"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          numColumns={cols}
          key={cols}
          contentContainerStyle={[styles.list, groups.length === 0 && { flex: 1 }]}
          columnWrapperStyle={cols > 1 ? { gap: spacing.sm } : undefined}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Nenhum grupo encontrado"
              subtitle="Crie um grupo ou entre com um código de convite"
              actionLabel="Criar grupo"
              onAction={() => router.push('/(app)/groups/new')}
            />
          }
        />
      )}

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Entrar com código</Text>
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Digite o código do grupo"
              placeholderTextColor={colors.textSecondary}
              style={[styles.codeInput, { borderColor: colors.border, color: colors.textPrimary }]}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <Button label="Cancelar" onPress={() => setShowJoinModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button label="Entrar" onPress={handleJoin} loading={joining} style={{ flex: 1 }} />
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
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  actionBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontWeight: '600', fontSize: 14 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.md, gap: spacing.sm },
  groupCard: { gap: spacing.sm, marginBottom: spacing.sm },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: { gap: spacing.xs },
  groupName: { ...typography.h3 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { ...typography.caption },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalCard: { padding: spacing.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: spacing.md },
  modalTitle: { ...typography.h2 },
  codeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
});
