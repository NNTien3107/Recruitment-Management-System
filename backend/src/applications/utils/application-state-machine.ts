import { ApplicationStatus } from '@prisma/client';

/**
 * Bảng ánh xạ các bước chuyển trạng thái ứng tuyển hợp lệ trong hệ thống.
 * Đảm bảo quy trình tuyển dụng diễn ra theo thứ tự logic, không cho phép nhảy cóc bất hợp lệ.
 */
export const VALID_APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  // Trạng thái mới nộp: Recruiter có thể bắt đầu xem xét, loại sớm hoặc ứng viên tự rút
  APPLIED: [
    ApplicationStatus.REVIEWING,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],

  // Đang xem xét hồ sơ: Có thể mời phỏng vấn, loại hoặc ứng viên tự rút
  REVIEWING: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],

  // Đã lên lịch phỏng vấn: Có thể chuyển sang gửi offer, xem xét lại (vòng 2) hoặc loại
  INTERVIEW_SCHEDULED: [
    ApplicationStatus.OFFERED,
    ApplicationStatus.REVIEWING,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],

  // Đã gửi Offer: Ứng viên chấp nhận hoặc từ chối
  OFFERED: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],

  // Các trạng thái kết thúc (Terminal States) - Không thể chuyển tiếp:
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/**
 * Kiểm tra xem việc chuyển từ trạng thái `from` sang `to` có hợp lệ hay không.
 *
 * @param from Trạng thái hiện tại
 * @param to Trạng thái đích muốn chuyển sang
 * @returns boolean (true nếu hợp lệ, false nếu không được phép)
 */
export function canTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from === to) {
    return false; // Không chuyển sang chính trạng thái hiện tại
  }

  const allowedTransitions = VALID_APPLICATION_TRANSITIONS[from];
  if (!allowedTransitions || allowedTransitions.length === 0) {
    return false; // Trạng thái kết thúc
  }

  return allowedTransitions.includes(to);
}

/**
 * Lấy danh sách các trạng thái tiếp theo hợp lệ từ trạng thái hiện tại.
 */
export function getAllowedTransitions(
  currentStatus: ApplicationStatus,
): readonly ApplicationStatus[] {
  return VALID_APPLICATION_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Kiểm tra xem một trạng thái có phải trạng thái cuối cùng (kết thúc) hay không.
 */
export function isTerminalStatus(status: ApplicationStatus): boolean {
  const allowed = VALID_APPLICATION_TRANSITIONS[status];
  return !allowed || allowed.length === 0;
}

