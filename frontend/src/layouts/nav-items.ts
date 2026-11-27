import type { Role } from '../features/auth/types';

export interface NavItem {
  to: string;
  label: string;
}

/** Mỗi người thêm menu của module mình vào đây. */
export const navItemsByRole: Record<Role, NavItem[]> = {
  CANDIDATE: [
    { to: '/jobs', label: 'Tìm việc làm' },
    { to: '/candidate', label: 'Hồ sơ ứng viên' },
    { to: '/candidate/notifications', label: 'Thông báo' },
  ],
  RECRUITER: [
    { to: '/jobs', label: 'Việc làm công khai' },
    { to: '/recruiter/jobs', label: 'Quản lý tin đăng' },
    { to: '/recruiter/company', label: 'Hồ sơ công ty' },
  ],
  ADMIN: [
    { to: '/admin/jobs', label: 'Duyệt tin tuyển dụng' },
    { to: '/admin/users', label: 'Quản lý người dùng' },
  ],
};
