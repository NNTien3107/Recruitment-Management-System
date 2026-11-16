import type { ApiResponse, JobItem, PaginatedResponse, QueryJobsParams } from '../types/models';
import { apiRequest, buildQueryString } from './client';

/**
 * Tìm kiếm và lọc việc làm công khai (UC05, FR-17 -> FR-19)
 * Kết nối: GET /api/jobs
 */
export async function fetchPublicJobs(
  params: QueryJobsParams = {},
): Promise<PaginatedResponse<JobItem>> {
  const queryString = buildQueryString({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    keyword: params.keyword,
    skills: params.skills,
    location: params.location,
    jobType: params.jobType || undefined,
    level: params.level || undefined,
    companyId: params.companyId,
    salaryMin: params.salaryMin === '' ? undefined : params.salaryMin,
    salaryMax: params.salaryMax === '' ? undefined : params.salaryMax,
    sort: params.sort ?? 'newest',
  });

  return apiRequest<PaginatedResponse<JobItem>>(`/jobs${queryString}`);
}

/**
 * Xem chi tiết một việc làm công khai (UC06, FR-20)
 * Kết nối: GET /api/jobs/:id
 */
export async function fetchJobById(id: string): Promise<JobItem> {
  const res = await apiRequest<ApiResponse<JobItem>>(`/jobs/${encodeURIComponent(id)}`);
  return res.data;
}
