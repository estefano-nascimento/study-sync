import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { typography, spacing } from '../../../lib/theme';
import { crossAlert } from '../../../lib/utils';

export default function NewGroupScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      crossAlert('Atenção', 'Nome do grupo é obrigatório');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('groups').insert({
      name: name.trim(),
      description: description.trim() || null,
      owner_id: user?.id,
    }).select().single();

    if (error) {
      setSaving(false);
      crossAlert('Erro', error.message);
      return;
    }

    // Add owner as member
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: user?.id,
      role: 'owner',
    });

    setSaving(false);
    router.replace(`/(app)/groups/${data.id}` as any);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Novo grupo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Crie um grupo e compartilhe o código de convite com seus colegas.
        </Text>
        <Input
          label="Nome do grupo *"
          value={name}
          onChangeText={setName}
          placeholder="Ex: TCC de Engenharia"
          autoCapitalize="words"
        />
        <Input
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Sobre o projeto..."
          multiline
          numberOfLines={3}
          style={{ height: 80, paddingTop: spacing.sm }}
        />
        <Button label="Criar grupo" onPress={handleCreate} loading={saving} />
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
  hint: { ...typography.body, lineHeight: 22 },
});
