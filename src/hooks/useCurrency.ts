// src/hooks/useCurrency.ts
import { useSettingsStore } from '../stores';
import { CurrencyCode } from '../types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  XOF: 'FCFA',
  XAF: 'FCFA',
  GNF: 'GNF',
  MRU: 'MRU',
  EUR: '€',
  USD: '$',
};

export const useCurrency = () => {
  const settings = useSettingsStore(s => s.settings);
  const currency = settings?.currency ?? 'XOF';
  const symbol = CURRENCY_SYMBOLS[currency];

  const format = (amount: number): string => {
    const formatted = Math.round(amount).toLocaleString('fr-FR');
    if (currency === 'EUR') return `${formatted} ${symbol}`;
    if (currency === 'USD') return `${symbol}${formatted}`;
    return `${formatted} ${symbol}`;
  };

  const formatShort = (amount: number): string => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ${symbol}`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k ${symbol}`;
    return format(amount);
  };

  return { format, formatShort, currency, symbol };
};
