import type { JobLevel, JobSort, JobStatus, JobType } from '../types/models';

export const LOCATION_OPTIONS = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Remote',
] as const;

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  INTERNSHIP: 'Thực tập',
  CONTRACT: 'Hợp đồng',
  REMOTE: 'Làm việc từ xa',
};

export const JOB_LEVEL_LABELS: Record<JobLevel, string> = {
  INTERN: 'Intern',
  FRESHER: 'Fresher',
  JUNIOR: 'Junior',
  MIDDLE: 'Middle',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  MANAGER: 'Manager',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đang tuyển',
  REJECTED: 'Bị từ chối',
  CLOSED: 'Đã đóng',
};

export const JOB_SORT_LABELS: Record<JobSort, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  salary_desc: 'Lương cao đến thấp',
  salary_asc: 'Lương thấp đến cao',
};

export function formatSalary(salaryMin?: number | null, salaryMax?: number | null): string {
  const toMillion = (val: number) => {
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)} triệu`;
    }
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  if (salaryMin != null && salaryMax != null) {
    return `${toMillion(salaryMin)} - ${toMillion(salaryMax)} VNĐ`;
  }
  if (salaryMin != null) {
    return `Từ ${toMillion(salaryMin)} VNĐ`;
  }
  if (salaryMax != null) {
    return `Tối đa ${toMillion(salaryMax)} VNĐ`;
  }
  return 'Thỏa thuận';
}

export function formatDate(iso?: string | null): string {
  if (!iso) return 'Không giới hạn';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
