import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store Zustand pour l'authentification
// Centralise token, user et teacherProfile pour tous les écrans
const useAuthStore = create((set) => ({
  token: null,
  user: null,
  teacherProfile: null,

  // Charger les données depuis AsyncStorage au démarrage
  loadAuth: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const user = await AsyncStorage.getItem('user');
    const teacherProfile = await AsyncStorage.getItem('teacherProfile');
    set({
      token,
      user: user ? JSON.parse(user) : null,
      teacherProfile: teacherProfile ? JSON.parse(teacherProfile) : null,
    });
  },

  // Sauvegarder après login
  setAuth: async (token, user, teacherProfile) => {
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('teacherProfile', JSON.stringify(teacherProfile));
    set({ token, user, teacherProfile });
  },

  // Effacer lors du logout
  clearAuth: async () => {
    await AsyncStorage.clear();
    set({ token: null, user: null, teacherProfile: null });
  },
}));

export default useAuthStore;
