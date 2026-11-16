import type {
  ApiResponse,
  JobItem,
  JobLevel,
  JobStatus,
  JobType,
  PaginatedResponse,
  QueryJobsParams,
} from '../types/models';
import { apiRequest, buildQueryString } from './client';

export interface QueryRecruiterJobsParams {
  recruiterId: string;
  page?: number;
  pageSize?: number;
  status?: JobStatus | '';
  keyword?: string;
}

export interface CreateJobPayload {
  recruiterId: string;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  location: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  jobType: JobType;
  level: JobLevel;
  status?: JobStatus;
  deadline?: string;
}

export type UpdateJobPayload = Omit<Partial<CreateJobPayload>, 'recruiterId'>;

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

/**
 * Danh sách tin tuyển dụng của công ty thuộc Recruiter hiện tại (UC14)
 * Kết nối: GET /api/jobs/my-jobs?recruiterId=...
 */
export async function fetchRecruiterJobs(
  params: QueryRecruiterJobsParams,
): Promise<PaginatedResponse<JobItem>> {
  const queryString = buildQueryString({
    recruiterId: params.recruiterId,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    status: params.status || undefined,
    keyword: params.keyword,
  });

  return apiRequest<PaginatedResponse<JobItem>>(`/jobs/my-jobs${queryString}`);
}

/**
 * Tạo tin tuyển dụng mới (UC14, FR-22, BR-04)
 * Kết nối: POST /api/jobs
 */
export async function createJob(payload: CreateJobPayload): Promise<JobItem> {
  const res = await apiRequest<ApiResponse<JobItem>>('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Cập nhật tin tuyển dụng của Recruiter (UC14, FR-23, BR-08)
 * Kết nối: PATCH /api/jobs/:id?recruiterId=...
 */
export async function updateJob(
  id: string,
  recruiterId: string,
  payload: UpdateJobPayload,
): Promise<JobItem> {
  const queryString = buildQueryString({ recruiterId });
  const res = await apiRequest<ApiResponse<JobItem>>(
    `/jobs/${encodeURIComponent(id)}${queryString}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

/**
 * Đóng tin tuyển dụng - ngừng nhận hồ sơ (UC15, FR-24)
 * Kết nối: PATCH /api/jobs/:id/close?recruiterId=...
 */
export async function closeJob(id: string, recruiterId: string): Promise<JobItem> {
  const queryString = buildQueryString({ recruiterId });
  const res = await apiRequest<ApiResponse<JobItem>>(
    `/jobs/${encodeURIComponent(id)}/close${queryString}`,
    {
      method: 'PATCH',
    },
  );
  return res.data;
}

/**
 * Xóa mềm tin tuyển dụng (UC14, FR-23, BR-05)
 * Kết nối: DELETE /api/jobs/:id?recruiterId=...
 */
export async function deleteJob(id: string, recruiterId: string): Promise<JobItem> {
  const queryString = buildQueryString({ recruiterId });
  const res = await apiRequest<ApiResponse<JobItem>>(
    `/jobs/${encodeURIComponent(id)}${queryString}`,
    {
      method: 'DELETE',
    },
  );
  return res.data;
}
