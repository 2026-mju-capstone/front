export const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ?? "https://lalaalal.com";
export const REGISTER_URL: string = BASE_URL + "/api/auth/device-token";
export const LOGIN_URL: string = BASE_URL + "/api/auth/login";
export const CERTIFICATION_URL: string = BASE_URL + "/api/auth/certification";
export const VERIFY_URL: string = BASE_URL + "/api/auth/verify";
export const SIGNUP_URL: string = BASE_URL + "/api/auth/signup";
export const VALIDATION_URL: string = BASE_URL + "/api/auth/validate";
export const ITEMS_URL: string = BASE_URL + "/api/items";
