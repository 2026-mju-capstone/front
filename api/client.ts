import axios from 'axios';
import {BASE_URL} from '@/constants/url';
import {useAuthStore} from '@/store/authStore';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Authorization token
axiosInstance.interceptors.request.use(
    async (config) => {
        // 스토어에서 직접 토큰을 가져오거나 상태가 없으면 스토어의 현재 값을 참조
        const token = useAuthStore.getState().token;

        if (__DEV__) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle token updates or errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (__DEV__) {
            console.error(
                `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
                error.response?.status,
                error.response?.data,
            );
        }
        if (error.response?.status === 401) {
            // 401 발생 시 스토어 초기화 (자동 로그아웃 유도)
            useAuthStore.getState().clearToken();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
