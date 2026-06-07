import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore, useSettingsStore } from '../src/stores';
import { useTheme } from '../src/hooks/useTheme';
import { getDatabase } from '../src/database/database';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { theme, isDark } = useTheme();
  const { initialize, isLoading } = useAuthStore();
  const { load: loadSettings } = useSettingsStore();

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
        await loadSettings();
        await initialize();
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="group/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/create" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="member/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="member/create" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="payment/record" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/backup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/change-pin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutInner />
    </GestureHandlerRootView>
  );
}
