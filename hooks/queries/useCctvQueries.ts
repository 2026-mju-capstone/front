import { useQuery } from "@tanstack/react-query";
import { cctvService } from "../../api/services/cctv";

export const CCTV_QUERY_KEYS = {
    myItems: ["cctv", "myItems"] as const,
    itemDetections: (itemId: number) => ["cctv", "detections", itemId] as const,
};

export const useCctvQueries = {
    useMyItems: () =>
        useQuery({
            queryKey: CCTV_QUERY_KEYS.myItems,
            queryFn: () => cctvService.getMyItems(),
            staleTime: 30_000,
        }),

    useItemDetections: (itemId: number) =>
        useQuery({
            queryKey: CCTV_QUERY_KEYS.itemDetections(itemId),
            queryFn: () => cctvService.getItemDetections(itemId),
            staleTime: 0,
            enabled: !!itemId && !isNaN(itemId),
        }),
};