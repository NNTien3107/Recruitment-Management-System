const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '/api';

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
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string | string[];
    statusCode?: number;
  } | null;

  if (!response.ok || (json && json.success === false)) {
    const rawMsg = json?.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : rawMsg || `Lỗi kết nối máy chủ (${response.status})`;
    throw new ApiError(message, json?.statusCode ?? response.status);
  }

  return json as T;
}
