import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cctvService } from "../../api/services/cctv";
import { CctvReviewRequest } from "../../api/types";
import { CCTV_QUERY_KEYS } from "../queries/useCctvQueries";

export const useCctvMutations = {
    useReviewDetection: (itemId: number) => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({
                             matchId,
                             body,
                         }: {
                matchId: number;
                body: CctvReviewRequest;
            }) => cctvService.reviewDetection(matchId, body),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: CCTV_QUERY_KEYS.itemDetections(itemId),
                });
            },
        });
    },
};