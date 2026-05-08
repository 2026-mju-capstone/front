import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    token: string | null;
    isInitialized: boolean;
    setToken: (token: string) => void;
    clearToken: () => void;
    setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            isInitialized: false,
            setToken: (token) => set({token}),
            clearToken: () => set({token: null}),
            setInitialized: (val) => set({isInitialized: val}),
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
