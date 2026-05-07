import axiosInstance from "../client";
import {
    ApiResponse,
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    CertificationRequest,
    VerifyRequest,
    DeviceTokenRequest,
    CheckNicknameResponse,
} from "../types";
import {
    CERTIFICATION_URL,
    CHECK_NICKNAME_URL,
    LOGIN_URL,
    LOGOUT_URL,
    REGISTER_URL,
    SIGNUP_URL,
    VALIDATION_URL,
    VERIFY_URL,
} from "@/constants/url";

export const authService = {
    login: async (data: LoginRequest) => {
        const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
            LOGIN_URL,
            data,
        );
        return response.data;
    },

    signup: async (data: SignupRequest) => {
        const response = await axiosInstance.post<ApiResponse<SignupResponse>>(
            SIGNUP_URL,
            data,
        );
        return response.data;
    },

    logout: async () => {
        const response = await axiosInstance.post<ApiResponse<string>>(LOGOUT_URL);
        return response.data;
    },

    checkNickname: async (nickname: string) => {
        const response = await axiosInstance.get<ApiResponse<CheckNicknameResponse>>(
            CHECK_NICKNAME_URL,
            {
                params: {nickname},
            },
        );
        return response.data;
    },

    sendCertification: async (data: CertificationRequest) => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            CERTIFICATION_URL,
            data,
        );
        return response.data;
    },

    verifyCode: async (data: VerifyRequest) => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            VERIFY_URL,
            data,
        );
        return response.data;
    },

    validateToken: async () => {
        const response = await axiosInstance.post<ApiResponse<string>>(
            VALIDATION_URL,
            {},
        );
        return response.data;
    },

    registerDeviceToken: async (data: DeviceTokenRequest) => {
        const response = await axiosInstance.post<ApiResponse<void>>(
            REGISTER_URL,
            data,
        );
        return response.data;
    },
};
