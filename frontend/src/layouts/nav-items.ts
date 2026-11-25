import type { Role } from '../features/auth/types';

export interface NavItem {
  to: string;
  label: string;
}

/** Mỗi người thêm menu của module mình vào đây. */
export const navItemsByRole: Record<Role, NavItem[]> = {
  CANDIDATE: [{ to: '/candidate', label: 'Ứng viên' }],
  RECRUITER: [
    { to: '/recruiter', label: 'Nhà tuyển dụng' },
    { to: '/recruiter/interviews', label: 'Lịch phỏng vấn' },
  ],
  ADMIN: [{ to: '/admin', label: 'Quản trị' }],
};
