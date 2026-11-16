const STORAGE_KEY = 'rms_dev_recruiter_owner_id';
const EVENT_NAME = 'rms:recruiter-owner-changed';

/**
 * TODO: Lấy user.id từ AuthContext sau khi ghép Auth của Tiến.
 * Hiện tại lưu vào localStorage để thuận tiện chuyển đổi giữa các màn hình Recruiter (/recruiter/company, /recruiter/jobs).
 */
export function getStoredRecruiterId(): string {
  return window.localStorage.getItem(STORAGE_KEY) || '';
}

export function setStoredRecruiterId(ownerId: string): void {
  const trimmed = ownerId.trim();
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: trimmed }));
}

export function subscribeRecruiterIdChange(callback: (ownerId: string) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<string>;
    callback(customEvent.detail ?? getStoredRecruiterId());
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
