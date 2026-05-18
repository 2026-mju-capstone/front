import { useMutation } from "@tanstack/react-query";
import { lockerService } from "@/api/services/locker";

export const useLockerMutations = {
    useUnlockLocker: () =>
        useMutation({
            mutationFn: ({ lockerId, itemId }: { lockerId: number; itemId?: number }) =>
                lockerService.unlock(lockerId, itemId),
        }),
    useLockLocker: () =>
        useMutation({
            mutationFn: (lockerId: number) => lockerService.lock(lockerId),
        }),
};
