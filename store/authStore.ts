<<<<<<< HEAD
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
=======
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
>>>>>>> 67551bb (Feat: image upload in lost-item)

interface AuthState {
  token: string | null;
  isInitialized: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  setInitialized: (val: boolean) => void;
}

<<<<<<< HEAD
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isInitialized: false,
  setToken: async (token: string) => {
    await AsyncStorage.setItem("token", token);
    set({ token });
  },
  clearToken: async () => {
    await AsyncStorage.removeItem("token");
    set({ token: null });
  },
  initialize: async () => {
    const token = await AsyncStorage.getItem("token");
    set({ token, isInitialized: true });
  },
}));
=======
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isInitialized: false,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
>>>>>>> 67551bb (Feat: image upload in lost-item)
