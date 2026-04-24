import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { lightColors, darkColors, ColorScheme } from '../lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ColorScheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

function resolveColors(mode: ThemeMode): { colors: ColorScheme; isDark: boolean } {
  const systemScheme = Appearance.getColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  ...resolveColors('system'),

  setMode: async (mode) => {
    await AsyncStorage.setItem('theme_mode', mode);
    set({ mode, ...resolveColors(mode) });
  },

  loadTheme: async () => {
    const stored = await AsyncStorage.getItem('theme_mode');
    const mode = (stored as ThemeMode) || 'system';
    set({ mode, ...resolveColors(mode) });
  },
}));
