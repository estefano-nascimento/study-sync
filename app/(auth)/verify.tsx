import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../../components/Button';
import { typography, spacing, radii } from '../../lib/theme';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, index: number) {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned && text.length > 0) return;

    const newCode = [...code];

    if (cleaned.length > 1) {
      const chars = cleaned.split('').slice(0, CODE_LENGTH);
      chars.forEach((char, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = cleaned;
    setCode(newCode);
    setError('');

    if (cleaned && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      setError('Digite o código completo de 6 dígitos');
      return;
    }

    if (!email) {
      setError('E-mail não encontrado. Volte e tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'signup',
    });

    setLoading(false);

    if (verifyError) {
      if (verifyError.message.toLowerCase().includes('expired')) {
        setError('Código expirado. Solicite um novo código.');
      } else if (verifyError.message.toLowerCase().includes('invalid')) {
        setError('Código incorreto. Verifique e tente novamente.');
      } else {
        setError(verifyError.message);
      }
      return;
    }

    if (data.session) {
      router.replace('/(auth)/onboarding');
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError('');
    setSuccess('');

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setSuccess('Novo código enviado para seu e-mail!');
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    }
  }

  const isFilled = code.every((d) => d !== '');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Verificar e-mail
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Digite o código de 6 dígitos enviado para{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {email || 'seu e-mail'}
            </Text>
          </Text>

          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit
                      ? colors.primary
                      : error
                      ? colors.danger
                      : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={Platform.OS === 'web' ? 6 : 1}
                selectTextOnFocus
                accessibilityLabel={`Dígito ${index + 1}`}
              />
            ))}
          </View>

          {error ? (
            <View style={[styles.msgBox, { backgroundColor: colors.danger + '1A', borderColor: colors.danger }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.msgText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.msgBox, { backgroundColor: colors.success + '1A', borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={[styles.msgText, { color: colors.success }]}>{success}</Text>
            </View>
          ) : null}

          <Button
            label="Verificar"
            onPress={handleVerify}
            loading={loading}
            disabled={!isFilled}
            style={{ width: '100%' }}
          />

          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Não recebeu o código?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {resending ? 'Enviando...' : 'Reenviar'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              E-mail errado?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Corrigir</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    padding: spacing.xs,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: radii.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    width: '100%',
  },
  msgText: { ...typography.caption, flex: 1, lineHeight: 18 },
  resendText: { ...typography.body, textAlign: 'center' },
});
