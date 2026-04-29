import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import useAuthStore from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const loadAuth = useAuthStore((s) => s.loadAuth);

  useEffect(() => {
    const init = async () => {
      await loadAuth();
      const token = await SecureStore.getItemAsync('accessToken');
      router.replace(token ? '/(tabs)' : '/login');
    };
    init();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
