// src/components/common/SectionTitle.tsx
import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import AppText from './AppText';
import { Spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function SectionTitle({ title, actionLabel, onAction, style }: Props) {
  const { theme } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3] }, style]}>
      <AppText variant="h4">{title}</AppText>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <AppText variant="label" color={theme.colors.primary}>{actionLabel}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}
