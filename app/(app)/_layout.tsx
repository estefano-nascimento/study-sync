import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { supabase } from '../../lib/supabase';
import { SidebarNav } from '../../components/SidebarNav';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Todas as telas que existem mas NÃO devem aparecer como abas
const HIDDEN: string[] = [
  'notifications',
  'profile',
  'focus',
  'reschedule',
  'groups',
];

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { colors } = useThemeStore();
  const { session } = useAuthStore();
  const { fetchNotifications, addNotification, unreadCount } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        (payload) => addNotification(payload.new as any)
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [session]);

  const tabScreenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 10,
      paddingTop: 6,
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
  };

  function tabIcon(focused: boolean, name: IoniconsName, focusedName: IoniconsName) {
    return ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={focused ? focusedName : name} size={size} color={color} />
    );
  }

  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
        <View style={{ width: 240, borderRightWidth: 1, borderRightColor: colors.border }}>
          <SafeAreaView style={{ flex: 1 }}>
            <SidebarNav />
          </SafeAreaView>
        </View>
        <View style={{ flex: 1 }}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="tasks" />
            <Tabs.Screen name="calendar" />
            <Tabs.Screen name="settings" />
            {HIDDEN.map((name) => (
              <Tabs.Screen key={name} name={name} options={{ href: null }} />
            ))}
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config.',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />

      {/* Telas acessíveis via navegação programática — invisíveis na barra */}
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
