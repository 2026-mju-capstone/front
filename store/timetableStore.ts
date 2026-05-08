import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Course} from '@/api/types';

export interface SemesterEntry {
    year: number;
    semester: number;
    timetableId: number;
    label: string;
}

interface TimetableState {
    currentYear: number;
    currentSemester: number;
    activeTimetableId: number | null;
    draftCourses: Course[];
    isEditing: boolean;
    semesterList: SemesterEntry[];

    // Actions
    setPeriod: (year: number, semester: number) => void;
    setActiveTimetable: (id: number | null) => void;
    startEditing: (initialCourses: Course[]) => void;
    stopEditing: () => void;
    addCourse: (course: Course) => boolean;
    removeCourse: (courseId: number) => void;
    updateCourseColor: (courseId: number, color: string) => void;
    clearDraft: () => void;
    addSemesterEntry: (entry: SemesterEntry) => void;
    removeSemesterEntry: (timetableId: number) => void;
}

const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const isOverlap = (c1: Course, c2: Course) => {
    if (c1.dayOfWeek !== c2.dayOfWeek) return false;
    return (
        Math.max(toMinutes(c1.startTime), toMinutes(c2.startTime)) <
        Math.min(toMinutes(c1.endTime), toMinutes(c2.endTime))
    );
};

export const useTimetableStore = create<TimetableState>()(
    persist(
        (set, get) => ({
            currentYear: new Date().getFullYear(),
            currentSemester: new Date().getMonth() < 6 ? 1 : 2,
            activeTimetableId: null,
            draftCourses: [],
            isEditing: false,
            semesterList: [],

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

            addSemesterEntry: (entry) => set((state) => ({
                semesterList: [entry, ...state.semesterList.filter(e => e.timetableId !== entry.timetableId)],
            })),

            removeSemesterEntry: (timetableId) => set((state) => ({
                semesterList: state.semesterList.filter(e => e.timetableId !== timetableId),
            })),
        }),
        {
            name: 'timetable-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentYear: state.currentYear,
                currentSemester: state.currentSemester,
                activeTimetableId: state.activeTimetableId,
                semesterList: state.semesterList,
            }),
        }
    )
);
