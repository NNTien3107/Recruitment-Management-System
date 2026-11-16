export type Role = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export type JobStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'REMOTE';

export type JobLevel = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD' | 'MANAGER';

export type JobSort = 'newest' | 'oldest' | 'salary_desc' | 'salary_asc';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface CompanySummary {
  id: string;
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
  description?: string | null;
}

export interface CompanyDetail extends CompanySummary {
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    fullName: string;
  };
  jobs?: JobItem[];
  _count?: {
    jobs: number;
  };
}

export interface JobItem {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  location: string;
  skills: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  jobType: JobType;
  level: JobLevel;
  status: JobStatus;
  rejectReason?: string | null;
  deadline?: string | null;
  approvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: CompanySummary & {
    owner?: {
      id: string;
      email: string;
      fullName: string;
    };
  };
}

export interface QueryJobsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  skills?: string;
  location?: string;
  jobType?: JobType | '';
  level?: JobLevel | '';
  companyId?: string;
  salaryMin?: number | '';
  salaryMax?: number | '';
  sort?: JobSort;
}
