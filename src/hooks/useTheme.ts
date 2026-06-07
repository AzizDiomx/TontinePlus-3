// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { LightTheme, DarkTheme } from '../constants/theme';
import { useSettingsStore } from '../stores';

// Normalized color interface used throughout the app
export type AppColors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
};

export type AppTheme = {
  colors: AppColors;
  isDark: boolean;
  raw: typeof LightTheme | typeof DarkTheme;
};

export const useTheme = (): { theme: AppTheme; isDark: boolean } => {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore(s => s.themeMode);

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const raw = isDark ? DarkTheme : LightTheme;

  const theme: AppTheme = useMemo(() => ({
    colors: {
      background: raw.background,
      surface: raw.surface,
      border: raw.border,
      text: raw.text.primary,
      textSecondary: raw.text.secondary,
      primary: raw.primary,
      secondary: raw.accent,
      success: raw.success,
      warning: raw.warning,
      error: raw.danger,
    },
    isDark,
    raw,
  }), [raw, isDark]);

  return { theme, isDark };
};
