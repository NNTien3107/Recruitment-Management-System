import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// Access token chỉ nằm trong bộ nhớ, không dùng localStorage
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// AuthProvider đăng ký hàm này để biết khi nào phiên đăng nhập hết hiệu lực
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

/** Instance dùng chung cho mọi module: tự gắn token, tự refresh khi gặp 401. */
export const api = axios.create({ baseURL, withCredentials: true });

// Instance riêng, KHÔNG có interceptor, để gọi refresh không bị lặp vô hạn
const refreshClient = axios.create({ baseURL, withCredentials: true });

let refreshPromise: Promise<string> | null = null;

/** Chỉ một lần refresh tại một thời điểm; mọi nơi gọi cùng chờ chung kết quả. */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= refreshClient
    .post<ApiResponse<{ accessToken: string }>>('/auth/refresh')
    .then((res) => {
      accessToken = res.data.data.accessToken;
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

const NO_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }
    const original = error.config as RetryableConfig;
    const skip = NO_REFRESH_URLS.some((url) => original.url?.includes(url));

    if (error.response?.status === 401 && !original._retried && !skip) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return await api(original); // gửi lại request ban đầu với token mới
      } catch (refreshError) {
        // Chỉ coi là hết phiên khi chính lần refresh thất bại
        if (
          axios.isAxiosError(refreshError) &&
          refreshError.config?.url?.includes('/auth/refresh')
        ) {
          accessToken = null;
          onSessionExpired?.();
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
