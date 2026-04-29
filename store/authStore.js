import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Token stocké dans SecureStore (chiffré), user/teacherProfile dans AsyncStorage
const useAuthStore = create((set) => ({
  token: null,
  user: null,
  teacherProfile: null,

  loadAuth: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    const user = await AsyncStorage.getItem('user');
    const teacherProfile = await AsyncStorage.getItem('teacherProfile');
    set({
      token,
      user: user ? JSON.parse(user) : null,
      teacherProfile: teacherProfile ? JSON.parse(teacherProfile) : null,
    });
  },

  setAuth: async (token, user, teacherProfile) => {
    await SecureStore.setItemAsync('accessToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('teacherProfile', JSON.stringify(teacherProfile));
    set({ token, user, teacherProfile });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await AsyncStorage.multiRemove(['user', 'teacherProfile']);
    set({ token: null, user: null, teacherProfile: null });
  },
}));

export default useAuthStore;
