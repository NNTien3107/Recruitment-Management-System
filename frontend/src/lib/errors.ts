import axios from 'axios';

/** Chuyển mọi lỗi thành câu tiếng Việt hiển thị được cho người dùng. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được máy chủ';
    if (error.response.status === 429) {
      return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút';
    }
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại';
}
