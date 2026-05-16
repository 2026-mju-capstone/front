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

// User Profile Types
export interface UserProfile {
  nickname: string;
  department: string;
  postCount: number;
  chatRoomCount: number;
  unreadCount: number;
}

export interface UpdateProfileRequest {
  nickname: string;
  department: string;
}

// --- Pagination ---
export interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

export interface PageResponse<T> {
  totalElements: number;
  totalPages: number;
  size: number;
  content: T[];
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

// --- Timetable & Course ---
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface CourseSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
}

export interface Course {
  courseId: number;
  courseName: string;
  roomName: string;
  buildingName: string;
  buildingCode: string;
  color?: string;
  schedules: CourseSchedule[];
}

export interface TimetableSummary {
  timetableId: number;
  name: string;
  isPrimary: boolean;
  year: number;
  semester: number;
}

export interface SyncCourseRequest {
  courseId: number;
  color: string;
}

export interface SyncTimetableRequest {
  courses: SyncCourseRequest[];
}

export interface CreateTimetableRequest {
  name: string;
  year: number;
  semester: number;
}

// Image Types
export type ImagePurpose = "ITEM";

export interface ImageUploadResponse {
  image_url: string;
  original_filename: string;
}

// Lost Item Types
export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "REPORTED" | "RESOLVED";

export interface ItemPost {
  id: number;
  title: string;
  description: string;
  type: ItemType;
  status: string;
  category: string;
  image_url: string;
  building_id: number;
  data_address: string;
  created_at: string;
  reporter_id?: number; // 백엔드 추가 예정
}

export interface ItemListResponse {
  total: number;
  page: number;
  item_posts: ItemPost[];
}

export interface ItemDetail extends ItemPost {}

export interface ItemFilter {
  status?: string;
  category?: string;
  color?: string;
}

export interface CreateItemRequest {
  type: ItemType;
  title: string;
  description: string;
  image_url: string;
  building_id: number;
  detail_address: string;
  reported_at: string;
  category: string;
  color: string;
}

export interface CreateItemResponse {
  itemId: number;
  message: string;
  item_status: string;
}

// QR 스캔 시 물품 소유자 정보
export interface ItemOwnerInfoResult {
  nickname: string;
  department: string;
}

// Chat Types
export type ChatRoomStatus =
  | "OPEN"
  | "RESOLVED_RETURNED"
  | "RESOLVED_ABANDONED";

export interface ChatRoomRecord {
  status: ChatRoomStatus;
  room_id: number;
  owner_nickname: string;
  finder_nickname: string;
  item_name: string;
  item_id?: number; // 백엔드 추가 예정 (채팅방에서 게시글 상세로 이동 시 필요)
}

export interface MessageRecord {
  message: string;
  sender_id: number;
  sender_nickname: string;
  sent_at: string;
  read_at: string | null;
}

export interface ListMessagesResult {
  messages: MessageRecord[];
  chat_room: ChatRoomRecord;
}

export interface CreateChatRoomRequest {
  item_id: number;
  counterpart_id: number;
}

export interface CreateChatRoomResult {
  created: boolean;
  room_data: ChatRoomRecord;
}

export interface ListChatRoomResult {
  chatRoomIds: number[];
}

export interface FindChatRoomResult {
  exists: boolean;
  room_id: number;
}

export interface CloseChatRoomRequest {
  reason: "RETURNED" | "ABANDONED";
}

export interface MessageFilter {
  start_time?: string;
  end_time?: string;
}

// Matching Types
export type MatchStatus = "CANDIDATE" | "NOTIFIED" | "CONFIRMED" | "REJECTED";

export interface ItemMatchResultResponse {
  score: number;
  status: MatchStatus;
  match_id: string;
  found_item_id: number;
  found_post_id: number;
  found_post_title: string;
  found_image_url: string;
  locationName: string;
  found_nickname: string;
  found_department: string;
  finder_id?: number; // 백엔드 추가 예정 (시나리오 ⑤ 직접 전달 시 필요)
}

export interface MatchManualRequest {
  lost_item_id: number;
  found_item_id: number;
}

export type MatchManualType = "LOCKER" | "CHAT";

export interface MatchManualResponse {
  match_id: number;
  match_manual_type: MatchManualType;
  locker_id: number;
}


export type CctvReviewStatus = "CONFIRMED_SELF" | "REJECTED_SELF";

export interface CctvMatchedLostItem {
    lost_item_id: number;
    title: string;
    category: string;
    match_count: number;
    reported_at: string;
    image_url: string | null;
}

export interface CctvMyItemsResponse {
    matched_lost_items: CctvMatchedLostItem[];
}

export interface CctvDetection {
    detection_id: number;
    score: number;
    detected_at: string;
    building_name: string;
    room_name: string;
    item_snapshot_url: string | null;
    moment_snapshot_url: string | null;
}

export interface CctvItemDetectionsResponse {
    detections: CctvDetection[];
}

export interface CctvReviewRequest {
    review_status: CctvReviewStatus;
}