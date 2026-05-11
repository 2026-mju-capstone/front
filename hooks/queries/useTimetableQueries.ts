import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {timetableService} from '@/api/services/timetable';

export const timetableKeys = {
    all: ['timetables'] as const,
    allList: () => [...timetableKeys.all, 'list'] as const,
    primary: () => [...timetableKeys.all, 'primary'] as const,
    detail: (id: number) => [...timetableKeys.all, 'detail', id] as const,
    courses: (year: number, semester: number, keyword: string) => ['courses', year, semester, keyword] as const,
};

export const usePrimaryTimetable = () => {
    return useQuery({
        queryKey: timetableKeys.primary(),
        queryFn: () => timetableService.getPrimaryTimetable(),
        staleTime: 0,
    });
};

// 서버에서 전체 시간표 목록을 항상 새로 조회 (캐시 없음)
export const useAllTimetables = () => {
    return useQuery({
        queryKey: timetableKeys.allList(),
        queryFn: () => timetableService.getAllTimetables(),
        staleTime: 0,
    });
};

// 시간표 상세(수강 과목 목록)도 항상 서버 기준 (캐시 없음)
export const useTimetableDetail = (id: number | null) => {
    return useQuery({
        queryKey: timetableKeys.detail(id!),
        queryFn: () => timetableService.getTimetableDetail(id!),
        enabled: !!id,
        staleTime: 0,
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
        enabled: true,
        staleTime: 0,
    });
};
