import { lightColors, darkColors } from '../../lib/theme';

// Mock AsyncStorage before anything else
const mockGetItem = jest.fn(() => Promise.resolve(null));
const mockSetItem = jest.fn(() => Promise.resolve());

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: mockGetItem,
  setItem: mockSetItem,
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
}));

// Mock Appearance from react-native with a controllable return value
const mockGetColorScheme = jest.fn(() => 'light');

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
  Alert: { alert: jest.fn() },
  Appearance: { getColorScheme: mockGetColorScheme },
  StyleSheet: { create: (s: any) => s },
}));

// We need to reset the store between tests since zustand stores are singletons
let useThemeStore: typeof import('../../store/themeStore').useThemeStore;

function loadFreshStore() {
  jest.resetModules();
  // Re-mock after resetModules
  jest.doMock('@react-native-async-storage/async-storage', () => ({
    getItem: mockGetItem,
    setItem: mockSetItem,
    __esModule: true,
    default: {
      getItem: mockGetItem,
      setItem: mockSetItem,
    },
  }));
  jest.doMock('react-native', () => ({
    Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
    Alert: { alert: jest.fn() },
    Appearance: { getColorScheme: mockGetColorScheme },
    StyleSheet: { create: (s: any) => s },
  }));
  const mod = require('../../store/themeStore');
  useThemeStore = mod.useThemeStore;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetColorScheme.mockReturnValue('light');
  loadFreshStore();
});

describe('themeStore', () => {
  describe('initial state', () => {
    it('defaults to system mode', () => {
      const state = useThemeStore.getState();
      expect(state.mode).toBe('system');
    });

    it('resolves to light colors when system scheme is light', () => {
      mockGetColorScheme.mockReturnValue('light');
      loadFreshStore();
      const state = useThemeStore.getState();
      expect(state.colors).toEqual(lightColors);
      expect(state.isDark).toBe(false);
    });

    it('resolves to dark colors when system scheme is dark', () => {
      mockGetColorScheme.mockReturnValue('dark');
      loadFreshStore();
      const state = useThemeStore.getState();
      expect(state.colors).toEqual(darkColors);
      expect(state.isDark).toBe(true);
    });
  });

  describe('setMode', () => {
    it('switches to dark mode', async () => {
      await useThemeStore.getState().setMode('dark');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.isDark).toBe(true);
      expect(state.colors).toEqual(darkColors);
    });

    it('switches to light mode', async () => {
      await useThemeStore.getState().setMode('light');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.isDark).toBe(false);
      expect(state.colors).toEqual(lightColors);
    });

    it('switches to system mode and resolves based on appearance', async () => {
      mockGetColorScheme.mockReturnValue('dark');
      await useThemeStore.getState().setMode('system');
      const state = useThemeStore.getState();
      expect(state.mode).toBe('system');
      expect(state.isDark).toBe(true);
      expect(state.colors).toEqual(darkColors);
    });

    it('persists mode to AsyncStorage', async () => {
      await useThemeStore.getState().setMode('dark');
      expect(mockSetItem).toHaveBeenCalledWith('theme_mode', 'dark');
    });

    it('persists light mode to AsyncStorage', async () => {
      await useThemeStore.getState().setMode('light');
      expect(mockSetItem).toHaveBeenCalledWith('theme_mode', 'light');
    });

    it('can toggle between modes', async () => {
      await useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().isDark).toBe(true);

      await useThemeStore.getState().setMode('light');
      expect(useThemeStore.getState().isDark).toBe(false);

      await useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().isDark).toBe(true);
    });
  });

  describe('loadTheme', () => {
    it('loads dark mode from storage', async () => {
      mockGetItem.mockResolvedValue('dark');
      await useThemeStore.getState().loadTheme();
      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(state.isDark).toBe(true);
      expect(state.colors).toEqual(darkColors);
    });

    it('loads light mode from storage', async () => {
      mockGetItem.mockResolvedValue('light');
      await useThemeStore.getState().loadTheme();
      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(state.isDark).toBe(false);
      expect(state.colors).toEqual(lightColors);
    });

    it('defaults to system mode when nothing stored', async () => {
      mockGetItem.mockResolvedValue(null);
      mockGetColorScheme.mockReturnValue('light');
      await useThemeStore.getState().loadTheme();
      const state = useThemeStore.getState();
      expect(state.mode).toBe('system');
    });

    it('reads from the correct AsyncStorage key', async () => {
      mockGetItem.mockResolvedValue(null);
      await useThemeStore.getState().loadTheme();
      expect(mockGetItem).toHaveBeenCalledWith('theme_mode');
    });
  });

  describe('color scheme resolution', () => {
    it('light mode always gives light colors regardless of system', async () => {
      mockGetColorScheme.mockReturnValue('dark');
      await useThemeStore.getState().setMode('light');
      expect(useThemeStore.getState().colors).toEqual(lightColors);
      expect(useThemeStore.getState().isDark).toBe(false);
    });

    it('dark mode always gives dark colors regardless of system', async () => {
      mockGetColorScheme.mockReturnValue('light');
      await useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().colors).toEqual(darkColors);
      expect(useThemeStore.getState().isDark).toBe(true);
    });

    it('system mode follows system light preference', async () => {
      mockGetColorScheme.mockReturnValue('light');
      await useThemeStore.getState().setMode('system');
      expect(useThemeStore.getState().colors).toEqual(lightColors);
      expect(useThemeStore.getState().isDark).toBe(false);
    });

    it('system mode follows system dark preference', async () => {
      mockGetColorScheme.mockReturnValue('dark');
      await useThemeStore.getState().setMode('system');
      expect(useThemeStore.getState().colors).toEqual(darkColors);
      expect(useThemeStore.getState().isDark).toBe(true);
    });

    it('system mode defaults to light when system returns null', async () => {
      mockGetColorScheme.mockReturnValue(null);
      await useThemeStore.getState().setMode('system');
      expect(useThemeStore.getState().colors).toEqual(lightColors);
      expect(useThemeStore.getState().isDark).toBe(false);
    });
  });
});
