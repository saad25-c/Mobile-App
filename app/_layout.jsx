import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const loadAuth = useAuthStore((s) => s.loadAuth);

  useEffect(() => {
    const init = async () => {
      await loadAuth(); // Charger token/user/teacherProfile dans le store
      const token = await AsyncStorage.getItem('accessToken');
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
