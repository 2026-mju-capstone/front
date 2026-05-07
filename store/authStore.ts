import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isInitialized: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isInitialized: false,
  setToken: async (token: string) => {
    await AsyncStorage.setItem('token', token);
    set({ token });
  },
  clearToken: async () => {
    await AsyncStorage.removeItem('token');
    set({ token: null });
  },
  initialize: async () => {
    const token = await AsyncStorage.getItem('token');
    set({ token, isInitialized: true });
  },
}));
