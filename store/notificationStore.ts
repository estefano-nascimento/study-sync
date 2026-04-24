import { create } from 'zustand';
import { Notification } from '../lib/types';
import { supabase } from '../lib/supabase';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    const notifs = (data as Notification[]) || [];
    set({
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.read).length,
      loading: false,
    });
  },

  markRead: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    }));
  },
}));
