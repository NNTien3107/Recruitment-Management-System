import { api } from '../../lib/api';
import type { ApiResponse, PaginationMeta } from '../../lib/types';

type StatusChanged = {
  type: 'APPLICATION_STATUS_CHANGED';
  payload: { jobTitle: string; previousStatus: string; status: string };
};

type InterviewChanged = {
  type: 'INTERVIEW_SCHEDULED' | 'INTERVIEW_RESCHEDULED' | 'INTERVIEW_CANCELLED';
  payload: { jobTitle: string; scheduledAt: string; location: string };
};

export type CandidateNotification = (StatusChanged | InterviewChanged) & {
  id: string;
  createdAt: string;
};

export async function fetchMyNotifications(page: number, signal: AbortSignal) {
  const { data } = await api.get<ApiResponse<CandidateNotification[]> & { meta: PaginationMeta }>(
    '/candidate/notifications',
    { params: { page, pageSize: 20 }, signal },
  );
  return data;
}
