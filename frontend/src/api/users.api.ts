import type { ApiResponse, PaginatedResponse, Role } from '../types/models';
import { apiRequest, buildQueryString } from './client';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lấy danh sách tài khoản Recruiter phục vụ thanh chọn nhanh khi test chưa ghép AuthContext
 * Kết nối: GET /api/users?role=RECRUITER
 */
export async function fetchRecruiterAccounts(): Promise<UserSummary[]> {
  const queryString = buildQueryString({
    role: 'RECRUITER',
    page: 1,
    pageSize: 50,
  });
  const res = await apiRequest<PaginatedResponse<UserSummary>>(`/users${queryString}`);
  return res.data;
}

/**
 * Tạo nhanh một tài khoản Recruiter mới (chưa có công ty) để kiểm thử luồng Tạo công ty mới (UC13.2)
 * Kết nối: POST /api/users
 */
export async function createQuickRecruiterAccount(fullName: string): Promise<UserSummary> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const res = await apiRequest<ApiResponse<UserSummary>>('/users', {
    method: 'POST',
    body: JSON.stringify({
      email: `recruiter.${Date.now()}.${randomSuffix}@rms-dev.local`,
      password: 'Password123!',
      fullName: fullName.trim() || `Nhà tuyển dụng #${randomSuffix}`,
      role: 'RECRUITER',
    }),
  });
  return res.data;
}
