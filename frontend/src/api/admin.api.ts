import type { ApiResponse, JobItem, JobStatus, PaginatedResponse, Role } from '../types/models';
import { apiRequest, buildQueryString } from './client';

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

export interface QueryAdminUsersParams {
  page?: number;
  pageSize?: number;
  role?: Role | '';
  isLocked?: 'true' | 'false' | '';
  keyword?: string;
}

export interface QueryAdminJobsParams {
  page?: number;
  pageSize?: number;
  status?: JobStatus | '';
  companyId?: string;
  keyword?: string;
}

/**
 * Danh sách người dùng dành cho Admin quản lý (UC21, FR-31)
 * Kết nối: GET /api/admin/users
 */
export async function fetchAdminUsers(
  params: QueryAdminUsersParams = {},
): Promise<PaginatedResponse<AdminUserItem>> {
  const queryString = buildQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    role: params.role || undefined,
    isLocked: params.isLocked || undefined,
    keyword: params.keyword,
  });

  return apiRequest<PaginatedResponse<AdminUserItem>>(`/admin/users${queryString}`);
}

/**
 * Xem chi tiết người dùng dành cho Admin (UC21, FR-31)
 * Kết nối: GET /api/admin/users/:id
 */
export async function fetchAdminUserById(id: string): Promise<AdminUserItem> {
  const res = await apiRequest<ApiResponse<AdminUserItem>>(
    `/admin/users/${encodeURIComponent(id)}`,
  );
  return res.data;
}

/**
 * Khóa tài khoản người dùng và thu hồi toàn bộ refresh token (UC22, FR-32, BR-06)
 * Kết nối: PATCH /api/admin/users/:id/lock
 */
export async function lockAdminUser(id: string): Promise<AdminUserItem> {
  const res = await apiRequest<ApiResponse<AdminUserItem>>(
    `/admin/users/${encodeURIComponent(id)}/lock`,
    {
      method: 'PATCH',
    },
  );
  return res.data;
}

/**
 * Mở khóa tài khoản người dùng (UC22, FR-32)
 * Kết nối: PATCH /api/admin/users/:id/unlock
 */
export async function unlockAdminUser(id: string): Promise<AdminUserItem> {
  const res = await apiRequest<ApiResponse<AdminUserItem>>(
    `/admin/users/${encodeURIComponent(id)}/unlock`,
    {
      method: 'PATCH',
    },
  );
  return res.data;
}

/**
 * Danh sách tin tuyển dụng dành cho Admin kiểm duyệt (UC23, FR-33)
 * Kết nối: GET /api/admin/jobs
 */
export async function fetchAdminJobs(
  params: QueryAdminJobsParams = {},
): Promise<PaginatedResponse<JobItem>> {
  const queryString = buildQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    status: params.status || undefined,
    companyId: params.companyId,
    keyword: params.keyword,
  });

  return apiRequest<PaginatedResponse<JobItem>>(`/admin/jobs${queryString}`);
}

/**
 * Xem chi tiết tin tuyển dụng dành cho Admin thẩm định (UC23)
 * Kết nối: GET /api/admin/jobs/:id
 */
export async function fetchAdminJobById(id: string): Promise<JobItem> {
  const res = await apiRequest<ApiResponse<JobItem>>(`/admin/jobs/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Duyệt tin tuyển dụng đang ở trạng thái PENDING (UC23, FR-33)
 * Kết nối: PATCH /api/admin/jobs/:id/approve
 */
export async function approveAdminJob(id: string): Promise<JobItem> {
  const res = await apiRequest<ApiResponse<JobItem>>(
    `/admin/jobs/${encodeURIComponent(id)}/approve`,
    {
      method: 'PATCH',
    },
  );
  return res.data;
}

/**
 * Từ chối tin tuyển dụng đang ở trạng thái PENDING kèm lý do (UC23, FR-33)
 * Kết nối: PATCH /api/admin/jobs/:id/reject
 */
export async function rejectAdminJob(id: string, reason: string): Promise<JobItem> {
  const res = await apiRequest<ApiResponse<JobItem>>(
    `/admin/jobs/${encodeURIComponent(id)}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
  );
  return res.data;
}
