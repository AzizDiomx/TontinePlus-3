// src/components/common/ScreenHeader.tsx
import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from './AppText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({ title, subtitle, showBack = false, rightAction, style }: Props) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
      backgroundColor: theme.colors.background,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing[3], padding: 4 }}>
            <AppText color="#FFF" style={{ fontSize: 22 }}>←</AppText>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="h4" color="#FFF">{title}</AppText>
          {subtitle && <AppText variant="caption" color="rgba(255,255,255,0.7)">{subtitle}</AppText>}
        </View>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
