import { useMutation } from "@tanstack/react-query";
import { authService } from "@/api/services/auth";
import {
  LoginRequest,
  SignupRequest,
  CertificationRequest,
  VerifyRequest,
  DeviceTokenRequest,
} from "@/api/types";

export const useLogin = () => {
    return useMutation({
        mutationFn: (data: LoginRequest) => authService.login(data),
    });
};

export const useSignup = () => {
    return useMutation({
        mutationFn: (data: SignupRequest) => authService.signup(data),
    });
};

export const useLogout = () => {
    return useMutation({
        mutationFn: () => authService.logout(),
    });
};

export const useSendCertification = () => {
    return useMutation({
        mutationFn: (data: CertificationRequest) => authService.sendCertification(data),
    });
};

export const useVerifyCode = () => {
    return useMutation({
        mutationFn: (data: VerifyRequest) => authService.verifyCode(data),
    });
};

export const useRegisterDeviceToken = () => {
    return useMutation({
        mutationFn: (data: DeviceTokenRequest) => authService.registerDeviceToken(data),
    });
};
