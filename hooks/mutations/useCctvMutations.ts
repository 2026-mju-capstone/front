import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cctvService } from "../../api/services/cctv";
import { CctvReviewRequest } from "../../api/types";
import { CCTV_QUERY_KEYS } from "../queries/useCctvQueries";

export const useCctvMutations = {
    useReviewDetection: (itemId: number) => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({
                             detectionId,
                             body,
                         }: {
                detectionId: number;
                body: CctvReviewRequest;
            }) => cctvService.reviewDetection(detectionId, body),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: CCTV_QUERY_KEYS.itemDetections(itemId),
                });
            },
        });
    },
};