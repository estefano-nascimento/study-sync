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

function getRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }
  return 'studysync://callback';
}

export default function LoginScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido';
    if (!password) e.password = 'Senha obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setNeedsConfirmation(false);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (!error) return; // onAuthStateChange in _layout.tsx handles redirect

    // Supabase returns this message when email isn't confirmed yet
    if (
      error.message.toLowerCase().includes('email not confirmed') ||
      error.message.toLowerCase().includes('email confirmation')
    ) {
      setNeedsConfirmation(true);
      setApiError('Você precisa confirmar seu e-mail antes de entrar.');
    } else if (error.message.toLowerCase().includes('invalid login credentials')) {
      setApiError('E-mail ou senha incorretos.');
    } else {
      setApiError(error.message);
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setErrors({ email: 'Digite seu e-mail para reenviar a confirmação' });
      return;
    }
    setResending(true);
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getRedirectUrl() },
    });
    setResending(false);
    setApiError('E-mail de confirmação reenviado. Verifique sua caixa de entrada.');
    setNeedsConfirmation(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>Study-Sync</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Bem-vindo de volta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Entre para continuar organizando seus estudos
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="E-mail"
              value={email}
              onChangeText={(v) => { setEmail(v); setApiError(''); setNeedsConfirmation(false); }}
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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            {/* API error / info banner */}
            {apiError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: needsConfirmation
                      ? colors.warning + '1A'
                      : apiError.includes('reenviado')
                      ? colors.success + '1A'
                      : colors.danger + '1A',
                    borderColor: needsConfirmation
                      ? colors.warning
                      : apiError.includes('reenviado')
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                <Ionicons
                  name={
                    apiError.includes('reenviado')
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={16}
                  color={
                    needsConfirmation
                      ? colors.warning
                      : apiError.includes('reenviado')
                      ? colors.success
                      : colors.danger
                  }
                />
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: needsConfirmation
                        ? colors.warning
                        : apiError.includes('reenviado')
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                >
                  {apiError}
                </Text>
              </View>
            ) : null}

            <Button label="Entrar" onPress={handleLogin} loading={loading} />

            {/* Resend confirmation CTA */}
            {needsConfirmation && (
              <TouchableOpacity
                onPress={handleResendConfirmation}
                disabled={resending}
                style={[styles.resendBtn, { borderColor: colors.warning }]}
              >
                <Ionicons name="mail-outline" size={16} color={colors.warning} />
                <Text style={[styles.resendText, { color: colors.warning }]}>
                  {resending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Não tem conta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={[styles.link, { color: colors.primary }]}>Cadastre-se</Text>
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  errorText: { ...typography.caption, flex: 1, lineHeight: 18 },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  resendText: { fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.body },
  link: { ...typography.body, fontWeight: '600' },
});
