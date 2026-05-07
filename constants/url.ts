export const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ?? "https://lalaalal.com";
export const LOGIN_URL = BASE_URL + "/api/auth/login";
export const CERTIFICATION_URL = BASE_URL + "/api/auth/certification";
export const VERIFY_URL = BASE_URL + "/api/auth/verify";
export const SIGNUP_URL = BASE_URL + "/api/auth/signup";
export const ITEMS_LIST_URL = BASE_URL + "/api/items/post/list";
export const ITEMS_CREATE_URL = BASE_URL + "/api/items/post/create";
export const ITEMS_DETAIL_URL = BASE_URL + "/api/items/post/list";
export const CHAT_ROOMS_URL = BASE_URL + "/api/chat-rooms/";
export const CHAT_ROOM_URL = BASE_URL + "/api/chat-rooms";
export const CHAT_ROOM_FIND_URL = BASE_URL + "/api/chat-rooms/find";
export const CHAT_ROOM_CREATE_URL = BASE_URL + "/api/chat-rooms/create";
export const IMAGE_UPLOAD_URL = BASE_URL + "/api/images/upload/item";
export const NOTIFICATIONS_URL = BASE_URL + "/api/notifications";
export const VALIDATION_URL = BASE_URL + "/api/auth/validate";
export const REGISTER_URL = BASE_URL + "/api/auth/device-token";
