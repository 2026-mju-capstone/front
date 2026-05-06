import axios from 'axios';
import { BASE_URL } from '@/constants/url';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`[Auth Token] ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token updates or errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
