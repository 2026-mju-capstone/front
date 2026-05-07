import {Platform} from "react-native";
import axiosInstance from "../client";
import {ApiResponse, ImagePurpose, ImageUploadResponse} from "../types";
import {IMAGE_UPLOAD_URL} from "@/constants/url";

export const imageService = {
    /**
     * 이미지 업로드
     */
    uploadImage: async (purpose: ImagePurpose, uri: string) => {
        const formData = new FormData();

        // 파일명 추출
        const filename = uri.split("/").pop() || "image.jpg";

        // 확장자 추출 및 MIME 타입 설정
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // React Native의 FormData는 { uri, name, type } 객체를 요구함
        // 'image' 키는 Swagger의 Request Body 파라미터 이름과 일치해야 함
        formData.append("image", {
            uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
            name: filename,
            type: type,
        } as any);

        const response = await axiosInstance.post<ApiResponse<ImageUploadResponse>>(
            `${IMAGE_UPLOAD_URL}/${purpose.toUpperCase()}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                // Axios에서 multipart 전송 시 transformRequest 설정을 건드리지 않도록 함
                transformRequest: (data) => data,
            },
        );
        return response.data;
    },
};
