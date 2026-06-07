// src/components/common/StatusPill.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ContributionStatus } from '../../types';

interface Props { status: ContributionStatus; size?: 'sm' | 'md'; }

const STATUS_CONFIG = {
  paid: { label: 'Payé', emoji: '✅' },
  partial: { label: 'Partiel', emoji: '🟡' },
  unpaid: { label: 'Impayé', emoji: '❌' },
  pending: { label: 'En attente', emoji: '⏳' },
};

export default function StatusPill({ status, size = 'md' }: Props) {
  const { theme } = useTheme();
  const cfg = STATUS_CONFIG[status];
  const color = status === 'paid' ? theme.colors.success : status === 'partial' ? theme.colors.warning : status === 'unpaid' ? theme.colors.error : theme.colors.textSecondary;
  const bg = status === 'paid' ? '#E6FAF0' : status === 'partial' ? '#FFFBEB' : status === 'unpaid' ? '#FFF5F5' : theme.colors.border;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, borderRadius: 99, paddingHorizontal: size === 'sm' ? 8 : 12, paddingVertical: size === 'sm' ? 2 : 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: size === 'sm' ? 10 : 12, marginRight: 4 }}>{cfg.emoji}</Text>
      <Text style={{ color, fontSize: size === 'sm' ? 11 : 13, fontWeight: '600' }}>{cfg.label}</Text>
    </View>
  );
}