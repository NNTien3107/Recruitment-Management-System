import { apiClient } from './apiClient';

export interface ExperienceItem {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface EducationItem {
  school: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
}

export interface CandidateProfile {
  id?: string | null;
  phone?: string | null;
  address?: string | null;
  title?: string | null;
  bio?: string | null;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  avatarUrl?: string | null;
}

export interface CandidateProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  profile: CandidateProfile;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  address?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
  avatarUrl?: string;
}

export const candidateApi = {
  async getProfile(): Promise<CandidateProfileResponse> {
    const res = await apiClient.get('/candidate/profile');
    return res.data.data;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<CandidateProfileResponse> {
    const res = await apiClient.put('/candidate/profile', dto);
    return res.data.data;
  },
};

