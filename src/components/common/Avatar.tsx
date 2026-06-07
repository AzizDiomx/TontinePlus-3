import React from 'react';
import { View, Image, Text, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface Props {
  name: string;
  photoUri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

const getColorForName = (name: string) => {
  const colors = [Colors.emerald[500], Colors.gold[500], Colors.terracotta[400], '#3182CE', '#9F7AEA'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export default function Avatar({ name, photoUri, size = 44, style }: Props) {
  const { theme } = useTheme();
  const initials = getInitials(name);
  const bg = getColorForName(name);

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <Text style={{ color: '#FFF', fontSize: size * 0.38, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}
