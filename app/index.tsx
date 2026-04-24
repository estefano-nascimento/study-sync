import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export default function Index() {
  const { session, loading } = useAuthStore();
  const { colors } = useThemeStore();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={session ? '/(app)/dashboard' : '/(auth)/login'} />;
}
