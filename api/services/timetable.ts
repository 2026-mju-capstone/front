import axiosInstance from "../client";
import {
    ApiResponse,
    Course,
    CreateTimetableRequest,
    PageResponse,
    SyncTimetableRequest,
    TimetableSummary
} from "../types";
import {COURSES_URL, TIMETABLES_URL} from "@/constants/url";

export const timetableService = {

    searchCourses: async (year: number, semester: number, keyword: string, page: number = 0, size: number = 20) => {
        const response = await axiosInstance.get<ApiResponse<PageResponse<Course>>>(COURSES_URL, {
            params: {
                year,
                semester,
                keyword,
                page,
                size,
                sort: 'courseName,asc'
            }
        });
        return response.data.data;
    },

    getPrimaryTimetable: async () => {
        const response = await axiosInstance.get<ApiResponse<TimetableSummary>>(`${TIMETABLES_URL}/primary`);
        return response.data.data;
    },

    getAllTimetables: async () => {
        const response = await axiosInstance.get<ApiResponse<TimetableSummary[]>>(`${TIMETABLES_URL}/mine`);
        return response.data.data;
    },

    createTimetable: async (data: CreateTimetableRequest) => {
        const response = await axiosInstance.post<ApiResponse<TimetableSummary>>(TIMETABLES_URL, data);
        return response.data.data;
    },

    getTimetableDetail: async (id: number) => {
        const response = await axiosInstance.get<ApiResponse<Course[]>>(`${TIMETABLES_URL}/${id}`);
        return response.data.data;
    },

    syncTimetable: async (id: number, data: SyncTimetableRequest) => {
        const response = await axiosInstance.post<ApiResponse<string>>(`${TIMETABLES_URL}/${id}/sync`, data);
        return response.data.data;
    },

    deleteTimetable: async (id: number) => {
        const response = await axiosInstance.delete<ApiResponse<string>>(`${TIMETABLES_URL}/${id}`);
        return response.data.data;
    },
};
