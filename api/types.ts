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
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface Course {
    courseId: number;
    courseName: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // HH:mm:ss
    endTime: string;   // HH:mm:ss
    roomName: string;
    buildingName: string;
    buildingCode: string;
    color?: string;
}

export interface TimetableSummary {
    timetableId: number;
    name: string;
    isPrimary: boolean;
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
export type ItemStatus = "REPORTED" | "RESOLVED"; // Swagger mentions REPORTED

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
}

export interface ItemListResponse {
    total: number;
    page: number;
    item_posts: ItemPost[];
}

export interface ItemDetail extends ItemPost {
}

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
    // Swagger example doesn't show category/color, but List/Detail do.
    // Adding them as they are likely needed.
    category: string;
    color: string;
}

export interface CreateItemResponse {
    itemId: number;
    message: string;
    item_status: string;
}
