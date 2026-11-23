import { api } from '../../lib/api';
import type { ApiResponse } from '../../lib/types';
import type { AuthUser } from './types';

export async function loginRequest(payload: { email: string; password: string }) {
  const res = await api.post<ApiResponse<{ accessToken: string; user: AuthUser }>>(
    '/auth/login',
    payload,
  );
  return res.data.data;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}

export async function fetchMe() {
  const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
  return res.data.data;
}
