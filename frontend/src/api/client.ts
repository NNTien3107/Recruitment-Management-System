import axios from 'axios';
import { api } from '../lib/api';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function buildQueryString(
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const method = (options.method ?? 'GET').toUpperCase();
  const data: unknown =
    typeof options.body === 'string' && options.body.length > 0
      ? (JSON.parse(options.body) as unknown)
      : options.body;

  try {
    const response = await api.request<T>({
      url: normalizedPath,
      method,
      data,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const body = error.response?.data as
        { message?: string | string[]; statusCode?: number } | undefined;
      const rawMsg = body?.message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || error.message || `Lỗi kết nối máy chủ (${status})`;
      throw new ApiError(message, body?.statusCode ?? status);
    }
    throw error;
  }
}
