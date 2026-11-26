import type { ApiResponse, CompanyDetail, PaginatedResponse } from '../types/models';
import { ApiError, apiRequest, buildQueryString } from './client';

export interface QueryCompaniesParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industry?: string;
  size?: string;
}

export interface CreateCompanyPayload {
  ownerId?: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  address?: string;
  industry?: string;
  size?: string;
}

export type UpdateCompanyPayload = Omit<Partial<CreateCompanyPayload>, 'ownerId'>;

/**
 * Danh sách công ty công khai
 * Kết nối: GET /api/companies
 */
export async function fetchCompanies(
  params: QueryCompaniesParams = {},
): Promise<PaginatedResponse<CompanyDetail>> {
  const queryString = buildQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 12,
    keyword: params.keyword,
    industry: params.industry,
    size: params.size,
  });

  return apiRequest<PaginatedResponse<CompanyDetail>>(`/companies${queryString}`);
}

/**
 * Xem chi tiết thông tin công ty kèm danh sách việc làm đã duyệt (UC06, FR-20)
 * Kết nối: GET /api/companies/:id
 */
export async function fetchCompanyById(id: string): Promise<CompanyDetail> {
  const res = await apiRequest<ApiResponse<CompanyDetail>>(`/companies/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Lấy thông tin công ty của Recruiter hiện tại (UC13.1)
 * Kết nối: GET /api/companies/my-company
 * Trả về null nếu Recruiter chưa tạo công ty (404 Not Found).
 */
export async function fetchMyCompany(): Promise<CompanyDetail | null> {
  try {
    const res = await apiRequest<ApiResponse<CompanyDetail>>('/companies/my-company');
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Tạo hồ sơ công ty mới cho Recruiter (UC13.2, FR-21)
 * Kết nối: POST /api/companies
 */
export async function createCompany(payload: CreateCompanyPayload): Promise<CompanyDetail> {
  const res = await apiRequest<ApiResponse<CompanyDetail>>('/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Cập nhật thông tin công ty của Recruiter (UC13.3, FR-21)
 * Kết nối: PATCH /api/companies/:id
 */
export async function updateCompany(
  id: string,
  payload: UpdateCompanyPayload,
): Promise<CompanyDetail> {
  const res = await apiRequest<ApiResponse<CompanyDetail>>(`/companies/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}
