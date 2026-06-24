// Mock supabase before imports
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null });
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
}));

// Chain: supabase.from('user_profiles').select('*').eq('id', userId).single()
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ single: mockSingle });

const mockSignOut = jest.fn().mockResolvedValue({});

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      signOut: mockSignOut,
    },
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

let useAuthStore: typeof import('../../store/authStore').useAuthStore;

function loadFreshStore() {
  jest.resetModules();
  jest.doMock('../../lib/supabase', () => ({
    supabase: {
      from: mockFrom,
      auth: { signOut: mockSignOut },
    },
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
  const mod = require('../../store/authStore');
  useAuthStore = mod.useAuthStore;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data: null });
  loadFreshStore();
});

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null session', () => {
      expect(useAuthStore.getState().session).toBeNull();
    });

    it('starts with null user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('starts with null profile', () => {
      expect(useAuthStore.getState().profile).toBeNull();
    });

    it('starts with loading true', () => {
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  describe('setSession', () => {
    it('sets session and user from session object', () => {
      const mockUser = { id: 'user-123', email: 'test@test.com' };
      const mockSession = { user: mockUser, access_token: 'token-abc' } as any;

      useAuthStore.getState().setSession(mockSession);
      const state = useAuthStore.getState();

      expect(state.session).toBe(mockSession);
      expect(state.user).toBe(mockUser);
      expect(state.loading).toBe(false);
    });

    it('sets user to null when session is null', () => {
      // First set a session
      const mockSession = { user: { id: '1' }, access_token: 'x' } as any;
      useAuthStore.getState().setSession(mockSession);
      expect(useAuthStore.getState().user).toBeTruthy();

      // Then clear it
      useAuthStore.getState().setSession(null);
      const state = useAuthStore.getState();

      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('sets loading to false', () => {
      useAuthStore.getState().setSession(null);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('setProfile', () => {
    it('sets profile data', () => {
      const mockProfile = {
        id: 'user-123',
        display_name: 'Teste',
        email: 'test@test.com',
        xp: 100,
        level: 2,
      } as any;

      useAuthStore.getState().setProfile(mockProfile);
      expect(useAuthStore.getState().profile).toBe(mockProfile);
    });

    it('can set profile to null', () => {
      useAuthStore.getState().setProfile({ id: '1' } as any);
      useAuthStore.getState().setProfile(null);
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  describe('fetchProfile', () => {
    it('does nothing when user is null', async () => {
      await useAuthStore.getState().fetchProfile();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('fetches profile from supabase when user exists', async () => {
      const mockProfile = {
        id: 'user-123',
        display_name: 'Teste',
        email: 'test@test.com',
        xp: 500,
        level: 5,
      };
      mockSingle.mockResolvedValue({ data: mockProfile });

      // Set a user first
      useAuthStore.getState().setSession({
        user: { id: 'user-123' },
        access_token: 'token',
      } as any);

      await useAuthStore.getState().fetchProfile();

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });

    it('does not set profile when supabase returns null data', async () => {
      mockSingle.mockResolvedValue({ data: null });

      useAuthStore.getState().setSession({
        user: { id: 'user-456' },
        access_token: 'token',
      } as any);

      await useAuthStore.getState().fetchProfile();
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  describe('signOut', () => {
    it('calls supabase auth signOut', async () => {
      await useAuthStore.getState().signOut();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('clears session, user, and profile', async () => {
      // Set some state first
      useAuthStore.getState().setSession({
        user: { id: '1' },
        access_token: 't',
      } as any);
      useAuthStore.getState().setProfile({ id: '1' } as any);

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });
  });
});
