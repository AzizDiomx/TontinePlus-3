// src/components/common/ProgressBar.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants/theme';

interface Props {
  progress: number; // 0-100
  height?: number;
  color?: string;
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function ProgressBar({ progress, height = 8, color, showLabel = false, style }: Props) {
  const { theme } = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const barColor = color ?? theme.colors.primary;

  const getColor = () => {
    if (clampedProgress >= 80) return theme.colors.success;
    if (clampedProgress >= 40) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <View style={style}>
      {showLabel && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{Math.round(clampedProgress)}%</Text>
        </View>
      )}
      <View style={{
        height, backgroundColor: theme.colors.border,
        borderRadius: Radius.full, overflow: 'hidden',
      }}>
        <View style={{
          height: '100%',
          width: `${clampedProgress}%`,
          backgroundColor: color ?? getColor(),
          borderRadius: Radius.full,
        }} />
      </View>
    </View>
  );
}
