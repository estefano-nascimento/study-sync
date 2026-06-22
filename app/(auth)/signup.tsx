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
import { validateEmail, validatePassword, strengthColor } from '../../lib/validation';

export default function SignupScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState('');

  const passwordValidation = validatePassword(password);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome obrigatório';

    const emailResult = validateEmail(email);
    if (!emailResult.valid && emailResult.error) {
      e.email = emailResult.error;
    }

    if (!passwordValidation.valid) {
      e.password = 'A senha não atende todos os requisitos';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setApiError('');
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

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setApiError('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setApiError(error.message);
      }
      return;
    }

    if (data.session) {
      router.replace('/(auth)/onboarding');
    } else {
      router.push({
        pathname: '/(auth)/verify' as any,
        params: { email: email.trim().toLowerCase() },
      });
    }
  }

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
            <View>
              <Input
                label="Senha"
                value={password}
                onChangeText={(v) => { setPassword(v); setApiError(''); }}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                error={errors.password}
              />
              {password.length > 0 && (
                <View style={styles.strengthSection}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${passwordValidation.score}%`,
                          backgroundColor: strengthColor(passwordValidation.strength),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor(passwordValidation.strength) }]}>
                    Senha {passwordValidation.strength}
                  </Text>
                  <View style={styles.rulesList}>
                    {passwordValidation.rules.map((rule) => (
                      <View key={rule.label} style={styles.ruleRow}>
                        <Ionicons
                          name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={rule.met ? colors.success : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.ruleText,
                            { color: rule.met ? colors.success : colors.textSecondary },
                          ]}
                        >
                          {rule.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

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
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  suggestionText: { fontSize: 13, fontWeight: '500' },
  strengthSection: { marginTop: spacing.sm, gap: spacing.xs },
  strengthBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: { fontSize: 12, fontWeight: '600' },
  rulesList: { gap: 2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ruleText: { fontSize: 12 },
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
});
