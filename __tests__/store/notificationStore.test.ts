// Mock supabase chainable query builder
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

// Chain for fetchNotifications:
// supabase.from('notifications').select('*').order(...).limit(50)
function setupFetchChain(data: any[] | null) {
  mockLimit.mockResolvedValue({ data });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockSelect.mockReturnValue({ order: mockOrder });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

// Chain for markRead:
// supabase.from('notifications').update({ read: true }).eq('id', id)
function setupMarkReadChain() {
  mockEq.mockResolvedValue({});
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

// Chain for markAllRead:
// supabase.from('notifications').update({ read: true }).eq('read', false)
function setupMarkAllReadChain() {
  mockEq.mockResolvedValue({});
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
  StyleSheet: { create: (s: any) => s },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

let useNotificationStore: typeof import('../../store/notificationStore').useNotificationStore;

function loadFreshStore() {
  jest.resetModules();
  jest.doMock('../../lib/supabase', () => ({
    supabase: { from: mockFrom },
  }));
  jest.doMock('react-native', () => ({
    Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
    StyleSheet: { create: (s: any) => s },
  }));
  jest.doMock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
  }));
  const mod = require('../../store/notificationStore');
  useNotificationStore = mod.useNotificationStore;
}

beforeEach(() => {
  jest.clearAllMocks();
  loadFreshStore();
});

describe('notificationStore', () => {
  describe('initial state', () => {
    it('starts with empty notifications', () => {
      expect(useNotificationStore.getState().notifications).toEqual([]);
    });

    it('starts with unreadCount 0', () => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('starts with loading false', () => {
      expect(useNotificationStore.getState().loading).toBe(false);
    });
  });

  describe('fetchNotifications', () => {
    it('fetches and stores notifications', async () => {
      const mockNotifs = [
        { id: '1', title: 'Tarefa vence hoje', read: false, type: 'task_due' },
        { id: '2', title: 'Tarefa atrasada', read: true, type: 'task_overdue' },
        { id: '3', title: 'Nova sessao', read: false, type: 'member_focus' },
      ];
      setupFetchChain(mockNotifs);

      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(mockNotifs);
      expect(state.loading).toBe(false);
    });

    it('calculates unreadCount correctly', async () => {
      const mockNotifs = [
        { id: '1', read: false },
        { id: '2', read: false },
        { id: '3', read: true },
      ];
      setupFetchChain(mockNotifs);

      await useNotificationStore.getState().fetchNotifications();
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });

    it('queries with correct parameters', async () => {
      setupFetchChain([]);

      await useNotificationStore.getState().fetchNotifications();

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('handles null data from supabase', async () => {
      setupFetchChain(null);

      await useNotificationStore.getState().fetchNotifications();

      expect(useNotificationStore.getState().notifications).toEqual([]);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('sets loading to false after fetch', async () => {
      setupFetchChain([]);

      await useNotificationStore.getState().fetchNotifications();
      expect(useNotificationStore.getState().loading).toBe(false);
    });
  });

  describe('markRead', () => {
    it('marks a single notification as read', async () => {
      setupMarkReadChain();
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', title: 'A', read: false } as any,
          { id: 'n2', title: 'B', read: false } as any,
        ],
        unreadCount: 2,
      });

      await useNotificationStore.getState().markRead('n1');

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[1].read).toBe(false);
    });

    it('decrements unreadCount', async () => {
      setupMarkReadChain();
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', read: false } as any,
        ],
        unreadCount: 3,
      });

      await useNotificationStore.getState().markRead('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });

    it('does not go below 0 for unreadCount', async () => {
      setupMarkReadChain();
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', read: false } as any,
        ],
        unreadCount: 0,
      });

      await useNotificationStore.getState().markRead('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('calls supabase update with correct params', async () => {
      setupMarkReadChain();
      useNotificationStore.setState({
        notifications: [{ id: 'n1', read: false } as any],
        unreadCount: 1,
      });

      await useNotificationStore.getState().markRead('n1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'n1');
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', async () => {
      setupMarkAllReadChain();
      useNotificationStore.setState({
        notifications: [
          { id: 'n1', read: false } as any,
          { id: 'n2', read: false } as any,
          { id: 'n3', read: true } as any,
        ],
        unreadCount: 2,
      });

      await useNotificationStore.getState().markAllRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n: any) => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('calls supabase with correct params', async () => {
      setupMarkAllReadChain();
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0,
      });

      await useNotificationStore.getState().markAllRead();

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
      expect(mockEq).toHaveBeenCalledWith('read', false);
    });
  });

  describe('addNotification', () => {
    it('adds notification to the beginning of the list', () => {
      useNotificationStore.setState({
        notifications: [
          { id: 'old', title: 'Antiga', read: true } as any,
        ],
        unreadCount: 0,
      });

      const newNotif = {
        id: 'new',
        title: 'Nova',
        read: false,
        type: 'task_due',
      } as any;

      useNotificationStore.getState().addNotification(newNotif);

      const state = useNotificationStore.getState();
      expect(state.notifications[0].id).toBe('new');
      expect(state.notifications[1].id).toBe('old');
    });

    it('increments unreadCount for unread notification', () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 1,
      });

      useNotificationStore.getState().addNotification({
        id: 'x',
        read: false,
      } as any);

      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });

    it('does not increment unreadCount for read notification', () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 1,
      });

      useNotificationStore.getState().addNotification({
        id: 'y',
        read: true,
      } as any);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('handles adding to empty list', () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0,
      });

      useNotificationStore.getState().addNotification({
        id: 'first',
        title: 'Primeira',
        read: false,
      } as any);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });
});
