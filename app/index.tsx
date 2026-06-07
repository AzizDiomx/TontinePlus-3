import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const { hasAccount, isAuthenticated } = useAuthStore();

  if (!hasAccount) return <Redirect href="/(auth)/onboarding" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
