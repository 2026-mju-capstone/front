import {useMutation, useQueryClient} from '@tanstack/react-query';
import {timetableService} from '@/api/services/timetable';
import {timetableKeys} from '../queries/useTimetableQueries';
import {CreateTimetableRequest, SyncTimetableRequest} from '@/api/types';

export const useCreateTimetable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTimetableRequest) => timetableService.createTimetable(data),
        onSuccess: () => {
            // 전체 시간표 목록을 서버에서 다시 조회
            queryClient.invalidateQueries({queryKey: timetableKeys.allList()});
        },
    });
};

export const useSyncTimetable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, data}: {id: number; data: SyncTimetableRequest}) =>
            timetableService.syncTimetable(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: timetableKeys.detail(variables.id)
            });
        },
    });
};

export const useDeleteTimetable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => timetableService.deleteTimetable(id),
        onSuccess: () => {
            // 전체 시간표 목록을 서버에서 다시 조회
            queryClient.invalidateQueries({queryKey: timetableKeys.allList()});
        },
    });
};
