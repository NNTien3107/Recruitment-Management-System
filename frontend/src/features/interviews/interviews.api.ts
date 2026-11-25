import { api } from '../../lib/api';
import type { ApiResponse } from '../../lib/types';

export type ApplicationStatus =
  | 'APPLIED'
  | 'REVIEWING'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface InterviewApplication {
  id: string;
  status: ApplicationStatus;
  candidate: { fullName: string; email: string };
}

export interface Interview {
  id: string;
  scheduledAt: string;
  location: string;
  cancelledAt: string | null;
}

export interface ScheduleInterviewInput {
  scheduledAt: string;
  location: string;
}

export async function fetchInterviewJobs(page: number, signal: AbortSignal) {
  const { data } = await api.get<ApiResponse<{ id: string; title: string }[]>>(
    '/recruiter/interviews/jobs',
    {
      params: { page, pageSize: 20 },
      signal,
    },
  );
  return data;
}

export async function fetchInterviewApplications(jobId: string, page: number, signal: AbortSignal) {
  const { data } = await api.get<ApiResponse<InterviewApplication[]>>(
    `/recruiter/jobs/${encodeURIComponent(jobId)}/applications`,
    { params: { page, pageSize: 20 }, signal },
  );
  return data;
}

const interviewPath = (applicationId: string) =>
  `/recruiter/applications/${encodeURIComponent(applicationId)}/interviews`;

export async function fetchInterviews(applicationId: string, signal: AbortSignal) {
  const { data } = await api.get<ApiResponse<Interview[]>>(interviewPath(applicationId), {
    signal,
  });
  return data.data;
}

export async function saveInterview(
  applicationId: string,
  interviewId: string | undefined,
  input: ScheduleInterviewInput,
) {
  const path = interviewPath(applicationId);
  const response = interviewId
    ? await api.patch<ApiResponse<Interview>>(`${path}/${encodeURIComponent(interviewId)}`, input)
    : await api.post<ApiResponse<Interview>>(path, input);
  return response.data.data;
}

export async function cancelInterview(applicationId: string, interviewId: string) {
  const { data } = await api.delete<ApiResponse<Interview>>(
    `${interviewPath(applicationId)}/${encodeURIComponent(interviewId)}`,
  );
  return data.data;
}
