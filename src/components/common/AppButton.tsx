import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function AppButton({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, leftIcon, rightIcon, style, textStyle, fullWidth = true,
}: Props) {
  const { theme } = useTheme();

  const sizes = {
    sm: { height: 40, paddingH: 16, fontSize: Typography.sizes.sm },
    md: { height: 52, paddingH: 20, fontSize: Typography.sizes.base },
    lg: { height: 60, paddingH: 24, fontSize: Typography.sizes.md },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':   return { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' };
      case 'secondary': return { bg: theme.colors.secondary, text: '#FFFFFF', border: 'transparent' };
      case 'outline':   return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary };
      case 'ghost':     return { bg: 'transparent', text: theme.colors.textSecondary, border: 'transparent' };
      case 'danger':    return { bg: theme.colors.error, text: '#FFFFFF', border: 'transparent' };
      default:          return { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' };
    }
  };

  const v = getVariantStyles();
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          height: s.height,
          backgroundColor: v.bg,
          borderWidth: v.border !== 'transparent' ? 1.5 : 0,
          borderColor: v.border,
          borderRadius: Radius.lg,
          paddingHorizontal: s.paddingH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={[
            { color: v.text, fontSize: s.fontSize, fontWeight: Typography.weights.semibold as any, letterSpacing: 0.3 },
            textStyle,
          ]}>
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
