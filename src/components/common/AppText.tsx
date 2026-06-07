// src/components/common/AppText.tsx
import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'caption' | 'label' | 'overline';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export default function AppText({ children, variant = 'body', color, align, style, numberOfLines }: Props) {
  const { theme } = useTheme();

  const variants: Record<string, TextStyle> = {
    h1: { fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.black, lineHeight: Typography.sizes['3xl'] * 1.2, color: theme.colors.text },
    h2: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, lineHeight: Typography.sizes['2xl'] * 1.2, color: theme.colors.text },
    h3: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, lineHeight: Typography.sizes.xl * 1.3, color: theme.colors.text },
    h4: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, lineHeight: Typography.sizes.lg * 1.4, color: theme.colors.text },
    bodyLarge: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.regular, lineHeight: Typography.sizes.md * 1.6, color: theme.colors.text },
    body: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.regular, lineHeight: Typography.sizes.base * 1.6, color: theme.colors.text },
    caption: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.regular, lineHeight: Typography.sizes.sm * 1.5, color: theme.colors.textSecondary },
    label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, lineHeight: Typography.sizes.sm * 1.4, color: theme.colors.textSecondary },
    overline: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.colors.textSecondary },
  };

  return (
    <Text
      style={[variants[variant], color ? { color } : {}, align ? { textAlign: align } : {}, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
