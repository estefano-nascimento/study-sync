import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../store/themeStore';
import { typography, spacing } from '../../lib/theme';

// This screen handles the email-confirmation redirect from Supabase.
// Supabase appends tokens as URL hash: /callback#access_token=...&refresh_token=...&type=signup
export default function CallbackScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(auth)/login');
      return;
    }

    const hash = window.location.hash.substring(1); // strip leading '#'
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type'); // 'signup' | 'recovery' | etc.
    const errorDesc = params.get('error_description');

    if (errorDesc) {
      setStatus('error');
      setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setErrorMsg('Link inválido ou expirado. Solicite um novo e-mail de confirmação.');
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          setStatus('error');
          setErrorMsg('Não foi possível confirmar sua conta. Tente novamente.');
        } else {
          // Session is set — onAuthStateChange in _layout.tsx will redirect to dashboard.
          // But if this is a first-time signup, go to onboarding.
          if (type === 'signup') {
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(app)/dashboard');
          }
        }
      });
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.msg, { color: colors.textSecondary }]}>Confirmando sua conta...</Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.danger }]}>Erro na confirmação</Text>
          <Text style={[styles.msg, { color: colors.textSecondary }]}>{errorMsg}</Text>
          <Text
            onPress={() => router.replace('/(auth)/login')}
            style={[styles.link, { color: colors.primary }]}
          >
            Voltar ao login
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  title: { ...typography.h2, textAlign: 'center' },
  msg: { ...typography.body, textAlign: 'center' },
  link: { ...typography.body, fontWeight: '600', marginTop: spacing.sm },
});
