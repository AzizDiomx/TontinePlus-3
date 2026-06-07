// src/components/common/AppCard.tsx
import React from 'react';
import { View, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Elevation, Spacing } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: number;
  radius?: number;
}

export default function AppCard({ children, style, onPress, elevation = 'sm', padding = Spacing[4], radius = Radius.lg }: Props) {
  const { theme } = useTheme();

  const cardStyle = [
    {
      backgroundColor: theme.colors.surface,
      borderRadius: radius,
      padding,
      ...Elevation[elevation],
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={cardStyle} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
