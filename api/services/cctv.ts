import axiosInstance from "@/api/client";
import {
    ApiResponse,
    CctvItemDetectionsResponse,
    CctvMyItemsResponse,
    CctvReviewRequest,
} from "@/api/types";

export const cctvService = {
    getMyItems: () =>
        axiosInstance.get<ApiResponse<CctvMyItemsResponse>>("/api/cctv/detections/me"),

    getItemDetections: (itemId: number) =>
        axiosInstance.get<ApiResponse<CctvItemDetectionsResponse>>(
            "/api/cctv/detections/me",
            {params: {itemId}}
        ),

    reviewDetection: (detectionId: number, body: CctvReviewRequest) =>
        axiosInstance.put<ApiResponse<null>>(
            `/api/cctv/detections/${detectionId}/review`,
            body
        ),
};

