import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Course} from '@/api/types';

interface TimetableState {
    currentYear: number;
    currentSemester: number;
    activeTimetableId: number | null;
    draftCourses: Course[];
    isEditing: boolean;

    // Actions
    setPeriod: (year: number, semester: number) => void;
    setActiveTimetable: (id: number | null) => void;
    startEditing: (initialCourses: Course[]) => void;
    stopEditing: () => void;
    addCourse: (course: Course) => boolean;
    removeCourse: (courseId: number) => void;
    updateCourseColor: (courseId: number, color: string) => void;
    clearDraft: () => void;
}

const isOverlap = (c1: Course, c2: Course) => {
    if (c1.dayOfWeek !== c2.dayOfWeek) return false;
    
    const start1 = c1.startTime;
    const end1 = c1.endTime;
    const start2 = c2.startTime;
    const end2 = c2.endTime;

    return (start1 < end2 && start2 < end1);
};

export const useTimetableStore = create<TimetableState>()(
    persist(
        (set, get) => ({
            currentYear: new Date().getFullYear(),
            currentSemester: new Date().getMonth() < 6 ? 1 : 2,
            activeTimetableId: null,
            draftCourses: [],
            isEditing: false,

            setPeriod: (year, semester) => set({currentYear: year, currentSemester: semester}),
            
            setActiveTimetable: (id) => set({activeTimetableId: id}),

            startEditing: (initialCourses) => set({
                draftCourses: [...initialCourses],
                isEditing: true
            }),

            stopEditing: () => set({isEditing: false}),

            addCourse: (newCourse) => {
                const {draftCourses} = get();
                const hasOverlap = draftCourses.some(c => isOverlap(c, newCourse));
                
                if (hasOverlap) return false;

                set({draftCourses: [...draftCourses, newCourse]});
                return true;
            },

            removeCourse: (courseId) => set((state) => ({
                draftCourses: state.draftCourses.filter(c => c.courseId !== courseId)
            })),

            updateCourseColor: (courseId, color) => set((state) => ({
                draftCourses: state.draftCourses.map(c => 
                    c.courseId === courseId ? {...c, color} : c
                )
            })),

            clearDraft: () => set({draftCourses: []}),
        }),
        {
            name: 'timetable-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentYear: state.currentYear,
                currentSemester: state.currentSemester,
                activeTimetableId: state.activeTimetableId,
            }),
        }
    )
);
