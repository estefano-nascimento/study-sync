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
import { validateEmail } from '../../lib/validation';

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
  const [emailSuggestion, setEmailSuggestion] = useState('');

  function validate() {
    const e: typeof errors = {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid && emailResult.error) {
      e.email = emailResult.error;
    }

    if (!password) e.password = 'Senha obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setApiError('');
    setNeedsConfirmation(false);
    setEmailSuggestion('');

    if (value.includes('@') && value.length > 5) {
      const result = validateEmail(value);
      if (result.suggestion) {
        setEmailSuggestion(result.suggestion);
      }
    }
  }

  function applySuggestion() {
    const match = emailSuggestion.match(/Você quis dizer (.+)\?/);
    if (match) {
      setEmail(match[1]);
      setEmailSuggestion('');
    }
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

    if (!error) return;

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
    });
    setResending(false);
    setApiError('Novo código enviado! Verifique sua caixa de entrada.');
    setNeedsConfirmation(false);
  }

  function goToVerify() {
    router.push({
      pathname: '/(auth)/verify' as any,
      params: { email: email.trim().toLowerCase() },
    });
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
            <View>
              <Input
                label="E-mail"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />
              {emailSuggestion ? (
                <TouchableOpacity onPress={applySuggestion} style={styles.suggestionRow}>
                  <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                  <Text style={[styles.suggestionText, { color: colors.warning }]}>
                    {emailSuggestion}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Input
              label="Senha"
              value={password}
              onChangeText={(v) => { setPassword(v); setApiError(''); }}
              placeholder="Sua senha"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            {apiError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: needsConfirmation
                      ? colors.warning + '1A'
                      : apiError.includes('código enviado')
                      ? colors.success + '1A'
                      : colors.danger + '1A',
                    borderColor: needsConfirmation
                      ? colors.warning
                      : apiError.includes('código enviado')
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                <Ionicons
                  name={
                    apiError.includes('código enviado')
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={16}
                  color={
                    needsConfirmation
                      ? colors.warning
                      : apiError.includes('código enviado')
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
                        : apiError.includes('código enviado')
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

            {needsConfirmation && (
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  onPress={goToVerify}
                  style={[styles.resendBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '0D' }]}
                >
                  <Ionicons name="keypad-outline" size={16} color={colors.primary} />
                  <Text style={[styles.resendText, { color: colors.primary }]}>
                    Digitar código de verificação
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendConfirmation}
                  disabled={resending}
                  style={[styles.resendBtn, { borderColor: colors.warning }]}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.warning} />
                  <Text style={[styles.resendText, { color: colors.warning }]}>
                    {resending ? 'Reenviando...' : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  suggestionText: { fontSize: 13, fontWeight: '500' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  errorText: { ...typography.caption, flex: 1, lineHeight: 18 },
  confirmActions: { gap: spacing.xs },
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
