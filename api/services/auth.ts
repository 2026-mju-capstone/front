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

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/api/auth/login",
      data,
    );
    return response.data;
  },

  signup: async (data: SignupRequest) => {
    const response = await axiosInstance.post<ApiResponse<SignupResponse>>(
      "/api/auth/signup",
      data,
    );
    return response.data;
  },

  logout: async () => {
    const response =
      await axiosInstance.post<ApiResponse<string>>("/api/auth/logout");
    return response.data;
  },

  checkNickname: async (nickname: string) => {
    const response = await axiosInstance.get<
      ApiResponse<CheckNicknameResponse>
    >("/api/auth/check-nickname", {
      params: { nickname },
    });
    return response.data;
  },

  sendCertification: async (data: CertificationRequest) => {
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/api/auth/certification",
      data,
    );
    return response.data;
  },

  verifyCode: async (data: VerifyRequest) => {
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/api/auth/verify",
      data,
    );
    return response.data;
  },

  validateToken: async () => {
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/api/auth/validate",
      {},
    );
    return response.data;
  },

  registerDeviceToken: async (data: DeviceTokenRequest) => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      "/api/auth/device-token",
      data,
    );
    return response.data;
  },
};
