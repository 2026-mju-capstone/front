import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimetableState {
    activeTimetableId: number | null;
    setActiveTimetable: (id: number | null) => void;
}

export const useTimetableStore = create<TimetableState>()(
    persist(
        (set) => ({
            activeTimetableId: null,
            setActiveTimetable: (id) => set({activeTimetableId: id}),
        }),
        {
            name: 'timetable-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                activeTimetableId: state.activeTimetableId,
            }),
        }
    )
);
