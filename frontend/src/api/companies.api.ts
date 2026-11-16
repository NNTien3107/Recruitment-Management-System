import type { ApiResponse, CompanyDetail, PaginatedResponse } from '../types/models';
import { apiRequest, buildQueryString } from './client';

export interface QueryCompaniesParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industry?: string;
  size?: string;
}

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
