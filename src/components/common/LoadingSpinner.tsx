// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props { size?: 'small' | 'large'; fullscreen?: boolean; }

export default function LoadingSpinner({ size = 'large', fullscreen = false }: Props) {
  const { theme } = useTheme();
  if (fullscreen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={theme.colors.primary} />;
}
