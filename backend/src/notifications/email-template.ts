import { NotificationEvent } from './notification-events';

export function renderEmail(fullName: string, event: NotificationEvent) {
  const greeting = `Chào ${fullName},`;
  if (event.type === 'APPLICATION_STATUS_CHANGED') {
    const { jobTitle, previousStatus, status } = event.payload;
    return {
      subject: 'Cập nhật trạng thái hồ sơ ứng tuyển',
      text: `${greeting}\n\nHồ sơ ứng tuyển vị trí ${jobTitle} đã chuyển từ ${previousStatus} sang ${status}.`,
    };
  }

  const subjects = {
    INTERVIEW_SCHEDULED: 'Lịch phỏng vấn mới',
    INTERVIEW_RESCHEDULED: 'Lịch phỏng vấn đã thay đổi',
    INTERVIEW_CANCELLED: 'Lịch phỏng vấn đã hủy',
  };
  const { jobTitle, scheduledAt, location } = event.payload;
  const time = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(scheduledAt));
  const subject = subjects[event.type];
  return {
    subject,
    text: `${greeting}\n\n${subject} cho vị trí ${jobTitle}.\nThời gian: ${time} (UTC)\nĐịa điểm hoặc liên kết: ${location}`,
  };
}
