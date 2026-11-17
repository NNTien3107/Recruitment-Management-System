import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động đính kèm User ID và Token vào request header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rms_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Header hỗ trợ dev/testing khi chưa có JWT Auth từ Tiến
  const mockRole = localStorage.getItem('rms_user_role') || 'CANDIDATE';
  const defaultUserId =
    mockRole === 'RECRUITER'
      ? '00000000-0000-0000-0000-000000000002'
      : '00000000-0000-0000-0000-000000000001';
  const mockUserId = localStorage.getItem('rms_user_id') || defaultUserId;

  if (!config.headers['x-user-id']) {
    config.headers['x-user-id'] = mockUserId;
  }
  if (!config.headers['x-user-role']) {
    config.headers['x-user-role'] = mockRole;
  }

  return config;
});

// Interceptor xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => {
    // Trả về dữ liệu đã unwrap từ ResponseInterceptor của NestJS: { success: true, data, meta }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Đã xảy ra lỗi khi gọi máy chủ';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

