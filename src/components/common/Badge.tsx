// src/components/common/Badge.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Typography } from '../../constants/theme';

interface Props {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export default function Badge({ label, color, bg, style, size = 'md' }: Props) {
  const { theme } = useTheme();
  const textColor = color ?? theme.colors.text;
  const bgColor = bg ?? theme.colors.primary;

  return (
    <View style={[{
      backgroundColor: bgColor,
      borderRadius: Radius.full,
      paddingHorizontal: size === 'sm' ? 8 : 12,
      paddingVertical: size === 'sm' ? 2 : 4,
      alignSelf: 'flex-start',
    }, style]}>
      <Text style={{
        color: textColor,
        fontSize: size === 'sm' ? Typography.sizes.xs : Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
      }}>
        {label}
      </Text>
    </View>
  );
}
