import {useMutation, useQueryClient} from '@tanstack/react-query';
import {timetableService} from '@/api/services/timetable';
import {timetableKeys} from '../queries/useTimetableQueries';
import {CreateTimetableRequest, SyncTimetableRequest} from '@/api/types';

export const useCreateTimetable = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: CreateTimetableRequest) => timetableService.createTimetable(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: timetableKeys.list(variables.year, variables.semester)
            });
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
            queryClient.invalidateQueries({ queryKey: timetableKeys.all });
        },
    });
};
