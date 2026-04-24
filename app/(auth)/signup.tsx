import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../store/themeStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { typography, spacing, radii } from '../../lib/theme';

// Returns the redirect URL for email confirmation.
// On web: current origin + /callback  (must be whitelisted in Supabase dashboard)
// On mobile: Expo Go / bare doesn't receive email links, so we skip confirmation.
function getRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }
  return 'studysync://callback';
}

type Stage = 'form' | 'check-email';

export default function SignupScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!email.trim()) e.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido';
    if (!password) e.password = 'Senha obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: getRedirectUrl(),
      },
    });

    setLoading(false);

    if (error) {
      setApiError(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation is DISABLED in Supabase — user is already logged in.
      router.replace('/(auth)/onboarding');
    } else {
      // Email confirmation is ENABLED — show the "check your inbox" screen.
      setStage('check-email');
    }
  }

  async function handleResend() {
    setResending(true);
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getRedirectUrl() },
    });
    setResending(false);
  }

  // ── Check-email stage ──────────────────────────────────────────────────────
  if (stage === 'check-email') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.confirmContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
            <Ionicons name="mail-outline" size={56} color={colors.primary} />
          </View>

          <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
            Confirme seu e-mail
          </Text>
          <Text style={[styles.confirmBody, { color: colors.textSecondary }]}>
            Enviamos um link de confirmação para{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{email}</Text>
            {'\n\n'}Clique no link para ativar sua conta e volte para fazer login.
          </Text>

          {/* Steps */}
          <View style={[styles.stepsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              'Abra o e-mail de confirmação',
              'Clique em "Confirmar e-mail"',
              'Volte aqui e faça login',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>{step}</Text>
              </View>
            ))}
          </View>

          <Button
            label="Ir para o login"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%' }}
          />

          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={[styles.resend, { color: colors.textSecondary }]}>
              Não recebeu?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {resending ? 'Enviando...' : 'Reenviar e-mail'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStage('form')}>
            <Text style={[styles.resend, { color: colors.textSecondary }]}>
              E-mail errado?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Corrigir</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Signup form ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>Study-Sync</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Criar conta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Comece a organizar seus estudos de forma inteligente
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nome completo"
              value={name}
              onChangeText={(v) => { setName(v); setApiError(''); }}
              placeholder="Seu nome"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
            />
            <Input
              label="E-mail"
              value={email}
              onChangeText={(v) => { setEmail(v); setApiError(''); }}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={(v) => { setPassword(v); setApiError(''); }}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              error={errors.password}
            />

            {apiError ? (
              <View style={[styles.apiErrorBox, { backgroundColor: colors.danger + '1A', borderColor: colors.danger }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.apiErrorText, { color: colors.danger }]}>{apiError}</Text>
              </View>
            ) : null}

            <Button label="Criar conta" onPress={handleSignup} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Já tem conta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.link, { color: colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm },
  logo: { fontSize: 36, fontWeight: '800' },
  title: { ...typography.h1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
  form: { gap: spacing.md },
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  apiErrorText: { ...typography.caption, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.body },
  link: { ...typography.body, fontWeight: '600' },
  // check-email stage
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { ...typography.h1, textAlign: 'center' },
  confirmBody: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  stepsCard: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { ...typography.body, flex: 1 },
  resend: { ...typography.body, textAlign: 'center' },
});
