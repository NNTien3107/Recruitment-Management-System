import { apiClient } from './apiClient';
import { CandidateProfile } from './candidateApi';
import { CvItem } from './cvApi';

export type ApplicationStatus =
  | 'APPLIED'
  | 'REVIEWING'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface StatusHistoryItem {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedById: string;
  note?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface ApplicationItem {
  id: string;
  candidateId: string;
  jobId: string;
  cvId: string;
  coverLetter?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    status: string;
    deadline?: string | null;
  };
  candidate?: {
    id: string;
    email: string;
    fullName: string;
    candidateProfile?: CandidateProfile | null;
  };
  cv?: CvItem;
  statusHistory?: StatusHistoryItem[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryApplicationsParams {
  page?: number;
  pageSize?: number;
  status?: ApplicationStatus;
  keyword?: string;
}

export const applicationApi = {
  // Candidate
  async applyJob(dto: { jobId: string; cvId: string; coverLetter?: string }): Promise<ApplicationItem> {
    const res = await apiClient.post('/applications', dto);
    return res.data.data;
  },

  async getMyApplications(params?: QueryApplicationsParams): Promise<PaginatedResult<ApplicationItem>> {
    const res = await apiClient.get('/applications/my-history', { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  async getMyApplicationDetail(id: string): Promise<ApplicationItem> {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data.data;
  },

  // Recruiter
  async getJobApplications(
    jobId: string,
    params?: QueryApplicationsParams,
  ): Promise<PaginatedResult<ApplicationItem>> {
    const res = await apiClient.get(`/recruiter/jobs/${jobId}/applications`, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  async getRecruiterApplicationDetail(id: string): Promise<ApplicationItem> {
    const res = await apiClient.get(`/recruiter/applications/${id}`);
    return res.data.data;
  },

  async updateStatus(
    id: string,
    dto: { status: ApplicationStatus; note?: string },
  ): Promise<ApplicationItem> {
    const res = await apiClient.patch(`/recruiter/applications/${id}/status`, dto);
    return res.data.data;
  },

  getApplicantCvDownloadUrl(applicationId: string): string {
    return `/api/recruiter/applications/${applicationId}/cv`;
  },
};

