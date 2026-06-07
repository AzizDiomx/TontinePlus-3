// src/components/common/EmptyState.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';
import { Spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({ icon = '📭', title, subtitle, actionLabel, onAction, style }: Props) {
  const { theme } = useTheme();
  return (
    <View style={[{ alignItems: 'center', padding: Spacing[10] }, style]}>
      <AppText style={{ fontSize: 56, marginBottom: Spacing[4] }}>{icon}</AppText>
      <AppText variant="h4" align="center">{title}</AppText>
      {subtitle && <AppText variant="caption" align="center" style={{ marginTop: Spacing[2] }}>{subtitle}</AppText>}
      {actionLabel && onAction && (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: Spacing[5] }}
          fullWidth={false}
        />
      )}
    </View>
  );
}
