// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Auth Types
export interface LoginRequest {
  schoolEmail: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  nickname: string;
  department: string;
  grade: string;
  message?: string;
}

export interface SignupRequest {
  schoolEmail: string;
  password?: string;
  nickname?: string;
  department?: string;
  grade?: string;
}

export interface SignupResponse {
  message: string;
  user_id: number;
  access_token: string;
}

export interface CertificationRequest {
  email: string;
}

export interface VerifyRequest {
  email: string;
  certificationNumber: string;
}

export interface CheckNicknameResponse {
  message: string;
  available: boolean;
}

export interface DeviceTokenRequest {
  token: string;
}
