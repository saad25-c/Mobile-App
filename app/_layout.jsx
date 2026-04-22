import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((token) => { //chercher le token sauvegardé dans le stockage local du téléphone
      router.replace(token ? '/(tabs)' : '/login'); //si le token existe, rediriger vers le dashboard, sinon vers login
    });
  }, []);  // useEffect avec [] :
  // quand le tableau est vide, la fonction ne se réexécute jamais automatiquement
  // mais on peut forcer sa réexecution manuellement
  // Ici, cela permet de vérifier si l'utilisateur est connecté au démarrage de l'app
  // et de le rediriger vers la page de connexion ou le tableau de bordS'exécute une seule fois au démarrage de l'app

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
