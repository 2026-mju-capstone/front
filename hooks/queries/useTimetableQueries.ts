import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {timetableService} from '@/api/services/timetable';

export const timetableKeys = {
    all: ['timetables'] as const,
    list: (year: number, semester: number) => [...timetableKeys.all, 'list', year, semester] as const,
    detail: (id: number) => [...timetableKeys.all, 'detail', id] as const,
    courses: (year: number, semester: number, keyword: string) => ['courses', year, semester, keyword] as const,
};

export const useTimetables = (year: number, semester: number) => {
    return useQuery({
        queryKey: timetableKeys.list(year, semester),
        queryFn: () => timetableService.getTimetables(year, semester),
    });
};

export const useTimetableDetail = (id: number | null) => {
    return useQuery({
        queryKey: timetableKeys.detail(id!),
        queryFn: () => timetableService.getTimetableDetail(id!),
        enabled: !!id,
    });
};

export const useSearchCourses = (year: number, semester: number, keyword: string) => {
    return useInfiniteQuery({
        queryKey: timetableKeys.courses(year, semester, keyword),
        queryFn: ({pageParam = 0}) => 
            timetableService.searchCourses(year, semester, keyword, pageParam as number),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => 
            lastPage.last ? undefined : lastPage.number + 1,
        enabled: keyword.length >= 2,
    });
};
