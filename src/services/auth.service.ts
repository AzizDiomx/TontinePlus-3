// src/services/auth.service.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { UserRepository } from '../repositories';
import { User, CreateUserPayload } from '../types';

const PIN_HASH_KEY = 'tontine_pin_hash';
const SESSION_KEY = 'tontine_session';

// Simple hash function (in production use expo-crypto)
const hashPin = (pin: string): string => {
  let hash = 0;
  const salt = 'tontineplus_salt_2024';
  const str = pin + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + str.length.toString(16);
};

export const AuthService = {
  async createUser(payload: CreateUserPayload): Promise<User> {
    const pinHash = hashPin(payload.pin);
    await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash);
    const user = await UserRepository.create({ ...payload, pinHash });
    await SecureStore.setItemAsync(SESSION_KEY, user.id);
    return user;
  },

  async verifyPin(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!stored) {
      const user = await UserRepository.getFirst();
      if (!user) return false;
      return user.pinHash === hashPin(pin);
    }
    return stored === hashPin(pin);
  },

  async updatePin(oldPin: string, newPin: string): Promise<boolean> {
    const valid = await this.verifyPin(oldPin);
    if (!valid) return false;
    const newHash = hashPin(newPin);
    await SecureStore.setItemAsync(PIN_HASH_KEY, newHash);
    const user = await UserRepository.getFirst();
    if (user) await UserRepository.update(user.id, { pinHash: newHash });
    return true;
  },

  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async authenticateWithBiometric(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller TontinePlus',
      fallbackLabel: 'Utiliser le PIN',
      cancelLabel: 'Annuler',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  async setSession(userId: string): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, userId);
  },

  async getSession(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEY);
  },

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },

  async hasAccount(): Promise<boolean> {
    const user = await UserRepository.getFirst();
    return user !== null;
  },
};
