import { useQuery } from "@tanstack/react-query";
import { metadataService } from "@/api/services/metadata";

export const useMetadataQueries = {
    useBuildings: () =>
        useQuery({
            queryKey: ["metadata", "buildings"],
            queryFn: () => metadataService.getBuildings(),
            staleTime: 60_000 * 10,
        }),

    useRooms: (buildingId: number | null) =>
        useQuery({
            queryKey: ["metadata", "rooms", buildingId],
            queryFn: () => metadataService.getRooms(buildingId!),
            enabled: !!buildingId,
            staleTime: 60_000 * 10,
        }),
};
