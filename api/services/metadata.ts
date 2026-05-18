import axiosInstance from "@/api/client";
import { ApiResponse, BuildingRecord, RoomRecord } from "@/api/types";
import { BUILDINGS_URL } from "@/constants/url";

export const metadataService = {
    getBuildings: () =>
        axiosInstance.get<ApiResponse<BuildingRecord[]>>(BUILDINGS_URL),

    getRooms: (buildingId: number) =>
        axiosInstance.get<ApiResponse<RoomRecord[]>>(
            `${BUILDINGS_URL}/${buildingId}/rooms`
        ),
};
